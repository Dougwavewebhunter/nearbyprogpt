
-- Roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin','provider','user');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by all authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Auto-create profile + default 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.raw_user_meta_data->>'avatar_url');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "admin manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  UNIQUE(category_id, slug)
);
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subcat public read" ON public.subcategories FOR SELECT USING (true);
CREATE POLICY "admin manage subcat" ON public.subcategories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Providers
CREATE TABLE public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  business_name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
  location TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  cover_image TEXT,
  gallery JSONB DEFAULT '[]'::jsonb,
  services JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "providers public read" ON public.providers FOR SELECT USING (is_active = true OR user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "provider insert own" ON public.providers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "provider update own" ON public.providers FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete provider" ON public.providers FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') OR user_id = auth.uid());

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider_id, user_id)
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "users insert own review" ON public.reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "users update own review" ON public.reviews FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "users/admin delete review" ON public.reviews FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- Conversations & messages
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider_id)
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conv participants read" ON public.conversations FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR EXISTS(SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.user_id = auth.uid()) OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY "users create conv" ON public.conversations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg participants read" ON public.messages FOR SELECT TO authenticated USING (
  EXISTS(SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.user_id = auth.uid() OR EXISTS(SELECT 1 FROM public.providers p WHERE p.id = c.provider_id AND p.user_id = auth.uid())))
  OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY "msg participants insert" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid() AND EXISTS(SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.user_id = auth.uid() OR EXISTS(SELECT 1 FROM public.providers p WHERE p.id = c.provider_id AND p.user_id = auth.uid())))
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;

-- Service requests
CREATE TABLE public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "requests public read" ON public.service_requests FOR SELECT USING (true);
CREATE POLICY "users insert own request" ON public.service_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "users/admin update request" ON public.service_requests FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "users/admin delete request" ON public.service_requests FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;
ALTER TABLE public.service_requests REPLICA IDENTITY FULL;

-- Ads
CREATE TABLE public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  position TEXT NOT NULL DEFAULT 'left', -- left|right
  size TEXT NOT NULL DEFAULT 'medium',   -- small|medium|large
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ads public read active" ON public.ads FOR SELECT USING (is_active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage ads" ON public.ads FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Seed categories
INSERT INTO public.categories (name, slug, icon) VALUES
  ('Plumbing','plumbing','Wrench'),
  ('Electrical','electrical','Zap'),
  ('Mechanics','mechanics','Car'),
  ('Hair & Beauty','hair-beauty','Scissors'),
  ('Construction','construction','HardHat'),
  ('Cleaning','cleaning','Sparkles'),
  ('Painting','painting','PaintBucket'),
  ('Welding','welding','Flame');

INSERT INTO public.subcategories (category_id, name, slug)
SELECT id, x.name, x.slug FROM public.categories c
JOIN (VALUES
  ('plumbing','Leak Repair','leak-repair'),
  ('plumbing','Installation','installation'),
  ('plumbing','Geyser Repair','geyser-repair'),
  ('electrical','Wiring','wiring'),
  ('electrical','Solar Install','solar-install'),
  ('mechanics','BMW Specialist','bmw'),
  ('mechanics','Toyota Specialist','toyota'),
  ('mechanics','General Service','general-service'),
  ('hair-beauty','Haircut','haircut'),
  ('hair-beauty','Nails','nails'),
  ('construction','Brickwork','brickwork'),
  ('construction','Roofing','roofing'),
  ('cleaning','Home Cleaning','home-cleaning'),
  ('cleaning','Office Cleaning','office-cleaning')
) AS x(cat_slug, name, slug) ON c.slug = x.cat_slug;
