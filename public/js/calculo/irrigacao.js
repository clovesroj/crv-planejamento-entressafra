import { CFG } from '../dados/cfg.js';
import { MESES, NM } from '../nucleo/calendario.js';
import { P } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';
import { precoDiesel } from './diesel.js';

/* ================== IRRIGAÇÃO ================== */
function irrigacao(L){
  const linhas = CFG.irr_acts.map(nome=>{
    const t = CFG.irr_tec[nome];            // [metodo,Ea,CUC,lamina,turno,hdia,pressao,esp]
    const r = L.find(x=>x.a.nome===nome);
    const area = r ? r.total : 0;
    const cod = r ? r.a.cod : null;
    const [metodo,Ea,CUC,lam,turno,hd,press,esp] = t;
    const lamBruta = Ea>0 ? lam/Ea : 0;
    const volume = lamBruta * area * 10;                 // m³ por ciclo
    const vazao = (turno*hd)>0 ? volume/(turno*hd) : 0;  // m³/h
    const amt = press*(1+P.perdaCarga/100) + P.desnivel;
    const potCV = (P.rendBomba>0) ? vazao*amt/(270*(P.rendBomba/100)) : 0;
    const nConj = Math.max(1, Math.ceil(potCV/150));
    const horas = vazao>0 ? volume/vazao : 0;
    // motobomba a diesel: litros distribuídos pelos meses da atividade, preço de cada mês
    const litros = P.fonte==="Elétrica" ? 0 : potCV*0.18*horas;
    const frM = (r && r.total>0) ? r.meses.map(q=>num(q)/r.total) : Array(NM).fill(0);
    const litrosMes = frM.map(x=>x*litros);
    const energia = P.fonte==="Elétrica"
      ? potCV*0.7355*horas*P.kwh
      : litrosMes.reduce((s,l,i)=>s+l*precoDiesel(i),0);
    const cu = CFG.irr_custos[nome] || [0,0,0];
    const insumo = area*cu[1], material = area*cu[2];
    return {nome, cod, metodo, Ea, CUC, lam, lamBruta, area, volume, vazao, amt,
            potCV, nConj, horas, energia, insumo, material, litros, litrosMes,
            total: energia+insumo+material};
  });
  return {linhas, total: linhas.reduce((s,l)=>s+l.total,0),
          energia: linhas.reduce((s,l)=>s+l.energia,0),
          litros: linhas.reduce((s,l)=>s+l.litros,0),
          litrosMes: MESES.map((m,i)=>linhas.reduce((s,l)=>s+l.litrosMes[i],0))};
}


export { irrigacao };
