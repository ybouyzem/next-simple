'use client';

import { useEffect, useRef, useState } from 'react';

function toggleFullscreen() {
  try {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  } catch (e) {}
}

export default function Page() {
  const canvasRef = useRef(null);
  const [isFull, setIsFull] = useState(false);
  const [idle, setIdle] = useState(false);

  // ---- the animation (runs only in the browser) ----
  useEffect(() => {
    let W, H, dpr;
    const cv = canvasRef.current, ctx = cv.getContext('2d');
      let raf;
    
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
    }
    window.addEventListener('resize', resize); resize();

    const R = (a, b) => a + Math.random() * (b - a);
    const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    const shade = (hex, k) => {
      const n = parseInt(hex.slice(1), 16), c = v => Math.max(0, Math.min(255, v * k)) | 0;
      return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
    };

    /* ---------- pre-rendered detailed sprites ---------- */
    const LS = 384, LU = LS * .44;
    const mapleShape = [[-90,1],[-62,.52],[-30,.92],[2,.5],[35,.72],[65,.42],[90,.3],[115,.42],[145,.72],[178,.5],[210,.92],[242,.52]];

    function leafSprite(kind, hue) {
      const c = mk(LS, LS), g = c.getContext('2d');
      g.translate(LS / 2, LS / 2); g.scale(LU, LU); g.lineJoin = 'round'; g.lineCap = 'round';
      const path = () => {
        g.beginPath();
        if (kind === 'm') {
          mapleShape.forEach(([a, r], i) => {
            const x = Math.cos(a * Math.PI / 180) * r, y = Math.sin(a * Math.PI / 180) * r;
            i ? g.lineTo(x, y) : g.moveTo(x, y);
          });
          g.closePath();
        } else {
          g.moveTo(0, -1); g.bezierCurveTo(.75, -.55, .72, .45, 0, .95);
          g.bezierCurveTo(-.72, .45, -.75, -.55, 0, -1);
        }
      };
      path();
      const rg = g.createRadialGradient(0, .1, .05, 0, 0, 1.05);
      rg.addColorStop(0, `hsl(${hue + 20},92%,58%)`);
      rg.addColorStop(.55, `hsl(${hue},88%,45%)`);
      rg.addColorStop(1, `hsl(${hue - 14},75%,26%)`);
      g.fillStyle = rg; g.fill();
      g.save(); path(); g.clip();
      for (let i = 0; i < 320; i++) {          // mottled fall colours
        g.fillStyle = `hsla(${hue + R(-25, 25)},85%,${R(18, 62)}%,${R(.1, .3)})`;
        g.beginPath(); g.arc(R(-1, 1), R(-1, 1), R(.01, .07), 0, 6.3); g.fill();
      }
      g.strokeStyle = 'rgba(70,25,0,.35)'; g.lineWidth = .02;   // veins
      g.beginPath();
      for (let i = 0; i < 6; i++) {
        const y = -.7 + i * .28;
        g.moveTo(0, y + .1); g.lineTo(.5, y - .25); g.moveTo(0, y + .1); g.lineTo(-.5, y - .25);
      }
      g.stroke();
      g.strokeStyle = 'rgba(255,225,160,.5)'; g.lineWidth = .035;
      g.beginPath(); g.moveTo(0, -.95); g.lineTo(0, .9); g.stroke();
      const hl = g.createLinearGradient(-1, -1, 1, 1);           // sheen
      hl.addColorStop(0, 'rgba(255,240,200,.22)'); hl.addColorStop(.5, 'rgba(255,255,255,0)');
      g.fillStyle = hl; g.fillRect(-1.2, -1.2, 2.4, 2.4);
      g.restore();
      path(); g.strokeStyle = 'rgba(40,12,0,.7)'; g.lineWidth = .03; g.stroke();
      g.strokeStyle = `hsl(${hue - 10},50%,22%)`; g.lineWidth = .055;   // stem
      g.beginPath(); g.moveTo(0, .85); g.quadraticCurveTo(.05, 1.15, .12, 1.3); g.stroke();
      return { c, ox: LS / 2, oy: LS / 2, w: LS, h: LS, u: LU, kind: 'leaf' };
    }

    const UW = 380, UH = 480, UU = 170, UOX = 190, UOY = 215;
    function umbrellaSprite(col, stripe) {
      const c = mk(UW, UH), g = c.getContext('2d');
      g.translate(UOX, UOY); g.scale(UU, UU); g.lineJoin = 'round'; g.lineCap = 'round';
      // shaft + handle
      const sg = g.createLinearGradient(-.04, 0, .04, 0);
      sg.addColorStop(0, '#5b5f66'); sg.addColorStop(.5, '#e6e8ec'); sg.addColorStop(1, '#4a4d54');
      g.strokeStyle = sg; g.lineWidth = .06;
      g.beginPath(); g.moveTo(0, -1); g.lineTo(0, 1.2); g.stroke();
      g.strokeStyle = '#4b2e1a'; g.lineWidth = .1;
      g.beginPath(); g.moveTo(0, 1.05); g.lineTo(0, 1.2); g.arc(-.22, 1.2, .22, 0, Math.PI); g.stroke();
      g.strokeStyle = 'rgba(255,200,150,.35)'; g.lineWidth = .025;
      g.beginPath(); g.arc(-.22, 1.2, .2, .2, 2.4); g.stroke();
      // canopy panels
      const N = 8, xs = [], by = k => .05 + .15 * (1 - xs[k] * xs[k]);
      for (let k = 0; k <= N; k++) xs.push(Math.sin(-Math.PI / 2 + Math.PI * k / N));
      for (let k = 0; k < N; k++) {
        const th = -Math.PI / 2 + Math.PI * (k + .5) / N;
        const b = .62 - .5 * Math.sin(th) * .9 + .1;
        const base = stripe && k % 2 ? '#ece2c8' : col;
        const pg = g.createLinearGradient(0, -1, 0, .2);
        pg.addColorStop(0, shade(base, b * 1.2)); pg.addColorStop(1, shade(base, b * .72));
        const x0 = xs[k], x1 = xs[k + 1];
        g.beginPath(); g.moveTo(0, -1);
        g.quadraticCurveTo(x0 * 1.06, -.5, x0, by(k));
        g.quadraticCurveTo((x0 + x1) / 2, Math.min(by(k), by(k + 1)) - .16, x1, by(k + 1));
        g.quadraticCurveTo(x1 * 1.06, -.5, 0, -1);
        g.fillStyle = pg; g.fill();
        g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = .014; g.stroke();
      }
      const hl = g.createRadialGradient(-.35, -.6, .02, -.2, -.4, .8);
      hl.addColorStop(0, 'rgba(255,255,255,.28)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = hl; g.beginPath(); g.arc(0, -.2, 1, Math.PI, 0); g.fill();
      // metal tip
      g.fillStyle = '#cfd3d8'; g.beginPath(); g.arc(0, -1.02, .045, 0, 6.3); g.fill();
      g.strokeStyle = '#b8bcc2'; g.lineWidth = .03;
      g.beginPath(); g.moveTo(0, -1.05); g.lineTo(0, -1.2); g.stroke();
      return { c, ox: UOX, oy: UOY, w: UW, h: UH, u: UU, kind: 'umb' };
    }

    const hues = [8, 18, 28, 38, 46, 22];
    const leafSprites = [];
    hues.forEach(h => { leafSprites.push(leafSprite('m', h)); leafSprites.push(leafSprite('o', h)); });
    const cols = ['#b3202a', '#1f3b7a', '#d9a21b', '#1a7a72', '#6a2c8a', '#3a3a3f', '#c8551f', '#8a1c2b'];
    const umbSprites = cols.map((c, i) => umbrellaSprite(c, i === 2 || i === 4));

    /* ---------- scene ---------- */
    const F = 700, FAR = 2200, NEAR = 90, SPEED = 460, COUNT = 58;
    function spawn(initial) {
      const isU = Math.random() < .27;
      const spr = isU ? umbSprites[(Math.random() * umbSprites.length) | 0] : leafSprites[(Math.random() * leafSprites.length) | 0];
      return {
        spr, isU,
        x: R(-650, 650), y: R(-450, 450),
        z: initial ? R(NEAR, FAR) : FAR + R(0, 300),
        size: isU ? R(55, 85) : R(26, 48),
        rx: R(0, 6.28), ry: R(0, 6.28), rz: R(0, 6.28),
        vrx: isU ? R(-.35, .35) : R(-1.6, 1.6),
        vry: isU ? R(-.8, .8) : R(-1.4, 1.4),
        vrz: isU ? R(-.5, .5) : R(-1.1, 1.1),
        ph: R(0, 6.28), swayAmp: R(10, 45),
        speed: SPEED * R(.85, 1.25),
      };
    }
    const objs = Array.from({ length: COUNT }, () => spawn(true));
    const dust = Array.from({ length: 140 }, () => ({ x: R(-900, 900), y: R(-600, 600), z: R(NEAR, FAR), r: R(.6, 1.8) }));

    const hasFilter = 'filter' in ctx;
    let last = performance.now(), T = 0;
    function frame(now) {
      const dt = Math.min((now - last) / 1000, .05); last = now; T += dt;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.filter = 'none'; ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(0,0,0,.5)';            // light motion trail
      ctx.fillRect(0, 0, cv.width, cv.height);

      const wind = Math.sin(T * .45) * 70;          // slow wind gusts
      const cx = W / 2, cy = H / 2;

      // dust floating in the projector beam
      for (const d of dust) {
        d.z -= 120 * dt; d.x += Math.sin(T + d.y) * 6 * dt;
        if (d.z < NEAR) { d.z = FAR; d.x = R(-900, 900); d.y = R(-600, 600); }
        const s = F / d.z;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalAlpha = Math.min(.5, (FAR - d.z) / 900) * .5 * Math.min(1, (d.z - NEAR) / 200);
        ctx.fillStyle = '#ffe2b8';
        ctx.beginPath(); ctx.arc(cx + d.x * s, cy + d.y * s, d.r * Math.min(s, 3), 0, 6.3); ctx.fill();
      }

      for (let i = 0; i < objs.length; i++) {
        const o = objs[i];
        o.z -= o.speed * dt;
        const flutter = o.isU ? 0 : Math.sin(T * 2.2 + o.ph) * 1.3;
        o.rx += (o.vrx + flutter * .5) * dt; o.ry += (o.vry + flutter) * dt; o.rz += o.vrz * dt;
        if (o.z < NEAR) objs[i] = spawn(false);
      }
      objs.sort((a, b) => b.z - a.z);

      for (const o of objs) {
        const s = F / o.z;
        const sx = cx + (o.x + wind + Math.sin(T * .9 + o.ph) * o.swayAmp) * s;
        const sy = cy + (o.y + Math.cos(T * .7 + o.ph) * o.swayAmp) * s;
        const px = o.size * s;
        if (sx < -px * 3 || sx > W + px * 3 || sy < -px * 3 || sy > H + px * 3) continue;
        const a = Math.min(1, (FAR - o.z) / 500) * Math.min(1, (o.z - NEAR) / 120);
        const fog = Math.max(.3, 1 - o.z / (FAR * 1.15));
        let fx = Math.cos(o.ry), fy = o.isU ? .78 + .22 * Math.cos(o.rx) : Math.cos(o.rx);
        const facing = Math.abs(fx * fy);
        const lit = (fx < 0 ? .55 : 1) * (.55 + .45 * facing);   // back sides are dimmer
        if (Math.abs(fx) < .07) fx = .07 * Math.sign(fx || 1);
        if (Math.abs(fy) < .07) fy = .07 * Math.sign(fy || 1);
        // depth of field: blur very near and very far objects
        if (hasFilter) {
          const bl = o.z < 420 ? (420 - o.z) / 55 : o.z > 1500 ? (o.z - 1500) / 260 : 0;
          ctx.filter = bl > .4 ? `blur(${bl.toFixed(1)}px)` : 'none';
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalAlpha = Math.min(1, a * fog * lit * 1.15);
        ctx.translate(sx, sy); ctx.rotate(o.rz);
        ctx.scale(px * fx, px * fy);
        const p = o.spr;
        ctx.drawImage(p.c, -p.ox / p.u, -p.oy / p.u, p.w / p.u, p.h / p.u);
      }
      ctx.filter = 'none'; ctx.globalAlpha = 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * .07})`;   // projector flicker
      ctx.fillRect(0, 0, cv.width, cv.height);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // ---- fullscreen button + F key ----
  useEffect(() => {
    const onChange = () => setIsFull(!!document.fullscreenElement);
    const onKey = (e) => { if (e.key === 'f' || e.key === 'F') toggleFullscreen(); };
    document.addEventListener('fullscreenchange', onChange);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  // ---- hide button/cursor when idle ----
  useEffect(() => {
    let t;
    const wake = () => { setIdle(false); clearTimeout(t); t = setTimeout(() => setIdle(true), 2500); };
    const evs = ['mousemove', 'touchstart', 'keydown'];
    evs.forEach((e) => window.addEventListener(e, wake));
    wake();
    return () => { clearTimeout(t); evs.forEach((e) => window.removeEventListener(e, wake)); };
  }, []);

  return (
    <div className={idle ? 'idle' : ''}>
      <canvas ref={canvasRef} />
      <div className="vig" />
      <button id="fs" onClick={toggleFullscreen} aria-label="Toggle full screen">
        {isFull ? '✕ Exit full screen' : '⛶ Full screen'}
      </button>
    </div>
  );
}
