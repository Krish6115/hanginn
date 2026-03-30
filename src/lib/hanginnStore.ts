import { create } from 'zustand';
import { RoomType, UserProfile, RoomUser } from './types';

interface HanginnState {
  selectedRoom: RoomType | null;
  selectedVenueId: string | null;
  userProfile: UserProfile | null;
  roomUsers: RoomUser[];
  snoozed: boolean;
  setSelectedRoom: (room: RoomType) => void;
  setSelectedVenue: (id: string) => void;
  setUserProfile: (profile: UserProfile) => void;
  setRoomUsers: (users: RoomUser[]) => void;
  updateRhythm: (rhythm: string) => void;
  toggleSnooze: () => void;
  sendConnectionRequest: (userId: string) => void;
  respondToRequest: (userId: string, accept: boolean) => void;
}

export const useHanginnStore = create<HanginnState>((set) => ({
  selectedRoom: null,
  selectedVenueId: null,
  userProfile: null,
  roomUsers: [],
  snoozed: false,
  setSelectedRoom: (room) => set({ selectedRoom: room }),
  setSelectedVenue: (id) => set({ selectedVenueId: id }),
  setUserProfile: (profile) => set({ userProfile: profile }),
  setRoomUsers: (users) => set({ roomUsers: users }),
  updateRhythm: (rhythm) =>
    set((state) => ({
      userProfile: state.userProfile ? { ...state.userProfile, rhythm } : null,
    })),
  toggleSnooze: () => set((state) => ({ snoozed: !state.snoozed })),
  sendConnectionRequest: (userId) =>
    set((state) => ({
      roomUsers: state.roomUsers.map((u) =>
        u.id === userId ? { ...u, pendingRequest: 'sent' as const } : u
      ),
    })),
  respondToRequest: (userId, accept) =>
    set((state) => ({
      roomUsers: state.roomUsers.map((u) =>
        u.id === userId
          ? { ...u, connected: accept, pendingRequest: undefined }
          : u
      ),
    })),
}));
