import * as THREE from 'three';

/**
 * Shared Geometry, Material & CanvasTexture pool for Articulated Human Rigs
 * and soft ground blob shadows. Disposed deterministically on map switch/unmount.
 */
export function createRigAssetPool() {
  const geometries = new Map();
  const materials = new Map();
  const textures = [];

  const getGeo = (key, factory) => {
    if (!geometries.has(key)) {
      geometries.set(key, factory());
    }
    return geometries.get(key);
  };

  const getMat = (key, factory) => {
    if (!materials.has(key)) {
      materials.set(key, factory());
    }
    return materials.get(key);
  };

  // Soft radial blob shadow texture (zero GPU shadow-map overhead)
  const createBlobShadowTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
    grad.addColorStop(0, 'rgba(2, 6, 23, 0.52)');
    grad.addColorStop(0.55, 'rgba(2, 6, 23, 0.24)');
    grad.addColorStop(1, 'rgba(2, 6, 23, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(canvas);
    textures.push(tex);
    return tex;
  };

  const blobTex = createBlobShadowTexture();
  const blobShadowMat = getMat('blobShadowMat', () =>
    new THREE.MeshBasicMaterial({
      map: blobTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.9,
    })
  );
  const blobShadowGeo = getGeo('blobShadowGeo', () => new THREE.PlaneGeometry(1.15, 1.15));

  const createBlobShadow = (radiusScale = 1.0) => {
    const mesh = new THREE.Mesh(blobShadowGeo, blobShadowMat);
    mesh.rotation.x = -Math.PI * 0.5;
    mesh.position.y = 0.018;
    mesh.scale.setScalar(radiusScale);
    mesh.renderOrder = 1;
    return mesh;
  };

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    geometries.clear();
    materials.forEach((m) => m.dispose());
    materials.clear();
    textures.forEach((t) => t.dispose());
    textures.length = 0;
  };

  return {
    getGeo,
    getMat,
    createBlobShadow,
    dispose,
  };
}

/**
 * Builds an articulated, proportional ~1.76m tall human-like 3D character rig
 * with hierarchical anatomical pivots, facial details, soft ground blob shadow,
 * and automatic Classical Turath vs. Modern FPQS USIM Campus attire presets.
 */
