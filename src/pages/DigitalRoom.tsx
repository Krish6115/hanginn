import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ROOMS, RoomUser, PresenceState } from '@/lib/types';
import { useHanginnStore } from '@/lib/hanginnStore';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

import { RoomHeader } from '@/components/room/RoomHeader';
import { PeopleTab } from '@/components/room/PeopleTab';
import { ChatTab, ChatMessage } from '@/components/room/ChatTab';
import { AnchorDialog } from '@/components/room/AnchorDialog';
import { IcebreakerDialog } from '@/components/room/IcebreakerDialog';
import { useRoomSubscriptions } from '@/hooks/useRoomSubscriptions';

type Profile = Tables<'profiles'>;
type RequestWithProfiles = Tables<'connection_requests'> & {
  sender: Profile;
  receiver: Profile;
};

const DigitalRoom = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const venueId = searchParams.get('venue');
  const initialIntent = searchParams.get('intent') || '';

  const {
    currentProfile,
    currentSessionId,
    joinRoom,
    leaveRoom,
    updateRhythm,
    toggleSnooze,
    sendConnectionRequest,
    respondToRequest,
  } = useHanginnStore();

  const [activeTab, setActiveTab] = useState<'people' | 'chat'>('people');
  const [loading, setLoading] = useState(true);
  const [snoozed, setSnoozed] = useState(false);
  
  // Data state
  const [people, setPeople] = useState<RoomUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [requests, setRequests] = useState<RequestWithProfiles[]>([]);
  
  // Venue state
  const [venueName, setVenueName] = useState('');
  const [roomDef, setRoomDef] = useState(ROOM_TYPES[0]);
  const [selectedIntent, setSelectedIntent] = useState(initialIntent || ROOM_TYPES[0].intents[0]);

  // Dialog state
  const [anchorDialog, setAnchorDialog] = useState<string | null>(null); // profileId of person we're connecting with
  const [selectedAnchor, setSelectedAnchor] = useState('');
  const [showIcebreaker, setShowIcebreaker] = useState<{ anchor: string; icebreaker: string; senderName: string } | null>(null);

  // Initialize room and fetch data
  useEffect(() => {
    if (!currentProfile || !venueId) {
      navigate('/');
      return;
    }

    const init = async () => {
      // 1. Fetch venue to get room type
      const { data: venue } = await supabase
        .from('venues')
        .select('name, room_type')
        .eq('id', venueId)
        .single();

      if (!venue) {
        navigate('/');
        return;
      }

      setVenueName(venue.name);
      const def = ROOMS.find((r) => r.type === venue.room_type) || ROOMS[0];
      setRoomDef(def);
      if (!initialIntent) setSelectedIntent(def.intents[0]);

      // 2. Join session if not already in one
      if (!currentSessionId) {
        try {
          await joinRoom(currentProfile.id, venueId, venue.room_type, initialIntent || def.intents[0]);
        } catch (e) {
          // Handled by store
        }
      }

      // 3. Initial data fetch
      await Promise.all([fetchSessions(), fetchRequests(), fetchMessages()]);
      setLoading(false);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProfile, venueId]);

  // Fetch functions wrapped in useCallback for the subscription hook
  const fetchSessions = useCallback(async () => {
    if (!venueId) return;
    const { data: sessions } = await supabase
      .from('room_sessions')
      .select('*, profile:profiles!room_sessions_profile_id_fkey(*)')
      .eq('venue_id', venueId)
      .eq('is_active', true);

    if (sessions) {
      const users: RoomUser[] = sessions.map((s: any) => ({
        id: s.profile.id,
        nickname: s.profile.nickname,
        firstInitial: s.profile.nickname[0],
        ageBand: s.profile.age_band,
        hometown: s.profile.hometown,
        profession: s.profile.profession,
        photo: s.profile.photo_url,
        intent: s.rhythm || 'Just hanging',
        connected: false,
        disclosureLevel: s.profile.photo_url ? 2 : s.profile.profession ? 1 : 0,
        snoozed: s.snoozed,
      }));
      setPeople(users);
    }
  }, [venueId]);

  const fetchRequests = useCallback(async () => {
    if (!venueId || !currentProfile) return;
    const { data } = await supabase
      .from('connection_requests')
      .select('*, sender:profiles!connection_requests_sender_id_fkey(*), receiver:profiles!connection_requests_receiver_id_fkey(*)')
      .eq('venue_id', venueId)
      .or(`receiver_id.eq.${currentProfile.id},sender_id.eq.${currentProfile.id}`)
      .order('created_at', { ascending: false });
    
    setRequests((data as any) || []);
  }, [venueId, currentProfile]);

  const fetchMessages = useCallback(async () => {
    if (!venueId) return;
    const { data } = await supabase
      .from('room_messages')
      .select('*, profile:profiles!room_messages_profile_id_fkey(nickname)')
      .eq('venue_id', venueId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (data) {
      setMessages(data.map((m: any) => ({
        id: m.id,
        message: m.message,
        profile_id: m.profile_id,
        nickname: m.profile.nickname,
        created_at: m.created_at
      })));
    }
  }, [venueId]);

  // Use the new scoped subscriptions hook
  useRoomSubscriptions({
    venueId: venueId || '',
    onSessionsChange: fetchSessions,
    onRequestsChange: (payload) => {
      fetchRequests();
      // Handle icebreaker popups for newly accepted requests
      if (
        payload.eventType === 'UPDATE' &&
        payload.new.status === 'accepted' &&
        payload.new.sender_id === currentProfile?.id
      ) {
        const oldStatus = payload.old?.status;
        if (oldStatus !== 'accepted') {
          const matchedRequest = requests.find((r) => r.id === payload.new.id);
          const name = matchedRequest?.receiver.nickname || 'Someone';
          setShowIcebreaker({
            anchor: payload.new.receiver_anchor || 'nearby',
            icebreaker: payload.new.icebreaker || 'Say hi!',
            senderName: name,
          });
        }
      }
    },
    onMessagesChange: fetchMessages
  });

  // Derived state memoization
  const processedPeople = useMemo(() => {
    if (!currentProfile) return [];
    
    // Filter out self
    let others = people.filter((p) => p.id !== currentProfile.id);

    // Map connection states
    others = others.map((p) => {
      // Find requests between current user and this person
      const relevantRequests = requests.filter(
        (r) =>
          (r.sender_id === currentProfile.id && r.receiver_id === p.id) ||
          (r.receiver_id === currentProfile.id && r.sender_id === p.id)
      );

      // Sort by newest first
      relevantRequests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      const latest = relevantRequests[0];

      if (latest) {
        if (latest.status === 'accepted') {
          return { ...p, connected: true };
        }
        if (latest.status === 'pending') {
          if (latest.sender_id === currentProfile.id) {
            return { ...p, requestSent: true };
          } else {
            return { ...p, requestReceived: true, requestId: latest.id };
          }
        }
      }
      return p;
    });

    // Sort: Matching intent > other intents
    return others.sort((a, b) => {
      if (a.intent === selectedIntent && b.intent !== selectedIntent) return -1;
      if (a.intent !== selectedIntent && b.intent === selectedIntent) return 1;
      return 0;
    });
  }, [people, requests, currentProfile, selectedIntent]);

  // Handlers
  const handleLeave = async () => {
    if (currentSessionId) {
      await leaveRoom(currentSessionId);
    }
    navigate(`/rooms/${roomDef.id}`);
  };

  const handleSnoozeToggle = async () => {
    if (!currentSessionId) return;
    const newSnooze = !snoozed;
    setSnoozed(newSnooze);
    await toggleSnooze(currentSessionId, newSnooze);
  };

  const handleIntentChange = async (intent: string) => {
    setSelectedIntent(intent);
    if (currentSessionId) {
      await updateRhythm(currentSessionId, intent);
    }
  };

  const handleConnect = (profileId: string) => {
    setAnchorDialog(profileId);
  };

  const handleAnchorSubmit = async () => {
    if (!anchorDialog || !selectedAnchor || !venueId || !currentProfile) return;
    
    // anchorDialog holds the target profileId in this context
    await sendConnectionRequest(currentProfile.id, anchorDialog, venueId);
    
    setAnchorDialog(null);
    setSelectedAnchor('');
    fetchRequests(); // Optimistic update
  };

  const handleSendMessage = async (text: string) => {
    if (!venueId || !currentProfile) return;
    
    const { error } = await supabase.from('room_messages').insert({
      venue_id: venueId,
      room_type: roomDef.id,
      profile_id: currentProfile.id,
      message: text,
    });

    if (error) {
      console.error('Send message error:', error);
      throw error;
    }
  };

  // Determine current disclosure level
  const currentDisclosure = currentProfile?.photo_url ? 2 : currentProfile?.profession ? 1 : 0;
  const showReciprocity = roomDef.presenceState !== 'quiet'; // Don't show in residential

  return (
    <div className="min-h-screen bg-background pb-20">
      <RoomHeader
        room={roomDef}
        venueName={venueName}
        sessionCount={processedPeople.length + 1}
        snoozed={snoozed}
        onSnoozeToggle={handleSnoozeToggle}
        onLeave={handleLeave}
      />

      <div className="sticky top-[69px] z-10 bg-background border-b border-border/40 px-6 pt-3 pb-0">
        <div className="max-w-lg mx-auto flex gap-6">
          <button
            onClick={() => setActiveTab('people')}
            className={`pb-3 text-sm font-body font-medium transition-colors relative ${
              activeTab === 'people' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'
            }`}
          >
            People
            {activeTab === 'people' && (
              <motion.div layoutId="roomTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-bronze" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`pb-3 text-sm font-body font-medium transition-colors relative ${
              activeTab === 'chat' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'
            }`}
          >
            Chat
            {activeTab === 'chat' && (
              <motion.div layoutId="roomTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-bronze" />
            )}
          </button>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-6 py-6">
        {activeTab === 'people' ? (
          <PeopleTab
            intents={roomDef.intents}
            selectedIntent={selectedIntent}
            onIntentChange={handleIntentChange}
            snoozed={snoozed}
            showReciprocity={showReciprocity}
            currentDisclosure={currentDisclosure}
            loading={loading}
            sortedPeople={processedPeople}
            onConnect={handleConnect}
            onRespond={respondToRequest}
          />
        ) : (
          <ChatTab
            messages={messages}
            currentProfileId={currentProfile?.id}
            onSendMessage={handleSendMessage}
          />
        )}
      </main>

      <AnchorDialog
        open={!!anchorDialog}
        onOpenChange={(o) => !o && setAnchorDialog(null)}
        selectedAnchor={selectedAnchor}
        onAnchorSelect={setSelectedAnchor}
        onSubmit={handleAnchorSubmit}
      />

      <IcebreakerDialog
        icebreakerData={showIcebreaker}
        onClose={() => setShowIcebreaker(null)}
      />
    </div>
  );
};

export default DigitalRoom;
