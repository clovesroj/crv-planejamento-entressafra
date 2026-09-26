import { MODOS_ORD, frotaDaAtividade, modoLiberado, modosDe, temDetalheTerc } from '../calculo/atividade.js';
import { tratListaTodos } from '../calculo/insumos.js';
import { CFG } from '../dados/cfg.js';
import { erpDe } from '../dados/atividades-erp.js';
import { apoioDaAtividade, resumoApoio } from '../calculo/apoio-frente.js';
import { TERC_MODOS } from '../dados/modos.js';
import { NM } from '../nucleo/calendario.js';
import { DIM, PLANO_ABERTO, TERC_DET, TERC_SUB, TRAT_ATIVO, TRAT_NOME, atividadesLista } from '../nucleo/estado.js';
import { COD_FITOSSANITARIO, etapaExibir } from '../nucleo/codigo-atividade.js';
import { $, brl, esc, fmt, num } from '../nucleo/formato.js';
import { celulaBusca, ordenarPorEtapa, registrarCombo, th } from './componentes.js';
import { MESES, PERIODO_MESES, clsMes } from '../nucleo/calendario.js';

/* ---------- PLANO ---------- */
// A44-A53 (Broca e Cigarrinha) agrupam visualmente como "Manejo
// Fitossanitário" nesta tabela, sem mudar a.etapa: etapa continua "Tratos
// Culturais" pra tudo que usa etapa pra calcular (rateio de arrendamento,
// administrativo, relatórios) — é só o cabeçalho de grupo que muda aqui.
// etapaExibir (nucleo/codigo-atividade.js) é a mesma conta, reaproveitada.
const grupoPlano = etapaExibir;
// editor compacto do mix de modos: percentuais numa célula só
function mixEditor(r){
  const mx = r.mix || {};
  const modos = modosDe(r.a);
  const soma = modos.reduce((s,m)=>s+num(mx[m]),0);
  const cor = soma===0 ? "var(--grey)" : (Math.abs(soma-100)<0.01 ? "var(--green)" : "var(--red)");
  const sigla = {Manual:"M",Trator:"T",Uniport:"U",Drone:"D",Quadriciclo:"Q",Terceiro:"3º"};
  const temSub = temDetalheTerc(r.a.cod);
  return `<div class="mix">` +
    modos.map(m=>`<label title="${m}" class="${m==="Terceiro"?"terc":""}">${sigla[m]}<input data-mx="${r.a.cod}" data-mo="${m}"
      value="${mx[m]||""}" inputmode="decimal" placeholder="0"></label>`).join("") +
    (modos.includes("Terceiro") ? `<button type="button" class="terc-det${temSub?" on":""}" data-tercdet="${r.a.cod}"
      title="${temSub?"Detalhamento do terceiro por avião/drone/terrestre já preenchido — clique para ajustar":"Detalhar o terceiro por avião, drone ou terrestre, cada um com seu % e seu valor por hectare"}">›</button>` : "") +
    `<span class="mixsum" style="color:${cor}">${soma===0?"padrão":fmt(soma,0)+"%"}</span></div>`;
}

/* Modal de detalhamento do terceiro: aberto pelo "›" ao lado do 3º no mix.
   Cardápio fixo de sub-modos (TERC_MODOS) — cada um com seu % (do total
   terceirizado, não da atividade inteira) e sua tarifa R$/ha. Some 0% em
   tudo e volta a valer a tarifa única de sempre (ver tarifaTercDe). */
