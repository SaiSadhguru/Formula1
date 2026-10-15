import React, { useState, useEffect } from 'react';
import {
  Flag,
  Timer,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Info,
  Zap,
  CloudRain,
  Shield,
  Fuel,
  Users,
  Flame,
  Gauge,
  Sparkles,
} from 'lucide-react';
import { useRaceState } from '../hooks/useRaceState.ts';
import {
  formatTime,
  formatLapTime,
  TIRE_PROFILES,
  COMPOUND_LABELS,
  type TireCompound,
  type StrategyOption,
  type FeasibilityResult,
} from '../utils/pitStrategyCalc.ts';
import {
  fetchRaceSessions,
  fetchDriverRaceStrategy,
  getDemoSession,
  getDemoDriverStints,
  type RaceSessionInfo,
  type DriverStintData,
} from '../services/openF1Service.ts';

// ---------------------------------------------------------------------------
// Gemini AI Commentary
// ---------------------------------------------------------------------------

function getGeminiApiKey(): string | undefined {
  const meta = import.meta as unknown as { env?: Record<string, string | undefined> };
  return meta.env?.VITE_GEMINI_API_KEY || meta.env?.GEMINI_API_KEY;
}

async function fetchAICommentary(
  explanation: string,
  recommended: string,
  delta: number,
  primaryAction: string,
): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return '';

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an F1 pit-wall race engineer AI assistant. Based on the following deterministic strategy calculation results, provide a concise (3-4 sentence) expert commentary explaining the recommendation to the driver and team. Be direct, professional, and clear.

Recommended strategy: ${recommended}
Primary Action: ${primaryAction}
Time advantage: ${Math.abs(delta).toFixed(1)}s
Calculation summary: ${explanation}

IMPORTANT: Do not fabricate any lap times, telemetry data, or specific numbers beyond what is given. Stick to explaining the strategic reasoning. Label your response as AI-generated analysis.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || '';
  } catch (err) {
    console.warn('[Gemini] Commentary generation failed:', err);
    return '';
  }
}

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

function CompoundBadge({ compound }: { compound: TireCompound }) {
  const profile = TIRE_PROFILES[compound] ?? TIRE_PROFILES.MEDIUM;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-chakra font-bold text-xs uppercase"
      style={{
        backgroundColor: profile.color + '22',
        color: profile.color,
        border: `1px solid ${profile.color}55`,
      }}
    >
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: profile.color }} />
      {compound}
    </span>
  );
}

