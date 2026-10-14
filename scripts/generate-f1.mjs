import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import fs from 'node:fs';
import path from 'node:path';

// Polyfill FileReader for Node.js
class PolyfillFileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
      if (this.onload) this.onload();
    });
  }
}
globalThis.FileReader = PolyfillFileReader;

console.log('Building high-fidelity 3D Formula 1 car model...');

const car = new THREE.Group();
car.name = 'F1_Car_Audi_Revolut';

// Materials Palette
const matGreenPaint = new THREE.MeshStandardMaterial({
  name: 'Livery_AcidGreen',
  color: 0x66ff00, // Audi / Kick Sauber iconic fluorescent acid green
  roughness: 0.22,
  metalness: 0.35,
});

const matDarkCarbon = new THREE.MeshStandardMaterial({
  name: 'Carbon_Body',
  color: 0x121316,
  roughness: 0.45,
  metalness: 0.6,
});

const matMatteBlack = new THREE.MeshStandardMaterial({
  name: 'Matte_Black',
  color: 0x0a0a0c,
  roughness: 0.8,
  metalness: 0.1,
});

const matGlossBlack = new THREE.MeshStandardMaterial({
  name: 'Gloss_Aero_Black',
  color: 0x08080a,
  roughness: 0.15,
  metalness: 0.85,
});

const matTitaniumHalo = new THREE.MeshStandardMaterial({
  name: 'Titanium_Halo',
  color: 0x24282f,
  roughness: 0.3,
  metalness: 0.85,
});

const matTireRubber = new THREE.MeshStandardMaterial({
  name: 'Tire_Rubber',
  color: 0x161616,
  roughness: 0.75,
  metalness: 0.12,
});

const matTireStripeRed = new THREE.MeshStandardMaterial({
  name: 'Tire_Pirelli_Soft_Red',
  color: 0xee1111,
  roughness: 0.4,
  metalness: 0.2,
});

const matWheelRim = new THREE.MeshStandardMaterial({
  name: 'Wheel_BBS_Rim',
  color: 0x1c1e22,
  roughness: 0.25,
  metalness: 0.9,
});

const matBrakeRotor = new THREE.MeshStandardMaterial({
  name: 'Brake_Carbon_Ceramic',
  color: 0x2c2c30,
  roughness: 0.5,
  metalness: 0.7,
});

const matBrakeCaliper = new THREE.MeshStandardMaterial({
  name: 'Brake_Caliper_Red',
  color: 0xcc1515,
  roughness: 0.35,
  metalness: 0.5,
});

const matRainLight = new THREE.MeshStandardMaterial({
  name: 'Rain_Light_LED',
  color: 0xff0022,
  emissive: 0xff0011,
  emissiveIntensity: 0.8,
  roughness: 0.2,
  metalness: 0.3,
});

const matPlankWood = new THREE.MeshStandardMaterial({
  name: 'Jabroc_Plank',
  color: 0x5a3d28,
  roughness: 0.85,
  metalness: 0.05,
});

const matMirrorGlass = new THREE.MeshStandardMaterial({
  name: 'Mirror_Reflective',
  color: 0xddeeff,
  roughness: 0.05,
  metalness: 0.98,
});

const matDriverVisor = new THREE.MeshStandardMaterial({
  name: 'Driver_Visor_Gold',
  color: 0xffaa00,
  roughness: 0.1,
  metalness: 0.95,
});

const matDriverHelmet = new THREE.MeshStandardMaterial({
  name: 'Driver_Helmet',
  color: 0xf5f5f5,
  roughness: 0.2,
  metalness: 0.4,
});

const matCockpitScreen = new THREE.MeshStandardMaterial({
  name: 'Steering_LCD_Screen',
  color: 0x051525,
  emissive: 0x0088ff,
  emissiveIntensity: 0.5,
  roughness: 0.3,
  metalness: 0.2,
});

const matExhaust = new THREE.MeshStandardMaterial({
  name: 'Exhaust_Inconel',
  color: 0x8a7050,
  roughness: 0.4,
  metalness: 0.85,
});

