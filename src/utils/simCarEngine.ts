import * as THREE from 'three';

export interface CarPhysicsState {
  x: number;
  z: number;
  heading: number; // in radians (0 = along +Z axis)
  speed: number; // in m/s (30 m/s = 108 km/h, 90 m/s = 324 km/h)
  steerAngle: number;
  lap: number;
  sector: 1 | 2 | 3;
  progress: number; // 0..1 normalized track progress
  crossedSFLastFrame: boolean;
  lapStartTime: number;
  currentLapTime: number;
  bestLapTime: number | null;
  offTrack: boolean;
  gear: number;
  rpm: number;
}

export interface InputControls {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  handbrake: boolean;
  reset: boolean;
}

export interface SimCarProfile {
  id: string;
  name: string;
  team: string;
  primaryColor: string;
  accentColor: string;
  driverNumber: number;
  driverName: string;
  isPlayer: boolean;
}

export const GRID_CARS: SimCarProfile[] = [
  {
    id: 'audi-green',
    name: 'Audi Revolut 2026',
    team: 'Audi Sport F1',
    primaryColor: '#66ff00',
    accentColor: '#121418',
    driverNumber: 27,
    driverName: 'N. HÜLKENBERG',
    isPlayer: true,
  },
  {
    id: 'stealth-red',
    name: 'Ferrari Rosso Corsa',
    team: 'Scuderia Ferrari',
    primaryColor: '#e10600',
    accentColor: '#ffffff',
    driverNumber: 16,
    driverName: 'C. LECLERC',
    isPlayer: false,
  },
  {
    id: 'redbull-blue',
    name: 'Red Bull RB22',
    team: 'Oracle Red Bull Racing',
    primaryColor: '#00205b',
    accentColor: '#ffd700',
    driverNumber: 1,
    driverName: 'M. VERSTAPPEN',
    isPlayer: false,
  },
  {
    id: 'mercedes-silver',
    name: 'Mercedes-AMG W17',
    team: 'Mercedes-AMG PETRONAS',
    primaryColor: '#00a19c',
    accentColor: '#c0c0c0',
    driverNumber: 63,
    driverName: 'G. RUSSELL',
    isPlayer: false,
  },
  {
    id: 'mclaren-papaya',
    name: 'McLaren MCL40',
    team: 'McLaren F1 Team',
    primaryColor: '#ff8700',
    accentColor: '#00f0ff',
    driverNumber: 4,
    driverName: 'L. NORRIS',
    isPlayer: false,
  },
  {
    id: 'aston-green',
    name: 'Aston Martin AMR26',
    team: 'Aston Martin Aramco',
    primaryColor: '#00594f',
    accentColor: '#cedc00',
    driverNumber: 14,
    driverName: 'F. ALONSO',
    isPlayer: false,
  },
];

/**
 * Creates high-fidelity, open-wheel Formula 1 race car geometry:
 * - Exposed wide 18-inch Pirelli wheels with yellow/red sidewall rings and carbon wheel covers.
 * - Double front wing cascade with vertical endplates and flow diverters.
 * - Narrow tapered nosecone extending forward from cockpit survival cell.
 * - Driver helmet in cockpit protected by titanium Grade 5 Halo hoop.
 * - Engine air intake scoop overhead feeding turbo hybrid PU.
 * - Sculpted aerodynamic sidepods with undercut cooling channels.
 * - High-mounted rear wing with twin endplates and active DRS actuator pod.
 * - Underbody rear diffuser strakes and FIA red rain light beacon.
 */
