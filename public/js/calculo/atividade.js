import { maqDe } from './crm.js';
import { litrosDe } from './consumo.js';
import { CFG } from '../dados/cfg.js';
import { fatorEscala } from '../dados/escalas.js';
import { MESES, NM, diasCorridos, diasNoMesEntre, mesesEntre } from '../nucleo/calendario.js';
import { DIM, P, PLANO, REAL, TERC_SUB, TERC_TAR, atividadesLista } from '../nucleo/estado.js';
import { num, pct } from '../nucleo/formato.js';
import { precoDiesel } from './diesel.js';
import { tratCusto } from './insumos.js';
import { cicloTransporte } from './transporte.js';
import { custoDaFuncao } from './mao-de-obra.js';


/* ================== ATIVIDADE ================== */
const MODOS_ORD = ["Manual","Trator","Uniport","Drone","Quadriciclo","Terceiro"];
// tarifa de prestação de serviço por atividade (R$/ha) — sobrepõe o padrão
function tarifaTerc(cod){ return TERC_TAR[cod]!=null ? num(TERC_TAR[cod]) : CFG.terc_tar_pad; }

/* Tarifa efetiva do terceiro: se a atividade detalha por sub-modo (avião,
   drone, terrestre — TERC_SUB, editado no modal aberto a partir do "3º" no
   Plano Operacional), a tarifa vira a média dos sub-modos ponderada pelo %
   que cada um leva do total terceirizado. Sem detalhamento (ou com os % todos
   zerados), cai na tarifa única de sempre — nenhum documento existente muda. */
function chavesSubTerc(cod){
  const sub = TERC_SUB[cod];
  return sub ? Object.keys(sub).filter(m=>num(sub[m] && sub[m].pct)>0) : [];
}
// a atividade tem algum sub-modo (avião, drone, terrestre) com % > 0? Usado
// pela UI (Plano Operacional e Plano de Contas) pra saber se a tarifa única
// está em uso ou se foi substituída pelo detalhamento.
function temDetalheTerc(cod){ return chavesSubTerc(cod).length>0; }
function tarifaTercDe(cod){
  const sub = TERC_SUB[cod], chaves = chavesSubTerc(cod);
  const soma = chaves.reduce((s,m)=>s+num(sub[m].pct),0);
  if(soma<=0) return tarifaTerc(cod);
  return chaves.reduce((s,m)=>s+(num(sub[m].pct)/soma)*num(sub[m].tar),0);
}

/* Modos que a atividade aceita. Sem a lista, vale o cardapio inteiro; com ela,
   a atividade so oferece o que faz sentido — aplicacao de calcario, por exemplo,
   e trator proprio ou prestador de servico, nunca drone. */
function modosDe(a){
  const l = Array.isArray(a.modos) ? a.modos.filter(m=>CFG.modos[m]) : [];
  return l.length ? l : MODOS_ORD;
}

// divisão da área entre modos de aplicação. Sem mix definido, roda 100% no padrão.
function mixDe(a, p){
  if(!a.modoOn) return null;
  const mx = p.mix || {};
  const soma = modosDe(a).reduce((s,m)=>s+num(mx[m]),0);
  if(soma<=0) return null;
  return {mx, soma};
}

/* Fator de escala da atividade: a escala escolhida no dimensionamento de pessoas
   manda; sem escolha, vale o fator das Premissas de Mao de Obra. */
function fatorDe(cod, MP){
  return fatorEscala((DIM[cod]||{}).esc) || MP.fatorEscala;
}

/* ===== Janela de execução de uma atividade =====
   Quantos meses a atividade tem para acontecer. Antes a frota era dimensionada
   sobre os doze meses do orçamento, mesmo numa atividade que roda em três: a
   conta dava uma frota quatro vezes menor do que a operação precisa.

   A janela sai, nesta ordem:
     1. datas de início e fim lançadas na atividade
     2. os meses em que há volume lançado no plano
     3. o ano inteiro, quando não há nem data nem volume

   Em meses fracionários, porque uma janela de 45 dias não são dois meses. */