// Helper for adding symmetric meshes (left & right)
function addSymmetric(group, geometry, material, posX, posY, posZ, rotX = 0, rotY = 0, rotZ = 0) {
  const meshL = new THREE.Mesh(geometry, material);
  meshL.position.set(-posX, posY, posZ);
  meshL.rotation.set(rotX, rotY, rotZ);
  meshL.castShadow = true;
  meshL.receiveShadow = true;
  group.add(meshL);

  const meshR = new THREE.Mesh(geometry.clone(), material);
  meshR.position.set(posX, posY, posZ);
  meshR.rotation.set(rotX, -rotY, -rotZ);
  meshR.castShadow = true;
  meshR.receiveShadow = true;
  group.add(meshR);
}

// -------------------------------------------------------------
// 1. UNDERFLOOR & PLANK & DIFFUSER
// -------------------------------------------------------------
const floorGroup = new THREE.Group();
floorGroup.name = 'Floor_And_Diffuser';

// Flat floor section (ground effect floor)
const floorShape = new THREE.Shape();
floorShape.moveTo(-0.95, -1.6);
floorShape.lineTo(0.95, -1.6);
floorShape.lineTo(0.92, 0.4);
floorShape.lineTo(0.75, 0.85);
floorShape.lineTo(-0.75, 0.85);
floorShape.lineTo(-0.92, 0.4);
floorShape.closePath();

const floorGeom = new THREE.ExtrudeGeometry(floorShape, {
  depth: 0.025,
  bevelEnabled: true,
  bevelSegments: 2,
  steps: 1,
  bevelSize: 0.015,
  bevelThickness: 0.015,
});
// Rotate so it lays flat horizontally
floorGeom.rotateX(Math.PI / 2);
const floorMesh = new THREE.Mesh(floorGeom, matDarkCarbon);
floorMesh.position.set(0, 0.05, 0);
floorMesh.castShadow = true;
floorMesh.receiveShadow = true;
floorGroup.add(floorMesh);

// Center wooden skid block plank (FIA rule)
const plankGeom = new THREE.BoxGeometry(0.32, 0.015, 3.4);
const plankMesh = new THREE.Mesh(plankGeom, matPlankWood);
plankMesh.position.set(0, 0.035, -0.4);
plankMesh.castShadow = true;
floorGroup.add(plankMesh);

// Diffuser kick-up ramp at the rear
const diffuserGeom = new THREE.BoxGeometry(1.05, 0.03, 0.95);
diffuserGeom.rotateX(-0.28);
const diffuserMesh = new THREE.Mesh(diffuserGeom, matGlossBlack);
diffuserMesh.position.set(0, 0.16, -2.05);
diffuserMesh.castShadow = true;
floorGroup.add(diffuserMesh);

// Diffuser vertical aerodynamic strakes
for (let i = -3; i <= 3; i++) {
  if (i === 0) continue;
  const strakeGeom = new THREE.BoxGeometry(0.015, 0.18, 0.85);
  strakeGeom.rotateX(-0.28);
  const strakeMesh = new THREE.Mesh(strakeGeom, matDarkCarbon);
  strakeMesh.position.set(i * 0.14, 0.16, -2.05);
  strakeMesh.castShadow = true;
  floorGroup.add(strakeMesh);
}

// Floor edge wings & curled vortex generators
const edgeWingGeom = new THREE.BoxGeometry(0.02, 0.08, 1.6);
addSymmetric(floorGroup, edgeWingGeom, matGreenPaint, 0.94, 0.08, -0.4);

car.add(floorGroup);

// -------------------------------------------------------------
// 2. MAIN MONOCOQUE & CHASSIS & COCKPIT
// -------------------------------------------------------------
const chassisGroup = new THREE.Group();
chassisGroup.name = 'Chassis_And_Nose';

// Nose Cone: smoothly tapers from cockpit to front wing
const nosePoints = [
  new THREE.Vector2(0.38, 0.8),   // cockpit bulkhead
  new THREE.Vector2(0.34, 1.2),
  new THREE.Vector2(0.28, 1.6),
  new THREE.Vector2(0.22, 2.0),
  new THREE.Vector2(0.14, 2.4),
  new THREE.Vector2(0.06, 2.62),  // nose tip
  new THREE.Vector2(0.0, 2.65),
];

