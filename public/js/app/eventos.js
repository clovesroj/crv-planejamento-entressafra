import { ETAPAS_ORD } from '../calculo/arrendamento.js';
import { AG_SEM_FROTA, FROTA_AG, FROTA_ESP, SEP_MOD, crmDe, espDe } from '../calculo/crm.js';
import { composicao, destravar, tratCodigos } from '../calculo/insumos.js';
import { destravarNiv } from '../calculo/mao-de-obra.js';
import { CFG } from '../dados/cfg.js';
import { salvar } from '../io/persistencia.js';
import { MESES, NM } from '../nucleo/calendario.js';
import { APOIO, APOIO_FIXO, ARR_PAR, ARR_RAT, BEN, CAT_SEL, CRM, CRM_ESP, DIESEL_MES, DIM, ENC, ESPOR, FROTA, FUN_SEL, GRAT, INSUMO, INSX, NIV, P, PLANO, QUADRO, TERC_TAR, TPESS, TRATC, TRAT_NOME, TRAT_SEL, FORN_PAR, apoioLista, arrLista, fornLista, insLista, matLista, tpessLista } from '../nucleo/estado.js';
import { FROTA_ABERTO, FROTA_UN, MAQ, setFROTA_DEST, setFROTA_ORIG } from '../nucleo/estado.js';
import { $, num } from '../nucleo/formato.js';
import { aplicarFiltroPlano } from '../ui/plano.js';
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
  if(t.dataset.crmesp!==undefined){ const e=t.dataset.crmesp;
    CRM_ESP[e]=CRM_ESP[e]||{}; CRM_ESP[e][t.dataset.k]=num(t.value); salvar(); leve(); return; }
  if(t.dataset.ref!==undefined){ const c=t.dataset.ref;
    FROTA_UN[c]=FROTA_UN[c]||{}; FROTA_UN[c].ref=FROTA_UN[c].ref||{};
    // campo vazio some do documento em vez de virar zero gravado
    if(t.value.trim()==="") delete FROTA_UN[c].ref[t.dataset.c];
    else FROTA_UN[c].ref[t.dataset.c]=num(t.value);
    salvar(); leve(); return; }
  if(t.dataset.uncrm!==undefined){ const c=t.dataset.uncrm;
    FROTA_UN[c]=FROTA_UN[c]||{}; FROTA_UN[c].crm=FROTA_UN[c].crm||{};
    // campo vazio volta a herdar da especialidade, entao apaga em vez de gravar zero
    if(t.value.trim()==="") delete FROTA_UN[c].crm[t.dataset.k];
    else FROTA_UN[c].crm[t.dataset.k]=num(t.value);
    salvar(); leve(); return; }
  if(t.dataset.maq!==undefined){ const m=t.dataset.maq;
    MAQ[m]=MAQ[m]||{}; MAQ[m][t.dataset.k]=num(t.value); salvar(); render(); return; }
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
  // selects da tabela de fornecedores sao tratados no "change"; aqui so os campos digitados
  if(t.dataset.fnr!==undefined && t.tagName==="INPUT"){ const l=fornLista()[+t.dataset.fnr], f=t.dataset.f;
    l[f] = ["forn","prop"].includes(f) ? t.value : num(t.value); salvar(); leve(); return; }
  if(t.dataset.fnp!==undefined){ FORN_PAR[t.dataset.fnp]=num(t.value); salvar(); leve(); return; }
  // quadro de pessoal por funcao: ativo, ferias e demissoes programadas
  if(t.dataset.qd!==undefined){ const f=t.dataset.qd;
    QUADRO[f]=QUADRO[f]||{}; QUADRO[f][t.dataset.f]=num(t.value); salvar(); leve(); return; }
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
  if(t.dataset.fnr!==undefined){ const l=fornLista()[+t.dataset.fnr], f=t.dataset.f;
    l[f] = ["entIni","entFim"].includes(f) ? +t.value : t.value;
    // o fim da entrega nunca fica antes do inicio
    if(f==="entIni" && +l.entFim < +l.entIni) l.entFim = l.entIni;
    if(f==="entFim" && +l.entFim < +l.entIni) l.entIni = l.entFim;
    salvar(); render(); return; }
  if(t.id==="sel_plano_mes"){ aplicarFiltroPlano(t.value); return; }
  if(t.id==="sel_trat"){ setTRAT_SEL(t.value); render(); return; }
  if(t.id==="sel_fun"){ setFUN_SEL(t.value); render(); return; }
  if(t.id==="sel_cat"){ setCAT_SEL(t.value); render(); return; }
  if(t.id==="sel_orig"){ setFROTA_ORIG(t.value); render(); return; }
  if(t.id==="sel_dest"){ setFROTA_DEST(t.value); render(); return; }
  if(t.dataset.undest!==undefined){ const c=t.dataset.undest;
    FROTA_UN[c]=FROTA_UN[c]||{}; FROTA_UN[c].st=t.value; salvar(); render(); return; }
  if(t.dataset.fc!==undefined){ const c=t.dataset.fc;
    PLANO[c]=PLANO[c]||{m:Array(NM).fill(0),trat:""};
    PLANO[c].fcod=t.value; PLANO[c].fniv=0; salvar(); render(); return; }

  // nivel da funcao e escala escolhidos no dimensionamento de pessoas, por atividade
  if(t.dataset.niv!==undefined){ const c=t.dataset.niv;
    PLANO[c]=PLANO[c]||{m:Array(NM).fill(0),trat:""};
    PLANO[c].fniv=+t.value; salvar(); render(); return; }
  if(t.dataset.tur!==undefined){ const c=t.dataset.tur;
    DIM[c]=DIM[c]||{}; DIM[c].turnos=t.value==="" ? null : +t.value; salvar(); render(); return; }
  if(t.dataset.esc!==undefined){ const c=t.dataset.esc;
    DIM[c]=DIM[c]||{}; DIM[c].esc=t.value; salvar(); render(); return; }
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
  const ab = e.target.closest && e.target.closest("[data-abrefrota]");
  if(ab){ const k = ab.dataset.abrefrota;
    // abrir a lista de unidades e visao, nao dado: nao passa por salvar()
    if(FROTA_ABERTO[k]) delete FROTA_ABERTO[k]; else FROTA_ABERTO[k]=true;
    render(); return; }
  const t=e.target;
  if(t.dataset.rm!==undefined){ ESPOR.splice(+t.dataset.rm,1); salvar(); render(); return; }
  if(t.dataset.arrm!==undefined){ const l=arrLista()[+t.dataset.arrm];
    if(!confirm(`Remover "${l.faz}" dos arrendamentos?`)) return;
    arrLista().splice(+t.dataset.arrm,1); salvar(); render(); return; }
  if(t.dataset.fnrm!==undefined){ const l=fornLista()[+t.dataset.fnrm];
    if(!confirm(`Remover "${l.forn}" dos fornecedores?`)) return;
    fornLista().splice(+t.dataset.fnrm,1); salvar(); render(); return; }
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
  const esps = FROTA_AG[CAT_SEL] || [];
  // itens do agrupamento: modelos da base mais os arquétipos cuja especialidade é dele
  const itens = [...new Set([
    ...esps.flatMap(e=>(FROTA_ESP[e].mods||[]).map(m=>e+SEP_MOD+m.m)),
    ...Object.keys(CFG.crm).filter(m=>{ const e=espDe(m);
      return CAT_SEL===AG_SEM_FROTA ? !e : (e && FROTA_ESP[e] && FROTA_ESP[e].ag===CAT_SEL); })
  ])];
  const sujos = itens.filter(m=>CRM[m]).length + esps.filter(e=>CRM_ESP[e]).length;
  if(!sujos){ alert("Este agrupamento já está com os valores padrão."); return; }
  if(!confirm("Restaurar os valores padrão de "+CAT_SEL+"? Isso apaga as taxas por especialidade e por modelo deste agrupamento.")) return;
  itens.forEach(m=>delete CRM[m]); esps.forEach(e=>delete CRM_ESP[e]);
  salvar(true); render();
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

