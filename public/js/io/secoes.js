import { frotaDaAtividade, pessoasDaAtividade } from '../calculo/atividade.js';
import { agDeLinha, contaOrigem, rotuloItem } from '../calculo/crm.js';
import { ADM_CRITERIOS, ADM_GRUPOS } from '../dados/administrativo.js';
import { ARR_FORMAS, ETAPAS_ORD, arrRat } from '../calculo/arrendamento.js';
import { FORN_MODALIDADES } from '../dados/fornecedores.js';
import { GRUPOS_ORD, deptIdx, janelaDaLinha, necessidadePorAtividade, visaoPlanilha } from '../calculo/pessoas.js';
import { comparativoQuadro } from '../calculo/quadro-comparativo.js';
import { QUADRO_FONTE } from '../dados/quadro-fixo.js';
import { GERENCIAS, criterioPorMes, excecoes, execucao, metasDeFrota, metasPorAtividade, porGerencia } from '../calculo/acompanhamento.js';
import { CFG } from '../dados/cfg.js';
import { CAT_LBL, MESES, NM, PERIODOS, periodoMes } from '../nucleo/calendario.js';
import { composicao, etapasNoPlano, tratEtapas, tratListaTodos } from '../calculo/insumos.js';
import { TRAT_ETAPAS } from '../dados/insumos.js';
import { INSUMO, P, TRAT_NOME, insLista } from '../nucleo/estado.js';
import { brl, fmt, num, pct } from '../nucleo/formato.js';
import { CONTA_COMBINADA, SEM_CONTA, contasValores, totaisContas } from '../calculo/contas.js';
import { comps } from '../ui/custos.js';
import { validar } from '../ui/validacao.js';
import { custoPorOperacao } from '../calculo/custo-operacao.js';
import { baseEtapa, custoUnit, rotuloBase } from '../calculo/base-fisica.js';
import { codExibir } from '../nucleo/codigo-atividade.js';

/* ================== SEÇÕES DE RELATÓRIO ==================
   Cada seção é uma função de R -> {aba, titulo, cab, linhas}. O relatório
   escolhe quais seções quer; Excel, PDF e CSV consomem o mesmo material.
   Uma seção sem dado devolve linhas vazias e a geração escreve "sem dados". */

const sec = (aba, titulo, cab, linhas) => ({aba, titulo, cab, linhas});

/* ---------- recorte por período ----------
   O relatório sai para o ano todo, só a safra ou só a entressafra. O recorte
   usa o critério do próprio motor (calculo/index.js), sem conta nova:
     - série mensal (custo do mês, naturezas, etapas, diesel, pessoas,
       arrendamento) soma só os meses do período;
     - custo de atividade cai nos meses pela quantidade lançada, e o diesel pelo
       litro e preço de cada mês — é como o motor espalha o custo;
     - administrativo e depreciação são iguais todo mês; arrendamento segue os
       meses de pagamento; irrigação segue a área operada.
   Cadastro, contrato e dimensionamento não têm série mensal: saem do ano, e o
   título da seção diz "ano todo" para ninguém ler um número do ano como sendo
   do período. A seção que foi recortada devolve per:true. */
const REL_PERIODOS = {
  ambos:       "Safra e entressafra (ano todo)",
  safra:       PERIODOS.safra,
  entressafra: PERIODOS.entressafra,
};
function recorte(p){
  const per = REL_PERIODOS[p] ? p : "ambos";
  const meses = MESES.map((m,i)=>i).filter(i=> per==="ambos" || periodoMes(i)===per);
  return {per, parcial: per!=="ambos", meses, nome: REL_PERIODOS[per], fracMeses: meses.length/NM};
}
let REC = recorte("ambos");
// seção recortada no período
const secP = (aba, titulo, cab, linhas) => ({...sec(aba, titulo, cab, linhas), per:true});
// soma de uma série de 12 meses só nos meses do período
const noPer = arr => REC.meses.reduce((s,i)=>s+(+((arr||[])[i])||0), 0);
const soma  = arr => (arr||[]).reduce((s,v)=>s+(+v||0), 0);
const totP  = R => REC.parcial ? noPer(R.meses) : R.total;
const catP  = (R,k) => REC.parcial ? noPer(R.mesesCat[k]) : soma(R.mesesCat[k]);
// fração do ano de uma série: arrendamento pelos pagamentos, irrigação pela área
const fracDe = arr => { const t = soma(arr); return t>0 ? noPer(arr)/t : REC.fracMeses; };

/* Atividade no período: volume dos meses do período; diesel e litros mês a
   mês; o resto do custo direto, pela fração do volume — o critério do motor.
   Frota, efetivo e rendimento são do dimensionamento e ficam como estão. */
function ativP(r){
  if(!REC.parcial) return r;
  const tot = r.total||0;
  const vol = noPer((r.meses||[]).map(num));
  const f = tot>0 ? vol/tot : 0;
  const cDiesel = noPer(r.dieselMes);
  // MDO: a equipe paga nos meses do período (mês cheio em cada mês com volume)
  const cMDO = noPer(r.mdoMes);
  return {...r, total:vol, horas:r.horas*f, litros:noPer(r.litrosMes), cDiesel,
    cMDO, cManut:r.cManut*f, cInsumo:r.cInsumo*f, cTerc:r.cTerc*f,
    direto:(r.direto-r.cDiesel-r.cMDO)*f + cDiesel + cMDO};
}

/* Etapa no período. O total vem pronto do motor (etapaMes). O direto é o das
   atividades no período, mais a parte da etapa no diesel do apoio e, em tratos,
   a irrigação; o arrendamento segue os meses de pagamento; o administrativo é
   igual todo mês. O indireto é o que sobra — como no motor, onde ele é o resto
   de cada mês repartido pela participação no custo direto. */
function etapaP(R, e){
  const d = R.etapas[e] || {};
  if(!REC.parcial) return d;
  const at = R.L.filter(r=>r.a.etapa===e).map(ativP);
  const s = k => at.reduce((t,r)=>t+(r[k]||0), 0);
  const dieselAtivAno = R.L.filter(r=>r.a.etapa===e).reduce((t,r)=>t+r.cDiesel, 0);
  const apoioDiesel = ((d.diesel||0) - dieselAtivAno) * fracDe(R.CB.custoApoioMes);
  const irrig = (d.irrig||0) * fracDe(R.haMes);
  const diesel = s("cDiesel") + apoioDiesel;
  const direto = s("direto") + apoioDiesel + irrig;
  const arrend = (d.arrend||0) * fracDe(R.AR.mes);
  const admin  = (d.admin||0) * REC.fracMeses;
  const total  = noPer((R.etapaMes||{})[e]);
  const ha  = at.filter(r=>r.ehHa).reduce((t,r)=>t+r.total, 0);
  const ton = at.filter(r=>!r.ehHa && r.a.tipo!=="transp").reduce((t,r)=>t+r.total, 0);
  return {...d, diesel, mdo:s("cMDO"), manut:s("cManut"), insumo:s("cInsumo"), irrig, terc:s("cTerc"),
    direto, arrend, admin, indireto: total-direto-arrend-admin, total, ha, ton, horas:s("horas"),
    litros:s("litros")};
}
const etapasP = R => Object.fromEntries(Object.keys(R.etapas).map(e=>[e, etapaP(R,e)]));
/* Horas de máquina do período. O total do ano (R.horasT) soma as atividades e
   os equipamentos de apoio — caminhão bombeiro, motoniveladora — que trabalham
   as mesmas horas todo mês. Sem o apoio, safra + entressafra não fechava. */
const horasP = R => REC.parcial
  ? R.L.map(ativP).reduce((t,r)=>t+r.horas,0) + (R.AE.horas||0)*REC.fracMeses
  : R.horasT;
const totEtapas = R => Object.values(R.etapas).reduce((s,e)=>s+e.total,0)||1;
const ativosDe = (R, etapa) => R.L.filter(r=>r.a.etapa===etapa && r.total>0);
/* Frota e efetivo da folha impressa sao os mesmos das telas: o do mes que mais
   pede, que e o que tem de existir. A media da janela -- a que rateia o custo
   -- fica no relatorio de Dimensionamento, que e o tecnico, com as duas
   colunas lado a lado. Folha e tela discordando sobre a mesma atividade e o
   tipo de coisa que para uma reuniao. */
const linhaAtiv = r => [codExibir(r.a.cod), r.a.nome, r.a.un.split("/")[0], fmt(r.total), fmt(r.horas),
  frotaDaAtividade(r).pico||0, fmt(pessoasDaAtividade(r).pico), brl(r.cDiesel), brl(r.cMDO), brl(r.cManut), brl(r.cInsumo),
  brl(r.cTerc), brl(r.direto), r.total>0?brl(r.direto/r.total,2):"—"];
const CAB_ATIV = ["Cod","Atividade","Un","Volume","Horas","Frota","Efetivo","Diesel","Mão de obra",
  "Manutenção","Insumos","Terceiros","Custo direto","R$/un"];

