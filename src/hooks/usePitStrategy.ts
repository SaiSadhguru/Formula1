import { useState, useCallback } from 'react';
import {
  compareStrategies,
  type StrategyInputs,
  type StrategyComparisonResult,
  type TireCompound,
} from '../utils/pitStrategyCalc.ts';

// Default starting inputs for a mid-race scenario
const DEFAULT_INPUTS: StrategyInputs = {
  totalLaps: 66,
  currentLap: 28,
  currentTireAge: 18,
  currentCompound: 'MEDIUM',
  baseLapTimeSeconds: 91.5,
  pitLaneLossSeconds: 22,
  safetyCar: false,
  safetyCarLaps: 5,
  safetyCarDeployLap: 35,
};

export function usePitStrategy() {
  const [inputs, setInputs] = useState<StrategyInputs>(DEFAULT_INPUTS);
  const [result, setResult] = useState<StrategyComparisonResult>(
    () => compareStrategies(DEFAULT_INPUTS),
  );

  const updateInput = useCallback(
    <K extends keyof StrategyInputs>(key: K, value: StrategyInputs[K]) => {
      setInputs((prev) => {
        const next = { ...prev, [key]: value };
        setResult(compareStrategies(next));
        return next;
      });
    },
    [],
  );

  const setCompound = useCallback(
    (compound: TireCompound) => updateInput('currentCompound', compound),
    [updateInput],
  );

  const setTotalLaps = useCallback(
    (v: number) => updateInput('totalLaps', Math.max(v, inputs.currentLap + 3)),
    [updateInput, inputs.currentLap],
  );

  const setCurrentLap = useCallback(
    (v: number) => updateInput('currentLap', Math.min(Math.max(1, v), inputs.totalLaps - 3)),
    [updateInput, inputs.totalLaps],
  );

  const setTireAge = useCallback(
    (v: number) => updateInput('currentTireAge', Math.max(0, v)),
    [updateInput],
  );

  const setPitLoss = useCallback(
    (v: number) => updateInput('pitLaneLossSeconds', Math.max(15, v)),
    [updateInput],
  );

  const setBaseLapTime = useCallback(
    (v: number) => updateInput('baseLapTimeSeconds', Math.max(60, v)),
    [updateInput],
  );

  const toggleSafetyCar = useCallback(
    () => updateInput('safetyCar', !inputs.safetyCar),
    [updateInput, inputs.safetyCar],
  );

  const setSafetyCarLap = useCallback(
    (v: number) => updateInput('safetyCarDeployLap', Math.max(inputs.currentLap + 1, v)),
    [updateInput, inputs.currentLap],
  );

  const setSafetyCarDuration = useCallback(
    (v: number) => updateInput('safetyCarLaps', Math.max(1, v)),
    [updateInput],
  );

  return {
    inputs,
    result,
    setCompound,
    setTotalLaps,
    setCurrentLap,
    setTireAge,
    setPitLoss,
    setBaseLapTime,
    toggleSafetyCar,
    setSafetyCarLap,
    setSafetyCarDuration,
  };
}