// Create custom sculpted nose geometry via lofting/lathe or custom box-morph
const noseGeom = new THREE.CylinderGeometry(0.08, 0.44, 2.1, 16, 8);
noseGeom.rotateX(Math.PI / 2);
noseGeom.scale(1.2, 0.65, 1.0);
const noseMesh = new THREE.Mesh(noseGeom, matGreenPaint);
noseMesh.position.set(0, 0.28, 1.65);
noseMesh.rotation.x = 0.04; // slight downward slope
noseMesh.castShadow = true;
chassisGroup.add(noseMesh);

// Nose tip crash cone
const noseTipGeom = new THREE.SphereGeometry(0.09, 16, 16);
noseTipGeom.scale(1.3, 0.7, 1.6);
const noseTipMesh = new THREE.Mesh(noseTipGeom, matDarkCarbon);
noseTipMesh.position.set(0, 0.22, 2.68);
noseTipMesh.castShadow = true;
chassisGroup.add(noseTipMesh);

// Cockpit Surround & Survival Cell
const monocoqueGeom = new THREE.BoxGeometry(0.72, 0.52, 1.3);
monocoqueGeom.scale(1.0, 0.9, 1.0);
const monocoqueMesh = new THREE.Mesh(monocoqueGeom, matDarkCarbon);
monocoqueMesh.position.set(0, 0.38, 0.15);
monocoqueMesh.castShadow = true;
chassisGroup.add(monocoqueMesh);

// Cockpit Inner Tub (Recessed hole)
const cockpitOpening = new THREE.Mesh(
  new THREE.CylinderGeometry(0.28, 0.26, 0.8, 16),
  matMatteBlack
);
cockpitOpening.rotateX(Math.PI / 2);
cockpitOpening.scale.set(0.85, 1.0, 1.3);
cockpitOpening.position.set(0, 0.42, 0.15);
chassisGroup.add(cockpitOpening);

// Headrest protection padding
const headrestGeom = new THREE.BoxGeometry(0.42, 0.12, 0.45);
const headrestMesh = new THREE.Mesh(headrestGeom, matGreenPaint);
headrestMesh.position.set(0, 0.52, -0.15);
chassisGroup.add(headrestMesh);

// Driver Seat
const seatGeom = new THREE.BoxGeometry(0.38, 0.35, 0.48);
const seatMesh = new THREE.Mesh(seatGeom, matMatteBlack);
seatMesh.position.set(0, 0.28, 0.05);
chassisGroup.add(seatMesh);

// Driver Helmet & Visor
const helmetGroup = new THREE.Group();
helmetGroup.position.set(0, 0.55, 0.05);

const helmetMesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 20), matDriverHelmet);
helmetMesh.scale.set(0.9, 1.0, 1.1);
helmetMesh.castShadow = true;
helmetGroup.add(helmetMesh);

// Gold/dark mirrored visor
const visorGeom = new THREE.CylinderGeometry(0.122, 0.122, 0.06, 16, 1, false, -Math.PI / 3, (2 * Math.PI) / 3);
const visorMesh = new THREE.Mesh(visorGeom, matDriverVisor);
visorMesh.rotation.y = Math.PI / 2;
visorMesh.position.set(0, 0.01, 0.04);
helmetGroup.add(visorMesh);

chassisGroup.add(helmetGroup);

// Steering Wheel
const steerGroup = new THREE.Group();
steerGroup.position.set(0, 0.46, 0.38);
steerGroup.rotation.x = -0.32;

// Steering wheel main butterfly plate
const steerBase = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.13, 0.025), matDarkCarbon);
steerGroup.add(steerBase);

// Steering Wheel Hand Grips
const gripGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.14, 12);
addSymmetric(steerGroup, gripGeom, matMatteBlack, 0.11, 0.0, 0.0, 0, 0, 0.15);

// Steering Wheel Center LCD Display
const lcdMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.045), matCockpitScreen);
lcdMesh.position.set(0, 0.018, 0.014);
steerGroup.add(lcdMesh);

// Rev LED lights row
const revLeds = new THREE.Mesh(
  new THREE.BoxGeometry(0.07, 0.008, 0.005),
  new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00ff66, emissiveIntensity: 0.9 })
);
revLeds.position.set(0, 0.048, 0.014);
steerGroup.add(revLeds);

chassisGroup.add(steerGroup);

// -------------------------------------------------------------
// 3. SAFETY HALO (Curved Titanium Arch & Center Strut)
// -------------------------------------------------------------
const haloGroup = new THREE.Group();
haloGroup.name = 'Safety_Halo';

