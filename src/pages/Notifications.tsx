import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useHanginnStore } from '@/lib/hanginnStore';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { ANCHORS, ICEBREAKERS } from '@/lib/types';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

type Profile = Tables<'profiles'>;
type RequestWithProfiles = Tables<'connection_requests'> & {
  sender: Profile;
  receiver: Profile;
};

const Notifications = () => {
  const { currentProfile, respondToRequest, addToCircle } = useHanginnStore();
  const [requests, setRequests] = useState<RequestWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);

  const [anchorDialog, setAnchorDialog] = useState<string | null>(null);
  const [selectedAnchor, setSelectedAnchor] = useState('');
  const [showIcebreaker, setShowIcebreaker] = useState<{ anchor: string; icebreaker: string; senderId: string; senderName: string } | null>(null);

  // Follow-up prompts for accepted connections
  const [followUpRequest, setFollowUpRequest] = useState<RequestWithProfiles | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!currentProfile) return;
    const { data } = await supabase
      .from('connection_requests')
      .select('*, sender:profiles!connection_requests_sender_id_fkey(*), receiver:profiles!connection_requests_receiver_id_fkey(*)')
      .or(`receiver_id.eq.${currentProfile.id},sender_id.eq.${currentProfile.id}`)
      .order('created_at', { ascending: false });
    setRequests((data as any) || []);
    setLoading(false);
  }, [currentProfile]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Realtime
  useEffect(() => {
    if (!currentProfile) return;
    const sub = supabase
      .channel('notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connection_requests' }, () => fetchRequests())
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [currentProfile, fetchRequests]);

  // Check for follow-up prompts (accepted connections older than 10 min)
  useEffect(() => {
    if (!currentProfile) return;
    const accepted = requests.filter(
      (r) =>
        r.status === 'accepted' &&
        (r.sender_id === currentProfile.id || r.receiver_id === currentProfile.id) &&
        new Date().getTime() - new Date(r.updated_at).getTime() > 10 * 60 * 1000
    );
    if (accepted.length > 0 && !followUpRequest) {
      setFollowUpRequest(accepted[0]);
    }
  }, [requests, currentProfile]);

  const handleAccept = (requestId: string) => {
    setAnchorDialog(requestId);
  };

  const handleAnchorSubmit = async () => {
    if (!anchorDialog || !selectedAnchor) return;
    await respondToRequest(anchorDialog, true, selectedAnchor);
    setAnchorDialog(null);
    setSelectedAnchor('');
    fetchRequests();
  };

  const handleReject = async (requestId: string) => {
    await respondToRequest(requestId, false);
    fetchRequests();
  };

  const handleAddToCircle = async (otherProfileId: string, venueId: string) => {
    if (!currentProfile) return;
    await addToCircle(currentProfile.id, otherProfileId, venueId);
    setFollowUpRequest(null);
  };

  const pendingReceived = requests.filter((r) => r.status === 'pending' && r.receiver_id === currentProfile?.id);
  const acceptedSent = requests.filter((r) => r.status === 'accepted' && r.sender_id === currentProfile?.id);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="max-w-lg mx-auto">
          <h2 className="font-display text-lg text-foreground">Notifications</h2>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-6">
        {!currentProfile ? (
          <p className="text-sm text-muted-foreground font-body text-center py-16">Enter a room to see notifications.</p>
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-16 rounded-2xl bg-secondary animate-pulse" />)}
          </div>
        ) : pendingReceived.length === 0 && acceptedSent.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground font-body text-sm">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingReceived.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground font-display text-base shrink-0">
                  {req.sender.nickname[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body text-foreground">
                    <span className="font-medium">{req.sender.nickname[0]}</span>
                    {req.sender.profession ? `, ${req.sender.profession},` : ''} wants to connect
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => handleReject(req.id)}
                    className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleAccept(req.id)}
                    className="h-8 px-3 rounded-full bg-primary/90 text-primary-foreground text-xs font-body hover:bg-primary transition-colors">
                    Accept
                  </button>
                </div>
              </motion.div>
            ))}

            {acceptedSent.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-primary/10 bg-primary/5 p-4"
              >
                <p className="text-sm font-body text-foreground">
                  Connection accepted{req.receiver_anchor ? ` - they're ${req.receiver_anchor.toLowerCase()}` : ''}
                </p>
                {req.icebreaker && (
                  <p className="text-xs text-muted-foreground font-body mt-1 italic">"{req.icebreaker}"</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Anchor dialog */}
      <Dialog open={!!anchorDialog} onOpenChange={() => setAnchorDialog(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Where are you sitting?</DialogTitle>
            <DialogDescription className="font-body">Share your anchor so they can find you.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 mt-2">
            {ANCHORS.map((a) => (
              <button key={a} onClick={() => setSelectedAnchor(a)}
                className={`rounded-full px-4 py-2 text-sm font-body transition-colors ${
                  selectedAnchor === a ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}>
                {a}
              </button>
            ))}
          </div>
          <button onClick={handleAnchorSubmit} disabled={!selectedAnchor}
            className="w-full mt-4 rounded-xl py-3 text-sm font-body bg-primary/90 text-primary-foreground hover:bg-primary transition-colors disabled:opacity-50">
            Share and get icebreaker
          </button>
        </DialogContent>
      </Dialog>

      {/* Follow-up dialog */}
      <Dialog open={!!followUpRequest} onOpenChange={() => setFollowUpRequest(null)}>
        <DialogContent className="rounded-2xl text-center">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">How did it go?</DialogTitle>
            <DialogDescription className="font-body">
              Did {followUpRequest?.sender_id === currentProfile?.id
                ? followUpRequest?.receiver.nickname
                : followUpRequest?.sender.nickname} meet your vibes?
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-foreground font-body mt-2">Add to my circle</p>
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={() => {
                if (!followUpRequest) return;
                const otherId = followUpRequest.sender_id === currentProfile?.id
                  ? followUpRequest.receiver_id : followUpRequest.sender_id;
                handleAddToCircle(otherId, followUpRequest.venue_id);
              }}
              className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
            >
              <Check className="h-5 w-5" />
            </button>
            <button
              onClick={() => setFollowUpRequest(null)}
              className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notifications;
