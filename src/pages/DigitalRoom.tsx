import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Moon, Sun, Users } from 'lucide-react';
import { ROOMS, RHYTHMS, ANCHORS, ICEBREAKERS, RoomType } from '@/lib/types';
import { getRoomUsers } from '@/lib/mockData';
import { useHanginnStore } from '@/lib/hanginnStore';
import { PersonCard } from '@/components/PersonCard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const DigitalRoom = () => {
  const { roomType } = useParams<{ roomType: string }>();
  const navigate = useNavigate();
  const {
    userProfile, roomUsers, snoozed, setRoomUsers,
    updateRhythm, toggleSnooze, sendConnectionRequest, respondToRequest,
  } = useHanginnStore();

  const room = ROOMS.find((r) => r.type === roomType);
  const rhythms = RHYTHMS[roomType as RoomType] || [];

  const [selectedRhythm, setSelectedRhythm] = useState(rhythms[0] || '');
  const [anchorDialog, setAnchorDialog] = useState<string | null>(null);
  const [selectedAnchor, setSelectedAnchor] = useState('');
  const [showIcebreaker, setShowIcebreaker] = useState<{ userId: string; anchor: string; icebreaker: string } | null>(null);
  const [followUp, setFollowUp] = useState(false);

  useEffect(() => {
    if (!userProfile) {
      navigate(`/rooms/${roomType}/join`);
      return;
    }
    updateRhythm(selectedRhythm);
    const users = getRoomUsers(roomType as RoomType, selectedRhythm, rhythms);
    // Simulate one incoming request
    users[3] = { ...users[3], pendingRequest: 'received' };
    setRoomUsers(users);
  }, [roomType, selectedRhythm]);

  // Follow-up timer
  useEffect(() => {
    const timer = setTimeout(() => setFollowUp(true), 60000); // 1 min for demo (20 min in prod)
    return () => clearTimeout(timer);
  }, []);

  const sorted = useMemo(() => {
    const matching = roomUsers.filter((u) => u.rhythm === selectedRhythm);
    const others = roomUsers.filter((u) => u.rhythm !== selectedRhythm);
    return [...matching, ...others];
  }, [roomUsers, selectedRhythm]);

  const handleConnect = (userId: string) => {
    sendConnectionRequest(userId);
  };

  const handleAccept = (userId: string) => {
    respondToRequest(userId, true);
    setAnchorDialog(userId);
  };

  const handleAnchorSubmit = () => {
    if (!anchorDialog || !selectedAnchor) return;
    const icebreaker = ICEBREAKERS[Math.floor(Math.random() * ICEBREAKERS.length)];
    setShowIcebreaker({ userId: anchorDialog, anchor: selectedAnchor, icebreaker });
    setAnchorDialog(null);
    setSelectedAnchor('');
  };

  if (!room) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="font-display text-lg text-foreground">{room.icon} {room.label}</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" /> {roomUsers.length} people here
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSnooze}
              className="h-8 gap-1.5 text-xs rounded-full"
            >
              {snoozed ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              {snoozed ? 'Go active' : 'Snooze'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-6">
        {/* Rhythm selector */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Your rhythm right now</p>
          <div className="flex flex-wrap gap-2">
            {rhythms.map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRhythm(r)}
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
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 rounded-xl bg-warm p-3 text-center text-sm text-muted-foreground"
          >
            😴 You're on snooze. Connections paused.
          </motion.div>
        )}

        {/* People list */}
        <div className="space-y-3">
          <AnimatePresence>
            {sorted.map((user) => (
              <PersonCard
                key={user.id}
                user={user}
                isMatchingRhythm={user.rhythm === selectedRhythm}
                snoozed={snoozed}
                onConnect={() => handleConnect(user.id)}
                onRespond={(accept) => accept ? handleAccept(user.id) : respondToRequest(user.id, false)}
              />
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Anchor selection dialog */}
      <Dialog open={!!anchorDialog} onOpenChange={() => setAnchorDialog(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Where are you sitting?</DialogTitle>
            <DialogDescription>Share your anchor so they can find you.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 mt-2">
            {ANCHORS.map((a) => (
              <button
                key={a}
                onClick={() => setSelectedAnchor(a)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  selectedAnchor === a
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
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
              <p className="font-body font-semibold text-foreground">{ANCHORS[Math.floor(Math.random() * ANCHORS.length)]}</p>
            </div>
            <div className="rounded-xl bg-terracotta-light p-4">
              <p className="text-xs text-muted-foreground mb-1">Icebreaker</p>
              <p className="font-body text-sm text-foreground italic">"{showIcebreaker?.icebreaker}"</p>
            </div>
            <Button onClick={() => setShowIcebreaker(null)} className="w-full rounded-xl">
              Go meet them!
            </Button>
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
            <Button variant="outline" onClick={() => setFollowUp(false)} className="w-full rounded-xl">
              Yes! It went great
            </Button>
            <Button variant="outline" onClick={() => setFollowUp(false)} className="w-full rounded-xl">
              Still looking
            </Button>
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
