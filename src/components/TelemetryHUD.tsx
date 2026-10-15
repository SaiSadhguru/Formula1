import React from 'react';
import { Gauge, Zap, Flame, ShieldAlert, Wind, Activity } from 'lucide-react';

interface TelemetryHUDProps {
  speedKmh: number;
  gear: number;
  rpm: number;
  throttle: number;
  brake: number;
  isDrsOpen: boolean;
  ersLevel: number;
  isDriving: boolean;
  onToggleDriving: () => void;
  onToggleDrs: () => void;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({
  speedKmh,
  gear,
  rpm,
  throttle,
  brake,
  isDrsOpen,
  ersLevel,
  isDriving,
  onToggleDriving,
  onToggleDrs,
}) => {
  // Compute Rev LED states (15 LEDs total)
  const maxRpm = 15000;
  const idleRpm = 4500;
  const rpmPct = Math.max(0, Math.min(1, (rpm - idleRpm) / (maxRpm - idleRpm)));
  const totalLeds = 15;
  const activeLeds = Math.round(rpmPct * totalLeds);

  const getLedColor = (index: number) => {
    if (index >= activeLeds) return 'bg-gray-800 border-gray-700/50';
    if (index < 5) return 'bg-emerald-500 shadow-[0_0_8px_#10b981]';
    if (index < 10) return 'bg-yellow-400 shadow-[0_0_8px_#facc15]';
    if (index < 13) return 'bg-red-500 shadow-[0_0_8px_#ef4444]';
    return 'bg-purple-500 shadow-[0_0_10px_#a855f7]';
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 p-3 sm:p-4 md:p-6 flex flex-col gap-2.5 z-10">
      {/* Top Header & Telemetry Status Bar */}
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        {/* Team & Chassis Brand */}
        <div className="pointer-events-auto bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-2.5 sm:p-3 shadow-2xl flex items-center gap-2.5 sm:gap-3 min-w-0 max-w-full">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#121316] to-black border border-[#66ff00]/40 flex items-center justify-center font-chakra font-black text-lg sm:text-xl text-[#66ff00] shrink-0">
            27
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="font-chakra font-bold text-xs sm:text-sm tracking-wider text-white uppercase truncate">
                APEX F1 // AUDI REVOLUT
              </span>
              <span className="bg-[#66ff00]/20 text-[#66ff00] text-[9px] sm:text-[10px] font-mono-tech px-1.5 py-0.5 rounded border border-[#66ff00]/30 font-semibold shrink-0">
                R26 CHASSIS
              </span>
              <span className="hidden xs:inline-block bg-amber-500/20 text-amber-300 text-[9px] font-mono-tech px-1.5 py-0.5 rounded border border-amber-500/30 font-semibold shrink-0">
                SIMULATED DATA
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] font-mono-tech text-gray-400 flex items-center gap-2 mt-0.5 truncate">
              <span>N. HÜLKENBERG</span>
              <span className="text-gray-600">•</span>
              <span className="text-emerald-400">FP2 SIMULATED RUN</span>
            </div>
          </div>
        </div>

        {/* Live Lap & Sector Times + Mini Track Visualizer */}
        <div className="pointer-events-auto hidden md:flex items-center gap-3 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-2.5 sm:p-3 shadow-2xl font-mono-tech text-xs shrink-0">
          {/* Mini Track Vector: Baku City Circuit, Azerbaijan */}
          <div className="relative w-16 h-11 flex items-center justify-center border-r border-white/10 pr-2.5" title="Baku City Circuit (6.003 km, 20 Turns)">
            <svg viewBox="0 0 100 80" className="w-full h-full fill-none" strokeWidth="2.5">
              {/* S1: T1-T4 90-degree street corners (Purple) */}
              <path d="M 18 68 L 18 58 L 45 58 L 45 45 L 62 45" className="stroke-purple-400" />
              {/* S2: Old City Castle ascent & descent T8-T16 (Blue) */}
              <path d="M 62 45 L 82 38 L 86 28 L 78 18 L 52 18 L 35 25 L 24 35 L 20 44" className="stroke-blue-400" />
              {/* S3: 2.2km flat-out Neftchilar Avenue to S/F T17-T20 (Yellow) */}
              <path d="M 20 44 L 18 68" className="stroke-yellow-400" />
              {/* Car Position — moving down Neftchilar Avenue main straight */}
              <circle cx="18" cy="56" r="3.5" className="fill-[#66ff00] opacity-40 animate-ping" style={{ animationDuration: '2s' }} />
              <circle cx="18" cy="56" r="2.5" className="fill-[#66ff00]" />
            </svg>
            <span className="absolute bottom-0 right-2 text-[7px] font-mono-tech text-[#66ff00] font-bold">BAK</span>
          </div>

          <div className="px-2 py-0.5 rounded bg-white/5 border border-white/5">
            <span className="text-gray-400 text-[8px] sm:text-[9px] block">BAKU LAP (SIM)</span>
            <span className="text-white font-bold text-xs sm:text-sm">1:43.500</span>
          </div>
          <div className="px-1.5 py-0.5 text-center">
            <span className="text-purple-400 text-[8px] sm:text-[9px] block">S1</span>
            <span className="text-white font-semibold text-xs">36.420</span>
          </div>
          <div className="px-1.5 py-0.5 text-center">
            <span className="text-blue-400 text-[8px] sm:text-[9px] block">S2</span>
            <span className="text-white font-semibold text-xs">42.180</span>
          </div>
          <div className="px-1.5 py-0.5 text-center">
            <span className="text-yellow-400 text-[8px] sm:text-[9px] block">S3</span>
            <span className="text-white font-semibold text-xs">24.900</span>
          </div>
          <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400 font-bold text-xs">
            -0.312 Δ
          </div>
        </div>
      </div>

      {/* Main Steering Wheel & Instrument HUD Cluster (Top Center Overlay) */}
      <div className="self-center mt-1 pointer-events-auto flex flex-col items-center max-w-full">
        {/* Rev Lights LED Strip */}
        <div className="bg-black/80 backdrop-blur-md px-2.5 sm:px-3.5 py-1 rounded-full border border-white/10 shadow-xl flex items-center gap-1 sm:gap-1.5 mb-1.5">
          {Array.from({ length: totalLeds }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 sm:w-2.5 h-2.5 sm:h-3.5 rounded-sm border transition-colors duration-75 ${getLedColor(i)}`}
            />
          ))}
        </div>

        {/* Compact Instrument Dashboard */}
        <div className="bg-black/85 backdrop-blur-md border border-white/10 rounded-xl sm:rounded-2xl px-3 sm:px-5 py-2 shadow-2xl flex flex-wrap items-center justify-center gap-3 sm:gap-5 max-w-full">
          {/* Speedometer */}
          <div className="flex flex-col items-center">
            <div className="flex items-baseline gap-1">
              <span className="font-chakra font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight">
                {Math.round(speedKmh)}
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono-tech text-gray-400">KM/H</span>
            </div>
            <span className="text-[8px] sm:text-[9px] font-mono-tech text-gray-400">SIM SPEED</span>
          </div>

          <div className="h-7 sm:h-8 w-px bg-white/10" />

          {/* Current Gear */}
          <div className="flex flex-col items-center min-w-[28px] sm:min-w-[36px]">
            <span className="font-chakra font-black text-2xl sm:text-3xl md:text-4xl text-[#66ff00]">
              {gear === 0 ? 'N' : gear}
            </span>
            <span className="text-[8px] sm:text-[9px] font-mono-tech text-gray-400">GEAR</span>
          </div>

          <div className="h-7 sm:h-8 w-px bg-white/10" />

          {/* RPM & Engine */}
          <div className="flex flex-col items-start min-w-[60px] sm:min-w-[70px]">
            <div className="font-mono-tech font-bold text-xs sm:text-sm text-gray-200">
              {Math.round(rpm).toLocaleString()}
            </div>
            <div className="text-[8px] sm:text-[9px] font-mono-tech text-gray-400">SIM RPM</div>
          </div>

          <div className="hidden sm:block h-7 sm:h-8 w-px bg-white/10" />

          {/* DRS Action Button */}
          <button
            onClick={onToggleDrs}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-chakra font-bold text-[10px] sm:text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 border cursor-pointer ${
              isDrsOpen
                ? 'bg-[#66ff00] text-black border-[#66ff00] shadow-[0_0_14px_rgba(102,255,0,0.6)]'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/15'
            }`}
          >
            <Wind className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            <span>DRS {isDrsOpen ? 'OPEN' : 'ARMED'}</span>
          </button>

          {/* Dynamic Track Run Simulator Toggle */}
          <button
            onClick={onToggleDriving}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-chakra font-bold text-[10px] sm:text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 border cursor-pointer ${
              isDriving
                ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/15'
            }`}
          >
            <Zap className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            <span>{isDriving ? 'SIM ON' : 'SIM OFF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
