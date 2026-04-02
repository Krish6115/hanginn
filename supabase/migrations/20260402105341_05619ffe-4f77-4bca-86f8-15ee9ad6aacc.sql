
-- Add email and user_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.profiles ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN hometown SET DEFAULT '';
ALTER TABLE public.profiles ALTER COLUMN profession SET DEFAULT '';

-- Add lat/lng to venues for geofencing
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS lat numeric;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS lng numeric;
