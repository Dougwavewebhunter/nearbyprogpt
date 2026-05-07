-- NearbyPro notification/auth/dashboard update.
-- Run this newest migration in Supabase SQL Editor after your older migrations.

-- 1) Store user notification preferences. This prepares for browser/PWA alerts and future email/WhatsApp alert settings.
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  browser_notifications_enabled BOOLEAN NOT NULL DEFAULT false,
  email_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  whatsapp_notifications_enabled BOOLEAN NOT NULL DEFAULT false,
  whatsapp_number TEXT,
  preferred_contact_method TEXT DEFAULT 'app',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users manage own notification preferences" ON public.notification_preferences;
CREATE POLICY "users manage own notification preferences" ON public.notification_preferences
FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- 2) Queue table for future email/WhatsApp notifications.
-- The frontend now does app/browser notifications immediately.
-- To send real emails/WhatsApp later, connect this queue to a Supabase Edge Function + Resend/Brevo/SendGrid or WhatsApp Business API.
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'email',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins manage notification queue" ON public.notification_queue;
CREATE POLICY "admins manage notification queue" ON public.notification_queue
FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin'))
WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 3) Queue email notification for normal provider/customer chat messages.
CREATE OR REPLACE FUNCTION public.queue_provider_message_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient uuid;
  provider_owner uuid;
BEGIN
  SELECT p.user_id INTO provider_owner
  FROM public.conversations c
  JOIN public.providers p ON p.id = c.provider_id
  WHERE c.id = NEW.conversation_id;

  SELECT CASE
    WHEN c.user_id = NEW.sender_id THEN provider_owner
    ELSE c.user_id
  END INTO recipient
  FROM public.conversations c
  WHERE c.id = NEW.conversation_id;

  IF recipient IS NOT NULL AND recipient <> NEW.sender_id THEN
    INSERT INTO public.notification_queue(recipient_id, channel, title, body, target_url)
    VALUES(recipient, 'email', 'New NearbyPro message', COALESCE(NEW.content, 'You received a new NearbyPro message.'), '/messages/' || NEW.conversation_id::text);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_queue_provider_message_notification ON public.messages;
CREATE TRIGGER trg_queue_provider_message_notification
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.queue_provider_message_notification();

-- 4) Queue email notification for request chat messages.
CREATE OR REPLACE FUNCTION public.queue_request_message_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient uuid;
  req_id uuid;
BEGIN
  SELECT CASE WHEN requester_id = NEW.sender_id THEN responder_id ELSE requester_id END, request_id
  INTO recipient, req_id
  FROM public.request_conversations
  WHERE id = NEW.conversation_id;

  IF recipient IS NOT NULL AND recipient <> NEW.sender_id THEN
    INSERT INTO public.notification_queue(recipient_id, channel, title, body, target_url)
    VALUES(recipient, 'email', 'New NearbyPro request chat message', COALESCE(NEW.content, 'You received a new request chat message.'), '/requests/' || req_id::text);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_queue_request_message_notification ON public.request_messages;
CREATE TRIGGER trg_queue_request_message_notification
AFTER INSERT ON public.request_messages
FOR EACH ROW EXECUTE FUNCTION public.queue_request_message_notification();

-- 5) Keep provider profiles and service requests auto-approved/live by default for launch.
ALTER TABLE public.providers ALTER COLUMN is_active SET DEFAULT true;
UPDATE public.providers SET is_active = true WHERE is_active IS NULL OR is_active = false;

ALTER TABLE public.service_requests ALTER COLUMN status SET DEFAULT 'open';
ALTER TABLE public.service_requests ALTER COLUMN moderation_status SET DEFAULT 'approved';
UPDATE public.service_requests SET status = 'open' WHERE status IS NULL;
UPDATE public.service_requests SET moderation_status = 'approved' WHERE moderation_status IS NULL OR moderation_status = 'pending';