/* ---------- 1. resumo executivo ---------- */
const resumo = R => {
  const tot = totP(R);
  // fixo = administrativo + depreciação (iguais todo mês) + arrendamento (pelos pagamentos)
  const fixo = catP(R,"fixo") + catP(R,"arrend");
  const at = R.L.map(ativP).filter(r=>r.total>0);
  const litros = noPer(R.CB.litrosOperMes) + noPer(R.CB.litrosApoioMes);
  const diesel = noPer(R.CB.custoOperMes) + noPer(R.CB.custoApoioMes);
  const ano = REC.parcial ? " (ano)" : "";
  return secP("Resumo Executivo","Resumo Executivo",["Indicador","Valor"],[
    ["Safra","2026/2027"], ["Unidade","Capinópolis-MG"],
    ["Período do relatório", REC.nome],
    ["Meses no período", REC.meses.length+" ("+MESES[REC.meses[0]]+" a "+MESES[REC.meses[REC.meses.length-1]]+")"],
    ["Custo total projetado", brl(tot)],
    ["Custo variável", brl(tot-fixo)], ["Custo fixo", brl(fixo)],
    ["Custo por hectare plantado (formação do canavial)", brl(custoHaForm(R))],
    ["Custo do plano por hectare de plantio", brl(tot/(P.plantio||1))],
    ["Área de plantio", fmt(P.plantio)+" ha"],
    ["Hectares operados", fmt(REC.parcial ? noPer(R.haMes) : R.haOp)+" ha"],
    ["Moagem própria + terceiros"+ano, fmt(R.FORN.tonTotal)+" t"],
    ["Custo médio da tonelada"+ano, R.FORN.tonTotal>0?brl(R.FORN.rsTMedio,2)+"/t":"—"],
    ["Horas de máquina", fmt(horasP(R))+" h"],
    ["Frota operacional (dimensionada no ano)", fmt(R.frotaT)+" equipamentos"],
    ["Diesel", fmt(litros)+" L · "+brl(diesel)],
    ["Efetivo total (dimensionado no ano)", fmt(R.efetivoTotal)+" pessoas"],
    ["Custo na safra (abr a nov)", brl(R.PER.safra.total)],
    ["Custo na entressafra (dez a mar)", brl(R.PER.entressafra.total)],
    ["Atividades programadas", at.length+" de "+R.L.length],
    ["Pendências de validação", validar(R).filter(v=>!v.ok).length],
  ]);
};

/* ---------- 2. premissas ---------- */
const premissas = R => sec("Premissas","Premissas do plano",["Premissa","Valor","Onde entra"],[
  ["Densidade de muda", fmt(P.dens,1)+" t/ha","Necessidade de muda e viveiro"],
  ["TCH da cana-muda", fmt(P.tch)+" t/ha","Área de viveiro"],
  ["Área de plantio", fmt(P.plantio)+" ha","Custo por hectare plantado"],
  ["Horas efetivas por dia", fmt(P.hdia,1)+" h","Capacidade e frota de toda atividade"],
  ["Disponibilidade mecânica", fmt(P.disp,0)+"%","Capacidade e frota"],
  ["Dias efetivos por mês", fmt(P.dias),"Capacidade, frota e custo-hora"],
  ["Dias de operação por semana", fmt(P.diasOper),"Fator de escala do efetivo"],
  ["Dias trabalhados por colaborador", fmt(P.diasTrab),"Fator de escala do efetivo"],
  ["Horas por turno", fmt(P.hTurno)+" h","Escala"],
  ["Preço base do diesel", brl(P.diesel,2)+"/L","Custo de combustível"],
  ["Administração", brl(R.ADM.mensal)+"/mês","Conta EST-01, aba Custos Administrativos"],
  ["Imobilizado da frota", brl(P.imob),"Depreciação"],
  ["Depreciação anual", fmt(P.dep,0)+"%","Custo fixo"],
  ["Atualização de preço de insumos", fmt(P.ipreco,0)+"%","Custo de insumos"],
  ["Densidade de carga", fmt(P.densCarga,2)+" t/m³","Capacidade de transbordo"],
  ["Volume útil do transbordo", fmt(P.volTransb)+" m³","Capacidade por viagem"],
  ["Raio médio — safra", fmt(P.raioSafra)+" km","Ciclo do transporte"],
  ["Raio médio — muda", fmt(P.raioMuda)+" km","Ciclo do transporte"],
  ["Encargos sobre a folha", fmt((R.MP.encTot||0)*100,1)+"%","Custo de mão de obra"],
  ["Benefícios por colaborador", brl(R.MP.benTot,2)+"/mês","Custo de mão de obra"],
  ["Valor padrão de terceirização", brl(CFG.terc_tar_pad,2)+"/ha","Frentes terceirizadas"],
]);

/* ---------- 3. área ---------- */
const area = R => sec("Área","Área do plano e da matéria-prima",["Item","Hectares","Observação"],[
  ["Área de plantio (premissa)", fmt(P.plantio), "Base do custo por hectare"],
  ["Área própria informada", fmt(R.FORN.areaPlano - R.AR.area), "Aba Fornecedores de Cana"],
  ["Área arrendada", fmt(R.AR.area), R.AR.linhas.length+" fazenda(s) cadastrada(s)"],
  ["Área de fornecedores", fmt(R.FORN.origens.fornecedor.area), "Contratos de fornecimento"],
  ["Área de parceria", fmt(R.FORN.origens.parceria.area), "Contratos de parceria"],
  ["Hectares operados no plano", fmt(R.haOp), "Soma das atividades em hectare"],
  ["Área de viveiro", fmt(R.viveiro), "Muda necessária ÷ TCH da muda"],
].concat(ETAPAS_ORD.filter(e=>R.etapas[e]&&R.etapas[e].ha>0)
  .map(e=>["↳ hectares operados em "+e, fmt(R.etapas[e].ha), "Etapa do plano"])));

/* ---------- 4. produção ---------- */
const producao = R => sec("Produção","Produção e moagem",
  ["Origem","Área (ha)","Toneladas","% da moagem","ATR médio (kg/t)","Custo","R$/t","R$/kg ATR"],
  Object.values(R.FORN.origens).map(o=>[o.nome, fmt(o.area), fmt(o.ton),
    R.FORN.tonTotal>0?fmt(o.ton/R.FORN.tonTotal*100,1)+"%":"—", fmt(o.atrMedio,1), brl(o.custo),
    o.ton>0?brl(o.rsT,2):"—", o.atrTotal>0?brl(o.rsAtr,4):"—"])
  .concat([["TOTAL / MÉDIA PONDERADA", fmt(Object.values(R.FORN.origens).reduce((s,o)=>s+o.area,0)),
    fmt(R.FORN.tonTotal), "100,0%", fmt(R.FORN.atrMedio,1), brl(R.FORN.custoTotal),
    R.FORN.tonTotal>0?brl(R.FORN.rsTMedio,2):"—", R.FORN.atrTotal>0?brl(R.FORN.rsAtrMedio,4):"—"]])
  .concat(R.FORN.custoSemTon>0 ? [["Origem sem tonelada lançada — fora da média","","","","",
    brl(R.FORN.custoSemTon),"",""]] : []));

/* ---------- 5, 6, 7. etapas ---------- */
const porEtapa = (aba, titulo, etapa) => R => {
  const d = etapaP(R, etapa);
  const ativs = R.L.filter(r=>r.a.etapa===etapa).map(ativP).filter(r=>r.total>0);
  const b = baseEtapa(R, etapa);
  return secP(aba, titulo, CAB_ATIV,
    ativs.map(linhaAtiv).concat([
      ["","","TOTAL DIRETO","","","","", brl(d.diesel||0), brl(d.mdo||0), brl(d.manut||0),
       brl((d.insumo||0)+(d.irrig||0)), brl(d.terc||0), brl(d.direto||0), ""],
      ["","","Arrendamento rateado","","","","","","","","","", brl(d.arrend||0), ""],
      ["","","Administrativo rateado","","","","","","","","","", brl(d.admin||0), ""],
      ["","","Indireto do plano","","","","","","","","","", brl(d.indireto||0), ""],
      ["","","TOTAL DA ETAPA","","","","","","","","","", brl(d.total||0), custoUnit(d.total||0, b)],
      ["","","Base física","","","","","","","","","", rotuloBase(b), ""],
    ]));
};

/* ---------- 8. transporte e logística ---------- */
const transporte = R => sec("Transporte","Transporte, transbordo e logística",
  ["Bloco","Toneladas","Viagens","Ciclo (h)","Capacidade (t/viagem)","Horas","Frota","Diesel","MDO","Custo"],
  R.TR.blocos.filter(b=>b.ton>0).map(b=>[b.nome||"—", fmt(b.ton), fmt(b.viagens), fmt(b.ciclo,2),
    fmt(b.cap||0,1), fmt(b.horas), b.frotaR, brl(b.diesel), brl(b.mdo), brl(b.total)])
  .concat([["TOTAL DO TRANSPORTE DE CANA", fmt(R.TR.blocos.reduce((s,b)=>s+b.ton,0)), "", "", "",
    fmt(R.TR.horas), R.TR.frota, "", "", brl(R.TR.total)]])
  .concat(R.TP.linhas.map(l=>["Pessoal · "+l.rota, "", "", "", fmt(l.cap)+" lugares",
    fmt(l.kmRota)+" km", l.qtd, "", brl(l.cDiaria), brl(l.total)]))
  .concat([["TOTAL DO TRANSPORTE DE PESSOAL","","","","", "", R.TP.linhas.reduce((s,l)=>s+num(l.qtd),0),
    "", "", brl(R.tpessT)]]));

/* ---------- 9. frota ---------- */
const frota = R => sec("Frota","Frota — necessidade do plano e base cadastrada",
  ["Agrupamento","Especialidade","Item","Qtd necessária","Cadastrada","Folga"],
  [...R.crmFrotaL].filter(l=>l.qtd>0).sort((a,b)=>b.qtd-a.qtd)
    .map(l=>{ const cad = contaOrigem(l.baseProp,l.baseTerc);
      return [agDeLinha(l), l.esp||"—", rotuloItem(l.item), fmt(l.qtd), fmt(cad), fmt(cad-l.qtd)];})
    .concat([["","","TOTAL", fmt(R.crmFrotaL.reduce((s,l)=>s+l.qtd,0)), "", ""]]));

