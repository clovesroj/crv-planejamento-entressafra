import { FROTA_ESP, SEP_MOD, chaveDoModelo, destinoDe, espDe, modDe, opcoesDestino,
         unidadesDoModelo } from '../calculo/crm.js';
import { DIM, DIM_DET, FROTA_ABERTO, QUADRO } from '../nucleo/estado.js';
import { $, brl, fmt, num, pct } from '../nucleo/formato.js';
import { MESES, NM, clsMes } from '../nucleo/calendario.js';
import { maxSel, tdMeses, th, thMeses } from './componentes.js';
import { ESCALAS } from '../dados/escalas.js';
import { quadroBase } from '../calculo/quadro.js';
import { criterioMensal, frotaDaAtividade, temCriterioMensal } from '../calculo/atividade.js';

/* ---------- DIMENSIONAMENTO ---------- */
/* Botao do criterio mensal. O ponto avisa que algum mes ja foge do padrao da
   atividade -- sem ele, o ajuste ficaria escondido atras de um clique. */
const btnMes = cod => `<button class="btn xs" data-rendmes="${cod}"
  title="Critério por mês: produção, frota, disponibilidade e utilização">${
  temCriterioMensal(cod) ? "mês •" : "mês"}</button>`;

/* Quadro por funcao e opcoes de escala/turno. Subiram para o modulo quando o
   dimensionamento virou uma tabela so: antes viviam dentro do bloco de pessoas,
   que era a unica tela que os usava. */
const infoQuadro = f => { const v=(QUADRO[f]||{}).ativo; return v!=null && v!=="" ? num(v) : null; };
const ativoDe = (f, base) => { const v=infoQuadro(f); return v!=null ? v : ((base.porFuncao||{})[f]||0); };
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
     efetivo abre Pessoas. */
  $("#t_dim").innerHTML = th([["Cod"],["Atividade / frente"],["Etapa"],
    ["Área/Volume",1],["Rend. (un/h)",1],["Frota",1],["Efetivo (pessoas)",1]])+"<tbody>"+
    R.L.map(r=>{
      const multi = r.partes.length>1;
      const un = r.a.un.split("/")[0];
      const F = frotaDaAtividade(r);
      return `<tr><td>${r.a.cod}</td><td>${r.a.nome}</td>
        <td class="calc">${r.a.etapa}</td>
        <td><div class="dim-cel"><span class="dim-val calc">${fmt(r.total)}</span>
          <span class="dim-un">${un}</span></div></td>
        <td>
          <div class="dim-cel">
            <span class="dim-val">${fmt(r.rend,2)}</span>
            <span class="dim-un">${un}/h</span>
            ${btnMes(r.a.cod)}
            <button class="btn xs" data-dimdet="${r.a.cod}" data-aba="oper">detalhe ›</button>
          </div></td>
        <td>
          <div class="dim-cel">
            <span class="dim-val" title="${F.difere
              ? `Frota do mês que mais pede (${F.mes}): ${fmt(F.pico)}. Na média da janela dá ${fmt(F.media)}, mas média não estaciona no pátio — quem tem de existir é a do mês cheio. Ajuste mês a mês no botão mês.`
              : `Sai do critério por mês. Ajuste mês a mês no botão mês.`}">${F.pico||"—"}</span>
            ${F.difere ? `<span class="badge b-warn" title="A média da janela é ${fmt(F.media)}">pico ${F.mes}</span>` : ""}
            <button class="btn xs" data-dimdet="${r.a.cod}" data-aba="frota">detalhe ›</button>
          </div></td>
        <td>
          <div class="dim-cel">
            <span class="dim-val">${r.efetivo||"—"}</span>
            <button class="btn xs" data-dimdet="${r.a.cod}" data-aba="pessoas">detalhe ›</button>
          </div></td></tr>`;
    }).join("")+
    `<tr><td class="tot" colspan="4">TOTAL DAS ATIVIDADES</td>
     <td class="tot">${fmt(R.L.reduce((s,r)=>s+r.horas,0))} h</td>
     <td class="calc" title="Somar o pico de cada atividade nao da a frota da usina: atividades que picam em meses diferentes dividem a mesma maquina.">—</td>
     <td class="tot">${fmt(R.L.reduce((s,r)=>s+r.efetivo,0))}</td></tr></tbody>`;

  /* Necessidade de frota por MES, uma linha por atividade.
     A tabela por tipo de maquina somava o ano inteiro e escondia justamente o
     que decide compra e aluguel: em que mes a frota aperta. Aqui cada celula e
     a frota daquele mes, do criterio lancado no botao mes, e o Pico fecha a
     linha com a que precisa existir no patio. */
  $("#t_dim_frotames").innerHTML = th([["Cod"],["Atividade / frente"],["Máquina"],
    ...thMeses(),["Pico",1]])+"<tbody>"+
    (()=>{
      const linhas = R.L.filter(r=>r.total>0);
      if(!linhas.length) return `<tr><td colspan="${NM+4}" class="calc">Sem atividade com volume lançado.</td></tr>`;
      const porMes = Array(NM).fill(0);
      const corpo = linhas.map(r=>{
        const C = criterioMensal(r);
        const F = frotaDaAtividade(r);
        C.forEach((c,i)=>{ porMes[i] += c.n; });
        return `<tr><td>${r.a.cod}</td><td>${r.a.nome}</td>
          <td class="calc">${r.partes.length>1?"—":(r.maqEfetiva||"—")}</td>
          ${tdMeses(C.map(c=>c.n), (v,i)=>v>0?fmt(v):'<span class="calc">—</span>')}
          <td class="num tot">${fmt(F.pico)}${F.mes?` <span class="calc">${F.mes}</span>`:""}</td></tr>`;
      }).join("");
      return corpo + `<tr><td class="tot" colspan="3">SOMA DAS ATIVIDADES NO MÊS</td>` +
        tdMeses(porMes, v=>fmt(v), "num tot") +
        `<td class="num calc" title="Somar o pico de cada atividade nao da a frota da usina: atividades que picam em meses diferentes dividem a mesma maquina.">—</td></tr>`;
    })()+"</tbody>";

  $("#t_apoio").innerHTML = th([["Veículo / Máquina"],["Qtd",1],["Utilização",1],["Disponib.",1],["Necessidade",1],["Atividade"]])+"<tbody>"+
    R.AP.linhas.map(a=>`<tr><td>${a.nome}</td><td class="num"><input data-apf="${a.nome}" value="${a.qtd}" inputmode="decimal"></td>
      <td class="num calc">${pct(a.util)}</td><td class="num calc">${pct(a.disp)}</td>
      <td class="num tot">${a.nec.toFixed(2)}</td><td class="calc">${a.ativ}</td></tr>`).join("")+
    `<tr><td class="tot">TOTAL</td><td colspan="3"></td><td class="num tot">${R.AP.total.toFixed(2)}</td><td></td></tr></tbody>`;

  pintarDimPessoas(R);
  // cada titulo de bloco carrega o resumo do que esta dentro, para ler com o bloco recolhido
  $("#bl_ativ_sub").textContent = `${R.L.filter(r=>r.total>0).length} de ${R.L.length} atividades · ${fmt(R.horasT)} horas`;
  $("#bl_frota_sub").textContent = `${fmt(R.frotaT)} equipamentos na operação · ${fmt(Math.ceil(R.AP.total))} de apoio`;
}


