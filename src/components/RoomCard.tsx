import { motion } from 'framer-motion';
import { Room } from '@/lib/types';
import roomSocial from '@/assets/room-social.jpg';
import roomIntellectual from '@/assets/room-intellectual.jpg';
import roomOfficial from '@/assets/room-official.jpg';
import roomTransit from '@/assets/room-transit.jpg';
import roomPlay from '@/assets/room-play.jpg';

const ROOM_IMAGES: Record<string, string> = {
  social: roomSocial,
  intellectual: roomIntellectual,
  official: roomOfficial,
  transit: roomTransit,
  play: roomPlay,
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
      className="room-card-hover snap-start shrink-0 w-[150px] flex flex-col items-start gap-0 rounded-2xl border border-border bg-card overflow-hidden text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
    >
      <div className="relative w-full h-[90px] overflow-hidden">
        <img
          src={ROOM_IMAGES[room.type]}
          alt={room.label}
          loading="lazy"
          width={150}
          height={90}
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
      </div>
      <div className="px-4 pb-4 pt-2">
        <h3 className="font-display text-base text-foreground">{room.label}</h3>
        <p className="mt-1 font-body text-[11px] font-light leading-snug text-muted-foreground">
          {room.description}
        </p>
      </div>
    </motion.button>
  );
}