// Center vertical titanium pylon
const haloPylonGeom = new THREE.CylinderGeometry(0.02, 0.025, 0.34, 12);
haloPylonGeom.rotateX(0.2);
const haloPylon = new THREE.Mesh(haloPylonGeom, matTitaniumHalo);
haloPylon.position.set(0, 0.54, 0.46);
haloPylon.castShadow = true;
haloGroup.add(haloPylon);

// Curved Wishbone Arc
const haloCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-0.24, 0.62, -0.15),
  new THREE.Vector3(-0.25, 0.67, 0.22),
  new THREE.Vector3(0.0, 0.68, 0.44),
  new THREE.Vector3(0.25, 0.67, 0.22),
  new THREE.Vector3(0.24, 0.62, -0.15),
]);
const haloTubeGeom = new THREE.TubeGeometry(haloCurve, 24, 0.022, 12, false);
const haloMesh = new THREE.Mesh(haloTubeGeom, matGreenPaint);
haloMesh.castShadow = true;
haloGroup.add(haloMesh);

chassisGroup.add(haloGroup);

// Aerodynamic Mirrors on Twin Stalks
const mirrorBodyGeom = new THREE.BoxGeometry(0.12, 0.055, 0.04);
mirrorBodyGeom.rotateY(-0.2);
addSymmetric(chassisGroup, mirrorBodyGeom, matGlossBlack, 0.38, 0.52, 0.42);

// Reflective mirror face
const mirrorFaceGeom = new THREE.PlaneGeometry(0.1, 0.045);
mirrorFaceGeom.rotateY(-Math.PI / 2 - 0.2);
addSymmetric(chassisGroup, mirrorFaceGeom, matMirrorGlass, 0.38, 0.52, 0.41);

// Mirror support stalks
const mirrorStalkGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.12, 8);
mirrorStalkGeom.rotateZ(Math.PI / 4);
addSymmetric(chassisGroup, mirrorStalkGeom, matDarkCarbon, 0.32, 0.46, 0.42);

car.add(chassisGroup);

// -------------------------------------------------------------
// 4. SIDEPODS & ENGINE COVER & AIRBOX & SHARK FIN
// -------------------------------------------------------------
const bodyworkGroup = new THREE.Group();
bodyworkGroup.name = 'Sidepods_And_EngineCover';

// Left and Right Undercut Sidepods
// Sidepod main sculpted body
const sidepodGeom = new THREE.BoxGeometry(0.36, 0.38, 1.45);
sidepodGeom.scale(1.0, 0.9, 1.0);
addSymmetric(bodyworkGroup, sidepodGeom, matGreenPaint, 0.54, 0.26, -0.42);

// Sidepod high cooling inlet mouths
const inletDuctGeom = new THREE.BoxGeometry(0.34, 0.16, 0.12);
addSymmetric(bodyworkGroup, inletDuctGeom, matMatteBlack, 0.54, 0.35, 0.32);

// Sidepod cooling louvers / gills
for (let j = 0; j < 5; j++) {
  const louverGeom = new THREE.BoxGeometry(0.24, 0.01, 0.04);
  louverGeom.rotateZ(0.25);
  addSymmetric(bodyworkGroup, louverGeom, matGlossBlack, 0.52, 0.42, -0.2 - j * 0.09);
}

// Overhead Airbox / Roll Hoop Intake
const airboxGeom = new THREE.CylinderGeometry(0.14, 0.22, 0.5, 16);
airboxGeom.rotateX(Math.PI / 2);
airboxGeom.scale(0.85, 1.25, 1.0);
const airboxMesh = new THREE.Mesh(airboxGeom, matDarkCarbon);
airboxMesh.position.set(0, 0.72, -0.25);
airboxMesh.castShadow = true;
bodyworkGroup.add(airboxMesh);

// Airbox intake hole (black recessed hole)
const airHole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.1, 16), matMatteBlack);
airHole.rotateX(Math.PI / 2);
airHole.scale.set(0.8, 1.2, 1.0);
airHole.position.set(0, 0.74, 0.0);
bodyworkGroup.add(airHole);

