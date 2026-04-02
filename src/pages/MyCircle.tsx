import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Briefcase } from 'lucide-react';
import { useHanginnStore } from '@/lib/hanginnStore';

interface CircleEntry {
  id: string;
  created_at: string;
  connected_profile: {
    nickname: string;
    photo_url: string | null;
    hometown: string;
    profession: string;
  };
  venue: {
    name: string;
  };
}

const MyCircle = () => {
  const { currentProfile, fetchCircle } = useHanginnStore();
  const [circle, setCircle] = useState<CircleEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentProfile) {
      setLoading(false);
      return;
    }
    fetchCircle(currentProfile.id).then((data) => {
      setCircle(data as any);
      setLoading(false);
    });
  }, [currentProfile]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="max-w-lg mx-auto">
          <h2 className="font-display text-lg text-foreground">My Circle</h2>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-20 rounded-2xl bg-secondary animate-pulse" />)}
          </div>
        ) : circle.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <p className="text-muted-foreground font-body text-sm">
              {currentProfile ? 'No connections yet. Enter a room to start meeting people.' : 'Enter a room first to start building your circle.'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {circle.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
              >
                {entry.connected_profile.photo_url ? (
                  <div className="h-12 w-12 rounded-full overflow-hidden shrink-0 select-none pointer-events-none">
                    <img src={entry.connected_profile.photo_url} alt="" className="h-full w-full object-cover" draggable={false} />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-foreground font-display text-lg">
                    {entry.connected_profile.nickname[0]}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-body font-semibold text-foreground">{entry.connected_profile.nickname}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {entry.connected_profile.hometown && (
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{entry.connected_profile.hometown}</span>
                    )}
                    {entry.connected_profile.profession && (
                      <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{entry.connected_profile.profession}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Met at {entry.venue.name}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyCircle;
