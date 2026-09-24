import { litrosDe } from './consumo.js';
import { CFG } from '../dados/cfg.js';
import { MESES, NM, periodoMes } from '../nucleo/calendario.js';
import { APOIO_FIXO, apoioLista } from '../nucleo/estado.js';
import { apoioDeFrente } from './apoio-frente.js';
import { ESP_ERP } from '../dados/atividades-erp.js';
import { num } from '../nucleo/formato.js';
import { precoDiesel } from './diesel.js';
import { custoDaFuncao } from './mao-de-obra.js';

/* ================== EQUIPAMENTOS DE APOIO ==================
   Safra e entressafra são estruturas INDEPENDENTES: cada equipamento tem a
   quantidade e as horas/mês da safra (abr–nov) e as da entressafra (dez–mar),
   e mudar uma não mexe na outra -- são demandas diferentes. Quantidade zero num
   período = o equipamento não trabalha nele. Dentro do período, dá para tirar
   meses (m: doze marcas; ausente = todos).

   Nos meses em que trabalha, as horas do seu período todo mês; fora deles,
   nada -- nem hora, nem diesel, nem operador, nem manutenção (o CRM segue as
   horas, em calculo/index.js).

   Formato antigo -- uma quantidade só (qtd, hmes) e um período (per: ano,
   safra, entressafra, meses) -- é lido como as duas estruturas iguais,
   zerando o período que ficava de fora; quem edita a linha a grava no formato
   novo (migrarApoio). */
const PER_APOIO = {s:"safra", e:"entressafra"};
const ROT_PER_APOIO = {s:"Safra (abr–nov)", e:"Entressafra (dez–mar)"};
const chaveDoMes = i => periodoMes(i)==="safra" ? "s" : "e";

// as duas estruturas de um equipamento, venha ele no formato novo ou no antigo
function estruturaApoio(a){
  if(a && (a.s || a.e)){
    const est = x => ({qtd:num((x||{}).qtd), hmes:num((x||{}).hmes)});
    return {s:est(a.s), e:est(a.e), m: Array.isArray(a.m) ? a.m.map(v=>num(v)>0?1:0) : null};
  }
  const base = {qtd:num(a && a.qtd), hmes:num(a && a.hmes)}, zero = {qtd:0, hmes:base.hmes};
  const per = (a && a.per) || "ano";
  if(per==="safra")       return {s:{...base}, e:zero, m:null};
  if(per==="entressafra") return {s:zero, e:{...base}, m:null};
  if(per==="meses")       return {s:{...base}, e:{...base}, m: Array.isArray(a.m) ? a.m.map(v=>num(v)>0?1:0) : null};
  return {s:{...base}, e:{...base}, m:null};
}
// grava a linha no formato novo (antes de editar qualquer campo de período)
function migrarApoio(l){
  const E = estruturaApoio(l);
  l.s = E.s; l.e = E.e;
  if(E.m) l.m = E.m; else delete l.m;
  delete l.qtd; delete l.hmes; delete l.per;
  return l;
}
// meses em que o equipamento trabalha: período com quantidade e horas, e mês não retirado
function mesesDoApoio(a){
  const E = estruturaApoio(a);
  return MESES.map((m,i)=>{ const x = E[chaveDoMes(i)];
    return x.qtd>0 && x.hmes>0 && (!E.m || E.m[i]) ? 1 : 0; });
}

