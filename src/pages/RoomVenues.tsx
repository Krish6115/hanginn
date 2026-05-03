import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Calendar, MapPin } from 'lucide-react';
import { ROOMS, INTENTS, AGE_BANDS, RoomType, getPresenceState, generateVenueSnapshot } from '@/lib/types';
import { useHanginnStore } from '@/lib/hanginnStore';
import { VenueCard } from '@/components/VenueCard';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Venue } from '@/lib/types';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

interface EventItem {
  id: string;
  title: string;
  description: string;
  intent: string;
  vibe: string;
  event_date: string;
  creator_nickname: string;
  creator_photo: string | null;
}

const RoomVenues = () => {
  const { roomType } = useParams<{ roomType: string }>();
  const navigate = useNavigate();
  const { fetchVenues, currentProfile } = useHanginnStore();
  const room = ROOMS.find((r) => r.type === roomType);

  const [tab, setTab] = useState<'venues' | 'events'>('venues');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  // Touch swipe
  const [touchStart, setTouchStart] = useState(0);

  const handleSwipe = (dir: 'left' | 'right') => {
    if (dir === 'left' && tab === 'venues') setTab('events');
    if (dir === 'right' && tab === 'events') setTab('venues');
  };

  useEffect(() => {
    if (!roomType) return;
    const load = async () => {
      const v = await fetchVenues(roomType);
      const enriched = await Promise.all(
        v.map(async (venue) => {
          const { data: sessions } = await supabase
            .from('room_sessions')
            .select('rhythm')
            .eq('venue_id', venue.id)
            .eq('is_active', true);

          const intents = (sessions || []).map((s) => s.rhythm).filter(Boolean) as string[];
          const count = intents.length;
          const presence = getPresenceState(count);
          const snapshot = generateVenueSnapshot(intents, roomType as RoomType);

          // TEMP MOCK FOR LOCAL TESTING
          if (venue.id === '13af2c4b-9c3b-4e69-b3cd-8a692fba89ab') {
            venue.lat = 12.9753;
            venue.lng = 77.6010;
            (venue as any).radius_meters = 150;
          }

          return {
            id: venue.id,
            name: venue.name,
            image: venue.image_url || '',
            presence,
            snapshot,
            roomType: venue.room_type as RoomType,
            address: venue.address,
            lat: venue.lat ? Number(venue.lat) : undefined,
            lng: venue.lng ? Number(venue.lng) : undefined,
            radius: (venue as any).radius_meters ? Number((venue as any).radius_meters) : undefined,
          };
        })
      );
      setVenues(enriched);
      setLoading(false);
    };
    load();
    loadEvents();
  }, [roomType]);

  const loadEvents = async () => {
    if (!roomType) return;
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('room_type', roomType)
      .order('event_date', { ascending: true });

    if (data) {
      const profileIds = [...new Set(data.map((e) => e.creator_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nickname, photo_url')
        .in('id', profileIds);

      const profileMap: Record<string, { nickname: string; photo_url: string | null }> = {};
      (profiles || []).forEach((p) => { profileMap[p.id] = p; });

      setEvents(data.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description || '',
        intent: e.intent || '',
        vibe: e.vibe || '',
        event_date: e.event_date,
        creator_nickname: profileMap[e.creator_id]?.nickname || 'Someone',
        creator_photo: profileMap[e.creator_id]?.photo_url || null,
      })));
    }
  };

  if (!room) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-background"
      onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const diff = touchStart - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 60) handleSwipe(diff > 0 ? 'left' : 'right');
      }}
    >
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="font-display text-lg text-foreground">{room.label}</h2>
            <p className="text-xs text-muted-foreground">{room.venueLabel}</p>
          </div>
        </div>
      </header>

      {/* Venues / Events toggle */}
      <div className="max-w-lg mx-auto px-6 pt-5">
        <div className="flex rounded-xl bg-secondary p-1">
          <button
            onClick={() => setTab('venues')}
            className={`flex-1 rounded-lg py-2 text-sm font-body transition-all duration-300 ${
              tab === 'venues' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Venues
          </button>
          <button
            onClick={() => setTab('events')}
            className={`flex-1 rounded-lg py-2 text-sm font-body transition-all duration-300 ${
              tab === 'events' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Events
          </button>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-6 py-6">
        <AnimatePresence mode="wait">
          {tab === 'venues' ? (
            <motion.div key="venues" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {loading ? (
                <div className="space-y-5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-44 rounded-2xl bg-secondary animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {venues.map((venue, i) => (
                    <motion.div key={venue.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                      <VenueCard venue={venue} onClick={() => navigate(`/rooms/${roomType}/verify?venue=${venue.id}`)} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="events" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="mb-6">
                <button
                  onClick={() => {
                    if (!currentProfile) {
                      navigate(`/rooms/${roomType}/join?venue=event`);
                      return;
                    }
                    setShowCreateEvent(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-sm font-body text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-500"
                >
                  <Plus className="h-4 w-4" />
                  Create an event
                </button>
              </div>

              {events.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground font-body text-sm">No events yet. Be the first to create one.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event, i) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="rounded-2xl border border-border bg-card p-5 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <h3 className="font-display text-base text-foreground">{event.title}</h3>
                        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-body shrink-0 ml-3">
                          <Calendar className="h-3 w-3" />
                          {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                      {event.description && (
                        <p className="text-xs text-muted-foreground font-body leading-relaxed">{event.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        {event.intent && (
                          <span className="rounded-full px-3 py-0.5 text-[11px] font-body bg-primary/10 text-primary">
                            {event.intent}
                          </span>
                        )}
                        {event.vibe && (
                          <span className="text-[11px] text-muted-foreground/70 font-body italic">{event.vibe}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        {event.creator_photo ? (
                          <div className="h-5 w-5 rounded-full overflow-hidden select-none pointer-events-none">
                            <img src={event.creator_photo} alt="" className="h-full w-full object-cover" draggable={false} />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full bg-secondary flex items-center justify-center">
                            <span className="text-[8px] font-display text-foreground">{event.creator_nickname[0]}</span>
                          </div>
                        )}
                        <span className="text-[11px] text-muted-foreground font-body">by {event.creator_nickname}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <CreateEventDialog
        open={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
        roomType={roomType!}
        onCreated={() => { setShowCreateEvent(false); loadEvents(); }}
      />
    </div>
  );
};

function CreateEventDialog({ open, onClose, roomType, onCreated }: {
  open: boolean; onClose: () => void; roomType: string; onCreated: () => void;
}) {
  const { currentProfile } = useHanginnStore();
  const intents = INTENTS[roomType as RoomType] || [];
  const [form, setForm] = useState({
    title: '', description: '', intent: '', vibe: '',
    date: '', time: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.title || !form.date || !form.time || !currentProfile) return;
    setSubmitting(true);
    try {
      const eventDate = new Date(`${form.date}T${form.time}`).toISOString();
      await supabase.from('events').insert({
        room_type: roomType,
        creator_id: currentProfile.id,
        title: form.title,
        description: form.description,
        intent: form.intent,
        vibe: form.vibe,
        event_date: eventDate,
      });
      onCreated();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Create an event</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block font-body">Event title</Label>
            <Input value={form.title} onChange={(e) => update('title', e.target.value)}
              placeholder="What's happening?" className="bg-secondary border-border" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block font-body">Description (optional)</Label>
            <Input value={form.description} onChange={(e) => update('description', e.target.value)}
              placeholder="A brief note about the event" className="bg-secondary border-border" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1.5 block font-body">Date</Label>
              <Input type="date" value={form.date} onChange={(e) => update('date', e.target.value)}
                className="bg-secondary border-border" />
            </div>
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1.5 block font-body">Time</Label>
              <Input type="time" value={form.time} onChange={(e) => update('time', e.target.value)}
                className="bg-secondary border-border" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block font-body">Intent</Label>
            <div className="flex flex-wrap gap-2">
              {intents.map((intent) => (
                <button key={intent} onClick={() => update('intent', intent)}
                  className={`rounded-full px-4 py-1.5 text-sm font-body transition-all duration-300 ${
                    form.intent === intent ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}>
                  {intent}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block font-body">Add your vibe (optional)</Label>
            <Input value={form.vibe} onChange={(e) => update('vibe', e.target.value.slice(0, 60))}
              placeholder="Set the mood" maxLength={60} className="bg-secondary border-border" />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!form.title || !form.date || !form.time || submitting}
            className={`w-full rounded-2xl py-3.5 text-sm font-body font-medium transition-all duration-500 ${
              form.title && form.date && form.time && !submitting
                ? 'bg-primary/90 text-primary-foreground hover:bg-primary'
                : 'bg-secondary text-muted-foreground cursor-not-allowed'
            }`}
          >
            {submitting ? 'Creating...' : 'Create event'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default RoomVenues;
