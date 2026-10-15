import React from 'react';
import { Play, Pause, Volume2, VolumeX, AlertCircle } from 'lucide-react';
import { useAudioPlayer } from '../hooks/useAudioPlayer.ts';

/**
 * Ambient Audio Player
 *
 * Plays `public/audio/apex-ambient.mp3` when present.
 * Shows clear missing-asset notice when not present.
 */
function formatAudioTime(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const AudioPlayer: React.FC = () => {
  const { state, togglePlay, setVolume, toggleMute } = useAudioPlayer('/audio/apex-ambient.mp3', 0.18);

  const getButtonTitle = () => {
    if (state.error) return state.error;
    if (state.isLoading) return 'Loading ambient telemetry audio...';
    if (state.isPlaying) return 'Pause ambient telemetry audio';
    if (state.isAvailable) return 'Play ambient telemetry audio';
    return 'Audio standby';
  };

  return (
    <div
      className={`flex items-center gap-1.5 sm:gap-2 backdrop-blur-md border rounded-xl px-2.5 sm:px-3 py-1.5 shadow-lg shrink-0 transition-colors ${
        state.error
          ? 'bg-amber-950/40 border-amber-500/30'
          : 'bg-black/60 border-white/10'
      }`}
    >
      {/* Play/Pause / Loading */}
      <button
        onClick={togglePlay}
        disabled={state.isLoading}
        title={getButtonTitle()}
        className={`flex items-center justify-center w-6 h-6 rounded-full transition-all cursor-pointer shrink-0 ${
          state.isLoading
            ? 'bg-white/10 text-[#66ff00] cursor-wait'
            : state.isPlaying
            ? 'bg-[#66ff00] text-black shadow-[0_0_8px_rgba(102,255,0,0.5)]'
            : state.error
            ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
            : 'bg-white/10 hover:bg-white/20 text-gray-300'
        }`}
        aria-label={state.isPlaying ? 'Pause audio' : 'Play audio'}
      >
        {state.isLoading ? (
          <div className="w-3 h-3 border-2 border-[#66ff00] border-t-transparent rounded-full animate-spin" />
        ) : state.isPlaying ? (
          <Pause className="w-3 h-3" />
        ) : state.error ? (
          <AlertCircle className="w-3 h-3 text-amber-400" />
        ) : (
          <Play className="w-3 h-3 ml-0.5" />
        )}
      </button>

      {/* Label, Status, and Time/Duration */}
      <div className="flex flex-col leading-none shrink-0 min-w-[76px] sm:min-w-[90px]">
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[9px] font-mono-tech text-gray-400 uppercase tracking-wider font-semibold">
            AMBIENT AUDIO
          </span>
          {/* Format MM:SS time display */}
          <span className="text-[8px] font-mono-tech text-gray-300 font-medium">
            {formatAudioTime(state.currentTime)} / {state.duration > 0 ? formatAudioTime(state.duration) : '0:49'}
          </span>
        </div>
        {state.error ? (
          <span className="text-[8px] font-mono-tech text-amber-400/90 truncate" title={state.error}>
            {state.error.includes('missing') ? 'file missing' : 'playback error'}
          </span>
        ) : state.isLoading ? (
          <span className="text-[8px] font-mono-tech text-cyan-400 animate-pulse">loading...</span>
        ) : state.isPlaying ? (
          <span className="text-[8px] font-mono-tech text-[#66ff00]">playing (loop)</span>
        ) : state.isAvailable ? (
          <span className="text-[8px] font-mono-tech text-gray-400">ready</span>
        ) : (
          <span className="text-[8px] font-mono-tech text-gray-500">standby</span>
        )}
      </div>

      {/* Volume slider */}
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={state.isMuted ? 0 : state.volume}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
        className="w-12 sm:w-16 h-1 accent-[#66ff00] cursor-pointer"
        title={`Volume: ${Math.round((state.isMuted ? 0 : state.volume) * 100)}%`}
        aria-label="Volume slider"
      />

      {/* Mute toggle */}
      <button
        onClick={toggleMute}
        className={`transition-colors cursor-pointer shrink-0 ${state.isMuted ? 'text-amber-400' : 'text-gray-400 hover:text-white'}`}
        title={state.isMuted ? 'Unmute' : 'Mute'}
        aria-label={state.isMuted ? 'Unmute' : 'Mute'}
      >
        {state.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};
