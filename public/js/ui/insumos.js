import { composicao, doseBase, etapasNoPlano, familiaDe, freteEfetivo, insumosPorFamilia, precoInsumo, todasFamilias, tratCodigos, tratEtapas, tratListaTodos, usosTrat } from '../calculo/insumos.js';
import { TRAT_ETAPAS } from '../dados/insumos.js';
import { ATIV_TRAT_SEL, DIM, INSUMO, INS_EDIT, INS_FICHA, P, PLANO, TRATC, TRAT_ATIVO, TRAT_NOME, TRAT_OBS, TRAT_SEL, atividadesLista, insLista } from '../nucleo/estado.js';
import { $, brl, esc, fmt, num, urlWeb } from '../nucleo/formato.js';
import { unidadesDaFamilia } from '../nucleo/unidades.js';
import { kpi, ligarBuscaSelect, th } from './componentes.js';
import { mixEditor } from './plano.js';
import { setTRAT_SEL } from '../nucleo/estado.js';
import { MESES, NM, clsMes } from '../nucleo/calendario.js';

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

// "Adicionar produto": os 159+ produtos do cadastro num select nativo eram uma
// lista sem busca pra rolar inteira -- vira combobox pesquisável, ligado uma
// vez só (os elementos são fixos no HTML, só o conteúdo da lista muda a cada tecla).
// produto inativo some daqui (adicionar linha NOVA na composição) — continua
// valendo normalmente onde já estiver lançado, então nada além da busca muda
const buscaProd = ligarBuscaSelect("#busca_prod", "#lista_prod", "#sel_prod",
  () => insLista().filter(i => i.ativo!==false),
  i => i.prod + (i.pa ? " — " + i.pa : ""), i => i.prod);
// "Tratamento" e persistente (mostra qual esta selecionado, nao some depois de
// um clique) -- por isso usa definir(), sincronizado a cada render, em vez de limpar().
const buscaTrat = ligarBuscaSelect("#busca_trat", "#lista_trat", "#sel_trat", tratCodigos,
  c => c + (TRAT_NOME[c] ? " — " + TRAT_NOME[c] : "") + (TRATC[c] ? " (ajustado)" : ""), c => c);
