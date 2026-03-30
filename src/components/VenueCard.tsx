import { Venue } from '@/lib/types';
import { Users } from 'lucide-react';

interface VenueCardProps {
  venue: Venue;
  onClick: () => void;
}

export function VenueCard({ venue, onClick }: VenueCardProps) {
  return (
    <button
      onClick={onClick}
      className="room-card-hover flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <img
        src={venue.image}
        alt={venue.name}
        className="h-20 w-20 rounded-xl object-cover"
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-display text-lg text-foreground truncate">{venue.name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{venue.address}</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-accent">
            <Users className="h-3.5 w-3.5" />
            {venue.peopleCount} inside
          </span>
          <span className="text-xs text-muted-foreground">
            {venue.topRhythms[0]}
          </span>
        </div>
      </div>
    </button>
  );
}
