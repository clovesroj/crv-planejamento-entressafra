import { ETAPAS_ORD } from '../calculo/arrendamento.js';
import { crmDe } from '../calculo/crm.js';
import { composicao, destravar, tratCodigos } from '../calculo/insumos.js';
import { destravarNiv } from '../calculo/mao-de-obra.js';
import { CFG } from '../dados/cfg.js';
import { salvar } from '../io/persistencia.js';
import { MESES, NM } from '../nucleo/calendario.js';
import { APOIO, APOIO_FIXO, ARR_PAR, ARR_RAT, BEN, CAT_SEL, CRM, DIESEL_MES, DIM, ENC, ESPOR, FROTA, FUN_SEL, GRAT, INSUMO, INSX, NIV, P, PLANO, TERC_TAR, TPESS, TRATC, TRAT_NOME, TRAT_SEL, apoioLista, arrLista, insLista, matLista, tpessLista } from '../nucleo/estado.js';
import { $, num } from '../nucleo/formato.js';
import { lerPremissas } from '../ui/premissas.js';
import { leve, render } from './ciclo.js';
import { setAPOIO, setBEN, setCAT_SEL, setENC, setFUN_SEL, setINSX, setTPESS, setTRAT_SEL } from '../nucleo/estado.js';

/* ---------- entrada ---------- */
document.addEventListener("input",e=>{
  const t=e.target;
  if(t.id&&t.id.startsWith("p_")){ lerPremissas(); salvar(); render(); return; }
  if(t.dataset.c!==undefined&&t.dataset.m!==undefined){
    const c=t.dataset.c; PLANO[c]=PLANO[c]||{m:Array(NM).fill(0),trat:""};
    PLANO[c].m[+t.dataset.m]=num(t.value); salvar(); leve(); return; }
  if(t.dataset.r!==undefined){ DIM[t.dataset.r]=DIM[t.dataset.r]||{}; DIM[t.dataset.r].rend=num(t.value); salvar(); leve(); return; }
  if(t.dataset.u!==undefined){ DIM[t.dataset.u]=DIM[t.dataset.u]||{}; DIM[t.dataset.u].util=num(t.value)/100; salvar(); leve(); return; }
  if(t.dataset.fs!==undefined){ const f=CFG.funcoes.find(x=>x.cod===t.dataset.fs);
    if(f){ f.sal=num(t.value); const n=destravarNiv(f.cod); n[0].sal=f.sal; if(!num(n[0].qtd)) n[0].qtd=1; }
    salvar(); leve(); return; }
  if(t.dataset.ns!==undefined){ const n=destravarNiv(FUN_SEL); n[+t.dataset.ns].sal=num(t.value); salvar(); leve(); return; }
  if(t.dataset.nq!==undefined){ const n=destravarNiv(FUN_SEL); n[+t.dataset.nq].qtd=num(t.value); salvar(); leve(); return; }
  if(t.id==="in_grat"){ GRAT[FUN_SEL]={tipo:$("#sel_grat_tipo").value, valor:num(t.value)}; salvar(); leve(); return; }
  if(t.dataset.ap!==undefined){ const l=apoioLista()[+t.dataset.ap];
    l[t.dataset.f] = (t.dataset.f==="nome") ? t.value : num(t.value); salvar(); leve(); return; }
  if(t.dataset.apf!==undefined){ APOIO_FIXO[t.dataset.apf]=num(t.value); salvar(); leve(); return; }
  if(t.dataset.tt!==undefined){ TERC_TAR[t.dataset.tt]=num(t.value); salvar(); leve(); return; }
  if(t.dataset.crm!==undefined){ const m=t.dataset.crm;
    CRM[m]=CRM[m]||{}; CRM[m][t.dataset.k]=num(t.value); salvar(); leve(); return; }
  if(t.dataset.fq!==undefined){ const m=t.dataset.fq;
    FROTA[m]=FROTA[m]||{}; FROTA[m].qtd=num(t.value); salvar(); leve(); return; }
  if(t.dataset.fh!==undefined){ const m=t.dataset.fh;
    FROTA[m]=FROTA[m]||{}; FROTA[m].hmes=num(t.value); salvar(); leve(); return; }
  if(t.dataset.tp!==undefined){ const l=tpessLista()[+t.dataset.tp], f=t.dataset.f;
    l[f] = ["rota","veic"].includes(f) ? t.value : num(t.value);
    salvar(); leve(); return; }
  if(t.dataset.in!==undefined){ const i=insLista()[+t.dataset.in], f=t.dataset.f;
    if(f==="prod"){
      const antigo=i.prod, novo=t.value;
      // renomear mantém o vínculo: acompanha tratamentos, preços e estoques
      Object.keys(TRATC).forEach(c=>TRATC[c].forEach(l=>{ if(l.prod===antigo) l.prod=novo; }));
      if(INSUMO[antigo]){ INSUMO[novo]=INSUMO[antigo]; delete INSUMO[antigo]; }
      i.prod=novo;
    } else if(["un","pa","conc"].includes(f)){ i[f]=t.value; }
    else i[f]=num(t.value);
    salvar(); leve(); return; }
  if(t.dataset.mt!==undefined){ const l=matLista()[+t.dataset.mt];
    l[t.dataset.f] = ["preco","qtd"].includes(t.dataset.f) ? num(t.value) : t.value;
    salvar(); leve(); return; }
  if(t.dataset.mx!==undefined){ const c=t.dataset.mx;
    PLANO[c]=PLANO[c]||{m:Array(NM).fill(0),trat:""};
    PLANO[c].mix=PLANO[c].mix||{}; PLANO[c].mix[t.dataset.mo]=num(t.value);
    salvar(); leve(); return; }
  if(t.dataset.ip!==undefined){ INSUMO[t.dataset.ip]=INSUMO[t.dataset.ip]||{}; INSUMO[t.dataset.ip].preco=num(t.value); salvar(); leve(); return; }
  if(t.dataset.ie!==undefined){ INSUMO[t.dataset.ie]=INSUMO[t.dataset.ie]||{}; INSUMO[t.dataset.ie].est=num(t.value); salvar(); leve(); return; }
  if(t.dataset.ex!==undefined){ ESPOR[+t.dataset.ex][t.dataset.f]=t.dataset.f==="valor"?num(t.value):t.value; salvar(); leve(); return; }
  if(t.dataset.td!==undefined){ const c=destravar(TRAT_SEL); c[+t.dataset.td].dose=num(t.value); salvar(); leve(); return; }
  if(t.id==="in_trat_nome"){ TRAT_NOME[TRAT_SEL]=t.value; salvar(); leve(); return; }
  // campo vazio volta ao preço base; null (e não delete) para a limpeza chegar ao servidor no merge
  if(t.dataset.dm!==undefined){ const v=t.value.trim(); DIESEL_MES[t.dataset.dm] = v==="" ? null : num(v);
    salvar(); leve(); return; }
  // selects também disparam "input": os da tabela de arrendamento são tratados no "change"
  if(t.dataset.arr!==undefined && t.tagName==="INPUT"){ const l=arrLista()[+t.dataset.arr], f=t.dataset.f;
    l[f] = ["faz","grupo"].includes(f) ? t.value : num(t.value); salvar(); leve(); return; }
  if(t.dataset.arp!==undefined){ ARR_PAR[t.dataset.arp]=num(t.value); salvar(); leve(); return; }
  if(t.dataset.arrat!==undefined){ ARR_RAT[t.dataset.arrat]=num(t.value); salvar(); leve(); return; }
  if(t.dataset.enc!==undefined){ ENC[t.dataset.enc]=num(t.value); salvar(); leve(); return; }
  if(t.dataset.ben!==undefined){ BEN[t.dataset.ben]=num(t.value); salvar(); leve(); return; }
});
document.addEventListener("change",e=>{
  const t=e.target;
  if(t.dataset.t!==undefined){
    const c=t.dataset.t; PLANO[c]=PLANO[c]||{m:Array(NM).fill(0),trat:""};
    PLANO[c].trat=t.value; salvar(); render(); return; }
  if(t.dataset.ex!==undefined){ ESPOR[+t.dataset.ex][t.dataset.f]=t.value; salvar(); render(); return; }
  if(t.id==="p_fonte"){ lerPremissas(); salvar(); render(); return; }
  if(t.dataset.arr!==undefined && t.tagName==="SELECT"){ const l=arrLista()[+t.dataset.arr];
    l[t.dataset.f] = t.dataset.f==="mes" ? +t.value : t.value; salvar(); render(); return; }
  if(t.id==="arp_criterio"){ ARR_PAR.criterio=t.value; salvar(); render(); return; }
  if(t.id==="sel_trat"){ setTRAT_SEL(t.value); render(); return; }
  if(t.id==="sel_fun"){ setFUN_SEL(t.value); render(); return; }
  if(t.id==="sel_cat"){ setCAT_SEL(t.value); render(); return; }
  if(t.dataset.fc!==undefined){ const c=t.dataset.fc;
    PLANO[c]=PLANO[c]||{m:Array(NM).fill(0),trat:""};
    PLANO[c].fcod=t.value; PLANO[c].fniv=0; salvar(); render(); return; }

  if(t.dataset.fn!==undefined){ const c=t.dataset.fn;
    PLANO[c]=PLANO[c]||{m:Array(NM).fill(0),trat:""};
    PLANO[c].fniv=+t.value; salvar(); render(); return; }
  if(t.dataset.ap!==undefined){ const l=apoioLista()[+t.dataset.ap];
    l[t.dataset.f] = (t.dataset.f==="fniv") ? +t.value : t.value;
    if(t.dataset.f==="fcod") l.fniv=0;
    salvar(); render(); return; }
  if(t.id==="sel_grat_tipo"){ GRAT[FUN_SEL]={tipo:t.value, valor:num($("#in_grat").value)}; salvar(); render(); return; }
});
document.addEventListener("click",e=>{
  const t=e.target;
  if(t.dataset.rm!==undefined){ ESPOR.splice(+t.dataset.rm,1); salvar(); render(); return; }
  if(t.dataset.arrm!==undefined){ const l=arrLista()[+t.dataset.arrm];
    if(!confirm(`Remover "${l.faz}" dos arrendamentos?`)) return;
    arrLista().splice(+t.dataset.arrm,1); salvar(); render(); return; }
  if(t.dataset.tr!==undefined){ const c=destravar(TRAT_SEL); c.splice(+t.dataset.tr,1); salvar(); render(); return; }
  if(t.dataset.aprm!==undefined){ apoioLista().splice(+t.dataset.aprm,1); salvar(); render(); return; }
  if(t.dataset.mtrm!==undefined){ matLista().splice(+t.dataset.mtrm,1); salvar(); render(); return; }
  if(t.dataset.tprm!==undefined){ tpessLista().splice(+t.dataset.tprm,1); salvar(); render(); return; }
  if(t.dataset.inrm!==undefined){
    const i=insLista()[+t.dataset.inrm];
    const usos=tratCodigos().filter(c=>composicao(c).some(l=>l.prod===i.prod));
    if(usos.length && !confirm(`"${i.prod}" é usado em ${usos.length} tratamento(s). Remover assim mesmo?`)) return;
    insLista().splice(+t.dataset.inrm,1); salvar(); render(); return; }
});

