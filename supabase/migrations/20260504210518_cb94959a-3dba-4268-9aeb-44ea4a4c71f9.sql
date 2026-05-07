-- Fix has_role permissions so anon/public can use it in RLS policies
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, public;

-- Extend ads table for scheduling, sizing, slots, and ordering
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS slot text NOT NULL DEFAULT 'sidebar',
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS weight integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS click_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS impression_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Public storage bucket for ad creatives
INSERT INTO storage.buckets (id, name, public)
VALUES ('ads', 'ads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: public read; admin write
DROP POLICY IF EXISTS "ads public read" ON storage.objects;
CREATE POLICY "ads public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'ads');

DROP POLICY IF EXISTS "ads admin write" ON storage.objects;
CREATE POLICY "ads admin write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "ads admin update" ON storage.objects;
CREATE POLICY "ads admin update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "ads admin delete" ON storage.objects;
CREATE POLICY "ads admin delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'));