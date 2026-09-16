import { FUNCIONARIOS_BASE } from '../dados/funcionarios-base.js';

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

export { quadroBase };
