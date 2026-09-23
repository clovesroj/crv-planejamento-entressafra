import { DIM, DIM_DET } from '../nucleo/estado.js';
import { $, brl, esc, fmt } from '../nucleo/formato.js';
import { MESES, NM, clsMes } from '../nucleo/calendario.js';

import { ordenarPorEtapa, th } from './componentes.js';
import { optFuncao } from './plano.js';
import { CFG } from '../dados/cfg.js';
import { ESCALAS } from '../dados/escalas.js';
import { erpDe } from '../dados/atividades-erp.js';
import { apoioDaAtividade } from '../calculo/apoio-frente.js';
import { ativoDe, quadroBase } from '../calculo/quadro.js';
import { criterioMensal, frotaDaAtividade, modoLiberado, pessoasDaAtividade, temCriterioMensal } from '../calculo/atividade.js';

/* ---------- DIMENSIONAMENTO ---------- */
/* Botao do criterio mensal. O ponto avisa que algum mes ja foge do padrao da
   atividade -- sem ele, o ajuste ficaria escondido atras de um clique. */
/* Linha de meses aberta na tabela: e so leitura, e so aparece mes que tem
   lancamento. Ver "quando essa atividade acontece" nao deveria custar abrir um
   modal -- e a pergunta que se faz percorrendo a lista, nao parando nela. */
const MES_ABERTO = {};
function alternarMesLinha(cod){ if(MES_ABERTO[cod]) delete MES_ABERTO[cod]; else MES_ABERTO[cod]=true; }
/* Frente aberta na tabela: tudo o que aquela atividade precisa para acontecer —
   a maquina que faz (nucleo) e a estrutura de apoio (pipa, area de vivencia,
   auxiliar). E aqui que se lanca QUANTAS de cada uma, porque e aqui que se
   dimensiona a atividade; no Plano Operacional a mesma frente aparece so para
   leitura. */
const FRENTE_ABERTA = {};
function alternarFrenteLinha(cod){ if(FRENTE_ABERTA[cod]) delete FRENTE_ABERTA[cod]; else FRENTE_ABERTA[cod]=true; }

const btnMes = cod => `<button class="btn xs" data-rendmes="${cod}"
  title="Critério por mês: produção, frota, disponibilidade e utilização">${
  temCriterioMensal(cod) ? "mês •" : "mês"}</button>`;

/* Escala e turnos do modal da atividade. O quadro ativo (ativoDe) saiu daqui
   para calculo/quadro.js quando o bloco de pessoas foi para o Resumo de
   Pessoas: duas telas passaram a precisar da mesma resposta. */
const turOpts = sel => `<option value="">Padrão</option>` +
  [1,2,3].map(n=>`<option value="${n}" ${n===+sel?"selected":""}>${n}t</option>`).join("");
const escOpts = sel => `<option value="">Padrão (premissas)</option>` +
  Object.keys(ESCALAS).map(k=>`<option value="${k}" ${k===sel?"selected":""}>${k}</option>`).join("");