$("#btn_add_prod").onclick=()=>{
  const prod=$("#sel_prod").value, dose=num($("#in_dose").value);
  if(!prod||dose<=0){ alert("Escolha um produto e informe uma dose maior que zero."); return; }
  const c=destravar(TRAT_SEL);
  const ja=c.find(l=>l.prod===prod);
  if(ja){ ja.dose=num(ja.dose)+dose; }
  else{
    const base=CFG.trat_det.find(t=>t.prod===prod);
    c.push({prod,dose,un:base?base.un:""});
  }
  salvar(); render();
};

$("#btn_tp_add").onclick=()=>{
  tpessLista().push({rota:"Nova rota",veic:"Veículo",cap:20,qtd:1,kmDia:80,diasMes:26,
                     rsKm:3.50,diaria:90,kmExtra:0,rsKmExtra:4.50});
  salvar(); render();
};
$("#btn_tp_reset").onclick=()=>{
  if(!confirm("Restaurar as rotas padrão de transporte de pessoal?")) return;
  setTPESS(CFG.tpess.map(t=>({...t}))); salvar(); render();
};

$("#btn_ins_add").onclick=()=>{
  insLista().push({prod:"Novo insumo", un:"kg", pa:"", conc:"", est:0, preco:0});
  salvar(); render();
};
$("#btn_ins_reset").onclick=()=>{
  if(!confirm("Restaurar o cadastro original de insumos? Preços e estoques ajustados são mantidos.")) return;
  setINSX(CFG.insumos.map(i=>({...i}))); salvar(); render();
};

