import { P } from '../nucleo/estado.js';
import { $, brl, esc, fmt } from '../nucleo/formato.js';
import { buscarCidades, climaAtual, descricaoCodigo, iconeCodigo } from '../io/clima.js';
import { listarSemanas, planilhaDaSemana, precoDe } from '../io/anp.js';
import { USUARIO } from '../nucleo/sessao.js';
import { kpi } from './componentes.js';
import { validar } from './validacao.js';

/* ---------- CAPA ---------- */
function pintarCapa(R){
  const prog=R.L.filter(r=>r.total>0).length, bad=validar(R).filter(v=>!v.ok).length;
  $("#k_capa").innerHTML =
    kpi("Custo total projetado","",brl(R.SEL.total), R.SEL.parcial?R.SEL.rotulo:"","total") +
    kpi("Custo por ha plantado","t",brl(R.SEL.total/(P.plantio||1)), R.SEL.parcial?R.SEL.rotulo:"","total") +
    kpi("Hectares operados","g",fmt(R.haOp)+" ha","","hect:total") +
    kpi("Efetivo total","a",fmt(R.efetivoTotal||0)+" pessoas","","pessoas:total");
  $("#capa_status").innerHTML = `
    <div class="statusrow">
      <span class="badge ${bad?'b-bad':'b-ok'}">${bad?bad+" pendência(s)":"Sem pendências"}</span>
      <span class="calc">${prog} de ${R.L.length} atividades programadas</span>
      <span class="calc">Frota: ${R.frotaT+R.TR.frota} equipamentos</span>
      <span class="calc">Insumos: ${brl(R.insumoT)}</span>
    </div>
    <div class="bar" style="margin-top:12px"><i style="width:${prog/R.L.length*100}%"></i></div>`;
  iniciarHeroCapa();
}

/* ---------- CARTÃO DE CLIMA ----------
   Não é dado do plano, é referência de leitura: não entra em estado(), não
   participa de nenhum cálculo. A cidade escolhida é preferência de quem está
   olhando (mesmo padrão de `chaveOrdem` em componentes.js) — fica só no
   navegador, por login, nunca no documento compartilhado (invariante nº7). */
const CIDADE_PADRAO = { nome: "Capinópolis", uf: "Minas Gerais", pais: "Brasil", lat: -18.6875, lon: -49.5721 };
const chaveCidade = () => `crv_clima_cidade:${(USUARIO && USUARIO.login) || "anon"}`;
function cidadeSalva(){
  try{ const raw = localStorage.getItem(chaveCidade()); return raw ? JSON.parse(raw) : CIDADE_PADRAO; }
  catch(e){ return CIDADE_PADRAO; }
}
function salvarCidade(c){ try{ localStorage.setItem(chaveCidade(), JSON.stringify(c)); }catch(e){} }

/** Mini-gráfico de linha (SVG) de uma série curta, com um ponto marcando o valor mais recente. */
function svgMini(serie){
  if(!serie || serie.length<2) return "";
  const W=64,H=22, vals=serie.map(p=>p.v);
  const min=Math.min(...vals), max=Math.max(...vals, min+1);
  const pts = serie.map((p,i)=>{
    const x=i/(serie.length-1)*W, y=H-((p.v-min)/(max-min))*H*.82-2;
    return [x,y];
  });
  const linha = pts.map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [dx,dy] = pts[0];
  return `<svg viewBox="0 0 ${W} ${H}" class="mini-linha"><polyline points="${linha}"/><circle cx="${dx}" cy="${dy}" r="2.3"/></svg>`;
}
const rotuloHora = iso => new Date(iso).getHours().toString().padStart(2,"0")+"h";
function linhaMetrica(rotulo, agora, un, serie){
  return `<div class="clima-linha">
    <div class="clima-linha-topo"><span>${rotulo}</span><b>${agora}${un}</b></div>
    ${svgMini(serie)}
    <div class="clima-linha-horas">${(serie||[]).map(p=>`<span>${rotuloHora(p.hora)}</span>`).join("")}</div>
  </div>`;
}
function pintarClima(nome, d){
  const alvo = $("#clima_corpo");
  if(!alvo) return;
  alvo.innerHTML = `
    <div class="clima-cidade">${esc(nome)}</div>
    <div class="clima-principal">
      <div class="clima-temp">${Math.round(d.temp)}°C</div>
      <div class="clima-icone">${iconeCodigo(d.codigo)}</div>
    </div>
    <div class="clima-hl">H:${Math.round(d.max)}° &nbsp; L:${Math.round(d.min)}°</div>
    <div class="clima-desc">${esc(descricaoCodigo(d.codigo))}</div>
    <div class="clima-metricas">
      ${linhaMetrica("Vento", fmt(d.vento,0), " km/h", d.ventoSerie)}
      ${linhaMetrica("Chuva", fmt(d.chuvaSerie[0]?.v ?? 0,0), "%", d.chuvaSerie)}
      ${linhaMetrica("Umidade", fmt(d.umidade,0), "%", d.umidadeSerie)}
    </div>`;
}
async function carregarClima(c){
  const alvo = $("#clima_corpo");
  if(!alvo) return;
  alvo.innerHTML = `<div class="hint">Carregando clima de ${esc(c.nome)}...</div>`;
  try{
    const d = await climaAtual(c.lat, c.lon);
    pintarClima(c.uf ? `${c.nome}, ${c.uf}` : c.nome, d);
  }catch(e){
    alvo.innerHTML = `<div class="hint" style="color:var(--bad)">Clima indisponível agora.</div>`;
  }
}