const frotaBase = R => { const necEsp = {};
  R.crmFrotaL.forEach(l=>{ if(l.esp && l.qtd>0) necEsp[l.esp]=(necEsp[l.esp]||0)+l.qtd; });
  return sec("Frota cadastrada","Frota cadastrada x necessidade, por especialidade",
    ["Agrupamento","Grupo","Especialidade","Modelos","Próprios","Terceiros","Cadastrada","Exigida","Folga"],
    (CFG.frota_base||[]).slice()
      .sort((x,y)=> x.ag.localeCompare(y.ag) || x.grp.localeCompare(y.grp) || x.esp.localeCompare(y.esp))
      .map(e=>{ const cad=contaOrigem(e.prop,e.terc), n=necEsp[e.esp]||0;
        return [e.ag, e.grp, e.esp, fmt(e.mods.length), fmt(e.prop), fmt(e.terc), fmt(cad),
                n?fmt(n):"—", n?fmt(cad-n):"—"]; }));
};

const modelos = R => sec("Modelos da frota","Modelos cadastrados por especialidade",
  ["Agrupamento","Grupo","Especialidade","Modelo","Marca","Unidades","Próprias","Terceiros"],
  (CFG.frota_base||[]).slice()
    .sort((x,y)=> x.ag.localeCompare(y.ag) || x.grp.localeCompare(y.grp) || x.esp.localeCompare(y.esp))
    .flatMap(e=> e.mods.map(m=>[e.ag, e.grp, e.esp, m.m, m.marca||"—", fmt(m.n), fmt(m.np),
      fmt(m.n-m.np)])));

/* ---------- 10. manutenção ---------- */
const manutencao = R => sec("Manutenção","Manutenção de frota — CRM",
  ["Agrupamento","Especialidade","Item","R$/un","Frota prevista","Uso p/ CRM","CRM total"],
  [...R.crmFrotaL].filter(l=>l.qtd>0||l.hTotPlano>0)
    .sort((x,y)=> agDeLinha(x).localeCompare(agDeLinha(y)) || y.total-x.total)
    .map(l=>[agDeLinha(l), l.esp||"—", rotuloItem(l.item), brl(l.rh,2)+"/"+l.unidade,
             fmt(l.qtd), fmt(l.baseUso)+" "+l.unidade, brl(l.total)])
    .concat([["","","TOTAL DO CRM","","","", brl(R.crmTotal)],
             ["","","Quadro da oficina (previsto)","","", R.EM.efetivo+" pessoas no pico", brl(R.EM.total)],
             ["","","Materiais de manutenção","","","", brl(R.MT.total)]]));

/* ---------- 11. mão de obra ---------- */
// pico mensal dentro do período
const picoP = arr => Math.max(0, ...REC.meses.map(i=>+arr[i]||0));
/* Pessoas no padrão das planilhas da controladoria (Painel das justificativas
   de folha e Resumo de MDO): por função ordenado pelo custo, grupo ->
   departamento -> função (↳), e a evolução mensal com a média. A agregação é a
   da tela (calculo/pessoas.js, visaoPlanilha) -- a folha impressa e a tela dão
   o mesmo número. O detalhe por origem (pessoasAtividade) fica como estava. */
const NOME_GRUPO_REL = {"OPERACIONAL":"Operacional (atividades do plano)", "ADM AGRÍCOLA":"ADM agrícola (quadro previsto)",
  "OFICINA":"Oficina — manutenção (quadro previsto)", "FAT":"FAT (fora da operação)"};
const CURTO_GRUPO_REL = {"OPERACIONAL":"Operacional", "ADM AGRÍCOLA":"ADM agrícola", "OFICINA":"Oficina", "FAT":"FAT"};
const q1 = v => fmt(v, v<10 ? 1 : 0);
const contaDaFuncao = (fcod, grupos) => { const f = CFG.funcoes.find(x=>x.cod===fcod); if(f) return f.conta;
  return grupos.includes("OFICINA") ? QUADRO_FONTE.oficina.conta : grupos.includes("ADM AGRÍCOLA") ? QUADRO_FONTE.adm.conta : "—"; };
const maoDeObra = R => {
  if(!R.PS) return secP("Mão de Obra","Mão de obra — por função", ["Função"], []);
  const V = visaoPlanilha(R.PS, REC.meses), T = V.total;
  const pc = v => T.custo>0 ? fmt(v/T.custo*100,1)+"%" : "—";
  return secP("Mão de Obra","Mão de obra — por função, ordenado pelo maior custo",
    ["#","Cod","Função","Quadro","Conta","Qtde (média)","Pico","Sal. médio","Folha no período","Custo MDO no período","% do custo"],
    V.funcoes.map((f,k)=>[k+1, f.fcod, f.fnome, f.grupos.map(g=>CURTO_GRUPO_REL[g]||g).join(", "), contaDaFuncao(f.fcod, f.grupos),
        q1(f.qtd), q1(f.pico), f.salMed?brl(f.salMed,2):"—", f.folha?brl(f.folha):"—", brl(f.custo), pc(f.custo)])
      .concat([["","","TOTAL","","", fmt(T.qtd,0), fmt(T.pico,0), T.salMed?brl(T.salMed,2):"—", brl(T.folha), brl(T.custo), "100,0%"]]));
};
const pessoasDept = R => {
  if(!R.PS) return secP("Pessoas por depto","Pessoas por departamento e função", ["Departamento / Função"], []);
  const V = visaoPlanilha(R.PS, REC.meses), T = V.total;
  const pc = v => T.custo>0 ? fmt(v/T.custo*100,1)+"%" : "—";
  const lin = (nivel, rot, o) => [nivel, rot, q1(o.qtd), q1(o.pico), o.salMed?brl(o.salMed,2):"—", o.folha?brl(o.folha):"—", brl(o.custo), pc(o.custo)];
  const linhas = [];
  V.grupos.forEach(g=>{
    linhas.push(lin("Quadro", NOME_GRUPO_REL[g.grupo]||g.grupo, g));
    g.depts.forEach(d=>{
      linhas.push(lin("Departamento", "  "+d.dept+(d.dcod?" ("+d.dcod+")":""), d));
      d.funcs.forEach(f=>linhas.push(lin("Função", "      ↳ "+f.fnome+" ["+f.fcod+"]", f)));
    });
  });
  linhas.push(lin("", "TOTAL", T));
  return secP("Pessoas por depto","Pessoas por departamento e função (↳)",
    ["Nível","Quadro / Departamento / Função","Qtde (média)","Pico","Sal. médio","Folha no período","Custo MDO no período","% do custo"], linhas);
};
/* Necessidade de gente por etapa, atividade e funcao, mes a mes.
   O quadro por funcao diz quantos; esta folha diz de onde vem cada um e em que
   mes -- e a folha com que se monta escala e se justifica contratacao. Sai de
   necessidadePorAtividade(), a mesma fonte da tabela da tela: a reuniao nao
   pode ter uma conta impressa e outra na tela. */
const pessoasAtividade = R => secP("Pessoas por atividade",
  "Necessidade de pessoas — etapa, atividade e função, mês a mês",
  ["Etapa","Tipo de gente","Cod","Atividade ou origem","Cod função","Função","Início","Fim",
   ...REC.meses.map(i=>MESES[i]), REC.parcial?"Pico no período":"Pico","Custo MDO no período"],
  R.PS ? necessidadePorAtividade(R.PS).map(l=>{ const j = janelaDaLinha(l);
      return [l.dept, l.categoria, l.cod?codExibir(l.cod):"—", l.origem, l.fcod, l.fnome, j.ini, j.fim,
        ...REC.meses.map(i=>fmt(l.qtdMes[i])), fmt(picoP(l.qtdMes)), brl(noPer(l.custoMes))]; })
    // o FAT nao e necessidade, mas o custo dele e mao de obra: linha propria
    .concat(R.PS.fat && R.PS.fat.qtd ? [["FAT","","—","Contrato suspenso — fora da operação","","","","",
      ...REC.meses.map(i=>fmt(R.PS.fat.qtdMes[i])), fmt(picoP(R.PS.fat.qtdMes)), brl(noPer(R.PS.fat.custoMes))]] : [])
    .concat([["TOTAL","","","","","","","", ...REC.meses.map(i=>fmt(R.PS.qtdMes[i])),
      fmt(picoP(R.PS.qtdMes)), brl(noPer(R.PS.custoMes))]]) : []);
const fluxoMdo = R => {
  if(!R.PS) return secP("Fluxo MDO","Evolução mensal — pessoas e custo de mão de obra", ["Mês"], []);
  const V = visaoPlanilha(R.PS, REC.meses), T = V.total;
  const gs = GRUPOS_ORD.filter(g=>V.grupos.some(x=>x.grupo===g));
  let ac = 0;
  return secP("Fluxo MDO","Evolução mensal — pessoas e custo de mão de obra",
    ["Mês","Período", ...gs.map(g=>"Pessoas — "+(CURTO_GRUPO_REL[g]||g)), "Total de pessoas","Sal. médio",
     ...gs.map(g=>"Custo — "+(CURTO_GRUPO_REL[g]||g)), "Custo MDO","Acumulado"],
    V.evolucao.map(e=>{ ac += e.custo;
      return [MESES[e.i], periodoMes(e.i)==="safra"?"Safra":"Entressafra",
        ...gs.map(g=>fmt((e.porGrupo[g]||{qtd:0}).qtd,0)), fmt(e.qtd,0), e.salMed?brl(e.salMed,2):"—",
        ...gs.map(g=>brl((e.porGrupo[g]||{custo:0}).custo)), brl(e.custo), brl(ac)]; })
    .concat([["Média mensal","", ...gs.map(g=>fmt(V.media.porGrupo[g].qtd,0)), fmt(V.media.qtd,0), V.media.salMed?brl(V.media.salMed,2):"—",
        ...gs.map(g=>brl(V.media.porGrupo[g].custo)), brl(V.media.custo), ""],
      ["TOTAL","", ...gs.map(()=>""), "", "", ...gs.map(g=>brl((V.grupos.find(x=>x.grupo===g)||{custo:0}).custo)), brl(T.custo), ""]]));
};

