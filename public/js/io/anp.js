/**
 * Referência de mercado de combustível (ANP) — busca pela nossa própria API
 * (server/anp.js guarda o cache e a descoberta dos links, que mudam toda
 * semana) e interpreta com o SheetJS que o relatório em Excel já carrega (ver
 * <script> no fim de index.html) — não duplica a biblioteca aqui.
 */
let semanasCache = null;               // [{inicio, fim, url, revendas}]
const dadosPorSemana = new Map();      // url -> {linhas, municipios}
const postosPorSemana = new Map();     // semana.url -> linhas (detalhe por posto)

// a aba "MUNICIPIOS" e a de detalhe por posto nomeiam o mesmo combustível
// diferente ("OLEO DIESEL S10" x "DIESEL S10") — sem isso o clique no cartão
// nunca acha posto nenhum
const PRODUTO_POSTOS = {
  "OLEO DIESEL S10": "DIESEL S10", "OLEO DIESEL": "DIESEL S500", "ETANOL HIDRATADO": "ETANOL",
};

// datas do Excel sao um numero serial (dias desde 1899-12-30)
function dataExcel(serial){
  return serial ? new Date(Math.round((serial - 25569) * 86400 * 1000)) : null;
}

/** [{inicio, fim, url}], mais recente primeiro. */
async function listarSemanas(){
  if(semanasCache) return semanasCache;
  const r = await fetch("/api/anp/semanas");
  const d = await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(d.erro || "não foi possível listar as semanas da ANP agora");
  semanasCache = d.semanas;
  return semanasCache;
}

/** {linhas, municipios} da planilha "MUNICIPIOS" de uma semana (url de listarSemanas(), ou a mais recente em branco). */
async function planilhaDaSemana(url){
  const chave = url || "";
  if(dadosPorSemana.has(chave)) return dadosPorSemana.get(chave);
  const qs = new URLSearchParams();
  if(url) qs.set("url", url);
  const r = await fetch("/api/anp/resumo-semanal?"+qs);
  if(!r.ok){
    const d = await r.json().catch(()=>({}));
    throw new Error(d.erro || "não foi possível buscar a referência da ANP agora");
  }
  const buf = await r.arrayBuffer();
  const wb = XLSX.read(buf, {type:"array"});
  const ws = wb.Sheets["MUNICIPIOS"];
  if(!ws) throw new Error("ANP: a planilha não tem a aba MUNICIPIOS esperada — o formato pode ter mudado");
  const linhas = XLSX.utils.sheet_to_json(ws, {header:1})
    .filter(l => l && l.length > 4 && l[3] && l[3] !== "MUNICÍPIO")
    .map(l => ({ estado: l[2], municipio: l[3], produto: l[4], postos: l[5], unidade: l[6],
                 medio: l[7], min: l[9], max: l[10] }));
  const municipios = [...new Set(linhas.map(l=>l.municipio))].sort();
  const dados = { linhas, municipios };
  dadosPorSemana.set(chave, dados);
  return dados;
}

/** A linha de um município+produto (dentro do {linhas} de uma semana), ou null se não pesquisado. */
function precoDe(linhas, municipio, produto){
  return linhas.find(l => l.municipio === municipio && l.produto === produto) || null;
}

/** Linhas cruas da aba "POSTOS REVENDEDORES" de uma semana (semana.url, a mesma de planilhaDaSemana). */
async function postosDaSemana(semanaUrl){
  if(postosPorSemana.has(semanaUrl)) return postosPorSemana.get(semanaUrl);
  const r = await fetch("/api/anp/postos?"+new URLSearchParams({semana: semanaUrl}));
  if(!r.ok){
    const d = await r.json().catch(()=>({}));
    throw new Error(d.erro || "não foi possível buscar os postos pesquisados agora");
  }
  const buf = await r.arrayBuffer();
  const wb = XLSX.read(buf, {type:"array"});
  const ws = wb.Sheets["POSTOS REVENDEDORES"];
  if(!ws) throw new Error("ANP: a planilha de postos não tem a aba esperada — o formato pode ter mudado");
  const json = XLSX.utils.sheet_to_json(ws, {header:1});
  const headerIx = json.findIndex(l => l && l.some(c => /RAZÃO/i.test(String(c))));
  const linhas = (headerIx < 0 ? [] : json.slice(headerIx + 1))
    .filter(l => l && l.length > 10 && l[8])
    .map(l => ({
      razao: l[1], fantasia: l[2], endereco: l[3], numero: l[4], bairro: l[6],
      municipio: l[8], bandeira: l[10], produto: l[11], preco: l[13], coleta: dataExcel(l[14]),
    }));
  postosPorSemana.set(semanaUrl, linhas);
  return linhas;
}

/** Postos de um município+produto (nomenclatura da aba MUNICIPIOS) nesta semana, do mais barato pro mais caro. */
function postosDe(linhas, municipio, produtoResumo){
  const produto = PRODUTO_POSTOS[produtoResumo] || produtoResumo;
  return linhas.filter(l => l.municipio === municipio && l.produto === produto)
    .sort((a, b) => a.preco - b.preco);
}

export { listarSemanas, planilhaDaSemana, postosDaSemana, postosDe, precoDe };
