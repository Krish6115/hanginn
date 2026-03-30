import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin } from 'lucide-react';
import { ROOMS, RoomType } from '@/lib/types';
import { getVenuesForRoom } from '@/lib/mockData';
import { VenueCard } from '@/components/VenueCard';
import { useHanginnStore } from '@/lib/hanginnStore';

const RoomVenues = () => {
  const { roomType } = useParams<{ roomType: string }>();
  const navigate = useNavigate();
  const setSelectedVenue = useHanginnStore((s) => s.setSelectedVenue);
  const room = ROOMS.find((r) => r.type === roomType);

  if (!room) {
    navigate('/');
    return null;
  }

  const venues = getVenuesForRoom(roomType as RoomType);

  const handleSelect = (venueId: string) => {
    setSelectedVenue(venueId);
    navigate(`/rooms/${roomType}/join`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="font-display text-lg text-foreground">{room.icon} {room.label}</h2>
            <p className="text-xs text-muted-foreground">{room.venueLabel}</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-6 text-sm text-muted-foreground"
        >
          <MapPin className="h-4 w-4" />
          <span>Showing venues near you</span>
        </motion.div>

        <div className="flex flex-col gap-3">
          {venues.map((venue, i) => (
            <motion.div
              key={venue.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <VenueCard venue={venue} onClick={() => handleSelect(venue.id)} />
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default RoomVenues;
