import { MESES, NM, PERIODOS, periodoMes } from '../nucleo/calendario.js';
import { calcular } from '../calculo/index.js';
import { fornCalc } from '../calculo/fornecedores.js';
import { pessoasCalc } from '../calculo/pessoas.js';
import { CFG } from '../dados/cfg.js';
import { MESES_SEL, P, PERIODO_SEL } from '../nucleo/estado.js';
import { $, brl, fmt } from '../nucleo/formato.js';
import { pintarAdm } from '../ui/administrativo.js';
import { pintarAgrofitModal } from '../ui/agrofit.js';
import { pintarApoio } from '../ui/apoio.js';
import { pintarAtividadesCad } from '../ui/atividades-cad.js';
import { pintarFito } from '../ui/fitossanitario.js';
import { pintarArrend } from '../ui/arrendamentos.js';
import { pintarCapa } from '../ui/capa.js';
import { pintarCombustivel } from '../ui/combustivel.js';
import { pintarConfig } from '../ui/configuracoes.js';
import { pintarContas } from '../ui/contas.js';
import { pintarCustos } from '../ui/custos.js';
import { pintarBasesPremissas } from '../ui/premissas.js';
import { pintarDim } from '../ui/dimensionamento.js';
import { pintarCRM } from '../ui/frota.js';
import { pintarReforma } from '../ui/reforma.js';
import { pintarForn } from '../ui/fornecedores.js';
import { pintarInsumos } from '../ui/insumos.js';
import { pintarIrrig } from '../ui/irrigacao.js';
import { pintarMDO } from '../ui/mao-de-obra.js';
import { pintarPainel } from '../ui/painel.js';
import { pintarPessoas } from '../ui/pessoas.js';
import { pintarPlano, pintarTercDet } from '../ui/plano.js';
import { pintarRastro } from '../ui/rastro.js';
import { pintarRendMensal } from '../ui/rendmensal.js';
import { pintarDimDetalhe } from '../ui/dimensionamento.js';
import { pintarFichaIns, pintarEditIns } from '../ui/insumos.js';
import { pintarResumoFrota } from '../ui/resumo-frota.js';
import { pintarTPess } from '../ui/transporte-pessoal.js';
import { pintarTransp } from '../ui/transporte.js';
import { pintarValida } from '../ui/validacao.js';
import { pintarAcomp } from '../ui/acompanhamento.js';
import { aplicarPermissoes } from '../ui/permissoes.js';
import { habilitarReordenacao, reaplicarBuscas, reaplicarExportar } from '../ui/componentes.js';

/* Toda tabela que ganha busca por nome (ui/*.js, via .tbl-busca no index.html)
   tambem ganha coluna arrastavel — mesmo criterio, mesmo lugar. Fora daqui só
   grade de mês (coluna É o mês, arrastar não faz sentido) e as tabelas fixas
   de comparação. #t_plano tranca as 2 primeiras colunas (fixas:2): são as que
   ficam coladas na rolagem horizontal (ver componentes.css), então não podem
   trocar de posição sem quebrar o freeze. */
const TABELAS_REORDENAVEIS = [
  ['#t_enc',0], ['#t_ben',0], ['#t_fun',0], ['#t_ind',0], ['#t_plano',2],
  ['#t_dim',0], ['#t_dim_frotames',0], ['#t_rf_base',0], ['#t_apoio',0],
  ['#t_pes_quadro',0], ['#t_apoio_eq',0], ['#t_crm',0], ['#t_maq',0],
  ['#t_ref_resumo',0], ['#t_tp',0],
  ['#t_ins',0], ['#t_comp',0], ['#t_trat',0], ['#t_mat',0],
  ['#t_forn',0], ['#t_forn_qual',0], ['#t_arr',0], ['#t_adm',0],
  ['#t_esp',0], ['#t_contas',0], ['#t_tarifa',0], ['#t_terc',0], ['#t_comb_maq',0],
  ['#t_rf_oper',0], ['#t_rf_apoio',0], ['#t_rf_tpess',0],
  ['#t_pes_dept',0], ['#t_pes_fun',0], ['#t_pes_det',0],
  ['#t_acomp_exc',0], ['#t_crit_mes',0], ['#t_meta_agricola',0], ['#t_meta_logistica',0],
  ['#t_meta_manut',0], ['#t_acomp',0], ['#t_val',0],
];
function reaplicarTabelas(){
  reaplicarBuscas();
  TABELAS_REORDENAVEIS.forEach(([id,fixas])=>habilitarReordenacao(id,fixas));
  // botao de exportar (CSV/Excel/PDF): generico, sem lista curada — pega toda
  // <table id> do documento, mesmo criterio de reaplicarBuscas() acima
  reaplicarExportar();
}

/* Recorte do periodo escolhido na barra superior.
   So decompoe o que o motor ja produz mes a mes -- custo mensal, naturezas por
   mes, etapas por mes. Numero que nao tem serie mensal continua sendo do ano,
   e a tela que o mostra nao muda. Com "Ano todo" o recorte e o proprio ano,
   entao nada se altera. */
