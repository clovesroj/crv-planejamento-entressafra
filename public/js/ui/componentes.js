import { ETAPAS_ORD } from '../calculo/arrendamento.js';
import { MESES, clsMes } from '../nucleo/calendario.js';
import { $, brl, esc, fmt } from '../nucleo/formato.js';
import { USUARIO } from '../nucleo/sessao.js';

// chave opcional: a chave do rastro. Com ela o card vira botão e abre a
// explicação daquele número — é por onde se entra na composição.
const kpi=(l,c,v,s,chave)=>`<div class="kpi ${c}"${chave?` data-rastro="${chave}" tabindex="0" role="button" title="Ver como este número é composto"`:""}><div class="l">${l}</div><div class="v">${v}</div>${s?`<div class="s">${s}</div>`:""}</div>`;
// [rotulo, alinhaDireita, classeExtra] — a classe extra serve, por exemplo, para marcar o periodo do mes
const th=a=>`<thead><tr>${a.map(x=>{
  const c=[x[1]?"num":"", x[2]||""].filter(Boolean).join(" ");
  return `<th${c?` class="${c}"`:""}>${x[0]}</th>`;
}).join("")}</tr></thead>`;

/* ---------- COLUNAS DE MÊS ----------
   Toda tabela mensal obedece ao filtro de período da barra superior. Quem
   esconde a coluna é o CSS, pela classe de período que estas duas funções
   carimbam no cabeçalho e na célula — por isso as duas têm de ser usadas juntas.

   O total é o que exige cuidado: esconder oito colunas e deixar o total do ano
   ao lado das quatro que sobraram é pior do que não filtrar, porque a linha
   deixa de fechar na tela e quem lê some com a diferença. Daí somaSel() e
   maxSel(), que refazem o fechamento sobre os meses à mostra. */
const thMeses = () => MESES.map((m,i)=>[m,1,clsMes(i)]);
// rastroDe(v,i), opcional: chave do rastro de cada celula (clique e dica ao passar o mouse)
const tdMeses = (arr, f, cls="num calc", rastroDe) =>
  arr.map((v,i)=>{ const k = rastroDe ? rastroDe(v,i) : "";
    return `<td class="${cls} ${clsMes(i)}"${k?` data-rastro="${k}"`:""}>${f(v,i)}</td>`; }).join("");
/** Soma de uma série mensal restrita aos meses que o filtro deixa à mostra. */
const somaSel = (arr, SEL) => SEL.meses.reduce((s,i)=>s+(+arr[i]||0), 0);
/** Pico de uma série mensal dentro do período filtrado. */
const maxSel  = (arr, SEL) => SEL.meses.reduce((m,i)=>Math.max(m, +arr[i]||0), 0);

/* ---------- ORDEM DAS ETAPAS ----------
   Etapa é a ordem em que o ano acontece: prepara, planta, trata, colhe, e o
   apoio corre por fora. A lista de atividades vem na ordem do cadastro, que é
   a ordem em que cada uma foi criada — e corrigir a etapa de uma atividade (a
   muda, que virou PLANTIO) deixou a tela alternando COLHEITA / PLANTIO /
   COLHEITA. Numa tabela com faixa de grupo isso repete a faixa, e a mesma
   etapa passa a aparecer três vezes como se fossem três grupos diferentes.

   Ordenação estável: dentro da etapa, a ordem do cadastro fica de pé — é por
   ela que A04 vem antes de A05, e não há por que inventar outra. `sub`
   desempata antes disso, para o grupo que mora dentro de uma etapa (o Manejo
   Fitossanitário, que é TRATOS CULTURAIS com faixa própria) ficar sempre no
   fim dela, e não no meio, partindo a etapa em duas faixas. */
const ordemEtapa = e => { const i = ETAPAS_ORD.indexOf(e); return i < 0 ? ETAPAS_ORD.length : i; };
const ordenarPorEtapa = (lista, etapaDe, sub) => lista
  .map((r, i) => [r, i])
  .sort((a, b) => ordemEtapa(etapaDe(a[0])) - ordemEtapa(etapaDe(b[0]))
               || (sub ? sub(a[0]) - sub(b[0]) : 0)
               || a[1] - b[1])
  .map(x => x[0]);


/* ---------- BUSCA POR NOME EM TABELA ----------
   Genérica pra qualquer tabela pintada por th()+innerHTML neste app: esconde
   a linha que não bate o termo, sem reconstruir o innerHTML (não perde o que
   o usuário tinha aberto). Linha de grupo (.stage) some se nenhuma linha do
   grupo bateu; linha de total/rodapé (primeira célula .tot) fica sempre
   visível; linha de detalhe (.sub, ou uma célula só com colspan — ficha
   técnica, expansão de frota) segue a linha anterior, nunca é filtrada
   sozinha. Quem chama reaplica no fim de cada pintura, porque o innerHTML é
   reconstruído do zero a cada render() e "esconder" não sobrevive a isso. */
