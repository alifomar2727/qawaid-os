import * as THREE from 'three';

/**
 * Builds Region-Matched Drivable / Rideable Transport at 4.0m Human Scale:
 * - Maps 1–5 (Classical Cities): Royal Caravan Mount & Chariot (Kuda & Pedati Kafilah)
 * - Map 6 (FPQS USIM): Drivable USIM Campus Buggy
 * All geometries/materials are tracked through landmarkCtx / rigPool for deterministic disposal.
 */
export function buildCampusBuggy(ctx, createGlowHaloSprite) {
  const { getGeo, getMat, rigPool, trackTex, trackMat } = ctx;
  const root = new THREE.Group();

  const bodyMat = getMat('buggyGreen', () =>
    new THREE.MeshStandardMaterial({ color: 0x16a34a, metalness: 0.42, roughness: 0.32 })
  );
  const whiteMat = getMat('buggyWhite', () =>
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.25, roughness: 0.35 })
  );
  const chassisMat = getMat('buggyChassis', () =>
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.65, roughness: 0.45 })
  );
  const seatMat = getMat('buggySeat', () =>
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.72 })
  );
  const tireMat = getMat('buggyTire', () =>
    new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 })
  );
  const rimMat = getMat('buggyRim', () =>
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 })
  );
  const goldTrimMat = getMat('goldTrim', () =>
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.7, roughness: 0.25 })
  );
  const glassMat = getMat('buggyGlass', () =>
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.42,
      roughness: 0.1,
      metalness: 0.2,
    })
  );
  const headlightMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xfef9c3,
      emissive: 0xfef08a,
      emissiveIntensity: 1.4,
      roughness: 0.2,
    })
  );
  const taillightMat = getMat('buggyTail', () =>
    new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 1.1,
      roughness: 0.3,
    })
  );

  // Blob shadow under buggy
  root.add(rigPool.createBlobShadow(3.1));

  // Chassis Floorboard
  const chassis = new THREE.Mesh(
    getGeo('buggyFloor', () => new THREE.BoxGeometry(1.42, 0.16, 2.55)),
    chassisMat
  );
  chassis.position.set(0, 0.36, 0);
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  root.add(chassis);

  // Front Hood & Green Stripe
  const hood = new THREE.Mesh(
    getGeo('buggyHood', () => new THREE.BoxGeometry(1.36, 0.44, 0.78)),
    whiteMat
  );
  hood.position.set(0, 0.64, 0.85);
  hood.castShadow = true;
  root.add(hood);

  const hoodStripe = new THREE.Mesh(
    getGeo('buggyHoodStripe', () => new THREE.BoxGeometry(0.46, 0.46, 0.80)),
    bodyMat
  );
  hoodStripe.position.set(0, 0.65, 0.85);
  root.add(hoodStripe);

  // USIM Gold Front Grille Emblem
  const grille = new THREE.Mesh(
    getGeo('buggyGrille', () => new THREE.BoxGeometry(0.72, 0.18, 0.06)),
    goldTrimMat
  );
  grille.position.set(0, 0.62, 1.25);
  root.add(grille);

  // Bench Seats (Front + Rear)
  const seatFront = new THREE.Mesh(
    getGeo('buggySeatBench', () => new THREE.BoxGeometry(1.22, 0.18, 0.52)),
    seatMat
  );
  seatFront.position.set(0, 0.66, 0.16);
  root.add(seatFront);

  const seatBack = new THREE.Mesh(
    getGeo('buggySeatBack', () => new THREE.BoxGeometry(1.22, 0.44, 0.14)),
    seatMat
  );
  seatBack.position.set(0, 0.92, -0.06);
  root.add(seatBack);

  const rearDeck = new THREE.Mesh(
    getGeo('buggyRearDeck', () => new THREE.BoxGeometry(1.36, 0.42, 0.92)),
    bodyMat
  );
  rearDeck.position.set(0, 0.64, -0.78);
  rearDeck.castShadow = true;
  root.add(rearDeck);

  // Canopy Pillars & Roof
  const pillarGeo = getGeo('buggyPillar', () => new THREE.CylinderGeometry(0.036, 0.036, 1.18, 8));
  [
    [-0.60, 0.48],
    [0.60, 0.48],
    [-0.60, -1.08],
    [0.60, -1.08],
  ].forEach(([px, pz]) => {
    const p = new THREE.Mesh(pillarGeo, chassisMat);
    p.position.set(px, 1.26, pz);
    root.add(p);
  });

  const windshield = new THREE.Mesh(
    getGeo('buggyWindshield', () => new THREE.BoxGeometry(1.16, 0.68, 0.04)),
    glassMat
  );
  windshield.position.set(0, 1.24, 0.56);
  windshield.rotation.x = -0.22;
  root.add(windshield);

  const roof = new THREE.Mesh(
    getGeo('buggyRoof', () => new THREE.BoxGeometry(1.44, 0.10, 1.88)),
    whiteMat
  );
  roof.position.set(0, 1.86, -0.26);
  roof.castShadow = true;
  root.add(roof);

  const roofTrim = new THREE.Mesh(
    getGeo('buggyRoofTrim', () => new THREE.BoxGeometry(1.48, 0.05, 1.92)),
    bodyMat
  );
  roofTrim.position.set(0, 1.92, -0.26);
  root.add(roofTrim);

  // Steering Wheel
  const steerWheel = new THREE.Mesh(
    getGeo('buggyWheelSteer', () => new THREE.TorusGeometry(0.16, 0.025, 6, 16)),
    chassisMat
  );
  steerWheel.position.set(-0.30, 0.98, 0.44);
  steerWheel.rotation.x = Math.PI * 0.35;
  root.add(steerWheel);

  // Twin Glowing Headlights + Light Cones + Tail Lights
  const lampGeo = getGeo('buggyLamp', () => new THREE.CylinderGeometry(0.09, 0.09, 0.06, 10));
  const beamConeMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0xfef9c3,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  const beamConeGeo = getGeo('headlightCone', () => new THREE.ConeGeometry(0.75, 4.2, 12, 1, true));
  const headlightHalos = [];
  const beamCones = [];

  [-0.46, 0.46].forEach((lx) => {
    const hl = new THREE.Mesh(lampGeo, headlightMat);
    hl.rotation.x = Math.PI * 0.5;
    hl.position.set(lx, 0.66, 1.25);
    root.add(hl);

    const { sprite: halo, texture: hTex, material: hMat } = createGlowHaloSprite(0xfef08a, 1.25, 0.65);
    trackTex(hTex);
    trackMat(hMat);
    halo.position.set(lx, 0.66, 1.32);
    root.add(halo);
    headlightHalos.push(halo);

    const cone = new THREE.Mesh(beamConeGeo, beamConeMat);
    cone.rotation.x = -Math.PI * 0.48;
    cone.position.set(lx, 0.55, 3.35);
    root.add(cone);
    beamCones.push(cone);

    const tl = new THREE.Mesh(lampGeo, taillightMat);
    tl.rotation.x = Math.PI * 0.5;
    tl.position.set(lx, 0.66, -1.27);
    root.add(tl);
  });

  // 4 Wheels (Front wheels inside steering pivots!)
  const tireGeo = getGeo('buggyTireGeo', () => new THREE.CylinderGeometry(0.28, 0.28, 0.20, 14));
  const rimGeo = getGeo('buggyRimGeo', () => new THREE.CylinderGeometry(0.16, 0.16, 0.22, 8));

  const createWheel = () => {
    const w = new THREE.Group();
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.rotation.z = Math.PI * 0.5;
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.z = Math.PI * 0.5;
    w.add(tire, rim);
    return w;
  };

  const frontLeftPivot = new THREE.Group();
  frontLeftPivot.position.set(-0.74, 0.28, 0.84);
  const frontLeftWheel = createWheel();
  frontLeftPivot.add(frontLeftWheel);

  const frontRightPivot = new THREE.Group();
  frontRightPivot.position.set(0.74, 0.28, 0.84);
  const frontRightWheel = createWheel();
  frontRightPivot.add(frontRightWheel);

  const rearLeftWheel = createWheel();
  rearLeftWheel.position.set(-0.74, 0.28, -0.82);

  const rearRightWheel = createWheel();
  rearRightWheel.position.set(0.74, 0.28, -0.82);

  root.add(frontLeftPivot, frontRightPivot, rearLeftWheel, rearRightWheel);

  return {
    type: 'BUGGY',
    root,
    steerWheel,
    frontLeftPivot,
    frontRightPivot,
    wheels: [frontLeftWheel, frontRightWheel, rearLeftWheel, rearRightWheel],
    headlightMat,
    beamConeMat,
    headlightHalos,
    beamCones,
  };
}

