import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { F1Canvas, CameraPreset, Hotspot } from './components/F1Canvas.tsx';
import { TelemetryHUD } from './components/TelemetryHUD.tsx';
import { BottomControlDock } from './components/BottomControlDock.tsx';
import { TechSpecsSection } from './components/TechSpecsSection.tsx';

export default function App() {
  const [currentLivery, setCurrentLivery] = useState<string>('audi-green');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('hero');
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [isDrsOpen, setIsDrsOpen] = useState<boolean>(false);
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const [isDriving, setIsDriving] = useState<boolean>(true);

  // Dynamic Telemetry State
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
      // Natural racing speed oscillations down the straight
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

      setThrottle((prev) => {
        return Math.min(100, Math.max(92, Math.round(96 + (Math.random() - 0.5) * 4)));
      });

      setErsLevel((prev) => {
        // Battery slowly oscillates around 80-90%
        if (prev < 40) return 85;
        return Math.max(25, prev - 0.04);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isDriving, isDrsOpen]);

  const toggleDrs = () => {
    setIsDrsOpen((prev) => !prev);
  };

  const toggleDriving = () => {
    setIsDriving((prev) => !prev);
  };

  const toggleWireframe = () => {
    setIsWireframe((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-white flex flex-col selection:bg-[#66ff00] selection:text-black">
      {/* Top Navigation */}
      <Navbar />

      {/* Hero Section: 3D Car Viewport & Live Telemetry HUD */}
      <main id="viewport-hero" className="relative w-full h-[88vh] min-h-[600px] overflow-hidden carbon-grid-bg">
        {/* Three.js 3D F1 Canvas */}
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

        {/* Real-time Telemetry Dashboard Overlay */}
        <TelemetryHUD
          speedKmh={speedKmh}
          gear={gear}
          rpm={rpm}
          throttle={throttle}
          brake={brake}
          isDrsOpen={isDrsOpen}
          ersLevel={ersLevel}
          isDriving={isDriving}
          onToggleDriving={toggleDriving}
          onToggleDrs={toggleDrs}
        />

        {/* Unified Bottom Control Dock (Camera presets, liveries, DRS, hotspots) */}
        <BottomControlDock
          cameraPreset={cameraPreset}
          onSelectCameraPreset={setCameraPreset}
          currentLivery={currentLivery}
          onSelectLivery={setCurrentLivery}
          activeHotspot={activeHotspot}
          onSelectHotspot={setActiveHotspot}
          isWireframe={isWireframe}
          onToggleWireframe={toggleWireframe}
          isDrsOpen={isDrsOpen}
          onToggleDrs={toggleDrs}
        />
      </main>

      {/* Technical Specifications, Powertrain, and Telemetry Deep Dive */}
      <TechSpecsSection
        speedKmh={speedKmh}
        rpm={rpm}
        throttle={throttle}
        brake={brake}
        isDrsOpen={isDrsOpen}
        ersLevel={ersLevel}
      />
    </div>
  );
}