// Tapering Engine Cowling / Engine Cover
const cowlGeom = new THREE.ConeGeometry(0.32, 1.8, 16);
cowlGeom.rotateX(-Math.PI / 2);
cowlGeom.scale(0.8, 1.0, 1.0);
const cowlMesh = new THREE.Mesh(cowlGeom, matDarkCarbon);
cowlMesh.position.set(0, 0.46, -1.1);
cowlMesh.castShadow = true;
bodyworkGroup.add(cowlMesh);

// Dorsal Shark Fin (Blade running from airbox to rear wing)
const finShape = new THREE.Shape();
finShape.moveTo(0, 0);
finShape.lineTo(0.0, 0.36);
finShape.lineTo(1.4, 0.12);
finShape.lineTo(1.5, 0.0);
finShape.closePath();

const finGeom = new THREE.ExtrudeGeometry(finShape, {
  depth: 0.015,
  bevelEnabled: false,
});
finGeom.rotateY(Math.PI / 2);
const finMesh = new THREE.Mesh(finGeom, matGreenPaint);
finMesh.position.set(0.0075, 0.52, -1.75);
finMesh.castShadow = true;
bodyworkGroup.add(finMesh);

// Exhaust tailpipe
const exhaustGeom = new THREE.CylinderGeometry(0.045, 0.05, 0.28, 16, 1, true);
exhaustGeom.rotateX(Math.PI / 2);
const exhaustMesh = new THREE.Mesh(exhaustGeom, matExhaust);
exhaustMesh.position.set(0, 0.44, -1.92);
exhaustMesh.castShadow = true;
bodyworkGroup.add(exhaustMesh);

car.add(bodyworkGroup);

// -------------------------------------------------------------
// 5. FRONT WING AERODYNAMICS
// -------------------------------------------------------------
const frontWingGroup = new THREE.Group();
frontWingGroup.name = 'Front_Wing_Assembly';

// Nose pylons (mounting struts)
const pylonGeom = new THREE.BoxGeometry(0.02, 0.18, 0.35);
pylonGeom.rotateX(0.2);
addSymmetric(frontWingGroup, pylonGeom, matDarkCarbon, 0.12, 0.18, 2.35);

// Main Plane (swept forward slightly, wide span)
const mainPlaneGeom = new THREE.BoxGeometry(1.92, 0.02, 0.32);
const mainPlaneMesh = new THREE.Mesh(mainPlaneGeom, matGlossBlack);
mainPlaneMesh.position.set(0, 0.1, 2.38);
mainPlaneMesh.castShadow = true;
frontWingGroup.add(mainPlaneMesh);

// 3 Cascaded curved upper flap elements
for (let f = 1; f <= 3; f++) {
  const flapGeom = new THREE.BoxGeometry(1.88 - f * 0.04, 0.012, 0.14);
  flapGeom.rotateX(-0.15 - f * 0.05); // angle of attack
  const flapMesh = new THREE.Mesh(flapGeom, f === 2 ? matGreenPaint : matDarkCarbon);
  flapMesh.position.set(0, 0.1 + f * 0.038, 2.34 - f * 0.07);
  flapMesh.castShadow = true;
  frontWingGroup.add(flapMesh);
}

// Front Wing Endplates
const endplateShape = new THREE.Shape();
endplateShape.moveTo(-0.25, 0);
endplateShape.lineTo(0.25, 0);
endplateShape.lineTo(0.22, 0.24);
endplateShape.lineTo(-0.2, 0.28);
endplateShape.closePath();

const endplateGeom = new THREE.ExtrudeGeometry(endplateShape, {
  depth: 0.018,
  bevelEnabled: false,
});
endplateGeom.rotateY(Math.PI / 2);
addSymmetric(frontWingGroup, endplateGeom, matGreenPaint, 0.96, 0.08, 2.3);

// Outer dive planes on endplates
const divePlaneGeom = new THREE.BoxGeometry(0.08, 0.01, 0.16);
divePlaneGeom.rotateZ(0.25);
addSymmetric(frontWingGroup, divePlaneGeom, matGlossBlack, 0.99, 0.18, 2.32);

car.add(frontWingGroup);

// -------------------------------------------------------------
// 6. REAR WING ASSEMBLY & DRS & RAIN LIGHT
// -------------------------------------------------------------
const rearWingGroup = new THREE.Group();
rearWingGroup.name = 'Rear_Wing_Assembly';