function pintarDim(R){
  /* A tabela ficou com o essencial, e o detalhe foi para o modal.
     As tres leituras continuam na mesma tela, mas 19 colunas nao se leem: modo,
     utilizacao, horas, maquina, implemento, funcao, escala, turnos, fator,
     quadro, diesel e manutencao sao detalhe de UMA atividade, nao comparacao
     entre atividades. Comparar pede coluna; ajustar pede modal.

     Ficam as sete que se compara de uma linha para outra, e tres delas abrem o
     detalhe no ponto certo: rendimento abre Operacao, frota abre Frota e
     efetivo abre Pessoas.

     A lista sai na ordem da etapa -- prepara, planta, trata, colhe, apoia --,
     que e a ordem em que o ano acontece. Na ordem do cadastro a muda (PLANTIO)
     caia no meio da colheita, e a coluna Etapa alternava a cada linha: quem le
     de cima para baixo nao conseguia somar uma etapa com o olho. */
  // atividade que vai junto de outra (A39 e A19 na plantadora da A10) nao tem
  // maquina nem equipe proprias: nao entra aqui, e a que executa diz o que leva
  const L = ordenarPorEtapa(R.L.filter(r=>!r.junto), r=>r.a.etapa);
  const levaJunto = cod => R.L.filter(x=>x.junto===cod).map(x=>x.a.cod);
  $("#t_dim").innerHTML = th([["Cod"],["Atividade / frente"],["Etapa"],
    ["Área/Volume",1],["Rend. (un/h)",1],["Frota",1],["Efetivo (pessoas)",1]])+"<tbody>"+
    L.map(r=>{
      const multi = r.partes.length>1;
      const un = r.a.un.split("/")[0];
      const F = frotaDaAtividade(r);
      const PE = pessoasDaAtividade(r);
      const lj = levaJunto(r.a.cod);
      return `<tr><td>${r.a.cod}</td><td>${r.a.nome}${lj.length?` <span class="calc" title="Na mesma passada: a frota e a equipe desta linha fazem também ${lj.join(" e ")}">+ ${lj.join(", ")}</span>`:""}</td>
        <td class="calc">${r.a.etapa}</td>
        <td><div class="dim-cel"><span class="dim-val calc">${fmt(r.total)}</span>
          <span class="dim-un">${un}</span></div></td>
        <td>
          <div class="dim-cel">
            <span class="dim-val">${fmt(r.rend,2)}</span>
            <span class="dim-un">${un}/h</span>
            ${btnMes(r.a.cod)}
            <button class="btn xs" data-dimmes="${r.a.cod}"
              title="Ver mês a mês, só os meses com lançamento"
              aria-expanded="${MES_ABERTO[r.a.cod]?"true":"false"}">${MES_ABERTO[r.a.cod]?"▴":"▾"}</button>
            <button class="btn xs" data-dimdet="${r.a.cod}" data-aba="oper">detalhe ›</button>
          </div></td>
        <td>
          <div class="dim-cel">
            <span class="dim-val" title="${F.difere
              ? `Frota do mês que mais pede (${F.mes}): ${fmt(F.pico)}. Na média da janela dá ${fmt(F.media)}, mas média não estaciona no pátio — quem tem de existir é a do mês cheio. É a média que o motor usa para ratear custo. Ajuste mês a mês no botão mês.`
              : `Sai do critério por mês. Ajuste mês a mês no botão mês.`}">${F.pico||"—"}</span>
            ${F.acima ? `<span class="badge b-warn" title="A média da janela é ${fmt(F.media)}">pico ${F.mes}</span>` : ""}
            ${temFrente(r) ? `<button class="btn xs" data-dimfrente="${r.a.cod}"
              title="A frente inteira: a máquina que faz e a estrutura de apoio que ela precisa"
              aria-expanded="${FRENTE_ABERTA[r.a.cod]?"true":"false"}">frente ${FRENTE_ABERTA[r.a.cod]?"▴":"▾"}</button>` : ""}
            <button class="btn xs" data-dimdet="${r.a.cod}" data-aba="frota">detalhe ›</button>
          </div></td>
        <td>
          <div class="dim-cel">
            <span class="dim-val" title="${PE.difere
              ? `Equipe do mês que mais pede (${PE.mes}): ${fmt(PE.pico)} pessoas, para a frota daquele mês. Na média da janela dá ${fmt(PE.media)}, que é o efetivo com que o motor paga a folha. Ajuste mês a mês no botão mês.`
              : `Frota × operadores × turnos × fator de escala.`}">${PE.pico||"—"}</span>
            ${PE.acima ? `<span class="badge b-warn" title="Na média da janela são ${fmt(PE.media)}">pico ${PE.mes}</span>` : ""}
            <button class="btn xs" data-dimdet="${r.a.cod}" data-aba="pessoas">detalhe ›</button>
          </div></td></tr>`
        + (MES_ABERTO[r.a.cod] ? linhaDosMeses(r, un) : "")
        + (FRENTE_ABERTA[r.a.cod] ? linhaDaFrente(r) : "");
    }).join("")+
    `<tr><td class="tot" colspan="4">TOTAL DAS ATIVIDADES</td>
     <td class="tot">${fmt(L.reduce((s,r)=>s+r.horas,0))} h</td>
     <td class="calc" title="Somar o pico de cada atividade nao da a frota da usina: atividades que picam em meses diferentes dividem a mesma maquina.">—</td>
     <td class="tot" title="Soma do pico de cada atividade. Assim como na frota, atividades que picam em meses diferentes podem dividir a mesma equipe — o confronto que decide contratação é o da aba Pessoas, por função.">${
       fmt(L.reduce((s,r)=>s+pessoasDaAtividade(r).pico,0))}</td></tr></tbody>`;

  $("#bl_ativ_sub").textContent = `${R.L.filter(r=>r.total>0).length} de ${R.L.length} atividades · ${fmt(R.horasT)} horas`;
  pintarApoioOper(R);
}

