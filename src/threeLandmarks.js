import * as THREE from 'three';

/**
 * Shared Asset Context wrapper so landmarks reuse pooled geometries/materials/textures
 * and clean disposal is guaranteed on map change or unmount.
 */
export function createLandmarkContext({ trackGeo, trackMat, trackTex, createGlowHaloSprite, rigPool }) {
  const geoPool = new Map();
  const matPool = new Map();

  const getGeo = (key, factory) => {
    if (!geoPool.has(key)) geoPool.set(key, trackGeo(factory()));
    return geoPool.get(key);
  };

  const getMat = (key, factory) => {
    if (!matPool.has(key)) matPool.set(key, trackMat(factory()));
    return matPool.get(key);
  };

  return {
    getGeo,
    getMat,
    trackGeo,
    trackMat,
    trackTex,
    createGlowHaloSprite,
    rigPool,
  };
}

/**
 * Builds Kafe Didi (FPQS Oasis) with patio, cafe table, green USIM parasol,
 * stools, coffee cups & animated hot steam puffs.
 */
export function buildKafeDidi(ctx, animatedItems) {
  const { getGeo, getMat, rigPool, createGlowHaloSprite, trackTex, trackMat } = ctx;
  const group = new THREE.Group();

  const marbleMat = getMat('marble', () => new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 }));
  const chromeMat = getMat('chrome', () => new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 }));
  const usimGreenMat = getMat('usimGreen', () => new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.42 }));
  const coffeeMat = getMat('espresso', () => new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.15 }));

  const patio = new THREE.Mesh(getGeo('cafePatio', () => new THREE.CylinderGeometry(1.55, 1.65, 0.14, 16)), marbleMat);
  patio.position.y = 0.07;
  patio.receiveShadow = true;
  group.add(patio);

  const rim = new THREE.Mesh(getGeo('cafeRim', () => new THREE.TorusGeometry(1.58, 0.05, 8, 28)), usimGreenMat);
  rim.rotation.x = Math.PI * 0.5;
  rim.position.y = 0.14;
  group.add(rim);

  const tablePole = new THREE.Mesh(getGeo('cafePole', () => new THREE.CylinderGeometry(0.055, 0.065, 0.92, 8)), chromeMat);
  tablePole.position.y = 0.52;
  group.add(tablePole);

  const tableTop = new THREE.Mesh(getGeo('cafeTop', () => new THREE.CylinderGeometry(0.76, 0.76, 0.07, 16)), marbleMat);
  tableTop.position.y = 0.98;
  group.add(tableTop);

  // 2 Stools
  [-0.92, 0.92].forEach((sx) => {
    const leg = new THREE.Mesh(getGeo('stoolLeg', () => new THREE.CylinderGeometry(0.04, 0.04, 0.52, 6)), chromeMat);
    leg.position.set(sx, 0.36, 0);
    group.add(leg);

    const cushion = new THREE.Mesh(getGeo('stoolSeat', () => new THREE.CylinderGeometry(0.26, 0.26, 0.09, 12)), usimGreenMat);
    cushion.position.set(sx, 0.64, 0);
    group.add(cushion);
  });

  // Cafe Umbrella / Parasol
  const uPole = new THREE.Mesh(getGeo('umbPole', () => new THREE.CylinderGeometry(0.045, 0.045, 1.65, 8)), chromeMat);
  uPole.position.y = 1.72;
  group.add(uPole);

  const umbrella = new THREE.Mesh(getGeo('umbCanopy', () => new THREE.ConeGeometry(1.38, 0.56, 12)), usimGreenMat);
  umbrella.position.y = 2.58;
  group.add(umbrella);

  // 2 Coffee Cups & Hot Steam Particles
  [[-0.22, 0.12], [0.22, -0.10]].forEach(([cx, cz], idx) => {
    const cup = new THREE.Mesh(getGeo('coffeeCup', () => new THREE.CylinderGeometry(0.085, 0.065, 0.12, 8)), marbleMat);
    cup.position.set(cx, 1.08, cz);
    group.add(cup);

    const brew = new THREE.Mesh(getGeo('coffeeLiquid', () => new THREE.CylinderGeometry(0.075, 0.075, 0.02, 8)), coffeeMat);
    brew.position.set(cx, 1.135, cz);
    group.add(brew);

    if (idx === 0) {
      for (let s = 0; s < 4; s++) {
        const puff = new THREE.Mesh(
          getGeo(`steam_${s}`, () => new THREE.SphereGeometry(0.048 + s * 0.008, 6, 6)),
          trackMat(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }))
        );
        puff.position.set(cx, 1.24 + s * 0.16, cz);
        group.add(puff);
        animatedItems.push({ type: 'STEAM', mesh: puff, baseY: 1.22, offset: s * 0.24 });
      }
    }
  });

  const { sprite: warmHalo, texture: hTex, material: hMat } = createGlowHaloSprite(0xfef08a, 2.1, 0.45);
  trackTex(hTex);
  trackMat(hMat);
  warmHalo.position.y = 1.6;
  group.add(warmHalo);

  group.add(rigPool.createBlobShadow(2.5));
  return group;
}

