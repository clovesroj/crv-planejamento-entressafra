import { litrosDe } from './consumo.js';
import { CFG } from '../dados/cfg.js';
import { MESES, NM } from '../nucleo/calendario.js';
import { APOIO_FIXO, apoioLista } from '../nucleo/estado.js';
import { apoioDeFrente } from './apoio-frente.js';
import { ESP_ERP } from '../dados/atividades-erp.js';
import { num } from '../nucleo/formato.js';
import { precoDiesel } from './diesel.js';
import { custoDaFuncao } from './mao-de-obra.js';

/* ================== EQUIPAMENTOS DE APOIO ================== */
function apoioCalc(MP){
  const linhas = apoioLista().map(a=>{
    const horas = num(a.qtd)*num(a.hmes)*NM;
    const cf = custoDaFuncao(a.fcod, MP);
    // apoio trabalha as mesmas horas todo mês: volume mensal constante, preço de cada mês
    // L/h × horas ou L/km × (horas × velocidade média), conforme o equipamento
    const cons = litrosDe(a.maq, num(a.qtd)*num(a.hmes));
    const litrosMes = Array(NM).fill(cons.litros);
    const dieselMes = litrosMes.map((l,i)=>l*precoDiesel(i));
    const litros = litrosMes.reduce((s,x)=>s+x,0);
    const diesel = dieselMes.reduce((s,x)=>s+x,0);
    const manut  = 0;   // idem: vem do CRM da frota
    const mdo    = num(a.qtd)*cf.mensal*NM*MP.fatorEscala;
    return {...a, horas, diesel, manut, mdo, fnome:cf.nome,
            litros, litrosMes, dieselMes, consumoLh:cons.lh,
            consumoUn:cons.un, consumoLkm:cons.lkm, km: cons.km!=null ? cons.km*NM : null, fonteKm:cons.fonteKm,
            efetivo: Math.ceil(num(a.qtd)*MP.fatorEscala),
            total: diesel+manut+mdo};
  });
  return {linhas,
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


export { apoioCalc, frotaApoio };