// "Atividade que usa este tratamento": mesmo criterio do buscaTrat — 61
// atividades num select nativo tambem pedia rolar tudo pra achar uma. Rotulo
// recalcula usosTrat(TRAT_SEL) a cada tecla (nao guarda a lista, ela muda de
// tratamento pra tratamento) pra marcar "(vinculada)" sempre certo.
// atividade inativa some daqui (vincular a um tratamento NOVO) — exceto a que já
// usa o tratamento selecionado, senão a caixa ficaria em branco pra um vínculo
// que já existe e ficou inativo depois
const buscaTratAtiv = ligarBuscaSelect("#busca_trat_ativ", "#lista_trat_ativ", "#sel_trat_ativ",
  () => atividadesLista().filter(a => a.ativo!==false || usosTrat(TRAT_SEL).includes(a.cod)),
  a => `${a.cod} — ${a.nome}${usosTrat(TRAT_SEL).includes(a.cod) ? " (vinculada)" : ""}`, a => a.cod);

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

  // codigo, nome comercial e principio ativo na frente; o resto da
  // classificacao tecnica fica na ficha, que abre por linha
  // colgroup fixa a largura de cada coluna: com table-layout:fixed, recolher um
  // grupo deixa de mexer na largura das outras (ver componentes.css)
  const COLS = [90,190,190,70,110,140,150,90,85,85,100,90,115,80,60,130,75,80,90];
  $("#t_ins").innerHTML =
    `<colgroup>${COLS.map(w=>`<col style="width:${w}px">`).join("")}</colgroup>` +
    th([["Código"],["Nome comercial"],["Princípio ativo"],["Un."],
    ["Concentração"],["Classe agronômica"],["Grupo"],["Volume dem.",1],["Estoque",1],["Preço base",1],
    ["Preço corrigido",1],["Necessidade",1],["Custo de aquisição",1],["Usado em"],["Ativo",1],["Bula"],[""],[""],[""]])+"<tbody>"+
    // quebra por família e, dentro dela, ordem alfabética de princípio ativo.
    // O `ix` que vai na linha é a posição original em insLista() — é por ele que
    // a edição acha o produto, então reordenar a tela não pode reordenar o índice.
    todasFams.filter(fam => !FAM_SEL || fam.id === FAM_SEL).map(fam=>
      `<tr class="stage" data-fam="${fam.id}" role="button" tabindex="0"
           title="Clique para ${dobrada(fam.id)?"abrir":"recolher"} este grupo"><td colspan="19">
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
      // enquanto o produto esta aberto no modal de edicao, a linha vira texto
      // (sem os mesmos data-in/data-ie/data-ip do modal) -- dois inputs com o
      // mesmo dataset ao mesmo tempo confundiam o foco ao digitar em qualquer um
      const editando = INS_EDIT === i.prod;
      return `<tr${editando?' style="opacity:.6"':''}>
        <td>${editando?`<span class="calc">${esc(i.cod)||"—"}</span>`
          :`<input data-in="${ix}" data-f="cod" value="${esc(i.cod)}" placeholder="—">`}</td>
        <td>${editando?`<span class="calc">${esc(i.prod)}</span>`
          :`<input data-in="${ix}" data-f="prod" value="${esc(i.prod)}" style="text-align:left">`}</td>
        <td>${editando?`<span class="calc">${esc(i.pa)||"—"}</span>`
          :`<input data-in="${ix}" data-f="pa" value="${esc(i.pa)}" style="text-align:left" placeholder="a preencher">`}</td>
        <td>${editando?`<span class="calc">${esc(i.un)||"—"}</span>`
          :`<select data-in="${ix}" data-f="un">${UNIDADES.map(u=>
          `<option value="${u}" ${(i.un||"")===u?"selected":""}>${u||"—"}</option>`).join("")}</select>`}</td>
        <td>${editando?`<span class="calc">${esc(i.conc)||"—"}</span>`
          :`<input data-in="${ix}" data-f="conc" value="${esc(i.conc)}" placeholder="ex.: 480 g/L">`}</td>
        <td>${editando?`<span class="calc">${esc(i.classe)||"—"}</span>`
          :`<input data-in="${ix}" data-f="classe" value="${esc(i.classe)}" style="text-align:left" placeholder="—">`}</td>
        <td>${editando?`<span class="calc">${i.fam?esc(todasFamilias().find(f=>f.id===i.fam)?.nome||i.fam):"auto · "+esc(familiaDe(i.classe).nome)}</span>`
          :`<select data-in="${ix}" data-f="fam"
              title="Em branco, o grupo sai da classe agronômica. Escolhendo aqui, a escolha manda e o produto muda de bloco.">
          <option value=""${i.fam?"":" selected"}>auto · ${familiaDe(i.classe).nome}</option>
          ${todasFamilias().map(f=>`<option value="${f.id}"${i.fam===f.id?" selected":""}>${f.nome}</option>`).join("")}
        </select>`}</td>
        <td class="num calc">${fmt(vol,1)}</td>
        <td class="num">${editando?`<span class="calc">${est}</span>`
          :`<input data-ie="${esc(i.prod)}" value="${est}" inputmode="decimal">`}</td>
        <td class="num">${editando?`<span class="calc">${preco}</span>`
          :`<input data-ip="${esc(i.prod)}" value="${preco}" inputmode="decimal">`}</td>
        <td class="num calc">${brl(corr,2)}</td><td class="num calc">${fmt(nec,1)}</td>
        <td class="num ${preco>0?"tot":"calc"}">${preco>0?brl(nec*corr):'<span class="badge b-warn">sem preço</span>'}</td>
        <td class="num calc">${usos?usos+" trat.":"—"}</td>
        <td class="num">${editando?`<span class="calc">${i.ativo===false?"não":"sim"}</span>`
          :`<input type="checkbox" data-inativo="${ix}" ${i.ativo===false?"":"checked"}
             title="Inativo some das buscas para adicionar numa composição nova, mas continua valendo onde já está lançado">`}</td>
        <td>${urlWeb(i.bula_url)
          ? `<a href="${esc(urlWeb(i.bula_url))}" target="_blank" rel="noopener">Ver bula</a>
             <button class="btn" data-agrobusca="${ix}" title="Buscar de novo na Agrofit">↻</button>`
          : `<button class="btn" data-agrobusca="${ix}" title="Buscar a bula na Agrofit pelo nome e fabricante">Buscar</button>`}</td>
        <td>${ficha.length?`<button class="btn" data-infx="${esc(i.prod)}"
          title="Classificação técnica do produto">Ficha</button>`:'<span class="calc">—</span>'}</td>
        <td><button class="btn" data-inedit="${esc(i.prod)}" title="Editar em uma tela maior">Editar</button></td>
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
  buscaTrat && buscaTrat.definir(TRAT_SEL);
  $("#in_trat_nome").value = TRAT_NOME[TRAT_SEL] || "";
  $("#in_trat_obs").value = TRAT_OBS[TRAT_SEL] || "";
  $("#in_trat_cod").value = TRAT_SEL || "";
  buscaProd && buscaProd.limpar();
  $("#c_etapa_sel").innerHTML = TRAT_SEL ? celulaEtapas(TRAT_SEL) : "";

  const comp = composicao(TRAT_SEL);
  const custoHa = comp.reduce((s,l)=>s+doseBase(l)*(precoInsumo(l.prod)+freteEfetivo(l)),0);
  $("#c_trat").value = brl(custoHa,2) + "/ha";

  $("#t_comp").innerHTML = th([["Produto"],["Princípio ativo"],["Dose",1],["Un."],
    ["Preço corrigido",1],["Frete"],["Custo/ha",1],["% do tratamento",1],[""]])+"<tbody>"+
    (comp.length? comp.map((l,i)=>{
      const pr = precoInsumo(l.prod), fr = freteEfetivo(l), c = doseBase(l)*(pr+fr);
      const pp = custoHa>0 ? c/custoHa*100 : 0;
      const reg = insLista().find(x=>x.prod===l.prod);
      const regUn = reg && reg.un;
      // unidades da mesma familia da que o insumo e comprado -- dosar em kg/ha
      // um produto comprado em ton, por exemplo, sem mudar o custo por hectare
      const opcoesUn = unidadesDaFamilia(regUn);
      const unAtual = opcoesUn.includes(l.un) ? l.un : (regUn || l.un || "");
      const f = l.frete || {};
      const unRot = esc(unAtual || regUn || "un");
      return `<tr><td>${esc(l.prod)}</td>
        <td class="calc">${esc((reg&&reg.pa)||"—")}</td>
        <td class="num"><input data-td="${i}" value="${l.dose}" inputmode="decimal"></td>
        <td>${opcoesUn.length>1
          ? `<select data-tud="${i}" title="Unidade em que a dose desta linha foi lançada">${opcoesUn.map(u=>
              `<option value="${u}"${u===unAtual?" selected":""}>${u}/ha</option>`).join("")}</select>`
          : `<span class="calc">${esc(unAtual || "—")}${unAtual?"/ha":""}</span>`}</td>
        <td class="num calc">${pr>0?brl(pr,2):'<span class="badge b-warn">sem preço</span>'}</td>
        <td class="frete-cel">
          <label title="Este insumo tem frete pago à parte, além do preço"><input type="checkbox" data-tfrete="${i}" ${f.on?"checked":""}>Frete</label>
          ${f.on ? `<select data-tfretetipo="${i}">
              <option value="unit"${f.tipo!=="total"?" selected":""}>R$/${unRot}</option>
              <option value="total"${f.tipo==="total"?" selected":""}>Total pago</option>
            </select>
            <input data-tfretevalor="${i}" value="${f.valor||""}" inputmode="decimal"
              placeholder="${f.tipo==="total"?"valor total":"R$/"+unRot}" title="${f.tipo==="total"?"Valor total pago de frete nesta entrega":"Frete por "+unRot}">
            ${f.tipo==="total" ? `<input data-tfreteqtd="${i}" value="${f.qtd||""}" inputmode="decimal"
              placeholder="qtd ${unRot}" title="Quantidade recebida nesta entrega, em ${unRot}">` : ""}` : ""}
        </td>
        <td class="num tot">${brl(c,2)}</td>
        <td class="num calc">${fmt(pp,1)}%</td>
        <td><button class="btn d" data-tr="${i}">Remover</button></td></tr>`;}).join("")
      : `<tr><td colspan="9" class="calc">Tratamento sem produtos. Use o campo abaixo para adicionar.</td></tr>`)+
    `<tr><td class="tot" colspan="4">CUSTO/HA DO TRATAMENTO</td><td></td><td></td>
     <td class="num tot">${brl(custoHa,2)}</td><td class="num tot">${custoHa>0?"100,0%":"—"}</td><td></td></tr></tbody>`;

  // --- 2. atividade e período: liga o tratamento a uma atividade do Plano
  // Operacional e lança a mesma janela de datas e os mesmos meses que a aba
  // Plano Operacional usa — data-dt/data-c/data-m já existem lá (app/eventos.js);
  // aqui é só outro lugar de onde os mesmos campos são editados. ---
  pintarTratPeriodo(R);

  // --- 3. cadastro dos tratamentos: código, nome e etapa de uso ---
  $("#t_trat").innerHTML = th([["Cod_Trat"],["Nome"],["Observação"],["Etapas em que é usado"],["Produtos",1],
    ["Custo/ha",1],["Composição"],["Atividades que usam"],["Custo no plano",1],["Ativo",1],[""]])+"<tbody>"+
    TL.map(t=>{
      const usos = R.L.filter(r=>r.trat===t.cod);
      const areaT = usos.reduce((s,u)=>s+u.total,0);
      return `<tr><td><input data-trc="${esc(t.cod)}" value="${esc(t.cod)}" style="min-width:110px"
                 title="Alterar o código do tratamento"></td>
        <td><input data-trn="${esc(t.cod)}" value="${esc(TRAT_NOME[t.cod]||"")}"
            style="text-align:left;min-width:180px" placeholder="Ex.: Herbicida pré-emergente"></td>
        <td><input data-tro="${esc(t.cod)}" value="${esc(TRAT_OBS[t.cod]||"")}"
            style="text-align:left;min-width:200px" placeholder="Recomendação ou instrução de uso"></td>
        <td style="min-width:176px">${celulaEtapas(t.cod)}</td>
        <td class="num calc">${composicao(t.cod).length}</td>
        <td class="num ${t.custo_ha>0?"tot":"calc"}">${t.custo_ha>0?brl(t.custo_ha,2):"—"}</td>
        <td>${TRATC[t.cod]?'<span class="badge b-warn">ajustado</span>':'<span class="badge b-ok">original</span>'}</td>
        <td class="calc">${usos.length?usos.map(u=>u.a.cod).join(", "):"—"}</td>
        <td class="num ${areaT?"tot":"calc"}">${areaT?brl(areaT*t.custo_ha):"—"}</td>
        <td class="num"><input type="checkbox" data-tra="${esc(t.cod)}" ${TRAT_ATIVO[t.cod]===false?"":"checked"}
            title="Inativo some das buscas para vincular a uma atividade NOVA ou como tratamento extra, mas continua valendo onde já está lançado"></td>
        <td><button class="btn" data-trdup="${esc(t.cod)}" title="Criar uma cópia deste tratamento para ajustar">Duplicar</button>
            <button class="btn d" data-trrm="${esc(t.cod)}">Remover</button></td></tr>`;}).join("")+
    "</tbody>";

  // --- 4. materiais ---
  // mês de alocação do recurso: sem mês, o valor se distribui pela área operada
  const opcMes = sel => `<option value=""${sel==null?" selected":""}>Distribuído no ano</option>`+
    MESES.map((m,j)=>`<option value="${j}"${sel===j?" selected":""}>${m}</option>`).join("");
  $("#t_mat").innerHTML = th([["Categoria"],["Item"],["Un."],["Preço",1],["Qtd",1],["Total",1],["Mês de alocação"],[""]])+"<tbody>"+
    R.MT.linhas.map((m,i)=>`<tr>
      <td><input data-mt="${i}" data-f="cat" value="${esc(m.cat)}" style="text-align:left;min-width:130px"></td>
      <td><input data-mt="${i}" data-f="item" value="${esc(m.item)}" style="text-align:left;min-width:190px"></td>
      <td><input data-mt="${i}" data-f="un" value="${esc(m.un)}" style="text-align:left;width:60px"></td>
      <td class="num"><input data-mt="${i}" data-f="preco" value="${m.preco}" inputmode="decimal"></td>
      <td class="num"><input data-mt="${i}" data-f="qtd" value="${m.qtd}" inputmode="decimal"></td>
      <td class="num tot">${brl(m.total)}</td>
      <td><select data-mt="${i}" data-f="mes" style="min-width:150px"
            title="Mês em que o recurso financeiro é alocado">${opcMes(m.mes)}</select></td>
      <td><button class="btn d" data-mtrm="${i}">Remover</button></td></tr>`).join("")+
    `<tr><td class="tot" colspan="5">TOTAL</td><td class="num tot">${brl(R.MT.total)}</td>
      <td class="calc">${R.MT.distribuido>0.5 ? brl(R.MT.distribuido)+" distribuído" : "todo com mês"}</td><td></td></tr>`+
    // alocação mês a mês, para conferir onde o recurso cai
    `<tr class="sub"><td colspan="8"><div class="hint" style="margin:0">Alocação por mês: ${
      MESES.map((m,j)=>R.MT.mes && R.MT.mes[j]>0.5 ? `<b>${m}</b> ${brl(R.MT.mes[j])}` : "").filter(Boolean).join(" · ") || "—"}</div></td></tr></tbody>`;
}