/* Quadro ADM e oficina, previsto × realizado AA -- o Painel das planilhas de
   justificativa da folha, pela média de dez/26 a mar/27 (os meses lançados) e
   mês a mês. Sai de calculo/quadro-comparativo.js, o mesmo da aba Mão de Obra. */
const CAB_QF_REL = ["Qtde AA","Qtde Prev.","Δ Qtde","Sal. méd. AA","Sal. méd. Prev.","Δ Sal. méd.",
  "Realizado AA","Previsto","Δ R$","Δ %","Ef. Qtde (R$)","Ef. Salário (R$)","Fator principal","Custo no plano"];
const colsQF = o => [fmt(o.qa,1), fmt(o.qp,1), fmt(o.dq,1), o.sa?brl(o.sa,2):"—", o.sp?brl(o.sp,2):"—",
  o.dsal?fmt(o.dsal*100,1)+"%":"—", brl(o.va), brl(o.vp), brl(o.dv), o.va?fmt(o.pct*100,1)+"%":"—",
  brl(o.efQ), brl(o.efS), o.fator||"", brl(o.cp)];
const quadroAdmOficina = R => {
  if(!R.QF) return sec("Quadro ADM e oficina","Quadro ADM e oficina", ["Departamento"], []);
  const C = comparativoQuadro(R.QF, "todos", "media");
  const linhas = [];
  C.departamentos.forEach(d=>{
    linhas.push(["Departamento", d.nome+" ("+d.dcod+")", d.grupo==="adm"?"ADM agrícola":"Oficina", ...colsQF(d)]);
    d.filhas.forEach(f=>linhas.push(["Função", "      ↳ "+f.nome+" ["+f.fcod+"]", "", ...colsQF(f)]));
  });
  linhas.push(["", "TOTAL", "", ...colsQF(C.total)]);
  return sec("Quadro ADM e oficina","Quadro ADM agrícola e oficina — previsto × realizado AA, média mensal dez/26–mar/27",
    ["Nível","Departamento / Função","Quadro", ...CAB_QF_REL], linhas);
};
const quadroAdmOficinaMes = R => {
  if(!R.QF) return sec("Quadro — evolução","Quadro ADM e oficina — evolução mensal", ["Mês"], []);
  const C = comparativoQuadro(R.QF, "todos", "media");
  return sec("Quadro — evolução","Quadro ADM agrícola e oficina — evolução mensal",
    ["Mês", ...CAB_QF_REL],
    C.evolucao.map(e=>[e.mes, ...colsQF(e)]).concat([["Média mensal", ...colsQF(C.media)]]));
};

/* ---------- 12. insumos ---------- */
const insumos = R => sec("Insumos","Insumos — cadastro, classificação técnica e necessidade",
  ["Nome comercial","Princípio ativo","Código","Un","Concentração","Classe agronômica",
   "Categoria operacional","Formulação","Grupo químico","Fabricante","Class. toxicológica",
   "Volume demandado","Estoque","Preço corrigido","Necessidade de compra","Custo"],
  insLista().map(i=>{ const ov=INSUMO[i.prod]||{};
    const preco=(ov.preco!=null?num(ov.preco):num(i.preco))*(1+P.ipreco/100);
    const est=ov.est!=null?num(ov.est):num(i.est), vol=R.volDem[i.prod]||0;
    const falta=Math.max(0,vol-est);
    return [i.prod, i.pa||"—", i.cod||"—", i.un||"—", i.conc||"—", i.classe||"—", i.categ||"—",
      i.form||"—", i.grupo||"—", i.fab||"—", i.tox||"—",
      fmt(vol,1), fmt(est), preco>0?brl(preco,2):"sem preço", fmt(falta,1),
      preco>0?brl(falta*preco):"—"];})
  .concat([["TOTAL","","","","","","","","","","","","","","", brl(R.insumoT)]]));

/* ---------- tratamentos ---------- */
const tratamentos = R => secP("Tratamentos","Tratamentos — composição, etapa e uso no plano",
  ["Cod_Trat","Nome","Etapas marcadas","Etapas em que o plano usa","Produtos","Composição",
   "Custo/ha","Atividades que usam","Área tratada","Custo no plano"],
  tratListaTodos().map(t=>{
    const usos = R.L.filter(r=>r.trat===t.cod).map(ativP).filter(r=>r.total>0);
    const area = usos.reduce((s,u)=>s+u.total,0);
    const marc = tratEtapas(t.cod).map(e=>TRAT_ETAPAS[e].nome).join(" · ");
    const plano = etapasNoPlano(t.cod).map(e=>TRAT_ETAPAS[e].nome).join(" · ");
    return [t.cod, TRAT_NOME[t.cod]||"—", marc||"sem marcação", plano||"—",
      composicao(t.cod).length,
      composicao(t.cod).map(l=>l.prod+" "+fmt(num(l.dose),2)+" "+(l.un||"")).join(" · ")||"—",
      t.custo_ha>0?brl(t.custo_ha,2):"—", usos.map(u=>codExibir(u.a.cod)).join(", ")||"—",
      area>0?fmt(area)+" ha":"—", area>0?brl(area*t.custo_ha):"—"];}));

/* ---------- 13. arrendamentos ---------- */
const arrendamentos = R => {
  // parcelas e valor que caem nos meses do período; custo anual é do contrato
  const parcP = l => l.pmes.filter(i=>REC.meses.includes(i)).length;
  const fArr = fracDe(R.AR.mes);
  return secP("Arrendamentos","Arrendamentos — fazendas e rateio",
  ["Fazenda","Grupo","Área (ha)","Forma de pagamento","Periodicidade","Pagamentos por ano",
   "Meses de pagamento",REC.parcial?"Parcelas no período":"Parcelas na janela","Valor da parcela",
   "R$/ha/ano","Custo anual do contrato",REC.parcial?"Custo no período":"Custo no orçamento"],
  R.AR.linhas.map(l=>[l.faz, l.grupo, fmt(l.area), (ARR_FORMAS[l.forma]||{nome:l.forma}).nome,
    l.pag, l.pagsAno, l.agenda,
    parcP(l)||"—", l.nParc?brl(l.parcela):"—",
    brl(l.rsHaAno,2), brl(l.anual), brl(noPer(l.mes))])
  .concat([["TOTAL","", fmt(R.AR.area), "", "", "", "",
    R.AR.linhas.reduce((t,l)=>t+parcP(l),0), "",
    R.AR.area>0?brl(R.AR.anual/R.AR.area,2):"—", brl(R.AR.anual), brl(noPer(R.AR.mes))]])
  .concat(ETAPAS_ORD.filter(e=>R.etapas[e]&&R.etapas[e].arrend>0)
    .map(e=>["↳ rateio "+e, "", "", fmt(arrRat(e),1)+"% de referência", "", "", "", "", "", "", "",
      brl(R.etapas[e].arrend*fArr)]))
  .concat(REC.meses.map(i=>["↳ pagamento em "+MESES[i], "", "", "", "", "", "",
    R.AR.linhas.filter(l=>l.pmes.includes(i)).length||"—", "", "", "", brl(R.AR.mes[i])])));
};

/* ---------- 14. fornecedores ---------- */
const fornecedores = R => sec("Fornecedores","Fornecedores de cana — contratos",
  ["Fornecedor","Propriedade","Origem","Modalidade","Área (ha)","TCH","t contratadas","t estimadas",
   "ATR","Distância (km)","Entrega","Qualidade","Frete (R$/t)","Custo","R$/t"],
  R.FORN.linhas.map(l=>[l.forn, l.prop, (R.FORN.origens[l.origem]||{nome:l.origem}).nome,
    (FORN_MODALIDADES[l.mod]||{nome:l.mod}).nome, fmt(l.area), fmt(l.tch,1), fmt(l.tonContr),
    fmt(l.ton), fmt(l.atr,1), fmt(l.dist), l.mesesEnt.join(" a "), l.qual, brl(l.freteT,2),
    brl(l.custo), brl(l.rsT,2)])
  .concat([["TOTAL","","","", fmt(R.FORN.linhas.reduce((s,l)=>s+l.area,0)), "",
    fmt(R.FORN.linhas.reduce((s,l)=>s+l.tonContr,0)), fmt(R.FORN.aquisicao.ton), "", "", "", "", "",
    brl(R.FORN.aquisicao.custo), R.FORN.aquisicao.ton>0?brl(R.FORN.aquisicao.rsT,2):"—"]]));

/* ---------- 15. administração ---------- */
const administracao = R => secP("Administração","Custos administrativos e rateio",
  ["Grupo","Natureza do gasto","R$/mês","Critério de rateio","Centro de custo","Total no período","Rateio"],
  R.ADM.linhas.map((l,i)=>{ const st=R.AD.porLinha[i]||{};
    return [ADM_GRUPOS[l.grupo]||l.grupo, l.desc, brl(l.mensal), (ADM_CRITERIOS[l.crit]||{}).nome||l.crit, l.cc||"—",
            brl(l.total*REC.fracMeses), l.total<=0 ? "—" : (st.rateado>0?"rateado":(st.motivo||"sem rateio"))];})
  .concat([["","TOTAL", brl(R.ADM.mensal), "", "", brl(R.ADM.total*REC.fracMeses), ""]])
  .concat(Object.keys(R.etapas).map(e=>["↳ rateio", e, "", "", "", brl((R.etapas[e].admin||0)*REC.fracMeses), ""]))
  .concat(R.AD.semRateio>0 ? [["↳ sem base","volta para o rateio indireto","","","", brl(R.AD.semRateio*REC.fracMeses),""]] : []));

