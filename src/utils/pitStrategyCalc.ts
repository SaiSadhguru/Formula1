/**
 * APEX Pit Strategy Calculation Engine
 *
 * Pure, deterministic, framework-independent strategy calculations.
 * All outputs are clearly labeled as SIMULATED estimates based on
 * simplified assumptions. Do not treat as real sporting data.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type TireCompound = 'SOFT' | 'MEDIUM' | 'HARD' | 'INTER' | 'WET';

export interface TireProfile {
  compound: TireCompound;
  /** Seconds lost per lap of tire age (linear degradation model) */
  degradationPerLap: number;
  /** Minimum stint length (laps) before compound becomes noncompetitive */
  minStintLaps: number;
  /** Maximum viable stint length (laps) before critical performance cliff */
  maxStintLaps: number;
  /** Pace delta vs. MEDIUM baseline in seconds (negative = faster) */
  paceDeltaVsMedium: number;
  /** Display color hex */
  color: string;
}

export const TIRE_PROFILES: Record<TireCompound, TireProfile> = {
  SOFT: {
    compound: 'SOFT',
    degradationPerLap: 0.055,
    minStintLaps: 10,
    maxStintLaps: 28,
    paceDeltaVsMedium: -0.35,
    color: '#e10600',
  },
  MEDIUM: {
    compound: 'MEDIUM',
    degradationPerLap: 0.032,
    minStintLaps: 15,
    maxStintLaps: 42,
    paceDeltaVsMedium: 0,
    color: '#ffd700',
  },
  HARD: {
    compound: 'HARD',
    degradationPerLap: 0.018,
    minStintLaps: 20,
    maxStintLaps: 60,
    paceDeltaVsMedium: 0.28,
    color: '#f0f0f0',
  },
  INTER: {
    compound: 'INTER',
    degradationPerLap: 0.025,
    minStintLaps: 5,
    maxStintLaps: 35,
    paceDeltaVsMedium: 1.5,
    color: '#00cc44',
  },
  WET: {
    compound: 'WET',
    degradationPerLap: 0.015,
    minStintLaps: 3,
    maxStintLaps: 25,
    paceDeltaVsMedium: 3.2,
    color: '#0066cc',
  },
};

export interface StrategyInputs {
  /** Total race distance in laps */
  totalLaps: number;
  /** Current lap number (1-indexed) */
  currentLap: number;
  /** How many laps the current tires have been on the car */
  currentTireAge: number;
  /** Current tire compound */
  currentCompound: TireCompound;
  /** Representative dry-conditions clean-air lap time in seconds */
  baseLapTimeSeconds: number;
  /** Time lost in the pit lane (entry + stop + exit) in seconds */
  pitLaneLossSeconds: number;
  /** Whether a safety car scenario should be modeled */
  safetyCar: boolean;
  /** How many laps the safety car is assumed to run (ignored if safetyCar=false) */
  safetyCarLaps: number;
  /** Lap on which the safety car is assumed to deploy (ignored if safetyCar=false) */
  safetyCarDeployLap: number;
}

export interface StintSegment {
  stintNumber: number;
  compound: TireCompound;
  startLap: number;
  endLap: number;
  /** Lap on which to pit (0 = no pit after this stint) */
  pitOnLap: number;
  estimatedStintTimeSeconds: number;
}

export interface StrategyOption {
  id: string;
  label: string;
  stops: number;
  stints: StintSegment[];
  totalRaceTimeSeconds: number;
  totalPitLossSeconds: number;
  /** Estimated gap to leader after applying stop deltas */
  recommendedPitLap: number;
  pitWindowOpenLap: number;
  pitWindowCloseLap: number;
  isUndercut: boolean;
  isOvercut: boolean;
  safetyCarlap: number | null;
  valid: boolean;
  invalidReason?: string;
}

export interface StrategyComparisonResult {
  oneStop: StrategyOption;
  twoStop: StrategyOption;
  recommended: 'oneStop' | 'twoStop';
  timeDeltaSeconds: number;
  /** Positive = one-stop faster, negative = two-stop faster */
  explanation: string;
  inputs: StrategyInputs;
  simulatedLabel: string;
}

// ─── Core Calculations ───────────────────────────────────────────────────────

/**
 * Estimate total time for a single stint.
 * Uses linear degradation model: each lap after the first accumulates
 * `degradationPerLap` seconds on top of base + compound delta.
 */
