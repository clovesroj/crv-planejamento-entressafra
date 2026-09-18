import { calcularCompleto } from '../app/ciclo.js';
import { LOGO } from '../dados/logo.js';
import { $, esc } from '../nucleo/formato.js';
import { ligarBuscaSelect } from '../ui/componentes.js';
import { RELATORIOS, montarSecoes } from './secoes.js';
import { baixar } from './arquivo.js';

/* ---------- RELATÓRIOS (PDF / EXCEL / CSV) ----------
   As seções vêm de io/secoes.js; aqui só se escolhe o relatório, o nível e o
   formato. O Excel escreve uma aba por seção — no relatório anual a ordem é a
   das 20 abas padronizadas. O PDF empilha as mesmas tabelas em uma página, e o
   CSV concatena as seções em um arquivo único, separadas por título. */

const relDe = id => RELATORIOS.find(r=>r.id===id) || RELATORIOS[0];
const nivelAtual = () => ($("#sel_report_nivel")||{value:"resumido"}).value;
const relAtual = () => ($("#sel_report_rel")||{value:"anual"}).value;

// nome de arquivo sem acento nem espaço, que atravessa qualquer sistema
const slug = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g,"")
  .replace(/[^A-Za-z0-9]+/g,"_").replace(/^_|_$/g,"").toLowerCase();

function relatorioSecoes(R, nivel, relId){
  return montarSecoes(R || calcularCompleto(), relId || "anual", nivel);
}