$("#btn_mat_add").onclick=()=>{
  matLista().push({cat:"Outros",item:"Novo material",un:"un",preco:0,qtd:0,ap:""});
  salvar(); render();
};
$("#btn_crm_reset").onclick=()=>{
  const itens = Object.keys(CFG.crm).filter(m=>crmDe(m).cat===CAT_SEL);
  if(!itens.some(m=>CRM[m])){ alert("Esta categoria já está com os valores padrão."); return; }
  if(!confirm("Restaurar os valores padrão de "+CAT_SEL+"?")) return;
  itens.forEach(m=>delete CRM[m]); salvar(true); render();
};

$("#btn_ap_add").onclick=()=>{
  const nome=$("#in_ap_nome").value.trim(), maq=$("#sel_ap_maq").value;
  const qtd=num($("#in_ap_qtd").value), h=num($("#in_ap_h").value);
  if(!nome){ alert("Informe o nome do equipamento."); return; }
  if(qtd<=0||h<=0){ alert("Quantidade e horas/mês devem ser maiores que zero."); return; }
  apoioLista().push({nome, maq, qtd, hmes:h, fcod:"F01", fniv:0});
  $("#in_ap_nome").value=""; salvar(); render();
};
$("#btn_ap_reset").onclick=()=>{
  if(!confirm("Restaurar a lista padrão de equipamentos de apoio?")) return;
  setAPOIO(CFG.apoio_eq.map(a=>({...a}))); salvar(); render();
};

