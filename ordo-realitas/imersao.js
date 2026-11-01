/* ORDO REALITAS — camada de imersão: som, capa do dossiê, virada de página, caneta, carimbos e atmosfera */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wide = () => matchMedia('(min-width: 741px)').matches;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rnd = (a, b) => a + Math.random() * (b - a);
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
};

/* ============ ÁUDIO (tudo sintetizado, sem arquivos) ============ */
let ac, master, noiseBuf, ambient, penNode, soundOn = store.get('ordo-som', '1') === '1';
function audio() {
  if (!soundOn) return null;
  if (!ac) {
    const A = window.AudioContext || window.webkitAudioContext; if (!A) return null;
    ac = new A(); master = ac.createGain(); master.gain.value = .9; master.connect(ac.destination);
    const len = ac.sampleRate * 2; noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}
function burst(dur, o = {}) {
  const c = audio(); if (!c) return;
  const t = c.currentTime + (o.delay || 0), s = c.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  s.playbackRate.value = o.rate || 1;
  const f = c.createBiquadFilter(); f.type = o.type || 'bandpass'; f.Q.value = o.q || 1; f.frequency.setValueAtTime(o.f || 2000, t);
  if (o.fTo) f.frequency.exponentialRampToValueAtTime(o.fTo, t + dur);
  const g = c.createGain(); const peak = o.gain || .2, a = o.attack || .01;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random()); s.stop(t + dur + .05);
  return g;
}
function tone(freq, freqTo, dur, o = {}) {
  const c = audio(); if (!c) return;
  const t = c.currentTime + (o.delay || 0), os = c.createOscillator(); os.type = o.type || 'sine';
  os.frequency.setValueAtTime(freq, t); if (freqTo) os.frequency.exponentialRampToValueAtTime(freqTo, t + dur);
  const g = c.createGain(); g.gain.setValueAtTime(o.gain || .3, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  let node = os; if (o.lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; os.connect(f); node = f; }
  node.connect(g); g.connect(master); os.start(t); os.stop(t + dur + .05);
}
const sfx = {
  flip() { burst(1.1, { f: 500, fTo: 3200, q: .7, gain: .22, attack: .25 }); burst(.9, { type: 'highpass', f: 2600, gain: .07, attack: .3, delay: .1, rate: 1.7 }); burst(.18, { f: 900, gain: .25, delay: .95 }); },
  stamp() { tone(120, 38, .35, { gain: .9, lp: 400 }); burst(.16, { type: 'lowpass', f: 700, gain: .5 }); burst(.05, { type: 'highpass', f: 3000, gain: .15 }); },
  key() { burst(.035, { type: 'highpass', f: 1800 + Math.random() * 900, gain: .09 }); tone(160 + Math.random() * 40, 90, .04, { gain: .06 }); },
  tick() { burst(.03, { type: 'highpass', f: 2400, gain: .06 }); },
  open() { tone(62, 98, 1.0, { type: 'sawtooth', gain: .05, lp: 280 }); burst(1.1, { f: 400, fTo: 2200, q: .6, gain: .16, attack: .4 }); burst(.2, { type: 'lowpass', f: 500, gain: .35, delay: 1.0 }); },
  declass() { burst(.5, { f: 3000, fTo: 1200, q: 2, gain: .16, attack: .05 }); tone(70, 55, .4, { gain: .12, lp: 200 }); },
  buzz() { tone(100, 98, .5, { type: 'square', gain: .05, lp: 600 }); burst(.5, { type: 'highpass', f: 4000, gain: .05 }); },
  ping() { tone(880, 880, .12, { gain: .12 }); tone(1320, 1320, .22, { gain: .1, delay: .12 }); },
  thump() { tone(70, 32, .6, { gain: .35, lp: 200 }); },
  seal() { tone(90, 40, .5, { gain: .7, lp: 300 }); burst(.4, { type: 'lowpass', f: 400, gain: .3 }); tone(520, 520, 1.6, { gain: .035, delay: .1 }); tone(784, 784, 1.8, { gain: .025, delay: .1 }); },
  penStart() {
    const c = audio(); if (!c || penNode) return;
    const s = c.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3400; f.Q.value = .9;
    const g = c.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(master); s.start();
    penNode = { s, g, f };
  },
  penMove(speed) { if (!penNode) return; const v = Math.min(.16, speed * .05); penNode.g.gain.setTargetAtTime(v, ac.currentTime, .03); penNode.f.frequency.setTargetAtTime(2600 + Math.min(2400, speed * 700), ac.currentTime, .05); },
  penEnd() { if (!penNode) return; const n = penNode; penNode = null; n.g.gain.setTargetAtTime(0, ac.currentTime, .04); setTimeout(() => { try { n.s.stop(); } catch (e) {} }, 300); },
  startAmbient() {
    const c = audio(); if (!c || ambient) return;
    const s = c.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 130;
    const g = c.createGain(); g.gain.value = .0001; g.gain.linearRampToValueAtTime(.09, c.currentTime + 4);
    s.connect(f); f.connect(g); g.connect(master); s.start();
    const o = c.createOscillator(); o.frequency.value = 50; const og = c.createGain(); og.gain.value = .0001; og.gain.linearRampToValueAtTime(.012, c.currentTime + 5); o.connect(og); og.connect(master); o.start();
    ambient = { s, g, o, og };
  },
  stopAmbient() { if (!ambient) return; const a = ambient; ambient = null; a.g.gain.setTargetAtTime(0, ac.currentTime, .3); a.og.gain.setTargetAtTime(0, ac.currentTime, .3); setTimeout(() => { try { a.s.stop(); a.o.stop(); } catch (e) {} }, 1500); }
};

/* ============ TOAST ============ */
let toastTimer;
function toast(msg) {
  const t = $('#toast'); if (!t) return;
  t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 3400);
}

