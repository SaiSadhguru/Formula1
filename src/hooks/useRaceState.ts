import { useState, useCallback, useMemo } from 'react';
import {
  type RaceState,
  OFFICIAL_SCENARIO,
  DEFAULT_RACE_STATE,
  type WeatherCondition,
  type SafetyCarStatus,
  type Rival,
} from '../types/raceState.ts';
import {
  getCircuitById,
  type CircuitData,
} from '../types/circuits.ts';
import {
  compareStrategiesExtended,
  type ExtendedStrategyResult,
  type TireCompound,
} from '../utils/pitStrategyCalc.ts';

export function useRaceState() {
  const [raceState, setRaceState] = useState<RaceState>(OFFICIAL_SCENARIO);

  const activeCircuit: CircuitData = useMemo(() => {
    return getCircuitById(raceState.circuitId || 'baku');
  }, [raceState.circuitId]);

  const setCircuitId = useCallback((circuitId: string) => {
    const circuit = getCircuitById(circuitId);
    setRaceState((prev) => ({
      ...prev,
      circuitId: circuit.id,
      totalLaps: circuit.totalLaps,
      currentLap: Math.min(prev.currentLap, circuit.totalLaps - 1),
      baseLapTimeSeconds: circuit.baseLapTimeSeconds,
      pitLaneLossSeconds: circuit.pitLaneLossSeconds,
      weather: {
        ...prev.weather,
        trackTempC: circuit.weatherPreset.trackTempC,
        airTempC: circuit.weatherPreset.airTempC,
      },
      isOfficialScenario: false,
    }));
  }, []);

  const loadOfficialScenario = useCallback(() => {
    setRaceState(OFFICIAL_SCENARIO);
  }, []);

  const loadDefaultScenario = useCallback(() => {
    setRaceState(DEFAULT_RACE_STATE);
  }, []);

  const updateState = useCallback(<K extends keyof RaceState>(key: K, value: RaceState[K]) => {
    setRaceState((prev) => ({
      ...prev,
      [key]: value,
      isOfficialScenario: false,
    }));
  }, []);

  // Setters for race-state elements
  const setCurrentLap = useCallback((lap: number) => {
    setRaceState((prev) => ({
      ...prev,
      currentLap: Math.min(Math.max(1, lap), prev.totalLaps - 1),
      isOfficialScenario: false,
    }));
  }, []);

  const setTotalLaps = useCallback((laps: number) => {
    setRaceState((prev) => ({
      ...prev,
      totalLaps: Math.max(laps, prev.currentLap + 1),
      isOfficialScenario: false,
    }));
  }, []);

  const setCompound = useCallback((compound: TireCompound) => {
    setRaceState((prev) => ({
      ...prev,
      currentCompound: compound,
      isOfficialScenario: false,
    }));
  }, []);

  const setTireAge = useCallback((age: number) => {
    setRaceState((prev) => ({
      ...prev,
      tireAge: Math.max(0, age),
      isOfficialScenario: false,
    }));
  }, []);

  const setPosition = useCallback((pos: number) => {
    setRaceState((prev) => ({
      ...prev,
      position: Math.max(1, Math.min(20, pos)),
      isOfficialScenario: false,
    }));
  }, []);

  // Weather setters
  const setWeatherCondition = useCallback((condition: WeatherCondition) => {
    setRaceState((prev) => ({
      ...prev,
      weather: { ...prev.weather, condition },
      isOfficialScenario: false,
    }));
  }, []);

  const setRainProbability = useCallback((rainProbability: number) => {
    setRaceState((prev) => ({
      ...prev,
      weather: { ...prev.weather, rainProbability: Math.min(1, Math.max(0, rainProbability)) },
      isOfficialScenario: false,
    }));
  }, []);

  const setRainCrossoverLap = useCallback((lap: number | null) => {
    setRaceState((prev) => ({
      ...prev,
      weather: { ...prev.weather, rainCrossoverLap: lap },
      isOfficialScenario: false,
    }));
  }, []);

  // Safety Car setters
  const setSafetyCarStatus = useCallback((status: SafetyCarStatus) => {
    setRaceState((prev) => ({
      ...prev,
      safetyCar: {
        ...prev.safetyCar,
        status,
        activeNow: status === 'DEPLOYED' || status === 'VIRTUAL',
      },
      isOfficialScenario: false,
    }));
  }, []);

  const toggleSafetyCarNow = useCallback(() => {
    setRaceState((prev) => {
      const nextActive = !prev.safetyCar.activeNow;
      return {
        ...prev,
        safetyCar: {
          ...prev.safetyCar,
          status: nextActive ? 'DEPLOYED' : 'NONE',
          activeNow: nextActive,
        },
        isOfficialScenario: false,
      };
    });
  }, []);

  // Fuel setters
  const setFuelRemaining = useCallback((kg: number) => {
    setRaceState((prev) => ({
      ...prev,
      fuel: { ...prev.fuel, fuelKgRemaining: Math.max(0, kg) },
      isOfficialScenario: false,
    }));
  }, []);

  // Rivals setters
  const toggleRivalPitting = useCallback((rivalId: string) => {
    setRaceState((prev) => ({
      ...prev,
      rivals: prev.rivals.map((r) =>
        r.id === rivalId ? { ...r, pitting: !r.pitting } : r
      ),
      isOfficialScenario: false,
    }));
  }, []);

  const updateRival = useCallback((rivalId: string, partial: Partial<Rival>) => {
    setRaceState((prev) => ({
      ...prev,
      rivals: prev.rivals.map((r) => (r.id === rivalId ? { ...r, ...partial } : r)),
      isOfficialScenario: false,
    }));
  }, []);

  // Derived calculation
  const strategyResult: ExtendedStrategyResult = useMemo(() => {
    return compareStrategiesExtended({
      totalLaps: raceState.totalLaps,
      currentLap: raceState.currentLap,
      currentTireAge: raceState.tireAge,
      currentCompound: raceState.currentCompound,
      baseLapTimeSeconds: raceState.baseLapTimeSeconds,
      pitLaneLossSeconds: raceState.pitLaneLossSeconds,
      safetyCar: raceState.safetyCar.status !== 'NONE',
      safetyCarLaps: raceState.safetyCar.durationLaps,
      safetyCarDeployLap: raceState.safetyCar.deployLap,
      fuel: raceState.fuel,
      weather: raceState.weather,
      rivals: raceState.rivals,
      safetyCarActiveNow: raceState.safetyCar.activeNow,
    });
  }, [raceState]);

  return {
    raceState,
    activeCircuit,
    setCircuitId,
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
    setSafetyCarStatus,
    toggleSafetyCarNow,
    setFuelRemaining,
    toggleRivalPitting,
    updateRival,
    updateState,
  };
}