/* ---------- 16. custos ---------- */
const custoEtapa = R => { const E = etapasP(R);
  const totE = Object.values(E).reduce((t,d)=>t+(d.total||0),0)||1;
  return secP("Custos","Custo por etapa",
  ["Etapa","Diesel","Mão de obra","Manutenção","Insumos","Terceirização","Arrendamento","Administrativo",
   "Indireto","Total","% do total","Base física","Custo unitário"],
  Object.entries(E).sort((a,b)=>b[1].total-a[1].total).map(([e,d])=>{
    const b = baseEtapa(R, e);
    return [e, brl(d.diesel), brl(d.mdo), brl(d.manut), brl(d.insumo+(d.irrig||0)), brl(d.terc),
      brl(d.arrend||0), brl(d.admin||0), brl(d.indireto), brl(d.total),
      fmt(d.total/totE*100,1)+"%", rotuloBase(b), custoUnit(d.total, b)];}));
};
/* A abertura fina por natureza (MDO direta, de apoio, indireta...) só existe
   para o ano. No recorte, a composição sai pelas grandes contas, que têm série
   mensal no motor — número exato do período em vez de uma proporção do ano. */
const natureza = R => {
  const tot = totP(R);
  const itens = REC.parcial
    ? Object.keys(CAT_LBL).map(k=>[CAT_LBL[k], catP(R,k)])
    : comps(R);
  return secP("Natureza", REC.parcial ? "Composição por grande conta" : "Composição por natureza",
    ["Natureza","Total","%","R$/ha plantado"],
    itens.filter(([,v])=>v>0).map(([n,v])=>[n, brl(v), fmt(tot>0?v/tot*100:0,1)+"%",
      brl(v/(P.plantio||1),2)])
    .concat([["TOTAL", brl(tot), "100,0%", brl(tot/(P.plantio||1),2)]]));
};
const mensal = R => secP("Mensal","Custo mensal e grandes contas",
  ["Mês","Período",...Object.values(CAT_LBL),"Total","Acumulado"],
  (()=>{ let ac=0; return REC.meses.map(i=>{ ac+=R.meses[i];
    return [MESES[i], periodoMes(i)==="safra"?"Safra":"Entressafra",
      ...Object.keys(CAT_LBL).map(k=>brl(R.mesesCat[k][i])), brl(R.meses[i]), brl(ac)];});})()
  .concat([["TOTAL","", ...Object.keys(CAT_LBL).map(k=>brl(catP(R,k))), brl(totP(R)), ""]]));
const periodos = R => ({...sec("Períodos","Custos por período — safra e entressafra",
  ["Grande conta","Safra (abr a nov)","Entressafra (dez a mar)","Total"],
  Object.keys(CAT_LBL).map(k=>[CAT_LBL[k], brl(R.PER.safra.cat[k]), brl(R.PER.entressafra.cat[k]),
    brl(R.PER.safra.cat[k]+R.PER.entressafra.cat[k])])
  .concat([["TOTAL", brl(R.PER.safra.total), brl(R.PER.entressafra.total), brl(R.total)]])), rotulo:false});

/* ---------- 17. plano de contas ---------- */
const contas = R => { const CV = contasValores(R);
  return sec("Plano de Contas","Plano de contas — custo projetado",
    ["Conta","Descrição","Grupo","Natureza","Classificação","Custo projetado"],
    CFG.contas.map(c=>{ const comb=CONTA_COMBINADA[c.conta];
      return [c.conta, c.desc, c.grupo, c.nat, c.cls,
        comb?"incluído em "+comb:(CV[c.conta]!=null?brl(CV[c.conta]):"—")];})
    .concat([["","TOTAL MAPEADO ÀS CONTAS","","","", brl(totaisContas(CV).mapeado)]])
    .concat(Object.entries(SEM_CONTA).filter(([k])=>(CV[k]||0)>0.5)
      .map(([k,rot])=>["—", rot, "Sem conta", "", "", brl(CV[k])]))
    .concat([["","TOTAL — CONFERE COM O CUSTO DO PLANO","","","", brl(totaisContas(CV).total)]]));
};

/* ---------- 18. fluxo de caixa ---------- */
const fluxo = R => { const tot = totP(R);
  return secP("Fluxo de Caixa","Fluxo de caixa agrícola",
  ["Mês","Período","Desembolso",REC.parcial?"% do período":"% do total","Acumulado","% acumulado"],
  (()=>{ let ac=0; return REC.meses.map(i=>{ ac+=R.meses[i];
    return [MESES[i], periodoMes(i)==="safra"?"Safra":"Entressafra", brl(R.meses[i]),
      fmt(tot>0?R.meses[i]/tot*100:0,1)+"%", brl(ac),
      fmt(tot>0?ac/tot*100:0,1)+"%"];});})()
  .concat([["TOTAL","", brl(tot), "100,0%", "", ""]])
  .concat(Object.keys(PERIODOS).filter(p=>!REC.parcial || p===REC.per).map(p=>["↳ "+PERIODOS[p], "",
    brl(R.PER[p].total), fmt(R.total>0?R.PER[p].total/R.total*100:0,1)+"% do ano", "", ""])));
};

/* ---------- 19. cenários ---------- */
const cenarios = R => {
  const linhas = [];
  const TOT = totP(R);
  // no recorte, cada base é a do período: grandes contas mês a mês, e o
  // administrativo igual todo mês
  const base = REC.parcial
    // a grande conta mensal é "insumos + irrigação"; o cenário de insumos é só
    // insumo, como no ano — a irrigação sai pela área operada, que é como o motor a espalha
    ? [["Diesel", catP(R,"diesel")], ["Mão de obra", catP(R,"mdo")],
       ["Insumos", catP(R,"insumo") - (R.irrT||0)*fracDe(R.haMes)],
       ["Manutenção e materiais", catP(R,"manut")], ["Arrendamento", catP(R,"arrend")],
       ["Administração", R.admT*REC.fracMeses]]
    : [["Diesel", R.dieselT], ["Mão de obra", R.mdoTotal], ["Insumos", R.insumoT],
       ["Manutenção e materiais", R.manutT], ["Arrendamento", R.arrT], ["Administração", R.admT]];
  [5,10].forEach(v=>{
    base.forEach(([nome, valor])=>{
      const d = valor*v/100;
      linhas.push([`${nome} +${v}%`, brl(valor), brl(d), brl(TOT+d),
        fmt(TOT>0?d/TOT*100:0,2)+"%", brl((TOT+d)/(P.plantio||1),2)]);
    });
  });
  base.forEach(([nome, valor])=>{
    const d = valor*0.10;
    linhas.push([`${nome} −10%`, brl(valor), brl(-d), brl(TOT-d),
      fmt(TOT>0?-d/TOT*100:0,2)+"%", brl((TOT-d)/(P.plantio||1),2)]);
  });
  return secP("Cenários","Cenários — sensibilidade do custo total",
    ["Cenário","Valor na base","Variação em R$","Custo total no cenário","Impacto no total","R$/ha plantado"],
    [["Base (plano atual)", brl(TOT), "—", brl(TOT), "—", brl(TOT/(P.plantio||1),2)]]
      .concat(linhas));
};

/* ---------- 20. validação ---------- */
const validacao = R => ({...sec("Validação","Validação do plano",["Situação","Verificação","Detalhe"],
  validar(R).map(v=>[v.ok?"OK":"PENDENTE", v.t, v.d||""])), rotulo:false});

/* ---------- cortes gerenciais ---------- */
const porFazenda = R => {
  const areaArr = R.AR.area;
  // o plano não é lançado por fazenda: a parcela de cada fazenda arrendada sai
  // da proporção de área dentro do total arrendado, que é o que o modelo sabe
  const custoArrendada = R.FORN.origens.arrendada.custo;
  const linhas = R.AR.linhas.map(l=>{
    const p = areaArr>0 ? l.area/areaArr : 0;
    const prod = custoArrendada*p;
    return [l.faz, l.grupo||"—", "Arrendada", fmt(l.area), fmt(R.FORN.origens.arrendada.ton*p),
      brl(l.periodo), brl(prod-l.periodo), brl(prod), l.area>0?brl(prod/l.area,2):"—"];
  });
  const propria = R.FORN.origens.propria;
  if(propria.area>0 || propria.custo>0) linhas.unshift(["Áreas próprias","—","Própria",
    fmt(propria.area), fmt(propria.ton), brl(0), brl(propria.custo), brl(propria.custo),
    propria.area>0?brl(propria.custo/propria.area,2):"—"]);
  R.FORN.linhas.forEach(l=>linhas.push([l.forn, l.prop||"—",
    (R.FORN.origens[l.origem]||{nome:l.origem}).nome, fmt(l.area), fmt(l.ton), "—", brl(l.custo),
    brl(l.custo), l.area>0?brl(l.custo/l.area,2):"—"]));
  return sec("Por Fazenda","Orçamento por fazenda e propriedade",
    ["Fazenda / fornecedor","Grupo / propriedade","Origem","Área (ha)","Toneladas","Arrendamento",
     "Produção ou compra","Custo total","R$/ha"], linhas);
};

const porCentroCusto = R => { const E = etapasP(R), V = Object.values(E);
  const t = k => V.reduce((x,d)=>x+(d[k]||0),0);
  const totE = t("total")||1;
  return secP("Centro de Custo","Orçamento por centro de custo",
  ["Centro de custo (etapa)","Custo direto","Arrendamento","Administrativo","Indireto","Total",
   "% do total","Hectares","Toneladas","Horas"],
  Object.entries(E).sort((a,b)=>b[1].total-a[1].total).map(([e,d])=>[e, brl(d.direto),
    brl(d.arrend||0), brl(d.admin||0), brl(d.indireto||0), brl(d.total),
    fmt(d.total/totE*100,1)+"%", fmt(d.ha), fmt(d.ton), fmt(d.horas||0)])
  .concat([["TOTAL", brl(t("direto")), brl(t("arrend")), brl(t("admin")), brl(t("indireto")),
    brl(t("total")), "100,0%", fmt(REC.parcial ? t("ha") : R.haOp), "", fmt(horasP(R))]]));
};

