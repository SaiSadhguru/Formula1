import React from 'react';
import {
  LayoutDashboard,
  Car,
  Activity,
  Sliders,
  Flag,
  Wrench,
  Settings,
  ChevronLeft,
  ChevronRight,
  Radio,
  Cpu,
} from 'lucide-react';

export type SidebarSection =
  | 'overview'
  | 'car'
  | 'telemetry'
  | 'strategies'
  | 'circuit'
  | 'pitwall'
  | 'settings';

interface SidebarProps {
  activeSection: SidebarSection;
  onSelectSection: (section: SidebarSection) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isSimRunning?: boolean;
}

interface NavItem {
  id: SidebarSection;
  label: string;
  icon: React.ElementType;
  badge?: string;
  desc?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, desc: 'Cockpit Summary' },
  { id: 'car', label: '3D Car', icon: Car, desc: 'Vehicle Inspection' },
  { id: 'telemetry', label: 'Telemetry', icon: Activity, desc: 'Live Diagnostics', badge: 'CAN' },
  { id: 'strategies', label: 'Strategies', icon: Sliders, desc: 'Setup & Component Intel', badge: 'AI' },
  { id: 'circuit', label: 'Circuit Sim', icon: Flag, desc: 'Baku City 3D' },
  { id: 'pitwall', label: 'Pit Wall', icon: Wrench, desc: 'Pit Strategy Engine' },
  { id: 'settings', label: 'Settings', icon: Settings, desc: 'Environment & Audio' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  isSimRunning = true,
}) => {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0b0d10] border-r border-[#1a1e24] transition-all duration-300 select-none ${
          isCollapsed ? 'w-[68px]' : 'w-[250px]'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header: APEX Brand & Subtitle */}
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-[#1a1e24] shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {/* APEX Badge */}
            <div className="w-8 h-8 rounded bg-gradient-to-br from-[#dc2626] to-[#991b1b] flex items-center justify-center font-chakra font-black text-xs text-white tracking-widest shrink-0 shadow-[0_0_12px_rgba(220,38,38,0.25)]">
              F1
            </div>

            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 font-chakra text-sm font-black tracking-wider text-white truncate">
                  <span>APEX</span>
                  <span className="text-gray-400 font-semibold text-xs">WORKSTATION</span>
                </div>
                <span className="font-mono-tech text-[9px] text-[#dc2626] uppercase tracking-wider truncate">
                  Engineering Cockpit
                </span>
              </div>
            )}
          </div>

          {/* Collapse Toggle Button (Desktop Only) */}
          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex p-1.5 rounded hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Live System Status Sub-banner */}
        {!isCollapsed && (
          <div className="px-3.5 py-2 bg-[#0e1115] border-b border-[#1a1e24]/60 flex items-center justify-between text-[10px] font-mono-tech text-gray-400">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isSimRunning ? 'bg-[#dc2626] animate-pulse' : 'bg-gray-600'}`} />
              <span className="text-gray-300 font-medium">{isSimRunning ? 'SIM RUNNING' : 'STANDBY'}</span>
            </div>
            <span className="text-gray-500">1000 Hz CAN</span>
          </div>
        )}

        {/* Navigation Items Stack */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            const IconComponent = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectSection(item.id);
                  onCloseMobile();
                }}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-md font-chakra text-xs font-semibold tracking-wide transition-all relative group text-left ${
                  isActive
                    ? 'bg-[#dc2626]/12 text-white font-bold border-l-2 border-[#dc2626]'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
                }`}
              >
                <IconComponent
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-[#dc2626]' : 'text-gray-400 group-hover:text-gray-200'
                  }`}
                />

                {!isCollapsed && (
                  <div className="flex items-center justify-between flex-1 min-w-0">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[9px] font-mono-tech px-1.5 py-0.2 rounded border font-semibold ${
                          isActive
                            ? 'bg-[#dc2626]/20 text-[#dc2626] border-[#dc2626]/30'
                            : 'bg-white/5 text-gray-400 border-white/10'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}

                {/* Subtle active indicator dot in collapsed mode */}
                {isCollapsed && isActive && (
                  <div className="absolute right-1 w-1 h-3 rounded-full bg-[#dc2626]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer: Telemetry & Hardware Metadata */}
        <div className="p-3 border-t border-[#1a1e24] bg-[#090b0e] shrink-0 text-[10px] font-mono-tech text-gray-500">
          {!isCollapsed ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1">
                  <Radio className="w-3 h-3 text-[#dc2626]" />
                  <span>Telemetry Link</span>
                </span>
                <span className="text-emerald-400 font-bold">ONLINE</span>
              </div>
              <div className="flex items-center justify-between text-gray-500 text-[9px]">
                <span>APEX R26 AUDI</span>
                <span>v2.4.0</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title="Telemetry Online: v2.4.0">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
