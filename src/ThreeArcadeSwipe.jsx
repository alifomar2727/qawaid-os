import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

function createRadialGlowTexture(innerRgba, midRgba) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
  grad.addColorStop(0, innerRgba);
  grad.addColorStop(0.38, midRgba);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function wrapTextLines(ctx, text, maxWidth, maxLines = 8) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return ['Memuatkan senario...'];
  const lines = [];
  let line = '';
  let truncated = false;

  for (let i = 0; i < words.length; i += 1) {
    const word = words[i];
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      if (lines.length >= maxLines) {
        truncated = true;
        line = '';
        break;
      }
      line = word;
    } else {
      line = testLine;
    }
  }

  if (line && lines.length < maxLines) {
    lines.push(line);
  }

  if (truncated && lines.length > 0) {
    let last = lines[lines.length - 1];
    while (last.length > 3 && ctx.measureText(`${last}...`).width > maxWidth) {
      last = last.slice(0, -1).trimEnd();
    }
    lines[lines.length - 1] = `${last}...`;
  }

  return lines;
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function createFrontCardTexture(card) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1184;
  const ctx = canvas.getContext('2d');

  // Crisp luminous teal-slate background for effortless text contrast
  const bg = ctx.createLinearGradient(0, 0, 0, 1184);
  bg.addColorStop(0, '#13383b');
  bg.addColorStop(0.5, '#0d272c');
  bg.addColorStop(1, '#08191e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1024, 1184);

  // Soft central spotlight backdrop behind scenario text
  const centerGlow = ctx.createRadialGradient(512, 600, 40, 512, 600, 480);
  centerGlow.addColorStop(0, 'rgba(30, 86, 92, 0.42)');
  centerGlow.addColorStop(1, 'rgba(8, 25, 30, 0)');
  ctx.fillStyle = centerGlow;
  ctx.fillRect(40, 180, 944, 860);

  // Ornamental gold & emerald double frame
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
  ctx.lineWidth = 10;
  drawRoundedRect(ctx, 28, 28, 968, 1128, 40);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(52, 211, 153, 0.45)';
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, 50, 50, 924, 1084, 28);
  ctx.stroke();

  // Header badge pill
  const tagText = (card?.kategoriIsu || card?.tag || 'KES REALITI KONTEMPORARI').toUpperCase();
  ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
  drawRoundedRect(ctx, 112, 86, 800, 74, 37);
  ctx.fill();
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.72)';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.font = '800 30px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fef08a';
  ctx.fillText(tagText.slice(0, 38), 512, 123);

  // Top label
  ctx.font = '800 28px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#6ee7b7';
  ctx.fillText('SENARIO / ISU REALITI:', 512, 226);

  // Adaptive font sizing so long or short scenarios fill the card cleanly & sharply
  const scenarioText = card?.isu || card?.senario || 'Memuatkan senario...';
  const maxTextWidth = 856;
  let fontSize = 54;
  let lineHeight = 76;
  ctx.font = `700 ${fontSize}px system-ui, -apple-system, sans-serif`;
  let lines = wrapTextLines(ctx, scenarioText, maxTextWidth, 10);

  if (lines.length > 5) {
    fontSize = 48;
    lineHeight = 68;
    ctx.font = `700 ${fontSize}px system-ui, -apple-system, sans-serif`;
    lines = wrapTextLines(ctx, scenarioText, maxTextWidth, 10);
  }
  if (lines.length > 7) {
    fontSize = 42;
    lineHeight = 60;
    ctx.font = `700 ${fontSize}px system-ui, -apple-system, sans-serif`;
    lines = wrapTextLines(ctx, scenarioText, maxTextWidth, 9);
  }

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  const totalHeight = lines.length * lineHeight;
  const startY = Math.max(305, 610 - totalHeight / 2 + lineHeight * 0.42);
  lines.forEach((ln, idx) => {
    ctx.fillText(ln, 512, startY + idx * lineHeight);
  });
  ctx.restore();

  // Divider accent above footer
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(150, 1030);
  ctx.lineTo(874, 1030);
  ctx.stroke();

  // Clear footer hint
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '700 28px system-ui, -apple-system, sans-serif';
  ctx.fillText('← TOLAK (TIDAK RELEVAN)   |   SESUAI (TEPAT) →', 512, 1084);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function createBackCardTexture(card) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 960;
  const ctx = canvas.getContext('2d');

  // Rich engraved golden-bronze relic reverse face
  const bg = ctx.createLinearGradient(0, 0, 768, 960);
  bg.addColorStop(0, '#422806');
  bg.addColorStop(0.5, '#251605');
  bg.addColorStop(1, '#180d03');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 768, 960);

  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 12;
  drawRoundedRect(ctx, 28, 28, 712, 904, 34);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(253, 224, 71, 0.45)';
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, 50, 50, 668, 860, 22);
  ctx.stroke();

  // Header alert
  ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
  drawRoundedRect(ctx, 114, 86, 540, 66, 33);
  ctx.fill();
  ctx.strokeStyle = 'rgba(248, 113, 113, 0.6)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.font = '800 27px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fecaca';
  ctx.fillText('KAEDAH SEBENAR YANG TEPAT', 384, 119);

  // Arabic Kaedah engraved gold
  const arText = card?.kaedahAsalAr || card?.targetKaedahAr || '';
  ctx.font = '700 46px "Noto Naskh Arabic", serif';
  ctx.fillStyle = '#fde047';
  const arLines = wrapTextLines(ctx, arText, 610, 4);
  arLines.forEach((ln, idx) => {
    ctx.fillText(ln, 384, 300 + idx * 66);
  });

  // Divider gold bar
  ctx.fillStyle = 'rgba(251, 191, 36, 0.5)';
  ctx.fillRect(184, 570, 400, 4);

  // Malay Kaedah meaning
  const bmText = `"${card?.kaedahAsalBm || card?.targetKaedahBm || ''}"`;
  ctx.font = '600 31px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#fef3c7';
  const bmLines = wrapTextLines(ctx, bmText, 610, 5);
  bmLines.forEach((ln, idx) => {
    ctx.fillText(ln, 384, 640 + idx * 46);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function createStampTexture(label, strokeHex, bgRgba) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 512, 192);

  ctx.fillStyle = bgRgba;
  drawRoundedRect(ctx, 20, 24, 472, 144, 26);
  ctx.fill();

  ctx.strokeStyle = strokeHex;
  ctx.lineWidth = 10;
  ctx.stroke();

  ctx.font = '900 58px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = strokeHex;
  ctx.fillText(label, 256, 98);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createPortalLabelTexture(label, textColor) {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 110;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(6, 15, 22, 0.85)';
  drawRoundedRect(ctx, 14, 14, 292, 82, 24);
  ctx.fill();
  ctx.strokeStyle = textColor;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.font = '800 34px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = textColor;
  ctx.fillText(label, 160, 56);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export default function ThreeArcadeSwipe({
  card,
  cardKey = 0,
  swipeControlRef,
  onSwipeGesture,
  isLocked = false,
}) {
  const mountRef = useRef(null);
  const propsRef = useRef({ card, cardKey, onSwipeGesture, isLocked });

  useEffect(() => {
    propsRef.current = { card, cardKey, onSwipeGesture, isLocked };
  }, [card, cardKey, onSwipeGesture, isLocked]);

  // Ref to signal texture rebuild when cardKey changes
  const textureUpdateRef = useRef(0);
  useEffect(() => {
    textureUpdateRef.current += 1;
  }, [cardKey]);

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
    const height = Math.max(container.clientHeight || 280, 100);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040b12);
    scene.fog = new THREE.FogExp2(0x040b12, 0.045);

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 60);
    camera.position.set(0, 0.55, 5.75);
    camera.lookAt(0, 0.14, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'none';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xfef3c7, 0x091622, 0.95);
    scene.add(hemiLight);

    const spotLight = new THREE.SpotLight(0xfef08a, 4.2, 18, Math.PI / 4, 0.45);
    spotLight.position.set(0.8, 4.5, 5.2);
    scene.add(spotLight);

    const leftCrimsonLight = new THREE.PointLight(0xef4444, 3.0, 9);
    leftCrimsonLight.position.set(-3.4, 0.5, -0.6);
    scene.add(leftCrimsonLight);

    const rightEmeraldLight = new THREE.PointLight(0x10b981, 3.0, 9);
    rightEmeraldLight.position.set(3.4, 0.5, -0.6);
    scene.add(rightEmeraldLight);

    // Glow textures
    const crimsonGlowTex = trackTex(createRadialGlowTexture('rgba(254, 202, 202, 0.95)', 'rgba(239, 68, 68, 0.4)'));
    const emeraldGlowTex = trackTex(createRadialGlowTexture('rgba(167, 243, 208, 0.95)', 'rgba(16, 185, 129, 0.4)'));
    const goldGlowTex = trackTex(createRadialGlowTexture('rgba(254, 240, 138, 0.95)', 'rgba(245, 158, 11, 0.35)'));

    // ====================================================
    // 1. DARK SANCTUARY PEDESTAL
    // ====================================================
    const pedestalMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.72,
        roughness: 0.32,
      })
    );
    const goldMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0x92400e,
        emissiveIntensity: 0.4,
        metalness: 0.88,
        roughness: 0.2,
      })
    );

    const pedestalMesh = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(2.3, 2.75, 0.32, 24)), pedestalMat);
    pedestalMesh.position.set(0, -1.95, 0);
    scene.add(pedestalMesh);

    const pedestalRim = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(2.32, 0.045, 8, 36)), goldMat);
    pedestalRim.rotation.x = Math.PI / 2;
    pedestalRim.position.set(0, -1.78, 0);
    scene.add(pedestalRim);

    // ====================================================
    // 2. REACTIVE 3D MIZAN BALANCE SCALE BACKDROP
    // ====================================================
    const mizanGroup = new THREE.Group();
    mizanGroup.position.set(0, 0.35, -2.6);
    scene.add(mizanGroup);

    const scaleStand = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.11, 0.22, 3.8, 12)), goldMat);
    scaleStand.position.y = -0.3;
    mizanGroup.add(scaleStand);

    const scaleBase = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.95, 1.15, 0.22, 16)), goldMat);
    scaleBase.position.y = -2.1;
    mizanGroup.add(scaleBase);

    const scaleBeamPivot = new THREE.Group();
    scaleBeamPivot.position.set(0, 1.55, 0);
    mizanGroup.add(scaleBeamPivot);

    const scaleCrossbar = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.8, 0.11, 0.11)), goldMat);
    scaleBeamPivot.add(scaleCrossbar);

    const panLeftGroup = new THREE.Group();
    panLeftGroup.position.set(-1.75, 0, 0);
    const panRightGroup = new THREE.Group();
    panRightGroup.position.set(1.75, 0, 0);
    scaleBeamPivot.add(panLeftGroup, panRightGroup);

    const panCordGeo = trackGeo(new THREE.CylinderGeometry(0.02, 0.02, 1.05, 6));
    const panPlateGeo = trackGeo(new THREE.CylinderGeometry(0.55, 0.3, 0.12, 16));

    [panLeftGroup, panRightGroup].forEach((pg) => {
      const cord = new THREE.Mesh(panCordGeo, goldMat);
      cord.position.y = -0.52;
      const plate = new THREE.Mesh(panPlateGeo, goldMat);
      plate.position.y = -1.06;
      pg.add(cord, plate);
    });

    const mizanHalo = new THREE.Sprite(
      trackMat(
        new THREE.SpriteMaterial({
          map: goldGlowTex,
          color: 0xfde047,
          transparent: true,
          opacity: 0.32,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      )
    );
    mizanHalo.scale.set(4.6, 4.6, 1);
    mizanHalo.position.set(0, 0.7, -0.3);
    mizanGroup.add(mizanHalo);

    // ====================================================
    // 3. LEFT CRIMSON ("TOLAK ✕") & RIGHT EMERALD ("SESUAI ✓") PORTALS
    // ====================================================
    const buildPortal = (xPos, ringHex, glowTex, labelText, labelHex) => {
      const pGroup = new THREE.Group();
      pGroup.position.set(xPos, 0.18, -1.25);
      pGroup.rotation.y = xPos < 0 ? 0.48 : -0.48;

      const ringMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: ringHex,
          emissive: ringHex,
          emissiveIntensity: 0.95,
          metalness: 0.65,
          roughness: 0.2,
        })
      );
      const torus = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.95, 0.085, 10, 28)), ringMat);
      pGroup.add(torus);

      const halo = new THREE.Sprite(
        trackMat(
          new THREE.SpriteMaterial({
            map: glowTex,
            color: ringHex,
            transparent: true,
            opacity: 0.68,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          })
        )
      );
      halo.scale.set(2.9, 2.9, 1);
      pGroup.add(halo);

      const labelTex = trackTex(createPortalLabelTexture(labelText, labelHex));
      const labelSprite = new THREE.Sprite(
        trackMat(
          new THREE.SpriteMaterial({
            map: labelTex,
            transparent: true,
            depthTest: false,
          })
        )
      );
      labelSprite.scale.set(1.65, 0.56, 1);
      labelSprite.position.set(0, -1.3, 0.1);
      pGroup.add(labelSprite);

      scene.add(pGroup);
      return { group: pGroup, torus, halo, baseScale: 1 };
    };

    const leftPortal = buildPortal(-3.55, 0xef4444, crimsonGlowTex, 'TOLAK ✕', '#fca5a5');
    const rightPortal = buildPortal(3.55, 0x10b981, emeraldGlowTex, 'SESUAI ✓', '#6ee7b7');

    // ====================================================
    // 4. THICK BEVELED 3D RELIC CARD + FRONT/BACK CANVAS TEXTURES + STAMP DECALS
    // ====================================================
    const cardGroup = new THREE.Group();
    cardGroup.position.set(0, 0.14, 1.72);
    scene.add(cardGroup);

    const cardEdgeMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0x78350f,
        emissiveIntensity: 0.35,
        metalness: 0.88,
        roughness: 0.22,
      })
    );

    let activeFrontTex = createFrontCardTexture(propsRef.current.card);
    let activeBackTex = createBackCardTexture(propsRef.current.card);

    const cardFrontMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: activeFrontTex,
        emissiveMap: activeFrontTex,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.85,
        roughness: 0.4,
        metalness: 0.08,
      })
    );
    const cardBackMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: activeBackTex,
        emissiveMap: activeBackTex,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.78,
        roughness: 0.34,
        metalness: 0.22,
      })
    );

    // BoxGeometry material order: +x, -x, +y, -y, +z (front), -z (back)
    const cardGeo = trackGeo(new THREE.BoxGeometry(2.74, 3.16, 0.12));
    const cardMesh = new THREE.Mesh(cardGeo, [
      cardEdgeMat,
      cardEdgeMat,
      cardEdgeMat,
      cardEdgeMat,
      cardFrontMat,
      cardBackMat,
    ]);
    cardGroup.add(cardMesh);

    // Stamp overlays on card front face
    const stampGeo = trackGeo(new THREE.PlaneGeometry(1.55, 0.58));
    const stampSesuaiTex = trackTex(createStampTexture('SESUAI ✓', '#34d399', 'rgba(6, 78, 59, 0.92)'));
    const stampTolakTex = trackTex(createStampTexture('TOLAK ✕', '#f87171', 'rgba(127, 29, 29, 0.92)'));

    const stampSesuaiMat = trackMat(
      new THREE.MeshBasicMaterial({
        map: stampSesuaiTex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      })
    );
    const stampTolakMat = trackMat(
      new THREE.MeshBasicMaterial({
        map: stampTolakTex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      })
    );

    const stampSesuaiMesh = new THREE.Mesh(stampGeo, stampSesuaiMat);
    stampSesuaiMesh.position.set(-0.32, 0.85, 0.068);
    stampSesuaiMesh.rotation.z = -0.22;

    const stampTolakMesh = new THREE.Mesh(stampGeo, stampTolakMat);
    stampTolakMesh.position.set(0.32, 0.85, 0.068);
    stampTolakMesh.rotation.z = 0.22;

    cardGroup.add(stampSesuaiMesh, stampTolakMesh);

    // ====================================================
    // 5. POOLED 3D PARTICLE BURST
    // ====================================================
    const PARTICLE_COUNT = 34;
    const pGeo = trackGeo(new THREE.OctahedronGeometry(0.11, 0));
    const particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      const pMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xfde047,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
        })
      );
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.visible = false;
      scene.add(pMesh);
      particles.push({
        mesh: pMesh,
        mat: pMat,
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 0.75,
      });
    }

    const spawnPortalBurst = (origin, colorHex, count = 24) => {
      let spawned = 0;
      for (let i = 0; i < particles.length && spawned < count; i += 1) {
        const pt = particles[i];
        if (pt.life <= 0) {
          pt.mesh.position.copy(origin);
          pt.mesh.visible = true;
          pt.mat.color.setHex(spawned % 3 === 0 ? 0xfde047 : colorHex);
          pt.mat.opacity = 1;
          pt.vel.set(
            (Math.random() - 0.5) * 7.5,
            (Math.random() * 5.5 - 1.0),
            (Math.random() - 0.3) * 5.0
          );
          pt.maxLife = 0.55 + Math.random() * 0.35;
          pt.life = pt.maxLife;
          spawned += 1;
        }
      }
    };

    // ====================================================
    // 6. INTERACTION & ANIMATION STATE (DRAG + FLING + 1.5s FLIP)
    // ====================================================
    const animState = {
      isDragging: false,
      startX: 0,
      dragNormX: 0, // -1 .. +1
      mode: 'IDLE', // 'IDLE' | 'FLING_CORRECT' | 'FLIP_WRONG'
      timer: 0,
      flingDir: 1, // -1 left, +1 right
      mizanPulseTimer: 0,
      lastTexSignal: textureUpdateRef.current,
    };

    const startDecisionAnimation = (direction, isCorrect) => {
      animState.isDragging = false;
      animState.flingDir = direction === 'RIGHT' ? 1 : -1;
      animState.timer = 0;

      if (isCorrect) {
        animState.mode = 'FLING_CORRECT';
        animState.mizanPulseTimer = 0.7;
      } else {
        animState.mode = 'FLIP_WRONG';
      }
    };

    if (swipeControlRef) {
      swipeControlRef.current = {
        triggerDecision: startDecisionAnimation,
      };
    }

    // Direct 3D Canvas Pointer Dragging (touchAction: 'none')
    const el = renderer.domElement;
    const onPointerDown = (e) => {
      if (propsRef.current.isLocked || animState.mode !== 'IDLE') return;
      animState.isDragging = true;
      animState.startX = e.clientX;
      try {
        el.setPointerCapture?.(e.pointerId);
      } catch {
        // ignore pointer capture error
      }
    };

    const onPointerMove = (e) => {
      if (!animState.isDragging || animState.mode !== 'IDLE') return;
      const dx = e.clientX - animState.startX;
      const maxSpan = Math.max(el.clientWidth * 0.36, 120);
      animState.dragNormX = THREE.MathUtils.clamp(dx / maxSpan, -1.25, 1.25);
    };

    const onPointerUp = (e) => {
      if (!animState.isDragging) return;
      animState.isDragging = false;
      try {
        el.releasePointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }
      const dx = e.clientX - animState.startX;
      if (dx > 68) {
        propsRef.current.onSwipeGesture?.('RIGHT');
      } else if (dx < -68) {
        propsRef.current.onSwipeGesture?.('LEFT');
      } else {
        animState.dragNormX = 0;
      }
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);

    // ResizeObserver
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
    // 7. 60 FPS DECOUPLED ANIMATION LOOP
    // ====================================================
    const clock = new THREE.Clock();
    let rafId = 0;
    let elapsed = 0;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;

      // Rebuild card CanvasTextures when cardKey increments
      if (textureUpdateRef.current !== animState.lastTexSignal) {
        animState.lastTexSignal = textureUpdateRef.current;
        const oldFront = activeFrontTex;
        const oldBack = activeBackTex;
        activeFrontTex = createFrontCardTexture(propsRef.current.card);
        activeBackTex = createBackCardTexture(propsRef.current.card);
        cardFrontMat.map = activeFrontTex;
        cardFrontMat.emissiveMap = activeFrontTex;
        cardFrontMat.needsUpdate = true;
        cardBackMat.map = activeBackTex;
        cardBackMat.emissiveMap = activeBackTex;
        cardBackMat.needsUpdate = true;
        oldFront?.dispose();
        oldBack?.dispose();

        // Reset card to center ready pose
        animState.mode = 'IDLE';
        animState.dragNormX = 0;
        animState.timer = 0;
        cardGroup.visible = true;
        cardGroup.position.set(0, 0.14, 1.72);
        cardGroup.rotation.set(0, 0, 0);
        cardGroup.scale.set(0.84, 0.84, 0.84);
      }

      // Spin portals & glow pulse
      leftPortal.torus.rotation.z -= dt * 1.1;
      rightPortal.torus.rotation.z += dt * 1.1;

      const dragAbs = Math.abs(animState.dragNormX);
      const leftScale = animState.dragNormX < -0.15 ? 1 + Math.min(dragAbs, 1) * 0.22 : 1;
      const rightScale = animState.dragNormX > 0.15 ? 1 + Math.min(dragAbs, 1) * 0.22 : 1;
      leftPortal.group.scale.lerp(new THREE.Vector3(leftScale, leftScale, leftScale), dt * 10);
      rightPortal.group.scale.lerp(new THREE.Vector3(rightScale, rightScale, rightScale), dt * 10);

      // Update Card & Mizan Scale according to mode
      if (animState.mode === 'IDLE') {
        const targetX = animState.dragNormX * 2.1;
        const targetRotZ = -animState.dragNormX * 0.26;
        const targetRotY = animState.dragNormX * 0.34;
        cardGroup.position.x = THREE.MathUtils.lerp(cardGroup.position.x, targetX, dt * 15);
        cardGroup.position.y = THREE.MathUtils.lerp(cardGroup.position.y, 0.14 + Math.sin(elapsed * 2.4) * 0.035, dt * 12);
        cardGroup.position.z = THREE.MathUtils.lerp(cardGroup.position.z, 1.72, dt * 12);
        cardGroup.rotation.z = THREE.MathUtils.lerp(cardGroup.rotation.z, targetRotZ, dt * 15);
        cardGroup.rotation.y = THREE.MathUtils.lerp(cardGroup.rotation.y, targetRotY, dt * 15);
        cardGroup.rotation.x = THREE.MathUtils.lerp(cardGroup.rotation.x, 0, dt * 12);
        cardGroup.scale.lerp(new THREE.Vector3(1, 1, 1), dt * 10);

        // Spotlight glint follows drag tilt
        spotLight.position.x = THREE.MathUtils.lerp(spotLight.position.x, animState.dragNormX * 2.8, dt * 10);

        // Fade in tilted SESUAI / TOLAK stamp decals
        stampSesuaiMat.opacity = THREE.MathUtils.clamp((animState.dragNormX - 0.12) * 1.6, 0, 0.96);
        stampTolakMat.opacity = THREE.MathUtils.clamp((-animState.dragNormX - 0.12) * 1.6, 0, 0.96);

        // Balance scale tilts proportionally while dragging
        const targetTilt = -animState.dragNormX * 0.34;
        scaleBeamPivot.rotation.z = THREE.MathUtils.lerp(scaleBeamPivot.rotation.z, targetTilt, dt * 11);
      } else if (animState.mode === 'FLING_CORRECT') {
        animState.timer += dt;
        const dur = 0.28;
        const t = Math.min(animState.timer / dur, 1);
        const targetPortalX = animState.flingDir * 3.55;
        cardGroup.position.x = THREE.MathUtils.lerp(cardGroup.position.x, targetPortalX, t * 0.6 + 0.15);
        cardGroup.position.y = 0.14 + Math.sin(t * Math.PI) * 0.72;
        cardGroup.position.z = THREE.MathUtils.lerp(1.72, -1.25, t);
        cardGroup.rotation.z += -animState.flingDir * dt * 5.2;
        cardGroup.rotation.y += animState.flingDir * dt * 4.5;
        const s = Math.max(0.05, 1 - t * 0.85);
        cardGroup.scale.set(s, s, s);

        if (t >= 1 && cardGroup.visible) {
          cardGroup.visible = false;
          const burstPos = new THREE.Vector3(targetPortalX, 0.2, -1.2);
          spawnPortalBurst(burstPos, animState.flingDir > 0 ? 0x10b981 : 0xef4444, 24);
        }

        // Balance scale levels out smoothly
        scaleBeamPivot.rotation.z = THREE.MathUtils.lerp(scaleBeamPivot.rotation.z, 0, dt * 12);
      } else if (animState.mode === 'FLIP_WRONG') {
        // 1.5s Wrong-swipe 180-degree Y-axis flip revealing actual Kaedah Fiqhiyyah on back face
        animState.timer += dt;
        const t = animState.timer;

        stampSesuaiMat.opacity = 0;
        stampTolakMat.opacity = 0;

        // Bring card to prominent center focus & rotate 180 deg around Y
        cardGroup.position.x = THREE.MathUtils.lerp(cardGroup.position.x, 0, dt * 12);
        cardGroup.position.y = THREE.MathUtils.lerp(cardGroup.position.y, 0.25, dt * 12);
        cardGroup.position.z = THREE.MathUtils.lerp(cardGroup.position.z, 1.85, dt * 10);
        cardGroup.rotation.z = THREE.MathUtils.lerp(cardGroup.rotation.z, 0, dt * 12);
        cardGroup.rotation.y = THREE.MathUtils.lerp(cardGroup.rotation.y, Math.PI, dt * 9.5);
        cardGroup.scale.lerp(new THREE.Vector3(1.06, 1.06, 1.06), dt * 10);

        // Scale tilts sharply as mistake indicator
        scaleBeamPivot.rotation.z = THREE.MathUtils.lerp(scaleBeamPivot.rotation.z, -animState.flingDir * 0.36, dt * 9);

        // Dissolve into golden/red particles at end of 1.38s - 1.5s window
        if (t > 1.36 && cardGroup.visible) {
          cardGroup.visible = false;
          spawnPortalBurst(new THREE.Vector3(0, 0.25, 1.8), 0xf87171, 28);
        }
      }

      // Keep scale pans hanging vertically regardless of crossbar angle
      panLeftGroup.rotation.z = -scaleBeamPivot.rotation.z;
      panRightGroup.rotation.z = -scaleBeamPivot.rotation.z;

      // Emerald Mizan glow pulse on correct match
      if (animState.mizanPulseTimer > 0) {
        animState.mizanPulseTimer -= dt;
        mizanHalo.material.color.setHex(0x34d399);
        mizanHalo.material.opacity = 0.45 + Math.sin((animState.mizanPulseTimer / 0.7) * Math.PI) * 0.5;
      } else {
        mizanHalo.material.color.setHex(0xfde047);
        mizanHalo.material.opacity = 0.28 + Math.sin(elapsed * 2) * 0.06;
      }

      // Update particle bursts
      for (let i = 0; i < particles.length; i += 1) {
        const pt = particles[i];
        if (pt.life > 0) {
          pt.life -= dt;
          pt.vel.y -= 9.5 * dt;
          pt.mesh.position.addScaledVector(pt.vel, dt);
          pt.mesh.rotation.x += dt * 6;
          pt.mesh.rotation.y += dt * 7;
          pt.mat.opacity = Math.max(0, pt.life / pt.maxLife);
          if (pt.life <= 0) pt.mesh.visible = false;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);

      activeFrontTex?.dispose();
      activeBackTex?.dispose();
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
        touchAction: 'none',
        userSelect: 'none',
        cursor: isLocked ? 'default' : 'grab',
      }}
      aria-label="Enjin 3D Kad Qawaid Swipe"
    />
  );
}