const porAtividade = R => secP("Por Atividade","Orçamento por atividade", CAB_ATIV.concat(["Etapa","Função"]),
  R.L.map(ativP).filter(r=>r.total>0).sort((a,b)=>b.direto-a.direto)
    .map(r=>linhaAtiv(r).concat([r.a.etapa, r.fcod+" · "+r.fnome])));

const indicadores = R => {
  const ton = R.FORN.tonTotal, ha = P.plantio||1;
  const colh = R.etapas["COLHEITA"]||{};
  if(REC.parcial) return indicadoresP(R);
  return sec("Indicadores","Indicadores de custo",["Indicador","Valor","Base"],[
    ["Custo total", brl(R.total), MESES.length+" meses"],
    ["Custo por hectare plantado", brl(custoHaForm(R),2)+"/ha", "formação do canavial ÷ "+fmt(ha)+" ha"],
    ["Custo do plano por hectare de plantio", brl(R.total/ha,2)+"/ha", fmt(ha)+" ha"],
    ["Custo por tonelada moída", ton>0?brl(R.total/ton,2)+"/t":"—", fmt(ton)+" t"],
    ["Custo médio da matéria-prima", ton>0?brl(R.FORN.rsTMedio,2)+"/t":"—", "todas as origens"],
    ["Custo por kg de ATR", R.FORN.atrTotal>0?brl(R.FORN.rsAtrMedio,4)+"/kg":"—", "ATR médio "+fmt(R.FORN.atrMedio,1)],
    ["Custo da cana própria", R.FORN.origens.propria.ton>0?brl(R.FORN.origens.propria.rsT,2)+"/t":"—", "produção"],
    ["Custo da cana de fornecedor", R.FORN.origens.fornecedor.ton>0?brl(R.FORN.origens.fornecedor.rsT,2)+"/t":"—", "aquisição"],
    ["Custo de colheita por tonelada", colh.total ? custoUnit(colh.total, baseEtapa(R,"COLHEITA")) : "—",
     "etapa colheita · "+rotuloBase(baseEtapa(R,"COLHEITA"))],
    ["Diesel por hectare operado", R.haOp>0?fmt(R.CB.litrosT/R.haOp,1)+" L/ha":"—", fmt(R.CB.litrosT)+" L"],
    ["Diesel por tonelada", ton>0?fmt(R.CB.litrosT/ton,2)+" L/t":"—", ""],
    ["Custo-hora médio de máquina", R.horasT>0?brl((R.dieselT+R.manutT)/R.horasT,2)+"/h":"—", fmt(R.horasT)+" h"],
    ["CRM por hora", R.horasT>0?brl(R.crmTotal/R.horasT,2)+"/h":"—", "manutenção"],
    ["Mão de obra por hectare", brl(R.mdoTotal/ha,2)+"/ha", fmt(R.efetivoTotal)+" pessoas"],
    ["Custo variável", brl(R.variavel), fmt(R.total>0?R.variavel/R.total*100:0,1)+"% do total"],
    ["Custo fixo", brl(R.fixoT), fmt(R.total>0?R.fixoT/R.total*100:0,1)+"% do total"],
    ["Peso do arrendamento", fmt(R.total>0?R.arrT/R.total*100:0,1)+"%", brl(R.arrT)],
    ["Peso da administração", fmt(R.total>0?R.admT/R.total*100:0,1)+"%", brl(R.admT)],
    ["Custo na safra", brl(R.PER.safra.total), fmt(R.total>0?R.PER.safra.total/R.total*100:0,1)+"%"],
    ["Custo na entressafra", brl(R.PER.entressafra.total), fmt(R.total>0?R.PER.entressafra.total/R.total*100:0,1)+"%"],
  ]);
};

/* Indicadores do período. Entra o que tem série mensal no motor; o que depende
   de tonelada moída ou de matéria-prima é do ano e sai marcado como tal — o
   motor não sabe quanto se mói em cada mês. */
function indicadoresP(R){
  const tot = totP(R), ha = P.plantio||1;
  const fixo = catP(R,"fixo") + catP(R,"arrend");
  const at = R.L.map(ativP).filter(r=>r.total>0);
  const horas = horasP(R);
  const haOp = noPer(R.haMes);
  const litros = noPer(R.CB.litrosOperMes) + noPer(R.CB.litrosApoioMes);
  const diesel = catP(R,"diesel"), manut = catP(R,"manut"), mdo = catP(R,"mdo"), arr = catP(R,"arrend");
  const adm = R.admT*REC.fracMeses;
  const ano = "do ano — sem série mensal";
  return secP("Indicadores","Indicadores de custo",["Indicador","Valor","Base"],[
    ["Custo total", brl(tot), REC.meses.length+" meses"],
    ["Custo por hectare plantado", brl(custoHaForm(R),2)+"/ha", "formação do canavial ÷ "+fmt(ha)+" ha (ano)"],
    ["Custo do plano por hectare de plantio", brl(tot/ha,2)+"/ha", fmt(ha)+" ha"],
    ["Custo por hectare operado", haOp>0?brl(tot/haOp,2)+"/ha":"—", fmt(haOp)+" ha operados"],
    ["Custo médio da matéria-prima", R.FORN.tonTotal>0?brl(R.FORN.rsTMedio,2)+"/t":"—", ano],
    ["Custo por kg de ATR", R.FORN.atrTotal>0?brl(R.FORN.rsAtrMedio,4)+"/kg":"—", ano],
    ["Diesel por hectare operado", haOp>0?fmt(litros/haOp,1)+" L/ha":"—", fmt(litros)+" L"],
    ["Custo-hora médio de máquina", horas>0?brl((diesel+manut)/horas,2)+"/h":"—", fmt(horas)+" h"],
    ["Mão de obra por hectare", brl(mdo/ha,2)+"/ha", brl(mdo)],
    ["Custo variável", brl(tot-fixo), fmt(tot>0?(tot-fixo)/tot*100:0,1)+"% do período"],
    ["Custo fixo", brl(fixo), fmt(tot>0?fixo/tot*100:0,1)+"% do período"],
    ["Peso do arrendamento", fmt(tot>0?arr/tot*100:0,1)+"%", brl(arr)],
    ["Peso da administração", fmt(tot>0?adm/tot*100:0,1)+"%", brl(adm)],
    ["Participação no custo do ano", fmt(R.total>0?tot/R.total*100:0,1)+"%", brl(R.total)+" no ano"],
  ]);
}

const logistica = R => sec("Logística","Orçamento de logística",
  ["Item","Volume","Horas","Frota","Custo","Observação"],
  R.TR.blocos.filter(b=>b.ton>0).map(b=>[b.nome||"—", fmt(b.ton)+" t", fmt(b.horas), b.frotaR,
    brl(b.total), "raio e ciclo das premissas"])
  .concat(R.TP.linhas.map(l=>[l.rota, fmt(l.kmRota)+" km", "", l.qtd, brl(l.total),
    l.veic+" · "+fmt(l.cap)+" lugares"]))
  .concat(R.FORN.linhas.filter(l=>l.frete>0).map(l=>["Frete de fornecedor · "+l.forn,
    fmt(l.ton)+" t", "", "", brl(l.frete), fmt(l.dist)+" km a "+brl(l.freteT,2)+"/t"]))
  .concat([["TOTAL","","","", brl(R.TR.total+R.tpessT+R.FORN.linhas.reduce((s,l)=>s+l.frete,0)), ""]]));

const planoOperacional = R => secP("Plano Operacional","Plano Operacional",
  ["Cod","Etapa","Atividade","Un",...REC.meses.map(i=>MESES[i]),
   REC.parcial?"Total do período":"Total","Tratamento"],
  R.L.filter(r=>noPer((r.meses||[]).map(num))>0).map(r=>[codExibir(r.a.cod), r.a.etapa, r.a.nome, r.a.un,
    ...REC.meses.map(i=>fmt(num(r.meses[i]))), fmt(noPer(r.meses.map(num))), r.trat||"—"]));

/* Frota e efetivo são o dimensionamento do plano — o pico, não uma parte do
   ano. No recorte saem as atividades que operam no período, com o volume e as
   horas do período, e a frota e o efetivo dimensionados. */
const dimensionamento = R => secP("Dimensionamento","Dimensionamento por atividade",
  ["Cod","Atividade",REC.parcial?"Volume no período":"Volume","Rendimento","Utilização",
   REC.parcial?"Horas no período":"Horas","Frota a ter (pico)","Mês do pico","Frota média (rateio)",
   "Turnos","Escala","Fator","Equipe a ter (pico)","Efetivo médio (folha)","Máquina","Implemento"],
  // A39 e A19 vao na plantadora da A10: sem frota nem equipe proprias, nao se dimensionam
  R.L.filter(r=>!r.junto).map(r=>[r, ativP(r)]).filter(([,p])=>p.total>0).map(([r,p])=>{
    const F = frotaDaAtividade(r), PE = pessoasDaAtividade(r);
    return [codExibir(r.a.cod), r.a.nome, fmt(p.total),
      fmt(r.rend,2), pct(r.util), fmt(p.horas), F.pico, F.mes||"—", F.media,
      (r.partes[0]?r.partes[0].turnosEf:r.a.turnos)+"t", r.escala||"padrão",
      fmt(r.fator,2), fmt(PE.pico), fmt(PE.media), r.maqEfetiva, r.impEfetivo];
  }));

const combustivel = R => {
  const lit = noPer(R.CB.litrosOperMes) + noPer(R.CB.litrosApoioMes);
  const cus = noPer(R.CB.custoOperMes) + noPer(R.CB.custoApoioMes);
  return secP("Combustível","Combustível — diesel projetado",
  ["Mês","Período","Litros operação","Litros apoio","Litros total","Preço (R$/L)","Custo"],
  REC.meses.map(i=>[MESES[i], periodoMes(i)==="safra"?"Safra":"Entressafra", fmt(R.CB.litrosOperMes[i]),
    fmt(R.CB.litrosApoioMes[i]), fmt(R.CB.litrosOperMes[i]+R.CB.litrosApoioMes[i]),
    brl(R.CB.preco[i],2), brl(R.CB.custoOperMes[i]+R.CB.custoApoioMes[i])])
  .concat([["TOTAL","","","", fmt(lit), lit>0?brl(cus/lit,2):"—", brl(cus)]]));
};

