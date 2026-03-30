import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { ICEBREAKERS } from '@/lib/types';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;
type RoomSession = Tables<'room_sessions'> & { profiles: Profile };
type ConnectionRequest = Tables<'connection_requests'>;

interface HanginnState {
  // User identity (persisted via localStorage phone)
  currentProfile: Profile | null;
  currentSessionId: string | null;
  currentVenueId: string | null;
  currentRoomType: string | null;

  // Actions
  setCurrentProfile: (p: Profile) => void;
  setCurrentSession: (sessionId: string, venueId: string, roomType: string) => void;

  // Profile operations
  loginWithPhone: (phone: string, data: {
    nickname: string; age_band: string; hometown: string;
    profession: string; gender_preference: string; photo_url?: string;
  }) => Promise<Profile>;

  // Venue operations
  fetchVenues: (roomType: string) => Promise<Tables<'venues'>[]>;
  fetchVenueSessionCount: (venueId: string) => Promise<number>;

  // Room session operations
  joinRoom: (profileId: string, venueId: string, roomType: string, rhythm: string) => Promise<string>;
  leaveRoom: (sessionId: string) => Promise<void>;
  updateRhythm: (sessionId: string, rhythm: string) => Promise<void>;
  toggleSnooze: (sessionId: string, snoozed: boolean) => Promise<void>;

  // Connection operations
  sendConnectionRequest: (senderId: string, receiverId: string, venueId: string) => Promise<void>;
  respondToRequest: (requestId: string, accept: boolean, receiverAnchor?: string) => Promise<void>;
  addToCircle: (profileId: string, connectedProfileId: string, venueId: string) => Promise<void>;

  // Circle
  fetchCircle: (profileId: string) => Promise<(Tables<'circles'> & { connected_profile: Profile; venue: Tables<'venues'> })[]>;
}

export const useHanginnStore = create<HanginnState>((set) => ({
  currentProfile: null,
  currentSessionId: null,
  currentVenueId: null,
  currentRoomType: null,

  setCurrentProfile: (p) => set({ currentProfile: p }),
  setCurrentSession: (sessionId, venueId, roomType) =>
    set({ currentSessionId: sessionId, currentVenueId: venueId, currentRoomType: roomType }),

  loginWithPhone: async (phone, data) => {
    // Upsert profile by phone
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (existing) {
      const { data: updated } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', existing.id)
        .select()
        .single();
      const profile = updated!;
      set({ currentProfile: profile });
      localStorage.setItem('hanginn_phone', phone);
      return profile;
    }

    const { data: created } = await supabase
      .from('profiles')
      .insert({ phone, ...data })
      .select()
      .single();
    const profile = created!;
    set({ currentProfile: profile });
    localStorage.setItem('hanginn_phone', phone);
    return profile;
  },

  fetchVenues: async (roomType) => {
    const { data } = await supabase
      .from('venues')
      .select('*')
      .eq('room_type', roomType);
    return data || [];
  },

  fetchVenueSessionCount: async (venueId) => {
    const { count } = await supabase
      .from('room_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId)
      .eq('is_active', true);
    return count || 0;
  },

  joinRoom: async (profileId, venueId, roomType, rhythm) => {
    // Deactivate any existing sessions
    await supabase
      .from('room_sessions')
      .update({ is_active: false })
      .eq('profile_id', profileId)
      .eq('is_active', true);

    const { data } = await supabase
      .from('room_sessions')
      .insert({ profile_id: profileId, venue_id: venueId, room_type: roomType, rhythm })
      .select()
      .single();

    const sessionId = data!.id;
    set({ currentSessionId: sessionId, currentVenueId: venueId, currentRoomType: roomType });
    return sessionId;
  },

  leaveRoom: async (sessionId) => {
    await supabase
      .from('room_sessions')
      .update({ is_active: false })
      .eq('id', sessionId);
    set({ currentSessionId: null, currentVenueId: null, currentRoomType: null });
  },

  updateRhythm: async (sessionId, rhythm) => {
    await supabase
      .from('room_sessions')
      .update({ rhythm })
      .eq('id', sessionId);
  },

  toggleSnooze: async (sessionId, snoozed) => {
    await supabase
      .from('room_sessions')
      .update({ snoozed })
      .eq('id', sessionId);
  },

  sendConnectionRequest: async (senderId, receiverId, venueId) => {
    await supabase
      .from('connection_requests')
      .insert({ sender_id: senderId, receiver_id: receiverId, venue_id: venueId });
  },

  respondToRequest: async (requestId, accept, receiverAnchor) => {
    const icebreaker = accept ? ICEBREAKERS[Math.floor(Math.random() * ICEBREAKERS.length)] : null;
    await supabase
      .from('connection_requests')
      .update({
        status: accept ? 'accepted' : 'rejected',
        receiver_anchor: receiverAnchor || null,
        icebreaker,
      })
      .eq('id', requestId);
  },

  addToCircle: async (profileId, connectedProfileId, venueId) => {
    // Add both directions
    await supabase.from('circles').insert([
      { profile_id: profileId, connected_profile_id: connectedProfileId, venue_id: venueId },
      { profile_id: connectedProfileId, connected_profile_id: profileId, venue_id: venueId },
    ]);
  },

  fetchCircle: async (profileId) => {
    const { data } = await supabase
      .from('circles')
      .select('*, connected_profile:profiles!circles_connected_profile_id_fkey(*), venue:venues!circles_venue_id_fkey(*)')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });
    return (data as any) || [];
  },
}));

// Auto-restore session from localStorage
const savedPhone = localStorage.getItem('hanginn_phone');
if (savedPhone) {
  supabase
    .from('profiles')
    .select('*')
    .eq('phone', savedPhone)
    .maybeSingle()
    .then(({ data }) => {
      if (data) {
        useHanginnStore.getState().setCurrentProfile(data);
      }
    });
}
