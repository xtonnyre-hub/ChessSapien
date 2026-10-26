/* ===== Sapientia v0.2 — ui.js (menú, tema, sonido, rankings, hero 3D, efectos) ===== */
'use strict';
const $$ = (s) => [...document.querySelectorAll(s)];
const LS = { get: (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };

/* ---------- 1. Sonido sintetizado (Web Audio, sin archivos) ---------- */
const SFX = (() => {
  let ctx, on = LS.get('sap-sfx', '1') !== '0', ult = 0;
  const t = (f, d, ty = 'sine', v = .05, s = 0, e = null) => {
    if (!on) return;
    try {
      ctx ||= new AudioContext(); if (ctx.state === 'suspended') ctx.resume();
      const o = ctx.createOscillator(), g = ctx.createGain(), n = ctx.currentTime + s;
      o.type = ty; o.frequency.setValueAtTime(f, n); if (e) o.frequency.exponentialRampToValueAtTime(e, n + d);
      g.gain.setValueAtTime(v, n); g.gain.exponentialRampToValueAtTime(.0001, n + d);
      o.connect(g).connect(ctx.destination); o.start(n); o.stop(n + d);
    } catch {}
  };
  const P = {
    click: () => t(900, .06, 'square', .025, 0, 500), hover: () => t(1400, .03, 'sine', .01),
    move: () => t(220, .12, 'triangle', .08, 0, 140), capture: () => { t(160, .2, 'sawtooth', .05, 0, 60); t(500, .1, 'square', .025); },
    open: () => t(300, .35, 'sine', .06, 0, 900), tick: () => t(1000, .05, 'square', .025),
    win: () => [523, 659, 784, 1047].forEach((f, i) => t(f, .18, 'triangle', .06, i * .08)),
    lose: () => t(200, .35, 'sawtooth', .05, 0, 70), whoosh: () => t(200, .35, 'sine', .04, 0, 1200),
  };
  return { play: (k) => { if (k === 'hover' && Date.now() - ult < 60) return; ult = Date.now(); P[k]?.(); }, get on() { return on; }, toggle() { on = !on; LS.set('sap-sfx', on ? '1' : '0'); return on; } };
})();

/* ---------- 2. Efectos: confeti, vibración, toasts, revelado ---------- */
const FX = {
  confetti() {
    const c = $('#fx'), x = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight;
    const col = ['#9281f7', '#baa7ff', '#3ad389', '#ffca16', '#ff9592'];
    const ps = Array.from({ length: 90 }, () => ({ x: innerWidth / 2, y: innerHeight / 2, vx: (Math.random() - .5) * 16, vy: Math.random() * -14 - 3, c: col[Math.random() * 5 | 0], r: Math.random() * 6 + 2 }));
    let f = 0; (function an() {
      x.clearRect(0, 0, c.width, c.height);
      ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .4; x.fillStyle = p.c; x.fillRect(p.x, p.y, p.r, p.r); });
      if (++f < 80) requestAnimationFrame(an); else x.clearRect(0, 0, c.width, c.height);
    })();
  },
  shake() { const t = $('#tablero'); t.classList.add('shake'); setTimeout(() => t.classList.remove('shake'), 400); },
};
function toast(msg) { const d = document.createElement('div'); d.className = 'toast glass'; d.textContent = msg; $('#toasts').appendChild(d); setTimeout(() => d.remove(), 3500); }

const io = new IntersectionObserver((es) => es.forEach(e => e.isIntersecting && e.target.classList.add('in')), { threshold: .12 });
$$('.rv').forEach(el => io.observe(el));
$$('[data-count]').forEach(el => { // Contadores animados
  const fin = +el.dataset.count; let n = 0;
  const id = setInterval(() => { n += Math.ceil(fin / 30); if (n >= fin) { n = fin; clearInterval(id); } el.textContent = n; }, 40);
});

