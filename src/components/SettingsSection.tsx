import React from 'react';
import { Settings, Volume2, Shield, Eye, Palette, CheckCircle2 } from 'lucide-react';
import { LIVERIES } from './F1Canvas.tsx';

interface SettingsSectionProps {
  currentLivery: string;
  onSelectLivery: (liveryId: string) => void;
  isWireframe: boolean;
  onToggleWireframe: () => void;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  currentLivery,
  onSelectLivery,
  isWireframe,
  onToggleWireframe,
}) => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="pb-4 border-b border-[#1f242d]">
        <div className="flex items-center gap-2 text-xs font-mono-tech text-[#dc2626] mb-1 uppercase tracking-widest font-semibold">
          <Settings className="w-3.5 h-3.5" />
          <span>WORKSTATION PREFERENCES // CONFIGURATION</span>
        </div>
        <h2 className="font-chakra font-black text-2xl md:text-3xl text-white tracking-wide uppercase">
          Cockpit Settings & Environment
        </h2>
        <p className="text-xs font-mono-tech text-gray-400 mt-1">
          Graphics rendering, livery schemes, audio preferences, and simulation telemetry configurations.
        </p>
      </div>

      {/* Livery Preset Selection */}
      <div className="p-5 bg-[#0d1014] border border-[#1a1e24] rounded-lg space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#181d24]">
          <Palette className="w-4 h-4 text-[#dc2626]" />
          <h3 className="font-chakra font-bold text-sm text-white uppercase tracking-wider">
            Race Livery Specification
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {LIVERIES.map((liv) => {
            const isSelected = currentLivery === liv.id;
            return (
              <button
                key={liv.id}
                onClick={() => onSelectLivery(liv.id)}
                className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#181d26] border-[#dc2626]'
                    : 'bg-[#11141a] border-[#1d222b] hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-chakra font-bold text-xs text-white">
                    {liv.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/40"
                      style={{ backgroundColor: liv.primaryColor }}
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/40"
                      style={{ backgroundColor: liv.secondaryColor }}
                    />
                  </div>
                </div>
                <p className="text-[10px] font-mono-tech text-gray-400">
                  {liv.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3D Rendering Diagnostics */}
      <div className="p-5 bg-[#0d1014] border border-[#1a1e24] rounded-lg space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#181d24]">
          <Eye className="w-4 h-4 text-[#dc2626]" />
          <h3 className="font-chakra font-bold text-sm text-white uppercase tracking-wider">
            3D Viewport Diagnostics
          </h3>
        </div>

        <div className="flex items-center justify-between p-3 bg-[#11141a] border border-[#1d222b] rounded">
          <div>
            <div className="font-chakra font-bold text-xs text-white">
              Wireframe CAD Inspection Mode
            </div>
            <div className="text-[10px] font-mono-tech text-gray-400 mt-0.5">
              Renders aerodynamic surface polygon mesh topology
            </div>
          </div>
          <button
            onClick={onToggleWireframe}
            className={`px-3 py-1.5 rounded text-xs font-chakra font-bold uppercase transition-colors cursor-pointer ${
              isWireframe
                ? 'bg-[#dc2626] text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/15'
            }`}
          >
            {isWireframe ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>
      </div>

      {/* Telemetry Architecture info */}
      <div className="p-4 bg-black/40 border border-white/5 rounded-lg text-xs font-mono-tech text-gray-400 space-y-1">
        <div className="text-gray-300 font-bold mb-1">Architecture Provenance:</div>
        <div>• Simulation Engine: Pure TypeScript deterministic mathematical models</div>
        <div>• Graphics Pipeline: Three.js WebGL2 ACES Filmic PBR pipeline</div>
        <div>• CAN-Bus Rate: 1000 Hz virtual sensor telemetry</div>
      </div>
    </div>
  );
};