export function buildClassicalChariot(ctx, createGlowHaloSprite) {
  const { getGeo, getMat, rigPool, trackTex, trackMat } = ctx;
  const root = new THREE.Group();

  const woodMat = getMat('chariotWood', () =>
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.72 })
  );
  const goldTrimMat = getMat('goldTrim', () =>
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0x92400e, emissiveIntensity: 0.25, metalness: 0.75, roughness: 0.25 })
  );
  const crimsonClothMat = getMat('chariotSilk', () =>
    new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.58 })
  );
  const horseCoatMat = getMat('horseCoat', () =>
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.52 })
  );
  const horseManeMat = getMat('horseMane', () =>
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.68 })
  );
  const saddleMat = getMat('horseSaddle', () =>
    new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.55 })
  );
  const lanternGlowMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xfde047,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.8,
      roughness: 0.2,
    })
  );

  root.add(rigPool.createBlobShadow(3.4));

  // Royal Chariot Carriage (Rear section z: -0.95)
  const carriageGroup = new THREE.Group();
  carriageGroup.position.set(0, 0, -0.78);
  root.add(carriageGroup);

  const deck = new THREE.Mesh(
    getGeo('chariotDeck', () => new THREE.BoxGeometry(1.42, 0.16, 1.45)),
    woodMat
  );
  deck.position.y = 0.52;
  deck.castShadow = true;
  carriageGroup.add(deck);

  const trimRail = new THREE.Mesh(
    getGeo('chariotRail', () => new THREE.BoxGeometry(1.48, 0.52, 1.38)),
    crimsonClothMat
  );
  trimRail.position.set(0, 0.84, -0.05);
  trimRail.castShadow = true;
  carriageGroup.add(trimRail);

  const goldArch = new THREE.Mesh(
    getGeo('chariotArch', () => new THREE.TorusGeometry(0.72, 0.05, 8, 18, Math.PI)),
    goldTrimMat
  );
  goldArch.position.set(0, 1.32, 0.35);
  carriageGroup.add(goldArch);

  // Twin Spoked Caravan Wheels
  const rimGeo = getGeo('chariotRim', () => new THREE.TorusGeometry(0.46, 0.055, 8, 18));
  const spokeGeo = getGeo('chariotSpoke', () => new THREE.BoxGeometry(0.05, 0.88, 0.05));
  const createSpokedWheel = (wx) => {
    const w = new THREE.Group();
    w.position.set(wx, 0.48, -0.1);
    const rim = new THREE.Mesh(rimGeo, goldTrimMat);
    rim.rotation.y = Math.PI * 0.5;
    w.add(rim);
    for (let s = 0; s < 3; s++) {
      const sp = new THREE.Mesh(spokeGeo, woodMat);
      sp.rotation.x = (s / 3) * Math.PI;
      w.add(sp);
    }
    carriageGroup.add(w);
    return w;
  };
  const leftWheel = createSpokedWheel(-0.80);
  const rightWheel = createSpokedWheel(0.80);

  // Twin Front Brass Lanterns + Soft Warm Light Cones
  const beamConeMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0xfde68a,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  const beamConeGeo = getGeo('headlightCone', () => new THREE.ConeGeometry(0.75, 4.2, 12, 1, true));
  const headlightHalos = [];
  const beamCones = [];
  [-0.58, 0.58].forEach((lx) => {
    const post = new THREE.Mesh(
      getGeo('chariotLampPost', () => new THREE.CylinderGeometry(0.03, 0.04, 0.46, 6)),
      goldTrimMat
    );
    post.position.set(lx, 1.18, 0.62);
    carriageGroup.add(post);

    const lamp = new THREE.Mesh(
      getGeo('chariotLampBox', () => new THREE.OctahedronGeometry(0.12, 0)),
      lanternGlowMat
    );
    lamp.position.set(lx, 1.44, 0.62);
    carriageGroup.add(lamp);

    const { sprite: halo, texture: hTex, material: hMat } = createGlowHaloSprite(0xfbbf24, 1.35, 0.72);
    trackTex(hTex);
    trackMat(hMat);
    halo.position.set(lx, 1.44, 0.68);
    carriageGroup.add(halo);
    headlightHalos.push(halo);

    const cone = new THREE.Mesh(beamConeGeo, beamConeMat);
    cone.rotation.x = -Math.PI * 0.48;
    cone.position.set(lx, 1.15, 2.75);
    carriageGroup.add(cone);
    beamCones.push(cone);
  });

  // Tow Shafts connecting Chariot to Royal Arabian Horse
  [-0.36, 0.36].forEach((sx) => {
    const shaft = new THREE.Mesh(
      getGeo('chariotShaft', () => new THREE.CylinderGeometry(0.03, 0.03, 1.25, 6)),
      woodMat
    );
    shaft.rotation.x = Math.PI * 0.5;
    shaft.position.set(sx, 0.65, 0.25);
    root.add(shaft);
  });

  // Royal Arabian Steed (Kuda Putih Berpelana Hijau/Emas at z: +1.15)
  const horseGroup = new THREE.Group();
  horseGroup.position.set(0, 0, 1.15);
  root.add(horseGroup);

  const horseBody = new THREE.Mesh(
    getGeo('horseBody', () => new THREE.CapsuleGeometry(0.28, 0.76, 6, 12)),
    horseCoatMat
  );
  horseBody.rotation.x = Math.PI * 0.5;
  horseBody.position.set(0, 0.96, 0);
  horseBody.castShadow = true;
  horseGroup.add(horseBody);

  const saddle = new THREE.Mesh(
    getGeo('horseSaddleBox', () => new THREE.BoxGeometry(0.60, 0.14, 0.46)),
    saddleMat
  );
  saddle.position.set(0, 1.21, -0.05);
  horseGroup.add(saddle);

  const neckPivot = new THREE.Group();
  neckPivot.position.set(0, 1.12, 0.42);
  horseGroup.add(neckPivot);

  const neck = new THREE.Mesh(
    getGeo('horseNeck', () => new THREE.CylinderGeometry(0.14, 0.22, 0.58, 8)),
    horseCoatMat
  );
  neck.rotation.x = 0.45;
  neck.position.set(0, 0.24, 0.14);
  neckPivot.add(neck);

  const horseHead = new THREE.Mesh(
    getGeo('horseHead', () => new THREE.BoxGeometry(0.20, 0.22, 0.42)),
    horseCoatMat
  );
  horseHead.rotation.x = 0.32;
  horseHead.position.set(0, 0.48, 0.34);
  neckPivot.add(horseHead);

  const mane = new THREE.Mesh(
    getGeo('horseManeBox', () => new THREE.BoxGeometry(0.08, 0.48, 0.14)),
    horseManeMat
  );
  mane.rotation.x = 0.45;
  mane.position.set(0, 0.28, 0.02);
  neckPivot.add(mane);

  // 4 Articulated Horse Legs
  const hLegGeo = getGeo('horseLeg', () => new THREE.CylinderGeometry(0.065, 0.045, 0.76, 6));
  const createHorseLeg = (lx, lz) => {
    const piv = new THREE.Group();
    piv.position.set(lx, 0.76, lz);
    const leg = new THREE.Mesh(hLegGeo, horseCoatMat);
    leg.position.y = -0.38;
    piv.add(leg);
    horseGroup.add(piv);
    return piv;
  };
  const hLegs = [
    createHorseLeg(-0.18, 0.36),
    createHorseLeg(0.18, 0.36),
    createHorseLeg(-0.18, -0.36),
    createHorseLeg(0.18, -0.36),
  ];

  return {
    type: 'CHARIOT',
    root,
    steerPivot: horseGroup,
    neckPivot,
    hLegs,
    wheels: [leftWheel, rightWheel],
    headlightMat: lanternGlowMat,
    beamConeMat,
    headlightHalos,
    beamCones,
    gallopPhase: 0,
  };
}

