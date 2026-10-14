import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export interface LiveryOption {
  id: string;
  name: string;
  primaryColor: string; // hex
  secondaryColor: string;
  accentColor: string;
  description: string;
}

export const LIVERIES: LiveryOption[] = [
  {
    id: 'audi-green',
    name: 'Audi Revolut 2026',
    primaryColor: '#66ff00',
    secondaryColor: '#121418',
    accentColor: '#ffffff',
    description: 'Fluorescent Acid Green & Satin Obsidian Carbon',
  },
  {
    id: 'stealth-carbon',
    name: 'Stealth Carbon Red',
    primaryColor: '#e10600',
    secondaryColor: '#0a0a0c',
    accentColor: '#2a2d34',
    description: 'Raw Matte Carbon Fiber with Crimson Aero Strakes',
  },
  {
    id: 'monza-white',
    name: 'Monza Alpine Pearl',
    primaryColor: '#ffffff',
    secondaryColor: '#181b22',
    accentColor: '#52e000',
    description: 'Pure Pearl White Bodywork with Neon Aero Highlights',
  },
  {
    id: 'gulf-heritage',
    name: 'Gulf Heritage Blue',
    primaryColor: '#3a88c8',
    secondaryColor: '#ff6b00',
    accentColor: '#101726',
    description: 'Classic Racing Cyan & Tangerine Orange Racing Livery',
  },
];

export interface Hotspot {
  id: string;
  name: string;
  position: [number, number, number]; // relative to car
  targetCamera: [number, number, number];
  title: string;
  description: string;
  spec: string;
}

export const HOTSPOTS: Hotspot[] = [
  {
    id: 'front-wing',
    name: 'Front Wing Cascade',
    position: [0, 0.22, 2.25],
    targetCamera: [1.15, 0.65, 2.9],
    title: 'Multi-Element Aerodynamic Front Wing',
    description: 'Cascading ground-effect carbon flaps generating 42% of front downforce while directing clean laminar airflow around 18-inch front Pirelli tires.',
    spec: 'Estimated Downforce: ~680 kg @ 250 km/h (Simulated)',
  },
  {
    id: 'halo',
    name: 'Safety Halo',
    position: [0, 0.78, -0.35],
    targetCamera: [0.75, 1.15, 0.45],
    title: 'Grade 5 Titanium Safety Halo',
    description: 'Mandatory structural survival cockpit enclosure capable of sustaining 125 kilonewtons of vertical and lateral impact loads (equivalent to two double-decker buses).',
    spec: 'Standard Load Limit: 125 kN / 12.7 tonnes (FIA Reg)',
  },
  {
    id: 'steering',
    name: 'Cockpit Steering Wheel',
    position: [0, 0.55, -0.50],
    targetCamera: [0, 0.85, 0.15],
    title: 'Carbon Digital Multifunction Wheel',
    description: 'Integrated OLED telemetry display, 28 rotary dial switches for differential, brake bias, and engine maps, with dual magnetic carbon clutch paddles.',
    spec: 'Weight: ~1.25 kg / 4.3" Telemetry Display',
  },
  {
    id: 'wheels',
    name: 'Pirelli P-Zero Red C4',
    position: [0.85, 0.34, 2.03],
    targetCamera: [1.75, 0.55, 2.45],
    title: '18-Inch Forged BBS Wheels & Pirelli C4',
    description: 'Low-profile 720mm racing slick tires mounted on BBS magnesium alloy wheels with aerodynamic wheel cover discs to suppress turbulent rim wake.',
    spec: 'Optimal Temp Window: 100°C - 110°C (Target)',
  },
  {
    id: 'engine',
    name: '1.6L V6 Turbo Hybrid',
    position: [0.65, 0.45, -0.30],
    targetCamera: [1.45, 0.85, -0.2],
    title: '1.6L V6 Turbocharged Hybrid PU',
    description: 'Conceptual 2026 power unit architecture targeting 50%+ thermal efficiency with 350kW MGU-K electrical deployment directly to the rear axle.',
    spec: 'Estimated Output: ~1,000+ BHP Combined (Simulated)',
  },
  {
    id: 'drs-wing',
    name: 'Active DRS Rear Wing',
    position: [0, 0.82, -1.75],
    targetCamera: [1.10, 1.15, -2.45],
    title: 'Hydraulic Drag Reduction System',
    description: 'Upper flap opens 85mm on designated overtaking zones, shedding 38% aerodynamic drag and boosting top speed by up to 22 km/h.',
    spec: 'Actuation Time: <0.18s / Drag Delta: -38% (Simulated)',
  },
];