export function calcStintTime(
  laps: number,
  tireAgeAtStart: number,
  compound: TireCompound,
  baseLapTime: number,
): number {
  if (laps <= 0) return 0;
  const profile = TIRE_PROFILES[compound];
  let totalTime = 0;
  for (let i = 0; i < laps; i++) {
    const age = tireAgeAtStart + i;
    const degradation = age * profile.degradationPerLap;
    const lapTime = baseLapTime + profile.paceDeltaVsMedium + degradation;
    totalTime += lapTime;
  }
  return totalTime;
}

/**
 * Get recommended pit lap for a compound given current stint length.
 * Targets 60% of max viable stint as the "sweet spot" pit window start.
 */
export function calcPitWindow(
  compound: TireCompound,
  stintStartLap: number,
): { open: number; recommended: number; close: number } {
  const profile = TIRE_PROFILES[compound];
  const open = stintStartLap + profile.minStintLaps;
  const close = stintStartLap + profile.maxStintLaps;
  const recommended = Math.round(stintStartLap + profile.maxStintLaps * 0.62);
  return { open, recommended: Math.min(recommended, close - 3), close };
}

/**
 * Apply safety-car discount: laps run under SC are modeled at
 * baseLapTime + 30s (safety car pace), providing a free/cheap pit window.
 */
function applySafetyCarDiscount(
  stints: StintSegment[],
  scDeployLap: number,
  scDurationLaps: number,
  baseLapTime: number,
): StintSegment[] {
  const SC_LAP_TIME = baseLapTime + 30;
  return stints.map((stint) => {
    let adjusted = 0;
    for (let lap = stint.startLap; lap <= stint.endLap; lap++) {
      if (lap >= scDeployLap && lap < scDeployLap + scDurationLaps) {
        adjusted += SC_LAP_TIME;
      } else {
        const age = lap - stint.startLap;
        const profile = TIRE_PROFILES[stint.compound];
        adjusted += baseLapTime + profile.paceDeltaVsMedium + age * profile.degradationPerLap;
      }
    }
    return { ...stint, estimatedStintTimeSeconds: adjusted };
  });
}

/** Choose a sensible second-stint compound given the first */
function chooseSecondCompound(first: TireCompound): TireCompound {
  if (first === 'SOFT') return 'MEDIUM';
  if (first === 'MEDIUM') return 'HARD';
  if (first === 'HARD') return 'MEDIUM';
  return 'MEDIUM';
}

/** Choose a sensible third-stint compound for two-stop */
function chooseThirdCompound(first: TireCompound, second: TireCompound): TireCompound {
  const all: TireCompound[] = ['SOFT', 'MEDIUM', 'HARD'];
  const remaining = all.filter((c) => c !== first && c !== second);
  return remaining[0] ?? 'MEDIUM';
}

// ─── One-Stop Strategy ───────────────────────────────────────────────────────

