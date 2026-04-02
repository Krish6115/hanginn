import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import { ROOMS, INTENTS, ANCHORS, RoomType } from '@/lib/types';
import { useHanginnStore } from '@/lib/hanginnStore';
import { supabase } from '@/integrations/supabase/client';
import { PersonCard } from '@/components/PersonCard';
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
  const userIntent = searchParams.get('intent') || '';
  const userVibe = searchParams.get('vibe') || '';
  const navigate = useNavigate();

  const {
    currentProfile, currentSessionId, joinRoom, leaveRoom,
    updateRhythm, toggleSnooze, sendConnectionRequest, respondToRequest,
    saveSessionState, updateProfile,
  } = useHanginnStore();

  const room = ROOMS.find((r) => r.type === roomType);
  const intents = INTENTS[roomType as RoomType] || [];

  const [selectedIntent, setSelectedIntent] = useState(userIntent || intents[0] || '');
  const [snoozed, setSnoozed] = useState(false);
  const [sessions, setSessions] = useState<SessionWithProfile[]>([]);
  const [requests, setRequests] = useState<Tables<'connection_requests'>[]>([]);
  const [sessionId, setSessionId] = useState(currentSessionId);
  const [loading, setLoading] = useState(true);
  const [showReciprocity, setShowReciprocity] = useState(false);

  const [anchorDialog, setAnchorDialog] = useState<string | null>(null);
  const [selectedAnchor, setSelectedAnchor] = useState('');
  const [showIcebreaker, setShowIcebreaker] = useState<{ anchor: string; icebreaker: string } | null>(null);

  useEffect(() => {
    if (!currentProfile || !venueId || !roomType) {
      navigate(`/rooms/${roomType}/join?venue=${venueId}`);
      return;
    }

    const init = async () => {
      const sid = await joinRoom(currentProfile.id, venueId, roomType, selectedIntent);
      setSessionId(sid);
      setLoading(false);
      saveSessionState({ roomType, venueId, step: 'room', intent: selectedIntent, vibe: userVibe });
    };
    init();

    const reciprocityTimer = setTimeout(() => setShowReciprocity(true), 15000);

    return () => {
      clearTimeout(reciprocityTimer);
      if (sessionId) leaveRoom(sessionId);
    };
  }, []);

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

  useEffect(() => {
    if (!venueId) return;
    const sessionSub = supabase
      .channel('room-sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_sessions', filter: `venue_id=eq.${venueId}` }, () => fetchSessions())
      .subscribe();
    const requestSub = supabase
      .channel('connection-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connection_requests', filter: `venue_id=eq.${venueId}` }, (payload) => {
        fetchRequests();
        const row = payload.new as Tables<'connection_requests'>;
        if (row.status === 'accepted' && row.sender_id === currentProfile?.id && row.icebreaker) {
          setShowIcebreaker({ anchor: row.receiver_anchor || 'Somewhere nearby', icebreaker: row.icebreaker });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(sessionSub); supabase.removeChannel(requestSub); };
  }, [venueId, currentProfile, fetchSessions, fetchRequests]);

  const handleIntentChange = async (intent: string) => {
    setSelectedIntent(intent);
    if (sessionId) await updateRhythm(sessionId, intent);
  };

  const handleSnooze = async () => {
    const newVal = !snoozed;
    setSnoozed(newVal);
    if (sessionId) await toggleSnooze(sessionId, newVal);
  };

  const currentDisclosure = useMemo(() => {
    return (currentProfile?.hometown && currentProfile?.profession) ? 2 : 1;
  }, [currentProfile]);

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
      const otherDisclosure = (profile.hometown && profile.profession) ? 2 : 1;
      const visibleLevel = Math.min(currentDisclosure, otherDisclosure);

      return {
        id: profile.id,
        nickname: profile.nickname,
        firstInitial: profile.nickname[0],
        ageBand: profile.age_band,
        hometown: profile.hometown,
        profession: profile.profession,
        photo: profile.photo_url || undefined,
        intent: s.rhythm || '',
        vibe: undefined,
        connected,
        pendingRequest: sentReq?.status === 'pending' ? 'sent' as const
          : receivedReq ? 'received' as const
          : undefined,
        requestId: receivedReq?.id,
        disclosureLevel: visibleLevel,
      };
    });
  }, [sessions, requests, currentProfile, currentDisclosure]);

  const sorted = useMemo(() => {
    const matching = people.filter((u) => u.intent === selectedIntent);
    const others = people.filter((u) => u.intent !== selectedIntent);
    return [...matching, ...others];
  }, [people, selectedIntent]);

  const handleConnect = async (profileId: string) => {
    if (!currentProfile || !venueId) return;
    await sendConnectionRequest(currentProfile.id, profileId, venueId);
    fetchRequests();
  };

  const handleAccept = (requestId: string) => { setAnchorDialog(requestId); };
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
      <style>{`
        .protected-room { -webkit-user-select: none; user-select: none; }
        .protected-room img { pointer-events: none; -webkit-touch-callout: none; }
      `}</style>

      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => { if (sessionId) leaveRoom(sessionId); navigate('/'); }} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="font-display text-lg text-foreground">{room.label}</h2>
              <p className="text-xs text-muted-foreground font-body">
                {sessions.length === 0 ? 'Just you for now' : sessions.length === 1 ? 'Someone else is here' : 'A few people are here'}
              </p>
            </div>
          </div>
          <button onClick={handleSnooze} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-body rounded-full border border-border px-3 py-1.5 transition-colors">
            {snoozed ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {snoozed ? 'Go active' : 'Snooze'}
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-6 protected-room">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <p className="text-xs text-muted-foreground mb-2 font-body">Your intent right now</p>
          <div className="flex flex-wrap gap-2">
            {intents.map((intent) => (
              <button key={intent} onClick={() => handleIntentChange(intent)}
                className={`rounded-full px-4 py-1.5 text-sm font-body transition-all duration-300 ${
                  selectedIntent === intent ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}>
                {intent}
              </button>
            ))}
          </div>
        </motion.div>

        {snoozed && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 rounded-xl bg-secondary p-3 text-center text-sm text-muted-foreground font-body">
            You're on snooze. Connections paused.
          </motion.div>
        )}

        <AnimatePresence>
          {showReciprocity && currentDisclosure < 2 && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="mb-4 rounded-xl border border-primary/10 bg-primary/5 p-4">
              <p className="text-sm text-foreground font-body">Share a little more to unlock more</p>
              <p className="text-xs text-muted-foreground font-body mt-1">Add your hometown and profession to see fuller profiles.</p>
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
            {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-secondary animate-pulse" />)}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground font-body text-sm">No one else is here yet. Be the first.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {sorted.map((user) => (
                <PersonCard
                  key={user.id}
                  user={user}
                  isMatchingIntent={user.intent === selectedIntent}
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

      <Dialog open={!!showIcebreaker} onOpenChange={() => setShowIcebreaker(null)}>
        <DialogContent className="rounded-2xl text-center">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">You're connected</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="rounded-xl bg-secondary p-4">
              <p className="text-xs text-muted-foreground mb-1 font-body">Their anchor</p>
              <p className="font-body font-medium text-foreground">{showIcebreaker?.anchor}</p>
            </div>
            <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
              <p className="text-xs text-muted-foreground mb-1 font-body">Icebreaker</p>
              <p className="font-body text-sm text-foreground italic">"{showIcebreaker?.icebreaker}"</p>
            </div>
            <button onClick={() => setShowIcebreaker(null)}
              className="w-full rounded-xl py-3 text-sm font-body bg-primary/90 text-primary-foreground hover:bg-primary transition-colors">
              Go meet them
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DigitalRoom;
