/* ===== Sapientia — app.js ===== */
'use strict';

/* ---------- 1. Constantes y datos ---------- */
const DISCIPLINAS = ['Física', 'Historia', 'Arte', 'Filosofía'];
const META = {
  'Física':    { glifo: '⚛', color: 0x9281f7, css: '#9281f7' },
  'Historia':  { glifo: '⌛', color: 0xffca16, css: '#ffca16' },
  'Arte':      { glifo: '✎', color: 0xff9592, css: '#ff9592' },
  'Filosofía': { glifo: 'Φ', color: 0x70b8ff, css: '#70b8ff' },
};
const SIMBOLO = { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' };
const VALOR = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 20 };
const SEGUNDOS = 15;

// Banco de preguntas: p = pregunta, o = opciones, c = índice correcto
const BANCO = {
  'Física': [
    { p: '¿Qué principio impide conocer con exactitud la posición y el momento de una partícula a la vez?', o: ['Incertidumbre de Heisenberg', 'Exclusión de Pauli', 'Ley de Hooke', 'Principio de Arquímedes'], c: 0 },
    { p: '¿Cuál es la unidad de fuerza en el Sistema Internacional?', o: ['Joule', 'Newton', 'Pascal', 'Vatio'], c: 1 },
  ],
  'Historia': [
    { p: '¿En qué año cayó Constantinopla en manos otomanas?', o: ['1204', '1492', '1453', '1517'], c: 2 },
    { p: '¿Qué civilización construyó Machu Picchu?', o: ['Maya', 'Inca', 'Azteca', 'Olmeca'], c: 1 },
  ],
  'Arte': [
    { p: '¿Quién pintó «La noche estrellada»?', o: ['Monet', 'Dalí', 'Van Gogh', 'Goya'], c: 2 },
    { p: '¿Qué movimiento fundaron Picasso y Braque?', o: ['Cubismo', 'Fauvismo', 'Surrealismo', 'Impresionismo'], c: 0 },
  ],
  'Filosofía': [
    { p: '¿Quién formuló «Pienso, luego existo»?', o: ['Kant', 'Descartes', 'Nietzsche', 'Hume'], c: 1 },
    { p: '¿En qué obra expone Platón la alegoría de la caverna?', o: ['El banquete', 'Fedón', 'La República', 'Timeo'], c: 2 },
  ],
};

/* ---------- 2. Estado ---------- */
const $ = (s) => document.querySelector(s);
let tab, turno, sel, movs, pendiente, ultima, juegoActivo;
let stats;

// Disciplina de cada casilla: patrón diagonal que reparte las cuatro por igual
const disciplinaDe = (r, c) => DISCIPLINAS[(r + 2 * c) % 4];

function nuevaPartida() {
  const fila = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
  tab = Array.from({ length: 8 }, () => Array(8).fill(null));
  fila.forEach((t, c) => { tab[0][c] = { t, c: 'b' }; tab[7][c] = { t, c: 'w' }; });
  for (let c = 0; c < 8; c++) { tab[1][c] = { t: 'P', c: 'b' }; tab[6][c] = { t: 'P', c: 'w' }; }
  turno = 'w'; sel = null; movs = []; pendiente = null; ultima = null; juegoActivo = true;
  stats = { puntos: 0, capturas: 0, racha: 0, aciertos: 0, intentos: 0, porDisc: Object.fromEntries(DISCIPLINAS.map(d => [d, { a: 0, i: 0 }])) };
  renderTablero(); renderStats();
  $('#turno').textContent = 'Turno: Blancas';
  sistema('Nueva partida. Juegas con las blancas.');
}

/* ---------- 3. Movimientos (pseudo-legales, sin jaque) ---------- */
function movimientos(r, c) {
  const p = tab[r][c]; if (!p) return [];
  const out = [];
  const dentro = (a, b) => a >= 0 && a < 8 && b >= 0 && b < 8;
  // Añade casilla; devuelve true si el deslizamiento puede continuar
  const add = (a, b) => {
    if (!dentro(a, b)) return false;
    const q = tab[a][b];
    if (!q) { out.push([a, b]); return true; }
    if (q.c !== p.c) out.push([a, b]);
    return false;
  };
  const desliza = (dirs, max = 8) => dirs.forEach(([dr, dc]) => { for (let i = 1; i <= max; i++) if (!add(r + dr * i, c + dc * i)) break; });
  const ORT = [[1, 0], [-1, 0], [0, 1], [0, -1]], DIA = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  switch (p.t) {
    case 'P': {
      const d = p.c === 'w' ? -1 : 1, ini = p.c === 'w' ? 6 : 1;
      if (dentro(r + d, c) && !tab[r + d][c]) {
        out.push([r + d, c]);
        if (r === ini && !tab[r + 2 * d][c]) out.push([r + 2 * d, c]);
      }
      [-1, 1].forEach(dc => { if (dentro(r + d, c + dc) && tab[r + d][c + dc]?.c === (p.c === 'w' ? 'b' : 'w')) out.push([r + d, c + dc]); });
      break;
    }
    case 'N': [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]].forEach(([a, b]) => add(r + a, c + b)); break;
    case 'K': desliza([...ORT, ...DIA], 1); break;
    case 'R': desliza(ORT); break;
    case 'B': desliza(DIA); break;
    case 'Q': desliza([...ORT, ...DIA]); break;
  }
  return out;
}

