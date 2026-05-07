-- NearbyPro follow-up fix: request chat, free/premium upload plans, and auto-approved requests.

-- Separate chat channel for service requests. This fixes "Chat not ready" when chatting with a customer/requester.
CREATE TABLE IF NOT EXISTS public.request_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(request_id, requester_id, responder_id)
);

ALTER TABLE public.request_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "request conv participants read" ON public.request_conversations;
CREATE POLICY "request conv participants read" ON public.request_conversations FOR SELECT TO authenticated
USING (requester_id = auth.uid() OR responder_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "request conv participants insert" ON public.request_conversations;
CREATE POLICY "request conv participants insert" ON public.request_conversations FOR INSERT TO authenticated
WITH CHECK (requester_id = auth.uid() OR responder_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.request_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.request_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  message_type TEXT NOT NULL DEFAULT 'text',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.request_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "request msg participants read" ON public.request_messages;
CREATE POLICY "request msg participants read" ON public.request_messages FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.request_conversations c WHERE c.id = conversation_id AND (c.requester_id = auth.uid() OR c.responder_id = auth.uid())) OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "request msg participants insert" ON public.request_messages;
CREATE POLICY "request msg participants insert" ON public.request_messages FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.request_conversations c WHERE c.id = conversation_id AND (c.requester_id = auth.uid() OR c.responder_id = auth.uid())));

CREATE OR REPLACE FUNCTION public.touch_request_conversation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.request_conversations SET last_message_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_touch_request_conversation ON public.request_messages;
CREATE TRIGGER trg_touch_request_conversation AFTER INSERT ON public.request_messages FOR EACH ROW EXECUTE FUNCTION public.touch_request_conversation();

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.request_conversations;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.request_messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE public.request_conversations REPLICA IDENTITY FULL;
ALTER TABLE public.request_messages REPLICA IDENTITY FULL;

-- Subscription scaffolding for later PayPal integration.
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('free','monthly','annual')) DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  provider TEXT DEFAULT 'manual',
  amount_cents INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'ZAR',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscriptions owner/admin read" ON public.subscriptions;
CREATE POLICY "subscriptions owner/admin read" ON public.subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "subscriptions admin manage" ON public.subscriptions;
CREATE POLICY "subscriptions admin manage" ON public.subscriptions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Keep new customer requests live immediately while admin can still remove/flag later.
ALTER TABLE public.service_requests ALTER COLUMN status SET DEFAULT 'open';
ALTER TABLE public.service_requests ALTER COLUMN moderation_status SET DEFAULT 'approved';
UPDATE public.service_requests SET moderation_status = 'approved' WHERE moderation_status IS NULL OR moderation_status = 'pending';
