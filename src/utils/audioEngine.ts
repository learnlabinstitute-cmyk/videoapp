// Web Audio API Synthesizer & Multi-Track Mixer for 1st Birthday Video
// Handles Fairytale Music Box, Train Whistles, and Synchronized AI Baby Voiceover

import { BabyVoiceConfig } from '../types';

class BirthdayAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private currentTrack: 'fairytale_box' | 'birthday_chimes' | 'lullaby_bells' | 'none' = 'fairytale_box';
  private destinationNode: MediaStreamAudioDestinationNode | null = null;

  // Track Gains
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private isMuted = false;
  private masterVolume = 0.85;

  // Voiceover playback state
  private voiceBuffer: AudioBuffer | null = null;
  private voiceSource: AudioBufferSourceNode | null = null;
  private currentVoiceUrl: string | null = null;
  private isVoicePlaying = false;
  private voiceStartTimeInCtx = 0;
  private voiceOffsetInMedia = 0;

  // Active scheduled bell oscillators for stopping
  private activeMusicNodes: { osc: OscillatorNode; gain: GainNode }[] = [];

  constructor() {
    this.attachUserGestureListener();
  }

  // Safely prime AudioContext on first user gesture anywhere on page
  private attachUserGestureListener() {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      this.unlockAudio();
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('click', unlock, { once: true, passive: true });
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
    window.addEventListener('keydown', unlock, { once: true, passive: true });
  }

  public initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;
      try {
        // Explicitly set sample rate to 24000 Hz to match Gemini's 24kHz raw PCM output
        this.ctx = new AudioCtx({ sampleRate: 24000 });
      } catch (e) {
        console.warn('AudioContext 24kHz sampleRate fallback to default', e);
        try {
          this.ctx = new AudioCtx();
        } catch (e2) {
          return null;
        }
      }
      try {
        this.destinationNode = this.ctx.createMediaStreamDestination();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

        this.voiceGain = this.ctx.createGain();
        this.voiceGain.gain.setValueAtTime(0.95, this.ctx.currentTime);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);

        // Connect track gains to master
        this.musicGain.connect(this.masterGain);
        this.voiceGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);

        // Master connects to both speakers and recording stream
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.connect(this.destinationNode);
      } catch (e) {
        return null;
      }
    }
    return this.ctx;
  }

  // Safely resume/unlock the AudioContext on a valid user gesture
  public async unlockAudio(): Promise<boolean> {
    try {
      const ctx = this.initContext();
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume();
      }
      return ctx?.state === 'running';
    } catch (e) {
      return false;
    }
  }

  public getAudioStreamDestination(): MediaStreamAudioDestinationNode | null {
    this.initContext();
    return this.destinationNode;
  }

  public setVolume(val: number) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Convert raw 24000Hz 16-bit mono PCM into an AudioBuffer matching Gemini's output
  private pcm16ToAudioBuffer(arrayBuffer: ArrayBuffer, sampleRate = 24000): AudioBuffer | null {
    if (!this.ctx) return null;
    try {
      let pcmBytes = arrayBuffer;
      const u8 = new Uint8Array(arrayBuffer);
      // If contains 44-byte RIFF header, skip it to read raw PCM samples
      if (u8.length >= 44 && u8[0] === 0x52 && u8[1] === 0x49 && u8[2] === 0x46 && u8[3] === 0x46) {
        pcmBytes = arrayBuffer.slice(44);
      }
      const int16 = new Int16Array(pcmBytes);
      const audioBuffer = this.ctx.createBuffer(1, int16.length, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < int16.length; i++) {
        channelData[i] = int16[i] / 32768.0;
      }
      return audioBuffer;
    } catch (e) {
      console.warn('Direct 24kHz PCM decode failed:', e);
      return null;
    }
  }

  // Load and decode an audio URL (e.g. data:audio/wav;base64,... from Gemini or synthesized)
  public async loadVoiceAudio(url: string): Promise<AudioBuffer | null> {
    this.initContext();
    if (!this.ctx) return null;

    if (this.currentVoiceUrl === url && this.voiceBuffer) {
      return this.voiceBuffer;
    }

    try {
      let arrayBuffer: ArrayBuffer;
      if (url.startsWith('data:')) {
        const base64 = url.split(',')[1];
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        arrayBuffer = bytes.buffer;
      } else {
        const res = await fetch(url);
        arrayBuffer = await res.arrayBuffer();
      }

      let decoded: AudioBuffer | null = null;
      try {
        decoded = await this.ctx.decodeAudioData(arrayBuffer.slice(0));
      } catch (decodeErr) {
        // Fallback directly to 24000 Hz raw PCM format
        decoded = this.pcm16ToAudioBuffer(arrayBuffer, 24000);
      }

      if (!decoded) {
        decoded = this.pcm16ToAudioBuffer(arrayBuffer, 24000);
      }

      if (decoded) {
        this.voiceBuffer = decoded;
        this.currentVoiceUrl = url;
      }
      return decoded;
    } catch (err) {
      console.warn('Failed to decode voice audio:', err);
      return null;
    }
  }

  // Stop currently playing voiceover
  public stopVoice() {
    if (this.voiceSource) {
      try {
        this.voiceSource.stop();
        this.voiceSource.disconnect();
      } catch (e) {
        // already stopped
      }
      this.voiceSource = null;
    }
    this.isVoicePlaying = false;
  }

  // Preview the voice standalone (e.g. user clicked "Test Voice")
  public async previewVoice(
    audioUrl: string | null,
    pitch = 1.0,
    speed = 1.0,
    intensity = 85,
    onEnded?: () => void
  ) {
    this.initContext();
    if (!this.ctx || !this.voiceGain) return;

    this.stopVoice();

    if (!audioUrl) return;
    const buffer = await this.loadVoiceAudio(audioUrl);
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    // Natural 24kHz playback matching Gemini format
    const naturalSpeed = Math.max(0.7, Math.min(1.4, speed || 1.0));
    source.playbackRate.setValueAtTime(naturalSpeed, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.95, this.ctx.currentTime);

    // Clean audio path without artificial peaking distortion
    source.connect(gain);
    gain.connect(this.voiceGain);

    this.voiceSource = source;
    this.isVoicePlaying = true;

    source.onended = () => {
      this.isVoicePlaying = false;
      if (onEnded) onEnded();
    };

    source.start(0);
  }

  // Sync background music and voiceover to video playback position
  public syncPlayback(
    currentTime: number,
    isPlaying: boolean,
    musicTheme: 'fairytale_box' | 'birthday_chimes' | 'lullaby_bells' | 'none',
    voiceConfig?: BabyVoiceConfig
  ) {
    if (!isPlaying) {
      this.stopMusic();
      this.stopVoice();
      return;
    }

    // Modern browsers require a user gesture before starting audio.
    // If context is uninitialized or suspended, do not attempt to start until unlocked by a gesture.
    if (!this.ctx || this.ctx.state !== 'running') {
      return;
    }

    // Ensure music is active
    if (!this.isPlaying || this.currentTrack !== musicTheme) {
      this.startMusicLoop(musicTheme, currentTime);
    }

    // Voiceover sync
    if (voiceConfig && voiceConfig.enabled && voiceConfig.audioUrl) {
      const voiceStart = voiceConfig.startDelay || 1.0;
      const voiceDur = voiceConfig.audioDuration || 7.0;

      // Adjust music ducking
      const isVoiceActive = currentTime >= voiceStart && currentTime < voiceStart + voiceDur;
      if (this.musicGain) {
        const targetMusicVol = isVoiceActive ? (voiceConfig.bgMusicDucking ?? 0.35) : 0.7;
        this.musicGain.gain.setTargetAtTime(targetMusicVol, this.ctx.currentTime, 0.1);
      }

      if (isVoiceActive) {
        if (!this.isVoicePlaying) {
          const offset = currentTime - voiceStart;
          this.startVoiceAtOffset(voiceConfig, offset);
        }
      } else {
        if (this.isVoicePlaying) {
          this.stopVoice();
        }
      }
    } else {
      // Normal music volume
      if (this.musicGain) {
        this.musicGain.gain.setTargetAtTime(0.7, this.ctx.currentTime, 0.1);
      }
      this.stopVoice();
    }
  }

  private async startVoiceAtOffset(voiceConfig: BabyVoiceConfig, offsetSeconds: number) {
    if (!voiceConfig.audioUrl || !this.ctx || !this.voiceGain) return;
    this.stopVoice();

    const buffer = await this.loadVoiceAudio(voiceConfig.audioUrl);
    if (!buffer) return;

    if (offsetSeconds >= buffer.duration) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    // Natural 24kHz playback matching Gemini's output format
    const naturalSpeed = Math.max(0.7, Math.min(1.4, voiceConfig.speed || 1.0));
    source.playbackRate.setValueAtTime(naturalSpeed, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(voiceConfig.voiceVolume ?? 0.95, this.ctx.currentTime);

    source.connect(gain);
    gain.connect(this.voiceGain);

    this.voiceSource = source;
    this.isVoicePlaying = true;

    source.onended = () => {
      this.isVoicePlaying = false;
      if (this.musicGain && this.ctx) {
        this.musicGain.gain.setTargetAtTime(0.7, this.ctx.currentTime, 0.15);
      }
    };

    source.start(0, Math.max(0, offsetSeconds));
  }

  // Play a single soft music box bell tone
  private playBellTone(freq: number, time: number, duration = 1.2, detune = 0) {
    if (!this.ctx || !this.musicGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    osc.detune.setValueAtTime(detune, time);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.2, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + duration);

    this.activeMusicNodes.push({ osc, gain });

    // Shimmer sparkle harmonic
    const shimmer = this.ctx.createOscillator();
    const shimmerGain = this.ctx.createGain();
    shimmer.type = 'triangle';
    shimmer.frequency.setValueAtTime(freq * 2, time);
    shimmerGain.gain.setValueAtTime(0, time);
    shimmerGain.gain.linearRampToValueAtTime(0.05, time + 0.01);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, time + duration * 0.6);

    shimmer.connect(shimmerGain);
    shimmerGain.connect(this.musicGain);

    shimmer.start(time);
    shimmer.stop(time + duration * 0.6);

    this.activeMusicNodes.push({ osc: shimmer, gain: shimmerGain });
  }

  // Train Whistle sound effect ("Choo-Choo!")
  public playWhistle() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const chords = [587.33, 739.99, 880.0];

    chords.forEach((freq) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);

      // Two whistle puffs: Choo - Choo!
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.02, now + 0.35);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.45);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 1.2);
    });
  }

  // Melodic sequences for 38 seconds video
  public startMusicLoop(track: 'fairytale_box' | 'birthday_chimes' | 'lullaby_bells' | 'none', currentTimeOffset = 0) {
    if (track === 'none') {
      this.stopMusic();
      return;
    }
    this.initContext();
    this.stopMusic();
    this.currentTrack = track;
    this.isPlaying = true;

    const melodyNotes: { note: number; beat: number; dur: number }[] = [
      // Verse 1
      { note: 523.25, beat: 0, dur: 0.4 }, // C5
      { note: 523.25, beat: 0.5, dur: 0.4 }, // C5
      { note: 587.33, beat: 1.0, dur: 0.8 }, // D5
      { note: 523.25, beat: 2.0, dur: 0.8 }, // C5
      { note: 698.46, beat: 3.0, dur: 0.8 }, // F5
      { note: 659.25, beat: 4.0, dur: 1.4 }, // E5

      { note: 523.25, beat: 6.0, dur: 0.4 }, // C5
      { note: 523.25, beat: 6.5, dur: 0.4 }, // C5
      { note: 587.33, beat: 7.0, dur: 0.8 }, // D5
      { note: 523.25, beat: 8.0, dur: 0.8 }, // C5
      { note: 783.99, beat: 9.0, dur: 0.8 }, // G5
      { note: 698.46, beat: 10.0, dur: 1.4 }, // F5

      { note: 523.25, beat: 12.0, dur: 0.4 }, // C5
      { note: 523.25, beat: 12.5, dur: 0.4 }, // C5
      { note: 1046.5, beat: 13.0, dur: 0.8 }, // C6
      { note: 880.0, beat: 14.0, dur: 0.8 }, // A5
      { note: 698.46, beat: 15.0, dur: 0.8 }, // F5
      { note: 659.25, beat: 16.0, dur: 0.8 }, // E5
      { note: 587.33, beat: 17.0, dur: 1.2 }, // D5

      { note: 932.33, beat: 19.0, dur: 0.4 }, // Bb5
      { note: 932.33, beat: 19.5, dur: 0.4 }, // Bb5
      { note: 880.0, beat: 20.0, dur: 0.8 }, // A5
      { note: 698.46, beat: 21.0, dur: 0.8 }, // F5
      { note: 783.99, beat: 22.0, dur: 0.8 }, // G5
      { note: 698.46, beat: 23.0, dur: 2.0 }, // F5

      // Reprise
      { note: 659.25, beat: 26.0, dur: 0.8 }, // E5
      { note: 698.46, beat: 27.0, dur: 0.8 }, // F5
      { note: 783.99, beat: 28.0, dur: 1.2 }, // G5
      { note: 880.0, beat: 29.5, dur: 0.8 }, // A5
      { note: 698.46, beat: 31.0, dur: 1.2 }, // F5
      { note: 523.25, beat: 33.0, dur: 1.5 }, // C5
      { note: 698.46, beat: 35.0, dur: 2.5 }, // F5 finish
    ];

    const tempo = 1.0;
    const startTimeInCtx = this.ctx!.currentTime;

    melodyNotes.forEach((item) => {
      const scheduledTime = startTimeInCtx + item.beat * tempo - currentTimeOffset;
      if (scheduledTime >= startTimeInCtx) {
        this.playBellTone(item.note, scheduledTime, item.dur * 1.5);
        this.playBellTone(item.note / 2, scheduledTime, item.dur * 1.2, 5);
      }
    });
  }

  public stopMusic() {
    this.isPlaying = false;
    this.activeMusicNodes.forEach(({ osc, gain }) => {
      try {
        osc.stop();
        osc.disconnect();
        gain.disconnect();
      } catch (e) {
        // already stopped
      }
    });
    this.activeMusicNodes = [];
  }
}

