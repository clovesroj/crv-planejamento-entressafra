import { composicao, etapasNoPlano, familiaDe, insumosPorFamilia, precoInsumo, todasFamilias, tratCodigos, tratEtapas, tratListaTodos } from '../calculo/insumos.js';
import { TRAT_ETAPAS } from '../dados/insumos.js';
import { INSUMO, INS_FICHA, P, TRATC, TRAT_NOME, TRAT_SEL, insLista } from '../nucleo/estado.js';
import { $, brl, esc, fmt, num, urlWeb } from '../nucleo/formato.js';
import { kpi, th } from './componentes.js';
import { setTRAT_SEL } from '../nucleo/estado.js';

/* ---------- INSUMOS ---------- */

// unidades de venda do cadastro; "—" cobre o produto antigo que não tem unidade
const UNIDADES = ["", "kg", "lt", "ton", "pc", "un"];
// ficha técnica: o que a classificação técnica traz de cada produto
const FICHA = [["cod","Código do material"],["classe","Classe agronômica"],
  ["categ","Categoria operacional"],["form","Formulação"],["modo","Modo de ação"],
  ["mec","Mecanismo de ação"],["grupo","Grupo químico"],["fab","Fabricante ou registrante"],
  ["tox","Classificação toxicológica"],["culturas","Culturas registradas"],
  ["estadio","Estádio dos alvos e momento de aplicação"],["status","Status da validação"],
  ["obs","Observação técnica"],["base","Base da classificação"]];

/* Recorte e dobra dos grupos do cadastro. Sao visao, nao dado: nao entram no
   documento salvo, e por isso moram aqui e nao em nucleo/estado.js. */
let FAM_SEL = "";            // "" = todos os grupos
const FAM_FECHADA = {};      // id da familia -> true quando recolhida
function aplicarFamIns(v){ FAM_SEL = v || ""; }
/* Dobra um grupo. O clique vem da faixa inteira, que e alvo maior que um icone
   -- a faixa ja e o titulo do bloco, entao dobrar nela e o gesto esperado. */
function alternarFam(id){ FAM_FECHADA[id] = !FAM_FECHADA[id]; }
function recolherTodas(v){
  insumosPorFamilia().forEach(f => { FAM_FECHADA[f.id] = v; });
}
/** true quando todo grupo visivel esta recolhido -- decide o rotulo do botao. */
function todasRecolhidas(){
  const fams = insumosPorFamilia().filter(f => !FAM_SEL || f.id === FAM_SEL);
  return fams.length > 0 && fams.every(f => FAM_FECHADA[f.id]);
}
/* Termo digitado na busca do cadastro. Vem do DOM porque a busca e generica
   (.tbl-busca + data-alvo) e nao guarda estado em lugar nenhum -- ler a caixa e
   ler a fonte, em vez de manter uma copia que pode divergir dela. */
function termoBuscaIns(){
  const inp = document.querySelector('.tbl-busca[data-alvo="#t_ins"]');
  return inp ? inp.value.trim() : "";
}
/* Procurar e para achar: com termo de busca a dobra sai do caminho, senao o
   grupo recolhido esconderia justamente o produto procurado. Como a linha
   recolhida nem esta no DOM, filtrar nao basta -- precisa redesenhar, e quem
   redesenha e o chamador em app/ (ui nao importa o ciclo, que seria importar
   para tras no grafo). So na virada entre "sem termo" e "com termo", e so
   havendo grupo recolhido: a cada tecla seria caro. */
let TINHA_TERMO = false;
function buscaExigeRedesenho(alvo, valor){
  if(alvo !== "#t_ins") return false;
  const tem = (valor || "").trim() !== "";
  const virou = tem !== TINHA_TERMO;
  TINHA_TERMO = tem;
  return virou && Object.values(FAM_FECHADA).some(Boolean);
}