/* ============ ATMOSFERA: lâmpada, poeira, apagões ============ */
const lamp = $('#lamp');
let mx = innerWidth / 2, my = innerHeight * .4, raf = 0;
addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(() => { raf = 0; document.documentElement.style.setProperty('--mx', mx + 'px'); document.documentElement.style.setProperty('--my', my + 'px'); }); }, { passive: true });
function blackout() {
  if (!lamp || reduced) return;
  sfx.buzz();
  const seq = [0, 1, 0, 1, 1, 0, 1]; let i = 0;
  (function step() { lamp.classList.toggle('dark', !!seq[i]); if (++i < seq.length) setTimeout(step, rnd(40, 140)); else lamp.classList.remove('dark'); })();
}
let blackoutTimer;
function scheduleBlackout() { clearTimeout(blackoutTimer); blackoutTimer = setTimeout(() => { if (document.body.classList.contains('is-open')) { blackout(); setTimeout(() => sfx.thump(), 900); } scheduleBlackout(); }, rnd(40000, 90000)); }

const dust = $('#dust');
if (dust && !reduced) {
  const x = dust.getContext('2d'); let W, H; const P = [];
  const fit = () => { W = dust.width = innerWidth; H = dust.height = innerHeight; };
  fit(); addEventListener('resize', fit);
  for (let i = 0; i < 70; i++) P.push({ x: Math.random(), y: Math.random(), r: rnd(.4, 1.8), vx: rnd(-.00004, .00006), vy: rnd(-.00006, -.00001), a: rnd(.2, .8), p: Math.random() * 6 });
  (function loop(t) {
    if (!document.hidden) {
      x.clearRect(0, 0, W, H);
      for (const p of P) {
        p.x += p.vx * 16 + Math.sin(t / 2500 + p.p) * .00006; p.y += p.vy * 16;
        if (p.y < -.02) { p.y = 1.02; p.x = Math.random(); } if (p.x < -.02) p.x = 1.02; if (p.x > 1.02) p.x = -.02;
        const px = p.x * W, py = p.y * H, d = Math.hypot(px - mx, py - my), k = Math.max(0, 1 - d / 520);
        const a = (.08 + k * .75) * p.a * (.6 + .4 * Math.sin(t / 700 + p.p));
        x.fillStyle = `rgba(255,232,180,${a})`; x.beginPath(); x.arc(px, py, p.r, 0, 6.3); x.fill();
      }
    }
    requestAnimationFrame(loop);
  })(0);
}

