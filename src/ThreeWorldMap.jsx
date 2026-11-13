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
} from './threeLandmarks';

/* =========================================================================
   THREE.JS 3D THIRD-PERSON ENGINE (Kembara Qawaid — Phase 1 Upgrade)
   - Scale: 1 grid unit = 4.0m (TILE_SIZE = 4.0) across ALL 6 regions
   - UE5 Spring-Arm Over-the-Shoulder PerspectiveCamera (FOV 60, Raycaster wall collision)
   - Articulated Human-Like Characters (~1.76m) with Classical Turath & FPQS Campus presets
   - Mobile 60 FPS Guardrails: DPR <= 1.5, ACESFilmicToneMapping, zero post-processing,
     1024x1024 selective shadows (Player + primary landmark domes), blob shadows,
     geometry/material pooling, decoupled useRef loop, ResizeObserver & full .dispose()
   - Multi-Touch Isolated Controls: Left Virtual Joystick + Right Camera Orbit
   ========================================================================= */

export const TILE_SIZE = 4.0;
const GRID_ROWS = 8;
const GRID_COLS = 12;

const WALK_SPEED = 6.4; // m/s smooth RPG brisk walk
const INTERACT_DISTANCE = 3.0; // Euclidean < 3.0m proximity interaction
const OASIS_TRIGGER_DIST = 2.6;
const PORTAL_TRIGGER_DIST = 2.2;
const PITCH_MIN = THREE.MathUtils.degToRad(-10);
const PITCH_MAX = THREE.MathUtils.degToRad(35);

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
    fogColor: 0x041914,
    lightColor: 0xfffbeb,
    skyTop: '#010d0b',
    skyMid: '#062920',
    skyBottom: '#041914',
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
    fogColor: 0x0a1120,
    lightColor: 0xf0fdf4,
    skyTop: '#020617',
    skyMid: '#0c1b33',
    skyBottom: '#0a1120',
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
    fogColor: 0x1a0f07,
    lightColor: 0xfef3c7,
    skyTop: '#0f0502',
    skyMid: '#2e1206',
    skyBottom: '#1a0f07',
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
    fogColor: 0x170f07,
    lightColor: 0xfef9c3,
    skyTop: '#0d0702',
    skyMid: '#261706',
    skyBottom: '#170f07',
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
    fogColor: 0x041624,
    lightColor: 0xe0f2fe,
    skyTop: '#020b17',
    skyMid: '#06203d',
    skyBottom: '#041624',
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
    fogColor: 0x09071c,
    lightColor: 0xf3e8ff,
    skyTop: '#070314',
    skyMid: '#1a0b38',
    skyBottom: '#09071c',
  },
  FPQS: {
    ground: 0x22c55e,
    groundAccent: 0x16a34a,
    pathTile: 0xe2e8f0,
    foyerTile: 0xf8fafc,
    rock: 0x475569,
    rockTop: 0x64748b,
    water: 0x0ea5e9,
    flora: 0x15803d,
    accentGlow: 0x22c55e,
    fogColor: 0x071e16,
    lightColor: 0xf0fdf4,
    skyTop: '#020b08',
    skyMid: '#06261a',
    skyBottom: '#041810',
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

/**
 * Computes shortest tile path on walkables (used both for stone walkways & Auto-Walk waypoints).
 */
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
        tile && tile.type !== 'WALL' && tile.type !== 'WATER' && (!tile.decor || tile.type === 'OASIS' || tile.type === 'PORTAL');
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
  return pathSet;
}

function createSkyGradientTexture(skyTop, skyMid, skyBottom) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, skyTop);
    grad.addColorStop(0.55, skyMid);
    grad.addColorStop(1, skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 128);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
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

