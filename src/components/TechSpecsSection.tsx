import React, { useState } from 'react';
import {
  Zap,
  Gauge,
  Wind,
  Shield,
  Activity,
  Layers,
  Thermometer,
  Cpu,
  Flame,
  ArrowUpRight,
} from 'lucide-react';
import { BakuRaceIntelligenceCard } from './BakuRaceIntelligenceCard.tsx';


interface TechSpecsSectionProps {
  speedKmh: number;
  rpm: number;
  throttle: number;
  brake: number;
  isDrsOpen: boolean;
  ersLevel: number;
}

export const TechSpecsSection: React.FC<TechSpecsSectionProps> = ({
  speedKmh,
  rpm,
  throttle,
  brake,
  isDrsOpen,
  ersLevel,
}) => {
  const [selectedSystem, setSelectedSystem] = useState<'aero' | 'powertrain' | 'chassis' | 'tires'>('aero');

  // Simulated 4-corner tire telemetry
  const tires = [
    { corner: 'FL', label: 'Front Left', temp: 102.4, press: 23.4, wear: 88, compound: 'P-ZERO C4 SOFT' },
    { corner: 'FR', label: 'Front Right', temp: 104.1, press: 23.6, wear: 85, compound: 'P-ZERO C4 SOFT' },
    { corner: 'RL', label: 'Rear Left', temp: 101.8, press: 21.8, wear: 90, compound: 'P-ZERO C4 SOFT' },
    { corner: 'RR', label: 'Rear Right', temp: 103.5, press: 22.0, wear: 87, compound: 'P-ZERO C4 SOFT' },
  ];

  return (
    <div className="bg-[#07080a] text-gray-200 border-t border-white/10">
      {/* Section 1: Live Telemetry & Pit Wall Diagnostics (Simulated Demo Data) */}
      <section id="telemetry-section" className="py-16 px-4 md:px-8 max-w-7xl mx-auto scroll-mt-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-tech text-[#66ff00] mb-2 uppercase tracking-widest">
              <Activity className="w-4 h-4" />
              <span>APEX PIT WALL TELEMETRY SUITE</span>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded border border-amber-500/30 font-semibold">
                SIMULATED DEMO DATA
              </span>
            </div>
            <h2 className="font-chakra font-black text-3xl md:text-4xl text-white tracking-wide uppercase">
              Dynamic Race Telemetry <span className="text-gray-500 text-2xl font-normal">(Simulated)</span>
            </h2>
          </div>
          <p className="text-xs font-mono-tech text-gray-400 max-w-md">
            Simulated demonstration telemetry stream emulating 1,000 Hz CAN-bus sensor feedback for race engineering diagnostics.
          </p>
        </div>

        {/* Diagnostic Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: 4-Corner Pirelli Tire Matrix */}
          <div className="bg-black/60 border border-white/10 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="font-chakra font-bold text-sm text-white flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-rose-500" />
                <span>Pirelli C4 Matrix (Sim)</span>
              </span>
              <span className="text-[10px] font-mono-tech bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded border border-rose-500/30">
                OPTIMAL
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              {tires.map((t) => (
                <div
                  key={t.corner}
                  className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col justify-between"
                >
                  <div className="flex justify-between items-center text-[10px] font-mono-tech text-gray-400">
                    <span className="font-bold text-[#66ff00]">{t.corner}</span>
                    <span>{t.wear}% LIFE</span>
                  </div>
                  <div className="my-1">
                    <span className="font-chakra font-black text-xl text-white">
                      {t.temp.toFixed(1)}°
                    </span>
                    <span className="text-[10px] text-gray-400 ml-0.5">C</span>
                  </div>
                  <div className="text-[10px] font-mono-tech text-gray-400">
                    {t.press} PSI
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[10px] font-mono-tech text-gray-500 text-right">
              * DEMO TEMPERATURES
            </div>
          </div>

          {/* Card 2: Aerodynamics & Downforce Balance */}
          <div className="bg-black/60 border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-chakra font-bold text-sm text-white flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-cyan-400" />
                  <span>Aero Load & Balance (Sim)</span>
                </span>
                <span className="text-[10px] font-mono-tech bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30">
                  {isDrsOpen ? 'DRS SHED -38%' : 'HIGH DOWNFORCE'}
                </span>
              </div>

              <div className="space-y-3 font-mono-tech text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                    <span>FRONT AERO LOAD</span>
                    <span className="text-white font-bold">42.4% (820 kg)</span>
                  </div>
                  <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                    <div className="h-full bg-cyan-400" style={{ width: '42.4%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                    <span>REAR DIFFUSER & WING</span>
                    <span className="text-white font-bold">57.6% (1,110 kg)</span>
                  </div>
                  <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                    <div className="h-full bg-[#66ff00]" style={{ width: '57.6%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs font-mono-tech">
              <span className="text-gray-400">NET DOWNFORCE (SIM):</span>
              <span className="text-white font-bold text-sm">
                {isDrsOpen ? '1,420 KG' : '1,930 KG'}
              </span>
            </div>
          </div>

          {/* Card 3: Hybrid ERS & Battery Storage */}
          <div className="bg-black/60 border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-chakra font-bold text-sm text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[#66ff00]" />
                  <span>MGU-K Energy (Sim)</span>
                </span>
                <span className="text-[10px] font-mono-tech bg-[#66ff00]/20 text-[#66ff00] px-2 py-0.5 rounded border border-[#66ff00]/30">
                  4.0 MJ HARVEST
                </span>
              </div>

              <div className="space-y-3 font-mono-tech text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                    <span>STATE OF CHARGE (SOC)</span>
                    <span className="text-[#66ff00] font-bold">{Math.round(ersLevel)}%</span>
                  </div>
                  <div className="h-3 bg-gray-900 rounded-full overflow-hidden border border-gray-800 p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-[#66ff00] rounded-full transition-all duration-300"
                      style={{ width: `${ersLevel}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="text-gray-400 block text-[10px]">DEPLOY / LAP</span>
                    <span className="text-white font-bold">3.85 / 4.0 MJ</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="text-gray-400 block text-[10px]">MGU-K OUTPUT</span>
                    <span className="text-white font-bold">120 kW (160 hp)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-between items-center text-xs font-mono-tech">
              <span className="text-gray-400">BOOST MODE:</span>
              <span className="text-[#66ff00] font-bold">OVERTAKE READY</span>
            </div>
          </div>

          {/* Card 4: G-Force Lateral & Longitudinal Friction Circle */}
          <div className="bg-black/60 border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-chakra font-bold text-sm text-white flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span>G-Force Circle (Sim)</span>
                </span>
                <span className="text-[10px] font-mono-tech bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded border border-purple-500/30">
                  PEAK: 5.2G
                </span>
              </div>

              {/* G-Circle Radar representation */}
              <div className="relative w-28 h-28 mx-auto my-1 rounded-full border border-white/20 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border border-dashed border-white/10" />
                <div className="w-10 h-10 rounded-full border border-dashed border-white/10" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-px bg-white/10" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-full w-px bg-white/10" />
                </div>
                {/* Dynamic dot moving with throttle/brake/speed */}
                <div
                  className="w-3.5 h-3.5 rounded-full bg-[#66ff00] border-2 border-black shadow-[0_0_8px_#66ff00] absolute transition-all duration-150"
                  style={{
                    transform: `translate(${((speedKmh % 100) / 100 - 0.5) * 40}px, ${(brake > 0 ? 25 : -(throttle / 100) * 22)}px)`,
                  }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[11px] font-mono-tech">
              <span className="text-gray-400">LAT: <strong className="text-white">+4.2G</strong></span>
              <span className="text-gray-400">BRAKE: <strong className="text-white">-5.1G</strong></span>
              <span className="text-gray-400">ACCEL: <strong className="text-white">+1.8G</strong></span>
            </div>
          </div>
        </div>

        {/* Feature Card: BAKU RACE INTELLIGENCE */}
        <div className="mt-6">
          <BakuRaceIntelligenceCard />
        </div>
      </section>

      {/* Section 3: Technical Architecture & Systems Deep Dive */}
      <section id="powertrain-section" className="py-16 px-4 md:px-8 max-w-7xl mx-auto border-t border-white/10 scroll-mt-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="text-xs font-mono-tech text-[#66ff00] mb-2 uppercase tracking-widest flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              <span>FORMULA 1 TECHNICAL REGULATIONS & DESIGN TARGETS</span>
              <span className="bg-amber-500/20 text-amber-300 text-[9px] px-1.5 py-0.5 rounded border border-amber-500/30">
                SIMULATED ESTIMATES
              </span>
            </div>
            <h2 className="font-chakra font-black text-3xl md:text-4xl text-white tracking-wide uppercase">
              Chassis & Powertrain Architecture
            </h2>
          </div>

          {/* System Filter Pills */}
          <div className="flex flex-wrap gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            {(['aero', 'powertrain', 'chassis', 'tires'] as const).map((sys) => (
              <button
                key={sys}
                onClick={() => setSelectedSystem(sys)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-chakra font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedSystem === sys
                    ? 'bg-[#66ff00] text-black shadow-[0_0_12px_rgba(102,255,0,0.3)]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {sys}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Detail Content based on selected tab */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Showcase Spec */}
          <div className="lg:col-span-2 bg-black/60 border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="px-2.5 py-1 rounded bg-[#66ff00]/10 border border-[#66ff00]/30 text-[#66ff00] text-xs font-mono-tech font-bold uppercase">
                  {selectedSystem.toUpperCase()} SPECIFICATION (CONCEPTUAL MODEL)
                </span>
                <span className="text-xs font-mono-tech text-gray-500">
                  FIA 2026 REGULATION FRAMEWORK ESTIMATES
                </span>
              </div>

              {selectedSystem === 'aero' && (
                <div>
                  <h3 className="font-chakra font-black text-2xl text-white mb-3">
                    3D Sculpted Ground Effect Venturi Tunnels & Vortex Control
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed mb-6">
                    The APEX R26 aerodynamic concept relies on twin underbody Venturi floor tunnels that create low-pressure suction beneath the car. High-downwash sidepod cuts and vertical floor strakes seal the perimeter under simulated CFD wind tunnel conditions.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono-tech text-xs">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-gray-500 block text-[10px]">ESTIMATED DOWNFORCE</span>
                      <span className="font-bold text-white text-base">~2,150 kg (Simulated)</span>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-gray-500 block text-[10px]">DRAG COEFFICIENT (CD)</span>
                      <span className="font-bold text-white text-base">0.72 - 1.15 (Target)</span>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-gray-500 block text-[10px]">AERO RAKE ANGLE</span>
                      <span className="font-bold text-white text-base">1.4° Nose-Down (Est.)</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedSystem === 'powertrain' && (
                <div>
                  <h3 className="font-chakra font-black text-2xl text-white mb-3">
                    1.6L 90° V6 Turbocharged Internal Combustion Engine + Hybrid PU
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed mb-6">
                    Conceptual 2026 power unit architecture targeting 50%+ thermal efficiency with 100% sustainable fuels. Features a single turbocharger, high-voltage battery architecture, and 350kW MGU-K electric motor deployment.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono-tech text-xs">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-gray-500 block text-[10px]">ESTIMATED OUTPUT</span>
                      <span className="font-bold text-[#66ff00] text-base">~1,000+ BHP (Target)</span>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-gray-500 block text-[10px]">MAX ENGINE RPM</span>
                      <span className="font-bold text-white text-base">15,000 RPM (FIA Rule)</span>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-gray-500 block text-[10px]">FUEL ENERGY LIMIT</span>
                      <span className="font-bold text-white text-base">3,000 MJ/h (Target)</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedSystem === 'chassis' && (
                <div>
                  <h3 className="font-chakra font-black text-2xl text-white mb-3">
                    Carbon Fiber Monocoque Survival Cell with Integrated Titanium Halo
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed mb-6">
                    Fabricated from ultra-high modulus carbon fiber pre-preg layers with aluminum honeycomb core. Structural crash structures meet FIA standard static load requirements under regulatory testing.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono-tech text-xs">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-gray-500 block text-[10px]">MINIMUM DRY WEIGHT</span>
                      <span className="font-bold text-white text-base">~798 kg (Reg Min)</span>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-gray-500 block text-[10px]">HALO TEST LOAD</span>
                      <span className="font-bold text-white text-base">125 kN (Standard)</span>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-gray-500 block text-[10px]">ESTIMATED WHEELBASE</span>
                      <span className="font-bold text-white text-base">~3,400 - 3,600 mm</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedSystem === 'tires' && (
                <div>
                  <h3 className="font-chakra font-black text-2xl text-white mb-3">
                    18-Inch Low-Profile Pirelli P-Zero Slicks on BBS Forged Rims
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed mb-6">
                    Low-profile 720mm overall diameter racing slick tires on standard BBS magnesium alloy rims with aerodynamic wheel cover discs to suppress turbulent rim wake.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono-tech text-xs">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-gray-500 block text-[10px]">FRONT TIRE WIDTH</span>
                      <span className="font-bold text-white text-base">305 mm (Standard)</span>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-gray-500 block text-[10px]">REAR TIRE WIDTH</span>
                      <span className="font-bold text-white text-base">405 mm (Standard)</span>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-gray-500 block text-[10px]">RIM SPECIFICATION</span>
                      <span className="font-bold text-white text-base">18" Forged BBS</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono-tech text-gray-400">
              <span>ESTIMATED CAD GEOMETRY • FIA 2026 CONCEPT</span>
              <span className="text-amber-400">DEMO VALUES • NOT OFFICIAL FIA DATA</span>
            </div>
          </div>

          {/* Quick Specs Benchmark Panel */}
          <div id="specs-section" className="bg-black/60 border border-white/10 rounded-2xl p-6 flex flex-col justify-between scroll-mt-20">
            <div>
              <h4 className="font-chakra font-bold text-lg text-white mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#66ff00]" />
                <span>Simulated Benchmarks</span>
              </h4>

              <div className="space-y-4 font-mono-tech text-xs">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-400">0 - 100 KM/H (ESTIMATED)</span>
                  <span className="text-white font-bold">~2.4 SECONDS</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-400">0 - 200 KM/H (ESTIMATED)</span>
                  <span className="text-white font-bold">~4.2 SECONDS</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-400">0 - 300 KM/H (ESTIMATED)</span>
                  <span className="text-white font-bold">~8.4 SECONDS</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-400">100 - 0 BRAKING (ESTIMATED)</span>
                  <span className="text-white font-bold">~15.0 METERS</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-400">PEAK CORNERING FORCE</span>
                  <span className="text-[#66ff00] font-bold">~5.2 - 5.8 G</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-400">TOP SPEED (DRS SIM)</span>
                  <span className="text-white font-bold">~355 - 362 KM/H</span>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-[#66ff00]/10 border border-[#66ff00]/30 rounded-xl p-4 text-center">
              <span className="text-xs font-chakra font-bold text-[#66ff00] uppercase block">
                AUDI FORMULA 1 WORKS CONCEPT
              </span>
              <p className="text-[11px] text-gray-400 font-mono-tech mt-1">
                Simulated design model representing the Sauber-Audi 2026 regulations transition.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 md:px-8 border-t border-white/10 text-xs font-mono-tech text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-chakra font-black text-white text-base">APEX</span>
            <span>MOTORSPORT TELEMETRY & 3D SIMULATION SUITE</span>
          </div>
          <div>
            <span>PROPRIETARY AUDI REVOLUT R26 3D ENGINE • RENDERED VIA THREE.JS</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
