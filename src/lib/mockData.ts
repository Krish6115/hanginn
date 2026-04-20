import { Venue, RoomUser, CirclePerson, RoomType } from './types';

const venueImages: Record<RoomType, string[]> = {
  social: [
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=400&h=300&fit=crop',
  ],
  intellectual: [
    'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
  ],
  official: [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=300&fit=crop',
  ],
  play: [
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&h=300&fit=crop',
  ],
  transit: [
    'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1517400508447-f8dd518b86db?w=400&h=300&fit=crop',
  ],
  residential: [
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=400&h=300&fit=crop',
  ],
};

const venueNames: Record<RoomType, string[]> = {
  social: ['Third Wave Coffee', 'The Hideout Cafe', 'Brewed Awakening'],
  intellectual: ['Central Library', 'University Commons', 'The Reading Room'],
  official: ['WeWork Prestige', 'CoLab Studios', 'The Hive Office'],
  play: ['Arena Gaming Zone', 'SportSquare Turf', 'PlayDen Arcade'],
  transit: ['Terminal 2 Lounge', 'SkyWait Cafe', 'Transit Hub Lounge'],
  residential: ['Phase 3B1', 'Phase 8', 'Sector 34'],
};

export function getVenuesForRoom(roomType: RoomType): Venue[] {
  return venueNames[roomType].map((name, i) => ({
    id: `${roomType}-${i}`,
    name,
    image: venueImages[roomType][i],
    presence: 'quiet' as const,
    snapshot: 'A quiet moment. Be the first to step in.',
    roomType,
    address: `${Math.floor(Math.random() * 200) + 1} Main Street`,
  }));
}

const avatars = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  undefined,
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
  undefined,
];

const nicknames = ['Arjun', 'Priya', 'Sam', 'Meera', 'Kai', 'Noor', 'Reya', 'Dev'];
const hometowns = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Chennai', 'Hyderabad', 'Kolkata', 'Goa'];
const professions = ['Designer', 'Engineer', 'Student', 'Writer', 'Freelancer', 'Founder', 'Researcher', 'Artist'];

export function getRoomUsers(roomType: RoomType, userIntent: string, intents: string[]): RoomUser[] {
  return nicknames.map((name, i) => {
    const intent = i < 3 ? userIntent : intents[Math.floor(Math.random() * intents.length)];
    return {
      id: `user-${i}`,
      nickname: name,
      firstInitial: name[0],
      ageBand: ['18-22', '23-27', '28-32', '33-40'][i % 4],
      hometown: hometowns[i],
      profession: professions[i],
      photo: avatars[i],
      intent,
      connected: false,
      disclosureLevel: i % 2 === 0 ? 2 : 1,
    };
  });
}

export function getCircle(): CirclePerson[] {
  return [
    { id: 'c1', nickname: 'Priya', photo: avatars[1], hometown: 'Delhi', profession: 'Designer', connectedAt: '2 days ago', venue: 'Third Wave Coffee' },
    { id: 'c2', nickname: 'Kai', photo: avatars[4], hometown: 'Bangalore', profession: 'Founder', connectedAt: '1 week ago', venue: 'WeWork Prestige' },
  ];
}
