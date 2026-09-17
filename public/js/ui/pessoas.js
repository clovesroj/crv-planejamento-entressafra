import { deptIdx } from '../calculo/pessoas.js';
import { CFG } from '../dados/cfg.js';
import { MESES, NM } from '../nucleo/calendario.js';
import { $, brl, esc, fmt } from '../nucleo/formato.js';
import { barras, kpi, maxSel, somaSel, tdMeses, th, thMeses } from './componentes.js';

/* ---------- RESUMO DE PESSOAS ---------- */
function pintarPessoas(R){
  const S = R.PS, sm = a => a.reduce((s,x)=>s+x,0);
  const contaF = c => (CFG.funcoes.find(f=>f.cod===c)||{conta:"—"}).conta;
  const depts = Object.keys(S.porDept).sort((a,b)=>deptIdx(a)-deptIdx(b));
  const funs  = Object.keys(S.porFun).sort();
  const pm = sm(S.qtdMes), iPico = S.qtdMes.indexOf(Math.max(...S.qtdMes));
  const porPessoa = o => o.pessoasMes>0 ? brl(o.custo/o.pessoasMes,0) : "—";

  $("#k_pes").innerHTML =
    kpi("Efetivo dimensionado","",fmt(S.qtd)+" pessoas", depts.length+" departamentos · "+funs.length+" funções","pessoas:total") +
    kpi("Pico de mobilização","a",fmt(S.qtdMes[iPico]||0)+" pessoas", S.qtd>0?MESES[iPico]:"","pessoas:pico") +
    kpi("Custo de mão de obra","t",brl(S.custo), NM+" meses","nat:mdo") +
    kpi("Custo médio por pessoa","g",pm>0?brl(S.custo/pm,0)+"/mês":"—","pessoa mobilizada no mês","pessoas:total");

  $("#t_pes_dept").innerHTML = th([["Departamento"],["Funções",1],["Efetivo",1],["% do efetivo",1],["Pico mensal",1],
    ["Custo MDO",1],["% do custo",1],["R$/pessoa/mês",1]])+"<tbody>"+
    depts.map(d=>{ const o=S.porDept[d], nf=new Set(S.itens.filter(it=>it.dept===d).map(it=>it.fcod)).size;
      return `<tr><td>${esc(d)}</td><td class="num calc">${nf}</td><td class="num tot">${fmt(o.qtd)}</td>
        <td class="num calc">${S.qtd>0?fmt(o.qtd/S.qtd*100,1)+"%":"—"}</td><td class="num calc">${fmt(o.pico)}</td>
        <td class="num">${brl(o.custo)}</td><td class="num calc">${S.custo>0?fmt(o.custo/S.custo*100,1)+"%":"—"}</td>
        <td class="num calc">${porPessoa(o)}</td></tr>`; }).join("")+
    `<tr><td class="tot">TOTAL</td><td class="num tot">${funs.length}</td><td class="num tot">${fmt(S.qtd)}</td>
     <td class="num tot">100,0%</td><td class="num tot">${fmt(Math.max(...S.qtdMes))}</td><td class="num tot">${brl(S.custo)}</td>
     <td class="num tot">100,0%</td><td class="num tot">${pm>0?brl(S.custo/pm,0):"—"}</td></tr></tbody>`;

  // conferência com as outras abas: a Capa não soma os operadores de apoio
  const difCusto = S.custo - R.mdoTotal;
  $("#pes_conc").innerHTML = `Custo de mão de obra desta aba: <b>${brl(S.custo)}</b> — aba Custos: ${brl(R.mdoTotal)}
    ${Math.abs(difCusto)<=1?"(confere)":"(diferença de "+brl(difCusto)+")"}. Efetivo da Capa: ${fmt(R.efetivoTotal)} pessoas,
    que não inclui os ${fmt(S.apoio)} operadores dos equipamentos de apoio contados aqui. A reserva do transporte de cana
    entra no efetivo sem custo de mão de obra próprio, como na Capa.`;

  $("#t_pes_fun").innerHTML = th([["Cod"],["Função"],["Conta"],["Departamentos"],["Efetivo",1],["Pico mensal",1],
    ["Custo MDO",1],["R$/pessoa/mês",1]])+"<tbody>"+
    funs.map(f=>{ const o=S.porFun[f];
      const ds=[...new Set(S.itens.filter(it=>it.fcod===f).map(it=>it.dept))].sort((a,b)=>deptIdx(a)-deptIdx(b));
      return `<tr><td>${f}</td><td>${esc((R.MP.custoFuncao[f]||{nome:f}).nome)}</td><td class="calc">${contaF(f)}</td>
        <td class="calc">${ds.map(esc).join(", ")}</td><td class="num tot">${fmt(o.qtd)}</td>
        <td class="num calc">${fmt(o.pico)}</td><td class="num">${brl(o.custo)}</td>
        <td class="num calc">${porPessoa(o)}</td></tr>`; }).join("")+
    `<tr><td class="tot" colspan="4">TOTAL</td><td class="num tot">${fmt(S.qtd)}</td><td></td>
     <td class="num tot">${brl(S.custo)}</td><td></td></tr></tbody>`;

  const cel = (f,d) => S.itens.filter(it=>it.fcod===f && it.dept===d).reduce((s,it)=>s+it.qtd,0);
  $("#t_pes_matriz").innerHTML = th([["Função"],...depts.map(d=>[esc(d),1]),["Total",1]])+"<tbody>"+
    funs.map(f=>`<tr><td>${f} — ${esc((R.MP.custoFuncao[f]||{nome:f}).nome)}</td>`+
      depts.map(d=>{ const v=cel(f,d); return `<td class="num ${v?"":"calc"}">${v?fmt(v):"—"}</td>`; }).join("")+
      `<td class="num tot">${fmt(S.porFun[f].qtd)}</td></tr>`).join("")+
    `<tr><td class="tot">TOTAL</td>`+depts.map(d=>`<td class="num tot">${fmt(S.porDept[d].qtd)}</td>`).join("")+
    `<td class="num tot">${fmt(S.qtd)}</td></tr></tbody>`;

  const SEL = R.SEL;
  $("#t_pes_mes_qtd").innerHTML = th([["Departamento"],...thMeses(),[SEL.parcial?"Pico no período":"Pico",1]])+"<tbody>"+
    depts.map(d=>{ const o=S.porDept[d];
      return `<tr><td>${esc(d)}</td>`+tdMeses(o.qtdMes, v=>v?fmt(v):"—")+
        `<td class="num tot">${fmt(maxSel(o.qtdMes, SEL))}</td></tr>`; }).join("")+
    `<tr><td class="tot">TOTAL</td>`+tdMeses(S.qtdMes, v=>fmt(v), "num tot")+
    `<td class="num tot">${fmt(maxSel(S.qtdMes, SEL))}</td></tr></tbody>`;

  // o acumulado corre sobre os meses à mostra: acumular meses escondidos faria a
  // última coluna visível não bater com o total da linha
  let ac = 0;
  const acum = S.custoMes.map((v,i)=> SEL.meses.includes(i) ? (ac+=v) : null);
  $("#t_pes_mes_custo").innerHTML = th([["Departamento"],...thMeses(),[SEL.parcial?"Total do período":"Total",1]])+"<tbody>"+
    depts.map(d=>{ const o=S.porDept[d];
      return `<tr><td>${esc(d)}</td>`+tdMeses(o.custoMes, v=>brl(v))+
        `<td class="num tot">${brl(somaSel(o.custoMes, SEL))}</td></tr>`; }).join("")+
    `<tr><td class="tot">TOTAL</td>`+tdMeses(S.custoMes, v=>brl(v), "num tot")+
    `<td class="num tot">${brl(somaSel(S.custoMes, SEL))}</td></tr>`+
    `<tr><td class="calc">Acumulado</td>`+tdMeses(acum, v=>v==null?"—":brl(v))+`<td></td></tr>`+
    `<tr><td class="calc">Pessoas no mês</td>`+tdMeses(S.qtdMes, v=>fmt(v))+`<td></td></tr></tbody>`;
  barras($("#ch_pes"), MESES.map((m,i)=>({l:m, v:S.custoMes[i]})), "#3E7CB1");

  const det = [...S.itens].sort((a,b)=>deptIdx(a.dept)-deptIdx(b.dept) || b.qtd-a.qtd);
  $("#t_pes_det").innerHTML = th([["Departamento"],["Origem"],["Função"],["Efetivo",1],["Meses mobilizado",1],["Custo MDO",1]])+"<tbody>"+
    (det.length ? det.map(it=>`<tr><td class="calc">${esc(it.dept)}</td><td>${esc(it.origem)}</td>
      <td>${it.fcod} — ${esc(it.fnome)}</td><td class="num tot">${fmt(it.qtd)}</td>
      <td class="num calc">${it.qtdMes.filter(v=>v>0).length}</td><td class="num">${brl(it.custo)}</td></tr>`).join("")
      : `<tr><td colspan="6" class="calc">Sem efetivo: lance quantidades no Plano Operacional.</td></tr>`)+"</tbody>";
}


export { pintarPessoas };
