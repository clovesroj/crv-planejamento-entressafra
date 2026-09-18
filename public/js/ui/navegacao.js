import { $ } from '../nucleo/formato.js';

/* ---------- navegação ---------- */
// entrada em cascata dos cards da aba, tipo ícones de app abrindo — cada
// re-clique tem que disparar de novo, por isso remove e reaplica a classe
// (animação CSS só toca de novo se a classe for reanexada do zero)
const TETO_CASCATA = 8, PASSO_CASCATA = 45;
function cascatear(secao){
  const alvos = [];
  secao.querySelectorAll(".hero, .kpi, .panel, .tblwrap").forEach(el=>{
    const blocoPai = el.closest("details.bloco");
    if (blocoPai && !blocoPai.open) return;   // bloco fechado (pagina que nao esta na tela): nao conta pro atraso da visivel
    if (alvos.some(a=>a.contains(el))) return;               // já cobre este elemento, evita zoom duplicado
    if (el.matches(".panel") && el.querySelector(".kpi")) return; // painel-grade de KPI: cada card anima, não o painel
    if (el.matches(".tblwrap") && el.closest(".panel")) return;   // tabela dentro de painel: o painel já anima
    alvos.push(el);
  });
  alvos.forEach((el,i)=>{
    el.classList.remove("pop-in"); void el.offsetWidth;
    el.style.animationDelay = Math.min(i,TETO_CASCATA)*PASSO_CASCATA+"ms";
    el.classList.add("pop-in");
  });
}
function irPara(b){
  document.querySelectorAll("nav button").forEach(x=>x.classList.remove("on"));
  document.querySelectorAll("section").forEach(x=>x.classList.remove("on"));
  b.classList.add("on");
  const secao = $("#"+b.dataset.s);
  secao.classList.add("on");
  cascatear(secao);
  window.scrollTo({top:0,behavior:"instant"});
}
// so os botoes de secao navegam — o de Relatorio (acao, nao secao) tem logica
// propria em io/relatorio.js, no mesmo idioma visual deste sub-menu
document.querySelectorAll("nav button[data-s]").forEach(b=>{ b.onclick=()=>irPara(b); });

/* ---------- sub-navegação: blocos de uma aba viram páginas de verdade, tipo
   abas de um app — só a página escolhida existe na tela, as outras somem por
   completo (não é acordeão: um bloco fora da página ativa nem aparece
   recolhido, [hidden] tira do layout). Antes todo bloco nascia aberto e o
   clique no menu só dava scroll até um bloco que já estava visível; depois só
   fechava os outros, mas o título deles continuava na tela. Genérico —
   qualquer aba com <details class="bloco" id=""> como filho direto ganha isso
   sozinha. */
document.querySelectorAll("nav button[data-s]").forEach(b=>{
  const secao = document.getElementById(b.dataset.s);
  const blocos = secao ? [...secao.querySelectorAll(":scope > details.bloco[id]")] : [];
  if(!blocos.length) return;

  b.classList.add("tem-sub");
  b.insertAdjacentHTML("beforeend",
    `<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>`);
  b.setAttribute("aria-expanded","false");

  const sub = document.createElement("div");
  sub.className = "subnav"; sub.inert = true;   // fechado: fora do layout de Tab, mas anima (não é [hidden])
  sub.innerHTML = `<div class="subnav-in">${blocos.map(bl=>{
    const tit = bl.querySelector(":scope > summary .bl-tit");
    return `<button type="button">${tit ? tit.textContent : bl.id}</button>`;
  }).join("")}</div>`;
  b.insertAdjacentElement("afterend", sub);
  const itens = [...sub.querySelectorAll("button")];

  function mostrar(i){
    blocos.forEach((bl,j)=>{
      const ativo = j===i;
      bl.open = ativo;      // so estilo (chevron, borda) — quem tira da tela e o hidden
      bl.hidden = !ativo;
    });
    itens.forEach((it,j)=>it.classList.toggle("on", j===i));
  }
  // estado inicial: o bloco que ja nasce com "open" no HTML e a primeira pagina
  mostrar(Math.max(0, blocos.findIndex(bl=>bl.open)));

  itens.forEach((item,i)=>{
    item.onclick = e=>{
      e.stopPropagation();               // não deixa isto tocar o toggle do botão-pai
      irPara(b);
      mostrar(i);
      marcarLocal(b);
      document.body.classList.remove("menu-open");   // no celular, escolher a página já fecha o menu
    };
  });
  // a pagina ativa e a unica visivel, entao o titulo dela continua clicavel
  // (accessibilidade/teclado) — mas fechar sozinha deixaria a tela em branco
  blocos.forEach(bl=>{
    bl.addEventListener("toggle", ()=>{ if(!bl.open && !bl.hidden) bl.open = true; });
  });

  // clique no botão-pai também abre/fecha a listinha, além de navegar —
  // é o "abrir a pasta" que foi pedido
  b.addEventListener("click", ()=>{
    const abrindo = !sub.classList.contains("aberto");
    sub.classList.toggle("aberto", abrindo);
    sub.inert = !abrindo;
    b.setAttribute("aria-expanded", String(abrindo));
  });
});
// a barra superior diz onde o usuário está; no celular o menu lateral fecha ao escolher a aba
function marcarLocal(b){
  const g = b.closest(".navgroup");
  $("#crumb_g").textContent = g ? g.dataset.g : "";
  $("#crumb_t").textContent = b.childNodes[0].textContent.trim();
}
document.querySelectorAll("nav button[data-s]").forEach(b=>b.addEventListener("click",()=>{
  marcarLocal(b); document.body.classList.remove("menu-open");
}));
/* Recolher o menu: devolve a largura da barra as tabelas. A preferencia fica no
   navegador de quem usa -- e escolha de tela, nao dado do plano, entao nao vai
   para o documento compartilhado. */
const APP = document.querySelector(".app");
function recolher(v){
  APP.classList.toggle("menu-recolhido", v);
  const b = $("#btn_recolher");
  if(b) b.setAttribute("aria-expanded", String(!v));
  try{ localStorage.setItem("crv_menu_recolhido", v ? "1" : "0"); }catch(e){}
}
try{ if(localStorage.getItem("crv_menu_recolhido")==="1") recolher(true); }catch(e){}
const btnRec = $("#btn_recolher");
if(btnRec) btnRec.onclick = ()=> recolher(!APP.classList.contains("menu-recolhido"));

// com o menu recolhido, o botao da barra superior volta a abri-lo no desktop
$("#btn_menu").onclick = ()=>{
  if(APP.classList.contains("menu-recolhido")){ recolher(false); return; }
  document.body.classList.toggle("menu-open");
};
$("#scrim").onclick = ()=>document.body.classList.remove("menu-open");
// alterna a partir do tema que está de fato na tela (inclusive quando vem do sistema)
$("#btn_tema_top").onclick = ()=>{
  const raiz = document.documentElement, atual = raiz.getAttribute("data-theme");
  const escuro = atual ? atual==="dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  raiz.setAttribute("data-theme", escuro ? "light" : "dark");
};


export { marcarLocal };