/**
 * Builds Classical Oasis Hikmah (water basin, crystal droplet, 2 curved palm trees).
 */
export function buildClassicalOasis(ctx, animatedItems, palette) {
  const { getGeo, getMat, rigPool, createGlowHaloSprite, trackTex, trackMat } = ctx;
  const group = new THREE.Group();

  const marbleMat = getMat('marble', () => new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 }));
  const waterMat = getMat(`water_${palette.water}`, () =>
    new THREE.MeshStandardMaterial({ color: palette.water, emissive: palette.water, emissiveIntensity: 0.28, roughness: 0.15, transparent: true, opacity: 0.88 })
  );
  const cyanNeonMat = getMat('cyanNeon', () =>
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.5, roughness: 0.2 })
  );

  const rim = new THREE.Mesh(getGeo('oasisRim', () => new THREE.CylinderGeometry(1.62, 1.72, 0.22, 16)), marbleMat);
  rim.position.y = 0.11;
  rim.receiveShadow = true;
  group.add(rim);

  const pool = new THREE.Mesh(getGeo('oasisPool', () => new THREE.CylinderGeometry(1.42, 1.42, 0.24, 16)), waterMat);
  pool.position.y = 0.12;
  group.add(pool);

  const drop = new THREE.Mesh(getGeo('oasisDrop', () => new THREE.OctahedronGeometry(0.42, 0)), cyanNeonMat);
  drop.position.y = 1.48;
  group.add(drop);
  animatedItems.push({ type: 'BOB', mesh: drop, baseY: 1.48, speed: 2.2 });

  const { sprite: halo, texture: hTex, material: hMat } = createGlowHaloSprite(0x38bdf8, 2.3, 0.78);
  trackTex(hTex);
  trackMat(hMat);
  halo.position.y = 1.48;
  group.add(halo);
  animatedItems.push({ type: 'HALO', mesh: halo, baseScale: 2.3 });

  // Mini Palm Trees flanking the pool
  [-1.08, 1.08].forEach((px, idx) => {
    const palm = buildMiniPalm(ctx, idx === 0 ? 0.16 : -0.16);
    palm.position.set(px, 0.12, -0.75);
    group.add(palm);
    animatedItems.push({ type: 'SWAY', mesh: palm, phase: idx * 1.4 });
  });

  group.add(rigPool.createBlobShadow(2.6));
  return group;
}

function buildMiniPalm(ctx, tiltZ = 0.16) {
  const { getGeo, getMat } = ctx;
  const palm = new THREE.Group();
  const trunkMat = getMat('trunkWood', () => new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 }));
  const leafMat = getMat('palmLeaf', () => new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.72, flatShading: true }));

  const t1 = new THREE.Mesh(getGeo('palmT1', () => new THREE.CylinderGeometry(0.10, 0.16, 0.95, 6)), trunkMat);
  t1.position.y = 0.47;
  t1.rotation.z = tiltZ * 0.6;
  palm.add(t1);

  const t2 = new THREE.Mesh(getGeo('palmT2', () => new THREE.CylinderGeometry(0.075, 0.105, 0.90, 6)), trunkMat);
  t2.position.set(-Math.sin(tiltZ * 0.6) * 0.45, 1.32, 0);
  t2.rotation.z = tiltZ * 1.25;
  palm.add(t2);

  const topX = -Math.sin(tiltZ * 0.6) * 0.45 - Math.sin(tiltZ * 1.25) * 0.42;
  const topY = 1.78;
  const frondGeo = getGeo('palmFrond', () => new THREE.ConeGeometry(0.24, 0.95, 4));
  for (let f = 0; f < 6; f++) {
    const a = (f / 6) * Math.PI * 2;
    const frond = new THREE.Mesh(frondGeo, leafMat);
    frond.position.set(topX + Math.cos(a) * 0.34, topY, Math.sin(a) * 0.34);
    frond.rotation.z = -Math.cos(a) * 1.15;
    frond.rotation.x = Math.sin(a) * 1.15;
    palm.add(frond);
  }
  return palm;
}