export function calcOneStop(inputs: StrategyInputs): StrategyOption {
  const {
    totalLaps,
    currentLap,
    currentTireAge,
    currentCompound,
    baseLapTimeSeconds,
    pitLaneLossSeconds,
    safetyCar,
    safetyCarLaps,
    safetyCarDeployLap,
  } = inputs;

  const remainingLaps = totalLaps - currentLap + 1;

  if (remainingLaps < 3) {
    return {
      id: 'one-stop',
      label: 'One-Stop',
      stops: 1,
      stints: [],
      totalRaceTimeSeconds: 0,
      totalPitLossSeconds: pitLaneLossSeconds,
      recommendedPitLap: 0,
      pitWindowOpenLap: 0,
      pitWindowCloseLap: 0,
      isUndercut: false,
      isOvercut: false,
      safetyCarlap: null,
      valid: false,
      invalidReason: 'Fewer than 3 laps remaining — pitting not viable.',
    };
  }

  const secondCompound = chooseSecondCompound(currentCompound);
  const pitWindow = calcPitWindow(currentCompound, currentLap - currentTireAge);

  // Clamp recommended pit lap to remaining race window
  const pitLap = Math.min(
    Math.max(pitWindow.recommended, currentLap + 3),
    totalLaps - TIRE_PROFILES[secondCompound].minStintLaps,
  );

  const stint1Laps = pitLap - currentLap + 1;
  const stint2Laps = totalLaps - pitLap;

  if (stint2Laps < 1) {
    return {
      id: 'one-stop',
      label: 'One-Stop',
      stops: 1,
      stints: [],
      totalRaceTimeSeconds: 0,
      totalPitLossSeconds: pitLaneLossSeconds,
      recommendedPitLap: pitLap,
      pitWindowOpenLap: pitWindow.open,
      pitWindowCloseLap: pitWindow.close,
      isUndercut: false,
      isOvercut: false,
      safetyCarlap: null,
      valid: false,
      invalidReason: 'Not enough laps for second stint.',
    };
  }

  const t1 = calcStintTime(stint1Laps, currentTireAge, currentCompound, baseLapTimeSeconds);
  const t2 = calcStintTime(stint2Laps, 0, secondCompound, baseLapTimeSeconds);

  let stints: StintSegment[] = [
    {
      stintNumber: 1,
      compound: currentCompound,
      startLap: currentLap,
      endLap: pitLap,
      pitOnLap: pitLap,
      estimatedStintTimeSeconds: t1,
    },
    {
      stintNumber: 2,
      compound: secondCompound,
      startLap: pitLap + 1,
      endLap: totalLaps,
      pitOnLap: 0,
      estimatedStintTimeSeconds: t2,
    },
  ];

  if (safetyCar) {
    stints = applySafetyCarDiscount(stints, safetyCarDeployLap, safetyCarLaps, baseLapTimeSeconds);
  }

  const totalRace = stints.reduce((s, st) => s + st.estimatedStintTimeSeconds, 0) + pitLaneLossSeconds;

  return {
    id: 'one-stop',
    label: 'One-Stop',
    stops: 1,
    stints,
    totalRaceTimeSeconds: totalRace,
    totalPitLossSeconds: pitLaneLossSeconds,
    recommendedPitLap: pitLap,
    pitWindowOpenLap: Math.max(currentLap + 1, pitWindow.open),
    pitWindowCloseLap: Math.min(totalLaps - 5, pitWindow.close),
    isUndercut: false,
    isOvercut: true, // One-stop is the classic overcut
    safetyCarlap: safetyCar ? safetyCarDeployLap : null,
    valid: true,
  };
}

// ─── Two-Stop Strategy ───────────────────────────────────────────────────────

