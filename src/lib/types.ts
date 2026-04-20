export type RoomType = 'social' | 'intellectual' | 'official' | 'play' | 'transit' | 'residential';

export type PresenceState = 'quiet' | 'flowing' | 'vibrant';

export interface Room {
  type: RoomType;
  label: string;
  description: string;
  venueLabel: string;
}

export interface Venue {
  id: string;
  name: string;
  image: string;
  presence: PresenceState;
  snapshot: string;
  roomType: RoomType;
  address: string;
  lat?: number;
  lng?: number;
}

export interface UserProfile {
  id: string;
  nickname: string;
  email: string;
  ageBand: string;
  photo?: string;
  hometown: string;
  profession: string;
  genderPreference: 'all' | 'same';
  intent?: string;
  vibe?: string;
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
  intent: string;
  vibe?: string;
  connected: boolean;
  pendingRequest?: 'sent' | 'received';
  requestId?: string;
  disclosureLevel: number;
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
  { type: 'social', label: 'Social', description: 'Light conversations', venueLabel: 'Cafes nearby' },
  { type: 'intellectual', label: 'Intellectual', description: 'Study, think, or exchange ideas quietly', venueLabel: 'Study spots nearby' },
  { type: 'official', label: 'Official', description: 'Work, network, or coordinate', venueLabel: 'Workspaces nearby' },
  { type: 'play', label: 'Play', description: 'Join a game. Find your rhythm', venueLabel: 'Play zones nearby' },
  { type: 'transit', label: 'Transit', description: 'Short conversations while you wait', venueLabel: 'Transit spots nearby' },
  { type: 'residential', label: 'Residential', description: 'People around you, in your neighborhood', venueLabel: 'Localities near you' },
];

export const INTENTS: Record<RoomType, string[]> = {
  social: ['Work together', 'Chill', 'Network'],
  intellectual: ['Study together', 'Quick break', 'Discuss a topic'],
  official: ['Focused work', 'Quick break', 'Coordinate'],
  transit: ['Network', 'Chill', 'Coordinate'],
  play: ['Join a team', 'Find players', 'Compete'],
  residential: ['Walk', 'Chill', 'Sports', 'Quick Help'],
};

export const AGE_BANDS = ['18-22', '23-27', '28-32', '33-40', '40+'];

export const ANCHORS = [
  'Near the entrance',
  'By the window',
  'At the counter',
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

export function generateVenueSnapshot(intents: string[], roomType: RoomType): string {
  if (intents.length === 0) return 'A quiet moment. Be the first to step in.';

  const intentCounts: Record<string, number> = {};
  intents.forEach((i) => {
    intentCounts[i] = (intentCounts[i] || 0) + 1;
  });

  const sorted = Object.entries(intentCounts).sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  const secondary = sorted[1];

  const topDesc = describeIntent(top[0], top[1], roomType);
  if (!secondary) return topDesc;

  const secDesc = describeIntentSecondary(secondary[0], secondary[1]);
  return `${topDesc}, ${secDesc}`;
}

function describeIntent(intent: string, count: number, roomType: RoomType): string {
  const few = count <= 2;
  switch (intent) {
    case 'Work together': return few ? 'A few are settling in to work together' : 'People are working together';
    case 'Chill': return few ? 'A couple are unwinding' : 'A relaxed crowd is settling in';
    case 'Network': return few ? 'A few are open to meeting someone' : 'Professionals are mingling';
    case 'Study together': return few ? 'Some are studying quietly' : 'A focused study session is building';
    case 'Quick break': return few ? 'A few are on a quick break' : 'People are taking a breather';
    case 'Discuss a topic': return few ? 'A conversation is starting' : 'A lively discussion is forming';
    case 'Focused work': return few ? 'Some are in deep focus' : 'Professionals are coordinating';
    case 'Coordinate': return few ? 'A few are coordinating' : 'Teams are syncing up';
    case 'Join a team': return few ? 'A team is warming up' : 'Teams are forming';
    case 'Find players': return few ? 'Players are looking for a match' : 'Players are gathering';
    case 'Compete': return few ? 'A challenge is brewing' : 'Competition is heating up';
    default: return 'Something is happening';
  }
}

function describeIntentSecondary(intent: string, count: number): string {
  const others = count === 1 ? 'another is' : 'others are';
  switch (intent) {
    case 'Work together': return `${others} looking to collaborate`;
    case 'Chill': return `${others} here to unwind`;
    case 'Network': return `${others} open to connecting`;
    case 'Study together': return `${others} studying`;
    case 'Quick break': return `${others} on a break`;
    case 'Discuss a topic': return `${others} up for a chat`;
    case 'Focused work': return `${others} on focused work`;
    case 'Coordinate': return `${others} coordinating`;
    case 'Join a team': return `${others} looking to join`;
    case 'Find players': return `${others} finding players`;
    case 'Compete': return `${others} ready to compete`;
    default: return `${others} around`;
  }
}

export function getPresenceState(count: number): PresenceState {
  if (count <= 2) return 'quiet';
  if (count <= 6) return 'flowing';
  return 'vibrant';
}

// Geofencing utility
export function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