const apoio = R => sec("Apoio","Equipamentos de apoio",
  ["Equipamento","Máquina","Qtd","Horas/mês","Horas totais","Litros","Diesel","MDO","Total"],
  R.AE.linhas.map(l=>[l.nome, l.maq, l.qtd, fmt(num(l.hmes)), fmt(l.horas), fmt(l.litros),
    brl(l.diesel), brl(l.mdo), brl(l.total)])
  .concat([["TOTAL","","","", fmt(R.AE.horas), fmt(R.AE.litros), brl(R.AE.diesel), brl(R.AE.mdo),
    brl(R.AE.total)]]));

const irrigacao = R => sec("Irrigação","Irrigação e fertirrigação",
  ["Modalidade","Área (ha)","Volume (m³)","Horas","Energia","Insumos","Materiais","Total"],
  R.IR.linhas.filter(l=>l.area>0).map(l=>[l.nome, fmt(l.area), fmt(l.volume), fmt(l.horas),
    brl(l.energia), brl(l.insumo), brl(l.material), brl(l.total)])
  .concat([["TOTAL","","","", brl(R.IR.energia), "", "", brl(R.irrT)]]));

/* ---------- custo operacional x contábil ----------
   As duas páginas da aba Custos. São do ano: no recorte por período saem com
   "ano todo" no título, como toda seção sem série mensal. */
const unitOp = (v, b) => custoUnit(v, b);
// custo por hectare plantado: a formação do canavial ÷ área de plantio
const custoHaForm = R => { const F = custoPorOperacao(R).formacao;
  return F && F.base && F.base.q>0 ? F.contabil/F.base.q : 0; };
// as operações com a formação do canavial logo depois da última parte dela
const comFormacaoRel = (C, lin, linF) => { const ult = C.principais.map(l=>!!l.formacao).lastIndexOf(true);
  return C.principais.flatMap((l,k)=> k===ult && C.formacao ? [lin(l), linF(C.formacao)] : [lin(l)]); };
const custoOperacional = R => { const C = custoPorOperacao(R), L = C.principais.concat(C.outras);
  const lin = l => [l.nome, rotuloBase(l.base), brl(l.oper.diesel), brl(l.oper.mdo), brl(l.oper.manut),
    brl(l.oper.insumo), brl(l.oper.irrig), brl(l.oper.terc), brl(l.oper.total), unitOp(l.oper.total, l.base)];
  const linF = f => ["= "+f.nome+" (preparo + plantio + tratos de cana planta)", ...lin(f).slice(1)];
  const tot = (lista, rot) => [rot, "", ...["diesel","mdo","manut","insumo","irrig","terc","total"]
    .map(k=>brl(C.soma(lista, l=>l.oper[k]))), ""];
  return sec("Custo operacional","Custo operacional — o que custa fazer cada operação",
    ["Operação","Base física","Diesel","Mão de obra","Manutenção (CRM)","Insumos","Irrigação","Terceirização",
     "Custo operacional","Custo unitário"],
    comFormacaoRel(C, lin, linF).concat([tot(C.principais, "SUBTOTAL DAS OPERAÇÕES PRINCIPAIS")],
      C.outras.map(lin), [tot(L, "TOTAL OPERACIONAL DO PLANO")]));
};
const custoContabil = R => { const C = custoPorOperacao(R), L = C.principais.concat(C.outras);
  const RAT = ["apoio","arrend","admin","deprec","gerais"];
  const lin = l => [l.nome, brl(l.oper.total), ...RAT.map(k=>brl(l.rateio[k])), brl(l.rateio.total),
    brl(l.contabil), unitOp(l.contabil, l.base),
    l.oper.total>0 ? "+"+fmt(l.rateio.total/l.oper.total*100,1)+"%" : "—"];
  const linF = f => ["= "+f.nome+" (preparo + plantio + tratos de cana planta)", ...lin(f).slice(1)];
  const tot = (lista, rot) => { const o = C.soma(lista, l=>l.oper.total), r = C.soma(lista, l=>l.rateio.total);
    return [rot, brl(o), ...RAT.map(k=>brl(C.soma(lista, l=>l.rateio[k]))), brl(r),
      brl(C.soma(lista, l=>l.contabil)), "", o>0 ? "+"+fmt(r/o*100,1)+"%" : "—"]; };
  return sec("Custo contábil","Custo total (contábil) — custo operacional mais todos os rateios",
    ["Operação","Custo operacional","Diesel do apoio","Arrendamento","Administrativo","Depreciação",
     "Demais custos gerais","Total de rateios","Custo contábil","Custo unitário","Rateio sobre o operacional"],
    comFormacaoRel(C, lin, linF).concat([tot(C.principais, "SUBTOTAL DAS OPERAÇÕES PRINCIPAIS")],
      C.outras.map(lin), [tot(L, "CUSTO TOTAL DO PLANO")]));
};

/* ---------- catálogo ---------- */
const SECOES = {
  custoOperacional, custoContabil,
  resumo, premissas, area, producao,
  plantio: porEtapa("Plantio","Orçamento de plantio","PLANTIO"),
  preparo: porEtapa("Preparo de Solo","Orçamento de preparo de solo","PREPARO DE SOLO"),
  tratos:  porEtapa("Tratos","Orçamento de tratos culturais","TRATOS CULTURAIS"),
  colheita:porEtapa("Colheita","Orçamento de colheita","COLHEITA"),
  apoioEtapa: porEtapa("Apoio e Conservação","Orçamento de apoio e conservação","APOIO E CONSERVAÇÃO"),
  transporte, frota, frotaBase, modelos, manutencao, maoDeObra, pessoasDept, pessoasAtividade, fluxoMdo, insumos,
  quadroAdmOficina, quadroAdmOficinaMes,
  tratamentos,
  arrendamentos, fornecedores, administracao, custoEtapa, natureza, mensal, periodos,
  contas, fluxo, cenarios, validacao, porFazenda, porCentroCusto, porAtividade,
  indicadores, logistica, planoOperacional, dimensionamento, combustivel, apoio, irrigacao,
};

/* Abas do Excel completo, na ordem pedida. */
const ABAS_COMPLETO = ["resumo","premissas","area","producao","plantio","tratos","colheita",
  "transporte","frota","manutencao","maoDeObra","insumos","arrendamentos","fornecedores",
  "administracao","custoEtapa","contas","fluxo","cenarios","validacao"];

/* ===== Metas e acompanhamento =====
   Saem da mesma fonte da aba: metasPorAtividade e execucao. O relatorio nao
   recalcula meta -- se recalculasse, a folha impressa e a tela poderiam
   divergir no meio da reuniao. */
function metasDe(R, ger){
  const lin = metasPorAtividade(R).filter(m=>m.gerencia===ger);
  return sec(ger==="agricola" ? "Metas agrícolas" : "Metas de logística",
    "Metas — "+(GERENCIAS[ger]||ger),
    ["Cod","Atividade","Etapa","Volume","Unid.","Janela","Rendimento","Frota","Efetivo",
     "Meta/dia efetivo por equipamento","Horas/dia por equipamento",
     "Meta/dia efetivo da frota","Meta/dia corrido da frota","Custo"],
    lin.map(m=>[codExibir(m.cod), m.nome, m.etapa, fmt(m.total), m.un,
      m.janela ? (m.janela.fonte==="datas" ? m.janela.ini+" a "+m.janela.fim : fmt(m.janela.meses,1)+" meses") : "—",
      fmt(m.rend,2)+" "+m.un+"/h", fmt(m.frota), fmt(m.efetivo),
      m.meta ? fmt(m.meta.qEquipDia,1)+" "+m.un : "—",
      m.meta ? fmt(m.meta.hEquipDia,1)+" h" : "—",
      m.meta ? fmt(m.meta.qFrotaDia,1)+" "+m.un : "—",
      m.qDiaCorrido > 0 ? fmt(m.qDiaCorrido,1)+" "+m.un : "—",
      brl(m.custo)]));
}

SECOES.metasAgricola = R => metasDe(R, "agricola");
SECOES.metasLogistica = R => metasDe(R, "logistica");
SECOES.metasManutencao = R => sec("Metas de manutenção", "Metas — Gerência de Manutenção",
  ["Máquina ou implemento","Atividades","Frota","Horas no plano","Horas por equipamento",
   "CRM (R$/h)","CRM no plano"],
  metasDeFrota(R).map(o=>[o.maq, fmt(o.ativs), fmt(o.frota), fmt(o.horas),
    o.frota>0?fmt(o.horas/o.frota):"—", brl(o.crmHora,2), brl(o.crm)]));
SECOES.excecoes = R => {
  const E = excecoes(R, null);
  return sec("Onde perguntar", "Atividades fora da meta, por atraso em dinheiro",
    ["Cod","Atividade","Gerência","Etapa","Unid.","Plano medido","Realizado","Falta","Aderência","Atraso em R$"],
    E.atraso.map(l=>[codExibir(l.cod), l.nome, GERENCIAS[l.gerencia]||l.gerencia, l.etapa, l.un,
      fmt(l.planoAte), fmt(l.realizado), fmt(l.gap), pct(l.aderencia), brl(l.gapValor)])
      .concat(E.atraso.length ? [["","","","","","","","","ATRASO TOTAL", brl(E.atrasoValor)]] : []));
};
SECOES.porGerencia = R => sec("Por gerência", "Resumo por gerência",
  ["Gerência","Atividades","Medidas","Aderência","Fora da meta","Meses sem apontamento",
   "Atraso em R$","Custo no plano"],
  porGerencia(R, null).map(g=>[g.nome, fmt(g.atividades), fmt(g.medidas),
    g.aderencia!=null?pct(g.aderencia):"—", fmt(g.foraDaMeta), fmt(g.semApontamento),
    g.atrasoValor>0?brl(g.atrasoValor):"—", brl(g.custoPlano)]));

