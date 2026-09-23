import { FUNCIONARIOS_BASE } from '../dados/funcionarios-base.js';
import { QUADRO } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';

/* ================== QUADRO ATIVO ==================
   Consolida a base de pessoal do ERP por função do dimensionamento.
   Cada cargo do ERP virou função do plano, então todo ativo cai numa função.
   Afastados e desistentes contam no quadro da empresa, mas não entram como
   disponíveis para a operação — por isso ficam à parte, e o total do ERP
   continua conferindo. */

function quadroBase(){
  const porFuncao = {};
  let semFuncao = 0, afastados = 0, total = 0;
  FUNCIONARIOS_BASE.forEach(l=>{
    total += l.qtd;
    if(l.afast){ afastados += l.qtd; return; }
    if(!l.fcod){ semFuncao += l.qtd; return; }
    porFuncao[l.fcod] = (porFuncao[l.fcod]||0) + l.qtd;
  });
  const mapeado = Object.values(porFuncao).reduce((s,v)=>s+v,0);
  return {porFuncao, semFuncao, afastados, mapeado, total, linhas:FUNCIONARIOS_BASE};
}

/* Quadro ativo de uma funcao: o ajuste digitado na tela manda; em branco,
   vale o que veio do ERP. Mora aqui, e nao numa tela, porque duas telas
   precisam da mesma resposta -- o quadro por funcao no Resumo de Pessoas e o
   bloco de pessoas do detalhe da atividade, no Dimensionamento. */
function ajusteQuadro(f){
  const v = (QUADRO[f] || {}).ativo;
  return v != null && v !== "" ? num(v) : null;
}
function ativoDe(f, base){
  const v = ajusteQuadro(f);
  return v != null ? v : ((base.porFuncao || {})[f] || 0);
}

export { ajusteQuadro, ativoDe, quadroBase };