export function buildArticulatedCharacter(pool, options = {}) {
  const {
    preset = 'CLASSICAL_PLAYER', // 'CLASSICAL_PLAYER' | 'CLASSICAL_SCHOLAR' | 'CAMPUS_PLAYER' | 'CAMPUS_FEMALE_LECTURER' | 'CAMPUS_MALE_LECTURER' | 'CAMPUS_DEAN' | 'CAMPUS_STUDENT'
    primaryColor = 0x1e3a8a,
    secondaryColor = 0xf59e0b,
    skinColor = 0xd9a074,
    headwear = 'AUTO', // 'TURBAN' | 'KOPIAH' | 'SONGKOK' | 'HIJAB' | 'NONE' | 'AUTO'
    headwearColor = null,
    hasBeard = 'AUTO',
    hasGlasses = 'AUTO',
    hasBackpack = 'AUTO',
    hasLanyard = 'AUTO',
    hasStaff = false,
    hasBook = false,
    scale = 1.0,
    castShadow = false,
  } = options;

  const isClassical = preset.startsWith('CLASSICAL');
  const isFemale = preset === 'CAMPUS_FEMALE_LECTURER';
  const isDean = preset === 'CAMPUS_DEAN';
  const isPlayer = preset === 'CLASSICAL_PLAYER' || preset === 'CAMPUS_PLAYER';

  const resolvedHeadwear =
    headwear !== 'AUTO'
      ? headwear
      : preset === 'CLASSICAL_PLAYER' || preset === 'CLASSICAL_SCHOLAR'
      ? 'TURBAN'
      : preset === 'CAMPUS_PLAYER'
      ? 'KOPIAH'
      : preset === 'CAMPUS_FEMALE_LECTURER'
      ? 'HIJAB'
      : preset === 'CAMPUS_MALE_LECTURER' || preset === 'CAMPUS_DEAN'
      ? 'SONGKOK'
      : 'NONE';

  const resolvedBeard =
    hasBeard !== 'AUTO'
      ? hasBeard
      : preset === 'CLASSICAL_SCHOLAR' ||
        preset === 'CLASSICAL_PLAYER' ||
        preset === 'CAMPUS_MALE_LECTURER' ||
        preset === 'CAMPUS_DEAN';

  const resolvedGlasses =
    hasGlasses !== 'AUTO'
      ? hasGlasses
      : preset === 'CAMPUS_MALE_LECTURER' || preset === 'CAMPUS_DEAN';

  const resolvedBackpack = hasBackpack !== 'AUTO' ? hasBackpack : preset === 'CAMPUS_PLAYER';
  const resolvedLanyard =
    hasLanyard !== 'AUTO'
      ? hasLanyard
      : preset === 'CAMPUS_PLAYER' || preset === 'CAMPUS_STUDENT';

  const root = new THREE.Group();
  root.scale.setScalar(scale);

  // Soft Ground Blob Shadow
  const blobShadow = pool.createBlobShadow(isPlayer ? 1.05 : 0.95);
  root.add(blobShadow);

  // Shared Materials
  const skinMat = pool.getMat(`skin_${skinColor}`, () =>
    new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.62, metalness: 0.02 })
  );
  const outfitMat = pool.getMat(`outfit_${primaryColor}`, () =>
    new THREE.MeshStandardMaterial({ color: primaryColor, roughness: 0.56, metalness: 0.06 })
  );
  const accentMat = pool.getMat(`accent_${secondaryColor}`, () =>
    new THREE.MeshStandardMaterial({ color: secondaryColor, roughness: 0.42, metalness: 0.25 })
  );
  const shirtWhiteMat = pool.getMat('shirtWhite', () =>
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 })
  );
  const pantsMat = pool.getMat(isClassical ? `thobeLower_${primaryColor}` : 'campusSlacks', () =>
    new THREE.MeshStandardMaterial({
      color: isClassical ? primaryColor : 0x1e293b,
      roughness: 0.62,
    })
  );
  const shoeMat = pool.getMat('shoeDark', () =>
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.45 })
  );
  const hairMat = pool.getMat('hairDark', () =>
    new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.78 })
  );
  const beardMat = pool.getMat('beardDark', () =>
    new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.8 })
  );
  const eyeWhiteMat = pool.getMat('eyeWhite', () =>
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
  );
  const eyeIrisMat = pool.getMat('eyeIris', () =>
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 })
  );
  const glassesFrameMat = pool.getMat('glassesFrame', () =>
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.75, roughness: 0.25 })
  );

  // Pelvis / Hip Root (~0.84m above ground)
  const pelvisPivot = new THREE.Group();
  pelvisPivot.position.set(0, 0.84, 0);
  root.add(pelvisPivot);

  const setShadow = (mesh) => {
    if (castShadow) mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  // --- LEGS (Hips -> Thighs -> Knees -> Calves -> Shoes) ---
  const thighGeo = pool.getGeo('thigh', () => new THREE.CylinderGeometry(0.088, 0.072, 0.41, 8));
  const calfGeo = pool.getGeo('calf', () => new THREE.CylinderGeometry(0.068, 0.052, 0.40, 8));
  const shoeGeo = pool.getGeo('shoe', () => new THREE.BoxGeometry(0.115, 0.07, 0.22));

  const buildLeg = (sideSign) => {
    const hipPivot = new THREE.Group();
    hipPivot.position.set(sideSign * 0.115, 0, 0);

    const thigh = setShadow(new THREE.Mesh(thighGeo, pantsMat));
    thigh.position.set(0, -0.205, 0);
    hipPivot.add(thigh);

    const kneePivot = new THREE.Group();
    kneePivot.position.set(0, -0.41, 0);
    hipPivot.add(kneePivot);

    const calf = setShadow(new THREE.Mesh(calfGeo, pantsMat));
    calf.position.set(0, -0.20, 0);
    kneePivot.add(calf);

    const shoe = setShadow(new THREE.Mesh(shoeGeo, shoeMat));
    shoe.position.set(0, -0.40, 0.045);
    kneePivot.add(shoe);

    pelvisPivot.add(hipPivot);
    return { hipPivot, kneePivot };
  };

  const leftLeg = buildLeg(-1);
  const rightLeg = buildLeg(1);

  // --- TORSO GROUP (Waist, Chest, Jacket/Thobe, Tie/Lanyard/Backpack/Stoles) ---
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.02, 0);
  pelvisPivot.add(torsoGroup);

  const pelvisMesh = setShadow(
    new THREE.Mesh(
      pool.getGeo('pelvisBox', () => new THREE.CylinderGeometry(0.16, 0.155, 0.16, 10)),
      outfitMat
    )
  );
  pelvisMesh.position.set(0, 0.06, 0);
  torsoGroup.add(pelvisMesh);

  const chestW = isFemale ? 0.175 : 0.20;
  const chestGeo = pool.getGeo(
    isFemale ? 'chestFemale' : 'chestMale',
    () => new THREE.CylinderGeometry(chestW, 0.155, 0.44, 10)
  );
  const chestMesh = setShadow(new THREE.Mesh(chestGeo, outfitMat));
  chestMesh.scale.set(1.08, 1.0, 0.72);
  chestMesh.position.set(0, 0.34, 0);
  torsoGroup.add(chestMesh);

  // Classical flowing lower thobe skirt around upper legs (keeps strides clean)
  if (isClassical) {
    const skirtMesh = setShadow(
      new THREE.Mesh(
        pool.getGeo('thobeSkirt', () => new THREE.CylinderGeometry(0.165, 0.24, 0.56, 10)),
        outfitMat
      )
    );
    skirtMesh.scale.set(1.05, 1.0, 0.8);
    skirtMesh.position.set(0, -0.24, 0);
    torsoGroup.add(skirtMesh);

    // Traditional Rida' / Cloak over shoulders
    const ridaMesh = setShadow(
      new THREE.Mesh(
        pool.getGeo('ridaWrap', () => new THREE.BoxGeometry(0.45, 0.12, 0.28)),
        accentMat
      )
    );
    ridaMesh.position.set(0, 0.51, -0.01);
    torsoGroup.add(ridaMesh);
  } else {
    // Campus inner crisp shirt V-front & Tie or Lanyard
    const innerShirt = new THREE.Mesh(
      pool.getGeo('shirtFront', () => new THREE.BoxGeometry(0.13, 0.30, 0.03)),
      shirtWhiteMat
    );
    innerShirt.position.set(0, 0.39, 0.125);
    torsoGroup.add(innerShirt);

    if (preset === 'CAMPUS_MALE_LECTURER' || isDean) {
      const tieMesh = new THREE.Mesh(
        pool.getGeo('neckTie', () => new THREE.BoxGeometry(0.045, 0.24, 0.02)),
        accentMat
      );
      tieMesh.position.set(0, 0.37, 0.142);
      torsoGroup.add(tieMesh);
    }

    if (isDean) {
      // Gold academic stole bands
      [-0.10, 0.10].forEach((sx) => {
        const stole = new THREE.Mesh(
          pool.getGeo('deanStole', () => new THREE.BoxGeometry(0.06, 0.46, 0.27)),
          accentMat
        );
        stole.position.set(sx, 0.35, 0.01);
        torsoGroup.add(stole);
      });
    }

    if (resolvedLanyard) {
      const strapMat = pool.getMat('usimLanyardMat', () =>
        new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.4 })
      );
      const strap = new THREE.Mesh(
        pool.getGeo('lanyardStrap', () => new THREE.TorusGeometry(0.15, 0.016, 6, 16)),
        strapMat
      );
      strap.rotation.x = Math.PI * 0.42;
      strap.position.set(0, 0.47, 0.03);
      torsoGroup.add(strap);

      const badge = new THREE.Mesh(
        pool.getGeo('lanyardBadge', () => new THREE.BoxGeometry(0.075, 0.10, 0.014)),
        shirtWhiteMat
      );
      badge.position.set(0, 0.30, 0.145);
      torsoGroup.add(badge);
    }

    if (resolvedBackpack) {
      const packMat = pool.getMat('backpackMat', () =>
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.55 })
      );
      const packTrimMat = pool.getMat('backpackTrimMat', () =>
        new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.45 })
      );
      const mainPack = setShadow(
        new THREE.Mesh(
          pool.getGeo('backpackMain', () => new THREE.BoxGeometry(0.32, 0.40, 0.17)),
          packMat
        )
      );
      mainPack.position.set(0, 0.36, -0.19);
      torsoGroup.add(mainPack);

      const frontPocket = setShadow(
        new THREE.Mesh(
          pool.getGeo('backpackPocket', () => new THREE.BoxGeometry(0.25, 0.20, 0.06)),
          packTrimMat
        )
      );
      frontPocket.position.set(0, 0.27, -0.285);
      torsoGroup.add(frontPocket);

      // Shoulder straps visible from back & side
      [-0.11, 0.11].forEach((sx) => {
        const strapMesh = new THREE.Mesh(
          pool.getGeo('packStrap', () => new THREE.BoxGeometry(0.045, 0.38, 0.29)),
          packMat
        );
        strapMesh.position.set(sx, 0.39, -0.02);
        torsoGroup.add(strapMesh);
      });
    }
  }

  // --- ARMS (Shoulders -> Upper Arms -> Elbows -> Forearms -> Hands) ---
  const upperArmGeo = pool.getGeo('upperArm', () => new THREE.CylinderGeometry(0.056, 0.048, 0.27, 8));
  const forearmGeo = pool.getGeo('forearm', () => new THREE.CylinderGeometry(0.046, 0.038, 0.25, 8));
  const handGeo = pool.getGeo('hand', () => new THREE.SphereGeometry(0.044, 8, 8));

  const buildArm = (sideSign) => {
    const shoulderPivot = new THREE.Group();
    shoulderPivot.position.set(sideSign * (isFemale ? 0.23 : 0.26), 0.51, 0);

    const upperArm = setShadow(new THREE.Mesh(upperArmGeo, outfitMat));
    upperArm.position.set(0, -0.135, 0);
    shoulderPivot.add(upperArm);

    const elbowPivot = new THREE.Group();
    elbowPivot.position.set(0, -0.27, 0);
    shoulderPivot.add(elbowPivot);

    const forearm = setShadow(
      new THREE.Mesh(forearmGeo, isClassical ? outfitMat : outfitMat)
    );
    forearm.position.set(0, -0.125, 0);
    elbowPivot.add(forearm);

    const hand = setShadow(new THREE.Mesh(handGeo, skinMat));
    hand.position.set(0, -0.265, 0);
    elbowPivot.add(hand);

    torsoGroup.add(shoulderPivot);
    return { shoulderPivot, elbowPivot, hand };
  };

  const leftArm = buildArm(-1);
  const rightArm = buildArm(1);

  if (hasStaff) {
    const staffMat = pool.getMat('staffWood', () =>
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.65 })
    );
    const staff = setShadow(
      new THREE.Mesh(
        pool.getGeo('scholarStaff', () => new THREE.CylinderGeometry(0.022, 0.026, 1.55, 6)),
        staffMat
      )
    );
    staff.position.set(0, -0.10, 0.08);
    rightArm.elbowPivot.add(staff);

    const orb = new THREE.Mesh(
      pool.getGeo('staffOrb', () => new THREE.OctahedronGeometry(0.055, 0)),
      accentMat
    );
    orb.position.set(0, 0.69, 0.08);
    rightArm.elbowPivot.add(orb);
  }

  if (hasBook) {
    const bookCoverMat = pool.getMat('kitabCover', () =>
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.45 })
    );
    const book = setShadow(
      new THREE.Mesh(
        pool.getGeo('heldKitab', () => new THREE.BoxGeometry(0.07, 0.24, 0.18)),
        bookCoverMat
      )
    );
    book.position.set(-0.03, -0.25, 0.08);
    leftArm.elbowPivot.add(book);
  }

  // --- NECK & SCULPTED HEAD WITH FACIAL FEATURES ---
  const neckGroup = new THREE.Group();
  neckGroup.position.set(0, 0.56, 0);
  torsoGroup.add(neckGroup);

  const neckMesh = setShadow(
    new THREE.Mesh(
      pool.getGeo('neckGeo', () => new THREE.CylinderGeometry(0.055, 0.065, 0.11, 8)),
      skinMat
    )
  );
  neckMesh.position.set(0, 0.05, 0);
  neckGroup.add(neckMesh);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.19, 0);
  neckGroup.add(headGroup);

  const cranium = setShadow(
    new THREE.Mesh(pool.getGeo('headGeo', () => new THREE.SphereGeometry(0.145, 14, 12)), skinMat)
  );
  cranium.scale.set(0.92, 1.06, 0.96);
  headGroup.add(cranium);

  // Ears
  const earGeo = pool.getGeo('earGeo', () => new THREE.SphereGeometry(0.032, 6, 6));
  [-1, 1].forEach((s) => {
    const ear = new THREE.Mesh(earGeo, skinMat);
    ear.scale.set(0.45, 1.0, 0.7);
    ear.position.set(s * 0.132, -0.005, -0.01);
    headGroup.add(ear);
  });

  // Nose
  const nose = new THREE.Mesh(
    pool.getGeo('noseGeo', () => new THREE.ConeGeometry(0.022, 0.05, 5)),
    skinMat
  );
  nose.rotation.x = Math.PI * 0.48;
  nose.position.set(0, -0.005, 0.142);
  headGroup.add(nose);

  // Eyes & Eyebrows
  const scleraGeo = pool.getGeo('scleraGeo', () => new THREE.SphereGeometry(0.022, 6, 6));
  const irisGeo = pool.getGeo('irisGeo', () => new THREE.SphereGeometry(0.013, 6, 6));
  const browGeo = pool.getGeo('browGeo', () => new THREE.BoxGeometry(0.044, 0.011, 0.014));

  [-0.048, 0.048].forEach((ex) => {
    const sclera = new THREE.Mesh(scleraGeo, eyeWhiteMat);
    sclera.scale.set(1.0, 0.75, 0.5);
    sclera.position.set(ex, 0.025, 0.128);
    headGroup.add(sclera);

    const iris = new THREE.Mesh(irisGeo, eyeIrisMat);
    iris.position.set(ex, 0.025, 0.137);
    headGroup.add(iris);

    const brow = new THREE.Mesh(browGeo, hairMat);
    brow.position.set(ex, 0.055, 0.130);
    headGroup.add(brow);
  });

  // Glasses
  if (resolvedGlasses) {
    const lensRingGeo = pool.getGeo('glassesRing', () => new THREE.TorusGeometry(0.032, 0.005, 6, 12));
    [-0.048, 0.048].forEach((gx) => {
      const ring = new THREE.Mesh(lensRingGeo, glassesFrameMat);
      ring.position.set(gx, 0.025, 0.144);
      headGroup.add(ring);
    });
    const bridge = new THREE.Mesh(
      pool.getGeo('glassesBridge', () => new THREE.BoxGeometry(0.032, 0.006, 0.006)),
      glassesFrameMat
    );
    bridge.position.set(0, 0.028, 0.144);
    headGroup.add(bridge);
  }

  // Neat Beard
  if (resolvedBeard) {
    const beard = new THREE.Mesh(
      pool.getGeo('beardJaw', () => new THREE.SphereGeometry(0.132, 10, 8, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5)),
      beardMat
    );
    beard.scale.set(0.92, 0.95, 0.98);
    beard.position.set(0, -0.028, 0.01);
    headGroup.add(beard);
  }

  // Headwear (TURBAN | KOPIAH | SONGKOK | HIJAB | NONE)
  const hwColor =
    headwearColor ??
    (resolvedHeadwear === 'TURBAN'
      ? 0xf8fafc
      : resolvedHeadwear === 'KOPIAH'
      ? 0xf8fafc
      : resolvedHeadwear === 'SONGKOK'
      ? 0x0f172a
      : resolvedHeadwear === 'HIJAB'
      ? secondaryColor
      : 0x1c1917);

  const hwMat = pool.getMat(`hw_${resolvedHeadwear}_${hwColor}`, () =>
    new THREE.MeshStandardMaterial({ color: hwColor, roughness: 0.55 })
  );

  if (resolvedHeadwear === 'TURBAN') {
    const cap = setShadow(
      new THREE.Mesh(pool.getGeo('turbanBase', () => new THREE.TorusGeometry(0.125, 0.055, 8, 16)), hwMat)
    );
    cap.rotation.x = Math.PI * 0.45;
    cap.position.set(0, 0.085, -0.01);
    headGroup.add(cap);

    const crown = new THREE.Mesh(
      pool.getGeo('turbanCrown', () => new THREE.SphereGeometry(0.11, 10, 8)),
      accentMat
    );
    crown.position.set(0, 0.115, -0.01);
    headGroup.add(crown);
  } else if (resolvedHeadwear === 'KOPIAH') {
    const kopiah = setShadow(
      new THREE.Mesh(pool.getGeo('kopiah', () => new THREE.CylinderGeometry(0.135, 0.142, 0.11, 14)), hwMat)
    );
    kopiah.position.set(0, 0.115, -0.005);
    headGroup.add(kopiah);
  } else if (resolvedHeadwear === 'SONGKOK') {
    const songkok = setShadow(
      new THREE.Mesh(pool.getGeo('songkok', () => new THREE.BoxGeometry(0.24, 0.125, 0.27)), hwMat)
    );
    songkok.position.set(0, 0.125, -0.01);
    headGroup.add(songkok);
  } else if (resolvedHeadwear === 'HIJAB') {
    // Draped hijab over head, neck & chest
    const hijabCap = setShadow(
      new THREE.Mesh(pool.getGeo('hijabCap', () => new THREE.SphereGeometry(0.16, 14, 12)), hwMat)
    );
    hijabCap.scale.set(0.98, 1.05, 1.04);
    hijabCap.position.set(0, 0.015, -0.02);
    headGroup.add(hijabCap);

    const hijabDrape = setShadow(
      new THREE.Mesh(pool.getGeo('hijabDrape', () => new THREE.ConeGeometry(0.22, 0.36, 12)), hwMat)
    );
    hijabDrape.scale.set(1.05, 1.0, 0.72);
    hijabDrape.position.set(0, 0.47, 0.02);
    torsoGroup.add(hijabDrape);
  } else {
    // Neat hair cap for bareheaded campus students
    const hairCap = setShadow(
      new THREE.Mesh(
        pool.getGeo('hairCap', () => new THREE.SphereGeometry(0.15, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.56)),
        hairMat
      )
    );
    hairCap.scale.set(0.95, 1.04, 1.0);
    hairCap.position.set(0, 0.01, -0.015);
    headGroup.add(hairCap);
  }

  root.userData.rig = {
    pelvisPivot,
    torsoGroup,
    neckGroup,
    headGroup,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    walkPhase: Math.random() * Math.PI * 2,
    idlePhase: Math.random() * Math.PI * 2,
    basePelvisY: 0.84,
  };

  return root;
}