SECOES.acompanhamento = R => {
  const ex = execucao(R, null);
  // os meses do período; plano medido, realizado e aderência seguem sendo do
  // acompanhamento até o mês corrente, como na aba
  const naJanela = m => REC.meses.includes(m.i);
  return secP("Acompanhamento", "Execução do plano — plano x realizado",
    ["Cod","Atividade","Gerência","Unid.", ...REC.meses.map(i=>MESES[i]+" plano"),
     ...REC.meses.map(i=>MESES[i]+" real"),
     "Plano medido","Realizado","Aderência","A fazer"],
    ex.linhas.map(l=>[codExibir(l.cod), l.nome, GERENCIAS[l.gerencia]||l.gerencia, l.un,
      ...l.meses.filter(naJanela).map(m=>fmt(m.plano)),
      ...l.meses.filter(naJanela).map(m=>m.real!=null?fmt(m.real):"—"),
      fmt(l.planoAte), l.lancados?fmt(l.realizado):"—",
      l.aderencia!=null?pct(l.aderencia):"—", fmt(l.saldo)]));
};

/* ===== Criterio por mes =====
   A mesma tabela que o gerente ve no modal de criterio, achatada numa folha: uma
   linha por atividade-mes, na ordem do calendario. E a folha da reuniao mensal
   -- percorre o mes, nao a lista de atividades.

   Traz as tres alavancas na coluna "necessario". Elas sao alternativas, nao se
   somam: cada uma mostra o que aquele criterio teria de ser sozinho, com os
   outros dois parados na premissa do mes. A coluna Situacao ja resolve a
   pergunta que o diretor faz primeiro -- este mes cabe ou nao. */
function criterioDe(R, ger){
  const lin = criterioPorMes(R, ger).filter(c=>REC.meses.includes(c.i));
  const nome = ger ? (GERENCIAS[ger]||ger) : "todas as gerências";
  return secP(ger ? "Critério por mês" : "Critério por mês — geral",
    "Critério por mês — " + nome,
    ["Mês","Janela do mês","Cod","Atividade","Etapa"].concat(ger ? [] : ["Gerência"]).concat(
    ["Produção","Unid.","Por dia efetivo","Dias de operação","Por dia corrido","Dias do mês",
     "Frota","Rendimento","Horas de máquina","Horas/dia por equipamento","Horas efetivas/dia",
     "Disponibilidade","Utilização","Eficiência",
     "Rendimento necessário","Disponibilidade necessária","Utilização necessária","Eficiência necessária",
     "Situação"]),
    lin.map(c=>[c.mes, c.parcial ? "parcial ("+fmt(c.diasCorridos)+" de "+fmt(c.diasCheios)+" dias)" : "mês inteiro",
      codExibir(c.cod), c.nome, c.etapa].concat(ger ? [] : [GERENCIAS[c.gerencia]||c.gerencia]).concat(
      [fmt(c.q), c.un, fmt(c.qDia,1), fmt(c.dias,1), fmt(c.qDiaCorrido,1), fmt(c.diasCorridos),
       fmt(c.n), fmt(c.rend,2)+" "+c.un+"/h", fmt(c.horas), fmt(c.hDiaEquip,1), fmt(c.hDispEquip,1),
       pct(c.disp), pct(c.util), pct(c.efic),
       fmt(c.rendNec,2)+" "+c.un+"/h", pct(c.dispNec), pct(c.utilNec), pct(c.eficNec),
       c.cabe ? "cabe" : "NÃO CABE"])));
}
SECOES.criterioMes = R => criterioDe(R, null);
SECOES.criterioMesAgricola = R => criterioDe(R, "agricola");
SECOES.criterioMesLogistica = R => criterioDe(R, "logistica");

/* So o que nao cabe, para abrir a reuniao pelo problema. */
SECOES.criterioApertado = R => {
  const lin = criterioPorMes(R, null).filter(c => !c.cabe && REC.meses.includes(c.i));
  return secP("Meses fora do critério", "Meses em que o volume não cabe no critério lançado",
    ["Mês","Cod","Atividade","Gerência","Produção","Unid.","Horas de máquina",
     "Horas/dia por equipamento","Horas efetivas/dia","Falta de hora por dia",
     "Rendimento necessário","Disponibilidade necessária","Utilização necessária","Eficiência necessária"],
    lin.map(c=>[c.mes, codExibir(c.cod), c.nome, GERENCIAS[c.gerencia]||c.gerencia, fmt(c.q), c.un,
      fmt(c.horas), fmt(c.hDiaEquip,1), fmt(c.hDispEquip,1), fmt(c.hDiaEquip-c.hDispEquip,1),
      fmt(c.rendNec,2)+" "+c.un+"/h", pct(c.dispNec), pct(c.utilNec), pct(c.eficNec)]));
};

/* Os 20 relatórios. `secoes` é a ordem em que as abas ou blocos saem. */
const RELATORIOS = [
  {id:"anual",   nome:"Orçamento Agrícola Anual",     secoes: ABAS_COMPLETO},
  {id:"fazenda", nome:"Orçamento por Fazenda",        secoes:["resumo","porFazenda","arrendamentos","fornecedores"]},
  {id:"cc",      nome:"Orçamento por Centro de Custo",secoes:["resumo","custoOperacional","custoContabil","porCentroCusto","custoEtapa","administracao"]},
  {id:"ativ",    nome:"Orçamento por Atividade",      secoes:["resumo","porAtividade","planoOperacional","dimensionamento"]},
  {id:"nat",     nome:"Orçamento por Natureza",       secoes:["resumo","natureza","custoEtapa","contas"]},
  {id:"mensal",  nome:"Orçamento Mensal",             secoes:["resumo","mensal","periodos","fluxo"]},
  {id:"plantio", nome:"Orçamento de Plantio",         secoes:["plantio","preparo","insumos","tratamentos","dimensionamento"]},
  {id:"tratos",  nome:"Orçamento de Tratos",          secoes:["tratos","insumos","tratamentos","irrigacao","dimensionamento"]},
  {id:"colheita",nome:"Orçamento de Colheita",        secoes:["colheita","transporte","combustivel","dimensionamento"]},
  {id:"log",     nome:"Orçamento de Logística",       secoes:["logistica","transporte","combustivel"]},
  {id:"frota",   nome:"Orçamento de Frota",           secoes:["frota","frotaBase","manutencao","apoio","combustivel"]},
  {id:"mdo",     nome:"Orçamento de Mão de Obra",     secoes:["maoDeObra","pessoasDept","quadroAdmOficinaMes","quadroAdmOficina","pessoasAtividade","fluxoMdo"]},
  {id:"pessoas", nome:"Necessidade de Pessoas",        secoes:["pessoasAtividade","pessoasDept","maoDeObra","fluxoMdo","dimensionamento"]},
  {id:"arrend",  nome:"Orçamento de Arrendamentos",   secoes:["arrendamentos","porFazenda"]},
  {id:"forn",    nome:"Orçamento de Fornecedores",    secoes:["fornecedores","producao","logistica"]},
  {id:"caixa",   nome:"Fluxo de Caixa Agrícola",      secoes:["fluxo","mensal","periodos"]},
  {id:"indic",   nome:"Indicadores de Custo",         secoes:["indicadores","natureza","cenarios"]},
  {id:"metaAgr", nome:"Metas — Gerência Agrícola",    secoes:["metasAgricola","criterioMesAgricola","planoOperacional","dimensionamento"]},
  {id:"metaLog", nome:"Metas — Gerência de Logística",secoes:["metasLogistica","criterioMesLogistica","transporte","combustivel"]},
  {id:"metaMan", nome:"Metas — Gerência de Manutenção",secoes:["metasManutencao","criterioApertado","frota","manutencao"]},
  {id:"acomp",   nome:"Acompanhamento do Plano",      secoes:["excecoes","criterioApertado","porGerencia","acompanhamento","criterioMes","metasAgricola","metasLogistica","metasManutencao"]},
  {id:"criterio",nome:"Critério Operacional por Mês", secoes:["criterioApertado","criterioMes","premissas","dimensionamento"]},
];

/* Seções extras que só saem no nível detalhado do relatório anual. */
const DETALHE = ["custoOperacional","custoContabil","planoOperacional","dimensionamento","porAtividade","porCentroCusto","porFazenda",
  "mensal","periodos","natureza","combustivel","apoio","irrigacao","pessoasDept","pessoasAtividade","fluxoMdo",
  "logistica","indicadores","frotaBase","modelos","preparo","apoioEtapa","tratamentos"];

function montarSecoes(R, relId, nivel, periodo){
  const rel = RELATORIOS.find(r=>r.id===relId) || RELATORIOS[0];
  let ids = rel.secoes.slice();
  if(rel.id==="anual" && nivel==="detalhado") ids = ids.concat(DETALHE.filter(d=>!ids.includes(d)));
  REC = recorte(periodo);
  try{
    const secoes = ids.map(id=>SECOES[id]).filter(Boolean).map(f=>f(R)).filter(Boolean);
    // no recorte, o título diz de que período é cada tabela
    if(REC.parcial) secoes.forEach(s=>{
      if(s.rotulo===false) return;
      s.titulo += s.per ? " — " + REC.nome : " — ano todo (sem série mensal)";
    });
    return secoes;
  } finally { REC = recorte("ambos"); }
}
// nome do período para cabeçalho e nome de arquivo
const nomePeriodo = p => REL_PERIODOS[p] || REL_PERIODOS.ambos;

export { ABAS_COMPLETO, REL_PERIODOS, RELATORIOS, SECOES, montarSecoes, nomePeriodo };
