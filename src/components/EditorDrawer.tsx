import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Upload,
  Calendar,
  Clock,
  MapPin,
  Users,
  Heart,
  Baby,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Wand2,
  Trash2,
  Mic,
  Sliders,
  Palette,
} from 'lucide-react';
import { BabyProfile, VideoConfig } from '../types';
import { PRESET_PROFILES } from '../data/samplePresets';
import { BabyVoiceGenerator } from './BabyVoiceGenerator';

interface EditorDrawerProps {
  profile: BabyProfile;
  config: VideoConfig;
  onChangeProfile: (updates: Partial<BabyProfile>) => void;
  onChangeConfig: (updates: Partial<VideoConfig>) => void;
  onOpenExporter?: () => void;
}

export const EditorDrawer: React.FC<EditorDrawerProps> = ({
  profile,
  config,
  onChangeProfile,
  onChangeConfig,
  onOpenExporter,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<'voice' | 'details' | 'venue' | 'visuals'>('voice');
  const [isGeneratingVerse, setIsGeneratingVerse] = useState<boolean>(false);
  const [aiVerseMessage, setAiVerseMessage] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onChangeProfile({ photoUrl: dataUrl, avatarMode: 'photo_frame' });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    onChangeProfile({ photoUrl: null, avatarMode: '3d_doll' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerateVerse = async () => {
    setIsGeneratingVerse(true);
    setAiVerseMessage(null);
    try {
      const res = await fetch('/api/gemini/generate-verse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          age: profile.age,
          gender: profile.gender,
          theme: profile.themeId,
        }),
      });
      const data = await res.json();
      if (data.verse) {
        onChangeProfile({
          customVerse: data.verse,
          invitationNote: data.subline || profile.invitationNote,
        });
        setAiVerseMessage('✨ AI Verse applied to celebration invitation!');
        setTimeout(() => setAiVerseMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
      onChangeProfile({
        customVerse: `All aboard the celebration express! Sweet dreams and giggles we confess, as our precious ${profile.name || 'star'} turns ONE today!`,
      });
    } finally {
      setIsGeneratingVerse(false);
    }
  };

  const handleSelectPreset = (key: string) => {
    const preset = PRESET_PROFILES[key];
    if (preset) {
      onChangeProfile({ ...preset });
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Tab Navigation Navigation Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-stone-900/90 backdrop-blur-xl rounded-2xl border border-stone-800 shadow-xl overflow-x-auto scrollbar-none">
        <button
          id="tab-baby-voice-generator"
          type="button"
          onClick={() => setActiveTab('voice')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'voice'
              ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white shadow-lg shadow-pink-500/25 scale-[1.02]'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>🎙️ Baby Voice Generator</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-black/30 text-amber-200 uppercase tracking-wider font-extrabold">
            Featured
          </span>
        </button>

        <button
          id="tab-child-details"
          type="button"
          onClick={() => setActiveTab('details')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'details'
              ? 'bg-pink-500/25 text-pink-200 border border-pink-500/50 shadow-md'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
          }`}
        >
          <Baby className="w-4 h-4 text-pink-400" />
          <span>Baby Photo & Star</span>
        </button>

        <button
          id="tab-event-venue"
          type="button"
          onClick={() => setActiveTab('venue')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'venue'
              ? 'bg-pink-500/25 text-pink-200 border border-pink-500/50 shadow-md'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
          }`}
        >
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>Date, Time & Venue</span>
        </button>

        <button
          id="tab-visual-effects"
          type="button"
          onClick={() => setActiveTab('visuals')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'visuals'
              ? 'bg-pink-500/25 text-pink-200 border border-pink-500/50 shadow-md'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Sparkles & Rhyme</span>
        </button>
      </div>

      {/* Tab 1: Dedicated Baby Voice Generator */}
      {activeTab === 'voice' && (
        <BabyVoiceGenerator
          profile={profile}
          config={config}
          onChangeProfile={onChangeProfile}
          onChangeConfig={onChangeConfig}
          onOpenExporter={onOpenExporter}
        />
      )}

      {/* Tab 2: Child Details & Photo */}
      {activeTab === 'details' && (
        <div className="flex flex-col gap-6 bg-stone-900/90 backdrop-blur-xl p-4 sm:p-6 rounded-2xl border border-stone-800 shadow-xl text-stone-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-400" />
                <span>Birthday Star & Photo</span>
              </h3>
              <p className="text-xs text-stone-400">
                Personalize the name, age, and attach a picture of your child for the 3D animated floral frame.
              </p>
            </div>

            {/* Quick Sample Presets */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Presets:</span>
              <button
                onClick={() => handleSelectPreset('kiara')}
                className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                  profile.name === 'Kiara'
                    ? 'bg-pink-500/20 text-pink-300 border-pink-500/50 font-semibold'
                    : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-stone-200'
                }`}
              >
                🌸 Kiara (Girl)
              </button>
              <button
                onClick={() => handleSelectPreset('liam')}
                className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                  profile.name === 'Liam'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 font-semibold'
                    : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-stone-200'
                }`}
              >
                👑 Liam (Boy)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Child Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="child-name-input" className="text-xs font-semibold text-stone-300">
                Child's First Name
              </label>
              <input
                id="child-name-input"
                type="text"
                value={profile.name}
                onChange={(e) => onChangeProfile({ name: e.target.value })}
                placeholder="e.g. Kiara"
                className="w-full px-3 py-2 bg-stone-800/80 rounded-xl border border-stone-700 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-sm text-white placeholder-stone-500 transition-all"
              />
            </div>

            {/* Age & Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="child-age-input" className="text-xs font-semibold text-stone-300">
                  Turning Age
                </label>
                <input
                  id="child-age-input"
                  type="number"
                  min="1"
                  max="10"
                  value={profile.age}
                  onChange={(e) => onChangeProfile({ age: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-stone-800/80 rounded-xl border border-stone-700 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-sm text-white transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-stone-300">Gender / Theme</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onChangeProfile({ gender: 'girl', themeId: 'fairytale_pink' })}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all border ${
                      profile.gender === 'girl'
                        ? 'bg-pink-500/25 border-pink-500 text-pink-200'
                        : 'bg-stone-800/80 border-stone-700 text-stone-400'
                    }`}
                  >
                    👧 Girl (Pink)
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeProfile({ gender: 'boy', themeId: 'royal_blue' })}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all border ${
                      profile.gender === 'boy'
                        ? 'bg-blue-500/25 border-blue-500 text-blue-200'
                        : 'bg-stone-800/80 border-stone-700 text-stone-400'
                    }`}
                  >
                    👦 Boy (Blue)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Photo Upload */}
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                <span>Upload Baby's Photo</span>
              </label>
              {profile.photoUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove Photo</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              id="baby-photo-upload-input"
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            {profile.photoUrl ? (
              <div className="flex items-center gap-3 p-3 bg-stone-800/60 rounded-xl border border-pink-500/30">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-pink-400 shadow-md flex-shrink-0">
                  <img
                    src={profile.photoUrl}
                    alt="Baby Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[10px]">
                    ✓
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">Baby photo attached!</p>
                  <p className="text-[11px] text-stone-400">
                    Appears inside the 3D animated floral cameo frame in Scene 2.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] text-pink-400 hover:text-pink-300 underline mt-1"
                  >
                    Change photo
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-stone-700 hover:border-pink-500/70 rounded-xl bg-stone-800/40 hover:bg-stone-800/70 transition-all cursor-pointer group"
              >
                <Upload className="w-6 h-6 text-stone-400 group-hover:text-pink-400 transition-colors mb-1" />
                <p className="text-xs font-semibold text-stone-200">Click or drag baby photo here</p>
                <p className="text-[10px] text-stone-400 mt-0.5">PNG, JPG (or keep default 3D doll character)</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Event & Venue Details */}
      {activeTab === 'venue' && (
        <div className="flex flex-col gap-6 bg-stone-900/90 backdrop-blur-xl p-4 sm:p-6 rounded-2xl border border-stone-800 shadow-xl text-stone-200">
          <div className="pb-3 border-b border-stone-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>Event Details, Time & Venue</span>
            </h3>
            <p className="text-xs text-stone-400">
              Displayed across the train carriages and the final blessing invitation card.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date & Time */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="event-date-input" className="text-xs font-semibold text-stone-300 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-stone-400" />
                <span>Celebration Date</span>
              </label>
              <input
                id="event-date-input"
                type="text"
                value={profile.date}
                onChange={(e) => onChangeProfile({ date: e.target.value })}
                placeholder="e.g. 15 June 2026"
                className="w-full px-3 py-2 bg-stone-800/80 rounded-xl border border-stone-700 focus:border-pink-500 text-sm text-white"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="event-time-input" className="text-xs font-semibold text-stone-300 flex items-center gap-1">
                <Clock className="w-3 h-3 text-stone-400" />
                <span>Time</span>
              </label>
              <input
                id="event-time-input"
                type="text"
                value={profile.time}
                onChange={(e) => onChangeProfile({ time: e.target.value })}
                placeholder="e.g. 6:00 PM onwards"
                className="w-full px-3 py-2 bg-stone-800/80 rounded-xl border border-stone-700 focus:border-pink-500 text-sm text-white"
              />
            </div>

            {/* Venue Name & Address */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="venue-name-input" className="text-xs font-semibold text-stone-300 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-stone-400" />
                <span>Venue Name</span>
              </label>
              <input
                id="venue-name-input"
                type="text"
                value={profile.venueName}
                onChange={(e) => onChangeProfile({ venueName: e.target.value })}
                placeholder="e.g. Little Stars Party Hall"
                className="w-full px-3 py-2 bg-stone-800/80 rounded-xl border border-stone-700 focus:border-pink-500 text-sm text-white"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="venue-address-input" className="text-xs font-semibold text-stone-300">
                Venue Address / Area
              </label>
              <input
                id="venue-address-input"
                type="text"
                value={profile.venueAddress}
                onChange={(e) => onChangeProfile({ venueAddress: e.target.value })}
                placeholder="e.g. Satellite Road, Ahmedabad"
                className="w-full px-3 py-2 bg-stone-800/80 rounded-xl border border-stone-700 focus:border-pink-500 text-sm text-white"
              />
            </div>

            {/* Parents' Names */}
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label htmlFor="parents-names-input" className="text-xs font-semibold text-stone-300 flex items-center gap-1">
                <Users className="w-3 h-3 text-stone-400" />
                <span>Parents' Names (Sign-off Card)</span>
              </label>
              <input
                id="parents-names-input"
                type="text"
                value={profile.parentsNames}
                onChange={(e) => onChangeProfile({ parentsNames: e.target.value })}
                placeholder="e.g. Mr. Rohan Patel & Mrs. Priya Patel"
                className="w-full px-3 py-2 bg-stone-800/80 rounded-xl border border-stone-700 focus:border-pink-500 text-sm text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Sparkles & Visual Effects */}
      {activeTab === 'visuals' && (
        <div className="flex flex-col gap-6 bg-stone-900/90 backdrop-blur-xl p-4 sm:p-6 rounded-2xl border border-stone-800 shadow-xl text-stone-200">
          <div className="pb-3 border-b border-stone-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Sparkles, Rhyme & Invitation Message</span>
            </h3>
            <p className="text-xs text-stone-400">
              Customize golden sparkles intensity and custom celebratory rhymes.
            </p>
          </div>

          {/* AI Rhyme Generator */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5" />
                <span>Celebration Rhyme (Scene 4 & 7)</span>
              </label>

              <button
                id="generate-ai-verse-btn"
                type="button"
                onClick={handleGenerateVerse}
                disabled={isGeneratingVerse}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/20 text-pink-300 hover:text-white border border-pink-500/40 text-xs font-semibold hover:bg-pink-500/30 transition-all cursor-pointer"
              >
                {isGeneratingVerse ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Crafting AI Rhyme...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Generate Custom AI Rhyme</span>
                  </>
                )}
              </button>
            </div>

            {aiVerseMessage && <p className="text-xs text-emerald-400 font-medium">{aiVerseMessage}</p>}

            <textarea
              id="custom-verse-textarea"
              rows={2}
              value={profile.customVerse}
              onChange={(e) => onChangeProfile({ customVerse: e.target.value })}
              className="w-full px-3 py-2 bg-stone-800/80 rounded-xl border border-stone-700 focus:border-pink-500 text-xs text-stone-200"
            />
          </div>

          {/* Sparkles Intensity Slider */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-stone-950/60 border border-stone-800">
            <span className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Golden Star Sparkles Intensity:</span>
            </span>
            <div className="flex items-center gap-3">
              <input
                id="sparkle-intensity-slider"
                type="range"
                min="0"
                max="100"
                value={config.sparkleIntensity}
                onChange={(e) => onChangeConfig({ sparkleIntensity: parseInt(e.target.value) || 50 })}
                className="w-32 h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
              <span className="text-stone-300 font-mono text-xs">{config.sparkleIntensity}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