function pintarInsumos(R){
  const TL = tratListaTodos();
  const custom = Object.keys(TRATC).length;
  const comPa = insLista().filter(i=>i.pa).length;
  $("#k_ins").innerHTML =
    kpi("Produtos cadastrados","",insLista().length, comPa+" com princípio ativo","insumos:total") +
    kpi("Tratamentos","t",TL.length, custom?custom+" com composição ajustada":"composições originais") +
    kpi("Custo de insumos no plano","g",brl(R.insumoT),"","nat:insumo") +
    kpi("Materiais de manutenção","a",brl(R.MT.total));

  // --- 1. cadastro de insumos (topo) — incluir, alterar, remover ---
  // O seletor de grupo mostra a contagem de cada bloco: é o que responde
  // "quantos herbicidas eu tenho" sem precisar rolar até a faixa.
  const todasFams = insumosPorFamilia();
  // procurar é para achar: com termo de busca a dobra é ignorada, senão o grupo
  // recolhido esconderia justamente o produto procurado
  const dobrada = id => !!FAM_FECHADA[id] && !termoBuscaIns();
  $("#sel_ins_fam").innerHTML =
    `<option value=""${FAM_SEL?"":" selected"}>Todos os grupos · ${insLista().length}</option>` +
    todasFams.map(f=>`<option value="${f.id}"${FAM_SEL===f.id?" selected":""}>${f.nome} · ${f.itens.length}</option>`).join("");
  const btnRec = $("#btn_ins_recolher");
  if(btnRec) btnRec.textContent = todasRecolhidas() ? "Abrir todos" : "Recolher todos";

  // nome comercial e princípio ativo na frente; o resto da classificação
  // técnica fica na ficha, que abre por linha
  // colgroup fixa a largura de cada coluna: com table-layout:fixed, recolher um
  // grupo deixa de mexer na largura das outras (ver componentes.css)
  const COLS = [210,210,100,84,128,168,168,104,96,100,116,104,132,92,140,84,104];
  $("#t_ins").innerHTML =
    `<colgroup>${COLS.map(w=>`<col style="width:${w}px">`).join("")}</colgroup>` +
    th([["Nome comercial"],["Princípio ativo"],["Código"],["Un."],
    ["Concentração"],["Classe agronômica"],["Grupo"],["Volume dem.",1],["Estoque",1],["Preço base",1],
    ["Preço corrigido",1],["Necessidade",1],["Custo de aquisição",1],["Usado em"],["Bula"],[""],[""]])+"<tbody>"+
    // quebra por família e, dentro dela, ordem alfabética de princípio ativo.
    // O `ix` que vai na linha é a posição original em insLista() — é por ele que
    // a edição acha o produto, então reordenar a tela não pode reordenar o índice.
    todasFams.filter(fam => !FAM_SEL || fam.id === FAM_SEL).map(fam=>
      `<tr class="stage" data-fam="${fam.id}" role="button" tabindex="0"
           title="Clique para ${dobrada(fam.id)?"abrir":"recolher"} este grupo"><td colspan="17">
        <span style="display:inline-block;width:14px">${dobrada(fam.id)?"▸":"▾"}</span>${fam.nome}
        <span style="font-weight:400;opacity:.75"> · ${fam.itens.length} produto${
          fam.itens.length>1?"s":""}${dobrada(fam.id)?" · recolhido":""}</span></td></tr>` +
    (dobrada(fam.id) ? "" : fam.itens.map(({i,ix})=>{
      const ov=INSUMO[i.prod]||{};
      const preco = ov.preco!=null?num(ov.preco):num(i.preco);
      const est   = ov.est!=null?num(ov.est):num(i.est);
      const corr  = preco*(1+P.ipreco/100);
      const vol   = R.volDem[i.prod]||0;
      const nec   = Math.max(0,vol-est);
      const usos  = tratCodigos().filter(c=>composicao(c).some(l=>l.prod===i.prod)).length;
      const ficha = FICHA.filter(([k])=>i[k]);
      return `<tr>
        <td><input data-in="${ix}" data-f="prod" value="${esc(i.prod)}" style="text-align:left"></td>
        <td><input data-in="${ix}" data-f="pa" value="${esc(i.pa)}" style="text-align:left" placeholder="a preencher"></td>
        <td><input data-in="${ix}" data-f="cod" value="${esc(i.cod)}" placeholder="—"></td>
        <td><select data-in="${ix}" data-f="un">${UNIDADES.map(u=>
          `<option value="${u}" ${(i.un||"")===u?"selected":""}>${u||"—"}</option>`).join("")}</select></td>
        <td><input data-in="${ix}" data-f="conc" value="${esc(i.conc)}" placeholder="ex.: 480 g/L"></td>
        <td><input data-in="${ix}" data-f="classe" value="${esc(i.classe)}" style="text-align:left" placeholder="—"></td>
        <td><select data-in="${ix}" data-f="fam"
              title="Em branco, o grupo sai da classe agronômica. Escolhendo aqui, a escolha manda e o produto muda de bloco.">
          <option value=""${i.fam?"":" selected"}>auto · ${familiaDe(i.classe).nome}</option>
          ${todasFamilias().map(f=>`<option value="${f.id}"${i.fam===f.id?" selected":""}>${f.nome}</option>`).join("")}
        </select></td>
        <td class="num calc">${fmt(vol,1)}</td>
        <td class="num"><input data-ie="${esc(i.prod)}" value="${est}" inputmode="decimal"></td>
        <td class="num"><input data-ip="${esc(i.prod)}" value="${preco}" inputmode="decimal"></td>
        <td class="num calc">${brl(corr,2)}</td><td class="num calc">${fmt(nec,1)}</td>
        <td class="num ${preco>0?"tot":"calc"}">${preco>0?brl(nec*corr):'<span class="badge b-warn">sem preço</span>'}</td>
        <td class="num calc">${usos?usos+" trat.":"—"}</td>
        <td>${urlWeb(i.bula_url)
          ? `<a href="${esc(urlWeb(i.bula_url))}" target="_blank" rel="noopener">Ver bula</a>
             <button class="btn" data-agrobusca="${ix}" title="Buscar de novo na Agrofit">↻</button>`
          : `<button class="btn" data-agrobusca="${ix}" title="Buscar a bula na Agrofit pelo nome e fabricante">Buscar</button>`}</td>
        <td>${ficha.length?`<button class="btn" data-infx="${esc(i.prod)}"
          title="Classificação técnica do produto">Ficha</button>`:'<span class="calc">—</span>'}</td>
        <td><button class="btn d" data-inrm="${ix}">Remover</button></td></tr>`;
    }).join(""))).join("")+"</tbody>";

  // O bloco "Outros" é o que pede trabalho, não um erro: é produto sem classe
  // agronômica preenchida. A classe é editável na própria linha, e o produto
  // muda de bloco assim que ela for preenchida.
  const fams = insumosPorFamilia();
  const semClasse = insLista().filter(i => !(i.classe || "").trim()).length;
  const manuais = insLista().filter(i => (i.fam || "").trim()).length;
  $("#ins_grupos").innerHTML =
    `Quebrado por classe agronômica e, dentro de cada bloco, em ordem alfabética de princípio ativo — `+
    `produto sem princípio ativo fica no fim do seu bloco. `+
    fams.map(f=>`<b>${f.nome}</b> ${f.itens.length}`).join(" · ") +
    (semClasse ? ` · <b style="color:var(--warn)">${semClasse} produto${semClasse>1?"s":""} sem classe agronômica</b> — `+
      `preencha a coluna <b>Classe agronômica</b> na linha e o produto muda de bloco sozinho.` : "") +
    ` A coluna <b>Grupo</b> permite mover o produto à mão quando a classe não disser a família certa;` +
    ` em <i>auto</i>, ele segue a classe.` +
    (manuais ? ` <b>${manuais} produto${manuais>1?"s":""}</b> com grupo escolhido à mão.` : "");

  // --- 2. composição do tratamento selecionado ---
  const codigos = tratCodigos();
  if(!TRAT_SEL || !codigos.includes(TRAT_SEL)) setTRAT_SEL(codigos[0]);
  $("#sel_trat").innerHTML = codigos.map(c=>
    `<option value="${c}" ${c===TRAT_SEL?"selected":""}>${c}${TRAT_NOME[c]?" — "+esc(TRAT_NOME[c]):""}${TRATC[c]?" (ajustado)":""}</option>`).join("");
  $("#in_trat_nome").value = TRAT_NOME[TRAT_SEL] || "";
  $("#in_trat_cod").value = TRAT_SEL || "";
  $("#sel_prod").innerHTML = insLista().map(i=>
    `<option value="${esc(i.prod)}">${esc(i.prod)}${i.pa?" — "+esc(i.pa):""}</option>`).join("");
  $("#c_etapa_sel").innerHTML = TRAT_SEL ? celulaEtapas(TRAT_SEL) : "";

  const comp = composicao(TRAT_SEL);
  const custoHa = comp.reduce((s,l)=>s+num(l.dose)*precoInsumo(l.prod),0);
  $("#c_trat").value = brl(custoHa,2) + "/ha";

  $("#t_comp").innerHTML = th([["Produto"],["Princípio ativo"],["Dose/ha",1],["Un."],
    ["Preço corrigido",1],["Custo/ha",1],["% do tratamento",1],[""]])+"<tbody>"+
    (comp.length? comp.map((l,i)=>{
      const pr = precoInsumo(l.prod), c = num(l.dose)*pr;
      const pp = custoHa>0 ? c/custoHa*100 : 0;
      const reg = insLista().find(x=>x.prod===l.prod);
      return `<tr><td>${esc(l.prod)}</td>
        <td class="calc">${esc((reg&&reg.pa)||"—")}</td>
        <td class="num"><input data-td="${i}" value="${l.dose}" inputmode="decimal"></td>
        <td class="calc">${esc(l.un||(reg&&reg.un)||"—")}</td>
        <td class="num calc">${pr>0?brl(pr,2):'<span class="badge b-warn">sem preço</span>'}</td>
        <td class="num tot">${brl(c,2)}</td>
        <td class="num calc">${fmt(pp,1)}%</td>
        <td><button class="btn d" data-tr="${i}">Remover</button></td></tr>`;}).join("")
      : `<tr><td colspan="8" class="calc">Tratamento sem produtos. Use o campo abaixo para adicionar.</td></tr>`)+
    `<tr><td class="tot" colspan="4">CUSTO/HA DO TRATAMENTO</td><td></td>
     <td class="num tot">${brl(custoHa,2)}</td><td class="num tot">${custoHa>0?"100,0%":"—"}</td><td></td></tr></tbody>`;

  // --- 3. cadastro dos tratamentos: código, nome e etapa de uso ---
  $("#t_trat").innerHTML = th([["Cod_Trat"],["Nome"],["Etapas em que é usado"],["Produtos",1],
    ["Custo/ha",1],["Composição"],["Atividades que usam"],["Custo no plano",1],[""]])+"<tbody>"+
    TL.map(t=>{
      const usos = R.L.filter(r=>r.trat===t.cod);
      const areaT = usos.reduce((s,u)=>s+u.total,0);
      return `<tr><td><input data-trc="${esc(t.cod)}" value="${esc(t.cod)}" style="min-width:110px"
                 title="Alterar o código do tratamento"></td>
        <td><input data-trn="${esc(t.cod)}" value="${esc(TRAT_NOME[t.cod]||"")}"
            style="text-align:left;min-width:180px" placeholder="Ex.: Herbicida pré-emergente"></td>
        <td style="min-width:176px">${celulaEtapas(t.cod)}</td>
        <td class="num calc">${composicao(t.cod).length}</td>
        <td class="num ${t.custo_ha>0?"tot":"calc"}">${t.custo_ha>0?brl(t.custo_ha,2):"—"}</td>
        <td>${TRATC[t.cod]?'<span class="badge b-warn">ajustado</span>':'<span class="badge b-ok">original</span>'}</td>
        <td class="calc">${usos.length?usos.map(u=>u.a.cod).join(", "):"—"}</td>
        <td class="num ${areaT?"tot":"calc"}">${areaT?brl(areaT*t.custo_ha):"—"}</td>
        <td><button class="btn d" data-trrm="${esc(t.cod)}">Remover</button></td></tr>`;}).join("")+
    "</tbody>";

  // --- 4. materiais ---
  $("#t_mat").innerHTML = th([["Categoria"],["Item"],["Un."],["Preço",1],["Qtd",1],["Total",1],[""]])+"<tbody>"+
    R.MT.linhas.map((m,i)=>`<tr>
      <td><input data-mt="${i}" data-f="cat" value="${esc(m.cat)}" style="text-align:left;min-width:130px"></td>
      <td><input data-mt="${i}" data-f="item" value="${esc(m.item)}" style="text-align:left;min-width:190px"></td>
      <td><input data-mt="${i}" data-f="un" value="${esc(m.un)}" style="text-align:left;width:60px"></td>
      <td class="num"><input data-mt="${i}" data-f="preco" value="${m.preco}" inputmode="decimal"></td>
      <td class="num"><input data-mt="${i}" data-f="qtd" value="${m.qtd}" inputmode="decimal"></td>
      <td class="num tot">${brl(m.total)}</td>
      <td><button class="btn d" data-mtrm="${i}">Remover</button></td></tr>`).join("")+
    `<tr><td class="tot" colspan="5">TOTAL</td><td class="num tot">${brl(R.MT.total)}</td><td></td></tr></tbody>`;
}

