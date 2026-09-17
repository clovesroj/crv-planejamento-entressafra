// Ano agrícola de abril a março: os oito meses de safra seguidos dos quatro de entressafra.
const MESES = ["Abr/26","Mai/26","Jun/26","Jul/26","Ago/26","Set/26","Out/26","Nov/26",
               "Dez/26","Jan/27","Fev/27","Mar/27"];
const NM = MESES.length;
const MES_NUM = {Jan:1,Fev:2,Mar:3,Abr:4,Mai:5,Jun:6,Jul:7,Ago:8,Set:9,Out:10,Nov:11,Dez:12};

// Calendário agrícola, mês a mês:
//   safra       — abril, maio, junho, julho, agosto, setembro, outubro e novembro
//   entressafra — dezembro, janeiro, fevereiro e março
// A lista explícita vale para qualquer mês que entre no orçamento, não só os nove atuais.
const MESES_SAFRA = [4,5,6,7,8,9,10,11];
const MESES_ENTRESSAFRA = [12,1,2,3];
const PERIODO_MESES = {safra:"abril a novembro", entressafra:"dezembro a março"};
const PERIODOS = {safra:"Safra (abr a nov)", entressafra:"Entressafra (dez a mar)"};

function periodoMes(i){
  const m = MES_NUM[MESES[i].slice(0,3)] || 0;
  return MESES_SAFRA.includes(m) ? "safra" : "entressafra";
}
// Quantos meses do ano agrícola caem em cada período. Sai do próprio calendário
// para continuar certo se o horizonte do orçamento mudar de doze meses.
const NM_PER = MESES.reduce((a,_,i)=>{ a[periodoMes(i)]++; return a; }, {safra:0, entressafra:0});

/* Indice do mes do ano agricola em que uma data ISO cai; -1 fora do horizonte.
   O rotulo carrega mes e ano ("Abr/26"), entao da para casar sem tabela extra. */
function indiceDaData(iso){
  if(!iso) return -1;
  const d = new Date(iso + "T00:00:00");
  if(isNaN(d)) return -1;
  const m = d.getMonth() + 1, a = d.getFullYear() % 100;
  return MESES.findIndex(r => (MES_NUM[r.slice(0,3)]||0) === m && +r.slice(-2) === a);
}
/* Indices dos meses cobertos por uma janela de datas. Vazio quando a janela nao
   toca o horizonte do orcamento. */
function mesesEntre(ini, fim){
  const a = indiceDaData(ini), b = indiceDaData(fim);
  if(a < 0 || b < 0 || b < a) return [];
  return MESES.map((_,i)=>i).filter(i => i >= a && i <= b);
}

function perTag(i){ const p = periodoMes(i); return `<span class="per per-${p}">${p==="safra"?"Safra":"Entressafra"}</span>`; }

/* Classe de periodo de uma coluna de mes. E por ela que o filtro da barra
   superior esconde a coluna: o CSS casa .so-safra .mes-entressafra, e vice-versa.
   Cabecalho e celula precisam levar a mesma marca, senao a tabela desalinha. */
function clsMes(i){ return "mes-" + periodoMes(i); }

const CAT_LBL = {mdo:"Mão de obra", manut:"Manutenção (CRM)", diesel:"Diesel", insumo:"Insumos + irrigação",
  terc:"Terceirização + transporte", arrend:"Arrendamento", fixo:"Fixos (adm./deprec.)", espor:"Esporádicos"};

export { CAT_LBL, MESES, MESES_ENTRESSAFRA, MESES_SAFRA, MES_NUM, NM, NM_PER, PERIODOS, PERIODO_MESES,
         clsMes, indiceDaData, mesesEntre, perTag, periodoMes };
