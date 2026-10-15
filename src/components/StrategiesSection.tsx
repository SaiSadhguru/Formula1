import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  ArrowRight,
  ShieldCheck,
  Compass,
  Zap,
} from 'lucide-react';
import {
  CAR_COMPONENTS,
  CarComponent,
  StrategyReport,
  getLocalEngineeringRecommendation,
} from '../utils/localRecommendations.ts';
import { requestStrategyAnalysis, AIAnalysisResponse } from '../services/aiAnalysisService.ts';
import { BAKU_CIRCUIT } from '../types/circuits.ts';

interface StrategiesSectionProps {
  speedKmh?: number;
  rpm?: number;
  ersLevel?: number;
  gear?: number;
  onHighlightComponent?: (hotspotId?: string) => void;
}

const TARGETS = [
  { id: 'race', label: 'Race Pace', desc: 'Sustained tyre life & consistency' },
  { id: 'qualifying', label: 'Qualifying Lap', desc: 'Peak 1-lap grip & minimum drag' },
  { id: 'tyre-preservation', label: 'Tyre Preservation', desc: 'Thermal mitigation for long stints' },
  { id: 'straight-line', label: 'Straight-Line Speed', desc: 'Maximum trap speed on main straights' },
  { id: 'wet', label: 'Wet Conditions', desc: 'High mechanical grip & drivability' },
  { id: 'balanced', label: 'Balanced Setup', desc: 'Predictable baseline platform' },
];

