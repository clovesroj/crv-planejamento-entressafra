import { $ } from '../nucleo/formato.js';

/* ---------- navegação ---------- */
document.querySelectorAll("nav button").forEach(b=>{
  b.onclick=()=>{
    document.querySelectorAll("nav button").forEach(x=>x.classList.remove("on"));
    document.querySelectorAll("section").forEach(x=>x.classList.remove("on"));
    b.classList.add("on"); $("#"+b.dataset.s).classList.add("on");
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
