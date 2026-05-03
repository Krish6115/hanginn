import { MapPin } from 'lucide-react';
import { Venue, PresenceState } from '@/lib/types';
import { useGeolocation, distanceTo } from '@/hooks/useGeolocation';

interface VenueCardProps {
  venue: Venue;
  onClick: () => void;
}

const PRESENCE_CONFIG: Record<PresenceState, { color: string; label: string; vibe: string; dot: string }> = {
  quiet: { color: 'bg-foreground/60', label: 'Quiet presence', vibe: 'Calm', dot: 'bg-warm/70' },
  flowing: { color: 'bg-blue-400/50', label: 'Flowing', vibe: 'Cozy', dot: 'bg-bronze-light' },
  vibrant: { color: 'bg-orange-400/50', label: 'Vibrant', vibe: 'Lively', dot: 'bg-bronze' },
};

const formatDistance = (m: number) =>
  m < 1000 ? `~${Math.round(m)}m` : `~${(m / 1000).toFixed(1)}km`;

export function VenueCard({ venue, onClick }: VenueCardProps) {
  const presence = PRESENCE_CONFIG[venue.presence];

  const hasGeofence =
    typeof venue.lat === 'number' &&
    typeof venue.lng === 'number' &&
    typeof venue.radius === 'number';

  // Use shared geolocation hook instead of per-card watchPosition.
  // This eliminates 10x GPS listener spam when rendering a list of venue cards.
  const geo = useGeolocation({ enabled: hasGeofence, throttleMs: 5000, maxAccuracy: 80 });

  const probeDistance = hasGeofence
    ? distanceTo(geo, venue.lat!, venue.lng!)
    : null;

  const insideZone =
    hasGeofence &&
    probeDistance !== null &&
    probeDistance <= (venue.radius as number);

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
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          {/* Venue identity marker */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-background/60 backdrop-blur-sm px-2.5 py-1">
            <div className="h-4 w-4 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-[8px] font-display text-foreground">{venue.name[0]}</span>
            </div>
            <span className="text-[10px] font-body text-foreground">{venue.name.split(' ')[0]}</span>
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
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/40 px-2.5 py-0.5 text-[10px] font-body font-light text-secondary-foreground tracking-wide">
            <span className={`h-1.5 w-1.5 rounded-full ${presence.dot} animate-pulse-soft`} />
            Vibe: {presence.vibe}
          </span>
        </div>
        {venue.roomType !== 'residential' && (
          <p className="text-xs text-muted-foreground font-body">{venue.address}</p>
        )}
        <p className="text-[12px] leading-relaxed text-secondary-foreground font-body font-light italic">
          {venue.snapshot || (venue.roomType === 'residential' ? 'People around you coordinating' : '')}
        </p>

        {/* Inline geofence probe — UI only; entry gating still happens on the verify page */}
        {hasGeofence && (
          <div className="pt-2">
            {probeDistance === null ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-body font-light text-muted-foreground/70">
                <MapPin className="h-3 w-3" strokeWidth={1.5} />
                Sensing your proximity…
              </span>
            ) : insideZone ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-body text-primary animate-bronze-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-soft" />
                Tap to enter
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-body font-light text-muted-foreground">
                <MapPin className="h-3 w-3" strokeWidth={1.5} />
                {formatDistance(probeDistance)} away — Move closer to unlock
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
