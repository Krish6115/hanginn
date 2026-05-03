import { ArrowLeft, Moon, Sun } from 'lucide-react';
import { Room } from '@/lib/types';
import { useHanginnStore } from '@/lib/hanginnStore';

interface RoomHeaderProps {
  room: Room;
  venueName: string;
  sessionCount: number;
  snoozed: boolean;
  onSnoozeToggle: () => void;
  onLeave: () => void;
}

export function RoomHeader({
  room,
  venueName,
  sessionCount,
  snoozed,
  onSnoozeToggle,
  onLeave,
}: RoomHeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-xl border-b border-border/60 px-6 py-4">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onLeave}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h2 className="font-display text-base text-foreground truncate tracking-wide">
              {venueName ? (
                <>
                  {venueName} <span className="text-muted-foreground/60 mx-1">·</span>{' '}
                  <span className="text-foreground/80">{room.label}</span>
                </>
              ) : (
                room.label
              )}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bronze/60 opacity-70" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-bronze" />
              </span>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80 font-body">
                {sessionCount === 0
                  ? 'Quiet · just you'
                  : sessionCount === 1
                  ? 'Live · someone is here'
                  : 'Live · a few inside'}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={onSnoozeToggle}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-body rounded-full border border-border/60 px-3 py-1.5 transition-colors shrink-0"
        >
          {snoozed ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          {snoozed ? 'Go active' : 'Snooze'}
        </button>
      </div>
    </header>
  );
}
