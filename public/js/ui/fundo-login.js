/**
 * Fundo animado da tela de login — grade de pontos que reage ao cursor.
 * Exclusivo desta tela: iniciar()/parar() ligam e desligam o loop, não roda
 * em segundo plano no resto do app.
 *
 * Adaptado do componente DotGrid (reactbits.dev) para canvas + JS vanilla:
 * em vez do InertiaPlugin do gsap, cada ponto integra um spring
 * massa-mola-amortecedor por frame (empurra e volta com leve exagero
 * elástico) — sem dependência nova, mesmo padrão do resto do app.
 *
 * Cores na paleta do app: ponto em repouso no verde escuro do gradiente do
 * .hero, esquentando para o dourado (#D6B46E) perto do cursor — o mesmo tom
 * já usado no marcador do menu e no eyebrow da Capa.
 */
const DOT = 3.4, GAP = 25;
const PROXIMIDADE = 130, RAIO_CHOQUE = 210, FORCA_CHOQUE = 480;
const RIGIDEZ = 170, AMORT = 15;          // spring: aceleração = -RIGIDEZ*offset - AMORT*vel
const BASE = { r: 45, g: 90, b: 58 };     // ~ #2D5A3A, verde do gradiente do hero
const ATIVO = { r: 214, g: 180, b: 110 }; // #D6B46E, dourado da marca

let canvas = null, ctx = null, wrapper = null, pontos = [], raf = null, ro = null;
let ultimoT = 0, ponteiro = { x: -9999, y: -9999 };
const reduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function montarGrade() {
  const { width, height } = wrapper.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr; canvas.height = height * dpr;
  canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
  ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cel = DOT + GAP;
  const cols = Math.floor((width + GAP) / cel), rows = Math.floor((height + GAP) / cel);
  const sobraX = width - (cel * cols - GAP), sobraY = height - (cel * rows - GAP);
  const x0 = sobraX / 2 + DOT / 2, y0 = sobraY / 2 + DOT / 2;
  pontos = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    pontos.push({ cx: x0 + i * cel, cy: y0 + j * cel, ox: 0, oy: 0, vx: 0, vy: 0 });
  }
}

function empurrar(px, py, raio, forca) {
  for (const p of pontos) {
    const dx = p.cx - px, dy = p.cy - py, d = Math.hypot(dx, dy);
    if (d >= raio || d < 0.01) continue;
    const queda = 1 - d / raio;
    p.vx += (dx / d) * forca * queda; p.vy += (dy / d) * forca * queda;
  }
}

function quadro(t) {
  const dt = Math.min((t - (ultimoT || t)) / 1000, 0.032);
  ultimoT = t;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const proxQ = PROXIMIDADE * PROXIMIDADE;

  for (const p of pontos) {
    // spring de volta ao repouso
    const ax = -RIGIDEZ * p.ox - AMORT * p.vx, ay = -RIGIDEZ * p.oy - AMORT * p.vy;
    p.vx += ax * dt; p.vy += ay * dt;
    p.ox += p.vx * dt; p.oy += p.vy * dt;

    const dx = p.cx - ponteiro.x, dy = p.cy - ponteiro.y, dq = dx * dx + dy * dy;
    let cor = `rgb(${BASE.r},${BASE.g},${BASE.b})`;
    if (dq <= proxQ) {
      const w = 1 - Math.sqrt(dq) / PROXIMIDADE;
      cor = `rgb(${Math.round(BASE.r + (ATIVO.r - BASE.r) * w)},` +
        `${Math.round(BASE.g + (ATIVO.g - BASE.g) * w)},${Math.round(BASE.b + (ATIVO.b - BASE.b) * w)})`;
    }
    ctx.fillStyle = cor;
    ctx.beginPath();
    ctx.arc(p.cx + p.ox, p.cy + p.oy, DOT / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  raf = requestAnimationFrame(quadro);
}

function desenhoEstatico() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = `rgb(${BASE.r},${BASE.g},${BASE.b})`;
  for (const p of pontos) { ctx.beginPath(); ctx.arc(p.cx, p.cy, DOT / 2, 0, Math.PI * 2); ctx.fill(); }
}

let onMove, onDown;
function iniciar(elCanvas) {
  canvas = elCanvas; wrapper = elCanvas.parentElement;
  montarGrade();
  ro = new ResizeObserver(montarGrade); ro.observe(wrapper);

  if (reduzido()) { desenhoEstatico(); return; }

  onMove = e => { const r = canvas.getBoundingClientRect(); ponteiro.x = e.clientX - r.left; ponteiro.y = e.clientY - r.top; };
  onDown = e => { const r = canvas.getBoundingClientRect(); empurrar(e.clientX - r.left, e.clientY - r.top, RAIO_CHOQUE, FORCA_CHOQUE); };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });
  ultimoT = 0;
  raf = requestAnimationFrame(quadro);
}

function parar() {
  if (raf) cancelAnimationFrame(raf);
  if (ro) ro.disconnect();
  if (onMove) window.removeEventListener('pointermove', onMove);
  if (onDown) window.removeEventListener('pointerdown', onDown);
  raf = ro = onMove = onDown = null; pontos = [];
}

export { iniciar, parar };
