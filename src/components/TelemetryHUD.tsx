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
    <div className="pointer-events-none absolute inset-x-0 top-0 p-4 md:p-6 flex flex-col justify-between z-10">
      {/* Top Header & Telemetry Status Bar */}
      <div className="flex items-start justify-between gap-4">
        {/* Team & Chassis Brand */}
        <div className="pointer-events-auto bg-black/75 backdrop-blur-md border border-white/10 rounded-xl p-3.5 shadow-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#121316] to-black border border-[#66ff00]/40 flex items-center justify-center font-chakra font-black text-xl text-[#66ff00]">
            27
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-chakra font-bold text-sm tracking-wider text-white uppercase">
                APEX F1 // AUDI REVOLUT
              </span>
              <span className="bg-[#66ff00]/20 text-[#66ff00] text-[10px] font-mono-tech px-1.5 py-0.5 rounded border border-[#66ff00]/30 font-semibold">
                R26 CHASSIS
              </span>
              <span className="bg-amber-500/20 text-amber-300 text-[9px] font-mono-tech px-1.5 py-0.5 rounded border border-amber-500/30 font-semibold">
                SIMULATED DEMO DATA
              </span>
            </div>
            <div className="text-[11px] font-mono-tech text-gray-400 flex items-center gap-3 mt-0.5">
              <span>PILOT: N. HÜLKENBERG</span>
              <span className="text-gray-600">•</span>
              <span className="text-emerald-400">SESSION: FP2 (SIMULATED RUN)</span>
            </div>
          </div>
        </div>

        {/* Live Lap & Sector Times */}
        <div className="pointer-events-auto hidden md:flex items-center gap-2 bg-black/75 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl font-mono-tech text-xs">
          <div className="px-2.5 py-1 rounded bg-white/5 border border-white/5">
            <span className="text-gray-400 text-[9px] block">LAP TIME (SIM)</span>
            <span className="text-white font-bold text-sm">1:17.382</span>
          </div>
          <div className="px-2 py-1">
            <span className="text-gray-400 text-[9px] block">S1</span>
            <span className="text-purple-400 font-semibold">27.140</span>
          </div>
          <div className="px-2 py-1">
            <span className="text-gray-400 text-[9px] block">S2</span>
            <span className="text-purple-400 font-semibold">26.890</span>
          </div>
          <div className="px-2 py-1">
            <span className="text-gray-400 text-[9px] block">S3</span>
            <span className="text-yellow-400 font-semibold">23.352</span>
          </div>
          <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400 font-bold">
            -0.245 Δ
          </div>
        </div>
      </div>

      {/* Main Steering Wheel & Instrument HUD Cluster (Top Center Overlay) */}
      <div className="self-center mt-3 pointer-events-auto flex flex-col items-center">
        {/* Rev Lights LED Strip */}
        <div className="bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-xl flex items-center gap-1.5 mb-2">
          {Array.from({ length: totalLeds }).map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-3.5 rounded-sm border transition-colors duration-75 ${getLedColor(i)}`}
            />
          ))}
        </div>

        {/* Compact Instrument Dashboard */}
        <div className="bg-black/85 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-2.5 shadow-2xl flex items-center gap-6">
          {/* Speedometer */}
          <div className="flex flex-col items-center">
            <div className="flex items-baseline gap-1">
              <span className="font-chakra font-black text-3xl md:text-4xl text-white tracking-tight">
                {Math.round(speedKmh)}
              </span>
              <span className="text-[10px] font-mono-tech text-gray-400">KM/H</span>
            </div>
            <span className="text-[9px] font-mono-tech text-gray-400">SIMULATED SPEED</span>
          </div>

          <div className="h-9 w-px bg-white/10" />

          {/* Current Gear */}
          <div className="flex flex-col items-center min-w-[36px]">
            <span className="font-chakra font-black text-3xl md:text-4xl text-[#66ff00]">
              {gear === 0 ? 'N' : gear}
            </span>
            <span className="text-[9px] font-mono-tech text-gray-400">GEAR</span>
          </div>

          <div className="h-9 w-px bg-white/10" />

          {/* RPM & Engine */}
          <div className="flex flex-col items-start min-w-[70px]">
            <div className="font-mono-tech font-bold text-sm text-gray-200">
              {Math.round(rpm).toLocaleString()}
            </div>
            <div className="text-[9px] font-mono-tech text-gray-400">SIMULATED RPM</div>
          </div>

          <div className="h-9 w-px bg-white/10" />

          {/* DRS Action Button */}
          <button
            onClick={onToggleDrs}
            className={`px-3 py-1.5 rounded-lg font-chakra font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 border cursor-pointer ${
              isDrsOpen
                ? 'bg-[#66ff00] text-black border-[#66ff00] shadow-[0_0_14px_rgba(102,255,0,0.6)]'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/15'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>DRS {isDrsOpen ? 'OPEN' : 'ARMED'}</span>
          </button>

          {/* Dynamic Track Run Simulator Toggle */}
          <button
            onClick={onToggleDriving}
            className={`px-3 py-1.5 rounded-lg font-chakra font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 border cursor-pointer ${
              isDriving
                ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/15'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isDriving ? 'SIM ACTIVE' : 'SIM IDLE'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
