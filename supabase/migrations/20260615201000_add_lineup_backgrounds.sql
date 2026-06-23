ALTER TABLE public.lineups
ADD COLUMN IF NOT EXISTS background_url TEXT;

ALTER TABLE public.lineups
ADD COLUMN IF NOT EXISTS club_icon_url TEXT;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lineup-backgrounds',
  'lineup-backgrounds',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public read lineup backgrounds'
  ) THEN
    CREATE POLICY "Public read lineup backgrounds"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'lineup-backgrounds');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public upload lineup backgrounds'
  ) THEN
    CREATE POLICY "Public upload lineup backgrounds"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'lineup-backgrounds');
  END IF;
END $$;
