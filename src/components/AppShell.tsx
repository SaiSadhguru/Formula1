import React, { useState } from 'react';
import { Sidebar, SidebarSection } from './Sidebar.tsx';
import { Menu } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  activeSection: SidebarSection;
  onSelectSection: (section: SidebarSection) => void;
  isSimRunning?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  activeSection,
  onSelectSection,
  isSimRunning = true,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#08090b] text-[#e2e4e9] flex">
      {/* Fixed Full-Height Left Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={onSelectSection}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        isSimRunning={isSimRunning}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 min-w-0 ${
          isCollapsed ? 'lg:pl-[68px]' : 'lg:pl-[250px]'
        }`}
      >
        {/* Mobile Header Bar (ONLY visible on mobile < 1024px to toggle drawer, NO conventional top navbar on desktop) */}
        <div className="lg:hidden h-14 bg-[#0b0d10] border-b border-[#1a1e24] px-4 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setIsMobileOpen(true)}
            aria-label="Open engineering sidebar"
            className="p-2 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#dc2626] flex items-center justify-center font-chakra font-black text-[10px] text-white">
              F1
            </div>
            <span className="font-chakra font-black text-sm text-white uppercase tracking-wider">
              APEX WORKSTATION
            </span>
          </div>

          <div className="text-[10px] font-mono-tech text-[#dc2626] font-bold uppercase">
            LIVE
          </div>
        </div>

        {/* Workstation Main Viewport Shell */}
        <main className="flex-1 w-full min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
