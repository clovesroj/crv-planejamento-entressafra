/* ================== DE ONDE VEM CADA GRANDE CONTA ==================
   Abre cada grande conta (R.mesesCat) nas fontes que o motor somou nela, mês a
   mês, com o critério que levou cada fonte para cada mês. É a mesma conta de
   calculo/index.js, refeita fonte por fonte — por isso a soma das fontes de um
   mês é o valor da conta naquele mês (a auditoria confere).

   É o que o rastro da grande conta mostra: "Mão de obra na entressafra =
   equipes das atividades de preparo, plantio e tratos + quadro ADM agrícola +
   quadro da oficina + FAT...", cada uma com quanto caiu no período e por quê. */
import { MESES, NM } from '../nucleo/calendario.js';
import { ESPOR } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';
import { ETAPAS_ORD } from './arrendamento.js';

const CRIT = {
  equipe:  "a equipe é paga o mês cheio em cada mês com volume lançado",
  volume:  "na proporção do volume lançado em cada mês",
  litro:   "pelos litros de cada mês ao preço do diesel do mês",
  area:    "pela área operada de cada mês (custo que não tem mês próprio)",
  marcado: "nos meses marcados",
  fixo:    "o mesmo valor em todos os meses",
  pag:     "no mês de pagamento de cada contrato",
  lanc:    "no mês em que foi lançado",
  folha:   "pela folha prevista de cada mês, só de dez/26 a mar/27",
  apoio:   "nos meses do período de cada equipamento (aba Apoio)",
};

function fontesDaConta(R, k){
  const zeros = () => Array(NM).fill(0);
  const haTot = (R.haMes||[]).reduce((s,x)=>s+num(x),0);
  const peso = i => haTot>0 ? num(R.haMes[i])/haTot : 1/NM;
  const pelaArea = v => MESES.map((m,i)=>num(v)*peso(i));
  const fontes = [];
  const add = (rot, mes, crit, ir) => { if(mes.some(v=>Math.abs(v)>0.005)) fontes.push({rot, mes, crit, ir: ir||null}); };

  // parte de cada atividade que cai no mês, agrupada por etapa
  const porEtapa = (rotulo, valorMes, crit) => {
    const g = {};
    R.L.forEach(r=>{
      const tot = r.total||0; if(tot<=0) return;
      const arr = g[r.a.etapa] = g[r.a.etapa] || zeros();
      r.meses.forEach((q,i)=>{ arr[i] += valorMes(r, i, num(q)/tot); });
    });
    const ordem = e => { const i = ETAPAS_ORD.indexOf(e); return i<0 ? 99 : i; };
    Object.keys(g).sort((a,b)=>ordem(a)-ordem(b)).forEach(e=>add(rotulo+" — "+e.toLowerCase(), g[e], crit, "etapa:"+e));
  };

  if(k==="mdo"){
    porEtapa("Equipes das atividades", (r,i)=>num((r.mdoMes||[])[i]), CRIT.equipe);
    add("Operadores dos equipamentos de apoio", (R.AE.mdoMes||zeros()).slice(), CRIT.apoio, "frota:apoio");
    if(R.QF){
      add("Quadro ADM agrícola (previsto da controladoria)", R.QF.adm.mes.slice(), CRIT.folha);
      add("Quadro da oficina (previsto da controladoria)", R.QF.oficina.mes.slice(), CRIT.folha);
    }
    if(R.MOA) add("Apoio operacional (Dimensionamento)", R.MOA.mes.slice(), CRIT.marcado);
    if(R.FT)  add("FAT — benefício do contrato suspenso", R.FT.mes.slice(), CRIT.marcado);
  }
  if(k==="manut"){
    porEtapa("CRM da frota das atividades", (r,i,f)=>num(r.cManut)*f, CRIT.volume);
    add("CRM dos equipamentos de apoio", (R.AE.manutMes||zeros()).slice(), CRIT.apoio, "frota:apoio");
    add("CRM da frota prevista além do plano", pelaArea(R.crmExtra), CRIT.area, "frota:crmexced");
    add("Materiais de manutenção sem mês", pelaArea(R.MT.distribuido), CRIT.area);
    add("Materiais de manutenção com mês marcado", (R.MT.mesFixo||zeros()).slice(), CRIT.marcado);
  }
  if(k==="diesel"){
    porEtapa("Diesel das atividades", (r,i)=>num(r.dieselMes[i]), CRIT.litro);
    add("Diesel dos equipamentos de apoio", (R.AE.dieselMes||zeros()).slice(), CRIT.litro, "frota:apoio");
  }
  if(k==="insumo") porEtapa("Insumos dos tratamentos", (r,i)=>num((r.insumoMes||[])[i]), CRIT.volume);
  if(k==="irrig")  add("Irrigação e fertirrigação", pelaArea(R.irrT), CRIT.area);
  if(k==="terc"){
    porEtapa("Aplicações terceirizadas", (r,i,f)=>num(r.cTerc)*f, CRIT.volume);
    add("Contratos de terceirização", pelaArea(R.tercT), CRIT.area);
  }
  if(k==="tpess") add("Rotas de transporte de pessoal", pelaArea(R.tpessT), CRIT.area, "tpess");
  if(k==="arrend") add("Contratos de arrendamento", (R.AR.mes||zeros()).slice(), CRIT.pag, "nat:arrend");
  if(k==="fixo"){
    add("Custos administrativos", MESES.map(()=>num(R.ADM.mensal)), CRIT.fixo, "nat:admin");
    add("Depreciação", MESES.map(()=>num(R.depMes)), CRIT.fixo);
  }
  if(k==="espor") ESPOR.forEach(e=>{ const i = MESES.indexOf(e.mes); if(i<0) return;
    const mes = zeros(); mes[i] = num(e.valor);
    add(e.desc || "Custo esporádico", mes, CRIT.lanc+" ("+e.mes+")"); });
  return fontes;
}

export { CRIT, fontesDaConta };