/* ---------- MAO DE OBRA DE APOIO OPERACIONAL ----------
   Gente que a operacao precisa e que nao sai de atividade nenhuma. Uma linha
   por funcao e frente, com os meses em que vale; o custo vem de
   calculo/mao-de-obra.js (apoioOperCalc) e as pessoas vao para a necessidade
   do Resumo de Pessoas. */
function pintarApoioOper(R){
  const M = R.MOA || {linhas:[], qtdMes:Array(NM).fill(0), total:0, pico:0};
  const optF = sel => (sel && !CFG.funcoes.some(f=>f.cod===sel)
    ? `<option value="${esc(sel)}" selected>${esc(sel)} — fora do cadastro de funções</option>` : "") + optFuncao(sel);
  $("#t_moa").innerHTML = th([["Função"],["Frente / descrição"],["Pessoas",1],...MESES.map((m,j)=>[m,1,clsMes(j)]),
      ["Custo mensal por pessoa",1],["Custo no período",1],[""]])+"<tbody>"+
    (M.linhas.length ? M.linhas.map(l=>`<tr>
      <td><select data-moaf="${l.ix}" style="min-width:220px">${optF(l.fcod)}</select></td>
      <td><input data-moa="${l.ix}" data-f="frente" value="${esc(l.frente)}" placeholder="ex.: fiscal da frente 1" style="min-width:170px;text-align:left"></td>
      <td class="num"><input data-moa="${l.ix}" data-f="qtd" value="${l.qtd||""}" inputmode="decimal" style="width:60px"></td>` +
      l.on.map((b,j)=>`<td class="num ${clsMes(j)}"><input type="checkbox" data-moam="${l.ix}" data-m="${j}"${b?" checked":""}
        title="${MESES[j]}"></td>`).join("") +
      `<td class="num calc" title="Salário, encargos e benefícios da função, da aba Mão de Obra">${brl(l.custoMensal)}</td>
      <td class="num tot">${l.nMeses ? brl(l.total) : '<span class="badge b-warn">sem mês</span>'}</td>
      <td><button class="btn d" data-moarm="${l.ix}">Remover</button></td></tr>`).join("")
      : `<tr><td colspan="${NM+6}" class="calc">Nenhuma mão de obra de apoio lançada. Use o botão abaixo para incluir.</td></tr>`) +
    `<tr><td class="tot" colspan="2">TOTAL DO APOIO OPERACIONAL</td><td class="num tot">${fmt(M.pico)}</td>` +
    M.qtdMes.map((q,j)=>`<td class="num tot ${clsMes(j)}">${q?fmt(q):"—"}</td>`).join("") +
    `<td></td><td class="num tot">${brl(M.total)}</td><td></td></tr></tbody>`;
}


/* ---------- DETALHE DO DIMENSIONAMENTO, EM MODAL ----------
   Tres blocos, um por leitura, com as abas na ordem em que a conta anda:
   a operacao define as horas, as horas definem a frota, a frota define a gente.
   Abre direto no bloco de onde se clicou, mas mostra os tres -- quem abre a
   frota costuma querer conferir o efetivo logo em seguida, e voltar a tabela
   para clicar de novo seria o mesmo vai e volta que tirou as colunas daqui. */
const ABAS_DET = [["oper","Operação"],["frota","Frota"],["pessoas","Pessoas"]];

/* Opcoes de funcao da atividade. Codigo que nao esta no cadastro de funcoes
   (veio de importacao ou de um documento antigo -- o "F02" que aparecia como
   "F02 — F02") entra como primeira opcao, marcado: sem isso o select mostraria
   outra funcao como se fosse a da atividade, e a primeira interacao gravaria
   essa outra por cima sem ninguem pedir. */
