import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

/* =========================================================================
   THREE.JS 3D LOW-POLY DIORAMA ISLAND (Kembara Qawaid — FASA 1 NAIK TARAF VISUAL)
   - Figur Pengembara Kontras Tinggi (Jubah Putih Mutiara & Biru Diraja, Kolar Emas,
     Serban Putih, Tongkat Permata Bercahaya, Gelang Kaki Cyan & Label "ANDA")
   - Struktur Bangunan Menara Kubah NPC (Tapak Marmar Bersegi, Badan Bangunan Putih/Krem,
     Kubah Emas Besar, Kristal Berlian Terapung & Label Nama/Misi NPC)
   - Kolam Oasis Hikmah dengan 2 Pokok Kurma Low-Poly di Tepi Air Biru
   ========================================================================= */

const TILE_SIZE = 1.15;
const GRID_ROWS = 8;
const GRID_COLS = 12;

// Tema Warna Mengikut Wilayah & Atmosfera Sinematik (FASA 2: Langit Senja/Malam Islamik)
const BIOME_PALETTES = {
  BAGHDAD: {
    ground: 0x064e3b,       // Zamrud gelap
    groundAccent: 0x047857, // Hijau firus
    rock: 0x334155,
    rockTop: 0x475569,
    cliff: 0x0f291e,
    water: 0x0284c7,
    flora: 0x10b981,
    accentGlow: 0xf59e0b,   // Emas
    fogColor: 0x041914,     // Kabus zamrud malam
    lightColor: 0xfffbeb,
    skyTop: '#010d0b',
    skyMid: '#062920',
    skyBottom: '#041914',
  },
  DAMSYIK: {
    ground: 0x1e293b,       // Marmar kelabu zaitun
    groundAccent: 0x334155,
    rock: 0x475569,
    rockTop: 0x64748b,
    cliff: 0x0f172a,
    water: 0x38bdf8,
    flora: 0x059669,
    accentGlow: 0x38bdf8,
    fogColor: 0x0a1120,     // Kabus malam Syam
    lightColor: 0xf0fdf4,
    skyTop: '#020617',
    skyMid: '#0c1b33',
    skyBottom: '#0a1120',
  },
  HIJAZ: {
    ground: 0xb45309,       // Pasir gurun hangat
    groundAccent: 0xd97706,
    rock: 0x78350f,
    rockTop: 0x92400e,
    cliff: 0x451a03,
    water: 0x06b6d4,
    flora: 0x15803d,
    accentGlow: 0xf59e0b,
    fogColor: 0x1a0f07,     // Haze jingga gurun
    lightColor: 0xfef3c7,
    skyTop: '#0f0502',
    skyMid: '#2e1206',
    skyBottom: '#1a0f07',
  },
  KAHERAH: {
    ground: 0x854d0e,       // Batu kapur Mesir
    groundAccent: 0xa16207,
    rock: 0x713f12,
    rockTop: 0x854d0e,
    cliff: 0x3f1e05,
    water: 0x0284c7,
    flora: 0x16a34a,
    accentGlow: 0xfbbf24,
    fogColor: 0x170f07,     // Haze batu kapur
    lightColor: 0xfef9c3,
    skyTop: '#0d0702',
    skyMid: '#261706',
    skyBottom: '#170f07',
  },
  ANDALUSIA: {
    ground: 0x0369a1,       // Biru firus laut
    groundAccent: 0x0f766e,
    rock: 0x1e293b,
    rockTop: 0x334155,
    cliff: 0x082f49,
    water: 0x38bdf8,
    flora: 0x10b981,
    accentGlow: 0x2dd4bf,
    fogColor: 0x041624,     // Kabus pesisir pantai
    lightColor: 0xe0f2fe,
    skyTop: '#020b17',
    skyMid: '#06203d',
    skyBottom: '#041624',
  },
  COSMIC: {
    ground: 0x312e81,       // Indigo kosmik
    groundAccent: 0x4338ca,
    rock: 0x1e1b4b,
    rockTop: 0x3730a3,
    cliff: 0x0f0e26,
    water: 0x818cf8,
    flora: 0x8b5cf6,
    accentGlow: 0xc084fc,
    fogColor: 0x09071c,     // Nebula ungu
    lightColor: 0xf3e8ff,
    skyTop: '#070314',
    skyMid: '#1a0b38',
    skyBottom: '#09071c',
  },
  FPQS: {
    ground: 0x22c55e,       // Blok rumput kampus hijau terang (#22c55e)
    groundAccent: 0x16a34a, // Hijau rumput segar variasi
    pathTile: 0xe2e8f0,     // Jubin moden kelabu/putih pejalan kaki/foyer (#e2e8f0)
    foyerTile: 0xf8fafc,    // Jubin foyer marmar putih
    rock: 0x475569,         // Dinding perimeter kampus
    rockTop: 0x64748b,      // Tembok / planter box
    cliff: 0x0f172a,        // Tebing bawah pulau
    water: 0x0ea5e9,        // Air / kafe
    flora: 0x15803d,        // Pokok landskap kampus
    accentGlow: 0x22c55e,   // Cahaya hijau zamrud USIM
    fogColor: 0x071e16,     // Kabus malam kampus damai
    lightColor: 0xf0fdf4,   // Cahaya lampu kampus lembut
    skyTop: '#020b08',
    skyMid: '#06261a',
    skyBottom: '#041810',
  },
};

/**
 * FASA 1: Cari rangkaian petak laluan menyambungkan permulaan pemain (1,1) ke semua NPC, Oasis & Portal
 */
function findPathTiles(grid, startR = 1, startC = 1) {
  const pathSet = new Set();
  if (!grid || !grid.length) return pathSet;

  const rows = grid.length;
  const cols = grid[0].length;
  const targets = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tile = grid[r][c];
      if (tile && (tile.type === 'NPC' || tile.type === 'PORTAL' || tile.type === 'OASIS')) {
        targets.push({ r, c });
      }
    }
  }

  targets.forEach((target) => {
    const queue = [[startR, startC]];
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    const parent = Array.from({ length: rows }, () => Array(cols).fill(null));
    visited[startR][startC] = true;
    let found = false;

    while (queue.length > 0) {
      const [currR, currC] = queue.shift();
      if (currR === target.r && currC === target.c) {
        found = true;
        break;
      }

      const dirs = [
        [0, 1],
        [1, 0],
        [0, -1],
        [-1, 0],
      ];
      for (const [dr, dc] of dirs) {
        const nr = currR + dr;
        const nc = currC + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
          const t = grid[nr][nc];
          if (t && t.type !== 'WALL' && t.type !== 'WATER') {
            visited[nr][nc] = true;
            parent[nr][nc] = [currR, currC];
            queue.push([nr, nc]);
          }
        }
      }
    }

    if (found) {
      let curr = [target.r, target.c];
      while (curr) {
        const [cr, cc] = curr;
        if (grid[cr]?.[cc]?.type === 'FLOOR') {
          pathSet.add(`${cr},${cc}`);
        }
        curr = parent[cr][cc];
      }
    }
  });

  return pathSet;
}

/**
 * Bina THREE.Sprite Label Terapung menggunakan HTML5 CanvasTexture
 */
function createFloatingLabelSprite(
  text,
  {
    bgColor = 'rgba(8, 14, 32, 0.88)',
    borderColor = '#38bdf8',
    textColor = '#ffffff',
    scaleX = 1.15,
    scaleY = 0.32,
  } = {}
) {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Lukis kapsul latar gelap separa lutsinar
    const pad = 8;
    const w = canvas.width - pad * 2;
    const h = canvas.height - pad * 2;
    const r = h / 2;

    ctx.beginPath();
    ctx.moveTo(pad + r, pad);
    ctx.lineTo(pad + w - r, pad);
    ctx.quadraticCurveTo(pad + w, pad, pad + w, pad + r);
    ctx.lineTo(pad + w, pad + h - r);
    ctx.quadraticCurveTo(pad + w, pad + h, pad + w - r, pad + h);
    ctx.lineTo(pad + r, pad + h);
    ctx.quadraticCurveTo(pad, pad + h, pad, pad + h - r);
    ctx.lineTo(pad, pad + r);
    ctx.quadraticCurveTo(pad, pad, pad + r, pad);
    ctx.closePath();

    ctx.fillStyle = bgColor;
    ctx.fill();

    ctx.lineWidth = 5;
    ctx.strokeStyle = borderColor;
    ctx.stroke();

    // Teks jelas di tengah
    ctx.font = '800 30px "Inter", system-ui, -apple-system, sans-serif';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 4;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(scaleX, scaleY, 1);
  sprite.renderOrder = 999;
  return { sprite, texture, material: spriteMat };
}

/**
 * FASA 2: Hasilkan tekstur gradien langit malam / senja Islamik
 */
function createSkyGradientTexture(skyTop, skyMid, skyBottom) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, skyTop);
    grad.addColorStop(0.52, skyMid);
    grad.addColorStop(1, skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 256);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

/**
 * FASA 2: Hasilkan Fake Bloom / Volumetric Halo Sprite
 * Menggunakan AdditiveBlending dan tekstur radial gradient
 */