export function calcTwoStop(inputs: StrategyInputs): StrategyOption {
  const {
    totalLaps,
    currentLap,
    currentTireAge,
    currentCompound,
    baseLapTimeSeconds,
    pitLaneLossSeconds,
    safetyCar,
    safetyCarLaps,
    safetyCarDeployLap,
  } = inputs;

  const remainingLaps = totalLaps - currentLap + 1;

  if (remainingLaps < 10) {
    return {
      id: 'two-stop',
      label: 'Two-Stop',
      stops: 2,
      stints: [],
      totalRaceTimeSeconds: 0,
      totalPitLossSeconds: pitLaneLossSeconds * 2,
      recommendedPitLap: 0,
      pitWindowOpenLap: 0,
      pitWindowCloseLap: 0,
      isUndercut: false,
      isOvercut: false,
      safetyCarlap: null,
      valid: false,
      invalidReason: 'Fewer than 10 laps remaining — two-stop not viable.',
    };
  }

  const secondCompound = chooseSecondCompound(currentCompound);
  const thirdCompound = chooseThirdCompound(currentCompound, secondCompound);

  // Divide remaining laps roughly into thirds for the two-stop window
  const pit1Lap = currentLap + Math.round(remainingLaps * 0.33);
  const pit2Lap = currentLap + Math.round(remainingLaps * 0.66);

  const stint1Laps = pit1Lap - currentLap + 1;
  const stint2Laps = pit2Lap - pit1Lap;
  const stint3Laps = totalLaps - pit2Lap;

  if (stint3Laps < 1 || stint2Laps < 1) {
    return {
      id: 'two-stop',
      label: 'Two-Stop',
      stops: 2,
      stints: [],
      totalRaceTimeSeconds: 0,
      totalPitLossSeconds: pitLaneLossSeconds * 2,
      recommendedPitLap: pit1Lap,
      pitWindowOpenLap: currentLap + 1,
      pitWindowCloseLap: totalLaps - 5,
      isUndercut: false,
      isOvercut: false,
      safetyCarlap: null,
      valid: false,
      invalidReason: 'Race too short for viable two-stop stint distribution.',
    };
  }

  const t1 = calcStintTime(stint1Laps, currentTireAge, currentCompound, baseLapTimeSeconds);
  const t2 = calcStintTime(stint2Laps, 0, secondCompound, baseLapTimeSeconds);
  const t3 = calcStintTime(stint3Laps, 0, thirdCompound, baseLapTimeSeconds);

  let stints: StintSegment[] = [
    {
      stintNumber: 1,
      compound: currentCompound,
      startLap: currentLap,
      endLap: pit1Lap,
      pitOnLap: pit1Lap,
      estimatedStintTimeSeconds: t1,
    },
    {
      stintNumber: 2,
      compound: secondCompound,
      startLap: pit1Lap + 1,
      endLap: pit2Lap,
      pitOnLap: pit2Lap,
      estimatedStintTimeSeconds: t2,
    },
    {
      stintNumber: 3,
      compound: thirdCompound,
      startLap: pit2Lap + 1,
      endLap: totalLaps,
      pitOnLap: 0,
      estimatedStintTimeSeconds: t3,
    },
  ];

  if (safetyCar) {
    stints = applySafetyCarDiscount(stints, safetyCarDeployLap, safetyCarLaps, baseLapTimeSeconds);
  }

  const totalRace =
    stints.reduce((s, st) => s + st.estimatedStintTimeSeconds, 0) + pitLaneLossSeconds * 2;

  return {
    id: 'two-stop',
    label: 'Two-Stop',
    stops: 2,
    stints,
    totalRaceTimeSeconds: totalRace,
    totalPitLossSeconds: pitLaneLossSeconds * 2,
    recommendedPitLap: pit1Lap,
    pitWindowOpenLap: currentLap + 1,
    pitWindowCloseLap: pit1Lap + 5,
    isUndercut: true, // Two-stop aggressive early stop = undercut attempt
    isOvercut: false,
    safetyCarlap: safetyCar ? safetyCarDeployLap : null,
    valid: true,
  };
}

// ─── Comparison Engine ───────────────────────────────────────────────────────

export function compareStrategies(inputs: StrategyInputs): StrategyComparisonResult {
  const oneStop = calcOneStop(inputs);
  const twoStop = calcTwoStop(inputs);

  const delta = oneStop.totalRaceTimeSeconds - twoStop.totalRaceTimeSeconds;
  const recommended: 'oneStop' | 'twoStop' = delta <= 0 ? 'oneStop' : 'twoStop';

  const fmtTime = (s: number) => {
    if (s <= 0) return 'N/A';
    const m = Math.floor(s / 60);
    const sec = (s % 60).toFixed(1);
    return `${m}m ${sec}s`;
  };

  let explanation = '';
  if (!oneStop.valid && !twoStop.valid) {
    explanation = 'Neither strategy is viable with the remaining laps. Stay out and finish.';
  } else if (!oneStop.valid) {
    explanation = `One-stop is not viable: ${oneStop.invalidReason} Two-stop is the only option.`;
  } else if (!twoStop.valid) {
    explanation = `Two-stop is not viable: ${twoStop.invalidReason} One-stop is the only option.`;
  } else {
    const absDelta = Math.abs(delta).toFixed(1);
    if (recommended === 'oneStop') {
      explanation = `One-stop saves ~${absDelta}s over two-stop. ` +
        `Pitting on lap ${oneStop.recommendedPitLap} onto ${oneStop.stints[1]?.compound ?? '?'} ` +
        `minimises the second extra pit-lane loss (${inputs.pitLaneLossSeconds}s). ` +
        (inputs.safetyCar
          ? `A safety car on lap ${inputs.safetyCarDeployLap} provides a free pit window — prefer the one-stop here.`
          : 'Tire degradation rates favour a longer second stint.');
    } else {
      explanation = `Two-stop saves ~${absDelta}s over one-stop. ` +
        `Fresh ${twoStop.stints[1]?.compound ?? '?'} tyres significantly offset ` +
        `the additional ${inputs.pitLaneLossSeconds}s pit-lane loss. ` +
        (inputs.safetyCar
          ? `Safety car on lap ${inputs.safetyCarDeployLap} reduces the cost of the extra stop.`
          : 'High compound degradation makes fresh rubber more valuable than saving the extra stop.');
    }
    explanation += ` (SIMULATED — estimated times: 1-stop ${fmtTime(oneStop.totalRaceTimeSeconds)}, 2-stop ${fmtTime(twoStop.totalRaceTimeSeconds)})`;
  }

  return {
    oneStop,
    twoStop,
    recommended,
    timeDeltaSeconds: delta,
    explanation,
    inputs,
    simulatedLabel: '⚠ SIMULATED ESTIMATES — Not real sporting data',
  };
}