/* ---------- DIMENSIONAMENTO DE PESSOAS ----------
   Vai de atividade para especialidade, dela para funcao e termina na
   quantidade de pessoas daquela frente. O segundo quadro confronta essa
   necessidade com o quadro ativo informado, ja descontando ferias e
   demissoes programadas, e diz quanto falta contratar.
   O pico mensal e a referencia da contratacao: dimensionamento somado
   inteiro contrataria gente para meses em que a atividade nem roda. */
function pintarDimPessoas(R){
  const PS = R.PS;
  const SEL = R.SEL;   // recorte de meses da barra superior
  const qv = (f,k) => num((QUADRO[f]||{})[k]);
  const BASE = quadroBase();
  // o ativo vem do ERP; o campo da tela e um ajuste opcional que sobrepoe a base

  /* A leitura por atividade saiu daqui: virou coluna da tabela unica de
     Dimensionamento, ao lado da frota e das horas que a geram. O que fica neste
     bloco e o que so existe por FUNCAO -- confronto com o quadro ativo, ferias,
     demissoes e o pico mensal que decide a contratacao. */
  const funcoes = Object.keys(PS.porFun).sort();
  const tot = {nec:0, pico:0, ativo:0, ferias:0, demis:0, disp:0, contratar:0, exced:0};
  const disponivel = {};
  const corpo = funcoes.map(f=>{
    const o = PS.porFun[f];
    const base = BASE.porFuncao[f]||0, ajuste = infoQuadro(f);
    const ativo = ativoDe(f, BASE), ferias = qv(f,"ferias"), demis = qv(f,"demis");
    const disp = ativo - ferias - demis;
    disponivel[f] = disp;
    const contratar = Math.max(0, o.pico - disp), exced = Math.max(0, disp - o.pico);
    const iPico = o.qtdMes.indexOf(o.pico);
    tot.nec+=o.qtd; tot.pico+=o.pico; tot.ativo+=ativo; tot.ferias+=ferias; tot.demis+=demis;
    tot.disp+=disp; tot.contratar+=contratar; tot.exced+=exced;
    return `<tr><td>${f} — ${(R.MP.custoFuncao[f]||{nome:f}).nome}</td>
      <td class="num calc">${base||"—"}</td>
      <td class="num"><input data-qd="${f}" data-f="ativo" value="${ajuste!=null?ajuste:""}"
          placeholder="${base}" inputmode="decimal" title="Em branco usa o quadro do ERP"></td>
      <td class="num"><input data-qd="${f}" data-f="ferias" value="${ferias||""}" inputmode="decimal"></td>
      <td class="num"><input data-qd="${f}" data-f="demis" value="${demis||""}" inputmode="decimal"></td>
      <td class="num calc">${fmt(disp)}</td>
      <td class="num calc">${fmt(o.qtd)}</td>
      <td class="num tot">${fmt(o.pico)}<span class="calc" style="font-size:10px"> ${o.pico>0?MESES[iPico]:""}</span></td>
      <td class="num">${contratar>0?`<span class="badge b-bad">+${fmt(contratar)}</span>`:"—"}</td>
      <td class="num">${exced>0?`<span class="badge b-warn">${fmt(exced)}</span>`:"—"}</td></tr>`;
  }).join("");

  $("#t_pes_quadro").innerHTML = th([["Função"],["Ativos ERP",1],["Ajuste",1],["Férias program.",1],["Demissões program.",1],
    ["Disponível",1],["Necessidade",1],["Pico mensal",1],["A contratar",1],["Excedente",1]])+"<tbody>"+
    (funcoes.length ? corpo : `<tr><td colspan="10" class="calc">Sem função dimensionada.</td></tr>`)+
    `<tr><td class="tot">TOTAL</td><td class="num tot">${fmt(tot.ativo)}</td><td></td><td class="num tot">${fmt(tot.ferias)}</td>
     <td class="num tot">${fmt(tot.demis)}</td><td class="num tot">${fmt(tot.disp)}</td>
     <td class="num tot">${fmt(tot.nec)}</td><td class="num tot">${fmt(tot.pico)}</td>
     <td class="num tot">${tot.contratar>0?"+"+fmt(tot.contratar):"—"}</td>
     <td class="num tot">${tot.exced>0?fmt(tot.exced):"—"}</td></tr></tbody>`;

  const iPicoGeral = PS.qtdMes.indexOf(Math.max(...PS.qtdMes));
  $("#bl_pes_sub").textContent = `${fmt(PS.qtd)} pessoas dimensionadas · pico ${fmt(PS.qtdMes[iPicoGeral]||0)}`
    + (tot.contratar>0 ? ` · faltam ${fmt(tot.contratar)}` : "");
}

