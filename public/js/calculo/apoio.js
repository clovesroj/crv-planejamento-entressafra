import { maqDe } from './crm.js';
import { CFG } from '../dados/cfg.js';
import { MESES, NM } from '../nucleo/calendario.js';
import { APOIO_FIXO, apoioLista } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';
import { precoDiesel } from './diesel.js';
import { custoNivel } from './mao-de-obra.js';

/* ================== EQUIPAMENTOS DE APOIO ================== */
function apoioCalc(MP){
  const linhas = apoioLista().map(a=>{
    const mq = maqDe(a.maq);
    const horas = num(a.qtd)*num(a.hmes)*NM;
    const cf = custoNivel(a.fcod, a.fniv||0, MP);
    // apoio trabalha as mesmas horas todo mês: volume mensal constante, preço de cada mês
    const litrosMes = Array(NM).fill(num(a.qtd)*num(a.hmes)*mq.d);
    const dieselMes = litrosMes.map((l,i)=>l*precoDiesel(i));
    const litros = litrosMes.reduce((s,x)=>s+x,0);
    const diesel = dieselMes.reduce((s,x)=>s+x,0);
    const manut  = 0;   // idem: vem do CRM da frota
    const mdo    = num(a.qtd)*cf.mensal*NM*MP.fatorEscala;
    return {...a, horas, diesel, manut, mdo, fnome:cf.nome,
            litros, litrosMes, dieselMes, consumoLh:mq.d,
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

/* ================== FROTA DE APOIO ================== */
function frotaApoio(){
  const linhas = CFG.apoio.map(a=>{
    const qtd = APOIO_FIXO[a.nome]!=null ? num(APOIO_FIXO[a.nome]) : a.qtd;
    return {...a, qtd, nec: a.disp>0 ? qtd*a.util/a.disp : 0};
  });
  return {linhas, total: linhas.reduce((s,l)=>s+l.nec,0)};
}


export { apoioCalc, frotaApoio };
