import { FROTA_ESP, SEP_MOD, chaveDoModelo, destinoDe, espDe, modDe, opcoesDestino,
         unidadesDoModelo } from '../calculo/crm.js';
import { DIM, FROTA_ABERTO, QUADRO } from '../nucleo/estado.js';
import { $, brl, fmt, num, pct } from '../nucleo/formato.js';
import { MESES, NM, clsMes } from '../nucleo/calendario.js';
import { kpi, maxSel, tdMeses, th, thMeses } from './componentes.js';
import { ESCALAS } from '../dados/escalas.js';
import { quadroBase } from '../calculo/quadro.js';
import { temCriterioMensal } from '../calculo/atividade.js';

/* ---------- DIMENSIONAMENTO ---------- */
/* Botao do criterio mensal. O ponto avisa que algum mes ja foge do padrao da
   atividade -- sem ele, o ajuste ficaria escondido atras de um clique. */
const btnMes = cod => `<button class="btn xs" data-rendmes="${cod}"
  title="Critério por mês: produção, frota, disponibilidade e utilização">${
  temCriterioMensal(cod) ? "mês •" : "mês"}</button>`;

function pintarDim(R){
  $("#k_dim").innerHTML =
    kpi("Horas-máquina","",fmt(R.horasT),"","frota:horas") +
    kpi("Frota operacional","t",fmt(R.frotaT)+" un","","frota:oper") +
    kpi("Frota de apoio","g",fmt(Math.ceil(R.AP.total))+" un","","frota:apoiofixo") +
    kpi("Transbordos","a",fmt(R.TR.frota)+" un","","frota:transbordo") +
    // o bloco tinha hora e frota, mas nenhum cartao de gente: o efetivo das
    // atividades so aparecia coluna a coluna, sem o total na frente
    kpi("Efetivo das atividades","g",fmt(R.L.reduce((s,r)=>s+r.efetivo,0))+" pessoas",
        "operadores das frentes · apoio e indiretos ficam em Pessoas","pessoas:total");

  $("#t_dim").innerHTML = th([["Cod"],["Atividade / frente"],["Modo"],["Área/Volume",1],["Rend. (un/h)",1],["Utiliz.",1],
    ["Horas",1],["Frota",1],["Efetivo (pessoas)",1],["Função"],["Máquina"],["Implemento"]])+"<tbody>"+
    // a coluna Frota aceita edicao: preenchida, inverte o dimensionamento
    R.L.map(r=>{
      const multi = r.partes.length>1;
      const un = r.a.un.split("/")[0];
      let h = `<tr><td>${r.a.cod}</td><td>${r.a.nome}</td>
        <td class="calc">${multi?`<span class="badge b-warn">${r.partes.length} frentes</span>`:(r.a.modoOn?"padrão":"—")}</td>
        <td class="num calc">${fmt(r.total)} <span style="font-size:10px">${un}</span></td>
        <td class="num">${multi?`<span class="calc">${fmt(r.rend,2)} ${un}/h</span>`
          : r.frotaAlvo
          // com a frota fixada o rendimento e resultado, nao premissa: vira
          // numero calculado para nao parecer que da para editar os dois lados.
          // O botao de mes fica, porque o criterio mensal continua ajustavel.
          ? `<div class="rend-cel"><span class="tot" title="Rendimento que a frota fixada exige">${fmt(r.rend,2)}</span>
              <span class="calc">${un}/h</span><span class="badge b-ok">da frota</span>
              ${btnMes(r.a.cod)}</div>`
          :`<div class="rend-cel">
              <input data-r="${r.a.cod}" value="${r.rend}" inputmode="decimal">
              <span class="calc">${un}/h</span>
              ${btnMes(r.a.cod)}
              ${r.frotaAlvoSuspensa ? `<span class="badge b-warn"
                title="A frota de ${fmt(r.frotaAlvoSuspensa)} lançada aqui está suspensa: há critério lançado por mês, e é ele que vale. Limpe os meses para voltar a usá-la.">frota do mês manda</span>` : ""}
            </div>`}</td>
        <td class="num"><input data-u="${r.a.cod}" value="${Math.round(r.util*100)}" inputmode="decimal"></td>
        <td class="num calc">${fmt(r.horas)}</td>
        <td class="num">${multi
          ? `<span class="tot">${r.frotaR||"—"}</span>`
          : `<input data-fr="${r.a.cod}" value="${r.frotaAlvo||""}" placeholder="${r.frotaR||"—"}"
                    inputmode="decimal" title="Em branco, a frota sai do rendimento. Preenchida, ela fixa a frota e o rendimento passa a ser o que ela exige.">`}</td>
        <td class="num calc">${r.efetivo||"—"}</td><td class="calc">${r.fcod}</td>
        <td class="calc">${multi?"—":r.maqEfetiva}</td><td class="calc">${multi?"—":r.impEfetivo}</td></tr>`;
      if(multi) r.partes.forEach(p=>{
        h += `<tr class="sub"><td></td><td class="calc">↳ ${p.modo}</td>
          <td class="num calc">${fmt(p.pct*100,0)}%</td><td class="num calc">${fmt(p.area)} <span style="font-size:9.5px">${un}</span></td>
          <td class="num calc">${fmt(p.rend,2)} ${un}/h</td><td class="calc"></td>
          <td class="num calc">${p.terc?"—":fmt(p.horas)}</td>
          <td class="num calc">${p.terc?"—":p.frotaR}</td>
          <td class="num calc">${p.terc?"—":p.efetivo}</td>
          <td class="calc">${p.terc?'<span class="badge b-warn">terceiro</span>':p.fcod}</td>
          <td class="calc">${p.maq}</td><td class="calc">${p.imp}</td></tr>`;});
      return h;}).join("")+"</tbody>";

  const fr={};
  R.L.forEach(r=>r.partes.forEach(p=>{
    if(p.horas<=0) return;
    fr[p.maq]=fr[p.maq]||{h:0,f:0,n:0,d:0,m:0};
    fr[p.maq].h+=p.horas; fr[p.maq].f+=p.frota; fr[p.maq].n++;
    fr[p.maq].d+=p.cDiesel; fr[p.maq].m+=p.cManut;}));
  // Cada maquina do plano abre na frota real que a representa, para marcar ali
  // mesmo quem vai rodar e quem vai reformar -- e aqui que se olha o
  // dimensionamento, entao e aqui que a duvida aparece.
  const anoAtual = new Date().getFullYear();
  $("#t_frota").innerHTML = th([["Máquina"],["Frentes",1],["Horas",1],["Frota",1],["Diesel",1],["Manutenção",1]])+"<tbody>"+
    Object.entries(fr).sort((a,b)=>b[1].h-a[1].h).map(([m,d])=>{
      const chave = chaveDoModelo(m);
      const un = chave ? unidadesDoModelo(chave, true) : [];
      const k = "dim:"+m, aberto = FROTA_ABERTO[k];
      const emRef = un.filter(u=>destinoDe(u[0])==="reforma").length;
      const emSb  = un.filter(u=>destinoDe(u[0])==="standby").length;
      const linha = `<tr><td>${
          un.length?`<button class="btn xs" data-abrefrota="${k}" style="margin-right:6px;padding:1px 6px">${aberto?"−":"+"}</button>`:""
        }${m}${un.length?` <span class="calc" style="font-weight:400">· ${un.length} na frota${
          emRef?`, ${emRef} em reforma`:""}${emSb?`, ${emSb} em stand by`:""}</span>`:""}</td>
        <td class="num calc">${d.n}</td><td class="num calc">${fmt(d.h)}</td>
        <td class="num tot">${Math.ceil(d.f)}</td><td class="num calc">${brl(d.d)}</td>
        <td class="num calc">${brl(d.m)}</td></tr>`;
      if(!aberto) return linha;
      return linha+`<tr><td colspan="6" style="padding:0"><div style="padding:6px 0 10px 40px">
        <table style="width:auto;min-width:520px"><thead><tr>
          <th>Frota</th><th class="num">Ano</th><th class="num">Idade</th>
          <th>Origem</th><th>Destino na safra</th></tr></thead><tbody>${
          un.map(([cod,ano,prop])=>{ const i = ano?anoAtual-ano:null, dst = destinoDe(cod);
            return `<tr${dst==="reforma"?' style="opacity:.62"':''}><td>${cod}</td>
              <td class="num ${i!=null&&i>=15?"tot":"calc"}" style="${i!=null&&i>=15?"color:var(--amber)":""}">${ano||"—"}</td>
              <td class="num calc">${i!=null?i+" anos":"—"}</td>
              <td class="calc">${prop?"Própria":"Terceiro"}</td>
              <td><select data-undest="${cod}">${opcoesDestino(dst)}</select></td></tr>`;}).join("")
        }</tbody></table>
        <div class="hint" style="margin-top:6px">Frota cadastrada como
        <b>${espDe(m)||"—"} › ${modDe(m)||"—"}</b>. Só quem vai rodar carrega CRM: reforma vai para o
        provisionamento da aba Reforma de Frota, e stand by não gera custo nenhum.</div>
      </div></td></tr>`;
    }).join("")+"</tbody>";

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
  const informado = f => { const v=(QUADRO[f]||{}).ativo; return v!=null && v!=="" ? num(v) : null; };
  const ativoDe = f => { const v=informado(f); return v!=null ? v : (BASE.porFuncao[f]||0); };

  // uma linha por atividade, com nivel da funcao e escala escolhidos ali mesmo;
  // as frentes da atividade entram como sub-linhas
  const turOpts = sel => `<option value="">Padrão</option>` +
    [1,2,3].map(n=>`<option value="${n}" ${n===+sel?"selected":""}>${n}t</option>`).join("");
  const escOpts = sel => `<option value="">Padrão (premissas)</option>` +
    Object.entries(ESCALAS).map(([k,e])=>`<option value="${k}" ${k===sel?"selected":""}>${k}</option>`).join("");

  const comGente = R.L.filter(r=>r.partes.some(p=>!p.terc && p.efetivo>0));
  let corpoAtiv = "", totPessoas = 0;
  comGente.forEach(r=>{
    const frentes = r.partes.filter(p=>!p.terc && p.efetivo>0);
    const pessoas = frentes.reduce((s,p)=>s+p.efetivo,0);
    const frota = frentes.reduce((s,p)=>s+p.frotaR,0);
    const horas = frentes.reduce((s,p)=>s+p.horas,0);
    totPessoas += pessoas;
    const multi = frentes.length>1;
    corpoAtiv += `<tr><td>${r.a.cod}</td><td>${r.a.nome}</td><td class="calc">${r.a.etapa}</td>
      <td class="calc">${multi?`<span class="badge b-warn">${frentes.length} frentes</span>`:(espDe(frentes[0].maq)||frentes[0].maq)}</td>
      <td class="calc">${multi?"—":r.fcod+" — "+frentes[0].fnome}</td>
      <td><select data-esc="${r.a.cod}" style="min-width:150px">${escOpts(r.escala)}</select></td>
      <td><select data-tur="${r.a.cod}" style="min-width:74px">${turOpts(r.turnosOv)}</select></td>
      <td class="num calc">${fmt(r.fator,2)}</td>
      <td class="num calc">${frota||"—"}</td><td class="num calc">${fmt(horas)}</td>
      <td class="num tot">${fmt(pessoas)}</td>
      <td class="num calc">${ativoDe(r.fcod)||"—"}</td></tr>`;
    if(multi) frentes.forEach(p=>{
      corpoAtiv += `<tr class="sub"><td></td><td class="calc">↳ ${p.modo}</td><td></td>
        <td class="calc">${espDe(p.maq)||p.maq}</td><td class="calc">${p.fcod} — ${p.fnome}</td>
        <td colspan="3"></td>
        <td class="num calc">${p.turnosEf}t</td>
        <td class="num calc">${p.frotaR||"—"}</td><td class="num calc">${fmt(p.horas)}</td>
        <td class="num calc">${fmt(p.efetivo)}</td><td></td></tr>`;
    });
  });

  $("#t_dim_pes").innerHTML = th([["Cod"],["Atividade / frente"],["Etapa"],["Especialidade"],["Função"],
    ["Escala"],["Turnos"],["Fator",1],["Frota",1],["Horas",1],["Pessoas",1],
    ["Ativos da função",1]])+"<tbody>"+
    (comGente.length ? corpoAtiv
    : `<tr><td colspan="12" class="calc">Sem frente com efetivo: lance quantidades no Plano Operacional.</td></tr>`)+
    `<tr><td class="tot" colspan="10">TOTAL NAS ATIVIDADES</td>
     <td class="num tot">${fmt(totPessoas)}</td><td></td></tr></tbody>`;

  const funcoes = Object.keys(PS.porFun).sort();
  const tot = {nec:0, pico:0, ativo:0, ferias:0, demis:0, disp:0, contratar:0, exced:0};
  const disponivel = {};
  const corpo = funcoes.map(f=>{
    const o = PS.porFun[f];
    const base = BASE.porFuncao[f]||0, ajuste = informado(f);
    const ativo = ativoDe(f), ferias = qv(f,"ferias"), demis = qv(f,"demis");
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

  /* base do ERP, como veio: cargo, especialidade, departamento e a funcao do plano */
  const nomeF = f => (R.MP.custoFuncao[f]||{}).nome || "";
  $("#t_pes_base").innerHTML = th([["Cargo no ERP"],["Especialidade"],["Departamento"],["Função no plano"],["Pessoas",1]])+"<tbody>"+
    BASE.linhas.map(l=>`<tr><td>${l.cargo}</td><td class="calc">${l.esp}</td><td class="calc">${l.dep}</td>
      <td>${l.afast ? '<span class="badge b-warn">afastado</span>'
        : (l.fcod ? l.fcod+" — "+nomeF(l.fcod) : '<span class="calc">sem função no plano</span>')}</td>
      <td class="num tot">${fmt(l.qtd)}</td></tr>`).join("")+
    `<tr><td class="tot" colspan="4">DISPONÍVEL PARA A OPERAÇÃO</td><td class="num tot">${fmt(BASE.mapeado)}</td></tr>
     <tr><td class="calc" colspan="4">Cargo sem função equivalente no plano</td><td class="num calc">${fmt(BASE.semFuncao)}</td></tr>
     <tr><td class="calc" colspan="4">Afastados e desistentes</td><td class="num calc">${fmt(BASE.afastados)}</td></tr>
     <tr><td class="tot" colspan="4">TOTAL NO ERP</td><td class="num tot">${fmt(BASE.total)}</td></tr></tbody>`;

  /* Necessidade mes a mes contra o disponivel informado: e aqui que se ve em
     qual mes falta gente, e quanta. O pico e apenas o pior desses meses. */
  // sem nada informado no quadro, nao ha com o que comparar: a matriz nao pinta falta
  const temQuadro = tot.ativo + tot.ferias + tot.demis > 0;
  const faltaMes = MESES.map(()=>0);
  const corpoMes = funcoes.map(f=>{
    const o = PS.porFun[f], disp = disponivel[f];
    return `<tr><td>${f} — ${(R.MP.custoFuncao[f]||{nome:f}).nome}</td>
      <td class="num calc">${fmt(disp)}</td>` +
      o.qtdMes.map((v,i)=>{
        const falta = temQuadro ? v - disp : 0;
        if(falta>0) faltaMes[i] += falta;
        const ehPico = v>0 && v===o.pico;
        const estilo = falta>0 ? ' style="background:var(--bad-bg);color:var(--bad);font-weight:600"' : '';
        return `<td class="num ${falta>0?"":"calc"} ${clsMes(i)}"${estilo} title="${MESES[i]}: precisa de ${fmt(v)}, disponível ${fmt(disp)}">${
          v>0 ? (ehPico?`<b>${fmt(v)}</b>`:fmt(v)) : "—"}</td>`;
      }).join("") +
      `<td class="num tot">${fmt(maxSel(o.qtdMes, SEL))}</td></tr>`;
  }).join("");

  $("#t_pes_mes").innerHTML = th([["Função"],["Disponível",1],...thMeses(),[SEL.parcial?"Pico no período":"Pico",1]])+"<tbody>"+
    (funcoes.length ? corpoMes : `<tr><td colspan="${NM+3}" class="calc">Sem função dimensionada.</td></tr>`)+
    `<tr><td class="tot">NECESSIDADE TOTAL</td><td class="num tot">${fmt(tot.disp)}</td>` +
    tdMeses(PS.qtdMes, v=>fmt(v), "num tot") +
    `<td class="num tot">${fmt(maxSel(PS.qtdMes, SEL))}</td></tr>` +
    `<tr><td class="calc">A contratar no mês</td><td></td>` +
    tdMeses(faltaMes, v=>v>0?`<span class="badge b-bad">+${fmt(v)}</span>`:"—", "num") +
    `<td class="num tot">${maxSel(faltaMes, SEL)>0?"+"+fmt(maxSel(faltaMes, SEL)):"—"}</td></tr></tbody>`;

  const iPicoGeral = PS.qtdMes.indexOf(Math.max(...PS.qtdMes));
  $("#k_dim_pes").innerHTML =
    kpi("Efetivo dimensionado","",fmt(PS.qtd)+" pessoas", funcoes.length+" funções","pessoas:total") +
    kpi("Pico de mobilização","t",fmt(PS.qtdMes[iPicoGeral]||0)+" pessoas", PS.qtd>0?MESES[iPicoGeral]:"","pessoas:pico") +
    kpi("Quadro ativo","g",fmt(tot.ativo)+" pessoas",
        `nas ${funcoes.length} funções dimensionadas · ${fmt(BASE.mapeado)} mapeados no ERP · ${fmt(BASE.afastados)} afastados fora`,"pessoas:total") +
    (tot.contratar>0
      ? kpi("A contratar","r",fmt(tot.contratar)+" pessoas","soma das funções com falta","pessoas:total")
      : kpi("Excedente","a",fmt(tot.exced)+" pessoas","nenhuma função com falta","pessoas:total"));

  $("#bl_pes_sub").textContent = `${fmt(PS.qtd)} pessoas dimensionadas · pico ${fmt(PS.qtdMes[iPicoGeral]||0)}`
    + (tot.contratar>0 ? ` · faltam ${fmt(tot.contratar)}` : "");
}

export { pintarDim, pintarDimPessoas };