/**
 * Builds FPQS Campus or Classical Flora Props with blob shadow (zero directional castShadow).
 */
export function buildFloraProp(ctx, { isFPQS, palette, rIdx, cIdx }) {
  const { getGeo, getMat, rigPool } = ctx;
  const group = new THREE.Group();

  if (isFPQS) {
    const marbleMat = getMat('marble', () => new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 }));
    const shrubMat = getMat('campusBush', () => new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.62, flatShading: true }));
    const flowerGoldMat = getMat('flowerGold', () => new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xd97706, emissiveIntensity: 0.5 }));
    const flowerRoseMat = getMat('flowerRose', () => new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 0.5 }));

    const planter = new THREE.Mesh(getGeo('shrubPot', () => new THREE.BoxGeometry(1.1, 0.42, 1.1)), marbleMat);
    planter.position.y = 0.21;
    planter.receiveShadow = true;
    group.add(planter);

    const bush = new THREE.Mesh(getGeo('shrubBush', () => new THREE.IcosahedronGeometry(0.72, 1)), shrubMat);
    bush.position.y = 0.85;
    group.add(bush);

    [-0.28, 0.30].forEach((bx, idx) => {
      const fl = new THREE.Mesh(
        getGeo('shrubFlower', () => new THREE.SphereGeometry(0.11, 5, 5)),
        idx === 0 ? flowerGoldMat : flowerRoseMat
      );
      fl.position.set(bx, 1.05 + idx * 0.14, 0.46);
      group.add(fl);
    });
    group.add(rigPool.createBlobShadow(1.3));
    return { group, swayMesh: bush };
  }

  if ((rIdx * 3 + cIdx * 7) % 2 === 0) {
    const palm = buildMiniPalm(ctx, rIdx % 2 === 0 ? 0.15 : -0.15);
    palm.add(rigPool.createBlobShadow(1.5));
    return { group: palm, swayMesh: palm };
  }

  // Classical Olive / Courtyard Tree
  const trunkMat = getMat('trunkWood', () => new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 }));
  const floraMat = getMat(`flora_${palette.flora}`, () => new THREE.MeshStandardMaterial({ color: palette.flora, roughness: 0.75, flatShading: true }));

  const trunk = new THREE.Mesh(getGeo('oliveTrunk', () => new THREE.CylinderGeometry(0.14, 0.22, 1.35, 6)), trunkMat);
  trunk.position.y = 0.67;
  group.add(trunk);

  const canopy = new THREE.Group();
  [
    [0, 1.65, 0, 0.82],
    [-0.38, 1.45, 0.24, 0.62],
    [0.36, 1.48, -0.22, 0.58],
  ].forEach(([ox, oy, oz, rad]) => {
    const puff = new THREE.Mesh(getGeo(`oliveCloud_${rad}`, () => new THREE.IcosahedronGeometry(rad, 0)), floraMat);
    puff.position.set(ox, oy, oz);
    canopy.add(puff);
  });
  group.add(canopy);
  group.add(rigPool.createBlobShadow(1.55));
  return { group, swayMesh: canopy };
}

/**
 * Builds custom FPQS Campus Landmarks OR Classical Gold-Domed Sanctuaries at 4.0m scale.
 * Selective shadow casting is enabled ONLY on primary domes/roofs.
 */
