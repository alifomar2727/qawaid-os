import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

/* =========================================================================
   THREE.JS 3D LOW-POLY DIORAMA ISLAND (Kembara Qawaid — FASA 2)
   - Kamera Sinematik Mengekori Watak (camera.position.lerp)
   - Sudut Pandang Dekat & Dramatik (Monument Valley / Bad North Style)
   - Pencahayaan Studio Sebenar, Bayang-bayang Lembut & Kabus Atmosfera
   - Kawalan Sentuh & Klik 3D Interaktif (THREE.Raycaster)
   - Zarah Debu Bercahaya / Kelip-kelip (Atmospheric Motes)
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

  const animatedMeshesRef = useRef([]); // NPC crystals, portals, water
  const clickableMeshesRef = useRef([]); // Meshes untuk Raycaster
  const firefliesMeshRef = useRef(null); // Zarah zarah kelip-kelip

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

    // Pusingan hadapan watak
    if (playerGroupRef.current) {
      if (facing === 'LEFT') playerGroupRef.current.rotation.y = -Math.PI * 0.5;
      else if (facing === 'RIGHT') playerGroupRef.current.rotation.y = Math.PI * 0.5;
      else if (facing === 'UP') playerGroupRef.current.rotation.y = Math.PI;
      else if (facing === 'DOWN') playerGroupRef.current.rotation.y = 0;
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.88);
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

    const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.4);
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
      opacity: 0.9,
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
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x5c3317,
      roughness: 0.9,
      flatShading: true,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.6,
    });
    const portalMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x9333ea,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.3,
    });

    const tileBoxGeo = new THREE.BoxGeometry(TILE_SIZE - 0.03, 0.28, TILE_SIZE - 0.03);

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

        // Simpan metadata untuk Raycasting (Klik Sentuh)
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
          subRock.rotation.y = (cIdx * 1.2);
          subRock.castShadow = true;
          rockGroup.add(subRock);

          rockGroup.position.set(x, 0.1, z);
          rockGroup.userData = { r: rIdx, c: cIdx, type: tile.type };
          clickableMeshesRef.current.push(mainRock, subRock);
          scene.add(rockGroup);
        }

        // 2. OASIS HIKMAH
        else if (tile.type === 'OASIS') {
          const oasisGroup = new THREE.Group();

          const basinGeo = new THREE.CylinderGeometry(0.48, 0.52, 0.12, 8);
          const basinMat = new THREE.MeshStandardMaterial({ color: palette.cliff, roughness: 0.85, flatShading: true });
          const basin = new THREE.Mesh(basinGeo, basinMat);
          basin.position.set(0, 0.04, 0);
          oasisGroup.add(basin);

          const oasisWaterGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.14, 8);
          const oasisWater = new THREE.Mesh(oasisWaterGeo, waterMat);
          oasisWater.position.set(0, 0.07, 0);
          oasisGroup.add(oasisWater);

          const pillarGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.35, 6);
          const pillar = new THREE.Mesh(pillarGeo, goldMat);
          pillar.position.set(0, 0.22, 0);
          oasisGroup.add(pillar);

          const dropGeo = new THREE.OctahedronGeometry(0.13, 0);
          const dropMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            emissive: 0x0284c7,
            emissiveIntensity: 0.95,
            roughness: 0.1,
          });
          const dropMesh = new THREE.Mesh(dropGeo, dropMat);
          dropMesh.position.set(0, 0.5, 0);
          oasisGroup.add(dropMesh);

          const oasisLight = new THREE.PointLight(0x38bdf8, 1.4, 3.2, 2);
          oasisLight.position.set(0, 0.55, 0);
          oasisGroup.add(oasisLight);

          animatedMeshesRef.current.push({
            mesh: dropMesh,
            baseY: 0.5,
            speed: 2.2,
            type: 'BOB_AND_SPIN',
          });

          oasisGroup.position.set(x, 0, z);
          oasisGroup.userData = { r: rIdx, c: cIdx, type: tile.type };
          clickableMeshesRef.current.push(basin, dropMesh);
          scene.add(oasisGroup);
        }

        // 3. POKOK & TUMBUHAN (Flora Low-Poly)
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
          leaves.rotation.y = (rIdx * 1.5 + cIdx);
          leaves.castShadow = true;
          treeGroup.add(leaves);

          treeGroup.position.set(x, 0, z);
          scene.add(treeGroup);
        }

        // 4. LOKASI MISI NPC (Monumen Menara Kubah 3D)
        else if (tile.type === 'NPC' && tile.npc) {
          const isSolved = solvedNpcIds.includes(tile.npc.npcId);
          const npcGroup = new THREE.Group();

          const baseGeo = new THREE.CylinderGeometry(0.38, 0.44, 0.18, 6);
          const monumentBase = new THREE.Mesh(baseGeo, plinthMat);
          monumentBase.position.set(0, 0.12, 0);
          monumentBase.receiveShadow = true;
          npcGroup.add(monumentBase);

          const colGeo = new THREE.CylinderGeometry(0.2, 0.24, 0.42, 6);
          const monumentCol = new THREE.Mesh(colGeo, floorMatA);
          monumentCol.position.set(0, 0.38, 0);
          monumentCol.castShadow = true;
          npcGroup.add(monumentCol);

          const domeGeo = new THREE.SphereGeometry(0.26, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5);
          const dome = new THREE.Mesh(domeGeo, goldMat);
          dome.position.set(0, 0.59, 0);
          dome.castShadow = true;
          npcGroup.add(dome);

          const crystalGeo = new THREE.OctahedronGeometry(0.19, 0);
          const crystalMat = new THREE.MeshStandardMaterial({
            color: isSolved ? 0x10b981 : 0xf59e0b,
            emissive: isSolved ? 0x059669 : 0xd97706,
            emissiveIntensity: 0.95,
            roughness: 0.25,
            flatShading: true,
          });
          const crystal = new THREE.Mesh(crystalGeo, crystalMat);
          crystal.position.set(0, 1.05, 0);
          npcGroup.add(crystal);

          const npcLight = new THREE.PointLight(
            isSolved ? 0x10b981 : 0xfbbf24,
            isSolved ? 1.4 : 2.5,
            3.8,
            1.8
          );
          npcLight.position.set(0, 1.1, 0);
          npcGroup.add(npcLight);

          animatedMeshesRef.current.push({
            mesh: crystal,
            baseY: 1.05,
            speed: 1.8,
            type: 'BOB_AND_SPIN',
          });

          npcGroup.position.set(x, 0, z);
          npcGroup.userData = { r: rIdx, c: cIdx, type: tile.type, npc: tile.npc };
          clickableMeshesRef.current.push(monumentBase, monumentCol, dome, crystal);
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

    // 8. WATAK PENGEMBARA 3D (Pion / Figur Pengembara Rendah-Poli)
    const playerGroup = new THREE.Group();
    playerGroupRef.current = playerGroup;

    const robeGeo = new THREE.ConeGeometry(0.3, 0.65, 7);
    const robeMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      roughness: 0.5,
      flatShading: true,
    });
    const robe = new THREE.Mesh(robeGeo, robeMat);
    robe.position.set(0, 0.35, 0);
    robe.castShadow = true;
    playerGroup.add(robe);

    const headGeo = new THREE.SphereGeometry(0.16, 8, 8);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.7,
      flatShading: true,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 0.76, 0);
    head.castShadow = true;
    playerGroup.add(head);

    const turbanGeo = new THREE.TorusGeometry(0.16, 0.05, 6, 12);
    const turban = new THREE.Mesh(turbanGeo, goldMat);
    turban.rotation.x = Math.PI * 0.5;
    turban.position.set(0, 0.82, 0);
    playerGroup.add(turban);

    const staffGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.85, 5);
    const staff = new THREE.Mesh(staffGeo, trunkMat);
    staff.position.set(0.3, 0.42, 0.12);
    staff.rotation.z = -0.15;
    staff.castShadow = true;
    playerGroup.add(staff);

    const lanternGeo = new THREE.SphereGeometry(0.07, 6, 6);
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfacc15,
      emissiveIntensity: 1.6,
    });
    const lantern = new THREE.Mesh(lanternGeo, lanternMat);
    lantern.position.set(0.36, 0.84, 0.12);
    playerGroup.add(lantern);

    const staffLight = new THREE.PointLight(0xfef08a, 1.4, 2.5, 2);
    staffLight.position.set(0.36, 0.84, 0.12);
    playerGroup.add(staffLight);

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

      // A. Putaran Objek Animasi (NPC Crystal, Portal)
      animatedMeshesRef.current.forEach((item) => {
        if (item.type === 'BOB_AND_SPIN') {
          item.mesh.rotation.y = elapsedTime * item.speed;
          item.mesh.position.y = item.baseY + Math.sin(elapsedTime * 2.8) * 0.08;
        } else if (item.type === 'SPIN_Z') {
          item.mesh.rotation.z = elapsedTime * item.speed;
        } else if (item.type === 'BOB_PULSE') {
          const scale = 1 + Math.sin(elapsedTime * 3) * 0.12;
          item.mesh.scale.set(scale, scale, scale);
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
        // Sudut dekat & dramatik ala Monument Valley / Bad North
        const orbit = orbitOffsetRef.current;
        orbit.angleX += (orbit.targetAngleX - orbit.angleX) * 0.08;
        orbit.angleY += (orbit.targetAngleY - orbit.angleY) * 0.08;

        const camHeight = 7.2 + orbit.angleY * 2.0;
        const camDistance = 7.6;
        const orbitCos = Math.cos(orbit.angleX);
        const orbitSin = Math.sin(orbit.angleX);

        const targetCamX = anim.currentX + camDistance * orbitSin;
        const targetCamY = anim.currentY || 0.15 + camHeight;
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
        // Pusingan sudut orbit halus
        orbitOffsetRef.current.targetAngleX = Math.max(-0.45, Math.min(0.45, dx * 0.005));
        orbitOffsetRef.current.targetAngleY = Math.max(-0.25, Math.min(0.25, dy * 0.004));
      }
    };

    const handlePointerUp = (e) => {
      if (!isPointerDownRef.current) return;
      isPointerDownRef.current = false;

      // Kembali ke sudut asal apabila dilepaskan
      orbitOffsetRef.current.targetAngleX = 0;
      orbitOffsetRef.current.targetAngleY = 0;

      // Jika bukan drag, maka ia adalah KLIK / SENTUHAN pada petak 3D!
      if (!hasDraggedRef.current && onTileClick && cameraRef.current) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, cameraRef.current);
        const intersects = raycaster.intersectObjects(clickableMeshesRef.current, true);

        if (intersects.length > 0) {
          // Cari elemen yang ada data koordinat grid
          let hitMesh = intersects[0].object;
          while (hitMesh && !hitMesh.userData?.r && hitMesh.parent) {
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

      {/* Maklumat Navigasi Sentuh 3D (HUD Bawah Kiri) */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '14px',
          padding: '4px 10px',
          borderRadius: '8px',
          background: 'rgba(8, 14, 32, 0.65)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          fontSize: '0.66rem',
          color: 'rgba(255, 255, 255, 0.75)',
          pointerEvents: 'none',
        }}
      >
        👆 Sentuh petak 3D untuk gerak / seret untuk tinjau
      </div>

      {/* Maklumat Ringkas Koordinat Pemain (HUD Bawah Kanan) */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          right: '14px',
          padding: '4px 10px',
          borderRadius: '8px',
          background: 'rgba(8, 14, 32, 0.65)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          fontSize: '0.68rem',
          color: 'rgba(255, 255, 255, 0.85)',
          fontFamily: 'monospace',
          pointerEvents: 'none',
        }}
      >
        Posisi: ({playerPos.c + 1}, {playerPos.r + 1})
      </div>
    </div>
  );
}
