import locomotiveImg from '../assets/images/locomotive_front_1789364674247.jpg';
import babyGardenImg from '../assets/images/baby_garden_train_1789364818347.jpg';
import trainCarriageImg from '../assets/images/train_carriage_side_1789364955804.jpg';
import babyStepsImg from '../assets/images/baby_carriage_steps_1789364980585.jpg';
import royalFrameImg from '../assets/images/royal_invitation_frame_1789364998097.jpg';
import babyBoyImg from '../assets/images/baby_boy_train_1789365022735.jpg';
import { BabyProfile, VideoScene } from '../types';

export const ASSET_IMAGES = {
  locomotiveFront: locomotiveImg,
  babyGarden: babyGardenImg,
  trainCarriage: trainCarriageImg,
  babySteps: babyStepsImg,
  royalFrame: royalFrameImg,
  babyBoy: babyBoyImg,
};

export const DEFAULT_BABY_VOICE = {
  enabled: true,
  script: "Goo goo gaga! Choo-choo! Welcome to my 1st Birthday party! Come eat cake with me and dance all day!",
  expression: 'cheerful' as const,
  tone: 'playful_toddler' as const,
  pitch: 1.4, // cute sweet toddler pitch
  intensity: 85, // joyful energy
  speed: 1.05,
  voiceVolume: 0.95,
  bgMusicDucking: 0.35,
  startDelay: 1.0,
  audioUrl: null,
  audioDuration: 7.0,
  showCaptionsOnVideo: false,
};


export const DEFAULT_PROFILE: BabyProfile = {
  name: 'Kiara',
  age: 1,
  gender: 'girl',
  date: '15 June 2026',
  time: '6:00 PM onwards',
  venueName: 'Little Stars Party Hall',
  venueAddress: 'Satellite Road, Ahmedabad',
  parentsNames: 'Mr. Rohan Patel & Mrs. Priya Patel',
  invitationNote: "With love, we invite you to celebrate our little princess's special day",
  photoUrl: null, // null will show the 3D animated fairy-tale baby, or user can upload photo
  avatarMode: '3d_doll',
  customVerse: 'All aboard the magical birthday train! A year of sweet giggles, wonder, and endless joy.',
  themeId: 'fairytale_pink',
  babyVoice: DEFAULT_BABY_VOICE,
};


export const PRESET_PROFILES: Record<string, BabyProfile> = {
  kiara: {
    ...DEFAULT_PROFILE,
  },
  liam: {
    name: 'Liam',
    age: 1,
    gender: 'boy',
    date: '22 August 2026',
    time: '5:30 PM onwards',
    venueName: 'Grand Royal Palms Palace',
    venueAddress: 'Victoria Boulevard, Sector 9',
    parentsNames: 'Mr. Arjun Sharma & Mrs. Neha Sharma',
    invitationNote: "With hearts full of love, we invite you to celebrate our little prince's 1st birthday",
    photoUrl: null,
    avatarMode: '3d_doll',
    customVerse: 'Our little royal adventurer is turning ONE! Join us for a royal celebration under golden stars.',
    themeId: 'royal_blue',
  },
  aria: {
    name: 'Aria',
    age: 1,
    gender: 'girl',
    date: '10 October 2026',
    time: '4:00 PM onwards',
    venueName: 'The Enchanted Garden Club',
    venueAddress: 'Meadow Hillview, West End',
    parentsNames: 'Mr. David Miller & Mrs. Emma Miller',
    invitationNote: "We joyfully invite you to celebrate one whole year of our sweetest sunshine",
    photoUrl: null,
    avatarMode: '3d_doll',
    customVerse: 'One whole year of tiny toes, button noses, and sweet baby giggles. Come party with us!',
    themeId: 'mint_safari',
  },
};

export const DEFAULT_SCENES: VideoScene[] = [
  {
    id: 's1',
    title: 'Train Arrival ("Turning ONE!")',
    startTime: 0,
    duration: 6,
    type: 'intro_locomotive',
  },
  {
    id: 's2',
    title: 'Baby Spotlight & Meadow',
    startTime: 6,
    duration: 5.5,
    type: 'baby_spotlight',
  },
  {
    id: 's3',
    title: 'Date & Time Carriage',
    startTime: 11.5,
    duration: 5.5,
    type: 'date_time_carriage',
  },
  {
    id: 's4',
    title: 'Join Celebration Carriage',
    startTime: 17,
    duration: 4.5,
    type: 'celebrate_carriage',
  },
  {
    id: 's5',
    title: 'Baby Boarding Carriage',
    startTime: 21.5,
    duration: 5,
    type: 'baby_boarding',
  },
  {
    id: 's6',
    title: 'Party Venue Carriage',
    startTime: 26.5,
    duration: 5.5,
    type: 'venue_carriage',
  },
  {
    id: 's7',
    title: 'Family Invitation & Blessing',
    startTime: 32,
    duration: 6,
    type: 'blessing_card',
  },
];

export const TOTAL_DURATION = DEFAULT_SCENES.reduce((acc, s) => acc + s.duration, 0); // 38 seconds, exact match to user video!
