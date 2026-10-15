import { useState, useEffect, useCallback } from 'react';

export interface AudioPlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  isMuted: boolean;
  volume: number;       // 0–1
  isAvailable: boolean; // true only when valid audio format loaded
  error: string | null;  // User-facing error message when missing or failed
  currentTime: number;  // current playback time in seconds
  duration: number;     // duration in seconds
}

class AudioManager {
  private static instance: AudioManager | null = null;
  private audio: HTMLAudioElement | null = null;
  private fadeFrameId: number | null = null;
  private subscribers = new Set<(state: AudioPlayerState) => void>();
  private currentSrc: string = '';

  public state: AudioPlayerState = {
    isPlaying: false,
    isLoading: false,
    isMuted: false,
    volume: 0.18,
    isAvailable: false,
    error: null,
    currentTime: 0,
    duration: 0,
  };

  private constructor() {}

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public init(src: string, defaultVolume = 0.18) {
    if (this.currentSrc === src && this.audio) {
      return;
    }

    // If source changed, cleanly stop and dispose of old audio instance
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio.load();
      this.audio = null;
    }

    this.currentSrc = src;
    this.state.volume = defaultVolume;

    this.audio = new Audio();
    this.audio.loop = true;
    this.audio.volume = defaultVolume;
    this.audio.preload = 'metadata';

    this.audio.addEventListener('loadedmetadata', () => {
      const dur = this.audio?.duration || 0;
      this.updateState({
        duration: isFinite(dur) ? dur : 0,
        isAvailable: true,
        error: null,
      });
    });

    this.audio.addEventListener('canplaythrough', () => {
      const dur = this.audio?.duration || this.state.duration;
      this.updateState({
        isAvailable: true,
        isLoading: false,
        duration: isFinite(dur) ? dur : this.state.duration,
        error: null,
      });
    });

    this.audio.addEventListener('timeupdate', () => {
      if (this.audio) {
        this.updateState({
          currentTime: this.audio.currentTime,
          duration: isFinite(this.audio.duration) && this.audio.duration > 0 ? this.audio.duration : this.state.duration,
        });
      }
    });

    this.audio.addEventListener('ended', () => {
      // Loop backup in case browser loop attribute glitches
      if (this.audio && this.audio.loop) {
        this.audio.currentTime = 0;
        this.audio.play().catch(() => {});
      } else {
        this.updateState({ isPlaying: false, isLoading: false, currentTime: 0 });
      }
    });

    this.audio.addEventListener('waiting', () => {
      if (this.state.isPlaying) {
        this.updateState({ isLoading: true });
      }
    });

    this.audio.addEventListener('playing', () => {
      this.updateState({ isPlaying: true, isLoading: false, error: null });
    });

    this.audio.addEventListener('error', () => {
      const audioErr = this.audio?.error;
      const msg = audioErr?.code === 4
        ? 'Audio file missing: place "apex-ambient.mp3" in public/audio/'
        : 'Audio playback failed or unsupported format';
      this.updateState({
        isAvailable: false,
        isPlaying: false,
        isLoading: false,
        error: msg,
      });
    });

    this.audio.addEventListener('pause', () => {
      if (this.state.isPlaying && !this.fadeFrameId) {
        this.updateState({ isPlaying: false, isLoading: false });
      }
    });

    this.audio.src = src;