function pintarTercDet(){
  const cont = $("#tercdet"), fundo = $("#tercdet_fundo");
  if(!cont) return;
  const cod = TERC_DET;
  const a = cod ? atividadesLista().find(x=>x.cod===cod) : null;
  if(!a){ cont.hidden = true; fundo.hidden = true; return; }
  const sub = TERC_SUB[cod] || {};
  const soma = TERC_MODOS.reduce((s,m)=>s+num(sub[m] && sub[m].pct),0);
  const cor = soma===0 ? "var(--grey)" : (Math.abs(soma-100)<0.01 ? "var(--green)" : "var(--red)");
  cont.innerHTML = `
    <div class="ra-modal td-modal pop-in">
    <div class="ra-topo">
      <div class="ra-nav"><div></div>
        <button class="ghost-btn" id="td_fechar" title="Fechar" aria-label="Fechar">✕</button></div>
      <div class="ra-tit">Terceiro por sub-modo</div>
      <div class="ra-subtit">${esc((a.cod))} — ${esc(a.nome)}</div>
    </div>
    <div class="ra-corpo">
      <table>${th([["Sub-modo"],["% do terceiro",1],["Valor (R$/ha)",1]])}<tbody>` +
      TERC_MODOS.map(m=>`<tr><td>${esc(m)}</td>
        <td class="num"><input data-tsub="${esc(cod)}" data-tsm="${esc(m)}" data-tsf="pct"
          value="${(sub[m] && sub[m].pct) || ""}" inputmode="decimal" placeholder="0"></td>
        <td class="num"><input data-tsub="${esc(cod)}" data-tsm="${esc(m)}" data-tsf="tar"
          value="${(sub[m] && sub[m].tar) || ""}" inputmode="decimal" placeholder="0"></td></tr>`).join("") +
      `<tr><td class="tot">Soma</td><td class="num tot" style="color:${cor}">${fmt(soma,0)}%</td><td></td></tr>
      </tbody></table>
      <p class="calc" style="margin-top:10px;font-size:11.5px">Sem nada aqui, vale o valor único por hectare
        lançado em Plano de Contas. Preenchendo o % de cada sub-modo (soma até 100%), o custo da parte
        terceirizada vira a média ponderada dos valores acima.</p>
    </div>
    </div>`;
  cont.hidden = false;
  fundo.hidden = false;
}

/* Lista de função pronta pro combobox de busca por linha (ver celulaBusca()/
   registrarCombo() em ui/componentes.js). Inclui o código já gravado mesmo se
   saiu do cadastro -- documento antigo (importação, ou função removida) não
   pode ficar com o campo em branco na primeira interação, sem ninguém pedir. */
function funcaoItens(sel){
  const conhecida = CFG.funcoes.some(f=>f.cod===sel);
  return (conhecida || !sel) ? CFG.funcoes
    : [{cod:sel, nome:"fora do cadastro de funções", foraCadastro:true}, ...CFG.funcoes];
}
const funcaoRotulo = f => f.foraCadastro ? `${f.cod} — fora do cadastro de funções` : `${f.cod} · ${f.nome}`;
const funcaoValor = f => f.cod;
registrarCombo("funcao", funcaoItens, funcaoRotulo, funcaoValor);
// tratamento: some da lista quando inativo, exceto o que a linha ja usa --
// senao o combo perderia a opcao selecionada pra atividade ja lancada
const TRAT_VAZIO = {cod:"", vazio:true};
registrarCombo("tratamento",
  sel => [TRAT_VAZIO, ...tratListaTodos().filter(t=>TRAT_ATIVO[t.cod]!==false || t.cod===sel)],
  t => t.vazio ? "—" : `${t.cod}${TRAT_NOME[t.cod]?" — "+TRAT_NOME[t.cod]:""} · ${brl(t.custo_ha,0)}/ha`,
  t => t.cod);
/* O recorte de meses desta aba é o da barra superior — a aba não tem filtro
   próprio. Ter dois seletores para a mesma pergunta era o que fazia o de cima
   parecer quebrado: mudar "Safra" no topo não mexia numa tela que só obedecia ao
   seu próprio select. Agora há um lugar só onde se escolhe o período, e ele vale
   para todas as abas. */
/* Quanto de uma atividade cai dentro do período filtrado.
   Sem filtro é o total do ano, e a conta fecha com o motor de cálculo. */
function totalNoFiltro(r, SEL){
  if(!SEL.parcial) return r.total;
  return SEL.meses.reduce((s,j)=>s+num(r.meses[j]),0);
}
/* Dois tratamentos na mesma atividade, cada um com área PRÓPRIA (exclusiva,
   não abate uma da outra — ver calculo/atividade.js tratsDetalhe): a linha
   continua uma só, com o total (que segue só dimensionando frota/horas);
   expande pro detalhe por tratamento, mesmo critério do data-fitoabre no
   Manejo Fitossanitário. Principal e extras editáveis ali, cada um no seu
   campo — data-cp pro principal, data-cx pros extras. */
