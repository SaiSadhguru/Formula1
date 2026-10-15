import React, { useState, useEffect } from 'react';
import { AppShell } from './components/AppShell.tsx';
import { SidebarSection } from './components/Sidebar.tsx';
import { OverviewSection } from './components/OverviewSection.tsx';
import { StrategiesSection } from './components/StrategiesSection.tsx';
import { SettingsSection } from './components/SettingsSection.tsx';
import { F1Canvas, CameraPreset, Hotspot, HOTSPOTS } from './components/F1Canvas.tsx';
import { TelemetryHUD } from './components/TelemetryHUD.tsx';
import { BottomControlDock } from './components/BottomControlDock.tsx';
import { TechSpecsSection } from './components/TechSpecsSection.tsx';
import { WebGLErrorBoundary } from './components/WebGLErrorBoundary.tsx';
import { AudioPlayer } from './components/AudioPlayer.tsx';
import { CircuitPanel } from './components/CircuitPanel.tsx';
import { PitStrategyPanel } from './components/PitStrategyPanel.tsx';
import { BAKU_CIRCUIT } from './types/circuits.ts';

export default function App() {
  const [activeSection, setActiveSection] = useState<SidebarSection>('car');

  // Car 3D Viewer & Simulation State
  const [currentLivery, setCurrentLivery] = useState<string>('audi-green');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('hero');
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [isDrsOpen, setIsDrsOpen] = useState<boolean>(false);
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const [isDriving, setIsDriving] = useState<boolean>(true);

  // Dynamic Telemetry State (CAN-bus simulation)
  const [speedKmh, setSpeedKmh] = useState<number>(328);
  const [gear, setGear] = useState<number>(7);
  const [rpm, setRpm] = useState<number>(11850);
  const [throttle, setThrottle] = useState<number>(98);
  const [brake, setBrake] = useState<number>(0);
  const [ersLevel, setErsLevel] = useState<number>(84);

  // Dynamic telemetry simulation loop
  useEffect(() => {
    if (!isDriving) {
      setSpeedKmh(0);
      setGear(0);
      setRpm(4800);
      setThrottle(0);
      setBrake(0);
      return;
    }

    const interval = setInterval(() => {
      setSpeedKmh((prev) => {
        const target = isDrsOpen ? 342 : 326;
        const jitter = (Math.random() - 0.48) * 1.5;
        const next = prev + (target - prev) * 0.12 + jitter;
        return Math.max(305, Math.min(355, next));
      });

      setRpm((prev) => {
        const baseRpm = isDrsOpen ? 12400 : 11800;
        const jitter = (Math.random() - 0.5) * 80;
        return Math.round(baseRpm + jitter);
      });

      setThrottle(() => {
        return Math.min(100, Math.max(92, Math.round(96 + (Math.random() - 0.5) * 4)));
      });

      setErsLevel((prev) => {
        if (prev < 40) return 85;
        return Math.max(25, prev - 0.04);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isDriving, isDrsOpen]);

  // URL Hash Sync for Workstation Section Navigation
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '') as SidebarSection;
      const validSections: SidebarSection[] = [
        'overview',
        'car',
        'telemetry',
        'strategies',
        'circuit',
        'pitwall',
        'settings',
      ];
      if (validSections.includes(hash)) {
        setActiveSection(hash);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleSelectSection = (section: SidebarSection) => {
    setActiveSection(section);
    window.history.pushState(null, '', `#${section}`);
  };

  const handleHighlightComponent = (hotspotId?: string) => {
    if (!hotspotId) {
      setActiveHotspot(null);
      return;
    }
    const found = HOTSPOTS.find((h) => h.id === hotspotId);
    if (found) {
      setActiveHotspot(found);
      setActiveSection('car');
    }
  };

  return (
    <AppShell
      activeSection={activeSection}
      onSelectSection={handleSelectSection}
      isSimRunning={isDriving}
    >
      {/* SECTION 1: OVERVIEW COCKPIT */}
      {activeSection === 'overview' && (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-in fade-in duration-200">
          <OverviewSection
            speedKmh={speedKmh}
            rpm={rpm}
            gear={gear}
            throttle={throttle}
            brake={brake}
            ersLevel={ersLevel}
            isDrsOpen={isDrsOpen}
            onNavigate={handleSelectSection}
          />
        </div>
      )}

      {/* SECTION 2: 3D CAR CENTERPIECE VIEWPORT */}
      {activeSection === 'car' && (
        <div className="relative w-full h-[calc(100vh-3.5rem)] lg:h-screen min-h-[640px] overflow-hidden carbon-grid-bg animate-in fade-in duration-200">
          <WebGLErrorBoundary>
            <F1Canvas
              currentLivery={currentLivery}
              isDrsOpen={isDrsOpen}
              isDriving={isDriving}
              speedKmh={speedKmh}
              cameraPreset={cameraPreset}
              activeHotspot={activeHotspot}
              onHotspotSelect={setActiveHotspot}
              isWireframe={isWireframe}
            />
          </WebGLErrorBoundary>

          <TelemetryHUD
            speedKmh={speedKmh}
            gear={gear}
            rpm={rpm}
            throttle={throttle}
            brake={brake}
            isDrsOpen={isDrsOpen}
            ersLevel={ersLevel}
            isDriving={isDriving}
            onToggleDriving={() => setIsDriving(!isDriving)}
            onToggleDrs={() => setIsDrsOpen(!isDrsOpen)}
          />

          <BottomControlDock
            cameraPreset={cameraPreset}
            onSelectCameraPreset={setCameraPreset}
            currentLivery={currentLivery}
            onSelectLivery={setCurrentLivery}
            activeHotspot={activeHotspot}
            onSelectHotspot={setActiveHotspot}
            isWireframe={isWireframe}
            onToggleWireframe={() => setIsWireframe(!isWireframe)}
            isDrsOpen={isDrsOpen}
            onToggleDrs={() => setIsDrsOpen(!isDrsOpen)}
          />
        </div>
      )}

      {/* SECTION 3: FULL TELEMETRY DIAGNOSTICS */}
      {activeSection === 'telemetry' && (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-in fade-in duration-200">
          <TechSpecsSection
            speedKmh={speedKmh}
            rpm={rpm}
            throttle={throttle}
            brake={brake}
            isDrsOpen={isDrsOpen}
            ersLevel={ersLevel}
          />
        </div>
      )}

      {/* SECTION 4: COMPONENT STRATEGIES & AI ANALYSIS */}
      {activeSection === 'strategies' && (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-in fade-in duration-200">
          <StrategiesSection
            speedKmh={speedKmh}
            rpm={rpm}
            ersLevel={ersLevel}
            gear={gear}
            onHighlightComponent={handleHighlightComponent}
          />
        </div>
      )}

      {/* SECTION 5: CIRCUIT SIMULATOR & INTERACTIVE MAP */}
      {activeSection === 'circuit' && (
        <div className="animate-in fade-in duration-200">
          <CircuitPanel activeCircuit={BAKU_CIRCUIT} />
        </div>
      )}

      {/* SECTION 6: PIT WALL STRATEGY ANALYSER */}
      {activeSection === 'pitwall' && (
        <div className="animate-in fade-in duration-200">
          <PitStrategyPanel />
        </div>
      )}

      {/* SECTION 7: SETTINGS & CONFIGURATION */}
      {activeSection === 'settings' && (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-in fade-in duration-200">
          <SettingsSection
            currentLivery={currentLivery}
            onSelectLivery={setCurrentLivery}
            isWireframe={isWireframe}
            onToggleWireframe={() => setIsWireframe(!isWireframe)}
          />
        </div>
      )}

      {/* Floating Ambient Music Player (Preserved in bottom right) */}
      <aside
        aria-label="APEX Ambient Music Player"
        className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-40 pointer-events-auto"
      >
        <AudioPlayer />
      </aside>
    </AppShell>
  );
}