// Twin Swan-neck mounting pylons
const swanPylonCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0.32, -1.85),
  new THREE.Vector3(0, 0.72, -2.15),
  new THREE.Vector3(0, 0.92, -2.35),
]);
const swanPylonGeom = new THREE.TubeGeometry(swanPylonCurve, 16, 0.018, 8, false);
addSymmetric(rearWingGroup, swanPylonGeom, matDarkCarbon, 0.09, 0, 0);

// Beam Wing (lower airfoil creating diffuser suction)
const beamWingGeom = new THREE.BoxGeometry(0.95, 0.018, 0.22);
beamWingGeom.rotateX(-0.22);
const beamWingMesh = new THREE.Mesh(beamWingGeom, matGlossBlack);
beamWingMesh.position.set(0, 0.38, -2.08);
beamWingMesh.castShadow = true;
rearWingGroup.add(beamWingMesh);

// Main Upper Airfoil
const rwMainGeom = new THREE.BoxGeometry(1.08, 0.035, 0.34);
rwMainGeom.rotateX(-0.18);
const rwMainMesh = new THREE.Mesh(rwMainGeom, matGlossBlack);
rwMainMesh.position.set(0, 0.84, -2.28);
rwMainMesh.castShadow = true;
rearWingGroup.add(rwMainMesh);

// DRS Flap (Upper movable plane)
const drsGeom = new THREE.BoxGeometry(1.06, 0.02, 0.18);
drsGeom.rotateX(-0.35); // aerodynamic downforce angle
const drsMesh = new THREE.Mesh(drsGeom, matGreenPaint);
drsMesh.name = 'Aero_DRS_Flap';
drsMesh.position.set(0, 0.94, -2.36);
drsMesh.castShadow = true;
rearWingGroup.add(drsMesh);

// DRS Hydraulic Center Actuator Pod
const drsPodGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.12, 12);
drsPodGeom.rotateX(Math.PI / 2);
const drsPodMesh = new THREE.Mesh(drsPodGeom, matTitaniumHalo);
drsPodMesh.position.set(0, 0.93, -2.32);
rearWingGroup.add(drsPodMesh);

// Rear Wing Endplates (Large vertical plates)
const rwEndplateShape = new THREE.Shape();
rwEndplateShape.moveTo(-0.28, 0);
rwEndplateShape.lineTo(0.25, 0);
rwEndplateShape.lineTo(0.24, 0.65);
rwEndplateShape.lineTo(-0.24, 0.65);
rwEndplateShape.closePath();

const rwEndplateGeom = new THREE.ExtrudeGeometry(rwEndplateShape, {
  depth: 0.022,
  bevelEnabled: false,
});
rwEndplateGeom.rotateY(Math.PI / 2);
addSymmetric(rearWingGroup, rwEndplateGeom, matGreenPaint, 0.54, 0.42, -2.3);

// Rear Impact Crash Structure
const crashStructGeom = new THREE.BoxGeometry(0.16, 0.14, 0.55);
const crashStructMesh = new THREE.Mesh(crashStructGeom, matDarkCarbon);
crashStructMesh.position.set(0, 0.28, -2.25);
crashStructMesh.castShadow = true;
rearWingGroup.add(crashStructMesh);

// FIA Rear Rain Light (Bright LED matrix)
const rainLightGeom = new THREE.BoxGeometry(0.09, 0.06, 0.02);
const rainLightMesh = new THREE.Mesh(rainLightGeom, matRainLight);
rainLightMesh.position.set(0, 0.28, -2.53);
rearWingGroup.add(rainLightMesh);

car.add(rearWingGroup);

// -------------------------------------------------------------
// 7. SUSPENSION ARMS & BRAKE ASSEMBLIES
// -------------------------------------------------------------
const suspensionGroup = new THREE.Group();
suspensionGroup.name = 'Suspension_Assembly';