function subLinhasTrat(r, SEL){
  if(!r.tratsDetalhe) return "";
  return r.tratsDetalhe.map((d,i)=>{
    const nome = TRAT_NOME[d.trat] ? `${esc(d.trat)} — ${esc(TRAT_NOME[d.trat])}` : esc(d.trat||"—");
    const totalFiltro = SEL.parcial ? SEL.meses.reduce((s,j)=>s+num(d.m[j]),0) : d.area;
    return `<tr class="sub">
      <td></td>
      <td class="calc">${nome}${d.principal?' <span class="badge b-ok">principal</span>':''}</td>
      <td></td><td></td><td></td>` +
      d.m.map((q,j)=> d.principal
        ? `<td class="num ${clsMes(j)}"><input data-cp="${esc(r.a.cod)}" data-m="${j}" value="${q||""}" inputmode="decimal"></td>`
        : `<td class="num ${clsMes(j)}"><input data-cx="${esc(r.a.cod)}" data-tx="${i-1}" data-m="${j}" value="${q||""}" inputmode="decimal"></td>`).join("") +
      `<td class="num calc tot">${fmt(totalFiltro)}</td>
       <td></td><td></td><td></td>
       <td class="num calc">${d.custo && d.area>0 ? brl(d.custo/d.area*totalFiltro) : "—"}</td>
       <td class="num calc">${d.custo && d.area>0 ? brl(d.custo/d.area,2) : "—"}</td>
       <td></td><td></td><td></td></tr>`;
  }).join("");
}
/* Frota da atividade: o mesmo número do Dimensionamento, e por isso lido de lá
   (frotaDaAtividade) em vez de recalculado aqui. É a frota do mês que mais
   pede — a que tem de existir no pátio. Ajustar o transbordo no critério por
   mês e continuar vendo o número antigo nesta coluna era ler duas respostas
   para a mesma pergunta, e a tela onde se lança o volume é justamente onde se
   confere se a frota dá conta dele.

   A média da janela continua sendo a que o motor usa para ratear custo; quando
   as duas não batem, o título diz as duas e o clique abre o rastro. */
/* Custo da linha em cinco colunas: insumo, insumo por hectare, serviço de
   terceiro, serviço por hectare terceirizado (o valor contratado) e a soma
   insumo + serviço + mão de obra das frentes próprias. Os valores em R$ seguem
   o filtro de período, como a coluna Total: insumo e serviço são lineares na
   área (a parcela do período é exata), e a mão de obra sai do mdoMes do motor,
   que já é o custo de cada mês. Os valores por hectare são razões e não mudam
   com o filtro. Atividade em tonelada mostra o unitário por tonelada. */
function custosDaLinha(r, SEL){
  const soSel = arr => SEL.meses.reduce((s,j)=>s+num((arr||[])[j]),0);
  const fatia = r.total>0 ? totalNoFiltro(r, SEL)/r.total : 0;
  // no período: o insumo dos meses de cada tratamento (insumoMes do motor)
  const insumo = SEL.parcial ? soSel(r.insumoMes) : r.cInsumo;
  const servico = SEL.parcial ? r.cTerc*fatia : r.cTerc;
  const mdo = SEL.parcial ? soSel(r.mdoMes) : r.cMDO;
  const areaTerc = r.partes.filter(p=>p.terc).reduce((s,p)=>s+p.area,0);
  return {insumo, servico, total: insumo + servico + mdo, mdo,
          insumoHa: r.total>0 ? r.cInsumo/r.total : 0,
          servicoHa: areaTerc>0 ? r.cTerc/areaTerc : 0,
          // com tratamento extra, o R$/ha da linha é a MÉDIA dos tratamentos
          // pela área de cada um; o de cada tratamento está na sub-linha
          media: Array.isArray(r.tratsDetalhe) && r.tratsDetalhe.filter(d=>d.trat && d.area>0).length>1};
}
// dica da média: o custo/ha e a área de cada tratamento, como no cadastro
const dicaMedia = r => (r.tratsDetalhe||[]).filter(d=>d.trat && d.area>0)
  .map(d=>`${d.trat}${d.principal?" (principal)":""}: ${brl(d.custo/d.area,2)}/ha em ${fmt(d.area)} ha`).join(" · ");
