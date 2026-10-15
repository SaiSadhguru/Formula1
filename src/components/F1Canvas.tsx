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
  const [retryCount, setRetryCount] = useState<number>(0);
  const disposed = useRef<boolean>(false);

  // Camera target animation refs
  const targetCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3(3.4, 1.35, 3.2));
  const targetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.38, 0.18));
  const isUserInteractingRef = useRef<boolean>(false);

  // Model bounding box center and radius for dynamic framing
  const modelBoundsRef = useRef<{ center: THREE.Vector3; radius: number; size: THREE.Vector3 } | null>(null);

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Reset error state on each mount or retry
    setLoadError(null);
    setIsLoading(true);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const isMobile = width < 768;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x07080a);

    // Subtle atmospheric studio depth fog blending into background
    scene.fog = new THREE.FogExp2(0x07080a, 0.035);

    // 2. Camera with balanced automotive FOV (36 degrees)
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    // Hero 3/4 framing: 
    // Positioned to provide clear clearance for top telemetry HUD and bottom dock
    const initialDistFactor = isMobile ? 1.35 : 1.05;
    camera.position.set(3.4 * initialDistFactor, 1.35 * initialDistFactor, 3.2 * initialDistFactor);
    cameraRef.current = camera;

    // 3. Renderer with ACESFilmicToneMapping & SRGBColorSpace with safe single-context allocation
    let renderer: THREE.WebGLRenderer | null = null;
    let webglDiagnosticInfo = '';

    // ── WebGL capability probe ─────────────────────────────────────────────────
    // IMPORTANT: We test WebGL support on a *separate* throw-away canvas.
    // We must NOT pass that canvas to THREE.WebGLRenderer, because browsers
    // allow only ONE WebGL context per <canvas> element. Reusing a canvas
    // that already has a context attached causes "Error creating WebGL context"
    // (GL_RENDERER = Disabled / context exhausted).
    const probeCanvas = document.createElement('canvas');
    probeCanvas.width = 1;
    probeCanvas.height = 1;
    let webglAvailable = false;
    try {
      const probe = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
      if (probe) {
        webglAvailable = true;
        const debugInfo = (probe as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
        const unmaskedRenderer = debugInfo
          ? (probe as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
          : 'Standard WebGL';
        console.info('F1Canvas: WebGL hardware capability confirmed:', unmaskedRenderer);
        // Lose context on the probe immediately so we do not hold GPU resources
        const loseCtx = (probe as WebGLRenderingContext).getExtension('WEBGL_lose_context');
        if (loseCtx) loseCtx.loseContext();
      }
    } catch {
      // probe failed — treat as unavailable
    }

    if (!webglAvailable) {
      webglDiagnosticInfo =
        'Browser or GPU driver reported that WebGL context creation failed. ' +
        'In Chrome, check chrome://gpu — if "Hardware Accelerated" is disabled, ' +
        'enable it at chrome://settings/system or launch Chrome without --disable-gpu flags.';
      console.warn('F1Canvas: WebGL probe returned null. Diagnostic:', webglDiagnosticInfo);
    }

    // Create a fresh canvas for the renderer.
    // Do NOT reuse probeCanvas — that canvas has already had its context
    // allocated and browsers enforce a 1-context-per-canvas limit.
    const rendererCanvas = document.createElement('canvas');

    if (webglAvailable) {
      // Only attempt renderer creation when the probe confirmed WebGL works.
      try {
        renderer = new THREE.WebGLRenderer({
          canvas: rendererCanvas,
          antialias: !isMobile, // skip AA on mobile to save GPU budget
          powerPreference: 'high-performance',
          alpha: false,
          failIfMajorPerformanceCaveat: false,
        });
        const gl = renderer.getContext();
        if (!gl || gl.isContextLost()) {
          throw new Error('Renderer context is null or lost immediately after creation');
        }
      } catch (rendererErr) {
        console.error('F1Canvas: THREE.WebGLRenderer creation failed:', rendererErr);
        renderer = null;
      }
    }

    if (!renderer) {
      setLoadError(
        webglDiagnosticInfo ||
          'Unable to initialize a WebGL rendering context. ' +
          'This may be caused by hardware acceleration being disabled in Chrome ' +
          '(chrome://settings/system → "Use graphics acceleration when available"), ' +
          'a GPU process crash, or an exhausted context limit. ' +
          'Telemetry, Pit Strategy, and all other features remain fully operational below.',
      );
      setIsLoading(false);
      return;
    }

    rendererRef.current = renderer;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.20;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap; // PCFShadowMap provides standard high-fidelity filtered shadows

    // Handle WebGL context lost & restored lifecycle gracefully
    let isContextLost = false;
    const canvasElement = renderer.domElement;

    const handleContextLost = (event: Event) => {
      event.preventDefault(); // Required by WebGL spec to allow context restore
      console.error('F1Canvas: WebGL context lost. GPU resources exhausted. Pausing render loop.', {
        contextLost: true,
      });
      isContextLost = true;
      setLoadError('WebGL graphics context was temporarily lost. You can retry initialization.');
    };

    const handleContextRestored = () => {
      console.info('F1Canvas: WebGL context restored. Rebuilding rendering state.');
      isContextLost = false;
      setLoadError(null);
      // User must click Retry to reinitialize — do not auto-retry
    };

    canvasElement.addEventListener('webglcontextlost', handleContextLost, false);
    canvasElement.addEventListener('webglcontextrestored', handleContextRestored, false);

    // Remove any stale canvas from a previous renderer without wiping other React children
    const staleCanvas = container.querySelector('canvas');
    if (staleCanvas) {
      container.removeChild(staleCanvas);
    }
    container.appendChild(renderer.domElement);

    // 4. Studio Environment Reflection (RoomEnvironment PMREM generator)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    pmremGenerator.dispose();

    // 5. Studio Lighting Rig
    // Key Light: High-precision directional spotlight casting soft shadows
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
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
    const fillLight = new THREE.DirectionalLight(0x6b829e, 1.1);
    fillLight.position.set(-5.5, 3.5, -3.5);
    scene.add(fillLight);

    // Rim/Backlight: Warm edge light defining carbon aerodynamics
    const rimLight = new THREE.DirectionalLight(0x88ee55, 1.3);
    rimLight.position.set(0, 3.5, -6.0);
    scene.add(rimLight);

    // Overhead Studio Softbox Light
    const topLight = new THREE.DirectionalLight(0xffffff, 0.9);
    topLight.position.set(0, 8.0, 0);
    scene.add(topLight);

    // Subtle ambient base
    const ambientLight = new THREE.AmbientLight(0x111317, 0.65);
    scene.add(ambientLight);

    // 6. Premium Dark Graphite Studio Floor & Subtle Technical Grid
    // Dark graphite studio floor plane (restrained reflections, no bright glare)
    const floorGeom = new THREE.PlaneGeometry(50, 50);
    floorGeom.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x090a0d,
      roughness: 0.88,
      metalness: 0.12,
    });
    floorMat.polygonOffset = true;
    floorMat.polygonOffsetFactor = 1;
    floorMat.polygonOffsetUnits = 1;
    const floorMesh = new THREE.Mesh(floorGeom, floorMat);
    floorMesh.position.y = -0.001;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Subtle technical grid in dark muted graphite (reduced contrast, very subtle studio feel)
    const gridHelper = new THREE.GridHelper(30, 30, 0x141720, 0x0c0e14);
    gridHelper.position.y = 0.0005;
    if (Array.isArray(gridHelper.material)) {
      gridHelper.material.forEach((m) => {
        m.transparent = true;
        m.opacity = 0.12;
        m.depthWrite = false;
      });
    } else {
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = 0.12;
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

    // Reset auto-pilot once the user finishes interacting
    controls.addEventListener('end', () => {
      isUserInteractingRef.current = false;
    });

    // 9. Load Genuine 3D Formula 1 Race Car Model via GLTFLoader
    const loader = new GLTFLoader();
    const modelUrl = '/models/f1-car.glb';

    // Guard against StrictMode double-mount: if effect has cleaned up before
    // the async GLB load completes, discard the result silently.
    disposed.current = false;

    loader.load(
      modelUrl,
      (gltf) => {
        // Effect was cleaned up before the async load finished — discard silently
        if (disposed.current) return;

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
            totalVertices += mesh.geometry.attributes.position
              ? mesh.geometry.attributes.position.count
              : 0;

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

        console.info('F1Canvas: GLB model loaded successfully', {
          meshCount: meshCount,
          totalVertices: totalVertices,
        });
        scene.add(car);
        setIsLoading(false);
        setModelDetails(`Genuine F1 Model: ${meshCount} CAD groups • ${totalVertices.toLocaleString()} vertices`);

        // Calculate model bounding box and sphere for precise camera framing
        const boundingBox = new THREE.Box3().setFromObject(car);
        const boundingSphere = new THREE.Sphere();
        boundingBox.getBoundingSphere(boundingSphere);
        const boxSize = boundingBox.getSize(new THREE.Vector3());

        modelBoundsRef.current = {
          center: boundingSphere.center.clone(),
          radius: boundingSphere.radius,
          size: boxSize.clone(),
        };

        // Frame the vehicle dynamically based on its bounding sphere
        // For PerspectiveCamera with fov=36 deg, distance to fit sphere of radius R:
        // dist = R / sin(fov / 2)
        // Set framing distance and target offset so all four wheels and both wings remain clearly visible above the bottom control dock
        const fovRad = (camera.fov * Math.PI) / 180;
        const fitDistance = (boundingSphere.radius / Math.sin(fovRad / 2)) * 1.14; 
        const aspectCorrection = width < height ? Math.max(1.0, (height / width) * 0.75) : 1.0;
        const heroDist = fitDistance * (isMobile ? 1.30 : 1.05) * aspectCorrection;

        // Balanced front three-quarter hero angle:
        // Position at ~45° azimuth and ~23° elevation
        const heroAzimuth = Math.PI * 0.25;
        const heroElevation = Math.sin((23 * Math.PI) / 180);
        const heroGroundDist = heroDist * Math.cos((23 * Math.PI) / 180);

        // Raise target Y to center car vertically in the visible space above the bottom dock
        const targetY = boundingSphere.center.y * 0.85 + 0.38;
        targetLookAtRef.current.set(boundingSphere.center.x, targetY, boundingSphere.center.z);

        targetCamPosRef.current.set(
          heroGroundDist * Math.sin(heroAzimuth),
          targetY + heroDist * heroElevation,
          heroGroundDist * Math.cos(heroAzimuth)
        );

        // Update orbit controls limits to safe automotive inspection ranges
        controls.minDistance = boundingSphere.radius * 0.65;
        controls.maxDistance = boundingSphere.radius * 4.2;
        controls.target.copy(targetLookAtRef.current);
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

    // 10. Render & Animation Loop with modern THREE.Timer (replaces deprecated THREE.Clock)
    let animationFrameId: number;
    const timer = new THREE.Timer();

    const animate = (timestamp: number) => {
      animationFrameId = requestAnimationFrame(animate);

      // Halt rendering passes if WebGL context is lost
      if (isContextLost) return;

      timer.update(timestamp);
      const delta = timer.getDelta();

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
      try {
        renderer.render(scene, camera);
      } catch (renderError) {
        console.error('Three.js render cycle error:', renderError);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    // Handle container resize safely with ResizeObserver & dimension guards
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = Math.max(container.clientWidth, 10);
      const h = Math.max(container.clientHeight, 10);
      const mobileCheck = w < 768;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);

      if (!isUserInteractingRef.current && !activeHotspot) {
        const bounds = modelBoundsRef.current;
        if (bounds) {
          const fovRad = (camera.fov * Math.PI) / 180;
          const fitDistance = (bounds.radius / Math.sin(fovRad / 2)) * 1.14;
          const aspectCorrection = w < h ? Math.max(1.0, (h / w) * 0.75) : 1.0;
          const heroDist = fitDistance * (mobileCheck ? 1.30 : 1.05) * aspectCorrection;

          const heroAzimuth = Math.PI * 0.25;
          const heroElevation = Math.sin((23 * Math.PI) / 180);
          const heroGroundDist = heroDist * Math.cos((23 * Math.PI) / 180);

          const targetY = bounds.center.y * 0.85 + 0.38;
          targetLookAtRef.current.set(bounds.center.x, targetY, bounds.center.z);

          if (cameraPreset === 'hero') {
            targetCamPosRef.current.set(
              heroGroundDist * Math.sin(heroAzimuth),
              targetY + heroDist * heroElevation,
              heroGroundDist * Math.cos(heroAzimuth)
            );
          }
        }
      }
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(container);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      // Signal any in-flight async operations (GLB load) to discard their results
      disposed.current = true;

      cancelAnimationFrame(animationFrameId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', handleResize);
      canvasElement.removeEventListener('webglcontextlost', handleContextLost);
      canvasElement.removeEventListener('webglcontextrestored', handleContextRestored);
      controls.dispose();

      // Clear model ref so livery/wireframe effects don't traverse a disposed scene
      carModelRef.current = null;
      originalMaterialsRef.current.clear();

      // Deep dispose scene objects safely
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry) {
            mesh.geometry.dispose();
          }
        }
      });

      if (scene.environment) {
        scene.environment.dispose();
      }

      // Dispose renderer resources cleanly without forceContextLoss() destroying GPU context on remounts
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [retryCount]);

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

    const bounds = modelBoundsRef.current;
    const baseRadius = bounds ? bounds.radius : 3.2;
    const center = bounds ? bounds.center : new THREE.Vector3(0, 0.38, 0.18);
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    const aspectCorrection = w < h ? Math.max(1.0, (h / w) * 0.75) : 1.0;
    const safeHeroDist = baseRadius * 1.95 * distMult * aspectCorrection;

    switch (cameraPreset) {
      case 'hero': {
        const heroAzimuth = Math.PI * 0.25;
        const heroElevation = Math.sin((23 * Math.PI) / 180);
        const heroGroundDist = safeHeroDist * Math.cos((23 * Math.PI) / 180);
        const targetY = center.y * 0.85 + 0.38;
        targetLookAtRef.current.set(center.x, targetY, center.z);
        targetCamPosRef.current.set(
          heroGroundDist * Math.sin(heroAzimuth),
          targetY + safeHeroDist * heroElevation,
          heroGroundDist * Math.cos(heroAzimuth)
        );
        break;
      }
      case 'cockpit':
        targetCamPosRef.current.set(0, 0.95, 0.42);
        targetLookAtRef.current.set(0, 0.55, 2.8);
        break;
      case 'side': {
        const sideDist = baseRadius * 1.65 * distMult * aspectCorrection;
        targetCamPosRef.current.set(sideDist, center.y + 0.2, center.z);
        targetLookAtRef.current.set(center.x, center.y, center.z);
        break;
      }
      case 'top': {
        const topDist = baseRadius * 1.95 * distMult * aspectCorrection;
        targetCamPosRef.current.set(0.01, topDist, center.z);
        targetLookAtRef.current.set(center.x, center.y, center.z);
        break;
      }
      case 'rear': {
        const rearDist = baseRadius * 1.65 * distMult * aspectCorrection;
        targetCamPosRef.current.set(
          -rearDist * 0.45,
          center.y + 0.85,
          -rearDist * 0.9
        );
        targetLookAtRef.current.set(center.x, center.y + 0.15, center.z - 0.4);
        break;
      }
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

      {/* Viewport Scoped Error / Fallback UI */}
      {loadError && (
        <div className="absolute inset-0 bg-[#07080a]/90 backdrop-blur-md flex flex-col items-center justify-center z-30 p-6 text-center select-none">
          {/* Subtle F1 Wireframe / Aero Vector Graphic */}
          <div className="relative w-72 sm:w-96 h-36 sm:h-44 mb-4 flex items-center justify-center opacity-80">
            <svg viewBox="0 0 400 160" className="w-full h-full stroke-[#66ff00] fill-none" strokeWidth="1.5">
              {/* Ground & Aerodynamic Flow lines */}
              <path d="M 10 140 L 390 140" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
              <path d="M 30 110 Q 120 70 200 95 T 370 70" stroke="rgba(102,255,0,0.3)" strokeWidth="1" strokeDasharray="3 3" />
              <path d="M 20 125 Q 110 85 220 110 T 380 90" stroke="rgba(102,255,0,0.2)" strokeWidth="1" />
              {/* Formula 1 Car Technical Silhouette */}
              {/* Front Wing */}
              <path d="M 40 128 L 75 128 L 78 116 L 45 116 Z" className="fill-[#66ff00]/10" />
              {/* Front Wheel */}
              <rect x="70" y="98" width="28" height="34" rx="4" className="stroke-[#66ff00] fill-black/60" />
              {/* Nosecone & Cockpit */}
              <path d="M 78 120 L 140 115 L 175 92 L 230 92 L 255 102 L 315 106 L 315 128 L 100 128" />
              {/* Halo & Helmet */}
              <path d="M 180 92 Q 200 78 215 92" strokeWidth="2" />
              <circle cx="198" cy="86" r="6" className="fill-[#66ff00]/40" />
              {/* Sidepod & Engine Cover */}
              <path d="M 160 115 L 245 105 L 295 90 L 315 112" />
              <path d="M 225 80 L 290 80 L 290 102" />
              {/* Rear Wheel */}
              <rect x="295" y="94" width="32" height="38" rx="4" className="stroke-[#66ff00] fill-black/60" />
              {/* Rear Wing & Endplate */}
              <path d="M 325 82 L 360 82 L 360 120 L 335 120" />
              <path d="M 330 88 L 358 88" strokeWidth="2" />
              <path d="M 330 96 L 358 96" strokeWidth="1.5" />
            </svg>
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 border border-amber-500/40 text-[9px] font-mono-tech text-amber-400">
              FALLBACK SCHEMATIC
            </div>
          </div>

          <div className="text-amber-400 font-chakra text-lg sm:text-xl font-bold mb-2 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span>{loadError.includes('WebGL') ? 'WEBGL HARDWARE ACCELERATION OFFLINE' : '3D ASSET STREAM DELAYED'}</span>
          </div>

          <div className="bg-black/70 border border-amber-500/30 rounded-xl p-3 sm:p-4 max-w-md text-left font-mono-tech text-xs text-gray-300 mb-4 shadow-xl">
            <p className="text-gray-300 mb-1.5 leading-relaxed">{loadError}</p>
            <p className="text-[11px] text-[#66ff00]/80">
              ✓ Telemetry HUD, Pit Strategy Calculator, Audio Player, and Technical Specifications below remain 100% operational.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {retryCount < 2 ? (
              <button
                onClick={() => {
                  // Only clear UI state here. The effect cleanup (return fn) manages
                  // disposed.current and renderer disposal when retryCount changes.
                  setLoadError(null);
                  setIsLoading(true);
                  setRetryCount((prev) => prev + 1);
                }}
                className="px-4 py-2 bg-[#66ff00] hover:bg-[#58dc00] text-black font-chakra font-black rounded-lg text-xs tracking-wider uppercase transition-colors cursor-pointer shadow-[0_0_14px_rgba(102,255,0,0.4)]"
              >
                Retry 3D Engine
              </button>
            ) : (
              <div className="px-4 py-2 bg-white/5 border border-amber-500/30 text-amber-400 font-mono-tech rounded-lg text-[10px] text-center max-w-xs leading-relaxed">
                WebGL context could not be established after retry.
                <br />
                Check <strong>chrome://settings/system</strong> or enable hardware acceleration, then reload the page.
              </div>
            )}
            <a
              href="#pit-strategy"
              onClick={(e) => {
                e.preventDefault();
                const target = document.getElementById('pit-strategy');
                if (target) {
                  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  window.history.pushState(null, '', '#pit-strategy');
                }
              }}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-chakra font-bold tracking-wider uppercase border border-white/20 transition-colors cursor-pointer"
            >
              View Pit Strategy
            </a>
          </div>
        </div>
      )}

      {/* Viewport Info & Interaction Legend */}
      {!isLoading && !loadError && (
        <div className="absolute top-[82px] sm:top-[92px] md:top-[98px] left-3 sm:left-4 z-20 flex flex-col items-start gap-1.5 pointer-events-none max-w-[calc(100vw-2rem)]">
          <div className="bg-black/75 backdrop-blur-md border border-white/10 px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-mono-tech text-gray-300 flex flex-wrap items-center gap-1.5 sm:gap-2 pointer-events-auto shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[#66ff00] inline-block shrink-0" />
            <span className="font-semibold text-white">ORBIT: L-DRAG</span>
            <span className="text-gray-600">|</span>
            <span>ZOOM: SCROLL</span>
            <span className="text-gray-600">|</span>
            <span>PAN: R-DRAG</span>
          </div>

          {modelDetails && (
            <div className="bg-black/70 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-md text-[9px] sm:text-[10px] font-mono-tech text-gray-400 flex items-center gap-1.5 pointer-events-auto shadow-md">
              <span className="text-emerald-400 font-semibold">CAD PIPELINE ACTIVE</span>
              <span className="text-gray-600">•</span>
              <span className="truncate">{modelDetails}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

