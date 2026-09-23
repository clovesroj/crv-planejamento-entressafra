/* ================== QUADRO ADM E OFICINA ==================
   O pessoal que não sai de atividade nenhuma do plano -- o administrativo
   agrícola e a oficina -- vem do quadro previsto da controladoria
   (dados/quadro-fixo.js), departamento a departamento, cargo a cargo, mês a
   mês. Motoristas, operadores e rurais continuam saindo das atividades.

   Substitui a "estrutura agrícola indireta" (quatro linhas genéricas, doze
   meses iguais) e a equipe de manutenção estimada pelas horas de frota.

   Custo de um mês = folha prevista × (1 + contribuições sobre a folha) +
   pessoas × benefícios.
     - A folha da planilha são os proventos do mês: o 13º e as férias já caem
       no mês em que são pagos (dezembro dobra). Por isso aqui entram só as
       contribuições -- INSS patronal, RAT, Terceiros e FGTS, que incidem sobre
       tudo o que é pago --, e não as provisões de 13º, férias e rescisão que o
       custo mensal das funções de atividade carrega: seria contar o 13º duas
       vezes.
     - Benefícios: o pacote por colaborador da aba Mão de Obra, por pessoa
       prevista no mês.
   Meses sem previsto na planilha (abr/26 a out/26) repetem o mês de
   referência, fev/27 -- quantidade e folha --, e ficam marcados como
   estimados. */
import { CFG } from '../dados/cfg.js';
import { QUADRO_FIXO, QUADRO_FONTE, QUADRO_MES0, QUADRO_MES_REF } from '../dados/quadro-fixo.js';
import { NM } from '../nucleo/calendario.js';
import { num } from '../nucleo/formato.js';
import { encPct } from './mao-de-obra.js';

// encargo que incide sobre a folha paga (não é provisão): INSS, RAT, Terceiros, FGTS
const ehContribuicao = nome => /INSS|RAT|SAT|Terceiros|FGTS/i.test(nome) && !/provis|13|f[ée]rias/i.test(nome);

function contribuicoes(){
  return CFG.encargos.map((e,i)=>({nome:e.nome, pct:encPct(i), contrib:ehContribuicao(e.nome)}))
    .filter(e=>e.contrib);
}

// valor de uma série da planilha no mês i do ano do app (null fora dela)
const naPlanilha = (arr, i) => { const j = i - QUADRO_MES0; return j>=0 && j<(arr||[]).length ? arr[j] : null; };

function quadroFixoCalc(MP){
  const contrib = contribuicoes();
  const pctContrib = contrib.reduce((s,e)=>s+e.pct, 0);
  const ben = MP.benTot;
  const linhas = QUADRO_FIXO.map((l, ix)=>{
    const qtdMes = [], folhaMes = [], custoMes = [], estimado = [], realQ = [], realV = [];
    for(let i=0;i<NM;i++){
      let q = naPlanilha(l.pq, i), v = naPlanilha(l.pv, i);
      const est = q == null && v == null && (i < QUADRO_MES0 || i >= QUADRO_MES0 + (l.pq||[]).length);
      if(est){ q = naPlanilha(l.pq, QUADRO_MES_REF); v = naPlanilha(l.pv, QUADRO_MES_REF); }
      q = num(q); v = num(v);
      qtdMes.push(q); folhaMes.push(v); estimado.push(est);
      custoMes.push(v*(1+pctContrib) + q*ben);
      realQ.push(naPlanilha(l.rq, i)); realV.push(naPlanilha(l.rv, i));
    }
    return {ix, grupo:l.g, dcod:l.dc, depto:l.d, fcod:l.fc, fnome:l.f,
            qtdMes, folhaMes, custoMes, estimado, realQ, realV,
            folha: folhaMes.reduce((s,x)=>s+x,0), custo: custoMes.reduce((s,x)=>s+x,0),
            pico: Math.max(0, ...qtdMes)};
  });
  const soma = (lista, k) => Array.from({length:NM}, (_,i)=>lista.reduce((s,l)=>s+l[k][i],0));
  const grupo = g => {
    const ls = linhas.filter(l=>l.grupo===g);
    const mes = soma(ls, "custoMes"), qtdMes = soma(ls, "qtdMes"), folhaMes = soma(ls, "folhaMes");
    return {nome:(QUADRO_FONTE[g]||{}).nome || g, conta:(QUADRO_FONTE[g]||{}).conta, linhas:ls, mes, qtdMes, folhaMes,
            total: mes.reduce((s,x)=>s+x,0), folha: folhaMes.reduce((s,x)=>s+x,0), pico: Math.max(0, ...qtdMes)};
  };
  const adm = grupo("adm"), oficina = grupo("oficina");
  const mes = adm.mes.map((v,i)=>v + oficina.mes[i]);
  const qtdMes = adm.qtdMes.map((v,i)=>v + oficina.qtdMes[i]);
  return {linhas, adm, oficina, mes, qtdMes, total: adm.total + oficina.total, pico: Math.max(0, ...qtdMes),
          pctContrib, contrib, ben, mesRef: QUADRO_MES_REF, mes0: QUADRO_MES0,
          estimadoMes: Array.from({length:NM}, (_,i)=>linhas.some(l=>l.estimado[i]))};
}

export { ehContribuicao, quadroFixoCalc };