/* ---------- 4. Render del tablero ---------- */
function renderTablero() {
  const el = $('#tablero'); el.innerHTML = '';
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const d = disciplinaDe(r, c), p = tab[r][c];
    const b = document.createElement('button');
    b.className = 'sq' + ((r + c) % 2 ? ' alt' : '');
    b.dataset.r = r; b.dataset.c = c; b.dataset.d = d;
    b.setAttribute('aria-label', `${d}${p ? ', pieza ' + p.t : ''}`);
    if (sel && sel[0] === r && sel[1] === c) b.classList.add('sel');
    if (movs.some(m => m[0] === r && m[1] === c)) b.classList.add('hint', ...(p ? ['cap'] : []));
    if (ultima && ultima.some(u => u[0] === r && u[1] === c)) b.classList.add('ultima');
    b.innerHTML = `<span class="glifo">${META[d].glifo}</span>` + (p ? `<span class="pieza ${p.c}">${SIMBOLO[p.t]}</span>` : '');
    el.appendChild(b);
  }
}

$('#tablero').addEventListener('click', (e) => {
  const b = e.target.closest('.sq');
  if (!b || turno !== 'w' || pendiente || !juegoActivo) return;
  const r = +b.dataset.r, c = +b.dataset.c;
  if (sel && movs.some(m => m[0] === r && m[1] === c)) return jugar(sel, [r, c]);
  if (tab[r][c]?.c === 'w') { sel = [r, c]; movs = movimientos(r, c); } else { sel = null; movs = []; }
  renderTablero();
});

/* ---------- 5. Jugada y captura ---------- */
function jugar(de, a) {
  const pieza = tab[de[0]][de[1]], capturada = tab[a[0]][a[1]];
  SFX.play(capturada ? 'capture' : 'move');
  tab[a[0]][a[1]] = pieza; tab[de[0]][de[1]] = null;
  if (pieza.t === 'P' && (a[0] === 0 || a[0] === 7)) pieza.t = 'Q'; // promoción automática
  sel = null; movs = []; ultima = [de, a];
  renderTablero();
  if (capturada) {
    // La captura queda "en suspenso" hasta resolver el desafío
    pendiente = { de, a, pieza, capturada };
    abrirDesafio(disciplinaDe(a[0], a[1]));
  } else turnoRival();
}

function resolverDesafio(acierto, restante) {
  if (!pendiente) return window.resultadoDiario?.(acierto, restante);
  SFX.play(acierto ? 'win' : 'lose'); acierto ? FX.confetti() : FX.shake();
  const { de, a, pieza, capturada } = pendiente; pendiente = null;
  const d = $('#m-disc').dataset.d;
  stats.intentos++; stats.porDisc[d].i++;
  if (acierto) {
    stats.aciertos++; stats.porDisc[d].a++; stats.capturas++; stats.racha++;
    stats.puntos += VALOR[capturada.t] * 10 + restante * 2;
    agregarNodo(d);
    sistema(`✔ Captura conquistada en ${d}.`);
    if (capturada.t === 'K') return finPartida('¡Has ganado la partida!');
    renderStats(); renderTablero();
    setTimeout(turnoRival, 500);
  } else {
    // Captura revocada: las piezas regresan a su sitio
    tab[de[0]][de[1]] = pieza; tab[a[0]][a[1]] = capturada;
    stats.racha = 0; ultima = null;
    sistema(`✖ Desafío fallido en ${d}. La captura se revoca.`);
    renderStats(); renderTablero();
    setTimeout(turnoRival, 500);
  }
}