// ─── Formatting Helpers ───────────────────────────────────────────────────────

export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return '--:--.-';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = (seconds % 60).toFixed(1);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export function formatLapTime(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return '-:--.---';
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(3).padStart(6, '0');
  return `${m}:${s}`;
}

export const COMPOUND_LABELS: Record<TireCompound, string> = {
  SOFT: 'Soft (C4-C5)',
  MEDIUM: 'Medium (C3)',
  HARD: 'Hard (C1-C2)',
  INTER: 'Intermediates',
  WET: 'Full Wet',
};

// ─── Extended Engine: Fuel Model ──────────────────────────────────────────────

export interface FuelInputs {
  fuelKgRemaining: number;
  fuelKgPerLap: number;
  /** Pace penalty in seconds per kg of fuel */
  fuelPaceSecPerKg: number;
}

/**
 * Estimate fuel remaining after a number of laps.
 * Returns a non-negative number — never negative.
 */
export function calcFuelRemaining(
  fuelKgRemaining: number,
  fuelKgPerLap: number,
  lapsToRun: number,
): number {
  return Math.max(0, fuelKgRemaining - fuelKgPerLap * lapsToRun);
}

/**
 * Check whether enough fuel exists to complete the remaining laps.
 * Returns { feasible, shortfallKg }.
 */
export function calcFuelFeasibility(
  fuelKgRemaining: number,
  fuelKgPerLap: number,
  lapsRemaining: number,
): { feasible: boolean; shortfallKg: number } {
  const required = fuelKgPerLap * lapsRemaining;
  const shortfallKg = Math.max(0, required - fuelKgRemaining);
  return { feasible: shortfallKg === 0, shortfallKg };
}

/**
 * Compute the fuel-weight lap-time penalty for the current lap.
 * Heavier fuel = slower lap times.
 */
export function calcFuelWeightPenalty(
  fuelKgRemaining: number,
  fuelPaceSecPerKg: number,
): number {
  return fuelKgRemaining * fuelPaceSecPerKg;
}

// ─── Extended Engine: Weather / Compound Crossover ───────────────────────────

export type WeatherCondition = 'DRY' | 'DAMP' | 'RAIN';

export interface WeatherInputs {
  condition: WeatherCondition;
  rainProbability: number;         // 0–1
  rainCrossoverLap: number | null; // lap at which rain forces wet switch; null = no rain
}

/**
 * Return the optimal compound given current weather.
 * In rain conditions, Intermediates are preferred unless rain is heavy (>0.75 prob).
 */
export function calcOptimalWeatherCompound(weather: WeatherInputs): TireCompound {
  if (weather.condition === 'RAIN') {
    return weather.rainProbability >= 0.75 ? 'WET' : 'INTER';
  }
  if (weather.condition === 'DAMP') return 'INTER';
  if (weather.rainProbability >= 0.75) return 'WET';
  if (weather.rainProbability >= 0.4) return 'INTER';
  return 'MEDIUM'; // dry default — caller overrides for specific strategy
}

/**
 * Determine whether a wet-compound switch is recommended.
 * Returns { shouldSwitch, targetCompound, reason }.
 */
