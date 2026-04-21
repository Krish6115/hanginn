-- Add per-venue geofence radius (meters)
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS radius_meters INTEGER NOT NULL DEFAULT 50;

-- Backfill defaults: residential gets a wider radius
UPDATE public.venues SET radius_meters = 400 WHERE room_type = 'residential' AND radius_meters = 50;

-- Add new venues (skip if already present by name)
INSERT INTO public.venues (name, room_type, address, lat, lng, radius_meters, image_url)
SELECT 'Kalsang Cafe', 'social', 'Mohali', 30.7082410, 76.7230825, 150,
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.venues WHERE name = 'Kalsang Cafe');

INSERT INTO public.venues (name, room_type, address, lat, lng, radius_meters, image_url)
SELECT 'Sector 42 Library', 'intellectual', 'Chandigarh', 30.7270510, 76.7351011, 200,
  'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.venues WHERE name = 'Sector 42 Library');

-- SD College already exists; ensure it has the requested coordinates and 200m radius
UPDATE public.venues
SET lat = 30.7041398, lng = 76.7717277, radius_meters = 200
WHERE name = 'SD College';

-- Give residential localities premium neighborhood imagery so they render with the same VenueCard layout
UPDATE public.venues SET image_url = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop' WHERE name = 'Phase 3B1' AND (image_url IS NULL OR image_url = '');
UPDATE public.venues SET image_url = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop' WHERE name = 'Phase 8' AND (image_url IS NULL OR image_url = '');
UPDATE public.venues SET image_url = 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=400&h=300&fit=crop' WHERE name = 'Sector 34' AND (image_url IS NULL OR image_url = '');