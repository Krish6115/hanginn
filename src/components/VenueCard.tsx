import { Venue, PresenceState } from '@/lib/types';

interface VenueCardProps {
  venue: Venue;
  onClick: () => void;
}

const PRESENCE_CONFIG: Record<PresenceState, { color: string; label: string }> = {
  quiet: { color: 'bg-foreground/60', label: 'Quiet presence' },
  flowing: { color: 'bg-blue-400/50', label: 'Flowing' },
  vibrant: { color: 'bg-orange-400/50', label: 'Vibrant' },
};

export function VenueCard({ venue, onClick }: VenueCardProps) {
  const presence = PRESENCE_CONFIG[venue.presence];

  return (
    <button
      onClick={onClick}
      className="room-card-hover flex w-full flex-col rounded-2xl border border-border bg-card overflow-hidden text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
    >
      {venue.image && (
        <div className="relative w-full h-32 overflow-hidden">
          <img
            src={venue.image}
            alt={venue.name}
            loading="lazy"
            className="w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
          {/* Venue identity marker */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-background/60 backdrop-blur-sm px-2.5 py-1">
            <div className="h-4 w-4 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-[8px] font-display text-foreground">{venue.name[0]}</span>
            </div>
            <span className="text-[10px] font-body text-foreground/80">{venue.name.split(' ')[0]}</span>
          </div>
        </div>
      )}
      <div className="px-5 py-4 space-y-2">
        <div className="flex items-center gap-2.5">
          <h3 className="font-display text-lg text-foreground truncate flex-1">{venue.name}</h3>
          <span className="flex items-center gap-1.5 shrink-0">
            <span className={`h-2 w-2 rounded-full ${presence.color} animate-pulse-soft`} />
          </span>
        </div>
        {venue.roomType !== 'residential' && (
          <p className="text-xs text-muted-foreground font-body">{venue.address}</p>
        )}
        <p className="text-[12px] leading-relaxed text-secondary-foreground font-body font-light italic">
          {venue.snapshot || (venue.roomType === 'residential' ? 'People around you coordinating' : '')}
        </p>
      </div>
    </button>
  );
}
