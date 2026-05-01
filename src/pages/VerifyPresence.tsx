import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getDistanceMeters } from '@/lib/types';
import { useHanginnStore } from '@/lib/hanginnStore';

type VerifyState = 'pre-permission' | 'verifying' | 'success' | 'failed' | 'weak-signal';
type ButtonPhase = 'idle' | 'loading' | 'confirmed';

// Fallback radius (meters) if a venue has no per-venue radius set
const FALLBACK_RADIUS_BY_ROOM: Record<string, number> = {
  residential: 400,
  social: 50,
  intellectual: 50,
  official: 50,
  play: 50,
  transit: 50,
};

const VerifyPresence = () => {
  const { roomType } = useParams<{ roomType: string }>();
  const [searchParams] = useSearchParams();
  const venueId = searchParams.get('venue') || '';
  const passthroughIntent = searchParams.get('intent') || '';
  const passthroughVibe = searchParams.get('vibe') || '';
  const navigate = useNavigate();
  const { saveSessionState, currentProfile } = useHanginnStore();

  const [state, setState] = useState<VerifyState>('pre-permission');
  const [errorMsg, setErrorMsg] = useState('');
  const [buttonPhase, setButtonPhase] = useState<ButtonPhase>('idle');

  // Live UI-only proximity probe (does NOT gate entry — verify() still owns that)
  const [probeDistance, setProbeDistance] = useState<number | null>(null);
  const [probeRadius, setProbeRadius] = useState<number | null>(null);
  const [probeRoomLabel, setProbeRoomLabel] = useState<string>('Room');

  useEffect(() => {
    let cancelled = false;
    let watchId: number | null = null;

    const startProbe = async () => {
      if (!venueId) return;
      const { data: venue } = await supabase
        .from('venues')
        .select('lat, lng, radius_meters, room_type')
        .eq('id', venueId)
        .single();
      if (cancelled || !venue?.lat || !venue?.lng) return;

      const venueRadius = (venue as any).radius_meters
        ? Number((venue as any).radius_meters)
        : null;
      const radius =
        venueRadius ?? FALLBACK_RADIUS_BY_ROOM[roomType || ''] ?? 50;
      setProbeRadius(radius);

      const labelMap: Record<string, string> = {
        social: 'Social Room',
        intellectual: 'Intellectual Room',
        official: 'Official Room',
        play: 'Play Room',
        transit: 'Transit Room',
        residential: 'Residential Room',
      };
      setProbeRoomLabel(labelMap[(venue as any).room_type] || labelMap[roomType || ''] || 'Room');

      if (!('geolocation' in navigator)) return;
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (cancelled) return;
          const d = getDistanceMeters(
            pos.coords.latitude,
            pos.coords.longitude,
            Number(venue.lat),
            Number(venue.lng)
          );
          setProbeDistance(d);
        },
        () => {
          /* silent — probe is best-effort */
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
      );
    };

    startProbe();
    return () => {
      cancelled = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [venueId, roomType]);

  const formatDistance = (m: number) => {
    if (m < 1000) return `~${Math.round(m)}m`;
    return `~${(m / 1000).toFixed(1)}km`;
  };

  const insideZone =
    probeDistance !== null && probeRadius !== null && probeDistance <= probeRadius;

  const collectReadings = async (): Promise<{ lat: number; lng: number } | { weak: true }> => {
    const valid: { lat: number; lng: number; acc: number }[] = [];
    for (let i = 0; i < 5; i++) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        });
        if (pos.coords.accuracy <= 40) {
          valid.push({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            acc: pos.coords.accuracy,
          });
        }
      } catch (e: any) {
        if (e?.code === 1) throw e; // permission denied — bubble up
        // timeout / unavailable — keep trying
      }
    }
    if (valid.length < 2) return { weak: true };
    const best = valid.sort((a, b) => a.acc - b.acc).slice(0, 3);
    const lat = best.reduce((s, r) => s + r.lat, 0) / best.length;
    const lng = best.reduce((s, r) => s + r.lng, 0) / best.length;
    return { lat, lng };
  };

  const verify = async () => {
    setState('verifying');
    setErrorMsg('');

    try {
      const { data: venue } = await supabase
        .from('venues')
        .select('lat, lng, name, radius_meters')
        .eq('id', venueId)
        .single();

      const proceed = () => {
        if (roomType === 'residential') {
          // Residential: details come AFTER verification
          saveSessionState({ roomType: roomType!, venueId, step: 'profile' });
          if (currentProfile?.nickname && currentProfile?.age_band) {
            navigate(`/rooms/${roomType}/join?venue=${venueId}`);
          } else {
            navigate(`/rooms/${roomType}/join?venue=${venueId}`);
          }
        } else {
          // Other rooms: details came before, go straight to live
          saveSessionState({ roomType: roomType!, venueId, step: 'room', intent: passthroughIntent, vibe: passthroughVibe });
          navigate(`/rooms/${roomType}/live?venue=${venueId}&intent=${encodeURIComponent(passthroughIntent)}&vibe=${encodeURIComponent(passthroughVibe)}`);
        }
      };

      // No coordinates on venue → allow through
      if (!venue?.lat || !venue?.lng) {
        setState('success');
        setTimeout(proceed, 1000);
        return;
      }

      const result = await collectReadings();
      if ('weak' in result) {
        setState('weak-signal');
        setErrorMsg('Location signal is weak. Try moving near a window or open area.');
        return;
      }

      const venueRadius = (venue as any).radius_meters ? Number((venue as any).radius_meters) : null;
      const radius = venueRadius ?? FALLBACK_RADIUS_BY_ROOM[roomType || ''] ?? 50;
      const dist = getDistanceMeters(result.lat, result.lng, Number(venue.lat), Number(venue.lng));

      if (dist <= radius) {
        setState('success');
        setTimeout(proceed, 1000);
      } else {
        setState('failed');
        setErrorMsg(
          roomType === 'residential'
            ? "We couldn't confirm your presence in this locality."
            : "We couldn't confirm your presence yet. Please ensure you are inside the venue and have GPS enabled."
        );
      }
    } catch (e: any) {
      setState('failed');
      if (e?.code === 1) {
        setErrorMsg('Location permission denied. Please enable GPS access in your browser settings.');
      } else {
        setErrorMsg("We couldn't confirm your presence yet. Please ensure GPS is enabled and try again.");
      }
    }
  };

  useEffect(() => {
    // No auth gate — presence is the only gate
  }, []);

  const retry = () => {
    setErrorMsg('');
    verify();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        {state === 'pre-permission' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="mx-auto h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
              <MapPin className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div className="space-y-3">
              <p className="font-display text-lg text-foreground">Before you step inside</p>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">
                We only use your location to confirm you are inside this {roomType === 'residential' ? 'locality' : 'venue'}.
              </p>
              <p className="text-xs text-muted-foreground/70 font-body">
                Your location is not shown publicly.
              </p>
            </div>

            {/* Live proximity indicator (UI-only; geofence logic unchanged) */}
            <div className="min-h-[1.25rem] flex items-center justify-center">
              {probeDistance === null ? (
                <span className="text-xs font-body font-light text-muted-foreground/60">
                  Sensing your proximity…
                </span>
              ) : insideZone ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-body text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-soft" />
                  You have arrived.
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-body font-light text-muted-foreground">
                  <MapPin className="h-3 w-3" strokeWidth={1.5} />
                  {formatDistance(probeDistance)} away — Move closer to unlock
                </span>
              )}
            </div>

            <button
              onClick={verify}
              disabled={probeDistance !== null && !insideZone}
              className={
                insideZone
                  ? 'w-full rounded-2xl py-3.5 text-sm font-body font-medium bg-primary text-primary-foreground transition-all duration-500 animate-bronze-pulse'
                  : probeDistance !== null
                    ? 'w-full rounded-2xl py-3.5 text-sm font-body font-medium bg-secondary text-muted-foreground cursor-not-allowed transition-all duration-500'
                    : 'w-full rounded-2xl py-3.5 text-sm font-body font-medium bg-primary/90 text-primary-foreground hover:bg-primary transition-all duration-500'
              }
            >
              {insideZone
                ? `Tap to enter the ${probeRoomLabel}`
                : probeDistance !== null
                  ? 'Move closer to unlock'
                  : 'Verify presence'}
            </button>
          </motion.div>
        )}

        {state === 'verifying' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="relative mx-auto h-24 w-24">
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-muted-foreground/30"
                animate={{ scale: [1.2, 0.9, 1.2], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute inset-2 rounded-full border border-muted-foreground/20"
                animate={{ scale: [1.1, 0.95, 1.1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
              </div>
            </div>
            <div>
              <p className="font-display text-lg text-foreground">Verifying your presence</p>
              <p className="text-sm text-muted-foreground font-body mt-2">A few quiet seconds</p>
            </div>
          </motion.div>
        )}

        {state === 'success' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-6 w-6 text-primary" strokeWidth={1.5} />
            </div>
            <p className="font-display text-lg text-foreground">Presence confirmed</p>
            <p className="text-sm text-muted-foreground font-body">Stepping inside…</p>
          </motion.div>
        )}

        {(state === 'failed' || state === 'weak-signal') && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="mx-auto h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
              <MapPin className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-display text-lg text-foreground">
                {state === 'weak-signal' ? 'Weak signal' : "We couldn't confirm your presence."}
              </p>
              <p className="text-sm text-muted-foreground font-body mt-2">{errorMsg}</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={retry}
                className="w-full rounded-2xl py-3.5 text-sm font-body font-medium bg-primary/90 text-primary-foreground hover:bg-primary transition-all duration-500"
              >
                Try again
              </button>
              <button
                onClick={() => navigate(`/rooms/${roomType}`)}
                className="w-full rounded-2xl py-3.5 text-sm font-body text-muted-foreground hover:text-foreground border border-border transition-all duration-500"
              >
                Go back
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VerifyPresence;