/* ============ CAPA DO DOSSIÊ ============ */
const cover = $('#cover');
let coverInfo = { doc: '', finalizado: false, nome: '' }, firstOpen = true, onOpen = () => {};
function updateCover(info) {
  Object.assign(coverInfo, info);
  const d = $('#cover-doc'); if (d) d.textContent = 'Nº ' + coverInfo.doc;
  const s = $('#cover-status'); if (s) s.textContent = coverInfo.finalizado ? 'DOSSIÊ AUTENTICADO — AGENTE ' + (coverInfo.nome || '').toUpperCase() : 'ACESSO RESTRITO — NÍVEL 3';
  const st = $('#cover-stamp'); if (st) st.textContent = coverInfo.finalizado ? 'ARQUIVADO' : 'CONFIDENCIAL';
}
async function openDossier() {
  if (!cover || cover.classList.contains('opening')) return;
  const sc = $('#scene'), fr = $('#folder').getBoundingClientRect(), sr = sc.getBoundingClientRect();
  sc.style.transformOrigin = `${fr.left + fr.width / 2 - sr.left}px ${fr.top + fr.height / 2 - sr.top}px`;
  cover.classList.add('opening'); audio(); sfx.open(); sfx.startAmbient(); window.Mesa && Mesa.log(firstOpen ? 'Dossiê aberto pela primeira vez nesta sessão' : 'Dossiê reaberto');
  await sleep(reduced ? 100 : 1500); cover.classList.add('zoom');
  await sleep(reduced ? 100 : 1300);
  cover.hidden = true; cover.classList.remove('opening', 'zoom');
  document.body.classList.add('is-open'); document.body.classList.remove('is-closed');
  scheduleBlackout();
  onOpen(firstOpen); firstOpen = false;
}
function closeDossier() {
  if (!cover) return; window.Mesa && Mesa.log('Dossiê fechado');
  sfx.open(); cover.hidden = false; cover.classList.remove('opening', 'zoom'); cover.classList.add('closing');
  document.body.classList.remove('is-open'); document.body.classList.add('is-closed');
  setTimeout(() => cover.classList.remove('closing'), 900);
  clearTimeout(blackoutTimer);
  window.Mesa && Mesa.onClose && Mesa.onClose();
}
if (cover) {
  const trigger = $('#folder', cover);
  trigger.addEventListener('click', openDossier);
  trigger.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDossier(); } });
  document.body.classList.add('is-closed');
}

/* ============ TOGGLE DE SOM ============ */
function paintSound() { document.querySelectorAll('[data-sound]').forEach(b => { b.textContent = soundOn ? '♪ SOM: LIGADO' : '♪ SOM: MUDO'; b.setAttribute('aria-pressed', String(soundOn)); }); }
document.addEventListener('click', e => {
  const b = e.target.closest('[data-sound]');
  if (b) { soundOn = !soundOn; store.set('ordo-som', soundOn ? '1' : '0'); if (soundOn) { audio(); sfx.tick(); sfx.startAmbient(); } else { sfx.stopAmbient(); } paintSound(); return; }
  if (e.target.closest('#close-dossier')) { closeDossier(); return; }
  const btn = e.target.closest('button, .redacted'); if (btn) sfx.tick();
});
paintSound();
// som de máquina de escrever nos campos de texto
document.addEventListener('keydown', e => { if (e.target.matches('input[type=text],input:not([type]),textarea') && e.key.length === 1) sfx.key(); });

