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
document.querySelectorAll("nav button").forEach(b=>{
  b.onclick=()=>{
    document.querySelectorAll("nav button").forEach(x=>x.classList.remove("on"));
    document.querySelectorAll("section").forEach(x=>x.classList.remove("on"));
    b.classList.add("on");
    const secao = $("#"+b.dataset.s);
    secao.classList.add("on");
    cascatear(secao);
    window.scrollTo({top:0,behavior:"instant"});
  };
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