/* ---------- DETALHE DO DIMENSIONAMENTO, EM MODAL ----------
   Tres blocos, um por leitura, com as abas na ordem em que a conta anda:
   a operacao define as horas, as horas definem a frota, a frota define a gente.
   Abre direto no bloco de onde se clicou, mas mostra os tres -- quem abre a
   frota costuma querer conferir o efetivo logo em seguida, e voltar a tabela
   para clicar de novo seria o mesmo vai e volta que tirou as colunas daqui. */
const ABAS_DET = [["oper","Operação"],["frota","Frota"],["pessoas","Pessoas"]];

function pintarDimDetalhe(R){
  const cont = $("#dimdet"), fundo = $("#dimdet_fundo");
  if(!cont) return;
  const r = DIM_DET ? R.L.find(x=>x.a.cod===DIM_DET.cod) : null;
  if(!r){ cont.hidden = true; fundo.hidden = true; return; }

  const un = r.a.un.split("/")[0];
  const multi = r.partes.length>1;
  const BASE = quadroBase();
  const FR = frotaDaAtividade(r);
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
        ${linha("Modo de execução", multi ? r.partes.length+" frentes" : (r.a.modoOn?"padrão":"—"))}
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
        ${multi ? "" : `<div class="dd-campo"><label for="dd_frota_fixa">Frota fixa da atividade</label>
          <input id="dd_frota_fixa" data-fr="${r.a.cod}" value="${r.frotaAlvo||""}"
                 placeholder="${r.frotaR||"—"}" inputmode="decimal">
          <span class="calc">Em branco, a frota sai do rendimento. Preenchida, fixa a frota e o rendimento
          passa a ser o que ela exige.${r.frotaAlvoSuspensa
            ? ` <b>Suspensa agora:</b> há critério lançado por mês, e é ele que vale.` : ""}</span></div>`}
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
        ${linha("Efetivo desta atividade", (r.efetivo||"—")+" pessoas",
                "frota × operadores × turnos × fator de escala")}
        ${linha("Função", multi?"—":(r.fcod+" — "+r.fnome))}
        ${linha("Quadro ativo da função", ativoDe(r.fcod, BASE)||"—",
                "pessoas dessa função no ERP, já com o ajuste da aba Pessoas")}
        ${linha("Fator de escala", fmt(r.fator,2))}
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
        ${r.frotaR||0} equip. · ${r.efetivo||0} pessoas</div>
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

export { pintarDimDetalhe, pintarDim, pintarDimPessoas };
