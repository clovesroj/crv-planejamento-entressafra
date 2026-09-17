import { maqDe } from './crm.js';
import { CFG } from '../dados/cfg.js';
import { fatorEscala } from '../dados/escalas.js';
import { NM, mesesEntre } from '../nucleo/calendario.js';
import { DIM, P, PLANO, TERC_TAR } from '../nucleo/estado.js';
import { num, pct } from '../nucleo/formato.js';
import { precoDiesel } from './diesel.js';
import { tratCusto } from './insumos.js';
import { custoDaFuncao } from './mao-de-obra.js';


/* ================== ATIVIDADE ================== */
const MODOS_ORD = ["Manual","Trator","Uniport","Drone","Terceiro"];
// tarifa de prestação de serviço por atividade (R$/ha) — sobrepõe o padrão
function tarifaTerc(cod){ return TERC_TAR[cod]!=null ? num(TERC_TAR[cod]) : CFG.terc_tar_pad; }

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
function janelaDe(cod, meses){
  const d = DIM[cod] || {};
  if(d.ini && d.fim){
    const i = new Date(d.ini), f = new Date(d.fim);
    if(!isNaN(i) && !isNaN(f) && f >= i){
      const dias = (f - i) / 86400000 + 1;          // fim inclusivo
      return {meses: Math.max(dias / DIAS_MES, 1 / DIAS_MES), dias, fonte: "datas",
              ini: d.ini, fim: d.fim, idx: mesesEntre(d.ini, d.fim)};
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
  const hDisp = num(P.hdia) * (num(P.disp)/100);       // hora de maquina por dia
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

function linha(a, MP){
  const p = PLANO[a.cod] || {m:Array(NM).fill(0), trat:""};
  const meses = a.tipo==="transp"
    ? ((PLANO[a.src]||{m:Array(NM).fill(0)}).m || Array(NM).fill(0))
    : (p.m || Array(NM).fill(0));
  const total = meses.reduce((s,x)=>s+num(x),0);
  const d = DIM[a.cod] || {};
  const fator = fatorDe(a.cod, MP);   // escala da atividade
  // turnos escolhidos na atividade (1t, 2t, 3t); sem escolha, o do modo ou do cadastro
  const turnosOv = num((DIM[a.cod]||{}).turnos);
  const util = d.util!=null ? num(d.util) : a.util;
  const ehHa = a.un.indexOf("ha")===0;
  const jan = janelaDe(a.cod, meses);
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
                rendM: Array.isArray(d.rendM) ? d.rendM : null,
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
      // O custo é a tarifa contratada aplicada à área designada.
      const cTerc = area * tarifaTerc(a.cod);
      return {...f, area, horas:0, capMes:0, frota:0, frotaR:0, litros:0,
              fcod:"—", fnome:"Prestador", cDiesel:0, cManut:0, cMDO:0, cTerc,
              efetivo:0, direto:cTerc};
    }
    let horas, capMes, frota;
    if(a.tipo==="transp"){
      const raio = a.src==="A02" ? P.raioMuda : P.raioSafra;
      const ciclo = raio/P.velC + raio/P.velV + (P.tCarga+P.tDesc)/60;
      const cap = a.modo==="caminhao" ? P.capCam : P.capTransb;
      const viagens = cap>0 ? area/cap : 0;
      horas = P.dispTr>0 ? viagens*ciclo/(P.dispTr/100) : 0;
      capMes = P.dias * P.hDiaTr * (P.dispTr/100) * util;
    }else if(f.rendM){
      // rendimento varia por mes: soma as horas mes a mes em vez de dividir o total
      // por um rendimento so — mes sem valor proprio usa o padrao (f.rend)
      horas = meses.reduce((s,q,i)=>{
        const rm = num(f.rendM[i]), rendEf = rm>0 ? rm : f.rend;
        return s + (rendEf>0 ? num(q)/rendEf : 0);
      }, 0);
      capMes = P.dias * P.hdia * (P.disp/100) * util;
    }else{
      horas = f.rend>0 ? area/f.rend : 0;
      capMes = P.dias * P.hdia * (P.disp/100) * util;
    }
    // frota = horas de trabalho ÷ capacidade de um equipamento na janela
    frota = capMes>0 ? horas/(capMes*jan.meses) : 0;
    const mq = maqDe(f.maq);
    // a função segue o modo, salvo se o usuário tiver fixado uma função na atividade
    const fc = p.fcod ? fcod : (f.fcodPad || fcod);
    const cf = custoDaFuncao(fc, MP);
    const litros  = horas*mq.d;
    const cDiesel = litros*precoMed;
    const cManut  = 0;   // alocado adiante, a partir do CRM da frota prevista
    const cMDO    = horas*cf.hora*f.ops*fator;
    return {...f, area, horas, capMes, frota, frotaR:Math.ceil(frota), cTerc:0, litros, consumoLh:mq.d,
            fcod:fc, fnome:cf.nome, cDiesel, cManut, cMDO,
            turnosEf: turnosOv>0 ? turnosOv : f.turnos,
            efetivo: Math.ceil(Math.ceil(frota)*f.ops*(turnosOv>0?turnosOv:f.turnos)*fator),
            direto: cDiesel+cManut+cMDO};
  });

  const soma = k => partes.reduce((s,x)=>s+x[k],0);
  const t = tratCusto(p.trat);
  const cInsumo = (t && ehHa) ? total*t : 0;
  const rendMed = soma("horas")>0 ? total/soma("horas") : (frentes[0].rend||0);

  return {a, meses, total, rend:rendMed, util, partes, escala:(d.esc||""), fator, turnosOv, janela:jan, mix:M?M.mx:null, mixSoma:M?M.soma:0,
          horas:soma("horas"), capMes:partes[0].capMes, frota:soma("frota"),
          frotaR:partes.reduce((s,x)=>s+x.frotaR,0),
          cDiesel:soma("cDiesel"), cManut:soma("cManut"), cMDO:soma("cMDO"), cTerc:soma("cTerc"), cInsumo,
          fcod, fnome:partes[0].fnome, efetivo:soma("efetivo"),
          modo: M ? "mix" : "", maqEfetiva: partes.map(x=>x.maq).join(" + "),
          impEfetivo: partes.map(x=>x.imp).join(" + "),
          direto: soma("direto")+cInsumo, trat:p.trat, ehHa,
          litros: soma("litros"),
          litrosMes: fracMes.map(fr=>fr*soma("litros")),
          dieselMes: fracMes.map((fr,i)=>fr*soma("litros")*precoDiesel(i))};
}

export { MODOS_ORD, fatorDe, modosDe, linha, mixDe, tarifaTerc, metaDe };
