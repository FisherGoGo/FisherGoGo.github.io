import { lilyExhibit } from '../../../data/lily';

(function () {
  'use strict';

  /* ----------------------------------------------------------------------
     1. GLOBAL STATE & IMAGE INITIALIZATION
     ---------------------------------------------------------------------- */
  const state = {
    mode: 'nightmare',
    soundOn: false,
    w: window.innerWidth,
    h: window.innerHeight,
    mouse: { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5, tx: window.innerWidth * 0.5, ty: window.innerHeight * 0.5 },
    rift: { x: 0.52, targetX: 0.52, tilt: 0.12, targetTilt: 0.12 },
    actIndex: 0,
    activeBlade: 0, // 0: Scent, 1: Chime, 2: Train
    hold: { active: false, progress: 0, bloomed: false, angleOuter: 0, angleMid: 0 }
  };

  const imgEls = {
    dream: document.getElementById('img-dream'),
    nightmare: document.getElementById('img-nightmare'),
    blade0: document.getElementById('img-blade-0'),
    blade1: document.getElementById('img-blade-1'),
    blade2: document.getElementById('img-blade-2')
  };

  let localArtwork = {};
  for (const imgEl of Object.values(imgEls)) {
    imgEl.addEventListener('load', () => imgEl.classList.add('loaded'));
    imgEl.addEventListener('error', () => imgEl.classList.remove('loaded'));
  }

  function setArtwork(imgEl, slot) {
    const src = localArtwork[slot] ?? lilyExhibit.artwork[slot];
    if (imgEl.getAttribute('src') !== src) {
      imgEl.classList.remove('loaded');
      imgEl.src = src;
    }
    if (imgEl.complete) imgEl.classList.toggle('loaded', imgEl.naturalWidth > 0);
  }

  function applyRiftArtwork() {
    const inverted = state.mode === 'reverie';
    setArtwork(imgEls.dream, inverted ? 'act1Nightmare' : 'act1Dream');
    setArtwork(imgEls.nightmare, inverted ? 'act1Dream' : 'act1Nightmare');
    imgEls.dream.alt = inverted ? '莉莉 · 噩梦' : '莉莉 · 梦境';
    imgEls.nightmare.alt = inverted ? '莉莉 · 梦境' : '莉莉 · 噩梦';
  }

  function applyArtworkConfig() {
    applyRiftArtwork();
    setArtwork(imgEls.blade0, 'act2Blade1Scent');
    setArtwork(imgEls.blade1, 'act2Blade2Chime');
    setArtwork(imgEls.blade2, 'act2Blade3Train');
  }
  applyArtworkConfig();

  /* ----------------------------------------------------------------------
     2. MUSIC ENGINE (NETEASE ID=3458260703 + FALLBACK IFRAME + LOCAL AUDIO)
     ---------------------------------------------------------------------- */
  const bgmAudio = document.getElementById('bgmAudio');
  const soundGroup = document.getElementById('sound-group');
  const btnSound = document.getElementById('btn-sound');
  const btnMusicPopover = document.getElementById('btn-music-popover');
  const musicPopover = document.getElementById('music-popover');
  const btnCloseMusic = document.getElementById('btn-close-music');
  const musicStatus = document.getElementById('music-status');
  const neteaseFrameWrap = document.getElementById('netease-frame-wrap');
  const uploadLocalAudio = document.getElementById('upload-local-audio');

  let neteaseIframeLoaded = false;
  let fadeInterval = null;
  let audioCtx = null;

  function ensureNeteaseIframe(autoplay) {
    if (neteaseIframeLoaded) return;
    neteaseIframeLoaded = true;
    const iframe = document.createElement('iframe');
    iframe.frameBorder = 'no';
    iframe.marginWidth = '0';
    iframe.marginHeight = '0';
    iframe.allow = 'autoplay';
    iframe.src = `https://music.163.com/outchain/player?type=2&id=3458260703&auto=${autoplay ? 1 : 0}&height=66`;
    neteaseFrameWrap.appendChild(iframe);
  }

  function openMusicPopover(reasonText, autoplayIframe) {
    if (reasonText) musicStatus.textContent = reasonText;
    ensureNeteaseIframe(autoplayIframe);
    musicPopover.classList.add('open');
    btnMusicPopover.classList.add('open');
  }

  function fadeAudioVolume(targetVol, onComplete) {
    clearInterval(fadeInterval);
    const startVol = bgmAudio.volume;
    const steps = 20;
    let step = 0;
    fadeInterval = setInterval(() => {
      step++;
      const ratio = step / steps;
      bgmAudio.volume = Math.max(0, Math.min(1, startVol + (targetVol - startVol) * ratio));
      if (step >= steps) {
        clearInterval(fadeInterval);
        if (onComplete) onComplete();
      }
    }, 35);
  }

  function toggleSound() {
    if (!state.soundOn) {
      bgmAudio.volume = 0;
      const playPromise = bgmAudio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          state.soundOn = true;
          soundGroup.classList.add('sound-active');
          fadeAudioVolume(0.75);
          musicStatus.textContent = '正在播放：网易云音乐 ID 3458260703';
        }).catch(() => {
          // Seamless Fallback to NetEase Official Embed / Local Audio
          state.soundOn = true;
          soundGroup.classList.add('sound-active');
          openMusicPopover('外链直连受限，已自动切换至网易云官方嵌入播放器（也可载入本地音频）：', true);
        });
      }
    } else {
      state.soundOn = false;
      soundGroup.classList.remove('sound-active');
      fadeAudioVolume(0, () => {
        try { bgmAudio.pause(); } catch (e) {}
      });
    }
  }

  btnSound.addEventListener('click', toggleSound);

  btnMusicPopover.addEventListener('click', () => {
    const isOpen = musicPopover.classList.contains('open');
    if (isOpen) {
      musicPopover.classList.remove('open');
      btnMusicPopover.classList.remove('open');
    } else {
      openMusicPopover(null, false);
    }
  });

  btnCloseMusic.addEventListener('click', () => {
    musicPopover.classList.remove('open');
    btnMusicPopover.classList.remove('open');
  });

  uploadLocalAudio.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    bgmAudio.src = url;
    bgmAudio.volume = 0;
    bgmAudio.play().then(() => {
      state.soundOn = true;
      soundGroup.classList.add('sound-active');
      fadeAudioVolume(0.8);
      musicStatus.textContent = `正在播放本地音频：${file.name}`;
    }).catch(() => {});
  });

  /* Lightweight Web Audio API Bloom Chime (Non-Intrusive, Only When Sound Active) */
  function playBloomChime() {
    if (!state.soundOn) return;
    try {
      if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        audioCtx = new Ctx();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const now = audioCtx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.0001, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.032, now + i * 0.06 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 2.6);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 2.7);
      });
    } catch (e) {}
  }

  /* ----------------------------------------------------------------------
     3. DUAL REALITY INVERT SWITCHER
     ---------------------------------------------------------------------- */
  const btnInvert = document.getElementById('btn-invert');
  btnInvert.addEventListener('click', () => {
    state.mode = state.mode === 'nightmare' ? 'reverie' : 'nightmare';
    document.documentElement.setAttribute('data-mode', state.mode);
    btnInvert.setAttribute('aria-pressed', String(state.mode === 'reverie'));
    applyRiftArtwork();
  });

  /* ----------------------------------------------------------------------
     4. CUSTOM RETICLE CURSOR & POINTER TRACKING
     ---------------------------------------------------------------------- */
  const cursorReticle = document.getElementById('cursor-reticle');
  const cursorAura = document.getElementById('cursor-aura');

  document.querySelectorAll('[data-hover]').forEach((el) => {
    el.addEventListener('mouseenter', () => cursorAura.classList.add('hovering'));
    el.addEventListener('mouseleave', () => cursorAura.classList.remove('hovering'));
  });

  const act01El = document.getElementById('act-01');
  function handlePointerMove(clientX, clientY) {
    const dx = clientX - state.mouse.tx;
    const dy = clientY - state.mouse.ty;
    state.mouse.tx = clientX;
    state.mouse.ty = clientY;

    cursorReticle.style.left = clientX + 'px';
    cursorReticle.style.top = clientY + 'px';

    // Update Act 1 Rift Slash
    if (window.scrollY < state.h * 0.85) {
      const nx = Math.max(0.04, Math.min(0.96, clientX / state.w));
      const ny = clientY / state.h;
      state.rift.targetX = nx;
      state.rift.targetTilt = 0.08 + (ny - 0.5) * 0.22 + Math.max(-0.18, Math.min(0.18, dx * 0.0045));
    }

    // Spawn sharp lily-petal light shards along swift slashes
    const speed = Math.hypot(dx, dy);
    if (speed > 7 && state.actIndex === 0) {
      const count = Math.min(3, Math.floor(speed / 12));
      for (let i = 0; i < count; i++) {
        spawnTrailShard(clientX, clientY, dx, dy);
      }
    }
  }

  window.addEventListener('mousemove', (e) => handlePointerMove(e.clientX, e.clientY));
  act01El.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  /* ----------------------------------------------------------------------
     5. ACT 02 · OPTICAL SHUTTER // 浮梦三境 (ACCORDION + 3D PARALLAX + CANVAS)
     ---------------------------------------------------------------------- */
  const blades = document.querySelectorAll('.blade');
  const act2Canvas = document.getElementById('act2-canvas');
  const act2Ctx = act2Canvas.getContext('2d');

  function activateBlade(index) {
    if (index === state.activeBlade) return;
    state.activeBlade = index;
    blades.forEach((b, i) => b.classList.toggle('active', i === index));
    if (index === 1) spawnChimeRing(true);
  }

  blades.forEach((blade) => {
    const idx = parseInt(blade.getAttribute('data-blade'), 10);
    const img = blade.querySelector('.blade-img');

    blade.addEventListener('mouseenter', () => activateBlade(idx));
    blade.addEventListener('click', () => activateBlade(idx));

    // Independent Mouse 3D Parallax inside each Blade
    blade.addEventListener('mousemove', (e) => {
      const rect = blade.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      img.style.transform = `translate3d(${(-px * 22).toFixed(1)}px, ${(-py * 16).toFixed(1)}px, 0) scale(1.06)`;
    });

    blade.addEventListener('mouseleave', () => {
      img.style.transform = 'translate3d(0, 0, 0) scale(1)';
    });
  });

  /* Act 02 Dynamic Canvas Entities: 0=Scent Mist/Filaments, 1=Chime Rings, 2=Train Warp Streaks */
  const scentFilaments = [];
  for (let i = 0; i < 42; i++) {
    scentFilaments.push({
      x: Math.random() * state.w,
      y: Math.random() * state.h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -0.35 - Math.random() * 0.65,
      len: 30 + Math.random() * 75,
      phase: Math.random() * Math.PI * 2,
      r: 16 + Math.random() * 44,
      isMist: i < 14
    });
  }

  const chimeRings = [];
  let chimeTimer = 0;
  function spawnChimeRing(immediate) {
    chimeRings.push({
      r: immediate ? 24 : 8,
      maxR: Math.max(state.w, state.h) * 0.72,
      speed: 2.2 + Math.random() * 1.4,
      color: chimeRings.length % 2 === 0 ? '#e8d5b5' : '#b894ff',
      lineW: 1 + Math.random() * 1.2
    });
    if (chimeRings.length > 14) chimeRings.shift();
  }
  spawnChimeRing(true);

  const trainStreaks = [];
  for (let i = 0; i < 85; i++) {
    trainStreaks.push({
      x: Math.random() * state.w,
      y: Math.random() * state.h,
      len: 45 + Math.random() * 180,
      speed: 14 + Math.random() * 28,
      alpha: 0.14 + Math.random() * 0.62,
      hue: i % 4 === 0 ? '#e8d5b5' : (i % 3 === 0 ? '#b894ff' : '#ffffff')
    });
  }

  function renderAct2Canvas(time) {
    const w = state.w;
    const h = state.h;
    act2Ctx.clearRect(0, 0, w, h);

    const isLight = state.mode === 'reverie';

    if (state.activeBlade === 0) {
      // 01 · 织香 / SCENT: Iridescent perfume mist & rising pearl-violet light filaments
      for (let i = 0; i < scentFilaments.length; i++) {
        const p = scentFilaments[i];
        p.phase += 0.015;
        p.x += p.vx + Math.sin(p.phase) * 0.45;
        p.y += p.vy;
        if (p.y < -100) { p.y = h + 80; p.x = Math.random() * w; }

        if (p.isMist) {
          const grad = act2Ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.2);
          grad.addColorStop(0, isLight ? 'rgba(184, 148, 255, 0.16)' : 'rgba(184, 148, 255, 0.12)');
          grad.addColorStop(0.5, isLight ? 'rgba(232, 213, 181, 0.08)' : 'rgba(232, 213, 181, 0.06)');
          grad.addColorStop(1, 'transparent');
          act2Ctx.fillStyle = grad;
          act2Ctx.beginPath();
          act2Ctx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2);
          act2Ctx.fill();
        } else {
          act2Ctx.save();
          act2Ctx.strokeStyle = i % 2 === 0
            ? (isLight ? 'rgba(130, 88, 210, 0.28)' : 'rgba(184, 148, 255, 0.34)')
            : (isLight ? 'rgba(180, 150, 100, 0.22)' : 'rgba(245, 243, 247, 0.26)');
          act2Ctx.lineWidth = 1;
          act2Ctx.beginPath();
          act2Ctx.moveTo(p.x, p.y);
          act2Ctx.quadraticCurveTo(p.x + Math.sin(p.phase) * 18, p.y + p.len * 0.5, p.x, p.y + p.len);
          act2Ctx.stroke();
          act2Ctx.restore();
        }
      }
    } else if (state.activeBlade === 1) {
      // 02 · 梦铃 / CHIME: Expanding concentric champagne-gold & lilac resonance rings
      chimeTimer++;
      if (chimeTimer % 46 === 0) spawnChimeRing(false);
      const cx = w * 0.5;
      const cy = h * 0.5;

      for (let i = chimeRings.length - 1; i >= 0; i--) {
        const ring = chimeRings[i];
        ring.r += ring.speed;
        const life = 1 - ring.r / ring.maxR;
        if (life <= 0) {
          chimeRings.splice(i, 1);
          continue;
        }
        act2Ctx.save();
        act2Ctx.strokeStyle = ring.color;
        act2Ctx.globalAlpha = life * (isLight ? 0.55 : 0.42);
        act2Ctx.lineWidth = ring.lineW;
        act2Ctx.beginPath();
        act2Ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
        act2Ctx.stroke();
        act2Ctx.restore();
      }
    } else {
      // 03 · 列车 / TRAIN: High-speed horizontal starlight streaks at warp speed
      for (let i = 0; i < trainStreaks.length; i++) {
        const s = trainStreaks[i];
        s.x -= s.speed;
        if (s.x + s.len < 0) {
          s.x = w + Math.random() * 160;
          s.y = Math.random() * h;
        }
        act2Ctx.save();
        const grad = act2Ctx.createLinearGradient(s.x, s.y, s.x + s.len, s.y);
        grad.addColorStop(0, isLight ? 'rgba(6, 6, 9, 0)' : 'rgba(255, 255, 255, 0)');
        grad.addColorStop(0.35, s.hue);
        grad.addColorStop(1, 'transparent');
        act2Ctx.globalAlpha = s.alpha * (isLight ? 0.55 : 0.78);
        act2Ctx.strokeStyle = grad;
        act2Ctx.lineWidth = 1.1;
        act2Ctx.beginPath();
        act2Ctx.moveTo(s.x, s.y);
        act2Ctx.lineTo(s.x + s.len, s.y);
        act2Ctx.stroke();
        act2Ctx.restore();
      }
    }
  }

  /* ----------------------------------------------------------------------
     6. ACT 03 · REQUIEM HOLD-TO-WEAVE CLIMAX
     ---------------------------------------------------------------------- */
  const act03El = document.getElementById('act-03');
  const act3Shake = document.getElementById('act3-shake-stage');
  const astrolabeWrap = document.getElementById('astrolabe-wrap');
  const astroOuter = document.getElementById('astro-ring-outer');
  const astroMid = document.getElementById('astro-ring-mid');
  const holdArc = document.getElementById('hold-progress-arc');
  const holdPct = document.getElementById('hold-pct');
  const holdCn = document.getElementById('hold-cn');
  const holdSub = document.getElementById('hold-en-sub');
  const spectroFlash = document.getElementById('spectro-flash');
  const epilogueReveal = document.getElementById('epilogue-reveal');
  const btnReplay = document.getElementById('btn-replay');
  const ARC_LEN = 911.06;

  function beginHold(e) {
    if (state.hold.bloomed) return;
    if (e.target.closest('button, a, #img-drawer, #music-popover')) return;
    state.hold.active = true;
    cursorAura.classList.add('holding');
    holdCn.textContent = '共振中';
  }

  function stopHold() {
    state.hold.active = false;
    cursorAura.classList.remove('holding');
    if (!state.hold.bloomed) {
      act3Shake.style.transform = 'translate(0, 0) scale(1)';
    }
  }

  act03El.addEventListener('mousedown', beginHold);
  act03El.addEventListener('touchstart', beginHold, { passive: true });
  window.addEventListener('mouseup', stopHold);
  window.addEventListener('touchend', stopHold);
  window.addEventListener('touchcancel', stopHold);

  function triggerRequiemBloom() {
    state.hold.bloomed = true;
    state.hold.active = false;
    cursorAura.classList.remove('holding');
    act3Shake.style.transform = 'translate(0, 0) scale(1)';

    spectroFlash.classList.add('flash-on');
    setTimeout(() => spectroFlash.classList.remove('flash-on'), 130);

    astrolabeWrap.classList.add('dissolved');
    holdSub.classList.add('hidden');
    spawnBloomPetals(state.w * 0.5, state.h * 0.5);
    playBloomChime();

    setTimeout(() => {
      epilogueReveal.classList.add('visible');
    }, 420);
  }

  btnReplay.addEventListener('click', (e) => {
    e.stopPropagation();
    state.hold.bloomed = false;
    state.hold.progress = 0;
    epilogueReveal.classList.remove('visible');
    astrolabeWrap.classList.remove('dissolved');
    holdSub.classList.remove('hidden');
    holdCn.textContent = '长按织梦';
    holdPct.textContent = '000%';
    holdArc.style.strokeDashoffset = ARC_LEN;
  });

  /* ----------------------------------------------------------------------
     7. FULL-SCREEN FX CANVAS (ACT 1 SHARDS + ACT 3 VORTEX & BLOOM PETALS)
     ---------------------------------------------------------------------- */
  const fxCanvas = document.getElementById('fx-canvas');
  const fxCtx = fxCanvas.getContext('2d');
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resizeCanvases() {
    state.w = window.innerWidth;
    state.h = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    [fxCanvas, act2Canvas].forEach((c) => {
      c.width = Math.floor(state.w * dpr);
      c.height = Math.floor(state.h * dpr);
      c.style.width = state.w + 'px';
      c.style.height = state.h + 'px';
    });
    fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    act2Ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizeCanvases();
  window.addEventListener('resize', resizeCanvases);

  const shards = [];
  const vortexParticles = [];
  const bloomPetals = [];

  for (let i = 0; i < 95; i++) {
    vortexParticles.push({
      x: Math.random() * state.w,
      y: Math.random() * state.h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: 0.9 + Math.random() * 2.1,
      hue: i % 3 === 0 ? '#e8d5b5' : (i % 2 === 0 ? '#b894ff' : '#ffffff'),
      alpha: 0.25 + Math.random() * 0.65
    });
  }

  function spawnTrailShard(x, y, vx, vy) {
    const angle = Math.atan2(vy, vx) + (Math.random() - 0.5) * 0.9;
    const speed = 1.2 + Math.random() * 3.4;
    shards.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + 0.35,
      size: 4 + Math.random() * 8,
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.14,
      life: 1,
      decay: 0.018 + Math.random() * 0.02,
      isFilament: Math.random() > 0.68
    });
    if (shards.length > 100) shards.shift();
  }

  function spawnBloomPetals(cx, cy) {
    bloomPetals.length = 0;
    for (let i = 0; i < 88; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 2.6 + Math.random() * 14;
      bloomPetals.push({
        x: cx, y: cy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        size: 7 + Math.random() * 13,
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.05,
        tumble: Math.random() * Math.PI * 2,
        alpha: 0.95
      });
    }
  }

  function drawSharpPetal(c, x, y, size, rot, scaleY, alpha, color) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.scale(1, scaleY);
    c.globalAlpha = alpha;
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(0, -size);
    c.quadraticCurveTo(size * 0.55, -size * 0.15, 0, size);
    c.quadraticCurveTo(-size * 0.55, -size * 0.15, 0, -size);
    c.fill();
    c.restore();
  }

  /* ----------------------------------------------------------------------
     8. PROGRESS INDICATOR OBSERVER & LOCAL IMAGE OVERRIDE DRAWER
     ---------------------------------------------------------------------- */
  const progDots = document.querySelectorAll('.prog-dot');
  const acts = [
    document.getElementById('act-01'),
    document.getElementById('act-02'),
    document.getElementById('act-03')
  ];

  const actObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const idx = acts.indexOf(entry.target);
        if (idx !== -1) {
          state.actIndex = idx;
          progDots.forEach((d, i) => d.classList.toggle('active', i === idx));
        }
      }
    });
  }, { threshold: 0.5 });
  acts.forEach((a) => actObserver.observe(a));

  const btnImgDrawer = document.getElementById('btn-img-drawer');
  const imgDrawer = document.getElementById('img-drawer');
  const btnCloseDrawer = document.getElementById('btn-close-drawer');

  btnImgDrawer.addEventListener('click', () => imgDrawer.classList.toggle('open'));
  btnCloseDrawer.addEventListener('click', () => imgDrawer.classList.remove('open'));

  function bindLocalImage(inputId, slot) {
    const input = document.getElementById(inputId);
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return;
      const previous = localArtwork[slot];
      localArtwork[slot] = URL.createObjectURL(file);
      applyArtworkConfig();
      if (previous) URL.revokeObjectURL(previous);
      input.value = '';
    });
  }

  bindLocalImage('up-dream', 'act1Dream');
  bindLocalImage('up-nightmare', 'act1Nightmare');
  bindLocalImage('up-blade-0', 'act2Blade1Scent');
  bindLocalImage('up-blade-1', 'act2Blade2Chime');
  bindLocalImage('up-blade-2', 'act2Blade3Train');
  document.getElementById('btn-reset-imgs').addEventListener('click', () => {
    const previous = localArtwork;
    localArtwork = {};
    applyArtworkConfig();
    Object.values(previous).forEach((url) => URL.revokeObjectURL(url));
  });

  /* ----------------------------------------------------------------------
     9. MASTER 60FPS ANIMATION LOOP
     ---------------------------------------------------------------------- */
  const layerTop = document.getElementById('layer-top');
  const riftLineAura = document.getElementById('rift-line-aura');
  const riftLineCyan = document.getElementById('rift-line-cyan');
  const riftLineEmber = document.getElementById('rift-line-ember');
  const riftLineCore = document.getElementById('rift-line-core');

  function loop(time) {
    // A. Cursor Smooth Aura
    state.mouse.x += (state.mouse.tx - state.mouse.x) * 0.16;
    state.mouse.y += (state.mouse.ty - state.mouse.y) * 0.16;
    cursorAura.style.left = state.mouse.x + 'px';
    cursorAura.style.top = state.mouse.y + 'px';

    // B. Act 01 Diagonal Reality Rift Damping
    state.rift.x += (state.rift.targetX - state.rift.x) * 0.11;
    state.rift.tilt += (state.rift.targetTilt - state.rift.tilt) * 0.08;
    state.rift.targetTilt += (0.12 - state.rift.targetTilt) * 0.03;

    const topX = Math.max(0, Math.min(100, (state.rift.x + state.rift.tilt) * 100));
    const botX = Math.max(0, Math.min(100, (state.rift.x - state.rift.tilt) * 100));
    layerTop.style.clipPath = `polygon(0% 0%, ${topX.toFixed(2)}% 0%, ${botX.toFixed(2)}% 100%, 0% 100%)`;

    riftLineAura.setAttribute('x1', topX.toFixed(2));
    riftLineAura.setAttribute('x2', botX.toFixed(2));
    riftLineCore.setAttribute('x1', topX.toFixed(2));
    riftLineCore.setAttribute('x2', botX.toFixed(2));
    riftLineCyan.setAttribute('x1', (topX - 0.35).toFixed(2));
    riftLineCyan.setAttribute('x2', (botX - 0.35).toFixed(2));
    riftLineEmber.setAttribute('x1', (topX + 0.35).toFixed(2));
    riftLineEmber.setAttribute('x2', (botX + 0.35).toFixed(2));

    // C. Act 02 Dynamic Optical Shutter Canvas
    if (state.actIndex === 1) {
      renderAct2Canvas(time);
    }

    // D. Act 03 Astrolabe Spin & Charge Logic
    const speedBoost = 1 + state.hold.progress * 14;
    state.hold.angleOuter = (state.hold.angleOuter + 0.18 * speedBoost) % 360;
    state.hold.angleMid = (state.hold.angleMid - 0.28 * speedBoost) % 360;
    astroOuter.style.transform = `rotate(${state.hold.angleOuter}deg)`;
    astroMid.style.transform = `rotate(${state.hold.angleMid}deg)`;

    if (state.hold.active && !state.hold.bloomed) {
      state.hold.progress = Math.min(1, state.hold.progress + 0.011);
      const amp = state.hold.progress * 5;
      const sx = (Math.random() - 0.5) * amp;
      const sy = (Math.random() - 0.5) * amp;
      const sc = 1 + state.hold.progress * 0.06;
      act3Shake.style.transform = `translate(${sx}px, ${sy}px) scale(${sc})`;

      if (state.hold.progress >= 1) triggerRequiemBloom();
    } else if (!state.hold.bloomed && state.hold.progress > 0) {
      state.hold.progress = Math.max(0, state.hold.progress - 0.02);
      if (state.hold.progress === 0) holdCn.textContent = '长按织梦';
    }

    if (!state.hold.bloomed) {
      holdArc.style.strokeDashoffset = (ARC_LEN * (1 - state.hold.progress)).toFixed(2);
      holdPct.textContent = String(Math.round(state.hold.progress * 100)).padStart(3, '0') + '%';
    }

    // E. Render Full-Screen FX Canvas
    fxCtx.clearRect(0, 0, state.w, state.h);

    // 1. Act 1 Cursor Slash Shards
    for (let i = shards.length - 1; i >= 0; i--) {
      const s = shards[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vx *= 0.96;
      s.vy *= 0.96;
      s.rot += s.spin;
      s.life -= s.decay;
      if (s.life <= 0) { shards.splice(i, 1); continue; }
      if (s.isFilament) {
        fxCtx.save();
        fxCtx.strokeStyle = `rgba(184, 148, 255, ${s.life * 0.85})`;
        fxCtx.lineWidth = 1;
        fxCtx.beginPath();
        fxCtx.moveTo(s.x, s.y);
        fxCtx.lineTo(s.x - s.vx * 5, s.y - s.vy * 5);
        fxCtx.stroke();
        fxCtx.restore();
      } else {
        drawSharpPetal(fxCtx, s.x, s.y, s.size, s.rot, 0.7, s.life * 0.9, '#ffffff');
      }
    }

    // 2. Act 3 Vortex Collapse & Drifting Lily Petals
    if (state.actIndex === 2) {
      const cx = state.w * 0.5;
      const cy = state.h * 0.5;

      if (!state.hold.bloomed) {
        for (let i = 0; i < vortexParticles.length; i++) {
          const p = vortexParticles[i];
          if (state.hold.active) {
            const dx = cx - p.x;
            const dy = cy - p.y;
            const dist = Math.hypot(dx, dy) || 1;
            const pull = 0.45 + state.hold.progress * 2.4;
            p.vx += (dx / dist) * pull - (dy / dist) * pull * 0.55;
            p.vy += (dy / dist) * pull + (dx / dist) * pull * 0.55;
            p.vx *= 0.92;
            p.vy *= 0.92;
            if (dist < 22) {
              const ang = Math.random() * Math.PI * 2;
              const rad = Math.max(state.w, state.h) * 0.6;
              p.x = cx + Math.cos(ang) * rad;
              p.y = cy + Math.sin(ang) * rad;
              p.vx = 0; p.vy = 0;
            }
          } else {
            p.vx *= 0.97;
            p.vy *= 0.97;
            p.x += (Math.random() - 0.5) * 0.35;
            p.y -= 0.25;
          }
          p.x += p.vx;
          p.y += p.vy;
          if (p.y < -10) p.y = state.h + 10;
          if (p.y > state.h + 10) p.y = -10;
          if (p.x < -10) p.x = state.w + 10;
          if (p.x > state.w + 10) p.x = -10;

          fxCtx.save();
          fxCtx.globalAlpha = p.alpha;
          fxCtx.fillStyle = p.hue;
          if (state.hold.active && state.hold.progress > 0.2) {
            fxCtx.strokeStyle = p.hue;
            fxCtx.lineWidth = p.r * 0.8;
            fxCtx.beginPath();
            fxCtx.moveTo(p.x, p.y);
            fxCtx.lineTo(p.x - p.vx * 2.2, p.y - p.vy * 2.2);
            fxCtx.stroke();
          } else {
            fxCtx.beginPath();
            fxCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            fxCtx.fill();
          }
          fxCtx.restore();
        }
      } else {
        const basePetal = state.mode === 'reverie' ? '#b894ff' : '#ffffff';
        for (let i = 0; i < bloomPetals.length; i++) {
          const bp = bloomPetals[i];
          bp.vx *= 0.965;
          bp.vy = bp.vy * 0.965 + 0.055;
          bp.x += bp.vx + Math.sin(bp.tumble) * 0.5;
          bp.y += bp.vy;
          bp.rot += bp.spin;
          bp.tumble += 0.03;
          if (bp.y > state.h + 30) {
            bp.y = -20;
            bp.x = Math.random() * state.w;
            bp.vy = 0.6 + Math.random() * 1.1;
          }
          drawSharpPetal(
            fxCtx, bp.x, bp.y, bp.size, bp.rot,
            0.45 + 0.55 * Math.abs(Math.cos(bp.tumble)),
            bp.alpha * 0.86,
            i % 3 === 0 ? '#b894ff' : (i % 5 === 0 ? '#e8d5b5' : basePetal)
          );
        }
      }
    }

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
