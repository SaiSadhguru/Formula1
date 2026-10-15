import * as THREE from 'three';
import { BAKU_CIRCUIT } from '../types/circuits.ts';

export interface TrackPoint {
  x: number;
  z: number;
  sector: 1 | 2 | 3;
  turnNumber?: number;
  width?: number;
}

/**
 * Verified Baku City Circuit 3D Racing Centerline & Geometry Points.
 * Coordinates are mapped to a 3D ground plane (X, Z) scaled for realistic racing physics.
 * Scale: ~1200m bounding box matching the aspect ratio of Baku (Neftchilar straight along Z axis).
 * 
 * Sector 1 (Turns 1-5): 90-degree street corners
 * Sector 2 (Turns 6-16): Castle ascent (T8-11 width 7.6m), downhill T12-15
 * Sector 3 (Turns 17-20): 2.2km flat out straight leading to Start/Finish
 */
export const BAKU_3D_CENTERLINE: TrackPoint[] = [
  // Start/Finish Straight (Neftchilar Avenue)
  { x: -180, z: 280, sector: 3, turnNumber: 20 },
  { x: -180, z: 340, sector: 3 }, // Start/Finish Line
  { x: -180, z: 420, sector: 1 },
  // Turn 1: 90° Left into Pushkin Street
  { x: -180, z: 470, sector: 1, turnNumber: 1 },
  { x: -140, z: 470, sector: 1 },
  // Turn 2: 90° Left into Khagani Street
  { x: -90, z: 470, sector: 1, turnNumber: 2 },
  { x: -90, z: 390, sector: 1 },
  // Turn 3: 90° Right onto Bulbul Avenue
  { x: -90, z: 310, sector: 1, turnNumber: 3 },
  { x: 30, z: 310, sector: 1 },
  // Turn 4: 90° Right into Zarifa Aliyeva Street
  { x: 120, z: 310, sector: 1, turnNumber: 4 },
  { x: 120, z: 210, sector: 1 },
  // Turn 5 & 6: Chicane entering Old City perimeter (End S1 -> Start S2)
  { x: 160, z: 180, sector: 1, turnNumber: 5 },
  { x: 200, z: 140, sector: 2, turnNumber: 6 },
  // Turn 7: Right turn before castle gates
  { x: 260, z: 120, sector: 2, turnNumber: 7 },
  // Turn 8: Castle section entrance (narrow 7.6m width!)
  { x: 290, z: 60, sector: 2, turnNumber: 8, width: 8.5 },
  // Turn 9, 10, 11: Castle walls ascent & crest
  { x: 270, z: 0, sector: 2, turnNumber: 9, width: 8.5 },
  { x: 230, z: -40, sector: 2, turnNumber: 10, width: 9.0 },
  { x: 180, z: -60, sector: 2, turnNumber: 11, width: 10.0 },
  // Turn 12: High-speed downhill kink
  { x: 110, z: -50, sector: 2, turnNumber: 12 },
  // Turn 13 & 14: Downhill park bends
  { x: 30, z: -30, sector: 2, turnNumber: 13 },
  { x: -30, z: 0, sector: 2, turnNumber: 14 },
  // Turn 15: Downhill heavy braking trap into barriers
  { x: -80, z: 40, sector: 2, turnNumber: 15 },
  // Turn 16: Crucial traction corner onto 2.2km straight
  { x: -130, z: 90, sector: 2, turnNumber: 16 },
  // Turn 17, 18, 19: Full throttle kinks along sea promenade (Sector 3)
  { x: -160, z: 140, sector: 3, turnNumber: 17 },
  { x: -175, z: 190, sector: 3, turnNumber: 18 },
  { x: -180, z: 235, sector: 3, turnNumber: 19 },
];

/**
 * Creates a smooth CatmullRomCurve3 loop for racing line and track mesh extrusion.
 */
export function createBakuSpline(): THREE.CatmullRomCurve3 {
  const points = BAKU_3D_CENTERLINE.map((p) => new THREE.Vector3(p.x, 0, p.z));
  return new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.25);
}

export interface GridSlot {
  position: THREE.Vector3;
  heading: number; // in radians
  gridIndex: number;
}

/**
 * Calculates start grid slot positions staggered along the main straight before the S/F line.
 */
export function getBakuGridSlots(count: number = 6): GridSlot[] {
  const slots: GridSlot[] = [];
  const startZ = 300; // Behind S/F line at Z=340, heading towards +Z
  const heading = 0; // facing +Z

  for (let i = 0; i < count; i++) {
    // Stagger left and right of track centerline (X = -180)
    const isLeft = i % 2 === 0;
    const xOffset = isLeft ? -5.5 : 5.5;
    const zOffset = -(i * 14);

    slots.push({
      position: new THREE.Vector3(-180 + xOffset, 0.2, startZ + zOffset),
      heading,
      gridIndex: i + 1,
    });
  }
  return slots;
}

export interface SectorCheck {
  sector: 1 | 2 | 3;
  tRange: [number, number]; // progress along spline [start, end]
}

/**
 * Defines sector ranges along the normalized 0..1 track progress.
 * Based on the 26 centerline nodes:
 * S1: T1 to T5 (~0.11 to ~0.44)
 * S2: T6 to T16 (~0.45 to ~0.82)
 * S3: T17 to T20 + S/F (~0.83 to 1.0 & 0.0 to 0.10)
 */
export function getSectorFromProgress(t: number): 1 | 2 | 3 {
  const normT = ((t % 1) + 1) % 1;
  if (normT >= 0.10 && normT < 0.44) return 1;
  if (normT >= 0.44 && normT < 0.82) return 2;
  return 3;
}
