import { CAT_VEICULO, CRM_COMP, CRM_LABEL, crmDe } from '../calculo/crm.js';
import { CFG } from '../dados/cfg.js';
import { CAT_SEL, CRM, FROTA } from '../nucleo/estado.js';
import { $, brl, fmt } from '../nucleo/formato.js';
import { kpi, th } from './componentes.js';
import { setCAT_SEL } from '../nucleo/estado.js';

/* ---------- MANUTENÇÃO DE FROTA (CRM) ---------- */
function pintarCRM(R){
  const cats = CFG.crm_cats;
  if(!CAT_SEL || !cats.includes(CAT_SEL)) setCAT_SEL(cats[0]);
  $("#sel_cat").innerHTML = cats.map(c=>`<option ${c===CAT_SEL?"selected":""}>${c}</option>`).join("");

  const crmT = R.crmTotal;
  const unidadeCat = CAT_VEICULO.includes(CAT_SEL) ? "km" : "h";
  $("#k_crm").innerHTML =
    kpi("CRM total projetado","",brl(crmT), "frota prevista x uso x R$/h (máquinas) ou R$/km (veículos)") +
    kpi("CRM de frota excedente", R.crmExtra>0?"a":"g", brl(R.crmExtra), "tratado em separado") +
    kpi("Peças + serviços 3º","t",brl(R.crmComp.pecas+R.crmComp.terc)) +
    kpi("Materiais + lubrificantes","g",brl(R.crmComp.consumo+R.crmComp.lubrif));

  const linhas = R.crmFrotaL.filter(l=>l.cat===CAT_SEL)
                  .sort((a,b)=>b.total-a.total || a.item.localeCompare(b.item));
  $("#t_crm").innerHTML = th([["Equipamento / implemento"],["Peças",1],["Serviços 3º",1],
    ["Uso e consumo",1],["Lubrif.",1],["CRM (R$/"+unidadeCat+")",1],["Frota dim.",1],["Frota prevista",1],
    ["Horas/equip.",1],["Uso p/ CRM",1],["CRM operacional",1],["CRM excedente",1],["CRM total",1]])+"<tbody>"+
    (linhas.length? linhas.map(l=>{
      const c = crmDe(l.item), alt = CRM[l.item], altF = FROTA[l.item];
      return `<tr><td>${l.item}${alt?' <span class="badge b-warn">CRM ajustado</span>':''}${
          l.extra>0?` <span class="badge b-ok">+${l.extra} extra</span>`:''}</td>`+
        CRM_COMP.map(k=>`<td class="num"><input data-crm="${l.item}" data-k="${k}" value="${c[k]}" inputmode="decimal"></td>`).join("")+
        `<td class="num tot">${brl(c.total,2)}</td>
         <td class="num calc">${l.qtdDim||"—"}</td>
         <td class="num"><input data-fq="${l.item}" value="${l.qtd}" inputmode="decimal"></td>
         <td class="num"><input data-fh="${l.item}" value="${Math.round(l.hEq)}" inputmode="decimal"></td>
         <td class="num calc">${fmt(l.baseUso)} ${l.unidade}</td>
         <td class="num calc">${brl(l.crmOper)}</td>
         <td class="num ${l.crmExced>0?"tot":"calc"}" style="${l.crmExced>0?"color:var(--amber)":""}">${l.crmExced>0?brl(l.crmExced):"—"}</td>
         <td class="num tot">${brl(l.total)}</td></tr>`;}).join("")
      : `<tr><td colspan="13" class="calc">Nenhum item cadastrado nesta categoria.</td></tr>`)+
    `<tr><td class="tot">TOTAL DA CATEGORIA</td><td colspan="5"></td>
     <td class="num tot">${fmt(linhas.reduce((s,l)=>s+l.qtdDim,0))}</td>
     <td class="num tot">${fmt(linhas.reduce((s,l)=>s+l.qtd,0))}</td><td></td>
     <td class="num tot">${fmt(linhas.reduce((s,l)=>s+l.baseUso,0))} ${unidadeCat}</td>
     <td class="num tot">${brl(linhas.reduce((s,l)=>s+l.crmOper,0))}</td>
     <td class="num tot">${brl(linhas.reduce((s,l)=>s+l.crmExced,0))}</td>
     <td class="num tot">${brl(linhas.reduce((s,l)=>s+l.total,0))}</td></tr></tbody>`;

  $("#t_crm_comp").innerHTML = th([["Componente"],["Valor",1],["% do CRM",1],["Peso"]])+"<tbody>"+
    CRM_COMP.map(k=>{const v=R.crmComp[k], pp=crmT?v/crmT*100:0;
      return `<tr><td>${CRM_LABEL[k]}</td><td class="num">${brl(v)}</td>
        <td class="num calc">${fmt(pp,1)}%</td>
        <td><div class="bar"><i style="width:${Math.min(pp,100)}%"></i></div></td></tr>`;}).join("")+
    `<tr><td class="tot">TOTAL CRM</td><td class="num tot">${brl(crmT)}</td>
     <td class="num tot">100,0%</td><td></td></tr></tbody>`;

  const et = Object.entries(R.crmEtapa).sort((a,b)=>b[1]-a[1]);
  const etT = et.reduce((s,[,v])=>s+v,0)||1;
  $("#t_crm_etapa").innerHTML = th([["Etapa"],["CRM",1],["% do CRM",1],["Peso"]])+"<tbody>"+
    et.map(([e,v])=>`<tr><td>${e}</td><td class="num">${brl(v)}</td>
      <td class="num calc">${fmt(v/etT*100,1)}%</td>
      <td><div class="bar"><i style="width:${v/etT*100}%"></i></div></td></tr>`).join("")+
    `<tr><td class="tot">TOTAL</td><td class="num tot">${brl(etT)}</td><td class="num tot">100,0%</td><td></td></tr></tbody>`;
}


export { pintarCRM };
