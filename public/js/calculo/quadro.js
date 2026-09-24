import { FUNCIONARIOS_BASE } from '../dados/funcionarios-base.js';
import { NM } from '../nucleo/calendario.js';
import { QUADRO } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';

/* ================== QUADRO ATIVO ==================
   Consolida a base de pessoal do ERP por função do dimensionamento.
   Cada cargo do ERP virou função do plano, então todo ativo cai numa função.
   Afastados e desistentes contam no quadro da empresa, mas não entram como
   disponíveis para a operação — por isso ficam à parte, e o total do ERP
   continua conferindo. */

function quadroBase(){
  const porFuncao = {};
  let semFuncao = 0, afastados = 0, total = 0;
  FUNCIONARIOS_BASE.forEach(l=>{
    total += l.qtd;
    if(l.afast){ afastados += l.qtd; return; }
    if(!l.fcod){ semFuncao += l.qtd; return; }
    porFuncao[l.fcod] = (porFuncao[l.fcod]||0) + l.qtd;
  });
  const mapeado = Object.values(porFuncao).reduce((s,v)=>s+v,0);
  return {porFuncao, semFuncao, afastados, mapeado, total, linhas:FUNCIONARIOS_BASE};
}

/* Quadro ativo de uma funcao: o ajuste digitado na tela manda; em branco,
   vale o que veio do ERP. Mora aqui, e nao numa tela, porque duas telas
   precisam da mesma resposta -- o quadro por funcao no Resumo de Pessoas e o
   bloco de pessoas do detalhe da atividade, no Dimensionamento. */
function ajusteQuadro(f){
  const v = (QUADRO[f] || {}).ativo;
  return v != null && v !== "" ? num(v) : null;
}
function ativoDe(f, base){
  const v = ajusteQuadro(f);
  return v != null ? v : ((base.porFuncao || {})[f] || 0);
}

/* ---------- NECESSIDADE x QUADRO ATIVO, POR FUNCAO ----------
   Tres leitores precisam do mesmo numero: a primeira pagina do Resumo de
   Pessoas, o Resumo geral e o rastro. Por isso a conta mora aqui, e a tela so
   pinta.

   Disponivel = ativo - ferias - demissoes. O que a funcao ocupa num mes e a
   necessidade da operacao mais quem esta no FAT naquele mes (e do quadro, mas
   nao opera); a contratar compara o disponivel com o mes que mais ocupa -- o
   pico da funcao, e nao o pico do plano: funcoes diferentes tem pico em meses
   diferentes. Excedente de uma funcao nao cobre falta de outra, entao os totais
   somam funcao por funcao.

   `grupo` e o quadro onde a funcao mais pede gente (pessoas-mes), para o
   Resumo geral abrir o confronto por quadro sem contar ninguem duas vezes. */
