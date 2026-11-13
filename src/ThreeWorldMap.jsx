import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  createRigAssetPool,
  buildArticulatedCharacter,
  animateArticulatedCharacter,
} from './threeHumanRig';
import {
  createLandmarkContext,
  buildKafeDidi,
  buildClassicalOasis,
  buildFloraProp,
  buildLandmarkBuilding,
  buildStreetLamp,
  buildBoulevardArch,
} from './threeLandmarks';
import {
  buildCampusBuggy,
  buildClassicalChariot,
  animateVehicle,
  playWorldSfx,
} from './threeVehicles';

/* =========================================================================
   THREE.JS GTA-INSPIRED 3D OPEN-WORLD THIRD-PERSON ENGINE (Kembara Qawaid)
   - Scale: 1 grid unit = 4.0m (TILE_SIZE = 4.0) across ALL 6 regions
   - Rotating Circular GTA GPS Radar (Bottom-Left) + North Rim Marker + 📍 GPS Cycler
   - Top-Right GTA HUD: 24h Clock, Speedometer KM/J, 5-Star Rank, REP $ Counter, Senja/Malam Toggle
   - Dramatic "MISI SELESAI!" Splash on Checkpoint / Boss Completion
   - On-Foot (Walk, Sprint LARI, Jump LOMPAT) + Drivable Transport (Buggy / Caravan Chariot)
   - Roaming Ambient Pedestrians (3-4 articulated walkers per city/campus)
   - Mobile 60 FPS Guardrails: DPR <= 1.5, ACESFilmicToneMapping, zero post-processing,
     1024x1024 selective shadows, blob shadows, clamped dt <= 0.05, ResizeObserver & .dispose()
   ========================================================================= */

export const TILE_SIZE = 4.0;
const GRID_ROWS = 8;
const GRID_COLS = 12;

const WALK_SPEED = 6.4;
const SPRINT_SPEED = 10.6;
const JUMP_VELOCITY = 6.9;
const GRAVITY = 18.5;
const VEHICLE_MAX_SPEED = 15.2;
const VEHICLE_ACCEL = 18.0;
const VEHICLE_DRAG = 5.5;

const INTERACT_DISTANCE = 3.2;
const VEHICLE_ENTER_DIST = 3.6;
const OASIS_TRIGGER_DIST = 2.7;
const PORTAL_TRIGGER_DIST = 2.3;
const PITCH_MIN = THREE.MathUtils.degToRad(-8);
const PITCH_MAX = THREE.MathUtils.degToRad(36);

const BIOME_PALETTES = {
  BAGHDAD: {
    ground: 0x064e3b,
    groundAccent: 0x047857,
    pathTile: 0xd6d3d1,
    rock: 0x334155,
    rockTop: 0x475569,
    water: 0x0284c7,
    flora: 0x10b981,
    accentGlow: 0xf59e0b,
    fogDusk: 0x2b1710,
    fogNight: 0x041512,
    lightDusk: 0xfdba74,
    lightNight: 0x93c5fd,
    skyDusk: '#2a1622',
    skyNight: '#03110e',
  },
  DAMSYIK: {
    ground: 0x1e293b,
    groundAccent: 0x334155,
    pathTile: 0xcbd5e1,
    rock: 0x475569,
    rockTop: 0x64748b,
    water: 0x38bdf8,
    flora: 0x059669,
    accentGlow: 0x38bdf8,
    fogDusk: 0x1f192b,
    fogNight: 0x060d1c,
    lightDusk: 0xfed7aa,
    lightNight: 0xbae6fd,
    skyDusk: '#1f1930',
    skyNight: '#050b18',
  },
  HIJAZ: {
    ground: 0xb45309,
    groundAccent: 0xd97706,
    pathTile: 0xfde68a,
    rock: 0x78350f,
    rockTop: 0x92400e,
    water: 0x06b6d4,
    flora: 0x15803d,
    accentGlow: 0xf59e0b,
    fogDusk: 0x3a180c,
    fogNight: 0x140b06,
    lightDusk: 0xfdba74,
    lightNight: 0xcbd5e1,
    skyDusk: '#3b180e',
    skyNight: '#120905',
  },
  KAHERAH: {
    ground: 0x854d0e,
    groundAccent: 0xa16207,
    pathTile: 0xfef08a,
    rock: 0x713f12,
    rockTop: 0x854d0e,
    water: 0x0284c7,
    flora: 0x16a34a,
    accentGlow: 0xfbbf24,
    fogDusk: 0x361b0b,
    fogNight: 0x120c06,
    lightDusk: 0xfde68a,
    lightNight: 0xbfdbfe,
    skyDusk: '#361a0c',
    skyNight: '#0f0a05',
  },
  ANDALUSIA: {
    ground: 0x0369a1,
    groundAccent: 0x0f766e,
    pathTile: 0xe2e8f0,
    rock: 0x1e293b,
    rockTop: 0x334155,
    water: 0x38bdf8,
    flora: 0x10b981,
    accentGlow: 0x2dd4bf,
    fogDusk: 0x191d34,
    fogNight: 0x04111e,
    lightDusk: 0xfecdd3,
    lightNight: 0xa5f3fc,
    skyDusk: '#1f1833',
    skyNight: '#040e1a',
  },
  COSMIC: {
    ground: 0x312e81,
    groundAccent: 0x4338ca,
    pathTile: 0xc7d2fe,
    rock: 0x1e1b4b,
    rockTop: 0x3730a3,
    water: 0x818cf8,
    flora: 0x8b5cf6,
    accentGlow: 0xc084fc,
    fogDusk: 0x251442,
    fogNight: 0x08061a,
    lightDusk: 0xf5d0fe,
    lightNight: 0xddd6fe,
    skyDusk: '#24113d',
    skyNight: '#070417',
  },
  FPQS: {
    ground: 0x22c55e,
    groundAccent: 0x16a34a,
    pathTile: 0xe2e8f0,
    foyerTile: 0xf8fafc,
    asphalt: 0x1e293b,
    rock: 0x475569,
    rockTop: 0x64748b,
    water: 0x0ea5e9,
    flora: 0x15803d,
    accentGlow: 0x22c55e,
    fogDusk: 0x1f242d,
    fogNight: 0x051411,
    lightDusk: 0xfed7aa,
    lightNight: 0xcffafe,
    skyDusk: '#242238',
    skyNight: '#04120e',
  },
};

function getTileWorldCoords(r, c) {
  return {
    x: (c - (GRID_COLS - 1) / 2) * TILE_SIZE,
    z: (r - (GRID_ROWS - 1) / 2) * TILE_SIZE,
  };
}

function worldToGridCoords(x, z) {
  const c = Math.max(0, Math.min(GRID_COLS - 1, Math.round(x / TILE_SIZE + (GRID_COLS - 1) / 2)));
  const r = Math.max(0, Math.min(GRID_ROWS - 1, Math.round(z / TILE_SIZE + (GRID_ROWS - 1) / 2)));
  return { r, c };
}

function findGridPath(grid, startR, startC, goalR, goalC, allowGoalNonWalkable = true) {
  if (!grid?.length) return [];
  const rows = grid.length;
  const cols = grid[0].length;
  const queue = [[startR, startC]];
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const parent = Array.from({ length: rows }, () => Array(cols).fill(null));
  visited[startR][startC] = true;

  const dirs = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ];

  while (queue.length > 0) {
    const [cr, cc] = queue.shift();
    if (cr === goalR && cc === goalC) {
      const path = [];
      let cur = [cr, cc];
      while (cur) {
        path.push({ r: cur[0], c: cur[1] });
        cur = parent[cur[0]][cur[1]];
      }
      return path.reverse();
    }
    for (const [dr, dc] of dirs) {
      const nr = cr + dr;
      const nc = cc + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || visited[nr][nc]) continue;
      const tile = grid[nr][nc];
      const isGoal = nr === goalR && nc === goalC;
      const walkable =
        tile &&
        tile.type !== 'WALL' &&
        tile.type !== 'WATER' &&
        (!tile.decor || tile.type === 'OASIS' || tile.type === 'PORTAL');
      if (walkable || (isGoal && allowGoalNonWalkable)) {
        visited[nr][nc] = true;
        parent[nr][nc] = [cr, cc];
        queue.push([nr, nc]);
      }
    }
  }
  return [];
}

function findPathTiles(grid, startR = 1, startC = 1) {
  const pathSet = new Set();
  if (!grid?.length) return pathSet;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      const t = grid[r][c];
      if (t && (t.type === 'NPC' || t.type === 'PORTAL' || t.type === 'OASIS')) {
        const path = findGridPath(grid, startR, startC, r, c, true);
        path.forEach((step) => {
          if (grid[step.r]?.[step.c]?.type === 'FLOOR') {
            pathSet.add(`${step.r},${step.c}`);
          }
        });
      }
    }
  }
  pathSet.add(`${startR},${startC}`);
  return pathSet;
}

