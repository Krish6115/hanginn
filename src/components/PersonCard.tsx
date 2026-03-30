import { RoomUser } from '@/lib/types';
import { User, Send, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface PersonCardProps {
  user: RoomUser;
  isMatchingRhythm: boolean;
  snoozed: boolean;
  onConnect: () => void;
  onRespond?: (accept: boolean) => void;
}

export function PersonCard({ user, isMatchingRhythm, snoozed, onConnect, onRespond }: PersonCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-4 rounded-2xl border p-4 transition-colors ${
        isMatchingRhythm
          ? 'border-primary/30 bg-terracotta-light'
          : 'border-border bg-card'
      }`}
    >
      {user.photo ? (
        <img src={user.photo} alt="" className="h-12 w-12 rounded-full object-cover" />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-foreground font-display text-lg">
          {user.firstInitial}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-body font-semibold text-foreground">{user.firstInitial}.</span>
          <span className="text-xs text-muted-foreground">{user.ageBand}</span>
          <span className="text-xs text-muted-foreground">· {user.hometown}</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
            isMatchingRhythm
              ? 'bg-primary/15 text-primary'
              : 'bg-secondary text-muted-foreground'
          }`}>
            {user.rhythm}
          </span>
        </div>
      </div>

      <div className="flex-shrink-0">
        {user.connected ? (
          <span className="flex items-center gap-1 text-xs font-medium text-accent">
            <Check className="h-3.5 w-3.5" /> Connected
          </span>
        ) : user.pendingRequest === 'sent' ? (
          <span className="text-xs text-muted-foreground">Sent ✓</span>
        ) : user.pendingRequest === 'received' && onRespond ? (
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" onClick={() => onRespond(false)} className="h-8 w-8 p-0">
              <X className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" onClick={() => onRespond(true)} className="h-8 px-3 text-xs">
              Accept
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={onConnect}
            disabled={snoozed}
            className="h-8 gap-1.5 text-xs"
          >
            <Send className="h-3 w-3" /> Connect
          </Button>
        )}
      </div>
    </motion.div>
  );
}
