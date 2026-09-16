const MESES = ["Out/26","Nov/26","Dez/26","Jan/27","Fev/27","Mar/27","Abr/27","Mai/27","Jun/27"];
const NM = MESES.length;
// calendário agrícola: safra de abril a novembro, entressafra de dezembro a março
const MES_NUM = {Jan:1,Fev:2,Mar:3,Abr:4,Mai:5,Jun:6,Jul:7,Ago:8,Set:9,Out:10,Nov:11,Dez:12};
const PERIODOS = {safra:"Safra (abr–nov)", entressafra:"Entressafra (dez–mar)"};
function periodoMes(i){ const m = MES_NUM[MESES[i].slice(0,3)] || 0; return (m>=4 && m<=11) ? "safra" : "entressafra"; }
function perTag(i){ const p = periodoMes(i); return `<span class="per per-${p}">${p==="safra"?"Safra":"Entressafra"}</span>`; }
const CAT_LBL = {mdo:"Mão de obra", manut:"Manutenção (CRM)", diesel:"Diesel", insumo:"Insumos + irrigação",
  terc:"Terceirização + transporte", arrend:"Arrendamento", fixo:"Fixos (adm./deprec.)", espor:"Esporádicos"};

export { CAT_LBL, MESES, MES_NUM, NM, PERIODOS, perTag, periodoMes };
