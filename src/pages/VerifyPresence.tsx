import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Loader2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getDistanceMeters } from '@/lib/types';
import { useHanginnStore } from '@/lib/hanginnStore';
import { useGeolocation, distanceTo, collectAccurateReadings } from '@/hooks/useGeolocation';

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

interface VenueGeoData {
  lat: number | null;
  lng: number | null;
  name: string;
  radius_meters: number;
  room_type: string;
}

const ROOM_LABELS: Record<string, string> = {
  social: 'Social Room',
  intellectual: 'Intellectual Room',
  official: 'Official Room',
  play: 'Play Room',
  transit: 'Transit Room',
  residential: 'Residential Room',
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
  const [retryCount, setRetryCount] = useState(0);

  // Venue data
  const [venueData, setVenueData] = useState<VenueGeoData | null>(null);
  const [probeRadius, setProbeRadius] = useState<number | null>(null);
  const [probeRoomLabel, setProbeRoomLabel] = useState<string>('Room');

  // Use shared geolocation hook for live proximity probe
  const geo = useGeolocation({ enabled: true, throttleMs: 3000, maxAccuracy: 80 });

  // Fetch venue geo data once
  useEffect(() => {
    if (!venueId) return;

    const loadVenue = async () => {
      const { data: venue } = await supabase
        .from('venues')
        .select('lat, lng, radius_meters, room_type, name')
        .eq('id', venueId)
        .single();

      if (!venue) return;

      setVenueData(venue);
      const radius = venue.radius_meters || FALLBACK_RADIUS_BY_ROOM[roomType || ''] || 50;
      setProbeRadius(radius);
      setProbeRoomLabel(ROOM_LABELS[venue.room_type] || ROOM_LABELS[roomType || ''] || 'Room');
    };

    loadVenue();
  }, [venueId, roomType]);

  // Calculate distance from shared geo state
  const probeDistance = venueData?.lat != null && venueData?.lng != null
    ? distanceTo(geo, Number(venueData.lat), Number(venueData.lng))
    : null;

  const insideZone =
    probeDistance !== null && probeRadius !== null && probeDistance <= probeRadius;

  const formatDistance = (m: number) => {
    if (m < 1000) return `~${Math.round(m)}m`;
    return `~${(m / 1000).toFixed(1)}km`;
  };

  const verify = async () => {
    setState('verifying');
    setErrorMsg('');

    try {
      // Refetch venue data for the actual verification (not cached probe)
      const { data: venue } = await supabase
        .from('venues')
        .select('lat, lng, name, radius_meters')
        .eq('id', venueId)
        .single();

      const proceed = () => {
        if (roomType === 'residential') {
          // Residential: details come AFTER verification
          saveSessionState({ roomType: roomType!, venueId, step: 'profile', geofenceVerified: true });
          navigate(`/rooms/${roomType}/join?venue=${venueId}`);
        } else {
          // Other rooms: details came before, go straight to live
          saveSessionState({
            roomType: roomType!, venueId, step: 'room',
            intent: passthroughIntent, vibe: passthroughVibe,
            geofenceVerified: true,
          });
          navigate(`/rooms/${roomType}/live?venue=${venueId}&intent=${encodeURIComponent(passthroughIntent)}&vibe=${encodeURIComponent(passthroughVibe)}`);
        }
      };

      // No coordinates on venue → allow through
      if (!venue?.lat || !venue?.lng) {
        setState('success');
        setTimeout(proceed, 1000);
        return;
      }

      const result = await collectAccurateReadings();

      if ('weak' in result) {
        setState('weak-signal');
        setErrorMsg('Location signal is weak. Try moving near a window or open area.');
        return;
      }

      const radius = venue.radius_meters || FALLBACK_RADIUS_BY_ROOM[roomType || ''] || 50;
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

  // Premium verification sequence — UI-only delay before invoking verify()
  const handleVerifyPress = async () => {
    if (buttonPhase !== 'idle') return;
    setButtonPhase('loading');
    await new Promise((r) => setTimeout(r, 1500));
    setButtonPhase('confirmed');
    await new Promise((r) => setTimeout(r, 500));
    setButtonPhase('idle');
    verify();
  };

  // Retry with exponential backoff for weak signals
  const retry = () => {
    const nextRetry = retryCount + 1;
    setRetryCount(nextRetry);
    setErrorMsg('');
    setButtonPhase('idle');

    // Exponential backoff: 0s, 2s, 4s, 8s
    const delay = Math.min(2 ** retryCount * 1000, 8000);
    if (delay > 0) {
      setState('verifying');
      setTimeout(() => verify(), delay);
    } else {
      verify();
    }
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
              onClick={handleVerifyPress}
              disabled={
                buttonPhase !== 'idle' ||
                (probeDistance !== null && !insideZone)
              }
              className={
                buttonPhase === 'loading'
                  ? 'w-full rounded-2xl py-3.5 text-sm font-body font-medium bg-charcoal-deep text-muted-foreground cursor-not-allowed transition-all duration-500 inline-flex items-center justify-center gap-2'
                  : buttonPhase === 'confirmed'
                    ? 'w-full rounded-2xl py-3.5 text-sm font-body font-medium bg-primary text-primary-foreground transition-all duration-500 inline-flex items-center justify-center gap-2'
                    : insideZone
                      ? 'w-full rounded-2xl py-3.5 text-sm font-body font-medium bg-primary text-primary-foreground transition-all duration-500 animate-bronze-pulse'
                      : probeDistance !== null
                        ? 'w-full rounded-2xl py-3.5 text-sm font-body font-medium bg-secondary text-muted-foreground cursor-not-allowed transition-all duration-500'
                        : 'w-full rounded-2xl py-3.5 text-sm font-body font-medium bg-primary/90 text-primary-foreground hover:bg-primary transition-all duration-500'
              }
            >
              {buttonPhase === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                  Verifying coordinates…
                </>
              ) : buttonPhase === 'confirmed' ? (
                <>
                  <Check className="h-4 w-4" strokeWidth={2} />
                  Confirmed
                </>
              ) : insideZone ? (
                `Tap to enter the ${probeRoomLabel}`
              ) : probeDistance !== null ? (
                'Move closer to unlock'
              ) : (
                'Verify presence'
              )}
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
                Try again{retryCount > 0 ? ` (attempt ${retryCount + 1})` : ''}
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
