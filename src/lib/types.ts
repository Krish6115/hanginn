export type RoomType = 'social' | 'intellectual' | 'official' | 'play' | 'transit';

export interface Room {
  type: RoomType;
  label: string;
  description: string;
  icon: string;
  venueLabel: string;
}

export interface Venue {
  id: string;
  name: string;
  image: string;
  peopleCount: number;
  topRhythms: string[];
  roomType: RoomType;
  address: string;
}

export interface UserProfile {
  id: string;
  nickname: string;
  phone: string;
  ageBand: string;
  photo?: string;
  hometown: string;
  profession: string;
  genderPreference: 'all' | 'same';
  rhythm?: string;
  snoozed: boolean;
}

export interface RoomUser {
  id: string;
  nickname: string;
  firstInitial: string;
  ageBand: string;
  hometown: string;
  profession: string;
  photo?: string;
  rhythm: string;
  connected: boolean;
  pendingRequest?: 'sent' | 'received';
}

export interface CirclePerson {
  id: string;
  nickname: string;
  photo?: string;
  hometown: string;
  profession: string;
  connectedAt: string;
  venue: string;
}

export const ROOMS: Room[] = [
  { type: 'social', label: 'Social', description: 'Cafés & hangout spots', icon: '☕', venueLabel: 'Cafés nearby' },
  { type: 'intellectual', label: 'Intellectual', description: 'Libraries & universities', icon: '📚', venueLabel: 'Study spots nearby' },
  { type: 'official', label: 'Official', description: 'Offices & co-working', icon: '💼', venueLabel: 'Workspaces nearby' },
  { type: 'play', label: 'Play', description: 'Turfs & gaming parlours', icon: '🎮', venueLabel: 'Play zones nearby' },
  { type: 'transit', label: 'Transit', description: 'Airports & lounges', icon: '✈️', venueLabel: 'Transit spots nearby' },
];

export const RHYTHMS: Record<RoomType, string[]> = {
  social: ['Open to chat', 'Looking for company', 'Working quietly', 'Killing time', 'Meeting someone new'],
  intellectual: ['Study buddy needed', 'Deep focus', 'Discussion partner', 'Group study', 'Just browsing'],
  official: ['Networking', 'Lunch buddy', 'Brainstorm partner', 'Coffee break chat', 'After-work hangout'],
  play: ['Looking for a team', 'Casual match', 'Watching games', 'Teaching/learning', 'Just vibing'],
  transit: ['Long layover', 'Quick connection', 'Travel buddy', 'Local tips needed', 'Just passing through'],
};

export const AGE_BANDS = ['18–22', '23–27', '28–32', '33–40', '40+'];

export const ANCHORS = [
  'Near the entrance',
  'By the window',
  'At the counter/bar',
  'Back corner',
  'Outdoor seating',
  'Second floor',
  'Near the bookshelf',
  'Center table',
];

export const ICEBREAKERS = [
  "What's the most interesting thing you've read or watched this week?",
  "If you could live anywhere for a year, where would it be?",
  "What's a skill you're currently trying to learn?",
  "What brought you here today?",
  "What's the best meal you've had recently?",
  "If you had a free afternoon with no plans, what would you do?",
];