function recorteDoPeriodo(R){
  const p = PERIODO_SEL;
  // "meses" e a escolha manual. Selecao vazia nao filtra nada: seria uma tela de
  // zeros sem nada que explicasse o motivo, pior do que ignorar o filtro.
  const escolhidos = MESES_SEL.filter(i=>i>=0 && i<NM);
  const manual = p==="meses" && escolhidos.length>0;
  const parcial = p==="safra" || p==="entressafra" || manual;
  const meses = MESES.map((m,i)=>i).filter(i=>
    !parcial ? true : manual ? escolhidos.includes(i) : periodoMes(i)===p);
  const soma = arr => !arr ? 0 : meses.reduce((s,i)=>s+(+arr[i]||0), 0);
  const porChave = obj => Object.fromEntries(Object.entries(obj||{}).map(([k,a])=>[k, soma(a)]));
  return {
    periodo: p, parcial, meses, manual,
    rotulo: manual ? rotuloDosMeses(meses) : parcial ? PERIODOS[p] : "Ano todo",
    total: parcial ? soma(R.meses) : R.total,
    cat:   parcial ? porChave(R.mesesCat) : null,
    etapa: parcial && R.etapaMes ? porChave(R.etapaMes) : null,
    fracaoDoAno: parcial ? meses.length/NM : 1,
    // fixo e variável do período pela série mensal: administrativo e
    // depreciação são iguais todo mês, o arrendamento segue os pagamentos.
    // A fração proporcional do ano deixava variável + fixo diferente do total
    // do período (R$ 6 mi no teste), porque o custo não cai proporcional.
    fixo:     parcial ? soma(R.mesesCat.fixo) + soma(R.mesesCat.arrend) : R.fixoT,
    variavel: parcial ? soma(R.meses) - soma(R.mesesCat.fixo) - soma(R.mesesCat.arrend) : R.variavel,
    // parcela do custo do ano que cai no periodo; o fixo e uniforme por mes,
    // entao o que sobra do total do periodo e o variavel
    fracaoCusto: parcial && R.total>0 ? soma(R.meses)/R.total : 1,
  };
}

/* Nome do recorte manual. Meses seguidos viram intervalo ("Abr/26 a Jun/26"),
   que e como se fala deles numa reuniao; salteados viram a contagem, porque
   listar sete rotulos no cabecalho nao caberia. */
function rotuloDosMeses(meses){
  if(!meses.length) return "Ano todo";
  if(meses.length === 1) return MESES[meses[0]];
  const seguidos = meses.every((v,k)=> k===0 || v === meses[k-1]+1);
  return seguidos ? `${MESES[meses[0]]} a ${MESES[meses[meses.length-1]]}`
                  : `${meses.length} meses escolhidos`;
}

/* ---------- CICLO ---------- */
function calcularCompleto(){
  const R=calcular();
  R.efetivoTotal = R.L.reduce((s,r)=>s+r.efetivo,0)
    + CFG.indiretos.reduce((s,i)=>s+i.qtd,0) + R.EM.efetivo
    + Math.ceil(R.TR.frota*R.MP.fatorEscala);
  R.SEL = recorteDoPeriodo(R);
  R.PS = pessoasCalc(R);
  // matéria-prima depende do custo do plano, por isso vem depois de calcular()
  R.FORN = fornCalc(R);
  return R;
}
/* Esconde as colunas dos meses que ficaram de fora do recorte.
   Uma regra de CSS so, escrita num <style> proprio, em vez de percorrer as
   tabelas marcando celula por celula: vale para toda tabela mensal, inclusive
   as que forem redesenhadas depois, e nao depende da aba aberta -- quem troca de
   aba com um recorte ativo encontra a proxima tela ja filtrada. */