// textContent não pega o value de input/select — em tabela editável (insumo,
// tratamento...) é ali que mora o nome, não em texto solto na célula. E não
// pode pegar o textContent de dentro de um <select> puro: ele carrega TODAS
// as opções do catálogo (ex.: o select de tratamento lista todos os
// tratamentos em toda linha do Plano Operacional), então buscar o nome de
// UM tratamento "achava" TODA linha, mesmo a que não usa aquele tratamento —
// era por isso que buscar "Dessecação" não filtrava nada.
const textoDaLinha = tr => {
  let texto = "";
  const nos = document.createTreeWalker(tr, NodeFilter.SHOW_TEXT, {
    acceptNode: n => n.parentElement.closest("select") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
  });
  for(let n; n = nos.nextNode();) texto += n.textContent + " ";
  return texto + " " + [...tr.querySelectorAll("input,select")].map(el =>
    el.tagName === "SELECT" ? (el.selectedOptions[0] ? el.selectedOptions[0].textContent : "") : el.value
  ).join(" ");
};
function filtrarPorNome(tabelaId, termo){
  const tab = $(tabelaId);
  if(!tab) return;
  const t = (termo||"").trim().toLowerCase();
  /* Pilha de faixas abertas: a do grupo (.stage) e, dentro dela, a do subgrupo
     (.stage2 — o tipo de gente dentro da etapa, no Resumo de Pessoas). Faixa
     some quando nada dentro dela bateu, e o que bate no subgrupo conta para o
     grupo de fora, senao a etapa sumiria levando junto o que o usuario achou.
     Sem termo, nada se esconde: grupo recolhido nao tem linha dentro, e
     esconder a faixa por isso tiraria da tela justamente o que se clica para
     reabrir. */
  const pilha = [];
  const fechar = ate => {
    while(pilha.length > ate){
      const g = pilha.pop();
      g.tr.hidden = t ? !g.bate : false;
      if(pilha.length && g.bate) pilha[pilha.length-1].bate = true;
    }
  };
  [...tab.querySelectorAll("tbody tr")].forEach(tr=>{
    const nivel = tr.classList.contains("stage") ? 1 : tr.classList.contains("stage2") ? 2 : 0;
    if(nivel){ fechar(nivel-1); pilha.push({tr, bate:false}); return; }
    if(tr.children[0] && tr.children[0].classList.contains("tot")){ tr.hidden = false; return; }
    const detalhe = tr.classList.contains("sub") || (tr.children.length===1 && tr.children[0].hasAttribute("colspan"));
    if(detalhe){ const mae = tr.previousElementSibling; tr.hidden = mae ? mae.hidden : false; return; }
    const bate = !t || textoDaLinha(tr).toLowerCase().includes(t);
    tr.hidden = !bate;
    if(bate && pilha.length) pilha[pilha.length-1].bate = true;
  });
  fechar(0);
}
/* Acha toda caixa de busca já na tela (marcada com a classe, aponta a tabela
   pelo data-alvo) e reaplica o termo que já estava digitado nela. Chamado uma
   vez no fim do render() inteiro — dispensa cada tela lembrar de re-filtrar
   a própria tabela depois de repintá-la. */
function reaplicarBuscas(){
  document.querySelectorAll('.tbl-busca').forEach(inp=>filtrarPorNome(inp.dataset.alvo, inp.value));
}

/* ---------- COMBOBOX DE BUSCA (select nativo com muita opção vira pesquisável)
   O valor escolhido mora num <input type="hidden">, com o mesmo id que o
   <select> tinha antes — quem lê `$(id).value` no clique de um botão não muda
   nada. `itens()` é chamado a cada tecla, não uma vez só: assim a lista
   sempre reflete o estado atual (ex.: cadastro de insumos crescendo), sem
   precisar recriar o combobox a cada render(). Liga uma vez, no arranque.
   `rotulo` é o texto da lista e o que fica na caixa depois de escolher;
   `valorDe` (opcional, default = rotulo) é o que vai pro campo escondido —
   separado porque a lista pode mostrar "Ureia — N 45%" e o valor ser só "Ureia". */
function ligarBuscaSelect(buscaId, listaId, valorId, itens, rotulo, valorDe){
  const busca = $(buscaId), lista = $(listaId), valor = $(valorId);
  if(!busca || !lista || !valor) return null;
  valorDe = valorDe || rotulo;
  let foco = -1;
  // escolha vigente. Com o rotulo dela ainda na caixa, a lista mostra tudo: ele
  // e o valor escolhido, nao um termo de busca — filtrar por ele deixava so a
  // propria escolha na lista, e o que se digitava ia pro fim do rotulo e nao
  // achava nada ("A10 — Plantio (vinculada)grad")
  let atual = {valor:"", rotulo:""};
  const opcoes = termo => {
    const t = (termo||"").trim().toLowerCase();
    const tudo = !t || termo === atual.rotulo;
    return itens().filter(i => tudo || rotulo(i).toLowerCase().includes(t));
  };
  function pintar(){
    const op = opcoes(busca.value);
    lista.innerHTML = op.length
      ? op.map((i,ix)=>`<div class="lista-select-item${ix===foco?" foco":""}" data-ix="${ix}">${esc(rotulo(i))}</div>`).join("")
      : `<div class="lista-select-vazia">Nada encontrado</div>`;
    lista.hidden = false;
    busca.setAttribute("aria-expanded","true");
  }
  function fechar(){ lista.hidden = true; foco = -1; busca.setAttribute("aria-expanded","false"); }
  // dispara "change" no campo escondido: quem escutava o <select> antigo (ex.: trocar de
  // tratamento redesenha a tela) continua funcionando sem saber que virou combobox
  function escolher(i){
    valor.value = valorDe(i); busca.value = rotulo(i); fechar();
    atual = {valor: valor.value, rotulo: busca.value};
    valor.dispatchEvent(new Event("change", {bubbles:true}));
  }
  busca.addEventListener("input", ()=>{ foco = -1; valor.value = ""; pintar(); });
  // entrar na caixa seleciona o texto: digitar substitui a escolha em vez de
  // emendar nela. O mouseup do clique desfaria a selecao, dai o par abaixo
  let entrouNoClique = false;
  busca.addEventListener("mousedown", ()=>{ entrouNoClique = document.activeElement !== busca; });
  busca.addEventListener("mouseup", e=>{ if(entrouNoClique){ e.preventDefault(); entrouNoClique = false; } });
  busca.addEventListener("focus", ()=>{ busca.select(); pintar(); });
  busca.addEventListener("blur", ()=>setTimeout(()=>{   // da tempo do mousedown na lista rodar antes
    fechar();
    // saiu sem escolher: volta a escolha vigente, senao quem le o campo
    // escondido (ex.: adicionar tratamento extra) ficaria sem valor
    if(!valor.value){ valor.value = atual.valor; busca.value = atual.rotulo; }
  },150));
  busca.addEventListener("keydown", e=>{
    const op = opcoes(busca.value);
    if(e.key==="ArrowDown"){ e.preventDefault(); foco = Math.min(foco+1, op.length-1); pintar(); }
    else if(e.key==="ArrowUp"){ e.preventDefault(); foco = Math.max(foco-1, 0); pintar(); }
    else if(e.key==="Enter"){ if(op[foco]){ e.preventDefault(); escolher(op[foco]); } }
    else if(e.key==="Escape"){ fechar(); }
  });
  lista.addEventListener("mousedown", e=>{   // mousedown, nao click: roda antes do blur fechar a lista
    const item = e.target.closest(".lista-select-item");
    if(!item) return;
    escolher(opcoes(busca.value)[+item.dataset.ix]);
  });
  return {
    limpar(){ busca.value = ""; valor.value = ""; atual = {valor:"", rotulo:""}; fechar(); },
    // sincroniza a caixa com um valor que mudou por fora (ex.: repintar depois
    // do proprio "change" trocar o estado) -- sem disparar "change" de novo
    definir(v){
      valor.value = v;
      const item = itens().find(i=>valorDe(i)===v);
      busca.value = item ? rotulo(item) : "";
      atual = {valor: v, rotulo: busca.value};
    },
  };
}

