import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Film,
  Sparkles,
  CheckCircle2,
  Share2,
  Play,
  Camera,
  AlertCircle,
  Loader2,
  Smartphone,
  QrCode,
  Mic,
  Volume2,
  Check,
} from 'lucide-react';
import { BabyProfile, VideoConfig, VideoScene, AspectRatioType } from '../types';
import { DEFAULT_SCENES, TOTAL_DURATION } from '../data/samplePresets';
import { renderSceneToCanvas } from '../utils/canvasRenderer';
import { audioEngine } from '../utils/audioEngine';

interface VideoExporterProps {
  isOpen: boolean;
  onClose: () => void;
  profile: BabyProfile;
  config: VideoConfig;
  customUploadedImage: HTMLImageElement | null;
}

type ExportMode = 'full_video' | 'intro_clip' | 'venue_clip' | 'blessing_clip' | 'snapshot';

export const VideoExporter: React.FC<VideoExporterProps> = ({
  isOpen,
  onClose,
  profile,
  config,
  customUploadedImage,
}) => {
  const [exportMode, setExportMode] = useState<ExportMode>('full_video');
  const [selectedQuality, setSelectedQuality] = useState<'1080p' | '720p'>('1080p');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [sharedToast, setSharedToast] = useState<string | null>(null);

  const cancelExportRef = useRef<boolean>(false);

  if (!isOpen) return null;

  const getExportRange = (): { start: number; duration: number; title: string } => {
    switch (exportMode) {
      case 'intro_clip':
        return { start: 0, duration: 11.5, title: 'Arrival & Birthday Star Reel' };
      case 'venue_clip':
        return { start: 11.5, duration: 15, title: 'Date, Time & Venue Reel' };
      case 'blessing_clip':
        return { start: 26.5, duration: 11.5, title: 'Venue & Family Invitation Reel' };
      default:
        return { start: 0, duration: TOTAL_DURATION, title: 'Full 3D Birthday Invitation' };
    }
  };

  const handleStartExport = async () => {
    if (exportMode === 'snapshot') {
      handleExportSnapshot();
      return;
    }

    setIsExporting(true);
    setProgress(0);
    setExportedVideoUrl(null);
    setExportedBlob(null);
    cancelExportRef.current = false;
    setStatusMessage('Preparing Full HD canvas frames & mixed audio stream...');

    const range = getExportRange();
    const fps = 30;
    const totalFrames = Math.round(range.duration * fps);

    // Exact HD Resolutions
    let width = 1080;
    let height = 1920;

    if (selectedQuality === '1080p') {
      if (config.aspectRatio === '9:16') {
        width = 1080;
        height = 1920; // Full HD vertical reel / phone status
      } else if (config.aspectRatio === '1:1') {
        width = 1080;
        height = 1080; // Full HD square
      } else {
        width = 1920;
        height = 1080; // Full HD landscape
      }
    } else {
      // 720p HD
      if (config.aspectRatio === '9:16') {
        width = 720;
        height = 1280;
      } else if (config.aspectRatio === '1:1') {
        width = 720;
        height = 720;
      } else {
        width = 1280;
        height = 720;
      }
    }

    const offCanvas = document.createElement('canvas');
    offCanvas.width = width;
    offCanvas.height = height;
    const ctx = offCanvas.getContext('2d');
    if (!ctx) {
      alert('Could not initialize canvas context');
      setIsExporting(false);
      return;
    }

    // Capture Canvas Video Stream
    const videoStream = offCanvas.captureStream(fps);
    const audioDestination = audioEngine.getAudioStreamDestination();

    let combinedStream: MediaStream = videoStream;
    if (audioDestination && audioDestination.stream.getAudioTracks().length > 0) {
      combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioDestination.stream.getAudioTracks(),
      ]);
    }

    // Start audio synchronized at the export start point
    audioEngine.syncPlayback(range.start, true, config.musicTheme, config.babyVoice);

    // Pick best supported MIME type
    let mimeType = 'video/mp4';
    if (!MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
    }

    let mediaRecorder: MediaRecorder;
    try {
      mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
        videoBitsPerSecond: selectedQuality === '1080p' ? 6500000 : 3500000,
      });
    } catch (e) {
      console.warn('MediaRecorder init fallback', e);
      mediaRecorder = new MediaRecorder(combinedStream);
    }

    const recordedChunks: Blob[] = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      audioEngine.stopMusic();
      audioEngine.stopVoice();
      const finalMime = mediaRecorder.mimeType || 'video/mp4';
      const blob = new Blob(recordedChunks, { type: finalMime });
      const url = URL.createObjectURL(blob);
      setExportedVideoUrl(url);
      setExportedBlob(blob);
      setIsExporting(false);
      setProgress(100);
      setStatusMessage('✨ HD Video with Baby Voiceover rendered and ready for download!');
    };

    mediaRecorder.start(250);

    // Render frame-by-frame
    let currentFrame = 0;
    const renderNextFrame = () => {
      if (cancelExportRef.current) {
        mediaRecorder.stop();
        audioEngine.stopMusic();
        audioEngine.stopVoice();
        setIsExporting(false);
        return;
      }

      const frameTime = range.start + currentFrame / fps;

      // Synchronize audio engine timeline
      audioEngine.syncPlayback(frameTime, true, config.musicTheme, config.babyVoice);

      // Render video frame
      renderSceneToCanvas(ctx, width, height, frameTime, profile, config, customUploadedImage);

      currentFrame++;
      const currentPct = Math.round((currentFrame / totalFrames) * 100);
      setProgress(currentPct);
      setStatusMessage(`Encoding frame ${currentFrame} of ${totalFrames} (${currentPct}%)...`);

      if (currentFrame < totalFrames) {
        setTimeout(renderNextFrame, 1000 / fps);
      } else {
        setTimeout(() => {
          mediaRecorder.stop();
        }, 350);
      }
    };

    renderNextFrame();
  };

  const handleExportSnapshot = () => {
    const width = 1080;
    const height = config.aspectRatio === '9:16' ? 1920 : config.aspectRatio === '1:1' ? 1080 : 608;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = width;
    offCanvas.height = height;
    const ctx = offCanvas.getContext('2d');
    if (!ctx) return;

    renderSceneToCanvas(ctx, width, height, 0, profile, config, customUploadedImage);

    const link = document.createElement('a');
    link.download = `${profile.name || 'Baby'}_1st_Birthday_HD_Card.png`;
    link.href = offCanvas.toDataURL('image/png');
    link.click();
    setStatusMessage('Downloaded high-resolution photo card!');
  };

  const handleDownload = () => {
    if (!exportedVideoUrl) return;
    const a = document.createElement('a');
    a.href = exportedVideoUrl;
    const ext = exportedBlob?.type.includes('mp4') ? 'mp4' : 'webm';
    a.download = `${profile.name || 'Baby'}_1st_Birthday_HD_${exportMode}.${ext}`;
    a.click();
  };

  // Direct native share for Phone (iOS Safari / Android Chrome)
  const handleNativeShare = async () => {
    if (!exportedBlob) return;

    const ext = exportedBlob.type.includes('mp4') ? 'mp4' : 'webm';
    const filename = `${profile.name || 'Baby'}_1st_Birthday_HD.${ext}`;
    const file = new File([exportedBlob], filename, { type: exportedBlob.type });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `${profile.name}'s 1st Birthday 3D Video`,
          text: `You're invited to ${profile.name}'s 1st Birthday! Watch our magical 3D video invitation with baby's custom voice!`,
        });
        setSharedToast('✨ Shared successfully!');
        setTimeout(() => setSharedToast(null), 3000);
        return;
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.log('Share canceled or error', e);
        }
      }
    }

    // Fallback: WhatsApp text with event link
    const text = `🎉 You are invited to celebrate the 1st Birthday of ${profile.name || 'our little star'}!\n📅 Date: ${profile.date}\n⏰ Time: ${profile.time}\n📍 Venue: ${profile.venueName}, ${profile.venueAddress}\n\nWith love,\n${profile.parentsNames}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-stone-900 border border-stone-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl text-stone-200 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 via-rose-500 to-amber-500 text-white shadow-md">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Download Video to Phone (HD)</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  📱 Mobile Ready
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Export 1080p Full HD video with Fairytale music & Baby Voiceover for WhatsApp, Instagram & TikTok.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              cancelExportRef.current = true;
              audioEngine.stopMusic();
              audioEngine.stopVoice();
              onClose();
            }}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Track Composition Info Badge */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-950/70 border border-stone-800 text-xs">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-pink-400" />
            <span className="text-stone-300">
              Music Track:{' '}
              <strong className="text-white">
                {config.musicTheme === 'none' ? 'Muted' : config.musicTheme.replace('_', ' ')}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-stone-300">
              Baby Voiceover:{' '}
              <strong className={config.babyVoice?.enabled ? 'text-amber-300' : 'text-stone-500'}>
                {config.babyVoice?.enabled ? `Included (${config.babyVoice.expression})` : 'Disabled'}
              </strong>
            </span>
          </div>
        </div>

        {/* Clip Selection Cards */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-stone-300">Choose Video Format:</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setExportMode('full_video')}
              className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer ${
                exportMode === 'full_video'
                  ? 'bg-pink-500/20 border-pink-500 text-white shadow-md'
                  : 'bg-stone-800/60 border-stone-700/80 text-stone-300 hover:bg-stone-800'
              }`}
            >
              <span className="text-xs font-bold text-pink-300">🎬 Full Movie (38s)</span>
              <span className="text-[11px] text-stone-400 mt-0.5">Complete train arrival, date, venue & invitation</span>
            </button>

            <button
              onClick={() => setExportMode('intro_clip')}
              className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer ${
                exportMode === 'intro_clip'
                  ? 'bg-pink-500/20 border-pink-500 text-white shadow-md'
                  : 'bg-stone-800/60 border-stone-700/80 text-stone-300 hover:bg-stone-800'
              }`}
            >
              <span className="text-xs font-bold text-pink-300">📱 Short Reel (11s)</span>
              <span className="text-[11px] text-stone-400 mt-0.5">Locomotive arrival + Baby meadow spotlight</span>
            </button>

            <button
              onClick={() => setExportMode('venue_clip')}
              className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer ${
                exportMode === 'venue_clip'
                  ? 'bg-pink-500/20 border-pink-500 text-white shadow-md'
                  : 'bg-stone-800/60 border-stone-700/80 text-stone-300 hover:bg-stone-800'
              }`}
            >
              <span className="text-xs font-bold text-pink-300">📍 Details Reel (15s)</span>
              <span className="text-[11px] text-stone-400 mt-0.5">Date, Time & Party Venue carriages</span>
            </button>

            <button
              onClick={() => setExportMode('snapshot')}
              className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer ${
                exportMode === 'snapshot'
                  ? 'bg-pink-500/20 border-pink-500 text-white shadow-md'
                  : 'bg-stone-800/60 border-stone-700/80 text-stone-300 hover:bg-stone-800'
              }`}
            >
              <span className="text-xs font-bold text-pink-300">🖼 Photo Invitation Card</span>
              <span className="text-[11px] text-stone-400 mt-0.5">High-Res PNG image for instant WhatsApp invite</span>
            </button>
          </div>
        </div>

        {/* Quality Selector */}
        {exportMode !== 'snapshot' && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-stone-800/50 border border-stone-700/60">
            <div>
              <span className="text-xs font-bold text-white block">Download Resolution:</span>
              <span className="text-[10px] text-stone-400">
                {selectedQuality === '1080p'
                  ? '1080×1920 Full HD (Crisp on all phone screens)'
                  : '720×1280 HD (Faster export)'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedQuality('720p')}
                className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                  selectedQuality === '720p'
                    ? 'bg-pink-500 text-white shadow-sm'
                    : 'bg-stone-700 text-stone-400 hover:text-stone-200'
                }`}
              >
                720p HD
              </button>
              <button
                onClick={() => setSelectedQuality('1080p')}
                className={`px-3.5 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  selectedQuality === '1080p'
                    ? 'bg-gradient-to-r from-pink-500 to-amber-500 text-white shadow-md'
                    : 'bg-stone-700 text-stone-400 hover:text-stone-200'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-200" />
                <span>1080p Full HD</span>
              </button>
            </div>
          </div>
        )}

        {/* Progress Bar & Status */}
        {isExporting && (
          <div className="flex flex-col gap-2 p-4 rounded-xl bg-stone-950/80 border border-pink-500/30">
            <div className="flex items-center justify-between text-xs">
              <span className="text-pink-300 font-semibold flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-400" />
                <span>Generating Full HD Video with Audio...</span>
              </span>
              <span className="font-mono text-stone-300 font-bold">{progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-stone-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[11px] text-stone-400">{statusMessage}</p>
          </div>
        )}

        {/* Success Preview & Mobile Actions */}
        {exportedVideoUrl && (
          <div className="flex flex-col gap-3 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
            <div className="flex items-center justify-between text-emerald-300 text-xs font-bold">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>HD Video Ready to Download on Phone!</span>
              </span>
              <span className="text-[11px] text-stone-400 font-mono">
                {selectedQuality === '1080p' ? '1080×1920 Full HD' : '720×1280 HD'}
              </span>
            </div>

            {/* Video preview player */}
            <video
              src={exportedVideoUrl}
              controls
              autoPlay
              loop
              className="w-full max-h-48 rounded-lg bg-black object-contain border border-stone-800 shadow-md"
            />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch gap-2.5 mt-1">
              {/* Primary Direct Download */}
              <button
                id="save-to-device-btn"
                onClick={handleDownload}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white text-xs font-bold shadow-lg shadow-pink-500/25 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Video File (HD)</span>
              </button>

              {/* Native Mobile Share / Save to Camera Roll */}
              <button
                id="share-mobile-btn"
                onClick={handleNativeShare}
                className="py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 text-xs font-bold border border-stone-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Save to Photos / WhatsApp</span>
              </button>

              {/* QR Code toggle */}
              <button
                type="button"
                onClick={() => setShowQrModal(!showQrModal)}
                title="Open on phone via QR code"
                className="p-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-all flex items-center justify-center cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-amber-300" />
              </button>
            </div>

            {/* Mobile Camera Roll Saving Tip */}
            <div className="p-2.5 rounded-lg bg-stone-900/90 border border-stone-800 text-[11px] text-stone-400 flex items-start gap-2">
              <span className="text-amber-400 font-bold">📱 Phone tip:</span>
              <span>
                On iPhone/iPad, tap "Save to Photos" to save directly into Camera Roll. On Android, tap "Download Video File" to save directly into your Gallery app.
              </span>
            </div>

            {/* QR Code expansion */}
            {showQrModal && (
              <div className="flex flex-col items-center gap-2 p-3 bg-stone-950 rounded-xl border border-stone-800 text-center animate-fade-in">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4" />
                  <span>Scan with Phone Camera to Open Directly</span>
                </span>
                <div className="p-2 bg-white rounded-xl shadow-md">
                  <img src={qrCodeUrl} alt="Phone QR code" className="w-36 h-36" />
                </div>
                <span className="text-[10px] text-stone-400">
                  Point your iPhone or Android camera at the code to access this video on mobile.
                </span>
              </div>
            )}
          </div>
        )}

        {sharedToast && (
          <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{sharedToast}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={() => {
              cancelExportRef.current = true;
              audioEngine.stopMusic();
              audioEngine.stopVoice();
              onClose();
            }}
            className="px-4 py-2 text-xs font-medium text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
          >
            Close
          </button>

          {!exportedVideoUrl && (
            <button
              onClick={handleStartExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white text-xs font-bold shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isExporting ? 'Exporting HD Video...' : 'Render & Download in HD'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