    // Probe if audio file exists and is valid audio rather than HTML fallback
    if (typeof fetch !== 'undefined') {
      fetch(src, { method: 'HEAD' })
        .then((res) => {
          const contentType = res.headers.get('content-type') || '';
          const contentLength = res.headers.get('content-length');
          if (!res.ok || contentType.includes('text/html') || contentLength === '0') {
            this.updateState({
              isAvailable: false,
              isPlaying: false,
              isLoading: false,
              error: 'Audio file missing: place "apex-ambient.mp3" in public/audio/',
            });
          } else {
            this.updateState({ isAvailable: true, error: null });
          }
        })
        .catch(() => {
          this.updateState({
            isAvailable: false,
            isPlaying: false,
            isLoading: false,
            error: 'Audio file missing: place "apex-ambient.mp3" in public/audio/',
          });
        });
    }
  }

  public subscribe(callback: (state: AudioPlayerState) => void): () => void {
    this.subscribers.add(callback);
    callback(this.state);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private updateState(partial: Partial<AudioPlayerState>) {
    this.state = { ...this.state, ...partial };
    this.subscribers.forEach((cb) => cb(this.state));
  }

  private fadeIn(target: number) {
    if (!this.audio) return;
    if (this.fadeFrameId) cancelAnimationFrame(this.fadeFrameId);
    this.audio.volume = 0;

    const step = () => {
      if (!this.audio) return;
      const next = Math.min(this.audio.volume + 0.015, target);
      this.audio.volume = next;
      if (next < target) {
        this.fadeFrameId = requestAnimationFrame(step);
      } else {
        this.fadeFrameId = null;
      }
    };
    this.fadeFrameId = requestAnimationFrame(step);
  }

  private fadeOut(onComplete?: () => void) {
    if (!this.audio) return;
    if (this.fadeFrameId) cancelAnimationFrame(this.fadeFrameId);

    const step = () => {
      if (!this.audio) return;
      const next = Math.max(this.audio.volume - 0.015, 0);
      this.audio.volume = next;
      if (next > 0) {
        this.fadeFrameId = requestAnimationFrame(step);
      } else {
        this.fadeFrameId = null;
        this.audio.pause();
        onComplete?.();
      }
    };
    this.fadeFrameId = requestAnimationFrame(step);
  }

  public async play() {
    if (!this.audio) return;

    if (this.state.error || !this.state.isAvailable) {
      // Re-verify file before attempting play
      try {
        const res = await fetch(this.currentSrc, { method: 'HEAD' });
        const contentType = res.headers.get('content-type') || '';
        const contentLength = res.headers.get('content-length');
        if (!res.ok || contentType.includes('text/html') || contentLength === '0') {
          this.updateState({
            isAvailable: false,
            isPlaying: false,
            isLoading: false,
            error: 'Audio file missing: place "apex-ambient.mp3" in public/audio/',
          });
          return;
        }
      } catch {
        this.updateState({
          isAvailable: false,
          isPlaying: false,
          isLoading: false,
          error: 'Audio file missing: place "apex-ambient.mp3" in public/audio/',
        });
        return;
      }
    }

    try {
      this.updateState({ isLoading: true, error: null });
      await this.audio.play();
      this.fadeIn(this.state.volume);
      this.updateState({ isPlaying: true, isLoading: false, error: null });
    } catch (e: any) {
      console.warn('Audio playback prevented or failed:', e?.message);
      this.updateState({
        isPlaying: false,
        isLoading: false,
        error: e?.name === 'NotAllowedError'
          ? 'Playback blocked: user interaction required'
          : 'Playback error: audio source unavailable',
      });
    }
  }

  public pause() {
    this.fadeOut(() => {
      this.updateState({ isPlaying: false });
    });
  }

  public togglePlay() {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public setVolume(v: number) {
    const clamped = Math.max(0, Math.min(1, v));
    if (this.audio && this.state.isPlaying) {
      this.audio.volume = clamped;
    }
    this.updateState({ volume: clamped });
  }

  public toggleMute() {
    if (!this.audio) return;
    const next = !this.state.isMuted;
    this.audio.muted = next;
    this.updateState({ isMuted: next });
  }
}

export function useAudioPlayer(src: string, defaultVolume = 0.18) {
  const manager = AudioManager.getInstance();
  const [state, setState] = useState<AudioPlayerState>(manager.state);

  useEffect(() => {
    manager.init(src, defaultVolume);
    const unsubscribe = manager.subscribe(setState);
    return () => {
      unsubscribe();
    };
  }, [src, defaultVolume, manager]);

  const togglePlay = useCallback(() => manager.togglePlay(), [manager]);
  const setVolume = useCallback((v: number) => manager.setVolume(v), [manager]);
  const toggleMute = useCallback(() => manager.toggleMute(), [manager]);

  return { state, togglePlay, setVolume, toggleMute };
}
