-- Schema do Montador de Escalação Pro Clubs (cópia de referência)
-- As migrations reais já foram aplicadas via Lovable Cloud.
-- Sem autenticação: leitura/escrita públicas (uso casual por link entre amigos).

CREATE TABLE public.lineups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  formation_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.formations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lineup_id UUID REFERENCES public.lineups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.formation_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  x NUMERIC NOT NULL,
  y NUMERIC NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lineup_id UUID NOT NULL REFERENCES public.lineups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  favorite_positions TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lineup_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lineup_id UUID NOT NULL REFERENCES public.lineups(id) ON DELETE CASCADE,
  formation_position_id UUID REFERENCES public.formation_positions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  slot_type TEXT NOT NULL DEFAULT 'titular',
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.lineups
  ADD CONSTRAINT lineups_formation_fk
  FOREIGN KEY (formation_id) REFERENCES public.formations(id) ON DELETE SET NULL;

CREATE INDEX idx_formation_positions_formation ON public.formation_positions(formation_id);
CREATE INDEX idx_players_lineup ON public.players(lineup_id);
CREATE INDEX idx_lineup_slots_lineup ON public.lineup_slots(lineup_id);
CREATE INDEX idx_formations_lineup ON public.formations(lineup_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lineups TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.formations TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.formation_positions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.players TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lineup_slots TO anon, authenticated;

ALTER TABLE public.lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formation_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lineup_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access lineups" ON public.lineups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access formations" ON public.formations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access formation_positions" ON public.formation_positions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access players" ON public.players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access lineup_slots" ON public.lineup_slots FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_lineups_updated_at BEFORE UPDATE ON public.lineups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Habilita atualizações em tempo real na página compartilhada da escalação.
ALTER PUBLICATION supabase_realtime ADD TABLE
  public.lineups,
  public.formations,
  public.formation_positions,
  public.players,
  public.lineup_slots;
