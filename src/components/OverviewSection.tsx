import React from 'react';
import {
  Activity,
  Gauge,
  Zap,
  Wind,
  Shield,
  Layers,
  Thermometer,
  Flag,
  ArrowRight,
  Radio,
  Sliders,
} from 'lucide-react';
import { BAKU_CIRCUIT } from '../types/circuits.ts';
import { SidebarSection } from './Sidebar.tsx';

interface OverviewSectionProps {
  speedKmh: number;
  rpm: number;
  gear: number;
  throttle: number;
  brake: number;
  ersLevel: number;
  isDrsOpen: boolean;
  onNavigate: (section: SidebarSection) => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  speedKmh,
  rpm,
  gear,
  throttle,
  brake,
  ersLevel,
  isDrsOpen,
  onNavigate,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="pb-4 border-b border-[#1f242d] flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-tech text-[#dc2626] mb-1 uppercase tracking-widest font-semibold">
            <Radio className="w-3.5 h-3.5" />
            <span>APEX F1 // RACE ENGINEERING COCKPIT</span>
          </div>
          <h2 className="font-chakra font-black text-2xl md:text-3xl text-white tracking-wide uppercase">
            Workstation Overview
          </h2>
          <p className="text-xs font-mono-tech text-gray-400 mt-1 max-w-2xl">
            Central command telemetry, active session state, and technical diagnostics for Baku Grand Prix.
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigate('car')}
            className="px-3 py-1.5 rounded bg-[#13161c] hover:bg-[#1a1e27] border border-[#242a35] text-gray-300 hover:text-white font-chakra text-xs font-semibold tracking-wider transition-colors cursor-pointer"
          >
            Inspect 3D Car →
          </button>
          <button
            onClick={() => onNavigate('strategies')}
            className="px-3 py-1.5 rounded bg-[#dc2626] hover:bg-[#b91c1c] text-white font-chakra text-xs font-bold tracking-wider transition-colors cursor-pointer shadow-sm"
          >
            Component Strategies →
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Speed */}
        <div className="p-3.5 bg-[#0d1014] border border-[#1a1e24] rounded-lg">
          <div className="text-[10px] font-mono-tech text-gray-500 uppercase">GPS Speed</div>
          <div className="font-chakra font-black text-2xl text-white mt-1">
            {speedKmh.toFixed(0)} <span className="text-xs font-normal text-gray-400">KM/H</span>
          </div>
          <div className="text-[10px] font-mono-tech text-emerald-400 mt-1">Nominal V-Max</div>
        </div>

        {/* Gear */}
        <div className="p-3.5 bg-[#0d1014] border border-[#1a1e24] rounded-lg">
          <div className="text-[10px] font-mono-tech text-gray-500 uppercase">Current Gear</div>
          <div className="font-chakra font-black text-2xl text-[#dc2626] mt-1">
            G{gear || 'N'}
          </div>
          <div className="text-[10px] font-mono-tech text-gray-400 mt-1">Seamless Shift</div>
        </div>

        {/* RPM */}
        <div className="p-3.5 bg-[#0d1014] border border-[#1a1e24] rounded-lg">
          <div className="text-[10px] font-mono-tech text-gray-500 uppercase">Engine Revs</div>
          <div className="font-chakra font-black text-2xl text-white mt-1">
            {rpm.toLocaleString()}
          </div>
          <div className="text-[10px] font-mono-tech text-amber-400 mt-1">15,000 Cap</div>
        </div>

        {/* Throttle */}
        <div className="p-3.5 bg-[#0d1014] border border-[#1a1e24] rounded-lg">
          <div className="text-[10px] font-mono-tech text-gray-500 uppercase">Throttle</div>
          <div className="font-chakra font-black text-2xl text-emerald-400 mt-1">
            {throttle}%
          </div>
          <div className="text-[10px] font-mono-tech text-gray-400 mt-1">Drive-by-Wire</div>
        </div>

        {/* ERS */}
        <div className="p-3.5 bg-[#0d1014] border border-[#1a1e24] rounded-lg">
          <div className="text-[10px] font-mono-tech text-gray-500 uppercase">ERS State</div>
          <div className="font-chakra font-black text-2xl text-cyan-400 mt-1">
            {ersLevel.toFixed(0)}%
          </div>
          <div className="text-[10px] font-mono-tech text-cyan-500/80 mt-1">350 kW MGU-K</div>
        </div>

        {/* DRS */}
        <div className="p-3.5 bg-[#0d1014] border border-[#1a1e24] rounded-lg">
          <div className="text-[10px] font-mono-tech text-gray-500 uppercase">DRS Status</div>
          <div className={`font-chakra font-black text-2xl mt-1 ${isDrsOpen ? 'text-emerald-400' : 'text-gray-500'}`}>
            {isDrsOpen ? 'OPEN' : 'ARMED'}
          </div>
          <div className="text-[10px] font-mono-tech text-gray-400 mt-1">2 Zones (Baku)</div>
        </div>
      </div>

      {/* Middle Row: Circuit Profile + Strategy Quick Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Baku Circuit Overview (7 cols) */}
        <div className="lg:col-span-7 bg-[#0d1014] border border-[#1a1e24] rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#181d24]">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-[#dc2626]" />
              <span className="font-chakra font-bold text-sm uppercase tracking-wide text-white">
                Selected Circuit Profile // {BAKU_CIRCUIT.name}
              </span>
            </div>
            <span className="text-[10px] font-mono-tech text-gray-500">
              ROUND 17 • AZERBAIJAN
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 font-mono-tech text-xs">
            <div className="p-2.5 bg-[#12151b] border border-[#1d222b] rounded">
              <div className="text-[10px] text-gray-500">TRACK LENGTH</div>
              <div className="text-white font-bold mt-0.5">{BAKU_CIRCUIT.lengthKm} KM</div>
            </div>
            <div className="p-2.5 bg-[#12151b] border border-[#1d222b] rounded">
              <div className="text-[10px] text-gray-500">RACE DISTANCE</div>
              <div className="text-white font-bold mt-0.5">{BAKU_CIRCUIT.totalLaps} LAPS</div>
            </div>
            <div className="p-2.5 bg-[#12151b] border border-[#1d222b] rounded">
              <div className="text-[10px] text-gray-500">CORNER COUNT</div>
              <div className="text-white font-bold mt-0.5">{BAKU_CIRCUIT.cornersCount} TURNS</div>
            </div>
            <div className="p-2.5 bg-[#12151b] border border-[#1d222b] rounded">
              <div className="text-[10px] text-gray-500">SAFETY CAR PROB</div>
              <div className="text-[#dc2626] font-bold mt-0.5">&gt;75% HISTORICAL</div>
            </div>
          </div>

          <p className="text-xs font-mono-tech text-gray-300 leading-relaxed">
            High aerodynamic compromise circuit: features the longest full-throttle straight on the calendar (2.2 km Neftchilar Avenue) alongside the tightest section in F1 (7.6m width Castle turns 8–11).
          </p>
        </div>

        {/* Workstation Navigation Hub (5 cols) */}
        <div className="lg:col-span-5 bg-[#0d1014] border border-[#1a1e24] rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#181d24]">
            <span className="font-chakra font-bold text-sm uppercase tracking-wide text-white">
              Workstation Navigation
            </span>
            <span className="text-[10px] font-mono-tech text-gray-500">6 MODULES</span>
          </div>

          <div className="space-y-2 font-chakra text-xs">
            {[
              { id: 'car', label: '3D Car Studio Inspection', desc: 'Inspect aerodynamic parts & liveries' },
              { id: 'strategies', label: 'Component Setup & AI Decision Support', desc: 'Aero balance, cooling, tyre strategies' },
              { id: 'circuit', label: 'Baku Interactive 3D Simulator', desc: 'Playable keyboard driving physics' },
              { id: 'pitwall', label: 'Pit Wall Strategy Analyser', desc: 'Deterministic 1-Stop vs 2-Stop models' },
              { id: 'telemetry', label: 'Full Diagnostic Sensor Suite', desc: 'CAN-bus data & tyre temperature matrix' },
            ].map((dest) => (
              <button
                key={dest.id}
                onClick={() => onNavigate(dest.id as SidebarSection)}
                className="w-full flex items-center justify-between p-2.5 rounded bg-[#12151b] hover:bg-[#181d26] border border-[#1d222b] hover:border-[#dc2626]/40 transition-colors text-left cursor-pointer group"
              >
                <div>
                  <div className="font-bold text-white group-hover:text-[#dc2626] transition-colors">
                    {dest.label}
                  </div>
                  <div className="text-[10px] font-mono-tech text-gray-500">
                    {dest.desc}
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
