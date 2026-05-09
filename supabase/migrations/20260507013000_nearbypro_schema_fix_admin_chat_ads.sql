-- NearbyPro launch fix: missing provider columns, storage buckets, admin role,
-- richer chat attachments, advertising slots, and expanded SA service categories.

ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS id_number TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 4.8,
  ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS budget TEXT,
  ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'normal';

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text';

ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS slot TEXT DEFAULT 'desktop',
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS weight INTEGER NOT NULL DEFAULT 1;

-- Public buckets used by the app. These fix "bucket not found" upload errors.
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('provider-assets', 'provider-assets', true),
  ('ads', 'ads', true),
  ('chat-attachments', 'chat-attachments', true),
  ('request-assets', 'request-assets', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "provider-assets public read" ON storage.objects;
CREATE POLICY "provider-assets public read" ON storage.objects FOR SELECT USING (bucket_id = 'provider-assets');
DROP POLICY IF EXISTS "provider-assets authenticated upload" ON storage.objects;
CREATE POLICY "provider-assets authenticated upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'provider-assets');
DROP POLICY IF EXISTS "provider-assets owner update" ON storage.objects;
CREATE POLICY "provider-assets owner update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'provider-assets');

DROP POLICY IF EXISTS "ads public read" ON storage.objects;
CREATE POLICY "ads public read" ON storage.objects FOR SELECT USING (bucket_id = 'ads');
DROP POLICY IF EXISTS "ads admin upload" ON storage.objects;
CREATE POLICY "ads admin upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ads' AND public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "ads admin update" ON storage.objects;
CREATE POLICY "ads admin update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'ads' AND public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "ads admin delete" ON storage.objects;
CREATE POLICY "ads admin delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'ads' AND public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "chat attachments read" ON storage.objects;
CREATE POLICY "chat attachments read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'chat-attachments');
DROP POLICY IF EXISTS "chat attachments upload" ON storage.objects;
CREATE POLICY "chat attachments upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chat-attachments');

DROP POLICY IF EXISTS "request assets public read" ON storage.objects;
CREATE POLICY "request assets public read" ON storage.objects FOR SELECT USING (bucket_id = 'request-assets');
DROP POLICY IF EXISTS "request assets upload" ON storage.objects;
CREATE POLICY "request assets upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'request-assets');

-- Make the requested email the admin account if it exists already.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = lower('douglaswebhunter@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- Also make future sign-up of this exact email become admin automatically.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  IF lower(NEW.email) = lower('douglaswebhunter@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

-- Expanded South African service categories and subcategories.
WITH cats(name, slug, icon) AS (
  VALUES
  ('Plumbing','plumbing','Wrench'),('Electrical','electrical','Zap'),('Construction','construction','HardHat'),('Painting','painting','PaintBucket'),('Mechanics','mechanics','Car'),('Beauty & Grooming','beauty-grooming','Scissors'),('IT & Technology','it-technology','Laptop'),('Cleaning','cleaning','Sparkles'),('Home Repairs','home-repairs','Hammer'),('Gardening & Landscaping','gardening-landscaping','Leaf'),('Photography & Video','photography-video','Camera'),('Events & Catering','events-catering','PartyPopper'),('Legal Services','legal-services','Scale'),('Accounting & Tax','accounting-tax','Calculator'),('Medical & Wellness','medical-wellness','HeartPulse'),('Education & Tutoring','education-tutoring','GraduationCap'),('Transport & Logistics','transport-logistics','Truck'),('Security Services','security-services','Shield'),('Appliance Repairs','appliance-repairs','Plug'),('Property Services','property-services','Building2'),('Welding & Metalwork','welding-metalwork','Flame'),('Carpentry & Furniture','carpentry-furniture','Armchair'),('Solar & Energy','solar-energy','Sun'),('Printing & Branding','printing-branding','Printer'),('Web & Graphic Design','web-graphic-design','Palette'),('DSTV & Installations','dstv-installations','Satellite'),('Pest Control','pest-control','Bug'),('Laundry & Tailoring','laundry-tailoring','Shirt'),('Fitness & Sports','fitness-sports','Dumbbell'),('Business Services','business-services','Briefcase')
)
INSERT INTO public.categories (name, slug, icon)
SELECT name, slug, icon FROM cats
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;

WITH sub(cat, name, slug) AS (
  VALUES
  ('plumbing','Blocked drains','blocked-drains'),('plumbing','Geyser installation','geyser-installation'),('plumbing','Leak detection','leak-detection'),('plumbing','Bathroom plumbing','bathroom-plumbing'),
  ('electrical','House wiring','house-wiring'),('electrical','DB board repairs','db-board-repairs'),('electrical','Generator setup','generator-setup'),('electrical','Lighting installation','lighting-installation'),
  ('construction','Bricklaying','bricklaying'),('construction','Renovations','renovations'),('construction','Roofing','roofing'),('construction','Paving','paving'),('construction','Tiling','tiling'),('construction','Ceilings & partitions','ceilings-partitions'),
  ('mechanics','Mobile mechanic','mobile-mechanic'),('mechanics','Panel beating','panel-beating'),('mechanics','Auto electrician','auto-electrician'),('mechanics','Tyres & wheel alignment','tyres-wheel-alignment'),
  ('beauty-grooming','Hairdresser','hairdresser'),('beauty-grooming','Barber','barber'),('beauty-grooming','Nails','nails'),('beauty-grooming','Makeup artist','makeup-artist'),('beauty-grooming','Massage','massage'),
  ('it-technology','Computer repairs','computer-repairs'),('it-technology','CCTV installation','cctv-installation'),('it-technology','Network setup','network-setup'),('it-technology','Software support','software-support'),('it-technology','Phone repairs','phone-repairs'),
  ('cleaning','House cleaning','house-cleaning'),('cleaning','Office cleaning','office-cleaning'),('cleaning','Carpet cleaning','carpet-cleaning'),('cleaning','Deep cleaning','deep-cleaning'),
  ('gardening-landscaping','Lawn mowing','lawn-mowing'),('gardening-landscaping','Tree felling','tree-felling'),('gardening-landscaping','Garden maintenance','garden-maintenance'),('gardening-landscaping','Landscaping','landscaping'),
  ('photography-video','Wedding photography','wedding-photography'),('photography-video','Event videography','event-videography'),('photography-video','Product photography','product-photography'),('photography-video','Drone footage','drone-footage'),
  ('events-catering','Catering','catering'),('events-catering','Decor','decor'),('events-catering','DJ & sound','dj-sound'),('events-catering','Tent hire','tent-hire'),
  ('legal-services','Family law','family-law'),('legal-services','Contracts','contracts'),('legal-services','Immigration assistance','immigration-assistance'),('legal-services','Company registration','company-registration'),
  ('medical-wellness','Home nursing','home-nursing'),('medical-wellness','Physiotherapy','physiotherapy'),('medical-wellness','Counselling','counselling'),('medical-wellness','Wellness coaching','wellness-coaching'),
  ('transport-logistics','Furniture removals','furniture-removals'),('transport-logistics','Courier services','courier-services'),('transport-logistics','Bakkie hire','bakkie-hire'),('transport-logistics','Airport transfers','airport-transfers'),
  ('security-services','Alarm systems','alarm-systems'),('security-services','Guarding','guarding'),('security-services','Access control','access-control'),('security-services','CCTV monitoring','cctv-monitoring'),
  ('appliance-repairs','Fridge repairs','fridge-repairs'),('appliance-repairs','Washing machine repairs','washing-machine-repairs'),('appliance-repairs','Stove repairs','stove-repairs'),('appliance-repairs','Aircon repairs','aircon-repairs'),
  ('carpentry-furniture','Built-in cupboards','built-in-cupboards'),('carpentry-furniture','Furniture repairs','furniture-repairs'),('carpentry-furniture','Kitchen units','kitchen-units'),('carpentry-furniture','Custom woodwork','custom-woodwork'),
  ('web-graphic-design','Website design','website-design'),('web-graphic-design','Logo design','logo-design'),('web-graphic-design','Social media design','social-media-design'),('web-graphic-design','App design','app-design')
)
INSERT INTO public.subcategories (category_id, name, slug)
SELECT c.id, s.name, s.slug
FROM sub s JOIN public.categories c ON c.slug = s.cat
ON CONFLICT (category_id, slug) DO UPDATE SET name = EXCLUDED.name;