export function animateVehicle(vehicle, dt, speedMps = 0, steerAngle = 0, isNight = false) {
  if (!vehicle) return;

  // Toggle headlights & lamp halos intensity cleanly based on Senja vs Malam
  const beamOpacity = isNight ? 0.26 : 0.08;
  const haloOpacity = isNight ? 0.92 : 0.45;
  if (vehicle.beamConeMat) {
    vehicle.beamConeMat.opacity = THREE.MathUtils.lerp(vehicle.beamConeMat.opacity, beamOpacity, Math.min(1, dt * 8));
  }
  if (vehicle.headlightMat) {
    vehicle.headlightMat.emissiveIntensity = isNight ? 2.4 : 1.1;
  }
  if (vehicle.headlightHalos) {
    vehicle.headlightHalos.forEach((h) => {
      h.material.opacity = haloOpacity;
    });
  }

  // Rotate wheels based on linear distance traveled
  const wheelRoll = (speedMps * dt) / 0.34;
  vehicle.wheels?.forEach((w) => {
    w.rotation.x += wheelRoll;
  });

  if (vehicle.type === 'BUGGY') {
    if (vehicle.frontLeftPivot) vehicle.frontLeftPivot.rotation.y = steerAngle;
    if (vehicle.frontRightPivot) vehicle.frontRightPivot.rotation.y = steerAngle;
    if (vehicle.steerWheel) vehicle.steerWheel.rotation.z = -steerAngle * 2.2;
  } else if (vehicle.type === 'CHARIOT') {
    if (vehicle.steerPivot) {
      vehicle.steerPivot.rotation.y = THREE.MathUtils.lerp(
        vehicle.steerPivot.rotation.y,
        steerAngle * 0.65,
        Math.min(1, dt * 10)
      );
    }
    const absSpeed = Math.abs(speedMps);
    if (absSpeed > 0.25) {
      vehicle.gallopPhase += dt * (4.5 + absSpeed * 0.75);
      const s = Math.sin(vehicle.gallopPhase);
      const c = Math.cos(vehicle.gallopPhase);
      const amp = Math.min(0.65, absSpeed * 0.06);
      if (vehicle.hLegs?.length === 4) {
        vehicle.hLegs[0].rotation.x = s * amp;
        vehicle.hLegs[1].rotation.x = s * amp * 0.92;
        vehicle.hLegs[2].rotation.x = -s * amp;
        vehicle.hLegs[3].rotation.x = -s * amp * 0.92;
      }
      if (vehicle.neckPivot) {
        vehicle.neckPivot.rotation.x = c * 0.09;
      }
    } else {
      vehicle.hLegs?.forEach((leg) => {
        leg.rotation.x = THREE.MathUtils.lerp(leg.rotation.x, 0, Math.min(1, dt * 8));
      });
      if (vehicle.neckPivot) {
        vehicle.neckPivot.rotation.x = Math.sin(performance.now() * 0.002) * 0.04;
      }
    }
  }
}

let sharedWorldAudioCtx = null;
export function playWorldSfx(kind = 'JUMP') {
  if (typeof window === 'undefined') return;
  try {
    if (!sharedWorldAudioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) sharedWorldAudioCtx = new AC();
    }
    const ctx = sharedWorldAudioCtx;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const t = ctx.currentTime;

    if (kind === 'BUGGY_HORN') {
      // Two-tone campus electric buggy horn (F4 + A4)
      [349.23, 440.0].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.setValueAtTime(0.06, t + 0.16);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.28);
      });
    } else if (kind === 'CHARIOT_BELL') {
      // Brass caravan bell chime (E5 + B5 harmonic)
      [659.25, 987.77, 1318.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const st = t + idx * 0.04;
        osc.frequency.setValueAtTime(freq, st);
        gain.gain.setValueAtTime(0.075, st);
        gain.gain.exponentialRampToValueAtTime(0.0008, st + 0.38);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(st);
        osc.stop(st + 0.38);
      });
    } else if (kind === 'JUMP') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(210, t);
      osc.frequency.exponentialRampToValueAtTime(420, t + 0.14);
      gain.gain.setValueAtTime(0.055, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.16);
    }
  } catch {
    // AudioContext blocked or unavailable
  }
}