export function calcWetCrossover(
  currentLap: number,
  weather: WeatherInputs,
): { shouldSwitch: boolean; targetCompound: TireCompound; reason: string } {
  if (weather.condition === 'DRY' && weather.rainProbability < 0.4) {
    return { shouldSwitch: false, targetCompound: 'MEDIUM', reason: 'Dry conditions — no switch required.' };
  }

  const lapsToRain =
    weather.rainCrossoverLap != null ? weather.rainCrossoverLap - currentLap : Infinity;

  if (weather.condition === 'RAIN' || lapsToRain <= 3) {
    const target = calcOptimalWeatherCompound(weather);
    return {
      shouldSwitch: true,
      targetCompound: target,
      reason: `Rain imminent (${(weather.rainProbability * 100).toFixed(0)}% probability). Switch to ${target} recommended within 3 laps.`,
    };
  }

  if (weather.rainProbability >= 0.6 && lapsToRain <= 8) {
    const target: TireCompound = 'INTER';
    return {
      shouldSwitch: true,
      targetCompound: target,
      reason: `Rain likely in ~${lapsToRain.toFixed(0)} laps (${(weather.rainProbability * 100).toFixed(0)}%). Pre-emptive Intermediates advised.`,
    };
  }

  return {
    shouldSwitch: false,
    targetCompound: 'MEDIUM',
    reason: `Rain probability ${(weather.rainProbability * 100).toFixed(0)}% — monitor but no switch yet.`,
  };
}

// ─── Extended Engine: Rival Analysis ─────────────────────────────────────────

export interface RivalInput {
  id: string;
  name: string;
  position: number;
  gapToPlayerSeconds: number;
  compound: TireCompound;
  tireAge: number;
  pitting: boolean;
  undercutThreat: boolean;
}

export interface RivalAnalysis {
  id: string;
  name: string;
  undercutRiskSeconds: number;
  overcutOpportunitySeconds: number;
  recommendation: string;
}

/** Pit-loss assumption for rival analysis (seconds) */
const RIVAL_PIT_LOSS = 22;

/**
 * Estimate the undercut risk from a rival who pits this lap.
 * After pitting, rival gains fresh-tyre advantage vs our degraded current tyres.
 */
export function calcRivalUndercutRisk(
  rival: RivalInput,
  ourCompound: TireCompound,
  ourTireAge: number,
  baseLapTime: number,
  lapsRemaining: number,
): number {
  // Net lap-time delta rival gains per lap after their stop vs us staying out
  const ourDegradation = ourTireAge * TIRE_PROFILES[ourCompound].degradationPerLap;
  const rivalFreshPace = TIRE_PROFILES[rival.compound].paceDeltaVsMedium; // fresh
  const ourPace = TIRE_PROFILES[ourCompound].paceDeltaVsMedium + ourDegradation;
  const paceDeltaPerLap = ourPace - rivalFreshPace; // how much faster rival is per lap

  // Rival pays pit-loss cost, then claws it back via pace advantage
  const lapsToClawBack = lapsRemaining;
  const totalGain = paceDeltaPerLap * lapsToClawBack - RIVAL_PIT_LOSS;
  return Math.max(0, totalGain);
}

/**
 * Estimate overcut opportunity if rival pits and we stay out.
 * We gain track position immediately; rival must use fresh pace to reel us in.
 */
export function calcRivalOvercutOpportunity(
  rival: RivalInput,
  ourCompound: TireCompound,
  ourTireAge: number,
  baseLapTime: number,
  lapsRemaining: number,
): number {
  const gapBuffer = Math.abs(rival.gapToPlayerSeconds);
  // We can extend gap by running while rival pits (pit-loss window)
  return rival.pitting ? Math.max(0, RIVAL_PIT_LOSS - gapBuffer) : 0;
}

/**
 * Analyse all rivals and return per-rival threat/opportunity assessments.
 */
export function analyseRivals(
  rivals: RivalInput[],
  ourCompound: TireCompound,
  ourTireAge: number,
  baseLapTime: number,
  lapsRemaining: number,
): RivalAnalysis[] {
  return rivals.map((r) => {
    const undercutRisk = calcRivalUndercutRisk(r, ourCompound, ourTireAge, baseLapTime, lapsRemaining);
    const overcutOpp = calcRivalOvercutOpportunity(r, ourCompound, ourTireAge, baseLapTime, lapsRemaining);

    let recommendation = '';
    if (r.pitting && undercutRisk > 1.5) {
      recommendation = `⚠ ${r.name} is pitting — undercut risk ${undercutRisk.toFixed(1)}s. Consider matching immediately.`;
    } else if (r.pitting && overcutOpp > 0.5) {
      recommendation = `✓ ${r.name} pitting — overcut opportunity ${overcutOpp.toFixed(1)}s if we stay out briefly.`;
    } else if (r.undercutThreat) {
      recommendation = `⚠ ${r.name} on ${r.compound} (age ${r.tireAge}) threatens undercut next few laps.`;
    } else {
      recommendation = `${r.name} — no immediate threat (gap ${r.gapToPlayerSeconds > 0 ? '+' : ''}${r.gapToPlayerSeconds.toFixed(1)}s).`;
    }

    return { id: r.id, name: r.name, undercutRiskSeconds: undercutRisk, overcutOpportunitySeconds: overcutOpp, recommendation };
  });
}