function celulasCusto(r, SEL){
  const c = custosDaLinha(r, SEL);
  const un = r.ehHa ? "" : ` <span class="calc">/${esc(r.a.un.split("/")[0])}</span>`;
  const v = (x, casas) => x>0 ? brl(x, casas) : "—";
  return `<td class="num calc">${v(c.insumo)}</td>
       <td class="num calc"${c.media ? ` title="Média ponderada dos tratamentos desta atividade — ${esc(dicaMedia(r))}. Abra a linha (▸) para ver cada um."` : ""}>${
         c.insumoHa>0 ? brl(c.insumoHa,2)+un+(c.media ? `<div class="calc" style="font-size:10px">média de ${r.tratsDetalhe.filter(d=>d.trat && d.area>0).length} tratamentos ▸</div>` : "") : "—"}</td>
       <td class="num calc">${v(c.servico)}</td>
       <td class="num calc">${c.servicoHa>0 ? brl(c.servicoHa,2)+un : "—"}</td>
       <td class="num tot" title="Insumo ${brl(c.insumo)} + serviço ${brl(c.servico)} + mão de obra própria ${brl(c.mdo)}">${v(c.total)}</td>`;
}
function celFrota(r){
  const F = frotaDaAtividade(r);
  const dica = F.pico !== F.media
    ? `Frota do Dimensionamento: ${F.pico}${F.mes?" — mês de pico "+F.mes:""}. O motor rateia custo pela média da janela, ${fmt(F.media)}. Clique para ver a composição.`
    : "Vem do Dimensionamento desta atividade. Clique para ver como se chegou nela.";
  return `<td class="num ${F.pico>0?"tot":"calc"}" data-rastro="ativ:${r.a.cod}" role="button" tabindex="0"
           title="${esc(dica)}">${F.pico ? F.pico+" ›" : "—"}</td>`;
}
/* Atividade que vai junto de outra (A39 e A19 na plantadora da A10) sai logo
   abaixo dela, como linha de tratamento: e a mesma passada, e ler as tres
   juntas e ler o que a plantadora leva. Fora isso a ordem e a da etapa. */
function comAsAcopladas(L){
  const filhas = {};
  L.forEach(r=>{ if(r.junto) (filhas[r.junto] = filhas[r.junto] || []).push(r); });
  const temPai = r => r.junto && L.some(x=>x.a.cod===r.junto);
  const out = [];
  L.forEach(r=>{
    if(temPai(r)) return;
    out.push(r);
    (filhas[r.a.cod] || []).forEach(f=>out.push(f));
  });
  return out;
}
/* Linha da atividade que vai junto: area, janela, maquina e equipe sao da
   atividade que executa, e aqui so se escolhe o tratamento. */
function linhaAcoplada(r, SEL, celTrat){
  const temExtras = !!r.tratsDetalhe;
  const aberto = temExtras && !!PLANO_ABERTO[r.a.cod];
  const codJunto = (r.junto);
  const dica = `Vai na mesma passada da ${codJunto}: a área é a dela, mês a mês, e a máquina, a equipe e o diesel também. Aqui entra só o tratamento.`;
  return `<tr class="acoplada"><td class="calc">${esc((r.a.cod))}</td>
      <td title="${esc(dica)}"><span class="acop-seta">↳</span>${temExtras?`<button type="button" class="mini-seta" data-planoabre="${r.a.cod}"
          title="Área por tratamento">${aberto?"▾":"▸"}</button>`:""}${r.a.nome} <span class="badge b-ok">junto da ${esc(codJunto)}</span></td>
      <td class="calc" colspan="2">na janela da ${esc(codJunto)}</td>
      <td class="calc">${r.a.un}</td>` +
    r.meses.map((q,j)=>`<td class="num calc ${clsMes(j)}" title="${esc(dica)}">${q?fmt(num(q)):""}</td>`).join("") +
    `<td class="num tot" style="color:${totalNoFiltro(r, SEL)>0?'var(--green)':'var(--grey)'}">${fmt(totalNoFiltro(r, SEL))}</td>
      <td class="calc">na plantadora</td>
      <td class="num calc" title="${esc(dica)}">—</td>
      <td>${celTrat}</td>
      ${celulasCusto(r, SEL)}</tr>` +
    (aberto ? subLinhasTrat(r, SEL) : "");
}
/* Atividades do ERP que compoem a frente, abertas embaixo da atividade.
   A Plataforma Controladoria aponta por equipamento: o plantio mecanizado, que
   aqui e uma linha, la sao dez — trator e implemento da plantadeira, carrego de
   adubo, pipa, area de vivencia, auxiliar rural, transporte de pessoal. Sao so
   leitura: o custo dessa gente e dessas maquinas ja esta na frente. Servem para
   conferir o plano com o apontamento sem abrir planilha ao lado. */
