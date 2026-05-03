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
  geofenceVerified?: boolean;
}

interface HanginnState {
  currentProfile: Profile | null;
  currentSessionId: string | null;
  currentVenueId: string | null;
  currentRoomType: string | null;
  lastError: string | null;

  setCurrentProfile: (p: Profile) => void;
  setCurrentSession: (sessionId: string, venueId: string, roomType: string) => void;
  clearError: () => void;

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
const SESSION_KEY = 'hanginn_session';

const loadStoredProfile = (): Profile | null => {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const persistProfile = (p: Profile | null) => {
  try {
    if (p) localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    else localStorage.removeItem(PROFILE_KEY);
  } catch {
    // Storage quota exceeded or private browsing — degrade gracefully
  }
};

export const useHanginnStore = create<HanginnState>((set, get) => ({
  currentProfile: loadStoredProfile(),
  currentSessionId: null,
  currentVenueId: null,
  currentRoomType: null,
  lastError: null,

  setCurrentProfile: (p) => { persistProfile(p); set({ currentProfile: p }); },
  setCurrentSession: (sessionId, venueId, roomType) =>
    set({ currentSessionId: sessionId, currentVenueId: venueId, currentRoomType: roomType }),
  clearError: () => set({ lastError: null }),

  saveSessionState: (state) => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(state));
    } catch {
      // Silent — session resume is a nice-to-have, not critical
    }
  },
  getSessionState: () => {
    try {
      const s = localStorage.getItem(SESSION_KEY);
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  },
  clearSessionState: () => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // Silent
    }
  },

  signOut: async () => {
    persistProfile(null);
    set({ currentProfile: null, currentSessionId: null, currentVenueId: null, currentRoomType: null });
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // Silent
    }
  },

  upsertProfile: async (_email, data) => {
    const existing = get().currentProfile;

    try {
      if (existing?.id) {
        const { data: updated, error } = await supabase
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

        if (error) {
          console.error('[hanginnStore] Profile update failed:', error.message);
          set({ lastError: 'Failed to update profile. Please try again.' });
          // Return existing profile as fallback instead of crashing
          return existing;
        }

        const profile = updated ?? existing;
        persistProfile(profile);
        set({ currentProfile: profile });
        return profile;
      }

      const { data: created, error } = await supabase
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

      if (error || !created) {
        console.error('[hanginnStore] Profile creation failed:', error?.message);
        set({ lastError: 'Failed to create profile. Please try again.' });
        throw new Error(error?.message || 'Profile creation returned no data');
      }

      persistProfile(created);
      set({ currentProfile: created });
      return created;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      console.error('[hanginnStore] upsertProfile error:', msg);
      set({ lastError: `Profile error: ${msg}` });
      throw e;
    }
  },

  fetchVenues: async (roomType) => {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .eq('room_type', roomType);

    if (error) {
      console.error('[hanginnStore] fetchVenues error:', error.message);
      set({ lastError: 'Failed to load venues.' });
      return [];
    }
    return data || [];
  },

  fetchVenueSessionCount: async (venueId) => {
    const { count, error } = await supabase
      .from('room_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId)
      .eq('is_active', true);

    if (error) {
      console.error('[hanginnStore] fetchVenueSessionCount error:', error.message);
      return 0;
    }
    return count || 0;
  },

  joinRoom: async (profileId, venueId, roomType, rhythm) => {
    try {
      // Deactivate any existing sessions for this user
      const { error: deactivateError } = await supabase
        .from('room_sessions')
        .update({ is_active: false })
        .eq('profile_id', profileId)
        .eq('is_active', true);

      if (deactivateError) {
        console.warn('[hanginnStore] Failed to deactivate old sessions:', deactivateError.message);
        // Non-fatal — continue with join
      }

      const { data, error } = await supabase
        .from('room_sessions')
        .insert({ profile_id: profileId, venue_id: venueId, room_type: roomType, rhythm })
        .select()
        .single();

      if (error || !data) {
        console.error('[hanginnStore] joinRoom error:', error?.message);
        set({ lastError: 'Failed to join room. Please try again.' });
        throw new Error(error?.message || 'Join room returned no data');
      }

      const sessionId = data.id;
      set({ currentSessionId: sessionId, currentVenueId: venueId, currentRoomType: roomType });
      return sessionId;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      console.error('[hanginnStore] joinRoom error:', msg);
      set({ lastError: `Failed to join room: ${msg}` });
      throw e;
    }
  },

  leaveRoom: async (sessionId) => {
    try {
      await supabase
        .from('room_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);
    } catch (e) {
      console.warn('[hanginnStore] leaveRoom error (non-fatal):', e);
    }
    set({ currentSessionId: null, currentVenueId: null, currentRoomType: null });
    get().clearSessionState();
  },

  updateRhythm: async (sessionId, rhythm) => {
    const { error } = await supabase
      .from('room_sessions')
      .update({ rhythm })
      .eq('id', sessionId);

    if (error) {
      console.error('[hanginnStore] updateRhythm error:', error.message);
    }
  },

  toggleSnooze: async (sessionId, snoozed) => {
    const { error } = await supabase
      .from('room_sessions')
      .update({ snoozed })
      .eq('id', sessionId);

    if (error) {
      console.error('[hanginnStore] toggleSnooze error:', error.message);
    }
  },

  sendConnectionRequest: async (senderId, receiverId, venueId) => {
    const { error } = await supabase
      .from('connection_requests')
      .insert({ sender_id: senderId, receiver_id: receiverId, venue_id: venueId });

    if (error) {
      console.error('[hanginnStore] sendConnectionRequest error:', error.message);
      set({ lastError: 'Failed to send connection request.' });
    }
  },

  respondToRequest: async (requestId, accept, receiverAnchor) => {
    const icebreaker = accept ? ICEBREAKERS[Math.floor(Math.random() * ICEBREAKERS.length)] : null;
    const { error } = await supabase
      .from('connection_requests')
      .update({
        status: accept ? 'accepted' : 'rejected',
        receiver_anchor: receiverAnchor || null,
        icebreaker,
      })
      .eq('id', requestId);

    if (error) {
      console.error('[hanginnStore] respondToRequest error:', error.message);
      set({ lastError: 'Failed to respond to request.' });
    }
  },

  addToCircle: async (profileId, connectedProfileId, venueId) => {
    const { error } = await supabase.from('circles').insert([
      { profile_id: profileId, connected_profile_id: connectedProfileId, venue_id: venueId },
      { profile_id: connectedProfileId, connected_profile_id: profileId, venue_id: venueId },
    ]);

    if (error) {
      console.error('[hanginnStore] addToCircle error:', error.message);
      set({ lastError: 'Failed to add to circle.' });
    }
  },

  fetchCircle: async (profileId) => {
    const { data, error } = await supabase
      .from('circles')
      .select('*, connected_profile:profiles!circles_connected_profile_id_fkey(*), venue:venues!circles_venue_id_fkey(*)')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[hanginnStore] fetchCircle error:', error.message);
      set({ lastError: 'Failed to load your circle.' });
      return [];
    }
    return (data as any) || [];
  },

  updateProfile: async (profileId, data) => {
    const { data: updated, error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      console.error('[hanginnStore] updateProfile error:', error.message);
      set({ lastError: 'Failed to update profile.' });
      return;
    }

    if (updated) {
      persistProfile(updated);
      set({ currentProfile: updated });
    }
  },
}));