/* Célula de marcação da etapa: uma caixa por etapa do plano. Sem marca, mostra
   em que etapa o Plano Operacional está usando o tratamento — o que ele diz
   hoje, sem inventar marcação em nome do usuário. */
function celulaEtapas(cod){
  const marcadas = tratEtapas(cod);
  const noPlano = etapasNoPlano(cod);
  const caixas = Object.entries(TRAT_ETAPAS).map(([k,e])=>{
    const on = marcadas.includes(k);
    return `<label class="etq${on?" on":""}" title="${e.nome}">
      <input type="checkbox" data-tre="${esc(cod)}" data-e="${k}" ${on?"checked":""}>
      <span>${e.sigla}</span></label>`;}).join("");
  const nota = marcadas.length
    ? `<div class="hint">${marcadas.map(e=>TRAT_ETAPAS[e].nome).join(" · ")}</div>`
    : (noPlano.length ? `<div class="hint">sem marcação — o plano usa em ${
         noPlano.map(e=>TRAT_ETAPAS[e].nome).join(", ")}</div>`
                      : `<div class="hint">sem marcação</div>`);
  return `<div class="etqs">${caixas}</div>${nota}`;
}

/* ---------- FICHA TÉCNICA, EM MODAL ----------
   A ficha era uma sub-linha da tabela. Numa tabela de coluna fixa isso nao cabe:
   "Culturas registradas" traz dezenas de culturas e "Estadio dos alvos" um
   paragrafo, e os dois se sobrepunham dentro da largura da celula.

   No modal o texto tem a tela inteira e quebra em coluna de largura propria.
   Uma ficha por vez, e nao um mapa de abertas: sao 161 produtos, e abrir varias
   nunca foi util -- se compara produto pelo cadastro, nao por duas fichas
   empilhadas. */
