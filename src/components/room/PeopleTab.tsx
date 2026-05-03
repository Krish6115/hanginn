import { motion, AnimatePresence } from 'framer-motion';
import { PersonCard } from '@/components/PersonCard';
import { RoomUser } from '@/lib/types';
import { useNavigate } from 'react-router-dom';

interface PeopleTabProps {
  intents: string[];
  selectedIntent: string;
  onIntentChange: (intent: string) => void;
  snoozed: boolean;
  showReciprocity: boolean;
  currentDisclosure: number;
  loading: boolean;
  sortedPeople: RoomUser[];
  onConnect: (profileId: string) => void;
  onRespond: (requestId: string, accept: boolean) => void;
}

export function PeopleTab({
  intents,
  selectedIntent,
  onIntentChange,
  snoozed,
  showReciprocity,
  currentDisclosure,
  loading,
  sortedPeople,
  onConnect,
  onRespond,
}: PeopleTabProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      key="people"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="mb-6">
        <p className="text-xs text-muted-foreground mb-2 font-body">
          Your intent right now
        </p>
        <div className="flex flex-wrap gap-2">
          {intents.map((intent) => (
            <button
              key={intent}
              onClick={() => onIntentChange(intent)}
              className={`rounded-full px-4 py-1.5 text-sm font-body transition-all duration-300 ${
                selectedIntent === intent
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {intent}
            </button>
          ))}
        </div>
      </div>

      {snoozed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-4 rounded-xl bg-secondary p-3 text-center text-sm text-muted-foreground font-body"
        >
          You're on snooze. Connections paused.
        </motion.div>
      )}

      <AnimatePresence>
        {showReciprocity && currentDisclosure < 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 rounded-xl border border-primary/10 bg-primary/5 p-4"
          >
            <p className="text-sm text-foreground font-body">
              Share a little more to unlock more
            </p>
            <p className="text-xs text-muted-foreground font-body mt-1">
              Add your hometown and profession to see fuller profiles.
            </p>
            <button
              onClick={() => navigate('/profile')}
              className="mt-2 text-xs text-primary font-body underline underline-offset-4"
            >
              Add details
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-secondary animate-pulse" />
          ))}
        </div>
      ) : sortedPeople.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground font-body text-sm">
            No one else is here yet. Be the first.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {sortedPeople.map((user) => (
              <PersonCard
                key={user.id}
                user={user}
                isMatchingIntent={user.intent === selectedIntent}
                snoozed={snoozed}
                onConnect={() => onConnect(user.id)}
                onRespond={(accept) => {
                  if (user.requestId) {
                    onRespond(user.requestId, accept);
                  }
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
