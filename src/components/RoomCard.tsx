import { motion } from 'framer-motion';
import { Room } from '@/lib/types';

interface RoomCardProps {
  room: Room;
  onClick: () => void;
  index: number;
}

export function RoomCard({ room, onClick, index }: RoomCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
      onClick={onClick}
      className="room-card-hover group flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <span className="text-5xl">{room.icon}</span>
      <div>
        <h3 className="font-display text-2xl text-foreground">{room.label}</h3>
        <p className="mt-1 font-body text-sm text-muted-foreground">{room.description}</p>
      </div>
      <div className="mt-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        Enter →
      </div>
    </motion.button>
  );
}
