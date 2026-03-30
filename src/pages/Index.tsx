import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ROOMS } from '@/lib/types';
import { RoomCard } from '@/components/RoomCard';
import { useHanginnStore } from '@/lib/hanginnStore';
import { Users } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const setSelectedRoom = useHanginnStore((s) => s.setSelectedRoom);

  const handleSelect = (roomType: typeof ROOMS[number]['type']) => {
    setSelectedRoom(roomType);
    navigate(`/rooms/${roomType}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
            <Users className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl text-foreground">Hanginn</span>
        </motion.div>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={() => navigate('/circle')}
          className="text-sm font-body font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          My Circle
        </motion.button>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-4xl md:text-5xl text-foreground leading-tight">
            Where can we take you?
          </h1>
          <p className="mt-3 font-body text-muted-foreground text-base max-w-md mx-auto">
            Choose the space you're in. We'll connect you with people nearby.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full max-w-4xl">
          {ROOMS.map((room, i) => (
            <RoomCard
              key={room.type}
              room={room}
              index={i}
              onClick={() => handleSelect(room.type)}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