$("#btn_niv_reset").onclick=()=>{
  if(!NIV[FUN_SEL] && !GRAT[FUN_SEL]){ alert("Esta função já está com os valores originais."); return; }
  if(!confirm("Restaurar níveis e gratificação de "+FUN_SEL+"?")) return;
  delete NIV[FUN_SEL]; delete GRAT[FUN_SEL]; salvar(true); render();
};

$("#btn_mdo_reset").onclick=()=>{
  if(!Object.keys(ENC).length && !Object.keys(BEN).length){
    alert("Encargos e benefícios já estão com os valores originais."); return; }
  if(!confirm("Restaurar encargos e benefícios aos valores originais?")) return;
  setENC({}); setBEN({}); salvar(true); render();
};

$("#btn_trat_reset").onclick=()=>{
  if(!TRATC[TRAT_SEL]){ alert("Este tratamento já está com a composição original."); return; }
  if(!confirm("Restaurar a composição original de "+TRAT_SEL+"?")) return;
  delete TRATC[TRAT_SEL]; salvar(true); render();
};
$("#btn_diesel_reaj").onclick=()=>{
  const r = num($("#in_diesel_reaj").value)/100;
  MESES.forEach((m,i)=>{ DIESEL_MES[i] = +(P.diesel*Math.pow(1+r,i)).toFixed(4); });
  salvar(); render();
};
$("#btn_arr_add").onclick=()=>{
  arrLista().push({faz:"Nova fazenda", grupo:"", area:0, forma:"rsha", qtd:0, pag:"Anual", mes:0});
  salvar(); render();
};
$("#btn_arr_rat_reset").onclick=()=>{
  if(!confirm("Restaurar os percentuais de referência do rateio por etapa?")) return;
  // null (e não apagar a chave) para a limpeza chegar ao servidor no merge
  ETAPAS_ORD.forEach(e=>{ ARR_RAT[e]=null; });
  salvar(); render();
};
$("#btn_diesel_base").onclick=()=>{
  if(!confirm("Usar o preço base das Premissas em todos os meses?")) return;
  MESES.forEach((m,i)=>{ DIESEL_MES[i] = null; });
  salvar(); render();
};

