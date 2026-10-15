import React, { useState, useEffect, useRef } from 'react';
import { Radio, Thermometer, Wind, Gauge, Menu, X } from 'lucide-react';

import { BAKU_CIRCUIT, type CircuitData } from '../types/circuits.ts';

interface NavbarProps {
  activeCircuit?: CircuitData;
}

export const NAV_ITEMS = [
  { id: 'viewport-hero', label: '3D Viewport', detail: 'Interactive' },
  { id: 'circuit-panel', label: 'Circuit Intel', detail: '20 Turns' },
  { id: 'telemetry-section', label: 'Telemetry', detail: 'CAN-Bus Sim' },
  { id: 'pit-strategy', label: 'Pit Strategy', detail: '1-Stop vs 2-Stop' },
  { id: 'powertrain-section', label: 'Power Unit', detail: 'Hybrid PU' },
  { id: 'specs-section', label: 'Specifications', detail: 'FIA 2026 Regs' },
];

export const Navbar: React.FC<NavbarProps> = ({ activeCircuit = BAKU_CIRCUIT }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('viewport-hero');

  // Ref to track programmatic smooth scroll in progress to prevent intermediate highlighting
  const isNavigatingRef = useRef<string | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // 1. Initial Hash & History Management
  useEffect(() => {
    // Disable automatic browser scroll restoration to prevent landing at arbitrary positions
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const rawHash = window.location.hash.replace('#', '');
    const validItem = NAV_ITEMS.find((item) => item.id === rawHash);

    if (validItem) {
      setActiveSection(validItem.id);
      requestAnimationFrame(() => {
        const target = document.getElementById(validItem.id);
        if (target) {
          target.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
      });
    } else {
      setActiveSection('viewport-hero');
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, []);

  // 2. Scroll Spy: Keep active link and URL hash in sync with visible section
  useEffect(() => {
    const handleScroll = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const headerOffset = 100; // accounts for navbar height + top padding

        // If programmatic scroll is targeting a section, check if we arrived
        if (isNavigatingRef.current) {
          const targetEl = document.getElementById(isNavigatingRef.current);
          if (targetEl) {
            const rect = targetEl.getBoundingClientRect();
            if (isNavigatingRef.current === 'viewport-hero' && scrollY < 60) {
              isNavigatingRef.current = null;
            } else if (Math.abs(rect.top - headerOffset) < 40) {
              isNavigatingRef.current = null;
            }
          }
          return;
        }

        let newActive = 'viewport-hero';

        // Top of page
        if (scrollY < 120) {
          newActive = 'viewport-hero';
        }
        // Reached bottom of page
        else if (scrollY + windowHeight >= documentHeight - 50) {
          newActive = NAV_ITEMS[NAV_ITEMS.length - 1].id;
        }
        // Section detection by position relative to header focal line
        else {
          for (const item of NAV_ITEMS) {
            const el = document.getElementById(item.id);
            if (!el) continue;
            const rect = el.getBoundingClientRect();
            // Section has reached or passed the header offset line
            if (rect.top <= headerOffset + 40 && rect.bottom > headerOffset) {
              newActive = item.id;
              break;
            } else if (rect.top <= headerOffset + 40) {
              newActive = item.id;
            }
          }
        }

        setActiveSection((prev) => {
          if (prev !== newActive) {
            // Keep URL hash in agreement with visible section
            window.history.replaceState(null, '', `#${newActive}`);
            return newActive;
          }
          return prev;
        });
      });
    };

    // User manual interrupt: mouse wheel or touch clears programmatic lock
    const handleUserInterrupt = () => {
      isNavigatingRef.current = null;
    };

    // scrollend event supported in modern browsers
    const handleScrollEnd = () => {
      isNavigatingRef.current = null;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('wheel', handleUserInterrupt, { passive: true });
    window.addEventListener('touchstart', handleUserInterrupt, { passive: true });
    window.addEventListener('scrollend', handleScrollEnd, { passive: true });

    return () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleUserInterrupt);
      window.removeEventListener('touchstart', handleUserInterrupt);
      window.removeEventListener('scrollend', handleScrollEnd);
    };
  }, []);

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    isNavigatingRef.current = id;
    setActiveSection(id);
    window.history.pushState(null, '', `#${id}`);

    if (id === 'viewport-hero') {
      const hero = document.getElementById('viewport-hero');
      if (hero) hero.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    } else {
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    handleScrollTo(e, 'viewport-hero');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#07080a]/95 backdrop-blur-md border-b border-white/10 px-3 sm:px-4 md:px-6 py-2.5 w-full max-w-full box-border">
      <div className="w-full mx-auto flex items-center justify-between gap-2 sm:gap-4 min-w-0">
        {/* Brand Logo & Model */}
        <div className="flex items-center gap-2.5 shrink-0 min-w-0">
          <a
            href="#viewport-hero"
            onClick={handleLogoClick}
            className="flex items-center gap-1.5 font-chakra text-lg md:text-xl font-black tracking-wider text-white hover:opacity-90 transition-opacity"
            title="APEX Formula 1 — Return to top"
          >
            <span className="bg-[#66ff00] text-black px-2 py-0.5 rounded font-black text-sm md:text-base">APEX</span>
            <span className="text-gray-100">FORMULA 1</span>
          </a>
          <span className="hidden 2xl:inline-block h-4 w-px bg-white/20" />
          <span className="hidden 2xl:inline-block font-mono-tech text-[10px] md:text-[11px] text-gray-400 uppercase tracking-wider truncate">
            R26 AUDI REVOLUT F1
          </span>
        </div>

        {/* Live Track Conditions Telemetry (Visible only on extra-wide screens ≥ 1536px 2xl to avoid laptop clipping) */}
        <div className="hidden 2xl:flex items-center gap-2.5 text-xs font-mono-tech text-gray-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full shrink-0">
          <span className="bg-amber-500/20 text-amber-300 text-[9px] px-1.5 py-0.5 rounded border border-amber-500/30 font-semibold tracking-wider">
            SIMULATED DEMO
          </span>
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#66ff00]" />
            <span className="text-gray-200 font-semibold uppercase">{activeCircuit.name}</span>
          </div>
          <span className="text-gray-600">•</span>
          <div className="flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            <span>TRACK: <strong className="text-white">{activeCircuit.weatherPreset.trackTempC}°C</strong></span>
          </div>
          <span className="text-gray-600">•</span>
          <div className="flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-cyan-400" />
            <span>WIND: <strong className="text-white">{activeCircuit.weatherPreset.windSpeedKmh} KM/H {activeCircuit.weatherPreset.windDirection}</strong></span>
          </div>
        </div>

        {/* Navigation Anchors + Live Data CTA + Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          {/* Navigation Links — displayed at desktop (≥ 1024px lg) with active section feedback */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2.5 2xl:gap-3.5 text-[11px] xl:text-xs font-chakra font-bold uppercase tracking-wider text-gray-300">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => handleScrollTo(e, item.id)}
                  className={`relative transition-all whitespace-nowrap px-1.5 py-1 xl:px-2.5 rounded hover:text-[#66ff00] ${
                    isActive
                      ? 'text-[#66ff00] font-black bg-[#66ff00]/10 shadow-[inset_0_-2px_0_#66ff00]'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Quick CTA button */}
          <a
            href="#telemetry-section"
            onClick={(e) => handleScrollTo(e, 'telemetry-section')}
            className="hidden sm:flex px-3 py-1.5 rounded-lg bg-[#66ff00] hover:bg-[#58dc00] text-black font-chakra font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(102,255,0,0.3)] items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Live Data</span>
          </a>

          {/* Mobile, Tablet Hamburger Toggle (active on all viewports < 1024px lg) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
            className="lg:hidden p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-[#66ff00]" /> : <Menu className="w-5 h-5" />}
            <span className="hidden sm:inline font-chakra text-[11px] font-bold text-gray-300 uppercase tracking-wider">
              Menu
            </span>
          </button>
        </div>
      </div>

      {/* Responsive Drawer Menu (Accessible for viewports < 1024px) */}
      {mobileMenuOpen && (
        <div
          role="navigation"
          aria-label="Mobile and Tablet navigation"
          className="lg:hidden mt-3 pt-3 border-t border-white/10 flex flex-col gap-2 font-chakra text-xs font-bold uppercase tracking-wider w-full animate-in fade-in duration-200"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleScrollTo(e, item.id)}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center justify-between border ${
                  isActive
                    ? 'bg-[#66ff00]/15 text-[#66ff00] border-[#66ff00]/40 font-black'
                    : 'bg-white/5 hover:bg-white/10 text-gray-200 hover:text-[#66ff00] border-transparent'
                }`}
              >
                <span>{item.label}</span>
                <span className={`text-[10px] font-mono-tech ${isActive ? 'text-[#66ff00]' : 'text-gray-500'}`}>
                  {item.detail}
                </span>
              </a>
            );
          })}
          <a
            href="#telemetry-section"
            onClick={(e) => handleScrollTo(e, 'telemetry-section')}
            className="sm:hidden px-3 py-2.5 rounded-lg bg-[#66ff00] text-black font-black text-center flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(102,255,0,0.3)] mt-1"
          >
            <Gauge className="w-4 h-4" />
            <span>Open Live Telemetry</span>
          </a>
        </div>
      )}
    </header>
  );
};