/* ---------- CÉLULA DE TABELA COM BUSCA (mesmo combobox, por linha) ----------
   `ligarBuscaSelect()` liga uma vez, em id fixo -- serve para os pickers
   "adicionar item novo", que existem uma vez só na tela. Uma linha de tabela
   não tem esse luxo: `render()` recria o <tbody> inteiro a cada troca (célula,
   linha nova, etc.), então qualquer listener preso a um id morreria junto.
   Em vez de religar a cada render(), o listener é um só, delegado no
   `document` (liga uma vez, no arranque, igual ao olho da senha abaixo) --
   `registrarCombo()` cadastra de onde vem a lista de cada campo (ex.: função,
   máquina, tratamento), e a célula descobre isso pelo próprio `data-combo` na
   hora do evento, não importa quantas vezes a linha foi recriada.

   `itens(valorAtual)` recebe o valor já gravado nesta célula -- é o que deixa
   a lista incluir, por exemplo, um código de função que saiu do cadastro mas
   uma atividade antiga ainda usa (ver `funcaoItens()` em ui/plano.js).
   O valor de verdade mora no <input type=hidden>, com os mesmos `data-*` que
   o <select> nativo tinha -- por isso `escolherCombo()` dispara "change" nele:
   quem já escutava aquele campo (`app/eventos.js`) continua funcionando sem
   saber que virou combobox. Digitar no campo visível nunca grava nada sozinho
   -- só filtra a lista; sair sem escolher volta pro rótulo do valor gravado. */
const REGISTROS_COMBO = {};
/** rotulo/valorDe recebem um item da lista; valorDe (opcional) default = rotulo. */
function registrarCombo(nome, itens, rotulo, valorDe){
  REGISTROS_COMBO[nome] = { itens, rotulo, valorDe: valorDe || rotulo };
}
/** Markup de uma célula pronta pra `registrarCombo(nome, ...)`.
    `dataAttrs` é a string de atributos (ex.: `data-ap="3" data-f="maq"`) que o
    campo escondido carrega -- os mesmos que o <select> substituído tinha.
    `desabilitado` imita o <select disabled>: campo visível travado, sem lista.
    O campo visível nasce já com o RÓTULO do valor gravado, não o valor cru --
    senão toda vez que render() recria a linha (inclusive logo depois de uma
    escolha, pelo próprio "change" que a escolha dispara) o campo voltava a
    mostrar só o código, até a próxima vez que alguém abrisse a caixa. */
function celulaBusca(nome, valorAtual, dataAttrs, desabilitado){
  const reg = REGISTROS_COMBO[nome];
  const item = reg ? reg.itens(valorAtual).find(i=>reg.valorDe(i)===valorAtual) : null;
  const rotuloAtual = item ? reg.rotulo(item) : (valorAtual || "");
  return `<span class="combo-cel" data-combo="${esc(nome)}">
    <input type="text" class="combo-busca" value="${esc(rotuloAtual)}" autocomplete="off"
           role="combobox" aria-expanded="false"${desabilitado?" disabled":""}>
    <input type="hidden" ${dataAttrs} value="${esc(valorAtual)}">
    <div class="lista-select" role="listbox" hidden></div></span>`;
}
let focoComboCel = -1;
function contextoComboCel(el){
  const cel = el.closest && el.closest(".combo-cel");
  if(!cel) return null;
  const reg = REGISTROS_COMBO[cel.dataset.combo];
  if(!reg) return null;
  return { reg, busca: cel.querySelector(".combo-busca"), oculto: cel.querySelector("input[type=hidden]"),
           lista: cel.querySelector(".lista-select") };
}
// escolha vigente: com o rotulo dela ainda na caixa a lista mostra tudo, do
// jeito que ligarBuscaSelect() ja faz pros pickers singleton -- ele e o valor
// escolhido, nao um termo de busca, e filtrar por ele deixaria so ele mesmo
function opcoesComboCel(ctx){
  const t = ctx.busca.value.trim().toLowerCase();
  const itens = ctx.reg.itens(ctx.oculto.value);
  if(!t) return itens;
  const atual = itens.find(i=>ctx.reg.valorDe(i)===ctx.oculto.value);
  if(atual && ctx.busca.value===ctx.reg.rotulo(atual)) return itens;
  return itens.filter(i=>ctx.reg.rotulo(i).toLowerCase().includes(t));
}
function pintarComboCel(ctx){
  const op = opcoesComboCel(ctx);
  ctx.lista.innerHTML = op.length
    ? op.map((i,ix)=>`<div class="lista-select-item${ix===focoComboCel?" foco":""}" data-ix="${ix}">${esc(ctx.reg.rotulo(i))}</div>`).join("")
    : `<div class="lista-select-vazia">Nada encontrado</div>`;
  ctx.lista.hidden = false;
  ctx.busca.setAttribute("aria-expanded","true");
}
function fecharComboCel(ctx){
  ctx.lista.hidden = true; ctx.lista.innerHTML = ""; focoComboCel = -1;
  ctx.busca.setAttribute("aria-expanded","false");
}
// volta o texto visivel pro rotulo do valor ja gravado, sem disparar nada --
// e o que acontece ao sair do campo sem escolher (digitou e desistiu)
function reverterComboCel(ctx){
  const item = ctx.reg.itens(ctx.oculto.value).find(i=>ctx.reg.valorDe(i)===ctx.oculto.value);
  ctx.busca.value = item ? ctx.reg.rotulo(item) : ctx.oculto.value;
  fecharComboCel(ctx);
}
function escolherComboCel(ctx, item){
  ctx.oculto.value = ctx.reg.valorDe(item);
  ctx.busca.value = ctx.reg.rotulo(item);
  fecharComboCel(ctx);
  ctx.oculto.dispatchEvent(new Event("change", {bubbles:true}));
}
// entrar na caixa seleciona o texto: digitar substitui a escolha em vez de
// emendar nela. O mouseup do clique desfaria a selecao, dai o par abaixo
// (mesmo truque de ligarBuscaSelect() acima)
let comboCelEntrouNoClique = false;
document.addEventListener("mousedown", e=>{
  if(!e.target.classList || !e.target.classList.contains("combo-busca")) return;
  comboCelEntrouNoClique = document.activeElement !== e.target;
});
document.addEventListener("mouseup", e=>{
  if(!e.target.classList || !e.target.classList.contains("combo-busca")) return;
  if(comboCelEntrouNoClique){ e.preventDefault(); comboCelEntrouNoClique = false; }
});
document.addEventListener("focusin", e=>{
  if(!e.target.classList || !e.target.classList.contains("combo-busca")) return;
  const ctx = contextoComboCel(e.target); if(!ctx) return;
  e.target.select();
  focoComboCel = -1; pintarComboCel(ctx);
});
document.addEventListener("input", e=>{
  if(!e.target.classList || !e.target.classList.contains("combo-busca")) return;
  const ctx = contextoComboCel(e.target); if(!ctx) return;
  focoComboCel = -1; pintarComboCel(ctx);
});
// timeout: da tempo do mousedown da lista escolher() antes do campo perder o foco
document.addEventListener("focusout", e=>{
  if(!e.target.classList || !e.target.classList.contains("combo-busca")) return;
  const ctx = contextoComboCel(e.target); if(!ctx) return;
  setTimeout(()=>{ if(!ctx.lista.hidden) reverterComboCel(ctx); }, 150);
});
document.addEventListener("keydown", e=>{
  if(!e.target.classList || !e.target.classList.contains("combo-busca")) return;
  const ctx = contextoComboCel(e.target); if(!ctx) return;
  const op = opcoesComboCel(ctx);
  if(e.key==="ArrowDown"){ e.preventDefault(); focoComboCel = Math.min(focoComboCel+1, op.length-1); pintarComboCel(ctx); }
  else if(e.key==="ArrowUp"){ e.preventDefault(); focoComboCel = Math.max(focoComboCel-1, 0); pintarComboCel(ctx); }
  else if(e.key==="Enter"){ if(op[focoComboCel]){ e.preventDefault(); escolherComboCel(ctx, op[focoComboCel]); } }
  else if(e.key==="Escape"){ reverterComboCel(ctx); }
});
document.addEventListener("mousedown", e=>{
  const item = e.target.closest && e.target.closest(".lista-select-item");
  if(!item) return;
  const ctx = contextoComboCel(item); if(!ctx) return;
  escolherComboCel(ctx, opcoesComboCel(ctx)[+item.dataset.ix]);
});