export const audioEngine = new BirthdayAudioEngine();

// Helper: Client-side baby speech synthesis fallback & offline WAV generator
// Generates an adorable toddler vocal track with pitch, formant resonance, and emotion
export async function generateClientBabyVoiceWav(
  script: string,
  pitch: number, // 0.8 to 2.2
  speed: number, // 0.8 to 1.3
  intensity: number // 20 to 100
): Promise<{ audioUrl: string; duration: number }> {
  const sampleRate = 24000;
  // Estimate speaking duration: roughly 3 words per second adjusted by speed
  const words = script.trim().split(/\s+/).filter(Boolean);
  const wordCount = Math.max(1, words.length);
  const duration = Math.min(18, Math.max(3.5, (wordCount / 2.7) / speed));
  const numSamples = Math.floor(sampleRate * duration);

  const offlineCtx = new OfflineAudioContext(1, numSamples, sampleRate);

  // Fundamental frequency for baby toddler voice: 380Hz to 680Hz depending on pitch
  const baseFreq = 420 * (pitch / 1.15);

  // Sequence of expressive vocal babble syllables aligned to script words
  const stepTime = duration / wordCount;

  words.forEach((word, i) => {
    const t0 = i * stepTime;
    const tLen = stepTime * 0.85;

    // Carrier oscillator: combination of sine and triangle for vocal cord buzz
    const osc = offlineCtx.createOscillator();
    osc.type = 'sawtooth';

    // Inflection contour: playful baby pitch glide up and down
    const inflection = Math.sin((i / wordCount) * Math.PI * 2) * 45 + (i % 2 === 0 ? 30 : -20);
    const startPitch = baseFreq + inflection;
    const endPitch = baseFreq + (i === wordCount - 1 ? 55 : (Math.random() - 0.5) * 40);

    osc.frequency.setValueAtTime(startPitch, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(150, endPitch), t0 + tLen);

    // Formant 1: Mouth cavity (F1: 900Hz to 1200Hz for baby 'a' and 'ee' vowels)
    const f1 = offlineCtx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.setValueAtTime(1050 + Math.sin(i * 3) * 200, t0);
    f1.Q.setValueAtTime(4.0, t0);

    // Formant 2: High toddler brightness (F2: 2400Hz to 3200Hz)
    const f2 = offlineCtx.createBiquadFilter();
    f2.type = 'peaking';
    f2.frequency.setValueAtTime(2800, t0);
    f2.gain.setValueAtTime((intensity / 100) * 12, t0);
    f2.Q.setValueAtTime(3.0, t0);

    // Syllable Amplitude Envelope
    const env = offlineCtx.createGain();
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(0.35 * (intensity / 100), t0 + 0.04);
    env.gain.exponentialRampToValueAtTime(0.001, t0 + tLen);

    osc.connect(f1);
    f1.connect(f2);
    f2.connect(env);
    env.connect(offlineCtx.destination);

    osc.start(t0);
    osc.stop(t0 + tLen);

    // Subtle baby breath/chuckle noise for consonants
    const bufferSize = Math.floor(sampleRate * 0.05);
    const noiseBuffer = offlineCtx.createBuffer(1, bufferSize, sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let s = 0; s < bufferSize; s++) {
      data[s] = (Math.random() * 2 - 1) * 0.08;
    }
    const noise = offlineCtx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = offlineCtx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(3500, t0);

    const noiseGain = offlineCtx.createGain();
    noiseGain.gain.setValueAtTime(0.06, t0);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.05);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(offlineCtx.destination);

    noise.start(t0);
    noise.stop(t0 + 0.05);
  });

  const renderedBuffer = await offlineCtx.startRendering();
  const wavBlob = audioBufferToWavBlob(renderedBuffer);
  const audioUrl = URL.createObjectURL(wavBlob);

  return { audioUrl, duration };
}

// Convert AudioBuffer to 16-bit PCM WAV Blob
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const dataLength = buffer.length * numChannels * 2;
  const bufferLength = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // Write RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Interleave and write 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
