import { custoPorOperacao } from '../calculo/custo-operacao.js';
import { benVal } from '../calculo/mao-de-obra.js';
import { PREMISSAS_BASE, premissaBase } from '../calculo/base-fisica.js';
import { ETAPAS_ORD, arrRat } from '../calculo/arrendamento.js';
import { CFG } from '../dados/cfg.js';
import { SEP_MOD, crmDe, crmEspDe } from '../calculo/crm.js';
import { composicao, etapaTrat, familiaEfetiva, tratCodigos, tratEtapas } from '../calculo/insumos.js';
import { TRAT_ETAPAS } from '../dados/insumos.js';
import { DIM, INSUMO, P, insLista } from '../nucleo/estado.js';
import { codExibir } from '../nucleo/codigo-atividade.js';
import { MESES, NM, diasNoMesEntre, mesesEntre } from '../nucleo/calendario.js';
import { $, brl, esc, fmt, num } from '../nucleo/formato.js';
import { th } from './componentes.js';
import { contasValores, totaisContas } from '../calculo/contas.js';
import { conferenciaInsumos } from '../calculo/demandas.js';
import { estado } from '../io/persistencia.js';
import { areasDePermissao } from '../nucleo/sessao.js';

/* ---------- VALIDAÇÃO ---------- */
/* Cada verificação diz onde se corrige: a aba e, em ordem, os pontos da tela
   a destacar — do mais exato (o campo, a linha da atividade) ao mais geral (a
   tabela). O primeiro que existir na tela ganha; se nenhum existir, abre só a
   aba. A navegação mora em ui/navegacao.js (abrirDestino). */
const ir = (aba, ...alvos) => ({aba, alvos: alvos.filter(Boolean)});
// linha de uma atividade no Plano Operacional
const planoCod = cod => cod ? [`#t_plano [data-dt="${cod}"][data-f="ini"]`, `#t_plano [data-c="${cod}"]`, `#t_plano [data-t="${cod}"]`] : [];
const codDe = txt => String(txt||"").split(" ")[0];

