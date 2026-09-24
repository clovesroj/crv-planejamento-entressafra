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
   Cada equipamento trabalha num período: o ano todo (o padrão, e o que valia
   antes), a safra, a entressafra ou os meses marcados. Nos meses em que
   trabalha, as mesmas horas todo mês; fora deles, nada -- nem hora, nem diesel,
   nem operador, nem manutenção (o CRM segue as horas, em calculo/index.js). */
const PERIODOS_APOIO = {ano:"Ano todo", safra:"Safra (abr–nov)", entressafra:"Entressafra (dez–mar)", meses:"Meses escolhidos"};
function mesesDoApoio(a){
  const per = (a && a.per) || "ano";
  if(per==="safra" || per==="entressafra") return MESES.map((m,i)=>periodoMes(i)===per ? 1 : 0);
  if(per==="meses") return Array.from({length:NM}, (_,i)=>Array.isArray(a.m) && num(a.m[i])>0 ? 1 : 0);
  return Array(NM).fill(1);
}
function apoioCalc(MP){
  const linhas = apoioLista().map(a=>{
    const on = mesesDoApoio(a), nMeses = on.reduce((s,x)=>s+x,0);
    const hMes = num(a.qtd)*num(a.hmes);
    const horasMes = on.map(b=>b ? hMes : 0);
    const horas = horasMes.reduce((s,x)=>s+x,0);
    const cf = custoDaFuncao(a.fcod, MP);
    // nos meses em que trabalha: volume mensal constante, preço de cada mês
    // L/h × horas ou L/km × (horas × velocidade média), conforme o equipamento
    const cons = litrosDe(a.maq, hMes);
    const litrosMes = on.map(b=>b ? cons.litros : 0);
    const dieselMes = litrosMes.map((l,i)=>l*precoDiesel(i));
    const litros = litrosMes.reduce((s,x)=>s+x,0);
    const diesel = dieselMes.reduce((s,x)=>s+x,0);
    const manut  = 0;   // idem: vem do CRM da frota
    const manutMes = Array(NM).fill(0);
    // operador pago nos meses em que o equipamento trabalha (mês cheio), como o diesel
    const mdoMes = on.map(b=>b ? num(a.qtd)*cf.mensal*MP.fatorEscala : 0);
    const mdo    = mdoMes.reduce((s,x)=>s+x,0);
    const efetivo = Math.ceil(num(a.qtd)*MP.fatorEscala);
    return {...a, per:(a.per||"ano"), on, nMeses, horas, horasMes, diesel, manut, manutMes, mdo, mdoMes, fnome:cf.nome,
            litros, litrosMes, dieselMes, consumoLh:cons.lh,
            consumoUn:cons.un, consumoLkm:cons.lkm, km: cons.km!=null ? cons.km*nMeses : null, fonteKm:cons.fonteKm,
            efetivo, efetivoMes: on.map(b=>b ? efetivo : 0),
            total: diesel+manut+mdo};
  });
  const porMes = k => MESES.map((m,i)=>linhas.reduce((s,l)=>s+l[k][i],0));
  return {linhas,
    horasMes: porMes("horasMes"), mdoMes: porMes("mdoMes"), manutMes: Array(NM).fill(0),
    total:   linhas.reduce((s,l)=>s+l.total,0),
    diesel:  linhas.reduce((s,l)=>s+l.diesel,0),
    litros:  linhas.reduce((s,l)=>s+l.litros,0),
    litrosMes: MESES.map((m,i)=>linhas.reduce((s,l)=>s+l.litrosMes[i],0)),
    dieselMes: MESES.map((m,i)=>linhas.reduce((s,l)=>s+l.dieselMes[i],0)),
    manut:   linhas.reduce((s,l)=>s+l.manut,0),
    mdo:     linhas.reduce((s,l)=>s+l.mdo,0),
    horas:   linhas.reduce((s,l)=>s+l.horas,0),
    equip:   linhas.reduce((s,l)=>s+num(l.qtd),0),
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


export { PERIODOS_APOIO, apoioCalc, frotaApoio, mesesDoApoio };