/* ---------- MOSTRAR/OCULTAR SENHA ----------
   Um botão por campo (data-alvo aponta o id do <input>), delegado no
   document: cobre a tela de login (antes de qualquer sessão existir) e o
   cadastro de usuários (admin) com o mesmo listener, sem precisar religar
   nada quando o card é repintado. Só troca o type do input — não existe
   "ver a senha salva de alguém": a senha do servidor é um hash, irreversível;
   isto só revela o que a própria pessoa está digitando agora. */
document.addEventListener('click', e => {
  const botao = e.target.closest('.olho-senha');
  if (!botao) return;
  const alvo = document.getElementById(botao.dataset.alvo);
  if (!alvo) return;
  const mostrando = alvo.type === 'text';
  alvo.type = mostrando ? 'password' : 'text';
  botao.textContent = mostrando ? '👁' : '🙈';
  botao.setAttribute('aria-label', mostrando ? 'Mostrar senha' : 'Ocultar senha');
});

/* ---------- REORDENAR COLUNA NO ARRASTO ----------
   Preferência pessoal de leitura, não dado do plano: fica só no navegador,
   por usuário (login na chave), nunca no documento compartilhado — não é o
   tipo de coisa que devia mudar a tela de outra pessoa. `fixas` tranca as N
   primeiras colunas na frente (não arrastam, não trocam de lugar): é o que
   preserva a coluna congelada do Plano Operacional, por exemplo. */
const chaveOrdem = tabelaId => `crv_ordem_col:${(USUARIO&&USUARIO.login)||"anon"}:${tabelaId}`;
function ordemSalva(tabelaId){
  try{ const raw = localStorage.getItem(chaveOrdem(tabelaId)); return raw ? JSON.parse(raw) : null; }
  catch(e){ return null; }
}
function salvarOrdem(tabelaId, ordem){
  try{ localStorage.setItem(chaveOrdem(tabelaId), JSON.stringify(ordem)); }catch(e){}
}
function habilitarReordenacao(tabelaId, fixas=0){
  const tab = $(tabelaId);
  if(!tab) return;
  const linhas = [tab.querySelector('thead tr'), ...tab.querySelectorAll('tbody tr')].filter(Boolean);
  const ths = [...tab.querySelectorAll('thead th')];
  const nCols = ths.length;
  if(nCols - fixas < 2) return;   // nada para trocar de lugar
  const salvo = ordemSalva(tabelaId);
  // moveis[posicaoVisivel] = indice original da coluna; comeca na ordem do cadastro
  const moveis = (salvo && salvo.length===nCols-fixas) ? salvo.slice() : ths.map((_,i)=>i).slice(fixas);
  // tabela com colgroup (ex.: #t_ins, table-layout:fixed) tira a largura do <col>,
  // nao da celula — reordenar so a linha deixava a largura presa na posicao antiga
  // e o conteudo (que mudou de coluna) saia com o tamanho errado
  const colgroup = tab.querySelector(':scope > colgroup');
  const cols = colgroup ? [...colgroup.children] : null;
  const aplicar = () => {
    linhas.forEach(tr=>{
      const cels = [...tr.children];
      if(cels.length !== nCols) return;   // linha de grupo/total/detalhe: uma celula so, nao mexe
      const frag = document.createDocumentFragment();
      for(let i=0;i<fixas;i++) frag.appendChild(cels[i]);
      moveis.forEach(i=>{ if(cels[i]) frag.appendChild(cels[i]); });
      tr.appendChild(frag);
    });
    if(cols && cols.length===nCols){
      const frag = document.createDocumentFragment();
      for(let i=0;i<fixas;i++) frag.appendChild(cols[i]);
      moveis.forEach(i=>{ if(cols[i]) frag.appendChild(cols[i]); });
      colgroup.appendChild(frag);
    }
  };
  // so mexe no DOM se houver ordem customizada de verdade — render() chama isto
  // a cada tecla digitada em qualquer tabela do app, e reordenar sem necessidade
  // custaria caro pra maioria das tabelas, que nunca tiveram coluna arrastada
  if(salvo) aplicar();
  let arrastando = null;
  ths.forEach((th,origIdx)=>{
    if(origIdx<fixas) return;
    th.draggable = true;
    th.classList.add('th-arrasta');
    th.addEventListener('dragstart', ()=>{ arrastando=origIdx; th.classList.add('arrastando'); });
    th.addEventListener('dragend', ()=>{ th.classList.remove('arrastando'); th.classList.remove('sobre'); arrastando=null; });
    th.addEventListener('dragover', e=>e.preventDefault());
    th.addEventListener('dragenter', ()=>{ if(arrastando!==null && arrastando!==origIdx) th.classList.add('sobre'); });
    th.addEventListener('dragleave', ()=>th.classList.remove('sobre'));
    th.addEventListener('drop', e=>{
      e.preventDefault();
      th.classList.remove('sobre');
      if(arrastando===null || arrastando===origIdx) return;
      const de = moveis.indexOf(arrastando), para = moveis.indexOf(origIdx);
      if(de<0 || para<0) return;
      // troca só as duas colunas de lugar — inserir (splice) empurrava tudo
      // entre origem e destino uma casa, dando a impressão de que a coluna
      // "pulava" pra longe de onde foi largada
      [moveis[de], moveis[para]] = [moveis[para], moveis[de]];
      salvarOrdem(tabelaId, moveis);
      aplicar();
    });
  });
}

