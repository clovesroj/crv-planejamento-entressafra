import { $ } from '../nucleo/formato.js';

/* ---------- navegação ---------- */
// entrada em cascata dos cards da aba, tipo ícones de app abrindo — cada
// re-clique tem que disparar de novo, por isso remove e reaplica a classe
// (animação CSS só toca de novo se a classe for reanexada do zero)
const TETO_CASCATA = 8, PASSO_CASCATA = 45;
function cascatear(secao){
  const alvos = [];
  secao.querySelectorAll(".hero, .kpi, .panel, .tblwrap").forEach(el=>{
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
document.querySelectorAll("nav button").forEach(b=>{ b.onclick=()=>irPara(b); });

/* ---------- sub-navegação: blocos recolhíveis de uma aba viram itens do
   menu, tipo uma pasta abrindo pros arquivos de dentro. Genérico — qualquer
   aba com <details class="bloco" id="..."> como filho direto ganha isso
   sozinha (hoje só Dimensionamento; se outra aba adotar o mesmo padrão de
   blocos, o menu acompanha sem precisar cadastrar nada aqui). */
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

  [...sub.querySelectorAll("button")].forEach((item,i)=>{
    item.onclick = e=>{
      e.stopPropagation();               // não deixa isto tocar o toggle do botão-pai
      irPara(b);
      const alvo = blocos[i];
      alvo.open = true;
      alvo.scrollIntoView({behavior:"smooth", block:"start"});
    };
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
document.querySelectorAll("nav button").forEach(b=>b.addEventListener("click",()=>{
  marcarLocal(b); document.body.classList.remove("menu-open");
}));
$("#btn_menu").onclick = ()=>document.body.classList.toggle("menu-open");
$("#scrim").onclick = ()=>document.body.classList.remove("menu-open");
// alterna a partir do tema que está de fato na tela (inclusive quando vem do sistema)
$("#btn_tema_top").onclick = ()=>{
  const raiz = document.documentElement, atual = raiz.getAttribute("data-theme");
  const escuro = atual ? atual==="dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  raiz.setAttribute("data-theme", escuro ? "light" : "dark");
};


export { marcarLocal };