const DIAS_MES = 365 / 12;
function janelaDe(cod, meses, codOrigem){
  // transporte e transbordo espelham a tonelada da colheita; espelham a janela
  // tambem, quando nao tiverem datas proprias. Sem isso a meta do transporte
  // ficava diluida num mes que a colheita ja sabia ser parcial -- duas metas
  // discordando sobre a mesma carga. Data digitada no transporte manda.
  const d = (DIM[cod] && DIM[cod].ini && DIM[cod].fim) ? DIM[cod]
          : (codOrigem && DIM[codOrigem]) ? DIM[codOrigem]
          : (DIM[cod] || {});
  // Janela que nao toca o ano agricola (em geral, ano digitado errado) vale o
  // mesmo que uma invertida: nenhum mes a recebe, e a frota era dimensionada
  // para um periodo fora do orcamento. Cai no criterio de baixo, como a
  // invertida, e a aba Validacao acusa as duas.
  if(d.ini && d.fim){
    const i = new Date(d.ini), f = new Date(d.fim), idx = mesesEntre(d.ini, d.fim);
    if(!isNaN(i) && !isNaN(f) && f >= i && idx.length){
      const dias = (f - i) / 86400000 + 1;          // fim inclusivo
      return {meses: Math.max(dias / DIAS_MES, 1 / DIAS_MES), dias, fonte: "datas",
              ini: d.ini, fim: d.fim, idx};
    }
  }
  const comVol = meses.reduce((n, q) => n + (num(q) > 0 ? 1 : 0), 0);
  if(comVol > 0) return {meses: comVol, dias: comVol * DIAS_MES, fonte: "meses do plano",
    idx: meses.map((q,i)=>num(q)>0?i:-1).filter(i=>i>=0)};
  return {meses: NM, dias: NM * DIAS_MES, fonte: "ano inteiro", idx: []};
}

/* ===== Meta operacional de uma atividade =====
   Traduz o dimensionamento no ritmo que o campo tem de manter. Mora aqui, e nao
   na tela que a mostra, porque o mesmo numero vai para o modal da atividade, a
   aba de acompanhamento e os relatorios de meta -- se cada um calculasse o seu,
   a reuniao teria tres metas diferentes para a mesma atividade.

   `horas` e tempo de maquina efetivamente operando (area / rendimento). A
   disponibilidade e a utilizacao nao encolhem essa hora: elas alargam o dia de
   calendario necessario para entrega-la. */
function metaDe(r){
  const jm = r.janela ? r.janela.meses : 0;
  const dias = num(P.dias) * jm;                       // dias efetivos na janela
  const hDisp = num(P.hdia) * (num(P.disp)/100) * eficPadrao();   // hora de maquina por dia
  if(!(r.total > 0) || !(r.frotaR > 0) || !(dias > 0) || !(hDisp > 0) || !(jm > 0)) return null;
  const hEq = r.horas / r.frotaR, qEq = r.total / r.frotaR;
  return {
    dias, hDisp, meses: jm, frota: r.frotaR,
    hEquipDia: hEq/dias,  hEquipMes: hEq/jm,  hEquipPeriodo: hEq,
    qEquipDia: qEq/dias,  qEquipMes: qEq/jm,  qEquipPeriodo: qEq,
    hFrotaDia: r.horas/dias, hFrotaMes: r.horas/jm, hFrotaPeriodo: r.horas,
    qFrotaDia: r.total/dias, qFrotaMes: r.total/jm, qFrotaPeriodo: r.total,
    ocupa: (hEq/dias)/hDisp,
  };
}

/* Eficiencia operacional: quanto do tempo em campo e de fato produtivo, ja
   descontados chuva, manobra, espera e abastecimento. E o terceiro fator da
   hora efetiva, ao lado da disponibilidade mecanica (manutencao) e da
   utilizacao (operacao): hora efetiva = jornada x disponibilidade x utilizacao
   x eficiencia. Padrao 100%, para nao mexer em nada de quem nao usa.

   Plano antigo, salvo antes deste campo existir, nao tem P.efic -- cai em 100%
   pelo mesmo motivo. */