function StrategyCard({
  strategy,
  isRecommended,
  label,
  feasibility,
}: {
  strategy: StrategyOption;
  isRecommended: boolean;
  label: string;
  feasibility?: FeasibilityResult;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col gap-3 transition-all ${
        isRecommended
          ? 'border-[#66ff00] bg-[#66ff00]/5 shadow-[0_0_20px_rgba(102,255,0,0.12)]'
          : 'border-white/10 bg-black/40'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isRecommended ? (
            <CheckCircle className="w-4 h-4 text-[#66ff00]" />
          ) : (
            <Info className="w-4 h-4 text-gray-500" />
          )}
          <span
            className={`font-chakra font-black text-sm uppercase tracking-wider ${
              isRecommended ? 'text-[#66ff00]' : 'text-gray-400'
            }`}
          >
            {label}
          </span>
          {isRecommended && (
            <span className="text-[10px] font-mono-tech bg-[#66ff00] text-black px-1.5 py-0.5 rounded font-bold">
              RECOMMENDED
            </span>
          )}
        </div>
        <span className="font-chakra font-bold text-white text-sm">
          {strategy.valid ? formatTime(strategy.totalRaceTimeSeconds) : 'N/A'}
        </span>
      </div>

      {/* Invalid state */}
      {!strategy.valid && (
        <div className="flex items-center gap-2 text-amber-400 text-xs font-mono-tech">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{strategy.invalidReason}</span>
        </div>
      )}

      {/* Warnings & Blockers */}
      {feasibility && (
        <div className="space-y-1">
          {feasibility.blockers.map((b, i) => (
            <div
              key={`b-${i}`}
              className="flex items-center gap-1.5 text-red-400 text-[11px] font-mono-tech bg-red-500/10 border border-red-500/20 px-2 py-1 rounded"
            >
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>{b}</span>
            </div>
          ))}
          {feasibility.warnings.map((w, i) => (
            <div
              key={`w-${i}`}
              className="flex items-center gap-1.5 text-amber-400 text-[11px] font-mono-tech bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded"
            >
              <Info className="w-3 h-3 shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stint bars */}
      {strategy.valid && strategy.stints.length > 0 && (
        <div className="space-y-1.5">
          {strategy.stints.map((stint) => {
            const pct = Math.round(
              ((stint.endLap - stint.startLap + 1) /
                Math.max(
                  1,
                  strategy.stints.reduce((a, s) => a + (s.endLap - s.startLap + 1), 0),
                )) *
                100,
            );
            const profile =
              TIRE_PROFILES[stint.compound as TireCompound] ?? TIRE_PROFILES.MEDIUM;
            return (
              <div key={stint.stintNumber} className="flex items-center gap-2 text-xs">
                <CompoundBadge compound={stint.compound as TireCompound} />
                <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: profile.color }}
                  />
                </div>
                <span className="font-mono-tech text-gray-400 min-w-[60px] text-right">
                  L{stint.startLap} - {stint.endLap}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Key stats */}
      {strategy.valid && (
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-tech">
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-gray-500 text-[9px] uppercase">
              Pit Stop{strategy.stops > 1 ? 's' : ''}
            </div>
            <div className="text-white font-bold">
              {strategy.stops} &times; {(strategy.totalPitLossSeconds / strategy.stops).toFixed(1)}s loss
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-gray-500 text-[9px] uppercase">Pit On Lap</div>
            <div className={`font-bold ${isRecommended ? 'text-[#66ff00]' : 'text-white'}`}>
              Lap {strategy.recommendedPitLap}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-gray-500 text-[9px] uppercase">Window Open</div>
            <div className="text-white font-bold">
              L{strategy.pitWindowOpenLap} - {strategy.pitWindowCloseLap}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-gray-500 text-[9px] uppercase">Tactic</div>
            <div className="text-white font-bold flex items-center gap-1">
              {strategy.isUndercut ? (
                <>
                  <TrendingDown className="w-3 h-3 text-amber-400" /> Undercut
                </>
              ) : (
                <>
                  <TrendingUp className="w-3 h-3 text-blue-400" /> Overcut
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NumberInput({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-mono-tech text-gray-400 uppercase tracking-wider">
        {label}
      </label>
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5">
        <button
          onClick={() => onChange(Math.max(min, Number((value - step).toFixed(2))))}
          aria-label="Decrease"
          className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-white transition-colors font-bold text-base select-none"
        >
          -
        </button>
        <span className="flex-1 text-center font-chakra font-bold text-white text-sm">
          {value}
          {unit}
        </span>
        <button
          onClick={() => onChange(Math.min(max, Number((value + step).toFixed(2))))}
          aria-label="Increase"
          className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-white transition-colors font-bold text-base select-none"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Historical Data Panel
// ---------------------------------------------------------------------------

function HistoricalDataPanel() {
  const [sessions, setSessions] = useState<RaceSessionInfo[]>([]);
  const [selectedSession, setSelectedSession] = useState<RaceSessionInfo | null>(null);
  const [driverStints, setDriverStints] = useState<DriverStintData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'openf1' | 'demo'>('demo');

  useEffect(() => {
    setSelectedSession(getDemoSession());
    setDriverStints(getDemoDriverStints());
    setDataSource('demo');
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRaceSessions(2024);
      if (data.length > 0) {
        setSessions(data);
      } else {
        setError('No sessions available from OpenF1. Showing demo data.');
      }
    } catch {
      setError('OpenF1 fetch failed. Showing demo data.');
    } finally {
      setLoading(false);
    }
  };

  const loadSession = async (session: RaceSessionInfo) => {
    setLoading(true);
    setError(null);
    try {
      const drivers = [44, 1, 16, 4, 63];
      const results = await Promise.all(
        drivers.map((n) => fetchDriverRaceStrategy(session.sessionKey, n)),
      );
      const valid = results.filter((r) => r.stints.length > 0);
      if (valid.length > 0) {
        setDriverStints(valid);
        setSelectedSession(session);
        setDataSource(valid[0].source);
      } else {
        setDriverStints(getDemoDriverStints());
        setDataSource('demo');
        setError('No driver data for this session. Showing demo data.');
      }
    } catch {
      setDriverStints(getDemoDriverStints());
      setDataSource('demo');
      setError('Session fetch failed. Showing demo data.');
    } finally {
      setLoading(false);
    }
  };

  const COMPOUND_COLORS: Record<string, string> = {
    SOFT: '#e10600',
    MEDIUM: '#ffd700',
    HARD: '#f0f0f0',
    INTER: '#00cc44',
    WET: '#0066cc',
  };

  return (
    <div className="space-y-4">
      {/* Source badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-mono-tech px-2 py-0.5 rounded border font-bold ${
              dataSource === 'openf1'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}
          >
            {dataSource === 'openf1' ? '[LIVE] LIVE OPENF1 DATA' : '[DEMO] DEMO DATA (Monaco 2024)'}
          </span>
          {selectedSession && (
            <span className="text-[10px] font-mono-tech text-gray-500">
              {selectedSession.circuit} {selectedSession.year}
            </span>
          )}
        </div>
        <button
          onClick={loadSessions}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono-tech bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : 'Load 2024 Races'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-amber-400 text-xs font-mono-tech bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Session selector */}
      {sessions.length > 0 && (
        <div>
          <div className="text-[10px] font-mono-tech text-gray-500 uppercase mb-2">Select Race</div>
          <div className="flex gap-2 flex-wrap max-h-28 overflow-y-auto pr-1">
            {sessions.map((s) => (
              <button
                key={s.sessionKey}
                onClick={() => loadSession(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-chakra border transition-all ${
                  selectedSession?.sessionKey === s.sessionKey
                    ? 'bg-[#66ff00]/20 border-[#66ff00] text-[#66ff00]'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                {s.circuit}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Driver strategy table */}
      {driverStints.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-mono-tech text-gray-500 uppercase">
            Historical Race Strategies
            {dataSource === 'openf1' ? ' (OpenF1)' : ' (Demo - Monaco 2024)'}
          </div>
          {driverStints.map((driver) => (
            <div key={driver.driverNumber} className="bg-black/40 border border-white/5 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-chakra font-bold text-xs text-white">{driver.driverName}</span>
                  <span className="ml-2 text-[10px] font-mono-tech text-gray-500">{driver.teamName}</span>
                </div>
                <span className="text-[10px] font-mono-tech text-gray-600">
                  {driver.stints.length} stint{driver.stints.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex gap-0.5 h-4 rounded-full overflow-hidden mb-1.5">
                {driver.stints.map((stint, i) => {
                  const totalLaps = driver.stints.reduce((a, s) => a + s.stintLength, 0);
                  const pct = (stint.stintLength / Math.max(1, totalLaps)) * 100;
                  return (
                    <div
                      key={i}
                      className="h-full flex items-center justify-center text-[8px] font-bold text-black/80 rounded-sm"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: COMPOUND_COLORS[stint.compound] ?? '#888',
                        minWidth: '8px',
                      }}
                      title={`${stint.compound} L${stint.lapStart}-${stint.lapEnd}`}
                    >
                      {pct > 15 ? stint.compound[0] : ''}
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {driver.pitStops.map((pit, i) => (
                  <span
                    key={i}
                    className="text-[9px] font-mono-tech bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-gray-400"
                  >
                    Pit L{pit.lap}
                    {pit.pitDuration ? ` (${pit.pitDuration.toFixed(1)}s)` : ''}
                  </span>
                ))}
                {driver.pitStops.length === 0 && (
                  <span className="text-[9px] font-mono-tech text-gray-600">No pit stops</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------

export const PitStrategyPanel: React.FC = () => {
  const {
    raceState,
    strategyResult,
    loadOfficialScenario,
    loadDefaultScenario,
    setCurrentLap,
    setTotalLaps,
    setCompound,
    setTireAge,
    setPosition,
    setWeatherCondition,
    setRainProbability,
    setRainCrossoverLap,
    toggleSafetyCarNow,
    setFuelRemaining,
    toggleRivalPitting,
  } = useRaceState();

  const [aiCommentary, setAiCommentary] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'strategy' | 'historical'>('strategy');

  const requestAI = async () => {
    setAiLoading(true);
    setAiCommentary('');
    const text = await fetchAICommentary(
      strategyResult.explanation,
      strategyResult.recommended === 'oneStop' ? 'One-Stop' : 'Two-Stop',
      strategyResult.timeDeltaSeconds,
      strategyResult.primaryAction,
    );
    setAiCommentary(text);
    setAiLoading(false);
  };

  const compounds: TireCompound[] = ['SOFT', 'MEDIUM', 'HARD', 'INTER', 'WET'];
  const delta = strategyResult.timeDeltaSeconds;
  const deltaAbs = Math.abs(delta).toFixed(1);
  const deltaFavored = delta <= 0 ? 'One-Stop' : 'Two-Stop';

  return (
    <section id="pit-strategy" className="bg-[#07080a] border-t border-white/10 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-tech text-[#66ff00] mb-2 uppercase tracking-widest flex-wrap">
              <Flag className="w-4 h-4" />
              <span>APEX PIT WALL STRATEGY ENGINE</span>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded border border-amber-500/30 font-semibold">
                SIMULATED ESTIMATES
              </span>
              {raceState.isOfficialScenario && (
                <span className="bg-[#66ff00]/20 text-[#66ff00] text-[10px] px-2 py-0.5 rounded border border-[#66ff00]/40 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> OFFICIAL SCENARIO (LAP 31/53 - P3)
                </span>
              )}
            </div>
            <h2 className="font-chakra font-black text-3xl md:text-4xl text-white tracking-wide uppercase">
              Pit Stop Strategy <span className="text-gray-500 text-2xl font-normal">Analyser</span>
            </h2>
            <p className="text-xs font-mono-tech text-gray-400 mt-2 max-w-2xl">
              Multi-variable race simulation accounting for tyre wear curves, fuel load penalty, weather crossovers, Safety Car windows, and rival undercut threats. All calculations are{' '}
              <span className="text-amber-400">deterministic simulation models</span>.
            </p>
          </div>

          {/* Quick Presets & Tabs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                onClick={loadOfficialScenario}
                className={`px-3 py-1.5 rounded-lg text-xs font-chakra font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  raceState.isOfficialScenario
                    ? 'bg-[#66ff00] text-black shadow-[0_0_15px_rgba(102,255,0,0.3)]'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                Official Scenario (Lap 31/53)
              </button>
              <button
                onClick={loadDefaultScenario}
                className={`px-3 py-1.5 rounded-lg text-xs font-chakra font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  !raceState.isOfficialScenario
                    ? 'bg-white/20 text-white border border-[#66ff00]/40'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Baku GP (51 Laps)
              </button>
            </div>

            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setActiveTab('strategy')}
                className={`px-3 py-1.5 rounded-lg text-xs font-chakra font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === 'strategy' ? 'bg-[#66ff00] text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                Strategy Engine
              </button>
              <button
                onClick={() => setActiveTab('historical')}
                className={`px-3 py-1.5 rounded-lg text-xs font-chakra font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === 'historical' ? 'bg-[#66ff00] text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                Race Data
              </button>
            </div>
          </div>
        </div>

        {/* Primary Callout: Strategic Decision Recommendation */}
        <div
          className={`mb-8 border rounded-2xl p-5 transition-all ${
            strategyResult.primaryActionUrgency === 'NOW'
              ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.15)]'
              : 'bg-[#66ff00]/10 border-[#66ff00]/30 shadow-[0_0_20px_rgba(102,255,0,0.1)]'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono-tech px-2 py-0.5 rounded font-black tracking-widest uppercase ${
                    strategyResult.primaryActionUrgency === 'NOW'
                      ? 'bg-amber-500 text-black'
                      : 'bg-[#66ff00] text-black'
                  }`}
                >
                  CALLOUT URGENCY: {strategyResult.primaryActionUrgency}
                </span>
                <span className="text-xs font-mono-tech text-gray-400">
                  Current Position: <strong className="text-white">P{raceState.position}</strong> (Lap {raceState.currentLap}/{raceState.totalLaps})
                </span>
              </div>
              <h3 className="font-chakra font-black text-xl md:text-2xl text-white tracking-wide">
                {strategyResult.primaryAction}
              </h3>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
              <div className="bg-black/50 border border-white/10 px-4 py-2 rounded-xl text-center">
                <div className="text-[9px] font-mono-tech text-gray-400 uppercase">Strategy Adv.</div>
                <div className="font-chakra font-bold text-base text-[#66ff00]">
                  {deltaFavored} +{deltaAbs}s
                </div>
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'strategy' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Interactive Scenario Variables */}
            <div className="lg:col-span-1 space-y-4">
              {/* Race State Control */}
              <div className="bg-black/60 border border-white/10 rounded-2xl p-5 space-y-4">
                <h3 className="font-chakra font-bold text-sm text-white uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-[#66ff00]" />
                    Race Telemetry Controls
                  </span>
                  <span className="text-[10px] font-mono-tech text-gray-500">SIMULATED</span>
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <NumberInput
                    label="Current Lap"
                    value={raceState.currentLap}
                    min={1}
                    max={raceState.totalLaps - 1}
                    step={1}
                    onChange={setCurrentLap}
                  />
                  <NumberInput
                    label="Total Distance"
                    value={raceState.totalLaps}
                    min={20}
                    max={100}
                    step={1}
                    unit=" L"
                    onChange={setTotalLaps}
                  />
                  <NumberInput
                    label="Current Tire Age"
                    value={raceState.tireAge}
                    min={0}
                    max={60}
                    step={1}
                    unit=" laps"
                    onChange={setTireAge}
                  />
                  <NumberInput
                    label="Track Position"
                    value={raceState.position}
                    min={1}
                    max={20}
                    step={1}
                    unit=""
                    onChange={setPosition}
                  />
                </div>

                {/* Compound Selection */}
                <div>
                  <div className="text-[10px] font-mono-tech text-gray-400 uppercase tracking-wider mb-2">
                    Current Fitted Compound
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {compounds.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCompound(c)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-chakra font-bold border transition-all cursor-pointer ${
                          raceState.currentCompound === c
                            ? 'text-black shadow-lg font-black'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                        }`}
                        style={
                          raceState.currentCompound === c
                            ? {
                                backgroundColor: TIRE_PROFILES[c].color,
                                borderColor: TIRE_PROFILES[c].color,
                              }
                            : {}
                        }
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] font-mono-tech text-gray-500 mt-1">
                    Linear degradation: {TIRE_PROFILES[raceState.currentCompound].degradationPerLap}s/lap
                  </p>
                </div>

                {/* Weather & Rain Crossover */}
                <div className="border border-white/10 rounded-xl p-3 space-y-3">
                  <div className="flex items-center justify-between text-xs font-chakra font-bold text-white uppercase">
                    <div className="flex items-center gap-1.5">
                      <CloudRain className="w-4 h-4 text-cyan-400" />
                      Weather Condition
                    </div>
                    <span className="text-[10px] font-mono-tech text-cyan-300">
                      {(raceState.weather.rainProbability * 100).toFixed(0)}% Rain Probability
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {(['DRY', 'DAMP', 'RAIN'] as const).map((w) => (
                      <button
                        key={w}
                        onClick={() => setWeatherCondition(w)}
                        className={`py-1 text-[10px] font-chakra font-bold rounded-lg border transition-all cursor-pointer ${
                          raceState.weather.condition === w
                            ? 'bg-cyan-500 text-black border-cyan-400'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <NumberInput
                      label="Rain Probability"
                      value={Math.round(raceState.weather.rainProbability * 100)}
                      min={0}
                      max={100}
                      step={5}
                      unit="%"
                      onChange={(v) => setRainProbability(v / 100)}
                    />
                    <NumberInput
                      label="Rain Laps Away"
                      value={
                        raceState.weather.rainCrossoverLap
                          ? Math.max(0, raceState.weather.rainCrossoverLap - raceState.currentLap)
                          : 0
                      }
                      min={0}
                      max={30}
                      step={1}
                      unit=" L"
                      onChange={(laps) =>
                        setRainCrossoverLap(laps === 0 ? null : raceState.currentLap + laps)
                      }
                    />
                  </div>
                </div>

                {/* Safety Car Control */}
                <div className="border border-white/10 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield
                        className={`w-4 h-4 ${
                          raceState.safetyCar.activeNow ? 'text-amber-400' : 'text-gray-500'
                        }`}
                      />
                      <span className="text-xs font-chakra font-bold text-white uppercase">
                        Safety Car Status
                      </span>
                    </div>
                    <button
                      onClick={toggleSafetyCarNow}
                      className={`text-[10px] font-mono-tech px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                        raceState.safetyCar.activeNow
                          ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                          : 'bg-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      {raceState.safetyCar.activeNow ? 'DEPLOYED (ACTIVE)' : 'STANDBY'}
                    </button>
                  </div>
                  <p className="text-[9px] font-mono-tech text-gray-500">
                    {raceState.safetyCar.activeNow
                      ? `Pit-lane time penalty discounted to ~${(raceState.pitLaneLossSeconds * 0.70).toFixed(1)}s (30% SC reduction).`
                      : `Normal pit lane loss ~${raceState.pitLaneLossSeconds.toFixed(1)}s.`}
                  </p>
                </div>

                {/* Fuel Model */}
                <div className="border border-white/10 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-chakra font-bold text-white uppercase">
                    <div className="flex items-center gap-1.5">
                      <Fuel className="w-4 h-4 text-emerald-400" />
                      Fuel Management
                    </div>
                    <span className="text-[10px] font-mono-tech text-emerald-400">
                      {raceState.fuel.fuelKgRemaining.toFixed(1)} kg remaining
                    </span>
                  </div>

                  <NumberInput
                    label="Fuel In Tank (kg)"
                    value={raceState.fuel.fuelKgRemaining}
                    min={0}
                    max={110}
                    step={1}
                    unit=" kg"
                    onChange={setFuelRemaining}
                  />

                  {strategyResult.fuelWarning && (
                    <div className="text-[10px] font-mono-tech text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded">
                      {strategyResult.fuelWarning}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Middle & Right: Strategy Comparison & Competitor Analysis */}
            <div className="lg:col-span-2 space-y-4">
              {/* Rivals Status Panel */}
              <div className="bg-black/60 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#66ff00]" />
                    <span className="font-chakra font-bold text-sm text-white uppercase tracking-wider">
                      Rival Decisions & Pit-Wall Tracking
                    </span>
                  </div>
                  <span className="text-[10px] font-mono-tech text-gray-500">
                    CLICK TO TOGGLE PIT STATUS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {raceState.rivals.map((rival) => {
                    const analysis = strategyResult.rivalAnalysis.find((a) => a.id === rival.id);
                    return (
                      <div
                        key={rival.id}
                        onClick={() => toggleRivalPitting(rival.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer select-none ${
                          rival.pitting
                            ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                            : 'bg-black/40 border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-chakra font-bold text-xs text-white">
                            {rival.name}
                          </span>
                          <span
                            className={`text-[9px] font-mono-tech px-1.5 py-0.5 rounded font-bold ${
                              rival.pitting
                                ? 'bg-amber-500 text-black'
                                : 'bg-white/5 text-gray-400'
                            }`}
                          >
                            {rival.pitting ? 'IN PIT LANE' : 'ON TRACK'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono-tech text-gray-400 mb-2">
                          <span>Gap: {rival.gapToPlayerSeconds > 0 ? `+${rival.gapToPlayerSeconds.toFixed(1)}` : rival.gapToPlayerSeconds.toFixed(1)}s</span>
                          <span>{rival.compound} (L{rival.tireAge})</span>
                        </div>

                        {analysis && (
                          <div className="text-[10px] font-mono-tech text-gray-300 border-t border-white/10 pt-1.5 leading-snug">
                            {analysis.recommendation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Comparison Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StrategyCard
                  strategy={strategyResult.oneStop}
                  isRecommended={strategyResult.recommended === 'oneStop'}
                  label="Option A: One-Stop"
                  feasibility={strategyResult.oneStopFeasibility}
                />
                <StrategyCard
                  strategy={strategyResult.twoStop}
                  isRecommended={strategyResult.recommended === 'twoStop'}
                  label="Option B: Two-Stop"
                  feasibility={strategyResult.twoStopFeasibility}
                />
              </div>

              {/* Deep Strategy Rationale & AI Commentary */}
              <div className="bg-black/60 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#66ff00]" />
                  <span className="font-chakra font-bold text-sm text-white uppercase tracking-wider">
                    Pit-Wall Engineering Rationale
                  </span>
                </div>
                <p className="text-xs font-mono-tech text-gray-300 leading-relaxed">
                  {strategyResult.explanation}
                </p>

                {/* Gemini AI Commentary */}
                <div className="border-t border-white/10 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-[10px] font-mono-tech text-purple-400 uppercase tracking-wider">
                        AI Pit-Wall Commentary
                      </span>
                      <span className="text-[9px] font-mono-tech text-gray-500 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">
                        GEMINI 2.5 FLASH
                      </span>
                    </div>
                    <button
                      onClick={requestAI}
                      disabled={aiLoading}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono-tech bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg text-purple-400 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Zap className={`w-3 h-3 ${aiLoading ? 'animate-pulse' : ''}`} />
                      {aiLoading ? 'Synthesizing...' : 'Get AI Analysis'}
                    </button>
                  </div>

                  {aiCommentary ? (
                    <p className="text-xs font-mono-tech text-gray-300 leading-relaxed bg-purple-500/5 border border-purple-500/10 rounded-lg p-3">
                      {aiCommentary}
                    </p>
                  ) : (
                    <p className="text-[10px] font-mono-tech text-gray-500 italic">
                      {getGeminiApiKey()
                        ? 'Click "Get AI Analysis" for Gemini natural-language pit-wall audio debrief.'
                        : 'Set VITE_GEMINI_API_KEY to enable automated generative commentary.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Compound Degradation Matrix */}
              <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
                <div className="text-[10px] font-mono-tech text-gray-500 uppercase mb-3">
                  Pirelli Compound Performance Matrix & Degradation Curves
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(['SOFT', 'MEDIUM', 'HARD', 'INTER', 'WET'] as TireCompound[]).map((c) => {
                    const p = TIRE_PROFILES[c];
                    return (
                      <div
                        key={c}
                        className="bg-black/40 rounded-xl p-2.5 text-center border border-white/5"
                      >
                        <div
                          className="w-4 h-4 rounded-full mx-auto mb-1.5"
                          style={{ backgroundColor: p.color }}
                        />
                        <div className="text-[9px] font-chakra font-bold text-white">{c}</div>
                        <div className="text-[8px] font-mono-tech text-gray-400">
                          {p.degradationPerLap}s/lap
                        </div>
                        <div className="text-[8px] font-mono-tech text-gray-500">
                          max {p.maxStintLaps}L
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Historical Data Tab */}
        {activeTab === 'historical' && (
          <div className="space-y-4">
            {/* Separation notice */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-[11px] font-mono-tech text-gray-300 leading-relaxed">
                <span className="text-blue-300 font-semibold">HISTORICAL REFERENCE ONLY — </span>
                This tab shows archived real-race stint data from past F1 seasons via the OpenF1 API.
                The demo dataset is Monaco 2024.{' '}
                <span className="text-amber-400">This data is not connected to the Baku City Circuit simulation above</span>{' '}
                — it is provided as a reference for how actual race strategies unfolded in past events.
                All active strategy recommendations use the Baku GP scenario selected in the controls panel.
              </div>
            </div>
            <div className="bg-black/60 border border-white/10 rounded-2xl p-5">
              <HistoricalDataPanel />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