function validar(R){
  const v=[]; const add=(ok,t,d,destino)=>v.push({ok,t,d,ir:destino||null});
  /* Atividade zerada no Plano Operacional e escolha, nao erro: num plano de
     entressafra a colheita fica zerada, e o que nao roda no ano simplesmente
     nao entra no calculo. Fica como informacao, sem virar pendencia. */
  const semVol=R.L.filter(r=>r.total===0).length;
  add(true,"Atividades sem volume no plano",
      semVol ? semVol+" de "+R.L.length+" zeradas — ficam fora do cálculo (normal para o que não roda no período, como a colheita na entressafra)" : "",
      ir("plano", ...planoCod((R.L.find(r=>r.total===0)||{a:{}}).a.cod), "#t_plano"));
  // Janela de datas do Plano Operacional. Data que o cálculo não consegue usar
  // não dá erro: a atividade volta, em silêncio, para os meses com volume
  // (calculo/atividade.js, janelaDe). É aqui que o descarte aparece.
  const jIgnorada = [], jPassa = [], volFora = [];
  const horizonte = MESES[0]+" a "+MESES[NM-1];
  R.L.forEach(r=>{
    const cod = r.a.cod, d = DIM[cod] || {};
    const de = new Date(d.ini+"T00:00:00"), ate = new Date(d.fim+"T00:00:00"), idx = mesesEntre(d.ini, d.fim);
    if(!d.ini !== !d.fim) jIgnorada.push(cod+" (só "+(d.ini?"o início":"o fim")+")");
    else if(d.ini && (isNaN(de) || isNaN(ate))) jIgnorada.push(cod+" (data inválida)");
    else if(d.ini && ate < de) jIgnorada.push(cod+" (fim antes do início)");
    else if(d.ini && !idx.length) jIgnorada.push(cod+" (fora de "+horizonte+")");
    else if(d.ini){
      // parte da janela fora do horizonte: os dias contam na capacidade (frota
      // dimensionada para a janela inteira), mas nenhum volume cai neles
      const dentro = idx.reduce((s,i)=>s+diasNoMesEntre(i, d.ini, d.fim), 0);
      if(Math.round((ate - de)/86400000) + 1 > dentro) jPassa.push(cod);
    }
    if(r.janela && r.janela.fonte==="datas"){
      const fora = r.meses.map((q,i)=>num(q)>0 && !r.janela.idx.includes(i) ? MESES[i] : "").filter(Boolean);
      if(fora.length) volFora.push(cod+" ("+fora.join(", ")+")");
    }
  });
  // texto de exibicao das listas acima: so troca o codigo interno (primeiro
  // "token" de cada string, o que codDe() le de volta) pelo de exibicao — o
  // ir()/codDe() abaixo continuam lendo o array ORIGINAL, com o codigo interno
  const paraTexto = arr => arr.map(s => s.replace(codDe(s), codExibir(codDe(s))));
  add(jIgnorada.length===0,"Janela de datas utilizável no Plano Operacional",
      jIgnorada.length ? "ignorada, vale o mês com volume: "+paraTexto(jIgnorada).slice(0,4).join(" · ")+(jIgnorada.length>4?"…":"") : "",
      ir("plano", ...planoCod(codDe(jIgnorada[0])), "#t_plano"));
  add(jPassa.length===0,"Janela de datas dentro do ano agrícola ("+horizonte+")",
      jPassa.length ? "dias fora do ano contam na capacidade e não recebem volume: "+paraTexto(jPassa).slice(0,6).join(", ")+(jPassa.length>6?"…":"") : "",
      ir("plano", ...planoCod(jPassa[0]), "#t_plano"));
  add(volFora.length===0,"Volume programado dentro da janela de datas",
      paraTexto(volFora).slice(0,3).join(" · ")+(volFora.length>3?"…":""),
      ir("plano", volFora.length ? `#t_plano [data-c="${codDe(volFora[0])}"]` : null, "#t_plano"));
  const ratSoma = ETAPAS_ORD.reduce((s,e)=>s+arrRat(e),0);
  add(Math.abs(ratSoma-100)<=0.01,"Rateio do arrendamento por etapa somando 100%",
      Math.abs(ratSoma-100)<=0.01 ? "" : "soma "+fmt(ratSoma,1)+"% — valores normalizados no cálculo",
      ir("arrend", "#t_arr_rat"));
  const arrSemMes = R.AR.linhas.filter(l=>l.anual>0 && l.periodo<=0);
  add(arrSemMes.length===0,"Contrato de arrendamento sem pagamento na janela do orçamento",
      arrSemMes.map(l=>l.faz).join(", "),
      ir("arrend", arrSemMes.length ? `#t_arr [data-arr="${R.AR.linhas.indexOf(arrSemMes[0])}"][data-f="pag"]` : null, "#t_arr"));
  const arrSemValor = R.AR.linhas.filter(l=>l.area>0 && l.rsHa<=0);
  add(arrSemValor.length===0,"Fazenda arrendada com área e sem valor de pagamento", arrSemValor.map(l=>l.faz).join(", "),
      ir("arrend", arrSemValor.length ? `#t_arr [data-arr="${R.AR.linhas.indexOf(arrSemValor[0])}"][data-f="qtd"]` : null, "#t_arr"));
  // FAT e apoio operacional: linha sem pessoa ou sem mes entra com custo zero, calada
  const nomeF = c => (R.MP.custoFuncao[c]||{nome:c||"sem função"}).nome;
  const fatVazia = ((R.FT||{}).linhas||[]).find(l=>!(l.qtd>0) || !l.nMeses);
  add(!fatVazia, "FAT: linha sem pessoas ou sem mês marcado", fatVazia ? nomeF(fatVazia.fcod) : "",
      ir("mdo", fatVazia ? (fatVazia.qtd>0 ? `#t_fat [data-fatm="${fatVazia.ix}"][data-m="0"]` : `#t_fat [data-fat="${fatVazia.ix}"][data-f="qtd"]`) : null, "#t_fat"));
  const fatSemBen = ((R.FT||{}).linhas||[]).find(l=>l.qtd>0 && l.nMeses && !(l.ben>0));
  add(!fatSemBen, "FAT: função sem benefício por pessoa/mês", fatSemBen ? nomeF(fatSemBen.fcod)+" — o FAT entra no efetivo, mas com custo zero" : "",
      ir("mdo", fatSemBen ? `#t_fat [data-fat="${fatSemBen.ix}"][data-f="ben"]` : null, "#t_fat"));
  const moaVazia = ((R.MOA||{}).linhas||[]).find(l=>!(l.qtd>0) || !l.nMeses);
  add(!moaVazia, "Apoio operacional: linha sem pessoas ou sem mês marcado", moaVazia ? nomeF(moaVazia.fcod)+(moaVazia.frente?" · "+moaVazia.frente:"") : "",
      ir("dimens", moaVazia ? (moaVazia.qtd>0 ? `#t_moa [data-moam="${moaVazia.ix}"][data-m="0"]` : `#t_moa [data-moa="${moaVazia.ix}"][data-f="qtd"]`) : null, "#t_moa"));
  if(R.PS) add(Math.abs(R.PS.custo-R.mdoTotal)<=1,"Resumo de pessoas confere com o custo de mão de obra",
      Math.abs(R.PS.custo-R.mdoTotal)<=1 ? "" : "diferença de "+brl(R.PS.custo-R.mdoTotal), ir("pessoas", "#t_pes_dept"));
  // so atividade com volume: a zerada nao roda, e o transporte sem tonelada
  // nao tem rendimento calculado -- nao e rendimento faltando
  const semRend = R.L.find(r=>r.total>0 && r.rend<=0);
  add(!semRend,"Rendimento operacional zerado", semRend ? codExibir(semRend.a.cod)+" · "+semRend.a.nome : "",
      ir("dimens", semRend ? `#t_dim [data-r="${semRend.a.cod}"]` : null, "#t_dim"));
  const utilRuim = R.L.find(r=>r.util<=0||r.util>1);
  add(!utilRuim,"Taxa de utilização fora de 0–100%", utilRuim ? codExibir(utilRuim.a.cod)+" · "+utilRuim.a.nome : "",
      ir("dimens", utilRuim ? `#t_dim [data-u="${utilRuim.a.cod}"]` : null, "#t_dim"));
  const semTrat = R.L.filter(r=>r.ehHa&&r.total>0&&!r.trat);
  add(semTrat.length===0,"Atividade em ha sem tratamento vinculado",
      semTrat.length ? semTrat.length+": "+semTrat.slice(0,5).map(r=>codExibir(r.a.cod)).join(", ")+(semTrat.length>5?"…":"") : "0",
      ir("plano", semTrat.length ? `#t_plano [data-t="${semTrat[0].a.cod}"]` : null, "#t_plano"));
  const tratTon = R.L.find(r=>!r.ehHa&&r.trat);
  add(!tratTon,"Tratamento vinculado a atividade em tonelada", tratTon ? codExibir(tratTon.a.cod) : "",
      ir("plano", tratTon ? `#t_plano [data-t="${tratTon.a.cod}"]` : null, "#t_plano"));
  add(P.dens>0&&P.tch>0,"Densidade de muda e TCH preenchidos",fmt(R.viveiro)+" ha de viveiro",
      ir("premissas", !(P.dens>0) ? "#p_dens" : "#p_tch"));
  add(P.diesel>0,"Preço do diesel preenchido",brl(P.diesel,2), ir("premissas","#p_diesel"));
  add(P.hdia>0&&P.hdia<=24,"Horas efetivas/dia plausíveis",fmt(P.hdia,1)+"h", ir("premissas","#p_hdia"));
  add(P.disp>0&&P.disp<=100,"Disponibilidade mecânica em 0–100%",fmt(P.disp)+"%", ir("premissas","#p_disp"));
  add(P.dias>0&&P.dias<=31,"Dias efetivos/mês plausíveis",fmt(P.dias), ir("premissas","#p_dias"));
  // velocidade zerada tira o tempo de viagem do ciclo (o motor conta o trecho como 0
  // em vez de dividir por zero) e subdimensiona transporte e transbordo sem aviso
  add(P.velC>0&&P.velV>0,"Velocidades do transporte preenchidas",
      "carregado "+fmt(P.velC)+" km/h · vazio "+fmt(P.velV)+" km/h", ir("transp", !(P.velC>0) ? "#p_velC" : "#p_velV"));
  add(P.diasTrab>0&&P.diasTrab<=7,"Dias trabalhados por colaborador em 1–7",fmt(P.diasTrab), ir("mdo","#p_diasTrab"));
  add(R.MP.fatorEscala>=1,"Fator de rodízio coerente com a escala",R.MP.fatorEscala.toFixed(2), ir("mdo","#p_diasOper","#p_diasTrab"));
  const semSal = CFG.funcoes.find(f=>!(f.sal>0));
  add(!semSal,"Todas as funções com salário preenchido", semSal ? semSal.cod+" · "+semSal.nome : "",
      ir("mdo", semSal ? `#t_fun [data-fs="${semSal.cod}"]` : null, "#t_fun"));
  // A base traz 81 especialidades; o cadastro de CRM só cobria os arquétipos do
  // planejamento. O que ficou sem taxa entra no custo como zero — precisa aparecer.
  const espSemTaxa = (CFG.frota_base||[]).filter(e=>
    e.prop+e.terc>0 && crmEspDe(e.esp).total===0 &&
    !e.mods.some(m=>crmDe(e.esp+SEP_MOD+m.m).total>0) &&
    !Object.keys(CFG.crm).some(k=>CFG.crm[k].esp===e.esp));
  add(espSemTaxa.length===0,"Especialidades da frota com custo de manutenção preenchido",
      espSemTaxa.length ? espSemTaxa.length+" de "+(CFG.frota_base||[]).length+" sem taxa: "+
        espSemTaxa.slice(0,4).map(e=>e.esp).join(", ")+(espSemTaxa.length>4?"…":"")
      : "todas as "+(CFG.frota_base||[]).length+" preenchidas",
      ir("frota", espSemTaxa.length ? `#t_crm [data-crmesp="${espSemTaxa[0].esp}"]` : null, "#t_crm"));
  add(P.rendBomba>0&&P.rendBomba<=100,"Rendimento do conjunto motobomba em 0–100%",fmt(P.rendBomba)+"%", ir("irrig","#p_rendBomba"));
  add(R.IR.linhas.every(l=>l.Ea>0&&l.Ea<=1),"Eficiência de aplicação de irrigação em 0–100%","", ir("irrig","#t_irrig"));
  add(R.IR.linhas.filter(l=>l.potCV>0&&l.nConj<1).length===0,"Conjunto motobomba dimensionado","", ir("irrig","#t_irrig"));
  add(P.capTransb>0,"Capacidade por viagem calculada (volume × densidade)",fmt(P.capTransb,1)+" t/viagem",
      ir("transp","#p_volTransb","#p_densCarga"));
  // lê o cadastro EDITADO (insLista), não o original do CFG: insumo incluído pelo
  // usuário sem preço passava nesta checagem, e renomeado era procurado pelo nome velho
  const insSemPreco = insLista().filter(i=>{const o=INSUMO[i.prod]||{};return !((o.preco!=null?num(o.preco):num(i.preco))>0);});
  // o que pesa é o insumo sem preço que algum tratamento usa: esse entra no custo
  // como zero. O resto do cadastro sem preço é aviso, não pendência
  const emTrat = new Set();
  tratCodigos().forEach(c=>composicao(c).forEach(l=>emTrat.add(l.prod)));
  const semPrecoUsado = insSemPreco.filter(i=>emTrat.has(i.prod));
  add(semPrecoUsado.length===0,"Insumo usado em tratamento e sem preço",
      semPrecoUsado.slice(0,4).map(i=>i.prod).join(", ")+(semPrecoUsado.length>4?"…":""),
      ir("insbase", semPrecoUsado.length ? `#t_ins [data-ip="${esc(semPrecoUsado[0].prod)}"]` : null, "#t_ins"));
  const semPrecoFora = insSemPreco.length - semPrecoUsado.length;
  add(true,"Insumos do cadastro ainda sem preço",
      semPrecoFora ? semPrecoFora+" produto(s) sem uso em tratamento — preencher ao começar a usar" : "nenhum");
  /* Produto usado no plano sem classe agronômica: sem fam/classe reconhecida,
     o insumo cai no grupo "Outros e a Classificar" -- esse sim precisa de
     alguém escolher o Grupo no cadastro. Não é o mesmo teste que
     categoriaInsumo() (calculo/modelo-pecege.js): aquela função reduz para as
     poucas colunas do modelo PECEGE, e Adjuvante não tem coluna própria ali
     (cai em "outros" por desenho do modelo) mesmo já corretamente
     classificado aqui. Usar categoriaInsumo() nesta checagem sinalizava
     Air combat, Speed forth e Protac (todos com Grupo "Adjuvantes e
     Veículos") para sempre, mesmo depois de escolhido o Grupo -- não tinha
     como resolver a pendência (mesma raiz do aviso da Plano de Contas
     corrigido em 9cfd277, que criou a conta INS-06 para adjuvante/regulador;
     este aqui é o equivalente para a aba Validação). */
  const noPlano = new Set();
  R.L.filter(r=>r.total>0).forEach(r=>{
    const trats = Array.isArray(r.tratsDetalhe) && r.tratsDetalhe.length ? r.tratsDetalhe.map(t=>t.trat) : [r.trat];
    trats.filter(Boolean).forEach(c=>composicao(c).forEach(l=>noPlano.add(l.prod))); });
  const semClasse = [...noPlano].filter(prod=>{
    if(/\bmuda/i.test(prod)) return false; // ex.: "Substrato mudas" — custo de muda, não agroquímico
    const i = insLista().find(x=>x.prod===prod) || {prod};
    if(/torta/i.test([i.prod, i.classe, i.pa, i.categ, i.obs].join(" "))) return false;
    return familiaEfetiva(i)==="outros";
  });
  add(semClasse.length===0,"Insumo usado no plano sem classe agronômica",
      semClasse.length ? semClasse.length+": "+semClasse.slice(0,5).join(", ")+(semClasse.length>5?"…":"")+
        " — escolha o Grupo no cadastro de insumos" : "",
      ir("insbase", `#t_ins tr.stage[data-fam="outros"]`, "#t_ins"));
  // etapa marcada no tratamento x etapa em que o plano o usa
  const etapaFora = [];
  tratCodigos().forEach(c=>{
    const marcadas = tratEtapas(c);
    if(!marcadas.length) return;
    R.L.forEach(r=>{ if(r.trat===c && r.total>0 && !marcadas.includes(etapaTrat(r.a)))
      etapaFora.push(codExibir(r.a.cod)+" usa "+c+" em "+TRAT_ETAPAS[etapaTrat(r.a)].nome); });
  });
  add(etapaFora.length===0,"Tratamento aplicado na etapa em que foi marcado",
      etapaFora.slice(0,3).join(" · ")+(etapaFora.length>3?"…":""), ir("insumos","#t_trat"));
  const tratSemEtapa = tratCodigos().filter(c=>!tratEtapas(c).length && composicao(c).length);
  add(true,"Tratamentos sem etapa marcada",
      tratSemEtapa.length ? tratSemEtapa.length+" de "+tratCodigos().length : "nenhum");
  add(R.total>0,"Plano gera custo calculável",brl(R.total), ir("plano","#t_plano"));
  // base física dos custos unitários (Premissas): em branco, o custo por ha cai
  // na soma das atividades, que conta cada passada como um hectare a mais
  // so as bases das operacoes que tem volume no plano: sem colheita (plano de
  // entressafra), area e volume de colheita em branco nao sao falta de nada
  const temVol = f => R.L.some(r=>r.total>0 && f(r.a));
  const usada = {
    plantio:    temVol(a=>a.etapa==="PREPARO DE SOLO" || a.etapa==="PLANTIO"),
    planta:     temVol(a=>a.etapa==="TRATOS CULTURAIS" && a.cultura==="Planta"),
    soca:       temVol(a=>a.etapa==="TRATOS CULTURAIS" && a.cultura!=="Planta"),
    colheitaHa: temVol(a=>a.etapa==="COLHEITA"),
    colheita:   temVol(a=>a.etapa==="COLHEITA"),
  };
  const basesFalta = Object.entries(PREMISSAS_BASE).filter(([id])=>usada[id]!==false && !premissaBase(id));
  const basesVazias = basesFalta.map(([,b])=>b.nome.toLowerCase());
  add(basesVazias.length===0,"Base física dos custos informada em Premissas",
      basesVazias.length ? "em branco: "+basesVazias.join(", ") : "",
      ir("premissas", ...basesFalta.map(([,b])=>"#p_"+b.campo)));
  // volume de colheita da premissa x toneladas lançadas nas atividades de colheita
  const tonPrem = premissaBase("colheita"), tonPlano = (R.etapas["COLHEITA"]||{}).ton||0;
  const difTon = tonPrem && tonPlano>0 ? Math.abs(tonPrem-tonPlano)/tonPlano : 0;
  add(difTon<=0.10,"Volume estimado de colheita perto do lançado no plano (±10%)",
      tonPrem && tonPlano>0 ? fmt(tonPrem)+" t na premissa · "+fmt(tonPlano)+" t no plano ("+
        (tonPrem>tonPlano?"+":"−")+fmt(difTon*100,1)+"%)" : "", ir("premissas","#p_tonColheita"));
  const somaMeses=R.meses.reduce((s,x)=>s+x,0);
  add(Math.abs(somaMeses-R.total)<1,"Soma dos meses confere com o total",brl(somaMeses), ir("custos","#t_mensal"));
  const somaEt=Object.values(R.etapas).reduce((s,e)=>s+e.total,0);
  // sem atividade lançada não há etapa para receber os custos gerais: o que corrige é o plano
  add(Math.abs(somaEt-R.total)<1,"Soma das etapas confere com o total",brl(somaEt),
      R.diretoSum>0.5 ? ir("custos","#t_unit") : ir("plano","#t_plano"));
  // mesma conferência para o Plano de Contas: custo lançado duas vezes em contas
  // diferentes, ou custo que não chega a conta nenhuma, aparece aqui
  /* Auditoria do cálculo: cada total tem de fechar com as suas partes. Rodam
     a cada recálculo, então qualquer mudança que desalinhe o motor aparece
     aqui. Com o plano vazio não há etapa para receber os custos gerais, e as
     que dependem disso só rodam quando há custo direto. */
  const somaA = a => (a||[]).reduce((t,x)=>t+(+x||0),0);
  const temDireto = R.diretoSum>0.5;
  add(Math.abs(Object.values(R.mesesCat).reduce((t,a)=>t+somaA(a),0)-R.total)<1,
      "Auditoria: grandes contas somam o custo total", brl(Object.values(R.mesesCat).reduce((t,a)=>t+somaA(a),0)), ir("custos","#t_mensal"));
  add(Math.abs(R.PER.safra.total+R.PER.entressafra.total-R.total)<1,
      "Auditoria: safra + entressafra somam o custo total", brl(R.PER.safra.total+R.PER.entressafra.total), ir("custos","#t_per_cat"));
  const dieselMes = somaA(R.CB.custoOperMes)+somaA(R.CB.custoApoioMes);
  add(Math.abs(dieselMes-R.dieselT)<1, "Auditoria: diesel mês a mês soma o diesel do ano", brl(dieselMes), ir("combust","#t_comb_mes"));
  const crmAloc = R.L.reduce((t,r)=>t+r.cManut,0)+R.AE.manut+R.crmExtra;
  add(Math.abs(crmAloc-R.crmTotal)<1, "Auditoria: CRM alocado às atividades + excedente = CRM da frota", brl(crmAloc), ir("frota","#t_crm_etapa"));
  if(R.PS) add(Math.abs(R.PS.custo-R.mdoTotal)<1, "Auditoria: custo do Resumo de Pessoas = mão de obra do plano", brl(R.PS.custo), ir("pessoas","#t_pes_dept"));
  if(temDireto){
    const opTot = custoPorOperacao(R).totalContabil;
    add(Math.abs(opTot-R.total)<1, "Auditoria: custo contábil das operações soma o custo total", brl(opTot), ir("custos","#t_contabil"));
  }
  /* Insumos pelos dois lados: volume x preço (+ frete) de cada produto contra a
     soma das atividades. Se não fecham, algum tratamento -- extra, junto da
     plantadora -- está num lado e não no outro (ver aba Demandas). */
  const CI = conferenciaInsumos(R);
  add(CI.confere, "Auditoria: insumos por produto = insumos por atividade",
      CI.confere ? brl(CI.insumoT) : "diferença de "+brl(CI.dif)+" — veja a conferência na aba Demandas", ir("demandas","#t_dem_conf"));
  add(!CI.inativos.length, "Nenhum tratamento inativo vinculado ao plano",
      CI.inativos.length ? CI.inativos.length+" vínculo(s): "+CI.inativos.slice(0,3).map(x=>codExibir(x.cod)+" ("+x.trat+")").join(", ")+" — o custo entra, mas o tratamento some das buscas" : "",
      ir("demandas","#dem_conf_nota"));
  const TC_ = totaisContas(contasValores(R));
  add(Math.abs(TC_.total-R.total)<1,"Plano de Contas confere com o total",
      brl(TC_.total)+(R.total>0?" — "+fmt(TC_.total/R.total*100,1)+"% do custo total":""), ir("contas","#t_contas"));
  add(TC_.semConta<0.5,"Todo custo tem conta no plano de contas",
      TC_.semConta>0.5 ? brl(TC_.semConta)+" sem conta — veja o fim da aba Plano de Contas" : "",
      ir("contas", "#contas_semconta", "#t_contas"));
  /* Transporte de pessoal nas duas pontas: como benefício dentro do custo de
     toda função e como rotas na aba Transporte de Pessoal. Se forem os mesmos
     ônibus, o custo está contado duas vezes; se o benefício é vale-transporte
     de quem não usa a rota, está certo. Decisão da usina — aqui só se avisa. */
  const iTp = CFG.beneficios.findIndex(b=>/transporte/i.test(b.nome));
  const benTp = iTp>=0 ? num(benVal(iTp)) : 0;
  add(!(benTp>0 && R.tpessT>0),"Transporte de pessoal contado uma vez só",
      benTp>0 && R.tpessT>0 ? "benefício de "+brl(benTp)+"/pessoa/mês na aba Mão de Obra e "+brl(R.tpessT)+
        " de rotas na aba Transporte de Pessoal — zere um dos dois se forem o mesmo transporte" : "",
      ir("mdo", iTp>=0 ? `#t_ben [data-ben="${iTp}"]` : null, "#t_ben"));
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
  const frotaAlta = R.L.filter(r=>r.frotaR>12);
  add(frotaAlta.length===0,"Atividade exigindo mais de 12 equipamentos",
      frotaAlta.length ? frotaAlta.length+": "+frotaAlta.slice(0,5).map(r=>codExibir(r.a.cod)+" ("+r.frotaR+")").join(", ")+(frotaAlta.length>5?"…":"") : "0",
      // o alvo e o botao "mes" da atividade: e la que a frota se ajusta desde que
      // o campo de frota fixa saiu do modal (data-fr nao existe mais)
      ir("dimens", frotaAlta.length ? `#t_dim [data-rendmes="${frotaAlta[0].a.cod}"]` : null, "#t_dim"));
  add(R.TP.lugares>=R.efetivoTotal,"Transporte de pessoal cobre o efetivo total",
      fmt(R.TP.lugares)+" lugares para "+fmt(R.efetivoTotal)+" colaboradores", ir("tpess","#t_tp"));
  const mixRuim = R.L.filter(r=>r.mixSoma>0 && Math.abs(r.mixSoma-100)>0.01);
  add(mixRuim.length===0,"Mix de modos de aplicação somando 100%",
      mixRuim.length? mixRuim.map(r=>codExibir(r.a.cod)+" ("+fmt(r.mixSoma,0)+"%)").join(", ") : "",
      ir("plano", mixRuim.length ? `#t_plano [data-mx="${mixRuim[0].a.cod}"]` : null, ...planoCod(mixRuim.length?mixRuim[0].a.cod:""), "#t_plano"));
  // matéria-prima: contrato sem valor, estimativa muito distante do contratado, ATR ausente
  const F = R.FORN || {linhas:[], areaPlano:0, fracArr:0,
    origens:{propria:{ton:0}, arrendada:{ton:0}, fornecedor:{ton:0}, parceria:{ton:0}}};
  const semPreco = F.linhas.filter(l=>l.ton>0 && l.cana<=0);
  const iForn = l => F.linhas.indexOf(l);
  add(semPreco.length===0,"Fornecedor com entrega e sem preço de contrato", semPreco.map(l=>l.forn).join(", "),
      ir("forn", semPreco.length ? `#t_forn [data-fnr="${iForn(semPreco[0])}"][data-f="cana"]` : null,
         semPreco.length ? `#t_forn [data-fnr="${iForn(semPreco[0])}"]` : null, "#t_forn"));
  const semAtr = F.linhas.filter(l=>l.ton>0 && l.atr<=0);
  add(semAtr.length===0,"Fornecedor sem ATR informado", semAtr.map(l=>l.forn).join(", "),
      ir("forn", semAtr.length ? `#t_forn [data-fnr="${iForn(semAtr[0])}"][data-f="atr"]` : null, "#t_forn"));
  const foraContr = F.linhas.filter(l=>l.tonContr>0 && Math.abs(l.aderContr-1)>0.1);
  add(foraContr.length===0,"Estimativa dentro de 10% do contratado",
      foraContr.map(l=>l.forn+" ("+fmt(l.aderContr*100,0)+"%)").join(", "),
      ir("forn", foraContr.length ? `#t_forn [data-fnr="${iForn(foraContr[0])}"][data-f="tonContr"]` : null, "#t_forn"));
  add(!(F.origens.arrendada.ton>0 && !(F.areaPlano>0 && F.fracArr<1)) || F.origens.propria.ton>0,
      "Área própria informada para separar a cana própria da arrendada",
      F.origens.propria.ton>0 ? "" : "sem área própria, o plano inteiro conta como cana arrendada",
      ir("forn","#fnp_areaPropria"));
  return v;
}
/* Pendências primeiro, e cada uma é um botão que leva ao ponto da tela onde
   se corrige. VAL_IR guarda o destino de cada botão, pelo índice. */
