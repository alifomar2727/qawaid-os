import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

function createRadialGlowTexture(innerRgba, midRgba) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
  grad.addColorStop(0, innerRgba);
  grad.addColorStop(0.35, midRgba);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createNumberBadgeTexture(numLabel) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 128, 128);

  ctx.beginPath();
  ctx.arc(64, 64, 48, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(6, 20, 18, 0.88)';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#fbbf24';
  ctx.stroke();

  ctx.font = '800 58px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fef3c7';
  ctx.fillText(String(numLabel), 64, 66);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

const PILLAR_X = [-2.7, -0.9, 0.9, 2.7];

export default function ThreeArcadeSprint({
  engineControlRef,
  isFrozen = false,
  streak = 0,
  isGoldenOverdrive = false,
  eliminatedIndices = [],
  questionKey = 0,
  isPaused = false,
  onSelectPillar,
}) {
  const mountRef = useRef(null);
  const propsRef = useRef({
    isFrozen,
    streak,
    isGoldenOverdrive,
    eliminatedIndices,
    isPaused,
    onSelectPillar,
  });

  useEffect(() => {
    propsRef.current = {
      isFrozen,
      streak,
      isGoldenOverdrive,
      eliminatedIndices,
      isPaused,
      onSelectPillar,
    };
  }, [isFrozen, streak, isGoldenOverdrive, eliminatedIndices, isPaused, onSelectPillar]);

  // Reset barrier positions whenever questionKey advances
  const resetSignalRef = useRef(0);
  useEffect(() => {
    resetSignalRef.current += 1;
  }, [questionKey]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const disposableGeos = [];
    const disposableMats = [];
    const disposableTex = [];

    const trackGeo = (g) => {
      disposableGeos.push(g);
      return g;
    };
    const trackMat = (m) => {
      disposableMats.push(m);
      return m;
    };
    const trackTex = (t) => {
      disposableTex.push(t);
      return t;
    };

    const width = Math.max(container.clientWidth || 320, 100);
    const height = Math.max(container.clientHeight || 240, 100);

    const scene = new THREE.Scene();
    const emeraldFogColor = new THREE.Color(0x021310);
    const iceFogColor = new THREE.Color(0x041e2e);
    const goldFogColor = new THREE.Color(0x1f1404);
    scene.background = emeraldFogColor.clone();
    scene.fog = new THREE.FogExp2(0x021310, 0.036);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 90);
    camera.position.set(0, 1.45, 7.6);
    camera.lookAt(0, 0.55, -6);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = false;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0x34d399, 0x04110f, 1.1);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfde68a, 1.8);
    keyLight.position.set(4, 7, 6);
    scene.add(keyLight);

    const tunnelLight = new THREE.PointLight(0x10b981, 3.5, 28, 1.5);
    tunnelLight.position.set(0, 1.2, -5);
    scene.add(tunnelLight);

    // Glow textures (AdditiveBlending sprites for lightweight mobile performance)
    const goldGlowTex = trackTex(createRadialGlowTexture('rgba(254, 240, 138, 0.95)', 'rgba(245, 158, 11, 0.35)'));
    const emeraldGlowTex = trackTex(createRadialGlowTexture('rgba(167, 243, 208, 0.95)', 'rgba(16, 185, 129, 0.35)'));
    const cyanGlowTex = trackTex(createRadialGlowTexture('rgba(186, 230, 253, 0.95)', 'rgba(56, 189, 248, 0.38)'));
    const redGlowTex = trackTex(createRadialGlowTexture('rgba(254, 202, 202, 0.95)', 'rgba(239, 68, 68, 0.42)'));

    // ====================================================
    // 1. ENDLESS OCTAGONAL EMERALD & GOLD WARP TUNNEL
    // ====================================================
    const tunnelGroup = new THREE.Group();
    scene.add(tunnelGroup);

    const ringGeo = trackGeo(new THREE.TorusGeometry(6.8, 0.085, 6, 8));
    const outerFrameGeo = trackGeo(new THREE.TorusGeometry(7.05, 0.045, 6, 8));
    const ringEmeraldMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.95,
        metalness: 0.6,
        roughness: 0.25,
      })
    );
    const ringGoldMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xd97706,
        emissiveIntensity: 0.75,
        metalness: 0.85,
        roughness: 0.2,
      })
    );

    const RING_COUNT = 16;
    const RING_SPACING = 3.2;
    const tunnelRings = [];
    for (let i = 0; i < RING_COUNT; i += 1) {
      const rGroup = new THREE.Group();
      const inner = new THREE.Mesh(ringGeo, i % 2 === 0 ? ringEmeraldMat : ringGoldMat);
      inner.rotation.z = Math.PI / 8;
      const outer = new THREE.Mesh(outerFrameGeo, i % 2 === 0 ? ringGoldMat : ringEmeraldMat);
      outer.rotation.z = Math.PI / 8;
      rGroup.add(inner, outer);
      rGroup.position.z = 5 - i * RING_SPACING;
      tunnelGroup.add(rGroup);
      tunnelRings.push(rGroup);
    }

    // Track lane rails (floor guides)
    const railGeo = trackGeo(new THREE.BoxGeometry(0.06, 0.06, 56));
    const railMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x065f46,
        emissive: 0x047857,
        emissiveIntensity: 0.55,
        metalness: 0.7,
        roughness: 0.3,
      })
    );
    [-3.7, -1.8, 0, 1.8, 3.7].forEach((rx) => {
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(rx, -1.65, -20);
      tunnelGroup.add(rail);
    });

    // Warp Speed Lines
    const streakGeo = trackGeo(new THREE.BoxGeometry(0.03, 0.03, 1.4));
    const streakMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x6ee7b7,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
      })
    );
    const speedLines = [];
    for (let i = 0; i < 28; i += 1) {
      const angle = (i / 28) * Math.PI * 2;
      const radius = 4.6 + (i % 3) * 0.7;
      const line = new THREE.Mesh(streakGeo, streakMat);
      line.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.75, -Math.random() * 44);
      tunnelGroup.add(line);
      speedLines.push(line);
    }

    // ====================================================
    // 2. CENTRAL FLOATING GOLDEN MIZAN REACTOR (AIMABLE)
    // ====================================================
    const mizanRoot = new THREE.Group();
    mizanRoot.position.set(0, -0.58, 4.15);
    scene.add(mizanRoot);

    const goldMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xb45309,
        emissiveIntensity: 0.45,
        metalness: 0.88,
        roughness: 0.18,
      })
    );
    const bronzeMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xd97706,
        metalness: 0.82,
        roughness: 0.28,
      })
    );
    const reactorOrbMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.5,
        metalness: 0.2,
        roughness: 0.1,
      })
    );

    const baseRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.62, 0.055, 8, 24)), goldMat);
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.y = -0.35;
    mizanRoot.add(baseRing);

    const turretPivot = new THREE.Group();
    mizanRoot.add(turretPivot);

    const pillarCore = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.08, 0.14, 0.86, 12)), goldMat);
    pillarCore.position.y = 0.06;
    turretPivot.add(pillarCore);

    const reactorOrb = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.22, 1)), reactorOrbMat);
    reactorOrb.position.set(0, 0.54, 0);
    turretPivot.add(reactorOrb);

    const orbHalo = new THREE.Sprite(
      trackMat(
        new THREE.SpriteMaterial({
          map: goldGlowTex,
          color: 0xfde047,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      )
    );
    orbHalo.scale.set(1.4, 1.4, 1);
    orbHalo.position.copy(reactorOrb.position);
    turretPivot.add(orbHalo);

    // Balance Crossbar & Pans
    const beamArm = new THREE.Group();
    beamArm.position.set(0, 0.34, 0);
    turretPivot.add(beamArm);

    const crossbar = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.18, 0.045, 0.045)), goldMat);
    beamArm.add(crossbar);

    const panGeo = trackGeo(new THREE.CylinderGeometry(0.18, 0.09, 0.06, 12));
    const cordGeo = trackGeo(new THREE.CylinderGeometry(0.01, 0.01, 0.28, 6));
    [-0.54, 0.54].forEach((px) => {
      const cord = new THREE.Mesh(cordGeo, bronzeMat);
      cord.position.set(px, -0.14, 0);
      const pan = new THREE.Mesh(panGeo, goldMat);
      pan.position.set(px, -0.28, 0);
      beamArm.add(cord, pan);
    });

    // ====================================================
    // 3. APPROACHING 4 CRYSTAL PILLARS BARRIER (1-4)
    // ====================================================
    const barrierGroup = new THREE.Group();
    const BARRIER_START_Z = -18;
    const BARRIER_TARGET_Z = -4.5;
    barrierGroup.position.set(0, 0, BARRIER_START_Z);
    scene.add(barrierGroup);

    const barrierGateBeam = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(7.2, 0.14, 0.22)),
      ringGoldMat
    );
    barrierGateBeam.position.set(0, -1.45, 0);
    barrierGroup.add(barrierGateBeam);

    const pillarGeo = trackGeo(new THREE.CylinderGeometry(0.38, 0.48, 2.35, 6));
    const pillarCapGeo = trackGeo(new THREE.OctahedronGeometry(0.32, 0));
    const pillarBaseGeo = trackGeo(new THREE.CylinderGeometry(0.56, 0.62, 0.22, 6));

    const pillars = [];
    for (let i = 0; i < 4; i += 1) {
      const pGroup = new THREE.Group();
      pGroup.position.set(PILLAR_X[i], -0.22, 0);

      const pMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x059669,
          emissiveIntensity: 0.72,
          metalness: 0.45,
          roughness: 0.18,
          transparent: true,
          opacity: 0.92,
        })
      );

      const crystalMesh = new THREE.Mesh(pillarGeo, pMat);
      crystalMesh.userData = { pillarIndex: i };
      pGroup.add(crystalMesh);

      const capMesh = new THREE.Mesh(pillarCapGeo, reactorOrbMat);
      capMesh.position.y = 1.48;
      capMesh.userData = { pillarIndex: i };
      pGroup.add(capMesh);

      const plinth = new THREE.Mesh(pillarBaseGeo, goldMat);
      plinth.position.y = -1.16;
      plinth.userData = { pillarIndex: i };
      pGroup.add(plinth);

      const pHalo = new THREE.Sprite(
        trackMat(
          new THREE.SpriteMaterial({
            map: emeraldGlowTex,
            color: 0x34d399,
            transparent: true,
            opacity: 0.55,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          })
        )
      );
      pHalo.scale.set(2.1, 2.5, 1);
      pGroup.add(pHalo);

      const badgeTex = trackTex(createNumberBadgeTexture(i + 1));
      const badgeSprite = new THREE.Sprite(
        trackMat(
          new THREE.SpriteMaterial({
            map: badgeTex,
            transparent: true,
            depthTest: false,
          })
        )
      );
      badgeSprite.scale.set(0.75, 0.75, 1);
      badgeSprite.position.set(0, 1.98, 0.2);
      pGroup.add(badgeSprite);

      barrierGroup.add(pGroup);
      pillars.push({
        group: pGroup,
        mesh: crystalMesh,
        mat: pMat,
        halo: pHalo,
        cap: capMesh,
        hitScaleBoost: 0,
      });
    }

    // ====================================================
    // 4. POOLED ENERGY BEAM, SHOCKWAVE, SHARDS & 50:50 LIGHTNING
    // ====================================================
    const beamMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      })
    );
    const beamMesh = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.08, 0.14, 1, 8)), beamMat);
    beamMesh.visible = false;
    scene.add(beamMesh);

    const shockwaveMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xfde047,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      })
    );
    const shockwaveMesh = new THREE.Mesh(trackGeo(new THREE.RingGeometry(0.35, 0.62, 24)), shockwaveMat);
    shockwaveMesh.visible = false;
    scene.add(shockwaveMesh);

    // Pooled 3D Crystal Shards / Ricochet Sparks (32 items)
    const SHARD_COUNT = 32;
    const shardGeo = trackGeo(new THREE.TetrahedronGeometry(0.16, 0));
    const shards = [];
    for (let i = 0; i < SHARD_COUNT; i += 1) {
      const sMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? 0x34d399 : 0xfde047,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
        })
      );
      const sMesh = new THREE.Mesh(shardGeo, sMat);
      sMesh.visible = false;
      scene.add(sMesh);
      shards.push({
        mesh: sMesh,
        mat: sMat,
        vel: new THREE.Vector3(),
        rot: new THREE.Vector3(),
        life: 0,
        maxLife: 0.7,
      });
    }

    // Two 50:50 Cyan Lightning Bolts (THREE.Line)
    const lightningBolts = [];
    for (let b = 0; b < 2; b += 1) {
      const pts = [];
      for (let k = 0; k < 10; k += 1) pts.push(new THREE.Vector3());
      const lGeo = trackGeo(new THREE.BufferGeometry().setFromPoints(pts));
      const lMat = trackMat(
        new THREE.LineBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
        })
      );
      const line = new THREE.Line(lGeo, lMat);
      line.visible = false;
      scene.add(line);
      lightningBolts.push({ line, geo: lGeo, mat: lMat, timer: 0 });
    }

    // Transient VFX state
    const fxState = {
      aimYaw: 0,
      targetAimYaw: 0,
      beamTimer: 0,
      beamStart: new THREE.Vector3(0, -0.05, 4.15),
      beamEnd: new THREE.Vector3(0, 0, -5),
      beamColor: 0xfde047,
      shockwaveTimer: 0,
      shakeAmp: 0,
      lastResetSignal: resetSignalRef.current,
      barrierApproachZ: BARRIER_START_Z,
      shatterPause: 0,
      mizanTiltTarget: 0,
      mizanTilt: 0,
    };

    const spawnBurst = (origin, colorHex, count = 20, speedScale = 1) => {
      let spawned = 0;
      for (let i = 0; i < shards.length && spawned < count; i += 1) {
        const s = shards[i];
        if (s.life <= 0) {
          s.mesh.position.copy(origin);
          s.mesh.visible = true;
          s.mat.color.setHex(spawned % 3 === 0 ? 0xfef08a : colorHex);
          s.mat.opacity = 1;
          s.vel.set(
            (Math.random() - 0.5) * 9 * speedScale,
            (Math.random() * 6 - 1.2) * speedScale,
            (Math.random() - 0.35) * 7 * speedScale
          );
          s.rot.set(Math.random() * 9, Math.random() * 9, Math.random() * 9);
          s.maxLife = 0.5 + Math.random() * 0.35;
          s.life = s.maxLife;
          spawned += 1;
        }
      }
    };

    const positionCylinderBeam = (start, end) => {
      const dir = new THREE.Vector3().subVectors(end, start);
      const len = Math.max(dir.length(), 0.01);
      beamMesh.position.copy(start).addScaledVector(dir, 0.5);
      beamMesh.scale.set(1, len, 1);
      beamMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    };

    // Expose imperative controls for SprintGame.jsx
    if (engineControlRef) {
      engineControlRef.current = {
        fireBeamShot: (pillarIdx, isCorrect) => {
          const idx = Math.max(0, Math.min(3, pillarIdx));
          const targetWorld = new THREE.Vector3();
          pillars[idx].group.getWorldPosition(targetWorld);
          targetWorld.y += 0.2;

          const startWorld = new THREE.Vector3(0, -0.02, 4.1);
          const dx = targetWorld.x - startWorld.x;
          const dz = targetWorld.z - startWorld.z;
          fxState.targetAimYaw = Math.atan2(-dx, -dz);
          fxState.mizanTiltTarget = idx < 2 ? 0.28 : -0.28;

          fxState.beamStart.copy(startWorld);
          fxState.beamEnd.copy(targetWorld);
          fxState.beamColor = isCorrect ? 0xfde047 : 0xf87171;
          fxState.beamTimer = 0.34;
          beamMat.color.setHex(fxState.beamColor);
          beamMesh.visible = true;
          positionCylinderBeam(startWorld, targetWorld);

          if (isCorrect) {
            shockwaveMesh.position.copy(targetWorld);
            shockwaveMesh.scale.set(0.4, 0.4, 0.4);
            shockwaveMesh.visible = true;
            fxState.shockwaveTimer = 0.45;
            fxState.shakeAmp = 0.24;
            fxState.shatterPause = 0.32;
            pillars.forEach((p) => {
              const wp = new THREE.Vector3();
              p.group.getWorldPosition(wp);
              spawnBurst(wp, propsRef.current.isGoldenOverdrive ? 0xfbbf24 : 0x34d399, 7, 1.15);
            });
          } else {
            pillars[idx].hitScaleBoost = 0.26;
            fxState.shakeAmp = 0.3;
            spawnBurst(targetWorld, 0xef4444, 14, 0.9);
          }
        },
        fireFiftyBolts: (wrongIndices) => {
          const origin = new THREE.Vector3(0, -0.02, 4.1);
          wrongIndices.slice(0, 2).forEach((pIdx, slot) => {
            const bolt = lightningBolts[slot];
            if (!bolt || !pillars[pIdx]) return;
            const targetWorld = new THREE.Vector3();
            pillars[pIdx].group.getWorldPosition(targetWorld);
            const posAttr = bolt.geo.getAttribute('position');
            const segments = posAttr.count - 1;
            for (let k = 0; k <= segments; k += 1) {
              const t = k / segments;
              const x = THREE.MathUtils.lerp(origin.x, targetWorld.x, t) + (k > 0 && k < segments ? (Math.random() - 0.5) * 0.65 : 0);
              const y = THREE.MathUtils.lerp(origin.y, targetWorld.y + 0.3, t) + (k > 0 && k < segments ? (Math.random() - 0.5) * 0.55 : 0);
              const z = THREE.MathUtils.lerp(origin.z, targetWorld.z, t);
              posAttr.setXYZ(k, x, y, z);
            }
            posAttr.needsUpdate = true;
            bolt.line.visible = true;
            bolt.mat.opacity = 1;
            bolt.timer = 0.42;
            spawnBurst(targetWorld, 0x38bdf8, 9, 0.85);
          });
          fxState.shakeAmp = 0.14;
        },
      };
    }

    // Raycaster for 3D Pillar direct tapping
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const clickableMeshes = pillars.flatMap((p) => p.group.children.filter((c) => c.userData && c.userData.pillarIndex !== undefined));

    const handlePointerDown = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(clickableMeshes, false);
      if (hits.length > 0) {
        const pIdx = hits[0].object.userData.pillarIndex;
        if (typeof pIdx === 'number' && !propsRef.current.eliminatedIndices.includes(pIdx)) {
          propsRef.current.onSelectPillar?.(pIdx);
        }
      }
    };
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // ResizeObserver for mobile responsive framing
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(entry.contentRect.width, 100);
        const h = Math.max(entry.contentRect.height, 100);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      }
    });
    resizeObserver.observe(container);

    // ====================================================
    // 5. 60 FPS DECOUPLED ANIMATION LOOP
    // ====================================================
    const clock = new THREE.Clock();
    let rafId = 0;
    let elapsed = 0;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const {
        isFrozen: frozen,
        streak: curStreak,
        isGoldenOverdrive: overdrive,
        eliminatedIndices: eliminated,
        isPaused: paused,
      } = propsRef.current;

      // Reset barrier when questionKey changes
      if (resetSignalRef.current !== fxState.lastResetSignal) {
        fxState.lastResetSignal = resetSignalRef.current;
        fxState.barrierApproachZ = BARRIER_START_Z;
        fxState.shatterPause = 0;
        fxState.targetAimYaw = 0;
        fxState.mizanTiltTarget = 0;
      }

      if (!paused) {
        elapsed += dt;
      }

      // Dynamic Camera FOV (widens during streak >= 5 fever)
      const targetFov = frozen ? 57 : curStreak >= 5 || overdrive ? 73 : 60 + Math.min(curStreak, 4) * 1.1;
      if (Math.abs(camera.fov - targetFov) > 0.05) {
        camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, dt * 4.5);
        camera.updateProjectionMatrix();
      }

      // Dynamic Lighting & Fog Shift (Frozen Cyan vs Golden Overdrive vs Emerald)
      const targetFog = frozen ? iceFogColor : overdrive ? goldFogColor : emeraldFogColor;
      scene.background.lerp(targetFog, dt * 6);
      scene.fog.color.copy(scene.background);

      if (frozen) {
        tunnelLight.color.lerp(new THREE.Color(0x38bdf8), dt * 6);
        ringEmeraldMat.emissive.lerp(new THREE.Color(0x0284c7), dt * 6);
        ringEmeraldMat.color.lerp(new THREE.Color(0x38bdf8), dt * 6);
      } else if (overdrive) {
        tunnelLight.color.lerp(new THREE.Color(0xfbbf24), dt * 6);
        ringEmeraldMat.emissive.lerp(new THREE.Color(0xd97706), dt * 6);
        ringEmeraldMat.color.lerp(new THREE.Color(0xfde047), dt * 6);
      } else {
        tunnelLight.color.lerp(new THREE.Color(0x10b981), dt * 5);
        ringEmeraldMat.emissive.lerp(new THREE.Color(0x059669), dt * 5);
        ringEmeraldMat.color.lerp(new THREE.Color(0x10b981), dt * 5);
      }

      // Tunnel scroll & rotation (pauses when frozen)
      const tunnelSpeed = frozen || paused ? 0 : overdrive ? 19.5 : 11.5 + Math.min(curStreak, 8) * 1.1;
      const maxDepth = RING_COUNT * RING_SPACING;
      for (let i = 0; i < tunnelRings.length; i += 1) {
        const ring = tunnelRings[i];
        ring.position.z += tunnelSpeed * dt;
        if (!frozen && !paused) {
          ring.rotation.z += dt * (i % 2 === 0 ? 0.22 : -0.18);
        }
        if (ring.position.z > 7.5) {
          ring.position.z -= maxDepth;
        }
      }

      // Speed lines
      streakMat.opacity = frozen ? 0.14 : overdrive ? 0.85 : 0.45;
      streakMat.color.setHex(frozen ? 0x7dd3fc : overdrive ? 0xfde047 : 0x6ee7b7);
      for (let i = 0; i < speedLines.length; i += 1) {
        const line = speedLines[i];
        if (!frozen && !paused) {
          line.position.z += tunnelSpeed * 1.8 * dt;
          if (line.position.z > 8) line.position.z = -38;
        }
      }

      // Floating Mizan Reactor idle + aim swivel
      mizanRoot.position.y = -0.58 + Math.sin(elapsed * 2.8) * 0.055;
      fxState.aimYaw = THREE.MathUtils.lerp(fxState.aimYaw, fxState.targetAimYaw, dt * 13);
      turretPivot.rotation.y = fxState.aimYaw;
      reactorOrb.rotation.y += dt * 1.9;
      reactorOrb.rotation.x += dt * 0.9;
      fxState.mizanTilt = THREE.MathUtils.lerp(fxState.mizanTilt, fxState.mizanTiltTarget, dt * 10);
      fxState.mizanTiltTarget = THREE.MathUtils.lerp(fxState.mizanTiltTarget, 0, dt * 2.8);
      beamArm.rotation.z = Math.sin(elapsed * 2.1) * 0.06 + fxState.mizanTilt;

      // Barrier smooth approach toward target distance
      if (!paused && !frozen && fxState.shatterPause <= 0) {
        fxState.barrierApproachZ = THREE.MathUtils.lerp(fxState.barrierApproachZ, BARRIER_TARGET_Z, dt * 4.5);
      }
      if (fxState.shatterPause > 0) {
        fxState.shatterPause -= dt;
      }
      barrierGroup.position.z = fxState.barrierApproachZ;

      // Crystal pillars state (Overdrive Gold vs Emerald vs Eliminated)
      for (let i = 0; i < pillars.length; i += 1) {
        const p = pillars[i];
        const isElim = eliminated.includes(i);
        const targetScale = isElim ? 0.001 : 1 + p.hitScaleBoost;
        p.group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), dt * 14);
        p.group.visible = p.group.scale.x > 0.04;
        p.hitScaleBoost = THREE.MathUtils.lerp(p.hitScaleBoost, 0, dt * 10);
        p.cap.rotation.y += dt * 2.2;

        if (overdrive) {
          p.mat.color.lerp(new THREE.Color(0xfbbf24), dt * 8);
          p.mat.emissive.lerp(new THREE.Color(0xd97706), dt * 8);
          p.halo.material.map = goldGlowTex;
          p.halo.material.color.setHex(0xfde047);
        } else if (frozen) {
          p.mat.color.lerp(new THREE.Color(0x38bdf8), dt * 8);
          p.mat.emissive.lerp(new THREE.Color(0x0284c7), dt * 8);
          p.halo.material.map = cyanGlowTex;
          p.halo.material.color.setHex(0x7dd3fc);
        } else {
          p.mat.color.lerp(new THREE.Color(0x10b981), dt * 8);
          p.mat.emissive.lerp(new THREE.Color(0x059669), dt * 8);
          p.halo.material.map = emeraldGlowTex;
          p.halo.material.color.setHex(0x34d399);
        }
      }

      // Energy Beam update
      if (fxState.beamTimer > 0) {
        fxState.beamTimer -= dt;
        const alpha = Math.max(0, fxState.beamTimer / 0.34);
        beamMat.opacity = alpha;
        positionCylinderBeam(fxState.beamStart, fxState.beamEnd);
        if (fxState.beamTimer <= 0) beamMesh.visible = false;
      }

      // Shockwave Ring update
      if (fxState.shockwaveTimer > 0) {
        fxState.shockwaveTimer -= dt;
        const progress = 1 - fxState.shockwaveTimer / 0.45;
        const scale = 0.5 + progress * 10;
        shockwaveMesh.scale.set(scale, scale, scale);
        shockwaveMat.opacity = Math.max(0, (1 - progress) * 0.85);
        if (fxState.shockwaveTimer <= 0) shockwaveMesh.visible = false;
      }

      // 50:50 Lightning update
      for (let b = 0; b < lightningBolts.length; b += 1) {
        const bolt = lightningBolts[b];
        if (bolt.timer > 0) {
          bolt.timer -= dt;
          bolt.mat.opacity = Math.max(0, bolt.timer / 0.42);
          if (bolt.timer <= 0) bolt.line.visible = false;
        }
      }

      // Crystal Shards physics
      for (let i = 0; i < shards.length; i += 1) {
        const s = shards[i];
        if (s.life > 0) {
          s.life -= dt;
          s.vel.y -= 13.5 * dt;
          s.mesh.position.addScaledVector(s.vel, dt);
          s.mesh.rotation.x += s.rot.x * dt;
          s.mesh.rotation.y += s.rot.y * dt;
          s.mat.opacity = Math.max(0, s.life / s.maxLife);
          if (s.life <= 0) s.mesh.visible = false;
        }
      }

      // Damped Camera Shake
      if (fxState.shakeAmp > 0.002) {
        camera.position.x = (Math.random() - 0.5) * fxState.shakeAmp;
        camera.position.y = 1.45 + (Math.random() - 0.5) * fxState.shakeAmp;
        fxState.shakeAmp = THREE.MathUtils.lerp(fxState.shakeAmp, 0, dt * 11);
      } else {
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, dt * 10);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.45, dt * 10);
      }
      camera.lookAt(0, 0.45, -6);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);

      disposableGeos.forEach((g) => g.dispose());
      disposableMats.forEach((m) => m.dispose());
      disposableTex.forEach((t) => t.dispose());
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        touchAction: 'manipulation',
        userSelect: 'none',
      }}
      aria-label="Enjin 3D Terowong Mizan Sprint 60 Saat"
    />
  );
}
