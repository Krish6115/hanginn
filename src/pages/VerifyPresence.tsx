import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { useHanginnStore } from '@/lib/hanginnStore';
import { supabase } from '@/integrations/supabase/client';
import { getDistanceMeters } from '@/lib/types';

type VerifyState = 'pre-permission' | 'verifying' | 'success' | 'failed';

const VerifyPresence = () => {
  const { roomType } = useParams<{ roomType: string }>();
  const [searchParams] = useSearchParams();
  const venueId = searchParams.get('venue') || '';
  const intent = searchParams.get('intent') || '';
  const vibe = searchParams.get('vibe') || '';
  const navigate = useNavigate();
  const { currentProfile, saveSessionState } = useHanginnStore();

  const [state, setState] = useState<VerifyState>('pre-permission');
  const [errorMsg, setErrorMsg] = useState('');

  const verify = async () => {
    setState('verifying');
    setErrorMsg('');

    try {
      const { data: venue } = await supabase
        .from('venues')
        .select('lat, lng, name')
        .eq('id', venueId)
        .single();

      if (!venue?.lat || !venue?.lng) {
        setState('success');
        setTimeout(() => {
          saveSessionState({ roomType: roomType!, venueId, step: 'room', intent, vibe });
          navigate(`/rooms/${roomType}/live?venue=${venueId}&intent=${encodeURIComponent(intent)}&vibe=${encodeURIComponent(vibe)}`);
        }, 1200);
        return;
      }

      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        });
      });

      const dist = getDistanceMeters(pos.coords.latitude, pos.coords.longitude, Number(venue.lat), Number(venue.lng));

      if (dist <= 10) {
        setState('success');
        setTimeout(() => {
          saveSessionState({ roomType: roomType!, venueId, step: 'room', intent, vibe });
          navigate(`/rooms/${roomType}/live?venue=${venueId}&intent=${encodeURIComponent(intent)}&vibe=${encodeURIComponent(vibe)}`);
        }, 1200);
      } else {
        setState('failed');
        setErrorMsg("We couldn't confirm your presence yet. Please ensure GPS is enabled and you are inside the venue.");
      }
    } catch (e: any) {
      setState('failed');
      if (e.code === 1) {
        setErrorMsg('Location permission denied. Please enable GPS access in your browser settings.');
      } else if (e.code === 2) {
        setErrorMsg("We couldn't confirm your presence yet. Please ensure GPS is enabled and you are inside the venue.");
      } else if (e.code === 3) {
        setErrorMsg("We couldn't confirm your presence yet. Please ensure GPS is enabled and you are inside the venue.");
      } else {
        setErrorMsg("We couldn't confirm your presence yet. Please ensure GPS is enabled and you are inside the venue.");
      }
    }
  };

  useEffect(() => {
    if (!currentProfile) {
      navigate(`/rooms/${roomType}/join?venue=${venueId}`);
      return;
    }
  }, []);

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
                We only use your location to confirm you are inside this venue.
              </p>
              <p className="text-xs text-muted-foreground/70 font-body">
                Your location is not shown publicly.
              </p>
            </div>
            <button
              onClick={verify}
              className="w-full rounded-2xl py-3.5 text-sm font-body font-medium bg-primary/90 text-primary-foreground hover:bg-primary transition-all duration-500"
            >
              Verify presence
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
              <p className="font-display text-lg text-foreground">Verifying presence</p>
              <p className="text-sm text-muted-foreground font-body mt-2">Confirming you are near this venue</p>
            </div>
          </motion.div>
        )}

        {state === 'success' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-6 w-6 text-primary" strokeWidth={1.5} />
            </div>
            <p className="font-display text-lg text-foreground">Presence confirmed</p>
            <p className="text-sm text-muted-foreground font-body">Entering the room...</p>
          </motion.div>
        )}

        {state === 'failed' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="mx-auto h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
              <MapPin className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-display text-lg text-foreground">We couldn't confirm your presence.</p>
              <p className="text-sm text-muted-foreground font-body mt-2">{errorMsg}</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={verify}
                className="w-full rounded-2xl py-3.5 text-sm font-body font-medium bg-primary/90 text-primary-foreground hover:bg-primary transition-all duration-500"
              >
                Try again
              </button>
              <button
                onClick={() => navigate(`/rooms/${roomType}`)}
                className="w-full rounded-2xl py-3.5 text-sm font-body text-muted-foreground hover:text-foreground border border-border transition-all duration-500"
              >
                Scan Table QR
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VerifyPresence;
