import { conferenciaInsumos, demandas } from '../calculo/demandas.js';
import { MESES, NM } from '../nucleo/calendario.js';
import { DEM_SO_FALTA } from '../nucleo/estado.js';
import { $, brl, esc, fmt } from '../nucleo/formato.js';
import { codExibir } from '../nucleo/codigo-atividade.js';
import { barrasEmpilhadas, barrasLinhas, kpi, rosca, somaSel, tdMeses, th, thMeses } from './componentes.js';

/* ---------- DEMANDAS DE INSUMOS E MATERIAIS ----------
   O que o plano pede, o que há em estoque e a diferença a comprar -- a conta
   mora em calculo/demandas.js. Quatro páginas: o painel (compras por mês,
   grupos, maiores compras e a conferência do custo de insumos), os insumos,
   a compra mês a mês e os materiais de manutenção. Todo número tem rastro
   (demanda:<produto>, demanda:mat:<índice>, demandas). O estoque dos insumos
   se ajusta na aba Insumos; o dos materiais, aqui. */
const COR_FAM = ["#2A57A0","#2E8540","#C9A45C","#A5503A","#7B5EA7","#2F9FB2","#5B6B7F","#B39A7A","#D9822B","#8A94A6"];
const COR_MAT = "#5B6B7F";
const q = v => fmt(v, Math.abs(v)>0 && Math.abs(v)<10 ? 2 : 0);