function turnoRival() {
  if (!juegoActivo) return;
  turno = 'b'; $('#turno').textContent = 'Turno: Negras';
  setTimeout(() => {
    const todas = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++)
      if (tab[r][c]?.c === 'b') movimientos(r, c).forEach(m => todas.push({ de: [r, c], a: m, cap: !!tab[m[0]][m[1]] }));
    if (!todas.length) return finPartida('Tablas: el rival no tiene movimientos.');
    const caps = todas.filter(m => m.cap), pool = caps.length && Math.random() < .7 ? caps : todas;
    const m = pool[Math.floor(Math.random() * pool.length)];
    const cap = tab[m.a[0]][m.a[1]], p = tab[m.de[0]][m.de[1]];
    tab[m.a[0]][m.a[1]] = p; tab[m.de[0]][m.de[1]] = null;
    if (p.t === 'P' && m.a[0] === 7) p.t = 'Q';
    ultima = [m.de, m.a];
    if (cap) sistema(`El rival captura en ${disciplinaDe(m.a[0], m.a[1])}.`);
    renderTablero();
    if (cap?.t === 'K') return finPartida('Has perdido al rey.');
    turno = 'w'; $('#turno').textContent = 'Turno: Blancas';
  }, 700);
}

function finPartida(msg) { juegoActivo = false; sistema(msg + ' Pulsa «Nueva partida».'); $('#turno').textContent = 'Fin de la partida'; renderStats(); renderTablero(); }

/* ---------- 6. Modal: Desafío de Sapientia (15 s) ---------- */
let intervalo = null;
function abrirDesafio(disciplina) {
  const q = BANCO[disciplina][Math.floor(Math.random() * BANCO[disciplina].length)];
  const ops = q.o.map((t, i) => ({ t, ok: i === q.c })).sort(() => Math.random() - .5);
  const md = $('#m-disc'); md.textContent = `${META[disciplina].glifo} ${disciplina}`; md.dataset.d = disciplina;
  $('#m-pregunta').textContent = q.p;
  const cont = $('#m-opciones'); cont.innerHTML = '';
  let restante = SEGUNDOS, cerrado = false;

  const cerrar = (acierto) => {
    if (cerrado) return; cerrado = true; clearInterval(intervalo);
    cont.querySelectorAll('button').forEach(b => b.disabled = true);
    setTimeout(() => { $('#modal').classList.remove('abierto'); resolverDesafio(acierto, restante); }, 900);
  };
  ops.forEach((o, i) => {
    const b = document.createElement('button');
    b.className = 'opcion'; b.dataset.ok = o.ok; b.textContent = o.t; b.style.animationDelay = `${i * 70}ms`;
    b.onclick = () => { b.classList.add(o.ok ? 'ok' : 'mal'); if (!o.ok) [...cont.children].find((_, k) => ops[k].ok).classList.add('ok'); cerrar(o.ok); };
    cont.appendChild(b);
  });

  // Temporizador: la barra se drena por CSS; el contador, cada segundo
  const barra = $('#m-barra'); barra.classList.remove('corre'); void barra.offsetWidth; barra.classList.add('corre');
  $('#m-seg').textContent = restante;
  intervalo = setInterval(() => { restante--; $('#m-seg').textContent = restante; if (restante > 0 && restante <= 5) SFX.play('tick'); if (restante <= 0) cerrar(false); }, 1000);
  $('#modal').classList.add('abierto'); SFX.play('open');
}

/* ---------- 7. Estadísticas ---------- */
function renderStats() {
  $('#st-puntos').textContent = stats.puntos;
  $('#st-capturas').textContent = stats.capturas;
  $('#st-racha').textContent = stats.racha;
  $('#st-precision').textContent = stats.intentos ? Math.round(stats.aciertos / stats.intentos * 100) + '%' : '—';
  $('#barras').innerHTML = DISCIPLINAS.map(d => {
    const { a, i } = stats.porDisc[d], pct = i ? a / i * 100 : 0;
    return `<div><div class="label-sm flex justify-between"><span>${d}</span><span>${a}/${i}</span></div>
            <div class="barra"><div style="width:${pct}%;background:${META[d].css}"></div></div></div>`;
  }).join('');
  document.dispatchEvent(new CustomEvent('sapientia:stats', { detail: stats }));
}
$('#leyenda').innerHTML = DISCIPLINAS.map(d => `<li><i style="background:${META[d].css}"></i>${d}</li>`).join('');

