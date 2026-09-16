import { FORN_MODALIDADES, FORN_ORIGENS, FORN_PAR_PADRAO } from '../dados/fornecedores.js';
import { MESES, NM } from '../nucleo/calendario.js';
import { FORN_PAR, fornLista } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';

/* ================== FORNECEDORES DE CANA ==================
   Consolida a matéria-prima das quatro origens sem somar naturezas
   diferentes: própria e arrendada saem do custo do plano agrícola;
   fornecedor e parceria saem do contrato de compra. O único número que junta
   tudo é o custo médio ponderado da tonelada — a pergunta de moagem — e ele
   vem sempre acompanhado da participação de cada origem. */

function fornPar(k){ return FORN_PAR[k]!=null ? num(FORN_PAR[k]) : FORN_PAR_PADRAO[k]; }

/* Meses de entrega de uma linha, dentro da janela do orçamento. */
function mesesEntrega(l){
  const ini = Math.max(0, Math.min(NM-1, +l.entIni||0));
  const fim = Math.max(ini, Math.min(NM-1, +l.entFim||0));
  const idx = [];
  for(let i=ini;i<=fim;i++) idx.push(i);
  return idx;
}

function fornCalc(R){
  const pAtr = fornPar("precoAtr"), freteKm = fornPar("freteKm");

  const linhas = fornLista().map(l=>{
    const area = num(l.area), tch = num(l.tch), atr = num(l.atr);
    // tonelada estimada informada manda; sem ela, área × TCH
    const ton = num(l.tonEst) > 0 ? num(l.tonEst) : area*tch;
    const tonContr = num(l.tonContr);
    const atrTotal = ton*atr;                       // kg de ATR entregues
    const preco = num(l.preco);
    const mod = FORN_MODALIDADES[l.mod] ? l.mod : "consecana";
    // valor da cana conforme a modalidade contratada
    const cana = ({
      consecana: atrTotal*(preco>0?preco:pAtr),
      rs_t:      ton*preco,
      parceria:  atrTotal*pAtr*(preco/100),
      permuta:   atrTotal*pAtr,
    })[mod] || 0;
    const premio = ton*num(l.premio);
    const desconto = ton*num(l.desc);
    // frete da linha; em branco, usa a distância pela tarifa por km
    const freteT = num(l.frete) > 0 ? num(l.frete) : num(l.dist)*freteKm;
    const frete = ton*freteT;
    const logist = ton*num(l.logist);
    const custo = cana + premio - desconto + frete + logist;
    const idx = mesesEntrega(l);
    const mes = Array(NM).fill(0);
    idx.forEach(i=>{ mes[i] = ton/idx.length; });   // entrega distribuída nos meses contratados
    const tonHist = num(l.tonHist);
    return {...l, area, tch, atr, ton, tonContr, atrTotal, mod, cana, premio, desconto,
            freteT, frete, logist, custo, mes, tonHist,
            origem: FORN_ORIGENS[l.origem] ? l.origem : FORN_MODALIDADES[mod].origem,
            rsT:   ton>0 ? custo/ton : 0,
            rsAtr: atrTotal>0 ? custo/atrTotal : 0,
            aderContr: tonContr>0 ? ton/tonContr : 0,      // estimado sobre contratado
            varHist:   tonHist>0 ? ton/tonHist-1 : null,   // variação sobre a safra anterior
            mesesEnt: idx.map(i=>MESES[i])};
  });

  /* ---- cana do próprio plano, separada em área própria e arrendada ---- */
  const colhida = R.L.find(r=>r.a.cod==="A01");
  const tonPlano = colhida ? colhida.total : 0;
  const areaArr = R.AR.area, areaPropria = fornPar("areaPropria");
  const areaPlano = areaPropria + areaArr;
  // sem área própria informada, toda a produção do plano fica como arrendada
  const fracArr = areaPlano > 0 ? areaArr/areaPlano : (areaArr > 0 ? 1 : 0);
  const atrPropria = fornPar("atrPropria");
  // o arrendamento é custo da terra arrendada, e só dela; o resto do plano segue a área
  const custoSemArr = R.total - R.arrT;

  const proprio   = {ton: tonPlano*(1-fracArr), area: areaPropria,
                     custo: custoSemArr*(1-fracArr), atr: atrPropria};
  const arrendada = {ton: tonPlano*fracArr, area: areaArr,
                     custo: custoSemArr*fracArr + R.arrT, atr: atrPropria};

  /* ---- consolidação por origem ---- */
  const origens = {};
  Object.keys(FORN_ORIGENS).forEach(o=>{
    origens[o] = {...FORN_ORIGENS[o], cod:o, ton:0, area:0, custo:0, atrTotal:0, linhas:0,
                  mes:Array(NM).fill(0)};
  });
  const somaPlano = (o, d)=>{
    const x = origens[o];
    x.ton += d.ton; x.area += d.area; x.custo += d.custo; x.atrTotal += d.ton*d.atr;
    // a cana própria é moída conforme a colheita do plano operacional
    if(colhida && tonPlano>0) colhida.meses.forEach((q,i)=>{ x.mes[i] += num(q)*(d.ton/tonPlano); });
  };
  somaPlano("propria", proprio);
  somaPlano("arrendada", arrendada);
  linhas.forEach(l=>{
    const x = origens[l.origem];
    x.ton += l.ton; x.area += l.area; x.custo += l.custo; x.atrTotal += l.atrTotal; x.linhas++;
    l.mes.forEach((v,i)=>{ x.mes[i] += v; });
  });
  Object.values(origens).forEach(x=>{
    x.rsT = x.ton>0 ? x.custo/x.ton : 0;
    x.rsAtr = x.atrTotal>0 ? x.custo/x.atrTotal : 0;
    x.atrMedio = x.ton>0 ? x.atrTotal/x.ton : 0;
  });

  // A média ponderada só pode incluir origem que tenha tonelada: enquanto a colheita
  // própria não estiver lançada no plano, o custo agrícola não tem tonelada para dividir
  // e entraria inflando o R$/t. Esse custo aparece à parte, em custoSemTon.
  const comTon = Object.values(origens).filter(x=>x.ton>0);
  const soma = k => comTon.reduce((s,x)=>s+x[k],0);
  const tonTotal = soma("ton"), custoTotal = soma("custo"), atrTotal = soma("atrTotal");
  const custoSemTon = Object.values(origens).filter(x=>x.ton<=0).reduce((s,x)=>s+x.custo,0);
  const prodTon   = origens.propria.ton + origens.arrendada.ton;
  const aqTon     = origens.fornecedor.ton + origens.parceria.ton;
  const prodCusto = origens.propria.custo + origens.arrendada.custo;
  const aqCusto   = origens.fornecedor.custo + origens.parceria.custo;

  return {linhas, origens, tonTotal, custoTotal, atrTotal,
    // agregados por natureza contábil, para leitura separada
    producao:  {ton:prodTon, custo:prodCusto, rsT: prodTon>0 ? prodCusto/prodTon : 0},
    aquisicao: {ton:aqTon,   custo:aqCusto,   rsT: aqTon>0   ? aqCusto/aqTon     : 0},
    rsTMedio:   tonTotal>0 ? custoTotal/tonTotal : 0,
    rsAtrMedio: atrTotal>0 ? custoTotal/atrTotal : 0,
    atrMedio:   tonTotal>0 ? atrTotal/tonTotal : 0,
    tonMes: MESES.map((m,i)=>Object.values(origens).reduce((s,x)=>s+x.mes[i],0)),
    custoSemTon, fracArr, tonPlano, areaPlano};
}

export { fornCalc, fornPar, mesesEntrega };