let VAL_IR = [];
function nomeAba(id){
  const b = document.querySelector(`nav button[data-s="${id}"]`);
  return b ? b.childNodes[0].textContent.trim() : id;
}
function pintarValida(R){
  const v=validar(R), bad=v.filter(x=>!x.ok).length;
  $("#vbadge").innerHTML = bad?`<span class="badge b-bad">${bad}</span>`:`<span class="badge b-ok">OK</span>`;
  const ordem = v.filter(x=>!x.ok).concat(v.filter(x=>x.ok));
  VAL_IR = ordem.map(x=>x.ir);
  $("#t_val").innerHTML = th([["Status"],["Verificação"],["Detalhe"]])+"<tbody>"+
    ordem.map((x,k)=>`<tr${x.ok?"":' class="val-pend"'}><td><span class="badge ${x.ok?"b-ok":"b-bad"}">${x.ok?"OK":"!"}</span></td>
      <td>${!x.ok && x.ir
        ? `<button type="button" class="val-ir" data-valir="${k}" title="Ir para ${esc(nomeAba(x.ir.aba))} e corrigir">
             <span>${x.t}</span><span class="val-dest">${esc(nomeAba(x.ir.aba))} →</span></button>`
        : x.t}</td><td class="calc">${x.d||""}</td></tr>`).join("")+"</tbody>";
}
const destinoValida = k => VAL_IR[+k] || null;


export { destinoValida, pintarValida, validar };
