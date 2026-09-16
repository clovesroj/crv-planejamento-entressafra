/**
 * Glow interativo nos cards (.kpi e .hero) — segue o cursor, some ao sair.
 * Só efeito colateral: nenhum símbolo é importado daqui.
 *
 * Delegado em document, não por card: as seções são repintadas via innerHTML
 * a cada recálculo (pintarPainel etc. em ui/*.js), então um listener preso a
 * um card específico seria perdido a cada tecla digitada. Delegar resolve
 * isso de graça — não precisa reanexar nada depois de repintar.
 *
 * Desliga sozinho em touch (sem hover real) e quando o usuário pediu menos
 * movimento — mesmo padrão que responsivo.css já respeita no resto do app.
 */
const podeAnimar = matchMedia("(hover:hover) and (pointer:fine)").matches
  && !matchMedia("(prefers-reduced-motion:reduce)").matches;

if (podeAnimar) {
  let atual = null, pend = false, ultimoEvento = null;

  const resetar = card => {
    card.style.setProperty("--glow-o", "0");
    if (card.classList.contains("kpi")) card.style.transform = "";
  };

  const atualizar = () => {
    pend = false;
    const e = ultimoEvento;
    if (!e) return;
    const card = e.target.closest(".kpi, .hero");
    if (card !== atual) { if (atual) resetar(atual); atual = card; }
    if (!card) return;

    const r = card.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    card.style.setProperty("--glow-x", (x / r.width * 100) + "%");
    card.style.setProperty("--glow-y", (y / r.height * 100) + "%");
    card.style.setProperty("--glow-o", "1");

    if (card.classList.contains("kpi")) {
      const cx = r.width / 2, cy = r.height / 2;
      const rotY = ((x - cx) / cx) * 4, rotX = -((y - cy) / cy) * 4;
      const mx = (x - cx) * 0.04, my = (y - cy) * 0.04;
      card.style.transform =
        `perspective(700px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translate3d(${mx.toFixed(1)}px, ${my.toFixed(1)}px, 0)`;
    }
  };

  document.addEventListener("pointermove", e => {
    ultimoEvento = e;
    if (!pend) { pend = true; requestAnimationFrame(atualizar); }
  });
  document.addEventListener("pointerleave", () => { if (atual) { resetar(atual); atual = null; } });
}
