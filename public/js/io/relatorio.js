import { calcularCompleto } from '../app/ciclo.js';
import { LOGO } from '../dados/logo.js';
import { $, esc } from '../nucleo/formato.js';
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

/* ---------- PDF ---------- */
function gerarPDF(nivel, relId){
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
  $("#print_report").innerHTML = html;
  setTimeout(()=>window.print(),80);
}

/* ---------- controles ---------- */
const selRel = $("#sel_report_rel");
if(selRel) selRel.innerHTML = RELATORIOS.map(r=>`<option value="${r.id}">${r.nome}</option>`).join("");

$("#btn_report").onclick=()=>{ $("#report_pop").hidden = !$("#report_pop").hidden; };
document.addEventListener("click",e=>{
  if(!e.target.closest(".reportbox")) $("#report_pop").hidden = true;
});
const fechaEGera = fn => ()=>{ $("#report_pop").hidden=true; fn(nivelAtual(), relAtual()); };
$("#btn_report_pdf").onclick  = fechaEGera(gerarPDF);
$("#btn_report_xlsx").onclick = fechaEGera(gerarExcel);
if($("#btn_report_csv")) $("#btn_report_csv").onclick = fechaEGera(gerarCSV);


export { gerarCSV, gerarExcel, gerarPDF, relatorioSecoes };
