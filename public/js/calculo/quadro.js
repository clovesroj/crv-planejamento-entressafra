import { FUNCIONARIOS_BASE } from '../dados/funcionarios-base.js';

/* ================== QUADRO ATIVO ==================
   Consolida a base de pessoal do ERP por função do dimensionamento.
   Afastados e desistentes contam no quadro da empresa, mas não entram como
   disponíveis para a operação; cargo sem função equivalente no plano
   (supervisão, coordenação, gerência, administrativo, motorista de ônibus)
   fica à parte, para o total do ERP continuar conferindo. */

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
