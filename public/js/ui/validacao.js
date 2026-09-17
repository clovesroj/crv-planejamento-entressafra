import { ETAPAS_ORD, arrRat } from '../calculo/arrendamento.js';
import { CFG } from '../dados/cfg.js';
import { SEP_MOD, crmDe, crmEspDe } from '../calculo/crm.js';
import { INSUMO, P, insLista } from '../nucleo/estado.js';
import { $, brl, fmt, num } from '../nucleo/formato.js';
import { th } from './componentes.js';
import { contasValores } from './contas.js';
import { estado } from '../io/persistencia.js';
import { areasDePermissao } from '../nucleo/sessao.js';

/* ---------- VALIDAÇÃO ---------- */
function validar(R){
  const v=[]; const add=(ok,t,d)=>v.push({ok,t,d});
  const semVol=R.L.filter(r=>r.total===0).length;
  add(semVol===0,"Atividades sem volume programado",semVol+" de "+R.L.length);
  const ratSoma = ETAPAS_ORD.reduce((s,e)=>s+arrRat(e),0);
  add(Math.abs(ratSoma-100)<=0.01,"Rateio do arrendamento por etapa somando 100%",
      Math.abs(ratSoma-100)<=0.01 ? "" : "soma "+fmt(ratSoma,1)+"% — valores normalizados no cálculo");
  const arrSemValor = R.AR.linhas.filter(l=>l.area>0 && l.rsHa<=0);
  add(arrSemValor.length===0,"Fazenda arrendada com área e sem valor de pagamento", arrSemValor.map(l=>l.faz).join(", "));
  if(R.PS) add(Math.abs(R.PS.custo-R.mdoTotal)<=1,"Resumo de pessoas confere com o custo de mão de obra",
      Math.abs(R.PS.custo-R.mdoTotal)<=1 ? "" : "diferença de "+brl(R.PS.custo-R.mdoTotal));
  add(R.L.filter(r=>r.rend<=0).length===0,"Rendimento operacional zerado","");
  add(R.L.filter(r=>r.util<=0||r.util>1).length===0,"Taxa de utilização fora de 0–100%","");
  add(R.L.filter(r=>r.ehHa&&r.total>0&&!r.trat).length===0,"Atividade em ha sem tratamento vinculado",
      R.L.filter(r=>r.ehHa&&r.total>0&&!r.trat).length+"");
  add(R.L.filter(r=>!r.ehHa&&r.trat).length===0,"Tratamento vinculado a atividade em tonelada","");
  add(P.dens>0&&P.tch>0,"Densidade de muda e TCH preenchidos",fmt(R.viveiro)+" ha de viveiro");
  add(P.diesel>0,"Preço do diesel preenchido",brl(P.diesel,2));
  add(P.hdia>0&&P.hdia<=24,"Horas efetivas/dia plausíveis",fmt(P.hdia,1)+"h");
  add(P.disp>0&&P.disp<=100,"Disponibilidade mecânica em 0–100%",fmt(P.disp)+"%");
  add(P.dias>0&&P.dias<=31,"Dias efetivos/mês plausíveis",fmt(P.dias));
  // velocidade zerada tira o tempo de viagem do ciclo (o motor conta o trecho como 0
  // em vez de dividir por zero) e subdimensiona transporte e transbordo sem aviso
  add(P.velC>0&&P.velV>0,"Velocidades do transporte preenchidas",
      "carregado "+fmt(P.velC)+" km/h · vazio "+fmt(P.velV)+" km/h");
  add(P.diasTrab>0&&P.diasTrab<=7,"Dias trabalhados por colaborador em 1–7",fmt(P.diasTrab));
  add(R.MP.fatorEscala>=1,"Fator de rodízio coerente com a escala",R.MP.fatorEscala.toFixed(2));
  add(CFG.funcoes.every(f=>f.sal>0),"Todas as funções com salário preenchido","");
  // A base traz 81 especialidades; o cadastro de CRM só cobria os arquétipos do
  // planejamento. O que ficou sem taxa entra no custo como zero — precisa aparecer.
  const espSemTaxa = (CFG.frota_base||[]).filter(e=>
    e.prop+e.terc>0 && crmEspDe(e.esp).total===0 &&
    !e.mods.some(m=>crmDe(e.esp+SEP_MOD+m.m).total>0) &&
    !Object.keys(CFG.crm).some(k=>CFG.crm[k].esp===e.esp));
  add(espSemTaxa.length===0,"Especialidades da frota com custo de manutenção preenchido",
      espSemTaxa.length ? espSemTaxa.length+" de "+(CFG.frota_base||[]).length+" sem taxa: "+
        espSemTaxa.slice(0,4).map(e=>e.esp).join(", ")+(espSemTaxa.length>4?"…":"")
      : "todas as "+(CFG.frota_base||[]).length+" preenchidas");
  add(P.rendBomba>0&&P.rendBomba<=100,"Rendimento do conjunto motobomba em 0–100%",fmt(P.rendBomba)+"%");
  add(R.IR.linhas.every(l=>l.Ea>0&&l.Ea<=1),"Eficiência de aplicação de irrigação em 0–100%","");
  add(R.IR.linhas.filter(l=>l.potCV>0&&l.nConj<1).length===0,"Conjunto motobomba dimensionado","");
  add(P.capTransb>0,"Capacidade por viagem calculada (volume × densidade)",fmt(P.capTransb,1)+" t/viagem");
  // lê o cadastro EDITADO (insLista), não o original do CFG: insumo incluído pelo
  // usuário sem preço passava nesta checagem, e renomeado era procurado pelo nome velho
  const insSemPreco = insLista().filter(i=>{const o=INSUMO[i.prod]||{};return !((o.preco!=null?num(o.preco):num(i.preco))>0);});
  add(insSemPreco.length===0,"Todos os insumos com preço",
      insSemPreco.slice(0,4).map(i=>i.prod).join(", ")+(insSemPreco.length>4?"…":""));
  add(R.total>0,"Plano gera custo calculável",brl(R.total));
  const somaMeses=R.meses.reduce((s,x)=>s+x,0);
  add(Math.abs(somaMeses-R.total)<1,"Soma dos meses confere com o total",brl(somaMeses));
  const somaEt=Object.values(R.etapas).reduce((s,e)=>s+e.total,0);
  add(Math.abs(somaEt-R.total)<1,"Soma das etapas confere com o total",brl(somaEt));
  // mesma conferência para o Plano de Contas: custo lançado duas vezes em contas
  // diferentes, ou custo que não chega a conta nenhuma, aparece aqui
  const somaContas=Object.values(contasValores(R)).reduce((s,x)=>s+(num(x)||0),0);
  add(Math.abs(somaContas-R.total)<1,"Plano de Contas confere com o total",
      brl(somaContas)+(R.total>0?" — "+fmt(somaContas/R.total*100,1)+"% do custo total":""));
  // Perfis: todo dado que o app grava precisa ter uma aba dona no catálogo do
  // servidor (server/permissoes.js). Sem isso, quem não é administrador edita,
  // o servidor descarta em silêncio, e a alteração "não pega". Confere as chaves
  // salvas e cada campo de premissa contra a aba em que ele aparece na tela.
  const catalogo = areasDePermissao();
  if(catalogo.length){
    const chavesCat = new Set(catalogo.flatMap(a=>a.chaves));
    const semDono = Object.keys(estado()).filter(k=>k!=="v" && k!=="P" && !chavesCat.has(k));
    const campoForaDaAba = [...document.querySelectorAll("section[id] [id^=\"p_\"]")].filter(el=>{
      const aba = catalogo.find(a=>a.id===el.closest("section").id);
      return !aba || !aba.campos.includes(el.id.slice(2));
    }).map(el=>"P."+el.id.slice(2));
    const faltando = semDono.concat(campoForaDaAba);
    add(faltando.length===0,"Todo dado editável tem aba de permissão",
        faltando.length ? "sem aba no catálogo: "+faltando.join(", ") : "");
  }
  add(R.L.filter(r=>r.frotaR>12).length===0,"Atividade exigindo mais de 12 equipamentos",
      R.L.filter(r=>r.frotaR>12).length+"");
  add(R.TP.lugares>=R.efetivoTotal,"Transporte de pessoal cobre o efetivo total",
      fmt(R.TP.lugares)+" lugares para "+fmt(R.efetivoTotal)+" colaboradores");
  const mixRuim = R.L.filter(r=>r.mixSoma>0 && Math.abs(r.mixSoma-100)>0.01);
  add(mixRuim.length===0,"Mix de modos de aplicação somando 100%",
      mixRuim.length? mixRuim.map(r=>r.a.cod+" ("+fmt(r.mixSoma,0)+"%)").join(", ") : "");
  // matéria-prima: contrato sem valor, estimativa muito distante do contratado, ATR ausente
  const F = R.FORN || {linhas:[], areaPlano:0, fracArr:0,
    origens:{propria:{ton:0}, arrendada:{ton:0}, fornecedor:{ton:0}, parceria:{ton:0}}};
  const semPreco = F.linhas.filter(l=>l.ton>0 && l.cana<=0);
  add(semPreco.length===0,"Fornecedor com entrega e sem preço de contrato", semPreco.map(l=>l.forn).join(", "));
  const semAtr = F.linhas.filter(l=>l.ton>0 && l.atr<=0);
  add(semAtr.length===0,"Fornecedor sem ATR informado", semAtr.map(l=>l.forn).join(", "));
  const foraContr = F.linhas.filter(l=>l.tonContr>0 && Math.abs(l.aderContr-1)>0.1);
  add(foraContr.length===0,"Estimativa dentro de 10% do contratado",
      foraContr.map(l=>l.forn+" ("+fmt(l.aderContr*100,0)+"%)").join(", "));
  add(!(F.origens.arrendada.ton>0 && !(F.areaPlano>0 && F.fracArr<1)) || F.origens.propria.ton>0,
      "Área própria informada para separar a cana própria da arrendada",
      F.origens.propria.ton>0 ? "" : "sem área própria, o plano inteiro conta como cana arrendada");
  return v;
}
function pintarValida(R){
  const v=validar(R), bad=v.filter(x=>!x.ok).length;
  $("#vbadge").innerHTML = bad?`<span class="badge b-bad">${bad}</span>`:`<span class="badge b-ok">OK</span>`;
  $("#t_val").innerHTML = th([["Status"],["Verificação"],["Detalhe"]])+"<tbody>"+
    v.map(x=>`<tr><td><span class="badge ${x.ok?"b-ok":"b-bad"}">${x.ok?"OK":"!"}</span></td>
      <td>${x.t}</td><td class="calc">${x.d||""}</td></tr>`).join("")+"</tbody>";
}


export { pintarValida, validar };