function eficPadrao(){
  const v = num(P.efic);
  return v > 0 ? v/100 : 1;
}

/* ===== Criterio de um mes =====
   Frota, disponibilidade e utilizacao aceitam valor proprio por mes, lancados no
   modal de rendimento. Em branco, o mes herda o criterio da atividade -- e o
   padrao, porque na maioria das atividades o mes nao muda nada. */
function criterioDoMes(cod, i, utilAt){
  const d = DIM[cod] || {};
  const v = k => { const arr = d[k]; return Array.isArray(arr) ? num(arr[i]) : 0; };
  const disp = v("dispM"), util = v("utilM"), efic = v("eficM");
  return {
    rend: v("rendM"), frota: v("frotaM"),
    disp: disp > 0 ? disp/100 : num(P.disp)/100,
    util: util > 0 ? util/100 : num(utilAt),
    efic: efic > 0 ? efic/100 : eficPadrao(),
    temDisp: disp > 0, temUtil: util > 0, temEfic: efic > 0,
  };
}
/** true quando a atividade tem algum criterio proprio de mes. */
function temCriterioMensal(cod){
  const d = DIM[cod] || {};
  return ["rendM","frotaM","dispM","utilM","eficM"].some(k =>
    Array.isArray(d[k]) && d[k].some(v => num(v) > 0));
}

/* Dias que a janela da atividade realmente cobre no mes.
   Dezembro que termina no dia 15 vale 15 dias de calendario, nao 31, e os dias
   de operacao encolhem na mesma proporcao. Sem isso a meta do mes parcial sai
   diluida: o volume inteiro dividido por um mes que nao vai acontecer todo, o
   que faz o criterio parecer folgado justamente no mes que tem menos dia.

   Mes com volume lancado fora da janela declarada usa o mes cheio: o volume
   esta ali e tem de ser feito, e o Plano Operacional ja marca o desencontro na
   celula. Dividir por zero dia seria pior do que usar o mes todo. */
function diasDoMes(i, jan){
  const cheio = diasCorridos(i);
  const cobertos = jan && jan.fonte === "datas" ? diasNoMesEntre(i, jan.ini, jan.fim) : cheio;
  const corridos = cobertos > 0 ? cobertos : cheio;
  return {corridos, efetivos: num(P.dias) * (corridos / cheio),
          parcial: corridos < cheio, cheio};
}

/* ===== Criterio operacional, mes a mes =====
   A meta por equipamento responde o ritmo medio da janela. O mes nao e medio:
   outubro pede mais que abril, e e no mes cheio que o criterio aperta.

   Cada mes e uma pergunta de tres respostas, porque sao tres as alavancas para
   o volume caber -- render mais por hora, ficar mais tempo disponivel
   (manutencao) ou aproveitar melhor o tempo disponivel (operacao). `rendNec`,
   `dispNec` e `utilNec` sao alternativas, nao se somam: cada uma fixa as outras
   duas e mostra o que teria de ser sozinha.

   Mora aqui, e nao na tela, porque o mesmo numero vai para o modal de
   rendimento e para o modal da atividade -- se cada um calculasse o seu, a
   reuniao teria duas metas para o mesmo mes. */
