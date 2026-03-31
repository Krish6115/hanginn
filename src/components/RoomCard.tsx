import { motion } from 'framer-motion';
import { Room } from '@/lib/types';

const ROOM_SUBTITLES: Record<string, string> = {
  social: 'Light conversations',
  intellectual: 'Study, think, or exchange ideas quietly',
  play: 'Join a game. Find your rhythm',
  transit: 'Short conversations while you wait',
  official: 'Work, network, or coordinate',
};

interface RoomCardProps {
  room: Room;
  onClick: () => void;
  index: number;
}

export function RoomCard({ room, onClick, index }: RoomCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 + index * 0.08, duration: 0.7, ease: 'easeOut' }}
      onClick={onClick}
      className="room-card-hover snap-start shrink-0 w-[140px] flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
    >
      <span className="text-2xl">{room.icon}</span>
      <div>
        <h3 className="font-display text-base text-foreground">{room.label}</h3>
        <p className="mt-1 font-body text-[11px] font-light leading-snug text-muted-foreground">
          {ROOM_SUBTITLES[room.type] || room.description}
        </p>
      </div>
    </motion.button>
  );
}
