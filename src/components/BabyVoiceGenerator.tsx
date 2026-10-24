import React, { useState, useEffect } from 'react';
import {
  Mic,
  Volume2,
  Sparkles,
  Play,
  Square,
  Sliders,
  Wand2,
  Smile,
  Zap,
  Laugh,
  Crown,
  Heart,
  Baby,
  RefreshCw,
  Check,
  Music,
  Radio,
  FileText,
  VolumeX,
} from 'lucide-react';
import {
  BabyProfile,
  BabyVoiceConfig,
  BabyVoiceExpression,
  BabyVoiceTone,
  VideoConfig,
} from '../types';
import { audioEngine, generateClientBabyVoiceWav } from '../utils/audioEngine';

interface BabyVoiceGeneratorProps {
  profile: BabyProfile;
  config: VideoConfig;
  onChangeProfile: (updates: Partial<BabyProfile>) => void;
  onChangeConfig: (updates: Partial<VideoConfig>) => void;
  onOpenExporter?: () => void;
}

const EXPRESSIONS: { id: BabyVoiceExpression; label: string; icon: string; desc: string }[] = [
  { id: 'funny', label: 'Funny & Silly', icon: '🤪', desc: 'Cake jokes, toddler cheekiness & laughs' },
  { id: 'cheerful', label: 'Cheerful & Sunny', icon: '🌟', desc: 'Bright, smiling, party happiness' },
  { id: 'excited', label: 'Super Excited', icon: '⚡', desc: 'Train conductor energy & joyful cheers' },
  { id: 'cute_sweet', label: 'Sweet & Cooing', icon: '💖', desc: 'Innocent tender baby talk & hugs' },
  { id: 'royal_prince_princess', label: 'Royal Highness', icon: '👑', desc: 'Prince or Princess announcement' },
  { id: 'giggle_laugh', label: 'Giggles & Chuckles', icon: '🤭', desc: 'Tickles, peekaboo & contagious giggles' },
];

const TONES: { id: BabyVoiceTone; label: string; desc: string }[] = [
  { id: 'playful_toddler', label: 'Playful Toddler', desc: 'Sweet, natural 1-year-old child' },
  { id: 'tiny_newborn', label: 'Tiny Sweet Coo', desc: 'Delicate high-pitched infant tone' },
  { id: 'animated_cartoon', label: 'Cartoon Character', desc: 'Bright, theatrical animated style' },
  { id: 'silly_chipmunk', label: 'Silly Squeaky', desc: 'High-frequency funny squeak' },
  { id: 'sweet_fairytale', label: 'Fairytale Star', desc: 'Dreamy melodic nursery warmth' },
];

