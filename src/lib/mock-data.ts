// ---------------------------------------------------------------------------
// Vita -- Mock Data for Prototyping
// Comprehensive, fully-fledged mock data for all app sections.
// ---------------------------------------------------------------------------

import type { User } from "@/types/database";

// ---------------------------------------------------------------------------
// Shared Types
// ---------------------------------------------------------------------------

export type EventVisibility = "public" | "group" | "friends";

export interface MockHost {
  id: string;
  name: string;
  avatar_url: string | null;
  verified: boolean;
}

export interface MockEvent {
  id: string;
  title: string;
  location_name: string;
  description: string;
  starts_at: string;
  ends_at: string;
  host: MockHost;
  attendee_count: number;
  max_capacity: number | null;
  visibility: EventVisibility;
  /** Distance from user in miles */
  distance: number;
  /** Position on the mock map (percentage-based) */
  pin_x: number;
  pin_y: number;
}

export interface MockAttendee {
  id: string;
  name: string;
  avatar_url: string | null;
}

export interface MockConversationUser {
  id: string;
  first_name: string;
  avatar_url: string | null;
  verification_level: "none" | "photo" | "id";
  online?: boolean;
  interests?: string[];
}

export interface MockConversation {
  id: string;
  user: MockConversationUser;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  is_new_match?: boolean;
}

export interface MockMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

export interface MockGroupUser {
  id: string;
  name: string;
  avatar: string | null;
  online: boolean;
  badge: "none" | "green" | "blue" | "gold";
}

export interface MockGroup {
  id: string;
  name: string;
  description: string;
  member_count: number;
  privacy_tier: "public" | "private" | "secret";
  cover_image: string;
  health_days_remaining: number;
  category: string;
  created_at: string;
  is_member: boolean;
}

export interface MockGroupPost {
  id: string;
  user: MockGroupUser;
  content: string;
  image?: string;
  timestamp: string;
  likes: number;
  comments: number;
  liked: boolean;
}

export interface MockGroupEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  cover_image: string;
}

export interface MockGroupMember {
  user: MockGroupUser;
  role: "Admin" | "Moderator" | "Member";
  health_days_remaining: number;
}

// ---------------------------------------------------------------------------
// Feed Post Types
// ---------------------------------------------------------------------------

export type FeedPostSource =
  | { type: "connection" }
  | { type: "group"; groupId: string; groupName: string }
  | { type: "suggested"; groupId: string; groupName: string };

export interface MockFeedPost {
  id: string;
  user: MockGroupUser;
  source: FeedPostSource;
  content: string;
  image?: string;
  timestamp: string;
  likes: number;
  comments: number;
  liked: boolean;
}

// ---------------------------------------------------------------------------
// Profile Post Types
// ---------------------------------------------------------------------------

export type ProfilePostType = "moment" | "checkin" | "highlight";

export interface ProfilePostCheckin {
  eventTitle: string;
  eventId: string;
  locationName: string;
  groupName?: string;
  groupId?: string;
  attendeeCount?: number;
}

export interface ProfilePostHighlight {
  originalPost: {
    userName: string;
    userAvatar: string | null;
    content: string;
    image?: string;
    groupName?: string;
  };
}

export interface MockProfilePost {
  id: string;
  type: ProfilePostType;
  content: string;
  image?: string;
  timestamp: string;
  likes: number;
  comments: number;
  liked: boolean;
  checkin?: ProfilePostCheckin;
  highlight?: ProfilePostHighlight;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hoursFromNow(offset: number): string {
  const d = new Date();
  d.setHours(d.getHours() + offset);
  return d.toISOString();
}

function minutesAgo(minutes: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - minutes);
  return d.toISOString();
}

function daysAgo(days: number, hour = 14): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function daysFromNow(days: number, hour = 14): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function birthdate(age: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  d.setMonth(d.getMonth() - 3);
  return d.toISOString().slice(0, 10);
}

