import { Venue, PresenceState } from '@/lib/types';

interface VenueCardProps {
  venue: Venue;
  onClick: () => void;
}

const PRESENCE_CONFIG: Record<PresenceState, { color: string; label: string }> = {
  quiet: { color: 'bg-foreground/60', label: 'Quiet' },
  flowing: { color: 'bg-blue-400/60', label: 'Flowing' },
  vibrant: { color: 'bg-orange-400/60', label: 'Vibrant' },
};

export function VenueCard({ venue, onClick }: VenueCardProps) {
  const presence = PRESENCE_CONFIG[venue.presence];

  return (
    <button
      onClick={onClick}
      className="room-card-hover flex w-full items-start gap-4 rounded-2xl border border-border bg-card p-5 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
    >
      {venue.image && (
        <img
          src={venue.image}
          alt={venue.name}
          loading="lazy"
          className="h-24 w-24 rounded-xl object-cover opacity-80 shrink-0"
        />
      )}
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-center gap-2.5">
          <h3 className="font-display text-lg text-foreground truncate">{venue.name}</h3>
          <span className="flex items-center gap-1.5 shrink-0">
            <span className={`h-2 w-2 rounded-full ${presence.color} animate-pulse-soft`} />
            <span className="text-[10px] text-muted-foreground font-body">{presence.label}</span>
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 font-body">{venue.address}</p>
        {venue.snapshot && (
          <p className="mt-2.5 text-[12px] leading-relaxed text-secondary-foreground font-body font-light italic">
            {venue.snapshot}
          </p>
        )}
      </div>
    </button>
  );
}
