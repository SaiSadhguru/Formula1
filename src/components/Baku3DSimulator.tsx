import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  Play,
  Pause,
  RotateCcw,
  Camera,
  CheckCircle,
  Flag,
  Zap,
  Gauge,
  Trophy,
  AlertTriangle,
  Info,
  Car,
} from 'lucide-react';
import { createBakuSpline, getBakuGridSlots, getSectorFromProgress, BAKU_3D_CENTERLINE } from '../utils/bakuTrackGeometry.ts';
import { buildBakuCircuitScene } from '../utils/bakuCircuitBuilder.ts';
import {
  SimCarProfile,
  GRID_CARS,
  createF1CarMesh,
  InputControls,
  CarPhysicsState,
} from '../utils/simCarEngine.ts';
import { BAKU_CIRCUIT } from '../types/circuits.ts';

interface Baku3DSimulatorProps {
  onSpeedUpdate?: (speedKmh: number) => void;
  onLapUpdate?: (lap: number, sector: 1 | 2 | 3) => void;
}

export const Baku3DSimulator: React.FC<Baku3DSimulatorProps> = ({
  onSpeedUpdate,
  onLapUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedCarId, setSelectedCarId] = useState<string>('audi-green');
  const [cameraMode, setCameraMode] = useState<'chase' | 'overhead' | 'tv'>('chase');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [webglError, setWebglError] = useState<string | null>(null);

  // Live telemetry overlay state
  const [hudSpeedKmh, setHudSpeedKmh] = useState<number>(0);
  const [hudGear, setHudGear] = useState<number>(1);
  const [hudRpm, setHudRpm] = useState<number>(4500);
  const [hudLap, setHudLap] = useState<number>(1);
  const [hudSector, setHudSector] = useState<1 | 2 | 3>(3);
  const [hudCurrentLapTime, setHudCurrentLapTime] = useState<number>(0);
  const [hudBestLapTime, setHudBestLapTime] = useState<number | null>(null);
  const [hudPosition, setHudPosition] = useState<number>(1);
  const [isOffTrack, setIsOffTrack] = useState<boolean>(false);

  // Minimap player and opponents normalized coordinates (0..100)
  const [minimapPlayer, setMinimapPlayer] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [minimapOpponents, setMinimapOpponents] = useState<Array<{ id: string; x: number; y: number; color: string }>>([]);

  // Physics & controls reference state (kept out of React render loops for 60fps responsiveness)
  const inputRef = useRef<InputControls>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    handbrake: false,
    reset: false,
  });

  const playerStateRef = useRef<CarPhysicsState>({
    x: -180,
    z: 300,
    heading: 0,
    speed: 0,
    steerAngle: 0,
    lap: 1,
    sector: 3,
    progress: 0.04,
    crossedSFLastFrame: false,
    lapStartTime: Date.now(),
    currentLapTime: 0,
    bestLapTime: null,
    offTrack: false,
    gear: 1,
    rpm: 4500,
  });

  // Opponents states: 5 AI cars running along spline
  const opponentsRef = useRef<
    Array<{
      profile: SimCarProfile;
      progress: number;
      speed: number;
      group: THREE.Group | null;
    }>
  >([]);

  // Keyboard input listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement).tagName.toLowerCase())) return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          inputRef.current.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          inputRef.current.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          inputRef.current.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          inputRef.current.right = true;
          break;
        case 'Space':
          inputRef.current.handbrake = true;
          e.preventDefault();
          break;
        case 'KeyR':
          inputRef.current.reset = true;
          break;
        case 'KeyC':
          setCameraMode((prev) => (prev === 'chase' ? 'overhead' : prev === 'overhead' ? 'tv' : 'chase'));
          break;
        case 'Escape':
          setIsPaused((prev) => !prev);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          inputRef.current.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          inputRef.current.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          inputRef.current.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          inputRef.current.right = false;
          break;
        case 'Space':
          inputRef.current.handbrake = false;
          break;
        case 'KeyR':
          inputRef.current.reset = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Reset player and opponents to starting grid positions
  const resetToGrid = () => {
    const slots = getBakuGridSlots(6);
    const playerSlot = slots[0];

    playerStateRef.current = {
      x: playerSlot.position.x,
      z: playerSlot.position.z,
      heading: playerSlot.heading,
      speed: 0,
      steerAngle: 0,
      lap: 1,
      sector: 3,
      progress: 0.04,
      crossedSFLastFrame: false,
      lapStartTime: Date.now(),
      currentLapTime: 0,
      bestLapTime: playerStateRef.current.bestLapTime,
      offTrack: false,
      gear: 1,
      rpm: 4500,
    };

    // Reset opponents behind player
    opponentsRef.current.forEach((opp, i) => {
      const slot = slots[i + 1] || slots[slots.length - 1];
      opp.progress = Math.max(0, 0.04 - (i + 1) * 0.015);
      opp.speed = 26 + i * 2.2;
      if (opp.group) {
        opp.group.position.set(slot.position.x, 0.2, slot.position.z);
        opp.group.rotation.y = slot.heading;
      }
    });

    setHudLap(1);
    setHudSpeedKmh(0);
    setHudGear(1);
    setHudRpm(4500);
  };

  // Convert 3D world (X: -260..320, Z: -80..490) to normalized 2D minimap percentage (0..100)
  const worldToMinimap = (x: number, z: number) => {
    const minX = -260;
    const maxX = 330;
    const minZ = -90;
    const maxZ = 500;
    const normX = Math.round(((x - minX) / (maxX - minX)) * 88 + 6);
    const normY = Math.round((1 - (z - minZ) / (maxZ - minZ)) * 88 + 6);
    return { x: normX, y: normY };
  };

  // Main 3D Simulation WebGL Lifecycle
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setWebglError(null);

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06070a);
    scene.fog = new THREE.FogExp2(0x06070a, 0.0028);

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(46, width / height, 0.5, 2200);
    camera.position.set(-180, 15, 260);

    // 2. Safe WebGL Renderer initialization with isolated throw-away probe
    const probe = document.createElement('canvas');
    let hasWebGL = false;
    try {
      const gl = probe.getContext('webgl2') || probe.getContext('webgl');
      if (gl) {
        hasWebGL = true;
        const lose = (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context');
        if (lose) lose.loseContext();
      }
    } catch {
      hasWebGL = false;
    }

    if (!hasWebGL) {
      setWebglError('WebGL is disabled or unsupported in this browser environment. Showing 3D track fallback schematic.');
      return;
    }

    const canvas = document.createElement('canvas');
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      container.appendChild(renderer.domElement);
    } catch (e) {
      setWebglError('Unable to create WebGLRenderer instance. Context exhausted or blocked.');
      return;
    }

    // 3. Lighting: High-angle Caspian sun direction + ambient studio fill
    const sunLight = new THREE.DirectionalLight(0xfffaea, 3.2);
    sunLight.position.set(160, 260, 160);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 850;
    const d = 260;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x2d3648, 1.4);
    scene.add(ambientLight);

    // 4. Build 3D Baku Circuit Road, Kerbs, Barriers, and Scenery
    const circuitEnvironment = buildBakuCircuitScene();
    scene.add(circuitEnvironment);

    // 5. Build and place cars on grid
    const spline = createBakuSpline();
    const slots = getBakuGridSlots(GRID_CARS.length);

    // Player Car Mesh
    const selectedProfile = GRID_CARS.find((c) => c.id === selectedCarId) || GRID_CARS[0];
    const playerCarMesh = createF1CarMesh({ ...selectedProfile, isPlayer: true });
    playerCarMesh.position.set(slots[0].position.x, 0.2, slots[0].position.z);
    scene.add(playerCarMesh);

    // Opponent Cars Meshes
    const otherCars = GRID_CARS.filter((c) => c.id !== selectedCarId);
    opponentsRef.current = otherCars.map((profile, idx) => {
      const oppMesh = createF1CarMesh({ ...profile, isPlayer: false });
      const slot = slots[idx + 1] || slots[slots.length - 1];
      oppMesh.position.set(slot.position.x, 0.2, slot.position.z);
      scene.add(oppMesh);

      return {
        profile,
        progress: Math.max(0, 0.04 - (idx + 1) * 0.015),
        speed: 28 + Math.random() * 8, // m/s (~100 to 130 km/h baseline racing pace)
        group: oppMesh,
      };
    });

    // Initialize player state at Grid P1
    playerStateRef.current.x = slots[0].position.x;
    playerStateRef.current.z = slots[0].position.z;
    playerStateRef.current.heading = slots[0].heading;
    playerStateRef.current.speed = 0;

    // 6. Physics Simulation & Animation Loop
    let animationId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      animationId = requestAnimationFrame(animate);
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1); // clamp dt to avoid huge step after tab unfocus
      lastTime = currentTime;

      if (!isPaused) {
        const input = inputRef.current;
        const player = playerStateRef.current;

        // Reset check
        if (input.reset) {
          resetToGrid();
        }

        // --- Improved Player Physics Engine (Balanced F1 Arcade Dynamics) ---
        const maxSpeedForward = 92; // ~331 km/h top speed down Neftchilar Avenue
        const maxSpeedReverse = -12; // ~43 km/h
        const accelerationRate = player.offTrack ? 14 : 32; // m/s^2
        const brakingRate = 50; // m/s^2 (F1 carbon brakes)
        const frictionRate = player.offTrack ? 22 : 6.5;

        // Acceleration & Braking with smooth transition
        if (input.forward) {
          player.speed += accelerationRate * dt;
        } else if (input.backward) {
          if (player.speed > 1.5) {
            player.speed -= brakingRate * dt; // High deceleration brake
          } else {
            player.speed -= 12 * dt; // Reverse
          }
        } else {
          // Engine braking & aero drag
          if (player.speed > 0) {
            player.speed = Math.max(0, player.speed - frictionRate * dt);
          } else if (player.speed < 0) {
            player.speed = Math.min(0, player.speed + frictionRate * dt);
          }
        }

        if (input.handbrake) {
          player.speed = Math.max(0, player.speed - brakingRate * 1.6 * dt);
        }

        player.speed = THREE.MathUtils.clamp(player.speed, maxSpeedReverse, maxSpeedForward);

        // Steering dynamics: Responsive at low speeds, high-speed downforce damping
        const speedRatio = Math.abs(player.speed) / maxSpeedForward;
        const steerSpeed = (2.2 - speedRatio * 1.05); // rad/s
        if (input.left) {
          player.heading += steerSpeed * dt * (player.speed >= 0 ? 1 : -1);
        }
        if (input.right) {
          player.heading -= steerSpeed * dt * (player.speed >= 0 ? 1 : -1);
        }

        // Integrate Position
        player.x += Math.sin(player.heading) * player.speed * dt;
        player.z += Math.cos(player.heading) * player.speed * dt;

        // Update player car 3D mesh position & orientation
        playerCarMesh.position.set(player.x, 0.2, player.z);
        playerCarMesh.rotation.y = player.heading;

        // Spline Track Progress & Distance check
        const playerVec = new THREE.Vector3(player.x, 0, player.z);
        let nearestT = 0;
        let minDistSq = Infinity;

        // Fast localized sampling around previous progress
        const sampleSteps = 70;
        for (let s = 0; s < sampleSteps; s++) {
          const testT = (player.progress - 0.18 + (s / sampleSteps) * 0.36 + 1) % 1;
          const pt = spline.getPointAt(testT);
          const d2 = pt.distanceToSquared(playerVec);
          if (d2 < minDistSq) {
            minDistSq = d2;
            nearestT = testT;
          }
        }
        player.progress = nearestT;

        // Track Boundary Detection: Standard track half-width ~7.0m, narrower at Castle
        const trackDist = Math.sqrt(minDistSq);
        const maxAllowedDist = (nearestT >= 0.50 && nearestT <= 0.65) ? 6.5 : 9.5;
        player.offTrack = trackDist > maxAllowedDist;
        setIsOffTrack(player.offTrack);

        // Solid Barrier Collision Deflection: Prevents car from tunneling through barriers
        const barrierLimit = maxAllowedDist + 2.0;
        if (trackDist > barrierLimit) {
          const nearestCenterPt = spline.getPointAt(nearestT);
          // Elastic spring pushback towards track centerline
          player.x = THREE.MathUtils.lerp(player.x, nearestCenterPt.x, 0.22);
          player.z = THREE.MathUtils.lerp(player.z, nearestCenterPt.z, 0.22);
          player.speed *= 0.65; // Collision velocity loss
        }

        // Sector Tracking
        const currentSector = getSectorFromProgress(player.progress);
        player.sector = currentSector;

        // Start / Finish Line Crossing Detection
        // S/F line is on Neftchilar straight at Z=340, X around -180
        const inSFArea = Math.abs(player.x - -180) < 14 && player.z >= 335 && player.z <= 350;
        if (inSFArea && !player.crossedSFLastFrame && player.speed > 5) {
          const now = Date.now();
          const lapTime = (now - player.lapStartTime) / 1000;

          if (lapTime > 15) {
            player.lap += 1;
            player.currentLapTime = lapTime;
            if (!player.bestLapTime || lapTime < player.bestLapTime) {
              player.bestLapTime = lapTime;
              setHudBestLapTime(lapTime);
            }
            player.lapStartTime = now;
            setHudLap(player.lap);
          }
          player.crossedSFLastFrame = true;
        } else if (!inSFArea) {
          player.crossedSFLastFrame = false;
        }

        // --- Opponents AI Racing Line Simulation ---
        opponentsRef.current.forEach((opp, i) => {
          // Dynamic overtaking pace & spacing
          const baseSpeed = 29 + (i % 3) * 3.5;
          const totalTrackMeters = 6003;
          const progressDelta = (baseSpeed * dt) / totalTrackMeters;
          opp.progress = (opp.progress + progressDelta) % 1;

          if (opp.group) {
            const pos = spline.getPointAt(opp.progress);
            const tangent = spline.getTangentAt(opp.progress).normalize();
            opp.group.position.set(pos.x, 0.2, pos.z);
            opp.group.rotation.y = Math.atan2(tangent.x, tangent.z);
          }
        });

        // Compute simulated position relative to opponents
        let aheadCount = 0;
        opponentsRef.current.forEach((opp) => {
          if (opp.progress > player.progress) {
            aheadCount++;
          }
        });
        setHudPosition(aheadCount + 1);

        // Update HUD values
        const speedKmh = Math.round(player.speed * 3.6);
        const calculatedGear = speedKmh < 5 ? 1 : Math.min(8, Math.floor(speedKmh / 42) + 1);
        const rpmBase = 4500 + ((speedKmh % 42) / 42) * 8000;
        setHudSpeedKmh(speedKmh);
        setHudGear(calculatedGear);
        setHudRpm(Math.round(rpmBase));
        setHudSector(player.sector);
        setHudCurrentLapTime(Math.round(((Date.now() - player.lapStartTime) / 1000) * 10) / 10);

        // Update Minimap coordinates
        const playerMini = worldToMinimap(player.x, player.z);
        setMinimapPlayer(playerMini);

        const oppMinis = opponentsRef.current.map((opp) => {
          const pt = spline.getPointAt(opp.progress);
          const pos = worldToMinimap(pt.x, pt.z);
          return {
            id: opp.profile.id,
            x: pos.x,
            y: pos.y,
            color: opp.profile.primaryColor,
          };
        });
        setMinimapOpponents(oppMinis);

        if (onSpeedUpdate) onSpeedUpdate(speedKmh);
        if (onLapUpdate) onLapUpdate(player.lap, player.sector);
      }

      // --- Camera Controller ---
      const player = playerStateRef.current;
      if (cameraMode === 'chase') {
        // Dynamic third-person F1 chase camera
        const camDistance = 14.5;
        const camHeight = 5.6;
        const targetCamX = player.x - Math.sin(player.heading) * camDistance;
        const targetCamZ = player.z - Math.cos(player.heading) * camDistance;

        camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, 0.14);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, camHeight, 0.14);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 0.14);
        camera.lookAt(player.x, 1.3, player.z);
      } else if (cameraMode === 'overhead') {
        // Top-down tactical race minimap camera
        camera.position.set(player.x, 130, player.z);
        camera.lookAt(player.x, 0, player.z);
      } else {
        // TV Broadcast Trackside Angle (Azadliq Square Grandstand view)
        camera.position.set(-225, 26, 385);
        camera.lookAt(player.x, 1.4, player.z);
      }

      renderer.render(scene, camera);
    };

    animationId = requestAnimationFrame(animate);

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Cleanup lifecycle
    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      renderer.dispose();
      scene.clear();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [selectedCarId, isPaused, cameraMode]);

  return (
    <div className="relative w-full h-[640px] rounded-2xl overflow-hidden border border-white/10 bg-[#07080a] select-none shadow-2xl">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-crosshair" />

      {/* WebGL Hardware Fallback Overlay */}
      {webglError && (
        <div className="absolute inset-0 bg-[#07080a]/95 flex flex-col items-center justify-center p-6 text-center z-30">
          <AlertTriangle className="w-12 h-12 text-amber-400 mb-3 animate-pulse" />
          <h4 className="font-chakra font-black text-xl text-white uppercase tracking-wider mb-2">
            3D WebGL Engine Standby
          </h4>
          <p className="font-mono-tech text-xs text-gray-300 max-w-md leading-relaxed mb-4">
            {webglError}
          </p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left font-mono-tech text-xs max-w-md text-gray-400 space-y-2">
            <div className="text-[#66ff00] font-bold">Driving Controls Summary:</div>
            <div>• <strong>W / Up Arrow:</strong> Throttle / Accelerate</div>
            <div>• <strong>S / Down Arrow:</strong> Carbon Braking / Reverse</div>
            <div>• <strong>A / D or Left / Right:</strong> Apex Steering</div>
            <div>• <strong>Spacebar:</strong> Emergency Handbrake</div>
            <div>• <strong>R:</strong> Reset car to Starting Grid P1</div>
            <div>• <strong>C:</strong> Toggle Chase / Tactical Overhead Camera</div>
          </div>
        </div>
      )}

      {/* Top HUD: Speedometer, RPM Bar, Gear, Sector, Lap Times */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none z-20">
        {/* Speedometer, RPM & Gear */}
        <div className="bg-black/85 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-xl flex items-center gap-4 pointer-events-auto shadow-2xl">
          <div className="flex flex-col">
            <span className="text-[9px] font-mono-tech text-gray-400 uppercase tracking-wider">Speed</span>
            <div className="flex items-baseline gap-1 font-chakra font-black text-3xl text-white">
              <span>{hudSpeedKmh}</span>
              <span className="text-xs text-[#66ff00] font-mono-tech">KM/H</span>
            </div>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="flex flex-col items-center">
            <span className="text-[9px] font-mono-tech text-gray-400 uppercase tracking-wider">Gear</span>
            <span className="font-chakra font-black text-3xl text-[#66ff00]">{hudGear}</span>
          </div>

          <div className="h-8 w-px bg-white/10" />

          {/* RPM LED Shift Indicator Bar */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-mono-tech text-gray-400 uppercase tracking-wider flex justify-between">
              <span>RPM</span>
              <span className="text-[#66ff00]">{hudRpm}</span>
            </span>
            <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden flex gap-0.5">
              {[...Array(8)].map((_, i) => {
                const fillRatio = (hudRpm - 4500) / 8000;
                const lit = i / 8 <= fillRatio;
                const isRed = i >= 6;
                return (
                  <div
                    key={i}
                    className={`flex-1 h-full rounded-xs transition-colors ${
                      lit
                        ? isRed
                          ? 'bg-red-500 shadow-[0_0_8px_#ef4444]'
                          : 'bg-[#66ff00] shadow-[0_0_6px_#66ff00]'
                        : 'bg-white/5'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="flex flex-col">
            <span className="text-[9px] font-mono-tech text-gray-400 uppercase tracking-wider">Sector</span>
            <span
              className="font-chakra font-bold text-xs px-2.5 py-1 rounded text-white text-center font-black shadow-sm"
              style={{
                backgroundColor:
                  hudSector === 1 ? '#a855f7' : hudSector === 2 ? '#3b82f6' : '#eab308',
              }}
            >
              SECTOR {hudSector}
            </span>
          </div>

          {isOffTrack && (
            <div className="bg-amber-500/20 border border-amber-500/50 text-amber-400 text-[10px] font-mono-tech px-2.5 py-1 rounded font-bold animate-pulse">
              OFF-TRACK FRICTION
            </div>
          )}
        </div>

        {/* Lap, Race Time, Position & Minimap */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Tactical Minimap */}
          <div className="hidden sm:block relative w-24 h-24 bg-black/85 backdrop-blur-md border border-white/15 rounded-xl p-1 shadow-2xl overflow-hidden">
            <span className="absolute top-1 left-2 text-[8px] font-mono-tech text-gray-500 uppercase">GPS RADAR</span>
            {/* SVG Track Silhouette */}
            <svg viewBox="0 0 100 100" className="w-full h-full stroke-white/25 fill-none" strokeWidth="3">
              <path d="M 20 85 L 20 15 L 45 15 L 45 40 L 75 40 L 85 65 L 60 85 Z" strokeLinejoin="round" />
            </svg>
            {/* AI Opponents markers */}
            {minimapOpponents.map((opp) => (
              <div
                key={opp.id}
                className="absolute w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-sm"
                style={{
                  left: `${opp.x}%`,
                  top: `${opp.y}%`,
                  backgroundColor: opp.color,
                }}
              />
            ))}
            {/* Player marker */}
            <div
              className="absolute w-2.5 h-2.5 rounded-full bg-[#66ff00] transform -translate-x-1/2 -translate-y-1/2 border border-black shadow-[0_0_8px_#66ff00] animate-pulse"
              style={{
                left: `${minimapPlayer.x}%`,
                top: `${minimapPlayer.y}%`,
              }}
            />
          </div>

          {/* Lap & Time Panel */}
          <div className="bg-black/85 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-xl flex items-center gap-4 shadow-2xl font-mono-tech text-xs">
            <div>
              <span className="text-[9px] text-gray-400 block">POSITION</span>
              <span className="font-chakra font-black text-xl text-white">
                P<strong className="text-[#66ff00]">{hudPosition}</strong> / 6
              </span>
            </div>

            <div className="h-8 w-px bg-white/10" />

            <div>
              <span className="text-[9px] text-gray-400 block">CURRENT LAP</span>
              <span className="font-chakra font-bold text-base text-white">
                Lap {hudLap} <span className="text-gray-500 font-normal">/ 51</span>
              </span>
              <span className="text-[10px] text-gray-400 block">{hudCurrentLapTime.toFixed(1)}s</span>
            </div>

            <div className="h-8 w-px bg-white/10" />

            <div>
              <span className="text-[9px] text-gray-400 block">BEST LAP</span>
              <span className="font-chakra font-bold text-sm text-[#66ff00]">
                {hudBestLapTime ? `${hudBestLapTime.toFixed(3)}s` : '--:--.---'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Car Selector & Simulation Controls */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row items-center justify-between gap-3 z-20 pointer-events-none">
        {/* Car Selection Dock */}
        <div className="flex items-center gap-1.5 bg-black/85 backdrop-blur-md p-1.5 rounded-2xl border border-white/15 pointer-events-auto overflow-x-auto max-w-full shadow-2xl">
          <span className="text-[10px] font-mono-tech text-gray-400 px-2 uppercase font-bold flex items-center gap-1">
            <Car className="w-3.5 h-3.5 text-[#66ff00]" />
            Car:
          </span>
          {GRID_CARS.map((car) => {
            const isSelected = car.id === selectedCarId;
            return (
              <button
                key={car.id}
                onClick={() => setSelectedCarId(car.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-chakra font-bold transition-all cursor-pointer whitespace-nowrap border ${
                  isSelected
                    ? 'bg-white/20 text-white shadow-lg border-[#66ff00]'
                    : 'bg-white/5 text-gray-400 hover:text-white border-white/5 hover:border-white/20'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shadow-sm"
                  style={{ backgroundColor: car.primaryColor }}
                />
                <span className="hidden md:inline">{car.name}</span>
                <span className="md:hidden">#{car.driverNumber}</span>
              </button>
            );
          })}
        </div>

        {/* View Controls & Reset Dock */}
        <div className="flex items-center gap-2 bg-black/85 backdrop-blur-md p-1.5 rounded-2xl border border-white/15 pointer-events-auto shadow-2xl">
          <button
            onClick={() => setCameraMode((prev) => (prev === 'chase' ? 'overhead' : prev === 'overhead' ? 'tv' : 'chase'))}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-chakra font-bold text-gray-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Toggle Camera View (Chase / Overhead / TV)"
          >
            <Camera className="w-3.5 h-3.5 text-[#66ff00]" />
            <span className="uppercase">{cameraMode} Cam (C)</span>
          </button>

          <button
            onClick={resetToGrid}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-chakra font-bold text-gray-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reset Car to Starting Grid (R)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset (R)</span>
          </button>

          <button
            onClick={() => setIsPaused((prev) => !prev)}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-chakra font-bold text-gray-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-[#66ff00]" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>
        </div>
      </div>

      {/* Driving Instructions Pill in Bottom Left */}
      <div className="absolute top-20 left-4 z-20 pointer-events-none hidden lg:block">
        <div className="bg-black/80 backdrop-blur-md border border-white/10 px-3 py-2 rounded-xl text-[10px] font-mono-tech text-gray-300 space-y-1 shadow-lg">
          <div className="text-[#66ff00] font-bold uppercase tracking-wider flex items-center gap-1">
            <span>Simulator Controls</span>
            <span className="text-[9px] bg-white/10 text-gray-400 px-1 rounded">RECONSTRUCTED MODEL</span>
          </div>
          <div><kbd className="bg-white/10 px-1 py-0.5 rounded text-white font-bold">W</kbd> / <kbd className="bg-white/10 px-1 py-0.5 rounded text-white font-bold">↑</kbd> Throttle Acceleration</div>
          <div><kbd className="bg-white/10 px-1 py-0.5 rounded text-white font-bold">S</kbd> / <kbd className="bg-white/10 px-1 py-0.5 rounded text-white font-bold">↓</kbd> Carbon Brake / Reverse</div>
          <div><kbd className="bg-white/10 px-1 py-0.5 rounded text-white font-bold">A</kbd> / <kbd className="bg-white/10 px-1 py-0.5 rounded text-white font-bold">D</kbd> Apex Steering</div>
          <div><kbd className="bg-white/10 px-1 py-0.5 rounded text-white font-bold">SPACE</kbd> Handbrake | <kbd className="bg-white/10 px-1 py-0.5 rounded text-white font-bold">R</kbd> Grid Reset</div>
          <div><kbd className="bg-white/10 px-1 py-0.5 rounded text-white font-bold">C</kbd> Camera Mode | <kbd className="bg-white/10 px-1 py-0.5 rounded text-white font-bold">ESC</kbd> Pause</div>
        </div>
      </div>
    </div>
  );
};