/* Atividade e período do tratamento selecionado (aba Insumos, painel 2).
   O select liga o tratamento a uma atividade — grava em PLANO[cod].trat, o
   mesmo campo que o dropdown da aba Plano Operacional grava. A tabela de
   datas e meses usa exatamente os atributos data-dt/data-c/data-m que
   app/eventos.js já trata para o Plano Operacional: nenhum handler novo,
   é a mesma atividade vista por outra tela. ATIV_TRAT_SEL é só visão (qual
   atividade das já vinculadas está sendo mostrada) — não é gravado. */
function pintarTratPeriodo(R){
  const lista = atividadesLista();
  const vinculadas = usosTrat(TRAT_SEL);
  const exibindo = vinculadas.includes(ATIV_TRAT_SEL) ? ATIV_TRAT_SEL : (vinculadas[0] || "");
  buscaTratAtiv && buscaTratAtiv.definir(exibindo);

  if(!exibindo){
    $("#t_trat_periodo").innerHTML = "";
    $("#trat_periodo_hint").textContent = vinculadas.length
      ? "" : "Nenhuma atividade usa este tratamento ainda — escolha uma acima para vincular e lançar a área mês a mês.";
    const wrap = $("#trat_extras_wrap"); if(wrap) wrap.hidden = true;
    return;
  }
  const a = lista.find(x=>x.cod===exibindo) || {};
  const p = PLANO[exibindo] || {m:Array(NM).fill(0), trat:""};
  const d = DIM[exibindo] || {};
  // mesmo editor de modo (M/T/U/D/Q/3º) do Plano Operacional, na mesma linha
  // calculada (R.L) — o "›" do 3º já abre o detalhamento por sub-modo (avião,
  // drone, terrestre) de lá, sem handler novo: é tudo delegado em app/eventos.js.
  const linha = R && R.L.find(x=>x.a.cod===exibindo);
  // com tratamento extra, a área aqui em cima vira a SOMA dos tratamentos (ver
  // linha() em calculo/atividade.js) — só leitura; edição desce pro bloco de
  // tratamentos extras logo abaixo, onde cada um tem área própria.
  const temExtras = !!(linha && linha.tratsDetalhe);
  const meses = temExtras ? linha.meses : (p.m || Array(NM).fill(0));
  const totalArea = temExtras ? linha.total : meses.reduce((s,q)=>s+num(q),0);
  $("#t_trat_periodo").innerHTML = th([["Início"],["Fim"],["Un."],...MESES.map((m,j)=>[m,1,clsMes(j)]),
      ["Total planejado",1],["Modo de execução"]])+
    `<tbody><tr>
      <td><input type="date" data-dt="${esc(exibindo)}" data-f="ini" value="${d.ini||""}" max="${d.fim||""}" title="Início da execução"></td>
      <td><input type="date" data-dt="${esc(exibindo)}" data-f="fim" value="${d.fim||""}" min="${d.ini||""}" title="Fim da execução"></td>
      <td class="calc">${esc(a.un||"")}</td>` +
    meses.map((q,j)=> temExtras
      ? `<td class="num calc ${clsMes(j)}" title="Soma dos tratamentos — edite no bloco abaixo">${q?fmt(num(q)):""}</td>`
      : `<td class="num ${clsMes(j)}"><input data-c="${esc(exibindo)}" data-m="${j}" value="${q||""}" inputmode="decimal"></td>`).join("") +
    `<td class="num ${temExtras?"calc":""} tot">${fmt(totalArea)}</td>
     <td>${a.modoOn && linha ? mixEditor(linha) : '<span class="calc">—</span>'}</td>` +
    `</tr></tbody>`;
  $("#trat_periodo_hint").textContent = p.trat===TRAT_SEL
    ? `Lançando para ${a.cod} — ${a.nome}. Início e fim distribuem a área pelos meses automaticamente; os meses continuam editáveis à mão.`
    : `${a.cod} — ${a.nome} ainda usa outro tratamento (${p.trat || "nenhum"}). Escolher esta atividade acima substitui o vínculo.`;
  pintarTratExtras(exibindo, p, linha);
}