function criterioMensal(r){
  const hDia = num(P.hdia);
  /* Pessoas do mes: a mesma conta do efetivo da atividade
     (frota x operadores x turnos x fator de escala), so que sobre a frota
     daquele mes. Quem muda a frota de dezembro precisa ver quanta gente
     dezembro passa a pedir -- frota sem efetivo e meia resposta.
     Com mix de modos nao ha uma frente so para ler operadores e turnos: ali o
     efetivo do mes e o da atividade na proporcao da frota. */
  const p0 = r.partes && r.partes.length === 1 ? r.partes[0] : null;
  const fator = num(r.fator) || 1;
  const pessoasDe = n => {
    if(!(n > 0)) return 0;
    if(p0) return Math.ceil(n * num(p0.ops) * (num(p0.turnosEf) || 1) * fator);
    return r.frotaR > 0 ? Math.ceil(num(r.efetivo) * n / r.frotaR) : 0;
  };
  const nPad = r.frotaR || 0;
  // mix de modos e transporte nao tem rendimento de premissa unico -- ali a
  // media do periodo e o unico numero que representa a atividade
  const rendPad = r.rendPremissa > 0 ? r.rendPremissa : r.rend;
  return r.meses.map((qq, i)=>{
    const q = num(qq);
    const D = diasDoMes(i, r.janela);
    const diasMes = D.efetivos;
    const c = criterioDoMes(r.a.cod, i, r.util);
    // Mes sem volume nao opera: frota e efetivo sao zero, nao os da atividade.
    // Herdar o criterio ali fazia o mes aparecer com maquina e gente alocadas
    // para uma producao que nao existe.
    const n = q > 0 ? (c.frota > 0 ? c.frota : nPad) : 0;
    // com a frota do mes fixada, as horas sao a capacidade dela e o rendimento
    // e o que fecha a conta -- a mesma inversao do Dimensionamento, por mes
    const hDispEquip = hDia * c.disp * c.util * c.efic;   // hora produtiva por equipamento/dia
    const cap = n * diasMes * hDispEquip;           // hora produtiva da frota no mes
    // o mes sem rendimento proprio herda a PREMISSA da atividade, nao a media
    // do periodo: a media se move quando outro mes muda, e o modal passaria a
    // mostrar para novembro um numero que o motor nao usa
    const rendBase = c.rend > 0 ? c.rend : rendPad;
    const rend = c.frota > 0 && q > 0 && cap > 0 ? q/cap : rendBase;
    const horas = rend > 0 ? q/rend : 0;
    const hCal = n * diasMes * hDia;                // hora de calendario da frota no mes
    return {
      i, mes: MESES[i], q, temVolume: q > 0,
      rend, n, disp: c.disp, util: c.util, efic: c.efic, horas,
      daFrota: c.frota > 0, temRend: c.rend > 0,
      temDisp: c.temDisp, temUtil: c.temUtil, temEfic: c.temEfic,
      // duas leituras da mesma producao: o ritmo que a frente tem de manter nos
      // dias em que vai a campo, e o ritmo contra o calendario, que e como se
      // acompanha "estamos no dia 12 de outubro". A primeira e a meta; a segunda
      // e o termometro
      dias: diasMes, diasCorridos: D.corridos, parcial: D.parcial, diasCheios: D.cheio,
      qDia: diasMes > 0 ? q/diasMes : 0,
      qDiaCorrido: D.corridos > 0 ? q/D.corridos : 0,
      pessoas: pessoasDe(n),
      qDiaEquip: n > 0 && diasMes > 0 ? q/n/diasMes : 0,
      hDiaEquip: n > 0 && diasMes > 0 ? horas/n/diasMes : 0,
      hDispEquip, cap,
      rendNec: cap > 0 ? q/cap : 0,
      dispNec: hCal*c.util*c.efic > 0 ? horas/(hCal*c.util*c.efic) : 0,
      utilNec: hCal*c.disp*c.efic > 0 ? horas/(hCal*c.disp*c.efic) : 0,
      eficNec: hCal*c.disp*c.util > 0 ? horas/(hCal*c.disp*c.util) : 0,
      folga: cap - horas,
      cabe: cap >= horas - 1e-9,
    };
  });
}

/* ===== Frota que a atividade exige ter =====
   Frota nao se soma nem se tira media: quem tem de existir no patio e a do MES
   QUE MAIS PEDE. A media da janela subestima -- uma atividade que roda com 10
   maquinas em fevereiro e 2 em marco aparecia como 2, e 2 nao fazem fevereiro.

   `pico` e o maior mes; `media` e a da janela, que e a que o motor usa para
   ratear custo. As duas convivem porque respondem perguntas diferentes:
   quantas comprar, e quanto custa o uso. */