/* ---------- teclado no Plano Operacional ----------
   As celulas de mes andam como numa planilha: cima e baixo sempre trocam de
   linha; esquerda e direita so trocam de coluna quando o cursor ja esta na
   ponta do texto, para nao atrapalhar a edicao do numero; Enter desce. Tab
   segue sendo do navegador, que ja pula sozinho as colunas escondidas pelo
   filtro. Colunas escondidas sao ignoradas pelo teste de offsetParent. */
const visivelPlano = el => el && el.offsetParent !== null;
document.addEventListener("keydown", e=>{
  const t = e.target;
  if(!(t.tagName==="INPUT" && t.dataset.c!==undefined && t.dataset.m!==undefined)) return;
  if(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  if(!["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Enter"].includes(e.key)) return;
  if(e.key==="ArrowRight" && t.selectionStart < t.value.length) return;
  if(e.key==="ArrowLeft"  && t.selectionStart > 0) return;
  let alvo = null;
  if(e.key==="ArrowLeft" || e.key==="ArrowRight"){
    const passo = e.key==="ArrowRight" ? 1 : -1;
    for(let j=(+t.dataset.m)+passo; j>=0 && j<NM; j+=passo){
      const c = document.querySelector(`#t_plano input[data-c="${t.dataset.c}"][data-m="${j}"]`);
      if(visivelPlano(c)){ alvo = c; break; }
    }
  }else{
    const coluna = [...document.querySelectorAll(`#t_plano input[data-m="${t.dataset.m}"]`)].filter(visivelPlano);
    alvo = coluna[coluna.indexOf(t) + (e.key==="ArrowUp" ? -1 : 1)];
  }
  if(alvo){ e.preventDefault(); alvo.focus(); alvo.select(); }
});
