import React, { useState } from 'react';
import {
  Camera,
  Palette,
  Eye,
  Sliders,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Boxes,
  Wind,
  Info,
  CheckCircle2,
} from 'lucide-react';
import {
  CameraPreset,
  LIVERIES,
  HOTSPOTS,
  Hotspot,
} from './F1Canvas.tsx';

interface BottomControlDockProps {
  cameraPreset: CameraPreset;
  onSelectCameraPreset: (preset: CameraPreset) => void;
  currentLivery: string;
  onSelectLivery: (liveryId: string) => void;
  activeHotspot: Hotspot | null;
  onSelectHotspot: (hotspot: Hotspot | null) => void;
  isWireframe: boolean;
  onToggleWireframe: () => void;
  isDrsOpen: boolean;
  onToggleDrs: () => void;
}

export const BottomControlDock: React.FC<BottomControlDockProps> = ({
  cameraPreset,
  onSelectCameraPreset,
  currentLivery,
  onSelectLivery,
  activeHotspot,
  onSelectHotspot,
  isWireframe,
  onToggleWireframe,
  isDrsOpen,
  onToggleDrs,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'camera' | 'livery' | 'inspect' | 'aero'>('camera');

  const cameraPresets: { id: CameraPreset; label: string; icon: string }[] = [
    { id: 'hero', label: 'Hero 3/4', icon: '🏎️' },
    { id: 'cockpit', label: 'Cockpit POV', icon: '🎯' },
    { id: 'side', label: 'Side Profile', icon: '📐' },
    { id: 'top', label: 'Aero Top', icon: '🌪️' },
    { id: 'rear', label: 'Diffuser', icon: '⚡' },
  ];

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94vw] max-w-4xl transition-transform duration-300">
      {/* Collapse / Expand Tab Toggle */}
      <div className="flex justify-center mb-1">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="pointer-events-auto bg-black/85 hover:bg-black/95 text-gray-300 hover:text-white px-4 py-1 rounded-t-lg border-t border-x border-white/10 text-xs font-mono-tech flex items-center gap-1.5 shadow-xl transition-colors cursor-pointer"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-[#66ff00]" />
              <span>SHOW CONTROLS & LIVERIES</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              <span>COLLAPSE HUD (ZEN VIEW)</span>
            </>
          )}
        </button>
      </div>

      {/* Main Dock Container */}
      {!isCollapsed && (
        <div className="pointer-events-auto bg-black/90 backdrop-blur-xl border border-white/15 rounded-2xl p-3 md:p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          {/* Top Row: Navigation Tabs & Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
            {/* Category Tabs */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setActiveTab('camera')}
                className={`px-3 py-1.5 rounded-lg text-xs font-chakra font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'camera'
                    ? 'bg-[#66ff00] text-black shadow-[0_0_10px_rgba(102,255,0,0.4)]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Camera Views</span>
              </button>

              <button
                onClick={() => setActiveTab('livery')}
                className={`px-3 py-1.5 rounded-lg text-xs font-chakra font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'livery'
                    ? 'bg-[#66ff00] text-black shadow-[0_0_10px_rgba(102,255,0,0.4)]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Liveries</span>
              </button>

              <button
                onClick={() => setActiveTab('inspect')}
                className={`px-3 py-1.5 rounded-lg text-xs font-chakra font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'inspect'
                    ? 'bg-[#66ff00] text-black shadow-[0_0_10px_rgba(102,255,0,0.4)]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>Aero Hotspots</span>
              </button>
            </div>

            {/* Quick Action Badges */}
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleDrs}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono-tech border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isDrsOpen
                    ? 'bg-[#66ff00]/20 text-[#66ff00] border-[#66ff00]/50'
                    : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                }`}
              >
                <Wind className="w-3 h-3" />
                <span>DRS: {isDrsOpen ? 'ACTIVE' : 'OFF'}</span>
              </button>

              <button
                onClick={onToggleWireframe}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono-tech border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isWireframe
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/50'
                    : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                }`}
              >
                <Boxes className="w-3 h-3" />
                <span>CFD Mesh</span>
              </button>

              <button
                onClick={() => {
                  onSelectHotspot(null);
                  onSelectCameraPreset('hero');
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-mono-tech bg-white/5 text-gray-400 border border-white/10 hover:text-white hover:bg-white/10 transition-all cursor-pointer flex items-center gap-1.5"
                title="Reset Camera Framing"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>

          {/* Bottom Panel Content based on Active Tab */}
          <div className="pt-3">
            {/* Tab 1: Camera Angle Presets */}
            {activeTab === 'camera' && (
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
                {cameraPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      onSelectHotspot(null);
                      onSelectCameraPreset(preset.id);
                    }}
                    className={`flex-1 min-w-[110px] px-3 py-2 rounded-xl text-left border transition-all cursor-pointer ${
                      cameraPreset === preset.id && !activeHotspot
                        ? 'bg-white/15 border-[#66ff00] text-white shadow-[0_0_12px_rgba(102,255,0,0.2)]'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="text-base mb-0.5">{preset.icon}</div>
                    <div className="font-chakra font-bold text-xs">{preset.label}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Tab 2: Livery Configurator */}
            {activeTab === 'livery' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {LIVERIES.map((livery) => (
                  <button
                    key={livery.id}
                    onClick={() => onSelectLivery(livery.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      currentLivery === livery.id
                        ? 'bg-white/15 border-[#66ff00] shadow-[0_0_12px_rgba(102,255,0,0.2)]'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex -space-x-1">
                      <div
                        className="w-5 h-5 rounded-full border border-black/40 shadow-sm"
                        style={{ backgroundColor: livery.primaryColor }}
                      />
                      <div
                        className="w-5 h-5 rounded-full border border-black/40 shadow-sm"
                        style={{ backgroundColor: livery.secondaryColor }}
                      />
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-chakra font-bold text-xs text-white truncate">
                        {livery.name}
                      </div>
                      <div className="text-[10px] font-mono-tech text-gray-400 truncate">
                        {livery.id === currentLivery ? 'APPLIED TO 3D CAR' : 'APPLY LIVERY'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Tab 3: Aero & Mechanical Hotspots */}
            {activeTab === 'inspect' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {HOTSPOTS.map((hotspot) => (
                    <button
                      key={hotspot.id}
                      onClick={() => onSelectHotspot(hotspot)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-chakra font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeHotspot?.id === hotspot.id
                          ? 'bg-[#66ff00] text-black border-[#66ff00] shadow-[0_0_12px_rgba(102,255,0,0.4)]'
                          : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>{hotspot.name}</span>
                    </button>
                  ))}
                  {activeHotspot && (
                    <button
                      onClick={() => onSelectHotspot(null)}
                      className="px-2.5 py-1.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-mono-tech whitespace-nowrap cursor-pointer hover:bg-red-500/30"
                    >
                      Close Detail
                    </button>
                  )}
                </div>

                {/* Hotspot detail card when active */}
                {activeHotspot && (
                  <div className="bg-black/60 border border-[#66ff00]/30 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-chakra font-bold text-sm text-white flex items-center gap-2">
                        <span className="text-[#66ff00] font-black">[{activeHotspot.name.toUpperCase()}]</span>
                        <span>{activeHotspot.title}</span>
                      </div>
                      <p className="text-gray-400 mt-1 max-w-xl text-[11px] leading-relaxed">
                        {activeHotspot.description}
                      </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg font-mono-tech text-[#66ff00] whitespace-nowrap text-[11px]">
                      {activeHotspot.spec}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