/* Dois tratamentos na mesma atividade: cada um com sua área PRÓPRIA, lançada
   à parte — nenhum abate do outro (área exclusiva de cada tratamento). O
   total lá em cima (PLANO[cod].m) continua só dimensionando frota e horas,
   sem ligação com esta quebra por tratamento. Mesma unidade de sempre (mês a
   mês). Ver calculo/atividade.js (tratsDetalhe) para a conta de custo. */
function pintarTratExtras(cod, p, linha){
  const wrap = $("#trat_extras_wrap");
  if(!wrap) return;
  if(!p.trat){ wrap.hidden = true; return; }
  wrap.hidden = false;
  const extras = Array.isArray(p.trats) ? p.trats : [];
  const rotulo = t => TRAT_NOME[t] ? `${esc(t)} — ${esc(TRAT_NOME[t])}` : esc(t);
  // mesma fonte do motor (calculo/atividade.js): sem extra ainda, o principal
  // usa a área cheia (p.m); com extra, tratsDetalhe já traz a área própria de
  // cada um (p.tratM do principal, ou p.m se ele ainda não foi editado à parte).
  const det = (linha && linha.tratsDetalhe) ||
    [{trat:p.trat, area:(p.m||[]).reduce((s,q)=>s+num(q),0), principal:true, m:(p.m||Array(NM).fill(0)).map(num)}];

  let h = th([["Tratamento"],...MESES.map((m,j)=>[m,1,clsMes(j)]),["Total",1],[""]]) + "<tbody>";
  det.forEach((d,i)=>{
    if(d.principal){
      // só vira campo próprio quando já existe extra — com um tratamento só,
      // a área do principal É o total, editado ali em cima; nada a duplicar.
      const editavel = extras.length>0;
      h += `<tr><td class="calc">${rotulo(d.trat)} <span class="badge b-ok">principal</span></td>` +
        d.m.map((q,j)=> editavel
          ? `<td class="num ${clsMes(j)}"><input data-cp="${esc(cod)}" data-m="${j}" value="${q||""}" inputmode="decimal"></td>`
          : `<td class="num calc ${clsMes(j)}">${q?fmt(q):"—"}</td>`).join("") +
        `<td class="num ${editavel?"":"calc"} tot">${fmt(d.area)}</td><td></td></tr>`;
      return;
    }
    // indice do extra dentro de PLANO[cod].trats — det[0] é sempre o principal
    const ix = i-1;
    h += `<tr><td>${rotulo(d.trat)}</td>` +
      d.m.map((q,j)=>`<td class="num ${clsMes(j)}"><input data-cx="${esc(cod)}" data-tx="${ix}" data-m="${j}" value="${q||""}" inputmode="decimal"></td>`).join("") +
      `<td class="num tot">${fmt(d.area)}</td>
       <td><button class="btn d" data-txrm="${esc(cod)}" data-txi="${ix}">Remover</button></td></tr>`;
  });
  $("#t_trat_extras").innerHTML = h + "</tbody>";

  const usados = new Set([p.trat, ...extras.map(e=>e.trat)].filter(Boolean));
  const disponiveis = tratListaTodos().filter(t=>!usados.has(t.cod) && TRAT_ATIVO[t.cod]!==false);
  const selExtra = $("#sel_trat_extra");
  if(selExtra) selExtra.innerHTML = disponiveis.length
    ? disponiveis.map(t=>`<option value="${esc(t.cod)}">${rotulo(t.cod)}</option>`).join("")
    : `<option value="">— todos os tratamentos já estão vinculados —</option>`;
  const btnAdd = $("#btn_trat_extra_add");
  if(btnAdd) btnAdd.disabled = !disponiveis.length;
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

/* ---------- EDITAR PRODUTO, EM MODAL ----------
   Pediram uma tela maior pra editar um produto em vez de mexer nos campos
   espremidos da tabela de 17 colunas — os inputs são os mesmos da linha
   (mesmo data-in/data-ie/data-ip: quem lê o valor no clique de "salvar" nem
   sabe que virou modal), só que numa grade com espaço de sobra. Uma edição
   por vez, igual a ficha técnica: a linha da tabela trava enquanto o modal
   dela estiver aberto, pra não ter dois campos com o mesmo dataset ao mesmo
   tempo — dois campos iguais confundiriam qual deles restaura o foco depois
   de cada tecla (ver leve() em app/ciclo.js). */
function pintarEditIns(){
  const cont = $("#insedit"), fundo = $("#insedit_fundo");
  if(!cont) return;
  const ix = INS_EDIT != null ? insLista().findIndex(x=>x.prod === INS_EDIT) : -1;
  const i = ix >= 0 ? insLista()[ix] : null;
  if(!i){ cont.hidden = true; fundo.hidden = true; return; }
  const ov = INSUMO[i.prod] || {};
  const preco = ov.preco != null ? num(ov.preco) : num(i.preco);
  const est   = ov.est   != null ? num(ov.est)   : num(i.est);
  const campo = (rot, html) => `<div class="fx-item"><b>${rot}</b>${html}</div>`;

  cont.innerHTML = `
    <div class="ra-modal fx-modal pop-in">
    <div class="ra-topo">
      <div class="ra-nav"><div></div>
        <button class="ghost-btn" id="inedit_fechar" title="Fechar" aria-label="Fechar">✕</button></div>
      <div class="ra-tit">${esc(i.prod)}</div>
      <div class="ra-subtit">As alterações salvam sozinhas, assim como na tabela.</div>
    </div>
    <div class="ra-corpo">
      <div class="fx-grade">
        ${campo("Código do material", `<input data-in="${ix}" data-f="cod" value="${esc(i.cod)}" placeholder="—">`)}
        ${campo("Nome comercial", `<input data-in="${ix}" data-f="prod" value="${esc(i.prod)}" style="text-align:left">`)}
        ${campo("Princípio ativo", `<input data-in="${ix}" data-f="pa" value="${esc(i.pa)}" style="text-align:left" placeholder="a preencher">`)}
        ${campo("Unidade", `<select data-in="${ix}" data-f="un">${UNIDADES.map(u=>
          `<option value="${u}" ${(i.un||"")===u?"selected":""}>${u||"—"}</option>`).join("")}</select>`)}
        ${campo("Concentração", `<input data-in="${ix}" data-f="conc" value="${esc(i.conc)}" placeholder="ex.: 480 g/L">`)}
        ${campo("Classe agronômica", `<input data-in="${ix}" data-f="classe" value="${esc(i.classe)}" style="text-align:left" placeholder="—">`)}
        ${campo("Grupo", `<select data-in="${ix}" data-f="fam"
              title="Em branco, o grupo sai da classe agronômica. Escolhendo aqui, a escolha manda e o produto muda de bloco.">
          <option value=""${i.fam?"":" selected"}>auto · ${familiaDe(i.classe).nome}</option>
          ${todasFamilias().map(f=>`<option value="${f.id}"${i.fam===f.id?" selected":""}>${f.nome}</option>`).join("")}
        </select>`)}
        ${campo("Estoque", `<input data-ie="${esc(i.prod)}" value="${est}" inputmode="decimal">`)}
        ${campo("Preço base", `<input data-ip="${esc(i.prod)}" value="${preco}" inputmode="decimal">`)}
        ${campo("Ativo", `<input type="checkbox" data-inativo="${ix}" ${i.ativo===false?"":"checked"}
          title="Inativo some das buscas para adicionar numa composição nova, mas continua valendo onde já está lançado">`)}
      </div>
    </div>
    </div>`;
  cont.hidden = false;
  fundo.hidden = false;
}

export { pintarInsumos, pintarFichaIns, pintarEditIns, alternarFam, aplicarFamIns, buscaExigeRedesenho,
  recolherTodas, todasRecolhidas };