/**
 * Push-out circle vs AABB sliding collision in XZ plane.
 */
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
    // Center is inside box; eject along nearest face
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
  playerPos,
  facing = 'RIGHT',
  wilayahIdx = 0,
  mapSeed = 1,
  solvedNpcIds = [],
  onTileClick,
  isEncounterActive = false,
  activeNpcId = null,
  bossNpcId = null,
  isBossUnlocked = true,
  isWilayahCompleted = false,
  autoWalkTarget = null, // { npcId, r, c, nonce }
  onPlayerMoveGrid,
  onInteractNpc,
  onOasisVisit,
  onPortalVisit,
}) {
  const containerRef = useRef(null);
  const joyBaseRef = useRef(null);
  const joyKnobRef = useRef(null);
  const wayfindingBadgeRef = useRef(null);
  const wayfindingArrowRef = useRef(null);

  // Throttled minimal React HUD state for nearby interact button (only updates when nearest target crosses threshold!)
  const [nearbyInteractiveNpc, setNearbyInteractiveNpc] = useState(null);

  // Synced refs so 60 FPS animation loop & scene events NEVER cause WebGL rebuilds
  const solvedRef = useRef(solvedNpcIds);
  const bossNpcIdRef = useRef(bossNpcId);
  const isBossUnlockedRef = useRef(isBossUnlocked);
  const isWilayahCompletedRef = useRef(isWilayahCompleted);
  const isEncounterActiveRef = useRef(isEncounterActive);
  const activeNpcIdRef = useRef(activeNpcId);
  const callbacksRef = useRef({
    onTileClick,
    onPlayerMoveGrid,
    onInteractNpc,
    onOasisVisit,
    onPortalVisit,
  });

  useEffect(() => {
    solvedRef.current = solvedNpcIds;
  }, [solvedNpcIds]);
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
    callbacksRef.current = {
      onTileClick,
      onPlayerMoveGrid,
      onInteractNpc,
      onOasisVisit,
      onPortalVisit,
    };
  }, [onTileClick, onPlayerMoveGrid, onInteractNpc, onOasisVisit, onPortalVisit]);

  // Shared Engine Controller Ref (decoupled from React renders)
  const engineRef = useRef({
    playerPos: { x: 0, z: 0 },
    charYaw: 0,
    camYaw: Math.PI * 0.82,
    camPitch: THREE.MathUtils.degToRad(13),
    camCurrentPos: new THREE.Vector3(),
    camCurrentLookAt: new THREE.Vector3(),
    camInitialized: false,
    autoWalkWaypoints: [],
    autoWalkNpc: null,
    lastGridCell: { r: 1, c: 1 },
    lastOasisTriggerTime: -10,
    lastPortalTriggerTime: -10,
    nearbyNpcId: null,
    joyVec: { x: 0, y: 0 },
    rightTouchActive: false,
    mouseDragActive: false,
    npcMarkers: [], // { npc, x, z, isBoss, pillarMesh, pillarMat, labelApi, ringMesh }
    portalMarker: null,
    oasisPos: null,
    syncPlayerToGrid: null,
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

  // Handle external Auto-Walk request (e.g. "Tap NPC Card to Auto-Walk")
  useEffect(() => {
    if (!autoWalkTarget || !mapGrid?.length) return;
    const eng = engineRef.current;
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
        // Stop in front of NPC building courtyard (+1.75m Z from tile center)
        if (idx === arr.length - 1 && targetNpc) {
          return { x: wc.x, z: Math.min((GRID_ROWS / 2) * TILE_SIZE - 1.0, wc.z + 2.05) };
        }
        return wc;
      });
      eng.autoWalkWaypoints = waypoints;
      eng.autoWalkNpc = targetNpc;
    }
  }, [autoWalkTarget, mapGrid]);

  // Sync discrete playerPos prop only when teleported cleanly (> 1.6 tiles away, e.g. D-pad click or map reset)
  useEffect(() => {
    if (!playerPos) return;
    const eng = engineRef.current;
    const { x, z } = getTileWorldCoords(playerPos.r, playerPos.c);
    const dx = x - eng.playerPos.x;
    const dz = z - eng.playerPos.z;
    // Only snap if far away (map change / manual D-Pad jump > 3.2m) and not walking from self
    const curGrid = worldToGridCoords(eng.playerPos.x, eng.playerPos.z);
    if (curGrid.r !== playerPos.r || curGrid.c !== playerPos.c) {
      if (Math.hypot(dx, dz) > TILE_SIZE * 0.85) {
        eng.playerPos.x = x;
        eng.playerPos.z = z;
        eng.lastGridCell = { r: playerPos.r, c: playerPos.c };
        eng.autoWalkWaypoints = [];
        eng.autoWalkNpc = null;
      }
    }
  }, [playerPos]);

  // Update NPC light pillars, labels & portal glow in-place whenever mission progress changes
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
          m.pillarMat.opacity = 0.10;
        } else if (isLocked) {
          m.pillarMat.color.setHex(0xef4444);
          m.pillarMat.opacity = 0.22;
        } else if (isBoss) {
          m.pillarMat.color.setHex(0xfbbf24);
          m.pillarMat.opacity = 0.36;
        } else {
          m.pillarMat.color.setHex(isFPQS ? 0x38bdf8 : 0xf59e0b);
          m.pillarMat.opacity = 0.30;
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

  // Main WebGL World Builder & Decoupled 60 FPS Loop (ONLY rebuilds on mapGrid / wilayahIdx / mapSeed)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !mapGrid?.length) return;

    const eng = engineRef.current;
    const spawnCoords = getTileWorldCoords(1, 1);
    eng.playerPos = { x: spawnCoords.x, z: spawnCoords.z };
    eng.lastGridCell = { r: 1, c: 1 };
    eng.charYaw = 0;
    eng.camYaw = Math.PI * 0.82;
    eng.camPitch = THREE.MathUtils.degToRad(13);
    eng.camInitialized = false;
    eng.autoWalkWaypoints = [];
    eng.autoWalkNpc = null;
    eng.npcMarkers = [];
    eng.portalMarker = null;
    eng.oasisPos = null;
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

    // Scene & Exponential Atmospheric Horizon Fog (No Floating Island Drop-Off)
    const scene = new THREE.Scene();
    const skyTexture = trackTex(createSkyGradientTexture(palette.skyTop, palette.skyMid, palette.skyBottom));
    scene.background = skyTexture;
    scene.fog = new THREE.FogExp2(palette.fogColor, 0.019);

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 420;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 70);

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

    // ResizeObserver for clean mobile address-bar & orientation resizing
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
    const hemiLight = new THREE.HemisphereLight(palette.lightColor, palette.groundAccent, 0.92);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(palette.lightColor, 1.6);
    dirLight.position.set(16, 28, 14);
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
    rimLight.castShadow = false;
    scene.add(rimLight);

    // Seamless Extended Ground Plane (220m x 220m into fog)
    const outerGroundGeo = trackGeo(new THREE.PlaneGeometry(240, 240));
    const outerGroundMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: isFPQS ? 0x15803d : palette.groundAccent,
        roughness: 0.94,
        metalness: 0.02,
      })
    );
    const outerGround = new THREE.Mesh(outerGroundGeo, outerGroundMat);
    outerGround.rotation.x = -Math.PI * 0.5;
    outerGround.position.y = -0.04;
    outerGround.receiveShadow = true;
    scene.add(outerGround);

    // Shared Pooled Materials
    const grassMat = trackMat(new THREE.MeshStandardMaterial({ color: palette.ground, roughness: 0.88 }));
    const grassAccentMat = trackMat(new THREE.MeshStandardMaterial({ color: palette.groundAccent, roughness: 0.9 }));
    const pathMat = trackMat(new THREE.MeshStandardMaterial({ color: palette.pathTile, roughness: 0.55 }));
    const foyerMat = trackMat(new THREE.MeshStandardMaterial({ color: palette.foyerTile || 0xf8fafc, roughness: 0.35 }));
    const rockMat = trackMat(new THREE.MeshStandardMaterial({ color: palette.rock, roughness: 0.85, flatShading: true }));
    const rockTopMat = trackMat(new THREE.MeshStandardMaterial({ color: palette.rockTop, roughness: 0.78, flatShading: true }));
    const marbleMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 }));
    const creamWallMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.45 }));
    const goldMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xb45309, emissiveIntensity: 0.35, metalness: 0.65, roughness: 0.28 })
    );
    const slateMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 }));
    const waterMat = trackMat(
      new THREE.MeshStandardMaterial({ color: palette.water, emissive: palette.water, emissiveIntensity: 0.25, roughness: 0.15, transparent: true, opacity: 0.88 })
    );
    const trunkMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 }));
    const floraMat = trackMat(new THREE.MeshStandardMaterial({ color: palette.flora, roughness: 0.75, flatShading: true }));
    const usimGreenMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.45 }));
    const neonCyanMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.6, roughness: 0.25 })
    );
    const neonGreenMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 1.8, roughness: 0.25 })
    );

    // Pooled Common Geometries
    const tileSlabGeo = trackGeo(new THREE.BoxGeometry(TILE_SIZE - 0.04, 0.22, TILE_SIZE - 0.04));
    const walkTileGeo = trackGeo(new THREE.BoxGeometry(TILE_SIZE - 0.12, 0.26, TILE_SIZE - 0.12));
    const rockBlockGeo = trackGeo(new THREE.DodecahedronGeometry(1.45, 0));
    const planterBoxGeo = trackGeo(new THREE.BoxGeometry(2.8, 2.4, 2.8));
    const treeTrunkGeo = trackGeo(new THREE.CylinderGeometry(0.16, 0.24, 1.5, 6));
    const treeCrownGeo = trackGeo(new THREE.IcosahedronGeometry(0.92, 0));
    const pillarGeo = trackGeo(new THREE.CylinderGeometry(0.22, 0.38, 10.5, 10, 1, true));
    const ringGeo = trackGeo(new THREE.RingGeometry(0.75, 0.98, 24));

    // Collision AABBs & Camera Wall RaycastTargets
    const colliders = [];
    const cameraWallMeshes = [];
    const clickTargets = [];
    const animatedItems = [];
    const npcInstances = [];

    // Decorative Horizon Perimeter Scenery (trees/dunes beyond playable grid, 0 shadow cost)
    for (let i = 0; i < 34; i++) {
      const angle = (i / 34) * Math.PI * 2;
      const rx = 28 + (i % 5) * 6;
      const rz = 20 + (i % 4) * 5;
      const ox = Math.cos(angle) * rx;
      const oz = Math.sin(angle) * rz;
      const grp = new THREE.Group();
      const trunk = new THREE.Mesh(treeTrunkGeo, trunkMat);
      trunk.position.y = 0.75;
      grp.add(trunk);
      const crown = new THREE.Mesh(treeCrownGeo, floraMat);
      crown.position.y = 1.9;
      crown.scale.setScalar(1.1 + (i % 3) * 0.22);
      grp.add(crown);
      grp.add(rigPool.createBlobShadow(1.6));
      grp.position.set(ox, 0, oz);
      scene.add(grp);
    }

    const pathSet = findPathTiles(mapGrid, 1, 1);

    // Build Playable World Tiles (1 unit = 4.0m)
    for (let rIdx = 0; rIdx < mapGrid.length; rIdx++) {
      for (let cIdx = 0; cIdx < mapGrid[rIdx].length; cIdx++) {
        const tile = mapGrid[rIdx][cIdx];
        const { x, z } = getTileWorldCoords(rIdx, cIdx);
        const isPath = pathSet.has(`${rIdx},${cIdx}`);

        // Ground / Floor Tile
        let floorMesh;
        if (tile.type === 'WATER') {
          const waterSlab = new THREE.Mesh(tileSlabGeo, waterMat);
          waterSlab.position.set(x, -0.09, z);
          waterSlab.receiveShadow = true;
          scene.add(waterSlab);
          colliders.push({
            minX: x - 1.72,
            maxX: x + 1.72,
            minZ: z - 1.72,
            maxZ: z + 1.72,
          });
        } else {
          const chosenMat =
            tile.type === 'NPC' || tile.type === 'PORTAL' || tile.type === 'OASIS' || isPath
              ? tile.npc?.npcId === 'NPC-FPQS-4'
                ? foyerMat
                : pathMat
              : (rIdx + cIdx) % 2 === 0
              ? grassMat
              : grassAccentMat;
          floorMesh = new THREE.Mesh(isPath ? walkTileGeo : tileSlabGeo, chosenMat);
          floorMesh.position.set(x, isPath ? -0.10 : -0.11, z);
          floorMesh.receiveShadow = true;
          floorMesh.userData = { r: rIdx, c: cIdx, type: tile.type };
          scene.add(floorMesh);
          clickTargets.push(floorMesh);
        }

        // 1. WALLS / BARRIERS (2.8m tall scaled obstacles so camera raycaster hits naturally)
        if (tile.type === 'WALL') {
          if (isFPQS) {
            const wall = new THREE.Mesh(planterBoxGeo, rockTopMat);
            wall.position.set(x, 1.2, z);
            wall.receiveShadow = true;
            scene.add(wall);
            cameraWallMeshes.push(wall);

            const cap = new THREE.Mesh(
              trackGeo(new THREE.BoxGeometry(2.92, 0.24, 2.92)),
              marbleMat
            );
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
          colliders.push({
            minX: x - 1.52,
            maxX: x + 1.52,
            minZ: z - 1.52,
            maxZ: z + 1.52,
          });
        }

        // 2. DECOR TREES / SHRUBS (Zero directional castShadow; ground blob shadows)
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
          colliders.push({
            minX: x - 0.55,
            maxX: x + 0.55,
            minZ: z - 0.55,
            maxZ: z + 0.55,
          });
        }

        // 3. OASIS / KAFE DIDI (Scaled to 4.0m courtyard, triggers energy recovery on proximity)
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
          colliders.push({
            minX: x - 0.78,
            maxX: x + 0.78,
            minZ: z - 0.78,
            maxZ: z + 0.78,
          });
        }

        // 4. PORTAL ARCHWAY + LIGHT PILLAR
        else if (tile.type === 'PORTAL') {
          const portalGroup = new THREE.Group();
          portalGroup.position.set(x, 0, z);

          const archTorus = new THREE.Mesh(
            trackGeo(new THREE.TorusGeometry(1.45, 0.16, 10, 28)),
            goldMat
          );
          archTorus.position.y = 1.7;
          archTorus.castShadow = true; // Primary landmark dome/arch shadow
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
          eng.portalMarker = {
            x,
            z,
            pillarMesh: pMesh,
            pillarMat: pMatPillar,
            labelApi,
          };
          animatedItems.push({ type: 'HALO', mesh: portalHalo, baseScale: 3.4 });
        }

        // 5. NPC LANDMARK BUILDINGS + ARTICULATED HUMAN CHARACTERS + LIGHT PILLARS
        else if (tile.type === 'NPC' && tile.npc) {
          const npc = tile.npc;
          const isSolved = solvedRef.current.includes(npc.npcId);
          const isBoss = bossNpcIdRef.current
            ? npc.npcId === bossNpcIdRef.current
            : npc.npcId?.endsWith('-4');
          const isLocked = isBoss && !isBossUnlockedRef.current && !isSolved;

          const npcGroup = new THREE.Group();
          npcGroup.position.set(x, 0, z);

          // Detailed Architectural Landmark (FPQS Campus Labs/Foyer or Classical Gold-Domed Sanctuary)
          const { bldg, bossAuraRingMat } = buildLandmarkBuilding(
            landmarkCtx,
            animatedItems,
            cameraWallMeshes,
            { isFPQS, npc, isBoss, isLocked }
          );
          bldg.position.set(0, 0, -0.72);
          npcGroup.add(bldg);

          // Colliders around the Landmark Building
          colliders.push({
            minX: x - (isBoss ? 1.35 : 1.12),
            maxX: x + (isBoss ? 1.35 : 1.12),
            minZ: z - 0.72 - (isBoss ? 1.05 : 0.88),
            maxZ: z - 0.72 + (isBoss ? 1.05 : 0.88),
          });

          // Place Articulated Human NPCs standing in front (+0.95m Z)
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
              // BILIK_NADI: Ali Shahril & Ebadullah
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

          // Character standing spot collider so hero can walk near without overlapping meshes
          colliders.push({
            minX: x - (charsToBuild.length === 2 ? 0.82 : 0.42),
            maxX: x + (charsToBuild.length === 2 ? 0.82 : 0.42),
            minZ: z + 0.55,
            maxZ: z + 1.25,
          });

          // Vertical Light Pillar + Ground Beacon Ring
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

          // Clickable Proxy Box for raycasting tap-to-auto-walk
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
      }
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

    // Lightweight Atmosphere Particles (White Paper Sheets on FPQS / Warm Embers on Classical)
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

    // Input Tracking (Keyboard + Multi-Touch Isolated + Mouse Drag Orbit + Tap Raycast)
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
      if (isEncounterActiveRef.current) return;
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

    // Desktop Mouse Orbit + Click
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
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        if (!isEncounterActiveRef.current) {
          keysDown.add(k);
          eng.autoWalkWaypoints = [];
          eng.autoWalkNpc = null;
        }
      } else if ((k === ' ' || k === 'enter') && !isEncounterActiveRef.current) {
        const nearest = eng.npcMarkers.find((m) => m.npc.npcId === eng.nearbyNpcId);
        if (nearest) {
          e.preventDefault();
          callbacksRef.current.onInteractNpc?.(nearest.npc);
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

    // Vectors reused inside 60 FPS loop (zero GC churn!)
    const camForward = new THREE.Vector3();
    const camRight = new THREE.Vector3();
    const moveVec = new THREE.Vector3();
    const shoulderOrigin = new THREE.Vector3();
    const idealCamPos = new THREE.Vector3();
    const rayDir = new THREE.Vector3();
    const lookTarget = new THREE.Vector3();
    const projVec = new THREE.Vector3();

    const clock = new THREE.Clock();
    let rafId = null;
    let badgeTick = 0;
    const WORLD_BOUND_X = (GRID_COLS * TILE_SIZE) * 0.5 - 0.75;
    const WORLD_BOUND_Z = (GRID_ROWS * TILE_SIZE) * 0.5 - 0.75;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;

      // 1. Gather Movement Vector (Joystick > Keyboard > AutoWalk)
      let fwdWeight = -eng.joyVec.y;
      let rightWeight = eng.joyVec.x;

      if (keysDown.has('w') || keysDown.has('arrowup')) fwdWeight += 1;
      if (keysDown.has('s') || keysDown.has('arrowdown')) fwdWeight -= 1;
      if (keysDown.has('d') || keysDown.has('arrowright')) rightWeight += 1;
      if (keysDown.has('a') || keysDown.has('arrowleft')) rightWeight -= 1;

      const inputMag = Math.hypot(fwdWeight, rightWeight);
      let moveSpeedNorm = 0;

      if (!isEncounterActiveRef.current) {
        if (inputMag > 0.08) {
          camForward.set(Math.sin(eng.camYaw), 0, Math.cos(eng.camYaw));
          camRight.set(-Math.cos(eng.camYaw), 0, Math.sin(eng.camYaw));
          moveVec
            .set(0, 0, 0)
            .addScaledVector(camForward, fwdWeight)
            .addScaledVector(camRight, rightWeight)
            .normalize();

          const clampedMag = Math.min(1, inputMag);
          eng.playerPos.x += moveVec.x * WALK_SPEED * clampedMag * dt;
          eng.playerPos.z += moveVec.z * WALK_SPEED * clampedMag * dt;
          moveSpeedNorm = clampedMag;

          // Smooth character yaw rotation toward travel direction
          const targetCharYaw = Math.atan2(moveVec.x, moveVec.z);
          let diff = targetCharYaw - eng.charYaw;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          eng.charYaw += diff * Math.min(1, dt * 12);

          // Smart Camera Soft-Assist during one-handed joystick steering
          if (!eng.rightTouchActive && !eng.mouseDragActive && Math.abs(eng.joyVec.x) > 0.14 && eng.joyVec.y < 0.45) {
            eng.camYaw -= eng.joyVec.x * dt * 1.05;
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
            moveSpeedNorm = 0.95;
            const targetYaw = Math.atan2(dx, dz);
            let diff = targetYaw - eng.charYaw;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            eng.charYaw += diff * Math.min(1, dt * 10);
          }
        }
      }

      // 2. Smooth Sliding Circle Collision vs World Bounds & Tile AABBs
      eng.playerPos.x = THREE.MathUtils.clamp(eng.playerPos.x, -WORLD_BOUND_X, WORLD_BOUND_X);
      eng.playerPos.z = THREE.MathUtils.clamp(eng.playerPos.z, -WORLD_BOUND_Z, WORLD_BOUND_Z);
      for (let i = 0; i < colliders.length; i++) {
        resolveCircleAABB(eng.playerPos, 0.38, colliders[i]);
      }

      playerHero.position.set(eng.playerPos.x, 0, eng.playerPos.z);
      playerHero.rotation.y = eng.charYaw;
      animateArticulatedCharacter(playerHero, dt, moveSpeedNorm);

      // Update key light shadow target around player
      dirLight.position.set(eng.playerPos.x + 14, 24, eng.playerPos.z + 12);
      dirLight.target.position.set(eng.playerPos.x, 0, eng.playerPos.z);

      // Idle breathing/look animation for NPCs
      for (let i = 0; i < npcInstances.length; i++) {
        animateArticulatedCharacter(npcInstances[i], dt, 0);
      }

      // Sync discrete grid coord ONLY when changed (no per-frame React re-renders)
      const nowGrid = worldToGridCoords(eng.playerPos.x, eng.playerPos.z);
      if (nowGrid.r !== eng.lastGridCell.r || nowGrid.c !== eng.lastGridCell.c) {
        eng.lastGridCell = nowGrid;
        callbacksRef.current.onPlayerMoveGrid?.(nowGrid.r, nowGrid.c);
      }

      // 3. Proximity Interactions (NPC < 3.0m, Oasis healing, Portal entry)
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

      // 4. Camera: Cinematic Two-Shot Dialogue Camera OR UE5 Spring-Arm Over-the-Shoulder
      const activeDialogMarker =
        isEncounterActiveRef.current && activeNpcIdRef.current
          ? eng.npcMarkers.find((m) => m.npc.npcId === activeNpcIdRef.current)
          : null;

      if (activeDialogMarker) {
        // Face-to-face turn between Player and Active NPC(s)
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

        // Two-Shot Side-Quarter Framing (Player foreground + Speaking NPC prominent)
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
            const safeDist = Math.max(1.2, wallHits[0].distance - 0.25);
            idealCamPos.copy(shoulderOrigin).addScaledVector(rayDir, safeDist);
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
        // Settle non-engaged NPCs back toward courtyard forward (+Z)
        for (let mIdx = 0; mIdx < eng.npcMarkers.length; mIdx++) {
          const chars = eng.npcMarkers[mIdx].npcChars;
          if (!chars) continue;
          for (let cIdx = 0; cIdx < chars.length; cIdx++) {
            if (Math.abs(chars[cIdx].rotation.y) > 0.01) {
              chars[cIdx].rotation.y = THREE.MathUtils.lerp(chars[cIdx].rotation.y, 0, Math.min(1, dt * 5));
            }
          }
        }

        // Standard UE5 Spring-Arm Over-the-Shoulder Camera + Raycaster Wall Collision
        camForward.set(Math.sin(eng.camYaw), 0, Math.cos(eng.camYaw));
        camRight.set(-Math.cos(eng.camYaw), 0, Math.sin(eng.camYaw));

        shoulderOrigin
          .set(eng.playerPos.x, 1.48, eng.playerPos.z)
          .addScaledVector(camRight, 0.35);

        const armDist = 3.4;
        const backHoriz = armDist * Math.cos(eng.camPitch);
        const pitchHeight = armDist * Math.sin(eng.camPitch);
        idealCamPos
          .set(eng.playerPos.x, 1.75 + pitchHeight, eng.playerPos.z)
          .addScaledVector(camRight, 0.65)
          .addScaledVector(camForward, -backHoriz);

        rayDir.subVectors(idealCamPos, shoulderOrigin);
        const idealLen = rayDir.length();
        if (idealLen > 0.01) {
          rayDir.divideScalar(idealLen);
          springRaycaster.set(shoulderOrigin, rayDir);
          springRaycaster.far = idealLen;
          const wallHits = springRaycaster.intersectObjects(cameraWallMeshes, false);
          if (wallHits.length > 0) {
            const safeDist = Math.max(0.75, wallHits[0].distance - 0.25);
            idealCamPos.copy(shoulderOrigin).addScaledVector(rayDir, safeDist);
          }
        }
        if (idealCamPos.y < 0.55) idealCamPos.y = 0.55;

        lookTarget
          .set(eng.playerPos.x, 1.42, eng.playerPos.z)
          .addScaledVector(camRight, 0.35)
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

      // 5. Scene Animations (Particles, Equalizer, Braille Pulse, Spin, Bob, Sway, Steam)
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

      // 6. Lightweight Wayfinding Distance Badge DOM Update (~10Hz, 0 React re-renders)
      badgeTick += dt;
      if (badgeTick >= 0.1 && wayfindingBadgeRef.current) {
        badgeTick = 0;
        const solvedSet = new Set(solvedRef.current || []);
        const unlockedNpcs = eng.npcMarkers.filter((m) => {
          if (solvedSet.has(m.npc.npcId)) return false;
          const isBoss = bossNpcIdRef.current
            ? m.npc.npcId === bossNpcIdRef.current
            : m.npc.npcId?.endsWith('-4');
          return !(isBoss && !isBossUnlockedRef.current);
        });

        let targetMarker = null;
        if (unlockedNpcs.length > 0) {
          let bestD = Infinity;
          for (const m of unlockedNpcs) {
            const d = Math.hypot(m.x - eng.playerPos.x, m.z - eng.playerPos.z);
            if (d < bestD) {
              bestD = d;
              targetMarker = { label: m.npc.peranan?.split('(')[0]?.trim() || m.npc.nama, x: m.x, z: m.z, dist: d };
            }
          }
        } else if (eng.portalMarker) {
          const d = Math.hypot(eng.portalMarker.x - eng.playerPos.x, eng.portalMarker.z - eng.playerPos.z);
          targetMarker = { label: 'Portal Tamat', x: eng.portalMarker.x, z: eng.portalMarker.z, dist: d };
        }

        if (targetMarker) {
          wayfindingBadgeRef.current.style.display = 'flex';
          wayfindingBadgeRef.current.lastChild.textContent = `📍 ${targetMarker.label} • ${Math.round(targetMarker.dist)}m`;
          // Relative bearing angle on screen
          projVec.set(targetMarker.x, 1.5, targetMarker.z).project(camera);
          const angleRad = Math.atan2(projVec.x, projVec.y);
          if (wayfindingArrowRef.current) {
            wayfindingArrowRef.current.style.transform = `rotate(${Math.round(THREE.MathUtils.radToDeg(angleRad))}deg)`;
          }
        } else {
          wayfindingBadgeRef.current.style.display = 'none';
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

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 'min(58vh, 460px)',
        minHeight: '320px',
        borderRadius: '18px',
        overflow: 'hidden',
        border: '1px solid rgba(56, 189, 248, 0.28)',
        background: palette.skyBottom,
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

      {/* Eye-Level Edge-of-Screen Wayfinding Distance Badge */}
      <div
        ref={wayfindingBadgeRef}
        style={{
          position: 'absolute',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'none',
          alignItems: 'center',
          gap: '7px',
          padding: '5px 12px',
          borderRadius: '999px',
          background: 'rgba(10, 18, 36, 0.78)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(56, 189, 248, 0.45)',
          color: '#f8fafc',
          fontSize: '0.74rem',
          fontWeight: 700,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
        }}
      >
        <span
          ref={wayfindingArrowRef}
          style={{ display: 'inline-block', color: '#38bdf8', fontWeight: 900 }}
        >
          ▲
        </span>
        <span>📍</span>
      </div>

      {/* Floating Touch Virtual Joystick (Left Half, DOM-driven 0 React re-renders) */}
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

      {/* Proximity < 3.0m Floating Action Trigger */}
      {nearbyInteractiveNpc && (
        <button
          type="button"
          onClick={() => callbacksRef.current.onInteractNpc?.(nearbyInteractiveNpc)}
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 18px',
            borderRadius: '999px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: '1px solid rgba(167, 243, 208, 0.7)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.84rem',
            cursor: 'pointer',
            boxShadow: '0 10px 28px rgba(16, 185, 129, 0.45)',
            zIndex: 10,
            whiteSpace: 'nowrap',
          }}
        >
          💬 Sapa {nearbyInteractiveNpc.nama?.split('&')[0]?.trim()}
        </button>
      )}

      {/* Compact Control Hint Pill */}
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          padding: '4px 9px',
          borderRadius: '8px',
          background: 'rgba(10, 18, 36, 0.65)',
          color: '#cbd5e1',
          fontSize: '0.66rem',
          fontWeight: 600,
          pointerEvents: 'none',
        }}
      >
        🕹️ Kiri: Gerak • Kanan/Seret: Kamera • WASD
      </div>
    </div>
  );
}