let resultadosCidade = [], buscaTimer = null;
function fecharListaCidade(){ const l=$("#lista_clima_cidade"); if(l) l.hidden = true; }
function pintarListaCidade(itens){
  const lista = $("#lista_clima_cidade");
  if(!lista) return;
  lista.innerHTML = itens.length
    ? itens.map((c,ix)=>`<div class="lista-select-item" data-ix="${ix}">${esc(c.nome)}${c.uf?", "+esc(c.uf):""}${c.pais && c.pais!=="Brasil"?" — "+esc(c.pais):""}</div>`).join("")
    : `<div class="lista-select-vazia">Nada encontrado</div>`;
  lista.hidden = false;
}
function escolherCidade(c){
  const busca = $("#busca_clima_cidade");
  if(busca) busca.value = "";
  fecharListaCidade();
  salvarCidade(c);
  carregarClima(c);
}
$("#busca_clima_cidade")?.addEventListener("input", e=>{
  clearTimeout(buscaTimer);
  const termo = e.target.value;
  buscaTimer = setTimeout(async ()=>{
    resultadosCidade = await buscarCidades(termo).catch(()=>[]);
    pintarListaCidade(resultadosCidade);
  }, 350);
});
$("#busca_clima_cidade")?.addEventListener("blur", ()=>setTimeout(fecharListaCidade,150));
$("#lista_clima_cidade")?.addEventListener("mousedown", e=>{
  const item = e.target.closest(".lista-select-item");
  if(!item) return;
  const c = resultadosCidade[+item.dataset.ix];
  if(c) escolherCidade(c);
});

/* ---------- CARTÃO DE DIESEL ----------
   Mesma fonte (ANP) e mesma referência padrão (Ituiutaba, S10) já usadas na
   aba Combustível — aqui só o resumo, com a variação frente à semana
   anterior; o clique leva pro detalhe completo por posto. */
function pintarDiesel(l, variacao){
  const alvo = $("#card_diesel_corpo");
  if(!alvo) return;
  if(!l){ alvo.innerHTML = `<div class="hint">Sem pesquisa recente da ANP para esta referência.</div>`; return; }
  const sobe = variacao!=null && variacao>0.05, desce = variacao!=null && variacao<-0.05;
  const seta = sobe?"▲":desce?"▼":"•";
  const cor = sobe?"var(--bad)":desce?"var(--ok)":"var(--grey)";
  alvo.innerHTML = `
    <div class="clima-cidade">Diesel S10 — Ituiutaba, MG</div>
    <div class="clima-principal"><div class="clima-temp diesel-preco">${brl(l.medio,2)}</div></div>
    <div class="clima-desc" style="color:${cor}">${seta} ${variacao!=null?fmt(Math.abs(variacao),1)+"% vs. semana anterior":"sem semana anterior pra comparar"}</div>
    <div class="clima-hl">${l.postos} posto${l.postos>1?"s":""} pesquisado${l.postos>1?"s":""} · mín. ${brl(l.min,2)} · máx. ${brl(l.max,2)}</div>`;
}
async function carregarDiesel(){
  const alvo = $("#card_diesel_corpo");
  if(!alvo) return;
  try{
    const semanas = await listarSemanas();
    if(!semanas.length){ alvo.innerHTML = `<div class="hint">Sem semana pesquisada pela ANP no momento.</div>`; return; }
    const { linhas } = await planilhaDaSemana(semanas[0].url);
    const lAtual = precoDe(linhas, "ITUIUTABA", "OLEO DIESEL S10");
    let variacao = null;
    if(semanas[1]){
      const anterior = await planilhaDaSemana(semanas[1].url);
      const lAnt = precoDe(anterior.linhas, "ITUIUTABA", "OLEO DIESEL S10");
      if(lAnt && lAtual) variacao = (lAtual.medio - lAnt.medio) / lAnt.medio * 100;
    }
    pintarDiesel(lAtual, variacao);
  }catch(e){
    alvo.innerHTML = `<div class="hint" style="color:var(--bad)">Preço do diesel indisponível agora.</div>`;
  }
}
$("#card_diesel")?.addEventListener("click", ()=>{
  document.querySelector('nav button[data-s="combust"]')?.click();
});
$("#card_diesel")?.addEventListener("keydown", e=>{
  if(e.key==="Enter" || e.key===" "){ e.preventDefault(); $("#card_diesel").click(); }
});

/* Clima e diesel não dependem do plano (R): carregam uma vez, no primeiro
   render() pós-login, não a cada tecla digitada em qualquer aba. */
let heroIniciado = false;
function iniciarHeroCapa(){
  if(heroIniciado) return;
  heroIniciado = true;
  carregarClima(cidadeSalva());
  carregarDiesel();
}

export { pintarCapa };