// Front Wishbones (Pushrod configuration)
function buildSuspensionWishbones(axleZ, trackX, heightChassis, heightHub) {
  const geomArm = new THREE.CylinderGeometry(0.012, 0.012, trackX - 0.25, 8);
  geomArm.rotateZ(Math.PI / 2);

  // Upper wishbone
  addSymmetric(suspensionGroup, geomArm.clone(), matGlossBlack, trackX / 2 + 0.08, heightChassis + 0.08, axleZ + 0.08, 0, 0.12, 0);
  addSymmetric(suspensionGroup, geomArm.clone(), matGlossBlack, trackX / 2 + 0.08, heightChassis + 0.08, axleZ - 0.12, 0, -0.15, 0);

  // Lower wishbone
  addSymmetric(suspensionGroup, geomArm.clone(), matGlossBlack, trackX / 2 + 0.08, heightChassis - 0.12, axleZ + 0.05, 0, 0.1, 0);
  addSymmetric(suspensionGroup, geomArm.clone(), matGlossBlack, trackX / 2 + 0.08, heightChassis - 0.12, axleZ - 0.15, 0, -0.12, 0);

  // Pushrod diagonal strut
  const pushrodGeom = new THREE.CylinderGeometry(0.014, 0.014, trackX - 0.2, 8);
  pushrodGeom.rotateZ(Math.PI / 3);
  addSymmetric(suspensionGroup, pushrodGeom, matDarkCarbon, trackX / 2 + 0.04, heightChassis, axleZ, 0, 0, 0);
}

// Front suspension (Axle at Z = 1.75m)
buildSuspensionWishbones(1.75, 0.82, 0.35, 0.36);
// Rear suspension (Axle at Z = -1.65m)
buildSuspensionWishbones(-1.65, 0.8, 0.35, 0.36);

car.add(suspensionGroup);

// -------------------------------------------------------------
// 8. WHEELS & TIRES & BRAKE DUCTS (4 CORNERS)
// -------------------------------------------------------------
const wheelsGroup = new THREE.Group();
wheelsGroup.name = 'Wheels_Assembly';

function createF1Wheel(isRear = false, isLeft = true) {
  const wheelAssembly = new THREE.Group();
  wheelAssembly.name = `${isRear ? 'Rear' : 'Front'}_Wheel_${isLeft ? 'Left' : 'Right'}`;

  const tireWidth = isRear ? 0.405 : 0.305;
  const tireRadius = 0.36; // 720mm overall diameter
  const rimRadius = 0.23;  // 18 inch wheel rim

  // 1. Rubber Tire Tread & Sidewall
  const tireTorus = new THREE.TorusGeometry(tireRadius - 0.08, 0.08, 20, 36);
  tireTorus.scale(1.0, 1.0, tireWidth / 0.16);
  tireTorus.rotateY(Math.PI / 2);
  const tireMesh = new THREE.Mesh(tireTorus, matTireRubber);
  tireMesh.castShadow = true;
  tireMesh.receiveShadow = true;
  wheelAssembly.add(tireMesh);

  // Cylindrical tire body to give flat racing slick contact patch
  const slickCyl = new THREE.CylinderGeometry(tireRadius, tireRadius, tireWidth - 0.06, 36, 1, true);
  slickCyl.rotateZ(Math.PI / 2);
  const slickMesh = new THREE.Mesh(slickCyl, matTireRubber);
  slickMesh.castShadow = true;
  wheelAssembly.add(slickMesh);

  // Pirelli P Zero Red Sidewall Color Ring
  const stripeRingGeom = new THREE.RingGeometry(rimRadius + 0.03, rimRadius + 0.055, 36);
  stripeRingGeom.rotateY(isLeft ? -Math.PI / 2 : Math.PI / 2);
  const stripeMesh = new THREE.Mesh(stripeRingGeom, matTireStripeRed);
  stripeMesh.position.x = isLeft ? -tireWidth / 2 - 0.002 : tireWidth / 2 + 0.002;
  wheelAssembly.add(stripeMesh);

  // 2. 18-inch Magnesium Rim & Aero Wheel Cover
  const rimGeom = new THREE.CylinderGeometry(rimRadius, rimRadius, tireWidth * 0.9, 24);
  rimGeom.rotateZ(Math.PI / 2);
  const rimMesh = new THREE.Mesh(rimGeom, matWheelRim);
  wheelAssembly.add(rimMesh);

  // Outer aerodynamic wheel cover disc (mandatory in 2022+ F1 regs)
  const aeroDiscGeom = new THREE.CircleGeometry(rimRadius * 0.95, 24);
  aeroDiscGeom.rotateY(isLeft ? -Math.PI / 2 : Math.PI / 2);
  const aeroDiscMesh = new THREE.Mesh(aeroDiscGeom, matGlossBlack);
  aeroDiscMesh.position.x = isLeft ? -tireWidth / 2 + 0.01 : tireWidth / 2 - 0.01;
  wheelAssembly.add(aeroDiscMesh);

  // Center lock wheel nut (Anodized red or blue)
  const nutGeom = new THREE.CylinderGeometry(0.04, 0.045, 0.05, 12);
  nutGeom.rotateZ(Math.PI / 2);
  const nutMat = new THREE.MeshStandardMaterial({
    color: isLeft ? 0xdd1111 : 0x1166dd,
    metalness: 0.9,
    roughness: 0.2,
  });
  const nutMesh = new THREE.Mesh(nutGeom, nutMat);
  nutMesh.position.x = isLeft ? -tireWidth / 2 - 0.015 : tireWidth / 2 + 0.015;
  wheelAssembly.add(nutMesh);

  // 3. Carbon-Ceramic Brake Disc & Brembo Caliper inside
  const brakeDiscGeom = new THREE.CylinderGeometry(0.165, 0.165, 0.025, 24);
  brakeDiscGeom.rotateZ(Math.PI / 2);
  const brakeMesh = new THREE.Mesh(brakeDiscGeom, matBrakeRotor);
  brakeMesh.position.x = isLeft ? -0.04 : 0.04;
  wheelAssembly.add(brakeMesh);

  const caliperGeom = new THREE.BoxGeometry(0.045, 0.12, 0.08);
  const caliperMesh = new THREE.Mesh(caliperGeom, matBrakeCaliper);
  caliperMesh.position.set(isLeft ? -0.04 : 0.04, 0.09, 0.06);
  wheelAssembly.add(caliperMesh);

  // 4. Over-wheel aerodynamic deflector winglet (front wheels)
  if (!isRear) {
    const deflectorGeom = new THREE.BoxGeometry(tireWidth + 0.06, 0.015, 0.28);
    deflectorGeom.rotateX(-0.35);
    const deflectorMesh = new THREE.Mesh(deflectorGeom, matDarkCarbon);
    deflectorMesh.position.set(0, tireRadius + 0.05, -0.08);
    wheelAssembly.add(deflectorMesh);
  }

  return wheelAssembly;
}

