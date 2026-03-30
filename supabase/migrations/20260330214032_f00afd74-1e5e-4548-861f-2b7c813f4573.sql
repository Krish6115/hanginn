-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table (phone-based, no auth)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  nickname TEXT NOT NULL,
  age_band TEXT NOT NULL,
  hometown TEXT NOT NULL,
  profession TEXT NOT NULL,
  gender_preference TEXT NOT NULL DEFAULT 'all',
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_profiles_phone ON public.profiles(phone);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update profiles" ON public.profiles FOR UPDATE USING (true);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Venues table
CREATE TABLE public.venues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  room_type TEXT NOT NULL,
  address TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read venues" ON public.venues FOR SELECT USING (true);

-- Room sessions (active presence)
CREATE TABLE public.room_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  room_type TEXT NOT NULL,
  rhythm TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  snoozed BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_room_sessions_venue_active ON public.room_sessions(venue_id, is_active);

ALTER TABLE public.room_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active sessions" ON public.room_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert sessions" ON public.room_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update sessions" ON public.room_sessions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete sessions" ON public.room_sessions FOR DELETE USING (true);

CREATE TRIGGER update_room_sessions_updated_at
  BEFORE UPDATE ON public.room_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Connection requests
CREATE TABLE public.connection_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  sender_anchor TEXT,
  receiver_anchor TEXT,
  icebreaker TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read connection requests" ON public.connection_requests FOR SELECT USING (true);
CREATE POLICY "Anyone can insert connection requests" ON public.connection_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update connection requests" ON public.connection_requests FOR UPDATE USING (true);

CREATE TRIGGER update_connection_requests_updated_at
  BEFORE UPDATE ON public.connection_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Circle (accepted connections)
CREATE TABLE public.circles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  connected_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, connected_profile_id)
);

ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read circles" ON public.circles FOR SELECT USING (true);
CREATE POLICY "Anyone can insert circles" ON public.circles FOR INSERT WITH CHECK (true);

-- Enable realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.connection_requests;

-- Storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');

-- Seed venues
INSERT INTO public.venues (name, room_type, address, image_url) VALUES
  ('Third Wave Coffee', 'social', '42 MG Road', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop'),
  ('The Hideout Café', 'social', '15 Brigade Road', 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop'),
  ('Brewed Awakening', 'social', '88 Church Street', 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=400&h=300&fit=crop'),
  ('Central Library', 'intellectual', '1 Library Lane', 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&h=300&fit=crop'),
  ('University Commons', 'intellectual', '200 Campus Drive', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop'),
  ('The Reading Room', 'intellectual', '33 Book Street', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop'),
  ('WeWork Prestige', 'official', '10 Tech Park', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop'),
  ('CoLab Studios', 'official', '55 Startup Hub', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop'),
  ('The Hive Office', 'official', '77 Work Avenue', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=300&fit=crop'),
  ('Arena Gaming Zone', 'play', '5 Fun Street', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop'),
  ('SportSquare Turf', 'play', '22 Sports Complex', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop'),
  ('PlayDen Arcade', 'play', '40 Game Lane', 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&h=300&fit=crop'),
  ('Terminal 2 Lounge', 'transit', 'Airport Terminal 2', 'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=400&h=300&fit=crop'),
  ('SkyWait Café', 'transit', 'Departure Gate B', 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=400&h=300&fit=crop'),
  ('Transit Hub Lounge', 'transit', 'Central Station', 'https://images.unsplash.com/photo-1517400508447-f8dd518b86db?w=400&h=300&fit=crop');