export function buildLandmarkBuilding(ctx, animatedItems, cameraWallMeshes, { isFPQS, npc, isBoss, isLocked }) {
  const { getGeo, getMat, createGlowHaloSprite, trackTex, trackMat } = ctx;
  const bldg = new THREE.Group();

  const marbleMat = getMat('marble', () => new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 }));
  const creamMat = getMat('creamWall', () => new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.45 }));
  const slateMat = getMat('slateWall', () => new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 }));
  const whiteCleanMat = getMat('whiteClean', () => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.28 }));
  const goldMat = getMat('goldTrim', () =>
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xb45309, emissiveIntensity: 0.35, metalness: 0.65, roughness: 0.28 })
  );
  const darkDoorMat = getMat('darkDoor', () => new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 }));
  const usimGreenMat = getMat('usimGreen', () => new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.42 }));
  const usimNavyMat = getMat('usimNavy', () => new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4 }));
  const neonCyanMat = getMat('neonCyan', () =>
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.8, roughness: 0.2 })
  );
  const neonGreenMat = getMat('neonGreen', () =>
    new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 1.9, roughness: 0.2 })
  );

  let bossAuraRingMat = null;

  if (isFPQS) {
    const mt = npc.makmalType;

    // 1. MAKMAL TARANNUM: Studio Akustik + Kaca Kedap Bunyi + Mikrofon 3D + 5 Equalizer Neon
    if (mt === 'TARANNUM') {
      const base = new THREE.Mesh(getGeo('fpqsBase', () => new THREE.BoxGeometry(2.6, 0.24, 2.0)), marbleMat);
      base.position.y = 0.12;
      base.receiveShadow = true;
      bldg.add(base);

      const studio = new THREE.Mesh(getGeo('tarannumBody', () => new THREE.BoxGeometry(2.0, 1.75, 1.45)), slateMat);
      studio.position.y = 1.11;
      studio.receiveShadow = true;
      bldg.add(studio);
      cameraWallMeshes.push(studio);

      const glassMat = getMat('acousticGlass', () =>
        new THREE.MeshStandardMaterial({ color: 0x0891b2, roughness: 0.1, transparent: true, opacity: 0.6 })
      );
      const glass = new THREE.Mesh(getGeo('tarannumGlass', () => new THREE.BoxGeometry(1.15, 0.72, 0.06)), glassMat);
      glass.position.set(0, 1.18, 0.74);
      bldg.add(glass);

      const roofRim = new THREE.Mesh(getGeo('tarannumRim', () => new THREE.BoxGeometry(2.12, 0.12, 1.56)), neonCyanMat);
      roofRim.position.y = 2.04;
      bldg.add(roofRim);

      // Condenser Microphone on roof (castShadow = true for roof landmark hero focal)
      const micStand = new THREE.Mesh(getGeo('micStand', () => new THREE.CylinderGeometry(0.045, 0.055, 0.65, 8)), marbleMat);
      micStand.position.y = 2.42;
      bldg.add(micStand);

      const micMount = new THREE.Mesh(getGeo('micMount', () => new THREE.TorusGeometry(0.22, 0.035, 8, 18)), goldMat);
      micMount.position.y = 2.75;
      bldg.add(micMount);

      const micCapsule = new THREE.Mesh(getGeo('micCap', () => new THREE.CylinderGeometry(0.13, 0.13, 0.42, 10)), marbleMat);
      micCapsule.position.y = 2.75;
      micCapsule.castShadow = true;
      bldg.add(micCapsule);

      // 5 Equalizer Bars
      const eqH = [0.28, 0.56, 0.85, 0.60, 0.34];
      [-0.58, -0.29, 0, 0.29, 0.58].forEach((ox, idx) => {
        const bar = new THREE.Mesh(
          getGeo(`eqBar_${idx}`, () => new THREE.BoxGeometry(0.11, eqH[idx], 0.11)),
          idx % 2 === 0 ? neonCyanMat : goldMat
        );
        bar.position.set(ox, 2.1 + eqH[idx] * 0.5, -0.35);
        bldg.add(bar);
        animatedItems.push({ type: 'EQUALIZER', mesh: bar, freq: 3.4 + idx * 0.65, phase: idx * 0.85 });
      });
    }

    // 2. MAKMAL HADIS: Rak Kitab Turath + Pelayan Server Digital + Hologram Biru
    else if (mt === 'HADIS') {
      const base = new THREE.Mesh(getGeo('fpqsBase', () => new THREE.BoxGeometry(2.6, 0.24, 2.0)), marbleMat);
      base.position.y = 0.12;
      base.receiveShadow = true;
      bldg.add(base);

      const shelfBody = new THREE.Mesh(getGeo('hadisShelf', () => new THREE.BoxGeometry(1.15, 1.85, 1.35)), slateMat);
      shelfBody.position.set(-0.48, 1.16, 0);
      shelfBody.receiveShadow = true;
      bldg.add(shelfBody);
      cameraWallMeshes.push(shelfBody);

      // Colorful Kitab Spines on 3 Shelves
      const kitabColors = [0x15803d, 0xb45309, 0x1e3a8a, 0x7c2d12];
      [0.65, 1.15, 1.65].forEach((sy, rowIdx) => {
        [-0.78, -0.58, -0.38, -0.18].forEach((kx, colIdx) => {
          const kMat = getMat(`kitab_${(rowIdx + colIdx) % 4}`, () =>
            new THREE.MeshStandardMaterial({ color: kitabColors[(rowIdx + colIdx) % 4], roughness: 0.45 })
          );
          const book = new THREE.Mesh(getGeo('kitabVol', () => new THREE.BoxGeometry(0.13, 0.34, 0.22)), kMat);
          book.position.set(kx, sy, 0.62);
          bldg.add(book);
        });
      });

      // Digital Server Rack beside bookcase
      const serverMat = getMat('serverMetal', () => new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.25 }));
      const serverRack = new THREE.Mesh(getGeo('serverRack', () => new THREE.BoxGeometry(0.85, 1.95, 1.25)), serverMat);
      serverRack.position.set(0.60, 1.21, 0);
      serverRack.castShadow = true;
      bldg.add(serverRack);
      cameraWallMeshes.push(serverRack);

      [0.65, 1.10, 1.55, 1.95].forEach((ly) => {
        const led = new THREE.Mesh(getGeo('serverLed', () => new THREE.BoxGeometry(0.45, 0.05, 0.04)), neonCyanMat);
        led.position.set(0.60, ly, 0.64);
        bldg.add(led);
      });

      // Floating Digital Server Hologram
      const holoCore = new THREE.Mesh(getGeo('holoOct', () => new THREE.OctahedronGeometry(0.40, 0)), neonCyanMat);
      holoCore.position.set(0.25, 2.75, 0);
      bldg.add(holoCore);
      animatedItems.push({ type: 'BOB', mesh: holoCore, baseY: 2.75, speed: 2.1 });

      const holoRing = new THREE.Mesh(getGeo('holoRing', () => new THREE.TorusGeometry(0.58, 0.035, 8, 24)), neonCyanMat);
      holoRing.rotation.x = Math.PI * 0.4;
      holoRing.position.set(0.25, 2.75, 0);
      bldg.add(holoRing);
      animatedItems.push({ type: 'SPIN', mesh: holoRing, speed: 1.6 });

      const { sprite: holoHalo, texture: hTex, material: hMat } = createGlowHaloSprite(0x38bdf8, 2.5, 0.8);
      trackTex(hTex);
      trackMat(hMat);
      holoHalo.position.set(0.25, 2.75, 0);
      bldg.add(holoHalo);
      animatedItems.push({ type: 'HALO', mesh: holoHalo, baseScale: 2.5 });
    }

    // 3. MAKMAL BRAILLE: Bangunan Putih Moden + Matriks Titik Braille Neon Hijau
    else if (mt === 'BRAILLE') {
      const base = new THREE.Mesh(getGeo('fpqsBase', () => new THREE.BoxGeometry(2.6, 0.24, 2.0)), marbleMat);
      base.position.y = 0.12;
      base.receiveShadow = true;
      bldg.add(base);

      const body = new THREE.Mesh(getGeo('brailleBody', () => new THREE.BoxGeometry(2.05, 1.80, 1.45)), whiteCleanMat);
      body.position.y = 1.14;
      body.castShadow = true;
      body.receiveShadow = true;
      bldg.add(body);
      cameraWallMeshes.push(body);

      const dotGeo = getGeo('brailleDot', () => new THREE.SphereGeometry(0.065, 8, 8));
      const dotCoords = [
        [-0.58, 1.48], [-0.36, 1.48], [-0.58, 1.24], [-0.36, 1.24], [-0.58, 1.00], [-0.36, 1.00],
        [0.36, 1.48], [0.58, 1.48], [0.36, 1.24], [0.58, 1.24], [0.36, 1.00], [0.58, 1.00],
      ];
      dotCoords.forEach(([bx, by], idx) => {
        const dot = new THREE.Mesh(dotGeo, neonGreenMat);
        dot.position.set(bx, by, 0.74);
        bldg.add(dot);
        animatedItems.push({ type: 'BRAILLE_PULSE', mesh: dot, phase: idx * 0.35 });
      });

      const roofCanopy = new THREE.Mesh(getGeo('brailleCanopy', () => new THREE.CylinderGeometry(0.82, 0.92, 0.35, 12)), neonGreenMat);
      roofCanopy.position.y = 2.22;
      bldg.add(roofCanopy);

      const { sprite: brHalo, texture: bTex, material: bMat } = createGlowHaloSprite(0x22c55e, 2.3, 0.72);
      trackTex(bTex);
      trackMat(bMat);
      brHalo.position.y = 2.35;
      bldg.add(brHalo);
      animatedItems.push({ type: 'HALO', mesh: brHalo, baseScale: 2.3 });
    }

    // 4. PEJABAT DEKAN (FOYER BOSS): Tapak Marmar Megah, Tiang Klasik, Papan Tanda USIM, Aura Emas & Kubah
    else if (mt === 'DEKAN') {
      const base1 = new THREE.Mesh(getGeo('dekanB1', () => new THREE.BoxGeometry(3.1, 0.24, 2.4)), marbleMat);
      base1.position.y = 0.12;
      base1.receiveShadow = true;
      bldg.add(base1);

      const base2 = new THREE.Mesh(getGeo('dekanB2', () => new THREE.BoxGeometry(2.65, 0.20, 2.0)), marbleMat);
      base2.position.y = 0.34;
      base2.receiveShadow = true;
      bldg.add(base2);

      // 4 Columns + Gold Capitals
      const colGeo = getGeo('dekanCol', () => new THREE.CylinderGeometry(0.11, 0.13, 1.75, 10));
      const capGeo = getGeo('dekanCap', () => new THREE.BoxGeometry(0.32, 0.12, 0.32));
      [
        [-0.95, -0.70], [0.95, -0.70],
        [-0.95, 0.65], [0.95, 0.65],
      ].forEach(([cx, cz]) => {
        const col = new THREE.Mesh(colGeo, marbleMat);
        col.position.set(cx, 1.32, cz);
        bldg.add(col);
        const cap = new THREE.Mesh(capGeo, goldMat);
        cap.position.set(cx, 2.25, cz);
        bldg.add(cap);
      });

      // Inner Foyer Sanctuary Wall
      const sanctuary = new THREE.Mesh(getGeo('dekanWall', () => new THREE.BoxGeometry(1.72, 1.75, 1.15)), creamMat);
      sanctuary.position.set(0, 1.32, -0.1);
      bldg.add(sanctuary);
      cameraWallMeshes.push(sanctuary);

      // Classical USIM Pediment + Gold Trim + Crowning Dome (castShadow = true)
      const pediment = new THREE.Mesh(getGeo('dekanPed', () => new THREE.BoxGeometry(2.45, 0.28, 1.85)), marbleMat);
      pediment.position.y = 2.44;
      bldg.add(pediment);

      const pedTrim = new THREE.Mesh(getGeo('dekanPedTrim', () => new THREE.BoxGeometry(2.55, 0.08, 1.95)), goldMat);
      pedTrim.position.y = 2.62;
      bldg.add(pedTrim);

      const dome = new THREE.Mesh(
        getGeo('dekanDome', () => new THREE.SphereGeometry(0.95, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55)),
        goldMat
      );
      dome.position.y = 2.66;
      dome.castShadow = true;
      bldg.add(dome);

      const crest = new THREE.Mesh(getGeo('dekanCrest', () => new THREE.OctahedronGeometry(0.34, 0)), goldMat);
      crest.position.y = 3.95;
      bldg.add(crest);
      animatedItems.push({ type: 'BOB', mesh: crest, baseY: 3.95, speed: 1.8 });

      // USIM Sign Plinth
      const signPlinth = new THREE.Mesh(getGeo('usimPlinth', () => new THREE.BoxGeometry(1.35, 0.42, 0.26)), usimGreenMat);
      signPlinth.position.set(0, 0.65, 0.88);
      bldg.add(signPlinth);
      const signPlate = new THREE.Mesh(getGeo('usimPlate', () => new THREE.BoxGeometry(1.12, 0.24, 0.06)), goldMat);
      signPlate.position.set(0, 0.65, 1.02);
      bldg.add(signPlate);

      // Large Golden / Crimson Ground Aura Ring
      bossAuraRingMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: isLocked ? 0xef4444 : 0xfbbf24,
          emissive: isLocked ? 0xdc2626 : 0xd97706,
          emissiveIntensity: 2.0,
          roughness: 0.2,
        })
      );
      const auraRing = new THREE.Mesh(getGeo('dekanAura', () => new THREE.TorusGeometry(1.85, 0.075, 8, 32)), bossAuraRingMat);
      auraRing.rotation.x = Math.PI * 0.5;
      auraRing.position.y = 0.28;
      bldg.add(auraRing);

      const { sprite: dHalo, texture: dTex, material: dMat } = createGlowHaloSprite(isLocked ? 0xef4444 : 0xfbbf24, 3.0, 0.85);
      trackTex(dTex);
      trackMat(dMat);
      dHalo.position.y = 3.95;
      bldg.add(dHalo);
      animatedItems.push({ type: 'HALO', mesh: dHalo, baseScale: 3.0 });
    }

    // 5. BILIK NADI PMFPQS (EASTER EGG): Student Lounge + Banner PMFPQS + Gold Star
    else {
      const base = new THREE.Mesh(getGeo('nadiBase', () => new THREE.BoxGeometry(2.5, 0.22, 1.9)), marbleMat);
      base.position.y = 0.11;
      base.receiveShadow = true;
      bldg.add(base);

      const cabin = new THREE.Mesh(getGeo('nadiBody', () => new THREE.BoxGeometry(1.85, 1.65, 1.25)), slateMat);
      cabin.position.y = 1.04;
      cabin.receiveShadow = true;
      bldg.add(cabin);
      cameraWallMeshes.push(cabin);

      // PMFPQS Student Association Banner
      const bannerPole = new THREE.Mesh(getGeo('bannerPole', () => new THREE.CylinderGeometry(0.04, 0.04, 1.55, 6)), goldMat);
      bannerPole.position.set(0.76, 1.35, 0.68);
      bldg.add(bannerPole);

      const bannerCloth = new THREE.Mesh(getGeo('bannerCloth', () => new THREE.BoxGeometry(1.38, 0.92, 0.06)), usimNavyMat);
      bannerCloth.position.set(0, 1.38, 0.66);
      bldg.add(bannerCloth);

      const bannerStripe = new THREE.Mesh(getGeo('bannerStripe', () => new THREE.BoxGeometry(1.38, 0.16, 0.08)), usimGreenMat);
      bannerStripe.position.set(0, 1.72, 0.66);
      bldg.add(bannerStripe);

      const star = new THREE.Mesh(getGeo('nadiStar', () => new THREE.OctahedronGeometry(0.32, 0)), goldMat);
      star.position.y = 2.45;
      bldg.add(star);
      animatedItems.push({ type: 'BOB', mesh: star, baseY: 2.45, speed: 2.2 });

      const { sprite: sHalo, texture: sTex, material: sMat } = createGlowHaloSprite(0xfacc15, 2.2, 0.82);
      trackTex(sTex);
      trackMat(sMat);
      sHalo.position.y = 2.45;
      bldg.add(sHalo);
      animatedItems.push({ type: 'HALO', mesh: sHalo, baseScale: 2.2 });
    }
  } else {
    // CLASSICAL TURATH SANCTUARY (Maps 1–5): Stepped Marble Base, 4 Columns, Arched Door, Lanterns & Ribbed Gold Dome
    const bw = isBoss ? 2.6 : 2.15;
    const bh = isBoss ? 1.85 : 1.55;

    const base1 = new THREE.Mesh(getGeo(`clB1_${isBoss}`, () => new THREE.BoxGeometry(bw + 0.55, 0.20, bw + 0.25)), marbleMat);
    base1.position.y = 0.10;
    base1.receiveShadow = true;
    bldg.add(base1);

    const base2 = new THREE.Mesh(getGeo(`clB2_${isBoss}`, () => new THREE.BoxGeometry(bw + 0.25, 0.18, bw)), marbleMat);
    base2.position.y = 0.29;
    base2.receiveShadow = true;
    bldg.add(base2);

    const body = new THREE.Mesh(
      getGeo(`clBody_${isBoss}`, () => new THREE.BoxGeometry(bw * 0.85, bh, bw * 0.72)),
      isLocked ? darkDoorMat : creamMat
    );
    body.position.y = 0.38 + bh * 0.5;
    body.receiveShadow = true;
    bldg.add(body);
    cameraWallMeshes.push(body);

    // 4 Corner Pillars & Gold Capitals
    const cxOff = bw * 0.41;
    const czOff = bw * 0.34;
    const colGeo = getGeo(`clCol_${isBoss}`, () => new THREE.CylinderGeometry(0.095, 0.115, bh + 0.06, 8));
    const capGeo = getGeo('clCap', () => new THREE.BoxGeometry(0.28, 0.11, 0.28));
    [
      [-cxOff, -czOff], [cxOff, -czOff],
      [-cxOff, czOff], [cxOff, czOff],
    ].forEach(([cx, cz]) => {
      const col = new THREE.Mesh(colGeo, marbleMat);
      col.position.set(cx, 0.38 + bh * 0.5, cz);
      bldg.add(col);
      const cap = new THREE.Mesh(capGeo, goldMat);
      cap.position.set(cx, 0.38 + bh + 0.05, cz);
      bldg.add(cap);
    });

    // Arched Portal Doorway
    const door = new THREE.Mesh(getGeo('clDoor', () => new THREE.BoxGeometry(0.68, 1.0, 0.10)), darkDoorMat);
    door.position.set(0, 0.88, bw * 0.36 + 0.04);
    bldg.add(door);

    const arch = new THREE.Mesh(getGeo('clArch', () => new THREE.TorusGeometry(0.34, 0.06, 6, 14, Math.PI)), goldMat);
    arch.position.set(0, 1.38, bw * 0.36 + 0.04);
    bldg.add(arch);

    // 2 Warm Entrance Lanterns
    const lanternMat = getMat('warmLantern', () =>
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 2.0, roughness: 0.2 })
    );
    [-0.58, 0.58].forEach((lx) => {
      const post = new THREE.Mesh(getGeo('lanternPost', () => new THREE.CylinderGeometry(0.035, 0.045, 0.55, 6)), goldMat);
      post.position.set(lx, 0.65, bw * 0.36 + 0.22);
      bldg.add(post);

      const lamp = new THREE.Mesh(getGeo('lanternLamp', () => new THREE.BoxGeometry(0.16, 0.22, 0.16)), lanternMat);
      lamp.position.set(lx, 0.98, bw * 0.36 + 0.22);
      bldg.add(lamp);
    });

    // Cornice + Crowning Gold Dome (castShadow = true) + Spire Finial
    const cornice = new THREE.Mesh(getGeo(`clCornice_${isBoss}`, () => new THREE.BoxGeometry(bw * 0.94, 0.16, bw * 0.82)), goldMat);
    cornice.position.y = 0.38 + bh + 0.08;
    bldg.add(cornice);

    const domeR = isBoss ? 1.02 : 0.84;
    const dome = new THREE.Mesh(
      getGeo(`clDome_${isBoss}`, () => new THREE.SphereGeometry(domeR, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55)),
      goldMat
    );
    dome.position.y = 0.38 + bh + 0.14;
    dome.castShadow = true;
    bldg.add(dome);

    const spire = new THREE.Mesh(getGeo('clSpire', () => new THREE.ConeGeometry(0.10, 0.45, 6)), goldMat);
    spire.position.y = 0.38 + bh + 0.14 + domeR + 0.20;
    bldg.add(spire);
  }

  return { bldg, bossAuraRingMat };
}
