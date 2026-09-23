/* ================== QUADRO ADM E OFICINA: PREVISTO × REALIZADO ==================
   A leitura do Painel das planilhas de justificativa da folha (controladoria),
   com o mesmo método, para o quadro que o plano usa (calculo/quadro-fixo.js):

     Efeito quantidade = (Qtde prevista − Qtde realizada no ano anterior)
                         × salário médio realizado da função no ano anterior
                         (função sem realizado usa o salário médio previsto)
     Efeito salário    = (salário médio previsto − salário médio realizado)
                         × Qtde prevista
     Efeito quantidade + efeito salário = Δ folha

   calculado por mês × departamento × função e somado para cima. "Realizado"
   é sempre o do mesmo mês no ano anterior (dez/25 a mar/26) -- a planilha
   chama de AA; aqui o título diz por extenso. "Média" é a média mensal dos meses
   lançados no plano (dez/26 a mar/27). */
import { QUADRO_MESES_LANC } from '../dados/quadro-fixo.js';
import { MESES } from '../nucleo/calendario.js';

// os meses lançados no plano: dez/26 a mar/27
const mesesPlanilha = () => QUADRO_MESES_LANC.slice();

// métricas de uma linha (função num departamento) num mês i do ano do app
function linhaMes(l, i){
  const qa = +l.realQ[i]||0, va = +l.realV[i]||0;
  // nos meses lançados a linha do quadro é a da planilha (quadro-fixo.js)
  const qp = +l.qtdMes[i]||0, vp = +l.folhaMes[i]||0;
  const sa = qa>0 ? va/qa : 0, sp = qp>0 ? vp/qp : 0;
  const efQ = (qp-qa) * (qa>0 ? sa : sp);
  const efS = qp>0 && qa>0 ? (sp-sa)*qp : 0;
  return {qa, qp, va, vp, efQ, efS, cp: +l.custoMes[i]||0};   // cp: custo no plano
}
// soma de métricas e leitura (salário médio, variação, fator principal)
function fechar(o){
  o.dq = o.qp - o.qa; o.dv = o.vp - o.va; o.pct = o.va ? o.dv/o.va : 0;
  o.sa = o.qa>0 ? o.va/o.qa : 0; o.sp = o.qp>0 ? o.vp/o.qp : 0; o.dsal = o.sa>0 && o.sp>0 ? o.sp/o.sa - 1 : 0;
  o.fator = !o.qa && !o.qp ? "" : !o.qp ? "Sem previsto" : !o.qa ? "Nova no previsto"
    : Math.abs(o.efQ) >= Math.abs(o.efS) ? (o.efQ>=0 ? "Aumento de quadro" : "Redução de quadro")
    : (o.efS>=0 ? "Aumento salarial" : "Redução salarial");
  return o;
}
const vazio = () => ({qa:0, qp:0, va:0, vp:0, efQ:0, efS:0, cp:0});
const somar = (a, b, f=1) => { a.qa+=b.qa*f; a.qp+=b.qp*f; a.va+=b.va*f; a.vp+=b.vp*f; a.efQ+=b.efQ*f; a.efS+=b.efS*f; a.cp+=b.cp*f; return a; };

/* grupo: "todos" | "adm" | "oficina"; mes: índice do ano do app ou "media" */
function comparativoQuadro(QF, grupo, mes){
  const linhas = (QF.linhas||[]).filter(l=>grupo==="todos" || l.grupo===grupo);
  const idx = mes==="media" ? mesesPlanilha() : [mes];
  const f = 1/idx.length;
  const deps = {}, funs = {};
  linhas.forEach(l=>{
    const m = vazio(); idx.forEach(i=>somar(m, linhaMes(l, i), f));
    if(!m.qa && !m.qp && !m.va && !m.vp) return;
    const d = deps[l.depto] = deps[l.depto] || {nome:l.depto, dcod:l.dcod, grupo:l.grupo, ...vazio(), filhas:[]};
    somar(d, m); d.filhas.push(fechar({nome:l.fnome, fcod:l.fcod, ...m}));
    const fu = funs[l.fnome] = funs[l.fnome] || {nome:l.fnome, fcod:l.fcod, ...vazio()};
    somar(fu, m);
  });
  const departamentos = Object.values(deps).map(d=>{ d.filhas.sort((a,b)=>Math.abs(b.dv)-Math.abs(a.dv)); return fechar(d); })
    .sort((a,b)=> (a.grupo===b.grupo ? 0 : a.grupo==="adm" ? -1 : 1) || String(a.dcod).localeCompare(String(b.dcod)));
  const funcoes = Object.values(funs).map(fechar).sort((a,b)=>Math.abs(b.dv)-Math.abs(a.dv));
  const total = fechar(departamentos.reduce((t,d)=>somar(t,d), vazio()));
  // evolução mensal: um mês por linha, e a média
  const evolucao = mesesPlanilha().map(i=>{
    const t = vazio(); linhas.forEach(l=>somar(t, linhaMes(l, i)));
    return fechar({i, mes:MESES[i], ...t});
  });
  const media = fechar(evolucao.reduce((t,e)=>somar(t,e,1/evolucao.length), vazio()));
  return {departamentos, funcoes, total, evolucao, media, meses: mesesPlanilha()};
}

/* Títulos das colunas, na ordem de colsQuadro (tela) e colsQF (relatório):
   um lugar só, para a tela e o relatório dizerem a mesma coisa. */
const COLUNAS_QUADRO = [
  "Qtde realizada (ano anterior)", "Qtde prevista", "Δ Qtde (prevista − ano anterior)",
  "Salário médio realizado (ano anterior)", "Salário médio previsto", "Δ Salário médio",
  "Folha realizada (ano anterior)", "Folha prevista", "Δ Folha (R$)", "Δ Folha (%)",
  "Efeito quantidade (R$)", "Efeito salário (R$)", "Fator principal", "Custo no plano"];
// "Fev/27" -> "Fev/26": o mês do ano anterior com que o realizado compara
const mesAnoAnterior = rot => String(rot||"").replace(/(\d{2})$/, y=>String(+y-1).padStart(2,"0"));

export { COLUNAS_QUADRO, comparativoQuadro, mesAnoAnterior, mesesPlanilha };