function opcoesFuncao(sel){
  const conhecida = CFG.funcoes.some(f=>f.cod===sel);
  return (conhecida || !sel ? "" : `<option value="${sel}" selected>${sel} — fora do cadastro de funções</option>`)
    + optFuncao(sel);
}

/* Tudo o que a atividade precisa para acontecer, numa linha aberta: o NUCLEO
   (a maquina que faz a operacao, com a frota que o dimensionamento calculou) e
   o APOIO (pipa, area de vivencia, auxiliar rural, onibus), com a quantidade
   lancada aqui. E o plano da frente inteira, no lugar em que a frente e
   dimensionada — o Plano Operacional mostra a mesma composicao so para leitura.

   Item de gente conta por TURNO: dois auxiliares numa frente de tres turnos sao
   seis pessoas. Item de estrutura (area de vivencia, gerador) tem unidade e nao
   tem gente. */
function temFrente(r){ const E = erpDe(r.a.cod); return !!(E.nucleo.length || E.apoio.length); }

/* Mes a mes de um item da frente, aberto na propria linha dele — o mesmo chip
   do mes da atividade, com a quantidade daquele item em cada mes. */
const FRENTE_MES = {};
function alternarMesItem(chave){ if(FRENTE_MES[chave]) delete FRENTE_MES[chave]; else FRENTE_MES[chave]=true; }

/* Tudo o que a atividade precisa para acontecer, em LINHA, nas mesmas colunas
   da atividade: o NUCLEO (a maquina que faz, com a frota que o dimensionamento
   calculou) e o APOIO (pipa, area de vivencia, onibus, auxiliar), com a
   quantidade lancada na coluna Frota e o efetivo saindo dela.

   Em linha, e nao em cartao, porque e assim que se preenche uma tabela: a
   coluna Frota e a mesma da atividade, o botao de mes abre os meses do item, e
   o olho desce a coluna em vez de caçar campo dentro de cartao.

   Item de gente (auxiliar rural) conta por TURNO: dois auxiliares numa frente
   de tres turnos sao seis pessoas. "sem gente" tira o item da conta de pessoal
   sem tirar o equipamento — area de vivencia e gerador ja nascem assim. */
function linhaDaFrente(r){
  const E = erpDe(r.a.cod);
  const AP = apoioDaAtividade(r);
  const porErp = Object.fromEntries(AP.map(x=>[x.erp, x]));
  const dim = DIM[r.a.cod] || {};
  const semVolume = !(r.total > 0);
  const linhaItem = (e, nucleo) => {
    const x = porErp[e.cod];
    const chave = r.a.cod+"|"+e.cod;
    const lanc = (dim.apoio||{})[e.cod];
    const meses = x ? x.qtdMes : [];
    const temMes = meses.some(v=>v>0);
    const frota = nucleo
      ? `<span class="dim-val calc" title="Vem do dimensionamento da atividade">${fmt(frotaDaAtividade(r).pico)}</span>`
      : `<input data-apfr="${esc(r.a.cod)}" data-erp="${esc(e.cod)}" value="${lanc||""}"
           placeholder="1" inputmode="decimal"
           title="${x && x.tipo==="pessoa" ? "Pessoas por turno nesta frente" : "Equipamentos desta frente"}">`;
    const efetivo = nucleo
      ? `<span class="dim-val calc">${fmt(pessoasDaAtividade(r).pico)}</span>`
      : `<span class="dim-val ${x && x.pessoas ? "" : "calc"}">${x ? fmt(x.pessoas) : "—"}</span>
         <label class="dim-sp" title="Equipamento sem gente escalada — continua contando como frota e sai da conta de pessoal">
           <input type="checkbox" data-apsp="${esc(r.a.cod)}" data-erp="${esc(e.cod)}"
             ${x && !x.temGente ? "checked" : ""}> sem gente</label>`;
    return `<tr class="sub frente-linha">
      <td class="calc">${esc(e.cod)}</td>
      <td class="calc">${nucleo?"":"↳ "}${esc(e.nome)}
        <span class="badge ${nucleo?"b-ok":"b-warn"}">${nucleo?"núcleo":"apoio"}</span></td>
      <td class="calc">${e.esp.length?"esp. "+e.esp.map(esc).join(", "):"—"}</td>
      <td class="calc">—</td>
      <td><div class="dim-cel">${temMes
        ? `<button class="btn xs" data-apmes="${esc(chave)}" aria-expanded="${FRENTE_MES[chave]?"true":"false"}"
             title="Mês a mês deste item, na janela da frente">mês ${FRENTE_MES[chave]?"▴":"▾"}</button>`
        : '<span class="calc">—</span>'}</div></td>
      <td><div class="dim-cel">${frota}</div></td>
      <td><div class="dim-cel">${efetivo}</div></td></tr>`
      + (FRENTE_MES[chave] && x ? mesesDoItem(x) : "");
  };
  const cabeca = `<tr class="sub frente-cab"><td colspan="7"><b>A frente de ${esc(r.a.nome)}</b>
    <span class="calc">— o que ela usa para acontecer. Quantidade em branco vale 1.${
      semVolume ? " Sem volume lançado no Plano Operacional, a frente ainda não conta." : ""}</span></td></tr>`;
  return cabeca + E.nucleo.map(e=>linhaItem(e,true)).join("") + E.apoio.map(e=>linhaItem(e,false)).join("");
}