function createGlowHaloSprite(colorHex, scale = 2.0, opacity = 0.85) {
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const col = new THREE.Color(colorHex);
    const r = Math.round(col.r * 255);
    const g = Math.round(col.g * 255);
    const b = Math.round(col.b * 255);
    const grad = ctx.createRadialGradient(48, 48, 0, 48, 48, 48);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.22, `rgba(${r}, ${g}, ${b}, 0.82)`);
    grad.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, 0.25)`);
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 96, 96);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;

  const mat = new THREE.SpriteMaterial({
    map: tex,
    color: 0xffffff,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(scale, scale, 1);
  return { sprite, texture: tex, material: mat };
}

function drawLabelCanvas(canvas, text, { bgColor, borderColor, textColor }) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const pad = 8;
  const w = canvas.width - pad * 2;
  const h = canvas.height - pad * 2;
  const rad = h / 2;

  ctx.beginPath();
  ctx.moveTo(pad + rad, pad);
  ctx.lineTo(pad + w - rad, pad);
  ctx.quadraticCurveTo(pad + w, pad, pad + w, pad + rad);
  ctx.lineTo(pad + w, pad + h - rad);
  ctx.quadraticCurveTo(pad + w, pad + h, pad + w - rad, pad + h);
  ctx.lineTo(pad + rad, pad + h);
  ctx.quadraticCurveTo(pad, pad + h, pad, pad + h - rad);
  ctx.lineTo(pad, pad + rad);
  ctx.quadraticCurveTo(pad, pad, pad + rad, pad);
  ctx.closePath();

  ctx.fillStyle = bgColor;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = borderColor;
  ctx.stroke();

  ctx.font = '800 28px "Inter", system-ui, -apple-system, sans-serif';
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 4;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 1);
}

function createFloatingLabelSprite(text, options = {}) {
  const {
    bgColor = 'rgba(8, 14, 32, 0.88)',
    borderColor = '#38bdf8',
    textColor = '#ffffff',
    scaleX = 2.8,
    scaleY = 0.72,
  } = options;
  const canvas = document.createElement('canvas');
  canvas.width = 420;
  canvas.height = 96;
  drawLabelCanvas(canvas, text, { bgColor, borderColor, textColor });

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(scaleX, scaleY, 1);
  sprite.renderOrder = 20;

  return {
    sprite,
    texture,
    material,
    updateText: (nextText, nextBorderColor, nextTextColor, nextBgColor = bgColor) => {
      drawLabelCanvas(canvas, nextText, {
        bgColor: nextBgColor,
        borderColor: nextBorderColor,
        textColor: nextTextColor,
      });
      texture.needsUpdate = true;
    },
  };
}

function resolveCircleAABB(pos, radius, box) {
  const closestX = Math.max(box.minX, Math.min(pos.x, box.maxX));
  const closestZ = Math.max(box.minZ, Math.min(pos.z, box.maxZ));
  const dx = pos.x - closestX;
  const dz = pos.z - closestZ;
  const distSq = dx * dx + dz * dz;

  if (distSq >= radius * radius) return;

  if (distSq > 1e-6) {
    const dist = Math.sqrt(distSq);
    const overlap = radius - dist;
    pos.x += (dx / dist) * overlap;
    pos.z += (dz / dist) * overlap;
  } else {
    const dLeft = Math.abs(pos.x - box.minX);
    const dRight = Math.abs(box.maxX - pos.x);
    const dTop = Math.abs(pos.z - box.minZ);
    const dBottom = Math.abs(box.maxZ - pos.z);
    const m = Math.min(dLeft, dRight, dTop, dBottom);
    if (m === dLeft) pos.x = box.minX - radius;
    else if (m === dRight) pos.x = box.maxX + radius;
    else if (m === dTop) pos.z = box.minZ - radius;
    else pos.z = box.maxZ + radius;
  }
}

export default function ThreeWorldMap({
  mapGrid,
  wilayahIdx = 0,
  mapSeed = 1,
  solvedNpcIds = [],
  reputation = 100,
  xp = 0,
  isAudioMuted = false,
  onTileClick,
  isEncounterActive = false,
  activeNpcId = null,
  bossNpcId = null,
  isBossUnlocked = true,
  isWilayahCompleted = false,
  autoWalkTarget = null,
  resetSpawnNonce = 0,
  controlRef = null,
  onPlayerMoveGrid,
  onInteractNpc,
  onOasisVisit,
  onPortalVisit,
}) {
  const containerRef = useRef(null);
  const joyBaseRef = useRef(null);
  const joyKnobRef = useRef(null);
  const cornerJoyKnobRef = useRef(null);
  const minimapCanvasRef = useRef(null);
  const clockDomRef = useRef(null);
  const speedDomRef = useRef(null);
  const gpsLabelDomRef = useRef(null);

  const fallbackControlRef = useRef({
    padFwd: 0,
    padRight: 0,
    padYaw: 0,
    pulseTimer: 0,
    pulseFwd: 0,
    pulseRight: 0,
  });
  const activeControlRef = controlRef || fallbackControlRef;

  const [minimapExpanded, setMinimapExpanded] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState('MALAM'); // 'SENJA' | 'MALAM'
  const [isDriving, setIsDriving] = useState(false);
  const [nearVehicle, setNearVehicle] = useState(false);
  const [nearbyInteractiveNpc, setNearbyInteractiveNpc] = useState(null);
  const [missionSplash, setMissionSplash] = useState(null);
  const [gpsCycleIdx, setGpsCycleIdx] = useState(0);

  // Synced Refs (zero WebGL rebuild on state updates)
  const solvedRef = useRef(solvedNpcIds);
  const prevSolvedCountRef = useRef(solvedNpcIds?.length || 0);
  const bossNpcIdRef = useRef(bossNpcId);
  const isBossUnlockedRef = useRef(isBossUnlocked);
  const isWilayahCompletedRef = useRef(isWilayahCompleted);
  const isEncounterActiveRef = useRef(isEncounterActive);
  const activeNpcIdRef = useRef(activeNpcId);
  const timeOfDayRef = useRef(timeOfDay);
  const isAudioMutedRef = useRef(isAudioMuted);
  const gpsCycleRef = useRef(gpsCycleIdx);
  const callbacksRef = useRef({
    onTileClick,
    onPlayerMoveGrid,
    onInteractNpc,
    onOasisVisit,
    onPortalVisit,
  });

  useEffect(() => {
    const prevCount = prevSolvedCountRef.current;
    const nextCount = solvedNpcIds?.length || 0;
    if (nextCount > prevCount) {
      const latestId = solvedNpcIds[nextCount - 1];
      const isBossJustSolved = bossNpcId ? latestId === bossNpcId : latestId?.endsWith('-4');
      setMissionSplash({
        title: 'MISI SELESAI!',
        subtitle: isBossJustSolved
          ? '👑 MOHOR SANAD DIKURNIAKAN!'
          : '⚖️ HUJAH QAWAID BERJAYA!',
        reward: isBossJustSolved ? '+300 XP  •  +$500 REP' : '+150 XP  •  +$150 REP',
      });
      const timer = setTimeout(() => setMissionSplash(null), 2600);
      prevSolvedCountRef.current = nextCount;
      solvedRef.current = solvedNpcIds;
      return () => clearTimeout(timer);
    }
    prevSolvedCountRef.current = nextCount;
    solvedRef.current = solvedNpcIds;
  }, [solvedNpcIds, bossNpcId]);

  useEffect(() => {
    bossNpcIdRef.current = bossNpcId;
  }, [bossNpcId]);
  useEffect(() => {
    isBossUnlockedRef.current = isBossUnlocked;
  }, [isBossUnlocked]);
  useEffect(() => {
    isWilayahCompletedRef.current = isWilayahCompleted;
  }, [isWilayahCompleted]);
  useEffect(() => {
    isEncounterActiveRef.current = isEncounterActive;
  }, [isEncounterActive]);
  useEffect(() => {
    activeNpcIdRef.current = activeNpcId;
  }, [activeNpcId]);
  useEffect(() => {
    timeOfDayRef.current = timeOfDay;
  }, [timeOfDay]);
  useEffect(() => {
    isAudioMutedRef.current = isAudioMuted;
  }, [isAudioMuted]);
  useEffect(() => {
    gpsCycleRef.current = gpsCycleIdx;
  }, [gpsCycleIdx]);
  useEffect(() => {
    callbacksRef.current = {
      onTileClick,
      onPlayerMoveGrid,
      onInteractNpc,
      onOasisVisit,
      onPortalVisit,
    };
  }, [onTileClick, onPlayerMoveGrid, onInteractNpc, onOasisVisit, onPortalVisit]);

  // Shared 60 FPS Engine Controller Ref
  const engineRef = useRef({
    playerPos: { x: 0, z: 0 },
    playerY: 0,
    playerVelY: 0,
    isGrounded: true,
    sprintHeld: false,
    charYaw: 0,
    camYaw: Math.PI * 0.82,
    camPitch: THREE.MathUtils.degToRad(13),
    camCurrentPos: new THREE.Vector3(),
    camCurrentLookAt: new THREE.Vector3(),
    camInitialized: false,
    // Vehicle Physics
    inVehicle: false,
    vehiclePos: { x: 0, z: 0 },
    vehicleYaw: 0,
    vehicleSpeed: 0,
    gasHeld: false,
    brakeHeld: false,
    // Wayfinding & Markers
    autoWalkWaypoints: [],
    autoWalkNpc: null,
    lastGridCell: { r: 1, c: 1 },
    lastOasisTriggerTime: -10,
    lastPortalTriggerTime: -10,
    nearbyNpcId: null,
    nearVehicleFlag: false,
    joyVec: { x: 0, y: 0 },
    cornerJoyVec: { x: 0, y: 0 },
    rightTouchActive: false,
    mouseDragActive: false,
    npcMarkers: [],
    pedestrians: [],
    portalMarker: null,
    oasisPos: null,
    pathSet: null,
    worldClockMinutes: 17 * 60 + 45, // Starts around 17:45 Senja -> cycles naturally!
  });

  const biomeKey =
    mapSeed > 1
      ? 'COSMIC'
      : wilayahIdx === 0
      ? 'BAGHDAD'
      : wilayahIdx === 1
      ? 'DAMSYIK'
      : wilayahIdx === 2
      ? 'HIJAZ'
      : wilayahIdx === 3
      ? 'KAHERAH'
      : wilayahIdx === 4
      ? 'ANDALUSIA'
      : wilayahIdx === 5
      ? 'FPQS'
      : 'BAGHDAD';

  const palette = BIOME_PALETTES[biomeKey] || BIOME_PALETTES.BAGHDAD;
  const isFPQS = wilayahIdx === 5;

  // Compute Region 5-Star Academic Rank (1..5 golden stars)
  const regionProgress = React.useMemo(() => {
    const regionPrefix = isFPQS ? 'NPC-FPQS-' : `NPC-${wilayahIdx + 1}-`;
    const solvedInRegion = (solvedNpcIds || []).filter((id) => id.startsWith(regionPrefix)).length;
    const bossDone = bossNpcId ? (solvedNpcIds || []).includes(bossNpcId) : false;
    return Math.min(5, solvedInRegion + (bossDone ? 1 : 0));
  }, [solvedNpcIds, wilayahIdx, isFPQS, bossNpcId]);

  const gtaRepCash = React.useMemo(
    () => `$${String(Math.max(0, Math.round(reputation * 5 + xp))).padStart(6, '0')}`,
    [reputation, xp]
  );

  // Trigger Jump safely
  const triggerJump = () => {
    const eng = engineRef.current;
    if (eng.inVehicle || isEncounterActiveRef.current) return;
    if (eng.isGrounded) {
      eng.playerVelY = JUMP_VELOCITY;
      eng.isGrounded = false;
      if (!isAudioMutedRef.current) playWorldSfx('JUMP');
    }
  };

  // Toggle Enter/Exit Vehicle cleanly
  const toggleVehicleMount = () => {
    const eng = engineRef.current;
    if (isEncounterActiveRef.current) return;
    if (!eng.inVehicle) {
      const distV = Math.hypot(eng.vehiclePos.x - eng.playerPos.x, eng.vehiclePos.z - eng.playerPos.z);
      if (distV <= VEHICLE_ENTER_DIST + 0.6) {
        eng.inVehicle = true;
        eng.autoWalkWaypoints = [];
        eng.autoWalkNpc = null;
        eng.vehicleSpeed = 0;
        setIsDriving(true);
        if (!isAudioMutedRef.current) playWorldSfx(isFPQS ? 'BUGGY_HORN' : 'CHARIOT_BELL');
      }
    } else {
      eng.inVehicle = false;
      eng.gasHeld = false;
      eng.brakeHeld = false;
      eng.vehicleSpeed = 0;
      // Step out to the left side of the vehicle cleanly
      const sideX = Math.cos(eng.vehicleYaw) * 1.45;
      const sideZ = -Math.sin(eng.vehicleYaw) * 1.45;
      eng.playerPos.x = eng.vehiclePos.x + sideX;
      eng.playerPos.z = eng.vehiclePos.z + sideZ;
      eng.playerY = 0;
      eng.playerVelY = 0;
      eng.isGrounded = true;
      setIsDriving(false);
    }
  };

  const triggerVehicleHorn = () => {
    if (!isAudioMutedRef.current) {
      playWorldSfx(isFPQS ? 'BUGGY_HORN' : 'CHARIOT_BELL');
    }
  };

  // Handle External Auto-Walk Request (Disembark if driving or walk straight there)
  useEffect(() => {
    if (!autoWalkTarget || !mapGrid?.length) return;
    const eng = engineRef.current;
    if (eng.inVehicle) {
      eng.inVehicle = false;
      eng.vehicleSpeed = 0;
      setIsDriving(false);
    }
    const curr = worldToGridCoords(eng.playerPos.x, eng.playerPos.z);
    let targetR = autoWalkTarget.r;
    let targetC = autoWalkTarget.c;
    let targetNpc = null;

    if (targetR == null || targetC == null) {
      for (let r = 0; r < mapGrid.length; r++) {
        for (let c = 0; c < mapGrid[0].length; c++) {
          if (mapGrid[r][c]?.npc?.npcId === autoWalkTarget.npcId) {
            targetR = r;
            targetC = c;
            targetNpc = mapGrid[r][c].npc;
            break;
          }
        }
      }
    } else {
      targetNpc = mapGrid[targetR]?.[targetC]?.npc || null;
    }

    if (targetR == null || targetC == null) return;
    const tilePath = findGridPath(mapGrid, curr.r, curr.c, targetR, targetC, true);
    if (tilePath.length > 0) {
      const waypoints = tilePath.slice(1).map((step, idx, arr) => {
        const wc = getTileWorldCoords(step.r, step.c);
        if (idx === arr.length - 1 && targetNpc) {
          return { x: wc.x, z: Math.min((GRID_ROWS / 2) * TILE_SIZE - 1.0, wc.z + 2.05) };
        }
        return wc;
      });
      eng.autoWalkWaypoints = waypoints;
      eng.autoWalkNpc = targetNpc;
    }
  }, [autoWalkTarget, mapGrid]);

  // Reset Spawn
  useEffect(() => {
    if (!resetSpawnNonce) return;
    const eng = engineRef.current;
    const spawn = getTileWorldCoords(1, 1);
    eng.playerPos.x = spawn.x;
    eng.playerPos.z = spawn.z;
    eng.playerY = 0;
    eng.playerVelY = 0;
    eng.isGrounded = true;
    eng.inVehicle = false;
    eng.vehicleSpeed = 0;
    setIsDriving(false);
    eng.lastGridCell = { r: 1, c: 1 };
    eng.autoWalkWaypoints = [];
    eng.autoWalkNpc = null;
  }, [resetSpawnNonce]);

  // Update NPC beacons & portal in-place
  useEffect(() => {
    const eng = engineRef.current;
    const solvedList = solvedNpcIds || [];
    eng.npcMarkers.forEach((m) => {
      const isSolved = solvedList.includes(m.npc.npcId);
      const isBoss = bossNpcId ? m.npc.npcId === bossNpcId : m.npc.npcId?.endsWith('-4');
      const isLocked = isBoss && !isBossUnlocked && !isSolved;

      if (m.pillarMat && m.pillarMesh) {
        if (isSolved) {
          m.pillarMat.color.setHex(0x10b981);
          m.pillarMat.opacity = 0.1;
        } else if (isLocked) {
          m.pillarMat.color.setHex(0xef4444);
          m.pillarMat.opacity = 0.22;
        } else if (isBoss) {
          m.pillarMat.color.setHex(0xfbbf24);
          m.pillarMat.opacity = 0.36;
        } else {
          m.pillarMat.color.setHex(isFPQS ? 0x38bdf8 : 0xf59e0b);
          m.pillarMat.opacity = 0.3;
        }
      }
      if (m.ringMat) {
        m.ringMat.color.setHex(isSolved ? 0x10b981 : isLocked ? 0xef4444 : isBoss ? 0xfbbf24 : 0x38bdf8);
      }
      if (m.bossAuraRingMat) {
        const auraCol = isSolved ? 0x10b981 : isLocked ? 0xef4444 : 0xfbbf24;
        m.bossAuraRingMat.color.setHex(auraCol);
        m.bossAuraRingMat.emissive.setHex(auraCol);
      }
      if (m.labelApi) {
        const shortName = m.npc.nama?.split('&')[0]?.trim() || m.npc.nama;
        const prefix = isSolved ? '✓ ' : isLocked ? '🔒 ' : isBoss ? '👑 ' : '💬 ';
        m.labelApi.updateText(
          `${prefix}${shortName}`,
          isSolved ? '#10b981' : isLocked ? '#ef4444' : isBoss ? '#fbbf24' : '#38bdf8',
          isSolved ? '#a7f3d0' : isLocked ? '#fca5a5' : '#f8fafc',
          isLocked ? 'rgba(45, 10, 15, 0.90)' : 'rgba(8, 16, 32, 0.88)'
        );
      }
    });

    if (eng.portalMarker) {
      const canEnter = isFPQS ? solvedList.includes(bossNpcId || 'NPC-FPQS-4') : isWilayahCompleted;
      eng.portalMarker.pillarMat.color.setHex(canEnter ? 0xc084fc : 0x64748b);
      eng.portalMarker.pillarMat.opacity = canEnter ? 0.38 : 0.14;
      eng.portalMarker.labelApi?.updateText(
        canEnter ? '🌀 Portal Tamat (Sedia)' : '⏳ Portal (Selesaikan Misi)',
        canEnter ? '#c084fc' : '#64748b',
        canEnter ? '#f3e8ff' : '#cbd5e1'
      );
    }
  }, [solvedNpcIds, bossNpcId, isBossUnlocked, isWilayahCompleted, isFPQS]);

  // =========================================================================
  // MAIN 60 FPS DECOUPLED WEBGL WORLD ENGINE (Rebuilds ONLY on Region/Seed change)
  // =========================================================================
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !mapGrid?.length) return;

    const eng = engineRef.current;
    const spawnCoords = getTileWorldCoords(1, 1);
    eng.playerPos = { x: spawnCoords.x, z: spawnCoords.z };
    eng.playerY = 0;
    eng.playerVelY = 0;
    eng.isGrounded = true;
    eng.sprintHeld = false;
    eng.inVehicle = false;
    eng.vehicleSpeed = 0;
    eng.lastGridCell = { r: 1, c: 1 };
    eng.charYaw = 0;
    eng.camYaw = Math.PI * 0.82;
    eng.camPitch = THREE.MathUtils.degToRad(13);
    eng.camInitialized = false;
    eng.autoWalkWaypoints = [];
    eng.autoWalkNpc = null;
    eng.npcMarkers = [];
    eng.pedestrians = [];
    eng.portalMarker = null;
    eng.oasisPos = null;
    setIsDriving(false);
    setNearVehicle(false);
    setNearbyInteractiveNpc(null);

    const rigPool = createRigAssetPool();
    const disposables = {
      geometries: new Set(),
      materials: new Set(),
      textures: new Set(),
    };
    const trackGeo = (g) => {
      disposables.geometries.add(g);
      return g;
    };
    const trackMat = (m) => {
      disposables.materials.add(m);
      return m;
    };
    const trackTex = (t) => {
      disposables.textures.add(t);
      return t;
    };

    const landmarkCtx = createLandmarkContext({
      trackGeo,
      trackMat,
      trackTex,
      createGlowHaloSprite,
      rigPool,
    });

    const nightLights = [];

    // Scene & Dynamic Sky / Exponential Horizon Fog
    const scene = new THREE.Scene();
    const duskBg = new THREE.Color(palette.skyDusk);
    const nightBg = new THREE.Color(palette.skyNight);
    const duskFog = new THREE.Color(palette.fogDusk);
    const nightFog = new THREE.Color(palette.fogNight);

    scene.background = nightBg.clone();
    scene.fog = new THREE.FogExp2(palette.fogNight, 0.0175);

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 420;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 78);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'none';

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.max(100, entry.contentRect.width);
      const h = Math.max(100, entry.contentRect.height);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    });
    resizeObserver.observe(container);

    // 3-Point Lighting (Single shadow caster capped at 1024x1024)
    const hemiLight = new THREE.HemisphereLight(palette.lightNight, palette.groundAccent, 0.85);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(palette.lightNight, 1.45);
    dirLight.position.set(16, 26, 14);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    dirLight.shadow.camera.near = 2;
    dirLight.shadow.camera.far = 75;
    const shadowBound = 22;
    dirLight.shadow.camera.left = -shadowBound;
    dirLight.shadow.camera.right = shadowBound;
    dirLight.shadow.camera.top = shadowBound;
    dirLight.shadow.camera.bottom = -shadowBound;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);
    scene.add(dirLight.target);

    const rimLight = new THREE.DirectionalLight(palette.accentGlow, 0.65);
    rimLight.position.set(-18, 12, -16);
    scene.add(rimLight);

    // Extended Ground Plane (240m x 240m fading cleanly into Exp2 fog)
    const outerGroundMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: isFPQS ? 0x15803d : palette.groundAccent,
        roughness: 0.94,
        metalness: 0.02,
      })
    );
    const outerGround = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(240, 240)), outerGroundMat);
    outerGround.rotation.x = -Math.PI * 0.5;
    outerGround.position.y = -0.05;
    outerGround.receiveShadow = true;
    scene.add(outerGround);

    // Shared Pooled Materials
    const grassMat = trackMat(new THREE.MeshStandardMaterial({ color: palette.ground, roughness: 0.88 }));
    const grassAccentMat = trackMat(new THREE.MeshStandardMaterial({ color: palette.groundAccent, roughness: 0.9 }));
    const roadMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: isFPQS ? palette.asphalt : palette.pathTile,
        roughness: isFPQS ? 0.82 : 0.6,
      })
    );
    const curbMat = trackMat(new THREE.MeshStandardMaterial({ color: isFPQS ? 0xe2e8f0 : 0xb45309, roughness: 0.55 }));
    const dashedLineMat = trackMat(new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.72 }));
    const foyerMat = trackMat(new THREE.MeshStandardMaterial({ color: palette.foyerTile || 0xf8fafc, roughness: 0.35 }));
    const rockMat = trackMat(new THREE.MeshStandardMaterial({ color: palette.rock, roughness: 0.85, flatShading: true }));
    const rockTopMat = trackMat(new THREE.MeshStandardMaterial({ color: palette.rockTop, roughness: 0.78, flatShading: true }));
    const marbleMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 }));
    const waterMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: palette.water,
        emissive: palette.water,
        emissiveIntensity: 0.25,
        roughness: 0.15,
        transparent: true,
        opacity: 0.88,
      })
    );
    const goldMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xb45309,
        emissiveIntensity: 0.35,
        metalness: 0.65,
        roughness: 0.28,
      })
    );
    const trunkMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 }));
    const floraMat = trackMat(new THREE.MeshStandardMaterial({ color: palette.flora, roughness: 0.75, flatShading: true }));

    // Pooled Common Geometries
    const tileSlabGeo = trackGeo(new THREE.BoxGeometry(TILE_SIZE - 0.04, 0.2, TILE_SIZE - 0.04));
    const roadTileGeo = trackGeo(new THREE.BoxGeometry(TILE_SIZE - 0.04, 0.24, TILE_SIZE - 0.04));
    const roadDashGeo = trackGeo(new THREE.BoxGeometry(0.16, 0.02, 1.35));
    const curbGeo = trackGeo(new THREE.BoxGeometry(0.22, 0.1, TILE_SIZE));
    const rockBlockGeo = trackGeo(new THREE.DodecahedronGeometry(1.45, 0));
    const planterBoxGeo = trackGeo(new THREE.BoxGeometry(2.8, 2.4, 2.8));
    const treeTrunkGeo = trackGeo(new THREE.CylinderGeometry(0.16, 0.24, 1.5, 6));
    const treeCrownGeo = trackGeo(new THREE.IcosahedronGeometry(0.92, 0));
    const pillarGeo = trackGeo(new THREE.CylinderGeometry(0.22, 0.38, 10.5, 10, 1, true));
    const ringGeo = trackGeo(new THREE.RingGeometry(0.75, 0.98, 24));

    const colliders = [];
    const cameraWallMeshes = [];
    const clickTargets = [];
    const animatedItems = [];
    const npcInstances = [];

    // Perimeter Trees/Dunes (0 shadow cost)
    for (let i = 0; i < 36; i++) {
      const angle = (i / 36) * Math.PI * 2;
      const rx = 28 + (i % 5) * 6.5;
      const rz = 20 + (i % 4) * 5.2;
      const grp = new THREE.Group();
      const trunk = new THREE.Mesh(treeTrunkGeo, trunkMat);
      trunk.position.y = 0.75;
      grp.add(trunk);
      const crown = new THREE.Mesh(treeCrownGeo, floraMat);
      crown.position.y = 1.9;
      crown.scale.setScalar(1.1 + (i % 3) * 0.22);
      grp.add(crown);
      grp.add(rigPool.createBlobShadow(1.6));
      grp.position.set(Math.cos(angle) * rx, 0, Math.sin(angle) * rz);
      scene.add(grp);
    }

    const pathSet = findPathTiles(mapGrid, 1, 1);
    eng.pathSet = pathSet;

    // Collect walkable road tiles for ambient pedestrian patrol & vehicle spawning
    const walkableAvenueCoords = [];
    let spawnVehicleCoord = null;
    let lampSpacingCount = 0;
    let archPlacedCount = 0;

    // Build 4.0m Scale Playable Open-World Tiles + Avenues + Streetlamps + Landmarks
    for (let rIdx = 0; rIdx < mapGrid.length; rIdx++) {
      for (let cIdx = 0; cIdx < mapGrid[rIdx].length; cIdx++) {
        const tile = mapGrid[rIdx][cIdx];
        const { x, z } = getTileWorldCoords(rIdx, cIdx);
        const isPath = pathSet.has(`${rIdx},${cIdx}`);
        const isWalkable =
          tile && tile.type !== 'WALL' && tile.type !== 'WATER' && !tile.decor;

        if (isPath && tile.type === 'FLOOR') {
          walkableAvenueCoords.push({ x, z, r: rIdx, c: cIdx });
          if (!spawnVehicleCoord && !(rIdx === 1 && cIdx === 1) && Math.hypot(x - spawnCoords.x, z - spawnCoords.z) <= 6.5) {
            spawnVehicleCoord = { x, z };
          }
        }

        if (tile.type === 'WATER') {
          const waterSlab = new THREE.Mesh(tileSlabGeo, waterMat);
          waterSlab.position.set(x, -0.09, z);
          waterSlab.receiveShadow = true;
          scene.add(waterSlab);
          colliders.push({ minX: x - 1.72, maxX: x + 1.72, minZ: z - 1.72, maxZ: z + 1.72 });
        } else {
          const isRoadSurface = tile.type === 'FLOOR' && isPath;
          const chosenMat =
            tile.npc?.npcId === 'NPC-FPQS-4'
              ? foyerMat
              : isRoadSurface || tile.type === 'NPC' || tile.type === 'PORTAL' || tile.type === 'OASIS'
              ? roadMat
              : (rIdx + cIdx) % 2 === 0
              ? grassMat
              : grassAccentMat;

          const floorMesh = new THREE.Mesh(isPath ? roadTileGeo : tileSlabGeo, chosenMat);
          floorMesh.position.set(x, isPath ? -0.1 : -0.11, z);
          floorMesh.receiveShadow = true;
          floorMesh.userData = { r: rIdx, c: cIdx, type: tile.type };
          scene.add(floorMesh);
          clickTargets.push(floorMesh);

          // Add Avenue Road Markings (FPQS White Dashed Lines) or Stone Curb Edges (Maps 1-5)
          if (isRoadSurface) {
            if (isFPQS) {
              const dash = new THREE.Mesh(roadDashGeo, dashedLineMat);
              dash.position.set(x, 0.03, z);
              const horizNeighbor = pathSet.has(`${rIdx},${cIdx + 1}`) || pathSet.has(`${rIdx},${cIdx - 1}`);
              if (horizNeighbor && !pathSet.has(`${rIdx + 1},${cIdx}`)) {
                dash.rotation.y = Math.PI * 0.5;
              }
              scene.add(dash);
            } else {
              // Subtle stone border accents along non-road edges
              if (!pathSet.has(`${rIdx},${cIdx - 1}`) && mapGrid[rIdx]?.[cIdx - 1]?.type === 'FLOOR') {
                const curb = new THREE.Mesh(curbGeo, curbMat);
                curb.position.set(x - TILE_SIZE * 0.46, 0.04, z);
                scene.add(curb);
              }
              // Classical Caravan Boulevard Market Arches over straight horizontal avenues (up to 2 per map)
              const hasHorizNeighbors =
                pathSet.has(`${rIdx},${cIdx - 1}`) &&
                pathSet.has(`${rIdx},${cIdx + 1}`) &&
                mapGrid[rIdx + 1]?.[cIdx]?.type !== 'NPC';
              if (hasHorizNeighbors && archPlacedCount < 2 && cIdx % 4 === 0) {
                const arch = buildBoulevardArch(landmarkCtx, nightLights);
                arch.rotation.y = Math.PI * 0.5;
                arch.position.set(x, 0, z);
                scene.add(arch);
                archPlacedCount += 1;
              }
            }

            // Place Streetlamps along avenues cleanly every few tiles (on sidewalk edge)
            lampSpacingCount += 1;
            if (lampSpacingCount % 4 === 1 && !(rIdx === 1 && cIdx === 1)) {
              const lamp = buildStreetLamp(landmarkCtx, { isFPQS, nightLights });
              const sideOff = rIdx % 2 === 0 ? -1.68 : 1.68;
              lamp.position.set(x + sideOff, 0, z - 1.55);
              if (sideOff > 0) lamp.rotation.y = Math.PI;
              scene.add(lamp);
            }
          }
        }

        // WALLS / BARRIERS
        if (tile.type === 'WALL') {
          if (isFPQS) {
            const wall = new THREE.Mesh(planterBoxGeo, rockTopMat);
            wall.position.set(x, 1.2, z);
            wall.receiveShadow = true;
            scene.add(wall);
            cameraWallMeshes.push(wall);

            const cap = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.92, 0.24, 2.92)), marbleMat);
            cap.position.set(x, 2.48, z);
            scene.add(cap);
            cameraWallMeshes.push(cap);
          } else {
            const rock = new THREE.Mesh(rockBlockGeo, rockMat);
            rock.scale.set(1.05, 1.45, 1.05);
            rock.rotation.y = (rIdx + cIdx) * 0.9;
            rock.position.set(x, 1.4, z);
            rock.receiveShadow = true;
            scene.add(rock);
            cameraWallMeshes.push(rock);
          }
          colliders.push({ minX: x - 1.52, maxX: x + 1.52, minZ: z - 1.52, maxZ: z + 1.52 });
        }

        // DECOR TREES / SHRUBS
        else if (tile.decor && tile.type !== 'OASIS' && tile.type !== 'PORTAL') {
          const { group: floraGroup, swayMesh } = buildFloraProp(landmarkCtx, {
            isFPQS,
            palette,
            rIdx,
            cIdx,
          });
          floraGroup.position.set(x, 0, z);
          scene.add(floraGroup);
          animatedItems.push({ type: 'SWAY', mesh: swayMesh, phase: x + z });
          colliders.push({ minX: x - 0.55, maxX: x + 0.55, minZ: z - 0.55, maxZ: z + 0.55 });
        }

        // OASIS / KAFE DIDI
        else if (tile.type === 'OASIS') {
          eng.oasisPos = { x, z };
          const oasisGroup = isFPQS
            ? buildKafeDidi(landmarkCtx, animatedItems)
            : buildClassicalOasis(landmarkCtx, animatedItems, palette);
          oasisGroup.position.set(x, 0, z);

          const { sprite: lbl, texture: lblTex, material: lblMat } = createFloatingLabelSprite(
            isFPQS ? '☕ Kafe Didi (+Tenaga)' : '⛲ Oasis Hikmah (+Tenaga)',
            {
              borderColor: isFPQS ? '#4ade80' : '#38bdf8',
              textColor: isFPQS ? '#f0fdf4' : '#e0f2fe',
            }
          );
          trackTex(lblTex);
          trackMat(lblMat);
          lbl.position.set(0, isFPQS ? 3.2 : 2.8, 0);
          oasisGroup.add(lbl);

          scene.add(oasisGroup);
          colliders.push({ minX: x - 0.78, maxX: x + 0.78, minZ: z - 0.78, maxZ: z + 0.78 });
        }

        // PORTAL ARCHWAY + LIGHT PILLAR
        else if (tile.type === 'PORTAL') {
          const portalGroup = new THREE.Group();
          portalGroup.position.set(x, 0, z);

          const archTorus = new THREE.Mesh(
            trackGeo(new THREE.TorusGeometry(1.45, 0.16, 10, 28)),
            goldMat
          );
          archTorus.position.y = 1.7;
          archTorus.castShadow = true;
          portalGroup.add(archTorus);

          const { sprite: portalHalo, texture: pTex, material: pMat } = createGlowHaloSprite(0xa855f7, 3.4, 0.82);
          trackTex(pTex);
          trackMat(pMat);
          portalHalo.position.y = 1.7;
          portalGroup.add(portalHalo);

          const canEnter = isFPQS
            ? solvedRef.current.includes(bossNpcIdRef.current || 'NPC-FPQS-4')
            : isWilayahCompletedRef.current;

          const pMatPillar = trackMat(
            new THREE.MeshBasicMaterial({
              color: canEnter ? 0xc084fc : 0x64748b,
              transparent: true,
              opacity: canEnter ? 0.36 : 0.14,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
              side: THREE.DoubleSide,
            })
          );
          const pMesh = new THREE.Mesh(pillarGeo, pMatPillar);
          pMesh.position.y = 5.25;
          portalGroup.add(pMesh);

          const labelApi = createFloatingLabelSprite(
            canEnter ? '🌀 Portal Tamat (Sedia)' : '⏳ Portal (Selesaikan Misi)',
            { borderColor: canEnter ? '#c084fc' : '#64748b' }
          );
          trackTex(labelApi.texture);
          trackMat(labelApi.material);
          labelApi.sprite.position.set(0, 3.9, 0);
          portalGroup.add(labelApi.sprite);

          scene.add(portalGroup);
          eng.portalMarker = { x, z, pillarMesh: pMesh, pillarMat: pMatPillar, labelApi };
          animatedItems.push({ type: 'HALO', mesh: portalHalo, baseScale: 3.4 });
        }

        // NPC LANDMARKS + ARTICULATED HUMANS + BEACONS
        else if (tile.type === 'NPC' && tile.npc) {
          const npc = tile.npc;
          const isSolved = solvedRef.current.includes(npc.npcId);
          const isBoss = bossNpcIdRef.current
            ? npc.npcId === bossNpcIdRef.current
            : npc.npcId?.endsWith('-4');
          const isLocked = isBoss && !isBossUnlockedRef.current && !isSolved;

          const npcGroup = new THREE.Group();
          npcGroup.position.set(x, 0, z);

          const { bldg, bossAuraRingMat } = buildLandmarkBuilding(
            landmarkCtx,
            animatedItems,
            cameraWallMeshes,
            { isFPQS, npc, isBoss, isLocked }
          );
          bldg.position.set(0, 0, -0.72);
          npcGroup.add(bldg);

          colliders.push({
            minX: x - (isBoss ? 1.35 : 1.12),
            maxX: x + (isBoss ? 1.35 : 1.12),
            minZ: z - 0.72 - (isBoss ? 1.05 : 0.88),
            maxZ: z - 0.72 + (isBoss ? 1.05 : 0.88),
          });

          const charsToBuild = [];
          if (isFPQS) {
            const mt = npc.makmalType;
            if (mt === 'TARANNUM') {
              charsToBuild.push(
                buildArticulatedCharacter(rigPool, {
                  preset: 'CAMPUS_MALE_LECTURER',
                  primaryColor: 0x1e3a8a,
                  secondaryColor: 0xf59e0b,
                  hasBook: true,
                }),
                buildArticulatedCharacter(rigPool, {
                  preset: 'CAMPUS_MALE_LECTURER',
                  primaryColor: 0x334155,
                  secondaryColor: 0x16a34a,
                  hasBook: true,
                })
              );
            } else if (mt === 'HADIS') {
              charsToBuild.push(
                buildArticulatedCharacter(rigPool, {
                  preset: 'CAMPUS_MALE_LECTURER',
                  primaryColor: 0x0f172a,
                  secondaryColor: 0x38bdf8,
                  hasBook: true,
                }),
                buildArticulatedCharacter(rigPool, {
                  preset: 'CAMPUS_MALE_LECTURER',
                  primaryColor: 0x14532d,
                  secondaryColor: 0xfbbf24,
                  hasBook: true,
                })
              );
            } else if (mt === 'BRAILLE') {
              charsToBuild.push(
                buildArticulatedCharacter(rigPool, {
                  preset: 'CAMPUS_FEMALE_LECTURER',
                  primaryColor: 0x334155,
                  secondaryColor: 0xf472b6,
                  hasBook: true,
                }),
                buildArticulatedCharacter(rigPool, {
                  preset: 'CAMPUS_FEMALE_LECTURER',
                  primaryColor: 0x1e3a8a,
                  secondaryColor: 0x38bdf8,
                  hasBook: true,
                })
              );
            } else if (mt === 'DEKAN') {
              charsToBuild.push(
                buildArticulatedCharacter(rigPool, {
                  preset: 'CAMPUS_DEAN',
                  primaryColor: 0x0f172a,
                  secondaryColor: 0xfbbf24,
                  hasBook: true,
                })
              );
            } else {
              charsToBuild.push(
                buildArticulatedCharacter(rigPool, {
                  preset: 'CAMPUS_STUDENT',
                  primaryColor: 0x1e3a8a,
                  secondaryColor: 0x22c55e,
                }),
                buildArticulatedCharacter(rigPool, {
                  preset: 'CAMPUS_STUDENT',
                  primaryColor: 0x0f766e,
                  secondaryColor: 0x22c55e,
                })
              );
            }
          } else {
            charsToBuild.push(
              buildArticulatedCharacter(rigPool, {
                preset: 'CLASSICAL_SCHOLAR',
                primaryColor: isBoss ? 0x1e1b4b : 0x064e3b,
                secondaryColor: 0xf59e0b,
                hasBook: true,
              })
            );
          }

          charsToBuild.forEach((charMesh, idx) => {
            const offsetX = charsToBuild.length === 2 ? (idx === 0 ? -0.52 : 0.52) : 0;
            charMesh.position.set(offsetX, 0, 0.92);
            npcGroup.add(charMesh);
            npcInstances.push(charMesh);
          });

          colliders.push({
            minX: x - (charsToBuild.length === 2 ? 0.82 : 0.42),
            maxX: x + (charsToBuild.length === 2 ? 0.82 : 0.42),
            minZ: z + 0.55,
            maxZ: z + 1.25,
          });

          const pillarColor = isSolved
            ? 0x10b981
            : isLocked
            ? 0xef4444
            : isBoss
            ? 0xfbbf24
            : isFPQS
            ? 0x38bdf8
            : 0xf59e0b;
          const pMat = trackMat(
            new THREE.MeshBasicMaterial({
              color: pillarColor,
              transparent: true,
              opacity: isSolved ? 0.1 : isLocked ? 0.22 : isBoss ? 0.36 : 0.3,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
              side: THREE.DoubleSide,
            })
          );
          const pMesh = new THREE.Mesh(pillarGeo, pMat);
          pMesh.position.set(0, 5.25, 0.92);
          npcGroup.add(pMesh);

          const ringMat = trackMat(
            new THREE.MeshBasicMaterial({
              color: pillarColor,
              transparent: true,
              opacity: 0.72,
              side: THREE.DoubleSide,
            })
          );
          const ringMesh = new THREE.Mesh(ringGeo, ringMat);
          ringMesh.rotation.x = -Math.PI * 0.5;
          ringMesh.position.set(0, 0.03, 0.92);
          npcGroup.add(ringMesh);

          const shortName = npc.nama?.split('&')[0]?.trim() || npc.nama;
          const prefix = isSolved ? '✓ ' : isLocked ? '🔒 ' : isBoss ? '👑 ' : '💬 ';
          const labelApi = createFloatingLabelSprite(`${prefix}${shortName}`, {
            borderColor: isSolved ? '#10b981' : isLocked ? '#ef4444' : isBoss ? '#fbbf24' : '#38bdf8',
            textColor: isSolved ? '#a7f3d0' : isLocked ? '#fca5a5' : '#f8fafc',
          });
          trackTex(labelApi.texture);
          trackMat(labelApi.material);
          labelApi.sprite.position.set(0, 2.55, 0.92);
          npcGroup.add(labelApi.sprite);

          const hitProxy = new THREE.Mesh(
            trackGeo(new THREE.BoxGeometry(2.6, 3.0, 2.8)),
            trackMat(new THREE.MeshBasicMaterial({ visible: false }))
          );
          hitProxy.position.set(0, 1.5, 0);
          hitProxy.userData = { r: rIdx, c: cIdx, type: 'NPC', npc };
          npcGroup.add(hitProxy);
          clickTargets.push(hitProxy);

          eng.npcMarkers.push({
            npc,
            x,
            z: z + 0.92,
            tileR: rIdx,
            tileC: cIdx,
            isBoss,
            npcChars: charsToBuild,
            bossAuraRingMat,
            pillarMesh: pMesh,
            pillarMat: pMat,
            ringMesh,
            ringMat,
            labelApi,
          });

          scene.add(npcGroup);
        }

        // Ignore completely empty unused tiles in lint check by keeping walkableAvenueCoords fallback
        if (isWalkable && !spawnVehicleCoord && !(rIdx === 1 && cIdx === 1)) {
          // backup parking spot if immediate neighbor wasn't path
          if (Math.hypot(x - spawnCoords.x, z - spawnCoords.z) <= 8.5) {
            spawnVehicleCoord = { x, z };
          }
        }
      }
    }

    // Spawn Drivable Transport near Spawn Gate (USIM Buggy on Map 6 / Caravan Chariot on Maps 1-5)
    const vehicleSpawn = spawnVehicleCoord || { x: spawnCoords.x + 3.4, z: spawnCoords.z };
    eng.vehiclePos = { x: vehicleSpawn.x, z: vehicleSpawn.z };
    eng.vehicleYaw = Math.PI * 0.5;
    const vehicleObj = isFPQS
      ? buildCampusBuggy(landmarkCtx, createGlowHaloSprite)
      : buildClassicalChariot(landmarkCtx, createGlowHaloSprite);
    vehicleObj.root.position.set(eng.vehiclePos.x, 0, eng.vehiclePos.z);
    vehicleObj.root.rotation.y = eng.vehicleYaw;
    scene.add(vehicleObj.root);

    // Spawn 4 Roaming Ambient Pedestrians patrolling avenues so every city feels alive
    const pedList = walkableAvenueCoords.length >= 4 ? walkableAvenueCoords : [spawnCoords];
    const pedPresets = isFPQS
      ? ['CAMPUS_STUDENT', 'CAMPUS_FEMALE_LECTURER', 'CAMPUS_STUDENT', 'CAMPUS_MALE_LECTURER']
      : ['CLASSICAL_SCHOLAR', 'CLASSICAL_PLAYER', 'CLASSICAL_SCHOLAR', 'CLASSICAL_PLAYER'];
    const pedColors = isFPQS ? [0x1e3a8a, 0x0f766e, 0x334155, 0x166534] : [0x064e3b, 0x7c2d12, 0x1e293b, 0x92400e];

    for (let p = 0; p < 4; p++) {
      const idxA = Math.floor((p / 4) * pedList.length);
      const idxB = Math.min(pedList.length - 1, idxA + Math.max(1, Math.floor(pedList.length / 5)));
      const ptA = pedList[idxA] || spawnCoords;
      const ptB = pedList[idxB] || { x: ptA.x + 4, z: ptA.z };

      const pedMesh = buildArticulatedCharacter(rigPool, {
        preset: pedPresets[p],
        primaryColor: pedColors[p],
        secondaryColor: isFPQS ? 0x22c55e : 0xf59e0b,
        hasBook: p % 2 === 0,
      });
      pedMesh.position.set(ptA.x, 0, ptA.z);
      scene.add(pedMesh);

      eng.pedestrians.push({
        mesh: pedMesh,
        x: ptA.x,
        z: ptA.z,
        yaw: 0,
        ptA,
        ptB,
        goingToB: true,
        speed: 1.55 + (p % 3) * 0.25,
      });
    }

    // Spawn Articulated Player Hero (Shadow caster!)
    const playerHero = buildArticulatedCharacter(rigPool, {
      preset: isFPQS ? 'CAMPUS_PLAYER' : 'CLASSICAL_PLAYER',
      primaryColor: isFPQS ? 0x1e3a8a : 0xf8fafc,
      secondaryColor: isFPQS ? 0x22c55e : 0xd97706,
      hasStaff: !isFPQS,
      castShadow: true,
    });
    playerHero.position.set(eng.playerPos.x, 0, eng.playerPos.z);
    scene.add(playerHero);

    // Floating Atmospheric Particles (White Study Note Sheets on FPQS / Golden Embers on Classical)
    const particleCount = 24;
    const pGeo = trackGeo(isFPQS ? new THREE.PlaneGeometry(0.18, 0.24) : new THREE.OctahedronGeometry(0.06, 0));
    const pMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: isFPQS ? 0xf8fafc : palette.accentGlow,
        transparent: true,
        opacity: isFPQS ? 0.55 : 0.72,
        side: THREE.DoubleSide,
      })
    );
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      const m = new THREE.Mesh(pGeo, pMat);
      m.position.set((Math.random() - 0.5) * 44, 1.2 + Math.random() * 5.0, (Math.random() - 0.5) * 30);
      m.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      scene.add(m);
      particles.push({ mesh: m, seed: Math.random() * 10, baseY: m.position.y });
    }

    // Input Listeners (Keyboard + Multi-Touch Isolated + Mouse Orbit + Tap Raycast)
    const keysDown = new Set();
    const clickRaycaster = new THREE.Raycaster();
    const springRaycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();

    let leftTouchId = null;
    let leftStart = { x: 0, y: 0 };
    let rightTouchId = null;
    let rightPrev = { x: 0, y: 0 };
    let rightStart = { x: 0, y: 0 };
    let rightTravel = 0;
    const maxJoyRadius = 46;

    const updateJoystickDom = (active, sx, sy, dx, dy) => {
      const base = joyBaseRef.current;
      const knob = joyKnobRef.current;
      if (!base || !knob) return;
      if (!active) {
        base.style.opacity = '0';
        return;
      }
      const rect = container.getBoundingClientRect();
      base.style.opacity = '1';
      base.style.transform = `translate3d(${sx - rect.left - 44}px, ${sy - rect.top - 44}px, 0)`;
      knob.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    };

    const handleCanvasTap = (clientX, clientY) => {
      if (isEncounterActiveRef.current || eng.inVehicle) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      clickRaycaster.setFromCamera(pointerNdc, camera);
      const hits = clickRaycaster.intersectObjects(clickTargets, false);
      if (hits.length > 0) {
        const hitData = hits[0].object.userData;
        if (hitData?.type === 'NPC' && hitData.npc) {
          const marker = eng.npcMarkers.find((m) => m.npc.npcId === hitData.npc.npcId);
          if (marker) {
            const d = Math.hypot(marker.x - eng.playerPos.x, marker.z - eng.playerPos.z);
            if (d < INTERACT_DISTANCE) {
              callbacksRef.current.onInteractNpc?.(hitData.npc);
              return;
            }
          }
        }
        if (hitData?.r != null && hitData?.c != null) {
          const curr = worldToGridCoords(eng.playerPos.x, eng.playerPos.z);
          const path = findGridPath(mapGrid, curr.r, curr.c, hitData.r, hitData.c, true);
          if (path.length > 1) {
            eng.autoWalkWaypoints = path.slice(1).map((s, idx, arr) => {
              const wc = getTileWorldCoords(s.r, s.c);
              if (idx === arr.length - 1 && hitData.type === 'NPC') {
                return { x: wc.x, z: Math.min((GRID_ROWS / 2) * TILE_SIZE - 1.0, wc.z + 2.05) };
              }
              return wc;
            });
            eng.autoWalkNpc = hitData.npc || null;
          }
        }
      }
    };

    const onTouchStart = (e) => {
      if (isEncounterActiveRef.current) return;
      const rect = container.getBoundingClientRect();
      const midX = rect.left + rect.width * 0.5;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.clientX < midX && leftTouchId === null) {
          leftTouchId = t.identifier;
          leftStart = { x: t.clientX, y: t.clientY };
          eng.joyVec = { x: 0, y: 0 };
          eng.autoWalkWaypoints = [];
          eng.autoWalkNpc = null;
          updateJoystickDom(true, leftStart.x, leftStart.y, 0, 0);
        } else if (t.clientX >= midX && rightTouchId === null) {
          rightTouchId = t.identifier;
          rightPrev = { x: t.clientX, y: t.clientY };
          rightStart = { x: t.clientX, y: t.clientY };
          rightTravel = 0;
          eng.rightTouchActive = true;
        }
      }
    };

    const onTouchMove = (e) => {
      if (e.cancelable) e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === leftTouchId) {
          let dx = t.clientX - leftStart.x;
          let dy = t.clientY - leftStart.y;
          const dist = Math.hypot(dx, dy);
          if (dist > maxJoyRadius) {
            dx = (dx / dist) * maxJoyRadius;
            dy = (dy / dist) * maxJoyRadius;
          }
          eng.joyVec = { x: dx / maxJoyRadius, y: dy / maxJoyRadius };
          updateJoystickDom(true, leftStart.x, leftStart.y, dx, dy);
        } else if (t.identifier === rightTouchId) {
          const dx = t.clientX - rightPrev.x;
          const dy = t.clientY - rightPrev.y;
          rightPrev = { x: t.clientX, y: t.clientY };
          rightTravel += Math.hypot(dx, dy);
          eng.camYaw -= dx * 0.0068;
          eng.camPitch = THREE.MathUtils.clamp(eng.camPitch + dy * 0.0046, PITCH_MIN, PITCH_MAX);
        }
      }
    };

    const onTouchEnd = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === leftTouchId) {
          leftTouchId = null;
          eng.joyVec = { x: 0, y: 0 };
          updateJoystickDom(false, 0, 0, 0, 0);
        } else if (t.identifier === rightTouchId) {
          if (rightTravel < 10) {
            handleCanvasTap(rightStart.x, rightStart.y);
          }
          rightTouchId = null;
          eng.rightTouchActive = false;
        }
      }
    };

    let mouseDownPos = null;
    let mousePrev = { x: 0, y: 0 };
    let mouseTravel = 0;

    const onMouseDown = (e) => {
      if (e.button !== 0 || isEncounterActiveRef.current) return;
      mouseDownPos = { x: e.clientX, y: e.clientY };
      mousePrev = { x: e.clientX, y: e.clientY };
      mouseTravel = 0;
      eng.mouseDragActive = true;
    };

    const onMouseMove = (e) => {
      if (!mouseDownPos) return;
      const dx = e.clientX - mousePrev.x;
      const dy = e.clientY - mousePrev.y;
      mousePrev = { x: e.clientX, y: e.clientY };
      mouseTravel += Math.hypot(dx, dy);
      eng.camYaw -= dx * 0.0058;
      eng.camPitch = THREE.MathUtils.clamp(eng.camPitch + dy * 0.0042, PITCH_MIN, PITCH_MAX);
    };

    const onMouseUp = (e) => {
      if (!mouseDownPos) return;
      if (mouseTravel < 6) {
        handleCanvasTap(e.clientX, e.clientY);
      }
      mouseDownPos = null;
      eng.mouseDragActive = false;
    };

    const onKeyDown = (e) => {
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(k)) {
        if (!isEncounterActiveRef.current) {
          keysDown.add(k);
          eng.autoWalkWaypoints = [];
          eng.autoWalkNpc = null;
        }
      } else if (k === 'f' && !isEncounterActiveRef.current) {
        toggleVehicleMount();
      } else if (k === 'h' && eng.inVehicle && !isEncounterActiveRef.current) {
        triggerVehicleHorn();
      } else if (k === 'e' && !isEncounterActiveRef.current) {
        const nearest = eng.npcMarkers.find((m) => m.npc.npcId === eng.nearbyNpcId);
        if (nearest) callbacksRef.current.onInteractNpc?.(nearest.npc);
      } else if ((k === ' ' || k === 'enter') && !isEncounterActiveRef.current) {
        const nearest = eng.npcMarkers.find((m) => m.npc.npcId === eng.nearbyNpcId);
        if (nearest && k === 'enter') {
          e.preventDefault();
          callbacksRef.current.onInteractNpc?.(nearest.npc);
        } else if (k === ' ') {
          e.preventDefault();
          triggerJump();
        }
      }
    };

    const onKeyUp = (e) => {
      keysDown.delete(e.key.toLowerCase());
    };

    const dom = renderer.domElement;
    dom.addEventListener('touchstart', onTouchStart, { passive: false });
    dom.addEventListener('touchmove', onTouchMove, { passive: false });
    dom.addEventListener('touchend', onTouchEnd, { passive: false });
    dom.addEventListener('touchcancel', onTouchEnd, { passive: false });
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Pre-allocated vectors (0 GC churn inside 60 FPS loop)
    const camForward = new THREE.Vector3();
    const camRight = new THREE.Vector3();
    const moveVec = new THREE.Vector3();
    const shoulderOrigin = new THREE.Vector3();
    const idealCamPos = new THREE.Vector3();
    const rayDir = new THREE.Vector3();
    const lookTarget = new THREE.Vector3();

    const clock = new THREE.Clock();
    let rafId = null;
    let hudTick = 0;
    let minimapTick = 0;
    let currentSteerAngle = 0;

    const WORLD_BOUND_X = GRID_COLS * TILE_SIZE * 0.5 - 0.85;
    const WORLD_BOUND_Z = GRID_ROWS * TILE_SIZE * 0.5 - 0.85;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;
      const extCtrl = activeControlRef.current;

      // Dynamic Time-of-Day Lighting & Sky Lerp (Senja vs Malam)
      const isNight = timeOfDayRef.current === 'MALAM';
      scene.background.lerp(isNight ? nightBg : duskBg, Math.min(1, dt * 4.5));
      scene.fog.color.lerp(isNight ? nightFog : duskFog, Math.min(1, dt * 4.5));
      hemiLight.intensity = THREE.MathUtils.lerp(hemiLight.intensity, isNight ? 0.78 : 1.05, dt * 4);
      dirLight.intensity = THREE.MathUtils.lerp(dirLight.intensity, isNight ? 1.25 : 1.85, dt * 4);
      dirLight.color.lerp(new THREE.Color(isNight ? palette.lightNight : palette.lightDusk), dt * 4);

      for (let i = 0; i < nightLights.length; i++) {
        const nl = nightLights[i];
        if (nl.mat) {
          nl.mat.emissiveIntensity = THREE.MathUtils.lerp(
            nl.mat.emissiveIntensity,
            isNight ? nl.nightEmissive : nl.dayEmissive,
            dt * 5
          );
        }
        if (nl.halo) {
          nl.halo.material.opacity = THREE.MathUtils.lerp(
            nl.halo.material.opacity,
            isNight ? nl.nightOpacity : nl.dayOpacity,
            dt * 5
          );
        }
      }

      // External Camera Rotation Buttons
      if (!isEncounterActiveRef.current && extCtrl) {
        let yawRate = extCtrl.padYaw || 0;
        if (extCtrl.pulseYawTimer > 0) {
          extCtrl.pulseYawTimer = Math.max(0, extCtrl.pulseYawTimer - dt);
          yawRate += extCtrl.pulseYaw || 0;
        }
        if (Math.abs(yawRate) > 0.01) {
          eng.camYaw -= THREE.MathUtils.clamp(yawRate, -1, 1) * dt * 2.2;
        }
      }

      // Gather Movement Input
      let fwdWeight = -eng.joyVec.y - eng.cornerJoyVec.y;
      let rightWeight = eng.joyVec.x + eng.cornerJoyVec.x;

      if (extCtrl) {
        fwdWeight += extCtrl.padFwd || 0;
        rightWeight += extCtrl.padRight || 0;
        if (extCtrl.pulseTimer > 0) {
          extCtrl.pulseTimer = Math.max(0, extCtrl.pulseTimer - dt);
          fwdWeight += extCtrl.pulseFwd || 0;
          rightWeight += extCtrl.pulseRight || 0;
        }
      }

      if (keysDown.has('w') || keysDown.has('arrowup')) fwdWeight += 1;
      if (keysDown.has('s') || keysDown.has('arrowdown')) fwdWeight -= 1;
      if (keysDown.has('d') || keysDown.has('arrowright')) rightWeight += 1;
      if (keysDown.has('a') || keysDown.has('arrowleft')) rightWeight -= 1;

      const isSprinting = eng.sprintHeld || keysDown.has('shift');
      const inputMag = Math.hypot(fwdWeight, rightWeight);
      let moveSpeedNorm = 0;
      let displaySpeedMps = 0;

      if (!isEncounterActiveRef.current) {
        if (eng.inVehicle) {
          // === DRIVABLE VEHICLE / CHARIOT PHYSICS ===
          const throttle = (eng.gasHeld ? 1 : 0) + fwdWeight;
          const braking = eng.brakeHeld ? 1 : 0;

          if (Math.abs(throttle) > 0.05) {
            eng.vehicleSpeed += THREE.MathUtils.clamp(throttle, -0.6, 1) * VEHICLE_ACCEL * dt;
          } else {
            eng.vehicleSpeed = THREE.MathUtils.lerp(eng.vehicleSpeed, 0, Math.min(1, dt * VEHICLE_DRAG));
          }
          if (braking > 0) {
            eng.vehicleSpeed -= VEHICLE_ACCEL * 0.9 * dt;
          }
          eng.vehicleSpeed = THREE.MathUtils.clamp(eng.vehicleSpeed, -VEHICLE_MAX_SPEED * 0.42, VEHICLE_MAX_SPEED);

          const steerInput = THREE.MathUtils.clamp(rightWeight, -1, 1);
          currentSteerAngle = THREE.MathUtils.lerp(currentSteerAngle, -steerInput * 0.42, Math.min(1, dt * 10));

          if (Math.abs(eng.vehicleSpeed) > 0.15) {
            const turnSign = eng.vehicleSpeed >= 0 ? -1 : 1;
            const turnRate = steerInput * turnSign * 2.35 * Math.min(1, Math.abs(eng.vehicleSpeed) / 5.0);
            eng.vehicleYaw += turnRate * dt;
            if (!eng.rightTouchActive && !eng.mouseDragActive) {
              // Gentle GTA follow-cam behind vehicle
              let camDiff = eng.vehicleYaw - eng.camYaw;
              while (camDiff > Math.PI) camDiff -= Math.PI * 2;
              while (camDiff < -Math.PI) camDiff += Math.PI * 2;
              eng.camYaw += camDiff * Math.min(1, dt * 2.2);
            }
          }

          eng.vehiclePos.x += Math.sin(eng.vehicleYaw) * eng.vehicleSpeed * dt;
          eng.vehiclePos.z += Math.cos(eng.vehicleYaw) * eng.vehicleSpeed * dt;

          eng.vehiclePos.x = THREE.MathUtils.clamp(eng.vehiclePos.x, -WORLD_BOUND_X + 0.6, WORLD_BOUND_X - 0.6);
          eng.vehiclePos.z = THREE.MathUtils.clamp(eng.vehiclePos.z, -WORLD_BOUND_Z + 0.6, WORLD_BOUND_Z - 0.6);
          for (let i = 0; i < colliders.length; i++) {
            resolveCircleAABB(eng.vehiclePos, 0.95, colliders[i]);
          }

          eng.playerPos.x = eng.vehiclePos.x;
          eng.playerPos.z = eng.vehiclePos.z;
          eng.charYaw = eng.vehicleYaw;
          displaySpeedMps = Math.abs(eng.vehicleSpeed);
        } else {
          // === ON-FOOT FREE ROAM + SPRINT + JUMP PHYSICS ===
          if (inputMag > 0.08) {
            eng.autoWalkWaypoints = [];
            eng.autoWalkNpc = null;
            camForward.set(Math.sin(eng.camYaw), 0, Math.cos(eng.camYaw));
            camRight.set(-Math.cos(eng.camYaw), 0, Math.sin(eng.camYaw));
            moveVec
              .set(0, 0, 0)
              .addScaledVector(camForward, fwdWeight)
              .addScaledVector(camRight, rightWeight)
              .normalize();

            const clampedMag = Math.min(1, inputMag);
            const activeSpeed = isSprinting ? SPRINT_SPEED : WALK_SPEED;
            eng.playerPos.x += moveVec.x * activeSpeed * clampedMag * dt;
            eng.playerPos.z += moveVec.z * activeSpeed * clampedMag * dt;
            moveSpeedNorm = isSprinting ? 1.0 : clampedMag * 0.72;
            displaySpeedMps = activeSpeed * clampedMag;

            const targetCharYaw = Math.atan2(moveVec.x, moveVec.z);
            let diff = targetCharYaw - eng.charYaw;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            eng.charYaw += diff * Math.min(1, dt * 12);

            const activeJoyX = eng.joyVec.x || eng.cornerJoyVec.x;
            const activeJoyY = eng.joyVec.y || eng.cornerJoyVec.y;
            if (!eng.rightTouchActive && !eng.mouseDragActive && Math.abs(activeJoyX) > 0.14 && activeJoyY < 0.45) {
              eng.camYaw -= activeJoyX * dt * 1.05;
            }
          } else if (eng.autoWalkWaypoints.length > 0) {
            const wp = eng.autoWalkWaypoints[0];
            const dx = wp.x - eng.playerPos.x;
            const dz = wp.z - eng.playerPos.z;
            const dist = Math.hypot(dx, dz);
            if (dist < 0.35) {
              eng.autoWalkWaypoints.shift();
              if (eng.autoWalkWaypoints.length === 0 && eng.autoWalkNpc) {
                const targetNpc = eng.autoWalkNpc;
                eng.autoWalkNpc = null;
                callbacksRef.current.onInteractNpc?.(targetNpc);
              }
            } else {
              const step = Math.min(dist, WALK_SPEED * dt);
              eng.playerPos.x += (dx / dist) * step;
              eng.playerPos.z += (dz / dist) * step;
              moveSpeedNorm = 0.72;
              displaySpeedMps = WALK_SPEED;
              const targetYaw = Math.atan2(dx, dz);
              let diff = targetYaw - eng.charYaw;
              while (diff > Math.PI) diff -= Math.PI * 2;
              while (diff < -Math.PI) diff += Math.PI * 2;
              eng.charYaw += diff * Math.min(1, dt * 10);
            }
          }

          // Vertical Jump & Gravity Integration
          if (!eng.isGrounded || eng.playerY > 0) {
            eng.playerVelY -= GRAVITY * dt;
            eng.playerY += eng.playerVelY * dt;
            if (eng.playerY <= 0) {
              eng.playerY = 0;
              eng.playerVelY = 0;
              eng.isGrounded = true;
            }
          }

          eng.playerPos.x = THREE.MathUtils.clamp(eng.playerPos.x, -WORLD_BOUND_X, WORLD_BOUND_X);
          eng.playerPos.z = THREE.MathUtils.clamp(eng.playerPos.z, -WORLD_BOUND_Z, WORLD_BOUND_Z);
          for (let i = 0; i < colliders.length; i++) {
            resolveCircleAABB(eng.playerPos, 0.38, colliders[i]);
          }
        }
      }

      // Sync Player & Vehicle Transforms
      vehicleObj.root.position.set(eng.vehiclePos.x, 0, eng.vehiclePos.z);
      vehicleObj.root.rotation.y = eng.vehicleYaw;
      animateVehicle(
        vehicleObj,
        dt,
        eng.inVehicle ? eng.vehicleSpeed : 0,
        eng.inVehicle ? currentSteerAngle : 0,
        isNight
      );

      if (eng.inVehicle) {
        // Seat hero neatly inside vehicle / on carriage
        playerHero.position.set(eng.vehiclePos.x, isFPQS ? 0.56 : 0.44, eng.vehiclePos.z);
        playerHero.rotation.y = eng.vehicleYaw;
        animateArticulatedCharacter(playerHero, dt, 0);
      } else {
        playerHero.position.set(eng.playerPos.x, eng.playerY, eng.playerPos.z);
        playerHero.rotation.y = eng.charYaw;
        animateArticulatedCharacter(playerHero, dt, eng.isGrounded ? moveSpeedNorm : 0.25);
      }

      // Dynamic FOV boost on Sprint or Driving speed
      const desiredFov = eng.inVehicle
        ? 60 + Math.min(12, Math.abs(eng.vehicleSpeed) * 0.8)
        : isSprinting && moveSpeedNorm > 0.2
        ? 67
        : 60;
      if (Math.abs(camera.fov - desiredFov) > 0.08) {
        camera.fov = THREE.MathUtils.lerp(camera.fov, desiredFov, Math.min(1, dt * 6));
        camera.updateProjectionMatrix();
      }

      // Shadow Key Light tracking
      dirLight.position.set(eng.playerPos.x + 14, 24, eng.playerPos.z + 12);
      dirLight.target.position.set(eng.playerPos.x, 0, eng.playerPos.z);

      // Static NPCs idle + Roaming Ambient Pedestrians Patrol
      for (let i = 0; i < npcInstances.length; i++) {
        animateArticulatedCharacter(npcInstances[i], dt, 0);
      }
      for (let i = 0; i < eng.pedestrians.length; i++) {
        const ped = eng.pedestrians[i];
        const dest = ped.goingToB ? ped.ptB : ped.ptA;
        const dx = dest.x - ped.x;
        const dz = dest.z - ped.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.35) {
          ped.goingToB = !ped.goingToB;
        } else {
          ped.x += (dx / dist) * ped.speed * dt;
          ped.z += (dz / dist) * ped.speed * dt;
          const targetYaw = Math.atan2(dx, dz);
          let diff = targetYaw - ped.yaw;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          ped.yaw += diff * Math.min(1, dt * 6);
        }
        ped.mesh.position.set(ped.x, 0, ped.z);
        ped.mesh.rotation.y = ped.yaw;
        animateArticulatedCharacter(ped.mesh, dt, 0.45);
      }

      // Discrete Grid Sync (zero extra React re-renders)
      const nowGrid = worldToGridCoords(eng.playerPos.x, eng.playerPos.z);
      if (nowGrid.r !== eng.lastGridCell.r || nowGrid.c !== eng.lastGridCell.c) {
        eng.lastGridCell = nowGrid;
        callbacksRef.current.onPlayerMoveGrid?.(nowGrid.r, nowGrid.c);
      }

      // Proximity Checks: NPCs, Vehicle, Oasis, Portal
      const isNearV = !eng.inVehicle && Math.hypot(eng.vehiclePos.x - eng.playerPos.x, eng.vehiclePos.z - eng.playerPos.z) < VEHICLE_ENTER_DIST;
      if (isNearV !== eng.nearVehicleFlag) {
        eng.nearVehicleFlag = isNearV;
        setNearVehicle(isNearV);
      }

      let closestNpc = null;
      let closestDist = INTERACT_DISTANCE;
      for (let i = 0; i < eng.npcMarkers.length; i++) {
        const m = eng.npcMarkers[i];
        const d = Math.hypot(m.x - eng.playerPos.x, m.z - eng.playerPos.z);
        if (d < closestDist) {
          closestDist = d;
          closestNpc = m.npc;
        }
      }
      const nextNearbyId = closestNpc?.npcId || null;
      if (nextNearbyId !== eng.nearbyNpcId) {
        eng.nearbyNpcId = nextNearbyId;
        setNearbyInteractiveNpc(closestNpc);
      }

      if (eng.oasisPos && !isEncounterActiveRef.current) {
        const dOasis = Math.hypot(eng.oasisPos.x - eng.playerPos.x, eng.oasisPos.z - eng.playerPos.z);
        if (dOasis < OASIS_TRIGGER_DIST && elapsed - eng.lastOasisTriggerTime > 6.0) {
          eng.lastOasisTriggerTime = elapsed;
          callbacksRef.current.onOasisVisit?.();
        }
      }

      if (eng.portalMarker && !isEncounterActiveRef.current) {
        const dPortal = Math.hypot(eng.portalMarker.x - eng.playerPos.x, eng.portalMarker.z - eng.playerPos.z);
        if (dPortal < PORTAL_TRIGGER_DIST && elapsed - eng.lastPortalTriggerTime > 4.0) {
          eng.lastPortalTriggerTime = elapsed;
          callbacksRef.current.onPortalVisit?.();
        }
      }

      // Cinematic Two-Shot Dialogue Camera OR Spring-Arm Third-Person Camera
      const activeDialogMarker =
        isEncounterActiveRef.current && activeNpcIdRef.current
          ? eng.npcMarkers.find((m) => m.npc.npcId === activeNpcIdRef.current)
          : null;

      if (activeDialogMarker) {
        const toNpcX = activeDialogMarker.x - eng.playerPos.x;
        const toNpcZ = activeDialogMarker.z - eng.playerPos.z;
        const distNpc = Math.hypot(toNpcX, toNpcZ);
        const dirX = distNpc > 0.05 ? toNpcX / distNpc : 0;
        const dirZ = distNpc > 0.05 ? toNpcZ / distNpc : 1;

        const targetPlayerYaw = Math.atan2(dirX, dirZ);
        let pDiff = targetPlayerYaw - eng.charYaw;
        while (pDiff > Math.PI) pDiff -= Math.PI * 2;
        while (pDiff < -Math.PI) pDiff += Math.PI * 2;
        eng.charYaw += pDiff * Math.min(1, dt * 8);
        playerHero.rotation.y = eng.charYaw;

        const npcFaceYaw = Math.atan2(-dirX, -dirZ);
        activeDialogMarker.npcChars?.forEach((ch) => {
          let nDiff = npcFaceYaw - ch.rotation.y;
          while (nDiff > Math.PI) nDiff -= Math.PI * 2;
          while (nDiff < -Math.PI) nDiff += Math.PI * 2;
          ch.rotation.y += nDiff * Math.min(1, dt * 7);
        });

        const sideX = -dirZ;
        const sideZ = dirX;
        idealCamPos.set(
          eng.playerPos.x + sideX * 1.95 - dirX * 1.25,
          1.56,
          eng.playerPos.z + sideZ * 1.95 - dirZ * 1.25
        );
        shoulderOrigin.set(activeDialogMarker.x, 1.45, activeDialogMarker.z);
        rayDir.subVectors(idealCamPos, shoulderOrigin);
        const dLen = rayDir.length();
        if (dLen > 0.01) {
          rayDir.divideScalar(dLen);
          springRaycaster.set(shoulderOrigin, rayDir);
          springRaycaster.far = dLen;
          const wallHits = springRaycaster.intersectObjects(cameraWallMeshes, false);
          if (wallHits.length > 0) {
            idealCamPos.copy(shoulderOrigin).addScaledVector(rayDir, Math.max(1.2, wallHits[0].distance - 0.25));
          }
        }
        lookTarget.set(
          THREE.MathUtils.lerp(eng.playerPos.x, activeDialogMarker.x, 0.65),
          1.38,
          THREE.MathUtils.lerp(eng.playerPos.z, activeDialogMarker.z, 0.65)
        );
        const dialogLerp = 1 - Math.exp(-5.5 * dt);
        eng.camCurrentPos.lerp(idealCamPos, dialogLerp);
        eng.camCurrentLookAt.lerp(lookTarget, dialogLerp);
      } else {
        for (let mIdx = 0; mIdx < eng.npcMarkers.length; mIdx++) {
          const chars = eng.npcMarkers[mIdx].npcChars;
          if (!chars) continue;
          for (let cIdx = 0; cIdx < chars.length; cIdx++) {
            if (Math.abs(chars[cIdx].rotation.y) > 0.01) {
              chars[cIdx].rotation.y = THREE.MathUtils.lerp(chars[cIdx].rotation.y, 0, Math.min(1, dt * 5));
            }
          }
        }

        camForward.set(Math.sin(eng.camYaw), 0, Math.cos(eng.camYaw));
        camRight.set(-Math.cos(eng.camYaw), 0, Math.sin(eng.camYaw));

        shoulderOrigin
          .set(eng.playerPos.x, 1.48 + eng.playerY * 0.5, eng.playerPos.z)
          .addScaledVector(camRight, eng.inVehicle ? 0.1 : 0.35);

        const armDist = eng.inVehicle ? 4.6 : 3.45;
        const backHoriz = armDist * Math.cos(eng.camPitch);
        const pitchHeight = armDist * Math.sin(eng.camPitch);
        idealCamPos
          .set(eng.playerPos.x, 1.78 + pitchHeight + eng.playerY * 0.4, eng.playerPos.z)
          .addScaledVector(camRight, eng.inVehicle ? 0.2 : 0.62)
          .addScaledVector(camForward, -backHoriz);

        rayDir.subVectors(idealCamPos, shoulderOrigin);
        const idealLen = rayDir.length();
        if (idealLen > 0.01) {
          rayDir.divideScalar(idealLen);
          springRaycaster.set(shoulderOrigin, rayDir);
          springRaycaster.far = idealLen;
          const wallHits = springRaycaster.intersectObjects(cameraWallMeshes, false);
          if (wallHits.length > 0) {
            idealCamPos.copy(shoulderOrigin).addScaledVector(rayDir, Math.max(0.85, wallHits[0].distance - 0.25));
          }
        }
        if (idealCamPos.y < 0.6) idealCamPos.y = 0.6;

        lookTarget
          .set(eng.playerPos.x, 1.42 + eng.playerY * 0.3, eng.playerPos.z)
          .addScaledVector(camRight, eng.inVehicle ? 0.1 : 0.35)
          .addScaledVector(camForward, 2.2);

        if (!eng.camInitialized) {
          eng.camCurrentPos.copy(idealCamPos);
          eng.camCurrentLookAt.copy(lookTarget);
          eng.camInitialized = true;
        } else {
          const camLerp = 1 - Math.exp(-10 * dt);
          eng.camCurrentPos.lerp(idealCamPos, camLerp);
          eng.camCurrentLookAt.lerp(lookTarget, camLerp);
        }
      }

      camera.position.copy(eng.camCurrentPos);
      camera.lookAt(eng.camCurrentLookAt);

      // Animate Scene Landmarks & Atmosphere
      for (let i = 0; i < animatedItems.length; i++) {
        const item = animatedItems[i];
        if (item.type === 'BOB') {
          item.mesh.position.y = item.baseY + Math.sin(elapsed * item.speed) * 0.14;
          item.mesh.rotation.y += dt * 1.1;
        } else if (item.type === 'SPIN') {
          item.mesh.rotation.z += dt * item.speed;
          item.mesh.rotation.y += dt * item.speed * 0.65;
        } else if (item.type === 'EQUALIZER') {
          item.mesh.scale.y = 0.55 + Math.abs(Math.sin(elapsed * item.freq + item.phase)) * 0.95;
        } else if (item.type === 'BRAILLE_PULSE') {
          item.mesh.scale.setScalar(0.85 + Math.sin(elapsed * 3.0 + item.phase) * 0.25);
        } else if (item.type === 'HALO') {
          const s = item.baseScale * (1 + Math.sin(elapsed * 2.4) * 0.08);
          item.mesh.scale.set(s, s, 1);
        } else if (item.type === 'SWAY') {
          item.mesh.rotation.z = Math.sin(elapsed * 1.4 + item.phase) * 0.04;
        } else if (item.type === 'STEAM') {
          const t = (elapsed * 0.55 + item.offset) % 1;
          item.mesh.position.y = item.baseY + t * 0.55;
          item.mesh.scale.setScalar(0.8 + t * 0.7);
          item.mesh.material.opacity = (1 - t) * 0.5;
        }
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.mesh.position.y = p.baseY + Math.sin(elapsed * 0.7 + p.seed) * 0.65;
        p.mesh.position.x += Math.sin(elapsed * 0.35 + p.seed) * dt * 0.4;
        p.mesh.rotation.x += dt * 0.4;
        p.mesh.rotation.y += dt * 0.55;
      }

      // Direct DOM updates for GTA Clock & KM/J Speedometer (~10Hz, 0 React re-renders)
      hudTick += dt;
      if (hudTick >= 0.1) {
        hudTick = 0;
        eng.worldClockMinutes = (eng.worldClockMinutes + 0.15) % (24 * 60);
        if (clockDomRef.current) {
          const hh = String(Math.floor(eng.worldClockMinutes / 60)).padStart(2, '0');
          const mm = String(Math.floor(eng.worldClockMinutes % 60)).padStart(2, '0');
          clockDomRef.current.textContent = `${hh}:${mm}`;
        }
        if (speedDomRef.current) {
          const kmh = Math.round(displaySpeedMps * 3.6);
          speedDomRef.current.textContent = `${kmh} KM/J`;
          speedDomRef.current.style.color = kmh > 25 ? '#fbbf24' : '#bae6fd';
        }
      }

      // Rotating Circular GTA GPS Radar Minimap (Bottom-Left ~20Hz)
      minimapTick += dt;
      if (minimapTick >= 0.05 && minimapCanvasRef.current && mapGrid?.length) {
        minimapTick = 0;
        const mm = minimapCanvasRef.current;
        const ctx = mm.getContext('2d');
        if (ctx) {
          const w = mm.width;
          const h = mm.height;
          const cx = w * 0.5;
          const cy = h * 0.5;
          const radius = Math.min(cx, cy) - 4;
          const radarScale = radius / 18.5; // pixels per world meter (~18.5m visible radius)
          const solvedSet = new Set(solvedRef.current || []);

          // Camera forward direction projected onto radar UP:
          // Forward vector (+sin(camYaw), +cos(camYaw)) should point UP (0, -1) on canvas!
          // World (dx, dz) relative to player rotates by rotAngle = camYaw - PI
          const cosR = Math.cos(eng.camYaw);
          const sinR = Math.sin(eng.camYaw);
          const worldToRadar = (wx, wz) => {
            const rx = wx - eng.playerPos.x;
            const rz = wz - eng.playerPos.z;
            // Forward axis = (sinR, cosR), Right axis = (-cosR, sinR)
            // Screen X = dot(rel, right) = rx*(-cosR) + rz*(sinR)
            // Screen Y = -dot(rel, forward) = -(rx*(sinR) + rz*(cosR))
            return {
              sx: cx + (-rx * cosR + rz * sinR) * radarScale,
              sy: cy - (rx * sinR + rz * cosR) * radarScale,
            };
          };

          ctx.clearRect(0, 0, w, h);

          // Circular Clip Mask
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.clip();

          // Radar Floor Fill
          ctx.fillStyle = isFPQS ? '#082018' : '#0b1420';
          ctx.fillRect(0, 0, w, h);

          // Draw Rotated World Tiles (Roads, Buildings, Water)
          ctx.save();
          ctx.translate(cx, cy);
          // Equivalent matrix for worldToRadar around playerPos:
          ctx.rotate(eng.camYaw - Math.PI);
          ctx.translate(-eng.playerPos.x * radarScale, -eng.playerPos.z * radarScale);

          for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
              const t = mapGrid[r]?.[c];
              if (!t) continue;
              const wc = getTileWorldCoords(r, c);
              const px = wc.x * radarScale;
              const py = wc.z * radarScale;
              const sz = TILE_SIZE * radarScale;

              const isRoad = pathSet.has(`${r},${c}`) || t.type === 'NPC' || t.type === 'OASIS' || t.type === 'PORTAL';
              if (t.type === 'WALL') {
                ctx.fillStyle = '#334155';
              } else if (t.type === 'WATER') {
                ctx.fillStyle = '#0369a1';
              } else if (isRoad) {
                ctx.fillStyle = isFPQS ? '#475569' : '#64748b';
              } else {
                ctx.fillStyle = isFPQS ? '#0f3d28' : '#142620';
              }
              ctx.fillRect(px - sz * 0.5, py - sz * 0.5, sz - 0.5, sz - 0.5);
            }
          }
          ctx.restore();

          // Collect GPS Targets (Unsolved NPCs -> Oasis -> Portal -> Vehicle)
          const gpsTargets = [];
          eng.npcMarkers.forEach((m) => {
            if (!solvedSet.has(m.npc.npcId)) {
              const isLocked = m.isBoss && !isBossUnlockedRef.current;
              gpsTargets.push({
                label: m.npc.makmalType || m.npc.nama?.split('&')[0]?.trim() || 'Misi',
                x: m.x,
                z: m.z,
                locked: isLocked,
              });
            }
          });
          if (eng.portalMarker) {
            gpsTargets.push({ label: 'Portal', x: eng.portalMarker.x, z: eng.portalMarker.z });
          }
          if (eng.oasisPos) {
            gpsTargets.push({ label: isFPQS ? 'Kafe Didi' : 'Oasis', x: eng.oasisPos.x, z: eng.oasisPos.z });
          }
          const activeGpsTarget =
            gpsTargets.length > 0 ? gpsTargets[gpsCycleRef.current % gpsTargets.length] : null;

          if (gpsLabelDomRef.current) {
            if (activeGpsTarget) {
              const d = Math.round(Math.hypot(activeGpsTarget.x - eng.playerPos.x, activeGpsTarget.z - eng.playerPos.z));
              gpsLabelDomRef.current.textContent = `${activeGpsTarget.label} ${d}m`;
            } else {
              gpsLabelDomRef.current.textContent = 'Selesai!';
            }
          }

          // Golden GPS Route Line from Player Center to Active Objective (clamped neatly inside radar)
          if (activeGpsTarget) {
            const pTarget = worldToRadar(activeGpsTarget.x, activeGpsTarget.z);
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2.4;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(pTarget.sx, pTarget.sy);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          // Oasis / Kafe Didi Icon
          if (eng.oasisPos) {
            const po = worldToRadar(eng.oasisPos.x, eng.oasisPos.z);
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(po.sx, po.sy, 4.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
          }

          // Portal Icon
          if (eng.portalMarker) {
            const pp = worldToRadar(eng.portalMarker.x, eng.portalMarker.z);
            ctx.strokeStyle = '#c084fc';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.arc(pp.sx, pp.sy, 4.6, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Parked / Active Vehicle Marker
          if (!eng.inVehicle) {
            const pv = worldToRadar(eng.vehiclePos.x, eng.vehiclePos.z);
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(pv.sx - 3.2, pv.sy - 3.2, 6.4, 6.4);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(pv.sx - 3.2, pv.sy - 3.2, 6.4, 6.4);
          }

          // Roaming Pedestrian Dots
          ctx.fillStyle = 'rgba(248, 250, 252, 0.72)';
          for (let i = 0; i < eng.pedestrians.length; i++) {
            const pd = eng.pedestrians[i];
            const pp = worldToRadar(pd.x, pd.z);
            ctx.beginPath();
            ctx.arc(pp.sx, pp.sy, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }

          // Color-Coded NPC / Boss POIs (clamped to rim edge if outside range so player always sees direction!)
          for (let i = 0; i < eng.npcMarkers.length; i++) {
            const m = eng.npcMarkers[i];
            const isSolved = solvedSet.has(m.npc.npcId);
            const isLocked = m.isBoss && !isBossUnlockedRef.current && !isSolved;
            let pm = worldToRadar(m.x, m.z);
            const dxC = pm.sx - cx;
            const dyC = pm.sy - cy;
            const dC = Math.hypot(dxC, dyC);
            if (dC > radius - 5) {
              pm = { sx: cx + (dxC / dC) * (radius - 5), sy: cy + (dyC / dC) * (radius - 5) };
            }

            ctx.fillStyle = isSolved ? '#10b981' : isLocked ? '#ef4444' : m.isBoss ? '#fbbf24' : '#38bdf8';
            ctx.beginPath();
            ctx.arc(pm.sx, pm.sy, m.isBoss ? 4.8 : 3.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }

          // Centered Player Arrow
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(cx, cy - 6.5);
          ctx.lineTo(cx - 4.5, cy + 4.5);
          ctx.lineTo(cx, cy + 2);
          ctx.lineTo(cx + 4.5, cy + 4.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.restore(); // End Circular Clip

          // Circular Bezel Ring
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.72)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.stroke();

          // Rotating Upright North ('N') Rim Badge (-Z world = North)
          const pNorth = worldToRadar(eng.playerPos.x, eng.playerPos.z - 20);
          const nDx = pNorth.sx - cx;
          const nDy = pNorth.sy - cy;
          const nLen = Math.hypot(nDx, nDy) || 1;
          const nx = cx + (nDx / nLen) * radius;
          const ny = cy + (nDy / nLen) * radius;

          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(nx, ny, 7.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1.4;
          ctx.stroke();
          ctx.font = '900 9px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#fbbf24';
          ctx.fillText('N', nx, ny + 0.5);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      dom.removeEventListener('touchstart', onTouchStart);
      dom.removeEventListener('touchmove', onTouchMove);
      dom.removeEventListener('touchend', onTouchEnd);
      dom.removeEventListener('touchcancel', onTouchEnd);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);

      rigPool.dispose();
      disposables.geometries.forEach((g) => g.dispose());
      disposables.materials.forEach((m) => m.dispose());
      disposables.textures.forEach((t) => t.dispose());
      renderer.dispose();
    };
  }, [mapGrid, wilayahIdx, mapSeed, palette, isFPQS]);

  // Visible Bottom-Left Analog Thumbstick (positioned neatly next to Circular Radar)
  const cornerStickStateRef = useRef({ active: false, pointerId: null, cx: 0, cy: 0 });
  const handleCornerStickDown = (e) => {
    if (isEncounterActiveRef.current) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    cornerStickStateRef.current = {
      active: true,
      pointerId: e.pointerId,
      cx: rect.left + rect.width * 0.5,
      cy: rect.top + rect.height * 0.5,
    };
    engineRef.current.autoWalkWaypoints = [];
    engineRef.current.autoWalkNpc = null;
    updateCornerStick(e.clientX, e.clientY);
  };
  const updateCornerStick = (clientX, clientY) => {
    const st = cornerStickStateRef.current;
    let dx = clientX - st.cx;
    let dy = clientY - st.cy;
    const maxR = 24;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    engineRef.current.cornerJoyVec = { x: dx / maxR, y: dy / maxR };
    if (cornerJoyKnobRef.current) {
      cornerJoyKnobRef.current.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    }
  };
  const handleCornerStickMove = (e) => {
    const st = cornerStickStateRef.current;
    if (!st.active || st.pointerId !== e.pointerId) return;
    e.stopPropagation();
    updateCornerStick(e.clientX, e.clientY);
  };
  const handleCornerStickUp = (e) => {
    const st = cornerStickStateRef.current;
    if (!st.active || st.pointerId !== e.pointerId) return;
    e.stopPropagation();
    cornerStickStateRef.current.active = false;
    cornerStickStateRef.current.pointerId = null;
    engineRef.current.cornerJoyVec = { x: 0, y: 0 };
    if (cornerJoyKnobRef.current) {
      cornerJoyKnobRef.current.style.transform = 'translate3d(0px, 0px, 0)';
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 'min(62vh, 490px)',
        minHeight: '350px',
        borderRadius: '18px',
        overflow: 'hidden',
        border: '1px solid rgba(56, 189, 248, 0.28)',
        background: palette.skyNight,
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          touchAction: 'none',
        }}
      />

      {/* ====================================================================
          TOP-RIGHT CLASSIC GTA HUD: CLOCK, KM/J, 5-STAR RANK, REP $, SENJA/MALAM
         ==================================================================== */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '4px',
          zIndex: 9,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            pointerEvents: 'auto',
          }}
        >
          {/* Speedometer + In-World 24h Clock */}
          <div
            style={{
              padding: '3px 9px',
              borderRadius: '8px',
              background: 'rgba(6, 12, 24, 0.82)',
              border: '1px solid rgba(148, 163, 184, 0.35)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              fontSize: '0.72rem',
              fontWeight: 800,
              color: '#f8fafc',
            }}
          >
            <span ref={speedDomRef} style={{ color: '#bae6fd' }}>
              0 KM/J
            </span>
            <span style={{ opacity: 0.35 }}>|</span>
            <span ref={clockDomRef}>17:45</span>
          </div>

          {/* Time of Day Toggle: Senja <-> Malam */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setTimeOfDay((t) => (t === 'MALAM' ? 'SENJA' : 'MALAM'));
            }}
            style={{
              padding: '4px 9px',
              borderRadius: '8px',
              border: '1px solid rgba(251, 191, 36, 0.45)',
              background:
                timeOfDay === 'MALAM'
                  ? 'rgba(15, 23, 42, 0.86)'
                  : 'rgba(124, 45, 18, 0.86)',
              color: '#fef08a',
              fontSize: '0.68rem',
              fontWeight: 800,
              cursor: 'pointer',
              backdropFilter: 'blur(6px)',
            }}
            title="Tukar waktu suasana dunia 3D (Senja atau Malam)"
          >
            {timeOfDay === 'MALAM' ? '🌙 Malam' : '🌅 Senja'}
          </button>
        </div>

        {/* 5-Star Academic/Sanad Rank */}
        <div
          style={{
            display: 'flex',
            gap: '2px',
            fontSize: '0.92rem',
            letterSpacing: '0.06em',
            textShadow: '0 2px 6px rgba(0,0,0,0.85)',
          }}
        >
          {[1, 2, 3, 4, 5].map((starIdx) => (
            <span
              key={starIdx}
              style={{
                color: starIdx <= regionProgress ? '#fbbf24' : 'rgba(148, 163, 184, 0.35)',
              }}
            >
              ★
            </span>
          ))}
        </div>

        {/* GTA Green Cash / Reputation Counter */}
        <div
          style={{
            padding: '2px 8px',
            borderRadius: '6px',
            background: 'rgba(2, 20, 12, 0.82)',
            border: '1px solid rgba(34, 197, 94, 0.45)',
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            fontSize: '0.84rem',
            fontWeight: 900,
            color: '#4ade80',
            textShadow: '0 1px 4px rgba(0,0,0,0.9)',
            letterSpacing: '0.04em',
          }}
        >
          REP {gtaRepCash}
        </div>
      </div>

      {/* ====================================================================
          DRAMATIC CENTER-SCREEN "MISI SELESAI!" SPLASH BANNER
         ==================================================================== */}
      {missionSplash && (
        <div
          className="sprint-slide-in"
          style={{
            position: 'absolute',
            top: '28%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 15,
            padding: '14px 26px',
            borderRadius: '14px',
            background: 'rgba(6, 12, 24, 0.90)',
            border: '2px solid #fbbf24',
            boxShadow: '0 0 36px rgba(251, 191, 36, 0.42)',
            textAlign: 'center',
            pointerEvents: 'none',
            minWidth: '220px',
          }}
        >
          <div
            style={{
              fontSize: '1.35rem',
              fontWeight: 900,
              color: '#fbbf24',
              letterSpacing: '0.08em',
              textShadow: '0 2px 10px rgba(245, 158, 11, 0.6)',
            }}
          >
            {missionSplash.title}
          </div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc', marginTop: '3px' }}>
            {missionSplash.subtitle}
          </div>
          <div
            style={{
              fontSize: '0.76rem',
              fontWeight: 800,
              color: '#4ade80',
              fontFamily: 'ui-monospace, monospace',
              marginTop: '4px',
            }}
          >
            {missionSplash.reward}
          </div>
        </div>
      )}

      {/* ====================================================================
          BOTTOM-LEFT ROTATING CIRCULAR GTA GPS RADAR + 📍 GPS CYCLER
         ==================================================================== */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          zIndex: 9,
        }}
      >
        <div style={{ position: 'relative' }}>
          <canvas
            ref={minimapCanvasRef}
            width={minimapExpanded ? 176 : 114}
            height={minimapExpanded ? 176 : 114}
            onClick={(e) => {
              e.stopPropagation();
              setMinimapExpanded((v) => !v);
            }}
            style={{
              display: 'block',
              width: minimapExpanded ? '176px' : '114px',
              height: minimapExpanded ? '176px' : '114px',
              borderRadius: '50%',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.55)',
            }}
            title="Ketik untuk besarkan atau kecilkan Radar GPS Berputar"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setGpsCycleIdx((i) => i + 1);
            }}
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-10px',
              padding: '2px 7px',
              borderRadius: '999px',
              border: '1px solid rgba(251, 191, 36, 0.7)',
              background: 'rgba(15, 23, 42, 0.92)',
              color: '#fef08a',
              fontSize: '0.62rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(0,0,0,0.45)',
            }}
            title="Tukar sasaran garisan emas GPS"
          >
            📍 GPS
          </button>
        </div>

        <div
          ref={gpsLabelDomRef}
          style={{
            padding: '2px 7px',
            borderRadius: '6px',
            background: 'rgba(6, 12, 24, 0.78)',
            border: '1px solid rgba(251, 191, 36, 0.35)',
            color: '#fef3c7',
            fontSize: '0.60rem',
            fontWeight: 700,
            maxWidth: '124px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          📍 GPS Aktif
        </div>
      </div>

      {/* Compact Analog Thumbstick Beside Radar (Supports Mouse + Touch!) */}
      <div
        onPointerDown={handleCornerStickDown}
        onPointerMove={handleCornerStickMove}
        onPointerUp={handleCornerStickUp}
        onPointerCancel={handleCornerStickUp}
        style={{
          position: 'absolute',
          bottom: '22px',
          left: minimapExpanded ? '196px' : '136px',
          width: '68px',
          height: '68px',
          borderRadius: '50%',
          background: 'rgba(15, 23, 42, 0.56)',
          border: '1.5px solid rgba(56, 189, 248, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'grab',
          touchAction: 'none',
          zIndex: 8,
          boxShadow: '0 6px 18px rgba(0, 0, 0, 0.35)',
        }}
        title="Seret ke mana-mana arah untuk jalan atau memandu 360°"
      >
        <div
          ref={cornerJoyKnobRef}
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
            border: '2px solid rgba(255, 255, 255, 0.85)',
            boxShadow: '0 0 12px rgba(56, 189, 248, 0.65)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Dynamic Floating Touch Virtual Joystick (Left Half of Screen) */}
      <div
        ref={joyBaseRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '88px',
          height: '88px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.12)',
          border: '2px solid rgba(255, 255, 255, 0.35)',
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity 0.12s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          ref={joyKnobRef}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'rgba(56, 189, 248, 0.85)',
            boxShadow: '0 0 12px rgba(56, 189, 248, 0.65)',
          }}
        />
      </div>

      {/* ====================================================================
          BOTTOM-RIGHT GTA ACTION CLUSTER: SPRINT/JUMP OR GAS/BRAKE/HON + CONTEXT
         ==================================================================== */}
      <div
        style={{
          position: 'absolute',
          bottom: '14px',
          right: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px',
          zIndex: 10,
        }}
      >
        {/* Contextual Talk to NPC Button (< 3.2m) */}
        {nearbyInteractiveNpc && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (engineRef.current.inVehicle) toggleVehicleMount();
              callbacksRef.current.onInteractNpc?.(nearbyInteractiveNpc);
            }}
            style={{
              padding: '8px 14px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: '1px solid rgba(167, 243, 208, 0.75)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.78rem',
              cursor: 'pointer',
              boxShadow: '0 8px 22px rgba(16, 185, 129, 0.45)',
              whiteSpace: 'nowrap',
            }}
          >
            💬 Sapa {nearbyInteractiveNpc.nama?.split('&')[0]?.trim()}
          </button>
        )}

        {/* Contextual Enter / Exit Vehicle Button */}
        {(nearVehicle || isDriving) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleVehicleMount();
            }}
            style={{
              padding: '7px 13px',
              borderRadius: '999px',
              background: isDriving
                ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
                : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              border: '1px solid rgba(254, 243, 199, 0.7)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.74rem',
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
            }}
          >
            {isDriving
              ? '🚶 Keluar'
              : isFPQS
              ? '🛺 Pandu Buggy'
              : '🐎 Tunggang Pedati'}
          </button>
        )}

        {/* Primary Action Buttons: Driving (HON / BREK / GAS) vs On-Foot (LARI / LOMPAT) */}
        {isDriving ? (
          <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerVehicleHorn();
              }}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: '1.5px solid #fbbf24',
                background: 'rgba(120, 53, 15, 0.86)',
                color: '#fef08a',
                fontWeight: 900,
                fontSize: '0.68rem',
                cursor: 'pointer',
              }}
              title="Bunyikan Hon / Loceng (Kekunci H)"
            >
              📢 HON
            </button>
            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                engineRef.current.brakeHeld = true;
              }}
              onPointerUp={() => {
                engineRef.current.brakeHeld = false;
              }}
              onPointerLeave={() => {
                engineRef.current.brakeHeld = false;
              }}
              onPointerCancel={() => {
                engineRef.current.brakeHeld = false;
              }}
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                border: '1.5px solid #f87171',
                background: 'rgba(127, 29, 29, 0.85)',
                color: '#fecaca',
                fontWeight: 900,
                fontSize: '0.68rem',
                cursor: 'pointer',
                touchAction: 'none',
              }}
            >
              BREK
            </button>
            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                engineRef.current.gasHeld = true;
              }}
              onPointerUp={() => {
                engineRef.current.gasHeld = false;
              }}
              onPointerLeave={() => {
                engineRef.current.gasHeld = false;
              }}
              onPointerCancel={() => {
                engineRef.current.gasHeld = false;
              }}
              style={{
                width: '62px',
                height: '62px',
                borderRadius: '50%',
                border: '2px solid #4ade80',
                background: 'linear-gradient(135deg, #16a34a 0%, #047857 100%)',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '0.78rem',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(34, 197, 94, 0.45)',
                touchAction: 'none',
              }}
            >
              GAS
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                engineRef.current.sprintHeld = true;
              }}
              onPointerUp={() => {
                engineRef.current.sprintHeld = false;
              }}
              onPointerLeave={() => {
                engineRef.current.sprintHeld = false;
              }}
              onPointerCancel={() => {
                engineRef.current.sprintHeld = false;
              }}
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                border: '1.5px solid #38bdf8',
                background: 'rgba(12, 74, 110, 0.84)',
                color: '#e0f2fe',
                fontWeight: 900,
                fontSize: '0.68rem',
                cursor: 'pointer',
                touchAction: 'none',
              }}
              title="Tahan untuk pecut laju (Shift)"
            >
              ⚡ LARI
            </button>
            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                triggerJump();
              }}
              style={{
                width: '58px',
                height: '58px',
                borderRadius: '50%',
                border: '2px solid #fbbf24',
                background: 'rgba(120, 53, 15, 0.85)',
                color: '#fef08a',
                fontWeight: 900,
                fontSize: '0.68rem',
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(245, 158, 11, 0.35)',
                touchAction: 'none',
              }}
              title="Lompat (Space)"
            >
              ⬆️ LOMPAT
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