function frotaDaAtividade(r){
  const C = criterioMensal(r).filter(c => c.temVolume);
  const pico = C.reduce((m,c)=>Math.max(m, c.n), 0);
  const mesPico = C.find(c => c.n === pico);
  return {
    pico: pico || r.frotaR || 0,
    media: r.frotaR || 0,
    mes: mesPico ? mesPico.mes : null,
    // so avisa quando o pico de fato passa da media arredondada
    difere: pico > (r.frotaR || 0),
  };
}

function linha(a, MP){
  const p = PLANO[a.cod] || {m:Array(NM).fill(0), trat:""};
  const baseMeses = a.tipo==="transp"
    ? ((PLANO[a.src]||{m:Array(NM).fill(0)}).m || Array(NM).fill(0))
    : (p.m || Array(NM).fill(0));
  /* dois tratamentos na mesma atividade, cada um com área própria: a área
     operacional (a que dimensiona frota e horas) passa a ser a SOMA das
     áreas de cada tratamento, não mais um número lançado à parte no topo —
     "são áreas exclusivas de cada um" foi o pedido. Sem tratamento extra,
     nada muda: meses/total continuam vindo direto de PLANO[cod].m, como
     sempre (zero regressão pra quem não usa isto). */
  const extras = (Array.isArray(p.trats) ? p.trats : []).filter(e=>e && e.trat);
  const mesesExtras = extras.map(e => Array.isArray(e.m) ? e.m.map(num) : Array(NM).fill(0));
  const mesesPrim = Array.isArray(p.tratM) ? p.tratM.map(num) : baseMeses.map(num);
  const meses = extras.length
    ? baseMeses.map((_,i) => mesesPrim[i] + mesesExtras.reduce((s,arr)=>s+num(arr[i]||0),0))
    : baseMeses;
  const total = meses.reduce((s,x)=>s+num(x),0);
  const d = DIM[a.cod] || {};
  /* Frota alvo: inverte o dimensionamento. A conta normal pergunta "com este
     rendimento, de quantas maquinas preciso"; com a frota fixada ela vira "com
     estas maquinas, que rendimento cada uma tem de entregar". E a pergunta que
     aparece quando a frota ja existe no patio e nao ha o que comprar.

     So vale para atividade de frente unica: com mix de modos nao ha uma
     resposta so -- a mesma frota total se distribui de infinitas maneiras entre
     manual, trator e terceiro, e o sistema estaria escolhendo por conta propria. */
  const frotaAlvo = num(d.frota);
  const mensal = temCriterioMensal(a.cod);   // ha criterio proprio de algum mes
  const fator = fatorDe(a.cod, MP);   // escala da atividade
  // turnos escolhidos na atividade (1t, 2t, 3t); sem escolha, o do modo ou do cadastro
  const turnosOv = num((DIM[a.cod]||{}).turnos);
  const util = d.util!=null ? num(d.util) : a.util;
  const ehHa = a.un.indexOf("ha")===0;
  const jan = janelaDe(a.cod, meses, a.tipo === "transp" ? a.src : null);
  const M = mixDe(a, p);

  // define as frentes de trabalho: uma por modo com % > 0, ou uma única no padrão
  let frentes;
  if(M){
    frentes = modosDe(a).filter(m=>num(M.mx[m])>0).map(m=>{
      // modoCfg deixa a atividade ajustar maquina, implemento, rendimento ou funcao do modo
      const MO = {...CFG.modos[m], ...((a.modoCfg||{})[m]||{})};
      return {modo:m, pct:num(M.mx[m])/M.soma, maq:MO.maq, imp:MO.imp,
              rend:MO.rend, ops:MO.ops, turnos:MO.turnos, fcodPad:MO.fcod, terc:!!MO.terc};
    });
  }else{
    frentes = [{modo:"", pct:1, maq:a.maq, imp:a.imp,
                rend: d.rend!=null?num(d.rend):a.rend,
                rendM: Array.isArray(d.rendM) && d.rendM.some(v=>num(v)>0) ? d.rendM : null,
                ops:a.ops, turnos:a.turnos, fcodPad:null}];
  }

  const fcod = p.fcod || (frentes[0].fcodPad) || CFG.func_at[a.nome] || "596";

  // fração de cada mês na quantidade da atividade: distribui litros e aplica o preço do mês
  const fracMes = total>0 ? meses.map(q=>num(q)/total) : Array(NM).fill(0);
  const precoMed = fracMes.reduce((s,fr,i)=>s+fr*precoDiesel(i),0);

  const partes = frentes.map(f=>{
    const area = total*f.pct;
    if(f.terc){
      // prestador de serviço: não consome frota nem mão de obra própria.
      // O custo é a tarifa contratada aplicada à área designada — ou, quando a
      // atividade detalha por sub-modo (avião, drone...), a média ponderada
      // dessas tarifas. Sem detalhamento, vale a tarifa única de sempre.
      const cTerc = area * tarifaTercDe(a.cod);
      return {...f, area, horas:0, capMes:0, frota:0, frotaR:0, litros:0,
              fcod:"—", fnome:"Prestador", cDiesel:0, cManut:0, cMDO:0, mdoMes:Array(NM).fill(0), cTerc,
              efetivo:0, direto:cTerc};
    }
    let horas, capMes, frota;
    let kmViagens = null;   // distância rodada, quando o trabalho a conhece
    if(a.tipo==="transp"){
      const raio = a.src==="A02" ? P.raioMuda : P.raioSafra;
      const ciclo = cicloTransporte(raio);
      const cap = a.modo==="caminhao" ? P.capCam : P.capTransb;
      const viagens = cap>0 ? area/cap : 0;
      // cada viagem vai carregada e volta vazia: duas vezes o raio
      kmViagens = viagens*2*num(raio);
      horas = P.dispTr>0 ? viagens*ciclo/(P.dispTr/100) : 0;
      capMes = P.dias * P.hDiaTr * (P.dispTr/100) * util;
    }else if(f.rendM || mensal){
      // criterio varia por mes: soma as horas mes a mes em vez de dividir o total
      // por um rendimento so — mes sem valor proprio usa o padrao (f.rend)
      horas = meses.reduce((s,q,i)=>{
        const qq = num(q);
        if(!(qq>0)) return s;      // mes sem volume nao consome hora nenhuma
        const c = criterioDoMes(a.cod, i, util);
        // frota fixada no mes: as horas sao a capacidade dela, e o rendimento do
        // mes passa a ser o que fecha a conta (a inversao do Dimensionamento,
        // aplicada mes a mes)
        if(c.frota>0) return s + c.frota * diasDoMes(i, jan).efetivos * P.hdia * c.disp * c.util * c.efic;
        const rendEf = c.rend>0 ? c.rend : f.rend;
        return s + (rendEf>0 ? qq/rendEf : 0);
      }, 0);
      capMes = P.dias * P.hdia * (P.disp/100) * eficPadrao() * util;
    }else{
      horas = f.rend>0 ? area/f.rend : 0;
      capMes = P.dias * P.hdia * (P.disp/100) * eficPadrao() * util;
    }
    // com a frota fixada, as horas passam a ser a capacidade dessa frota na
    // janela, e o rendimento e o que fecha a conta: area ÷ horas
    let rendAlvo = null;
    // criterio de mes manda na frota alvo da atividade: o mes e o ajuste fino, e
    // deixar os dois agirem juntos exigiria repartir a frota alvo entre os meses
    // por um criterio que o sistema estaria inventando sozinho
    if(frotaAlvo>0 && !M && !mensal && capMes>0 && jan.meses>0){
      horas = frotaAlvo*capMes*jan.meses;
      rendAlvo = horas>0 ? area/horas : 0;
    }
    // frota = horas de trabalho ÷ capacidade de um equipamento na janela
    frota = capMes>0 ? horas/(capMes*jan.meses) : 0;
    // com frota fixada, vale o numero digitado, sem o ida e volta da divisao:
    // multiplicar e dividir pelo mesmo fator devolvia 200,0000000001, e o
    // arredondamento para cima virava uma maquina a mais no orcamento
    if(rendAlvo!=null) frota = frotaAlvo;
    const mq = maqDe(f.maq);
    // a função segue o modo, salvo se o usuário tiver fixado uma função na atividade
    const fc = p.fcod ? fcod : (f.fcodPad || fcod);
    const cf = custoDaFuncao(fc, MP);
    // L/h × horas ou L/km × km, conforme o equipamento (calculo/consumo.js)
    const cons    = litrosDe(f.maq, horas, kmViagens);
    const litros  = cons.litros;
    const cDiesel = litros*precoMed;
    const cManut  = 0;   // alocado adiante, a partir do CRM da frota prevista
    /* Mão de obra pelo efetivo, mês cheio: a equipe da frente (frota ×
       operadores × turnos × fator de escala) é paga o mês inteiro em todo mês
       em que a atividade tem volume, ao custo mensal da função (salário,
       encargos e benefícios). É como a folha é paga, e fecha com o Resumo de
       Pessoas. Antes era por hora de máquina (salário ÷ 403 h), sem os turnos:
       cobrava um operador por máquina onde o efetivo conta três. */
    const efetivo = Math.ceil(Math.ceil(frota)*f.ops*(turnosOv>0?turnosOv:f.turnos)*fator);
    const mdoMes  = meses.map(q => num(q)>0 ? efetivo*cf.mensal : 0);
    const cMDO    = mdoMes.reduce((s,x)=>s+x, 0);
    return {...f, area, horas, capMes, frota, frotaR:Math.ceil(frota), cTerc:0, litros, consumoLh:cons.lh,
            consumoUn:cons.un, consumoLkm:cons.lkm, km:cons.km, fonteKm:cons.fonteKm,
            rend: rendAlvo!=null ? rendAlvo : f.rend, rendAlvo,
            fcod:fc, fnome:cf.nome, cDiesel, cManut, cMDO, mdoMes, custoMensal:cf.mensal,
            turnosEf: turnosOv>0 ? turnosOv : f.turnos,
            efetivo,
            direto: cDiesel+cManut+cMDO};
  });

  const soma = k => partes.reduce((s,x)=>s+x[k],0);
  const t = tratCusto(p.trat);
  // cInsumo por tratamento, reaproveitando as áreas já usadas lá em cima pra
  // somar o total (mesmos números — não recalcula "o que sobra" de novo aqui)
  let cInsumo, tratsDetalhe = null;
  if(extras.length){
    const areaPrim = mesesPrim.reduce((s,q)=>s+q,0);
    const cPrim = (t && ehHa) ? areaPrim*t : 0;
    const cExtras = extras.map((e,k)=>{
      const tE = tratCusto(e.trat);
      const areaE = mesesExtras[k].reduce((s,q)=>s+q,0);
      const custoE = (tE && ehHa) ? areaE*tE : 0;
      return {trat:e.trat, area:areaE, custo:custoE, m:mesesExtras[k]};
    });
    cInsumo = cPrim + cExtras.reduce((s,x)=>s+x.custo,0);
    tratsDetalhe = [{trat:p.trat, area:areaPrim, custo:cPrim, principal:true, m:mesesPrim}, ...cExtras];
  }else{
    cInsumo = (t && ehHa) ? total*t : 0;
  }
  const rendMed = soma("horas")>0 ? total/soma("horas") : (frentes[0].rend||0);

  return {a, meses, total, rend:rendMed,
          frotaAlvo: frotaAlvo>0 && !M && !mensal ? frotaAlvo : 0,
          frotaAlvoSuspensa: frotaAlvo>0 && !M && mensal ? frotaAlvo : 0,
          rendPremissa: (M || a.tipo==="transp") ? 0 : frentes[0].rend,
          criterioMensal: mensal, util, partes, escala:(d.esc||""), fator, turnosOv, janela:jan, mix:M?M.mx:null, mixSoma:M?M.soma:0,
          horas:soma("horas"), capMes:partes[0].capMes, frota:soma("frota"),
          frotaR:partes.reduce((s,x)=>s+x.frotaR,0),
          cDiesel:soma("cDiesel"), cManut:soma("cManut"), cMDO:soma("cMDO"), cTerc:soma("cTerc"), cInsumo, tratsDetalhe,
          mdoMes: MESES.map((m,i)=>partes.reduce((s,x)=>s+((x.mdoMes||[])[i]||0),0)),
          fcod, fnome:partes[0].fnome, efetivo:soma("efetivo"),
          modo: M ? "mix" : "", maqEfetiva: partes.map(x=>x.maq).join(" + "),
          impEfetivo: partes.map(x=>x.imp).join(" + "),
          direto: soma("direto")+cInsumo, trat:p.trat, ehHa,
          litros: soma("litros"),
          litrosMes: fracMes.map(fr=>fr*soma("litros")),
          dieselMes: fracMes.map((fr,i)=>fr*soma("litros")*precoDiesel(i))};
}

