import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Briefcase, UserMinus, Ban } from 'lucide-react';
import { useHanginnStore } from '@/lib/hanginnStore';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

interface CircleEntry {
  id: string;
  created_at: string;
  connected_profile_id: string;
  connected_profile: {
    id: string;
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
  const { currentProfile } = useHanginnStore();
  const [circle, setCircle] = useState<CircleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{ type: 'remove' | 'block'; entry: CircleEntry } | null>(null);

  const loadCircle = async () => {
    if (!currentProfile) { setLoading(false); return; }
    const { data } = await supabase
      .from('circles')
      .select('*, connected_profile:profiles!circles_connected_profile_id_fkey(*), venue:venues!circles_venue_id_fkey(*)')
      .eq('profile_id', currentProfile.id)
      .order('created_at', { ascending: false });
    setCircle((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { loadCircle(); }, [currentProfile]);

  const handleRemove = async (entry: CircleEntry) => {
    await supabase.from('circles').delete().eq('id', entry.id);
    // Also delete the reverse entry
    await supabase.from('circles').delete()
      .eq('profile_id', entry.connected_profile_id)
      .eq('connected_profile_id', currentProfile!.id);
    setConfirmAction(null);
    loadCircle();
  };

  const handleBlock = async (entry: CircleEntry) => {
    // Remove from circle
    await handleRemove(entry);
    // Add to blocked
    await supabase.from('blocked_users').insert({
      blocker_id: currentProfile!.id,
      blocked_id: entry.connected_profile_id,
    });
    setConfirmAction(null);
  };

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
                <div className="flex-1 min-w-0">
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
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => setConfirmAction({ type: 'remove', entry })}
                    className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    title="Remove from circle"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirmAction({ type: 'block', entry })}
                    className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                    title="Block user"
                  >
                    <Ban className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">
              {confirmAction?.type === 'block' ? 'Block this person?' : 'Remove from circle?'}
            </DialogTitle>
            <DialogDescription className="font-body">
              {confirmAction?.type === 'block'
                ? 'This will remove them from your circle and prevent future interactions.'
                : 'This will remove them from your circle.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setConfirmAction(null)}
              className="flex-1 rounded-2xl py-3 text-sm font-body text-muted-foreground border border-border transition-colors">
              Cancel
            </button>
            <button
              onClick={() => {
                if (confirmAction?.type === 'block') handleBlock(confirmAction.entry);
                else if (confirmAction) handleRemove(confirmAction.entry);
              }}
              className="flex-1 rounded-2xl py-3 text-sm font-body bg-destructive/90 text-destructive-foreground hover:bg-destructive transition-colors"
            >
              {confirmAction?.type === 'block' ? 'Block' : 'Remove'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyCircle;