/* ---------- 3. Tema y logo adaptable ---------- */
function setTheme(t) {
  document.documentElement.dataset.theme = t; LS.set('sap-theme', t);
  // Tema oscuro → logo sobre fondo verde; tema claro → logo sobre fondo blanco
  $$('[data-logo]').forEach(i => i.src = t === 'light' ? 'assets/logo-claro.png' : 'assets/logo-oscuro.png');
}
setTheme(LS.get('sap-theme', 'dark'));
$('#theme').onclick = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
const pintaSnd = () => $('#snd').classList.toggle('off', !SFX.on); pintaSnd();
$('#snd').onclick = () => { SFX.toggle(); pintaSnd(); SFX.play('click'); };

/* ---------- 4. Menú de cristal: navegación, desplegables, móvil ---------- */
const cerrar = () => { $$('.menu').forEach(m => m.classList.remove('open')); $('#drawer').classList.remove('open'); };
function irA(id) {
  SFX.play('whoosh'); const w = $('#wipe'); w.classList.remove('go'); void w.offsetWidth; w.classList.add('go');
  cerrar(); setTimeout(() => document.querySelector(id).scrollIntoView({ behavior: 'smooth' }), 200);
}
$$('[data-go]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); irA(a.getAttribute('href')); }));
$$('[data-dd]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); const m = $('#' + b.dataset.dd), ab = m.classList.contains('open'); cerrar(); if (!ab) m.classList.add('open'); }));
$('#burger').onclick = (e) => { e.stopPropagation(); $('#drawer').classList.toggle('open'); };
document.addEventListener('click', (e) => { if (!e.target.closest('.dd,#drawer')) cerrar(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); });
const nav = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) $$('.nl[href]').forEach(a => a.classList.toggle('act', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
$$('main section').forEach(s => nav.observe(s));
$('#m-reset').onclick = (e) => { e.preventDefault(); cerrar(); nuevaPartida(); irA('#arena'); };

/* Sonidos globales de interfaz */
let ultimo = null;
document.addEventListener('click', e => e.target.closest('button,a,.sq') && SFX.play('click'));
document.addEventListener('mouseover', e => { const b = e.target.closest('button,a,.opcion'); if (b && b !== ultimo) SFX.play('hover'); ultimo = b; });

/* ---------- 5. Perfil ---------- */
let nombre = LS.get('sap-name', 'Tú');
const pintaNombre = () => { $('#userbtn').textContent = nombre; };
pintaNombre();
$('#m-name').onclick = (e) => { e.preventDefault(); cerrar(); const n = prompt('¿Cómo quieres llamarte?', nombre); if (n?.trim()) { nombre = n.trim().slice(0, 14); LS.set('sap-name', nombre); pintaNombre(); pintaRanking(); } };

/* ---------- 6. Rankings ---------- */
const NOMBRES = ['Hipatia', 'Sócrates', 'Curie', 'Frida', 'Darwin', 'Borges', 'Ada', 'Séneca', 'Galileo', 'Kahlo'];
const bots = NOMBRES.map((n, i) => ({ n, lv: 14 - i, rc: 2 + (i * 3) % 7, s: Object.fromEntries(DISCIPLINAS.map((d, k) => [d, 300 + (i * 397 + k * 131) % 900])) }));
let tabRank = 'g', mejor = +LS.get('sap-best', 0);
const ptsDe = (b, t) => t === 'g' ? DISCIPLINAS.reduce((a, d) => a + b.s[d], 0) : b.s[t];
function pintaRanking() {
  const yo = { n: nombre, you: true, lv: 1 + Math.floor(mejor / 100), rc: stats.racha, s: Object.fromEntries(DISCIPLINAS.map(d => [d, stats.porDisc[d].a * 150])) };
  const lista = [...bots, yo].map(b => ({ ...b, p: b.you && tabRank === 'g' ? Math.max(mejor, stats.puntos) : ptsDe(b, tabRank) })).sort((a, b) => b.p - a.p);
  $('#podio').innerHTML = lista.slice(0, 3).map((b, i) => `<div class="pod"><div class="label-sm">#${i + 1}</div><div class="big">${b.n}</div><div class="pts">${b.p} pts</div></div>`).join('');
  $('#tabla').innerHTML = lista.map((b, i) => `<li class="row ${b.you ? 'you' : ''}"><span class="mono">#${i + 1}</span><span class="av">${b.n[0]}</span><b>${b.n}${b.you ? ' (tú)' : ''}</b><span class="mono hide">Nv.${b.lv}</span><span class="mono hide">×${b.rc}</span><span class="pts">${b.p}</span></li>`).join('');
}
$$('.tab').forEach(b => b.onclick = () => { tabRank = b.dataset.tab; $$('.tab').forEach(x => x.classList.toggle('on', x === b)); pintaRanking(); });
setInterval(() => { const b = bots[Math.random() * bots.length | 0]; b.s[DISCIPLINAS[Math.random() * 4 | 0]] += 20 + (Math.random() * 70 | 0); pintaRanking(); }, 6000); // Actividad "en vivo" simulada

/* ---------- 7. Disciplinas, logros y desafío diario ---------- */
const DESC = { 'Física': 'Del átomo al cosmos: las leyes que sostienen el universo.', 'Historia': 'Imperios, revoluciones y las decisiones que cambiaron el rumbo.', 'Arte': 'Movimientos, obras y la mirada que las inspiró.', 'Filosofía': 'Las grandes preguntas y quienes se atrevieron a formularlas.' };
$('#cards-disc').innerHTML = DISCIPLINAS.map(d => `<div class="card" style="--c:${META[d].css}"><div class="ic">${META[d].glifo}</div><h3>${d}</h3><p>${DESC[d]}</p><span class="label-sm" data-m="${d}">Dominio 0%</span></div>`).join('');
const LOG = [['Primera sangre', 'Tu primera captura', s => s.capturas >= 1], ['En racha', '3 aciertos seguidos', s => s.racha >= 3], ['Erudito', '10 aciertos', s => s.aciertos >= 10],
  ['Pulso firme', '80% de precisión', s => s.intentos >= 5 && s.aciertos / s.intentos >= .8], ['Polímata', 'Acierta en las 4 disciplinas', s => DISCIPLINAS.every(d => s.porDisc[d].a > 0)], ['Centurión', '100 puntos', s => s.puntos >= 100]];
const ganados = new Set(JSON.parse(LS.get('sap-logros', '[]')));
const pintaLogros = () => { $('#logros-grid').innerHTML = LOG.map(l => `<div class="ins ${ganados.has(l[0]) ? 'on' : ''}"><b>${l[0]}</b>${l[1]}</div>`).join(''); };
pintaLogros();

document.addEventListener('sapientia:stats', (e) => {
  const s = e.detail;
  if (s.puntos > mejor) { mejor = s.puntos; LS.set('sap-best', mejor); }
  LOG.forEach(l => { if (!ganados.has(l[0]) && l[2](s)) { ganados.add(l[0]); LS.set('sap-logros', JSON.stringify([...ganados])); toast('🏆 Logro: ' + l[0]); SFX.play('win'); } });
  $$('[data-m]').forEach(el => { const { a, i } = s.porDisc[el.dataset.m]; el.textContent = 'Dominio ' + (i ? Math.round(a / i * 100) : 0) + '%'; });
  pintaLogros(); pintaRanking();
});

const hoy = new Date().toISOString().slice(0, 10);
const pintaDaily = () => { const h = LS.get('sap-day', '') === hoy; $('#daily-btn').disabled = h; $('#daily-btn').textContent = h ? 'Completado hoy ✔' : 'Aceptar desafío'; };
pintaDaily();
$('#daily-btn').onclick = () => { pendiente = null; abrirDesafio(DISCIPLINAS[new Date().getDate() % 4]); };
window.resultadoDiario = (ok, r) => { LS.set('sap-day', hoy); if (ok) { stats.puntos += 50 + r * 2; SFX.play('win'); FX.confetti(); toast('+' + (50 + r * 2) + ' puntos'); } else { SFX.play('lose'); } renderStats(); pintaDaily(); };

/* Modal: comodín 50/50 y atajos 1–4 */
$('#m-5050').onclick = () => {
  if (stats.puntos < 15) return toast('Necesitas 15 puntos');
  const malas = $$('#m-opciones .opcion[data-ok="false"]').filter(b => b.style.visibility !== 'hidden' && !b.disabled).slice(0, 2);
  if (malas.length < 2) return;
  stats.puntos -= 15; renderStats(); malas.forEach(b => { b.style.visibility = 'hidden'; b.disabled = true; });
};
document.addEventListener('keydown', (e) => {
  if (!$('#modal').classList.contains('abierto') || !/^[1-4]$/.test(e.key)) return;
  const b = $$('#m-opciones .opcion')[+e.key - 1]; if (b && !b.disabled) b.click();
});

/* ---------- 8. Hero: piezas de ajedrez 3D animadas ---------- */
function heroPiezas() {
  const c = $('#hero3d'); if (!window.THREE) return;
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true }); r.setPixelRatio(Math.min(devicePixelRatio, 2)); c.appendChild(r.domElement);
  const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(40, 1, .1, 50); cam.position.set(0, 1.4, 9);
  sc.add(new THREE.AmbientLight(0xffffff, .6)); const L = new THREE.PointLight(0x9281f7, 3, 40); L.position.set(3, 5, 6); sc.add(L);
  const base = [[0, 0], [.55, 0], [.55, .12], [.4, .2]];
  const PF = { P: [[.22, .5], [.3, .62], [.2, .7], [.28, .85], [.2, 1.05], [0, 1.12]], R: [[.3, .3], [.28, 1], [.42, 1.05], [.42, 1.35], [0, 1.35]],
    B: [[.22, .4], [.3, .6], [.22, 1], [.3, 1.3], [.12, 1.55], [0, 1.58]], Q: [[.25, .5], [.32, .8], [.3, 1.2], [.5, 1.45], [.3, 1.5], [0, 1.55]], K: [[.26, .5], [.34, .9], [.3, 1.3], [.48, 1.5], [.3, 1.55], [0, 1.58]] };
  const mat = new THREE.MeshStandardMaterial({ color: 0x07070a, roughness: .3, metalness: .7 });
  const borde = new THREE.LineBasicMaterial({ color: 0x6e727a });
  const grupo = new THREE.Group(); sc.add(grupo);
  const mk = (k, x, z, s) => {
    const g = new THREE.LatheGeometry([...base, ...PF[k]].map(p => new THREE.Vector2(...p)), 40), m = new THREE.Mesh(g, mat);
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 20), borde));
    if (k === 'K') { const v = new THREE.Mesh(new THREE.BoxGeometry(.1, .42, .1), mat), h = new THREE.Mesh(new THREE.BoxGeometry(.32, .1, .1), mat); v.position.y = 1.85; h.position.y = 1.9; m.add(v, h); }
    m.position.set(x, -1.2, z); m.scale.setScalar(s); grupo.add(m); return m;
  };
  const ps = [mk('K', 0, 0, 1.5), mk('Q', -2.3, -.8, 1.2), mk('R', 2.4, -.6, 1.1), mk('B', -1.3, 1.5, 1), mk('P', 1.4, 1.7, 1)];
  let px = 0; addEventListener('pointermove', e => px = (e.clientX / innerWidth - .5) * .6);
  const ajusta = () => { const w = c.clientWidth, h = c.clientHeight; r.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  new ResizeObserver(ajusta).observe(c); ajusta();
  (function an(t = 0) {
    t *= .001; ps.forEach((m, i) => { m.rotation.y += .007 * (i % 2 ? 1 : -1); m.position.y = -1.2 + Math.sin(t * 1.2 + i) * .15; });
    grupo.rotation.y += (px - grupo.rotation.y) * .05; r.render(sc, cam); requestAnimationFrame(an);
  })();
}
heroPiezas();
pintaRanking();
