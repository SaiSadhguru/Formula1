/**
 * APEX F1 — Component Configuration & Local Recommendation Engine
 *
 * Provides deterministic engineering recommendations covering aerodynamic,
 * mechanical, thermal, and powertrain compromises for Formula 1 car components.
 */

export type ComponentCategory = 'aero' | 'suspension' | 'cooling' | 'tyres' | 'powertrain' | 'drivetrain';

export interface CarComponent {
  id: string;
  name: string;
  category: ComponentCategory;
  hotspotId?: string;
  isConceptual: boolean;
  purpose: string;
  options: {
    key: string;
    label: string;
    type: 'slider' | 'segmented' | 'select';
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    choices?: { value: string | number; label: string }[];
    defaultValue: string | number;
  }[];
}

export const CAR_COMPONENTS: CarComponent[] = [
  {
    id: 'front-wing',
    name: 'Front Wing Assembly',
    category: 'aero',
    hotspotId: 'front-wing',
    isConceptual: false,
    purpose: 'Generates front downforce, commands aerodynamic balance, and conditions airflow around front wheels and floor entrance.',
    options: [
      {
        key: 'flapAngle',
        label: 'Flap Angle / Trim',
        type: 'slider',
        min: 18,
        max: 36,
        step: 1,
        unit: '°',
        defaultValue: 26,
      },
      {
        key: 'gurneyHeight',
        label: 'Gurney Flap',
        type: 'segmented',
        choices: [
          { value: 'none', label: 'None' },
          { value: '3mm', label: '3 mm' },
          { value: '6mm', label: '6 mm' },
        ],
        defaultValue: '3mm',
      },
    ],
  },
  {
    id: 'rear-wing',
    name: 'Rear Wing & Beam Wing',
    category: 'aero',
    hotspotId: 'drs-wing',
    isConceptual: false,
    purpose: 'Provides high-speed rear axle stability, downforce for traction, and conditions wake exit for floor diffuser extraction.',
    options: [
      {
        key: 'downforceLevel',
        label: 'Mainplane Camber Profile',
        type: 'segmented',
        choices: [
          { value: 'low', label: 'Low Downforce (Monza/Baku)' },
          { value: 'medium', label: 'Medium (Silverstone)' },
          { value: 'high', label: 'High (Monaco/Hungary)' },
        ],
        defaultValue: 'low',
      },
      {
        key: 'beamWingFlaps',
        label: 'Beam Wing Elements',
        type: 'segmented',
        choices: [
          { value: 'single', label: 'Single Element' },
          { value: 'stacked', label: 'Stacked Dual' },
        ],
        defaultValue: 'single',
      },
    ],
  },
  {
    id: 'floor-diffuser',
    name: 'Floor & Venturi Diffuser',
    category: 'aero',
    isConceptual: true,
    purpose: 'Generates up to 60% of total ground-effect downforce via Venturi tunnels with minimal induced drag penalty.',
    options: [
      {
        key: 'rideHeightFront',
        label: 'Front Static Ride Height',
        type: 'slider',
        min: 25,
        max: 45,
        step: 1,
        unit: 'mm',
        defaultValue: 30,
      },
      {
        key: 'rideHeightRear',
        label: 'Rear Static Ride Height',
        type: 'slider',
        min: 65,
        max: 95,
        step: 1,
        unit: 'mm',
        defaultValue: 76,
      },
    ],
  },
  {
    id: 'front-suspension',
    name: 'Front Pushrod Suspension',
    category: 'suspension',
    isConceptual: true,
    purpose: 'Controls front aerodynamic platform height under braking pitch and delivers mechanical turn-in grip.',
    options: [
      {
        key: 'heaveSpringRate',
        label: 'Third / Heave Spring Stiffness',
        type: 'segmented',
        choices: [
          { value: 'soft', label: 'Soft (Kerb Compliance)' },
          { value: 'medium', label: 'Medium' },
          { value: 'stiff', label: 'Stiff (Aero Platform)' },
        ],
        defaultValue: 'medium',
      },
      {
        key: 'antiRollBarFront',
        label: 'Front Anti-Roll Bar',
        type: 'slider',
        min: 1,
        max: 7,
        step: 1,
        unit: 'stiff',
        defaultValue: 4,
      },
    ],
  },
  {
    id: 'rear-suspension',
    name: 'Rear Pullrod Suspension',
    category: 'suspension',
    isConceptual: true,
    purpose: 'Stabilizes rear ride-height platform across varying fuel loads and ensures traction under heavy corner exit.',
    options: [
      {
        key: 'antiSquatGeometry',
        label: 'Anti-Squat Inclination',
        type: 'slider',
        min: 20,
        max: 70,
        step: 5,
        unit: '%',
        defaultValue: 45,
      },
      {
        key: 'camberRear',
        label: 'Rear Static Camber',
        type: 'slider',
        min: -2.2,
        max: -1.0,
        step: 0.1,
        unit: '°',
        defaultValue: -1.6,
      },
    ],
  },
  {
    id: 'sidepods-cooling',
    name: 'Sidepods & Cooling Louvres',
    category: 'cooling',
    isConceptual: true,
    purpose: 'Channels radiator airflow to cool internal combustion engine and ERS battery packs while controlling wake to the rear wing.',
    options: [
      {
        key: 'louvreOpenPct',
        label: 'Cooling Louvre Exit Aperture',
        type: 'segmented',
        choices: [
          { value: '25', label: '25% (Quali / Cold)' },
          { value: '50', label: '50% (Standard)' },
          { value: '75', label: '75% (Hot Race)' },
          { value: '100', label: '100% (Extreme Temp)' },
        ],
        defaultValue: '50',
      },
    ],
  },
  {
    id: 'brake-ducts',
    name: 'Brake Ducts & Caliper Shrouds',
    category: 'cooling',
    isConceptual: true,
    purpose: 'Maintains carbon disc temperatures between 350°C and 800°C and radiates heat into the wheel rims for tyre warm-up.',
    options: [
      {
        key: 'inletSize',
        label: 'Carbon Scoop Inlet Blanking',
        type: 'segmented',
        choices: [
          { value: 'small', label: 'Blanked / Low Drag' },
          { value: 'medium', label: 'Medium Aperture' },
          { value: 'large', label: 'Open / Heavy Braking' },
        ],
        defaultValue: 'large',
      },
      {
        key: 'biasBalance',
        label: 'Default Brake Bias (Front)',
        type: 'slider',
        min: 52,
        max: 60,
        step: 0.5,
        unit: '%',
        defaultValue: 55.5,
      },
    ],
  },
  {
    id: 'tyres',
    name: 'Tyre Allocation & Pressures',
    category: 'tyres',
    hotspotId: 'wheels',
    isConceptual: false,
    purpose: 'Provides sole mechanical contact patch with the asphalt; determines thermal degradation curves and traction limits.',
    options: [
      {
        key: 'startingCompound',
        label: 'Race Starting Compound',
        type: 'segmented',
        choices: [
          { value: 'SOFT', label: 'Soft C4 (Aggressive)' },
          { value: 'MEDIUM', label: 'Medium C3 (Baseline)' },
          { value: 'HARD', label: 'Hard C2 (Long Stint)' },
        ],
        defaultValue: 'MEDIUM',
      },
      {
        key: 'frontPressurePsi',
        label: 'Front Starting Pressure',
        type: 'slider',
        min: 22.0,
        max: 25.0,
        step: 0.5,
        unit: 'psi',
        defaultValue: 23.5,
      },
    ],
  },
  {
    id: 'power-unit',
    name: '1.6L V6 Turbo ERS Deployment',
    category: 'powertrain',
    hotspotId: 'engine',
    isConceptual: false,
    purpose: 'Hybrid powertrain orchestrating 1.6L internal combustion unit with 350kW MGU-K kinetic electrical harvesting and boost.',
    options: [
      {
        key: 'ersDeployMode',
        label: 'ERS Deployment Mapping',
        type: 'segmented',
        choices: [
          { value: 'balanced', label: 'Balanced Energy' },
          { value: 'overtake', label: 'Overtake / Attack' },
          { value: 'harvest', label: 'Harvest / Charge' },
        ],
        defaultValue: 'balanced',
      },
      {
        key: 'fuelMix',
        label: 'Engine Mixture Mode',
        type: 'segmented',
        choices: [
          { value: 'lean', label: 'Lean (Target Delta)' },
          { value: 'standard', label: 'Standard Map 1' },
          { value: 'rich', label: 'Rich (Maximum Power)' },
        ],
        defaultValue: 'standard',
      },
    ],
  },
  {
    id: 'gearbox-differential',
    name: '8-Speed Gearbox & Differential',
    category: 'drivetrain',
    isConceptual: true,
    purpose: 'Transfers torque to the rear wheels; electronic differential manages rotational lock under corner entry and exit traction.',
    options: [
      {
        key: 'diffEntry',
        label: 'Differential Entry Lock',
        type: 'slider',
        min: 45,
        max: 85,
        step: 5,
        unit: '%',
        defaultValue: 60,
      },
      {
        key: 'diffExit',
        label: 'Differential Exit Traction Lock',
        type: 'slider',
        min: 50,
        max: 95,
        step: 5,
        unit: '%',
        defaultValue: 75,
      },
    ],
  },
  {
    id: 'drs-configuration',
    name: 'Active DRS Wing Actuator',
    category: 'aero',
    hotspotId: 'drs-wing',
    isConceptual: false,
    purpose: 'Hydraulic actuator opening upper rear wing flap in designated DRS zones to shed drag down high-speed straights.',
    options: [
      {
        key: 'actuatorSpeed',
        label: 'Actuator Hydraulic Response',
        type: 'segmented',
        choices: [
          { value: 'standard', label: 'Standard (0.18s)' },
          { value: 'aggressive', label: 'Aggressive (0.14s)' },
        ],
        defaultValue: 'aggressive',
      },
    ],
  },
  {
    id: 'mechanical-balance',
    name: 'Ballast & Weight Distribution',
    category: 'suspension',
    isConceptual: true,
    purpose: 'Fine-tunes front-to-rear center of gravity to optimize braking stability and corner entry rotation.',
    options: [
      {
        key: 'frontWeightPct',
        label: 'Front Static Weight Bias',
        type: 'slider',
        min: 44.5,
        max: 46.5,
        step: 0.2,
        unit: '%',
        defaultValue: 45.4,
      },
    ],
  },
];