function mesesDoItem(x){
  const chips = x.qtdMes.map((v,i)=> v>0
    ? `<span class="dim-mes"><b>${MESES[i]}</b><span>${fmt(v)} ${x.tipo==="pessoa"?"por turno":"equip."}</span>
       <span class="calc">${x.pessoasMes[i]?fmt(x.pessoasMes[i])+" pessoas":"sem gente"}</span></span>` : "").join("");
  return `<tr class="sub"><td colspan="7"><div class="dim-meses">${chips || '<span class="calc">Sem mês com volume na frente.</span>'}</div></td></tr>`;
}

/* Um chip por mes com lancamento: mes, volume, frota e pessoas daquele mes.
   Mes sem volume nao entra -- listar doze meses para mostrar tres seria o
   mesmo ruido que a tabela larga tinha. */
function linhaDosMeses(r, un){
  const C = criterioMensal(r).filter(c=>c.temVolume);
  const corpo = C.length
    ? C.map(c=>`<span class="dim-mes">
        <b>${c.mes}</b>${c.parcial?' <span class="badge b-warn">parcial</span>':""}
        <span>${fmt(c.q)} ${un}</span>
        <span class="calc">${fmt(c.n)} equip. · ${fmt(c.pessoas)} pess.</span></span>`).join("")
    : `<span class="calc">Sem mês com volume lançado no Plano Operacional.</span>`;
  return `<tr class="sub"><td colspan="7"><div class="dim-meses">${corpo}</div></td></tr>`;
}

