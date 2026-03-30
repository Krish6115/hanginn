import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Moon, Sun, Users } from 'lucide-react';
import { ROOMS, RHYTHMS, ANCHORS, ICEBREAKERS, RoomType } from '@/lib/types';
import { useHanginnStore } from '@/lib/hanginnStore';
import { supabase } from '@/integrations/supabase/client';
import { PersonCard } from '@/components/PersonCard';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;
type SessionWithProfile = Tables<'room_sessions'> & { profiles: Profile };

const DigitalRoom = () => {
  const { roomType } = useParams<{ roomType: string }>();
  const [searchParams] = useSearchParams();
  const venueId = searchParams.get('venue') || '';
  const navigate = useNavigate();

  const {
    currentProfile, currentSessionId, joinRoom, leaveRoom,
    updateRhythm, toggleSnooze, sendConnectionRequest, respondToRequest, addToCircle,
    setCurrentSession,
  } = useHanginnStore();

  const room = ROOMS.find((r) => r.type === roomType);
  const rhythms = RHYTHMS[roomType as RoomType] || [];

  const [selectedRhythm, setSelectedRhythm] = useState(rhythms[0] || '');
  const [snoozed, setSnoozed] = useState(false);
  const [sessions, setSessions] = useState<SessionWithProfile[]>([]);
  const [requests, setRequests] = useState<Tables<'connection_requests'>[]>([]);
  const [sessionId, setSessionId] = useState(currentSessionId);
  const [loading, setLoading] = useState(true);

  const [anchorDialog, setAnchorDialog] = useState<string | null>(null); // request ID
  const [selectedAnchor, setSelectedAnchor] = useState('');
  const [showIcebreaker, setShowIcebreaker] = useState<{ anchor: string; icebreaker: string } | null>(null);
  const [followUp, setFollowUp] = useState(false);

  // Join room on mount
  useEffect(() => {
    if (!currentProfile || !venueId || !roomType) {
      navigate(`/rooms/${roomType}/join?venue=${venueId}`);
      return;
    }

    const init = async () => {
      const sid = await joinRoom(currentProfile.id, venueId, roomType, selectedRhythm);
      setSessionId(sid);
      setLoading(false);
    };
    init();

    return () => {
      // Leave room on unmount
      if (sessionId) leaveRoom(sessionId);
    };
  }, []);

  // Fetch sessions in this venue
  const fetchSessions = useCallback(async () => {
    if (!venueId) return;
    const { data } = await supabase
      .from('room_sessions')
      .select('*, profiles(*)')
      .eq('venue_id', venueId)
      .eq('is_active', true)
      .neq('profile_id', currentProfile?.id || '');
    setSessions((data as SessionWithProfile[]) || []);
  }, [venueId, currentProfile]);

  // Fetch connection requests involving me
  const fetchRequests = useCallback(async () => {
    if (!currentProfile || !venueId) return;
    const { data } = await supabase
      .from('connection_requests')
      .select('*')
      .eq('venue_id', venueId)
      .or(`sender_id.eq.${currentProfile.id},receiver_id.eq.${currentProfile.id}`);
    setRequests(data || []);
  }, [currentProfile, venueId]);

  useEffect(() => {
    fetchSessions();
    fetchRequests();
  }, [fetchSessions, fetchRequests]);

  // Real-time subscriptions
  useEffect(() => {
    if (!venueId) return;

    const sessionSub = supabase
      .channel('room-sessions')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'room_sessions',
        filter: `venue_id=eq.${venueId}`,
      }, () => fetchSessions())
      .subscribe();

    const requestSub = supabase
      .channel('connection-requests')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'connection_requests',
        filter: `venue_id=eq.${venueId}`,
      }, (payload) => {
        fetchRequests();
        // Show icebreaker when a request we sent gets accepted
        const row = payload.new as Tables<'connection_requests'>;
        if (row.status === 'accepted' && row.sender_id === currentProfile?.id && row.icebreaker) {
          setShowIcebreaker({
            anchor: row.receiver_anchor || 'Somewhere nearby',
            icebreaker: row.icebreaker,
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sessionSub);
      supabase.removeChannel(requestSub);
    };
  }, [venueId, currentProfile, fetchSessions, fetchRequests]);

  // Follow-up timer (1 min for demo)
  useEffect(() => {
    const timer = setTimeout(() => setFollowUp(true), 60000);
    return () => clearTimeout(timer);
  }, []);

  // Rhythm change
  const handleRhythmChange = async (r: string) => {
    setSelectedRhythm(r);
    if (sessionId) await updateRhythm(sessionId, r);
  };

  // Snooze toggle
  const handleSnooze = async () => {
    const newVal = !snoozed;
    setSnoozed(newVal);
    if (sessionId) await toggleSnooze(sessionId, newVal);
  };

  // Derive person cards from sessions + requests
  const people = useMemo(() => {
    return sessions.map((s) => {
      const profile = s.profiles;
      const sentReq = requests.find((r) => r.sender_id === currentProfile?.id && r.receiver_id === profile.id);
      const receivedReq = requests.find((r) => r.receiver_id === currentProfile?.id && r.sender_id === profile.id && r.status === 'pending');
      const connected = requests.some((r) =>
        r.status === 'accepted' &&
        ((r.sender_id === currentProfile?.id && r.receiver_id === profile.id) ||
         (r.receiver_id === currentProfile?.id && r.sender_id === profile.id))
      );

      return {
        id: profile.id,
        nickname: profile.nickname,
        firstInitial: profile.nickname[0],
        ageBand: profile.age_band,
        hometown: profile.hometown,
        profession: profile.profession,
        photo: profile.photo_url || undefined,
        rhythm: s.rhythm || '',
        connected,
        pendingRequest: sentReq?.status === 'pending' ? 'sent' as const
          : receivedReq ? 'received' as const
          : undefined,
        requestId: receivedReq?.id,
      };
    });
  }, [sessions, requests, currentProfile]);

  const sorted = useMemo(() => {
    const matching = people.filter((u) => u.rhythm === selectedRhythm);
    const others = people.filter((u) => u.rhythm !== selectedRhythm);
    return [...matching, ...others];
  }, [people, selectedRhythm]);

  const handleConnect = async (profileId: string) => {
    if (!currentProfile || !venueId) return;
    await sendConnectionRequest(currentProfile.id, profileId, venueId);
    fetchRequests();
  };

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

  if (!room) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="font-display text-lg text-foreground">{room.icon} {room.label}</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" /> {sessions.length} people here
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleSnooze} className="h-8 gap-1.5 text-xs rounded-full">
            {snoozed ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {snoozed ? 'Go active' : 'Snooze'}
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Your rhythm right now</p>
          <div className="flex flex-wrap gap-2">
            {rhythms.map((r) => (
              <button
                key={r}
                onClick={() => handleRhythmChange(r)}
                className={`rounded-full px-4 py-1.5 text-sm font-body transition-all ${
                  selectedRhythm === r
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </motion.div>

        {snoozed && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 rounded-xl bg-warm p-3 text-center text-sm text-muted-foreground">
            😴 You're on snooze. Connections paused.
          </motion.div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-secondary animate-pulse" />)}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">🏠</p>
            <p className="text-muted-foreground font-body text-sm">No one else is here yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {sorted.map((user) => (
                <PersonCard
                  key={user.id}
                  user={user}
                  isMatchingRhythm={user.rhythm === selectedRhythm}
                  snoozed={snoozed}
                  onConnect={() => handleConnect(user.id)}
                  onRespond={(accept) => {
                    if (accept && user.requestId) handleAccept(user.requestId);
                    else if (user.requestId) handleReject(user.requestId);
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Anchor dialog */}
      <Dialog open={!!anchorDialog} onOpenChange={() => setAnchorDialog(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Where are you sitting?</DialogTitle>
            <DialogDescription>Share your anchor so they can find you.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 mt-2">
            {ANCHORS.map((a) => (
              <button key={a} onClick={() => setSelectedAnchor(a)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  selectedAnchor === a ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}>
                {a}
              </button>
            ))}
          </div>
          <Button onClick={handleAnchorSubmit} disabled={!selectedAnchor} className="w-full mt-4 rounded-xl">
            Share & get icebreaker
          </Button>
        </DialogContent>
      </Dialog>

      {/* Icebreaker dialog */}
      <Dialog open={!!showIcebreaker} onOpenChange={() => setShowIcebreaker(null)}>
        <DialogContent className="rounded-2xl text-center">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">You're connected! 🎉</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="rounded-xl bg-sage-light p-4">
              <p className="text-xs text-muted-foreground mb-1">Their anchor</p>
              <p className="font-body font-semibold text-foreground">{showIcebreaker?.anchor}</p>
            </div>
            <div className="rounded-xl bg-terracotta-light p-4">
              <p className="text-xs text-muted-foreground mb-1">Icebreaker</p>
              <p className="font-body text-sm text-foreground italic">"{showIcebreaker?.icebreaker}"</p>
            </div>
            <Button onClick={() => setShowIcebreaker(null)} className="w-full rounded-xl">Go meet them!</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Follow-up dialog */}
      <Dialog open={followUp} onOpenChange={setFollowUp}>
        <DialogContent className="rounded-2xl text-center">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">How's it going? 👋</DialogTitle>
            <DialogDescription>Did you connect with anyone?</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <Button variant="outline" onClick={() => setFollowUp(false)} className="w-full rounded-xl">Yes! It went great</Button>
            <Button variant="outline" onClick={() => setFollowUp(false)} className="w-full rounded-xl">Still looking</Button>
            <Button variant="outline" onClick={() => { setFollowUp(false); navigate('/circle'); }} className="w-full rounded-xl">
              Add to My Circle
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DigitalRoom;
