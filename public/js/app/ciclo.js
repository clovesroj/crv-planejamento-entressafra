import { calcular } from '../calculo/index.js';
import { fornCalc } from '../calculo/fornecedores.js';
import { pessoasCalc } from '../calculo/pessoas.js';
import { CFG } from '../dados/cfg.js';
import { P } from '../nucleo/estado.js';
import { $, brl, fmt } from '../nucleo/formato.js';
import { pintarAdm } from '../ui/administrativo.js';
import { pintarApoio } from '../ui/apoio.js';
import { pintarArrend } from '../ui/arrendamentos.js';
import { pintarCapa } from '../ui/capa.js';
import { pintarCombustivel } from '../ui/combustivel.js';
import { pintarContas } from '../ui/contas.js';
import { pintarCustos } from '../ui/custos.js';
import { pintarDim } from '../ui/dimensionamento.js';
import { pintarCRM } from '../ui/frota.js';
import { pintarReforma } from '../ui/reforma.js';
import { pintarForn } from '../ui/fornecedores.js';
import { pintarInsumos } from '../ui/insumos.js';
import { pintarIrrig } from '../ui/irrigacao.js';
import { pintarMDO } from '../ui/mao-de-obra.js';
import { pintarPainel } from '../ui/painel.js';
import { pintarPessoas } from '../ui/pessoas.js';
import { pintarPlano } from '../ui/plano.js';
import { pintarRastro } from '../ui/rastro.js';
import { pintarResumoFrota } from '../ui/resumo-frota.js';
import { pintarTPess } from '../ui/transporte-pessoal.js';
import { pintarTransp } from '../ui/transporte.js';
import { pintarValida } from '../ui/validacao.js';

/* ---------- CICLO ---------- */
function calcularCompleto(){
  const R=calcular();
  R.efetivoTotal = R.L.reduce((s,r)=>s+r.efetivo,0)
    + CFG.indiretos.reduce((s,i)=>s+i.qtd,0) + R.EM.efetivo
    + Math.ceil(R.TR.frota*R.MP.fatorEscala);
  R.PS = pessoasCalc(R);
  // matéria-prima depende do custo do plano, por isso vem depois de calcular()
  R.FORN = fornCalc(R);
  return R;
}
function render(){
  const R=calcularCompleto();
  $("#c_muda").value=fmt(R.muda)+" t"; $("#c_viveiro").value=fmt(R.viveiro)+" ha";
  $("#c_capTransb").value=fmt(P.capTransb,1)+" t/viagem";
  $("#c_adm").value=brl(R.ADM.mensal)+"/mês";
  $("#c_arr_ha").value=fmt(R.AR.area)+" ha";
  $("#c_arr").value=R.AR.area>0?brl(R.AR.anual/R.AR.area,2):"—";
  pintarCapa(R); pintarMDO(R); pintarPlano(R); pintarDim(R); pintarTransp(R); pintarApoio(R); pintarCRM(R); pintarReforma(); pintarTPess(R);
  pintarIrrig(R); pintarInsumos(R); pintarArrend(R); pintarForn(R); pintarAdm(R); pintarCustos(R); pintarContas(R); pintarCombustivel(R); pintarResumoFrota(R); pintarPessoas(R);
  pintarPainel(R); pintarValida(R); pintarRastro(R);
}
/* O rastro se redesenha sozinho: render() inteiro custa ~500 ms porque refaz as
   22 abas, e abrir ou descer um nível não muda nenhuma delas. Só o modal, ~8 ms. */
function renderRastro(){ pintarRastro(calcularCompleto()); }

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
    render();
    if(k){
      const novo=[...document.querySelectorAll("input")]
        .find(i=>(i.id || JSON.stringify(i.dataset))===k);
      if(novo){
        // preserva exatamente o que estava digitado: reformatar no meio da digitação
        // fazia o número aparentar "voltar ao original" e a alteração se perder
        if(txt!=null && novo.value!==txt) novo.value=txt;
        novo.focus(); try{novo.setSelectionRange(sel,sel);}catch(err){}
      }
    }
  },260);
}


export { calcularCompleto, leve, leveTimer, render, renderRastro };
