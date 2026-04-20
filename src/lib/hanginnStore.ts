import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { ICEBREAKERS } from '@/lib/types';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

interface SessionState {
  roomType: string;
  venueId: string;
  step: 'venue' | 'profile' | 'verify' | 'room';
  intent?: string;
  vibe?: string;
}

interface HanginnState {
  currentProfile: Profile | null;
  currentSessionId: string | null;
  currentVenueId: string | null;
  currentRoomType: string | null;

  setCurrentProfile: (p: Profile) => void;
  setCurrentSession: (sessionId: string, venueId: string, roomType: string) => void;

  // Session persistence
  saveSessionState: (state: SessionState) => void;
  getSessionState: () => SessionState | null;
  clearSessionState: () => void;

  signOut: () => Promise<void>;

  // Profile operations — presence-only, no auth
  upsertProfile: (email: string, data: {
    nickname: string; age_band: string; hometown?: string;
    profession?: string; gender_preference?: string; photo_url?: string;
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

  // Profile update
  updateProfile: (profileId: string, data: Partial<{
    nickname: string; hometown: string; profession: string; photo_url: string;
  }>) => Promise<void>;
}

const PROFILE_KEY = 'hanginn_profile';

const loadStoredProfile = (): Profile | null => {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const persistProfile = (p: Profile | null) => {
  if (p) localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  else localStorage.removeItem(PROFILE_KEY);
};

export const useHanginnStore = create<HanginnState>((set, get) => ({
  currentProfile: loadStoredProfile(),
  currentSessionId: null,
  currentVenueId: null,
  currentRoomType: null,

  setCurrentProfile: (p) => { persistProfile(p); set({ currentProfile: p }); },
  setCurrentSession: (sessionId, venueId, roomType) =>
    set({ currentSessionId: sessionId, currentVenueId: venueId, currentRoomType: roomType }),

  saveSessionState: (state) => {
    localStorage.setItem('hanginn_session', JSON.stringify(state));
  },
  getSessionState: () => {
    const s = localStorage.getItem('hanginn_session');
    return s ? JSON.parse(s) : null;
  },
  clearSessionState: () => {
    localStorage.removeItem('hanginn_session');
  },

  signOut: async () => {
    persistProfile(null);
    set({ currentProfile: null, currentSessionId: null, currentVenueId: null, currentRoomType: null });
    localStorage.removeItem('hanginn_session');
  },

  upsertProfile: async (_email, data) => {
    const existing = get().currentProfile;

    if (existing?.id) {
      const { data: updated } = await supabase
        .from('profiles')
        .update({
          nickname: data.nickname,
          age_band: data.age_band,
          hometown: data.hometown ?? existing.hometown,
          profession: data.profession ?? existing.profession,
          gender_preference: data.gender_preference ?? existing.gender_preference,
          photo_url: data.photo_url ?? existing.photo_url,
        })
        .eq('id', existing.id)
        .select()
        .single();
      const profile = updated || existing;
      persistProfile(profile);
      set({ currentProfile: profile });
      return profile;
    }

    const { data: created } = await supabase
      .from('profiles')
      .insert({
        email: null,
        phone: null,
        nickname: data.nickname,
        age_band: data.age_band,
        hometown: data.hometown || '',
        profession: data.profession || '',
        gender_preference: data.gender_preference || 'all',
        photo_url: data.photo_url,
        user_id: null,
      })
      .select()
      .single();
    const profile = created!;
    persistProfile(profile);
    set({ currentProfile: profile });
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
    get().clearSessionState();
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

  updateProfile: async (profileId, data) => {
    const { data: updated } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', profileId)
      .select()
      .single();
    if (updated) {
      persistProfile(updated);
      set({ currentProfile: updated });
    }
  },
}));