// ─── Extended Engine: Feasibility Checks ─────────────────────────────────────

export interface FeasibilityResult {
  feasible: boolean;
  warnings: string[];
  blockers: string[];
}

/**
 * Validate a strategy option against fuel, weather and race state.
 * Returns a feasibility summary with human-readable warnings and blockers.
 */
export function calcStrategyFeasibility(
  strategy: StrategyOption,
  fuel: FuelInputs,
  weather: WeatherInputs,
  currentLap: number,
): FeasibilityResult {
  const warnings: string[] = [];
  const blockers: string[] = [];

  if (!strategy.valid) {
    blockers.push(strategy.invalidReason ?? 'Strategy is not valid.');
    return { feasible: false, warnings, blockers };
  }

  // Fuel check
  const lapsRemaining = strategy.stints.reduce(
    (acc, s) => acc + (s.endLap - s.startLap + 1), 0,
  );
  const { feasible: fuelOk, shortfallKg } = calcFuelFeasibility(
    fuel.fuelKgRemaining,
    fuel.fuelKgPerLap,
    lapsRemaining,
  );
  if (!fuelOk) {
    blockers.push(`Insufficient fuel: ${shortfallKg.toFixed(1)} kg shortfall over ${lapsRemaining} laps.`);
  } else if (fuel.fuelKgRemaining - fuel.fuelKgPerLap * lapsRemaining < 2) {
    warnings.push('Fuel margin is very tight (<2 kg buffer). Consider fuel saving mode.');
  }

  // Weather check: any dry-compound stint runs into rain crossover?
  const DRY_COMPOUNDS: TireCompound[] = ['SOFT', 'MEDIUM', 'HARD'];
  if (weather.rainCrossoverLap != null) {
    for (const stint of strategy.stints) {
      if (
        DRY_COMPOUNDS.includes(stint.compound) &&
        stint.endLap >= weather.rainCrossoverLap
      ) {
        warnings.push(
          `Stint ${stint.stintNumber} on ${stint.compound} runs past rain crossover lap ${weather.rainCrossoverLap}. Consider Intermediates.`,
        );
      }
    }
  }

  return { feasible: blockers.length === 0, warnings, blockers };
}

// ─── Extended Engine: SC-Adjusted Pit Loss ───────────────────────────────────

/**
 * Under Safety Car, pit-lane loss is reduced because cars are running slowly.
 * SC pace ~60 km/h vs normal ~200 km/h → pit lane effectively costs less time.
 * Model: subtract SC speed ratio × normal pit loss.
 */
export function calcSCPitLoss(normalPitLoss: number, safetyCarActive: boolean): number {
  if (!safetyCarActive) return normalPitLoss;
  // SC reduces effective pit loss by ~30% (approximate)
  return normalPitLoss * 0.70;
}

// ─── Extended Engine: Full Race-State Strategy ────────────────────────────────

export interface ExtendedStrategyInputs extends StrategyInputs {
  fuel: FuelInputs;
  weather: WeatherInputs;
  rivals: RivalInput[];
  /** True if SC is active right now */
  safetyCarActiveNow: boolean;
}

export interface ExtendedStrategyResult extends StrategyComparisonResult {
  oneStopFeasibility: FeasibilityResult;
  twoStopFeasibility: FeasibilityResult;
  rivalAnalysis: RivalAnalysis[];
  wetCrossover: ReturnType<typeof calcWetCrossover>;
  fuelWarning: string | null;
  /** Human-readable primary action with urgency */
  primaryAction: string;
  primaryActionUrgency: 'NOW' | 'SOON' | 'MONITOR';
  /** True if either strategy is affected by weather crossover */
  weatherAffected: boolean;
  extendedSimulatedLabel: string;
}

/**
 * Full extended strategy comparison incorporating fuel, weather, rivals, and SC.
 * Backward-compatible — still calls calcOneStop / calcTwoStop internally.
 */
