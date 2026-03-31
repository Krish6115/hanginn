import { RoomUser } from '@/lib/types';
import { Send, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface PersonCardProps {
  user: RoomUser;
  isMatchingIntent: boolean;
  snoozed: boolean;
  onConnect: () => void;
  onRespond?: (accept: boolean) => void;
}

export function PersonCard({ user, isMatchingIntent, snoozed, onConnect, onRespond }: PersonCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-4 rounded-2xl border p-4 transition-all duration-500 ${
        isMatchingIntent
          ? 'border-primary/20 bg-primary/5'
          : 'border-border bg-card'
      }`}
    >
      {/* Non-expandable avatar */}
      {user.photo ? (
        <div className="h-11 w-11 rounded-full overflow-hidden shrink-0 select-none pointer-events-none">
          <img
            src={user.photo}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      ) : (
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-foreground font-display text-base shrink-0">
          {user.firstInitial}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-body font-medium text-foreground text-sm">{user.firstInitial}.</span>
          <span className="text-[11px] text-muted-foreground font-body">{user.ageBand}</span>
          {user.disclosureLevel >= 2 && user.hometown && (
            <span className="text-[11px] text-muted-foreground font-body">from {user.hometown}</span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2 flex-wrap">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-body ${
            isMatchingIntent
              ? 'bg-primary/10 text-primary'
              : 'bg-secondary text-muted-foreground'
          }`}>
            {user.intent}
          </span>
          {user.vibe && (
            <span className="text-[11px] text-muted-foreground/70 font-body italic truncate max-w-[140px]">
              {user.vibe}
            </span>
          )}
        </div>
        {user.disclosureLevel >= 2 && user.profession && (
          <p className="text-[10px] text-muted-foreground/60 font-body mt-1">{user.profession}</p>
        )}
      </div>

      <div className="flex-shrink-0">
        {user.connected ? (
          <span className="flex items-center gap-1 text-xs font-body text-primary/80">
            <Check className="h-3.5 w-3.5" /> Connected
          </span>
        ) : user.pendingRequest === 'sent' ? (
          <span className="text-[11px] text-muted-foreground font-body">Sent</span>
        ) : user.pendingRequest === 'received' && onRespond ? (
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" onClick={() => onRespond(false)} className="h-7 w-7 p-0 rounded-full border-border">
              <X className="h-3 w-3" />
            </Button>
            <Button size="sm" onClick={() => onRespond(true)} className="h-7 px-3 text-[11px] rounded-full bg-primary/90 hover:bg-primary">
              Accept
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={onConnect}
            disabled={snoozed}
            className="h-7 gap-1 text-[11px] rounded-full border-border font-body"
          >
            <Send className="h-3 w-3" /> Connect
          </Button>
        )}
      </div>
    </motion.div>
  );
}