/* ---------- 8. Grafo de conocimiento (Three.js) ---------- */
let grupo = null, nodos = [];
function iniciarGrafo() {
  const cont = $('#grafo');
  if (!window.THREE) { cont.textContent = 'Three.js no disponible (revisa tu conexión).'; return; }
  const w = cont.clientWidth, h = cont.clientHeight;
  const escena = new THREE.Scene(), cam = new THREE.PerspectiveCamera(50, w / h, .1, 100); cam.position.z = 7;
  const rend = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  rend.setSize(w, h); rend.setPixelRatio(devicePixelRatio); cont.innerHTML = ''; cont.appendChild(rend.domElement);
  grupo = new THREE.Group(); escena.add(grupo);
  DISCIPLINAS.forEach(d => { agregarNodo(d); agregarNodo(d); });
  (function animar() { grupo.rotation.y += .004; grupo.rotation.x += .0012; rend.render(escena, cam); requestAnimationFrame(animar); })();
  new ResizeObserver(() => { const W = cont.clientWidth; rend.setSize(W, h); cam.aspect = W / h; cam.updateProjectionMatrix(); }).observe(cont);
}
function agregarNodo(d) {
  if (!grupo) return;
  // Punto aleatorio sobre una esfera
  const u = Math.random() * 2 - 1, t = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u), R = 2.4;
  const pos = new THREE.Vector3(R * s * Math.cos(t), R * u, R * s * Math.sin(t));
  const m = new THREE.Mesh(new THREE.SphereGeometry(.11, 16, 16), new THREE.MeshBasicMaterial({ color: META[d].color }));
  m.position.copy(pos); grupo.add(m);
  if (nodos.length) { // Enlace con un nodo existente
    const o = nodos[Math.floor(Math.random() * nodos.length)];
    grupo.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([pos, o]), new THREE.LineBasicMaterial({ color: 0xf7f9fa, transparent: true, opacity: .25 })));
  }
  nodos.push(pos);
}

/* ---------- 9. Chat y WebSocket simulado ---------- */
// Reemplaza esta clase por: new WebSocket('wss://tu-servidor') cuando exista backend.
class SocketSimulado {
  constructor() { this.h = {}; this.t = null; }
  on(e, f) { (this.h[e] ||= []).push(f); return this; }
  emit(e, d) { (this.h[e] || []).forEach(f => f(d)); }
  conectar() {
    setTimeout(() => {
      this.emit('open');
      const usuarios = ['Hipatia', 'Sócrates', 'Curie', 'Frida'];
      const frases = ['¿Alguien domina la casilla de Arte?', 'Ese desafío de Física era durísimo.', 'Propongo un torneo de Filosofía.', 'La Historia siempre decide la partida.'];
      this.t = setInterval(() => {
        const r = Math.random();
        if (r < .6) this.emit('mensaje', { autor: usuarios[Math.floor(Math.random() * 4)], texto: frases[Math.floor(Math.random() * 4)] });
        else this.emit('presencia', { n: 20 + Math.floor(Math.random() * 30) });
      }, 5000);
    }, 600);
  }
  desconectar() { clearInterval(this.t); this.emit('close'); }
  enviar(texto) { setTimeout(() => this.emit('mensaje', { autor: 'Sócrates', texto: '¿Y qué entiendes tú por «' + texto.slice(0, 30) + '»?' }), 1200); }
}

const ws = new SocketSimulado();
let conectado = false;
function chat(autor, texto, clase = '') {
  const log = $('#chat-log'), d = document.createElement('div');
  d.className = 'msg ' + clase;
  if (autor) { const b = document.createElement('b'); b.textContent = autor; d.appendChild(b); }
  d.appendChild(document.createTextNode(texto)); // textContent evita inyección de HTML
  log.appendChild(d); log.scrollTop = log.scrollHeight;
}
const sistema = (t) => chat('', t, 'sys');

ws.on('open', () => { conectado = true; $('#ws-punto').classList.add('on'); $('#ws-estado').textContent = 'Conectado'; $('#ws-btn').textContent = 'Desconectar'; sistema('Conexión WebSocket (simulada) establecida.'); })
  .on('close', () => { conectado = false; $('#ws-punto').classList.remove('on'); $('#ws-estado').textContent = 'Desconectado'; $('#ws-btn').textContent = 'Conectar'; sistema('Conexión cerrada.'); })
  .on('mensaje', (m) => chat(m.autor, m.texto))
  .on('presencia', (p) => { $('#ws-estado').textContent = `Conectado · ${p.n} en línea`; });

$('#ws-btn').onclick = () => conectado ? ws.desconectar() : ws.conectar();
$('#reset-btn').onclick = nuevaPartida;
$('#chat-form').onsubmit = (e) => {
  e.preventDefault();
  const i = $('#chat-input'), t = i.value.trim(); if (!t) return;
  chat('Tú', t, 'yo'); i.value = '';
  if (conectado) ws.enviar(t); else sistema('Conéctate para recibir respuestas.');
};

/* ---------- 10. Arranque ---------- */
iniciarGrafo();
nuevaPartida();