function pintarDemandas(R){
  const D = demandas(R), C = conferenciaInsumos(R), SEL = R.SEL;
  const I = D.ins, M = D.mat;
  // cor fixa por grupo de insumo, na ordem em que o grupo aparece no plano
  const fams = [...new Set(I.linhas.map(l=>l.famId))];
  const famNome = id => (I.linhas.find(l=>l.famId===id)||{}).famNome || id;
  const corFam = id => COR_FAM[fams.indexOf(id) % COR_FAM.length];

  /* ---- cartões ---- */
  const acabando = I.linhas.filter(l=>l.acaba!=null).sort((a,b)=>a.acaba-b.acaba || b.valor-a.valor);
  $("#k_dem").innerHTML =
    kpi("A comprar","",brl(D.valor), "insumos "+brl(I.valor)+" · materiais "+brl(M.valor), "demandas") +
    kpi("Insumos a comprar","t", I.nComprar+" de "+I.n, "produtos do plano com estoque menor que a necessidade", "demandas") +
    kpi("Materiais a comprar","a", M.nComprar+" de "+M.n, "itens da lista de materiais de manutenção", "demandas") +
    kpi("Coberto pelo estoque","g", brl(D.usoEstoque), D.consumo>0 ? fmt(D.usoEstoque/D.consumo*100,1)+"% do consumo do plano" : "", "demandas") +
    kpi("Primeiro estoque a acabar","", acabando.length ? MESES[acabando[0].acaba] : "—",
        acabando.length ? esc(acabando[0].prod)+(acabando.length>1 ? " · e mais "+(acabando.length-1) : "") : "o estoque cobre o ano",
        acabando.length ? "demanda:"+acabando[0].prod : "");

  /* ---- painel: compras por mês ---- */
  const series = fams.map(id=>({nome:famNome(id), cor:corFam(id),
      vals: Array.from({length:NM}, (_,i)=>I.linhas.filter(l=>l.famId===id).reduce((s,l)=>s+l.valorMes[i],0)),
      rastro:()=>"demandas", rastroLeg:"demandas"}))
    .concat([{nome:"Materiais de manutenção", cor:COR_MAT, vals:M.valorMes, rastro:()=>"demandas", rastroLeg:"demandas"}])
    .filter(s=>s.vals.some(v=>v>0.5));
  barrasEmpilhadas($("#ch_dem_mes"), $("#ch_dem_mes_leg"), {meses:SEL.meses, series, linha:null, rastroCol:()=>"demandas",
    fmt:v=>fmt(v/1e6,1), fmtLeg:v=>"R$ "+fmt(v/1e6,2)+" mi"});
  $("#ch_dem_mes_nota").textContent = "Valor a comprar em R$ milhões, no mês em que o estoque deixa de cobrir o consumo."+
    (M.semMes>0.5 ? ` Materiais sem mês de alocação (${brl(M.semMes)}) ficam fora do gráfico — marque o mês na lista de materiais (aba Insumos).` : "");

  /* ---- painel: por grupo e maiores compras ---- */
  const porFam = fams.map(id=>({l:famNome(id), v:I.linhas.filter(l=>l.famId===id).reduce((s,l)=>s+l.valor,0), cor:corFam(id), rastro:"demandas"}))
    .concat([{l:"Materiais de manutenção", v:M.valor, cor:COR_MAT, rastro:"demandas"}]);
  rosca($("#ch_dem_fam"), $("#ch_dem_fam_leg"), porFam, {v:D.valor, txt:fmt(D.valor/1e6,1), l:"R$ milhões"}, v=>brl(v));
  const TOPO = 15;
  const top = I.linhas.filter(l=>l.valor>0.5).slice(0,TOPO);
  barrasLinhas($("#ch_dem_top"), top.map(l=>({l:l.prod, a:l.valor, cor:corFam(l.famId), num:brl(l.valor),
      dir: l.acaba!=null ? "acaba em "+MESES[l.acaba] : "", rastro:"demanda:"+l.prod})), {corA:COR_FAM[0]});
  const nValor = I.linhas.filter(l=>l.valor>0.5).length;
  $("#ch_dem_top_nota").textContent = nValor>TOPO ? `Os ${TOPO} maiores de ${nValor} insumos a comprar. Todos estão na página Insumos.` : "";

  /* ---- painel: conferência do custo de insumos ---- */
  const ok = C.confere;
  $("#t_dem_conf").innerHTML = th([["Conferência"],["Valor",1],[""]])+"<tbody>"+
    `<tr data-rastro="demandas"><td>Consumo dos insumos do plano, pelo preço do produto</td><td class="num">${brl(C.consumo)}</td><td class="calc">volume de cada tratamento × preço corrigido</td></tr>`+
    `<tr><td>+ Frete lançado nas linhas dos tratamentos</td><td class="num">${brl(C.frete)}</td><td class="calc">aba Insumos, composição do tratamento</td></tr>`+
    `<tr class="cc-sub"><td>= Insumos pelo lado do produto</td><td class="num tot">${brl(C.soma)}</td><td></td></tr>`+
    `<tr class="cc-sub" data-rastro="nat:insumo"><td>Custo de insumos no plano (soma das atividades)</td><td class="num tot">${brl(C.insumoT)}</td>
      <td>${ok ? '<span class="badge b-ok">confere</span>' : `<span class="badge b-bad">diferença de ${brl(C.dif)}</span>`}</td></tr>`+
    `<tr class="stage"><td colspan="3">Onde o custo de insumos entra</td></tr>`+
    C.etapas.map(e=>`<tr><td>${esc(e.rot)}</td><td class="num">${brl(e.v)}</td><td class="calc">${C.insumoT>0 ? fmt(e.v/C.insumoT*100,1)+"% dos insumos" : ""}</td></tr>`).join("")+
    `<tr class="cc-sub"><td>Formação do canavial (preparo + plantio + tratos de cana planta)</td><td class="num tot">${brl(C.formacao)}</td>
      <td class="calc">entra no custo do hectare plantado</td></tr>`+
    `<tr class="cc-tot"><td>Soma das etapas</td><td class="num tot">${brl(C.somaEtapas)}</td>
      <td>${Math.abs(C.somaEtapas-C.insumoT)<=1 ? '<span class="badge b-ok">confere</span>' : `<span class="badge b-bad">dif. ${brl(C.somaEtapas-C.insumoT)}</span>`}</td></tr></tbody>`;
  $("#dem_conf_nota").innerHTML = (ok
    ? "Todo insumo lançado nos tratamentos do Plano Operacional — inclusive os tratamentos extras de uma mesma atividade e as atividades que vão junto da plantadora — está no custo do plano, na etapa da atividade que o aplica."
    : "<b>O custo por produto não fecha com o custo das atividades.</b> Algum tratamento está sendo contado num lado e não no outro.")+
    (C.inativos.length ? ` <b>Atenção:</b> ${C.inativos.length} vínculo${C.inativos.length>1?"s":""} com tratamento inativo — o custo entra no plano, mas o tratamento não aparece nas buscas: `+
      C.inativos.slice(0,5).map(x=>`${esc(codExibir(x.cod))} (${esc(x.trat)})`).join(", ")+(C.inativos.length>5?"…":"")+"." : "");

  /* ---- insumos: tabela por grupo, com subtotal ---- */
  const mostra = l => !DEM_SO_FALTA || l.comprar>1e-9;
  $("#chk_dem_falta").checked = !!DEM_SO_FALTA;
  let tb = th([["Produto"],["Un."],["Volume do plano",1],["Estoque",1],["Saldo após o plano",1],["A comprar",1],
    ["Preço",1],["Valor a comprar",1],["Estoque acaba em"]])+"<tbody>";
  fams.forEach(id=>{
    const ls = I.linhas.filter(l=>l.famId===id && mostra(l)); if(!ls.length) return;
    const tv = ls.reduce((s,l)=>s+l.valor,0), tc = ls.reduce((s,l)=>s+l.consumo,0);
    tb += `<tr class="stage"><td colspan="9"><span><i class="cc-cor" style="background:${corFam(id)}"></i>${esc(famNome(id))}</span>
      <span style="font-weight:400;opacity:.8"> · ${ls.length} produto${ls.length>1?"s":""} · consumo ${brl(tc)}</span></td></tr>`;
    ls.sort((a,b)=>b.valor-a.valor || a.prod.localeCompare(b.prod)).forEach(l=>{
      tb += `<tr data-rastro="demanda:${esc(l.prod)}"><td>${esc(l.prod)}${l.semCadastro?' <span class="badge b-warn">sem cadastro</span>':""}</td>
        <td class="calc">${esc(l.un)}</td><td class="num">${q(l.vol)}</td>
        <td class="num calc" title="${l.estData?"Saldo em "+esc(l.estData)+" · ":""}ajuste na aba Insumos">${q(l.est)}</td>
        <td class="num ${l.saldo<0?"dem-falta":"calc"}">${q(l.saldo)}</td>
        <td class="num ${l.comprar>1e-9?"tot":"calc"}">${l.comprar>1e-9 ? q(l.comprar) : "—"}</td>
        <td class="num calc">${l.preco>0 ? brl(l.preco,2) : '<span class="badge b-warn">sem preço</span>'}</td>
        <td class="num ${l.valor>0.5?"tot":"calc"}">${l.valor>0.5 ? brl(l.valor) : "—"}</td>
        <td class="${l.acaba!=null?"dem-falta":"calc"}">${l.acaba!=null ? MESES[l.acaba] : "cobre o ano"}</td></tr>`;
    });
    tb += `<tr class="cc-sub"><td colspan="7">Subtotal ${esc(famNome(id))}</td><td class="num tot">${brl(tv)}</td><td></td></tr>`;
  });
  const lsVis = I.linhas.filter(mostra);
  tb += lsVis.length ? `<tr class="cc-tot"><td colspan="7">TOTAL DOS INSUMOS A COMPRAR</td><td class="num tot">${brl(I.valor)}</td><td></td></tr>`
    : `<tr><td colspan="9" class="calc">${DEM_SO_FALTA ? "O estoque cobre todos os insumos do plano." : "Nenhum insumo lançado nos tratamentos do plano."}</td></tr>`;
  $("#t_dem_ins").innerHTML = tb + "</tbody>";

  /* ---- compra mês a mês (quantidade), só o que precisa comprar ---- */
  const aComprar = I.linhas.filter(l=>l.comprar>1e-9).sort((a,b)=>(a.acaba??99)-(b.acaba??99) || b.valor-a.valor);
  $("#t_dem_mes").innerHTML = th([["Produto"],["Un."],...thMeses(),[SEL.parcial?"No período":"No ano",1],["Valor",1]])+"<tbody>"+
    (aComprar.length ? aComprar.map(l=>`<tr><td data-rastro="demanda:${esc(l.prod)}">${esc(l.prod)}</td><td class="calc">${esc(l.un)}</td>`+
      tdMeses(l.faltaMes, v=>v>1e-9 ? q(v) : "—", "num")+
      `<td class="num tot">${q(somaSel(l.faltaMes, SEL))}</td><td class="num">${brl(somaSel(l.valorMes, SEL))}</td></tr>`).join("")+
      `<tr class="cc-tot"><td colspan="2">VALOR A COMPRAR NO MÊS</td>`+tdMeses(I.valorMes, v=>v>0.5 ? brl(v) : "—", "num tot")+
      `<td></td><td class="num tot">${brl(somaSel(I.valorMes, SEL))}</td></tr>`
    : `<tr><td colspan="${NM+4}" class="calc">O estoque cobre todos os insumos do plano.</td></tr>`)+"</tbody>";

  /* ---- materiais de manutenção: estoque editável ---- */
  const cats = [...new Set(M.linhas.map(l=>l.cat))];
  let tm = th([["Item"],["Un."],["Qtd anual",1],["Estoque",1],["A comprar",1],["Preço",1],["Valor a comprar",1],["Mês de compra"]])+"<tbody>";
  cats.forEach(cat=>{
    const ls = M.linhas.filter(l=>l.cat===cat && mostra(l)); if(!ls.length) return;
    tm += `<tr class="stage"><td colspan="8">${esc(cat||"Sem categoria")}<span style="font-weight:400;opacity:.8"> · ${ls.length} ite${ls.length>1?"ns":"m"}</span></td></tr>`;
    ls.forEach(l=>{
      tm += `<tr><td data-rastro="demanda:mat:${l.ix}">${esc(l.item)}</td><td class="calc">${esc(l.un)}</td>
        <td class="num">${fmt(l.qtd)}</td>
        <td class="num"><input data-mest="${l.ix}" value="${l.est||""}" placeholder="0" inputmode="decimal" style="width:90px"
          title="Quantidade em estoque hoje"></td>
        <td class="num ${l.comprar>0?"tot":"calc"}" data-rastro="demanda:mat:${l.ix}">${l.comprar>0 ? fmt(l.comprar) : "—"}</td>
        <td class="num calc">${brl(l.preco,2)}</td>
        <td class="num ${l.valor>0.5?"tot":"calc"}">${l.valor>0.5 ? brl(l.valor) : "—"}</td>
        <td class="calc">${l.mes!=null ? MESES[l.mes] : "sem mês"}</td></tr>`;
    });
    tm += `<tr class="cc-sub"><td colspan="6">Subtotal ${esc(cat||"sem categoria")}</td><td class="num tot">${brl(ls.reduce((s,l)=>s+l.valor,0))}</td><td></td></tr>`;
  });
  tm += M.linhas.filter(mostra).length ? `<tr class="cc-tot"><td colspan="6">TOTAL DOS MATERIAIS A COMPRAR</td><td class="num tot">${brl(M.valor)}</td><td></td></tr>`
    : `<tr><td colspan="8" class="calc">${DEM_SO_FALTA ? "O estoque cobre todos os materiais." : "Nenhum material na lista (aba Insumos)."}</td></tr>`;
  $("#t_dem_mat").innerHTML = tm + "</tbody>";

  $("#bl_dem_sub").textContent = `${brl(D.valor)} a comprar · ${I.nComprar+M.nComprar} itens`;
}

export { pintarDemandas };
