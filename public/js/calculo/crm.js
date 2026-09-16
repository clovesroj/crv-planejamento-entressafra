import { CFG } from '../dados/cfg.js';
import { CRM, FROTA, P } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';

/* ===== CRM: custos de reparo e manutenção, estratificados ===== */
const CRM_COMP = ["pecas","terc","consumo","lubrif"];
const CRM_LABEL = {pecas:"Peças", terc:"Serviços de terceiros",
                   consumo:"Materiais de uso e consumo", lubrif:"Lubrificantes"};
function crmDe(item){
  const base = CFG.crm[item] || {cat:"Equipamentos",pecas:0,terc:0,consumo:0,lubrif:0};
  const ov = CRM[item] || {};
  const o = {cat: base.cat};
  CRM_COMP.forEach(k=> o[k] = ov[k]!=null ? num(ov[k]) : base[k]);
  o.total = CRM_COMP.reduce((s,k)=>s+o[k],0);
  return o;
}
// R$/h de manutenção do conjunto: máquina + implemento acoplado
function crmHora(maq, imp){
  const a = crmDe(maq).total;
  const b = (imp && imp!=="----" && imp!=="—" && CFG.crm[imp]) ? crmDe(imp).total : 0;
  return a+b;
}
// abre o custo de manutenção do conjunto por componente
function crmDetalhe(maq, imp, horas){
  const o = {};
  CRM_COMP.forEach(k=>{
    const a = crmDe(maq)[k];
    const b = (imp && CFG.crm[imp]) ? crmDe(imp)[k] : 0;
    o[k] = (a+b)*horas;
  });
  return o;
}
// Horas de cada item (máquina ou implemento) conforme o plano operacional
function horasPorItem(L, AE){
  const h = {};
  const soma=(k,v)=>{ if(!k||k==="----"||k==="—") return; h[k]=(h[k]||0)+v; };
  L.forEach(r=>r.partes.forEach(p=>{
    if(p.terc||p.horas<=0) return;
    soma(p.maq,p.horas); soma(p.imp,p.horas);
  }));
  AE.linhas.forEach(l=>{ if(l.horas>0) soma(l.maq,l.horas); });
  return h;
}
// Frota dimensionada pelo plano (arredondada) por item
function frotaPorItem(L, AE){
  const f = {};
  const soma=(k,v)=>{ if(!k||k==="----"||k==="—") return; f[k]=(f[k]||0)+v; };
  L.forEach(r=>r.partes.forEach(p=>{
    if(p.terc||p.frotaR<=0) return;
    soma(p.maq,p.frotaR); soma(p.imp,p.frotaR);
  }));
  AE.linhas.forEach(l=>{ if(num(l.qtd)>0) soma(l.maq,num(l.qtd)); });
  return f;
}
// Categorias tratadas como veículo: CRM é expresso por km rodado, não por hora.
// A conversão horas->km usa a velocidade média de transporte já premissada (Transporte e Transbordo);
// os valores de R$/h originais desses itens foram migrados para R$/km dividindo por essa mesma velocidade,
// então o custo total projetado não muda — só passa a ser expresso na unidade correta.
const CAT_VEICULO = ["Veículos pesados","Veículos leves"];
function velMediaVeic(){ return ((P.velC||0)+(P.velV||0))/2 || 1; }
// Para cada item: quantidade e horas/equipamento previstas (editáveis) e o CRM resultante
function crmFrota(L, AE){
  const hPlano = horasPorItem(L, AE);
  const fPlano = frotaPorItem(L, AE);
  const itens = [...new Set([...Object.keys(CFG.crm), ...Object.keys(hPlano)])];
  const vmed = velMediaVeic();
  const linhas = itens.map(item=>{
    const c = crmDe(item);
    const isVeic = CAT_VEICULO.includes(c.cat);
    const unidade = isVeic ? "km" : "h";
    const conv = isVeic ? vmed : 1;
    const qtdDim = fPlano[item] || 0;
    const hTot   = hPlano[item] || 0;
    const ov = FROTA[item] || {};
    const qtd  = ov.qtd!=null  ? num(ov.qtd)  : qtdDim;
    const hEq  = ov.hmes!=null ? num(ov.hmes) : (qtdDim>0 ? hTot/qtdDim : 0);
    const horasPrev = qtd*hEq;
    // horas do plano são obrigatórias; o que exceder é frota parada/reserva
    const horas = Math.max(horasPrev, hTot);
    const horasExced = Math.max(0, horas - hTot);
    const baseUso = horas*conv, baseExced = horasExced*conv, baseOper = hTot*conv;
    const det = {}; CRM_COMP.forEach(k=> det[k] = c[k]*baseUso);
    return {item, cat:c.cat, unidade, conv, qtdDim, hTotPlano:hTot, qtd, hEq, horasPrev, horas, horasExced,
            baseUso, baseExced, rh:c.total, det, total: c.total*baseUso,
            crmOper: c.total*baseOper, crmExced: c.total*baseExced,
            extra: Math.max(0, qtd-qtdDim)};
  });
  return {linhas, total: linhas.reduce((s,l)=>s+l.total,0),
          oper: linhas.reduce((s,l)=>s+l.crmOper,0),
          exced: linhas.reduce((s,l)=>s+l.crmExced,0), hPlano};
}


export { CAT_VEICULO, CRM_COMP, CRM_LABEL, crmDe, crmDetalhe, crmFrota, crmHora, frotaPorItem, horasPorItem, velMediaVeic };