function dicebear(seed: string): string {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

function dicebearPhoto(seed: string, idx: number): string {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}-photo${idx}`;
}

/** Compute age from a YYYY-MM-DD birthdate string. */
export function getAge(birthdateStr: string): number {
  const today = new Date();
  const birth = new Date(birthdateStr);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/** The "current user" id for sent/received logic */
export const CURRENT_USER_ID = "me";

// ---------------------------------------------------------------------------
// Current User Profile (used by profile page)
// ---------------------------------------------------------------------------

export const CURRENT_USER_PROFILE = {
  firstName: "Maya",
  lastName: "Chen",
  age: 28,
  bio: "Product designer. Climbing enthusiast. Vinyl collector. New to Austin!",
  avatarUrl: dicebear("MayaChen"),
  verificationLevel: "green" as const,
  gender: "female" as const,
  interests: ["Climbing", "Vinyl", "Coffee", "Live Music", "Design", "Yoga"],
  stats: {
    matches: 12,
    groups: 3,
    events: 8,
  },
  groups: [
    { id: "grp-1", name: "Austin Climbers", daysElapsed: 12, memberCount: 24 },
    { id: "grp-2", name: "Vinyl Collectors ATX", daysElapsed: 28, memberCount: 18 },
    { id: "grp-3", name: "Design + Coffee", daysElapsed: 5, memberCount: 31 },
  ],
  photos: [
    dicebear("MayaChen"),
    dicebearPhoto("MayaChen", 1),
    dicebearPhoto("MayaChen", 2),
  ],
};

// ---------------------------------------------------------------------------
// Mock Events (Map page)
// ---------------------------------------------------------------------------

export const MOCK_EVENTS: MockEvent[] = [
  {
    id: "evt-001",
    title: "Sunset Yoga in the Park",
    location_name: "Riverside Park Lawn",
    description:
      "Join us for a relaxing outdoor yoga session as the sun sets. All levels welcome. Bring your own mat or borrow one of ours.",
    starts_at: hoursFromNow(-1),
    ends_at: hoursFromNow(1.25),
    host: {
      id: "usr-001",
      name: "Amara Chen",
      avatar_url: dicebear("AmaraChen"),
      verified: true,
    },
    attendee_count: 18,
    max_capacity: 30,
    visibility: "public",
    distance: 0.3,
    pin_x: 28,
    pin_y: 35,
  },
  {
    id: "evt-002",
    title: "Coffee & Sketch Meetup",
    location_name: "Blue Bottle Coffee",
    description:
      "Grab your sketchbook and your favorite drink. We draw, we chat, we vibe. No skill level required.",
    starts_at: hoursFromNow(0.5),
    ends_at: hoursFromNow(3),
    host: {
      id: "usr-002",
      name: "Jordan Rivera",
      avatar_url: dicebear("JordanRivera"),
      verified: false,
    },
    attendee_count: 7,
    max_capacity: 12,
    visibility: "public",
    distance: 0.8,
    pin_x: 62,
    pin_y: 22,
  },
  {
    id: "evt-003",
    title: "Book Club: Monthly Read",
    location_name: "The Reading Room",
    description:
      "This month we are discussing 'Klara and the Sun' by Kazuo Ishiguro. Come ready to share your favorite passages.",
    starts_at: hoursFromNow(2),
    ends_at: hoursFromNow(4),
    host: {
      id: "usr-003",
      name: "Maya Okonkwo",
      avatar_url: dicebear("MayaOkonkwo"),
      verified: true,
    },
    attendee_count: 9,
    max_capacity: 15,
    visibility: "group",
    distance: 1.2,
    pin_x: 45,
    pin_y: 58,
  },
  {
    id: "evt-004",
    title: "Pickup Basketball",
    location_name: "Central Courts",
    description:
      "5v5 pickup game. Show up ready to play. We will sort teams on site. Water provided.",
    starts_at: hoursFromNow(-0.5),
    ends_at: hoursFromNow(2),
    host: {
      id: "usr-004",
      name: "Kai Nakamura",
      avatar_url: dicebear("KaiNakamura"),
      verified: false,
    },
    attendee_count: 12,
    max_capacity: 10,
    visibility: "public",
    distance: 0.5,
    pin_x: 75,
    pin_y: 45,
  },
  {
    id: "evt-005",
    title: "Wine & Paint Night",
    location_name: "Studio 42",
    description:
      "Sip, paint, and socialize. All supplies included. This week's theme: cityscapes at dusk.",
    starts_at: hoursFromNow(4),
    ends_at: hoursFromNow(7),
    host: {
      id: "usr-005",
      name: "Priya Patel",
      avatar_url: dicebear("PriyaPatel"),
      verified: true,
    },
    attendee_count: 22,
    max_capacity: 25,
    visibility: "friends",
    distance: 1.8,
    pin_x: 18,
    pin_y: 68,
  },
  {
    id: "evt-006",
    title: "Dog Walking Crew",
    location_name: "Lakeside Trail",
    description:
      "Weekly group walk with our furry friends. Meet at the trailhead. Dogs of all sizes welcome.",
    starts_at: hoursFromNow(0),
    ends_at: hoursFromNow(1.5),
    host: {
      id: "usr-006",
      name: "Sam Morales",
      avatar_url: dicebear("SamMorales"),
      verified: false,
    },
    attendee_count: 5,
    max_capacity: null,
    visibility: "public",
    distance: 0.4,
    pin_x: 52,
    pin_y: 78,
  },
  {
    id: "evt-007",
    title: "Live Jazz & Open Mic",
    location_name: "The Velvet Lounge",
    description:
      "Live jazz trio followed by open mic. Sign up at the door. Drink specials all night.",
    starts_at: hoursFromNow(5),
    ends_at: hoursFromNow(8),
    host: {
      id: "usr-007",
      name: "Elise Fontaine",
      avatar_url: dicebear("EliseFontaine"),
      verified: true,
    },
    attendee_count: 34,
    max_capacity: 50,
    visibility: "public",
    distance: 2.1,
    pin_x: 85,
    pin_y: 62,
  },
  {
    id: "evt-008",
    title: "Rooftop Board Games",
    location_name: "The Highline Terrace",
    description:
      "Bring your favorite board game or play one of ours. Snacks provided. Great way to meet new people.",
    starts_at: hoursFromNow(1),
    ends_at: hoursFromNow(3.5),
    host: {
      id: "usr-008",
      name: "Leo Brennan",
      avatar_url: dicebear("LeoBrennan"),
      verified: false,
    },
    attendee_count: 11,
    max_capacity: 20,
    visibility: "group",
    distance: 0.9,
    pin_x: 38,
    pin_y: 15,
  },
];

// ---------------------------------------------------------------------------
// Mock Attendees (for stacked avatars on event detail)
// ---------------------------------------------------------------------------

export const MOCK_ATTENDEES: MockAttendee[] = [
  { id: "att-01", name: "Alex Kim", avatar_url: dicebear("AlexKim") },
  { id: "att-02", name: "Riley Brooks", avatar_url: dicebear("RileyBrooks") },
  { id: "att-03", name: "Casey Morgan", avatar_url: dicebear("CaseyMorgan") },
  { id: "att-04", name: "Taylor Reyes", avatar_url: dicebear("TaylorReyes") },
  { id: "att-05", name: "Jordan Lee", avatar_url: dicebear("JordanLee") },
];

// ---------------------------------------------------------------------------
// Conversations & Messages
// ---------------------------------------------------------------------------

export const mockConversations: MockConversation[] = [
  {
    id: "conv-001",
    user: {
      id: "usr-101",
      first_name: "Amara",
      avatar_url: dicebear("AmaraChat"),
      verification_level: "id",
      online: true,
      interests: ["hiking", "photography", "coffee"],
    },
    last_message: "That sounds perfect! See you at 7?",
    last_message_at: minutesAgo(2),
    unread_count: 2,
  },
  {
    id: "conv-002",
    user: {
      id: "usr-102",
      first_name: "Jordan",
      avatar_url: dicebear("JordanChat"),
      verification_level: "photo",
      online: true,
      interests: ["art", "music", "cooking"],
    },
    last_message: "I had so much fun last night!",
    last_message_at: minutesAgo(15),
    unread_count: 1,
  },
  {
    id: "conv-003",
    user: {
      id: "usr-103",
      first_name: "Priya",
      avatar_url: dicebear("PriyaChat"),
      verification_level: "id",
      online: false,
      interests: ["yoga", "reading", "travel"],
    },
    last_message: "Have you been to that new place on 5th?",
    last_message_at: minutesAgo(47),
    unread_count: 0,
  },
  {
    id: "conv-004",
    user: {
      id: "usr-104",
      first_name: "Kai",
      avatar_url: dicebear("KaiChat"),
      verification_level: "none",
      online: false,
      interests: ["basketball", "gaming", "film"],
    },
    last_message: "Good game today! We should run it back",
    last_message_at: minutesAgo(180),
    unread_count: 0,
  },
  {
    id: "conv-005",
    user: {
      id: "usr-105",
      first_name: "Elise",
      avatar_url: dicebear("EliseChat"),
      verification_level: "photo",
      online: false,
      interests: ["jazz", "wine", "writing"],
    },
    last_message: "That jazz spot was incredible",
    last_message_at: minutesAgo(1440),
    unread_count: 0,
  },
  {
    id: "conv-006",
    user: {
      id: "usr-106",
      first_name: "Leo",
      avatar_url: dicebear("LeoChat"),
      verification_level: "id",
      online: true,
      interests: ["board games", "hiking", "dogs"],
    },
    last_message: "Bringing Settlers of Catan on Saturday!",
    last_message_at: minutesAgo(2880),
    unread_count: 0,
  },
];

/** New matches that haven't had conversations yet */
export const mockNewMatches: MockConversationUser[] = [
  {
    id: "usr-201",
    first_name: "Sofia",
    avatar_url: dicebear("SofiaMatch"),
    verification_level: "id",
    interests: ["dance", "travel", "cooking"],
  },
  {
    id: "usr-202",
    first_name: "Marcus",
    avatar_url: dicebear("MarcusMatch"),
    verification_level: "photo",
    interests: ["climbing", "coffee", "photography"],
  },
  {
    id: "usr-203",
    first_name: "Nina",
    avatar_url: dicebear("NinaMatch"),
    verification_level: "none",
    interests: ["running", "painting", "music"],
  },
  {
    id: "usr-204",
    first_name: "Theo",
    avatar_url: dicebear("TheoMatch"),
    verification_level: "id",
    interests: ["hiking", "film", "cooking"],
  },
  {
    id: "usr-205",
    first_name: "Luna",
    avatar_url: dicebear("LunaMatch"),
    verification_level: "photo",
    interests: ["yoga", "surfing", "dogs"],
  },
];

// ---------------------------------------------------------------------------
// Per-conversation message histories
// ---------------------------------------------------------------------------

/** Amara -- hiking / photography / planning a Saturday morning hike */
const amaraMessages: MockMessage[] = [
  {
    id: "msg-001",
    conversation_id: "conv-001",
    sender_id: "usr-101",
    content: "Hey! I saw we both love hiking. What's your favorite trail around here?",
    created_at: minutesAgo(240),
    read_at: minutesAgo(238),
  },
  {
    id: "msg-002",
    conversation_id: "conv-001",
    sender_id: CURRENT_USER_ID,
    content: "Oh nice! I've been exploring the Riverside Loop a lot lately. It's gorgeous at sunset.",
    created_at: minutesAgo(235),
    read_at: minutesAgo(232),
  },
  {
    id: "msg-003",
    conversation_id: "conv-001",
    sender_id: "usr-101",
    content: "I love that one! The section near the waterfall is my favorite part",
    created_at: minutesAgo(230),
    read_at: minutesAgo(228),
  },
  {
    id: "msg-004",
    conversation_id: "conv-001",
    sender_id: "usr-101",
    content: "Have you tried the north ridge extension? It's a bit more challenging but the views are unreal",
    created_at: minutesAgo(228),
    read_at: minutesAgo(220),
  },
  {
    id: "msg-005",
    conversation_id: "conv-001",
    sender_id: CURRENT_USER_ID,
    content: "Not yet! I've been wanting to though. I heard you can see the whole city from up there",
    created_at: minutesAgo(215),
    read_at: minutesAgo(210),
  },
  {
    id: "msg-006",
    conversation_id: "conv-001",
    sender_id: "usr-101",
    content: "You totally can. I actually take my camera up there for photography sessions",
    created_at: minutesAgo(200),
    read_at: minutesAgo(195),
  },
  {
    id: "msg-007",
    conversation_id: "conv-001",
    sender_id: CURRENT_USER_ID,
    content: "That's so cool! I'm getting into photography too. Mostly landscape stuff",
    created_at: minutesAgo(190),
    read_at: minutesAgo(185),
  },
  {
    id: "msg-008",
    conversation_id: "conv-001",
    sender_id: "usr-101",
    content: "We should totally go together sometime! I know all the best spots",
    created_at: minutesAgo(60),
    read_at: minutesAgo(55),
  },
  {
    id: "msg-009",
    conversation_id: "conv-001",
    sender_id: CURRENT_USER_ID,
    content: "I'd love that! Are you free this weekend? Maybe Saturday morning?",
    created_at: minutesAgo(50),
    read_at: minutesAgo(45),
  },
  {
    id: "msg-010",
    conversation_id: "conv-001",
    sender_id: "usr-101",
    content: "Saturday works! There's also this amazing coffee shop at the trailhead. We could grab a drink after",
    created_at: minutesAgo(30),
    read_at: minutesAgo(25),
  },
  {
    id: "msg-011",
    conversation_id: "conv-001",
    sender_id: CURRENT_USER_ID,
    content: "You had me at coffee. What time works for you?",
    created_at: minutesAgo(15),
    read_at: minutesAgo(10),
  },
  {
    id: "msg-012",
    conversation_id: "conv-001",
    sender_id: "usr-101",
    content: "How about 7am? Early enough to catch the golden hour for photos!",
    created_at: minutesAgo(5),
    read_at: minutesAgo(3),
  },
  {
    id: "msg-013",
    conversation_id: "conv-001",
    sender_id: "usr-101",
    content: "That sounds perfect! See you at 7?",
    created_at: minutesAgo(2),
    read_at: null,
  },
];

/** Jordan -- art gallery night & cooking plans */
const jordanMessages: MockMessage[] = [
  {
    id: "jmsg-001",
    conversation_id: "conv-002",
    sender_id: CURRENT_USER_ID,
    content: "Hey Jordan! Your sketches on your profile are incredible. Where do you usually draw?",
    created_at: daysAgo(2, 10),
    read_at: daysAgo(2, 10),
  },
  {
    id: "jmsg-002",
    conversation_id: "conv-002",
    sender_id: "usr-102",
    content: "Thank you! Honestly anywhere that has good light and decent coffee. Blue Bottle is my go-to",
    created_at: daysAgo(2, 10),
    read_at: daysAgo(2, 10),
  },
  {
    id: "jmsg-003",
    conversation_id: "conv-002",
    sender_id: CURRENT_USER_ID,
    content: "Love Blue Bottle! Have you been to the HOPE gallery pop-up on East 6th? I keep meaning to go",
    created_at: daysAgo(2, 11),
    read_at: daysAgo(2, 11),
  },
  {
    id: "jmsg-004",
    conversation_id: "conv-002",
    sender_id: "usr-102",
    content: "Not yet! I heard it's amazing though. Apparently they have a mixed media installation that's mind-blowing",
    created_at: daysAgo(2, 11),
    read_at: daysAgo(2, 11),
  },
  {
    id: "jmsg-005",
    conversation_id: "conv-002",
    sender_id: CURRENT_USER_ID,
    content: "Want to check it out together? Maybe this weekend?",
    created_at: daysAgo(2, 12),
    read_at: daysAgo(2, 12),
  },
  {
    id: "jmsg-006",
    conversation_id: "conv-002",
    sender_id: "usr-102",
    content: "Absolutely! Saturday afternoon? We could grab food after -- I know a Thai place nearby that's incredible",
    created_at: daysAgo(2, 12),
    read_at: daysAgo(2, 12),
  },
  {
    id: "jmsg-007",
    conversation_id: "conv-002",
    sender_id: CURRENT_USER_ID,
    content: "That sounds perfect. Say 2pm at the gallery?",
    created_at: daysAgo(1, 9),
    read_at: daysAgo(1, 9),
  },
  {
    id: "jmsg-008",
    conversation_id: "conv-002",
    sender_id: "usr-102",
    content: "2pm works! I'll send you the address",
    created_at: daysAgo(1, 9),
    read_at: daysAgo(1, 9),
  },
  {
    id: "jmsg-009",
    conversation_id: "conv-002",
    sender_id: "usr-102",
    content: "Had such an amazing time tonight! That installation was even better in person",
    created_at: minutesAgo(600),
    read_at: minutesAgo(595),
  },
  {
    id: "jmsg-010",
    conversation_id: "conv-002",
    sender_id: CURRENT_USER_ID,
    content: "Same! And the Thai food was next level. You have great taste",
    created_at: minutesAgo(590),
    read_at: minutesAgo(585),
  },
  {
    id: "jmsg-011",
    conversation_id: "conv-002",
    sender_id: "usr-102",
    content: "Haha thanks! We should do this again. Maybe I can cook for you next time? I've been perfecting my pad see ew",
    created_at: minutesAgo(580),
    read_at: minutesAgo(575),
  },
  {
    id: "jmsg-012",
    conversation_id: "conv-002",
    sender_id: CURRENT_USER_ID,
    content: "Wait you cook Thai food too?? Yes please",
    created_at: minutesAgo(570),
    read_at: minutesAgo(565),
  },
  {
    id: "jmsg-013",
    conversation_id: "conv-002",
    sender_id: "usr-102",
    content: "I had so much fun last night!",
    created_at: minutesAgo(15),
    read_at: null,
  },
];

/** Priya -- new cafe discovery & yoga */
const priyaMessages: MockMessage[] = [
  {
    id: "pmsg-001",
    conversation_id: "conv-003",
    sender_id: "usr-103",
    content: "Hey! I noticed you're also into yoga. Do you practice at a studio or at home?",
    created_at: daysAgo(5, 8),
    read_at: daysAgo(5, 8),
  },
  {
    id: "pmsg-002",
    conversation_id: "conv-003",
    sender_id: CURRENT_USER_ID,
    content: "Hey Priya! Mostly at home but I've been wanting to try a studio. Any recommendations?",
    created_at: daysAgo(5, 9),
    read_at: daysAgo(5, 9),
  },
  {
    id: "pmsg-003",
    conversation_id: "conv-003",
    sender_id: "usr-103",
    content: "Black Swan Yoga on South Lamar is amazing. It's donation-based so super accessible. And the vibe is so chill",
    created_at: daysAgo(5, 9),
    read_at: daysAgo(5, 9),
  },
  {
    id: "pmsg-004",
    conversation_id: "conv-003",
    sender_id: CURRENT_USER_ID,
    content: "Donation-based! That's awesome. I've walked past it a million times. What days do you usually go?",
    created_at: daysAgo(5, 10),
    read_at: daysAgo(5, 10),
  },
  {
    id: "pmsg-005",
    conversation_id: "conv-003",
    sender_id: "usr-103",
    content: "I try to go Tuesdays and Thursdays for the evening flow. You should come sometime!",
    created_at: daysAgo(4, 11),
    read_at: daysAgo(4, 11),
  },
  {
    id: "pmsg-006",
    conversation_id: "conv-003",
    sender_id: CURRENT_USER_ID,
    content: "I'd love that! What are you reading right now by the way? Saw you're in a book club",
    created_at: daysAgo(3, 14),
    read_at: daysAgo(3, 14),
  },
  {
    id: "pmsg-007",
    conversation_id: "conv-003",
    sender_id: "usr-103",
    content: "Educated by Tara Westover. It's incredible -- can't put it down. What about you?",
    created_at: daysAgo(3, 15),
    read_at: daysAgo(3, 15),
  },
  {
    id: "pmsg-008",
    conversation_id: "conv-003",
    sender_id: CURRENT_USER_ID,
    content: "Ooh that's on my list! I just finished Piranesi by Susanna Clarke. Highly recommend if you like magical realism",
    created_at: daysAgo(2, 10),
    read_at: daysAgo(2, 10),
  },
  {
    id: "pmsg-009",
    conversation_id: "conv-003",
    sender_id: "usr-103",
    content: "Adding it to my list right now! Oh also -- random but have you been to that new place on 5th?",
    created_at: minutesAgo(47),
    read_at: minutesAgo(45),
  },
  {
    id: "pmsg-010",
    conversation_id: "conv-003",
    sender_id: "usr-103",
    content: "Have you been to that new place on 5th?",
    created_at: minutesAgo(47),
    read_at: minutesAgo(45),
  },
];

/** Kai -- basketball game & gaming */
const kaiMessages: MockMessage[] = [
  {
    id: "kmsg-001",
    conversation_id: "conv-004",
    sender_id: "usr-104",
    content: "Yo! You play ball? There's a pickup game at Gillis Park every Saturday morning",
    created_at: daysAgo(7, 15),
    read_at: daysAgo(7, 15),
  },
  {
    id: "kmsg-002",
    conversation_id: "conv-004",
    sender_id: CURRENT_USER_ID,
    content: "Yooo yes! I used to play in college. What time do y'all start?",
    created_at: daysAgo(7, 16),
    read_at: daysAgo(7, 16),
  },
  {
    id: "kmsg-003",
    conversation_id: "conv-004",
    sender_id: "usr-104",
    content: "Usually around 9. We run 5v5, sometimes 3v3 if less people show. It's super chill",
    created_at: daysAgo(7, 16),
    read_at: daysAgo(7, 16),
  },
  {
    id: "kmsg-004",
    conversation_id: "conv-004",
    sender_id: CURRENT_USER_ID,
    content: "Count me in for this Saturday! Haven't played in a while so go easy on me lol",
    created_at: daysAgo(6, 10),
    read_at: daysAgo(6, 10),
  },
  {
    id: "kmsg-005",
    conversation_id: "conv-004",
    sender_id: "usr-104",
    content: "Haha no promises! We're competitive but friendly. Also we usually grab tacos after at Veracruz",
    created_at: daysAgo(6, 10),
    read_at: daysAgo(6, 10),
  },
  {
    id: "kmsg-006",
    conversation_id: "conv-004",
    sender_id: "usr-104",
    content: "Also are you into gaming at all? We do game nights at my place sometimes. Smash Bros, Mario Kart, the classics",
    created_at: daysAgo(5, 20),
    read_at: daysAgo(5, 20),
  },
  {
    id: "kmsg-007",
    conversation_id: "conv-004",
    sender_id: CURRENT_USER_ID,
    content: "Dude YES. Smash Bros is my thing. Main Kirby and I'm not ashamed",
    created_at: daysAgo(5, 20),
    read_at: daysAgo(5, 20),
  },
  {
    id: "kmsg-008",
    conversation_id: "conv-004",
    sender_id: "usr-104",
    content: "Kirby?? Controversial choice. I respect it though. I'm a Fox main myself",
    created_at: daysAgo(5, 21),
    read_at: daysAgo(5, 21),
  },
  {
    id: "kmsg-009",
    conversation_id: "conv-004",
    sender_id: CURRENT_USER_ID,
    content: "We'll settle this on the sticks! That was such a good game today btw",
    created_at: minutesAgo(185),
    read_at: minutesAgo(182),
  },
  {
    id: "kmsg-010",
    conversation_id: "conv-004",
    sender_id: "usr-104",
    content: "Good game today! We should run it back",
    created_at: minutesAgo(180),
    read_at: minutesAgo(175),
  },
];

/** Elise -- jazz, wine, deep conversations */
const eliseMessages: MockMessage[] = [
  {
    id: "emsg-001",
    conversation_id: "conv-005",
    sender_id: CURRENT_USER_ID,
    content: "Hey Elise! I see you're into jazz. What's your favorite era?",
    created_at: daysAgo(10, 19),
    read_at: daysAgo(10, 19),
  },
  {
    id: "emsg-002",
    conversation_id: "conv-005",
    sender_id: "usr-105",
    content: "Oh that's a dangerous question! If I had to choose... late 50s cool jazz. Miles Davis, Chet Baker, that whole vibe",
    created_at: daysAgo(10, 20),
    read_at: daysAgo(10, 20),
  },
  {
    id: "emsg-003",
    conversation_id: "conv-005",
    sender_id: CURRENT_USER_ID,
    content: "Kind of Blue is one of my all-time favorite albums. Have you been to the Elephant Room downtown?",
    created_at: daysAgo(10, 20),
    read_at: daysAgo(10, 20),
  },
  {
    id: "emsg-004",
    conversation_id: "conv-005",
    sender_id: "usr-105",
    content: "YES! It's my favorite spot in the whole city. The acoustics are incredible down there. That basement just feels like you're in a Haruki Murakami novel",
    created_at: daysAgo(9, 8),
    read_at: daysAgo(9, 8),
  },
  {
    id: "emsg-005",
    conversation_id: "conv-005",
    sender_id: CURRENT_USER_ID,
    content: "Okay that's the perfect description. Want to go this weekend? I think they have a live trio on Friday",
    created_at: daysAgo(8, 14),
    read_at: daysAgo(8, 14),
  },
  {
    id: "emsg-006",
    conversation_id: "conv-005",
    sender_id: "usr-105",
    content: "I would LOVE that. Fair warning though, I might try to get us to stay for the entire set. And I always end up ordering their wine flight",
    created_at: daysAgo(8, 15),
    read_at: daysAgo(8, 15),
  },
  {
    id: "emsg-007",
    conversation_id: "conv-005",
    sender_id: CURRENT_USER_ID,
    content: "That's not a warning, that's a promise. I'm in. 8pm work?",
    created_at: daysAgo(8, 16),
    read_at: daysAgo(8, 16),
  },
  {
    id: "emsg-008",
    conversation_id: "conv-005",
    sender_id: "usr-105",
    content: "8pm is perfect. Oh and I write about music -- I might take some notes for a piece I'm working on. Hope that's not weird lol",
    created_at: daysAgo(7, 9),
    read_at: daysAgo(7, 9),
  },
  {
    id: "emsg-009",
    conversation_id: "conv-005",
    sender_id: CURRENT_USER_ID,
    content: "Not weird at all -- that's actually really cool. What kind of writing do you do?",
    created_at: daysAgo(7, 10),
    read_at: daysAgo(7, 10),
  },
  {
    id: "emsg-010",
    conversation_id: "conv-005",
    sender_id: "usr-105",
    content: "Mostly essays about music and culture. I have a small Substack. Maybe I'll share it with you after we've hung out -- don't want to scare you off before the first date haha",
    created_at: daysAgo(7, 11),
    read_at: daysAgo(7, 11),
  },
  {
    id: "emsg-011",
    conversation_id: "conv-005",
    sender_id: "usr-105",
    content: "That jazz spot was incredible",
    created_at: minutesAgo(1440),
    read_at: minutesAgo(1430),
  },
];

/** Leo -- board games, dogs, friendly banter */
const leoMessages: MockMessage[] = [
  {
    id: "lmsg-001",
    conversation_id: "conv-006",
    sender_id: "usr-106",
    content: "Hey! Saw you're in the Board Game Nights group too. What's your go-to game?",
    created_at: daysAgo(14, 11),
    read_at: daysAgo(14, 11),
  },
  {
    id: "lmsg-002",
    conversation_id: "conv-006",
    sender_id: CURRENT_USER_ID,
    content: "Hi Leo! I'm a Ticket to Ride person at heart but I've been getting into Wingspan lately",
    created_at: daysAgo(14, 12),
    read_at: daysAgo(14, 12),
  },
  {
    id: "lmsg-003",
    conversation_id: "conv-006",
    sender_id: "usr-106",
    content: "WINGSPAN! Such a good game. The art alone is worth it. I just got the Oceania expansion",
    created_at: daysAgo(14, 12),
    read_at: daysAgo(14, 12),
  },
  {
    id: "lmsg-004",
    conversation_id: "conv-006",
    sender_id: CURRENT_USER_ID,
    content: "Ooh jealous! We should play sometime. Do you go to the Thursday meetups at Vigilante?",
    created_at: daysAgo(13, 9),
    read_at: daysAgo(13, 9),
  },
  {
    id: "lmsg-005",
    conversation_id: "conv-006",
    sender_id: "usr-106",
    content: "Every other Thursday usually! I'd bring my dog but they're not exactly board-game-compatible lol. Golden retriever. Zero chill.",
    created_at: daysAgo(13, 10),
    read_at: daysAgo(13, 10),
  },
  {
    id: "lmsg-006",
    conversation_id: "conv-006",
    sender_id: CURRENT_USER_ID,
    content: "Omg I need to meet this dog immediately. What's their name??",
    created_at: daysAgo(13, 10),
    read_at: daysAgo(13, 10),
  },
  {
    id: "lmsg-007",
    conversation_id: "conv-006",
    sender_id: "usr-106",
    content: "Her name is Noodle. Yes, Noodle. She earned it.",
    created_at: daysAgo(13, 11),
    read_at: daysAgo(13, 11),
  },
  {
    id: "lmsg-008",
    conversation_id: "conv-006",
    sender_id: CURRENT_USER_ID,
    content: "Noodle the golden retriever. I'm already obsessed. Can we do a dog park + game day combo sometime?",
    created_at: daysAgo(12, 8),
    read_at: daysAgo(12, 8),
  },
  {
    id: "lmsg-009",
    conversation_id: "conv-006",
    sender_id: "usr-106",
    content: "That is genuinely the best idea anyone has ever had. Zilker Dog Park then games at mine?",
    created_at: daysAgo(12, 9),
    read_at: daysAgo(12, 9),
  },
  {
    id: "lmsg-010",
    conversation_id: "conv-006",
    sender_id: CURRENT_USER_ID,
    content: "Deal! This Saturday?",
    created_at: daysAgo(5, 14),
    read_at: daysAgo(5, 14),
  },
  {
    id: "lmsg-011",
    conversation_id: "conv-006",
    sender_id: "usr-106",
    content: "Bringing Settlers of Catan on Saturday!",
    created_at: minutesAgo(2880),
    read_at: minutesAgo(2870),
  },
];

/** All messages by user ID for quick lookup */
const messagesByUserId: Record<string, MockMessage[]> = {
  "usr-101": amaraMessages,
  "usr-102": jordanMessages,
  "usr-103": priyaMessages,
  "usr-104": kaiMessages,
  "usr-105": eliseMessages,
  "usr-106": leoMessages,
};

/** Get messages for a specific user (conversation partner). */
export function getMessagesForUser(userId: string): MockMessage[] {
  return messagesByUserId[userId] ?? [];
}

/** Backward-compatible export: default Amara messages */
export const mockMessages = amaraMessages;

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

export const groupCategories = [
  "Outdoor",
  "Music",
  "Food & Drink",
  "Social",
  "Tech",
] as const;

export type GroupCategory = (typeof groupCategories)[number];

// ---------------------------------------------------------------------------
// Group Users
// ---------------------------------------------------------------------------

export const mockGroupUsers: MockGroupUser[] = [
  {
    id: "gu1",
    name: "Sarah Chen",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    online: true,
    badge: "green",
  },
  {
    id: "gu2",
    name: "Marcus Johnson",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    online: false,
    badge: "blue",
  },
  {
    id: "gu3",
    name: "Elena Rodriguez",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    online: true,
    badge: "none",
  },
  {
    id: "gu4",
    name: "David Park",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    online: false,
    badge: "gold",
  },
  {
    id: "gu5",
    name: "Amara Okafor",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
    online: true,
    badge: "green",
  },
  {
    id: "gu6",
    name: "James Mitchell",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    online: false,
    badge: "none",
  },
  {
    id: "gu7",
    name: "Lina Vasquez",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",
    online: true,
    badge: "green",
  },
  {
    id: "gu8",
    name: "Ryan Osei",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face",
    online: false,
    badge: "blue",
  },
];

// ---------------------------------------------------------------------------
// Groups List
// ---------------------------------------------------------------------------

export const mockGroups: MockGroup[] = [
  // -- Joined groups --
  {
    id: "g1",
    name: "Trail Runners PDX",
    description:
      "Portland's most active trail running community. We explore Forest Park, the Gorge, and beyond. All paces welcome -- from casual joggers to ultra runners. Weekly group runs every Saturday at 7 AM.",
    member_count: 128,
    privacy_tier: "public",
    cover_image:
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=400&fit=crop",
    health_days_remaining: 38,
    category: "Outdoor",
    created_at: "2025-09-15",
    is_member: true,
  },
  {
    id: "g2",
    name: "Vinyl & Vibes",
    description:
      "For lovers of vinyl records, live music, and good conversations. We host listening parties, visit record shops, and attend local shows together. Spin your favorites with us.",
    member_count: 64,
    privacy_tier: "private",
    cover_image:
      "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=800&h=400&fit=crop",
    health_days_remaining: 12,
    category: "Music",
    created_at: "2025-11-02",
    is_member: true,
  },
  {
    id: "g3",
    name: "Supper Club Secret",
    description:
      "An underground dining experience. Each month a different member hosts a themed dinner party at their home. Recipes shared, friendships forged, bellies full.",
    member_count: 24,
    privacy_tier: "secret",
    cover_image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop",
    health_days_remaining: 3,
    category: "Food & Drink",
    created_at: "2025-08-20",
    is_member: true,
  },
  // -- Discover groups --
  {
    id: "g4",
    name: "Weekend Hikers",
    description:
      "Casual weekend hikes around the Pacific Northwest. Family-friendly, dog-friendly, and always scenic.",
    member_count: 256,
    privacy_tier: "public",
    cover_image:
      "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&h=400&fit=crop",
    health_days_remaining: 0,
    category: "Outdoor",
    created_at: "2025-06-10",
    is_member: false,
  },
  {
    id: "g5",
    name: "Jazz After Dark",
    description:
      "Late-night jazz sessions, album deep dives, and trips to local jazz clubs. Bring your ears and an open mind.",
    member_count: 42,
    privacy_tier: "private",
    cover_image:
      "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&h=400&fit=crop",
    health_days_remaining: 0,
    category: "Music",
    created_at: "2025-10-01",
    is_member: false,
  },
  {
    id: "g6",
    name: "Craft Beer Explorers",
    description:
      "Discover the best local craft breweries. Weekly tastings, brewery tours, and home-brew workshops.",
    member_count: 89,
    privacy_tier: "public",
    cover_image:
      "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800&h=400&fit=crop",
    health_days_remaining: 0,
    category: "Food & Drink",
    created_at: "2025-07-22",
    is_member: false,
  },
  {
    id: "g7",
    name: "Board Game Nights",
    description:
      "Strategy, party games, and everything in between. We meet every Thursday at rotating venues.",
    member_count: 156,
    privacy_tier: "public",
    cover_image:
      "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=800&h=400&fit=crop",
    health_days_remaining: 0,
    category: "Social",
    created_at: "2025-05-14",
    is_member: false,
  },
  {
    id: "g8",
    name: "Code & Coffee",
    description:
      "Developers, designers, and tech enthusiasts meeting over coffee. Pair programming, tech talks, and hack sessions.",
    member_count: 73,
    privacy_tier: "private",
    cover_image:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=400&fit=crop",
    health_days_remaining: 0,
    category: "Tech",
    created_at: "2025-09-30",
    is_member: false,
  },
  {
    id: "g9",
    name: "Sunrise Yoga Collective",
    description:
      "Start your day with intention. Outdoor yoga sessions at parks and beaches, followed by community breakfast.",
    member_count: 91,
    privacy_tier: "public",
    cover_image:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=400&fit=crop",
    health_days_remaining: 0,
    category: "Outdoor",
    created_at: "2025-04-18",
    is_member: false,
  },
  {
    id: "g10",
    name: "The Inner Circle",
    description:
      "An invite-only group for deep conversations, vulnerability, and personal growth. What happens here stays here.",
    member_count: 12,
    privacy_tier: "secret",
    cover_image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=400&fit=crop",
    health_days_remaining: 0,
    category: "Social",
    created_at: "2025-12-01",
    is_member: false,
  },
];

// ---------------------------------------------------------------------------
// Group Posts (for group feed)
// ---------------------------------------------------------------------------

export const mockGroupPosts: MockGroupPost[] = [
  {
    id: "gp1",
    user: mockGroupUsers[0],
    content:
      "Just finished the Wildwood Trail loop in Forest Park! 30 miles of pure bliss. Who's joining next Saturday's run?",
    image:
      "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600&h=400&fit=crop",
    timestamp: "2h ago",
    likes: 24,
    comments: 8,
    liked: true,
  },
  {
    id: "gp2",
    user: mockGroupUsers[1],
    content:
      "Found an original pressing of Kind of Blue at Everyday Music today. The crackle on the vinyl is *chef's kiss*. Listening party at my place this Friday?",
    timestamp: "5h ago",
    likes: 18,
    comments: 12,
    liked: false,
  },
  {
    id: "gp3",
    user: mockGroupUsers[2],
    content:
      "Reminder: This weekend's potluck theme is 'Street Food Around the World.' I'm bringing empanadas! Drop your dish in the comments so we don't double up.",
    image:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop",
    timestamp: "1d ago",
    likes: 31,
    comments: 15,
    liked: false,
  },
  {
    id: "gp4",
    user: mockGroupUsers[4],
    content:
      "Shoutout to everyone who showed up for the sunrise run this morning. 14 of us braved the cold and it was totally worth it. Hot chocolate meetup after was the cherry on top!",
    image:
      "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&h=400&fit=crop",
    timestamp: "1d ago",
    likes: 42,
    comments: 19,
    liked: true,
  },
  {
    id: "gp5",
    user: mockGroupUsers[3],
    content:
      "PSA: The new trail section by the river is open! It connects the east and west loops so you can now do a full 15-mile circuit without any road crossings. Game changer.",
    timestamp: "2d ago",
    likes: 56,
    comments: 23,
    liked: false,
  },
  {
    id: "gp6",
    user: mockGroupUsers[6],
    content:
      "Anyone want to carpool to the Austin Trail Festival next month? I have 3 spots in my car. It's going to be epic -- 5K, 10K, and half marathon options.",
    timestamp: "3d ago",
    likes: 15,
    comments: 7,
    liked: false,
  },
  {
    id: "gp7",
    user: mockGroupUsers[7],
    content:
      "New member here! Just moved to Austin from Denver. Used to run the Incline every week. Can't wait to explore the trails here with y'all. Any must-do routes?",
    timestamp: "4d ago",
    likes: 38,
    comments: 27,
    liked: true,
  },
];

// ---------------------------------------------------------------------------
// Group Events (for group detail)
// ---------------------------------------------------------------------------

export const mockGroupEvents: MockGroupEvent[] = [
  {
    id: "ge1",
    title: "Saturday Morning Trail Run",
    description:
      "Meet at the Lower Macleay trailhead. We'll do a 10-mile out-and-back on the Wildwood Trail. All paces welcome.",
    date: "Sat, Feb 15",
    time: "7:00 AM",
    location: "Lower Macleay Park, Portland",
    attendees: 23,
    cover_image:
      "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&h=300&fit=crop",
  },
  {
    id: "ge2",
    title: "Full Moon Night Run",
    description:
      "A magical evening run under the full moon. Headlamps required. We'll meet at Council Crest and run to Pittock Mansion.",
    date: "Thu, Feb 20",
    time: "8:30 PM",
    location: "Council Crest Park, Portland",
    attendees: 15,
    cover_image:
      "https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=600&h=300&fit=crop",
  },
  {
    id: "ge3",
    title: "Beginner's Trail Walk & Coffee",
    description:
      "A relaxed 3-mile walk for newcomers followed by coffee at the Tin Shed. Perfect way to meet the group!",
    date: "Sun, Feb 23",
    time: "9:00 AM",
    location: "Forest Park, NW Thurman St Entrance",
    attendees: 31,
    cover_image:
      "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=600&h=300&fit=crop",
  },
  {
    id: "ge4",
    title: "Trail Maintenance Volunteer Day",
    description:
      "Give back to the trails that give us so much! We'll be clearing debris and repairing erosion on the Leif Erikson Trail. Tools provided.",
    date: "Sat, Mar 1",
    time: "8:00 AM",
    location: "Leif Erikson Trailhead, Portland",
    attendees: 18,
    cover_image:
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&h=300&fit=crop",
  },
];

// ---------------------------------------------------------------------------
// Group Members (for group detail)
// ---------------------------------------------------------------------------

export const mockGroupMembers: MockGroupMember[] = [
  { user: mockGroupUsers[0], role: "Admin", health_days_remaining: 42 },
  { user: mockGroupUsers[1], role: "Moderator", health_days_remaining: 28 },
  { user: mockGroupUsers[2], role: "Member", health_days_remaining: 15 },
  { user: mockGroupUsers[3], role: "Member", health_days_remaining: 38 },
  { user: mockGroupUsers[4], role: "Member", health_days_remaining: 5 },
  { user: mockGroupUsers[5], role: "Member", health_days_remaining: 22 },
  { user: mockGroupUsers[6], role: "Member", health_days_remaining: 41 },
  { user: mockGroupUsers[7], role: "Member", health_days_remaining: 10 },
];

// ---------------------------------------------------------------------------
// Discovery -- User Profiles for Swipe Deck
// ---------------------------------------------------------------------------

export type DiscoverUser = User & {
  distance: string;
  shared_interests_count: number;
  groups: string[];
  /** Number of events this user has attended (for trust thermometer) */
  eventsAttended?: number;
};

export const discoverUsers: DiscoverUser[] = [
  {
    id: "u-001",
    phone_number: "+15125550101",
    first_name: "Maya",
    birthdate: birthdate(27),
    gender: "female",
    bio: "Freelance photographer chasing golden hour on the Lady Bird Lake trail. Looking for someone who appreciates a good breakfast taco debate.",
    verification_level: "id",
    location: { lat: 30.2672, lng: -97.7431 },
    last_active_at: new Date().toISOString(),
    created_at: "2025-09-12T10:00:00Z",
    subscription_tier: "plus",
    avatar_url: dicebear("Maya"),
    photos: [dicebear("Maya"), dicebearPhoto("Maya", 1), dicebearPhoto("Maya", 2), dicebearPhoto("Maya", 3)],
    interests: ["Photography", "Hiking", "Live Music", "Coffee", "Travel"],
    distance: "2 miles away",
    shared_interests_count: 3,
    groups: ["ATX Trail Runners", "South Austin Creatives"],
    eventsAttended: 12,
  },
  {
    id: "u-002",
    phone_number: "+15125550102",
    first_name: "Liam",
    birthdate: birthdate(31),
    gender: "male",
    bio: "Software engineer by day, pit-master by weekend. You can find me at Franklin BBQ or lost in a bookstore on South Congress.",
    verification_level: "photo",
    location: { lat: 30.259, lng: -97.755 },
    last_active_at: new Date().toISOString(),
    created_at: "2025-08-20T14:30:00Z",
    subscription_tier: "free",
    avatar_url: dicebear("Liam"),
    photos: [dicebear("Liam"), dicebearPhoto("Liam", 1), dicebearPhoto("Liam", 2)],
    interests: ["BBQ", "Reading", "Coding", "Board Games", "Cycling"],
    distance: "4 miles away",
    shared_interests_count: 2,
    groups: ["Austin Tech Meetup", "East Side Book Club"],
    eventsAttended: 5,
  },
  {
    id: "u-003",
    phone_number: "+15125550103",
    first_name: "Sofia",
    birthdate: birthdate(25),
    gender: "female",
    bio: "UT grad student studying marine biology -- yes, in a landlocked city. I make it work with Barton Springs and way too many plant babies.",
    verification_level: "id",
    location: { lat: 30.271, lng: -97.741 },
    last_active_at: new Date().toISOString(),
    created_at: "2025-10-01T08:15:00Z",
    subscription_tier: "premium",
    avatar_url: dicebear("Sofia"),
    photos: [dicebear("Sofia"), dicebearPhoto("Sofia", 1), dicebearPhoto("Sofia", 2), dicebearPhoto("Sofia", 3), dicebearPhoto("Sofia", 4)],
    interests: ["Science", "Swimming", "Plants", "Yoga", "Sustainability"],
    distance: "1 mile away",
    shared_interests_count: 4,
    groups: ["Barton Springs Regulars", "ATX Plant Exchange"],
    eventsAttended: 8,
  },
  {
    id: "u-004",
    phone_number: "+15125550104",
    first_name: "James",
    birthdate: birthdate(29),
    gender: "male",
    bio: "Musician playing keys around 6th Street most weekends. Big believer in vinyl, farmers markets, and dogs that are too big for apartments.",
    verification_level: "photo",
    location: { lat: 30.265, lng: -97.749 },
    last_active_at: new Date().toISOString(),
    created_at: "2025-07-15T19:00:00Z",
    subscription_tier: "plus",
    avatar_url: dicebear("James"),
    photos: [dicebear("James"), dicebearPhoto("James", 1), dicebearPhoto("James", 2)],
    interests: ["Live Music", "Vinyl Records", "Dogs", "Farmers Markets", "Piano"],
    distance: "3 miles away",
    shared_interests_count: 2,
    groups: ["ATX Musicians Collective", "Zilker Dog Park Regulars"],
    eventsAttended: 3,
  },
  {
    id: "u-005",
    phone_number: "+15125550105",
    first_name: "Priya",
    birthdate: birthdate(26),
    gender: "female",
    bio: "Product designer who paints on the side. Always training for some race I'll regret signing up for. Let's grab matcha and talk design.",
    verification_level: "id",
    location: { lat: 30.278, lng: -97.738 },
    last_active_at: new Date().toISOString(),
    created_at: "2025-11-08T11:30:00Z",
    subscription_tier: "free",
    avatar_url: dicebear("Priya"),
    photos: [dicebear("Priya"), dicebearPhoto("Priya", 1), dicebearPhoto("Priya", 2), dicebearPhoto("Priya", 3)],
    interests: ["Design", "Running", "Painting", "Matcha", "Art Museums"],
    distance: "2 miles away",
    shared_interests_count: 3,
    groups: ["ATX Trail Runners", "South Austin Creatives"],
    eventsAttended: 15,
  },
  {
    id: "u-006",
    phone_number: "+15125550106",
    first_name: "Ethan",
    birthdate: birthdate(33),
    gender: "male",
    bio: "Transplant from Denver. I trade snowboards for paddleboards now. Working on my startup and trying every taco truck in East Austin.",
    verification_level: "photo",
    location: { lat: 30.258, lng: -97.722 },
    last_active_at: new Date().toISOString(),
    created_at: "2025-06-30T16:45:00Z",
    subscription_tier: "premium",
    avatar_url: dicebear("Ethan"),
    photos: [dicebear("Ethan"), dicebearPhoto("Ethan", 1), dicebearPhoto("Ethan", 2)],
    interests: ["Paddleboarding", "Startups", "Tacos", "Rock Climbing", "Podcasts"],
    distance: "5 miles away",
    shared_interests_count: 1,
    groups: ["Austin Tech Meetup", "Lady Bird Lake Paddlers"],
    eventsAttended: 2,
  },
  {
    id: "u-007",
    phone_number: "+15125550107",
    first_name: "Aaliyah",
    birthdate: birthdate(24),
    gender: "female",
    bio: "Dance teacher at a studio on South Lamar. If I'm not teaching, I'm thrift-shopping or making questionable pottery. Come vibe.",
    verification_level: "id",
    location: { lat: 30.249, lng: -97.763 },
    last_active_at: new Date().toISOString(),
    created_at: "2025-12-01T09:00:00Z",
    subscription_tier: "free",
    avatar_url: dicebear("Aaliyah"),
    photos: [dicebear("Aaliyah"), dicebearPhoto("Aaliyah", 1), dicebearPhoto("Aaliyah", 2), dicebearPhoto("Aaliyah", 3)],
    interests: ["Dance", "Thrifting", "Pottery", "Vinyl Records", "Coffee"],
    distance: "3 miles away",
    shared_interests_count: 2,
    groups: ["South Austin Creatives", "ATX Pottery Studio"],
    eventsAttended: 7,
  },
  {
    id: "u-008",
    phone_number: "+15125550108",
    first_name: "Noah",
    birthdate: birthdate(28),
    gender: "male",
    bio: "Chef at a farm-to-table spot in the Domain. I take my sourdough very seriously. Looking for someone to explore the brewery scene with.",
    verification_level: "photo",
    location: { lat: 30.402, lng: -97.725 },
    last_active_at: new Date().toISOString(),
    created_at: "2025-10-20T13:00:00Z",
    subscription_tier: "plus",
    avatar_url: dicebear("Noah"),
    photos: [dicebear("Noah"), dicebearPhoto("Noah", 1), dicebearPhoto("Noah", 2)],
    interests: ["Cooking", "Craft Beer", "Sourdough", "Farmers Markets", "Cycling"],
    distance: "8 miles away",
    shared_interests_count: 2,
    groups: ["Austin Foodies Collective", "East Side Book Club"],
    eventsAttended: 10,
  },
  {
    id: "u-009",
    phone_number: "+15125550109",
    first_name: "Elena",
    birthdate: birthdate(30),
    gender: "female",
    bio: "Environmental lawyer trying to save the world one brief at a time. Decompresses with trail runs and extremely competitive trivia nights.",
    verification_level: "id",
    location: { lat: 30.285, lng: -97.745 },
    last_active_at: new Date().toISOString(),
    created_at: "2025-09-05T07:30:00Z",
    subscription_tier: "premium",
    avatar_url: dicebear("Elena"),
    photos: [dicebear("Elena"), dicebearPhoto("Elena", 1), dicebearPhoto("Elena", 2), dicebearPhoto("Elena", 3)],
    interests: ["Running", "Trivia", "Sustainability", "Wine", "Hiking"],
    distance: "1 mile away",
    shared_interests_count: 4,
    groups: ["ATX Trail Runners", "Barton Springs Regulars"],
    eventsAttended: 20,
  },
  {
    id: "u-010",
    phone_number: "+15125550110",
    first_name: "Marcus",
    birthdate: birthdate(32),
    gender: "male",
    bio: "Physical therapist who plays pick-up basketball at Gillis Park way too often. I make a mean margarita and know every mural in town.",
    verification_level: "photo",
    location: { lat: 30.297, lng: -97.752 },
    last_active_at: new Date().toISOString(),
    created_at: "2025-08-10T17:00:00Z",
    subscription_tier: "free",
    avatar_url: dicebear("MarcusATX"),
    photos: [dicebear("MarcusATX"), dicebearPhoto("MarcusATX", 1), dicebearPhoto("MarcusATX", 2)],
    interests: ["Basketball", "Street Art", "Cocktails", "Fitness", "Photography"],
    distance: "4 miles away",
    shared_interests_count: 2,
    groups: ["Zilker Dog Park Regulars", "ATX Musicians Collective"],
    eventsAttended: 6,
  },
];

// ---------------------------------------------------------------------------
// Discovery -- "Likes You" profiles (subset) -- legacy, used by cold invites
// ---------------------------------------------------------------------------

export const discoverLikesYou: DiscoverUser[] = [
  discoverUsers[2],  // Sofia
  discoverUsers[4],  // Priya
  discoverUsers[6],  // Aaliyah
  discoverUsers[8],  // Elena
];

// ---------------------------------------------------------------------------
// Invites -- Types
// ---------------------------------------------------------------------------

export type WarmInviteSource =
  | { type: "group"; groupName: string; groupId: string }
  | { type: "event"; eventName: string; eventId: string }
  | { type: "mutual_friends"; count: number };

export interface MockGroupInvite {
  id: string;
  group: MockGroup;
  invited_by: MockGroupUser;
  invited_at: string;
  message?: string;
}

export interface MockPersonalInvite {
  id: string;
  user: DiscoverUser;
  type: "warm" | "cold";
  source?: WarmInviteSource;
  invited_at: string;
}

// ---------------------------------------------------------------------------
// Invites -- Mock Data
// ---------------------------------------------------------------------------

export const mockGroupInvites: MockGroupInvite[] = [
  {
    id: "gi-001",
    group: mockGroups[4], // Jazz After Dark
    invited_by: mockGroupUsers[1], // Marcus Johnson
    invited_at: minutesAgo(120),
    message: "Thought you'd love this group!",
  },
  {
    id: "gi-002",
    group: mockGroups[7], // Code & Coffee
    invited_by: mockGroupUsers[3], // David Park
    invited_at: daysAgo(1),
  },
  {
    id: "gi-003",
    group: mockGroups[9], // The Inner Circle
    invited_by: mockGroupUsers[0], // Sarah Chen
    invited_at: daysAgo(2),
    message: "You'd be a great fit for this group",
  },
];

export const mockWarmInvites: MockPersonalInvite[] = [
  {
    id: "wi-001",
    user: discoverUsers[0], // Maya
    type: "warm",
    source: { type: "group", groupName: "ATX Trail Runners", groupId: "g1" },
    invited_at: minutesAgo(45),
  },
  {
    id: "wi-002",
    user: discoverUsers[3], // James
    type: "warm",
    source: { type: "mutual_friends", count: 3 },
    invited_at: minutesAgo(180),
  },
  {
    id: "wi-003",
    user: discoverUsers[7], // Noah
    type: "warm",
    source: { type: "event", eventName: "Coffee & Sketch Meetup", eventId: "evt-002" },
    invited_at: daysAgo(1),
  },
];

export const mockColdInvites: MockPersonalInvite[] = [
  {
    id: "ci-001",
    user: discoverUsers[2], // Sofia
    type: "cold",
    invited_at: minutesAgo(30),
  },
  {
    id: "ci-002",
    user: discoverUsers[4], // Priya
    type: "cold",
    invited_at: minutesAgo(90),
  },
  {
    id: "ci-003",
    user: discoverUsers[6], // Aaliyah
    type: "cold",
    invited_at: daysAgo(1),
  },
  {
    id: "ci-004",
    user: discoverUsers[8], // Elena
    type: "cold",
    invited_at: daysAgo(2),
  },
];

export function getUnreadInviteCount(): number {
  return mockGroupInvites.length + mockWarmInvites.length + mockColdInvites.length;
}

// ---------------------------------------------------------------------------
// Feed -- Connection Users (matched users who post to the feed)
// ---------------------------------------------------------------------------

export const mockConnectionUsers: MockGroupUser[] = [
  {
    id: "usr-101",
    name: "Amara",
    avatar: dicebear("AmaraChat"),
    online: true,
    badge: "green",
  },
  {
    id: "usr-102",
    name: "Jordan",
    avatar: dicebear("JordanChat"),
    online: true,
    badge: "blue",
  },
  {
    id: "usr-103",
    name: "Priya",
    avatar: dicebear("PriyaChat"),
    online: false,
    badge: "none",
  },
  {
    id: "usr-104",
    name: "Kai",
    avatar: dicebear("KaiChat"),
    online: false,
    badge: "none",
  },
  {
    id: "usr-105",
    name: "Elise",
    avatar: dicebear("EliseChat"),
    online: false,
    badge: "gold",
  },
  {
    id: "usr-106",
    name: "Leo",
    avatar: dicebear("LeoChat"),
    online: true,
    badge: "green",
  },
];

// ---------------------------------------------------------------------------
// Feed -- Main Feed Posts (mixed sources)
// ---------------------------------------------------------------------------

export const mockFeedPosts: MockFeedPost[] = [
  {
    id: "fp-01",
    user: mockConnectionUsers[0],
    source: { type: "connection" },
    content:
      "Just discovered the most amazing coffee shop near the trailhead. The pour-over is unreal. Anyone been to Houndstooth?",
    timestamp: "15m ago",
    likes: 8,
    comments: 3,
    liked: false,
  },
  {
    id: "fp-02",
    user: mockGroupUsers[0],
    source: { type: "group", groupId: "g1", groupName: "Trail Runners PDX" },
    content:
      "Just finished the Wildwood Trail loop in Forest Park! 30 miles of pure bliss. Who's joining next Saturday's run?",
    image:
      "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600&h=400&fit=crop",
    timestamp: "2h ago",
    likes: 24,
    comments: 8,
    liked: true,
  },
  {
    id: "fp-03",
    user: mockConnectionUsers[1],
    source: { type: "connection" },
    content:
      "Working on a new watercolor series inspired by East Austin murals. Art is therapy. Anyone want to come sketch with me this weekend?",
    image:
      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&h=400&fit=crop",
    timestamp: "3h ago",
    likes: 15,
    comments: 6,
    liked: false,
  },
  {
    id: "fp-04",
    user: mockGroupUsers[3],
    source: { type: "suggested", groupId: "g5", groupName: "Jazz After Dark" },
    content:
      "Tonight's album deep dive: A Love Supreme by John Coltrane. If you haven't experienced this in a dark room with good speakers, you haven't lived. Join us at 9pm.",
    timestamp: "4h ago",
    likes: 31,
    comments: 12,
    liked: false,
  },
  {
    id: "fp-05",
    user: mockGroupUsers[1],
    source: { type: "group", groupId: "g2", groupName: "Vinyl & Vibes" },
    content:
      "Found an original pressing of Kind of Blue at Everyday Music today. The crackle on the vinyl is *chef's kiss*. Listening party at my place this Friday?",
    timestamp: "5h ago",
    likes: 18,
    comments: 12,
    liked: false,
  },
  {
    id: "fp-06",
    user: mockConnectionUsers[4],
    source: { type: "connection" },
    content:
      "Just published a new essay on my Substack about how live jazz venues are the last real third places. Link in bio if you're curious.",
    timestamp: "6h ago",
    likes: 22,
    comments: 9,
    liked: true,
  },
  {
    id: "fp-07",
    user: mockGroupUsers[2],
    source: { type: "group", groupId: "g3", groupName: "Supper Club Secret" },
    content:
      "Reminder: This weekend's potluck theme is 'Street Food Around the World.' I'm bringing empanadas! Drop your dish in the comments so we don't double up.",
    image:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop",
    timestamp: "1d ago",
    likes: 31,
    comments: 15,
    liked: false,
  },
  {
    id: "fp-08",
    user: mockGroupUsers[5],
    source: {
      type: "suggested",
      groupId: "g7",
      groupName: "Board Game Nights",
    },
    content:
      "This Thursday we're doing a Wingspan tournament! Prizes for top 3. Beginners welcome -- we'll teach you the ropes. BYOB.",
    timestamp: "1d ago",
    likes: 27,
    comments: 14,
    liked: false,
  },
  {
    id: "fp-09",
    user: mockConnectionUsers[3],
    source: { type: "connection" },
    content:
      "Anyone else training for the Austin Marathon? Looking for a running buddy for the long runs. Currently doing 15-mile weekends.",
    timestamp: "1d ago",
    likes: 11,
    comments: 5,
    liked: false,
  },
  {
    id: "fp-10",
    user: mockGroupUsers[4],
    source: { type: "group", groupId: "g1", groupName: "Trail Runners PDX" },
    content:
      "Shoutout to everyone who showed up for the sunrise run this morning. 14 of us braved the cold and it was totally worth it. Hot chocolate meetup after was the cherry on top!",
    image:
      "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&h=400&fit=crop",
    timestamp: "2d ago",
    likes: 42,
    comments: 19,
    liked: true,
  },
  {
    id: "fp-11",
    user: mockConnectionUsers[5],
    source: { type: "connection" },
    content:
      "Noodle learned a new trick today. She can now 'shake' with both paws. Proud dog dad moment. We'll be at Zilker Dog Park tomorrow morning if anyone wants to meet her!",
    timestamp: "2d ago",
    likes: 34,
    comments: 11,
    liked: true,
  },
  {
    id: "fp-12",
    user: mockGroupUsers[7],
    source: { type: "suggested", groupId: "g8", groupName: "Code & Coffee" },
    content:
      "Hosting a beginner-friendly React Native workshop this Saturday at Houndstooth Coffee. Free, no signup needed. Just bring your laptop and curiosity.",
    timestamp: "3d ago",
    likes: 19,
    comments: 8,
    liked: false,
  },
];

/** Filter feed posts by source type. */
export function getFeedPostsBySource(
  source?: "connection" | "group" | "suggested",
): MockFeedPost[] {
  if (!source) return mockFeedPosts;
  if (source === "group") {
    return mockFeedPosts.filter(
      (p) => p.source.type === "group" || p.source.type === "suggested",
    );
  }
  return mockFeedPosts.filter((p) => p.source.type === source);
}

// ---------------------------------------------------------------------------
// Profile Posts (for profile activity feed)
// ---------------------------------------------------------------------------

export const CURRENT_USER_PROFILE_POSTS: MockProfilePost[] = [
  {
    id: "pp-01",
    type: "moment",
    content:
      "Just discovered the most amazing pour-over spot near the climbing gym. The barista recognized me from Austin Climbers. Small world!",
    timestamp: "2h ago",
    likes: 14,
    comments: 5,
    liked: false,
  },
  {
    id: "pp-02",
    type: "checkin",
    content:
      "Great session today! The bouldering problems were brutal but so rewarding.",
    image:
      "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=600&h=400&fit=crop",
    timestamp: "1d ago",
    likes: 22,
    comments: 7,
    liked: true,
    checkin: {
      eventTitle: "Saturday Morning Climb",
      eventId: "evt-001",
      locationName: "Austin Bouldering Project",
      groupName: "Austin Climbers",
      groupId: "grp-1",
      attendeeCount: 12,
    },
  },
  {
    id: "pp-03",
    type: "moment",
    content:
      "Vinyl haul from the weekend market. That Coltrane pressing was calling my name.",
    image:
      "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=600&h=400&fit=crop",
    timestamp: "2d ago",
    likes: 31,
    comments: 9,
    liked: false,
  },
  {
    id: "pp-04",
    type: "highlight",
    content:
      "This group has been the best thing about moving to Austin. If you're into climbing, join us!",
    timestamp: "3d ago",
    likes: 18,
    comments: 4,
    liked: true,
    highlight: {
      originalPost: {
        userName: "Sarah Chen",
        userAvatar: null,
        content:
          "Shoutout to everyone who showed up for the sunrise climb this morning. 14 of us braved the cold and it was totally worth it.",
        image:
          "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&h=400&fit=crop",
        groupName: "Austin Climbers",
      },
    },
  },
  {
    id: "pp-05",
    type: "checkin",
    content:
      "First time at a Design + Coffee meetup. Met some incredible product designers.",
    timestamp: "4d ago",
    likes: 15,
    comments: 3,
    liked: false,
    checkin: {
      eventTitle: "Design + Coffee Monthly",
      eventId: "evt-002",
      locationName: "Houndstooth Coffee",
      groupName: "Design + Coffee",
      groupId: "grp-3",
      attendeeCount: 8,
    },
  },
  {
    id: "pp-06",
    type: "moment",
    content:
      "Three months in Austin and I've already made more genuine connections than two years in my last city. This app is magic.",
    timestamp: "5d ago",
    likes: 42,
    comments: 11,
    liked: true,
  },
  {
    id: "pp-07",
    type: "checkin",
    content:
      "Listening party at Marcus's place was incredible. Kind of Blue on original vinyl hits different.",
    image:
      "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=600&h=400&fit=crop",
    timestamp: "1w ago",
    likes: 27,
    comments: 8,
    liked: false,
    checkin: {
      eventTitle: "Friday Listening Party",
      eventId: "evt-003",
      locationName: "Marcus's Place",
      groupName: "Vinyl Collectors ATX",
      groupId: "grp-2",
      attendeeCount: 6,
    },
  },
  {
    id: "pp-08",
    type: "highlight",
    content: "Can't wait for this! Who's coming?",
    timestamp: "1w ago",
    likes: 11,
    comments: 6,
    liked: false,
    highlight: {
      originalPost: {
        userName: "Vinyl Collectors ATX",
        userAvatar: null,
        content:
          "Next weekend: Record Store Crawl! We're hitting 5 shops in one afternoon. Bring your want-lists.",
        groupName: "Vinyl Collectors ATX",
      },
    },
  },
];

export const CURRENT_USER_CHECKINS = CURRENT_USER_PROFILE_POSTS.filter(
  (p) => p.type === "checkin",
);

// ---------------------------------------------------------------------------
// Current User's Connections (combined matches + conversations)
// ---------------------------------------------------------------------------

export interface MockConnection {
  id: string;
  firstName: string;
  avatarUrl: string | null;
  verificationLevel: "none" | "photo" | "id";
  online: boolean;
  interests: string[];
  /** How they connected */
  connectedVia: "match" | "event" | "group";
  /** When they connected */
  connectedAt: string;
  /** Mutual groups or events */
  mutualGroups?: number;
}

export const CURRENT_USER_CONNECTIONS: MockConnection[] = [
  {
    id: "usr-101",
    firstName: "Amara",
    avatarUrl: dicebear("AmaraChat"),
    verificationLevel: "id",
    online: true,
    interests: ["hiking", "photography", "coffee"],
    connectedVia: "match",
    connectedAt: daysAgo(3),
    mutualGroups: 1,
  },
  {
    id: "usr-102",
    firstName: "Jordan",
    avatarUrl: dicebear("JordanChat"),
    verificationLevel: "photo",
    online: true,
    interests: ["art", "music", "cooking"],
    connectedVia: "event",
    connectedAt: daysAgo(5),
    mutualGroups: 0,
  },
  {
    id: "usr-103",
    firstName: "Priya",
    avatarUrl: dicebear("PriyaChat"),
    verificationLevel: "id",
    online: false,
    interests: ["yoga", "reading", "travel"],
    connectedVia: "match",
    connectedAt: daysAgo(8),
    mutualGroups: 2,
  },
  {
    id: "usr-104",
    firstName: "Kai",
    avatarUrl: dicebear("KaiChat"),
    verificationLevel: "none",
    online: false,
    interests: ["basketball", "gaming", "film"],
    connectedVia: "group",
    connectedAt: daysAgo(12),
    mutualGroups: 1,
  },
  {
    id: "usr-105",
    firstName: "Elise",
    avatarUrl: dicebear("EliseChat"),
    verificationLevel: "photo",
    online: false,
    interests: ["jazz", "wine", "writing"],
    connectedVia: "event",
    connectedAt: daysAgo(14),
    mutualGroups: 0,
  },
  {
    id: "usr-106",
    firstName: "Leo",
    avatarUrl: dicebear("LeoChat"),
    verificationLevel: "id",
    online: true,
    interests: ["board games", "hiking", "dogs"],
    connectedVia: "match",
    connectedAt: daysAgo(18),
    mutualGroups: 1,
  },
  {
    id: "usr-201",
    firstName: "Sofia",
    avatarUrl: dicebear("SofiaMatch"),
    verificationLevel: "id",
    online: false,
    interests: ["dance", "travel", "cooking"],
    connectedVia: "match",
    connectedAt: daysAgo(1),
    mutualGroups: 0,
  },
  {
    id: "usr-202",
    firstName: "Marcus",
    avatarUrl: dicebear("MarcusMatch"),
    verificationLevel: "photo",
    online: true,
    interests: ["climbing", "coffee", "photography"],
    connectedVia: "group",
    connectedAt: daysAgo(2),
    mutualGroups: 2,
  },
  {
    id: "usr-203",
    firstName: "Nina",
    avatarUrl: dicebear("NinaMatch"),
    verificationLevel: "none",
    online: false,
    interests: ["running", "painting", "music"],
    connectedVia: "event",
    connectedAt: daysAgo(6),
    mutualGroups: 0,
  },
  {
    id: "usr-204",
    firstName: "Theo",
    avatarUrl: dicebear("TheoMatch"),
    verificationLevel: "id",
    online: false,
    interests: ["hiking", "film", "cooking"],
    connectedVia: "match",
    connectedAt: daysAgo(10),
    mutualGroups: 1,
  },
  {
    id: "usr-205",
    firstName: "Luna",
    avatarUrl: dicebear("LunaMatch"),
    verificationLevel: "photo",
    online: true,
    interests: ["yoga", "surfing", "dogs"],
    connectedVia: "event",
    connectedAt: daysAgo(15),
    mutualGroups: 1,
  },
  {
    id: "usr-301",
    firstName: "Milo",
    avatarUrl: dicebear("MiloConn"),
    verificationLevel: "id",
    online: false,
    interests: ["climbing", "travel", "coffee"],
    connectedVia: "group",
    connectedAt: daysAgo(20),
    mutualGroups: 1,
  },
];

// ---------------------------------------------------------------------------
// Current User's Attended Events (past events)
// ---------------------------------------------------------------------------

export interface MockUserEvent {
  id: string;
  title: string;
  locationName: string;
  date: string;
  attendeeCount: number;
  groupName?: string;
  coverImage: string;
  checkedIn: boolean;
}

export const CURRENT_USER_EVENTS: MockUserEvent[] = [
  {
    id: "ue-01",
    title: "Saturday Morning Climb",
    locationName: "Austin Bouldering Project",
    date: daysAgo(1),
    attendeeCount: 12,
    groupName: "Austin Climbers",
    coverImage: "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=600&h=400&fit=crop",
    checkedIn: true,
  },
  {
    id: "ue-02",
    title: "Design + Coffee Monthly",
    locationName: "Houndstooth Coffee",
    date: daysAgo(4),
    attendeeCount: 8,
    groupName: "Design + Coffee",
    coverImage: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=400&fit=crop",
    checkedIn: true,
  },
  {
    id: "ue-03",
    title: "Friday Listening Party",
    locationName: "Marcus's Place",
    date: daysAgo(7),
    attendeeCount: 6,
    groupName: "Vinyl Collectors ATX",
    coverImage: "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=600&h=400&fit=crop",
    checkedIn: true,
  },
  {
    id: "ue-04",
    title: "Sunset Yoga in the Park",
    locationName: "Riverside Park Lawn",
    date: daysAgo(10),
    attendeeCount: 18,
    coverImage: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop",
    checkedIn: true,
  },
  {
    id: "ue-05",
    title: "Live Jazz at the Elephant Room",
    locationName: "The Elephant Room",
    date: daysAgo(14),
    attendeeCount: 24,
    coverImage: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600&h=400&fit=crop",
    checkedIn: false,
  },
  {
    id: "ue-06",
    title: "Trail Run: Barton Creek",
    locationName: "Barton Creek Greenbelt",
    date: daysAgo(18),
    attendeeCount: 14,
    groupName: "Austin Climbers",
    coverImage: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&h=400&fit=crop",
    checkedIn: true,
  },
  {
    id: "ue-07",
    title: "Board Game & Beer Night",
    locationName: "Batch Craft Beer",
    date: daysAgo(21),
    attendeeCount: 10,
    coverImage: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600&h=400&fit=crop",
    checkedIn: false,
  },
  {
    id: "ue-08",
    title: "Coffee & Sketch Meetup",
    locationName: "Blue Bottle Coffee",
    date: daysAgo(25),
    attendeeCount: 9,
    groupName: "Design + Coffee",
    coverImage: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=400&fit=crop",
    checkedIn: true,
  },
];

export const CURRENT_USER_UPCOMING_EVENTS: MockUserEvent[] = [
  {
    id: "uf-01",
    title: "Sunrise Hike at Mount Bonnell",
    locationName: "Mount Bonnell Trailhead",
    date: daysFromNow(2, 7),
    attendeeCount: 16,
    groupName: "Austin Climbers",
    coverImage: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=400&fit=crop",
    checkedIn: false,
  },
  {
    id: "uf-02",
    title: "Design + Coffee Monthly",
    locationName: "Houndstooth Coffee",
    date: daysFromNow(5),
    attendeeCount: 11,
    groupName: "Design + Coffee",
    coverImage: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=400&fit=crop",
    checkedIn: false,
  },
  {
    id: "uf-03",
    title: "Open Mic Night",
    locationName: "The Mohawk",
    date: daysFromNow(8, 19),
    attendeeCount: 30,
    coverImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop",
    checkedIn: false,
  },
  {
    id: "uf-04",
    title: "Saturday Farmers Market Walk",
    locationName: "SFC Farmers Market",
    date: daysFromNow(12, 9),
    attendeeCount: 8,
    coverImage: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&h=400&fit=crop",
    checkedIn: false,
  },
];

// ---------------------------------------------------------------------------
// Daily Thoughtful Picks (for Discover > Picks tab)
// ---------------------------------------------------------------------------

export interface DailyPick {
  user: DiscoverUser;
  /** Pre-written reason why Vita matched this person */
  matchReason: string;
}

export const dailyPicks: DailyPick[] = [
  {
    user: discoverUsers[0], // Maya -- Photography, Hiking, Live Music, Coffee, Travel
    matchReason:
      "You both love Live Music and Coffee, and you're both in the ATX Trail Runners group.",
  },
  {
    user: discoverUsers[4], // Priya -- Design, Running, Painting, Matcha, Art Museums
    matchReason:
      "You share a passion for Design and you're both members of ATX Trail Runners and South Austin Creatives.",
  },
  {
    user: discoverUsers[8], // Elena -- Running, Trivia, Sustainability, Wine, Hiking
    matchReason:
      "You both enjoy Yoga and Hiking, and Elena has attended 20 events -- one of the most active people nearby.",
  },
];

// ---------------------------------------------------------------------------
// Mock Notifications
// ---------------------------------------------------------------------------

export interface MockNotification {
  id: string;
  type: "match" | "message" | "event_reminder" | "group_invite" | "health_warning" | "checkin_reminder";
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  /** Optional navigation target data */
  data?: { userId?: string; eventId?: string; groupId?: string };
}

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  // Today
  { id: "notif-1", type: "match", title: "New Connection!", body: "You and Sofia matched! Start a conversation.", timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), read: false, data: { userId: "sofia-1" } },
  { id: "notif-2", type: "message", title: "Amara sent a message", body: "Hey! Are you coming to the hike this weekend?", timestamp: new Date(Date.now() - 4 * 3600000).toISOString(), read: false, data: { userId: "amara-1" } },
  { id: "notif-3", type: "event_reminder", title: "Event starting soon", body: "Sunset Yoga in the Park starts in 2 hours", timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), read: true, data: { eventId: "event-1" } },
  // Yesterday
  { id: "notif-4", type: "group_invite", title: "Group invitation", body: "Sarah invited you to join Jazz After Dark", timestamp: new Date(Date.now() - 28 * 3600000).toISOString(), read: true, data: { groupId: "group-5" } },
  { id: "notif-5", type: "health_warning", title: "Health ring cooling", body: "Your Trail Runners PDX ring is at 32 days. Attend an event to stay active!", timestamp: new Date(Date.now() - 30 * 3600000).toISOString(), read: false, data: { groupId: "group-1" } },
  { id: "notif-6", type: "checkin_reminder", title: "Don't forget to check in!", body: "Coffee Tasting Workshop is happening now. Check in to keep your streak!", timestamp: new Date(Date.now() - 32 * 3600000).toISOString(), read: true, data: { eventId: "event-3" } },
  // This week
  { id: "notif-7", type: "match", title: "New Connection!", body: "You and Marcus matched! Say hello.", timestamp: new Date(Date.now() - 3 * 86400000).toISOString(), read: true, data: { userId: "marcus-1" } },
  { id: "notif-8", type: "message", title: "Kai sent a message", body: "That concert was amazing! We should go again", timestamp: new Date(Date.now() - 4 * 86400000).toISOString(), read: true, data: { userId: "kai-1" } },
  // Earlier
  { id: "notif-9", type: "event_reminder", title: "Event recap", body: "You attended Board Game Night! Rate your experience.", timestamp: new Date(Date.now() - 8 * 86400000).toISOString(), read: true, data: { eventId: "event-5" } },
  { id: "notif-10", type: "group_invite", title: "Group invitation", body: "You were invited to Sunrise Yoga Collective", timestamp: new Date(Date.now() - 12 * 86400000).toISOString(), read: true, data: { groupId: "group-9" } },
];
