
-- Events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_type TEXT NOT NULL,
  venue_id UUID REFERENCES public.venues(id),
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  intent TEXT DEFAULT '',
  vibe TEXT DEFAULT '',
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  max_participants INTEGER DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read events" ON public.events FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated can create events" ON public.events FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update events" ON public.events FOR UPDATE TO public USING (true);

-- Room messages table
CREATE TABLE public.room_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL,
  room_type TEXT NOT NULL,
  profile_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read room messages" ON public.room_messages FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert room messages" ON public.room_messages FOR INSERT TO public WITH CHECK (true);

-- Blocked users table
CREATE TABLE public.blocked_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read blocks" ON public.blocked_users FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert blocks" ON public.blocked_users FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can delete blocks" ON public.blocked_users FOR DELETE TO public USING (true);

-- Allow deleting circles
CREATE POLICY "Anyone can delete circles" ON public.circles FOR DELETE TO public USING (true);

-- Enable realtime for room_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