/* Campos de texto corrido: uma lista de culturas ou um paragrafo de estadio nao
   cabe numa coluna de 300 px sem virar uma torre de palavras. */
const LARGOS = ["culturas", "estadio", "modo", "mec", "obs"];
function pintarFichaIns(){
  const cont = $("#fichains"), fundo = $("#fichains_fundo");
  if(!cont) return;
  const i = INS_FICHA ? insLista().find(x=>x.prod === INS_FICHA) : null;
  if(!i){ cont.hidden = true; fundo.hidden = true; return; }

  const campos = FICHA.filter(([k])=>i[k]);
  cont.innerHTML = `
    <div class="ra-modal fx-modal pop-in">
    <div class="ra-topo">
      <div class="ra-nav"><div></div>
        <button class="ghost-btn" id="fx_fechar" title="Fechar" aria-label="Fechar">✕</button></div>
      <div class="ra-tit">${esc(i.prod)}</div>
      <div class="ra-subtit">${esc(i.pa) || "princípio ativo a preencher"}${
        i.conc ? " · " + esc(i.conc) : ""}${i.un ? " · " + esc(i.un) : ""}</div>
    </div>
    <div class="ra-corpo">
      <div class="fx-grade">${campos.map(([k,rot])=>
        `<div class="fx-item${LARGOS.includes(k)?" fx-largo":""}"><b>${rot}</b><span>${esc(i[k])}</span></div>`).join("")}</div>
    </div>
    </div>`;
  cont.hidden = false;
  fundo.hidden = false;
}

export { pintarInsumos, pintarFichaIns, alternarFam, aplicarFamIns, buscaExigeRedesenho,
  recolherTodas, todasRecolhidas };