/* ---------- cadastro de atividades: incluir e remover ----------
   Mesmo mecanismo do cadastro de insumos (mesclarBaseInsumos): atividade nova
   do codigo base entra sozinha na leitura do documento; nome, rendimento etc.
   que o usuario ja tiver ajustado numa atividade existente ficam como estao. */
function mesclarBaseAtividades(){
  const lista = atividadesLista();
  const jaTem = new Set(lista.map(a=>a.cod));
  let novas = 0;
  CFG.atividades.forEach(base=>{
    if(!jaTem.has(base.cod)){ lista.push({...base}); novas++; }
  });
  return {novas, total:lista.length};
}
// mesmo alfabeto de codigoTratValido (calculo/insumos.js): texto de tela, valor
// de <option> e atributo data-*, sem nada que feche aspa ou abra marcacao
const COD_ATIV_OK = /^[\p{L}\p{N} ._\/+()%,-]{1,20}$/u;
function codigoAtividadeValido(cod){ return COD_ATIV_OK.test(String(cod||"").trim()); }
function criarAtividade(cod){
  const c = String(cod||"").trim();
  const lista = atividadesLista();
  if(!codigoAtividadeValido(c) || lista.some(a=>a.cod===c)) return false;
  // modoOn:true libera o mix de modos (M/T/U/D/Q/3º) no Plano Operacional —
  // sem isso a atividade nova nascia sem nenhuma forma de marcar o modo de
  // execução, diferente da maioria do catálogo base
  lista.push({cod:c, etapa:"TRATOS CULTURAIS", nome:"Nova atividade", un:"ha/mês",
              rend:1, maq:"", imp:"", ops:1, turnos:1, util:0.8, modoOn:true});
  return true;
}
// atividade do cadastro base nao se remove aqui (outras telas e o proprio
// motor pressupoem que ela existe) — so a que o usuario criou nesta aba
function removerAtividade(cod){
  if(CFG.atividades.some(a=>a.cod===cod)) return false;
  const lista = atividadesLista();
  const i = lista.findIndex(a=>a.cod===cod);
  if(i<0) return false;
  lista.splice(i,1);
  delete PLANO[cod]; delete DIM[cod]; delete TERC_TAR[cod]; delete TERC_SUB[cod]; delete REAL[cod];
  return true;
}

export { MODOS_ORD, criterioMensal, diasDoMes, fatorDe, frotaDaAtividade, modosDe, linha, mixDe, tarifaTerc, tarifaTercDe, temDetalheTerc, metaDe,
  temCriterioMensal, mesclarBaseAtividades, codigoAtividadeValido, criarAtividade, removerAtividade };
