import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Flag,
  Gauge,
  Wind,
  Thermometer,
  ShieldAlert,
  ChevronRight,
  Info,
  Maximize2,
  Minimize2,
  Zap,
  Activity,
  Layers,
  ArrowRight,
  AlertTriangle,
  Play,
  Pause,
  Gamepad2,
} from 'lucide-react';
import { BAKU_CIRCUIT, AVAILABLE_CIRCUITS, type CircuitData, type CircuitTurn } from '../types/circuits.ts';
import { Baku3DSimulator } from './Baku3DSimulator.tsx';

interface CircuitPanelProps {
  activeCircuit?: CircuitData;
  onSelectCircuit?: (circuitId: string) => void;
  onSelectTurnForStrategy?: (turn: CircuitTurn) => void;
}

export const CircuitPanel: React.FC<CircuitPanelProps> = ({
  activeCircuit = BAKU_CIRCUIT,
  onSelectCircuit,
  onSelectTurnForStrategy,
}) => {
  const [selectedTurn, setSelectedTurn] = useState<CircuitTurn | null>(activeCircuit.turns[0] ?? null);
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<0 | 1 | 2 | 3>(0);
  const [carAnimRunning, setCarAnimRunning] = useState<boolean>(true);
  const [carProgress, setCarProgress] = useState<number>(0);
  const [hoveredTurn, setHoveredTurn] = useState<CircuitTurn | null>(null);
  const [viewMode, setViewMode] = useState<'schematic' | 'simulator'>('simulator');

  // Update selected turn if circuit changes
  useEffect(() => {
    setSelectedTurn(activeCircuit.turns[0] ?? null);
    setCarProgress(0);
  }, [activeCircuit.id]);

  // Simulated car position marker moving along the circuit outline (0 to 1 loop)
  useEffect(() => {
    if (!carAnimRunning) return;
    const interval = setInterval(() => {
      setCarProgress((prev) => {
        const next = prev + 0.005;
        return next >= 1 ? 0 : next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [carAnimRunning]);

  // Interpolate car coordinates along Baku turns roughly according to progress
  const turnsCount = activeCircuit.turns.length;
  const currentIdx = Math.floor(carProgress * turnsCount);
  const nextIdx = (currentIdx + 1) % turnsCount;
  const tFrac = (carProgress * turnsCount) - currentIdx;

  const curTurn = activeCircuit.turns[currentIdx] || activeCircuit.turns[0];
  const nxtTurn = activeCircuit.turns[nextIdx] || activeCircuit.turns[0];

  const markerX = curTurn.svgCoordinates.x + (nxtTurn.svgCoordinates.x - curTurn.svgCoordinates.x) * tFrac;
  const markerY = curTurn.svgCoordinates.y + (nxtTurn.svgCoordinates.y - curTurn.svgCoordinates.y) * tFrac;

  const currentTurnInAction = hoveredTurn || selectedTurn || curTurn;

  return (
    <section id="circuit-panel" className="bg-[#07080a] border-t border-white/10 text-gray-200 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-tech text-[#66ff00] mb-2 uppercase tracking-widest flex-wrap">
              <MapPin className="w-4 h-4" />
              <span>CIRCUIT INTEL & TELEMETRY TRACK MAP</span>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded border border-amber-500/30 font-semibold">
                SIMULATED DATA
              </span>
              <span className="bg-[#66ff00]/20 text-[#66ff00] text-[10px] px-2 py-0.5 rounded border border-[#66ff00]/40 font-bold uppercase">
                {activeCircuit.country} GP
              </span>
            </div>
            <h2 className="font-chakra font-black text-3xl md:text-4xl text-white tracking-wide uppercase flex items-center gap-3">
              <span>{activeCircuit.name}</span>
            </h2>
            <p className="text-xs font-mono-tech text-gray-400 mt-2 max-w-2xl leading-relaxed">
                        <span className="text-white font-semibold">Official reference:</span>{' '}
              <strong>{activeCircuit.lengthKm} km</strong>, <strong>{activeCircuit.cornersCount} turns</strong>,{' '}
              <strong>{activeCircuit.totalLaps} race laps</strong> (~{activeCircuit.raceDistanceKm.toFixed(1)} km).
              Track map is a <span className="text-amber-400">topological schematic</span> — not GPS-accurate.
              Sector times and weather are <span className="text-amber-400">simulation assumptions</span>.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-3 font-mono-tech text-xs bg-white/5 border border-white/10 p-3 rounded-2xl shadow-xl">
            <div className="px-2">
              <span className="text-gray-500 text-[9px] block">RACE DISTANCE</span>
              <span className="font-chakra font-bold text-white text-base">{activeCircuit.totalLaps} LAPS</span>
            </div>
            <div className="h-7 w-px bg-white/10" />
            <div className="px-2">
              <span className="text-gray-500 text-[9px] block">LAP RECORD</span>
              <span className="font-chakra font-bold text-[#66ff00] text-sm">{activeCircuit.lapRecord.time}</span>
              <span className="text-[9px] text-gray-400 block">{activeCircuit.lapRecord.driver} ({activeCircuit.lapRecord.year})</span>
            </div>
            <div className="h-7 w-px bg-white/10" />
            <div className="px-2">
              <span className="text-gray-500 text-[9px] block">SC PROBABILITY</span>
              <span className="font-chakra font-bold text-amber-400 text-sm">~{activeCircuit.scProbabilityPct}%</span>
              <span className="text-[9px] text-gray-500 block">est. from race records</span>
            </div>
          </div>
        </div>

        {/* Sector Quick Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono-tech text-gray-400 uppercase tracking-wider mr-1">Filter Sector:</span>
            <button
              onClick={() => setSelectedSectorFilter(0)}
              className={`px-3 py-1 rounded-lg text-xs font-chakra font-bold uppercase tracking-wider transition-all cursor-pointer ${
                selectedSectorFilter === 0
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              Full Circuit (All 20 Turns)
            </button>
            {activeCircuit.sectors.map((s) => (
              <button
                key={s.sector}
                onClick={() => setSelectedSectorFilter(s.sector)}
                className={`px-3 py-1 rounded-lg text-xs font-chakra font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border ${
                  selectedSectorFilter === s.sector
                    ? 'shadow-lg'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: selectedSectorFilter === s.sector ? `${s.color}25` : 'rgba(255,255,255,0.03)',
                  borderColor: selectedSectorFilter === s.sector ? s.color : 'rgba(255,255,255,0.1)',
                  color: selectedSectorFilter === s.sector ? '#fff' : s.color,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span>Sector {s.sector}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher: 3D Simulator vs 2D Tactical Schematic */}
            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setViewMode('simulator')}
                className={`px-3 py-1 rounded-lg text-xs font-chakra font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'simulator'
                    ? 'bg-[#66ff00] text-black shadow-[0_0_15px_rgba(102,255,0,0.3)]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Playable 3D Sim</span>
              </button>
              <button
                onClick={() => setViewMode('schematic')}
                className={`px-3 py-1 rounded-lg text-xs font-chakra font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'schematic'
                    ? 'bg-white/20 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>2D Intel Map</span>
              </button>
            </div>

            {viewMode === 'schematic' && (
              <button
                onClick={() => setCarAnimRunning(!carAnimRunning)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono-tech text-gray-300 flex items-center gap-1.5 cursor-pointer transition-colors"
                title={carAnimRunning ? 'Pause simulated track position' : 'Resume simulated track position'}
              >
                {carAnimRunning ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-[#66ff00]" />}
                <span>{carAnimRunning ? 'Pause Sim' : 'Run Sim'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Main View: 3D Playable Simulator or 2D Tactical Vector Map */}
        {viewMode === 'simulator' ? (
          <div className="mb-6">
            <Baku3DSimulator />
          </div>
        ) : null}

        {/* Main Grid: Interactive Map (Left) + Corner Strategic Intel (Right) */}
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-start ${viewMode === 'simulator' ? 'mt-6' : ''}`}>
          {/* Left: SVG Track Visualization (7 cols) */}
          <div className="lg:col-span-7 bg-black/60 border border-white/10 rounded-2xl p-4 sm:p-6 shadow-2xl relative flex flex-col justify-between overflow-hidden">
            {/* Sector Color Legend overlay */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-[11px] font-mono-tech">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1.5 rounded-sm bg-[#a855f7]" />
                  <span className="text-gray-300">S1: T1–T5 (90° Street)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1.5 rounded-sm bg-[#3b82f6]" />
                  <span className="text-gray-300">S2: T6–T16 (Castle Ascent)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1.5 rounded-sm bg-[#eab308]" />
                  <span className="text-gray-300">S3: T17–T20 (2.2km Straight)</span>
                </div>
              </div>
              <span className="text-[10px] text-gray-500">CLICK TURN TO INSPECT</span>
            </div>

            {/* SVG Track Map Canvas */}
            <div className="relative w-full aspect-[4/3] max-h-[460px] bg-gradient-to-b from-black/80 to-[#0a0d14]/90 rounded-xl border border-white/5 flex items-center justify-center p-2 select-none">
              <svg viewBox="0 0 600 450" className="w-full h-full filter drop-shadow-[0_0_12px_rgba(0,0,0,0.8)]">
                <defs>
                  {/* Subtle track gradient glow */}
                  <linearGradient id="bakuTrackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>
                </defs>

                {/* Base Asphalt Border (thick dark outline) */}
                <path
                  d={`${activeCircuit.trackSvgPath.sector1} ${activeCircuit.trackSvgPath.sector2} ${activeCircuit.trackSvgPath.sector3} Z`}
                  fill="none"
                  stroke="#1c2434"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Pit Lane Path */}
                <path
                  d={activeCircuit.trackSvgPath.pitLane}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.25)"
                  strokeWidth="4"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                />

                {/* Sector 1 Vector */}
                <path
                  d={activeCircuit.trackSvgPath.sector1}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth={selectedSectorFilter === 1 || selectedSectorFilter === 0 ? "7" : "3"}
                  opacity={selectedSectorFilter === 1 || selectedSectorFilter === 0 ? 1 : 0.25}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                />

                {/* Sector 2 Vector (Castle Section) */}
                <path
                  d={activeCircuit.trackSvgPath.sector2}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={selectedSectorFilter === 2 || selectedSectorFilter === 0 ? "7" : "3"}
                  opacity={selectedSectorFilter === 2 || selectedSectorFilter === 0 ? 1 : 0.25}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                />

                {/* Sector 3 Vector (2.2km Straight) */}
                <path
                  d={activeCircuit.trackSvgPath.sector3}
                  fill="none"
                  stroke="#eab308"
                  strokeWidth={selectedSectorFilter === 3 || selectedSectorFilter === 0 ? "7" : "3"}
                  opacity={selectedSectorFilter === 3 || selectedSectorFilter === 0 ? 1 : 0.25}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                />

                {/* Start/Finish Line Indicator */}
                <line
                  x1={activeCircuit.trackSvgPath.startFinish.x1}
                  y1={activeCircuit.trackSvgPath.startFinish.y1}
                  x2={activeCircuit.trackSvgPath.startFinish.x2}
                  y2={activeCircuit.trackSvgPath.startFinish.y2}
                  stroke="#ffffff"
                  strokeWidth="4"
                  strokeDasharray="3 3"
                />
                <text x="50" y="380" fill="#ffffff" fontSize="9" fontFamily="monospace" fontWeight="bold">S/F</text>

                {/* 2.2km Straight Annotation */}
                <text x="35" y="270" fill="rgba(234,179,8,0.7)" fontSize="9" fontFamily="monospace" fontWeight="bold" transform="rotate(-90 35 270)">
                  2.2 KM HIGH-SPEED STRAIGHT (DRS)
                </text>

                {/* Castle Section Landmark Note */}
                <text x="510" y="105" fill="rgba(59,130,246,0.85)" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                  CASTLE SECTION (7.6m)
                </text>

                {/* Interactive Turn Markers */}
                {activeCircuit.turns.map((turn) => {
                  const isSelected = selectedTurn?.number === turn.number;
                  const isHovered = hoveredTurn?.number === turn.number;
                  const isInSector = selectedSectorFilter === 0 || selectedSectorFilter === turn.sector;
                  const sectorColor = turn.sector === 1 ? '#a855f7' : turn.sector === 2 ? '#3b82f6' : '#eab308';

                  return (
                    <g
                      key={turn.number}
                      className="cursor-pointer transition-transform"
                      onClick={() => setSelectedTurn(turn)}
                      onMouseEnter={() => setHoveredTurn(turn)}
                      onMouseLeave={() => setHoveredTurn(null)}
                      opacity={isInSector ? 1 : 0.3}
                    >
                      {/* Heavy braking pulse aura */}
                      {turn.isHeavyBraking && (
                        <circle
                          cx={turn.svgCoordinates.x}
                          cy={turn.svgCoordinates.y}
                          r={isSelected ? 14 : 9}
                          fill="#ef4444"
                          opacity="0.3"
                          className="animate-ping"
                          style={{ animationDuration: '2.5s' }}
                        />
                      )}

                      {/* Turn Dot */}
                      <circle
                        cx={turn.svgCoordinates.x}
                        cy={turn.svgCoordinates.y}
                        r={isSelected ? 9 : isHovered ? 7.5 : 6}
                        fill={isSelected ? '#66ff00' : sectorColor}
                        stroke="#000000"
                        strokeWidth="2"
                        className="transition-all duration-150"
                      />

                      {/* Turn Number Label */}
                      <text
                        x={turn.svgCoordinates.x + (turn.number > 10 ? -5 : -3)}
                        y={turn.svgCoordinates.y + 3}
                        fill="#000000"
                        fontSize={isSelected ? "9" : "7.5"}
                        fontWeight="900"
                        fontFamily="sans-serif"
                        pointerEvents="none"
                      >
                        {turn.number}
                      </text>
                    </g>
                  );
                })}

                {/* Moving Car Simulator Marker */}
                <g transform={`translate(${markerX}, ${markerY})`}>
                  <circle r="7" fill="#66ff00" opacity="0.35" className="animate-ping" style={{ animationDuration: '1.2s' }} />
                  <circle r="4.5" fill="#66ff00" stroke="#000000" strokeWidth="1.5" />
                </g>
              </svg>
            </div>

            {/* Bottom Legend within map */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-white/10 text-xs font-mono-tech text-gray-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] animate-pulse" />
                  <span>Heavy Braking</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#66ff00]" />
                  <span>Overtaking Zone</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
                  <span>DRS Zone</span>
                </span>
              </div>
              <span className="text-[#66ff00] font-bold">2026 AUDI REVOLUT GPS TRACKER</span>
            </div>
          </div>

          {/* Right: Turn Strategic Intelligence & Sector Analytics (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Selected Turn Deep Dive Card */}
            {currentTurnInAction && (
              <div className="bg-black/60 border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-[#66ff00] text-black font-chakra font-black text-lg flex items-center justify-center">
                      T{currentTurnInAction.number}
                    </span>
                    <div>
                      <h4 className="font-chakra font-bold text-white text-base leading-tight">
                        {currentTurnInAction.name || `Turn ${currentTurnInAction.number}`}
                      </h4>
                      <span className="text-[10px] font-mono-tech text-gray-400 uppercase">
                        Sector {currentTurnInAction.sector} • Gear {currentTurnInAction.gear} • ~{currentTurnInAction.approxSpeedKmh} km/h
                      </span>
                    </div>
                  </div>

                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold uppercase border"
                    style={{
                      borderColor: currentTurnInAction.sector === 1 ? '#a855f7' : currentTurnInAction.sector === 2 ? '#3b82f6' : '#eab308',
                      color: currentTurnInAction.sector === 1 ? '#c084fc' : currentTurnInAction.sector === 2 ? '#60a5fa' : '#fde047',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                    }}
                  >
                    {currentTurnInAction.type}
                  </span>
                </div>

                {/* Turn Attributes Badges */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {currentTurnInAction.isHeavyBraking && (
                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-mono-tech font-semibold">
                      ⚠ CRITICAL BRAKING POINT
                    </span>
                  )}
                  {currentTurnInAction.isOvertakingZone && (
                    <span className="px-2 py-0.5 rounded bg-[#66ff00]/20 text-[#66ff00] border border-[#66ff00]/40 text-[10px] font-mono-tech font-semibold">
                      ✓ PRIME OVERTAKE ZONE
                    </span>
                  )}
                  {currentTurnInAction.isDrsZone && (
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-mono-tech font-semibold">
                      DRS ZONE ACTIVE
                    </span>
                  )}
                </div>

                {/* Strategic Relevance Description */}
                <div className="bg-white/5 border border-white/5 rounded-xl p-3 mb-4 text-xs font-mono-tech text-gray-300 leading-relaxed">
                  <p className="text-gray-400 text-[10px] uppercase font-bold mb-1 text-[#66ff00]">Pit Wall Strategic Context:</p>
                  <p>{currentTurnInAction.strategicRelevance}</p>
                </div>

                {/* Quick Turn Nav Bar */}
                <div className="flex items-center justify-between text-[11px] font-mono-tech text-gray-400 pt-2 border-t border-white/10">
                  <button
                    onClick={() => {
                      const prevIdx = (currentTurnInAction.number - 2 + activeCircuit.turns.length) % activeCircuit.turns.length;
                      setSelectedTurn(activeCircuit.turns[prevIdx]);
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    ← Previous Turn
                  </button>
                  <span>{currentTurnInAction.number} / {activeCircuit.turns.length} Turns</span>
                  <button
                    onClick={() => {
                      const nextIdx = currentTurnInAction.number % activeCircuit.turns.length;
                      setSelectedTurn(activeCircuit.turns[nextIdx]);
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Next Turn →
                  </button>
                </div>
              </div>
            )}

            {/* Baku Street Circuit Strategic Breakdown Card */}
            <div className="bg-black/60 border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col gap-3">
              <h4 className="font-chakra font-bold text-white text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#66ff00]" />
                <span>Baku Strategic Footprint</span>
              </h4>

              <div className="space-y-2.5 font-mono-tech text-xs">
                <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-bold block text-[11px]">82% Safety Car Probability</span>
                    <span className="text-gray-400 text-[10px] leading-tight block">
                      Narrow street walls and high approach speeds trigger frequent SC/VSC windows. Pit-stop time loss under SC drops from 20.8s to ~14.5s.
                    </span>
                  </div>
                </div>

                <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex items-start gap-2.5">
                  <Zap className="w-4 h-4 text-[#66ff00] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-bold block text-[11px]">Low Tire Degradation (Pirelli C3/C4/C5)</span>
                    <span className="text-gray-400 text-[10px] leading-tight block">
                      Smooth tarmac produces low thermal degradation. 1-Stop (Medium → Hard) is the historically dominant strategy unless SC timing favours a 2-stop.
                    </span>
                  </div>
                </div>

                <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex items-start gap-2.5">
                  <Wind className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-bold block text-[11px]">Caspian Sea Crosswinds (24 km/h NE)</span>
                    <span className="text-gray-400 text-[10px] leading-tight block">
                      Sudden gusts down Neftchilar Avenue alter braking points by up to 12 meters into Turn 1.
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct Link to Pit Strategy Calculator */}
              <a
                href="#pit-strategy"
                className="mt-1 w-full py-2.5 px-4 bg-[#66ff00] hover:bg-[#58dc00] text-black font-chakra font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_12px_rgba(102,255,0,0.3)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Calculate Baku Pit Window</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