export const StrategiesSection: React.FC<StrategiesSectionProps> = ({
  speedKmh = 328,
  rpm = 11850,
  ersLevel = 84,
  gear = 7,
  onHighlightComponent,
}) => {
  const [selectedComponentId, setSelectedComponentId] = useState<string>('rear-wing');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCircuit, setSelectedCircuit] = useState<string>('baku');
  const [selectedTarget, setSelectedTarget] = useState<string>('race');

  // Active setup configuration map (user-adjustable)
  const [currentSetup, setCurrentSetup] = useState<Record<string, Record<string, any>>>(() => {
    const initial: Record<string, Record<string, any>> = {};
    CAR_COMPONENTS.forEach((comp) => {
      initial[comp.id] = {};
      comp.options.forEach((opt) => {
        initial[comp.id][opt.key] = opt.defaultValue;
      });
    });
    return initial;
  });

  // Saved baseline setup for comparison
  const [savedBaseline, setSavedBaseline] = useState<Record<string, Record<string, any>>>(() => {
    const initial: Record<string, Record<string, any>> = {};
    CAR_COMPONENTS.forEach((comp) => {
      initial[comp.id] = {};
      comp.options.forEach((opt) => {
        initial[comp.id][opt.key] = opt.defaultValue;
      });
    });
    return initial;
  });

  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // AI & Local analysis states
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AIAnalysisResponse | null>(null);

  const activeComponent = CAR_COMPONENTS.find((c) => c.id === selectedComponentId) || CAR_COMPONENTS[0];

  // Filter components
  const filteredComponents = CAR_COMPONENTS.filter((c) => {
    if (selectedCategory === 'all') return true;
    return c.category === selectedCategory;
  });

  // Calculate local report synchronously so recommendation is never empty
  const localReport: StrategyReport = getLocalEngineeringRecommendation(
    activeComponent.id,
    selectedCircuit,
    selectedTarget,
    currentSetup[activeComponent.id] || {}
  );

  const activeReport = aiAnalysisResult?.report || localReport;

  const handleOptionChange = (key: string, value: any) => {
    setCurrentSetup((prev) => ({
      ...prev,
      [activeComponent.id]: {
        ...prev[activeComponent.id],
        [key]: value,
      },
    }));
    // Clear custom AI response on setup change so local reflects live changes
    if (aiAnalysisResult) {
      setAiAnalysisResult(null);
    }
  };

  const handleResetComponent = () => {
    const defaults: Record<string, any> = {};
    activeComponent.options.forEach((opt) => {
      defaults[opt.key] = opt.defaultValue;
    });
    setCurrentSetup((prev) => ({
      ...prev,
      [activeComponent.id]: defaults,
    }));
    setAiAnalysisResult(null);
  };

  const handleSaveSetup = () => {
    setSavedBaseline(JSON.parse(JSON.stringify(currentSetup)));
    setSaveStatus('Setup baseline saved to session storage.');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleRestoreBaseline = () => {
    setCurrentSetup(JSON.parse(JSON.stringify(savedBaseline)));
    setSaveStatus('Restored configuration from saved baseline.');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleRequestAi = async () => {
    setIsAiLoading(true);
    const result = await requestStrategyAnalysis({
      component: activeComponent.id,
      circuit: selectedCircuit,
      target: selectedTarget,
      setup: currentSetup[activeComponent.id] || {},
      telemetry: { speedKmh, rpm, ersLevel, gear },
    });
    setAiAnalysisResult(result);
    setIsAiLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Engineering Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#1f242d]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-tech text-[#dc2626] mb-1 uppercase tracking-widest font-semibold">
            <Sliders className="w-3.5 h-3.5" />
            <span>APEX STRATEGY WORKSTATION // COMPONENT INTELLIGENCE</span>
          </div>
          <h2 className="font-chakra font-black text-2xl md:text-3xl text-white tracking-wide uppercase">
            Technical Setup & Decision Support
          </h2>
          <p className="text-xs font-mono-tech text-gray-400 mt-1 max-w-2xl leading-relaxed">
            Multi-variable engineering decision engine evaluating aero balance, tyre thermal wear, and circuit-specific compromises.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleRestoreBaseline}
            className="px-3 py-1.5 rounded bg-[#13161c] hover:bg-[#1a1e27] border border-[#242a35] text-gray-300 hover:text-white font-chakra text-xs font-semibold tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
            <span>Restore Baseline</span>
          </button>
          <button
            onClick={handleSaveSetup}
            className="px-3 py-1.5 rounded bg-[#181c24] hover:bg-[#202530] border border-[#2b3342] text-white font-chakra text-xs font-semibold tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Save className="w-3.5 h-3.5 text-[#dc2626]" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {saveStatus && (
        <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded text-emerald-400 font-mono-tech text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Target & Circuit Selection Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#0d1014] border border-[#1a1e24] p-3 rounded-lg">
        {/* Circuit Selector */}
        <div>
          <label className="block text-[10px] font-mono-tech text-gray-400 uppercase tracking-wider mb-1.5">
            Circuit Profile
          </label>
          <select
            value={selectedCircuit}
            onChange={(e) => setSelectedCircuit(e.target.value)}
            className="w-full bg-[#13161c] border border-[#232832] text-white font-chakra text-xs rounded px-2.5 py-1.5 focus:border-[#dc2626] focus:outline-none"
          >
            <option value="baku">Baku City Circuit (Azerbaijan) — 6.003 km</option>
            <option value="generic">Generic FIA Reference Profile</option>
          </select>
        </div>

        {/* Target Profile */}
        <div>
          <label className="block text-[10px] font-mono-tech text-gray-400 uppercase tracking-wider mb-1.5">
            Strategic Objective
          </label>
          <select
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
            className="w-full bg-[#13161c] border border-[#232832] text-white font-chakra text-xs rounded px-2.5 py-1.5 focus:border-[#dc2626] focus:outline-none"
          >
            {TARGETS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Ambient Telemetry Snippet */}
        <div>
          <label className="block text-[10px] font-mono-tech text-gray-400 uppercase tracking-wider mb-1.5">
            Track Conditions (Sim)
          </label>
          <div className="font-mono-tech text-xs text-gray-300 py-1.5">
            <span className="text-[#dc2626] font-bold">{BAKU_CIRCUIT.weatherPreset.trackTempC}°C</span> Track • {BAKU_CIRCUIT.weatherPreset.windSpeedKmh} KM/H {BAKU_CIRCUIT.weatherPreset.windDirection}
          </div>
        </div>

        {/* Telemetry Sensor Sync */}
        <div>
          <label className="block text-[10px] font-mono-tech text-gray-400 uppercase tracking-wider mb-1.5">
            Live Sensor Sync
          </label>
          <div className="font-mono-tech text-xs text-gray-300 py-1.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{speedKmh.toFixed(0)} KM/H • G{gear} • {ersLevel.toFixed(0)}% ERS</span>
          </div>
        </div>
      </div>

      {/* 3-Column Engineering Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Component List & Filter (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-[#0d1014] border border-[#1a1e24] rounded-lg p-3.5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#181d24]">
              <span className="font-chakra font-bold text-xs uppercase tracking-wider text-gray-300">
                Vehicle Systems
              </span>
              <span className="font-mono-tech text-[10px] text-gray-500">
                {filteredComponents.length} COMPONENTS
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1 mb-3">
              {[
                { id: 'all', label: 'All' },
                { id: 'aero', label: 'Aero' },
                { id: 'suspension', label: 'Susp' },
                { id: 'cooling', label: 'Cooling' },
                { id: 'tyres', label: 'Tyres' },
                { id: 'powertrain', label: 'PU' },
                { id: 'drivetrain', label: 'Diff' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-chakra font-semibold transition-colors cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-[#dc2626] text-white'
                      : 'bg-[#14181f] text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Component List Stack */}
            <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
              {filteredComponents.map((comp) => {
                const isSelected = selectedComponentId === comp.id;
                return (
                  <button
                    key={comp.id}
                    onClick={() => {
                      setSelectedComponentId(comp.id);
                      if (onHighlightComponent && comp.hotspotId) {
                        onHighlightComponent(comp.hotspotId);
                      }
                    }}
                    className={`w-full text-left p-2.5 rounded-md border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#181d26] border-[#dc2626] shadow-sm'
                        : 'bg-[#101318] border-[#181d24] hover:border-gray-700 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-chakra text-xs font-bold ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                        {comp.name}
                      </span>
                      {comp.isConceptual ? (
                        <span className="text-[9px] font-mono-tech bg-white/5 text-gray-400 px-1.5 py-0.2 rounded border border-white/5">
                          Conceptual
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono-tech bg-[#dc2626]/20 text-[#dc2626] px-1.5 py-0.2 rounded border border-[#dc2626]/30">
                          3D Mesh
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono-tech text-gray-400 line-clamp-1">
                      {comp.purpose}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center / Right Columns: Component Setup Controls & Engineering Analysis (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Active Component Parameter Editor */}
          <div className="bg-[#0d1014] border border-[#1a1e24] rounded-lg p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-[#181d24]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-chakra font-black text-lg text-white uppercase tracking-wide">
                    {activeComponent.name}
                  </h3>
                  {activeComponent.isConceptual ? (
                    <span className="text-[9px] font-mono-tech text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Conceptual Architecture Specification
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono-tech text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Physical Model Synchronized
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono-tech text-gray-400 mt-1">
                  {activeComponent.purpose}
                </p>
              </div>

              <button
                onClick={handleResetComponent}
                className="px-2.5 py-1 text-[11px] font-mono-tech text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors self-start cursor-pointer"
              >
                Reset Default
              </button>
            </div>

            {/* Parameter Adjustment Controls */}
            <div className="space-y-4">
              {activeComponent.options.map((opt) => {
                const currentValue = currentSetup[activeComponent.id]?.[opt.key] ?? opt.defaultValue;

                return (
                  <div key={opt.key} className="p-3 bg-[#11141a] border border-[#1d222b] rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-chakra font-bold text-gray-200 uppercase tracking-wide">
                        {opt.label}
                      </label>
                      <span className="font-mono-tech text-xs text-[#dc2626] font-bold bg-[#dc2626]/10 px-2 py-0.5 rounded border border-[#dc2626]/20">
                        {currentValue} {opt.unit || ''}
                      </span>
                    </div>

                    {opt.type === 'slider' && (
                      <div className="space-y-1">
                        <input
                          type="range"
                          min={opt.min}
                          max={opt.max}
                          step={opt.step || 1}
                          value={currentValue}
                          onChange={(e) => handleOptionChange(opt.key, parseFloat(e.target.value))}
                          className="w-full accent-[#dc2626] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] font-mono-tech text-gray-500">
                          <span>{opt.min}{opt.unit}</span>
                          <span>{opt.max}{opt.unit}</span>
                        </div>
                      </div>
                    )}

                    {opt.type === 'segmented' && opt.choices && (
                      <div className="flex flex-wrap gap-1.5">
                        {opt.choices.map((choice) => (
                          <button
                            key={String(choice.value)}
                            onClick={() => handleOptionChange(opt.key, choice.value)}
                            className={`px-3 py-1.5 rounded text-xs font-chakra font-semibold transition-all cursor-pointer ${
                              currentValue === choice.value
                                ? 'bg-[#dc2626] text-white shadow-sm'
                                : 'bg-[#181d24] text-gray-300 hover:bg-[#202630]'
                            }`}
                          >
                            {choice.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Setup Comparison: Baseline vs Proposed */}
          <div className="bg-[#0d1014] border border-[#1a1e24] rounded-lg p-4">
            <h4 className="font-chakra font-bold text-xs uppercase tracking-wider text-gray-300 mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#dc2626]" />
              <span>Current vs Baseline Configuration Comparison</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono-tech">
              {activeComponent.options.map((opt) => {
                const currentVal = currentSetup[activeComponent.id]?.[opt.key] ?? opt.defaultValue;
                const baseVal = savedBaseline[activeComponent.id]?.[opt.key] ?? opt.defaultValue;
                const hasDelta = currentVal !== baseVal;

                return (
                  <div key={opt.key} className="p-2 bg-[#12151b] border border-[#1d222b] rounded">
                    <div className="text-[10px] text-gray-500 uppercase truncate mb-1">{opt.label}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">{baseVal}</span>
                      <ArrowRight className="w-3 h-3 text-gray-600" />
                      <span className={hasDelta ? 'text-[#dc2626] font-bold' : 'text-gray-300'}>
                        {currentVal}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Engineering Analysis & Recommendation Card */}
          <div className="bg-[#0d1014] border border-[#1a1e24] rounded-lg p-5 relative overflow-hidden">
            {/* Top Bar with AI Trigger */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-[#181d24]">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-chakra font-bold text-sm uppercase tracking-wider text-white">
                    Engineering Decision Support
                  </h4>
                  {aiAnalysisResult?.source === 'ai-server' ? (
                    <span className="text-[9px] font-mono-tech px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Cloud AI Model ({aiAnalysisResult.provider})
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono-tech px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Deterministic Local Rule Engine
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-mono-tech text-gray-400 mt-0.5">
                  Calibrated for {selectedCircuit.toUpperCase()} • Objective: {selectedTarget.toUpperCase()}
                </p>
              </div>

              {/* AI Analysis Button */}
              <button
                onClick={handleRequestAi}
                disabled={isAiLoading}
                className="px-3.5 py-1.5 rounded bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:from-[#ef4444] hover:to-[#dc2626] text-white font-chakra font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(220,38,38,0.3)] disabled:opacity-60"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
                <span>{isAiLoading ? 'Analyzing...' : 'Generate AI Analysis'}</span>
              </button>
            </div>

            {/* Structured Report Content */}
            <div className="space-y-4 font-mono-tech text-xs">
              {/* Primary Recommendation */}
              <div className="p-3 bg-[#12151b] border-l-2 border-[#dc2626] rounded-r">
                <div className="text-[10px] text-[#dc2626] font-bold uppercase mb-1">
                  Primary Recommendation
                </div>
                <p className="text-gray-100 font-semibold leading-relaxed">
                  {activeReport.recommendation}
                </p>
              </div>

              {/* Grid: Benefit vs Compromise */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-[#111612] border border-emerald-900/40 rounded">
                  <div className="text-[10px] text-emerald-400 font-bold uppercase mb-1">
                    Primary Performance Gain
                  </div>
                  <p className="text-gray-300 text-[11px] leading-relaxed">
                    {activeReport.mainBenefit}
                  </p>
                </div>

                <div className="p-3 bg-[#181212] border border-red-900/40 rounded">
                  <div className="text-[10px] text-red-400 font-bold uppercase mb-1">
                    Key Trade-Off / Compromise
                  </div>
                  <p className="text-gray-300 text-[11px] leading-relaxed">
                    {activeReport.mainCompromise}
                  </p>
                </div>
              </div>

              {/* Circuit Specific Rationale */}
              <div className="p-3 bg-[#11141a] border border-[#1d222b] rounded">
                <div className="text-[10px] text-gray-400 font-bold uppercase mb-1 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#dc2626]" />
                  <span>Circuit Context & Aerodynamic Rationale</span>
                </div>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  {activeReport.circuitRationale}
                </p>
              </div>

              {/* Tyre Thermal Implications */}
              <div className="p-3 bg-[#11141a] border border-[#1d222b] rounded">
                <div className="text-[10px] text-gray-400 font-bold uppercase mb-1 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tyre Degradation & Stint Implications</span>
                </div>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  {activeReport.tyreImplication}
                </p>
              </div>

              {/* Trackside Validation Note */}
              <div className="flex items-start gap-2 p-2.5 bg-black/40 border border-white/5 rounded text-[10px] text-gray-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-300">Trackside Validation Check: </strong>
                  {activeReport.validationNotes}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
