import { listarSemanas, planilhaDaSemana, postosDaSemana, postosDe, precoDe } from '../io/anp.js';
import { $, brl, esc } from '../nucleo/formato.js';
import { kpi, ligarBuscaSelect } from './componentes.js';

/* ---------- REFERÊNCIA DE MERCADO (ANP), NA ABA COMBUSTÍVEL ----------
   Consulta livre, não é dado do plano: não entra em estado(), não salva, não
   participa de nenhum cálculo — só leitura de referência. Por isso vive fora
   do ciclo pintar()/render() do resto do app, carregada sob demanda no
   primeiro clique na aba Combustível (não no arranque — só quem for olhar
   isso paga o custo da busca). */
let semanas = [];
let municipiosAtual = [];
let carregado = false;

const fmtDia = iso => { const [, m, d] = iso.match(/(\d{4})-(\d{2})-(\d{2})/); return `${d}/${m}`; };
const rotuloSemana = s => `${fmtDia(s.inicio)} a ${fmtDia(s.fim)}`;

/** Só atualiza o detalhe por posto se ele já estiver aberto — não busca à toa. */
async function renderPostos(){
  const cont = $("#anp_postos");
  if(!cont || cont.hidden) return;
  const semUrl = $("#sel_anp_semana").value, mun = $("#sel_anp_mun").value, prod = $("#sel_anp_prod").value;
  if(!mun || !semUrl){ cont.innerHTML = ""; return; }
  cont.innerHTML = `<div class="hint">Buscando postos...</div>`;
  try{
    const linhas = await postosDaSemana(semUrl);
    const postos = postosDe(linhas, mun, prod);
    if(!postos.length){
      cont.innerHTML = `<div class="hint">A planilha detalhada não tem posto dessa combinação — o resumo
        semanal às vezes agrega postos que o detalhe não abre um a um.</div>`;
      return;
    }
    cont.innerHTML = `<div class="tblwrap" style="margin-top:10px"><table>
      <thead><tr><th>Posto</th><th>Bandeira</th><th>Endereço</th><th class="num">Preço</th><th>Coleta</th></tr></thead>
      <tbody>${postos.map(p=>{
        const endereco = [p.endereco, p.numero, p.bairro].filter(Boolean).join(", ");
        return `<tr><td>${esc(p.fantasia || p.razao)}</td><td class="calc">${esc(p.bandeira || "—")}</td>
          <td class="calc">${esc(endereco)}</td><td class="num tot">${brl(p.preco, 2)}</td>
          <td class="calc">${p.coleta ? p.coleta.toLocaleDateString("pt-BR") : "—"}</td></tr>`;
      }).join("")}</tbody></table></div>`;
  }catch(e){
    cont.innerHTML = `<div class="hint" style="color:var(--bad)">${e.message}</div>`;
  }
}

/** Clique em qualquer cartão do resultado abre/fecha a lista de postos por trás do número. */
function alternarPostos(){
  const cont = $("#anp_postos");
  if(!cont) return;
  cont.hidden = !cont.hidden;
  if(!cont.hidden) renderPostos();
}

async function atualizarResultado(){
  const semUrl = $("#sel_anp_semana").value, mun = $("#sel_anp_mun").value, prod = $("#sel_anp_prod").value;
  const alvo = $("#anp_resultado");
  if(!alvo) return;
  if(!mun || !semUrl){ alvo.innerHTML = ""; $("#anp_postos").hidden = true; return; }
  alvo.innerHTML = `<div class="hint">Buscando...</div>`;
  try{
    const { linhas } = await planilhaDaSemana(semUrl);
    const l = precoDe(linhas, mun, prod);
    if(!l){
      alvo.innerHTML = `<div class="hint">Sem pesquisa desse combustível em ${esc(mun)} nesta semana — tente
        outro combustível, município ou semana.</div>`;
      $("#anp_postos").hidden = true;
      return;
    }
    alvo.innerHTML = `<div class="grid g4">` +
      kpi("Preço médio", "", brl(l.medio, 2), `${l.postos} posto${l.postos>1?"s":""} pesquisado${l.postos>1?"s":""}`) +
      kpi("Mínimo", "t", brl(l.min, 2)) +
      kpi("Máximo", "a", brl(l.max, 2)) +
      `</div>`;
    await renderPostos();   // se o detalhe ja estava aberto, atualiza pro novo filtro
  }catch(e){
    alvo.innerHTML = `<div class="hint" style="color:var(--bad)">${e.message}</div>`;
  }
}

async function trocarSemana(){
  const url = $("#sel_anp_semana").value;
  const s = semanas.find(x=>x.url===url);
  const alvo = $("#anp_resultado");
  if(!s) return;
  alvo.innerHTML = `<div class="hint">Carregando municípios da semana ${rotuloSemana(s)}...</div>`;
  try{
    const { municipios } = await planilhaDaSemana(url);
    municipiosAtual = municipios;
    const atual = $("#sel_anp_mun").value;
    if(!atual || !municipios.includes(atual)){
      const padrao = municipios.includes("ITUIUTABA") ? "ITUIUTABA" : municipios[0];
      if(padrao) buscaMun.definir(padrao);
    }
    await atualizarResultado();
  }catch(e){
    alvo.innerHTML = `<div class="hint" style="color:var(--bad)">${e.message}</div>`;
  }
}

const buscaMun = ligarBuscaSelect("#busca_anp_mun", "#lista_anp_mun", "#sel_anp_mun",
  () => municipiosAtual, m => m);

/** Busca a lista de semanas uma vez (no primeiro clique na aba) e monta o select. */
async function carregarUmaVez(){
  if(carregado) return;
  carregado = true;
  $("#anp_resultado").innerHTML = `<div class="hint">Carregando semanas pesquisadas pela ANP...</div>`;
  try{
    semanas = await listarSemanas();
    $("#sel_anp_semana").innerHTML = semanas.map(s=>`<option value="${s.url}">${rotuloSemana(s)}</option>`).join("");
    await trocarSemana();
  }catch(e){
    $("#anp_resultado").innerHTML = `<div class="hint" style="color:var(--bad)">${e.message}</div>`;
    carregado = false;   // deixa tentar de novo no proximo clique na aba
  }
}

document.querySelector('nav button[data-s="combust"]')?.addEventListener("click", carregarUmaVez);
$("#sel_anp_semana")?.addEventListener("change", trocarSemana);
$("#sel_anp_mun")?.addEventListener("change", atualizarResultado);
$("#sel_anp_prod")?.addEventListener("change", atualizarResultado);
$("#anp_resultado")?.addEventListener("click", e=>{ if(e.target.closest(".kpi")) alternarPostos(); });

export {};
