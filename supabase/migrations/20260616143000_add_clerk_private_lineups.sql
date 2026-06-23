ALTER TABLE public.lineups
ADD COLUMN IF NOT EXISTS owner_clerk_user_id TEXT,
ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS public_read BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS public_write BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS realtime_secret TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT;

CREATE TABLE IF NOT EXISTS public.lineup_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lineup_id UUID NOT NULL REFERENCES public.lineups(id) ON DELETE CASCADE,
  clerk_user_id TEXT,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (clerk_user_id IS NOT NULL OR email IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.lineup_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lineup_id UUID NOT NULL REFERENCES public.lineups(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
  requires_auth BOOLEAN NOT NULL DEFAULT true,
  enabled BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS lineup_members_lineup_clerk_user_unique
ON public.lineup_members(lineup_id, clerk_user_id)
WHERE clerk_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS lineup_members_lineup_email_unique
ON public.lineup_members(lineup_id, email)
WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lineup_members_lineup ON public.lineup_members(lineup_id);
CREATE INDEX IF NOT EXISTS idx_lineup_invites_lineup ON public.lineup_invites(lineup_id);

ALTER TABLE public.lineup_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lineup_invites ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lineup_members TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lineup_invites TO service_role;

DROP POLICY IF EXISTS "Public access lineups" ON public.lineups;
DROP POLICY IF EXISTS "Public access formations" ON public.formations;
DROP POLICY IF EXISTS "Public access formation_positions" ON public.formation_positions;
DROP POLICY IF EXISTS "Public access players" ON public.players;
DROP POLICY IF EXISTS "Public access lineup_slots" ON public.lineup_slots;

CREATE POLICY "Public read lineups"
ON public.lineups
FOR SELECT
TO anon, authenticated
USING (public_read = true OR public_write = true);

CREATE POLICY "Public create editable lineups"
ON public.lineups
FOR INSERT
TO anon, authenticated
WITH CHECK (
  owner_clerk_user_id IS NULL
  AND is_private = false
  AND public_read = true
  AND public_write = true
);

CREATE POLICY "Public update editable lineups"
ON public.lineups
FOR UPDATE
TO anon, authenticated
USING (public_write = true)
WITH CHECK (public_write = true);

CREATE POLICY "Public delete editable lineups"
ON public.lineups
FOR DELETE
TO anon, authenticated
USING (public_write = true);

CREATE POLICY "Public read formations"
ON public.formations
FOR SELECT
TO anon, authenticated
USING (
  lineup_id IS NULL
  OR EXISTS (
    SELECT 1 FROM public.lineups
    WHERE lineups.id = formations.lineup_id
      AND (lineups.public_read = true OR lineups.public_write = true)
  )
);

CREATE POLICY "Public create formations for editable lineups"
ON public.formations
FOR INSERT
TO anon, authenticated
WITH CHECK (
  lineup_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.lineups
    WHERE lineups.id = formations.lineup_id
      AND lineups.public_write = true
  )
);

CREATE POLICY "Public update formations for editable lineups"
ON public.formations
FOR UPDATE
TO anon, authenticated
USING (
  lineup_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.lineups
    WHERE lineups.id = formations.lineup_id
      AND lineups.public_write = true
  )
)
WITH CHECK (
  lineup_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.lineups
    WHERE lineups.id = formations.lineup_id
      AND lineups.public_write = true
  )
);

CREATE POLICY "Public delete formations for editable lineups"
ON public.formations
FOR DELETE
TO anon, authenticated
USING (
  lineup_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.lineups
    WHERE lineups.id = formations.lineup_id
      AND lineups.public_write = true
  )
);

CREATE POLICY "Public read formation positions"
ON public.formation_positions
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.formations
    WHERE formations.id = formation_positions.formation_id
      AND (
        formations.lineup_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.lineups
          WHERE lineups.id = formations.lineup_id
            AND (lineups.public_read = true OR lineups.public_write = true)
        )
      )
  )
);

CREATE POLICY "Public create formation positions for editable lineups"
ON public.formation_positions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.formations
    JOIN public.lineups ON lineups.id = formations.lineup_id
    WHERE formations.id = formation_positions.formation_id
      AND lineups.public_write = true
  )
);

CREATE POLICY "Public update formation positions for editable lineups"
ON public.formation_positions
FOR UPDATE
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.formations
    JOIN public.lineups ON lineups.id = formations.lineup_id
    WHERE formations.id = formation_positions.formation_id
      AND lineups.public_write = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.formations
    JOIN public.lineups ON lineups.id = formations.lineup_id
    WHERE formations.id = formation_positions.formation_id
      AND lineups.public_write = true
  )
);

CREATE POLICY "Public delete formation positions for editable lineups"
ON public.formation_positions
FOR DELETE
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.formations
    JOIN public.lineups ON lineups.id = formations.lineup_id
    WHERE formations.id = formation_positions.formation_id
      AND lineups.public_write = true
  )
);

CREATE POLICY "Public read players"
ON public.players
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lineups
    WHERE lineups.id = players.lineup_id
      AND (lineups.public_read = true OR lineups.public_write = true)
  )
);

CREATE POLICY "Public create players for editable lineups"
ON public.players
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.lineups
    WHERE lineups.id = players.lineup_id
      AND lineups.public_write = true
  )
);

CREATE POLICY "Public update players for editable lineups"
ON public.players
FOR UPDATE
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lineups
    WHERE lineups.id = players.lineup_id
      AND lineups.public_write = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.lineups
    WHERE lineups.id = players.lineup_id
      AND lineups.public_write = true
  )
);

CREATE POLICY "Public delete players for editable lineups"
ON public.players
FOR DELETE
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lineups
    WHERE lineups.id = players.lineup_id
      AND lineups.public_write = true
  )
);

CREATE POLICY "Public read lineup slots"
ON public.lineup_slots
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lineups
    WHERE lineups.id = lineup_slots.lineup_id
      AND (lineups.public_read = true OR lineups.public_write = true)
  )
);

CREATE POLICY "Public create lineup slots for editable lineups"
ON public.lineup_slots
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.lineups
    WHERE lineups.id = lineup_slots.lineup_id
      AND lineups.public_write = true
  )
);

CREATE POLICY "Public update lineup slots for editable lineups"
ON public.lineup_slots
FOR UPDATE
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lineups
    WHERE lineups.id = lineup_slots.lineup_id
      AND lineups.public_write = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.lineups
    WHERE lineups.id = lineup_slots.lineup_id
      AND lineups.public_write = true
  )
);

CREATE POLICY "Public delete lineup slots for editable lineups"
ON public.lineup_slots
FOR DELETE
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lineups
    WHERE lineups.id = lineup_slots.lineup_id
      AND lineups.public_write = true
  )
);