export interface StrategyReport {
  recommendation: string;
  mainBenefit: string;
  mainCompromise: string;
  circuitRationale: string;
  tyreImplication: string;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  assumptions: string[];
  validationNotes: string;
}

/**
 * Deterministic local rule-based engineering analysis engine
 */
export function getLocalEngineeringRecommendation(
  componentId: string,
  circuitId: string,
  target: string,
  currentSetup: Record<string, any>
): StrategyReport {
  const isBaku = circuitId.toLowerCase().includes('baku');

  switch (componentId) {
    case 'rear-wing':
      if (isBaku) {
        return {
          recommendation: 'Configure Low Downforce mainplane with single-element beam wing.',
          mainBenefit: '+8 to +12 km/h terminal velocity along the 2.2 km Neftchilar Avenue straight.',
          mainCompromise: 'Increased sliding through Castle turns 8–11 and extended braking distances into Turns 1, 3, and 15.',
          circuitRationale: 'Baku features the longest full-throttle straight on the calendar (2.2 km). Excessive rear wing angle creates parasitic drag that leaves the car vulnerable to rival DRS overtakes.',
          tyreImplication: 'Slightly higher rear slip angle through technical 90° bends; thermal degradation increases by ~0.006s/lap on Softs.',
          confidenceLevel: 'HIGH',
          assumptions: ['Simulated ambient temperature: 28°C–32°C', 'DRS flap opening compliant with FIA 85mm regulation'],
          validationNotes: 'Verify GPS speed-trap delta against benchmark telemetry at Turn 1 speed trap.',
        };
      }
      return {
        recommendation: 'Adopt Medium-High downforce package for balanced aerodynamic platform.',
        mainBenefit: 'High lateral grip in high-speed direction changes and reduced tyre graining.',
        mainCompromise: '-4 km/h top speed penalty on main straights.',
        circuitRationale: 'Standard aerodynamic profile favors corner minimum speed and downforce stability under sustained yaw.',
        tyreImplication: 'Preserves tyre surface by mitigating micro-slides across high-load lateral corners.',
        confidenceLevel: 'HIGH',
        assumptions: ['Clean air conditions', 'Nominal ride-height platform control'],
        validationNotes: 'Monitor driver throttle application point in FP1 high-speed sectors.',
      };

    case 'front-wing':
      return {
        recommendation: isBaku
          ? 'Reduce flap angle to 24°–26° to match low-downforce rear wing balance.'
          : 'Run 28°–30° flap angle to sharpen turn-in response.',
        mainBenefit: 'Prevents aerodynamic pitch-induced oversteer at high speeds while providing crisp low-speed turn-in.',
        mainCompromise: 'Risk of mild understeer in medium-speed transitions if rear platform squats under acceleration.',
        circuitRationale: isBaku
          ? 'Baku requires an aero balance shifted slightly rearward to maintain rear axle confidence in 200 km/h braking zones.'
          : 'High front grip is essential for fast directional changes and apex acquisition.',
        tyreImplication: 'Reduces front tire shoulder thermal blister risk by avoiding sustained high-slip scrubbing.',
        confidenceLevel: 'HIGH',
        assumptions: ['Symmetric front tyre pressure target 23.5 psi', 'Ground-effect floor sealing intact'],
        validationNotes: 'Check driver steering angle trace in apex transition of Turn 3.',
      };

    case 'brake-ducts':
      return {
        recommendation: isBaku
          ? 'Open brake duct blanks to Large profile (60%–75% cooling flow).'
          : 'Medium inlet aperture with selective front hub blanking.',
        mainBenefit: 'Prevents carbon disc oxidation and fluid boil across severe braking stops from >330 km/h into 90° street corners.',
        mainCompromise: '~0.15% aero drag increase on primary straights.',
        circuitRationale: isBaku
          ? 'Turns 1, 3, and 15 are among the highest braking energy events in F1 (>2,400 kW per axle). Inadequate cooling risks catastrophic disc failure.'
          : 'Standard thermal loading allows smaller ducts for lower aerodynamic drag penalty.',
        tyreImplication: 'Radiates steady thermal energy to the inner wheel rim, keeping front Pirelli tyres within their 100°C–110°C window.',
        confidenceLevel: 'HIGH',
        assumptions: ['Peak brake rotor temp < 950°C', 'Carbon-carbon disc friction coefficient 0.48'],
        validationNotes: 'Inspect infrared brake temperature telemetry on pit entry in FP1 long runs.',
      };

    case 'floor-diffuser':
      return {
        recommendation: isBaku
          ? 'Set front ride height to 32 mm, rear ride height to 78 mm (moderate rake).'
          : 'Set front ride height to 28 mm, rear ride height to 72 mm (low platform).',
        mainBenefit: 'Maintains steady Venturi suction without inducing high-speed porpoising over street asphalt undulations.',
        mainCompromise: 'Sacrifices ~35 kg of peak ground-effect downforce compared to ultra-low ride height configurations.',
        circuitRationale: 'Street circuits contain road crown, drain covers, and surface bumps that break diffuser edge seals if ground clearance is too low.',
        tyreImplication: 'Steady platform reduces abrupt lateral load transfers that cause tyre graining.',
        confidenceLevel: 'MEDIUM',
        assumptions: ['Skid-block titanium plank wear complies with FIA 1mm tolerance rule'],
        validationNotes: 'Monitor accelerometer vertical G-forces along main straight for onset of aerodynamic bouncing.',
      };

    case 'tyres':
      return {
        recommendation: isBaku
          ? 'Commence Grand Prix on C3 Yellow Medium, switching to C2 White Hard around Lap 22–26 (One-Stop strategy).'
          : 'Target standard C4 Soft / C3 Medium qualifying strategy.',
        mainBenefit: 'Guarantees pit window flexibility during the statistically probable Baku Safety Car deployment (>75% likelihood).',
        mainCompromise: 'P1-lap traction delta of +0.35s relative to rivals starting on fresh Soft tyres.',
        circuitRationale: 'Starting on Softs on street asphalt leaves the car vulnerable to thermal overheating and an uncomfortably early pit stop into traffic.',
        tyreImplication: 'Medium compound offers a 28-lap degradation cliff, providing ample margin until the Hard tyre crossover.',
        confidenceLevel: 'HIGH',
        assumptions: ['Track temp 36°C–42°C', 'No rain in initial 20 laps'],
        validationNotes: 'Evaluate front-left graining severity after 10-lap continuous FP2 stint.',
      };

    default:
      return {
        recommendation: `Calibrate ${componentId.replace('-', ' ')} according to ${target.toUpperCase()} target profile.`,
        mainBenefit: 'Harmonizes mechanical setup with aerodynamic downforce balance.',
        mainCompromise: 'Requires precise driver adaptation and tyre temperature management.',
        circuitRationale: `Optimization tuned for ${isBaku ? 'Baku City Circuit low-drag street characteristics' : 'circuit reference profile'}.`,
        tyreImplication: 'Maintains uniform temperature distribution across all four tyre carcasses.',
        confidenceLevel: 'MEDIUM',
        assumptions: ['Standard FIA technical regulations', 'Baseline telemetry values within nominal tolerance'],
        validationNotes: 'Cross-reference driver feedback with suspension potentiometer data.',
      };
  }
}