function createGlowHaloSprite(colorHex, scale = 1.2, opacity = 0.85) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const col = new THREE.Color(colorHex);
    const r = Math.round(col.r * 255);
    const g = Math.round(col.g * 255);
    const b = Math.round(col.b * 255);

    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.18, `rgba(${r}, ${g}, ${b}, 0.88)`);
    grad.addColorStop(0.52, `rgba(${r}, ${g}, ${b}, 0.28)`);
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    color: 0xffffff,
    transparent: true,
    opacity: opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(scale, scale, 1);
  return { sprite, texture, material: spriteMat };
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
  bossNpcId = null,
  isBossUnlocked = true,
  isWilayahCompleted = false,
}) {
  const containerRef = useRef(null);
  const animFrameIdRef = useRef(null);

  // References Three.js
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const sunLightRef = useRef(null);
  const playerGroupRef = useRef(null);

  // FASA 2: Rujukan Status Zoom Sinematik Dialog NPC
  const isEncounterActiveRef = useRef(isEncounterActive);
  useEffect(() => {
    isEncounterActiveRef.current = isEncounterActive;
  }, [isEncounterActive]);

  // Kawalan Kamera Sinematik & Drag Orbit
  const cameraTargetLookRef = useRef(new THREE.Vector3(0, 0, 0));
  const orbitOffsetRef = useRef({ angleX: 0, angleY: 0, targetAngleX: 0, targetAngleY: 0 });
  const isPointerDownRef = useRef(false);
  const pointerStartPosRef = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);

  // Animasi Pergerakan Watak (Linear Interpolation & Parabolic Hop)
  const playerAnimStateRef = useRef({
    currentX: 0,
    currentZ: 0,
    targetX: 0,
    targetZ: 0,
    jumpProgress: 1,
  });

  const animatedMeshesRef = useRef([]); // NPC crystals, portals, water, player ring
  const clickableMeshesRef = useRef([]); // Meshes untuk Raycaster
  const firefliesMeshRef = useRef(null); // Zarah kelip-kelip
  const starsPointsRef = useRef(null); // FASA 2: 150 Bintang angkasa berkelip
  const footstepParticlesRef = useRef([]); // FASA 3: Zarah debu langkah kaki
  const prevPlayerPosRef = useRef({ r: playerPos.r, c: playerPos.c });

  // Tentukan tema bioma
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
  const isFPQS = biomeKey === 'FPQS';

  // Kira posisi dunia (X, Z) dari grid (r, c)
  const getTileWorldPos = useCallback((r, c) => {
    const cx = (GRID_COLS - 1) * 0.5;
    const cz = (GRID_ROWS - 1) * 0.5;
    return {
      x: (c - cx) * TILE_SIZE,
      z: (r - cz) * TILE_SIZE,
    };
  }, []);

  // Kemas kini kedudukan sasaran watak apabila playerPos berubah
  useEffect(() => {
    const prev = prevPlayerPosRef.current;
    const hasMoved = prev.r !== playerPos.r || prev.c !== playerPos.c;
    prevPlayerPosRef.current = { r: playerPos.r, c: playerPos.c };

    const target = getTileWorldPos(playerPos.r, playerPos.c);
    if (playerAnimStateRef.current) {
      // FASA 3: Jika watak berpindah petak, letuskan 5 sfera debu keemasan di tapak kaki lama
      if (hasMoved && sceneRef.current) {
        const spawnX = playerAnimStateRef.current.currentX;
        const spawnZ = playerAnimStateRef.current.currentZ;
        for (let i = 0; i < 5; i++) {
          const geo = new THREE.DodecahedronGeometry(0.045 + Math.random() * 0.025, 0);
          const mat = new THREE.MeshBasicMaterial({
            color: 0xfde68a,
            transparent: true,
            opacity: 0.85,
          });
          const dustMesh = new THREE.Mesh(geo, mat);
          const angle = Math.random() * Math.PI * 2;
          const dist = 0.05 + Math.random() * 0.12;
          dustMesh.position.set(
            spawnX + Math.cos(angle) * dist,
            0.12 + Math.random() * 0.05,
            spawnZ + Math.sin(angle) * dist
          );
          sceneRef.current.add(dustMesh);

          footstepParticlesRef.current.push({
            mesh: dustMesh,
            geo,
            mat,
            vx: Math.cos(angle) * 0.025 + (Math.random() - 0.5) * 0.015,
            vy: 0.035 + Math.random() * 0.03,
            vz: Math.sin(angle) * 0.025 + (Math.random() - 0.5) * 0.015,
            life: 0,
            maxLife: 0.48, // Hilang dalam ~0.5 saat
          });
        }
      }

      playerAnimStateRef.current.targetX = target.x;
      playerAnimStateRef.current.targetZ = target.z;
      playerAnimStateRef.current.jumpProgress = 0; // Cetuskan lompatan lembut
    }

    // Pusingan hadapanmesh badan watak (tanpa memusingkan sprite label)
    if (playerGroupRef.current && playerGroupRef.current.userData?.bodyPivot) {
      const pivot = playerGroupRef.current.userData.bodyPivot;
      if (facing === 'LEFT') pivot.rotation.y = -Math.PI * 0.5;
      else if (facing === 'RIGHT') pivot.rotation.y = Math.PI * 0.5;
      else if (facing === 'UP') pivot.rotation.y = Math.PI;
      else if (facing === 'DOWN') pivot.rotation.y = 0;
    }
  }, [playerPos, facing, getTileWorldPos]);

  // Bina Dunia 3D Three.js
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const width = container.clientWidth || 680;
    const height = Math.min(540, Math.max(390, width * 0.64));
    const disposableTextures = [];

    // 1. Scene & Kabus Atmosfera Sinematik (THREE.FogExp2)
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // FASA 2: Gradien Langit Malam / Senja Islamik yang Kaya
    const skyTexture = createSkyGradientTexture(
      palette.skyTop || '#020617',
      palette.skyMid || '#0b1d3a',
      palette.skyBottom || '#041624'
    );
    disposableTextures.push(skyTexture);
    scene.background = skyTexture;
    scene.fog = new THREE.FogExp2(palette.fogColor, 0.022);

    // 2. PerspectiveCamera (Sudut Sinematik Rapat & Dramatik)
    const aspect = width / height;
    const camera = new THREE.PerspectiveCamera(36, aspect, 0.1, 100);
    cameraRef.current = camera;

    const initialPos = getTileWorldPos(playerPos.r, playerPos.c);
    camera.position.set(initialPos.x, 7.8, initialPos.z + 8.2);
    camera.lookAt(initialPos.x, 0.5, initialPos.z);
    cameraTargetLookRef.current.set(initialPos.x, 0.5, initialPos.z);

    // 3. WebGLRenderer (Soft Shadow & High-DPI Tonemapping)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    container.appendChild(renderer.domElement);

    // 4. Pencahayaan Sinematik (Ambient, Directional with PCFSoftShadowMap, Fill)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.78);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(palette.lightColor, 1.45);
    sunLightRef.current = sunLight;
    sunLight.position.set(initialPos.x + 10, 16, initialPos.z + 8);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 42;
    sunLight.shadow.camera.left = -11;
    sunLight.shadow.camera.right = 11;
    sunLight.shadow.camera.top = 9;
    sunLight.shadow.camera.bottom = -9;
    sunLight.shadow.bias = -0.0004;
    sunLight.shadow.radius = 2.5;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.42);
    fillLight.position.set(-10, 8, -8);
    scene.add(fillLight);

    // FASA 2: 150 Bintang Halus Berkelip di Ruang Angkasa Mengelilingi Pulau
    const starCount = 150;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 18 + Math.random() * 18;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * (Math.PI * 0.44) + 0.06;

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.cos(phi) + 1.2;
      starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      const colorRoll = Math.random();
      if (colorRoll < 0.35) {
        // Emas hangat lembut (#fde68a)
        starColors[i * 3] = 0.99;
        starColors[i * 3 + 1] = 0.90;
        starColors[i * 3 + 2] = 0.54;
      } else if (colorRoll < 0.72) {
        // Putih mutiara berkilau (#ffffff)
        starColors[i * 3] = 1.0;
        starColors[i * 3 + 1] = 1.0;
        starColors[i * 3 + 2] = 1.0;
      } else {
        // Biru langit malam firus (#bae6fd)
        starColors[i * 3] = 0.73;
        starColors[i * 3 + 1] = 0.90;
        starColors[i * 3 + 2] = 0.99;
      }
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const starField = new THREE.Points(starGeo, starMat);
    starsPointsRef.current = { points: starField, material: starMat };
    scene.add(starField);

    // 5. FASA 1: Tapak Pulau Terapung Organik & Tebing Tirus ke Bawah (Monument Valley Style)
    animatedMeshesRef.current = [];
    clickableMeshesRef.current = [];

    const islandWidth = GRID_COLS * TILE_SIZE + 0.95;
    const islandDepth = GRID_ROWS * TILE_SIZE + 0.95;

    // A. Plat Atas Pulau (Top Layer Rim)
    const topPlinthGeo = new THREE.BoxGeometry(islandWidth, 0.45, islandDepth);
    const topPlinthMat = new THREE.MeshStandardMaterial({
      color: palette.cliff,
      roughness: 0.88,
      metalness: 0.08,
      flatShading: true,
    });
    const topPlinth = new THREE.Mesh(topPlinthGeo, topPlinthMat);
    topPlinth.position.set(0, -0.22, 0);
    topPlinth.receiveShadow = true;
    scene.add(topPlinth);

    // B. Rim Emas / Cahaya Tepi Atas Pulau
    const rimGeo = new THREE.BoxGeometry(islandWidth + 0.08, 0.08, islandDepth + 0.08);
    const rimMat = new THREE.MeshStandardMaterial({
      color: palette.accentGlow,
      emissive: palette.accentGlow,
      emissiveIntensity: 0.5,
      roughness: 0.4,
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.set(0, -0.04, 0);
    scene.add(rimMesh);

    // C. Tebing Batu Tirus Ke Bawah (Inverted Bedrock Cone - Menghapuskan Ruang Kosong Bawah)
    const bedrockGroup = new THREE.Group();

    // Kon Batuan Tirus Utama (Main Inverted Rocky Keel)
    const keelGeo = new THREE.CylinderGeometry(
      islandWidth * 0.46, // Atas
      0.8,                // Bawah (tirus runcing)
      4.2,                // Ketinggian dalam ke bawah
      8,                  // 8 faset bergeometri low-poly
      2
    );
    // Tambah sedikit herotan organik pada bucu bawah
    const keelPos = keelGeo.attributes.position;
    for (let i = 0; i < keelPos.count; i++) {
      const vy = keelPos.getY(i);
      if (vy < 0) {
        const distortX = Math.sin(i * 3.7) * 0.28;
        const distortZ = Math.cos(i * 4.3) * 0.28;
        keelPos.setX(i, keelPos.getX(i) + distortX);
        keelPos.setZ(i, keelPos.getZ(i) + distortZ);
      }
    }
    keelGeo.computeVertexNormals();

    const bedrockMat = new THREE.MeshStandardMaterial({
      color: palette.cliff,
      roughness: 0.94,
      metalness: 0.05,
      flatShading: true,
    });
    const keelMesh = new THREE.Mesh(keelGeo, bedrockMat);
    keelMesh.position.set(0, -2.45, 0);
    keelMesh.receiveShadow = true;
    bedrockGroup.add(keelMesh);

    // Pancang Batuan Gantung Tambahan (Underhanging Stalactite Spires)
    const underSpikes = [
      { x: -3.2, z: -1.4, h: 2.6, r: 0.95, rot: 0.4 },
      { x: 2.8, z: 1.6, h: 3.0, r: 1.1, rot: -0.5 },
      { x: -1.8, z: 2.2, h: 2.2, r: 0.8, rot: 0.3 },
      { x: 2.0, z: -2.0, h: 2.5, r: 0.85, rot: -0.2 },
      { x: 0.1, z: 0.2, h: 4.6, r: 0.75, rot: 0.1 },
    ];
    underSpikes.forEach((sp) => {
      const spGeo = new THREE.ConeGeometry(sp.r, sp.h, 6);
      const spMesh = new THREE.Mesh(spGeo, bedrockMat);
      spMesh.position.set(sp.x, -1.8 - sp.h * 0.45, sp.z);
      spMesh.rotation.x = Math.PI + sp.rot * 0.25;
      spMesh.rotation.y = sp.rot * 2.5;
      spMesh.castShadow = true;
      spMesh.receiveShadow = true;
      bedrockGroup.add(spMesh);
    });

    scene.add(bedrockGroup);

    // D. Serpihan Batu Apung di Angkasa Sekitar Bawah Pulau (Floating Debris)
    const debrisList = [
      { x: -4.8, y: -3.8, z: 2.2, size: 0.35, speed: 0.45 },
      { x: 4.4, y: -4.2, z: -2.4, size: 0.28, speed: 0.65 },
      { x: 1.2, y: -4.8, z: 3.2, size: 0.4, speed: 0.5 },
      { x: -2.6, y: -4.5, z: -3.2, size: 0.3, speed: 0.55 },
    ];
    debrisList.forEach((deb) => {
      const dGeo = new THREE.DodecahedronGeometry(deb.size, 0);
      const dMesh = new THREE.Mesh(dGeo, bedrockMat);
      dMesh.position.set(deb.x, deb.y, deb.z);
      dMesh.castShadow = true;
      scene.add(dMesh);
      animatedMeshesRef.current.push({
        mesh: dMesh,
        baseY: deb.y,
        speed: deb.speed,
        type: 'FLOATING_DEBRIS',
      });
    });

    // 6. Prosedural Low-Poly Meshes untuk Setiap Petak
    // FASA 1: Cari rangkaian laluan batu berpasir dari (1,1) ke semua NPC, Oasis & Portal
    const pathTiles = findPathTiles(mapGrid, 1, 1);

    // FASA 1: Material Tanah Organik (Bukan Corak Dam Catur)
    const groundMat = new THREE.MeshStandardMaterial({
      color: palette.ground,
      roughness: 0.78,
      flatShading: true,
    });
    // FASA 1: Laluan Batu Berpasir Krem / Emas Lembut
    const pathBaseMat = new THREE.MeshStandardMaterial({
      color: 0xe5d5be, // Krem pasir hangat
      roughness: 0.65,
      metalness: 0.05,
      flatShading: true,
    });
    const stonePaverMat = new THREE.MeshStandardMaterial({
      color: 0xd8c3a5, // Batu papak krem berpasir
      roughness: 0.7,
      metalness: 0.08,
      flatShading: true,
    });
    const waterMat = new THREE.MeshStandardMaterial({
      color: palette.water,
      roughness: 0.1,
      metalness: 0.25,
      transparent: true,
      opacity: 0.92,
    });
    const rockMat = new THREE.MeshStandardMaterial({
      color: palette.rock,
      roughness: 0.9,
      flatShading: true,
    });
    const floraMat = new THREE.MeshStandardMaterial({
      color: palette.flora,
      roughness: 0.65,
      flatShading: true,
    });
    const palmLeafMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x064e3b,
      emissiveIntensity: 0.2,
      roughness: 0.55,
      flatShading: true,
    });
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x5c3317,
      roughness: 0.9,
      flatShading: true,
    });
    const whiteMarbleMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.38,
      metalness: 0.08,
      flatShading: true,
    });
    const creamWallMat = new THREE.MeshStandardMaterial({
      color: 0xfefce8,
      emissive: 0xfef08a,
      emissiveIntensity: 0.1,
      roughness: 0.42,
      flatShading: true,
    });
    const darkDoorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.55,
      roughness: 0.25,
      metalness: 0.68,
      flatShading: true,
    });
    const portalMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x9333ea,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.3,
    });

    // FASA 1 & 2 (FPQS): Material Jubin Moden & Makmal Kampus FPQS (USIM)
    const fpqsTileMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Jubin moden kelabu/putih pejalan kaki (#e2e8f0)
      roughness: 0.38,
      metalness: 0.06,
      flatShading: true,
    });
    const fpqsTileBorderMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Garisan sempadan jubin slate
      roughness: 0.5,
      flatShading: true,
    });
    const fpqsAccentGreenMat = new THREE.MeshStandardMaterial({
      color: 0x16a34a, // Hijau USIM
      roughness: 0.4,
      flatShading: true,
    });
    const fpqsNavyMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a, // Biru USIM
      roughness: 0.35,
      flatShading: true,
    });
    const fpqsNeonCyanMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 2.2,
      roughness: 0.2,
      flatShading: true,
    });
    const fpqsNeonGreenMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x16a34a,
      emissiveIntensity: 2.5,
      roughness: 0.2,
      flatShading: true,
    });
    const fpqsServerMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Server rack hitam / slate
      roughness: 0.25,
      metalness: 0.85,
      flatShading: true,
    });

    const tileBoxGeo = new THREE.BoxGeometry(TILE_SIZE - 0.03, 0.28, TILE_SIZE - 0.03);

    // FASA 3: Pembantu bina pokok kurma low-poly berbatang melengkung & berpelepah kurma
    const buildMiniPalmTree = (scale = 1, tiltZ = 0.15) => {
      const palm = new THREE.Group();

      // Batang melengkung bersegmen
      const trunk1Geo = new THREE.CylinderGeometry(0.04 * scale, 0.065 * scale, 0.28 * scale, 5);
      const trunk1 = new THREE.Mesh(trunk1Geo, trunkMat);
      trunk1.position.set(0, 0.14 * scale, 0);
      trunk1.rotation.z = tiltZ * 0.7;
      trunk1.castShadow = true;
      trunk1.receiveShadow = true;
      palm.add(trunk1);

      const midX = -Math.sin(tiltZ * 0.7) * 0.25 * scale;
      const midY = 0.26 * scale;

      const trunk2Geo = new THREE.CylinderGeometry(0.03 * scale, 0.042 * scale, 0.26 * scale, 5);
      const trunk2 = new THREE.Mesh(trunk2Geo, trunkMat);
      trunk2.position.set(midX, midY + 0.12 * scale, 0);
      trunk2.rotation.z = tiltZ * 1.35;
      trunk2.castShadow = true;
      trunk2.receiveShadow = true;
      palm.add(trunk2);

      const topX = midX - Math.sin(tiltZ * 1.35) * 0.24 * scale;
      const topY = midY + 0.24 * scale;

      // Gugusan 6 pelepah kurma organik
      for (let f = 0; f < 6; f++) {
        const angle = (f / 6) * Math.PI * 2;
        const frondGeo = new THREE.ConeGeometry(0.085 * scale, 0.30 * scale, 4);
        const frond = new THREE.Mesh(frondGeo, palmLeafMat);
        frond.position.set(
          topX + Math.cos(angle) * 0.11 * scale,
          topY,
          Math.sin(angle) * 0.11 * scale
        );
        frond.rotation.z = -Math.cos(angle) * 1.15;
        frond.rotation.x = Math.sin(angle) * 1.15;
        frond.castShadow = true;
        frond.receiveShadow = true;
        palm.add(frond);
      }
      return palm;
    };

    // FASA 3: Pembantu bina pohon zaitun / pokok taman Islamik low-poly
    const buildMiniOliveTree = (scale = 1) => {
      const olive = new THREE.Group();

      const trunkGeo = new THREE.CylinderGeometry(0.05 * scale, 0.08 * scale, 0.40 * scale, 5);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(0, 0.20 * scale, 0);
      trunk.rotation.z = 0.08;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      olive.add(trunk);

      // 3 Gugusan dedaunan awan zaitun
      const foliageOffsets = [
        { ox: 0, oy: 0.44 * scale, oz: 0, r: 0.24 * scale },
        { ox: -0.12 * scale, oy: 0.38 * scale, oz: 0.08 * scale, r: 0.19 * scale },
        { ox: 0.11 * scale, oy: 0.39 * scale, oz: -0.07 * scale, r: 0.18 * scale },
      ];

      foliageOffsets.forEach((fo) => {
        const folGeo = new THREE.IcosahedronGeometry(fo.r, 0);
        const folMesh = new THREE.Mesh(folGeo, floraMat);
        folMesh.position.set(fo.ox, fo.oy, fo.oz);
        folMesh.castShadow = true;
        folMesh.receiveShadow = true;
        olive.add(folMesh);
      });

      return olive;
    };

    // FASA 1 (FPQS): Pembantu bina pokok renek taman kampus USIM (Neat Topiary & Flowers)
    const buildCampusShrub = (scale = 1) => {
      const shrub = new THREE.Group();

      // Pasu jubin marmar / planter box moden
      const potGeo = new THREE.BoxGeometry(0.36 * scale, 0.16 * scale, 0.36 * scale);
      const potMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
      const pot = new THREE.Mesh(potGeo, potMat);
      pot.position.set(0, 0.08 * scale, 0);
      pot.castShadow = true;
      pot.receiveShadow = true;
      shrub.add(pot);

      // Rimbunan bulat daun hijau USIM
      const bushGeo = new THREE.IcosahedronGeometry(0.24 * scale, 1);
      const bushMat = new THREE.MeshStandardMaterial({
        color: 0x16a34a,
        emissive: 0x14532d,
        emissiveIntensity: 0.15,
        roughness: 0.6,
        flatShading: true,
      });
      const bush = new THREE.Mesh(bushGeo, bushMat);
      bush.position.set(0, 0.28 * scale, 0);
      bush.castShadow = true;
      bush.receiveShadow = true;
      shrub.add(bush);

      // Bunga-bunga kecil kuning keemasan & merah jambu
      [-0.1, 0.12].forEach((bx, idx) => {
        const flowerGeo = new THREE.SphereGeometry(0.04 * scale, 4, 4);
        const flowerMat = new THREE.MeshStandardMaterial({
          color: idx === 0 ? 0xfbbf24 : 0xf43f5e,
          emissive: idx === 0 ? 0xd97706 : 0xe11d48,
          emissiveIntensity: 0.8,
        });
        const flower = new THREE.Mesh(flowerGeo, flowerMat);
        flower.position.set(bx * scale, (0.34 + idx * 0.06) * scale, 0.16 * scale);
        shrub.add(flower);
      });

      return shrub;
    };

    // FASA 2 (FPQS): Pembantu bina patung watak pensyarah / pelajar USIM (Figurine Low-Poly)
    const buildLecturerFigurine = (options = {}) => {
      const {
        gender = 'MALE',
        suitColor = 0x1e293b,
        innerColor = 0xffffff,
        headwear = 'SONGKOK', // 'SONGKOK' | 'HIJAB' | 'NONE'
        headwearColor = 0x0f172a,
        scale = 0.80,
        hasBook = false,
        hasLanyard = false,
      } = options;

      const fig = new THREE.Group();

      // Badan / Blazer / Jubah
      const bodyMat = new THREE.MeshStandardMaterial({
        color: suitColor,
        roughness: 0.45,
        flatShading: true,
      });
      const bodyGeo = new THREE.CylinderGeometry(0.11 * scale, 0.17 * scale, 0.44 * scale, 8);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(0, 0.22 * scale, 0);
      body.castShadow = true;
      body.receiveShadow = true;
      fig.add(body);

      // Kemeja Putih / Bahagian Depan
      const innerMat = new THREE.MeshStandardMaterial({
        color: innerColor,
        roughness: 0.35,
        flatShading: true,
      });
      const innerGeo = new THREE.BoxGeometry(0.08 * scale, 0.32 * scale, 0.04 * scale);
      const inner = new THREE.Mesh(innerGeo, innerMat);
      inner.position.set(0, 0.25 * scale, 0.13 * scale);
      fig.add(inner);

      // Lanyard Hijau USIM
      if (hasLanyard) {
        const lanyardMat = new THREE.MeshStandardMaterial({
          color: 0x16a34a,
          emissive: 0x15803d,
          emissiveIntensity: 0.6,
          roughness: 0.3,
        });
        const lanyGeo = new THREE.TorusGeometry(0.10 * scale, 0.014 * scale, 6, 12);
        const lany = new THREE.Mesh(lanyGeo, lanyardMat);
        lany.position.set(0, 0.33 * scale, 0.08 * scale);
        lany.rotation.x = Math.PI * 0.45;
        fig.add(lany);
      }

      // Lengan Kiri & Kanan
      const armMat = bodyMat;
      const leftArmGeo = new THREE.CylinderGeometry(0.035 * scale, 0.038 * scale, 0.30 * scale, 6);
      const leftArm = new THREE.Mesh(leftArmGeo, armMat);
      leftArm.position.set(-0.15 * scale, 0.22 * scale, 0);
      leftArm.rotation.z = 0.15;
      leftArm.castShadow = true;
      fig.add(leftArm);

      const rightArmGeo = new THREE.CylinderGeometry(0.035 * scale, 0.038 * scale, 0.30 * scale, 6);
      const rightArm = new THREE.Mesh(rightArmGeo, armMat);
      rightArm.position.set(0.15 * scale, 0.22 * scale, 0);
      rightArm.rotation.z = -0.15;
      rightArm.castShadow = true;
      fig.add(rightArm);

      // Kepala Bulat Warna Kulit
      const skinMat = new THREE.MeshStandardMaterial({
        color: 0xf1c27d,
        roughness: 0.5,
        flatShading: true,
      });
      const headGeo = new THREE.SphereGeometry(0.11 * scale, 10, 10);
      const head = new THREE.Mesh(headGeo, skinMat);
      head.position.set(0, 0.49 * scale, 0);
      head.castShadow = true;
      fig.add(head);

      // Penutup Kepala: Songkok / Hijab / Rambut
      if (headwear === 'SONGKOK') {
        const songkokMat = new THREE.MeshStandardMaterial({
          color: headwearColor,
          roughness: 0.9,
          flatShading: true,
        });
        const songkokGeo = new THREE.CylinderGeometry(0.098 * scale, 0.102 * scale, 0.085 * scale, 10);
        const songkok = new THREE.Mesh(songkokGeo, songkokMat);
        songkok.position.set(0, 0.57 * scale, 0);
        songkok.rotation.x = -0.04;
        songkok.castShadow = true;
        fig.add(songkok);
      } else if (headwear === 'HIJAB') {
        // Tudung Labuh Anggun & Kemas
        const hijabMat = new THREE.MeshStandardMaterial({
          color: headwearColor,
          roughness: 0.45,
          flatShading: true,
        });
        // Balutan Kepala Tudung
        const hijabHeadGeo = new THREE.SphereGeometry(0.13 * scale, 12, 10);
        const hijabHead = new THREE.Mesh(hijabHeadGeo, hijabMat);
        hijabHead.position.set(0, 0.50 * scale, -0.01 * scale);
        hijabHead.castShadow = true;
        fig.add(hijabHead);

        // Labuh Tudung Menutupi Dada & Bahu
        const drapeGeo = new THREE.ConeGeometry(0.22 * scale, 0.26 * scale, 10);
        const drape = new THREE.Mesh(drapeGeo, hijabMat);
        drape.position.set(0, 0.36 * scale, 0.02 * scale);
        drape.castShadow = true;
        fig.add(drape);
      } else {
        const hairMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.8 });
        const hairGeo = new THREE.SphereGeometry(0.12 * scale, 8, 8);
        const hair = new THREE.Mesh(hairGeo, hairMat);
        hair.position.set(0, 0.51 * scale, -0.015 * scale);
        fig.add(hair);
      }

      // Aksesori Kitab / Nota di Tangan
      if (hasBook) {
        const bookMat = new THREE.MeshStandardMaterial({
          color: 0x0284c7,
          roughness: 0.3,
          emissive: 0x0369a1,
          emissiveIntensity: 0.3,
        });
        const bookGeo = new THREE.BoxGeometry(0.08 * scale, 0.12 * scale, 0.035 * scale);
        const book = new THREE.Mesh(bookGeo, bookMat);
        book.position.set(0.14 * scale, 0.22 * scale, 0.11 * scale);
        book.rotation.y = 0.35;
        fig.add(book);
      }

      return fig;
    };

    mapGrid.forEach((row, rIdx) => {
      row.forEach((tile, cIdx) => {
        const { x, z } = getTileWorldPos(rIdx, cIdx);

        // A. FASA 1: Jubin Muka Bumi Bebas Corak Dam (Organik + Laluan Batu Berpasir)
        const isPath = pathTiles.has(`${rIdx},${cIdx}`) && tile.type === 'FLOOR';

        // Variasi mikro ketinggian (0.02 - 0.12) untuk tanah biasa supaya tidak rata seperti meja
        const elevationNoise =
          Math.sin(rIdx * 1.15 + cIdx * 0.95 + mapSeed) * 0.045 +
          Math.cos(rIdx * 1.35 - cIdx * 1.15 + mapSeed * 2) * 0.035;

        let groundY = 0.05;
        let mat = groundMat;

        if (tile.type === 'WATER' || tile.type === 'OASIS') {
          groundY = -0.08;
          mat = waterMat;
        } else if (tile.type === 'WALL') {
          groundY = 0.18;
          mat = rockMat;
        } else if (isPath) {
          groundY = 0.05; // Laluan batu dibuat rata untuk laluan berjalan
          mat = isFPQS ? fpqsTileMat : pathBaseMat;
        } else {
          // Petak tanah biasa dengan variasi mikro semula jadi
          groundY = 0.05 + Math.max(0, elevationNoise);
        }

        const tileMesh = new THREE.Mesh(tileBoxGeo, mat);
        tileMesh.position.set(x, groundY, z);
        tileMesh.receiveShadow = true;
        tileMesh.castShadow = tile.type === 'WALL';

        tileMesh.userData = { r: rIdx, c: cIdx, type: tile.type, tileData: tile };
        clickableMeshesRef.current.push(tileMesh);
        scene.add(tileMesh);

        // FASA 1: Jika petak ini adalah Laluan Berjalan
        if (isPath) {
          if (isFPQS) {
            // FASA 1: Jubin Moden Kelabu/Putih (#e2e8f0) Pejalan Kaki & Foyer FPQS (USIM)
            const tileGroup = new THREE.Group();
            const modernTileOffsets = [
              { ox: -0.23, oz: -0.23 },
              { ox: 0.23, oz: -0.23 },
              { ox: -0.23, oz: 0.23 },
              { ox: 0.23, oz: 0.23 },
            ];
            const modTileGeo = new THREE.BoxGeometry(0.42, 0.024, 0.42);
            modernTileOffsets.forEach((pos) => {
              const paver = new THREE.Mesh(modTileGeo, fpqsTileMat);
              paver.position.set(pos.ox, 0.14, pos.oz);
              paver.receiveShadow = true;
              tileGroup.add(paver);
            });
            // Jalur sempadan kemas slate
            const borderGeo = new THREE.BoxGeometry(0.94, 0.016, 0.035);
            const border1 = new THREE.Mesh(borderGeo, fpqsTileBorderMat);
            border1.position.set(0, 0.142, 0.46);
            const border2 = new THREE.Mesh(borderGeo, fpqsTileBorderMat);
            border2.position.set(0, 0.142, -0.46);
            tileGroup.add(border1, border2);

            tileGroup.position.set(x, groundY, z);
            scene.add(tileGroup);
          } else {
            const paverGroup = new THREE.Group();
            const paverOffsets = [
              { ox: -0.22, oz: -0.18, r: 0.16, rot: 0.2 },
              { ox: 0.20, oz: -0.15, r: 0.14, rot: -0.3 },
              { ox: -0.12, oz: 0.22, r: 0.15, rot: 0.4 },
              { ox: 0.22, oz: 0.20, r: 0.14, rot: -0.15 },
            ];
            paverOffsets.forEach((po) => {
              const paverGeo = new THREE.CylinderGeometry(po.r, po.r * 1.08, 0.03, 6);
              const paverMesh = new THREE.Mesh(paverGeo, stonePaverMat);
              paverMesh.position.set(po.ox, 0.14, po.oz);
              paverMesh.rotation.y = po.rot;
              paverMesh.receiveShadow = true;
              paverGroup.add(paverMesh);
            });
            paverGroup.position.set(x, groundY, z);
            scene.add(paverGroup);
          }
        }

        // FASA 1: Jika petak Air (WATER) — Gerakkan ombak Y & cincin riak air putih
        if (tile.type === 'WATER') {
          animatedMeshesRef.current.push({
            mesh: tileMesh,
            baseY: -0.08,
            freq: 2.0,
            phase: rIdx * 0.7 + cIdx * 0.9,
            type: 'WATER_WAVE',
          });

          // Cincin Riak Air Putih
          const rippleGeo = new THREE.RingGeometry(0.12, 0.18, 16);
          const rippleMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.65,
            side: THREE.DoubleSide,
          });
          const rippleMesh = new THREE.Mesh(rippleGeo, rippleMat);
          rippleMesh.rotation.x = -Math.PI * 0.5;
          rippleMesh.position.set(x, 0.065, z);
          scene.add(rippleMesh);

          animatedMeshesRef.current.push({
            mesh: rippleMesh,
            baseScale: 0.5,
            maxScale: 2.1,
            speed: 0.9,
            phase: ((rIdx * 3 + cIdx * 5) % 10) * 0.1,
            type: 'WATER_RIPPLE',
          });
        }

        // B. Objek Geometri Low-Poly Mengikut Jenis Petak
        // 1. GUNUNG / HALANGAN BATU
        if (tile.type === 'WALL') {
          const rockGroup = new THREE.Group();
          const mainRockGeo = new THREE.DodecahedronGeometry(0.52, 0);
          const mainRock = new THREE.Mesh(mainRockGeo, rockMat);
          mainRock.scale.set(0.9, 1.3, 0.9);
          mainRock.rotation.set(0.2, (rIdx + cIdx) * 0.8, 0.1);
          mainRock.position.set(0, 0.55, 0);
          mainRock.castShadow = true;
          mainRock.receiveShadow = true;
          rockGroup.add(mainRock);

          const subRockGeo = new THREE.ConeGeometry(0.32, 0.65, 5);
          const subRock = new THREE.Mesh(subRockGeo, rockMat);
          subRock.position.set(0.22, 0.45, -0.15);
          subRock.rotation.y = cIdx * 1.2;
          subRock.castShadow = true;
          subRock.receiveShadow = true;
          rockGroup.add(subRock);

          rockGroup.position.set(x, 0.1, z);
          rockGroup.userData = { r: rIdx, c: cIdx, type: tile.type };
          clickableMeshesRef.current.push(mainRock, subRock);
          scene.add(rockGroup);
        }

        // 2. KOLAM OASIS HIKMAH / KAFE DIDI FPQS (Pulih Reputasi / Tenaga)
        else if (tile.type === 'OASIS') {
          if (isFPQS) {
            // FASA 1: Kafe Didi (Meja Bulat Kecil, Payung Kafe, Cawan Kopi & Wap Panas)
            const cafeGroup = new THREE.Group();

            // A. Tapak Patio Jubin Moden Putih/Kelabu
            const patioGeo = new THREE.CylinderGeometry(0.54, 0.58, 0.12, 12);
            const patioMat = new THREE.MeshStandardMaterial({
              color: 0xf1f5f9,
              roughness: 0.38,
              flatShading: true,
            });
            const patio = new THREE.Mesh(patioGeo, patioMat);
            patio.position.set(0, 0.05, 0);
            patio.receiveShadow = true;
            patio.castShadow = true;
            cafeGroup.add(patio);

            // Rim aksen hijau USIM
            const rimGeo = new THREE.TorusGeometry(0.55, 0.024, 6, 24);
            const rimMesh = new THREE.Mesh(rimGeo, fpqsAccentGreenMat);
            rimMesh.rotation.x = Math.PI * 0.5;
            rimMesh.position.set(0, 0.11, 0);
            cafeGroup.add(rimMesh);

            // B. Meja Bulat Kecil Kafe & Tiang Chrome
            const chromeMat = new THREE.MeshStandardMaterial({
              color: 0x94a3b8,
              metalness: 0.85,
              roughness: 0.2,
            });
            const tablePoleGeo = new THREE.CylinderGeometry(0.02, 0.024, 0.32, 8);
            const tablePole = new THREE.Mesh(tablePoleGeo, chromeMat);
            tablePole.position.set(0, 0.25, 0);
            cafeGroup.add(tablePole);

            const tableTopGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.025, 16);
            const tableTopMat = new THREE.MeshStandardMaterial({
              color: 0xffffff,
              roughness: 0.25,
            });
            const tableTop = new THREE.Mesh(tableTopGeo, tableTopMat);
            tableTop.position.set(0, 0.41, 0);
            tableTop.castShadow = true;
            tableTop.receiveShadow = true;
            cafeGroup.add(tableTop);

            // C. 2 Kerusi Stul Santai Kafe
            [-0.32, 0.32].forEach((sx) => {
              const stoolPoleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.18, 6);
              const stoolPole = new THREE.Mesh(stoolPoleGeo, chromeMat);
              stoolPole.position.set(sx, 0.18, 0);
              cafeGroup.add(stoolPole);

              const stoolSeatGeo = new THREE.CylinderGeometry(0.10, 0.10, 0.03, 10);
              const stoolSeatMat = new THREE.MeshStandardMaterial({
                color: 0x15803d, // Kusyen hijau USIM
                roughness: 0.5,
              });
              const stoolSeat = new THREE.Mesh(stoolSeatGeo, stoolSeatMat);
              stoolSeat.position.set(sx, 0.27, 0);
              stoolSeat.castShadow = true;
              cafeGroup.add(stoolSeat);
            });

            // D. Payung Kafe (Cafe Umbrella / Parasol)
            const umbrellaPoleGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.65, 8);
            const umbrellaPole = new THREE.Mesh(umbrellaPoleGeo, chromeMat);
            umbrellaPole.position.set(0, 0.58, 0);
            cafeGroup.add(umbrellaPole);

            const umbrellaCanopyGeo = new THREE.ConeGeometry(0.48, 0.22, 10);
            const umbrellaCanopyMat = new THREE.MeshStandardMaterial({
              color: 0x16a34a,
              emissive: 0x14532d,
              emissiveIntensity: 0.25,
              roughness: 0.4,
              flatShading: true,
            });
            const umbrellaCanopy = new THREE.Mesh(umbrellaCanopyGeo, umbrellaCanopyMat);
            umbrellaCanopy.position.set(0, 0.94, 0);
            umbrellaCanopy.castShadow = true;
            cafeGroup.add(umbrellaCanopy);

            // E. Cawan Kopi Panas di Atas Meja
            const cupMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
            const coffeeMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.1 });

            const cupGeo = new THREE.CylinderGeometry(0.032, 0.024, 0.045, 8);
            const cup1 = new THREE.Mesh(cupGeo, cupMat);
            cup1.position.set(-0.08, 0.445, 0.04);
            cafeGroup.add(cup1);

            const coffeeGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.01, 8);
            const coffee1 = new THREE.Mesh(coffeeGeo, coffeeMat);
            coffee1.position.set(-0.08, 0.465, 0.04);
            cafeGroup.add(coffee1);

            // F. Partikel Wap Panas Cawan Kopi (Coffee Steam Particles)
            for (let s = 0; s < 5; s++) {
              const steamPuffGeo = new THREE.SphereGeometry(0.018 + s * 0.003, 6, 6);
              const steamMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.60 - s * 0.08,
              });
              const puff = new THREE.Mesh(steamPuffGeo, steamMat);
              puff.position.set(
                -0.08 + (Math.random() - 0.5) * 0.025,
                0.49 + s * 0.05,
                0.04 + (Math.random() - 0.5) * 0.025
              );
              cafeGroup.add(puff);
              animatedMeshesRef.current.push({
                mesh: puff,
                baseX: -0.08,
                baseY: 0.48,
                offsetY: s * 0.05,
                speed: 1.1 + s * 0.2,
                type: 'COFFEE_STEAM',
              });
            }

            // G. Cahaya Hangat Kafe
            const cafeLight = new THREE.PointLight(0xfef08a, 1.4, 3.2, 2);
            cafeLight.position.set(0, 0.68, 0);
            cafeGroup.add(cafeLight);

            // Label Terapung Kafe Didi
            const { sprite: cafeLabel, texture: cafeTex } = createFloatingLabelSprite(
              '☕ Kafe Didi (Pulih Reputasi)',
              {
                bgColor: 'rgba(21, 128, 61, 0.92)',
                borderColor: '#4ade80',
                textColor: '#f0fdf4',
                scaleX: 1.55,
                scaleY: 0.35,
              }
            );
            disposableTextures.push(cafeTex);
            cafeLabel.position.set(0, 1.25, 0);
            cafeGroup.add(cafeLabel);

            cafeGroup.position.set(x, 0, z);
            cafeGroup.userData = { r: rIdx, c: cIdx, type: tile.type };
            clickableMeshesRef.current.push(patio, tableTop, umbrellaCanopy);
            scene.add(cafeGroup);
          } else {
            const oasisGroup = new THREE.Group();

            // Tebing Batu Kolam
            const basinGeo = new THREE.CylinderGeometry(0.5, 0.54, 0.12, 8);
            const basinMat = new THREE.MeshStandardMaterial({
              color: 0xd6d3d1,
              roughness: 0.75,
              flatShading: true,
            });
            const basin = new THREE.Mesh(basinGeo, basinMat);
            basin.position.set(0, 0.04, 0);
            basin.castShadow = true;
            basin.receiveShadow = true;
            oasisGroup.add(basin);

            // Permukaan Air Biru Firus Berkilat
            const oasisWaterGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.14, 8);
            const oasisWater = new THREE.Mesh(oasisWaterGeo, waterMat);
            oasisWater.position.set(0, 0.07, 0);
            oasisWater.receiveShadow = true;
            oasisGroup.add(oasisWater);

            // FASA 1: Riak Air Putih pada Kolam Oasis
            const oasisRippleGeo = new THREE.RingGeometry(0.14, 0.20, 20);
            const oasisRippleMat = new THREE.MeshBasicMaterial({
              color: 0xffffff,
              transparent: true,
              opacity: 0.75,
              side: THREE.DoubleSide,
            });
            const oasisRipple = new THREE.Mesh(oasisRippleGeo, oasisRippleMat);
            oasisRipple.rotation.x = -Math.PI * 0.5;
            oasisRipple.position.set(0, 0.142, 0);
            oasisGroup.add(oasisRipple);

            animatedMeshesRef.current.push({
              mesh: oasisWater,
              baseY: 0.07,
              freq: 2.4,
              phase: 0.6,
              type: 'WATER_WAVE',
            });
            animatedMeshesRef.current.push({
              mesh: oasisRipple,
              baseScale: 0.5,
              maxScale: 1.85,
              speed: 1.15,
              phase: 0.2,
              type: 'WATER_RIPPLE',
            });

            // Kristal Air Terapung di Tengah Kolam
            const dropGeo = new THREE.OctahedronGeometry(0.14, 0);
            const dropMat = new THREE.MeshStandardMaterial({
              color: 0x38bdf8,
              emissive: 0x0284c7,
              emissiveIntensity: 1.0,
              roughness: 0.1,
            });
            const dropMesh = new THREE.Mesh(dropGeo, dropMat);
            dropMesh.position.set(0, 0.36, 0);
            dropMesh.castShadow = true;
            oasisGroup.add(dropMesh);

            // FASA 2: Fake Bloom / Volumetric Halo pada Kristal Air Oasis
            const { sprite: oasisHalo, texture: oasisHaloTex } = createGlowHaloSprite(0x38bdf8, 1.1, 0.88);
            disposableTextures.push(oasisHaloTex);
            oasisHalo.position.set(0, 0.36, 0);
            oasisGroup.add(oasisHalo);

            animatedMeshesRef.current.push({
              mesh: oasisHalo,
              baseScale: 1.1,
              speed: 2.2,
              type: 'HALO_PULSE',
            });

            // Pokok Kurma Low-Poly #1 & #2 di Tepi Kolam Oasis (Bergoyang Ditiup Angin)
            const palm1 = buildMiniPalmTree(1.0, 0.18);
            palm1.position.set(-0.34, 0.05, -0.24);
            oasisGroup.add(palm1);

            const palm2 = buildMiniPalmTree(0.78, -0.16);
            palm2.position.set(0.35, 0.05, -0.20);
            oasisGroup.add(palm2);

            animatedMeshesRef.current.push({
              mesh: palm1,
              baseRotZ: palm1.rotation.z || 0,
              baseRotX: palm1.rotation.x || 0,
              phase: 0.5,
              speed: 1.4,
              type: 'WIND_SWAY',
            });
            animatedMeshesRef.current.push({
              mesh: palm2,
              baseRotZ: palm2.rotation.z || 0,
              baseRotX: palm2.rotation.x || 0,
              phase: 1.8,
              speed: 1.55,
              type: 'WIND_SWAY',
            });

            const oasisLight = new THREE.PointLight(0x38bdf8, 1.6, 3.4, 2);
            oasisLight.position.set(0, 0.55, 0);
            oasisGroup.add(oasisLight);

            animatedMeshesRef.current.push({
              mesh: dropMesh,
              baseY: 0.36,
              speed: 2.2,
              type: 'BOB_AND_SPIN',
            });

            oasisGroup.position.set(x, 0, z);
            oasisGroup.userData = { r: rIdx, c: cIdx, type: tile.type };
            clickableMeshesRef.current.push(basin, dropMesh);
            scene.add(oasisGroup);
          }
        }

        // 3. FASA 3: POKOK KURMA, POHON ZAITUN & POKOK RENEK KAMPUS FPQS
        else if (tile.decor) {
          const treeGroup = isFPQS
            ? buildCampusShrub(0.95)
            : (rIdx * 3 + cIdx * 7) % 2 === 0
            ? buildMiniPalmTree(0.92, ((rIdx % 2 === 0) ? 0.16 : -0.16))
            : buildMiniOliveTree(0.95);

          treeGroup.position.set(x, 0, z);
          treeGroup.rotation.y = (rIdx * 1.7 + cIdx * 2.3);
          scene.add(treeGroup);

          animatedMeshesRef.current.push({
            mesh: treeGroup,
            baseRotZ: treeGroup.rotation.z || 0,
            baseRotX: treeGroup.rotation.x || 0,
            phase: (x * 1.5 + z * 2.1),
            speed: 1.45,
            type: 'WIND_SWAY',
          });
        }

        // 4. STRUKTUR MENARA KUBAH / MISI NPC (Bangunan Mini 3D Jelas + Label Nama NPC)
        else if (tile.type === 'NPC' && tile.npc) {
          const isSolved = solvedNpcIds.includes(tile.npc.npcId);
          const isBoss = bossNpcId ? tile.npc.npcId === bossNpcId : tile.npc.npcId?.endsWith('-4');
          const isLocked = isBoss && !isBossUnlocked && !isSolved;
          const npcGroup = new THREE.Group();

          if (isFPQS) {
            const makmal = tile.npc.makmalType || (
              tile.npc.npcId === 'NPC-FPQS-1' ? 'TARANNUM' :
              tile.npc.npcId === 'NPC-FPQS-2' ? 'HADIS' :
              tile.npc.npcId === 'NPC-FPQS-3' ? 'BRAILLE' :
              tile.npc.npcId === 'NPC-FPQS-4' ? 'DEKAN' :
              tile.npc.npcId === 'NPC-FPQS-5' ? 'BILIK_NADI' : 'MAKMAL'
            );

            // 1. MAKMAL TARANNUM (Studio Akustik + Mikrofon 3D + Gelombang Bunyi Equalizer + 2 Pensyarah)
            if (makmal === 'TARANNUM') {
              const baseGeo = new THREE.BoxGeometry(0.92, 0.08, 0.92);
              const studioBase = new THREE.Mesh(baseGeo, whiteMarbleMat);
              studioBase.position.set(0, 0.04, 0);
              studioBase.receiveShadow = true;
              studioBase.castShadow = true;
              npcGroup.add(studioBase);

              // Dinding Studio Akustik Dark Slate
              const studioGeo = new THREE.BoxGeometry(0.66, 0.44, 0.58);
              const studioMat = new THREE.MeshStandardMaterial({
                color: 0x1e293b,
                roughness: 0.5,
                flatShading: true,
              });
              const studioMesh = new THREE.Mesh(studioGeo, studioMat);
              studioMesh.position.set(0, 0.30, 0);
              studioMesh.castShadow = true;
              studioMesh.receiveShadow = true;
              npcGroup.add(studioMesh);

              // Panel Kaca Kedap Bunyi Hadapan
              const glassGeo = new THREE.BoxGeometry(0.38, 0.22, 0.02);
              const glassMat = new THREE.MeshStandardMaterial({
                color: 0x0891b2,
                roughness: 0.1,
                transparent: true,
                opacity: 0.65,
              });
              const glassMesh = new THREE.Mesh(glassGeo, glassMat);
              glassMesh.position.set(0, 0.32, 0.30);
              npcGroup.add(glassMesh);

              // Mikrofon 3D Kondenser di Bumbung Studio
              const micStandGeo = new THREE.CylinderGeometry(0.015, 0.018, 0.22, 6);
              const micStand = new THREE.Mesh(micStandGeo, whiteMarbleMat);
              micStand.position.set(0, 0.63, 0);
              npcGroup.add(micStand);

              const micMountGeo = new THREE.TorusGeometry(0.065, 0.01, 6, 16);
              const micMount = new THREE.Mesh(micMountGeo, goldMat);
              micMount.position.set(0, 0.74, 0);
              npcGroup.add(micMount);

              const micCapsuleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.14, 10);
              const micCapsuleMat = new THREE.MeshStandardMaterial({
                color: 0xd4d4d8,
                metalness: 0.85,
                roughness: 0.2,
              });
              const micCapsule = new THREE.Mesh(micCapsuleGeo, micCapsuleMat);
              micCapsule.position.set(0, 0.74, 0);
              micCapsule.castShadow = true;
              npcGroup.add(micCapsule);

              // Gelombang Bunyi / Equalizer Bars Neon di Bumbung (5 Palang Equalizer)
              const eqHeights = [0.10, 0.22, 0.34, 0.24, 0.12];
              const eqOffsets = [-0.18, -0.09, 0, 0.09, 0.18];
              eqOffsets.forEach((ox, idx) => {
                const barGeo = new THREE.BoxGeometry(0.035, eqHeights[idx], 0.035);
                const barMat = idx % 2 === 0 ? fpqsNeonCyanMat : goldMat;
                const bar = new THREE.Mesh(barGeo, barMat);
                bar.position.set(ox, 0.52 + eqHeights[idx] * 0.5, -0.15);
                npcGroup.add(bar);
                animatedMeshesRef.current.push({
                  mesh: bar,
                  baseHeight: eqHeights[idx],
                  freq: 3.5 + idx * 0.6,
                  phase: idx * 0.8,
                  type: 'EQUALIZER_BAR',
                });
              });

              // Gabungan 2 Patung Pensyarah: Dr Anwar Hussein & Prof Madya Dr Khairul Amri Mohamad
              const figAnwar = buildLecturerFigurine({
                gender: 'MALE',
                suitColor: 0x1e3a8a, // Blazer biru navy kemas
                headwear: 'SONGKOK',
                scale: 0.78,
                hasBook: true,
              });
              figAnwar.position.set(-0.20, 0.08, 0.36);
              npcGroup.add(figAnwar);

              const figKhairul = buildLecturerFigurine({
                gender: 'MALE',
                suitColor: 0x334155, // Blazer kelabu arang kemas
                headwear: 'SONGKOK',
                scale: 0.78,
                hasBook: true,
              });
              figKhairul.position.set(0.20, 0.08, 0.36);
              npcGroup.add(figKhairul);

              // Cahaya & Halo
              const studioLight = new THREE.PointLight(0x38bdf8, 1.8, 3.8, 2);
              studioLight.position.set(0, 0.75, 0);
              npcGroup.add(studioLight);

              const { sprite: micHalo, texture: micHaloTex } = createGlowHaloSprite(0x38bdf8, 1.2, 0.85);
              disposableTextures.push(micHaloTex);
              micHalo.position.set(0, 0.78, 0);
              npcGroup.add(micHalo);
              animatedMeshesRef.current.push({
                mesh: micHalo,
                baseScale: 1.2,
                speed: 2.4,
                type: 'HALO_PULSE',
              });

              // Label Terapung
              const labelText = isSolved
                ? '✓ Makmal Tarannum'
                : '🎙️ Tarannum: Dr Anwar & PM Dr Khairul';
              const { sprite: nLabel, texture: nTex } = createFloatingLabelSprite(labelText, {
                bgColor: 'rgba(8, 24, 48, 0.92)',
                borderColor: isSolved ? '#10b981' : '#38bdf8',
                textColor: isSolved ? '#a7f3d0' : '#e0f2fe',
                scaleX: 1.68,
                scaleY: 0.36,
              });
              disposableTextures.push(nTex);
              nLabel.position.set(0, 1.35, 0);
              npcGroup.add(nLabel);

              clickableMeshesRef.current.push(studioBase, studioMesh, micCapsule);
            }

            // 2. MAKMAL HADIS (Rak Buku Kitab + Pelayan Server Digital Biru + Hologram + 2 Pensyarah)
            else if (makmal === 'HADIS') {
              const baseGeo = new THREE.BoxGeometry(0.92, 0.08, 0.92);
              const hadisBase = new THREE.Mesh(baseGeo, whiteMarbleMat);
              hadisBase.position.set(0, 0.04, 0);
              hadisBase.receiveShadow = true;
              hadisBase.castShadow = true;
              npcGroup.add(hadisBase);

              // Dinding Rak Buku Arkib Hadis Kayu Mahogani
              const shelfGeo = new THREE.BoxGeometry(0.38, 0.50, 0.22);
              const shelfMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.6 });
              const shelf = new THREE.Mesh(shelfGeo, shelfMat);
              shelf.position.set(-0.16, 0.33, -0.10);
              shelf.castShadow = true;
              npcGroup.add(shelf);

              // Barisan Tulang Belakang Kitab Berwarna-warni
              const bookColors = [0x991b1b, 0x065f46, 0x1e40af, 0xd97706, 0x7c2d12];
              for (let b = 0; b < 5; b++) {
                const bGeo = new THREE.BoxGeometry(0.04, 0.12, 0.16);
                const bMat = new THREE.MeshStandardMaterial({ color: bookColors[b % bookColors.length] });
                const bMesh = new THREE.Mesh(bGeo, bMat);
                bMesh.position.set(-0.28 + b * 0.06, 0.36, 0.02);
                npcGroup.add(bMesh);
              }

              // Rak Pelayan Digital (Cyber Server Rack)
              const serverGeo = new THREE.BoxGeometry(0.26, 0.54, 0.26);
              const serverMesh = new THREE.Mesh(serverGeo, fpqsServerMat);
              serverMesh.position.set(0.20, 0.35, -0.10);
              serverMesh.castShadow = true;
              npcGroup.add(serverMesh);

              // Lampu Penunjuk LED Berkelip pada Server
              for (let led = 0; led < 4; led++) {
                const ledGeo = new THREE.SphereGeometry(0.016, 6, 6);
                const ledMat = led % 2 === 0 ? fpqsNeonCyanMat : fpqsNeonGreenMat;
                const ledMesh = new THREE.Mesh(ledGeo, ledMat);
                ledMesh.position.set(0.16 + (led % 2) * 0.08, 0.26 + Math.floor(led / 2) * 0.14, 0.04);
                npcGroup.add(ledMesh);
              }

              // Hologram Pelayan Digital Biru Terapung di Atas Bangunan
              const holoGeo = new THREE.OctahedronGeometry(0.18, 0);
              const holo = new THREE.Mesh(holoGeo, fpqsNeonCyanMat);
              holo.position.set(0, 0.76, -0.05);
              npcGroup.add(holo);

              const { sprite: holoHalo, texture: holoHaloTex } = createGlowHaloSprite(0x0ea5e9, 1.3, 0.85);
              disposableTextures.push(holoHaloTex);
              holoHalo.position.set(0, 0.76, -0.05);
              npcGroup.add(holoHalo);

              animatedMeshesRef.current.push({
                mesh: holo,
                type: 'HOLOGRAM_PULSE',
              });
              animatedMeshesRef.current.push({
                mesh: holoHalo,
                baseScale: 1.3,
                speed: 2.6,
                type: 'HALO_PULSE',
              });

              // Gabungan 2 Patung Pensyarah: Dr Helmy Arif & Dr Shamsudin Yani
              const figHelmy = buildLecturerFigurine({
                gender: 'MALE',
                suitColor: 0x0f172a, // Suit gelap kemas
                headwear: 'SONGKOK',
                scale: 0.78,
                hasBook: true,
              });
              figHelmy.position.set(-0.20, 0.08, 0.36);
              npcGroup.add(figHelmy);

              const figShamsudin = buildLecturerFigurine({
                gender: 'MALE',
                suitColor: 0x14532d, // Blazer hijau USIM kemas
                headwear: 'SONGKOK',
                scale: 0.78,
                hasBook: true,
              });
              figShamsudin.position.set(0.20, 0.08, 0.36);
              npcGroup.add(figShamsudin);

              // Cahaya & Label
              const hadisLight = new THREE.PointLight(0x0ea5e9, 1.9, 4.0, 2);
              hadisLight.position.set(0, 0.76, 0);
              npcGroup.add(hadisLight);

              const labelText = isSolved
                ? '✓ Makmal Hadis'
                : '📚 Hadis: Dr Helmy & Dr Shamsudin';
              const { sprite: nLabel, texture: nTex } = createFloatingLabelSprite(labelText, {
                bgColor: 'rgba(10, 25, 47, 0.92)',
                borderColor: isSolved ? '#10b981' : '#38bdf8',
                textColor: isSolved ? '#a7f3d0' : '#bae6fd',
                scaleX: 1.68,
                scaleY: 0.36,
              });
              disposableTextures.push(nTex);
              nLabel.position.set(0, 1.35, 0);
              npcGroup.add(nLabel);

              clickableMeshesRef.current.push(hadisBase, shelf, serverMesh, holo);
            }

            // 3. MAKMAL BRAILLE (Bangunan Putih + Tekstur Titik Braille Neon + 2 Pensyarah Bertudung)
            else if (makmal === 'BRAILLE') {
              const baseGeo = new THREE.BoxGeometry(0.92, 0.08, 0.92);
              const brailleBase = new THREE.Mesh(baseGeo, whiteMarbleMat);
              brailleBase.position.set(0, 0.04, 0);
              brailleBase.receiveShadow = true;
              brailleBase.castShadow = true;
              npcGroup.add(brailleBase);

              // Bangunan Putih Moden Bersih
              const bodyGeo = new THREE.BoxGeometry(0.66, 0.46, 0.58);
              const bodyMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.25,
                flatShading: true,
              });
              const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
              bodyMesh.position.set(0, 0.31, 0);
              bodyMesh.castShadow = true;
              bodyMesh.receiveShadow = true;
              npcGroup.add(bodyMesh);

              // Tekstur Titik-Titik Braille Neon Hijau (Matriks 2x3 Titik Braille Bercahaya)
              const brailleOffsets = [
                // Sel Braille 1
                [-0.18, 0.38, 0.30], [-0.12, 0.38, 0.30],
                [-0.18, 0.32, 0.30], [-0.12, 0.32, 0.30],
                [-0.18, 0.26, 0.30], [-0.12, 0.26, 0.30],
                // Sel Braille 2
                [0.12, 0.38, 0.30], [0.18, 0.38, 0.30],
                [0.12, 0.32, 0.30], [0.18, 0.32, 0.30],
                [0.12, 0.26, 0.30], [0.18, 0.26, 0.30],
              ];
              brailleOffsets.forEach(([bx, by, bz], idx) => {
                const dotGeo = new THREE.SphereGeometry(0.022, 6, 6);
                const dotMesh = new THREE.Mesh(dotGeo, fpqsNeonGreenMat);
                dotMesh.position.set(bx, by, bz);
                npcGroup.add(dotMesh);
                animatedMeshesRef.current.push({
                  mesh: dotMesh,
                  baseIntensity: 2.5,
                  speed: 2.8,
                  phase: idx * 0.4,
                  type: 'BRAILLE_NEON_PULSE',
                });
              });

              // Podium Plat Braille Mushaf di Tengah
              const podiumGeo = new THREE.BoxGeometry(0.20, 0.05, 0.14);
              const podium = new THREE.Mesh(podiumGeo, goldMat);
              podium.position.set(0, 0.60, 0);
              podium.rotation.x = 0.3;
              npcGroup.add(podium);

              // Kristal Simbol Aksesibiliti Neon Terapung
              const symbolGeo = new THREE.OctahedronGeometry(0.15, 0);
              const symbolMesh = new THREE.Mesh(symbolGeo, fpqsNeonGreenMat);
              symbolMesh.position.set(0, 0.82, 0);
              npcGroup.add(symbolMesh);

              const { sprite: brailleHalo, texture: brailleHaloTex } = createGlowHaloSprite(0x22c55e, 1.25, 0.88);
              disposableTextures.push(brailleHaloTex);
              brailleHalo.position.set(0, 0.82, 0);
              npcGroup.add(brailleHalo);

              animatedMeshesRef.current.push({
                mesh: symbolMesh,
                baseY: 0.82,
                speed: 2.0,
                type: 'BOB_AND_SPIN',
              });
              animatedMeshesRef.current.push({
                mesh: brailleHalo,
                baseScale: 1.25,
                speed: 2.6,
                type: 'HALO_PULSE',
              });

              // Gabungan 2 Patung Pensyarah: Prof Noor Najihah & Dr Noor Atirah (Tudung Labuh Kemas)
              const figNajihah = buildLecturerFigurine({
                gender: 'FEMALE',
                suitColor: 0x334155,
                headwear: 'HIJAB',
                headwearColor: 0xf472b6, // Tudung pastel merah jambu anggun
                scale: 0.78,
                hasBook: true,
              });
              figNajihah.position.set(-0.20, 0.08, 0.36);
              npcGroup.add(figNajihah);

              const figAtirah = buildLecturerFigurine({
                gender: 'FEMALE',
                suitColor: 0x1e3a8a,
                headwear: 'HIJAB',
                headwearColor: 0x38bdf8, // Tudung pastel biru anggun
                scale: 0.78,
                hasBook: true,
              });
              figAtirah.position.set(0.20, 0.08, 0.36);
              npcGroup.add(figAtirah);

              // Cahaya & Label
              const brailleLight = new THREE.PointLight(0x22c55e, 1.9, 4.0, 2);
              brailleLight.position.set(0, 0.82, 0);
              npcGroup.add(brailleLight);

              const labelText = isSolved
                ? '✓ Makmal Braille'
                : '⠃ Braille: Prof Najihah & Dr Atirah';
              const { sprite: nLabel, texture: nTex } = createFloatingLabelSprite(labelText, {
                bgColor: 'rgba(6, 40, 20, 0.92)',
                borderColor: isSolved ? '#10b981' : '#4ade80',
                textColor: isSolved ? '#a7f3d0' : '#bbf7d0',
                scaleX: 1.68,
                scaleY: 0.36,
              });
              disposableTextures.push(nTex);
              nLabel.position.set(0, 1.35, 0);
              npcGroup.add(nLabel);

              clickableMeshesRef.current.push(brailleBase, bodyMesh, symbolMesh);
            }

            // 4. PEJABAT DEKAN (FOYER) - NPC BOSS (Tapak Marmar, Papan Tanda USIM, Tiang Megah, Aura Emas & Dekan)
            else if (makmal === 'DEKAN') {
              // Tapak Marmar Bertingkat Foyer
              const base1Geo = new THREE.BoxGeometry(1.08, 0.10, 1.08);
              const dekanBase1 = new THREE.Mesh(base1Geo, whiteMarbleMat);
              dekanBase1.position.set(0, 0.05, 0);
              dekanBase1.receiveShadow = true;
              dekanBase1.castShadow = true;
              npcGroup.add(dekanBase1);

              const base2Geo = new THREE.BoxGeometry(0.92, 0.08, 0.92);
              const dekanBase2 = new THREE.Mesh(base2Geo, whiteMarbleMat);
              dekanBase2.position.set(0, 0.14, 0);
              dekanBase2.receiveShadow = true;
              dekanBase2.castShadow = true;
              npcGroup.add(dekanBase2);

              // 4 Tiang Klasik Marmar Megah & Kepala Emas
              const colPositions = [
                [-0.34, -0.34], [0.34, -0.34],
                [-0.34, 0.28], [0.34, 0.28],
              ];
              colPositions.forEach(([cx, cz]) => {
                const colGeo = new THREE.CylinderGeometry(0.04, 0.048, 0.60, 8);
                const col = new THREE.Mesh(colGeo, whiteMarbleMat);
                col.position.set(cx, 0.48, cz);
                col.castShadow = true;
                npcGroup.add(col);

                const capGeo = new THREE.BoxGeometry(0.12, 0.04, 0.12);
                const cap = new THREE.Mesh(capGeo, goldMat);
                cap.position.set(cx, 0.80, cz);
                npcGroup.add(cap);
              });

              // Bumbung / Pedimen Foyer Pejabat Dekan
              const pedimentGeo = new THREE.BoxGeometry(0.84, 0.12, 0.72);
              const pediment = new THREE.Mesh(pedimentGeo, whiteMarbleMat);
              pediment.position.set(0, 0.88, -0.03);
              pediment.castShadow = true;
              npcGroup.add(pediment);

              const pedimentTrimGeo = new THREE.BoxGeometry(0.88, 0.03, 0.76);
              const pedimentTrim = new THREE.Mesh(pedimentTrimGeo, goldMat);
              pedimentTrim.position.set(0, 0.94, -0.03);
              npcGroup.add(pedimentTrim);

              // Papan Tanda USIM di Hadapan Foyer
              const signPlinthGeo = new THREE.BoxGeometry(0.50, 0.16, 0.10);
              const signPlinthMat = new THREE.MeshStandardMaterial({
                color: 0x14532d, // Hijau USIM
                roughness: 0.4,
              });
              const signPlinth = new THREE.Mesh(signPlinthGeo, signPlinthMat);
              signPlinth.position.set(0, 0.22, 0.42);
              signPlinth.castShadow = true;
              npcGroup.add(signPlinth);

              const signPlateGeo = new THREE.BoxGeometry(0.44, 0.10, 0.02);
              const signPlate = new THREE.Mesh(signPlateGeo, goldMat);
              signPlate.position.set(0, 0.22, 0.48);
              npcGroup.add(signPlate);

              // Aura Keemasan Bersaiz Besar Mengelilingi Tapak
              const auraRingGeo = new THREE.TorusGeometry(0.82, 0.038, 8, 32);
              const auraRingMat = new THREE.MeshStandardMaterial({
                color: isLocked ? 0xef4444 : 0xfbbf24,
                emissive: isLocked ? 0xdc2626 : 0xd97706,
                emissiveIntensity: isLocked ? 1.8 : 2.8,
                roughness: 0.2,
              });
              const auraRing = new THREE.Mesh(auraRingGeo, auraRingMat);
              auraRing.rotation.x = Math.PI * 0.5;
              auraRing.position.set(0, 0.16, 0);
              npcGroup.add(auraRing);

              animatedMeshesRef.current.push({
                mesh: auraRing,
                baseScale: 1.0,
                speed: isLocked ? 1.5 : 3.0,
                type: 'HALO_PULSE',
              });

              // Halo Sprite Megah & Kristal Prestij Dekanat di Puncak
              const bossHaloColor = isSolved ? 0x10b981 : isLocked ? 0xef4444 : 0xfbbf24;
              const { sprite: bossHalo, texture: bossHaloTex } = createGlowHaloSprite(bossHaloColor, 1.8, 0.95);
              disposableTextures.push(bossHaloTex);
              bossHalo.position.set(0, 1.20, 0);
              npcGroup.add(bossHalo);

              const crestGeo = new THREE.OctahedronGeometry(0.24, 0);
              const crest = new THREE.Mesh(crestGeo, goldMat);
              crest.position.set(0, 1.20, 0);
              crest.castShadow = true;
              npcGroup.add(crest);

              animatedMeshesRef.current.push({
                mesh: crest,
                baseY: 1.20,
                speed: 1.8,
                type: 'BOB_AND_SPIN',
              });
              animatedMeshesRef.current.push({
                mesh: bossHalo,
                baseScale: 1.8,
                speed: 2.8,
                type: 'HALO_PULSE',
              });

              // Patung Watak Dekan: Prof Madya Dr Zuhdi Ameen (Jubah Kehormat Dekanat & Songkok)
              const figDekan = buildLecturerFigurine({
                gender: 'MALE',
                suitColor: 0x0f172a, // Jubah akademik dekanat hitam emas
                headwear: 'SONGKOK',
                scale: 0.85,
                hasBook: true,
              });
              figDekan.position.set(0, 0.18, 0.05);
              npcGroup.add(figDekan);

              // Cahaya & Label
              const dekanLight = new THREE.PointLight(bossHaloColor, 3.2, 5.0, 2);
              dekanLight.position.set(0, 1.15, 0);
              npcGroup.add(dekanLight);

              const labelText = isSolved
                ? '✓ 👑 Dekan: PM Dr Zuhdi'
                : isLocked
                ? '🔒 KUNCI: Dekan PM Dr Zuhdi'
                : '👑 BOSS: Dekan PM Dr Zuhdi';
              const { sprite: nLabel, texture: nTex } = createFloatingLabelSprite(labelText, {
                bgColor: isLocked ? 'rgba(40, 10, 16, 0.92)' : 'rgba(25, 20, 5, 0.92)',
                borderColor: isSolved ? '#10b981' : isLocked ? '#ef4444' : '#fbbf24',
                textColor: isSolved ? '#a7f3d0' : isLocked ? '#fca5a5' : '#fef08a',
                scaleX: 1.75,
                scaleY: 0.38,
              });
              disposableTextures.push(nTex);
              nLabel.position.set(0, 1.68, 0);
              npcGroup.add(nLabel);

              clickableMeshesRef.current.push(dekanBase1, dekanBase2, pediment, signPlinth, crest);
            }

            // 5. BILIK NADI PMFPQS - EASTER EGG (Petak Khas Pelajar, Banner Persatuan & 2 Pelajar)
            else if (makmal === 'BILIK_NADI') {
              const baseGeo = new THREE.BoxGeometry(0.88, 0.08, 0.88);
              const nadiBase = new THREE.Mesh(baseGeo, whiteMarbleMat);
              nadiBase.position.set(0, 0.04, 0);
              nadiBase.receiveShadow = true;
              nadiBase.castShadow = true;
              npcGroup.add(nadiBase);

              // Dinding Bilik Santai Pelajar
              const loungeGeo = new THREE.BoxGeometry(0.64, 0.42, 0.54);
              const loungeMat = new THREE.MeshStandardMaterial({
                color: 0x334155,
                roughness: 0.45,
                flatShading: true,
              });
              const loungeMesh = new THREE.Mesh(loungeGeo, loungeMat);
              loungeMesh.position.set(0, 0.29, -0.04);
              loungeMesh.castShadow = true;
              npcGroup.add(loungeMesh);

              // Banner Persatuan Pelajar PMFPQS
              // 2 Tiang Banner Sisi Emas
              [-0.28, 0.28].forEach((bx) => {
                const poleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.42, 6);
                const pole = new THREE.Mesh(poleGeo, goldMat);
                pole.position.set(bx, 0.55, 0.26);
                npcGroup.add(pole);

                const knobGeo = new THREE.SphereGeometry(0.03, 6, 6);
                const knob = new THREE.Mesh(knobGeo, goldMat);
                knob.position.set(bx, 0.77, 0.26);
                npcGroup.add(knob);
              });

              // Kain Banner PMFPQS (Warna Biru Diraja & Emas Persatuan)
              const bannerClothGeo = new THREE.BoxGeometry(0.54, 0.20, 0.02);
              const bannerClothMat = new THREE.MeshStandardMaterial({
                color: 0x1e3a8a, // Biru USIM PMFPQS
                emissive: 0x1d4ed8,
                emissiveIntensity: 0.35,
                roughness: 0.4,
              });
              const bannerCloth = new THREE.Mesh(bannerClothGeo, bannerClothMat);
              bannerCloth.position.set(0, 0.65, 0.26);
              bannerCloth.castShadow = true;
              npcGroup.add(bannerCloth);

              // Bintang / Permata Easter Egg Kuning Bercahaya di Atas
              const starGeo = new THREE.OctahedronGeometry(0.16, 0);
              const starMesh = new THREE.Mesh(starGeo, goldMat);
              starMesh.position.set(0, 0.88, 0);
              npcGroup.add(starMesh);

              const { sprite: starHalo, texture: starHaloTex } = createGlowHaloSprite(0xfacc15, 1.2, 0.85);
              disposableTextures.push(starHaloTex);
              starHalo.position.set(0, 0.88, 0);
              npcGroup.add(starHalo);

              animatedMeshesRef.current.push({
                mesh: starMesh,
                baseY: 0.88,
                speed: 2.2,
                type: 'BOB_AND_SPIN',
              });
              animatedMeshesRef.current.push({
                mesh: starHalo,
                baseScale: 1.2,
                speed: 2.5,
                type: 'HALO_PULSE',
              });

              // Gabungan 2 Patung Pelajar: Ali Shahril & Ebadullah (Lanyard Hijau USIM)
              const figAli = buildLecturerFigurine({
                gender: 'MALE',
                suitColor: 0x1e3a8a, // Varsity jacket navy
                headwear: 'NONE',
                scale: 0.76,
                hasLanyard: true,
              });
              figAli.position.set(-0.19, 0.08, 0.35);
              npcGroup.add(figAli);

              const figEbad = buildLecturerFigurine({
                gender: 'MALE',
                suitColor: 0x0f766e, // Kemeja smart casual teal
                headwear: 'NONE',
                scale: 0.76,
                hasLanyard: true,
              });
              figEbad.position.set(0.19, 0.08, 0.35);
              npcGroup.add(figEbad);

              // Cahaya & Label
              const nadiLight = new THREE.PointLight(0xfacc15, 1.8, 3.6, 2);
              nadiLight.position.set(0, 0.88, 0);
              npcGroup.add(nadiLight);

              const labelText = isSolved
                ? '✓ ⭐ Bilik Nadi: Ebadullah & Ali'
                : '⭐ Bilik Nadi: Ebadullah & Ali';
              const { sprite: nLabel, texture: nTex } = createFloatingLabelSprite(labelText, {
                bgColor: 'rgba(20, 25, 45, 0.92)',
                borderColor: isSolved ? '#10b981' : '#facc15',
                textColor: isSolved ? '#a7f3d0' : '#fef08a',
                scaleX: 1.70,
                scaleY: 0.36,
              });
              disposableTextures.push(nTex);
              nLabel.position.set(0, 1.35, 0);
              npcGroup.add(nLabel);

              clickableMeshesRef.current.push(nadiBase, loungeMesh, bannerCloth, starMesh);
            }

            npcGroup.position.set(x, 0, z);
            npcGroup.userData = { r: rIdx, c: cIdx, type: tile.type, npc: tile.npc };
            scene.add(npcGroup);
          } else {
            // A. FASA 3: Tapak Marmar Bertangga (Stepped Base: Tier 1 & Tier 2)
            const base1Geo = new THREE.BoxGeometry(isBoss ? 1.04 : 0.90, 0.08, isBoss ? 1.04 : 0.90);
            const monumentBase1 = new THREE.Mesh(base1Geo, whiteMarbleMat);
            monumentBase1.position.set(0, 0.04, 0);
            monumentBase1.receiveShadow = true;
            monumentBase1.castShadow = true;
            npcGroup.add(monumentBase1);

            const base2Geo = new THREE.BoxGeometry(isBoss ? 0.90 : 0.78, 0.08, isBoss ? 0.90 : 0.78);
            const monumentBase2 = new THREE.Mesh(base2Geo, whiteMarbleMat);
            monumentBase2.position.set(0, 0.12, 0);
            monumentBase2.receiveShadow = true;
            monumentBase2.castShadow = true;
            npcGroup.add(monumentBase2);

          // Anak Tangga Hadapan (Entrance Steps)
          const stepGeo = new THREE.BoxGeometry(0.36, 0.04, 0.12);
          const stepMesh = new THREE.Mesh(stepGeo, whiteMarbleMat);
          stepMesh.position.set(0, 0.04, isBoss ? 0.52 : 0.44);
          stepMesh.receiveShadow = true;
          stepMesh.castShadow = true;
          npcGroup.add(stepMesh);

          // B. Dinding Utama Putih Gading (Main Sanctuary)
          const bodyH = isBoss ? 0.54 : 0.46;
          const bodyW = isBoss ? 0.66 : 0.56;
          const bodyGeo = new THREE.BoxGeometry(bodyW, bodyH, bodyW);
          const monumentBody = new THREE.Mesh(bodyGeo, isLocked ? darkDoorMat : creamWallMat);
          monumentBody.position.set(0, 0.16 + bodyH * 0.5, 0);
          monumentBody.castShadow = true;
          monumentBody.receiveShadow = true;
          npcGroup.add(monumentBody);

          // C. 4 Tiang Penjuru Marmar dengan Kepala Emas (4 Corner Pillars)
          const colOffset = bodyW * 0.48;
          const colHeight = bodyH + 0.04;
          const corners = [
            [-colOffset, -colOffset],
            [colOffset, -colOffset],
            [-colOffset, colOffset],
            [colOffset, colOffset],
          ];

          corners.forEach(([cx, cz]) => {
            const pillarGeo = new THREE.CylinderGeometry(0.036, 0.044, colHeight, 6);
            const pillar = new THREE.Mesh(pillarGeo, whiteMarbleMat);
            pillar.position.set(cx, 0.16 + colHeight * 0.5, cz);
            pillar.castShadow = true;
            pillar.receiveShadow = true;
            npcGroup.add(pillar);

            const capGeo = new THREE.BoxGeometry(0.10, 0.04, 0.10);
            const capMesh = new THREE.Mesh(capGeo, goldMat);
            capMesh.position.set(cx, 0.16 + colHeight + 0.02, cz);
            capMesh.castShadow = true;
            npcGroup.add(capMesh);
          });

          // D. Pintu Gerbang Melengkung & Ark Emas (Arched Portal Doorway)
          const doorGeo = new THREE.BoxGeometry(0.24, 0.32, 0.04);
          const doorMesh = new THREE.Mesh(doorGeo, darkDoorMat);
          doorMesh.position.set(0, 0.16 + 0.16, bodyW * 0.5 + 0.02);
          doorMesh.castShadow = true;
          npcGroup.add(doorMesh);

          const doorArchGeo = new THREE.TorusGeometry(0.12, 0.025, 6, 12, Math.PI);
          const doorArch = new THREE.Mesh(doorArchGeo, goldMat);
          doorArch.position.set(0, 0.16 + 0.32, bodyW * 0.5 + 0.02);
          doorArch.rotation.z = Math.PI;
          npcGroup.add(doorArch);

          // E. 2 Lentera Api Kecil di Pintu Masuk (Warm Entrance Lanterns with Flame Light)
          const lanternMat = new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            emissive: 0xd97706,
            emissiveIntensity: 2.2,
            roughness: 0.2,
          });

          [-0.18, 0.18].forEach((lx) => {
            const postGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.18, 5);
            const post = new THREE.Mesh(postGeo, goldMat);
            post.position.set(lx, 0.16 + 0.09, bodyW * 0.5 + 0.08);
            post.castShadow = true;
            npcGroup.add(post);

            const lampGeo = new THREE.BoxGeometry(0.065, 0.085, 0.065);
            const lamp = new THREE.Mesh(lampGeo, lanternMat);
            lamp.position.set(lx, 0.16 + 0.20, bodyW * 0.5 + 0.08);
            npcGroup.add(lamp);
          });

          // Cahaya Api Lentera Pintu Masuk
          const lanternLight = new THREE.PointLight(0xf59e0b, 1.1, 2.4, 2);
          lanternLight.position.set(0, 0.16 + 0.25, bodyW * 0.5 + 0.12);
          npcGroup.add(lanternLight);

          // F. Bumbung Bertingkat & Kubah Emas Berjalur (Ribbed Golden Dome)
          const corniceGeo = new THREE.BoxGeometry(bodyW + 0.10, 0.06, bodyW + 0.10);
          const corniceMesh = new THREE.Mesh(corniceGeo, goldMat);
          corniceMesh.position.set(0, 0.16 + bodyH + 0.03, 0);
          corniceMesh.castShadow = true;
          npcGroup.add(corniceMesh);

          // Kubah Emas Berjalur (Ribbed Spherical Dome)
          const domeRadius = isBoss ? 0.38 : 0.30;
          const domeGeo = new THREE.SphereGeometry(domeRadius, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
          const dome = new THREE.Mesh(domeGeo, goldMat);
          dome.position.set(0, 0.16 + bodyH + 0.05, 0);
          dome.castShadow = true;
          npcGroup.add(dome);

          // Kemuncak Finial Emas
          const spireGeo = new THREE.ConeGeometry(0.04, 0.18, 6);
          const spire = new THREE.Mesh(spireGeo, goldMat);
          spire.position.set(0, 0.16 + bodyH + 0.05 + domeRadius + 0.09, 0);
          spire.castShadow = true;
          npcGroup.add(spire);

          // Bulan Sabit Emas di Kemuncak (Crescent Moon Finial)
          const crescentGeo = new THREE.TorusGeometry(0.065, 0.016, 6, 16, Math.PI * 1.35);
          const crescent = new THREE.Mesh(crescentGeo, goldMat);
          crescent.position.set(0, 0.16 + bodyH + 0.05 + domeRadius + 0.20, 0);
          crescent.rotation.z = Math.PI * 0.35;
          npcGroup.add(crescent);

          // G. Kristal Berlian Terapung di Atas Bulan Sabit
          const crystalY = 0.16 + bodyH + 0.05 + domeRadius + 0.38;
          const crystalGeo = new THREE.OctahedronGeometry(isBoss ? 0.26 : 0.19, 0);
          const crystalMat = new THREE.MeshStandardMaterial({
            color: isSolved ? 0x10b981 : isLocked ? 0xef4444 : 0xf59e0b,
            emissive: isSolved ? 0x059669 : isLocked ? 0xdc2626 : 0xd97706,
            emissiveIntensity: isLocked ? 1.6 : 1.1,
            roughness: 0.2,
            flatShading: true,
          });
          const crystal = new THREE.Mesh(crystalGeo, crystalMat);
          crystal.position.set(0, crystalY, 0);
          crystal.castShadow = true;
          npcGroup.add(crystal);

          // FASA 2: Fake Bloom / Volumetric Halo pada Kristal Menara NPC
          const haloColor = isSolved ? 0x10b981 : isLocked ? 0xef4444 : isBoss ? 0xfbbf24 : 0xf59e0b;
          const haloBaseScale = isBoss ? 1.55 : 1.22;
          const { sprite: npcHalo, texture: npcHaloTex } = createGlowHaloSprite(
            haloColor,
            haloBaseScale,
            isBoss ? 0.92 : 0.82
          );
          disposableTextures.push(npcHaloTex);
          npcHalo.position.set(0, crystalY, 0);
          npcGroup.add(npcHalo);

          animatedMeshesRef.current.push({
            mesh: npcHalo,
            baseScale: haloBaseScale,
            speed: isLocked ? 1.2 : 2.5,
            type: 'HALO_PULSE',
          });

          // PointLight Utama Menara
          const npcLight = new THREE.PointLight(
            isSolved ? 0x10b981 : isLocked ? 0xef4444 : 0xfbbf24,
            isSolved ? 1.6 : isLocked ? 2.0 : (isBoss ? 3.4 : 2.8),
            4.4,
            1.8
          );
          npcLight.position.set(0, crystalY - 0.1, 0);
          npcGroup.add(npcLight);

          // Label Terapung Nama NPC / Status Kunci Boss (THREE.Sprite CanvasTexture)
          const questNum = tile.npc.npcId ? tile.npc.npcId.split('-').pop() : '';
          const shortName = tile.npc.nama.split(' ').slice(0, 2).join(' ');
          const labelText = isSolved
            ? `✓ ${isBoss ? '👑 ' : ''}${shortName}`
            : isLocked
            ? `🔒 KUNCI: ${shortName}`
            : isBoss
            ? `👑 BOSS: ${shortName}`
            : `Misi #${questNum}: ${shortName}`;

          const { sprite: npcLabel, texture: npcTex } = createFloatingLabelSprite(labelText, {
            bgColor: isLocked ? 'rgba(35, 10, 16, 0.92)' : 'rgba(8, 14, 32, 0.9)',
            borderColor: isSolved ? '#10b981' : isLocked ? '#ef4444' : isBoss ? '#fbbf24' : '#fbbf24',
            textColor: isSolved ? '#a7f3d0' : isLocked ? '#fca5a5' : isBoss ? '#fef08a' : '#fef08a',
            scaleX: isBoss ? 1.68 : 1.48,
            scaleY: 0.36,
          });
          disposableTextures.push(npcTex);
          npcLabel.position.set(0, crystalY + 0.44, 0);
          npcGroup.add(npcLabel);

          animatedMeshesRef.current.push({
            mesh: crystal,
            baseY: crystalY,
            speed: isLocked ? 0.9 : 1.8,
            type: 'BOB_AND_SPIN',
          });

          // FASA 3: Kelipan Halus Lentera Pintu Masuk
          animatedMeshesRef.current.push({
            light: lanternLight,
            baseIntensity: 1.1,
            phase: (x * 3.7 + z * 5.1),
            type: 'LIGHT_FLICKER',
          });

          npcGroup.position.set(x, 0, z);
          npcGroup.userData = { r: rIdx, c: cIdx, type: tile.type, npc: tile.npc };
          clickableMeshesRef.current.push(monumentBase1, monumentBase2, monumentBody, dome, crystal);
          scene.add(npcGroup);
          }
        }

        // 5. GERBANG PORTAL 3D (Status Terbuka / Terkunci mengikut FASA 4)
        else if (tile.type === 'PORTAL') {
          const portalGroup = new THREE.Group();
          const pActive = isWilayahCompleted;

          const pBaseGeo = new THREE.CylinderGeometry(0.44, 0.5, 0.15, 8);
          const pBase = new THREE.Mesh(pBaseGeo, plinthMat);
          pBase.position.set(0, 0.1, 0);
          pBase.castShadow = true;
          pBase.receiveShadow = true;
          portalGroup.add(pBase);

          const ringGeo = new THREE.TorusGeometry(0.55, 0.09, 8, 24);
          const pRingMat = pActive
            ? portalMat
            : new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
          const portalRing = new THREE.Mesh(ringGeo, pRingMat);
          portalRing.position.set(0, 0.72, 0);
          portalRing.castShadow = true;
          portalGroup.add(portalRing);

          const coreGeo = new THREE.SphereGeometry(0.22, 8, 8);
          const coreMat = new THREE.MeshStandardMaterial({
            color: pActive ? 0xc084fc : 0x64748b,
            emissive: pActive ? 0xa855f7 : 0x334155,
            emissiveIntensity: pActive ? 1.25 : 0.25,
            roughness: 0.2,
          });
          const portalCore = new THREE.Mesh(coreGeo, coreMat);
          portalCore.position.set(0, 0.72, 0);
          portalGroup.add(portalCore);

          const portalLight = new THREE.PointLight(
            pActive ? 0xa855f7 : 0x475569,
            pActive ? 2.8 : 0.6,
            4.4,
            1.6
          );
          portalLight.position.set(0, 0.75, 0);
          portalGroup.add(portalLight);

          // FASA 2: Fake Bloom / Volumetric Halo pada Gelung & Teras Portal
          const portalHaloColor = pActive ? 0xc084fc : 0x64748b;
          const portalHaloScale = pActive ? 1.85 : 0.95;
          const { sprite: portalHalo, texture: portalHaloTex } = createGlowHaloSprite(
            portalHaloColor,
            portalHaloScale,
            pActive ? 0.92 : 0.35
          );
          disposableTextures.push(portalHaloTex);
          portalHalo.position.set(0, 0.72, 0);
          portalGroup.add(portalHalo);

          if (pActive) {
            animatedMeshesRef.current.push({
              mesh: portalHalo,
              baseScale: portalHaloScale,
              speed: 2.8,
              type: 'HALO_PULSE',
            });
          }

          // FASA 3: 18 Partikel Ungu Berputar Mengelilingi Gelung Portal (Portal Sparks)
          const sparkCount = 18;
          const sparkPositions = new Float32Array(sparkCount * 3);
          const sparkColors = new Float32Array(sparkCount * 3);
          for (let s = 0; s < sparkCount; s++) {
            const sAngle = (s / sparkCount) * Math.PI * 2;
            sparkPositions[s * 3] = Math.cos(sAngle) * 0.58;
            sparkPositions[s * 3 + 1] = 0.72 + Math.sin(sAngle) * 0.58;
            sparkPositions[s * 3 + 2] = (Math.random() - 0.5) * 0.12;

            sparkColors[s * 3] = 0.82;
            sparkColors[s * 3 + 1] = 0.42;
            sparkColors[s * 3 + 2] = 1.0;
          }
          const sparkGeo = new THREE.BufferGeometry();
          sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
          sparkGeo.setAttribute('color', new THREE.BufferAttribute(sparkColors, 3));

          const sparkMat = new THREE.PointsMaterial({
            size: pActive ? 0.14 : 0.08,
            vertexColors: true,
            transparent: true,
            opacity: pActive ? 0.95 : 0.4,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });
          const portalSparks = new THREE.Points(sparkGeo, sparkMat);
          portalGroup.add(portalSparks);

          animatedMeshesRef.current.push({
            mesh: portalSparks,
            speed: pActive ? 3.2 : 0.6,
            isActive: pActive,
            type: 'PORTAL_SPARKS',
          });

          // Label Terapung Status Portal
          const { sprite: pLabel, texture: pTex } = createFloatingLabelSprite(
            pActive ? '🌀 PORTAL TERBUKA' : '🔒 Portal Tertutup',
            {
              bgColor: pActive ? 'rgba(30, 10, 45, 0.9)' : 'rgba(15, 23, 42, 0.85)',
              borderColor: pActive ? '#c084fc' : '#64748b',
              textColor: pActive ? '#e9d5ff' : '#94a3b8',
              scaleX: 1.5,
              scaleY: 0.34,
            }
          );
          disposableTextures.push(pTex);
          pLabel.position.set(0, 1.45, 0);
          portalGroup.add(pLabel);

          if (pActive) {
            animatedMeshesRef.current.push({
              mesh: portalRing,
              type: 'SPIN_Z',
              speed: 1.4,
            });
            animatedMeshesRef.current.push({
              mesh: portalCore,
              baseY: 0.72,
              speed: 2.5,
              type: 'BOB_PULSE',
            });
          }

          portalGroup.position.set(x, 0, z);
          portalGroup.userData = { r: rIdx, c: cIdx, type: tile.type };
          clickableMeshesRef.current.push(pBase, portalRing, portalCore);
          scene.add(portalGroup);
        }
      });
    });

    // 7. ZARAH ATMOSFERA: Helaian Kertas Kitab (FPQS) vs Kelip-kelip Gurun
    if (isFPQS) {
      // FASA 1: Efek helaian kertas putih lutsinar berterbangan perlahan di udara (ilmu FPQS)
      const paperGroup = new THREE.Group();
      const paperCount = 38;
      const paperGeo = new THREE.PlaneGeometry(0.12, 0.16);
      const paperMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.35,
        transparent: true,
        opacity: 0.78,
        side: THREE.DoubleSide,
      });

      for (let i = 0; i < paperCount; i++) {
        const paperMesh = new THREE.Mesh(paperGeo, paperMat);
        const px = (Math.random() - 0.5) * (GRID_COLS * TILE_SIZE + 2);
        const py = 0.5 + Math.random() * 3.6;
        const pz = (Math.random() - 0.5) * (GRID_ROWS * TILE_SIZE + 2);
        paperMesh.position.set(px, py, pz);
        paperMesh.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        paperGroup.add(paperMesh);

        animatedMeshesRef.current.push({
          mesh: paperMesh,
          fallSpeed: 0.005 + Math.random() * 0.006,
          rotSpeedX: (Math.random() - 0.5) * 0.02,
          rotSpeedY: (Math.random() - 0.5) * 0.025,
          rotSpeedZ: (Math.random() - 0.5) * 0.02,
          driftSeed: Math.random() * 100,
          type: 'FLOATING_PAPER',
        });
      }
      scene.add(paperGroup);
    } else {
      const particleCount = 45;
      const particlePositions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        particlePositions[i * 3] = (Math.random() - 0.5) * (GRID_COLS * TILE_SIZE + 2);
        particlePositions[i * 3 + 1] = 0.4 + Math.random() * 3.5;
        particlePositions[i * 3 + 2] = (Math.random() - 0.5) * (GRID_ROWS * TILE_SIZE + 2);
      }
      const particleGeo = new THREE.BufferGeometry();
      particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
      const particleMat = new THREE.PointsMaterial({
        color: palette.accentGlow,
        size: 0.08,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      });
      const fireflies = new THREE.Points(particleGeo, particleMat);
      firefliesMeshRef.current = fireflies;
      scene.add(fireflies);
    }

    // 8. FIGUR WATAK PENGEMBARA 3D (Kontras Tinggi: Jubah Biru Diraja & Putih Mutiara)
    const playerGroup = new THREE.Group();
    const bodyPivot = new THREE.Group();
    playerGroup.add(bodyPivot);
    playerGroup.userData = { bodyPivot };
    playerGroupRef.current = playerGroup;

    // A. Gelang Cahaya Cyan/Putih Berdenyut di Atas Lantai Bawah Kaki Pengembara
    const outerRingGeo = new THREE.RingGeometry(0.33, 0.46, 28);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const outerFootRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerFootRing.rotation.x = -Math.PI * 0.5;
    outerFootRing.position.set(0, 0.06, 0);
    playerGroup.add(outerFootRing);

    const innerRingGeo = new THREE.RingGeometry(0.22, 0.28, 24);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const innerFootRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerFootRing.rotation.x = -Math.PI * 0.5;
    innerFootRing.position.set(0, 0.065, 0);
    playerGroup.add(innerFootRing);

    animatedMeshesRef.current.push({
      mesh: outerFootRing,
      type: 'BOB_PULSE_RING',
      speed: 3.5,
    });

    // B. Jubah Luar Biru Diraja (#1d4ed8) & Jubah Dalam Putih Mutiara (#f8fafc)
    const robeGeo = new THREE.ConeGeometry(0.32, 0.68, 10);
    const royalBlueMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      emissive: 0x1e40af,
      emissiveIntensity: 0.3,
      roughness: 0.35,
      flatShading: true,
    });
    const robe = new THREE.Mesh(robeGeo, royalBlueMat);
    robe.position.set(0, 0.36, 0);
    robe.castShadow = true;
    bodyPivot.add(robe);

    // Selempang / Tunik Hadapan Putih Mutiara (#f8fafc) untuk kontras maksimum
    const pearlTunicGeo = new THREE.CylinderGeometry(0.14, 0.25, 0.66, 8);
    const pearlWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: 0xe2e8f0,
      emissiveIntensity: 0.22,
      roughness: 0.3,
      flatShading: true,
    });
    const pearlTunic = new THREE.Mesh(pearlTunicGeo, pearlWhiteMat);
    pearlTunic.position.set(0, 0.36, 0.04);
    bodyPivot.add(pearlTunic);

    // C. Bahu / Kolar Emas Diraja
    const collarGeo = new THREE.TorusGeometry(0.18, 0.05, 8, 16);
    const collar = new THREE.Mesh(collarGeo, goldMat);
    collar.rotation.x = Math.PI * 0.5;
    collar.position.set(0, 0.65, 0);
    collar.castShadow = true;
    bodyPivot.add(collar);

    // D. Kepala Bulat Berwarna Kulit (#f1c27d)
    const headGeo = new THREE.SphereGeometry(0.165, 12, 12);
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xf1c27d,
      roughness: 0.55,
      flatShading: true,
    });
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0, 0.80, 0);
    head.castShadow = true;
    bodyPivot.add(head);

    // E. Serban Putih Mutiara (TorusGeometry + SphereGeometry di Atas Kepala)
    const turbanWrapGeo = new THREE.TorusGeometry(0.17, 0.06, 8, 16);
    const turbanWrap = new THREE.Mesh(turbanWrapGeo, pearlWhiteMat);
    turbanWrap.rotation.x = Math.PI * 0.48;
    turbanWrap.position.set(0, 0.88, 0);
    turbanWrap.castShadow = true;
    bodyPivot.add(turbanWrap);

    const turbanCrownGeo = new THREE.SphereGeometry(0.15, 10, 8);
    const turbanCrown = new THREE.Mesh(turbanCrownGeo, pearlWhiteMat);
    turbanCrown.position.set(0, 0.93, 0);
    turbanCrown.castShadow = true;
    bodyPivot.add(turbanCrown);

    // Pita Emas Kecil pada Serban
    const turbanBandGeo = new THREE.TorusGeometry(0.178, 0.02, 6, 16);
    const turbanBand = new THREE.Mesh(turbanBandGeo, goldMat);
    turbanBand.rotation.x = Math.PI * 0.48;
    turbanBand.position.set(0, 0.85, 0);
    turbanBand.castShadow = true;
    bodyPivot.add(turbanBand);

    // F. Tongkat Kayu dengan Permata Bercahaya
    const staffGeo = new THREE.CylinderGeometry(0.022, 0.028, 0.9, 6);
    const staff = new THREE.Mesh(staffGeo, trunkMat);
    staff.position.set(0.32, 0.46, 0.12);
    staff.rotation.z = -0.12;
    staff.castShadow = true;
    bodyPivot.add(staff);

    const gemGeo = new THREE.OctahedronGeometry(0.095, 0);
    const gemMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 1.8,
      roughness: 0.1,
    });
    const staffGem = new THREE.Mesh(gemGeo, gemMat);
    staffGem.position.set(0.37, 0.92, 0.12);
    bodyPivot.add(staffGem);

    const staffLight = new THREE.PointLight(0x38bdf8, 1.6, 2.8, 2);
    staffLight.position.set(0.37, 0.92, 0.12);
    bodyPivot.add(staffLight);

    // FASA 2: Fake Bloom / Volumetric Halo pada Permata Tongkat Pengembara
    const { sprite: staffHalo, texture: staffHaloTex } = createGlowHaloSprite(0x38bdf8, 0.68, 0.88);
    disposableTextures.push(staffHaloTex);
    staffHalo.position.set(0.37, 0.92, 0.12);
    bodyPivot.add(staffHalo);

    animatedMeshesRef.current.push({
      mesh: staffHalo,
      baseScale: 0.68,
      speed: 3.2,
      type: 'HALO_PULSE',
    });

    // G. Label Terapung "ANDA" di Atas Kepala Pengembara
    const { sprite: playerLabel, texture: playerTex } = createFloatingLabelSprite('ANDA', {
      bgColor: 'rgba(15, 23, 42, 0.92)',
      borderColor: '#38bdf8',
      textColor: '#ffffff',
      scaleX: 0.95,
      scaleY: 0.30,
    });
    disposableTextures.push(playerTex);
    playerLabel.position.set(0, 1.36, 0);
    playerGroup.add(playerLabel);

    playerGroup.position.set(initialPos.x, 0.15, initialPos.z);
    playerAnimStateRef.current.currentX = initialPos.x;
    playerAnimStateRef.current.currentZ = initialPos.z;
    playerAnimStateRef.current.targetX = initialPos.x;
    playerAnimStateRef.current.targetZ = initialPos.z;
    scene.add(playerGroup);

    // 9. Gelung Animasi & Kamera Sinematik (Render Loop)
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // A. Putaran Objek Animasi (NPC Crystal, Portal, Gelang Kaki Pengembara)
      animatedMeshesRef.current.forEach((item) => {
        if (item.type === 'BOB_AND_SPIN') {
          item.mesh.rotation.y = elapsedTime * item.speed;
          item.mesh.position.y = item.baseY + Math.sin(elapsedTime * 2.8) * 0.08;
        } else if (item.type === 'SPIN_Z') {
          item.mesh.rotation.z = elapsedTime * item.speed;
        } else if (item.type === 'BOB_PULSE') {
          const scale = 1 + Math.sin(elapsedTime * 3) * 0.12;
          item.mesh.scale.set(scale, scale, scale);
        } else if (item.type === 'BOB_PULSE_RING') {
          const scale = 1 + Math.sin(elapsedTime * item.speed) * 0.14;
          item.mesh.scale.set(scale, scale, 1);
          if (item.mesh.material) {
            item.mesh.material.opacity = 0.65 + Math.sin(elapsedTime * item.speed) * 0.25;
          }
        } else if (item.type === 'WATER_WAVE') {
          item.mesh.position.y = item.baseY + Math.sin(elapsedTime * item.freq + item.phase) * 0.032;
        } else if (item.type === 'WATER_RIPPLE') {
          const progress = (elapsedTime * item.speed + item.phase) % 1;
          const scale = item.baseScale + progress * (item.maxScale - item.baseScale);
          item.mesh.scale.set(scale, scale, 1);
          if (item.mesh.material) {
            item.mesh.material.opacity = (1 - progress) * 0.65;
          }
        } else if (item.type === 'FLOATING_DEBRIS') {
          item.mesh.rotation.x = elapsedTime * item.speed * 0.5;
          item.mesh.rotation.y = elapsedTime * item.speed;
          item.mesh.position.y = item.baseY + Math.sin(elapsedTime * 1.5 + item.speed) * 0.15;
        } else if (item.type === 'HALO_PULSE') {
          const pulse = 1 + Math.sin(elapsedTime * item.speed) * 0.16;
          item.mesh.scale.set(item.baseScale * pulse, item.baseScale * pulse, 1);
        } else if (item.type === 'WIND_SWAY') {
          item.mesh.rotation.z = item.baseRotZ + Math.sin(elapsedTime * item.speed + item.phase) * 0.05;
          item.mesh.rotation.x = item.baseRotX + Math.cos(elapsedTime * (item.speed * 0.8) + item.phase) * 0.03;
        } else if (item.type === 'PORTAL_SPARKS') {
          item.mesh.rotation.z = elapsedTime * item.speed;
          if (item.isActive) {
            const scale = 1 + Math.sin(elapsedTime * 6) * 0.1;
            item.mesh.scale.set(scale, scale, 1);
          }
        } else if (item.type === 'LIGHT_FLICKER') {
          item.light.intensity = item.baseIntensity + Math.sin(elapsedTime * 11 + item.phase) * 0.22;
        } else if (item.type === 'FLOATING_PAPER') {
          // FASA 1 (FPQS): Apungan helaian kertas nota/kitab berterbangan lembut
          item.mesh.position.y -= item.fallSpeed;
          item.mesh.position.x += Math.sin(elapsedTime * 1.2 + item.driftSeed) * 0.003;
          item.mesh.position.z += Math.cos(elapsedTime * 0.9 + item.driftSeed) * 0.003;
          item.mesh.rotation.x += item.rotSpeedX;
          item.mesh.rotation.y += item.rotSpeedY;
          item.mesh.rotation.z += item.rotSpeedZ;

          if (item.mesh.position.y < 0.15) {
            item.mesh.position.y = 3.6 + Math.random() * 0.6;
            item.mesh.position.x = (Math.random() - 0.5) * (GRID_COLS * TILE_SIZE + 2);
            item.mesh.position.z = (Math.random() - 0.5) * (GRID_ROWS * TILE_SIZE + 2);
          }
        } else if (item.type === 'COFFEE_STEAM') {
          // FASA 1 (FPQS): Partikel wap panas berolak naik dari cawan kopi Kafe Didi
          const steamProgress = (elapsedTime * item.speed + item.offsetY) % 1;
          item.mesh.position.y = item.baseY + steamProgress * 0.35;
          const wobble = Math.sin(elapsedTime * 4 + item.offsetY * 10) * 0.025;
          item.mesh.position.x = item.baseX + wobble;
          const s = 0.8 + steamProgress * 1.6;
          item.mesh.scale.set(s, s, s);
          if (item.mesh.material) {
            item.mesh.material.opacity = Math.max(0, (1 - steamProgress) * 0.65);
          }
        } else if (item.type === 'EQUALIZER_BAR') {
          // FASA 2 (FPQS): Denyutan gelombang bunyi audio Makmal Tarannum
          const barScaleY = 0.35 + Math.abs(Math.sin(elapsedTime * item.freq + item.phase)) * 0.85;
          item.mesh.scale.set(1, barScaleY, 1);
        } else if (item.type === 'HOLOGRAM_PULSE') {
          // FASA 2 (FPQS): Putaran & denyutan hologram pelayan digital Makmal Hadis
          item.mesh.rotation.y = elapsedTime * 1.6;
          item.mesh.rotation.x = Math.sin(elapsedTime * 0.9) * 0.25;
          const scale = 1 + Math.sin(elapsedTime * 2.8) * 0.12;
          item.mesh.scale.set(scale, scale, scale);
        } else if (item.type === 'BRAILLE_NEON_PULSE') {
          // FASA 2 (FPQS): Kelipan titik Braille bercahaya neon Makmal Braille
          if (item.mesh.material) {
            item.mesh.material.emissiveIntensity =
              item.baseIntensity + Math.sin(elapsedTime * item.speed + item.phase) * 0.9;
          }
        }
      });

      // B. Apungan Zarah Kelip-kelip (Motes Float)
      if (firefliesMeshRef.current) {
        firefliesMeshRef.current.rotation.y = elapsedTime * 0.05;
      }

      // B2. FASA 2: Putaran Perlahan Bintang Angkasa & Kelipan Berirama (Twinkling Stars)
      if (starsPointsRef.current) {
        const { points, material } = starsPointsRef.current;
        points.rotation.y = elapsedTime * 0.006;
        material.opacity = 0.72 + Math.sin(elapsedTime * 2.4) * 0.22;
        material.size = 0.15 + Math.sin(elapsedTime * 1.7) * 0.03;
      }

      // C. Pergerakan Watak Pengembara (Linear Interpolation & Parabolic Hop)
      if (playerGroupRef.current) {
        const anim = playerAnimStateRef.current;
        anim.currentX += (anim.targetX - anim.currentX) * 0.18;
        anim.currentZ += (anim.targetZ - anim.currentZ) * 0.18;

        if (anim.jumpProgress < 1) {
          anim.jumpProgress = Math.min(1, anim.jumpProgress + 0.08);
        }
        const jumpY = Math.sin(anim.jumpProgress * Math.PI) * 0.3;

        playerGroupRef.current.position.x = anim.currentX;
        playerGroupRef.current.position.z = anim.currentZ;
        playerGroupRef.current.position.y = 0.15 + jumpY;

        // C2. FASA 3: Kemas kini Zarah Debu Langkah Kaki Pengembara (Footstep Dust)
        const deltaDust = 0.016;
        for (let i = footstepParticlesRef.current.length - 1; i >= 0; i--) {
          const p = footstepParticlesRef.current[i];
          p.life += deltaDust;
          p.mesh.position.x += p.vx;
          p.mesh.position.y += p.vy;
          p.mesh.position.z += p.vz;
          p.vy -= 0.0016;

          const progress = p.life / p.maxLife;
          if (progress >= 1) {
            scene.remove(p.mesh);
            p.geo.dispose();
            p.mat.dispose();
            footstepParticlesRef.current.splice(i, 1);
          } else {
            const s = Math.max(0.001, 1 - progress);
            p.mesh.scale.set(s, s, s);
            p.mat.opacity = (1 - progress) * 0.85;
          }
        }

        // D. KAMERA SINEMATIK MENGEKORI WATAK SECARA LEMBUT (camera.position.lerp)
        const isEncounter = isEncounterActiveRef.current;
        const orbit = orbitOffsetRef.current;
        orbit.angleX += (orbit.targetAngleX - orbit.angleX) * 0.08;
        orbit.angleY += (orbit.targetAngleY - orbit.angleY) * 0.08;

        // FASA 2: Sudut Kamera Zoom Sinematik Apabila Dialog NPC Terbuka
        const baseCamHeight = isEncounter ? 3.4 : 7.2;
        const baseCamDistance = isEncounter ? 4.3 : 7.6;
        const targetLookY = isEncounter ? 1.05 : 0.45;
        const lerpFactor = isEncounter ? 0.06 : 0.08;

        const camHeight = baseCamHeight + orbit.angleY * (isEncounter ? 1.0 : 2.0);
        const camDistance = baseCamDistance;
        const orbitCos = Math.cos(orbit.angleX);
        const orbitSin = Math.sin(orbit.angleX);

        const targetCamX = anim.currentX + camDistance * orbitSin;
        const targetCamY = 0.15 + camHeight;
        const targetCamZ = anim.currentZ + camDistance * orbitCos;

        camera.position.x += (targetCamX - camera.position.x) * lerpFactor;
        camera.position.y += (targetCamY - camera.position.y) * lerpFactor;
        camera.position.z += (targetCamZ - camera.position.z) * lerpFactor;

        // Pandang lembut ke paras muka watak & kubah Menara NPC
        const look = cameraTargetLookRef.current;
        look.x += (anim.currentX - look.x) * 0.1;
        look.y += (targetLookY - look.y) * 0.08;
        look.z += (anim.currentZ - look.z) * 0.1;
        camera.lookAt(look);

        // Sinaran Matahari mengekori watak
        if (sunLightRef.current) {
          sunLightRef.current.position.x = anim.currentX + 10;
          sunLightRef.current.position.z = anim.currentZ + 8;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 10. Kawalan Sentuh & Klik 3D Interaktif (Raycasting)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e) => {
      isPointerDownRef.current = true;
      hasDraggedRef.current = false;
      pointerStartPosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e) => {
      if (!isPointerDownRef.current) return;
      const dx = e.clientX - pointerStartPosRef.current.x;
      const dy = e.clientY - pointerStartPosRef.current.y;

      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        hasDraggedRef.current = true;
        orbitOffsetRef.current.targetAngleX = Math.max(-0.45, Math.min(0.45, dx * 0.005));
        orbitOffsetRef.current.targetAngleY = Math.max(-0.25, Math.min(0.25, dy * 0.004));
      }
    };

    const handlePointerUp = (e) => {
      if (!isPointerDownRef.current) return;
      isPointerDownRef.current = false;

      orbitOffsetRef.current.targetAngleX = 0;
      orbitOffsetRef.current.targetAngleY = 0;

      if (!hasDraggedRef.current && onTileClick && cameraRef.current) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, cameraRef.current);
        const intersects = raycaster.intersectObjects(clickableMeshesRef.current, true);

        if (intersects.length > 0) {
          let hitMesh = intersects[0].object;
          while (hitMesh && typeof hitMesh.userData?.r !== 'number' && hitMesh.parent) {
            hitMesh = hitMesh.parent;
          }

          if (hitMesh && typeof hitMesh.userData?.r === 'number') {
            const { r, c } = hitMesh.userData;
            onTileClick(r, c);
          }
        }
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // 11. Responsif Saiz Skrin
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || 680;
      const newHeight = Math.min(540, Math.max(390, newWidth * 0.64));
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // 12. Cleanup Memori
    return () => {
      domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('resize', handleResize);

      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      footstepParticlesRef.current.forEach((p) => {
        p.geo.dispose();
        p.mat.dispose();
      });
      footstepParticlesRef.current = [];
      disposableTextures.forEach((tex) => tex.dispose());
      renderer.dispose();
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, [
    mapGrid,
    wilayahIdx,
    mapSeed,
    solvedNpcIds,
    bossNpcId,
    isBossUnlocked,
    isWilayahCompleted,
    getTileWorldPos,
    onTileClick,
  ]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '680px',
        margin: '0 auto',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow:
          '0 20px 48px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        background: 'linear-gradient(180deg, #091222 0%, #030712 100%)',
      }}
    >
      {/* Kanvas 3D Three.js */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '430px',
          display: 'block',
          cursor: 'grab',
          touchAction: 'none',
        }}
        title="Sentuh atau klik mana-mana petak 3D untuk melangkah atau menyapa NPC!"
      />

      {/* Bar Panduan Sentuh 3D di Bawah Kanvas (Kemasan Bersih Tanpa Koordinat Teknikal) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '8px 14px',
          background: 'rgba(8, 14, 32, 0.88)',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          fontSize: '0.74rem',
          lineHeight: 1.4,
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.88)',
        }}
      >
        <span>👆 Sentuh petak 3D untuk melangkah • Seret untuk tinjau pulau</span>
      </div>
    </div>
  );
}
