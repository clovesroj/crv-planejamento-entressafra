import { metaDe } from './atividade.js';
import { CFG } from '../dados/cfg.js';
import { MESES, NM } from '../nucleo/calendario.js';
import { REAL } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';

/* ================== ACOMPANHAMENTO DO PLANO ==================
   Duas perguntas, nesta ordem: qual e a meta de cada gerencia, e o plano esta
   sendo cumprido.

   As metas nao sao recalculadas aqui -- saem de metaDe(), a mesma funcao que
   alimenta o modal da atividade. O acompanhamento so confronta essas metas com
   o que foi lancado como realizado, mes a mes.

   O realizado e digitado na aba; nada vem de integracao. Mes sem lancamento
   nao conta como zero executado: fica de fora da conta de aderencia, senao um
   plano recem-aberto apareceria com 0% de execucao em toda linha. */

/** Realizado lancado numa atividade, por mes. */
function realDe(cod){
  const a = REAL[cod];
  return Array.isArray(a) ? a : Array(NM).fill("");
}

/** Gerencia responsavel por uma atividade. */
function gerenciaDe(a){
  if(a.tipo === "transp") return "logistica";
  return "agricola";
}

/**
 * Metas por atividade, com a gerencia que responde por ela.
 * So entra atividade com volume lancado -- meta de atividade vazia nao existe.
 */
function metasPorAtividade(R){
  return R.L.filter(r => r.total > 0).map(r=>{
    const m = metaDe(r);
    return {
      cod: r.a.cod, nome: r.a.nome, etapa: r.a.etapa, un: r.a.un.split("/")[0],
      gerencia: gerenciaDe(r.a),
      total: r.total, horas: r.horas, rend: r.rend, frota: r.frotaR, efetivo: r.efetivo,
      maq: r.maqEfetiva, imp: r.impEfetivo,
      janela: r.janela, custo: r.direto, meta: m,
      meses: r.meses.map(q=>num(q)),
    };
  }).sort((a,b)=> b.total - a.total);
}

/**
 * Execucao: plano contra realizado, mes a mes e acumulado.
 * `ateMes` limita a conta aos meses ja decorridos -- sem isso, a aderencia de
 * um plano no comeco da safra pareceria catastrofica.
 */
function execucao(R, ateMes){
  const lim = ateMes == null ? NM - 1 : Math.max(0, Math.min(NM - 1, ateMes));
  const linhas = R.L.filter(r => r.total > 0).map(r=>{
    const real = realDe(r.a.cod);
    // A aderencia compara o que foi medido com o plano DAQUELES meses. Somar o
    // plano de meses sem lancamento fazia um plano em andamento parecer um
    // desastre: um mes reportado contra tres planejados dava 33%.
    let plan = 0, feito = 0, lancados = 0, semLanc = 0;
    const meses = MESES.map((m, i)=>{
      const p = num(r.meses[i]);
      const v = real[i];
      const temReal = v !== "" && v != null;
      if(i <= lim){
        if(temReal){ plan += p; feito += num(v); lancados++; }
        else if(p > 0) semLanc++;   // mes planejado que ainda nao foi reportado
      }
      return {mes: m, i, plano: p, real: temReal ? num(v) : null,
              desvio: temReal ? num(v) - p : null};
    });
    return {
      cod: r.a.cod, nome: r.a.nome, etapa: r.a.etapa, un: r.a.un.split("/")[0],
      gerencia: gerenciaDe(r.a),
      totalPlano: r.total, planoAte: plan, realizado: feito, lancados, semLanc,
      aderencia: plan > 0 && lancados > 0 ? feito/plan : null,
      saldo: r.total - feito,
      meses,
    };
  });

  const comLanc = linhas.filter(l => l.lancados > 0);
  const planTot = comLanc.reduce((s,l)=>s+l.planoAte, 0);
  const realTot = comLanc.reduce((s,l)=>s+l.realizado, 0);
  return {linhas, ateMes: lim, mesLabel: MESES[lim],
          comLancamento: comLanc.length, total: linhas.length,
          semLancamento: linhas.reduce((s,l)=>s+l.semLanc, 0),
          aderenciaGeral: planTot > 0 ? realTot/planTot : null,
          planoAte: planTot, realizado: realTot};
}

/** Metas de frota, para a gerencia de manutencao. */
function metasDeFrota(R){
  const porMaq = {};
  R.L.forEach(r => r.partes.forEach(p=>{
    if(p.terc || p.horas <= 0) return;
    const k = p.maq;
    const o = porMaq[k] = porMaq[k] || {maq: k, horas: 0, frota: 0, ativs: new Set(), crm: 0};
    o.horas += p.horas; o.frota += p.frotaR; o.crm += p.cManut;
    o.ativs.add(r.a.cod);
  }));
  return Object.values(porMaq)
    .map(o=>({...o, ativs: o.ativs.size,
              crmHora: o.horas > 0 ? o.crm/o.horas : 0}))
    .sort((a,b)=> b.horas - a.horas);
}

const GERENCIAS = {
  agricola:  "Gerência Agrícola",
  logistica: "Gerência de Logística",
};

export { GERENCIAS, execucao, gerenciaDe, metasDeFrota, metasPorAtividade, realDe };
