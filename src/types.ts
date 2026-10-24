export type BabyVoiceExpression =
  | 'funny'
  | 'cheerful'
  | 'excited'
  | 'cute_sweet'
  | 'royal_prince_princess'
  | 'giggle_laugh';

export type BabyVoiceTone =
  | 'playful_toddler'
  | 'tiny_newborn'
  | 'animated_cartoon'
  | 'silly_chipmunk'
  | 'sweet_fairytale';

export interface BabyVoiceConfig {
  enabled: boolean;
  script: string;
  expression: BabyVoiceExpression;
  tone: BabyVoiceTone;
  pitch: number; // 0.8 to 2.2
  intensity: number; // 20 to 100
  speed: number; // 0.8 to 1.3
  voiceVolume: number; // 0 to 1
  bgMusicDucking: number; // 0 to 1
  startDelay: number; // seconds
  audioUrl: string | null;
  audioDuration: number;
  showCaptionsOnVideo: boolean;
}

export interface BabyProfile {
  name: string;
  age: number;
  gender: 'girl' | 'boy';
  date: string;
  time: string;
  venueName: string;
  venueAddress: string;
  parentsNames: string;
  invitationNote: string;
  photoUrl: string | null;
  avatarMode: 'photo_frame' | '3d_doll' | 'photo_with_doll';
  customVerse: string;
  themeId: 'fairytale_pink' | 'royal_blue' | 'mint_safari';
  babyVoice?: BabyVoiceConfig;
}

export interface VideoScene {
  id: string;
  title: string;
  startTime: number;
  duration: number;
  type:
    | 'intro_locomotive'
    | 'baby_spotlight'
    | 'date_time_carriage'
    | 'celebrate_carriage'
    | 'baby_boarding'
    | 'venue_carriage'
    | 'blessing_card';
}

export type AspectRatioType = '9:16' | '1:1' | '16:9';
export type MusicThemeType = 'fairytale_box' | 'birthday_chimes' | 'lullaby_bells' | 'none';

export interface VideoConfig {
  aspectRatio: AspectRatioType;
  fps: number;
  musicTheme: MusicThemeType;
  soundEffects: boolean;
  sparkleIntensity: number;
  showWatermark: boolean;
  babyVoice: BabyVoiceConfig;
}

