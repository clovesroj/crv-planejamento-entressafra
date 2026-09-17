import { MESES, clsMes } from '../nucleo/calendario.js';
import { $, brl, fmt } from '../nucleo/formato.js';
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
const tdMeses = (arr, f, cls="num calc") =>
  arr.map((v,i)=>`<td class="${cls} ${clsMes(i)}">${f(v,i)}</td>`).join("");
/** Soma de uma série mensal restrita aos meses que o filtro deixa à mostra. */
const somaSel = (arr, SEL) => SEL.meses.reduce((s,i)=>s+(+arr[i]||0), 0);
/** Pico de uma série mensal dentro do período filtrado. */
const maxSel  = (arr, SEL) => SEL.meses.reduce((m,i)=>Math.max(m, +arr[i]||0), 0);

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
// tratamento...) é ali que mora o nome, não em texto solto na célula
const textoDaLinha = tr => tr.textContent + " " +
  [...tr.querySelectorAll("input,select")].map(el=>el.value).join(" ");
function filtrarPorNome(tabelaId, termo){
  const tab = $(tabelaId);
  if(!tab) return;
  const t = (termo||"").trim().toLowerCase();
  let grupo = null, grupoTemMatch = false;
  // sem termo, nada se esconde: grupo recolhido nao tem linha dentro, e esconder
  // a faixa por isso tiraria da tela justamente o que se clica para reabrir
  const fecharGrupo = () => { if(grupo) grupo.hidden = t ? !grupoTemMatch : false; };
  [...tab.querySelectorAll("tbody tr")].forEach(tr=>{
    if(tr.classList.contains("stage")){ fecharGrupo(); grupo = tr; grupoTemMatch = false; return; }
    if(tr.children[0] && tr.children[0].classList.contains("tot")){ tr.hidden = false; return; }
    const detalhe = tr.classList.contains("sub") || (tr.children.length===1 && tr.children[0].hasAttribute("colspan"));
    if(detalhe){ const mae = tr.previousElementSibling; tr.hidden = mae ? mae.hidden : false; return; }
    const bate = !t || textoDaLinha(tr).toLowerCase().includes(t);
    tr.hidden = !bate;
    if(bate) grupoTemMatch = true;
  });
  fecharGrupo();
}
/* Acha toda caixa de busca já na tela (marcada com a classe, aponta a tabela
   pelo data-alvo) e reaplica o termo que já estava digitado nela. Chamado uma
   vez no fim do render() inteiro — dispensa cada tela lembrar de re-filtrar
   a própria tabela depois de repintá-la. */
function reaplicarBuscas(){
  document.querySelectorAll('.tbl-busca').forEach(inp=>filtrarPorNome(inp.dataset.alvo, inp.value));
}

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
      const [mov] = moveis.splice(de,1);
      moveis.splice(para,0,mov);
      salvarOrdem(tabelaId, moveis);
      aplicar();
    });
  });
}

/* ---------- GRÁFICOS ---------- */
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
function barrasH(el,dados){
  // paleta do campo: folha, palha, céu, latossolo e tons intermediários
  const cores=["#2D6A3A","#C9A45C","#3E7CB1","#A5503A","#7E9C6B","#5C6F7B","#8A8F3C","#2F8C83","#B98A3E","#6B8FB5","#9C6B4E","#A3AE9C"];
  const tot=dados.reduce((s,d)=>s+d.v,0)||1, W=760,rh=24,H=dados.length*rh+10,ml=185;
  let s=`<svg viewBox="0 0 ${W} ${H}" class="chart">`;
  dados.forEach((d,i)=>{const y=i*rh+5,w=(W-ml-105)*(d.v/tot);
    s+=`<text x="${ml-8}" y="${y+13}" text-anchor="end" font-size="10.5" fill="var(--ink)">${d.l}</text>
        <rect x="${ml}" y="${y+2}" width="${Math.max(w,1)}" height="14" fill="${cores[i%12]}" rx="3"><title>${brl(d.v)}</title></rect>
        <text x="${ml+w+7}" y="${y+14}" font-size="10" fill="var(--grey)">${fmt(d.v/tot*100,1)}%</text>`;});
  el.innerHTML=s+`</svg>`;
}


export { barras, barrasH, filtrarPorNome, habilitarReordenacao, kpi, maxSel,
         reaplicarBuscas, somaSel, tdMeses, th, thMeses };