function esconderMeses(visiveis){
  let el = document.getElementById("css_meses");
  if(!el){ el = document.createElement("style"); el.id = "css_meses"; document.head.appendChild(el); }
  const fora = MESES.map((m,i)=>i).filter(i=>!visiveis.includes(i));
  el.textContent = fora.length ? fora.map(i=>".m"+i).join(",")+"{display:none}" : "";
}
function render(){
  const R=calcularCompleto();
  $("#c_muda").value=fmt(R.muda)+" t"; $("#c_viveiro").value=fmt(R.viveiro)+" ha";
  pintarBasesPremissas(R);
  $("#c_capTransb").value=fmt(P.capTransb,1)+" t/viagem";
  $("#c_adm").value=brl(R.ADM.mensal)+"/mês";
  $("#c_arr_ha").value=fmt(R.AR.area)+" ha";
  $("#c_arr").value=R.AR.area>0?brl(R.AR.anual/R.AR.area,2):"—";
  document.querySelectorAll("#per_sel [data-periodo]").forEach(b=>
    b.classList.toggle("on", b.dataset.periodo===PERIODO_SEL));
  esconderMeses(R.SEL.meses);
  pintarCapa(R); pintarMDO(R); pintarPlano(R); pintarDim(R); pintarTransp(R); pintarApoio(R); pintarCRM(R); pintarReforma(); pintarTPess(R);
  pintarIrrig(R); pintarInsumos(R); pintarFito(R); pintarArrend(R); pintarForn(R); pintarAdm(R); pintarCustos(R); pintarContas(R); pintarCombustivel(R); pintarResumoFrota(R); pintarPessoas(R);
  pintarPainel(R); pintarValida(R); pintarAcomp(R); pintarRastro(R); pintarRendMensal(R); pintarDimDetalhe(R); pintarConfig(); pintarAtividadesCad(); pintarFichaIns(); pintarEditIns(); pintarAgrofitModal(); pintarTercDet();
  // depois dos pintores: eles recriam a tabela do zero a cada render(), entao busca
  // e ordem de coluna (que vivem so no DOM) precisam ser reaplicadas por cima; a
  // trava de perfil roda por ultimo porque precisa valer sobre os controles novos
  reaplicarTabelas();
  aplicarPermissoes();
}
/* O rastro se redesenha sozinho: render() inteiro custa ~500 ms porque refaz as
   22 abas, e abrir ou descer um nível não muda nenhuma delas. Só o modal, ~8 ms.
   O mesmo vale pro modal de rendimento mensal: abrir/fechar não muda nenhuma aba. */
function renderRastro(){ pintarRastro(calcularCompleto()); }
function renderRendMensal(){ pintarRendMensal(calcularCompleto()); aplicarPermissoes(); }
/* A ficha nao muda numero nenhum: abrir e fechar so pinta o modal, em vez de
   refazer as 24 abas -- o mesmo criterio do rastro e do rendimento mensal. */
function renderFichaIns(){ pintarFichaIns(); aplicarPermissoes(); }
/* Abrir, trocar de bloco e fechar o detalhe nao mudam numero nenhum: redesenha
   so o modal, nao as 24 abas. Mesmo criterio do rastro e do rendimento mensal. */
function renderDimDet(){ pintarDimDetalhe(calcularCompleto()); aplicarPermissoes(); }
/* Abrir/fechar o modal de editar produto nao muda nenhum numero do plano, mas
   precisa repintar a aba Insumos tambem (nao so o modal): e a propria tabela
   quem trava a linha do produto em edicao (mesmo data-in/data-ie/data-ip do
   modal — dois campos iguais na tela ao mesmo tempo confundiam o foco a cada
   tecla). calcularCompleto() e barato; o caro e repintar as 22 abas, e so a
   de Insumos precisa mudar aqui — mesmo criterio do rastro e do rendimento
   mensal, só que com uma aba a mais. */
function renderEditIns(){ pintarInsumos(calcularCompleto()); pintarEditIns(); aplicarPermissoes(); }
/* Mesmo criterio: abrir/fechar o modal de busca na Agrofit, ou trocar de
   candidato, nao muda nenhum numero do plano. */
function renderAgrofit(){ pintarAgrofitModal(); aplicarPermissoes(); }
/* Idem: abrir/fechar o detalhamento do terceiro por sub-modo nao muda nenhum
   numero — so os campos digitados dentro dele passam por salvar()/leve(). */
function renderTercDet(){ pintarTercDet(); aplicarPermissoes(); }

// atualização leve: recalcula tudo mas preserva o foco de quem está digitando
let leveTimer=null;
function leve(){
  clearTimeout(leveTimer);
  leveTimer=setTimeout(()=>{
    const foco=document.activeElement;
    const ehInput = foco && foco.tagName==="INPUT";
    // identifica pelo id quando existe; só cai no dataset para os campos de tabela
    const k   = ehInput ? (foco.id || JSON.stringify(foco.dataset)) : null;
    const sel = ehInput ? foco.selectionStart : null;
    const txt = ehInput ? foco.value : null;
    // Abas diferentes podem gerar campos com o mesmo dataset (Irrigação e Plano
    // usam data-c/data-m para a mesma área). Procurar no documento inteiro
    // achava primeiro o da aba escondida, o focus() falhava em silêncio e o
    // cursor sumia no meio da digitação. Procura primeiro na aba de origem.
    const abaId = ehInput ? (foco.closest("section[id]")||{}).id : null;
    render();
    if(k){
      const mesmo = i=>(i.id || JSON.stringify(i.dataset))===k;
      const aba = abaId ? document.getElementById(abaId) : null;
      const novo=(aba && [...aba.querySelectorAll("input")].find(mesmo))
        || [...document.querySelectorAll("input")].find(mesmo);
      if(novo){
        // preserva exatamente o que estava digitado: reformatar no meio da digitação
        // fazia o número aparentar "voltar ao original" e a alteração se perder
        if(txt!=null && novo.value!==txt) novo.value=txt;
        novo.focus(); try{novo.setSelectionRange(sel,sel);}catch(err){}
      }
    }
  },260);
}


export { calcularCompleto, leve, leveTimer, render, renderAgrofit, renderDimDet, renderEditIns, renderFichaIns, renderRastro, renderRendMensal, renderTercDet };
