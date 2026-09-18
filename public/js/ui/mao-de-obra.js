import { benVal, encPct, gratif } from '../calculo/mao-de-obra.js';
import { CFG } from '../dados/cfg.js';
import { NM } from '../nucleo/calendario.js';
import { BEN, ENC, FUN_SEL, GRAT } from '../nucleo/estado.js';
import { $, brl, fmt, num, pct } from '../nucleo/formato.js';
import { kpi, ligarBuscaSelect, th } from './componentes.js';
import { setFUN_SEL } from '../nucleo/estado.js';

/* ---------- MÃO DE OBRA ---------- */
// "Cargo" (gratificação) e persistente -- mostra o cargo selecionado, nao some
// depois de um clique -- por isso usa definir(), sincronizado a cada render.
const buscaFun = ligarBuscaSelect("#busca_fun", "#lista_fun", "#sel_fun", () => CFG.funcoes,
  f => f.cod + " · " + f.nome + (GRAT[f.cod] ? " (com gratificação)" : ""), f => f.cod);

function pintarMDO(R){
  const M=R.MP;
  $("#c_escala").value = M.fatorEscala.toFixed(2);
  $("#k_mdo").innerHTML =
    kpi("Encargos sociais","",pct(M.encTot),"sobre o salário","nat:mdo") +
    kpi("Benefícios","t",brl(M.benTot),"por colaborador/mês","nat:mdo") +
    kpi("MDO total do período","g",brl(R.mdoTotal),"","nat:mdo") +
    kpi("Equipe de manutenção","a",R.EM.efetivo+" pessoas",
        `${R.EM.mec} mec · ${R.EM.ajud} ajud · ${R.EM.lider} líder`,"pessoas:total");

  $("#t_enc").innerHTML = th([["Encargo"],["Base legal"],["% aplicado",1],["Original",1],["Impacto p/ F01",1]]) + "<tbody>" +
    CFG.encargos.map((e,i)=>{
      const p = encPct(i), alt = ENC[i]!=null && Math.abs(p-e.pct)>1e-9;
      const impacto = M.custoFuncao["918"] ? M.custoFuncao["918"].comAdic*p : 0;
      return `<tr><td>${e.nome}${alt?' <span class="badge b-warn">ajustado</span>':''}</td>
        <td class="calc">${e.base}</td>
        <td class="num"><input data-enc="${i}" value="${+(p*100).toFixed(4)}" inputmode="decimal"></td>
        <td class="num calc">${pct(e.pct)}</td>
        <td class="num calc">${brl(impacto,2)}</td></tr>`;}).join("") +
    `<tr><td class="tot">TOTAL DE ENCARGOS</td><td></td><td class="num tot">${pct(M.encTot)}</td>
     <td class="num calc">${pct(CFG.encargos.reduce((s,e)=>s+e.pct,0))}</td>
     <td class="num tot">${brl(M.custoFuncao["918"]?M.custoFuncao["918"].encargos:0,2)}</td></tr></tbody>`;

  $("#t_ben").innerHTML = th([["Benefício"],["Conta"],["Valor aplicado",1],["Original",1],["% do pacote",1]]) + "<tbody>" +
    CFG.beneficios.map((b,i)=>{
      const v = benVal(i), alt = BEN[i]!=null && Math.abs(v-b.valor)>1e-9;
      const pp = M.benTot>0 ? v/M.benTot*100 : 0;
      return `<tr><td>${b.nome}${alt?' <span class="badge b-warn">ajustado</span>':''}</td>
        <td class="calc">${b.conta}</td>
        <td class="num"><input data-ben="${i}" value="${v}" inputmode="decimal"></td>
        <td class="num calc">${brl(b.valor,2)}</td>
        <td class="num calc">${fmt(pp,1)}%</td></tr>`;}).join("") +
    `<tr><td class="tot">TOTAL DE BENEFÍCIOS</td><td></td><td class="num tot">${brl(M.benTot,2)}</td>
     <td class="num calc">${brl(CFG.beneficios.reduce((s,b)=>s+b.valor,0),2)}</td>
     <td class="num tot">100,0%</td></tr></tbody>`;

  $("#t_fun").innerHTML = th([["Cod"],["Cargo no ERP"],["Conta"],["Salário base",1],["Adic.",1],
    ["Gratificação",1],["Base",1],["Encargos",1],["Benefícios",1],["Custo mensal",1],["Custo/hora",1]]) + "<tbody>" +
    CFG.funcoes.map(f=>{
      const c=M.custoFuncao[f.cod];
      const alt = GRAT[f.cod];
      return `<tr><td>${f.cod}</td>
        <td>${f.nome}${alt?' <span class="badge b-warn">ajustada</span>':''}</td>
        <td class="calc">${f.conta}</td>
        <td class="num"><input data-fs="${f.cod}" value="${f.sal}" inputmode="decimal"></td>
        <td class="num calc">${pct(f.adic)}</td>
        <td class="num calc">${c.grat?brl(c.grat,2):"—"}</td>
        <td class="num calc">${brl(c.base,2)}</td>
        <td class="num calc">${brl(c.encargos,2)}</td>
        <td class="num calc">${brl(c.beneficios,2)}</td>
        <td class="num tot">${brl(c.mensal,2)}</td>
        <td class="num">${brl(c.hora,2)}</td></tr>`;}).join("") + "</tbody>";

  // --- gratificação do cargo selecionado ---
  if(!FUN_SEL || !CFG.funcoes.some(f=>f.cod===FUN_SEL)) setFUN_SEL(CFG.funcoes[0].cod);
  buscaFun && buscaFun.definir(FUN_SEL);
  const g = GRAT[FUN_SEL] || {tipo:"R$", valor:0};
  $("#sel_grat_tipo").value = g.tipo;
  $("#in_grat").value = g.valor;

  let ind = th([["Cod"],["Função"],["Vínculo"],["Efetivo",1],["Custo mensal",1],["Custo do período",1]])+"<tbody>";
  CFG.indiretos.forEach(i=>{const c=M.custoFuncao[i.fcod]||{mensal:0,nome:"—"};
    ind += `<tr><td>${i.cod}</td><td>${i.nome}</td><td class="calc">${i.fcod}</td>
      <td class="num">${i.qtd}</td><td class="num calc">${brl(c.mensal*i.qtd)}</td>
      <td class="num tot">${brl(c.mensal*i.qtd*NM)}</td></tr>`;});
  [["Mecânico de manutenção","F09",R.EM.mec],["Ajudante de mecânico","F14",R.EM.ajud],
   ["Mecânico líder","F13",R.EM.lider]].forEach(([n,f,q])=>{
    const c=M.custoFuncao[f]||{mensal:0};
    ind += `<tr><td class="calc">auto</td><td>${n}</td><td class="calc">${f}</td>
      <td class="num">${q}</td><td class="num calc">${brl(c.mensal*q)}</td>
      <td class="num tot">${brl(c.mensal*q*NM)}</td></tr>`;});
  ind += `<tr><td class="tot" colspan="5">TOTAL ESTRUTURA + MANUTENÇÃO</td>
    <td class="num tot">${brl(R.mdoIndirT+R.mdoManut)}</td></tr></tbody>`;
  $("#t_ind").innerHTML = ind;
}


export { pintarMDO };
