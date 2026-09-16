const MESES = ["Out/26","Nov/26","Dez/26","Jan/27","Fev/27","Mar/27","Abr/27","Mai/27","Jun/27"];
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
function perTag(i){ const p = periodoMes(i); return `<span class="per per-${p}">${p==="safra"?"Safra":"Entressafra"}</span>`; }

const CAT_LBL = {mdo:"Mão de obra", manut:"Manutenção (CRM)", diesel:"Diesel", insumo:"Insumos + irrigação",
  terc:"Terceirização + transporte", arrend:"Arrendamento", fixo:"Fixos (adm./deprec.)", espor:"Esporádicos"};

export { CAT_LBL, MESES, MESES_ENTRESSAFRA, MESES_SAFRA, MES_NUM, NM, PERIODOS, PERIODO_MESES, perTag, periodoMes };
