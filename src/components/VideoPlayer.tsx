import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  Download,
  Camera,
  Share2,
  SkipBack,
  SkipForward,
  Music,
  Radio,
} from 'lucide-react';
import { BabyProfile, VideoConfig, VideoScene, AspectRatioType } from '../types';
import { DEFAULT_SCENES, TOTAL_DURATION } from '../data/samplePresets';
import { preloadAllImages, renderSceneToCanvas } from '../utils/canvasRenderer';
import { audioEngine } from '../utils/audioEngine';

interface VideoPlayerProps {
  profile: BabyProfile;
  config: VideoConfig;
  onChangeConfig: (newConfig: Partial<VideoConfig>) => void;
  onOpenExporter: (sceneId?: string) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  profile,
  config,
  onChangeConfig,
  onOpenExporter,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [imagesLoaded, setImagesLoaded] = useState<boolean>(false);
  const [userUploadedImg, setUserUploadedImg] = useState<HTMLImageElement | null>(null);
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);

  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const currentTimeRef = useRef<number>(0);

  // Preload base assets
  useEffect(() => {
    preloadAllImages().then(() => {
      setImagesLoaded(true);
    });
  }, []);

  // Handle uploaded baby photo
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

  // Keep time ref in sync
  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  // Audio start/stop sync
  useEffect(() => {
    if (isPlaying && imagesLoaded) {
      audioEngine.syncPlayback(currentTimeRef.current, true, config.musicTheme, config.babyVoice);
    } else {
      audioEngine.syncPlayback(currentTimeRef.current, false, config.musicTheme, config.babyVoice);
    }
    return () => {
      audioEngine.stopMusic();
      audioEngine.stopVoice();
    };
  }, [isPlaying, config.musicTheme, config.babyVoice, imagesLoaded]);

  // Animation Loop
  const renderFrame = useCallback(
    (timestamp: number) => {
      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      if (isPlaying) {
        let nextTime = currentTimeRef.current + dt;
        if (nextTime >= TOTAL_DURATION) {
          nextTime = 0; // loop
          audioEngine.syncPlayback(0, true, config.musicTheme, config.babyVoice);
        }
        currentTimeRef.current = nextTime;
        setCurrentTime(nextTime);
        audioEngine.syncPlayback(nextTime, true, config.musicTheme, config.babyVoice);
      }

      // Update current active scene
      let idx = 0;
      for (let i = 0; i < DEFAULT_SCENES.length; i++) {
        const s = DEFAULT_SCENES[i];
        if (currentTimeRef.current >= s.startTime && currentTimeRef.current < s.startTime + s.duration) {
          idx = i;
          break;
        }
      }
      setActiveSceneIndex(idx);

      // Render to canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderSceneToCanvas(
            ctx,
            canvas.width,
            canvas.height,
            currentTimeRef.current,
            profile,
            config,
            userUploadedImg
          );
        }
      }

      animFrameIdRef.current = requestAnimationFrame(renderFrame);
    },
    [isPlaying, profile, config, userUploadedImg]
  );

  useEffect(() => {
    lastTimeRef.current = performance.now();
    animFrameIdRef.current = requestAnimationFrame(renderFrame);
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [renderFrame]);

  // Player controls
  const handlePlayPause = async () => {
    await audioEngine.unlockAudio();
    const nextPlay = !isPlaying;
    setIsPlaying(nextPlay);
    audioEngine.syncPlayback(currentTimeRef.current, nextPlay, config.musicTheme, config.babyVoice);
  };

  const handleRestart = async () => {
    await audioEngine.unlockAudio();
    currentTimeRef.current = 0;
    setCurrentTime(0);
    audioEngine.syncPlayback(0, isPlaying, config.musicTheme, config.babyVoice);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    audioEngine.unlockAudio();
    const val = parseFloat(e.target.value);
    currentTimeRef.current = val;
    setCurrentTime(val);
    audioEngine.syncPlayback(val, isPlaying, config.musicTheme, config.babyVoice);
  };

  const handleJumpToScene = (scene: VideoScene) => {
    audioEngine.unlockAudio();
    currentTimeRef.current = scene.startTime;
    setCurrentTime(scene.startTime);
    audioEngine.syncPlayback(scene.startTime, isPlaying, config.musicTheme, config.babyVoice);
  };

  const handleToggleMute = () => {
    audioEngine.unlockAudio();
    const muted = audioEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleWhistle = () => {
    audioEngine.unlockAudio();
    audioEngine.playWhistle();
  };

  // Instant Snapshot frame
  const handleCaptureSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${profile.name || 'Baby'}_1st_Birthday_Invitation_Card.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Compute aspect ratio dimensions
  const getCanvasDimensions = (aspectRatio: AspectRatioType) => {
    if (aspectRatio === '9:16') return { width: 720, height: 1280 };
    if (aspectRatio === '1:1') return { width: 1080, height: 1080 };
    return { width: 1280, height: 720 };
  };

  const dimensions = getCanvasDimensions(config.aspectRatio);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto" ref={containerRef}>
      {/* Top Bar: Ratio & Fast Actions */}
      <div className="flex items-center justify-between w-full mb-3 px-2">
        <div className="flex items-center gap-1.5 bg-stone-800/90 backdrop-blur-md p-1 rounded-xl border border-stone-700/60 shadow-inner">
          <button
            id="aspect-ratio-9-16"
            onClick={() => onChangeConfig({ aspectRatio: '9:16' })}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              config.aspectRatio === '9:16'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-700/50'
            }`}
          >
            📱 9:16 Reel / Story
          </button>
          <button
            id="aspect-ratio-1-1"
            onClick={() => onChangeConfig({ aspectRatio: '1:1' })}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              config.aspectRatio === '1:1'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-700/50'
            }`}
          >
            ⏹ 1:1 Feed
          </button>
          <button
            id="aspect-ratio-16-9"
            onClick={() => onChangeConfig({ aspectRatio: '16:9' })}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              config.aspectRatio === '16:9'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-700/50'
            }`}
          >
            🖥 16:9 Wide
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Whistle sound button */}
          <button
            id="train-whistle-btn"
            onClick={handleWhistle}
            title="Play Train Whistle sound effect"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/30 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            🚂 Train Whistle!
          </button>

          {/* Quick Snapshot Card */}
          <button
            id="save-snapshot-btn"
            onClick={handleCaptureSnapshot}
            title="Download high-resolution image card of this exact frame"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-800 text-stone-300 border border-stone-700 hover:bg-stone-700 text-xs font-medium transition-all"
          >
            <Camera className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">Photo Card</span>
          </button>

          {/* Export Video Clip */}
          <button
            id="export-video-modal-btn"
            onClick={() => onOpenExporter()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white text-xs font-bold shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export HD Video</span>
          </button>
        </div>
      </div>

      {/* Main Video Screen Container */}
      <div className="relative flex items-center justify-center w-full bg-stone-950/80 rounded-2xl p-2 sm:p-4 border border-stone-800 shadow-2xl backdrop-blur-xl">
        {/* Aspect Frame */}
        <div
          className="relative overflow-hidden rounded-xl bg-black shadow-2xl transition-all duration-300 border border-stone-800/80"
          style={{
            aspectRatio: config.aspectRatio === '9:16' ? '9/16' : config.aspectRatio === '1:1' ? '1/1' : '16/9',
            maxHeight: '68vh',
            maxWidth: '100%',
          }}
        >
          {/* Real-time Render Canvas */}
          <canvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            className="w-full h-full object-contain cursor-pointer"
            onClick={handlePlayPause}
          />

          {/* Pause overlay watermark icon if paused */}
          {!isPlaying && (
            <div
              onClick={handlePlayPause}
              className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[2px] transition-all cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full bg-pink-500/90 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 fill-current ml-1" />
              </div>
            </div>
          )}

        </div>
      </div>


      {/* Interactive Timeline & Player Controls */}
      <div className="w-full mt-3 bg-stone-800/90 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-stone-700/70 shadow-lg">
        {/* Scrub Bar with Scene Segment Markers */}
        <div className="relative flex flex-col gap-1.5 w-full mb-2">
          <div className="flex items-center justify-between text-xs font-mono text-stone-400 px-1">
            <span className="text-pink-400 font-semibold">{formatTime(currentTime)}</span>
            <span>{formatTime(TOTAL_DURATION)}</span>
          </div>

          <div className="relative flex items-center">
            <input
              id="timeline-scrub-input"
              type="range"
              min="0"
              max={TOTAL_DURATION}
              step="0.05"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
          </div>

          {/* Scene Jump Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            {DEFAULT_SCENES.map((scene, i) => {
              const isActive = i === activeSceneIndex;
              return (
                <button
                  key={scene.id}
                  onClick={() => handleJumpToScene(scene)}
                  className={`px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap transition-all flex-shrink-0 ${
                    isActive
                      ? 'bg-pink-500/30 text-pink-300 font-semibold border border-pink-500/50 shadow-sm'
                      : 'bg-stone-700/40 text-stone-400 hover:bg-stone-700 hover:text-stone-200'
                  }`}
                >
                  {i + 1}. {scene.title.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between pt-1 border-t border-stone-700/60">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              id="play-pause-btn"
              onClick={handlePlayPause}
              className="w-10 h-10 rounded-full bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            {/* Restart */}
            <button
              id="restart-btn"
              onClick={handleRestart}
              className="w-9 h-9 rounded-full bg-stone-700/60 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition-all cursor-pointer"
              title="Restart from beginning"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Skip -5s */}
            <button
              onClick={() => {
                const newT = Math.max(0, currentTime - 5);
                currentTimeRef.current = newT;
                setCurrentTime(newT);
              }}
              className="p-2 text-stone-400 hover:text-stone-200 transition-colors"
              title="Skip back 5s"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Skip +5s */}
            <button
              onClick={() => {
                const newT = Math.min(TOTAL_DURATION, currentTime + 5);
                currentTimeRef.current = newT;
                setCurrentTime(newT);
              }}
              className="p-2 text-stone-400 hover:text-stone-200 transition-colors"
              title="Skip forward 5s"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Audio & Music Settings */}
          <div className="flex items-center gap-3">
            {/* Music Track selector */}
            <div className="flex items-center gap-1.5 bg-stone-900/60 px-2.5 py-1 rounded-lg border border-stone-700/60 text-xs">
              <Music className="w-3.5 h-3.5 text-pink-400" />
              <select
                id="music-theme-select"
                value={config.musicTheme}
                onChange={(e) => onChangeConfig({ musicTheme: e.target.value as any })}
                className="bg-transparent text-stone-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="fairytale_box" className="bg-stone-800 text-stone-100">
                  🎵 Fairytale Music Box
                </option>
                <option value="birthday_chimes" className="bg-stone-800 text-stone-100">
                  🔔 Birthday Chimes
                </option>
                <option value="lullaby_bells" className="bg-stone-800 text-stone-100">
                  ✨ Dreamy Lullaby
                </option>
                <option value="none" className="bg-stone-800 text-stone-100">
                  🔇 Mute Music
                </option>
              </select>
            </div>

            {/* Mute Toggle */}
            <button
              id="mute-audio-btn"
              onClick={handleToggleMute}
              className="p-2 text-stone-400 hover:text-stone-200 transition-colors"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