/* ---------- EXPORTAR TABELA (CSV, Excel, PDF) ----------
   Generico para qualquer tabela do app pintada por th()+innerHTML — nao pede
   nada novo em cada tela, so escaneia toda <table id> do documento (mesmo
   criterio de reaplicarBuscas/habilitarReordenacao) e planta um botao antes
   dela, uma vez so (ver o guard por id "exp_"+id — o botao nao muda entre
   renders, so a tabela por baixo dele). Sem biblioteca nenhuma:
     · CSV é nativo do navegador (Blob + <a download>).
     · "Excel" é uma tabela HTML baixada com extensão .xls — o Excel abre
       normal (é um formato que ele reconhece de longa data), sem gerar o
       binário real de .xlsx.
     · PDF abre a janela de impressão do próprio navegador, numa aba nova só
       com a tabela — a pessoa escolhe "Salvar como PDF" no destino.
   Le sempre o que esta VISIVEL na hora do clique (offsetParent!==null cobre
   tanto a linha escondida pela busca [hidden] quanto a coluna escondida pelo
   filtro de período [display:none em .mN]) — exporta o que a tela mostra,
   não o documento inteiro por baixo. */
function celulaVisivel(el){ return el.offsetParent !== null; }
function textoCelula(td){
  // mesmo criterio de textoDaLinha(): input/select valem pelo valor/opção
  // marcada, não pelo texto solto — uma célula de tabela editável não tem
  // texto nenhum fora do controle
  const campos = [...td.querySelectorAll("input,select")];
  if(campos.length){
    return campos.map(el =>
      el.tagName === "SELECT" ? (el.selectedOptions[0] ? el.selectedOptions[0].textContent : "")
      : (el.type === "checkbox" ? (el.checked ? "sim" : "não") : el.value)
    ).filter(v=>v!=="").join(" ");
  }
  return td.textContent.replace(/\s+/g," ").trim();
}
function linhasParaExportar(tab){
  const cab = [...tab.querySelectorAll("thead th")].filter(celulaVisivel).map(th=>th.textContent.replace(/\s+/g," ").trim());
  const linhas = [...tab.querySelectorAll("tbody tr")].filter(celulaVisivel)
    .map(tr => [...tr.children].filter(celulaVisivel).map(textoCelula));
  return {cab, linhas};
}
function baixarArquivo(nome, conteudo, mime){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([conteudo], {type: mime}));
  a.download = nome;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
}
function celulaCSV(v){
  const s = String(v ?? "");
  return /[",;\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s;
}
// ponto e virgula: e o separador que o Excel em portugues espera sem passar
// por assistente de importacao (a virgula ali e separador decimal)
function exportarCSV(tab, nome){
  const {cab, linhas} = linhasParaExportar(tab);
  const texto = [cab, ...linhas].map(l=>l.map(celulaCSV).join(";")).join("\r\n");
  baixarArquivo(nome+".csv", "﻿"+texto, "text/csv;charset=utf-8");
}
function exportarExcel(tab, nome){
  const {cab, linhas} = linhasParaExportar(tab);
  const html = `<html><head><meta charset="utf-8"></head><body><table border="1">`+
    `<thead><tr>${cab.map(c=>`<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>`+
    linhas.map(l=>`<tr>${l.map(c=>`<td>${esc(c)}</td>`).join("")}</tr>`).join("")+
    `</tbody></table></body></html>`;
  baixarArquivo(nome+".xls", html, "application/vnd.ms-excel;charset=utf-8");
}
function exportarPDF(tab, nome){
  const {cab, linhas} = linhasParaExportar(tab);
  const jan = window.open("", "_blank");
  if(!jan){ alert("O navegador bloqueou a janela de impressão. Permita pop-ups para exportar em PDF."); return; }
  jan.document.write(`<html><head><title>${esc(nome)}</title><meta charset="utf-8"><style>
    body{font-family:Arial,sans-serif;font-size:11px;color:#222}
    h1{font-size:15px;margin:0 0 10px}
    table{border-collapse:collapse;width:100%}
    th,td{border:1px solid #999;padding:4px 7px;text-align:left}
    th{background:#eee}
    @page{size:landscape;margin:12mm}
  </style></head><body>
  <h1>${esc(nome)}</h1>
  <table><thead><tr>${cab.map(c=>`<th>${esc(c)}</th>`).join("")}</tr></thead>
  <tbody>${linhas.map(l=>`<tr>${l.map(c=>`<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>
  <script>window.onload=function(){window.print();}<\/script>
  </body></html>`);
  jan.document.close();
}
function exportarTabela(tabelaId, formato, nome){
  const tab = $(tabelaId);
  if(!tab) return;
  const arq = nome || tabelaId.replace(/^#/,"");
  if(formato==="csv") exportarCSV(tab, arq);
  else if(formato==="xls") exportarExcel(tab, arq);
  else if(formato==="pdf") exportarPDF(tab, arq);
}
/* Planta o botao de exportar antes de cada <table id>, uma vez so por id —
   chamado no fim de reaplicarTabelas() (app/ciclo.js), depois que os
   pintores ja recriaram todas as tabelas do zero. */
function reaplicarExportar(){
  document.querySelectorAll("table[id]").forEach(tab=>{
    if(!tab.querySelector("thead th")) return;         // tabela ainda vazia
    const barId = "exp_"+tab.id;
    if(document.getElementById(barId)) return;          // ja montado — botao nao muda entre renders
    const host = tab.closest(".tblwrap") || tab;
    if(!host.parentNode) return;
    const bar = document.createElement("div");
    bar.id = barId; bar.className = "tbl-export";
    const alvo = "#"+tab.id;
    bar.innerHTML = ["csv","xls","pdf"].map(f=>
      `<button type="button" class="btn xs" data-exportar="${f}" data-alvo="${alvo}"
         title="Baixar esta tabela em ${f==="csv"?"CSV":f==="xls"?"Excel":"PDF"}">${f.toUpperCase()}</button>`).join("");
    host.parentNode.insertBefore(bar, host);
  });
}

/* ---------- GRÁFICOS ---------- */
/* Serie mensal de um grafico de barras, so com os meses do periodo escolhido
   na barra do topo (Ano todo, Safra, Entressafra ou meses avulsos). As
   tabelas ja escondiam as colunas fora do periodo; o grafico desenhava os doze
   meses sempre, e "Entressafra" continuava mostrando abril a novembro. */
function serieDoPeriodo(valores, SEL){
  const idx = SEL && Array.isArray(SEL.meses) && SEL.meses.length ? SEL.meses : MESES.map((m,i)=>i);
  return idx.map(i=>({l:MESES[i], v:+valores[i]||0}));
}
function barras(el,dados,cor,un){
  const W=760,H=210,ml=64,mb=34,mt=12,mr=10;
  const max=Math.max(...dados.map(d=>d.v),1), bw=(W-ml-mr)/dados.length;
  let s=`<svg viewBox="0 0 ${W} ${H}" class="chart">`;
  for(let i=0;i<=4;i++){const y=mt+(H-mt-mb)*i/4,v=max*(1-i/4);
    s+=`<line x1="${ml}" y1="${y}" x2="${W-mr}" y2="${y}" stroke="var(--line)"/>
        <text x="${ml-7}" y="${y+4}" text-anchor="end" font-size="9.5" fill="var(--grey)">${fmt(v/1000)}k</text>`;}
  dados.forEach((d,i)=>{const hh=(H-mt-mb)*(d.v/max),x=ml+i*bw+bw*.18,y=H-mb-hh;
    const ly=Math.max(y-5,mt+9);
    s+=`<rect x="${x}" y="${y}" width="${bw*.64}" height="${Math.max(hh,0)}" fill="${cor}" rx="2"><title>${d.l}: ${un?fmt(d.v)+" "+un:brl(d.v)}</title></rect>
        <text x="${ml+i*bw+bw/2}" y="${ly}" text-anchor="middle" font-size="9" font-weight="700" fill="var(--ink)">${d.v>0?fmt(d.v/1000,0)+"k":""}</text>
        <text x="${ml+i*bw+bw/2}" y="${H-mb+14}" text-anchor="middle" font-size="9.5" fill="var(--grey)">${d.l}</text>`;});
  el.innerHTML=s+`</svg>`;
}
/* Custo mensal com a cor do periodo: safra no azul da marca, entressafra no
   ambar -- as mesmas cores das etiquetas de periodo do app. So os meses do
   recorte da barra do topo. Cada barra tem rastro (dica e clique): o calculo
   do mes. A legenda traz o total e a media mensal de cada periodo. */
const COR_PER = {safra:"var(--leaf)", entressafra:"var(--warn)"};
function barrasPeriodo(el, legEl, valores, SEL, perDe){
  const idx = SEL && SEL.meses && SEL.meses.length ? SEL.meses : MESES.map((m,i)=>i);
  const dados = idx.map(i=>({i, l:MESES[i], v:+valores[i]||0, per:perDe(i)}));
  const W=760,H=230,ml=64,mb=34,mt=16,mr=10;
  const max=Math.max(...dados.map(d=>d.v),1), bw=(W-ml-mr)/Math.max(dados.length,1);
  let s=`<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Custo mensal por período">`;
  for(let k=0;k<=4;k++){const y=mt+(H-mt-mb)*k/4,v=max*(1-k/4);
    s+=`<line x1="${ml}" y1="${y}" x2="${W-mr}" y2="${y}" stroke="var(--line)"/>
        <text x="${ml-7}" y="${y+4}" text-anchor="end" font-size="9.5" fill="var(--grey)">${fmt(v/1000)}k</text>`;}
  // media mensal de cada periodo, tracejada, so no trecho dos seus meses
  ["safra","entressafra"].forEach(p=>{
    const ds = dados.filter(d=>d.per===p); if(!ds.length) return;
    const med = ds.reduce((t,d)=>t+d.v,0)/ds.length, y = H-mb-(H-mt-mb)*(med/max);
    const x1 = ml+dados.indexOf(ds[0])*bw, x2 = ml+(dados.indexOf(ds[ds.length-1])+1)*bw;
    s+=`<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${COR_PER[p]}" stroke-width="1.5" stroke-dasharray="5 4" opacity=".9"/>`;
  });
  dados.forEach((d,k)=>{const hh=(H-mt-mb)*(d.v/max),x=ml+k*bw+bw*.18,y=H-mb-hh, ly=Math.max(y-5,mt+9);
    s+=`<g data-rastro="mes:${d.i}"><rect x="${ml+k*bw}" y="${mt}" width="${bw}" height="${H-mt-mb}" fill="transparent"/>
        <rect x="${x}" y="${y}" width="${bw*.64}" height="${Math.max(hh,0)}" fill="${COR_PER[d.per]}" rx="2"/>
        <text x="${ml+k*bw+bw/2}" y="${ly}" text-anchor="middle" font-size="9" font-weight="700" fill="var(--ink)">${d.v>0?fmt(d.v/1000,0)+"k":""}</text>
        <text x="${ml+k*bw+bw/2}" y="${H-mb+14}" text-anchor="middle" font-size="9.5" fill="var(--grey)">${d.l}</text></g>`;});
  el.innerHTML = s+`</svg>`;
  if(legEl) legEl.innerHTML = ["safra","entressafra"].map(p=>{
    const ds = dados.filter(d=>d.per===p); if(!ds.length) return "";
    const tot = ds.reduce((t,d)=>t+d.v,0);
    return `<span class="leg-per" data-rastro="periodo:${p}"><i style="background:${COR_PER[p]}"></i>
      <b>${p==="safra"?"Safra":"Entressafra"}</b> ${brl(tot)} · média ${brl(tot/ds.length)}/mês
      <span class="calc">(${ds.length} ${ds.length===1?"mês":"meses"}; tracejado = média)</span></span>`; }).join("");
}
/** `un` (opcional): unidade do valor no tooltip (ex.: "pessoas") em vez de
    dinheiro -- default = brl(), que é o que os gráficos de custo já usavam. */
function barrasH(el,dados,un){
  // paleta do campo: folha, palha, céu, latossolo e tons intermediários
  /* Rampa do azul da marca, do escuro ao claro. A barra e ordenada da maior
     para a menor e cada uma tem o rotulo ao lado: quem identifica a categoria
     e o texto, nao a cor — entao a cor pode ordenar em vez de distinguir, e o
     grafico fica na mesma identidade do resto do app. */
  const cores=["#12315C","#1B3C6E","#22497F","#2A57A0","#3A69B4","#4E7DC4","#6290D0","#77A2DA",
               "#8DB3E3","#A3C3EB","#B9D2F1","#CFE0F7"];
  const tot=dados.reduce((s,d)=>s+d.v,0)||1, W=760,rh=24,H=dados.length*rh+10,ml=185;
  let s=`<svg viewBox="0 0 ${W} ${H}" class="chart">`;
  dados.forEach((d,i)=>{const y=i*rh+5,w=(W-ml-105)*(d.v/tot);
    s+=`<text x="${ml-8}" y="${y+13}" text-anchor="end" font-size="10.5" fill="var(--ink)">${d.l}</text>
        <rect x="${ml}" y="${y+2}" width="${Math.max(w,1)}" height="14" fill="${cores[i%12]}" rx="3"><title>${un?fmt(d.v)+" "+un:brl(d.v)}</title></rect>
        <text x="${ml+w+7}" y="${y+14}" font-size="10" fill="var(--grey)">${fmt(d.v/tot*100,1)}%</text>`;});
  el.innerHTML=s+`</svg>`;
}


/* ---------- GRÁFICOS DE PESSOAS (Resumo geral) ----------
   Toda parte de gráfico leva a chave do rastro (data-rastro): passar o mouse
   mostra a dica com o detalhe, e o clique abre o detalhamento completo -- o
   mesmo mecanismo de qualquer número do app, sem dica escrita à mão. As chaves
   chegam prontas de quem chama; aqui só se escapa o texto. */
const qtdTxt = v => fmt(v, v>0 && v<10 && Math.abs(v-Math.round(v))>0.05 ? 1 : 0);
// passo "redondo" do eixo (1, 2, 2,5 ou 5 × 10^n): o eixo lê 0, 250, 500... e não 311, 623
const passoRedondo = v => { if(!(v>0)) return 1; const e = Math.pow(10, Math.floor(Math.log10(v))), f = v/e;
  return (f<=1 ? 1 : f<=2 ? 2 : f<=2.5 ? 2.5 : f<=5 ? 5 : 10)*e; };

/* Barras empilhadas por mês. o = {meses:[i], series:[{nome, cor, vals, rastro(i)}],
   linha:{nome, cor, vals}|null, rastroCol(i)}. A coluna inteira tem a chave do
   mês; cada pedaço, a do seu grupo naquele mês. A linha tracejada (ex.: quadro
   atual disponível) não intercepta o mouse. */
function barrasEmpilhadas(el, legEl, o){
  const W=960,H=300,ml=54,mb=36,mt=24,mr=12;
  const meses = o.meses.length ? o.meses : MESES.map((m,i)=>i);
  const somaCol = i => o.series.reduce((s,x)=>s+(+x.vals[i]||0),0);
  const linhaV = i => o.linha ? (+o.linha.vals[i]||0) : 0;
  const bruto = Math.max(1, ...meses.map(i=>Math.max(somaCol(i), linhaV(i))));
  const passo = passoRedondo(bruto/4), nT = Math.max(1, Math.ceil(bruto/passo)), max = passo*nT;
  const bw = (W-ml-mr)/meses.length, alt = H-mt-mb, yDe = v => H-mb-alt*(v/max);
  let s = `<svg viewBox="0 0 ${W} ${H}" class="chart graf-pes graf-mes" role="img" aria-label="Pessoas por mês">`;
  for(let k=0;k<=nT;k++){ const y = mt+alt*k/nT, v = max*(1-k/nT);
    s += `<line x1="${ml}" y1="${y}" x2="${W-mr}" y2="${y}" stroke="var(--line)"/>
      <text x="${ml-8}" y="${y+4}" text-anchor="end" font-size="12" fill="var(--grey)">${fmt(v,0)}</text>`; }
  meses.forEach((i,k)=>{
    const x0 = ml+k*bw, x = x0+bw*.24, w = bw*.52;
    let base = 0;
    s += `<g data-rastro="${esc(o.rastroCol(i))}"><rect class="fundo" x="${x0}" y="${mt}" width="${bw}" height="${alt}" fill="transparent"/>`;
    o.series.forEach(sr=>{ const v = +sr.vals[i]||0; if(!(v>0)) return;
      const y1 = yDe(base+v), h = yDe(base)-y1;
      s += `<rect x="${x}" y="${y1}" width="${w}" height="${Math.max(h,0.5)}" fill="${sr.cor}" data-rastro="${esc(sr.rastro(i))}"/>`;
      base += v; });
    s += `<text x="${x0+bw/2}" y="${Math.max(yDe(base)-6, mt-5)}" text-anchor="middle" font-size="13.5" font-weight="700" fill="var(--ink)">${base>0?fmt(base,0):""}</text>
      <text x="${x0+bw/2}" y="${H-mb+19}" text-anchor="middle" font-size="13" fill="var(--grey)">${MESES[i]}</text></g>`;
  });
  if(o.linha){
    const pts = meses.map((i,k)=>`${ml+k*bw+bw/2},${yDe(linhaV(i))}`).join(" ");
    s += `<g pointer-events="none"><polyline points="${pts}" fill="none" stroke="${o.linha.cor}" stroke-width="2" stroke-dasharray="6 4"/>` +
      meses.map((i,k)=>`<circle cx="${ml+k*bw+bw/2}" cy="${yDe(linhaV(i))}" r="3.2" fill="${o.linha.cor}"/>`).join("") + `</g>`;
  }
  el.innerHTML = s + `</svg>`;
  if(legEl) legEl.innerHTML = o.series.filter(sr=>meses.some(i=>+sr.vals[i]>0)).map(sr=>{
      const vs = meses.map(i=>+sr.vals[i]||0), med = vs.reduce((a,b)=>a+b,0)/meses.length;
      return `<span class="leg-per"${sr.rastroLeg?` data-rastro="${esc(sr.rastroLeg)}"`:""}><i style="background:${sr.cor}"></i>
        <b>${esc(sr.nome)}</b> média ${qtdTxt(med)} · pico ${fmt(Math.max(...vs),0)}</span>`; }).join("") +
    (o.linha ? `<span class="leg-per"${o.linha.rastro?` data-rastro="${esc(o.linha.rastro)}"`:""}><i style="background:none;border-top:2px dashed ${o.linha.cor};height:0;border-radius:0"></i>
      <b>${esc(o.linha.nome)}</b></span>` : "");
}

/* Rosca (pizza com furo): dados = [{l, v, cor, rastro}]; o centro traz o total.
   Fatia e linha da legenda levam a mesma chave. */
function rosca(el, legEl, dados, centro){
  const ds = dados.filter(d=>d.v>0), tot = ds.reduce((s,d)=>s+d.v,0);
  if(!(tot>0)){ el.innerHTML = `<div class="calc" style="padding:40px 0;text-align:center">Sem pessoas no período.</div>`;
    if(legEl) legEl.innerHTML = ""; return; }
  const c = 110, r = 100, ri = 62, pt = (a, rr) => `${(c+rr*Math.cos(a)).toFixed(2)},${(c+rr*Math.sin(a)).toFixed(2)}`;
  let a0 = -Math.PI/2, s = `<svg viewBox="0 0 220 220" class="chart graf-pes" role="img" aria-label="${esc(centro.l)}">`;
  ds.forEach(d=>{
    const fr = d.v/tot, a1 = a0 + fr*2*Math.PI, grande = fr > .5 ? 1 : 0;
    const dd = fr > .9999
      ? `M${pt(-Math.PI/2,r)} A${r},${r} 0 1 1 ${pt(Math.PI/2,r)} A${r},${r} 0 1 1 ${pt(-Math.PI/2,r)} Z M${pt(-Math.PI/2,ri)} A${ri},${ri} 0 1 0 ${pt(Math.PI/2,ri)} A${ri},${ri} 0 1 0 ${pt(-Math.PI/2,ri)} Z`
      : `M${pt(a0,r)} A${r},${r} 0 ${grande} 1 ${pt(a1,r)} L${pt(a1,ri)} A${ri},${ri} 0 ${grande} 0 ${pt(a0,ri)} Z`;
    s += `<path d="${dd}" fill="${d.cor}" fill-rule="evenodd" stroke="var(--card)" stroke-width="1.5" data-rastro="${esc(d.rastro)}"/>`;
    if(fr >= .07){ const am = (a0+a1)/2;
      s += `<text x="${(c+(r+ri)/2*Math.cos(am)).toFixed(1)}" y="${(c+(r+ri)/2*Math.sin(am)+3.5).toFixed(1)}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#fff" pointer-events="none">${fmt(fr*100,0)}%</text>`; }
    a0 = a1;
  });
  s += `<text x="${c}" y="${c-2}" text-anchor="middle" font-size="22" font-weight="700" fill="var(--ink)">${qtdTxt(centro.v)}</text>
    <text x="${c}" y="${c+16}" text-anchor="middle" font-size="10" fill="var(--grey)">${esc(centro.l)}</text></svg>`;
  el.innerHTML = s;
  if(legEl) legEl.innerHTML = ds.map(d=>`<div class="rosca-leg-l" data-rastro="${esc(d.rastro)}">
      <i style="background:${d.cor}"></i><span>${esc(d.l)}</span><b>${qtdTxt(d.v)}</b>
      <span class="calc">${fmt(d.v/tot*100,1)}%</span></div>`).join("");
}

/* Barras horizontais, uma ou duas por linha: dados = [{l, a, b?, dir, dirCls, rastro}],
   o = {corA, corB}. A linha inteira é o alvo do mouse. */
function barrasLinhas(el, dados, o){
  if(!dados.length){ el.innerHTML = `<div class="calc" style="padding:20px 0">Nada a mostrar.</div>`; return; }
  const duas = dados.some(d=>d.b!=null), W=760, rh = duas ? 30 : 22, ml=230, mr=150, H=dados.length*rh+6;
  const max = Math.max(1, ...dados.map(d=>Math.max(d.a||0, d.b||0))), wDe = v => (W-ml-mr)*(v/max);
  const corta = t => { t = String(t||""); return t.length > 34 ? t.slice(0,33)+"…" : t; };
  let s = `<svg viewBox="0 0 ${W} ${H}" class="chart graf-pes">`;
  dados.forEach((d,k)=>{
    const y = k*rh+3;
    s += `<g${d.rastro?` data-rastro="${esc(d.rastro)}"`:""}><rect class="fundo" x="0" y="${y-1}" width="${W}" height="${rh}" fill="transparent" rx="4"/>
      <text x="${ml-8}" y="${y+(duas?16:13)}" text-anchor="end" font-size="10.5" fill="var(--ink)">${esc(corta(d.l))}</text>
      <rect x="${ml}" y="${y+(duas?3:4)}" width="${Math.max(wDe(d.a||0),1)}" height="${duas?10:12}" fill="${d.cor||o.corA}" rx="2"/>` +
      (duas ? `<rect x="${ml}" y="${y+15}" width="${Math.max(wDe(d.b||0),1)}" height="10" fill="${o.corB}" rx="2"/>` : "") +
      `<text x="${ml+Math.max(wDe(d.a||0), wDe(d.b||0))+7}" y="${y+(duas?16:14)}" font-size="10" fill="var(--grey)">${esc(d.num||"")}</text>
      <text x="${W-4}" y="${y+(duas?16:14)}" text-anchor="end" font-size="10.5" font-weight="600" class="${d.dirCls||""}" fill="${d.dirCls==="falta"?"var(--bad)":d.dirCls==="sobra"?"var(--warn)":"var(--grey)"}">${esc(d.dir||"")}</text></g>`;
  });
  el.innerHTML = s + `</svg>`;
}


export { barras, barrasEmpilhadas, barrasLinhas, rosca, barrasH, barrasPeriodo, celulaBusca, exportarTabela, filtrarPorNome, habilitarReordenacao, kpi,
         ligarBuscaSelect, maxSel, ordenarPorEtapa, reaplicarBuscas, reaplicarExportar, registrarCombo, serieDoPeriodo,
         somaSel, tdMeses, th, thMeses };
