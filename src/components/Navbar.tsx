import React from 'react';
import { Shield, Radio, Thermometer, Wind, Gauge, ExternalLink } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 bg-[#07080a]/90 backdrop-blur-md border-b border-white/10 px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-chakra text-xl font-black tracking-wider text-white">
            <span className="bg-[#66ff00] text-black px-2 py-0.5 rounded font-black">APEX</span>
            <span className="text-gray-100">FORMULA 1</span>
          </div>
          <span className="hidden sm:inline-block h-4 w-px bg-white/20" />
          <span className="hidden sm:inline-block font-mono-tech text-[11px] text-gray-400 uppercase tracking-wider">
            R26 AUDI REVOLUT F1
          </span>
        </div>

        {/* Live Track Conditions Telemetry (Simulated Demo Data) */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono-tech text-gray-400 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full">
          <span className="bg-amber-500/20 text-amber-300 text-[9px] px-1.5 py-0.5 rounded border border-amber-500/30 font-semibold tracking-wider">
            SIMULATED DEMO
          </span>
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#66ff00]" />
            <span className="text-gray-200 font-semibold">CIRCUIT DE BARCELONA</span>
          </div>
          <span className="text-gray-600">•</span>
          <div className="flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            <span>TRACK: <strong className="text-white">34.2°C</strong></span>
          </div>
          <span className="text-gray-600">•</span>
          <div className="flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-cyan-400" />
            <span>WIND: <strong className="text-white">14 KM/H NW</strong></span>
          </div>
          <span className="text-gray-600">•</span>
          <div>
            <span>GRIP: <strong className="text-[#66ff00]">HIGH (100%)</strong></span>
          </div>
        </div>

        {/* Quick Nav Anchors */}
        <div className="flex items-center gap-3">
          <nav className="hidden md:flex items-center gap-4 text-xs font-chakra font-bold uppercase tracking-wider text-gray-300">
            <a href="#viewport-hero" className="hover:text-[#66ff00] transition-colors">
              3D Viewport
            </a>
            <a href="#telemetry-section" className="hover:text-[#66ff00] transition-colors">
              Telemetry
            </a>
            <a href="#strategy-section" className="hover:text-[#66ff00] transition-colors">
              Pit Strategy
            </a>
            <a href="#powertrain-section" className="hover:text-[#66ff00] transition-colors">
              Power Unit
            </a>
            <a href="#specs-section" className="hover:text-[#66ff00] transition-colors">
              Specifications
            </a>
          </nav>

          <a
            href="#telemetry-section"
            className="px-3.5 py-1.5 rounded-lg bg-[#66ff00] hover:bg-[#58dc00] text-black font-chakra font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(102,255,0,0.3)] flex items-center gap-1.5 cursor-pointer"
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Live Data</span>
          </a>
        </div>
      </div>
    </header>
  );
};