export const BabyVoiceGenerator: React.FC<BabyVoiceGeneratorProps> = ({
  profile,
  config,
  onChangeProfile,
  onChangeConfig,
  onOpenExporter,
}) => {
  const voice = config.babyVoice || {
    enabled: true,
    script: "Goo goo gaga! Choo-choo! Welcome to my 1st Birthday party! Come eat cake with me and dance all day!",
    expression: 'cheerful',
    tone: 'playful_toddler',
    pitch: 1.4,
    intensity: 85,
    speed: 1.05,
    voiceVolume: 0.95,
    bgMusicDucking: 0.35,
    startDelay: 1.0,
    audioUrl: null,
    audioDuration: 7.0,
    showCaptionsOnVideo: false,
  };


  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const [isAiGeneratingScript, setIsAiGeneratingScript] = useState<boolean>(false);
  const [aiScriptSuggestions, setAiScriptSuggestions] = useState<string[]>([]);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const updateVoice = (updates: Partial<BabyVoiceConfig>) => {
    const updated = { ...voice, ...updates };
    onChangeConfig({ babyVoice: updated });
    onChangeProfile({ babyVoice: updated });
  };

  // Preset scripts based on expression
  const getPresetScriptsForExpression = (expr: BabyVoiceExpression): string[] => {
    const name = profile.name || 'Baby';
    switch (expr) {
      case 'funny':
        return [
          `Goo goo gaga! Guess who is eating the whole birthday cake with both hands today?! Me! No broccoli, only frosting!`,
          `Attention party guests! This is Conductor ${name}! My official birthday rule: unlimited balloons and loud giggles!`,
          `I survived 365 days of drinking milk and tummy time! Now hand over the presents and let's boogie!`
        ];
      case 'cheerful':
        return [
          `Yay! It's my big 1st Birthday! The fairytale train has arrived and everyone is invited to celebrate with me!`,
          `Welcome to my party! Thank you for loving me and sharing big warm hugs today! Let's eat lots of cake!`,
          `Look at me, I am turning ONE today! Let's sing Happy Birthday and make magical memories!`
        ];
      case 'excited':
        return [
          `Choo-choo! All aboard my magical 1st Birthday Express! Next stop: Fun town, balloons, and cake!`,
          `Hooray! Today is the happiest day ever! Put on your party hats and dance with me!`,
          `Beep beep! The celebration train is rolling in, and I cannot wait to see all my friends and family!`
        ];
      case 'cute_sweet':
        return [
          `Tank you for coming to my first birthday party. You make my heart sparkle with joy and sunshine!`,
          `One whole year of sweet baby cuddles and kisses. Come blow out the shiny candle with me!`,
          `I am still little, but my love for all of you is as big as the sky! Welcome to my party!`
        ];
      case 'royal_prince_princess':
        return [
          `Hear ye, hear ye! By royal decree of ${profile.gender === 'boy' ? 'Prince' : 'Princess'} ${name}, the 1st Birthday court is now open!`,
          `Welcome to our royal kingdom of sweets and laughter! Put on your crowns and let the celebration begin!`,
          `The royal train carriage has arrived! Welcome honored guests to my grand 1st birthday gala!`
        ];
      case 'giggle_laugh':
        return [
          `Hehehehe! Peekaboo! Did you know I'm already ONE year old?! Let's giggle, play, and eat treats!`,
          `Tee-hee! Tickles, hugs, and big cake smiles! Come play peekaboo with me at my birthday party!`,
          `Giggle giggle! The train goes chugga chugga and I go woohoo! See you at my party!`
        ];
    }
  };

  // AI Script Generation
  const handleGenerateAiScripts = async () => {
    setIsAiGeneratingScript(true);
    try {
      const res = await fetch('/api/gemini/generate-baby-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          age: profile.age,
          expression: voice.expression,
          gender: profile.gender,
        }),
      });
      const data = await res.json();
      if (data.scripts && data.scripts.length > 0) {
        setAiScriptSuggestions(data.scripts);
      }
    } catch (e) {
      console.warn('Script gen fallback', e);
      setAiScriptSuggestions(getPresetScriptsForExpression(voice.expression));
    } finally {
      setIsAiGeneratingScript(false);
    }
  };

  // Generate Baby Voice Audio
  const handleGenerateVoice = async () => {
    if (!voice.script.trim()) return;

    setIsGenerating(true);
    setSuccessToast(null);

    try {
      // 1. Try Gemini 3.8 Flash Lite TTS endpoint on server
      const res = await fetch('/api/gemini/generate-baby-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: voice.script,
          expression: voice.expression,
          tone: voice.tone,
          pitch: voice.pitch,
          intensity: voice.intensity,
          speed: voice.speed,
          childName: profile.name,
          gender: profile.gender,
        }),
      });

      const data = await res.json();

      if (data.success && data.audioDataUrl) {
        // Calculate audio duration by loading into AudioEngine
        const buffer = await audioEngine.loadVoiceAudio(data.audioDataUrl);
        const duration = buffer ? buffer.duration : 7.0;

        updateVoice({
          audioUrl: data.audioDataUrl,
          audioDuration: duration,
        });

        setSuccessToast('✨ AI Baby Voice generated successfully and added to video background!');
        setTimeout(() => setSuccessToast(null), 5000);

        // Auto preview
        audioEngine.previewVoice(data.audioDataUrl, voice.pitch, voice.speed, voice.intensity, () => {
          setIsPlayingPreview(false);
        });
        setIsPlayingPreview(true);
        return;
      }

      // 2. Client-side Web Audio DSP Fallback if server fallback signaled or offline
      const clientResult = await generateClientBabyVoiceWav(
        voice.script,
        voice.pitch,
        voice.speed,
        voice.intensity
      );

      updateVoice({
        audioUrl: clientResult.audioUrl,
        audioDuration: clientResult.duration,
      });

      setSuccessToast('✨ High-Definition Baby Voice generated and synced to video background!');
      setTimeout(() => setSuccessToast(null), 5000);

      audioEngine.previewVoice(clientResult.audioUrl, voice.pitch, voice.speed, voice.intensity, () => {
        setIsPlayingPreview(false);
      });
      setIsPlayingPreview(true);
    } catch (err) {
      console.error('Error generating voice:', err);
      // Client DSP fallback
      const clientResult = await generateClientBabyVoiceWav(
        voice.script,
        voice.pitch,
        voice.speed,
        voice.intensity
      );

      updateVoice({
        audioUrl: clientResult.audioUrl,
        audioDuration: clientResult.duration,
      });

      setSuccessToast('✨ Baby Voice synthesized and added to video background!');
      setTimeout(() => setSuccessToast(null), 5000);
    } finally {
      setIsGenerating(false);
    }
  };

  // Preview / Test Voice
  const handleTogglePreview = () => {
    if (isPlayingPreview) {
      audioEngine.stopVoice();
      setIsPlayingPreview(false);
      return;
    }

    if (!voice.audioUrl) {
      // If voice hasn't been generated yet, generate and preview immediately!
      handleGenerateVoice();
      return;
    }

    setIsPlayingPreview(true);
    audioEngine.previewVoice(voice.audioUrl, voice.pitch, voice.speed, voice.intensity, () => {
      setIsPlayingPreview(false);
    });
  };

  const samplePresets = getPresetScriptsForExpression(voice.expression);

  return (
    <div className="flex flex-col gap-6 bg-stone-900/90 backdrop-blur-xl p-4 sm:p-6 rounded-2xl border border-stone-800 shadow-xl text-stone-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-amber-500 text-white shadow-md">
              <Mic className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>AI Baby Voice Generator</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Custom Tone & Pitch
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Paste any funny script, customize toddler pitch & tone, and automatically mix into the video background!
              </p>
            </div>
          </div>
        </div>

        {/* Video Background Master Switch */}
        <div className="flex items-center gap-3 bg-stone-950/70 p-2 sm:px-3 sm:py-2 rounded-xl border border-pink-500/30">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-pink-300 flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Video Background Voice:</span>
            </span>
            <span className="text-[10px] text-stone-400">
              {voice.enabled ? 'Active in video playback & export' : 'Muted in video background'}
            </span>
          </div>

          <button
            id="toggle-voice-in-bg-btn"
            type="button"
            onClick={() => updateVoice({ enabled: !voice.enabled })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              voice.enabled ? 'bg-gradient-to-r from-pink-500 to-rose-500' : 'bg-stone-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                voice.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Expression / Feeling Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <Smile className="w-3.5 h-3.5" />
          <span>1. Select Voice Expression & Feeling</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {EXPRESSIONS.map((exp) => {
            const isSelected = voice.expression === exp.id;
            return (
              <button
                key={exp.id}
                type="button"
                onClick={() => {
                  updateVoice({ expression: exp.id });
                }}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-b from-pink-500/25 to-amber-500/15 border-pink-500 text-white shadow-md scale-[1.02]'
                    : 'bg-stone-800/60 border-stone-700/70 text-stone-300 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <span className="text-xl mb-1">{exp.icon}</span>
                <span className="text-xs font-bold leading-tight">{exp.label}</span>
                <span className="text-[10px] text-stone-400 mt-0.5 line-clamp-1">{exp.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Script Textarea & Sample Presets */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label htmlFor="baby-voice-script-input" className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>2. Paste or Write Baby Narration Script</span>
          </label>

          <div className="flex items-center gap-2">
            <button
              id="ai-generate-script-btn"
              type="button"
              onClick={handleGenerateAiScripts}
              disabled={isAiGeneratingScript}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-pink-500/20 text-pink-300 hover:text-white border border-pink-500/40 text-xs font-semibold hover:bg-pink-500/30 transition-all cursor-pointer"
            >
              {isAiGeneratingScript ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Writing Funny Scripts...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3 h-3 text-amber-300" />
                  <span>✨ AI Funny Script Ideas</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            id="baby-voice-script-input"
            rows={3}
            value={voice.script}
            onChange={(e) => updateVoice({ script: e.target.value })}
            placeholder="Paste your funny baby speech script here... (e.g. Goo goo gaga! Guess who is eating birthday cake today?!)"
            className="w-full px-4 py-3 bg-stone-800/80 rounded-xl border border-stone-700 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-sm text-white placeholder-stone-500 transition-all leading-relaxed resize-none shadow-inner"
          />
          <div className="absolute bottom-2 right-3 text-[11px] font-mono text-stone-400">
            {voice.script.length} characters (~{Math.round((voice.script.split(/\s+/).filter(Boolean).length / 2.7) / voice.speed)}s)
          </div>
        </div>

        {/* Quick Click-to-Paste Chips */}
        <div className="flex flex-col gap-1.5 mt-1">
          <span className="text-[11px] font-semibold text-stone-400">
            💡 Tap any funny script to paste instantly:
          </span>
          <div className="flex flex-col sm:flex-row flex-wrap gap-1.5">
            {(aiScriptSuggestions.length > 0 ? aiScriptSuggestions : samplePresets).map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => updateVoice({ script: s })}
                className="text-left px-3 py-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700/80 border border-stone-700 text-stone-300 hover:text-pink-200 text-xs transition-all flex items-center gap-1.5 cursor-pointer group"
              >
                <span className="text-amber-400 font-bold group-hover:scale-110 transition-transform">💬</span>
                <span className="line-clamp-1">{s}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Voice Tuning Parameters: Tone, Pitch, Intensity, Speed */}
      <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800 flex flex-col gap-4">
        <label className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5" />
          <span>3. Voice Settings (Tone, Pitch & Intensity)</span>
        </label>

        {/* Tone Selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-stone-300">Vocal Tone Persona:</span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {TONES.map((t) => {
              const isSelected = voice.tone === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => updateVoice({ tone: t.id })}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-pink-500/20 border-pink-500 text-white shadow-sm'
                      : 'bg-stone-800/60 border-stone-700/60 text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                  }`}
                >
                  <p className="text-xs font-bold text-stone-200">{t.label}</p>
                  <p className="text-[10px] text-stone-400 mt-0.5 line-clamp-1">{t.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pitch, Intensity & Speed Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-stone-800/80">
          {/* Pitch Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-300 flex items-center gap-1">
                <span>Baby Pitch:</span>
              </span>
              <span className="font-mono text-pink-400 font-bold">
                {voice.pitch.toFixed(2)}x{' '}
                <span className="text-[10px] text-stone-400">
                  {voice.pitch > 1.6 ? '(Ultra Squeaky)' : voice.pitch > 1.25 ? '(Cute Toddler)' : '(Deeper)'}
                </span>
              </span>
            </div>
            <input
              id="voice-pitch-slider"
              type="range"
              min="0.8"
              max="2.1"
              step="0.05"
              value={voice.pitch}
              onChange={(e) => updateVoice({ pitch: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
            <div className="flex justify-between text-[10px] text-stone-500">
              <span>0.8x Deeper</span>
              <span>1.35x Cute Baby</span>
              <span>2.1x High Squeak</span>
            </div>
          </div>

          {/* Intensity Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-300">Expression Intensity:</span>
              <span className="font-mono text-amber-400 font-bold">
                {voice.intensity}%{' '}
                <span className="text-[10px] text-stone-400">
                  {voice.intensity > 85 ? '(Hyper Joyful)' : voice.intensity > 55 ? '(Energetic)' : '(Gentle)'}
                </span>
              </span>
            </div>
            <input
              id="voice-intensity-slider"
              type="range"
              min="20"
              max="100"
              step="5"
              value={voice.intensity}
              onChange={(e) => updateVoice({ intensity: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-stone-500">
              <span>20% Soft</span>
              <span>60% Medium</span>
              <span>100% Full Energy</span>
            </div>
          </div>

          {/* Speed Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-300">Talking Speed:</span>
              <span className="font-mono text-emerald-400 font-bold">
                {voice.speed.toFixed(2)}x{' '}
                <span className="text-[10px] text-stone-400">
                  {voice.speed > 1.15 ? '(Fast Talk)' : voice.speed < 0.95 ? '(Slow Babble)' : '(Natural)'}
                </span>
              </span>
            </div>
            <input
              id="voice-speed-slider"
              type="range"
              min="0.8"
              max="1.3"
              step="0.05"
              value={voice.speed}
              onChange={(e) => updateVoice({ speed: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-stone-500">
              <span>0.8x Slow</span>
              <span>1.0x Normal</span>
              <span>1.3x Quick</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Actions: Generate Voice & Test Voice */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-pink-950/40 via-purple-950/40 to-stone-900 border border-pink-500/30">
        <div className="flex items-center gap-3">
          {/* Main Generate Button */}
          <button
            id="generate-baby-voice-btn"
            type="button"
            onClick={handleGenerateVoice}
            disabled={isGenerating || !voice.script.trim()}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white text-xs font-bold shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating Baby Voice...</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>Generate Baby Voice</span>
              </>
            )}
          </button>

          {/* Test / Preview Button */}
          <button
            id="preview-baby-voice-btn"
            type="button"
            onClick={handleTogglePreview}
            disabled={isGenerating}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isPlayingPreview
                ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md shadow-amber-500/30 animate-pulse'
                : 'bg-stone-800 text-stone-200 border-stone-700 hover:bg-stone-700 hover:text-white'
            }`}
          >
            {isPlayingPreview ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Preview</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Test Voice Preview</span>
              </>
            )}
          </button>
        </div>

        {/* Voice Status Pill */}
        <div className="flex items-center gap-2 text-xs">
          {voice.audioUrl ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Voice Ready in Video BG ({voice.audioDuration.toFixed(1)}s)</span>
            </span>
          ) : (
            <span className="text-stone-400 text-[11px] italic">
              Tap "Generate Baby Voice" to create and mix audio
            </span>
          )}
        </div>
      </div>

      {successToast && (
        <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Video Background Sync Controls */}
      <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5" />
            <span>4. Video Background Audio Mixing & Timing</span>
          </label>
          <span className="text-[11px] text-pink-300 font-semibold">
            {voice.enabled ? '🔊 Auto-ducking background music enabled' : '🔇 Voice muted'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
          {/* Start Delay */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-stone-300 font-semibold">Voice Start in Video:</span>
              <span className="font-mono text-pink-400 font-bold">{voice.startDelay.toFixed(1)}s</span>
            </div>
            <input
              id="voice-start-delay-slider"
              type="range"
              min="0.0"
              max="8.0"
              step="0.5"
              value={voice.startDelay}
              onChange={(e) => updateVoice({ startDelay: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
            <span className="text-[10px] text-stone-500">
              {voice.startDelay === 0 ? 'Starts at video launch' : `Starts at ${voice.startDelay}s (after whistle puff)`}
            </span>
          </div>

          {/* Voiceover Volume */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-stone-300 font-semibold">Voiceover Volume:</span>
              <span className="font-mono text-amber-400 font-bold">{Math.round((voice.voiceVolume ?? 0.95) * 100)}%</span>
            </div>
            <input
              id="voice-volume-slider"
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={voice.voiceVolume ?? 0.95}
              onChange={(e) => updateVoice({ voiceVolume: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <span className="text-[10px] text-stone-500">Volume level for baby's speech</span>
          </div>

          {/* Background Music Ducking */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-stone-300 font-semibold">Music Ducking Level:</span>
              <span className="font-mono text-emerald-400 font-bold">{Math.round((voice.bgMusicDucking ?? 0.35) * 100)}%</span>
            </div>
            <input
              id="bg-music-ducking-slider"
              type="range"
              min="0.1"
              max="0.8"
              step="0.05"
              value={voice.bgMusicDucking ?? 0.35}
              onChange={(e) => updateVoice({ bgMusicDucking: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <span className="text-[10px] text-stone-500">Lower music while baby is speaking</span>
          </div>
        </div>

        {onOpenExporter && (
          <div className="flex items-center justify-end pt-2 border-t border-stone-800 text-xs">
            <button
              onClick={onOpenExporter}
              className="text-pink-400 hover:text-pink-300 font-semibold text-xs flex items-center gap-1 cursor-pointer"
            >
              <span>Download Entire Video in Phone (HD) →</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

