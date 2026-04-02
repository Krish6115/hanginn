import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin } from 'lucide-react';
import { ROOMS, getPresenceState, generateVenueSnapshot } from '@/lib/types';
import { useHanginnStore } from '@/lib/hanginnStore';
import { VenueCard } from '@/components/VenueCard';
import { supabase } from '@/integrations/supabase/client';
import type { Venue } from '@/lib/types';

const RoomVenues = () => {
  const { roomType } = useParams<{ roomType: string }>();
  const navigate = useNavigate();
  const { fetchVenues } = useHanginnStore();
  const room = ROOMS.find((r) => r.type === roomType);

  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomType) return;
    const load = async () => {
      const v = await fetchVenues(roomType);
      const enriched = await Promise.all(
        v.map(async (venue) => {
          const { data: sessions } = await supabase
            .from('room_sessions')
            .select('rhythm')
            .eq('venue_id', venue.id)
            .eq('is_active', true);

          const intents = (sessions || []).map((s) => s.rhythm).filter(Boolean) as string[];
          const count = intents.length;
          const presence = getPresenceState(count);
          const snapshot = generateVenueSnapshot(intents, roomType as any);

          return {
            id: venue.id,
            name: venue.name,
            image: venue.image_url || '',
            presence,
            snapshot,
            roomType: venue.room_type as any,
            address: venue.address,
            lat: venue.lat ? Number(venue.lat) : undefined,
            lng: venue.lng ? Number(venue.lng) : undefined,
          };
        })
      );
      setVenues(enriched);
      setLoading(false);
    };
    load();
  }, [roomType]);

  if (!room) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="font-display text-lg text-foreground">{room.label}</h2>
            <p className="text-xs text-muted-foreground">{room.venueLabel}</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-8 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="font-body">Showing venues near you</span>
        </motion.div>

        {loading ? (
          <div className="space-y-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-secondary animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {venues.map((venue, i) => (
              <motion.div key={venue.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <VenueCard venue={venue} onClick={() => navigate(`/rooms/${roomType}/join?venue=${venue.id}`)} />
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default RoomVenues;
