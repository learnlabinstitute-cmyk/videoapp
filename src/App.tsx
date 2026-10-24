import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Download,
  Share2,
  Heart,
  Sliders,
  Baby,
  Layers,
  HelpCircle,
  Play,
  Terminal,
  Clock,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { BabyProfile, VideoConfig } from './types';
import { DEFAULT_PROFILE, DEFAULT_BABY_VOICE } from './data/samplePresets';
import { VideoPlayer } from './components/VideoPlayer';
import { EditorDrawer } from './components/EditorDrawer';
import { VideoExporter } from './components/VideoExporter';
import { TerminalLoginGate } from './components/TerminalLoginGate';
import { TerminalHeaderBadge } from './components/TerminalHeaderBadge';
import { TerminalStatusModal } from './components/TerminalStatusModal';
import {
  getActiveSession,
  setActiveSession,
  TerminalSession,
} from './utils/terminalAuth';
import { StudioLogo } from './components/StudioLogo';

export default function App() {
  // Terminal Authentication & 30-day session
  const [session, setSession] = useState<TerminalSession | null>(() => getActiveSession());
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);

  const [profile, setProfile] = useState<BabyProfile>(() => {
    const saved = localStorage.getItem('birthday_profile_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.babyVoice) {
          parsed.babyVoice = DEFAULT_BABY_VOICE;
        } else {
          parsed.babyVoice.showCaptionsOnVideo = false;
        }
        return parsed;
      } catch (e) {
        return DEFAULT_PROFILE;
      }
    }
    return DEFAULT_PROFILE;
  });

  const [config, setConfig] = useState<VideoConfig>(() => ({
    aspectRatio: '9:16',
    fps: 30,
    musicTheme: 'fairytale_box',
    soundEffects: true,
    sparkleIntensity: 65,
    showWatermark: false,
    babyVoice: profile.babyVoice || DEFAULT_BABY_VOICE,
  }));

  const [isExporterOpen, setIsExporterOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'scenes'>('editor');
  const [userUploadedImg, setUserUploadedImg] = useState<HTMLImageElement | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('birthday_profile_data', JSON.stringify(profile));
  }, [profile]);

  // Load custom photo if present
  useEffect(() => {
    if (profile.photoUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => setUserUploadedImg(img);
      img.src = profile.photoUrl;
    } else {
      setUserUploadedImg(null);
    }
  }, [profile.photoUrl]);

  const handleChangeProfile = (updates: Partial<BabyProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const handleChangeConfig = (updates: Partial<VideoConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const handleLoginSuccess = (newSession: TerminalSession) => {
    setSession(newSession);
  };

  const handleLogout = () => {
    setActiveSession(null);
    setSession(null);
    setIsStatusModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col selection:bg-pink-500 selection:text-white pb-12">
      {/* If no active session, show the Terminal Login Gate requiring Terminal ID */}
      {!session && (
        <TerminalLoginGate onLoginSuccess={handleLoginSuccess} />
      )}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-stone-900/80 backdrop-blur-md border-b border-stone-800/80 px-3 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & App Title */}
          <div className="flex items-center gap-3 min-w-0">
            <StudioLogo size="md" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                  3D Birthday Video Animator
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40">
                  1st Birthday
                </span>
              </div>
              <p className="text-[11px] text-stone-400 hidden lg:block truncate">
                Fairytale train animated motion invitations & high-definition social clips
              </p>
            </div>
          </div>

          {/* Terminal ID & Live 30-Day Countdown Timer + Export */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {session ? (
              <TerminalHeaderBadge
                session={session}
                onClick={() => setIsStatusModalOpen(true)}
              />
            ) : (
              <button
                onClick={() => setSession(getActiveSession())}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-600/30 border border-pink-500/50 text-pink-300 text-xs font-semibold cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Studio Sign In</span>
              </button>
            )}

            {/* Quick Header Export CTA */}
            <button
              id="header-export-btn"
              onClick={() => setIsExporterOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white text-xs font-bold shadow-md shadow-pink-500/20 hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Clips</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 pt-5 flex flex-col gap-6">
        {/* Terminal License Status Banner */}
        {session && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-stone-900 to-pink-950/30 border border-emerald-500/30 text-xs">
            <div className="flex items-center gap-2 text-stone-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
              <span>
                <strong className="text-emerald-400 font-semibold">Studio License Active</strong> | Account: <span className="text-white font-mono">{session.email}</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsStatusModalOpen(true)}
                className="text-[11px] text-pink-300 hover:text-pink-200 font-semibold underline underline-offset-2 flex items-center gap-1 cursor-pointer"
              >
                <Clock className="w-3 h-3 text-amber-400" />
                <span>License Status & Timer</span>
              </button>
              <span className="text-stone-600 hidden sm:inline">•</span>
              <button
                onClick={handleLogout}
                className="text-[11px] text-stone-400 hover:text-rose-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                <span>Switch / Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Top Feature Notice Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-stone-900 border border-pink-500/20 text-xs">
          <div className="flex items-center gap-2 text-pink-200">
            <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0 animate-pulse" />
            <span>
              Now editing: <strong className="text-white font-bold">{profile.name || 'Baby'}</strong> turning 1! Real-time 3D camera pan, floral train carriages & music box audio.
            </span>
          </div>
          <div className="flex items-center gap-2 text-stone-400 text-[11px]">
            <span>✨ 38s Full Story</span>
            <span>•</span>
            <span>📱 9:16 Instagram Reel Ready</span>
            <span>•</span>
            <span>🎵 Synchronized Music</span>
          </div>
        </div>

        {/* Video Player Section */}
        {session && (
          <section className="w-full">
            <VideoPlayer
              profile={profile}
              config={config}
              onChangeConfig={handleChangeConfig}
              onOpenExporter={() => setIsExporterOpen(true)}
            />
          </section>
        )}

        {/* Customization Drawer Section */}
        <section className="w-full max-w-4xl mx-auto">
          <EditorDrawer
            profile={profile}
            config={config}
            onChangeProfile={handleChangeProfile}
            onChangeConfig={handleChangeConfig}
            onOpenExporter={() => setIsExporterOpen(true)}
          />
        </section>
      </main>

      {/* Terminal Account & 30-Day License Modal */}
      {session && (
        <TerminalStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          session={session}
          onLogout={handleLogout}
        />
      )}

      {/* Exporter Modal */}
      <VideoExporter
        isOpen={isExporterOpen}
        onClose={() => setIsExporterOpen(false)}
        profile={profile}
        config={config}
        customUploadedImage={userUploadedImg}
      />
    </div>
  );
}

