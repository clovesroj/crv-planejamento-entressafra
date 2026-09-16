import { AG_SEM_FROTA, CRM_COMP, CRM_LABEL, FROTA_ESP, SEP_MOD, agDeLinha, agsCRM,
         contaOrigem, crmDe, crmEspDe, rotuloItem } from '../calculo/crm.js';
import { CFG } from '../dados/cfg.js';
import { CAT_SEL, CRM, CRM_ESP, FROTA, FROTA_ORIG } from '../nucleo/estado.js';
import { $, brl, fmt } from '../nucleo/formato.js';
import { kpi, th } from './componentes.js';
import { setCAT_SEL } from '../nucleo/estado.js';

/* ---------- MANUTENÇÃO DE FROTA (CRM) ---------- */
function pintarCRM(R){
  const ags = agsCRM();
  if(!CAT_SEL || !ags.includes(CAT_SEL)) setCAT_SEL(ags[0]);
  $("#sel_cat").innerHTML = ags.map(c=>`<option ${c===CAT_SEL?"selected":""}>${c}</option>`).join("");
  $("#sel_orig").value = FROTA_ORIG;

  const crmT = R.crmTotal;
  $("#k_crm").innerHTML =
    kpi("CRM total projetado","",brl(crmT), "frota prevista x uso x R$/h (máquinas) ou R$/km (veículos)") +
    kpi("CRM de frota excedente", R.crmExtra>0?"a":"g", brl(R.crmExtra), "tratado em separado") +
    kpi("Peças + serviços 3º","t",brl(R.crmComp.pecas+R.crmComp.terc)) +
    kpi("Materiais + lubrificantes","g",brl(R.crmComp.consumo+R.crmComp.lubrif));

  const doAg = R.crmFrotaL.filter(l=>agDeLinha(l)===CAT_SEL);
  const porEsp = {};
  doAg.forEach(l=>{ const k = l.esp || AG_SEM_FROTA; (porEsp[k]=porEsp[k]||[]).push(l); });
  // ordena a especialidade pelo grupo do cadastro, para as afins ficarem juntas
  const espsOrd = Object.keys(porEsp).sort((a,b)=>{
    const ea=FROTA_ESP[a], eb=FROTA_ESP[b];
    return (ea?ea.grp:"").localeCompare(eb?eb.grp:"") || a.localeCompare(b);
  });

  const cel = (l,k,c)=>`<td class="num"><input data-crm="${l.item}" data-k="${k}" value="${c[k]}" inputmode="decimal"></td>`;
  const linhaModelo = l=>{
    const c = crmDe(l.item), alt = CRM[l.item];
    const un = contaOrigem(l.baseProp, l.baseTerc);
    return `<tr><td style="padding-left:26px">${rotuloItem(l.item)}${
        alt?' <span class="badge b-warn">taxa própria</span>':''}${
        l.naBase?'':' <span class="badge">fora da base</span>'}${
        l.extra>0?` <span class="badge b-ok">+${l.extra} extra</span>`:''}</td>
      <td class="num calc">${un||"—"}</td>`+
      CRM_COMP.map(k=>cel(l,k,c)).join("")+
      `<td class="num tot">${brl(c.total,2)}</td>
       <td class="num calc">${l.qtdDim||"—"}</td>
       <td class="num"><input data-fq="${l.item}" value="${l.qtd}" inputmode="decimal"></td>
       <td class="num"><input data-fh="${l.item}" value="${Math.round(l.hEq)}" inputmode="decimal"></td>
       <td class="num calc">${fmt(l.baseUso)} ${l.unidade}</td>
       <td class="num calc">${brl(l.crmOper)}</td>
       <td class="num ${l.crmExced>0?"tot":"calc"}" style="${l.crmExced>0?"color:var(--amber)":""}">${l.crmExced>0?brl(l.crmExced):"—"}</td>
       <td class="num tot">${brl(l.total)}</td></tr>`;
  };

  let corpo = "", tQtdDim=0, tQtd=0, tUso=0, tOper=0, tExced=0, tTotal=0, tUn=0;
  espsOrd.forEach(esp=>{
    const e = FROTA_ESP[esp];
    // o filtro de origem esconde o modelo que não tem unidade da origem escolhida,
    // mas nunca o que o plano está usando — some da conta o que está em uso
    let mods = porEsp[esp].filter(l=> !l.naBase || contaOrigem(l.baseProp,l.baseTerc)>0 || l.horas>0);
    mods.sort((a,b)=> b.total-a.total || a.item.localeCompare(b.item));
    if(!mods.length) return;
    const ce = crmEspDe(esp);
    const un = e ? contaOrigem(e.prop, e.terc) : 0;
    const unid = e ? (e.base==="K"?"km":"h") : "h";
    const s = k=> mods.reduce((a,l)=>a+l[k],0);
    const qtdDim=s("qtdDim"), qtd=s("qtd"), uso=s("baseUso"), oper=s("crmOper"), exced=s("crmExced"), tot=s("total");
    tQtdDim+=qtdDim; tQtd+=qtd; tUso+=uso; tOper+=oper; tExced+=exced; tTotal+=tot; tUn+=un;
    const semTaxa = e && un>0 && ce.total===0 && !mods.some(l=>crmDe(l.item).total>0);
    corpo += `<tr style="background:var(--bg)"><td class="tot">${esp}
        ${e?`<span class="badge">${e.grp}</span>`:""}
        <span class="calc" style="font-weight:400">· ${mods.length} modelo${mods.length>1?"s":""}</span>
        ${semTaxa?' <span class="badge b-warn">sem taxa</span>':''}</td>
      <td class="num tot">${un||"—"}</td>`+
      CRM_COMP.map(k=>`<td class="num"><input data-crmesp="${esp}" data-k="${k}" value="${ce[k]}" inputmode="decimal"></td>`).join("")+
      `<td class="num tot">${brl(ce.total,2)}/${unid}</td>
       <td class="num tot">${qtdDim||"—"}</td>
       <td class="num tot">${fmt(qtd)}</td><td></td>
       <td class="num tot">${fmt(uso)} ${unid}</td>
       <td class="num tot">${brl(oper)}</td>
       <td class="num tot">${exced>0?brl(exced):"—"}</td>
       <td class="num tot">${brl(tot)}</td></tr>`;
    corpo += mods.map(linhaModelo).join("");
  });

  $("#t_crm").innerHTML = th([["Especialidade / modelo"],["Unid. base",1],["Peças",1],["Serviços 3º",1],
    ["Uso e consumo",1],["Lubrif.",1],["CRM (R$/un)",1],["Frota dim.",1],["Frota prevista",1],
    ["Horas/equip.",1],["Uso p/ CRM",1],["CRM operacional",1],["CRM excedente",1],["CRM total",1]])+"<tbody>"+
    (corpo || `<tr><td colspan="14" class="calc">Nenhum item neste agrupamento com o filtro de origem atual.</td></tr>`)+
    `<tr><td class="tot">TOTAL DO AGRUPAMENTO</td>
     <td class="num tot">${tUn||"—"}</td><td colspan="5"></td>
     <td class="num tot">${fmt(tQtdDim)}</td>
     <td class="num tot">${fmt(tQtd)}</td><td></td>
     <td class="num tot">${fmt(tUso)}</td>
     <td class="num tot">${brl(tOper)}</td>
     <td class="num tot">${brl(tExced)}</td>
     <td class="num tot">${brl(tTotal)}</td></tr></tbody>`;

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
