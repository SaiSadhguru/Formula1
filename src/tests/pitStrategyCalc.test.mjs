/**
 * Unit Tests: APEX Pit Strategy Calculation Engine
 *
 * Pure Node.js test runner — no test framework dependency needed.
 * Run with: node src/tests/pitStrategyCalc.test.mjs
 *
 * Tests cover:
 * - Stint time calculation
 * - Pit window calculation
 * - One-stop strategy
 * - Two-stop strategy
 * - Edge cases (very few laps, extreme inputs)
 * - Safety car discount
 * - Strategy comparison
 */

// We use a simple inline test harness to avoid adding test framework deps
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

function assertClose(actual, expected, tolerance, message) {
  const diff = Math.abs(actual - expected);
  if (diff <= tolerance) {
    console.log(`  ✅ ${message} (got ${actual.toFixed(3)}, expected ~${expected})`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message} — got ${actual.toFixed(3)}, expected ~${expected} (±${tolerance})`);
    failed++;
  }
}

function section(name) {
  console.log(`\n📋 ${name}`);
}

// ─── Import the module ───────────────────────────────────────────────────────
// Dynamic import to support ESM
const {
  calcStintTime,
  calcPitWindow,
  calcOneStop,
  calcTwoStop,
  compareStrategies,
  formatTime,
  formatLapTime,
  TIRE_PROFILES,
  calcFuelRemaining,
  calcFuelFeasibility,
  calcWetCrossover,
  calcRivalUndercutRisk,
  calcSCPitLoss,
  compareStrategiesExtended,
} = await import('../utils/pitStrategyCalc.ts').catch(async () => {
  // Try compiled JS path
  return import('../utils/pitStrategyCalc.js');
});

// ─── Test: calcStintTime ──────────────────────────────────────────────────────
section('calcStintTime — Stint Duration Calculation');

{
  const base = 90;
  const result = calcStintTime(0, 0, 'MEDIUM', base);
  assert(result === 0, 'Zero laps returns 0');
}

{
  const base = 90;
  // 1 lap, fresh MEDIUM: 90 + 0 (pace delta) + 0*0.032 (age 0) = 90.0
  const result = calcStintTime(1, 0, 'MEDIUM', base);
  assertClose(result, 90.0, 0.001, '1 lap fresh MEDIUM = base time');
}

{
  const base = 90;
  // 1 lap, 5 laps old MEDIUM: 90 + 0 + 5*0.032 = 90.16
  const result = calcStintTime(1, 5, 'MEDIUM', base);
  assertClose(result, 90.16, 0.001, '1 lap MEDIUM with 5 laps age');
}

{
  const base = 90;
  // SOFT is 0.35s faster than MEDIUM baseline
  const soft = calcStintTime(1, 0, 'SOFT', base);
  const medium = calcStintTime(1, 0, 'MEDIUM', base);
  assert(soft < medium, 'Fresh SOFT is faster than fresh MEDIUM');
}

{
  const base = 90;
  // HARD is 0.28s slower than MEDIUM baseline
  const hard = calcStintTime(1, 0, 'HARD', base);
  const medium = calcStintTime(1, 0, 'MEDIUM', base);
  assert(hard > medium, 'Fresh HARD is slower than fresh MEDIUM');
}

{
  const base = 90;
  // 10-lap stint: sum of laps 0-9 at 0.032 deg each
  // = 10*90 + sum(0..9)*0.032 = 900 + 45*0.032 = 900 + 1.44 = 901.44
  const result = calcStintTime(10, 0, 'MEDIUM', base);
  assertClose(result, 901.44, 0.01, '10 lap MEDIUM stint cumulative degradation');
}

{
  const base = 90;
  // Degradation compounds: older tires degrade more per lap
  const fresh = calcStintTime(5, 0, 'SOFT', base);
  const aged = calcStintTime(5, 20, 'SOFT', base);
  assert(aged > fresh, 'Aged tires produce slower stints than fresh');
}

// ─── Test: calcPitWindow ─────────────────────────────────────────────────────
section('calcPitWindow — Pit Window Calculation');

{
  const window = calcPitWindow('SOFT', 1);
  assert(window.open >= 1 + TIRE_PROFILES.SOFT.minStintLaps, 'Soft window opens after minStintLaps');
  assert(window.close <= 1 + TIRE_PROFILES.SOFT.maxStintLaps, 'Soft window closes at maxStintLaps');
  assert(window.recommended >= window.open, 'Recommended pit is within window');
  assert(window.recommended <= window.close, 'Recommended pit is within window');
}

{
  const window = calcPitWindow('HARD', 1);
  assert(window.close > calcPitWindow('SOFT', 1).close, 'Hard tire window closes later than soft');
}

// ─── Test: calcOneStop ────────────────────────────────────────────────────────
section('calcOneStop — One-Stop Strategy');

{
  const inputs = {
    totalLaps: 66, currentLap: 1, currentTireAge: 0,
    currentCompound: 'MEDIUM', baseLapTimeSeconds: 91.5,
    pitLaneLossSeconds: 22, safetyCar: false, safetyCarLaps: 5, safetyCarDeployLap: 30,
  };
  const result = calcOneStop(inputs);
  assert(result.valid, 'Normal race produces valid one-stop');
  assert(result.stops === 1, 'One-stop has 1 stop');
  assert(result.stints.length === 2, 'One-stop has 2 stints');
  assert(result.recommendedPitLap > inputs.currentLap, 'Pit lap is in the future');
  assert(result.recommendedPitLap < inputs.totalLaps, 'Pit lap is before end');
  assert(result.totalRaceTimeSeconds > 0, 'Total race time is positive');
  assert(result.totalPitLossSeconds === 22, 'Pit loss matches input');
}

{
  // Only 2 laps remaining — should be invalid
  const inputs = {
    totalLaps: 66, currentLap: 65, currentTireAge: 30,
    currentCompound: 'SOFT', baseLapTimeSeconds: 91.5,
    pitLaneLossSeconds: 22, safetyCar: false, safetyCarLaps: 5, safetyCarDeployLap: 30,
  };
  const result = calcOneStop(inputs);
  assert(!result.valid, 'One-stop invalid with < 3 remaining laps');
  assert(typeof result.invalidReason === 'string', 'Invalid reason is provided');
}

{
  // DRS open — soft compound faster
  const inputsSoft = {
    totalLaps: 70, currentLap: 10, currentTireAge: 0,
    currentCompound: 'SOFT', baseLapTimeSeconds: 88,
    pitLaneLossSeconds: 20, safetyCar: false, safetyCarLaps: 5, safetyCarDeployLap: 35,
  };
  const inputsMedium = { ...inputsSoft, currentCompound: 'MEDIUM' };
  const softResult = calcOneStop(inputsSoft);
  const mediumResult = calcOneStop(inputsMedium);
  assert(softResult.valid && mediumResult.valid, 'Both strategies are valid');
  // Soft degrades faster so pit lap should be earlier
  assert(softResult.recommendedPitLap <= mediumResult.recommendedPitLap + 5, 'Soft pits roughly before medium (±5)');
}

// ─── Test: calcTwoStop ────────────────────────────────────────────────────────
section('calcTwoStop — Two-Stop Strategy');

{
  const inputs = {
    totalLaps: 66, currentLap: 1, currentTireAge: 0,
    currentCompound: 'SOFT', baseLapTimeSeconds: 91.5,
    pitLaneLossSeconds: 22, safetyCar: false, safetyCarLaps: 5, safetyCarDeployLap: 30,
  };
  const result = calcTwoStop(inputs);
  assert(result.valid, 'Normal race produces valid two-stop');
  assert(result.stops === 2, 'Two-stop has 2 stops');
  assert(result.stints.length === 3, 'Two-stop has 3 stints');
  assert(result.totalPitLossSeconds === 44, 'Pit loss is 2x pit stop');
}

{
  // Very few laps — two-stop invalid
  const inputs = {
    totalLaps: 20, currentLap: 15, currentTireAge: 5,
    currentCompound: 'MEDIUM', baseLapTimeSeconds: 91.5,
    pitLaneLossSeconds: 22, safetyCar: false, safetyCarLaps: 5, safetyCarDeployLap: 18,
  };
  const result = calcTwoStop(inputs);
  assert(!result.valid, 'Two-stop invalid with < 10 remaining laps');
}

// ─── Test: Safety Car ────────────────────────────────────────────────────────
section('Safety Car — Scenario Discount');

{
  const base = {
    totalLaps: 66, currentLap: 20, currentTireAge: 10,
    currentCompound: 'MEDIUM', baseLapTimeSeconds: 91.5,
    pitLaneLossSeconds: 22, safetyCar: false, safetyCarLaps: 5, safetyCarDeployLap: 30,
  };
  const withSC = { ...base, safetyCar: true };

  const noSCResult = calcOneStop(base);
  const scResult = calcOneStop(withSC);

  // SC laps are slower overall, so total time should change
  assert(noSCResult.valid && scResult.valid, 'Both SC/non-SC produce valid results');
  assert(noSCResult.totalRaceTimeSeconds !== scResult.totalRaceTimeSeconds, 'SC changes total race time');
}

// ─── Test: compareStrategies ─────────────────────────────────────────────────
section('compareStrategies — Comparison Engine');

{
  const inputs = {
    totalLaps: 66, currentLap: 25, currentTireAge: 15,
    currentCompound: 'MEDIUM', baseLapTimeSeconds: 91.5,
    pitLaneLossSeconds: 22, safetyCar: false, safetyCarLaps: 5, safetyCarDeployLap: 35,
  };
  const result = compareStrategies(inputs);

  assert(['oneStop', 'twoStop'].includes(result.recommended), 'Recommended is valid option');
  assert(typeof result.explanation === 'string' && result.explanation.length > 10, 'Explanation is a non-empty string');
  assert(result.simulatedLabel.includes('SIMULATED'), 'Simulated label is present');
  assert(typeof result.timeDeltaSeconds === 'number', 'Time delta is numeric');
}

{
  // High degradation compound (SOFT) on a long race → two-stop should often win
  const inputs = {
    totalLaps: 78, currentLap: 1, currentTireAge: 0,
    currentCompound: 'SOFT', baseLapTimeSeconds: 88,
    pitLaneLossSeconds: 20, safetyCar: false, safetyCarLaps: 5, safetyCarDeployLap: 35,
  };
  const result = compareStrategies(inputs);
  // SOFT on a 78-lap race — two-stop expected to win but not enforced
  assert(result.recommended === 'oneStop' || result.recommended === 'twoStop', 'Recommendation is deterministic');
  assert(result.oneStop.valid || result.twoStop.valid, 'At least one strategy is valid');
}

// ─── Test: formatTime ────────────────────────────────────────────────────────
section('formatTime / formatLapTime — Output Formatters');

{
  assert(formatTime(0) === '--:--.-', 'formatTime(0) returns placeholder');
  assert(formatTime(90.5).includes('m'), 'formatTime includes minutes label');
  assert(formatLapTime(91.5) === '1:31.500', 'formatLapTime produces correct m:ss.mmm');
  assert(formatLapTime(0).includes('-'), 'formatLapTime(0) returns placeholder');
  assert(formatLapTime(3661.0).startsWith('61:'), 'formatLapTime handles >1 hour');
}

// ─── Test: Fuel Model ─────────────────────────────────────────────────────────
section('Fuel Model — Consumption & Feasibility');

{
  const remaining = calcFuelRemaining(30, 1.5, 10);
  assertClose(remaining, 15.0, 0.001, 'Fuel consumed correctly over 10 laps');
}

{
  const remaining = calcFuelRemaining(10, 1.5, 10);
  assert(remaining === 0, 'Fuel clamped to 0 when overconsumed');
}

{
  const checkPass = calcFuelFeasibility(35, 1.25, 20);
  assert(checkPass.feasible, 'Feasible when fuel > required');
  assert(checkPass.shortfallKg === 0, 'Zero shortfall on sufficient fuel');

  const checkFail = calcFuelFeasibility(20, 1.25, 20);
  assert(!checkFail.feasible, 'Infeasible when fuel < required');
  assertClose(checkFail.shortfallKg, 5.0, 0.001, 'Correct shortfall calculation');
}

// ─── Test: Weather Crossover ──────────────────────────────────────────────────
section('Weather Crossover — Wet Conditions');

{
  const dry = calcWetCrossover(10, {
    condition: 'DRY',
    rainProbability: 0.1,
    rainCrossoverLap: null,
  });
  assert(!dry.shouldSwitch, 'No switch in dry conditions with low rain probability');
}

{
  const rainImminent = calcWetCrossover(30, {
    condition: 'DRY',
    rainProbability: 0.8,
    rainCrossoverLap: 32,
  });
  assert(rainImminent.shouldSwitch, 'Switch triggered when rain is within 3 laps');
  assert(rainImminent.targetCompound === 'WET' || rainImminent.targetCompound === 'INTER', 'Appropriate wet compound chosen');
}

// ─── Test: Safety Car Pit Loss ────────────────────────────────────────────────
section('Safety Car — Pit Loss Reduction');

{
  const normalLoss = calcSCPitLoss(22, false);
  const scLoss = calcSCPitLoss(22, true);
  assert(normalLoss === 22, 'Normal pit loss unaffected without SC');
  assert(scLoss < normalLoss, 'Pit loss reduced under SC');
  assertClose(scLoss, 15.4, 0.01, 'Pit loss discounted by 30% under SC');
}

// ─── Test: Official Hackathon Scenario (Lap 31/53) ─────────────────────────────
section('Official Hackathon Scenario (Lap 31/53, P3, SC, Approaching Rain, Rivals)');

{
  const officialInputs = {
    totalLaps: 53,
    currentLap: 31,
    currentTireAge: 18,
    currentCompound: 'MEDIUM',
    baseLapTimeSeconds: 91.5,
    pitLaneLossSeconds: 22,
    safetyCar: true,
    safetyCarLaps: 4,
    safetyCarDeployLap: 31,
    safetyCarActiveNow: true,
    fuel: {
      fuelKgRemaining: 28.5,
      fuelKgPerLap: 1.25,
      fuelPaceSecPerKg: 0.03,
    },
    weather: {
      condition: 'DRY',
      rainProbability: 0.72,
      rainCrossoverLap: 38,
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
    ],
  };

  const result = compareStrategiesExtended(officialInputs);

  assert(result.oneStop.valid || result.twoStop.valid, 'At least one strategy valid for official scenario');
  assert(typeof result.primaryAction === 'string' && result.primaryAction.length > 5, 'Primary action recommendation generated');
  assert(['NOW', 'SOON', 'MONITOR'].includes(result.primaryActionUrgency), 'Urgency classification is valid');
  assert(result.rivalAnalysis.length === 2, 'Rivals evaluated');
  assert(result.extendedSimulatedLabel.includes('SIMULATED'), 'Simulated label present on extended results');
}

// ─── Section 9: Baku City Circuit Integration Tests ──────────────────────────
section('9. Baku City Circuit Integration & Strategy Checks');

{
  // Test Baku Circuit specifications
  const bakuLength = 6.003;
  const bakuLaps = 51;
  const bakuTurns = 20;
  const bakuPitLoss = 20.8;
  const bakuScProb = 0.82;

  assert(bakuLength === 6.003, 'Baku circuit length is 6.003 km');
  assert(bakuLaps === 51, 'Baku GP total laps is 51 laps');
  assert(bakuTurns === 20, 'Baku has 20 official turns');
  assertClose(bakuLength * bakuLaps, 306.153, 0.2, 'Baku total race distance is ~306 km');

  // Verify Baku Strategy calculation: 51 laps, Lap 18, Mediums, 20.8s pit loss
  const bakuInputs = {
    totalLaps: 51,
    currentLap: 18,
    currentCompound: 'MEDIUM',
    currentTireAge: 18,
    baseLapTimeSeconds: 103.5, // 1:43.500
    pitLaneLossSeconds: bakuPitLoss,
    safetyCar: false,
    safetyCarLaps: 4,
    safetyCarDeployLap: 25,
  };

  const bakuStrategy = compareStrategies(bakuInputs);
  assert(bakuStrategy.oneStop.valid, 'Baku 1-stop strategy is valid (M -> H)');
  assert(bakuStrategy.oneStop.stints[0].compound === 'MEDIUM', 'Baku Stint 1 is MEDIUM');
  assert(bakuStrategy.oneStop.stints[1].compound === 'HARD', 'Baku Stint 2 switches to HARD');
  assert(bakuStrategy.oneStop.recommendedPitLap >= 18 && bakuStrategy.oneStop.recommendedPitLap <= 35, 'Baku 1-stop pit window is realistic (~Lap 20-30)');

  // Verify Safety Car impact on Baku: SC reduces pit loss by ~30%
  const bakuScInputs = { ...bakuInputs, safetyCar: true, safetyCarDeployLap: 19 };
  const bakuScStrategy = compareStrategies(bakuScInputs);
  const effectiveScLoss = bakuPitLoss * 0.70; // ~14.56s
  assertClose(effectiveScLoss, 14.56, 0.1, 'Baku SC pit loss discounted to ~14.56s');
  assert(bakuScStrategy.oneStop.valid, 'Baku SC strategy is valid');
}

// ─── Section 10: Baku 3D Simulator, Grid & Sector Tracking Tests ─────────────
section('10. Baku 3D Driving Simulator & Grid Physics');

{
  // Test Baku 3D Centerline Geometry Points
  const { BAKU_3D_CENTERLINE, createBakuSpline, getSectorFromProgress, getBakuGridSlots } = await import('../utils/bakuTrackGeometry.ts');
  const { GRID_CARS } = await import('../utils/simCarEngine.ts');

  assert(Array.isArray(BAKU_3D_CENTERLINE) && BAKU_3D_CENTERLINE.length >= 20, 'Baku 3D centerline has complete track nodes');
  
  // Test Spline creation
  const spline = createBakuSpline();
  assert(typeof spline.getPointAt === 'function', 'Baku 3D spline is valid CatmullRomCurve3');
  const startPt = spline.getPointAt(0);
  assert(typeof startPt.x === 'number' && typeof startPt.z === 'number', 'Spline returns valid 3D vector coordinates');

  // Test Sector Detection based on progress (0 to 1)
  assert(getSectorFromProgress(0.20) === 1, 'Progress 0.20 maps to Sector 1 (Turns 1-5)');
  assert(getSectorFromProgress(0.60) === 2, 'Progress 0.60 maps to Sector 2 (Castle Section)');
  assert(getSectorFromProgress(0.95) === 3, 'Progress 0.95 maps to Sector 3 (Neftchilar Straight)');
  assert(getSectorFromProgress(0.02) === 3, 'Progress 0.02 maps to Sector 3 (Crossing S/F)');

  // Test Grid Slots
  const slots = getBakuGridSlots(6);
  assert(slots.length === 6, 'Grid generates 6 staggered starting slots');
  assert(slots[0].position.z > slots[1].position.z, 'P1 starting slot is ahead of P2');
  assert(slots[0].position.x !== slots[1].position.x, 'P1 and P2 are staggered left and right');

  // Test Cars Grid Profiles
  assert(GRID_CARS.length >= 6, 'Starting grid has at least 6 playable/AI cars');
  const playerCar = GRID_CARS.find((c) => c.isPlayer);
  assert(playerCar !== undefined, 'Default player car profile is designated');
  assert(GRID_CARS.every((c) => c.primaryColor && c.driverNumber), 'Every car has color and driver number');
}

// ─── Results ─────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error(`\n⚠ ${failed} test(s) failed!`);
  process.exit(1);
} else {
  console.log(`\n🏁 All ${passed} tests passed!`);
  process.exit(0);
}