function apoioCalc(MP){
  const linhas = apoioLista().map(a=>{
    const E = estruturaApoio(a);
    const on = mesesDoApoio(a), nMeses = on.reduce((s,x)=>s+x,0);
    const cf = custoDaFuncao(a.fcod, MP);
    // cada período com a sua quantidade e as suas horas; L/h × horas ou
    // L/km × (horas × velocidade média), conforme o equipamento
    const cons = {s:litrosDe(a.maq, E.s.qtd*E.s.hmes), e:litrosDe(a.maq, E.e.qtd*E.e.hmes)};
    const k = i => chaveDoMes(i);
    const qtdMes   = on.map((b,i)=>b ? E[k(i)].qtd : 0);
    const horasMes = on.map((b,i)=>b ? E[k(i)].qtd*E[k(i)].hmes : 0);
    const litrosMes = on.map((b,i)=>b ? cons[k(i)].litros : 0);
    const dieselMes = litrosMes.map((l,i)=>l*precoDiesel(i));
    const kmMes = on.map((b,i)=>b && cons[k(i)].km!=null ? cons[k(i)].km : 0);
    const soma = arr => arr.reduce((s,x)=>s+x,0);
    // operador pago nos meses em que o equipamento trabalha (mês cheio), como o diesel
    const mdoMes = qtdMes.map(q=>q*cf.mensal*MP.fatorEscala);
    const efetivoMes = qtdMes.map(q=>q>0 ? Math.ceil(q*MP.fatorEscala) : 0);
    const diesel = soma(dieselMes), mdo = soma(mdoMes), manut = 0;   // manutenção: vem do CRM da frota
    const temKm = cons.s.km!=null || cons.e.km!=null;
    const nMesesDe = c => on.filter((b,i)=>b && chaveDoMes(i)===c).length;
    return {...a, s:E.s, e:E.e, m:E.m, on, nMeses, nMesesS:nMesesDe("s"), nMesesE:nMesesDe("e"),
            // frota: o que tem de existir é o maior dos dois períodos
            qtd: Math.max(0, ...qtdMes), qtdMes,
            horas: soma(horasMes), horasMes, diesel, manut, manutMes:Array(NM).fill(0), mdo, mdoMes, fnome:cf.nome,
            litros: soma(litrosMes), litrosMes, dieselMes,
            consumoLh: cons.s.lh || cons.e.lh, consumoUn: cons.s.un || cons.e.un, consumoLkm: cons.s.lkm || cons.e.lkm,
            km: temKm ? soma(kmMes) : null, fonteKm: cons.s.fonteKm || cons.e.fonteKm,
            efetivo: Math.max(0, ...efetivoMes), efetivoMes,
            total: diesel+manut+mdo};
  });
  const porMes = k => MESES.map((m,i)=>linhas.reduce((s,l)=>s+l[k][i],0));
  return {linhas,
    horasMes: porMes("horasMes"), mdoMes: porMes("mdoMes"), manutMes: Array(NM).fill(0),
    total:   linhas.reduce((s,l)=>s+l.total,0),
    diesel:  linhas.reduce((s,l)=>s+l.diesel,0),
    litros:  linhas.reduce((s,l)=>s+l.litros,0),
    litrosMes: porMes("litrosMes"),
    dieselMes: porMes("dieselMes"),
    manut:   linhas.reduce((s,l)=>s+l.manut,0),
    mdo:     linhas.reduce((s,l)=>s+l.mdo,0),
    horas:   linhas.reduce((s,l)=>s+l.horas,0),
    equip:   linhas.reduce((s,l)=>s+num(l.qtd),0),
    // quantos equipamentos trabalham em cada período (no mês de maior uso dele)
    equipS:  linhas.reduce((s,l)=>s+Math.max(0, ...l.qtdMes.filter((q,i)=>chaveDoMes(i)==="s")),0),
    equipE:  linhas.reduce((s,l)=>s+Math.max(0, ...l.qtdMes.filter((q,i)=>chaveDoMes(i)==="e")),0),
    efetivo: linhas.reduce((s,l)=>s+l.efetivo,0)};
}

/* ================== FROTA DE APOIO ==================
   A frota de apoio nao e uma lista a parte: e a soma do que as FRENTES pedem.
   A pipa que aparece no Plantio, na colheita e no herbicida manual e o mesmo
   caminhao — cinco codigos de atividade no ERP, uma especialidade (327
   CAMINHAO - BOMBEIRO), um numero. Enquanto eram duas listas, a tela do plano
   dizia uma coisa e o resumo de frota dizia outra.

   Junta por ESPECIALIDADE, que e como o ERP classifica o equipamento, e soma
   MES A MES: o que precisa existir e o pico, porque frentes que rodam em meses
   diferentes dividem o mesmo caminhao. Quantidade digitada a mao (APOIO_FIXO)
   continua valendo por cima, para o caso em que o patio tem mais do que o plano
   pede. */
function frotaApoio(L){
  const porEsp = {};
  apoioDeFrente(L).filter(x=>x.frota>0).forEach(x=>{
    const k = x.esp || "—";
    const o = porEsp[k] = porEsp[k] || {esp:k, nome: ESP_ERP[k] || ("especialidade "+k),
                                        itens:new Set(), ativs:new Set(), qtdMes:Array(NM).fill(0)};
    o.itens.add(x.nome); o.ativs.add(x.cod+" · "+x.atividade);
    x.qtdMes.forEach((v,i)=>{ o.qtdMes[i] += v; });
  });
  const linhas = Object.values(porEsp).map(o=>{
    const pedido = Math.max(0, ...o.qtdMes);
    const ajuste = APOIO_FIXO[o.esp];
    const qtd = ajuste != null && ajuste !== "" ? num(ajuste) : pedido;
    const iPico = o.qtdMes.indexOf(pedido);
    return {esp:o.esp, nome:o.nome, qtd, pedido, ajustada: qtd !== pedido,
            mes: pedido>0 ? MESES[iPico] : "", qtdMes:o.qtdMes,
            itens:[...o.itens], ativs:[...o.ativs], nec: qtd};
  }).sort((a,b)=> b.nec - a.nec || a.nome.localeCompare(b.nome));
  return {linhas, total: linhas.reduce((s,l)=>s+l.nec,0),
          // soma simultanea de cada mes, que e o que a frota tem de cobrir junto
          porMes: MESES.map((m,i)=>linhas.reduce((s,l)=>s+l.qtdMes[i],0))};
}


export { PER_APOIO, ROT_PER_APOIO, apoioCalc, chaveDoMes, estruturaApoio, frotaApoio, mesesDoApoio, migrarApoio };