/* ============ CLONAGEM VISUAL (para a virada de página) ============ */
function cloneVisual(node) {
  const c = node.cloneNode(true);
  const oc = node.querySelectorAll('canvas'), cc = c.querySelectorAll('canvas');
  oc.forEach((o, i) => { try { cc[i].width = o.width; cc[i].height = o.height; cc[i].getContext('2d').drawImage(o, 0, 0); } catch (e) {} });
  const of = node.querySelectorAll('input,textarea,select'), cf = c.querySelectorAll('input,textarea,select');
  of.forEach((o, i) => { try { cf[i].value = o.value; } catch (e) {} });
  c.removeAttribute('id'); c.style.margin = '0'; c.style.width = '100%'; c.style.height = '100%'; c.style.position = 'relative';
  return c;
}
function holder(rect, sr, child, cls) {
  const h = document.createElement('div'); h.className = 'fp ' + (cls || '');
  Object.assign(h.style, { left: rect.left - sr.left + 'px', top: rect.top - sr.top + 'px', width: rect.width + 'px', height: rect.height + 'px' });
  if (child) h.appendChild(child); return h;
}

/* ============ VIRADA DE PÁGINA 3D ============ */
let turning = false;
const pagesOf = stage => [...stage.children].filter(c => !c.classList.contains('arrow-control') && !c.classList.contains('flip-layer'));
async function turn(stage, dir, mutate) {
  if (turning) return; turning = true;
  try {
    if (!wide() || reduced) { sfx.flip(); mutate(); stage.classList.remove('fresh'); void stage.offsetWidth; stage.classList.add('fresh', 'slide'); setTimeout(() => stage.classList.remove('slide'), 900); arrive(stage); return; }
    const old = pagesOf(stage); if (old.length < 2) { mutate(); return; }
    stage.classList.remove('fresh');
    const sr = stage.getBoundingClientRect(), r0 = old[0].getBoundingClientRect(), r1 = old[1].getBoundingClientRect();
    const oc = old.map(cloneVisual);
    mutate();
    const nw = pagesOf(stage); if (nw.length < 2) return;
    const layer = document.createElement('div'); layer.className = 'flip-layer';
    const g = (r1.left - r0.right) / 2;
    let flipper, hide, frames, under;
    if (dir > 0) {
      hide = nw[0]; under = holder(r0, sr, oc[0]);
      const back = cloneVisual(nw[0]);
      flipper = holder(r1, sr, null, 'flipper'); flipper.style.transformOrigin = `${-g}px 50%`;
      const f = document.createElement('div'); f.className = 'face front'; f.appendChild(oc[1]);
      const b = document.createElement('div'); b.className = 'face back'; b.appendChild(back);
      flipper.append(f, b); frames = [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-90deg) translateZ(26px)', offset: .5 }, { transform: 'rotateY(-180deg)' }];
    } else {
      hide = nw[1]; under = holder(r1, sr, oc[1]);
      const back = cloneVisual(nw[1]);
      flipper = holder(r0, sr, null, 'flipper'); flipper.style.transformOrigin = `${r0.width + g}px 50%`;
      const f = document.createElement('div'); f.className = 'face front'; f.appendChild(oc[0]);
      const b = document.createElement('div'); b.className = 'face back'; b.appendChild(back);
      flipper.append(f, b); frames = [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(90deg) translateZ(26px)', offset: .5 }, { transform: 'rotateY(180deg)' }];
    }
    hide.style.visibility = 'hidden';
    layer.append(under, flipper); stage.appendChild(layer);
    // sombras que acompanham a virada
    const sf = document.createElement('div'); sf.className = 'shade'; flipper.querySelector('.front').appendChild(sf);
    const sb = document.createElement('div'); sb.className = 'shade'; flipper.querySelector('.back').appendChild(sb);
    const cast = document.createElement('div'); cast.className = 'cast'; cast.style[dir > 0 ? 'left' : 'right'] = '50%'; layer.prepend(cast);
    sfx.flip();
    const dur = 1250, opt = { duration: dur, easing: 'cubic-bezier(.5,.05,.3,1)', fill: 'forwards' };
    sf.animate([{ opacity: 0 }, { opacity: .85 }], { duration: dur / 2, fill: 'forwards', easing: 'ease-in' });
    sb.animate([{ opacity: .85 }, { opacity: 0 }], { duration: dur / 2, delay: dur / 2, fill: 'both', easing: 'ease-out' });
    cast.animate([{ opacity: 0 }, { opacity: 1, offset: .5 }, { opacity: 0 }], { duration: dur });
    await flipper.animate(frames, opt).finished.catch(() => {});
    layer.remove(); hide.style.visibility = '';
    stage.classList.add('fresh'); arrive(stage);
  } finally { turning = false; }
}

/* ============ ASSINATURAS COM CANETA ============ */
const PENSVG = '<svg viewBox="0 0 60 60" width="54" height="54"><g transform="rotate(38 6 54)"><path d="M6 54 L14 36 L22 40 Z" fill="#cfae6a" stroke="#2a1d08" stroke-width="1"/><path d="M14 36 L20 12 L36 18 L22 40 Z" fill="#0f0f12" stroke="#000"/><path d="M20 12 L52 -34 L66 -26 L36 18 Z" fill="#17171c" stroke="#000"/><path d="M6 54 L9 47" stroke="#0a0a0a" stroke-width="2"/></g></svg>';
function pad(canvas, o = {}) {
  const ctx = canvas.getContext('2d'); let W = 0, H = 0, dirty = false, last = null, down = false, lw = 1.6, lt = 0;
  const ink = o.ink || '#0c1433';
  function size() {
    const r = canvas.getBoundingClientRect(); if (!r.width) return;
    const dpr = Math.min(2, devicePixelRatio || 1), snap = dirty ? canvas.toDataURL() : o.initial;
    W = r.width; H = r.height; canvas.width = r.width * dpr; canvas.height = r.height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (snap) { const im = new Image(); im.onload = () => ctx.drawImage(im, 0, 0, W, H); im.src = snap; }
  }
  size(); if (o.initial) dirty = true;
  const pos = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, t: e.timeStamp, p: e.pointerType === 'pen' && e.pressure ? e.pressure : 0 }; };
  canvas.addEventListener('pointerdown', e => {
    if (e.button > 0) return; e.preventDefault(); canvas.setPointerCapture(e.pointerId); down = true; last = pos(e); lw = o.max ? o.max * .55 : 1.6;
    ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(last.x, last.y, lw / 2, 0, 6.3); ctx.fill(); dirty = true; canvas.classList.add('inking'); sfx.penStart(); o.onStart && o.onStart();
  });
  canvas.addEventListener('pointermove', e => {
    if (!down) return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of (evs.length ? evs : [e])) {
      const p = pos(ev), dx = p.x - last.x, dy = p.y - last.y, dist = Math.hypot(dx, dy); if (dist < .6) continue;
      const dt = Math.max(1, p.t - last.t), v = dist / dt; // px/ms
      const target = p.p ? (o.min || .8) + p.p * ((o.max || 3.2) - (o.min || .8)) : (o.max || 3.2) - Math.min(v, 2.2) / 2.2 * ((o.max || 3.2) - (o.min || .8));
      lw = lw * .78 + target * .22;
      ctx.strokeStyle = ink; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = lw; ctx.shadowColor = ink; ctx.shadowBlur = .9;
      const mid = { x: (last.x + p.x) / 2, y: (last.y + p.y) / 2 };
      const pm = last.mid || last;
      ctx.beginPath(); ctx.moveTo(pm.x, pm.y); ctx.quadraticCurveTo(last.x, last.y, mid.x, mid.y); ctx.stroke();
      p.mid = mid; last = p; sfx.penMove(v * 6);
    }
  });
  const end = e => { if (!down) return; down = false; canvas.classList.remove('inking'); sfx.penEnd(); last = null; o.onChange && o.onChange(canvas.toDataURL('image/png')); };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  if ('ResizeObserver' in window) new ResizeObserver(() => { const r = canvas.getBoundingClientRect(); if (Math.abs(r.width - W) > 2 || Math.abs(r.height - H) > 2) size(); }).observe(canvas);
  return { clear() { ctx.clearRect(0, 0, W, H); dirty = false; o.onChange && o.onChange(''); }, isEmpty: () => !dirty };
}
// assinatura "sozinha" com a caneta seguindo o traço
const SIGS = {
  diretor: { nome: 'Verissimo', cls: 'n-verissimo', flourish: 'M14 64 C60 58 120 72 206 56' },
  analista: { nome: 'Samuel Norte', cls: 'n-samuel', flourish: 'M30 66 C80 60 140 70 196 58' }
};
function sigSVG(name, cls = '') {
  const s = SIGS[name];
  return `<span class="sig-wrap ${cls}" data-sig="${name}"><span class="sig-name ${s.cls}">${s.nome}</span><svg viewBox="0 0 220 80" preserveAspectRatio="none" aria-hidden="true"><path d="${s.flourish}" pathLength="1000"/></svg><span class="pen-sprite" aria-hidden="true">${PENSVG}</span></span>`;
}
// ajusta o tamanho do nome para ocupar ~88% da largura, seja qual for a fonte carregada
function fitSig(wrap) {
  const n = wrap.querySelector('.sig-name'); if (!n || !wrap.clientWidth) return;
  n.style.fontSize = ''; n.style.display = 'inline-block'; n.style.right = 'auto'; n.style.left = '0';
  const base = parseFloat(getComputedStyle(n).fontSize), w = n.getBoundingClientRect().width / (1);
  n.style.display = ''; n.style.right = ''; n.style.left = '';
  if (w > 0) n.style.fontSize = Math.min(base * wrap.clientWidth * .88 / w, wrap.clientWidth * .5) + 'px';
}
const fitAll = root => root.querySelectorAll('.sig-wrap').forEach(fitSig);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitAll(document));
// a assinatura se escreve da esquerda para a direita, com a caneta na frente, e termina com o floreio
function autoSign(wrap, dur = 2600, delay = 0) {
  fitSig(wrap);
  const nameEl = wrap.querySelector('.sig-name'), under = wrap.querySelector('path'), pen = wrap.querySelector('.pen-sprite');
  const reveal = v => { nameEl.style.clipPath = v >= 1 ? 'none' : `inset(-20% ${(1 - v) * 100}% -20% 0)`; };
  reveal(0); under.style.strokeDasharray = '1000'; under.style.strokeDashoffset = '1000';
  if (reduced) { reveal(1); under.style.strokeDashoffset = 0; return Promise.resolve(); }
  return new Promise(res => {
    const t1 = dur * .78; let start = null;
    setTimeout(() => { sfx.penStart(); pen.style.opacity = 1; requestAnimationFrame(function f(t) {
      if (start === null) start = t; const el = t - start;
      if (el < t1) {
        const k = el / t1, e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; reveal(Math.min(.999, e));
        pen.style.left = (4 + 90 * e) + '%'; pen.style.top = (58 + Math.sin(el / 75) * 9) + '%'; sfx.penMove(2.4 + Math.sin(el / 90));
      } else {
        reveal(1); const k = Math.min(1, (el - t1) / (dur - t1)), e = 1 - Math.pow(1 - k, 2);
        under.style.strokeDashoffset = 1000 * (1 - e); const pt = under.getPointAtLength(1000 * e * under.getTotalLength() / 1000);
        pen.style.left = (pt.x / 220 * 100) + '%'; pen.style.top = (pt.y / 80 * 100) + '%'; sfx.penMove(2);
      }
      if (el < dur) requestAnimationFrame(f); else { under.style.strokeDashoffset = 0; pen.style.opacity = 0; sfx.penEnd(); res(); }
    }); }, delay);
  });
}