export function createF1CarMesh(profile: SimCarProfile): THREE.Group {
  const car = new THREE.Group();
  car.name = `SimCar_${profile.id}`;

  const primaryCol = new THREE.Color(profile.primaryColor);
  const accentCol = new THREE.Color(profile.accentColor);

  const bodyMat = new THREE.MeshStandardMaterial({
    color: primaryCol,
    metalness: 0.55,
    roughness: 0.28,
  });

  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x111317,
    roughness: 0.65,
    metalness: 0.25,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: accentCol,
    metalness: 0.45,
    roughness: 0.35,
  });

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x14161a,
    roughness: 0.90,
    metalness: 0.05,
  });

  const wheelRimMat = new THREE.MeshStandardMaterial({
    color: 0x242830,
    metalness: 0.85,
    roughness: 0.20,
  });

  // 1. Central Monocoque / Cockpit Survival Cell
  const monocoqueGeom = new THREE.BoxGeometry(0.85, 0.48, 2.2);
  const monocoque = new THREE.Mesh(monocoqueGeom, bodyMat);
  monocoque.position.set(0, 0.40, 0.2);
  monocoque.castShadow = true;
  car.add(monocoque);

  // 2. Sculpted Aerodynamic Sidepods with underbody floor floorboard
  const sidepodGeom = new THREE.BoxGeometry(0.55, 0.38, 1.8);
  const leftSidepod = new THREE.Mesh(sidepodGeom, bodyMat);
  leftSidepod.position.set(-0.68, 0.32, 0.1);
  leftSidepod.castShadow = true;

  const rightSidepod = new THREE.Mesh(sidepodGeom, bodyMat);
  rightSidepod.position.set(0.68, 0.32, 0.1);
  rightSidepod.castShadow = true;
  car.add(leftSidepod, rightSidepod);

  // Underbody Ground-Effect Floor Edge (extends out to seal venturi tunnels)
  const floorGeom = new THREE.BoxGeometry(1.85, 0.06, 2.6);
  const floorMesh = new THREE.Mesh(floorGeom, carbonMat);
  floorMesh.position.set(0, 0.14, 0.15);
  car.add(floorMesh);

  // 3. Tapered Front Nosecone
  const noseGeom = new THREE.ConeGeometry(0.42, 2.1, 4);
  noseGeom.rotateX(Math.PI / 2);
  noseGeom.rotateY(Math.PI / 4);
  const nose = new THREE.Mesh(noseGeom, bodyMat);
  nose.position.set(0, 0.30, 2.3);
  nose.castShadow = true;
  car.add(nose);

  // 4. Multi-element Front Wing & Endplates
  const frontWingGeom = new THREE.BoxGeometry(2.1, 0.06, 0.7);
  const frontWing = new THREE.Mesh(frontWingGeom, bodyMat);
  frontWing.position.set(0, 0.15, 3.1);
  frontWing.castShadow = true;
  car.add(frontWing);

  // Front Wing Endplates (left & right)
  const endplateGeom = new THREE.BoxGeometry(0.04, 0.35, 0.7);
  const leftEndplate = new THREE.Mesh(endplateGeom, accentMat);
  leftEndplate.position.set(-1.05, 0.28, 3.1);
  const rightEndplate = new THREE.Mesh(endplateGeom, accentMat);
  rightEndplate.position.set(1.05, 0.28, 3.1);
  car.add(leftEndplate, rightEndplate);

  // 5. Engine Airbox / Overhead Scoop & Shark Fin
  const airboxGeom = new THREE.BoxGeometry(0.45, 0.55, 1.4);
  const airbox = new THREE.Mesh(airboxGeom, bodyMat);
  airbox.position.set(0, 0.82, -0.4);
  car.add(airbox);

  // Longitudinal Shark Fin
  const sharkFinGeom = new THREE.BoxGeometry(0.04, 0.45, 1.3);
  const sharkFin = new THREE.Mesh(sharkFinGeom, carbonMat);
  sharkFin.position.set(0, 0.90, -0.9);
  car.add(sharkFin);

  // 6. Titanium Safety Halo Hoop & Driver Helmet
  const haloGeom = new THREE.TorusGeometry(0.32, 0.04, 8, 16, Math.PI);
  haloGeom.rotateX(-Math.PI / 2);
  const halo = new THREE.Mesh(haloGeom, carbonMat);
  halo.position.set(0, 0.72, 0.35);
  car.add(halo);

  // Driver Helmet inside cockpit
  const helmetGeom = new THREE.SphereGeometry(0.18, 12, 12);
  const helmetMat = new THREE.MeshStandardMaterial({ color: accentCol, metalness: 0.3, roughness: 0.2 });
  const helmet = new THREE.Mesh(helmetGeom, helmetMat);
  helmet.position.set(0, 0.68, 0.18);
  car.add(helmet);

  // 7. High-Downforce Rear Wing Assembly
  const mainPlaneGeom = new THREE.BoxGeometry(1.5, 0.10, 0.45);
  const rearWingMain = new THREE.Mesh(mainPlaneGeom, bodyMat);
  rearWingMain.position.set(0, 0.95, -1.9);
  rearWingMain.castShadow = true;

  // Rear Wing Endplates
  const rearEndplateGeom = new THREE.BoxGeometry(0.04, 0.65, 0.65);
  const leftRearEndplate = new THREE.Mesh(rearEndplateGeom, accentMat);
  leftRearEndplate.position.set(-0.75, 0.85, -1.9);
  const rightRearEndplate = new THREE.Mesh(rearEndplateGeom, accentMat);
  rightRearEndplate.position.set(0.75, 0.85, -1.9);

  // Twin Swan-neck Mount Pylons
  const pylonGeom = new THREE.BoxGeometry(0.04, 0.70, 0.08);
  const pylonL = new THREE.Mesh(pylonGeom, carbonMat);
  pylonL.position.set(-0.25, 0.65, -1.75);
  const pylonR = new THREE.Mesh(pylonGeom, carbonMat);
  pylonR.position.set(0.25, 0.65, -1.75);

  car.add(rearWingMain, leftRearEndplate, rightRearEndplate, pylonL, pylonR);

  // 8. Exposed 18-inch Open Wheels & Suspension Wishbones
  const buildWheel = (isFront: boolean, isLeft: boolean) => {
    const wheelGroup = new THREE.Group();
    const radius = isFront ? 0.36 : 0.38;
    const width = isFront ? 0.34 : 0.42;

    const tireGeom = new THREE.CylinderGeometry(radius, radius, width, 20);
    tireGeom.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeom, tireMat);
    tire.castShadow = true;
    wheelGroup.add(tire);

    // BBS Aero Wheel Cover Disc
    const rimGeom = new THREE.CylinderGeometry(radius * 0.72, radius * 0.72, width + 0.01, 16);
    rimGeom.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeom, wheelRimMat);
    wheelGroup.add(rim);

    // Carbon Suspension Wishbone Struts connecting to monocoque
    const wishboneGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6);
    wishboneGeom.rotateZ(isLeft ? Math.PI / 2.3 : -Math.PI / 2.3);
    const wishbone = new THREE.Mesh(wishboneGeom, carbonMat);
    wishbone.position.set(isLeft ? 0.30 : -0.30, 0, 0);
    wheelGroup.add(wishbone);

    return wheelGroup;
  };

  const wheelFL = buildWheel(true, true);
  wheelFL.position.set(-1.02, 0.36, 1.8);

  const wheelFR = buildWheel(true, false);
  wheelFR.position.set(1.02, 0.36, 1.8);

  const wheelRL = buildWheel(false, true);
  wheelRL.position.set(-1.05, 0.38, -1.4);

  const wheelRR = buildWheel(false, false);
  wheelRR.position.set(1.05, 0.38, -1.4);

  car.add(wheelFL, wheelFR, wheelRL, wheelRR);

  // 9. FIA Rain Light & Beacon
  const rainLightGeom = new THREE.BoxGeometry(0.12, 0.08, 0.05);
  const rainLightMat = new THREE.MeshBasicMaterial({ color: 0xff0020 });
  const rainLight = new THREE.Mesh(rainLightGeom, rainLightMat);
  rainLight.position.set(0, 0.22, -2.15);
  car.add(rainLight);

  // Player Car Neon T-Cam Indicator
  if (profile.isPlayer) {
    const tCamGeom = new THREE.BoxGeometry(0.22, 0.08, 0.12);
    const tCamMat = new THREE.MeshBasicMaterial({ color: 0x66ff00 });
    const tCam = new THREE.Mesh(tCamGeom, tCamMat);
    tCam.position.set(0, 1.15, -0.2);
    car.add(tCam);
  }

  return car;
}