export function compareStrategiesExtended(
  inputs: ExtendedStrategyInputs,
): ExtendedStrategyResult {
  // Adjust pit loss for SC
  const effectivePitLoss = calcSCPitLoss(inputs.pitLaneLossSeconds, inputs.safetyCarActiveNow);
  const adjustedInputs: StrategyInputs = { ...inputs, pitLaneLossSeconds: effectivePitLoss };

  const base = compareStrategies(adjustedInputs);

  const oneStopFeasibility = calcStrategyFeasibility(base.oneStop, inputs.fuel, inputs.weather, inputs.currentLap);
  const twoStopFeasibility = calcStrategyFeasibility(base.twoStop, inputs.fuel, inputs.weather, inputs.currentLap);

  const lapsRemaining = inputs.totalLaps - inputs.currentLap + 1;
  const rivalAnalysis = analyseRivals(
    inputs.rivals,
    inputs.currentCompound,
    inputs.currentTireAge,
    inputs.baseLapTimeSeconds,
    lapsRemaining,
  );
  const wetCrossover = calcWetCrossover(inputs.currentLap, inputs.weather);

  // Fuel warning
  const { feasible: fuelOk, shortfallKg } = calcFuelFeasibility(
    inputs.fuel.fuelKgRemaining,
    inputs.fuel.fuelKgPerLap,
    lapsRemaining,
  );
  const fuelWarning = fuelOk
    ? null
    : `⚠ Fuel shortfall: ${shortfallKg.toFixed(1)} kg — fuel-saving mode required.`;

  // Weather affected if crossover lap falls within race window
  const weatherAffected =
    wetCrossover.shouldSwitch ||
    (inputs.weather.rainCrossoverLap != null &&
      inputs.weather.rainCrossoverLap <= inputs.totalLaps);

  // Primary action decision
  const rivalsUndercutting = rivalAnalysis.some((r) => r.undercutRiskSeconds > 1.5);
  const scActive = inputs.safetyCarActiveNow;

  let primaryAction = '';
  let primaryActionUrgency: ExtendedStrategyResult['primaryActionUrgency'] = 'MONITOR';

  if (wetCrossover.shouldSwitch) {
    primaryAction = `PIT NOW for ${wetCrossover.targetCompound} — ${wetCrossover.reason}`;
    primaryActionUrgency = 'NOW';
  } else if (scActive && base.recommended === 'oneStop') {
    primaryAction = `PIT THIS LAP — Safety Car reduces pit-lane loss to ~${effectivePitLoss.toFixed(0)}s. One-stop saves ${Math.abs(base.timeDeltaSeconds).toFixed(1)}s vs two-stop.`;
    primaryActionUrgency = 'NOW';
  } else if (scActive && base.recommended === 'twoStop') {
    primaryAction = `PIT THIS LAP (Two-Stop) — Safety Car window saves extra stop cost. Pit on lap ${base.twoStop.recommendedPitLap}.`;
    primaryActionUrgency = 'NOW';
  } else if (rivalsUndercutting) {
    primaryAction = `MATCH RIVAL PIT — undercut threat detected. Pit by lap ${base.oneStop.recommendedPitLap} to defend position.`;
    primaryActionUrgency = 'SOON';
  } else if (inputs.weather.rainProbability >= 0.6) {
    primaryAction = `MONITOR RAIN — ${(inputs.weather.rainProbability * 100).toFixed(0)}% chance within ${(inputs.weather.rainCrossoverLap ?? inputs.totalLaps) - inputs.currentLap} laps. Keep Intermediates on standby.`;
    primaryActionUrgency = 'SOON';
  } else {
    const rec = base.recommended === 'oneStop' ? base.oneStop : base.twoStop;
    primaryAction = `STAY OUT — pit window opens lap ${rec.pitWindowOpenLap}. Recommended stop: lap ${rec.recommendedPitLap}.`;
    primaryActionUrgency = 'MONITOR';
  }

  return {
    ...base,
    oneStopFeasibility,
    twoStopFeasibility,
    rivalAnalysis,
    wetCrossover,
    fuelWarning,
    primaryAction,
    primaryActionUrgency,
    weatherAffected,
    extendedSimulatedLabel: '⚠ SIMULATED ESTIMATES — Fuel, weather and rival data are deterministic demo models, not real telemetry.',
  };
}