/* ============ DECORAÇÃO DAS PÁGINAS ============ */
const FOLIOS = { introducao: [1, 2], atributos: [3, 4], origem: [5, 6], classe: [7, 8], autenticacao: [9, 10] };
const STAMPS = { introducao: 'CONFIDENCIAL', atributos: 'AVALIAÇÃO FÍSICA', origem: 'ARQUIVO PESSOAL', classe: 'TREINAMENTO' };
const CLIP = '<svg viewBox="0 0 40 110" aria-hidden="true"><path d="M12 80 V22 a8 8 0 0 1 16 0 V88 a12 12 0 0 1 -24 0 V30" fill="none" stroke="#8d8f94" stroke-width="3" stroke-linecap="round"/><path d="M12 80 V22 a8 8 0 0 1 16 0 V88 a12 12 0 0 1 -24 0 V30" fill="none" stroke="#e8eaee" stroke-width="1" stroke-linecap="round" transform="translate(-.8 -.8)" opacity=".7"/></svg>';
let padRefs = [];
function decorate(stage, st, api, fresh) {
  padRefs = [];
  const pages = pagesOf(stage), [a, b] = FOLIOS[st.step] || [1, 2];
  const left = pages[0], right = pages[1];
  [[left, a], [right, b]].forEach(([p, n]) => { if (!p) return; p.classList.add('has-folio'); const f = document.createElement('span'); f.className = 'folio'; f.textContent = 'FL. ' + String(n).padStart(2, '0') + ' / 10'; p.appendChild(f); });
  if (left && left.classList.contains('paper')) {
    const clip = document.createElement('span'); clip.className = 'clip'; clip.innerHTML = CLIP; left.appendChild(clip);
    let txt = STAMPS[st.step]; if (st.step === 'autenticacao') txt = st.finalizado ? 'AUTENTICADO' : 'PENDENTE';
    if (txt) { const s = document.createElement('span'); s.className = 'stamp-big ' + (st.step === 'autenticacao' ? 'is-auth ' : '') + (st.step === 'autenticacao' && st.finalizado ? 'ok ' : '') + (fresh ? 'slam' : 'stamped'); s.dataset.stamp = txt; s.dataset.step = st.step; s.innerHTML = `<b>${txt}</b><small>ORDO REALITAS · DOC ${(window.ORDO_DADOS || {}).documento || ''}</small>`; left.appendChild(s); }
    // rubrica por página
    const box = document.createElement('div'); box.className = 'initials'; box.innerHTML = '<canvas aria-label="Rubrica do agente: desenhe com o mouse, dedo ou caneta"></canvas><span>RUBRICA DO AGENTE</span>';
    left.appendChild(box);
    const cv = box.querySelector('canvas'); const p = pad(cv, { min: .7, max: 2.4, initial: (st.initials || {})[st.step], onChange: d => { st.initials = st.initials || {}; if (d) st.initials[st.step] = d; else delete st.initials[st.step]; api.save(); } });
    padRefs.push(p);
  }
  // assinatura principal
  const main = stage.querySelector('canvas[data-sigpad]');
  if (main) {
    const p = pad(main, { min: 1, max: 3.6, initial: st.profile.assinaturaImg, onChange: d => { st.profile.assinaturaImg = d; st.finalizado = false; api.save(); const b = $('.finalize'); if (b) b.textContent = 'FINALIZAR DOCUMENTO'; } });
    stage.querySelector('[data-sig-clear]')?.addEventListener('click', () => { p.clear(); sfx.declass(); });
    padRefs.push(p);
  }
}
function arrive(stage) {
  fitAll(stage);
  stage.querySelectorAll('.stamp-big.slam').forEach(s => setTimeout(() => sfx.stamp(), 520));
  stage.querySelectorAll('.sig-wrap[data-auto]').forEach((w, i) => autoSign(w, 2400, 900 + i * 700));
}

