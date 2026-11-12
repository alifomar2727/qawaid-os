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

// Tema Warna Mengikut Wilayah & Atmosfera Sinematik
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
  },
};

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

export default function ThreeWorldMap({
  mapGrid,
  playerPos,
  facing = 'RIGHT',
  wilayahIdx = 0,
  mapSeed = 1,
  solvedNpcIds = [],
  onTileClick,
}) {
  const containerRef = useRef(null);
  const animFrameIdRef = useRef(null);

  // References Three.js
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const sunLightRef = useRef(null);
  const playerGroupRef = useRef(null);

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
      : 'ANDALUSIA';
  const palette = BIOME_PALETTES[biomeKey] || BIOME_PALETTES.BAGHDAD;

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
    const target = getTileWorldPos(playerPos.r, playerPos.c);
    if (playerAnimStateRef.current) {
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
    scene.background = new THREE.Color(palette.fogColor);
    scene.fog = new THREE.FogExp2(palette.fogColor, 0.025);

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

    // 4. Pencahayaan Sinematik (Ambient, Directional with Shadows, Fill)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(palette.lightColor, 1.45);
    sunLightRef.current = sunLight;
    sunLight.position.set(initialPos.x + 10, 16, initialPos.z + 8);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 38;
    sunLight.shadow.camera.left = -9;
    sunLight.shadow.camera.right = 9;
    sunLight.shadow.camera.top = 7;
    sunLight.shadow.camera.bottom = -7;
    sunLight.shadow.bias = -0.0006;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.42);
    fillLight.position.set(-10, 8, -8);
    scene.add(fillLight);

    // 5. Tapak Pulau 3D Berketebalan (Low-Poly Floating Diorama Island Plinth)
    const islandWidth = GRID_COLS * TILE_SIZE + 0.85;
    const islandDepth = GRID_ROWS * TILE_SIZE + 0.85;
    const plinthGeo = new THREE.BoxGeometry(islandWidth, 1.15, islandDepth);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: palette.cliff,
      roughness: 0.88,
      metalness: 0.08,
      flatShading: true,
    });
    const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
    plinthMesh.position.set(0, -0.68, 0);
    plinthMesh.receiveShadow = true;
    scene.add(plinthMesh);

    // Rim Emas / Cahaya Tepi Pulau
    const rimGeo = new THREE.BoxGeometry(islandWidth + 0.06, 0.07, islandDepth + 0.06);
    const rimMat = new THREE.MeshStandardMaterial({
      color: palette.accentGlow,
      emissive: palette.accentGlow,
      emissiveIntensity: 0.45,
      roughness: 0.4,
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.set(0, -0.08, 0);
    scene.add(rimMesh);

    // 6. Prosedural Low-Poly Meshes untuk Setiap Petak
    animatedMeshesRef.current = [];
    clickableMeshesRef.current = [];

    const floorMatA = new THREE.MeshStandardMaterial({
      color: palette.ground,
      roughness: 0.72,
      flatShading: true,
    });
    const floorMatB = new THREE.MeshStandardMaterial({
      color: palette.groundAccent,
      roughness: 0.72,
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

    const tileBoxGeo = new THREE.BoxGeometry(TILE_SIZE - 0.03, 0.28, TILE_SIZE - 0.03);

    // Pembantu bina pokok kurma low-poly untuk Oasis
    const buildMiniPalmTree = (scale = 1, tiltZ = 0.15) => {
      const palm = new THREE.Group();
      const pTrunkGeo = new THREE.CylinderGeometry(0.035 * scale, 0.065 * scale, 0.46 * scale, 5);
      const pTrunk = new THREE.Mesh(pTrunkGeo, trunkMat);
      pTrunk.position.set(0, 0.23 * scale, 0);
      pTrunk.rotation.z = tiltZ;
      pTrunk.castShadow = true;
      palm.add(pTrunk);

      const topX = -Math.sin(tiltZ) * 0.22 * scale;
      const topY = 0.45 * scale;

      // Gugusan daun pelepah kurma di puncak
      for (let f = 0; f < 5; f++) {
        const angle = (f / 5) * Math.PI * 2;
        const frondGeo = new THREE.ConeGeometry(0.08 * scale, 0.26 * scale, 4);
        const frond = new THREE.Mesh(frondGeo, palmLeafMat);
        frond.position.set(
          topX + Math.cos(angle) * 0.11 * scale,
          topY,
          Math.sin(angle) * 0.11 * scale
        );
        frond.rotation.z = -Math.cos(angle) * 1.1;
        frond.rotation.x = Math.sin(angle) * 1.1;
        frond.castShadow = true;
        palm.add(frond);
      }
      return palm;
    };

    mapGrid.forEach((row, rIdx) => {
      row.forEach((tile, cIdx) => {
        const { x, z } = getTileWorldPos(rIdx, cIdx);

        // A. Jubin Muka Bumi Asas (Seamless Undulating Terrain)
        const isAlternate = (rIdx + cIdx) % 2 === 0;
        let groundY = 0.05;
        let mat = isAlternate ? floorMatA : floorMatB;

        if (tile.type === 'WATER' || tile.type === 'OASIS') {
          groundY = -0.08;
          mat = waterMat;
        } else if (tile.type === 'WALL') {
          groundY = 0.18;
          mat = rockMat;
        }

        const tileMesh = new THREE.Mesh(tileBoxGeo, mat);
        tileMesh.position.set(x, groundY, z);
        tileMesh.receiveShadow = true;
        tileMesh.castShadow = tile.type === 'WALL';

        tileMesh.userData = { r: rIdx, c: cIdx, type: tile.type, tileData: tile };
        clickableMeshesRef.current.push(tileMesh);
        scene.add(tileMesh);

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
          rockGroup.add(subRock);

          rockGroup.position.set(x, 0.1, z);
          rockGroup.userData = { r: rIdx, c: cIdx, type: tile.type };
          clickableMeshesRef.current.push(mainRock, subRock);
          scene.add(rockGroup);
        }

        // 2. KOLAM OASIS HIKMAH (Air Biru Berkilat + 2 Pokok Kurma Low-Poly + Kristal)
        else if (tile.type === 'OASIS') {
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
          oasisGroup.add(basin);

          // Permukaan Air Biru Firus Berkilat
          const oasisWaterGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.14, 8);
          const oasisWater = new THREE.Mesh(oasisWaterGeo, waterMat);
          oasisWater.position.set(0, 0.07, 0);
          oasisGroup.add(oasisWater);

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
          oasisGroup.add(dropMesh);

          // Pokok Kurma Low-Poly #1 & #2 di Tepi Kolam Oasis
          const palm1 = buildMiniPalmTree(1.0, 0.18);
          palm1.position.set(-0.34, 0.05, -0.24);
          oasisGroup.add(palm1);

          const palm2 = buildMiniPalmTree(0.78, -0.16);
          palm2.position.set(0.35, 0.05, -0.20);
          oasisGroup.add(palm2);

          const oasisLight = new THREE.PointLight(0x38bdf8, 1.5, 3.2, 2);
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

        // 3. POKOK & TUMBUHAN BIASA (Flora Low-Poly)
        else if (tile.decor) {
          const treeGroup = new THREE.Group();

          const trunkGeo = new THREE.CylinderGeometry(0.06, 0.09, 0.38, 5);
          const trunk = new THREE.Mesh(trunkGeo, trunkMat);
          trunk.position.set(0, 0.22, 0);
          trunk.castShadow = true;
          treeGroup.add(trunk);

          const leafGeo = new THREE.IcosahedronGeometry(0.32, 0);
          const leaves = new THREE.Mesh(leafGeo, floraMat);
          leaves.position.set(0, 0.48, 0);
          leaves.rotation.y = rIdx * 1.5 + cIdx;
          leaves.castShadow = true;
          treeGroup.add(leaves);

          treeGroup.position.set(x, 0, z);
          scene.add(treeGroup);
        }

        // 4. STRUKTUR MENARA KUBAH / MISI NPC (Bangunan Mini 3D Jelas + Label Nama NPC)
        else if (tile.type === 'NPC' && tile.npc) {
          const isSolved = solvedNpcIds.includes(tile.npc.npcId);
          const npcGroup = new THREE.Group();

          // Tapak Marmar Putih Bersegi (BoxGeometry)
          const baseGeo = new THREE.BoxGeometry(0.82, 0.16, 0.82);
          const monumentBase = new THREE.Mesh(baseGeo, whiteMarbleMat);
          monumentBase.position.set(0, 0.14, 0);
          monumentBase.receiveShadow = true;
          monumentBase.castShadow = true;
          npcGroup.add(monumentBase);

          // Badan Bangunan Putih/Krem Bersegi
          const bodyGeo = new THREE.BoxGeometry(0.58, 0.46, 0.58);
          const monumentBody = new THREE.Mesh(bodyGeo, creamWallMat);
          monumentBody.position.set(0, 0.45, 0);
          monumentBody.castShadow = true;
          monumentBody.receiveShadow = true;
          npcGroup.add(monumentBody);

          // Pintu Gerbang Kecil di Hadapan Bangunan
          const doorGeo = new THREE.BoxGeometry(0.22, 0.30, 0.60);
          const doorMesh = new THREE.Mesh(doorGeo, darkDoorMat);
          doorMesh.position.set(0, 0.37, 0);
          npcGroup.add(doorMesh);

          // Bingkai Bumbung Emas (Cornice)
          const corniceGeo = new THREE.BoxGeometry(0.65, 0.06, 0.65);
          const corniceMesh = new THREE.Mesh(corniceGeo, goldMat);
          corniceMesh.position.set(0, 0.70, 0);
          npcGroup.add(corniceMesh);

          // Kubah Emas Besar di Atas (SphereGeometry Separuh)
          const domeGeo = new THREE.SphereGeometry(0.32, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
          const dome = new THREE.Mesh(domeGeo, goldMat);
          dome.position.set(0, 0.72, 0);
          dome.castShadow = true;
          npcGroup.add(dome);

          // Kristal Berlian (OctahedronGeometry) Terapung Tinggi di Atas Kubah
          const crystalGeo = new THREE.OctahedronGeometry(0.21, 0);
          const crystalMat = new THREE.MeshStandardMaterial({
            color: isSolved ? 0x10b981 : 0xf59e0b,
            emissive: isSolved ? 0x059669 : 0xd97706,
            emissiveIntensity: 1.0,
            roughness: 0.2,
            flatShading: true,
          });
          const crystal = new THREE.Mesh(crystalGeo, crystalMat);
          crystal.position.set(0, 1.28, 0);
          npcGroup.add(crystal);

          // PointLight Emas / Hijau
          const npcLight = new THREE.PointLight(
            isSolved ? 0x10b981 : 0xfbbf24,
            isSolved ? 1.5 : 2.6,
            3.8,
            1.8
          );
          npcLight.position.set(0, 1.2, 0);
          npcGroup.add(npcLight);

          // Label Terapung Nama NPC / Nombor Misi (THREE.Sprite CanvasTexture)
          const questNum = tile.npc.npcId ? tile.npc.npcId.split('-').pop() : '';
          const shortName = tile.npc.nama.split(' ').slice(0, 2).join(' ');
          const labelText = isSolved
            ? `✓ ${shortName}`
            : `Misi #${questNum}: ${shortName}`;

          const { sprite: npcLabel, texture: npcTex } = createFloatingLabelSprite(labelText, {
            bgColor: 'rgba(8, 14, 32, 0.9)',
            borderColor: isSolved ? '#10b981' : '#fbbf24',
            textColor: isSolved ? '#a7f3d0' : '#fef08a',
            scaleX: 1.48,
            scaleY: 0.36,
          });
          disposableTextures.push(npcTex);
          npcLabel.position.set(0, 1.72, 0);
          npcGroup.add(npcLabel);

          animatedMeshesRef.current.push({
            mesh: crystal,
            baseY: 1.28,
            speed: 1.8,
            type: 'BOB_AND_SPIN',
          });

          npcGroup.position.set(x, 0, z);
          npcGroup.userData = { r: rIdx, c: cIdx, type: tile.type, npc: tile.npc };
          clickableMeshesRef.current.push(monumentBase, monumentBody, dome, crystal);
          scene.add(npcGroup);
        }

        // 5. GERBANG PORTAL 3D
        else if (tile.type === 'PORTAL') {
          const portalGroup = new THREE.Group();

          const pBaseGeo = new THREE.CylinderGeometry(0.44, 0.5, 0.15, 8);
          const pBase = new THREE.Mesh(pBaseGeo, plinthMat);
          pBase.position.set(0, 0.1, 0);
          portalGroup.add(pBase);

          const ringGeo = new THREE.TorusGeometry(0.55, 0.09, 8, 24);
          const portalRing = new THREE.Mesh(ringGeo, portalMat);
          portalRing.position.set(0, 0.72, 0);
          portalGroup.add(portalRing);

          const coreGeo = new THREE.SphereGeometry(0.22, 8, 8);
          const coreMat = new THREE.MeshStandardMaterial({
            color: 0xc084fc,
            emissive: 0xa855f7,
            emissiveIntensity: 1.25,
            roughness: 0.1,
          });
          const portalCore = new THREE.Mesh(coreGeo, coreMat);
          portalCore.position.set(0, 0.72, 0);
          portalGroup.add(portalCore);

          const portalLight = new THREE.PointLight(0xa855f7, 2.8, 4.4, 1.6);
          portalLight.position.set(0, 0.75, 0);
          portalGroup.add(portalLight);

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

          portalGroup.position.set(x, 0, z);
          portalGroup.userData = { r: rIdx, c: cIdx, type: tile.type };
          clickableMeshesRef.current.push(pBase, portalRing, portalCore);
          scene.add(portalGroup);
        }
      });
    });

    // 7. ZARAH KELIP-KELIP ATMOSFERA (Atmospheric Glowing Motes)
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
    bodyPivot.add(turbanWrap);

    const turbanCrownGeo = new THREE.SphereGeometry(0.15, 10, 8);
    const turbanCrown = new THREE.Mesh(turbanCrownGeo, pearlWhiteMat);
    turbanCrown.position.set(0, 0.93, 0);
    bodyPivot.add(turbanCrown);

    // Pita Emas Kecil pada Serban
    const turbanBandGeo = new THREE.TorusGeometry(0.178, 0.02, 6, 16);
    const turbanBand = new THREE.Mesh(turbanBandGeo, goldMat);
    turbanBand.rotation.x = Math.PI * 0.48;
    turbanBand.position.set(0, 0.85, 0);
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
        }
      });

      // B. Apungan Zarah Kelip-kelip (Motes Float)
      if (firefliesMeshRef.current) {
        firefliesMeshRef.current.rotation.y = elapsedTime * 0.05;
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

        // D. KAMERA SINEMATIK MENGEKORI WATAK SECARA LEMBUT (camera.position.lerp)
        const orbit = orbitOffsetRef.current;
        orbit.angleX += (orbit.targetAngleX - orbit.angleX) * 0.08;
        orbit.angleY += (orbit.targetAngleY - orbit.angleY) * 0.08;

        const camHeight = 7.2 + orbit.angleY * 2.0;
        const camDistance = 7.6;
        const orbitCos = Math.cos(orbit.angleX);
        const orbitSin = Math.sin(orbit.angleX);

        const targetCamX = anim.currentX + camDistance * orbitSin;
        const targetCamY = 0.15 + camHeight;
        const targetCamZ = anim.currentZ + camDistance * orbitCos;

        camera.position.x += (targetCamX - camera.position.x) * 0.08;
        camera.position.y += (targetCamY - camera.position.y) * 0.08;
        camera.position.z += (targetCamZ - camera.position.z) * 0.08;

        // Pandang lembut ke paras dada watak
        const look = cameraTargetLookRef.current;
        look.x += (anim.currentX - look.x) * 0.1;
        look.y += (0.45 - look.y) * 0.1;
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
      disposableTextures.forEach((tex) => tex.dispose());
      renderer.dispose();
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, [mapGrid, wilayahIdx, mapSeed, solvedNpcIds, getTileWorldPos, onTileClick]);

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

      {/* Lencana Bioma Aktif (HUD Atas Kiri) */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '999px',
          background: 'rgba(8, 14, 32, 0.72)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          fontSize: '0.72rem',
          fontWeight: 600,
          color: '#ffffff',
          pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: palette.accentGlow ? `#${palette.accentGlow.toString(16)}` : '#10b981',
            boxShadow: '0 0 8px currentColor',
          }}
        />
        <span>Low-Poly 3D Diorama Island</span>
      </div>

      {/* Bar Maklumat Navigasi Sentuh & Koordinat Pemain (Susunan Flex Responsif Tanpa Terpotong) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '6px 12px',
          padding: '9px 14px',
          background: 'rgba(8, 14, 32, 0.88)',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          fontSize: '0.75rem',
          lineHeight: 1.4,
        }}
      >
        <div
          style={{
            color: 'rgba(255, 255, 255, 0.88)',
            whiteSpace: 'normal',
            overflow: 'visible',
          }}
        >
          👆 Sentuh petak 3D untuk gerak / seret untuk tinjau
        </div>

        <div
          style={{
            padding: '3px 9px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            color: '#38bdf8',
            fontWeight: 700,
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            flexShrink: 0,
          }}
        >
          Posisi: ({playerPos.c + 1}, {playerPos.r + 1})
        </div>
      </div>
    </div>
  );
}