export type CameraPreset = 'hero' | 'cockpit' | 'side' | 'top' | 'rear';

interface F1CanvasProps {
  currentLivery: string;
  isDrsOpen: boolean;
  isDriving: boolean;
  speedKmh: number;
  cameraPreset: CameraPreset;
  activeHotspot: Hotspot | null;
  onHotspotSelect: (hotspot: Hotspot | null) => void;
  isWireframe: boolean;
}

export const F1Canvas: React.FC<F1CanvasProps> = ({
  currentLivery,
  isDrsOpen,
  isDriving,
  speedKmh,
  cameraPreset,
  activeHotspot,
  onHotspotSelect,
  isWireframe,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modelDetails, setModelDetails] = useState<string | null>(null);

  // References to Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const carModelRef = useRef<THREE.Group | null>(null);
  const originalMaterialsRef = useRef<Map<THREE.Mesh, THREE.Material | THREE.Material[]>>(new Map());

  // Balanced Front Three-Quarter Camera Angle:
  // Car is approximately 25-30% larger, prominent, and fully visible without clipping by HUD or dock
  const targetCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3(2.85, 1.25, 2.70));
  const targetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.38, 0.18));
  const isUserInteractingRef = useRef<boolean>(false);

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const isMobile = width < 768;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x07080a);

    // Subtle atmospheric studio depth fog blending into background
    scene.fog = new THREE.FogExp2(0x07080a, 0.035);

    // 2. Camera with automotive FOV (37 degrees)
    const camera = new THREE.PerspectiveCamera(37, width / height, 0.1, 100);
    const initialDistFactor = isMobile ? 1.28 : 1.0;
    camera.position.set(2.85 * initialDistFactor, 1.25 * initialDistFactor, 2.70 * initialDistFactor);
    cameraRef.current = camera;

    // 3. Renderer with ACESFilmicToneMapping & SRGBColorSpace
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Studio Environment Reflection (RoomEnvironment PMREM generator)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    pmremGenerator.dispose();

    // 5. Studio Lighting Rig
    // Key Light: High-precision directional spotlight casting soft shadows
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(5.0, 7.0, 5.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.camera.left = -4.5;
    keyLight.shadow.camera.right = 4.5;
    keyLight.shadow.camera.top = 4.5;
    keyLight.shadow.camera.bottom = -4.5;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    // Fill Light: Restrained cool ambient fill
    const fillLight = new THREE.DirectionalLight(0x6b829e, 1.2);
    fillLight.position.set(-5.5, 3.5, -3.5);
    scene.add(fillLight);

    // Rim/Backlight: Warm edge light defining carbon aerodynamics
    const rimLight = new THREE.DirectionalLight(0x88ee55, 1.5);
    rimLight.position.set(0, 3.5, -6.0);
    scene.add(rimLight);

    // Overhead Studio Softbox Light
    const topLight = new THREE.DirectionalLight(0xffffff, 1.0);
    topLight.position.set(0, 8.0, 0);
    scene.add(topLight);

    // Subtle ambient base
    const ambientLight = new THREE.AmbientLight(0x111317, 0.7);
    scene.add(ambientLight);

    // 6. Premium Dark Graphite Studio Floor & Subtle Technical Grid
    // Dark graphite studio floor plane (restrained reflections, no bright glare)
    const floorGeom = new THREE.PlaneGeometry(40, 40);
    floorGeom.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x090a0d,
      roughness: 0.86,
      metalness: 0.15,
    });
    floorMat.polygonOffset = true;
    floorMat.polygonOffsetFactor = 1;
    floorMat.polygonOffsetUnits = 1;
    const floorMesh = new THREE.Mesh(floorGeom, floorMat);
    floorMesh.position.y = -0.001;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Subtle technical grid in dark muted graphite (no harsh bright grey lines)
    const gridHelper = new THREE.GridHelper(28, 28, 0x181c26, 0x10131a);
    gridHelper.position.y = 0.0005;
    if (Array.isArray(gridHelper.material)) {
      gridHelper.material.forEach((m) => {
        m.transparent = true;
        m.opacity = 0.20;
        m.depthWrite = false;
      });
    } else {
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = 0.20;
      gridHelper.material.depthWrite = false;
    }
    scene.add(gridHelper);

    // 7. Grounding Contact Shadows: Diffused Underbody + Soft Tire Contact Patches
    // A. Master diffused underbody shadow
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 512;
    shadowCanvas.height = 512;
    const ctx = shadowCanvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(256, 256, 30, 256, 256, 240);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.88)');
    gradient.addColorStop(0.35, 'rgba(0, 0, 0, 0.55)');
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.18)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const underbodyShadowGeom = new THREE.PlaneGeometry(2.6, 5.4);
    underbodyShadowGeom.rotateX(-Math.PI / 2);
    const underbodyShadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    });
    const underbodyShadow = new THREE.Mesh(underbodyShadowGeom, underbodyShadowMat);
    underbodyShadow.position.set(0, 0.002, 0.2);
    scene.add(underbodyShadow);

    // B. Dedicated soft tire contact patch shadows (FL, FR, RL, RR)
    const tireCanvas = document.createElement('canvas');
    tireCanvas.width = 128;
    tireCanvas.height = 128;
    const tCtx = tireCanvas.getContext('2d')!;
    const tGrad = tCtx.createRadialGradient(64, 64, 12, 64, 64, 60);
    tGrad.addColorStop(0, 'rgba(0, 0, 0, 0.88)');
    tGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.42)');
    tGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    tCtx.fillStyle = tGrad;
    tCtx.fillRect(0, 0, 128, 128);
    const tireShadowTex = new THREE.CanvasTexture(tireCanvas);

    const tireShadowGeom = new THREE.PlaneGeometry(0.40, 0.46);
    tireShadowGeom.rotateX(-Math.PI / 2);
    const tireShadowMat = new THREE.MeshBasicMaterial({
      map: tireShadowTex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });

    // Front wheels at X = ±0.82, Z = 2.03
    const shadowFL = new THREE.Mesh(tireShadowGeom, tireShadowMat);
    shadowFL.position.set(-0.82, 0.003, 2.03);
    scene.add(shadowFL);

    const shadowFR = new THREE.Mesh(tireShadowGeom, tireShadowMat);
    shadowFR.position.set(0.82, 0.003, 2.03);
    scene.add(shadowFR);

    // Rear wheels at X = ±0.76, Z = -1.46
    const shadowRL = new THREE.Mesh(tireShadowGeom, tireShadowMat);
    shadowRL.position.set(-0.76, 0.003, -1.46);
    scene.add(shadowRL);

    const shadowRR = new THREE.Mesh(tireShadowGeom, tireShadowMat);
    shadowRR.position.set(0.76, 0.003, -1.46);
    scene.add(shadowRR);

    // 8. OrbitControls with smooth damping and touch support
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.6;
    controls.maxDistance = 12.0;
    controls.maxPolarAngle = Math.PI / 2 - 0.03; // Never clip beneath studio floor
    controls.target.set(0, 0.38, 0.18);
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };

    controls.addEventListener('start', () => {
      isUserInteractingRef.current = true;
    });

    // 9. Load Genuine 3D Formula 1 Race Car Model via GLTFLoader
    const loader = new GLTFLoader();
    const modelUrl = '/models/f1-car.glb';

    loader.load(
      modelUrl,
      (gltf) => {
        const car = gltf.scene;
        carModelRef.current = car;

        // Compute original bounding box
        const originalBox = new THREE.Box3().setFromObject(car);
        const originalSize = originalBox.getSize(new THREE.Vector3());

        // Target length of modern Formula 1 car is ~5.5 meters
        const targetLength = 5.5;
        const scaleFactor = originalSize.z > 0 ? targetLength / originalSize.z : 1;
        car.scale.setScalar(scaleFactor);

        // Recompute bounding box after scale
        const scaledBox = new THREE.Box3().setFromObject(car);
        const center = scaledBox.getCenter(new THREE.Vector3());

        // Position car so tires touch floor at Y = 0 and chassis is centered
        car.position.x = -center.x;
        car.position.y = -scaledBox.min.y;
        car.position.z = -center.z;

        // Traverse meshes to upgrade PBR materials, shadows, reflections
        let totalVertices = 0;
        let meshCount = 0;

        car.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            const mesh = node as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            meshCount++;

            if (mesh.geometry && mesh.geometry.attributes.position) {
              totalVertices += mesh.geometry.attributes.position.count;
            }

            // Cache original materials
            if (mesh.material) {
              originalMaterialsRef.current.set(mesh, mesh.material);

              const enhanceMaterial = (mat: THREE.Material) => {
                if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
                  const stdMat = mat as THREE.MeshStandardMaterial;
                  if (stdMat.map) {
                    stdMat.map.colorSpace = THREE.SRGBColorSpace;
                    stdMat.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
                  }
                  stdMat.envMapIntensity = 1.8;

                  // High-gloss automotive clearcoat look for bodywork
                  if (
                    mesh.name.includes('Mesh022') ||
                    mesh.name.includes('Body') ||
                    mesh.name.includes('Nose') ||
                    mesh.name.includes('Wing')
                  ) {
                    stdMat.roughness = 0.28;
                    stdMat.metalness = 0.40;
                  }
                  stdMat.needsUpdate = true;
                }
              };

              if (Array.isArray(mesh.material)) {
                mesh.material.forEach(enhanceMaterial);
              } else {
                enhanceMaterial(mesh.material);
              }
            }
          }
        });

        scene.add(car);
        setIsLoading(false);
        setModelDetails(`Genuine F1 Model: ${meshCount} CAD groups • ${totalVertices.toLocaleString()} vertices`);

        // Apply balanced front three-quarter framing targeting vehicle center
        const distMult = isMobile ? 1.28 : 1.0;
        targetCamPosRef.current.set(2.85 * distMult, 1.25 * distMult, 2.70 * distMult);
        targetLookAtRef.current.set(0, 0.38, 0.18);
      },
      (xhr) => {
        if (xhr.total > 0) {
          const pct = Math.round((xhr.loaded / xhr.total) * 100);
          setLoadProgress(pct);
        }
      },
      (err) => {
        console.error('Failed to load GLB model from public/models/f1-car.glb:', err);
        setLoadError(
          'Model file unavailable at "public/models/f1-car.glb". Please place a valid Formula 1 GLB model in the /public/models/ directory named f1-car.glb.'
        );
        setIsLoading(false);
      }
    );

    // 10. Render & Animation Loop with smooth exponential damp
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Smooth camera interpolation towards target when not interacting manually
      if (!isUserInteractingRef.current) {
        camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamPosRef.current.x, 3.5, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamPosRef.current.y, 3.5, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamPosRef.current.z, 3.5, delta);

        controls.target.x = THREE.MathUtils.damp(controls.target.x, targetLookAtRef.current.x, 4.0, delta);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, targetLookAtRef.current.y, 4.0, delta);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, targetLookAtRef.current.z, 4.0, delta);
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Handle container resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const mobileCheck = w < 768;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);

      if (!isUserInteractingRef.current && !activeHotspot) {
        const dMult = mobileCheck ? 1.28 : 1.0;
        if (cameraPreset === 'hero') {
          targetCamPosRef.current.set(2.85 * dMult, 1.25 * dMult, 2.70 * dMult);
        }
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      controls.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Livery Colors on Genuine Car Materials
  useEffect(() => {
    if (!carModelRef.current) return;
    const livery = LIVERIES.find((l) => l.id === currentLivery) || LIVERIES[0];
    const pColor = new THREE.Color(livery.primaryColor);
    const sColor = new THREE.Color(livery.secondaryColor);
    const aColor = new THREE.Color(livery.accentColor);

    carModelRef.current.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        const name = mesh.name;

        // Apply colors to relevant bodywork and aerodynamic surfaces
        const applyColor = (mat: THREE.Material) => {
          if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
            const stdMat = mat as THREE.MeshStandardMaterial;

            if (livery.id === 'audi-green') {
              // Audi Revolut: Acid green bodywork with satin carbon flanks
              if (name === 'Bits_Dup_2001_Mesh022' || name === 'Bits_Dup_2001_Mesh022_1' || name === 'Bits_Dup_2001_Mesh022_5') {
                stdMat.color.copy(pColor);
              } else if (name === 'Bits_Dup_2001_Mesh022_3' || name === 'Bits_Dup_2001_Mesh022_4') {
                stdMat.color.setHex(0x161e12);
              } else {
                stdMat.color.setHex(0xffffff);
              }
            } else if (livery.id === 'stealth-carbon') {
              // Stealth Carbon Red: Raw carbon obsidian body with crimson aero strakes
              if (name === 'Bits_Dup_2001_Mesh022_1' || name === 'Bits_Dup_2001_Mesh022_4') {
                stdMat.color.copy(pColor); // Red aero wings
              } else if (name === 'Bits_Dup_2001_Mesh022_5') {
                stdMat.color.setHex(0x30343e); // Titanium Halo
              } else {
                stdMat.color.setHex(0x18181c); // Deep matte carbon
              }
            } else if (livery.id === 'monza-white') {
              // Monza Alpine: Crisp white bodywork with emerald accents
              if (name === 'Bits_Dup_2001_Mesh022' || name === 'Bits_Dup_2001_Mesh022_1') {
                stdMat.color.copy(pColor); // White
              } else if (name === 'Bits_Dup_2001_Mesh022_4' || name === 'Bits_Dup_2001_Mesh022_5') {
                stdMat.color.copy(aColor); // Neon green
              } else {
                stdMat.color.setHex(0x22262e);
              }
            } else if (livery.id === 'gulf-heritage') {
              // Gulf Heritage: Cyan blue bodywork with vibrant tangerine orange
              if (name === 'Bits_Dup_2001_Mesh022') {
                stdMat.color.copy(pColor); // Cyan
              } else if (name === 'Bits_Dup_2001_Mesh022_1' || name === 'Bits_Dup_2001_Mesh022_4') {
                stdMat.color.copy(sColor); // Orange nose & rear wing
              } else {
                stdMat.color.setHex(0x1a202c);
              }
            }
            stdMat.needsUpdate = true;
          }
        };

        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(applyColor);
          } else {
            applyColor(mesh.material);
          }
        }
      }
    });
  }, [currentLivery]);

  // Update Wireframe state
  useEffect(() => {
    if (!carModelRef.current) return;
    carModelRef.current.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        if (mesh.material) {
          const toggleWire = (mat: THREE.Material) => {
            if ('wireframe' in mat) {
              (mat as THREE.MeshStandardMaterial).wireframe = isWireframe;
            }
          };
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(toggleWire);
          } else {
            toggleWire(mesh.material);
          }
        }
      }
    });
  }, [isWireframe]);

  // Update Camera Target based on Preset or Selected Hotspot
  useEffect(() => {
    isUserInteractingRef.current = false;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const distMult = isMobile ? 1.28 : 1.0;

    if (activeHotspot) {
      targetCamPosRef.current.set(
        activeHotspot.targetCamera[0] * distMult,
        activeHotspot.targetCamera[1],
        activeHotspot.targetCamera[2] * distMult
      );
      targetLookAtRef.current.set(
        activeHotspot.position[0],
        activeHotspot.position[1],
        activeHotspot.position[2]
      );
      return;
    }

    switch (cameraPreset) {
      case 'hero':
        // Balanced Front Three-Quarter (approx 25-30% larger, prominent and uncropped)
        targetCamPosRef.current.set(2.85 * distMult, 1.25 * distMult, 2.70 * distMult);
        targetLookAtRef.current.set(0, 0.38, 0.18);
        break;
      case 'cockpit':
        targetCamPosRef.current.set(0, 0.92, 0.40);
        targetLookAtRef.current.set(0, 0.55, 2.8);
        break;
      case 'side':
        targetCamPosRef.current.set(4.6 * distMult, 0.65, 0.15);
        targetLookAtRef.current.set(0, 0.38, 0.15);
        break;
      case 'top':
        targetCamPosRef.current.set(0.01, 5.6 * distMult, 0.15);
        targetLookAtRef.current.set(0, 0, 0.15);
        break;
      case 'rear':
        targetCamPosRef.current.set(-2.0 * distMult, 1.15, -3.4 * distMult);
        targetLookAtRef.current.set(0, 0.45, -0.8);
        break;
    }
  }, [cameraPreset, activeHotspot]);

  return (
    <div className="relative w-full h-full select-none">
      {/* 3D Canvas WebGL Mount */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#07080a] flex flex-col items-center justify-center z-30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full border-2 border-[#66ff00] border-t-transparent animate-spin" />
            <span className="font-chakra text-lg font-bold tracking-widest text-white uppercase">
              APEX 3D RENDER ENGINE
            </span>
          </div>
          <div className="w-64 h-1.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-[#66ff00] transition-all duration-300"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
          <p className="mt-3 text-xs font-mono-tech text-gray-400">
            Importing genuine Formula 1 CAD geometry & PBR pipeline... {loadProgress}%
          </p>
        </div>
      )}

      {/* Error Notice */}
      {loadError && (
        <div className="absolute inset-0 bg-[#07080a]/95 flex flex-col items-center justify-center z-30 p-6 text-center">
          <div className="text-red-500 font-chakra text-xl font-bold mb-3 flex items-center gap-2">
            <span>MODEL NOT FOUND / LOAD ERROR</span>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 max-w-lg text-left font-mono-tech text-xs text-gray-300 mb-4 leading-relaxed">
            <p className="mb-2 font-bold text-white">Expected model destination:</p>
            <code className="text-[#66ff00] bg-black/60 px-2 py-1 rounded block mb-3 border border-white/10">
              public/models/f1-car.glb
            </code>
            <p className="text-gray-400">{loadError}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-mono-tech border border-white/20 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Viewport Info & Interaction Legend */}
      {!isLoading && !loadError && (
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 pointer-events-none">
          <div className="bg-black/70 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-md text-xs font-mono-tech text-gray-300 flex items-center gap-2 pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-[#66ff00] inline-block" />
            <span>ORBIT: L-DRAG</span>
            <span className="text-gray-500">|</span>
            <span>ZOOM: SCROLL / PINCH</span>
            <span className="text-gray-500">|</span>
            <span>PAN: R-DRAG</span>
          </div>

          {modelDetails && (
            <div className="bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded text-[10px] font-mono-tech text-gray-400 flex items-center gap-2">
              <span className="text-emerald-400">GENUINE CAD MODEL LOADED</span>
              <span className="text-gray-600">•</span>
              <span>{modelDetails}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