// Position wheels:
// Front Axle: Z = 1.75m, X = ±0.82m, Y = 0.36m (resting at Y = 0)
const wheelFL = createF1Wheel(false, true);
wheelFL.position.set(-0.84, 0.36, 1.75);
wheelsGroup.add(wheelFL);

const wheelFR = createF1Wheel(false, false);
wheelFR.position.set(0.84, 0.36, 1.75);
wheelsGroup.add(wheelFR);

// Rear Axle: Z = -1.65m, X = ±0.80m, Y = 0.36m
const wheelRL = createF1Wheel(true, true);
wheelRL.position.set(-0.82, 0.36, -1.65);
wheelsGroup.add(wheelRL);

const wheelRR = createF1Wheel(true, false);
wheelRR.position.set(0.82, 0.36, -1.65);
wheelsGroup.add(wheelRR);

car.add(wheelsGroup);

// Compute bounding box and normalize
const bbox = new THREE.Box3().setFromObject(car);
const size = new THREE.Vector3();
bbox.getSize(size);
console.log('F1 Car Bounding Box Dimensions:');
console.log(`  Length (Z): ${size.z.toFixed(2)} m`);
console.log(`  Width (X):  ${size.x.toFixed(2)} m`);
console.log(`  Height (Y): ${size.y.toFixed(2)} m`);
console.log(`  Min Y: ${bbox.min.y.toFixed(2)}, Max Y: ${bbox.max.y.toFixed(2)}`);

// Export to GLB
const exporter = new GLTFExporter();
const sceneToExport = new THREE.Scene();
sceneToExport.add(car);

console.log('Exporting GLB scene...');
exporter.parse(
  sceneToExport,
  (glbArrayBuffer) => {
    const outputPath = path.resolve('/app/applet/public/models/f1-car.glb');
    fs.writeFileSync(outputPath, Buffer.from(glbArrayBuffer));
    const stats = fs.statSync(outputPath);
    console.log(`Successfully generated ${outputPath}! File size: ${(stats.size / 1024).toFixed(1)} KB`);
  },
  (err) => {
    console.error('Error exporting GLB:', err);
    process.exit(1);
  },
  { binary: true }
);
