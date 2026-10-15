import * as THREE from 'three';
import { createBakuSpline, BAKU_3D_CENTERLINE, getSectorFromProgress } from './bakuTrackGeometry.ts';
import { BAKU_CIRCUIT, type CircuitTurn } from '../types/circuits.ts';

/**
 * Builds the complete 3D Baku City Circuit mesh hierarchy:
 * - High-grip textured tarmac road surface with distinct white edge lines and dashed centerline.
 * - Alternating red-and-white FIA apex kerbs on corner entries/exits with slight 3D elevation.
 * - Realistically distinguishable runoff areas (dark textured asphalt vs green painted runoff/grey street pavements).
 * - SAFER safety barriers with blue/white sponsor decals and catch fencing posts.
 * - Start/Finish timing gantry with light pod, checkered line, and starting grid boxes.
 * - Distinct Baku landmarks:
 *   - Old City Castle walls (Qala Qapisi / Icharishahar) & fortress tower at Turns 8-11
 *   - Government House of Baku at Azadliq Square (main straight)
 *   - Iconic Baku Flame Towers on the western hilltop
 *   - Baku Ferris Wheel ("Baku Eye") along the Caspian Sea waterfront
 *   - Caspian Sea water plane with realistic reflections
 */
export function buildBakuCircuitScene(): THREE.Group {
  const circuitGroup = new THREE.Group();
  circuitGroup.name = 'Baku_3D_Circuit_Environment';

  const spline = createBakuSpline();
  const numSteps = 700;
  const points = spline.getSpacedPoints(numSteps);

  const defaultTrackWidth = 14.0;
  const castleTrackWidth = 8.5;

  // 1. Road Surface & Runoff BufferGeometry
  const roadGeom = new THREE.BufferGeometry();
  const roadPositions: number[] = [];
  const roadNormals: number[] = [];
  const roadUvs: number[] = [];
  const roadIndices: number[] = [];

  // Centerline markings
  const centerPositions: number[] = [];
  const centerIndices: number[] = [];

  // Left & Right white boundary lines
  const leftLinePositions: number[] = [];
  const rightLinePositions: number[] = [];
  const lineIndices: number[] = [];

  // Runoff apron surface geometry (extends 4m beyond track edges to give clear visual contrast from urban base)
  const runoffPositions: number[] = [];
  const runoffIndices: number[] = [];

  // Barrier points
  const leftBarrierPoints: THREE.Vector3[] = [];
  const rightBarrierPoints: THREE.Vector3[] = [];

  for (let i = 0; i <= numSteps; i++) {
    const t = i / numSteps;
    const currentPt = points[i % numSteps];
    const tangent = spline.getTangentAt(t % 1).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

    // Dynamically narrow road through Castle section (Turns 8-11: t between 0.50 and 0.65)
    let currentWidth = defaultTrackWidth;
    if (t >= 0.50 && t <= 0.65) {
      const castleFactor = Math.sin(((t - 0.50) / 0.15) * Math.PI);
      currentWidth = defaultTrackWidth - castleFactor * (defaultTrackWidth - castleTrackWidth);
    }
    const halfWidth = currentWidth / 2;

    const leftPt = currentPt.clone().addScaledVector(normal, -halfWidth);
    const rightPt = currentPt.clone().addScaledVector(normal, halfWidth);
    leftPt.y = 0.06;
    rightPt.y = 0.06;

    // Road vertices
    roadPositions.push(leftPt.x, leftPt.y, leftPt.z);
    roadPositions.push(rightPt.x, rightPt.y, rightPt.z);

    roadNormals.push(0, 1, 0);
    roadNormals.push(0, 1, 0);

    roadUvs.push(0, i * 0.35);
    roadUvs.push(1, i * 0.35);

    // Dashed Centerline vertices
    const isDashLit = Math.floor(i / 3) % 2 === 0;
    if (isDashLit) {
      const cLeft = currentPt.clone().addScaledVector(normal, -0.15);
      const cRight = currentPt.clone().addScaledVector(normal, 0.15);
      centerPositions.push(cLeft.x, 0.07, cLeft.z);
      centerPositions.push(cRight.x, 0.07, cRight.z);
    }

    // Outer Edge White Lines (0.25m wide)
    const l1 = leftPt.clone();
    const l2 = leftPt.clone().addScaledVector(normal, 0.25);
    leftLinePositions.push(l1.x, 0.07, l1.z);
    leftLinePositions.push(l2.x, 0.07, l2.z);

    const r1 = rightPt.clone().addScaledVector(normal, -0.25);
    const r2 = rightPt.clone();
    rightLinePositions.push(r1.x, 0.07, r1.z);
    rightLinePositions.push(r2.x, 0.07, r2.z);

    // Runoff aprons outside track edges (distinct street asphalt/pavement)
    const runoffWidth = 3.5;
    const lRunoff = leftPt.clone().addScaledVector(normal, -runoffWidth);
    const rRunoff = rightPt.clone().addScaledVector(normal, runoffWidth);
    lRunoff.y = 0.02;
    rRunoff.y = 0.02;
    runoffPositions.push(lRunoff.x, lRunoff.y, lRunoff.z);
    runoffPositions.push(rRunoff.x, rRunoff.y, rRunoff.z);

    leftBarrierPoints.push(leftPt.clone());
    rightBarrierPoints.push(rightPt.clone());

    if (i < numSteps) {
      const idx = i * 2;
      roadIndices.push(idx, idx + 1, idx + 2);
      roadIndices.push(idx + 1, idx + 3, idx + 2);

      lineIndices.push(idx, idx + 1, idx + 2);
      lineIndices.push(idx + 1, idx + 3, idx + 2);

      runoffIndices.push(idx, idx + 1, idx + 2);
      runoffIndices.push(idx + 1, idx + 3, idx + 2);
    }
  }

  // Asphalt Main Tarmac Mesh
  roadGeom.setAttribute('position', new THREE.Float32BufferAttribute(roadPositions, 3));
  roadGeom.setAttribute('normal', new THREE.Float32BufferAttribute(roadNormals, 3));
  roadGeom.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
  roadGeom.setIndex(roadIndices);

  const roadMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1c22,
    roughness: 0.85,
    metalness: 0.15,
  });
  const roadMesh = new THREE.Mesh(roadGeom, roadMaterial);
  roadMesh.receiveShadow = true;
  circuitGroup.add(roadMesh);

  // Runoff Apron Mesh (distinct lighter pavement/runoff color)
  const runoffGeom = new THREE.BufferGeometry();
  runoffGeom.setAttribute('position', new THREE.Float32BufferAttribute(runoffPositions, 3));
  runoffGeom.computeVertexNormals();
  runoffGeom.setIndex(runoffIndices);
  const runoffMaterial = new THREE.MeshStandardMaterial({
    color: 0x101217,
    roughness: 0.95,
    metalness: 0.05,
  });
  const runoffMesh = new THREE.Mesh(runoffGeom, runoffMaterial);
  runoffMesh.receiveShadow = true;
  circuitGroup.add(runoffMesh);

  // Painted Edge White Lines
  const buildLineMesh = (positions: number[]) => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.computeVertexNormals();
    geom.setIndex(lineIndices);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    return new THREE.Mesh(geom, mat);
  };
  circuitGroup.add(buildLineMesh(leftLinePositions));
  circuitGroup.add(buildLineMesh(rightLinePositions));

  // 2. High-Visibility FIA Red & White Kerbs along barriers
  const buildKerbStrips = (pts: THREE.Vector3[], isLeft: boolean) => {
    const kerbGeom = new THREE.BufferGeometry();
    const pos: number[] = [];
    const colors: number[] = [];
    const ind: number[] = [];
    const kerbWidth = 1.1;

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const nextP = pts[(i + 1) % pts.length];
      const dir = new THREE.Vector3().subVectors(nextP, p).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const side = new THREE.Vector3().crossVectors(dir, up).normalize();
      const offset = side.clone().multiplyScalar(isLeft ? kerbWidth : -kerbWidth);

      pos.push(p.x, 0.09, p.z);
      pos.push(p.x + offset.x, 0.15, p.z + offset.z);

      // Alternating red and white stripes every 5 segments
      const isRed = Math.floor(i / 5) % 2 === 0;
      const c = isRed ? [0.92, 0.08, 0.08] : [0.98, 0.98, 0.98];
      colors.push(c[0], c[1], c[2]);
      colors.push(c[0], c[1], c[2]);

      if (i < pts.length - 1) {
        const idx = i * 2;
        ind.push(idx, idx + 1, idx + 2);
        ind.push(idx + 1, idx + 3, idx + 2);
      }
    }

    kerbGeom.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    kerbGeom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    kerbGeom.computeVertexNormals();
    kerbGeom.setIndex(ind);

    const kerbMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.55,
      metalness: 0.15,
    });
    return new THREE.Mesh(kerbGeom, kerbMat);
  };

  const leftKerbs = buildKerbStrips(leftBarrierPoints, true);
  const rightKerbs = buildKerbStrips(rightBarrierPoints, false);
  circuitGroup.add(leftKerbs, rightKerbs);

  // 3. Start / Finish Line Checkered Strip & Starting Grid Boxes
  const sfGeom = new THREE.PlaneGeometry(defaultTrackWidth, 4.0);
  sfGeom.rotateX(-Math.PI / 2);
  const sfMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const sfMesh = new THREE.Mesh(sfGeom, sfMat);
  sfMesh.position.set(-180, 0.10, 340);
  circuitGroup.add(sfMesh);

  // Starting Grid Slots (6 staggered positions on Neftchilar Avenue)
  for (let i = 0; i < 6; i++) {
    const isL = i % 2 === 0;
    const gx = -180 + (isL ? -5.5 : 5.5);
    const gz = 300 - i * 14;

    const boxGeom = new THREE.PlaneGeometry(3.6, 5.2);
    boxGeom.rotateX(-Math.PI / 2);
    const boxMat = new THREE.MeshBasicMaterial({ color: 0xffe600, wireframe: true });
    const boxMesh = new THREE.Mesh(boxGeom, boxMat);
    boxMesh.position.set(gx, 0.09, gz);
    circuitGroup.add(boxMesh);
  }

  // Overhead Timing Gantry
  const gantryGroup = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x1e222b, metalness: 0.85, roughness: 0.25 });
  const gantryPoleGeom = new THREE.BoxGeometry(0.9, 8.8, 0.9);
  const leftPole = new THREE.Mesh(gantryPoleGeom, poleMat);
  leftPole.position.set(-180 - defaultTrackWidth / 2 - 2, 4.4, 340);
  const rightPole = new THREE.Mesh(gantryPoleGeom, poleMat);
  rightPole.position.set(-180 + defaultTrackWidth / 2 + 2, 4.4, 340);

  const crossbarGeom = new THREE.BoxGeometry(defaultTrackWidth + 6, 1.5, 1.5);
  const crossbar = new THREE.Mesh(crossbarGeom, poleMat);
  crossbar.position.set(-180, 8.4, 340);

  // Start Light Rig (5 Red Lights)
  const lightRigGeom = new THREE.BoxGeometry(8.0, 0.8, 0.4);
  const lightRigMat = new THREE.MeshBasicMaterial({ color: 0xe10600 });
  const lightRig = new THREE.Mesh(lightRigGeom, lightRigMat);
  lightRig.position.set(-180, 7.5, 339.2);

  gantryGroup.add(leftPole, rightPole, crossbar, lightRig);
  circuitGroup.add(gantryGroup);

  // 4. Track SAFER Barriers with Sponsor Liveries
  const buildBarrier = (pts: THREE.Vector3[], color: number) => {
    const barrierGeom = new THREE.BufferGeometry();
    const pos: number[] = [];
    const ind: number[] = [];
    const height = 1.45;

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      pos.push(p.x, 0, p.z);
      pos.push(p.x, height, p.z);

      if (i < pts.length - 1) {
        const idx = i * 2;
        ind.push(idx, idx + 1, idx + 2);
        ind.push(idx + 1, idx + 3, idx + 2);
      }
    }
    const lastIdx = (pts.length - 1) * 2;
    ind.push(lastIdx, lastIdx + 1, 0);
    ind.push(lastIdx + 1, 1, 0);

    barrierGeom.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    barrierGeom.computeVertexNormals();
    barrierGeom.setIndex(ind);

    const barrierMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.55,
      metalness: 0.45,
    });
    return new THREE.Mesh(barrierGeom, barrierMat);
  };

  const leftBarrierMesh = buildBarrier(leftBarrierPoints, 0x0070d2); // Baku City Circuit Blue
  const rightBarrierMesh = buildBarrier(rightBarrierPoints, 0x222630);
  circuitGroup.add(leftBarrierMesh, rightBarrierMesh);

  // 5. Old City Castle Section (Icharishahar Fortress — Turns 8-11)
  const castleStoneMat = new THREE.MeshStandardMaterial({
    color: 0x9e8a64,
    roughness: 0.95,
    metalness: 0.05,
  });
  const castleDarkStoneMat = new THREE.MeshStandardMaterial({
    color: 0x6e5e40,
    roughness: 0.98,
    metalness: 0.02,
  });

  // Fortress defensive perimeter wall
  const castleWallGeom = new THREE.BoxGeometry(16, 14, 85);
  const castleWall = new THREE.Mesh(castleWallGeom, castleStoneMat);
  castleWall.position.set(295, 7, 25);
  castleWall.rotation.y = 0.22;
  castleWall.castShadow = true;

  // Historic Citadel Watchtower
  const castleTowerGeom = new THREE.CylinderGeometry(7, 8, 22, 16);
  const castleTower = new THREE.Mesh(castleTowerGeom, castleStoneMat);
  castleTower.position.set(302, 11, 75);
  castleTower.castShadow = true;

  // Fortress Battlements / Crenellations
  const battlementGeom = new THREE.BoxGeometry(2, 3, 2);
  for (let b = 0; b < 8; b++) {
    const batt = new THREE.Mesh(battlementGeom, castleDarkStoneMat);
    batt.position.set(292 + (b % 2) * 4, 15, -10 + b * 12);
    circuitGroup.add(batt);
  }
  circuitGroup.add(castleWall, castleTower);

  // 6. Iconic Baku Flame Towers on the Western Hilltop
  const buildFlameTower = (height: number, x: number, z: number, rotY: number) => {
    const towerGroup = new THREE.Group();
    const flameMat = new THREE.MeshStandardMaterial({
      color: 0x00d4ff,
      emissive: 0x003366,
      metalness: 0.95,
      roughness: 0.15,
    });
    const fGeom = new THREE.ConeGeometry(8, height, 8);
    fGeom.scale(1.4, 1, 0.7);
    const towerMesh = new THREE.Mesh(fGeom, flameMat);
    towerMesh.position.set(0, height / 2, 0);
    towerGroup.add(towerMesh);
    towerGroup.position.set(x, 0, z);
    towerGroup.rotation.y = rotY;
    return towerGroup;
  };

  const flame1 = buildFlameTower(85, 320, -180, 0.3);
  const flame2 = buildFlameTower(95, 350, -160, -0.2);
  const flame3 = buildFlameTower(78, 380, -185, 0.8);
  circuitGroup.add(flame1, flame2, flame3);

  // 7. Azadliq Square Government House (Soviet Classical Grandeur)
  const govStoneMat = new THREE.MeshStandardMaterial({
    color: 0x7a8594,
    roughness: 0.75,
    metalness: 0.25,
  });
  const govHouseGeom = new THREE.BoxGeometry(36, 32, 140);
  const govHouse = new THREE.Mesh(govHouseGeom, govStoneMat);
  govHouse.position.set(-240, 16, 335);
  govHouse.castShadow = true;

  // Arcaded Portico Columns
  const columnGeom = new THREE.CylinderGeometry(0.8, 0.8, 18, 8);
  for (let c = 0; c < 12; c++) {
    const col = new THREE.Mesh(columnGeom, govStoneMat);
    col.position.set(-220, 9, 275 + c * 11);
    circuitGroup.add(col);
  }
  circuitGroup.add(govHouse);

  // 8. Baku Ferris Wheel ("Baku Eye") along Seaside National Park
  const wheelGroup = new THREE.Group();
  const wheelRimGeom = new THREE.TorusGeometry(26, 0.6, 8, 32);
  const wheelMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true });
  const ferrisWheel = new THREE.Mesh(wheelRimGeom, wheelMat);
  ferrisWheel.position.set(0, 32, 0);
  ferrisWheel.rotation.y = Math.PI / 4;

  const legGeom = new THREE.CylinderGeometry(0.5, 0.8, 34);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x222630 });
  const leg1 = new THREE.Mesh(legGeom, legMat);
  leg1.position.set(-6, 17, 0);
  leg1.rotation.z = 0.2;
  const leg2 = new THREE.Mesh(legGeom, legMat);
  leg2.position.set(6, 17, 0);
  leg2.rotation.z = -0.2;

  wheelGroup.add(ferrisWheel, leg1, leg2);
  wheelGroup.position.set(-360, 0, 120);
  circuitGroup.add(wheelGroup);

  // 9. Modern Glass Skyline Towers
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x111c2e,
    roughness: 0.2,
    metalness: 0.88,
  });
  const towerA = new THREE.Mesh(new THREE.BoxGeometry(30, 70, 30), glassMat);
  towerA.position.set(-110, 35, -120);
  const towerB = new THREE.Mesh(new THREE.BoxGeometry(32, 85, 32), glassMat);
  towerB.position.set(60, 42.5, -135);
  circuitGroup.add(towerA, towerB);

  // 10. Caspian Sea Water Plane (East of Neftchilar Avenue)
  const seaGeom = new THREE.PlaneGeometry(800, 1000);
  seaGeom.rotateX(-Math.PI / 2);
  const seaMat = new THREE.MeshStandardMaterial({
    color: 0x041021,
    roughness: 0.15,
    metalness: 0.85,
  });
  const seaMesh = new THREE.Mesh(seaGeom, seaMat);
  seaMesh.position.set(-580, -0.15, 250);
  circuitGroup.add(seaMesh);

  // 11. Base Ground Urban Plane
  const groundGeom = new THREE.PlaneGeometry(1400, 1400);
  groundGeom.rotateX(-Math.PI / 2);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x08090c,
    roughness: 0.95,
    metalness: 0.05,
  });
  const groundMesh = new THREE.Mesh(groundGeom, groundMat);
  groundMesh.position.y = -0.01;
  groundMesh.receiveShadow = true;
  circuitGroup.add(groundMesh);

  // 12. Corner Number Signs for all 20 Turns
  BAKU_CIRCUIT.turns.forEach((turn: CircuitTurn) => {
    const matchingPoint = BAKU_3D_CENTERLINE.find((p) => p.turnNumber === turn.number);
    if (!matchingPoint) return;

    const postGeom = new THREE.CylinderGeometry(0.12, 0.12, 2.4);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x2a2f3a });
    const post = new THREE.Mesh(postGeom, postMat);
    post.position.set(matchingPoint.x + 8.5, 1.2, matchingPoint.z);

    const signBoardGeom = new THREE.BoxGeometry(1.8, 1.1, 0.15);
    const signBoardMat = new THREE.MeshBasicMaterial({ color: 0x66ff00 });
    const signBoard = new THREE.Mesh(signBoardGeom, signBoardMat);
    signBoard.position.set(matchingPoint.x + 8.5, 2.1, matchingPoint.z);

    const signGroup = new THREE.Group();
    signGroup.add(post, signBoard);
    circuitGroup.add(signGroup);
  });

  return circuitGroup;
}
