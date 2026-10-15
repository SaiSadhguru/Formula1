import React from 'react';
import { MapPin, ArrowRight, ShieldAlert, Flag, Gauge, Sparkles } from 'lucide-react';
import { BAKU_CIRCUIT } from '../types/circuits.ts';

interface BakuRaceIntelligenceCardProps {
  className?: string;
}

export const BakuRaceIntelligenceCard: React.FC<BakuRaceIntelligenceCardProps> = ({ className = '' }) => {
  const handleScrollToCircuit = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById('circuit-panel');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, '', '#circuit-panel');
    }
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-black/70 p-5 sm:p-6 backdrop-blur-md shadow-2xl transition-all duration-300 hover:border-[#66ff00]/50 hover:shadow-[0_0_30px_rgba(102,255,0,0.15)] ${className}`}
    >
      {/* Background glow accent */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#66ff00]/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100 opacity-50" />

      <div className="relative z-10 flex flex-col justify-between h-full gap-5">
        {/* Top Header Badge & Title */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-mono-tech text-[#66ff00] uppercase tracking-wider font-bold">
              <MapPin className="w-3.5 h-3.5 text-[#66ff00]" />
              <span>BAKU RACE INTELLIGENCE</span>
            </div>
            <span className="flex items-center gap-1 rounded bg-[#66ff00]/15 px-2 py-0.5 text-[10px] font-mono-tech font-bold uppercase tracking-wider text-[#66ff00] border border-[#66ff00]/30">
              <Sparkles className="w-2.5 h-2.5" />
              ROUND 17
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
            <h3 className="font-chakra text-xl sm:text-2xl font-black uppercase tracking-wide text-white group-hover:text-[#66ff00] transition-colors">
              Baku City Circuit
            </h3>
            <span className="text-xs font-mono-tech text-gray-400 uppercase">Azerbaijan GP</span>
          </div>
        </div>

        {/* Middle Section: Circuit SVG Map Miniature & Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-white/5 rounded-xl border border-white/5 p-3.5">
          {/* Circuit SVG Graphic Outline */}
          <div className="sm:col-span-5 flex items-center justify-center relative h-28 sm:h-32 bg-black/50 rounded-lg p-2 border border-white/5 overflow-hidden">
            <svg
              viewBox="0 0 600 450"
              className="w-full h-full stroke-[#66ff00] fill-none drop-shadow-[0_0_8px_rgba(102,255,0,0.5)] transition-transform duration-500 group-hover:scale-105"
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Sector 1: S/F through T1-T5 */}
              <path d={BAKU_CIRCUIT.trackSvgPath.sector1} className="stroke-[#00f0ff]" />
              {/* Sector 2: Castle T6-T16 */}
              <path d={BAKU_CIRCUIT.trackSvgPath.sector2} className="stroke-[#ffe600]" />
              {/* Sector 3: Neftchilar Avenue Straight T17-T20 */}
              <path d={BAKU_CIRCUIT.trackSvgPath.sector3} className="stroke-[#66ff00]" />
              {/* Start/Finish Line */}
              <line
                x1={BAKU_CIRCUIT.trackSvgPath.startFinish.x1}
                y1={BAKU_CIRCUIT.trackSvgPath.startFinish.y1}
                x2={BAKU_CIRCUIT.trackSvgPath.startFinish.x2}
                y2={BAKU_CIRCUIT.trackSvgPath.startFinish.y2}
                stroke="#ffffff"
                strokeWidth="14"
              />
            </svg>
            <span className="absolute bottom-1 right-1.5 text-[8px] font-mono-tech text-gray-500 uppercase">
              TOPOLOGICAL SCHEMATIC
            </span>
          </div>

          {/* Key Metrics Grid */}
          <div className="sm:col-span-7 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-black/60 border border-white/10 p-2.5 flex flex-col justify-center">
              <span className="text-[9px] font-mono-tech text-gray-400 uppercase tracking-wider block">TRACK LENGTH</span>
              <span className="font-chakra text-lg font-black text-white">{BAKU_CIRCUIT.lengthKm}</span>
              <span className="text-[10px] font-mono-tech text-[#66ff00]">KM</span>
            </div>

            <div className="rounded-lg bg-black/60 border border-white/10 p-2.5 flex flex-col justify-center">
              <span className="text-[9px] font-mono-tech text-gray-400 uppercase tracking-wider block">CORNERS</span>
              <span className="font-chakra text-lg font-black text-white">{BAKU_CIRCUIT.cornersCount}</span>
              <span className="text-[10px] font-mono-tech text-cyan-400">TURNS</span>
            </div>

            <div className="rounded-lg bg-black/60 border border-white/10 p-2.5 flex flex-col justify-center">
              <span className="text-[9px] font-mono-tech text-gray-400 uppercase tracking-wider block">DISTANCE</span>
              <span className="font-chakra text-lg font-black text-white">{BAKU_CIRCUIT.totalLaps}</span>
              <span className="text-[10px] font-mono-tech text-amber-400">LAPS</span>
            </div>
          </div>
        </div>

        {/* Strategic Insight Text Callout */}
        <div className="flex items-start gap-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs font-mono-tech text-gray-300 leading-relaxed">
            <strong className="text-white font-semibold">Strategic Directive:</strong> Long straights and tight corners make braking, overtaking and Safety Car timing critical.
          </p>
        </div>

        {/* Primary CTA Button */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-[10px] font-mono-tech text-gray-400 hidden sm:block">
            Track Record: <strong className="text-white">{BAKU_CIRCUIT.lapRecord.time}</strong> ({BAKU_CIRCUIT.lapRecord.driver})
          </div>

          <a
            href="#circuit-panel"
            onClick={handleScrollToCircuit}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#66ff00] hover:bg-[#52e000] px-5 py-2.5 font-chakra text-xs font-black uppercase tracking-wider text-black shadow-[0_0_20px_rgba(102,255,0,0.3)] transition-all duration-200 cursor-pointer hover:shadow-[0_0_25px_rgba(102,255,0,0.5)] group/btn"
          >
            <span>EXPLORE CIRCUIT</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
          </a>
        </div>
      </div>
    </div>
  );
};