function confrontoQuadro(PS){
  const zeros = () => Array(NM).fill(0);
  const BASE = quadroBase();
  const qv = (f,k) => num((QUADRO[f]||{})[k]);
  const FATF = (PS.fat && PS.fat.porFun) || {};
  const funcoes = [...new Set([...Object.keys(PS.porFun), ...Object.keys(FATF)])].sort();
  // quadro principal de cada funcao: o que mais pede gente; o FAT so quando e o unico
  const pm = {};
  PS.itens.forEach(it=>{ const o = pm[it.fcod] = pm[it.fcod] || {};
    const k = it.fora ? "~"+it.grupo : it.grupo;
    o[k] = (o[k]||0) + it.qtdMes.reduce((s,x)=>s+x,0); });
  const grupoDe = f => { const o = pm[f] || {};
    const ks = Object.keys(o).filter(k=>k[0]!=="~"), usa = ks.length ? ks : Object.keys(o);
    const k = usa.sort((a,b)=>o[b]-o[a])[0];
    return k ? k.replace(/^~/,"") : ""; };

  const tot = {nec:0, pico:0, ativo:0, ferias:0, demis:0, fat:0, disp:0, contratar:0, exced:0};
  const linhas = funcoes.map(f=>{
    const o = PS.porFun[f] || {qtd:0, pico:0, qtdMes:zeros()};
    const fatMes = (FATF[f] && FATF[f].qtdMes) || zeros(), fatPico = Math.max(0, ...fatMes);
    const base = BASE.porFuncao[f]||0, ajuste = ajusteQuadro(f);
    const ativo = ativoDe(f, BASE), ferias = qv(f,"ferias"), demis = qv(f,"demis");
    const disp = ativo - ferias - demis;
    const ocupa = Math.max(0, ...o.qtdMes.map((v,i)=>v + fatMes[i]));
    const contratar = Math.max(0, ocupa - disp), exced = Math.max(0, disp - ocupa);
    tot.nec+=o.qtd; tot.pico+=o.pico; tot.ativo+=ativo; tot.ferias+=ferias; tot.demis+=demis; tot.fat+=fatPico;
    tot.disp+=disp; tot.contratar+=contratar; tot.exced+=exced;
    return {fcod:f, nec:o.qtd, pico:o.pico, iPico:o.qtdMes.indexOf(o.pico), qtdMes:o.qtdMes, fatMes, fatPico,
            base, ajuste, ativo, ferias, demis, disp, ocupa, contratar, exced, grupo:grupoDe(f)};
  });
  /* Mes a mes: no FAT naquele mes a pessoa e do quadro, mas nao esta
     disponivel. Sem quadro informado nenhum, nao ha o que confrontar. */
  const temQuadro = tot.ativo + tot.ferias + tot.demis > 0;
  const faltaMes = zeros(), dispMes = zeros();
  linhas.forEach(l=>{
    l.dispMes = l.qtdMes.map((v,i)=>l.disp - l.fatMes[i]);
    l.faltaMes = l.qtdMes.map((v,i)=>temQuadro ? Math.max(0, v - l.dispMes[i]) : 0);
    l.faltaMes.forEach((v,i)=>{ faltaMes[i] += v; dispMes[i] += l.dispMes[i]; });
  });
  // ativo do ERP em funcao que o plano nao pede: fica fora do confronto
  const foraDoPlano = Object.keys(BASE.porFuncao).filter(f=>!funcoes.includes(f))
    .map(f=>({fcod:f, ativo:ativoDe(f, BASE)})).filter(x=>x.ativo>0);
  return {linhas, tot, temQuadro, faltaMes, dispMes, foraDoPlano,
          foraDoPlanoQtd: foraDoPlano.reduce((s,x)=>s+x.ativo,0), afastados: BASE.afastados, totalERP: BASE.total};
}

/* O confronto de uma função num recorte de meses (o período da barra do
   topo): o pico que decide a contratação passa a ser o do recorte -- na
   entressafra, o que falta ou sobra de dezembro a março. Com o ano inteiro é
   o mesmo número da primeira página. */
function linhaNoPeriodo(l, meses){
  if(!meses || !meses.length || meses.length===NM) return l;
  const ocupa = Math.max(0, ...meses.map(i=>l.qtdMes[i] + l.fatMes[i]));
  return {...l, ocupa, contratar: Math.max(0, ocupa - l.disp), exced: Math.max(0, l.disp - ocupa)};
}
/* Soma um recorte das linhas do confronto (um quadro, ou todas), no período. */
function somarConfronto(linhas, meses){
  const z = () => Array(NM).fill(0);
  const t = {n:0, nFalta:0, nSobra:0, ativo:0, ferias:0, demis:0, disp:0, ocupa:0, contratar:0, exced:0, fatPico:0, dispMes:z(), faltaMes:z()};
  linhas.map(l=>linhaNoPeriodo(l, meses)).forEach(l=>{ t.n++; if(l.contratar>0) t.nFalta++; if(l.exced>0) t.nSobra++;
    ["ativo","ferias","demis","disp","ocupa","contratar","exced","fatPico"].forEach(k=>{ t[k]+=l[k]; });
    l.dispMes.forEach((v,i)=>{ t.dispMes[i]+=v; t.faltaMes[i]+=l.faltaMes[i]; }); });
  return t;
}

export { ajusteQuadro, ativoDe, confrontoQuadro, linhaNoPeriodo, quadroBase, somarConfronto };