/* ============ MÁQUINA DE ESCREVER ============ */
async function typewrite(root) {
  const els = [...root.querySelectorAll('p')].filter(p => !p.children.length && p.textContent.trim());
  const saved = els.map(p => p.textContent); els.forEach(p => { p.dataset.full = p.textContent; p.textContent = ''; p.classList.add('typing'); });
  for (let i = 0; i < els.length; i++) {
    const t = saved[i];
    for (let k = 0; k < t.length; k += 3) { els[i].textContent = t.slice(0, k + 3); sfx.key(); await sleep(16); if (!document.body.contains(els[i])) return; }
    els[i].textContent = t;
    els[i].classList.remove('typing');
  }
}

/* ============ FINAL CINEMATOGRÁFICO ============ */
async function finale(st, D, cls, origin) {
  const f = $('#finale'), box = $('#finale-lines'); if (!f) return;
  box.innerHTML = ''; f.hidden = false; f.classList.remove('in'); void f.offsetWidth; f.classList.add('in'); $('#finale-actions').hidden = true;
  const nome = (st.profile.nome || 'AGENTE').toUpperCase();
  const lines = [
    ['ARQUIVO Nº ' + D.documento, 'dim'], ['Verificando assinatura...', 'dim'], ['Assinatura confirmada.', ''], ['Registrando identidade na base da Ordo Realitas...', 'dim'], ['', ''],
    ['AGENTE: ' + nome, 'big'], ['NEX: ' + (st.profile.nex || '5%') + '   ORIGEM: ' + (origin || '—').toUpperCase() + '   CLASSE: ' + cls.toUpperCase(), ''], ['', ''],
    ['Bem-vindo à Ordo Realitas.', 'big red'], ['A Membrana não vai se proteger sozinha.', '']
  ];
  await sleep(900);
  for (const [t, c] of lines) {
    const p = document.createElement('p'); p.className = c; box.appendChild(p);
    for (let i = 0; i < t.length; i++) { p.textContent = t.slice(0, i + 1) + '▌'; if (i % 2 === 0) sfx.key(); await sleep(c.includes('big') ? 38 : 20); }
    p.textContent = t; await sleep(t ? 260 : 120);
  }
  $('#finale-actions').hidden = false; $('#finale-back').focus();
}
$('#finale-back')?.addEventListener('click', () => { $('#finale').hidden = true; });
$('#finale-close')?.addEventListener('click', () => { $('#finale').hidden = true; closeDossier(); });

/* ============ CARIMBO + CONTRA-ASSINATURA (FINALIZAR) ============ */
async function authenticate(stage, st) {
  const dir = stage.querySelector('.countersign'); const pageL = pagesOf(stage)[0];
  if (dir) { dir.hidden = false; const w = dir.querySelector('.sig-wrap'); await autoSign(w, 2200, 200); await sleep(250); }
  const old = pageL.querySelector('.stamp-big');
  if (old) { old.classList.remove('stamped', 'slam'); old.classList.add('ok'); old.dataset.stamp = 'AUTENTICADO'; old.querySelector('b').textContent = 'AUTENTICADO'; void old.offsetWidth; old.classList.add('slam', 'go'); }
  setTimeout(() => sfx.seal(), 420); document.body.classList.add('shake'); setTimeout(() => document.body.classList.remove('shake'), 700);
  await sleep(1400);
}

window.FX = { openDossier, sfx, toast, turn, decorate, arrive, pad, sigSVG, autoSign, updateCover, finale, authenticate, closeDossier, typewrite,
  onOpen(fn) { onOpen = fn; }, isTurning: () => turning, padsEmpty: () => padRefs.length ? padRefs[padRefs.length - 1].isEmpty() : true };
})();