function subLinhasErp(r, SEL){
  const {nucleo, apoio} = erpDe(r.a.cod);
  if(!nucleo.length && !apoio.length) return "";
  const AP = apoioDaAtividade(r);
  const porErp = Object.fromEntries(AP.map(x=>[x.erp, x]));
  const linha = (e, tipo) => {
    const x = porErp[e.cod];
    // operacao de apoio nao tem area, mas tem maquina e gente: e isso que ela
    // traz para a frente, nos meses em que a frente roda
    const nec = x && (x.frota || x.pessoas)
      ? `${x.frota ? fmt(x.frota)+" equip." : ""}${x.frota&&x.pessoas?" · ":""}${x.pessoas ? fmt(x.pessoas)+" pessoas" : ""}`
      : (tipo==="apoio" ? '<span class="calc">estrutura, sem gente</span>' : "");
    return `<tr class="sub"><td class="calc">${esc(e.cod)}</td>
      <td class="calc">${esc(e.nome)} <span class="badge ${tipo==="núcleo"?"b-ok":"b-warn"}">${tipo}</span></td>
      <td class="calc" colspan="99">${nec}${e.esp.length ? ` <span class="calc">· especialidade ${e.esp.map(esc).join(", ")}</span>` : ""}</td></tr>`;
  };
  return nucleo.map(e=>linha(e,"núcleo")).join("") + apoio.map(e=>linha(e,"apoio")).join("");
}
function pintarPlano(R){
  const SEL = R.SEL;
  const parcial = SEL.parcial;
  let h = th([["Cod"],["Atividade"],["Início"],["Fim"],["Un."],
              ...MESES.map((m,j)=>[m,1,clsMes(j)]),[parcial?"Total do período":"Total",1],
              ["Modo de execução"],["Frota",1],["Tratamento"],
              ["Insumo (R$)",1],["Insumo (R$/ha)",1],["Serviço (R$)",1],["Serviço (R$/ha)",1],
              ["Insumo + serviço + MO (R$)",1]])+"<tbody>";
  let et="";
  /* A ordem da tela é a da etapa, não a do cadastro. A faixa de grupo só faz
     sentido se cada grupo aparecer uma vez: com a lista na ordem em que as
     atividades foram criadas, a muda (PLANTIO) caía no meio da colheita e a
     tela mostrava COLHEITA, PLANTIO, COLHEITA, PLANTIO... Dentro da etapa nada
     muda de lugar; o Manejo Fitossanitário, que é TRATOS CULTURAIS com faixa
     própria, vai sempre para o fim dos tratos (ver ordenarPorEtapa). */
  comAsAcopladas(ordenarPorEtapa(R.L, r=>r.a.etapa, r=>COD_FITOSSANITARIO.has(r.a.cod)?1:0)).forEach(r=>{
    const grupo = grupoPlano(r.a);
    if(grupo!==et){et=grupo; h+=`<tr class="stage"><td colspan="${SEL.meses.length+14}"><span>${et}</span></td></tr>`;}
    const celTrat = celulaBusca("tratamento", r.trat, `data-t="${r.a.cod}"`, !r.ehHa);
    if(r.junto){ h += linhaAcoplada(r, SEL, celTrat); return; }
    const levaJunto = R.L.filter(x=>x.junto===r.a.cod).map(x=>x.a.cod);
    const auto = r.a.tipo==="transp";
    // janela de datas: define em que meses a atividade pode ser lancada
    const jIdx = r.janela.fonte==="datas" ? r.janela.idx : null;
    const dentro = j => !jIdx || jIdx.includes(j);
    const d = DIM[r.a.cod] || {};
    const temExtras = !!r.tratsDetalhe;
    const E = erpDe(r.a.cod);
    const temErp = !!(E.nucleo.length || E.apoio.length);
    const RA = r.total > 0 ? resumoApoio(apoioDaAtividade(r)) : {frota:0, pessoas:0};
    const aberto = (temExtras || temErp) && !!PLANO_ABERTO[r.a.cod];
    h+=`<tr><td>${esc(r.a.cod)}</td><td>${temExtras||temErp?`<button type="button" class="mini-seta" data-planoabre="${r.a.cod}"
          title="${temExtras?"Área por tratamento e atividades do ERP que compõem a frente"
                            :"Atividades do ERP que compõem a frente"}">${aberto?"▾":"▸"}</button>`:""}${r.a.nome}${
        RA.frota||RA.pessoas ? ` <span class="badge" title="Operações de apoio desta frente, que não têm área para lançar: ${
          RA.frota} equipamento(s) e ${RA.pessoas} pessoa(s) enquanto a frente roda. Abra a seta para ver quais.">apoio ${
          RA.frota?RA.frota+" eq":""}${RA.frota&&RA.pessoas?" · ":""}${RA.pessoas?RA.pessoas+" pess":""}</span>` : ""}${auto?' <span class="badge b-ok">auto</span>':''}${
          levaJunto.length?` <span class="calc" title="${esc(levaJunto.join(" e ")+" vão na mesma passada: a mecanização é uma só, a desta linha")}">+ ${levaJunto.join(", ")}</span>`:""}</td>
        <td><input type="date" data-dt="${r.a.cod}" data-f="ini" value="${r.janela.ini||""}" max="${d.fim||""}" title="Início da execução"></td>
        <td><input type="date" data-dt="${r.a.cod}" data-f="fim" value="${r.janela.fim||""}" min="${d.ini||""}" title="Fim da execução"></td>
        <td class="calc">${r.a.un}</td>`+
      // com tratamento extra, a area aqui em cima vira a SOMA dos tratamentos
      // (ver linha() em calculo/atividade.js) — so leitura, a edicao passa a
      // ser nas sub-linhas (principal e extras), cada uma com area propria
      r.meses.map((q,j)=> (auto || temExtras)
        ? `<td class="num calc ${clsMes(j)}"${temExtras?' title="Soma dos tratamentos — edite nas linhas abaixo (seta ao lado do nome)"':""}>${q?fmt(num(q)):""}</td>`
        : `<td class="num ${clsMes(j)}${dentro(j)?"":" fora-janela"}"><input data-c="${r.a.cod}" data-m="${j}" value="${q||""}" inputmode="decimal"${
            dentro(j)?"":' title="Fora da janela de datas desta atividade — o valor continua contando no total"'}></td>`).join("")+
      `<td class="num tot" style="color:${totalNoFiltro(r, SEL)>0?'var(--green)':'var(--grey)'}"${
          parcial && r.total>0 ? ` title="No ano: ${fmt(r.total)}"` : ""}>${fmt(totalNoFiltro(r, SEL))}</td>
       <td>${modoLiberado(r.a) ? mixEditor(r) : '<span class="calc">—</span>'}</td>
       ${celFrota(r)}
       <td>${celTrat}</td>
       ${celulasCusto(r, SEL)}</tr>`;
    if(aberto) h += subLinhasTrat(r, SEL) + subLinhasErp(r, SEL);
  });
  $("#t_plano").innerHTML = h+"</tbody>";
  // O resumo segue o filtro. Horas e insumos de uma atividade são lineares na
  // quantidade — horas = volume/rendimento, insumo = custo por ha x ha — então a
  // parcela do período é exata, não uma aproximação. Sem filtro, cai de volta
  // nos totais do motor de cálculo.
  const fatia = r => r.total>0 ? totalNoFiltro(r, SEL)/r.total : 0;
  const prog  = R.L.filter(r=>totalNoFiltro(r, SEL)>0).length;
  const haOp  = parcial ? R.L.reduce((s,r)=>s+(r.ehHa?totalNoFiltro(r, SEL):0),0) : R.haOp;
  const ins   = parcial ? R.L.reduce((s,r)=>s+SEL.meses.reduce((t,j)=>t+num((r.insumoMes||[])[j]),0),0) : R.insumoT;
  // horasT do motor = horas das atividades + horas da frota de apoio. A frota de
  // apoio roda todo mês, independente de quando a atividade acontece, então a
  // parcela dela é a fração de meses do período — não a fração de volume.
  const hAtiv  = R.L.reduce((s,r)=>s+r.horas,0);
  const hApoio = R.horasT - hAtiv;
  const hrs    = parcial
    ? R.L.reduce((s,r)=>s+r.horas*fatia(r),0) + SEL.meses.reduce((t,j)=>t+num((R.AE.horasMes||[])[j]),0)
    : R.horasT;
  $("#plano_resumo").innerHTML=`<b>${prog}</b>/<b>${R.L.length}</b> atividades · <b>${fmt(haOp)}</b> ha-operação · `+
    `insumos <b>${brl(ins)}</b> · horas <b>${fmt(hrs)}</b> · `+
    (parcial ? `<span class="calc">números de ${PERIODO_MESES[SEL.periodo] || SEL.rotulo.toLowerCase()}; o ano inteiro fica em "Ano todo", na barra do topo</span>`
             : `<span class="calc">transporte e transbordo espelham a tonelada da colheita automaticamente</span>`);
}


export { funcaoItens, funcaoRotulo, funcaoValor, mixEditor, pintarPlano, pintarTercDet };