/**
 * Updates hierarchical character pivots smoothly at any frame rate (dt-independent).
 * speedNormalized: 0 = idle breathing/look, 0..1 = walking/running stride.
 */
export function animateArticulatedCharacter(characterRoot, dt, speedNormalized = 0) {
  const rig = characterRoot?.userData?.rig;
  if (!rig) return;

  const clampedSpeed = Math.max(0, Math.min(1, speedNormalized));
  rig.idlePhase += dt * 2.1;

  if (clampedSpeed > 0.04) {
    rig.walkPhase += dt * (6.2 + clampedSpeed * 4.4);
    const s = Math.sin(rig.walkPhase);
    const c = Math.cos(rig.walkPhase);
    const amp = 0.58 * clampedSpeed;

    // Leg stride + knee bend on backward/lift stroke
    rig.leftLeg.hipPivot.rotation.x = s * amp;
    rig.rightLeg.hipPivot.rotation.x = -s * amp;
    rig.leftLeg.kneePivot.rotation.x = Math.max(0, -s) * 0.55 * clampedSpeed;
    rig.rightLeg.kneePivot.rotation.x = Math.max(0, s) * 0.55 * clampedSpeed;

    // Opposite arm swing + gentle elbow bend
    rig.leftArm.shoulderPivot.rotation.x = -s * amp * 0.78;
    rig.rightArm.shoulderPivot.rotation.x = s * amp * 0.78;
    rig.leftArm.elbowPivot.rotation.x = -0.22 - Math.max(0, s) * 0.25 * clampedSpeed;
    rig.rightArm.elbowPivot.rotation.x = -0.22 - Math.max(0, -s) * 0.25 * clampedSpeed;

    // Forward torso lean + vertical double-stride bob
    rig.torsoGroup.rotation.x = THREE.MathUtils.lerp(
      rig.torsoGroup.rotation.x,
      0.11 * clampedSpeed,
      Math.min(1, dt * 10)
    );
    rig.pelvisPivot.position.y = rig.basePelvisY + Math.abs(c) * 0.045 * clampedSpeed;
    rig.headGroup.rotation.y = THREE.MathUtils.lerp(rig.headGroup.rotation.y, 0, Math.min(1, dt * 8));
    rig.headGroup.rotation.x = THREE.MathUtils.lerp(rig.headGroup.rotation.x, -0.04 * clampedSpeed, Math.min(1, dt * 8));
  } else {
    // Smooth settle to relaxed idle stance + subtle breathing/head scan
    const k = Math.min(1, dt * 8);
    rig.leftLeg.hipPivot.rotation.x = THREE.MathUtils.lerp(rig.leftLeg.hipPivot.rotation.x, 0, k);
    rig.rightLeg.hipPivot.rotation.x = THREE.MathUtils.lerp(rig.rightLeg.hipPivot.rotation.x, 0, k);
    rig.leftLeg.kneePivot.rotation.x = THREE.MathUtils.lerp(rig.leftLeg.kneePivot.rotation.x, 0, k);
    rig.rightLeg.kneePivot.rotation.x = THREE.MathUtils.lerp(rig.rightLeg.kneePivot.rotation.x, 0, k);

    const idleArm = Math.sin(rig.idlePhase) * 0.03;
    rig.leftArm.shoulderPivot.rotation.x = THREE.MathUtils.lerp(rig.leftArm.shoulderPivot.rotation.x, idleArm, k);
    rig.rightArm.shoulderPivot.rotation.x = THREE.MathUtils.lerp(rig.rightArm.shoulderPivot.rotation.x, -idleArm, k);
    rig.leftArm.elbowPivot.rotation.x = THREE.MathUtils.lerp(rig.leftArm.elbowPivot.rotation.x, -0.08, k);
    rig.rightArm.elbowPivot.rotation.x = THREE.MathUtils.lerp(rig.rightArm.elbowPivot.rotation.x, -0.08, k);

    rig.torsoGroup.rotation.x = THREE.MathUtils.lerp(rig.torsoGroup.rotation.x, 0, k);
    rig.pelvisPivot.position.y = rig.basePelvisY + Math.sin(rig.idlePhase * 1.4) * 0.012;
    rig.headGroup.rotation.y = Math.sin(rig.idlePhase * 0.65) * 0.08;
    rig.headGroup.rotation.x = Math.sin(rig.idlePhase * 1.1) * 0.03;
  }
}
