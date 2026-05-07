
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS id_number TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('provider-assets', 'provider-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "provider-assets public read" ON storage.objects;
CREATE POLICY "provider-assets public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'provider-assets');

DROP POLICY IF EXISTS "provider-assets owner upload" ON storage.objects;
CREATE POLICY "provider-assets owner upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'provider-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "provider-assets owner update" ON storage.objects;
CREATE POLICY "provider-assets owner update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'provider-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "provider-assets owner delete" ON storage.objects;
CREATE POLICY "provider-assets owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'provider-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