function pintarDimDetalhe(R){
  const cont = $("#dimdet"), fundo = $("#dimdet_fundo");
  if(!cont) return;
  const r = DIM_DET ? R.L.find(x=>x.a.cod===DIM_DET.cod) : null;
  if(!r){ cont.hidden = true; fundo.hidden = true; return; }

  const un = r.a.un.split("/")[0];
  const multi = r.partes.length>1;
  const BASE = quadroBase();
  const FR = frotaDaAtividade(r);
  const PES = pessoasDaAtividade(r);
  // frota fixada num ajuste antigo: o campo saiu daqui (a frota se ajusta no
  // criterio por mes), mas um valor ja lancado continua mandando no motor --
  // some da tela e ninguem mais consegue tirar. Fica a leitura e o botao.
  const fixa = r.frotaAlvo || r.frotaAlvoSuspensa || 0;
  const dimA = DIM[r.a.cod] || {};
  const p0 = r.partes && r.partes.length === 1 ? r.partes[0] : null;
  const aba = DIM_DET.aba || "oper";
  const linha = (rot, val, dica) => `<div class="dd-linha"${dica?` title="${dica}"`:""}>
    <span>${rot}</span><b>${val}</b></div>`;

  const oper = `
    <div class="dd-bloco" id="dd_oper">
      <div class="dd-tit">Operação</div>
      <div class="dd-grade">
        ${linha("Área ou volume", fmt(r.total)+" "+un)}
        ${multi ? linha("Rendimento", fmt(r.rend,2)+" "+un+"/h") : ""}
        ${linha("Horas de máquina", fmt(r.horas)+" h", un+" ÷ rendimento")}
        ${linha("Janela", r.janela.fonte==="datas" ? r.janela.ini+" a "+r.janela.fim
                                                   : fmt(r.janela.meses,1)+" meses")}
        ${multi ? "" : `<div class="dd-campo"><label for="dd_rend">Rendimento padrão (${un}/h)</label>
          <input id="dd_rend" data-r="${r.a.cod}" value="${r.rend}" inputmode="decimal">
          <span class="calc">Vale para todo mês que não tiver rendimento próprio. O mês que foge dele
          se lança no botão <b>mês</b>.</span></div>`}
        <div class="dd-campo"><label for="dd_util">Utilização (%)</label>
          <input id="dd_util" data-u="${r.a.cod}" value="${Math.round(r.util*100)}" inputmode="decimal">
          <span class="calc">quanto do tempo disponível vai para esta atividade</span></div>
        ${linha("Modo de execução", multi ? r.partes.length+" frentes" : (modoLiberado(r.a)?"padrão":"—"))}
      </div>
      ${multi ? `<div class="tblwrap ra-tbl"><table>${th([["Frente"],["%",1],["Área",1],["Rend.",1],["Horas",1]])}
        <tbody>${r.partes.map(p=>`<tr><td>${p.modo}${p.terc?' <span class="badge b-warn">terceiro</span>':""}</td>
          <td class="num calc">${fmt(p.pct*100,0)}%</td><td class="num calc">${fmt(p.area)} ${un}</td>
          <td class="num calc">${fmt(p.rend,2)}</td>
          <td class="num calc">${p.terc?"—":fmt(p.horas)}</td></tr>`).join("")}</tbody></table></div>` : ""}
    </div>`;

  const frota = `
    <div class="dd-bloco" id="dd_frota">
      <div class="dd-tit">Frota</div>
      <div class="dd-grade">
        ${linha("Frota a ter no pátio", fmt(FR.pico)+(FR.mes?" · pico em "+FR.mes:""),
                "O mes que mais pede. E o que tem de existir: media da janela nao estaciona no patio.")}
        ${linha("Média da janela", fmt(FR.media),
                "E a que o motor usa para ratear custo — uso medio, nao quantidade a ter.")}
        ${linha("Máquina", multi?"—":(r.maqEfetiva||"—"))}
        ${linha("Implemento", multi?"—":(r.impEfetivo||"—"))}
        ${linha("Capacidade por equipamento", r.capMes?fmt(r.capMes)+" h/mês":"—",
                "dias efetivos × jornada × disponibilidade × utilização")}
        ${linha("Diesel", r.cDiesel?brl(r.cDiesel):"—")}
        ${linha("Manutenção (CRM)", r.cManut?brl(r.cManut):"—")}
        ${fixa && !multi ? `<div class="dd-campo"><label>Frota fixa lançada antes</label>
          <div class="dd-fixa"><b>${fmt(fixa)} equipamentos</b>
            <button type="button" class="btn xs" data-frlimpar="${r.a.cod}">remover</button></div>
          <span class="calc">A frota se ajusta mês a mês, no botão <b>mês</b> — este número ficou de um ajuste
          antigo, de quando dava para fixá-la aqui.${r.frotaAlvoSuspensa
            ? " Já está suspenso: há critério por mês lançado, e é ele que vale."
            : " Enquanto existir, é ele que manda, e o rendimento passa a ser o que ele exige."}</span></div>` : ""}
      </div>
      ${multi ? `<div class="tblwrap ra-tbl"><table>${th([["Frente"],["Frota",1],["Máquina"],["Implemento"]])}
        <tbody>${r.partes.map(p=>`<tr><td>${p.modo}</td>
          <td class="num calc">${p.terc?"—":p.frotaR}</td>
          <td class="calc">${p.maq}</td><td class="calc">${p.imp}</td></tr>`).join("")}</tbody></table></div>` : ""}
    </div>`;

  const pessoas = `
    <div class="dd-bloco" id="dd_pessoas">
      <div class="dd-tit">Pessoas</div>
      <div class="dd-grade">
        ${linha("Equipe a ter", fmt(PES.pico)+" pessoas"+(PES.mes?" · pico em "+PES.mes:""),
                "frota do mes que mais pede × operadores × turnos × fator de escala")}
        ${linha("Média da janela", fmt(PES.media)+" pessoas",
                "e o efetivo com que o motor paga a folha, em todo mes com volume")}
        ${multi ? linha("Função","—") : `<div class="dd-campo"><label for="dd_fun">Função</label>
          <select id="dd_fun" data-fc="${r.a.cod}">${opcoesFuncao(r.fcod)}</select>
          <span class="calc">quem opera esta atividade: muda o custo de mão de obra e a função confrontada
          com o quadro ativo, no Resumo de Pessoas</span></div>`}
        ${linha("Quadro ativo da função", ativoDe(r.fcod, BASE)||"—",
                "pessoas dessa função no ERP, já com o ajuste da aba Pessoas")}
        ${linha("Fator de escala", fmt(r.fator,2))}
        ${multi ? "" : `<div class="dd-campo"><label for="dd_ops">Operadores por equipamento</label>
          <input id="dd_ops" data-ops="${r.a.cod}" value="${dimA.ops||""}"
                 placeholder="${p0 ? p0.ops : 1}" inputmode="decimal">
          <span class="calc">Em branco vale o do cadastro da atividade. É por aqui que uma frente que
          roda com um operador só deixa de contar dois.</span></div>`}
        ${multi ? "" : linha("Como se chega ao efetivo",
          `${fmt(FR.pico)} × ${fmt(p0 ? p0.opsEf : 0)} × ${fmt(p0 ? p0.turnosEf : 0)} × ${fmt(r.fator,2)} = ${fmt(PES.pico)}`,
          "frota do mes que mais pede × operadores por equipamento × turnos × fator de escala")}
        <div class="dd-campo"><label for="dd_esc">Escala</label>
          <select id="dd_esc" data-esc="${r.a.cod}">${escOpts(r.escala)}</select>
          <span class="calc">muda o fator, e com ele o efetivo</span></div>
        <div class="dd-campo"><label for="dd_tur">Turnos</label>
          <select id="dd_tur" data-tur="${r.a.cod}">${turOpts(r.turnosOv)}</select>
          <span class="calc">quantas equipes por dia na mesma máquina</span></div>
      </div>
      ${multi ? `<div class="tblwrap ra-tbl"><table>${th([["Frente"],["Função"],["Turnos",1],["Pessoas",1]])}
        <tbody>${r.partes.map(p=>`<tr><td>${p.modo}</td>
          <td class="calc">${p.terc?"terceiro":p.fcod+" — "+p.fnome}</td>
          <td class="num calc">${p.terc?"—":p.turnosEf+"t"}</td>
          <td class="num calc">${p.terc?"—":p.efetivo}</td></tr>`).join("")}</tbody></table></div>` : ""}
    </div>`;

  const corpo = {oper, frota, pessoas};
  cont.innerHTML = `
    <div class="ra-modal dd-modal pop-in">
    <div class="ra-topo">
      <div class="ra-nav"><div></div>
        <button class="ghost-btn" id="dd_fechar" title="Fechar" aria-label="Fechar">✕</button></div>
      <div class="ra-tit">${r.a.cod} · ${r.a.nome}</div>
      <div class="ra-subtit">${r.a.etapa} · ${fmt(r.total)} ${un} · ${fmt(r.horas)} h ·
        ${FR.pico||0} equip. · ${PES.pico||0} pessoas</div>
      <div class="dd-abas">${ABAS_DET.map(([k,n])=>
        `<button class="${k===aba?"on":""}" data-ddaba="${k}">${n}</button>`).join("")}</div>
    </div>
    <div class="ra-corpo">${ABAS_DET.map(([k])=>corpo[k]).join("")}</div>
    </div>`;
  cont.hidden = false;
  fundo.hidden = false;
  // abre mostrando os tres, mas rola ate o bloco de onde veio o clique
  const alvo = cont.querySelector("#dd_"+aba);
  if(alvo) alvo.scrollIntoView({block:"start"});
}

export { alternarFrenteLinha, alternarMesItem, alternarMesLinha, pintarDimDetalhe, pintarDim };
