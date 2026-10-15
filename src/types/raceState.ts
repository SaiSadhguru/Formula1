/**
 * APEX Race State Model
 *
 * Central source of truth for the live race scenario used by the pit-strategy
 * engine. All values are deterministic simulation inputs — not real telemetry.
 */

import type { TireCompound } from '../utils/pitStrategyCalc.ts';

// ─── Weather ─────────────────────────────────────────────────────────────────

export type WeatherCondition = 'DRY' | 'DAMP' | 'RAIN';

export interface WeatherState {
  condition: WeatherCondition;
  /** Probability of rain in next 5 laps (0–1) */
  rainProbability: number;
  /** Estimated lap at which rain crosses wet-compound threshold (null = no rain) */
  rainCrossoverLap: number | null;
  /** Track temperature °C */
  trackTempC: number;
  /** Air temperature °C */
  airTempC: number;
}

// ─── Safety Car ───────────────────────────────────────────────────────────────

export type SafetyCarStatus = 'NONE' | 'DEPLOYED' | 'VIRTUAL';

export interface SafetyCarState {
  status: SafetyCarStatus;
  /** Lap on which the SC was/is expected to deploy */
  deployLap: number;
  /** Expected duration in laps */
  durationLaps: number;
  /** Whether SC is currently active this lap */
  activeNow: boolean;
}

// ─── Rivals ───────────────────────────────────────────────────────────────────

export interface Rival {
  id: string;
  name: string;
  position: number;
  gapToPlayerSeconds: number;
  /** Negative = behind us */
  compound: TireCompound;
  tireAge: number;
  /** Whether this rival is expected to pit this lap or next */
  pitting: boolean;
  /** Whether rival is threatening an undercut */
  undercutThreat: boolean;
}

// ─── Fuel ─────────────────────────────────────────────────────────────────────

export interface FuelState {
  /** Estimated fuel remaining in kg */
  fuelKgRemaining: number;
  /** Fuel consumption rate kg/lap */
  fuelKgPerLap: number;
  /** Pace penalty per kg of fuel (s/kg) — fuel-weight effect */
  fuelPaceSecPerKg: number;
}

// ─── Full Race State ──────────────────────────────────────────────────────────

export interface RaceState {
  /** Circuit identifier ('baku', etc.) */
  circuitId: string;
  /** Lap 1-indexed */
  currentLap: number;
  totalLaps: number;
  /** Our position (1-indexed) */
  position: number;
  currentCompound: TireCompound;
  tireAge: number;
  baseLapTimeSeconds: number;
  pitLaneLossSeconds: number;
  weather: WeatherState;
  safetyCar: SafetyCarState;
  rivals: Rival[];
  fuel: FuelState;
  /** Whether to use official hackathon scenario preset */
  isOfficialScenario: boolean;
}

// ─── Official Hackathon Scenario ──────────────────────────────────────────────
// Lap 31/53, P3, Safety Car deployed, rain approaching, rivals pitting
// Note: totalLaps: 53 is the official problem statement benchmark for this scenario;
// circuitId is mapped to Baku City Circuit.

export const OFFICIAL_SCENARIO: RaceState = {
  circuitId: 'baku',
  currentLap: 31,
  totalLaps: 53,
  position: 3,
  currentCompound: 'MEDIUM',
  tireAge: 18,
  baseLapTimeSeconds: 91.5,
  pitLaneLossSeconds: 22,
  weather: {
    condition: 'DRY',
    rainProbability: 0.72,
    rainCrossoverLap: 38,
    trackTempC: 34,
    airTempC: 24,
  },
  safetyCar: {
    status: 'DEPLOYED',
    deployLap: 31,
    durationLaps: 4,
    activeNow: true,
  },
  rivals: [
    {
      id: 'rival-p2',
      name: 'P2 — VER',
      position: 2,
      gapToPlayerSeconds: -4.2,
      compound: 'MEDIUM',
      tireAge: 18,
      pitting: true,
      undercutThreat: false,
    },
    {
      id: 'rival-p4',
      name: 'P4 — NOR',
      position: 4,
      gapToPlayerSeconds: 2.8,
      compound: 'SOFT',
      tireAge: 12,
      pitting: true,
      undercutThreat: true,
    },
    {
      id: 'rival-p5',
      name: 'P5 — LEC',
      position: 5,
      gapToPlayerSeconds: 6.1,
      compound: 'HARD',
      tireAge: 22,
      pitting: false,
      undercutThreat: false,
    },
  ],
  fuel: {
    fuelKgRemaining: 28.5,
    fuelKgPerLap: 1.25,
    fuelPaceSecPerKg: 0.03,
  },
  isOfficialScenario: true,
};

// ─── Baku City Circuit Default State ──────────────────────────────────────────
// Official 51-lap Azerbaijan Grand Prix baseline

export const DEFAULT_RACE_STATE: RaceState = {
  circuitId: 'baku',
  currentLap: 24,
  totalLaps: 51,
  position: 3,
  currentCompound: 'MEDIUM',
  tireAge: 14,
  baseLapTimeSeconds: 103.5, // Baku ~1:43.500
  pitLaneLossSeconds: 20.8, // Baku ~20.8s pit delta
  weather: {
    condition: 'DRY',
    rainProbability: 0.08,
    rainCrossoverLap: null,
    trackTempC: 38.5,
    airTempC: 27.2,
  },
  safetyCar: {
    status: 'NONE',
    deployLap: 35,
    durationLaps: 5,
    activeNow: false,
  },
  rivals: [
    {
      id: 'rival-p4',
      name: 'P4 — Rival A',
      position: 4,
      gapToPlayerSeconds: 3.5,
      compound: 'MEDIUM',
      tireAge: 15,
      pitting: false,
      undercutThreat: false,
    },
    {
      id: 'rival-p6',
      name: 'P6 — Rival B',
      position: 6,
      gapToPlayerSeconds: -5.0,
      compound: 'SOFT',
      tireAge: 8,
      pitting: false,
      undercutThreat: false,
    },
  ],
  fuel: {
    fuelKgRemaining: 38.0,
    fuelKgPerLap: 1.3,
    fuelPaceSecPerKg: 0.03,
  },
  isOfficialScenario: false,
};
