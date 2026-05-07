-- Add moderation status to providers (is_active stays as visibility flag)
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
-- Treat existing active providers as approved
UPDATE public.providers SET status = 'approved' WHERE is_active = true AND status = 'pending';

-- service_requests already has status (defaulting to 'open'); add 'pending' workflow column for moderation if missing
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'approved';

-- Index for fast lookup of pending items in admin moderation queue
CREATE INDEX IF NOT EXISTS idx_providers_status ON public.providers(status);
CREATE INDEX IF NOT EXISTS idx_requests_moderation_status ON public.service_requests(moderation_status);

-- Tighten public read on providers: only approved+active OR own OR admin
DROP POLICY IF EXISTS "providers public read" ON public.providers;
CREATE POLICY "providers public read"
ON public.providers FOR SELECT TO public
USING (
  (is_active = true AND status = 'approved')
  OR user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Tighten public read on service_requests
DROP POLICY IF EXISTS "requests public read" ON public.service_requests;
CREATE POLICY "requests public read"
ON public.service_requests FOR SELECT TO public
USING (
  moderation_status = 'approved'
  OR user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);