import { Venue, PresenceState } from '@/lib/types';
import { Users, Navigation } from 'lucide-react';

interface VenueCardProps {
  venue: Venue;
  distanceKm?: number | null;
  peopleCount?: number;
  presenceLabel?: string;
  isWithin50m?: boolean;
  onClick: () => void;
}

const PRESENCE_CONFIG: Record<PresenceState, { color: string; label: string }> = {
  quiet: { color: 'bg-foreground/60', label: 'Quiet presence' },
  flowing: { color: 'bg-blue-400/50', label: 'Flowing' },
  vibrant: { color: 'bg-orange-400/50', label: 'Vibrant' },
};

export function VenueCard({ venue, distanceKm, peopleCount, presenceLabel, isWithin50m, onClick }: VenueCardProps) {
  const presence = PRESENCE_CONFIG[venue.presence];

  return (
    <button
      onClick={onClick}
      disabled={isWithin50m === false}
      className={`room-card-hover flex w-full flex-col rounded-2xl border bg-card overflow-hidden text-left focus:outline-none focus:ring-1 focus:ring-ring transition-all duration-300 ${
        isWithin50m
          ? 'border-primary/30 cursor-pointer shadow-sm'
          : 'border-border cursor-default opacity-80'
      }`}
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

          {/* Distance badge */}
          {distanceKm !== null && distanceKm !== undefined && (
            <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-background/60 backdrop-blur-sm px-2.5 py-1">
              <Navigation className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-[10px] font-body text-foreground/80">
                {distanceKm < 0.1 ? 'Very near' : `${distanceKm} km`}
              </span>
            </div>
          )}
        </div>
      )}
      <div className="px-5 py-4 space-y-2.5">
        <div className="flex items-center gap-2.5">
          <h3 className="font-display text-lg text-foreground truncate flex-1">{venue.name}</h3>
          <span className="flex items-center gap-1.5 shrink-0">
            <span className={`h-2 w-2 rounded-full ${presence.color} animate-pulse-soft`} />
          </span>
        </div>
        <p className="text-xs text-muted-foreground font-body">{venue.address}</p>

        {/* People & presence info */}
        <div className="flex items-center gap-3">
          {peopleCount !== undefined && (
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-body">
              <Users className="h-3 w-3" strokeWidth={1.5} />
              {presenceLabel || `${peopleCount} inside`}
            </span>
          )}
        </div>

        {venue.snapshot && (
          <p className="text-[12px] leading-relaxed text-secondary-foreground font-body font-light italic">
            {venue.snapshot}
          </p>
        )}

        {/* Join prompt when within 50m */}
        {isWithin50m && (
          <div className="pt-1">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-body bg-primary/10 text-primary">
              You are nearby — tap to join
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