/* ---------- Excel ---------- */
async function gerarExcel(nivel, relId){
  if(typeof XLSX==="undefined"){ alert("A biblioteca de planilha não carregou. Verifique a conexão e tente novamente."); return; }
  const rel = relDe(relId);
  const secoes = montarSecoes(calcularCompleto(), rel.id, nivel);
  const wb = XLSX.utils.book_new();
  const usados = new Set();
  secoes.forEach(s=>{
    let nome = s.aba.slice(0,31), n=2;
    while(usados.has(nome)){ nome = s.aba.slice(0,28)+" "+n; n++; }
    usados.add(nome);
    const corpo = s.linhas.length ? s.linhas : [["Sem dados lançados."]];
    const ws = XLSX.utils.aoa_to_sheet([[s.titulo],[],s.cab, ...corpo]);
    ws["!cols"] = s.cab.map((c,i)=>({wch: Math.min(42, Math.max(10, String(c).length+2,
      ...corpo.slice(0,80).map(l=>String(l[i]==null?"":l[i]).length+2)))}));
    XLSX.utils.book_append_sheet(wb, ws, nome);
  });
  const out = XLSX.write(wb,{bookType:"xlsx",type:"array"});
  await baixar(out, `${slug(rel.nome)}_${nivel}.xlsx`,
               "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}

/* ---------- CSV ----------
   Ponto e vírgula e BOM: é o que o Excel em português abre sem pedir
   importação, e os valores em R$ já vêm com vírgula decimal. */
async function gerarCSV(nivel, relId){
  const rel = relDe(relId);
  const secoes = montarSecoes(calcularCompleto(), rel.id, nivel);
  const cel = v => { const t = String(v==null?"":v);
    return /[;"\n]/.test(t) ? '"'+t.replace(/"/g,'""')+'"' : t; };
  const linha = l => l.map(cel).join(";");
  const partes = [linha(["CRV Industrial — "+rel.nome]),
                  linha(["Safra 2026/2027 · Unidade Capinópolis-MG · "+
                         (nivel==="detalhado"?"detalhado":"resumido")+" · gerado em "+
                         new Date().toLocaleDateString("pt-BR")])];
  secoes.forEach(s=>{
    partes.push("", linha([s.titulo]), linha(s.cab));
    if(s.linhas.length) s.linhas.forEach(l=>partes.push(linha(l)));
    else partes.push(linha(["Sem dados lançados."]));
  });
  await baixar("﻿"+partes.join("\r\n"), `${slug(rel.nome)}_${nivel}.csv`,
               "text/csv;charset=utf-8");
}

/* ---------- HTML do relatório (compartilhado entre PDF e pré-visualização) ----------
   O mesmo marcado vira página impressa (#print_report, estilizado só em
   @media print) ou modal na tela (#prev_rel) — o conteúdo é idêntico, só o
   destino muda, então não faz sentido montar duas vezes. */
function montarHtmlRelatorio(nivel, relId){
  const rel = relDe(relId);
  const secoes = montarSecoes(calcularCompleto(), rel.id, nivel);
  // papel branco: logo azul original
  let html = `<img class="rel-logo" src="${LOGO}" alt="CRV Industrial">
    <h1>CRV Industrial — ${esc(rel.nome)}</h1>
    <p>Safra 2026/2027 · Unidade Capinópolis-MG · Relatório ${nivel==="detalhado"?"detalhado":"resumido"} ·
    gerado em ${new Date().toLocaleDateString("pt-BR")}</p>`;
  // as células são texto puro (as mesmas vão para o Excel); nome de insumo com
  // aspa ou < virava marcação no relatório impresso — esc() em tudo que é dado
  secoes.forEach(s=>{
    html += `<h2>${esc(s.titulo)}</h2><table><thead><tr>${s.cab.map(c=>`<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>`+
      (s.linhas.length? s.linhas.map(l=>`<tr>${l.map(c=>`<td>${esc(c)}</td>`).join("")}</tr>`).join("")
        : `<tr><td colspan="${s.cab.length}">Sem dados lançados.</td></tr>`)+
      `</tbody></table>`;
  });
  return html;
}

/* ---------- PDF ---------- */
function gerarPDF(nivel, relId){
  $("#print_report").innerHTML = montarHtmlRelatorio(nivel, relId);
  setTimeout(()=>window.print(),80);
}

/* ---------- pré-visualização ----------
   Mesmo idioma visual do modal de rastro (blur + cartão central), só que mais
   largo — tabela de relatório tem muita coluna. Antes de baixar PDF/Excel/CSV,
   dá pra conferir se o relatório certo, com o nível certo, tem o que se espera. */
function fecharPreview(){
  const p = $("#prev_rel"), f = $("#prev_rel_fundo");
  if(p) p.hidden = true;
  if(f) f.hidden = true;
}
function abrirPreview(nivel, relId){
  const p = $("#prev_rel"), f = $("#prev_rel_fundo");
  if(!p || !f) return;
  p.innerHTML = `
    <div class="ra-modal prev-modal pop-in">
      <div class="ra-topo">
        <div class="ra-nav">
          <div class="ra-tit" style="font-size:16px">Pré-visualização</div>
          <button class="ghost-btn" id="prev_rel_fechar" title="Fechar" aria-label="Fechar">✕</button>
        </div>
      </div>
      <div class="ra-corpo prev-corpo">${montarHtmlRelatorio(nivel, relId)}</div>
    </div>`;
  p.hidden = false;
  f.hidden = false;
}
document.addEventListener("click", e=>{
  if(e.target.id==="prev_rel_fechar" || e.target.id==="prev_rel_fundo") fecharPreview();
});
document.addEventListener("keydown", e=>{
  if(e.key==="Escape" && $("#prev_rel") && !$("#prev_rel").hidden) fecharPreview();
});

/* ---------- painel de gerar relatório ----------
   Era um dropdown ancorado no botão da barra superior; sem aquele botão (o
   único atalho agora é o do menu lateral), virou modal central com blur —
   mesmo idioma do rastro/pré-visualização. */
let rpAberto = false;   // controla a animação de entrada: só toca ao abrir
function fecharReportPop(){
  const p = $("#report_pop"), f = $("#report_pop_fundo");
  if(p) p.hidden = true;
  if(f) f.hidden = true;
  rpAberto = false;
}
function abrirReportPop(){
  const p = $("#report_pop"), f = $("#report_pop_fundo"), modal = $("#rp_modal");
  if(!p || !f) return;
  p.hidden = false;
  f.hidden = false;
  if(!rpAberto && modal){
    modal.classList.remove("pop-in"); void modal.offsetWidth;
    modal.classList.add("pop-in");
  }
  rpAberto = true;
}
document.addEventListener("click", e=>{
  if(e.target.id==="report_pop_fechar" || e.target.id==="report_pop_fundo") fecharReportPop();
});
document.addEventListener("keydown", e=>{
  if(e.key==="Escape" && $("#report_pop") && !$("#report_pop").hidden) fecharReportPop();
});

/* ---------- controles ---------- */
// 21 relatorios num <select> nativo tambem era lista sem busca pra rolar --
// mesmo combobox pesquisavel do resto do app (ver ui/componentes.js).
const buscaRel = ligarBuscaSelect("#busca_report_rel", "#lista_report_rel", "#sel_report_rel",
  () => RELATORIOS, r => r.nome, r => r.id);
if(buscaRel) buscaRel.definir(RELATORIOS[0].id);   // mesmo padrao do <select> nativo: 1ª opção

/* ---------- atalho no menu lateral ----------
   Mesmo idioma visual da sub-navegacao do Dimensionamento (pasta que abre pros
   itens de dentro — ver ui/navegacao.js): o botao "Relatório" desce a lista dos
   relatorios, e escolher um ja deixa selecionado no painel de gerar. É o único
   ponto de entrada — não existe mais botão de relatório na barra superior. */
const navRel = $("#nav_relatorio");
if(navRel){
  navRel.classList.add("tem-sub");
  navRel.insertAdjacentHTML("beforeend",
    `<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>`);
  navRel.setAttribute("aria-expanded","false");

  const sub = document.createElement("div");
  sub.className = "subnav"; sub.inert = true;   // fechado: fora do layout de Tab, mas anima (não é [hidden])
  sub.innerHTML = `<div class="subnav-in">${RELATORIOS.map(r=>`<button type="button">${esc(r.nome)}</button>`).join("")}</div>`;
  navRel.insertAdjacentElement("afterend", sub);

  [...sub.querySelectorAll("button")].forEach((item,i)=>{
    item.onclick = e=>{
      e.stopPropagation();   // nao deixa isto contar como "clique fora" e fechar o popup que acabou de abrir
      if(buscaRel) buscaRel.definir(RELATORIOS[i].id);
      abrirReportPop();
      document.body.classList.remove("menu-open");
    };
  });

  // clique no botao-pai so abre/fecha a listinha — quem escolhe um relatorio e o sub-item
  navRel.addEventListener("click", ()=>{
    const abrindo = !sub.classList.contains("aberto");
    sub.classList.toggle("aberto", abrindo);
    sub.inert = !abrindo;
    navRel.setAttribute("aria-expanded", String(abrindo));
  });
}
const fechaEGera = fn => ()=>{ fecharReportPop(); fn(nivelAtual(), relAtual()); };
$("#btn_report_pdf").onclick  = fechaEGera(gerarPDF);
$("#btn_report_xlsx").onclick = fechaEGera(gerarExcel);
if($("#btn_report_csv")) $("#btn_report_csv").onclick = fechaEGera(gerarCSV);
if($("#btn_report_preview")) $("#btn_report_preview").onclick = fechaEGera(abrirPreview);


export { gerarCSV, gerarExcel, gerarPDF, relatorioSecoes };
