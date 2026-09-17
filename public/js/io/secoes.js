import { agDeLinha, contaOrigem, rotuloItem } from '../calculo/crm.js';
import { ADM_CRITERIOS, ADM_GRUPOS } from '../dados/administrativo.js';
import { ARR_BASE, ARR_FORMAS, ETAPAS_ORD, arrRat } from '../calculo/arrendamento.js';
import { FORN_MODALIDADES } from '../dados/fornecedores.js';
import { deptIdx } from '../calculo/pessoas.js';
import { GERENCIAS, excecoes, execucao, metasDeFrota, metasPorAtividade, porGerencia } from '../calculo/acompanhamento.js';
import { CFG } from '../dados/cfg.js';
import { CAT_LBL, MESES, PERIODOS, periodoMes } from '../nucleo/calendario.js';
import { composicao, etapasNoPlano, tratEtapas, tratListaTodos } from '../calculo/insumos.js';
import { TRAT_ETAPAS } from '../dados/insumos.js';
import { INSUMO, P, TRAT_NOME, insLista } from '../nucleo/estado.js';
import { brl, fmt, num, pct } from '../nucleo/formato.js';
import { CONTA_COMBINADA, contasValores } from '../ui/contas.js';
import { comps } from '../ui/custos.js';
import { validar } from '../ui/validacao.js';

/* ================== SEÇÕES DE RELATÓRIO ==================
   Cada seção é uma função de R -> {aba, titulo, cab, linhas}. O relatório
   escolhe quais seções quer; Excel, PDF e CSV consomem o mesmo material.
   Uma seção sem dado devolve linhas vazias e a geração escreve "sem dados". */

const sec = (aba, titulo, cab, linhas) => ({aba, titulo, cab, linhas});
const totEtapas = R => Object.values(R.etapas).reduce((s,e)=>s+e.total,0)||1;
const ativosDe = (R, etapa) => R.L.filter(r=>r.a.etapa===etapa && r.total>0);
const linhaAtiv = r => [r.a.cod, r.a.nome, r.a.un.split("/")[0], fmt(r.total), fmt(r.horas),
  r.frotaR||0, fmt(r.efetivo), brl(r.cDiesel), brl(r.cMDO), brl(r.cManut), brl(r.cInsumo),
  brl(r.cTerc), brl(r.direto), r.total>0?brl(r.direto/r.total,2):"—"];
const CAB_ATIV = ["Cod","Atividade","Un","Volume","Horas","Frota","Efetivo","Diesel","Mão de obra",
  "Manutenção","Insumos","Terceiros","Custo direto","R$/un"];

/* ---------- 1. resumo executivo ---------- */
const resumo = R => sec("Resumo Executivo","Resumo Executivo",["Indicador","Valor"],[
  ["Safra","2026/2027"], ["Unidade","Capinópolis-MG"],
  ["Meses do orçamento", MESES.length+" ("+MESES[0]+" a "+MESES[MESES.length-1]+")"],
  ["Custo total projetado", brl(R.total)],
  ["Custo variável", brl(R.variavel)], ["Custo fixo", brl(R.fixoT)],
  ["Custo por ha plantado", brl(R.total/(P.plantio||1))],
  ["Área de plantio", fmt(P.plantio)+" ha"],
  ["Hectares operados", fmt(R.haOp)+" ha"],
  ["Moagem própria + terceiros", fmt(R.FORN.tonTotal)+" t"],
  ["Custo médio da tonelada", R.FORN.tonTotal>0?brl(R.FORN.rsTMedio,2)+"/t":"—"],
  ["Horas de máquina", fmt(R.horasT)+" h"],
  ["Frota operacional", fmt(R.frotaT)+" equipamentos"],
  ["Diesel", fmt(R.CB.litrosT)+" L · "+brl(R.dieselT)],
  ["Efetivo total", fmt(R.efetivoTotal)+" pessoas"],
  ["Custo na safra (abr a nov)", brl(R.PER.safra.total)],
  ["Custo na entressafra (dez a mar)", brl(R.PER.entressafra.total)],
  ["Atividades programadas", R.L.filter(r=>r.total>0).length+" de "+R.L.length],
  ["Pendências de validação", validar(R).filter(v=>!v.ok).length],
]);

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
  ["Tarifa padrão de terceirização", brl(CFG.terc_tar_pad,2)+"/ha","Frentes terceirizadas"],
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
  const d = R.etapas[etapa] || {};
  const ativs = ativosDe(R, etapa);
  const base = d.ha>0 ? [fmt(d.ha),"ha"] : [fmt(d.ton||0),"t"];
  return sec(aba, titulo, CAB_ATIV,
    ativs.map(linhaAtiv).concat([
      ["","","TOTAL DIRETO","","","","", brl(d.diesel||0), brl(d.mdo||0), brl(d.manut||0),
       brl((d.insumo||0)+(d.irrig||0)), brl(d.terc||0), brl(d.direto||0), ""],
      ["","","Arrendamento rateado","","","","","","","","","", brl(d.arrend||0), ""],
      ["","","Administrativo rateado","","","","","","","","","", brl(d.admin||0), ""],
      ["","","Indireto do plano","","","","","","","","","", brl(d.indireto||0), ""],
      ["","","TOTAL DA ETAPA","","","","","","","","","", brl(d.total||0),
       (d.ha>0||d.ton>0) ? brl((d.total||0)/(d.ha>0?d.ha:d.ton),2)+"/"+base[1] : "—"],
      ["","","Base física","","","","","","","","","", base[0]+" "+base[1], ""],
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
             ["","","Equipe de manutenção","","", R.EM.efetivo+" pessoas", brl(R.EM.total)],
             ["","","Materiais de manutenção","","","", brl(R.MT.total)]]));

/* ---------- 11. mão de obra ---------- */
const maoDeObra = R => {
  const PS = R.PS;
  return sec("Mão de Obra","Mão de obra — cargos, efetivo e quadro",
    ["Cod","Cargo","Conta","Salário","Custo mensal","Custo/hora","Efetivo dimensionado","Pico mensal","Custo no período"],
    CFG.funcoes.map(f=>{ const c=R.MP.custoFuncao[f.cod]||{}, o=(PS&&PS.porFun[f.cod])||{};
      return [f.cod, f.nome, f.conta, brl(f.sal,2), brl(c.mensal||0,2), brl(c.hora||0,2),
        o.qtd?fmt(o.qtd):"—", o.pico?fmt(o.pico):"—", o.custo?brl(o.custo):"—"];})
    .concat([["","TOTAL","","","","", PS?fmt(PS.qtd):"—", PS?fmt(Math.max(...PS.qtdMes)):"—",
      PS?brl(PS.custo):brl(R.mdoTotal)]]));
};
const pessoasDept = R => sec("Pessoas por depto","Pessoas por departamento",
  ["Departamento","Efetivo","Pico mensal","Custo MDO"],
  R.PS ? Object.entries(R.PS.porDept).sort((a,b)=>deptIdx(a[0])-deptIdx(b[0]))
    .map(([d,o])=>[d, fmt(o.qtd), fmt(o.pico), brl(o.custo)])
    .concat([["TOTAL", fmt(R.PS.qtd), fmt(Math.max(...R.PS.qtdMes)), brl(R.PS.custo)]]) : []);
const fluxoMdo = R => sec("Fluxo MDO","Fluxo mensal — pessoas e custo de mão de obra",
  ["Mês","Período","Pessoas","Custo MDO","Acumulado"],
  R.PS ? (()=>{ let ac=0; return MESES.map((m,i)=>{ ac+=R.PS.custoMes[i];
    return [m, periodoMes(i)==="safra"?"Safra":"Entressafra", fmt(R.PS.qtdMes[i]),
            brl(R.PS.custoMes[i]), brl(ac)]; }); })() : []);

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
const tratamentos = R => sec("Tratamentos","Tratamentos — composição, etapa e uso no plano",
  ["Cod_Trat","Nome","Etapas marcadas","Etapas em que o plano usa","Produtos","Composição",
   "Custo/ha","Atividades que usam","Área tratada","Custo no plano"],
  tratListaTodos().map(t=>{
    const usos = R.L.filter(r=>r.trat===t.cod && r.total>0);
    const area = usos.reduce((s,u)=>s+u.total,0);
    const marc = tratEtapas(t.cod).map(e=>TRAT_ETAPAS[e].nome).join(" · ");
    const plano = etapasNoPlano(t.cod).map(e=>TRAT_ETAPAS[e].nome).join(" · ");
    return [t.cod, TRAT_NOME[t.cod]||"—", marc||"sem marcação", plano||"—",
      composicao(t.cod).length,
      composicao(t.cod).map(l=>l.prod+" "+fmt(num(l.dose),2)+" "+(l.un||"")).join(" · ")||"—",
      t.custo_ha>0?brl(t.custo_ha,2):"—", usos.map(u=>u.a.cod).join(", ")||"—",
      area>0?fmt(area)+" ha":"—", area>0?brl(area*t.custo_ha):"—"];}));

/* ---------- 13. arrendamentos ---------- */
const arrendamentos = R => sec("Arrendamentos","Arrendamentos — fazendas e rateio",
  ["Fazenda","Grupo","Área (ha)","Forma de pagamento","Valor informado","Periodicidade",
   "Pagamentos por ano","Meses de pagamento","Parcelas na janela","Valor da parcela","R$/ha/ano",
   "Custo anual","Custo no orçamento"],
  R.AR.linhas.map(l=>[l.faz, l.grupo, fmt(l.area), (ARR_FORMAS[l.forma]||{nome:l.forma}).nome,
    (ARR_BASE[l.vbase]||{}).nome||l.vbase, l.pag, l.pagsAno, l.agenda,
    l.nParc||"—", l.nParc?brl(l.parcela):"—",
    brl(l.rsHaAno,2), brl(l.anual), brl(l.periodo)])
  .concat([["TOTAL","", fmt(R.AR.area), "", "", "", "", "",
    R.AR.linhas.reduce((s,l)=>s+l.nParc,0), "",
    R.AR.area>0?brl(R.AR.anual/R.AR.area,2):"—", brl(R.AR.anual), brl(R.AR.total)]])
  .concat(ETAPAS_ORD.filter(e=>R.etapas[e]&&R.etapas[e].arrend>0)
    .map(e=>["↳ rateio "+e, "", "", fmt(arrRat(e),1)+"% de referência", "", "", "", "", "", "", "", "",
      brl(R.etapas[e].arrend)]))
  .concat(MESES.map((m,i)=>["↳ pagamento em "+m, "", "", "", "", "", "", "",
    R.AR.linhas.filter(l=>l.pmes.includes(i)).length||"—", "", "", "", brl(R.AR.mes[i])])));

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
const administracao = R => sec("Administração","Custos administrativos e rateio",
  ["Grupo","Natureza do gasto","R$/mês","Critério de rateio","Centro de custo","Total no período","Rateio"],
  R.ADM.linhas.map((l,i)=>{ const st=R.AD.porLinha[i]||{};
    return [ADM_GRUPOS[l.grupo]||l.grupo, l.desc, brl(l.mensal), (ADM_CRITERIOS[l.crit]||{}).nome||l.crit, l.cc||"—",
            brl(l.total), l.total<=0 ? "—" : (st.rateado>0?"rateado":(st.motivo||"sem rateio"))];})
  .concat([["","TOTAL", brl(R.ADM.mensal), "", "", brl(R.ADM.total), ""]])
  .concat(Object.keys(R.etapas).map(e=>["↳ rateio", e, "", "", "", brl(R.etapas[e].admin||0), ""]))
  .concat(R.AD.semRateio>0 ? [["↳ sem base","volta para o rateio indireto","","","", brl(R.AD.semRateio),""]] : []));

/* ---------- 16. custos ---------- */
const custoEtapa = R => sec("Custos","Custo por etapa",
  ["Etapa","Diesel","Mão de obra","Manutenção","Insumos","Terceirização","Arrendamento","Administrativo",
   "Indireto","Total","% do total","Base física","Custo unitário"],
  Object.entries(R.etapas).sort((a,b)=>b[1].total-a[1].total).map(([e,d])=>{
    const base = d.ha>0?[fmt(d.ha),"ha"]:[fmt(d.ton||0),"t"];
    const q = d.ha>0?d.ha:d.ton;
    return [e, brl(d.diesel), brl(d.mdo), brl(d.manut), brl(d.insumo+(d.irrig||0)), brl(d.terc),
      brl(d.arrend||0), brl(d.admin||0), brl(d.indireto), brl(d.total),
      fmt(d.total/totEtapas(R)*100,1)+"%", base[0]+" "+base[1], q>0?brl(d.total/q,2)+"/"+base[1]:"—"];}));
const natureza = R => sec("Natureza","Composição por natureza",["Natureza","Total","%","R$/ha plantado"],
  comps(R).filter(([,v])=>v>0).map(([n,v])=>[n, brl(v), fmt(R.total>0?v/R.total*100:0,1)+"%",
    brl(v/(P.plantio||1),2)])
  .concat([["TOTAL", brl(R.total), "100,0%", brl(R.total/(P.plantio||1),2)]]));
const mensal = R => sec("Mensal","Custo mensal e grandes contas",
  ["Mês","Período",...Object.values(CAT_LBL),"Total","Acumulado"],
  (()=>{ let ac=0; return MESES.map((m,i)=>{ ac+=R.meses[i];
    return [m, periodoMes(i)==="safra"?"Safra":"Entressafra",
      ...Object.keys(CAT_LBL).map(k=>brl(R.mesesCat[k][i])), brl(R.meses[i]), brl(ac)];});})()
  .concat([["TOTAL","", ...Object.keys(CAT_LBL).map(k=>brl(R.mesesCat[k].reduce((s,v)=>s+v,0))),
    brl(R.total), ""]]));
const periodos = R => sec("Períodos","Custos por período — safra e entressafra",
  ["Grande conta","Safra (abr a nov)","Entressafra (dez a mar)","Total"],
  Object.keys(CAT_LBL).map(k=>[CAT_LBL[k], brl(R.PER.safra.cat[k]), brl(R.PER.entressafra.cat[k]),
    brl(R.PER.safra.cat[k]+R.PER.entressafra.cat[k])])
  .concat([["TOTAL", brl(R.PER.safra.total), brl(R.PER.entressafra.total), brl(R.total)]]));

/* ---------- 17. plano de contas ---------- */
const contas = R => { const CV = contasValores(R);
  return sec("Plano de Contas","Plano de contas — custo projetado",
    ["Conta","Descrição","Grupo","Natureza","Classificação","Custo projetado"],
    CFG.contas.map(c=>{ const comb=CONTA_COMBINADA[c.conta];
      return [c.conta, c.desc, c.grupo, c.nat, c.cls,
        comb?"incluído em "+comb:(CV[c.conta]!=null?brl(CV[c.conta]):"—")];}));
};

/* ---------- 18. fluxo de caixa ---------- */
const fluxo = R => sec("Fluxo de Caixa","Fluxo de caixa agrícola",
  ["Mês","Período","Desembolso","% do total","Acumulado","% acumulado"],
  (()=>{ let ac=0; return MESES.map((m,i)=>{ ac+=R.meses[i];
    return [m, periodoMes(i)==="safra"?"Safra":"Entressafra", brl(R.meses[i]),
      fmt(R.total>0?R.meses[i]/R.total*100:0,1)+"%", brl(ac),
      fmt(R.total>0?ac/R.total*100:0,1)+"%"];});})()
  .concat([["TOTAL","", brl(R.total), "100,0%", "", ""]])
  .concat(Object.keys(PERIODOS).map(p=>["↳ "+PERIODOS[p], "", brl(R.PER[p].total),
    fmt(R.total>0?R.PER[p].total/R.total*100:0,1)+"%", "", ""])));

/* ---------- 19. cenários ---------- */
const cenarios = R => {
  const linhas = [];
  const base = [["Diesel", R.dieselT], ["Mão de obra", R.mdoTotal], ["Insumos", R.insumoT],
    ["Manutenção e materiais", R.manutT], ["Arrendamento", R.arrT], ["Administração", R.admT]];
  [5,10].forEach(v=>{
    base.forEach(([nome, valor])=>{
      const d = valor*v/100;
      linhas.push([`${nome} +${v}%`, brl(valor), brl(d), brl(R.total+d),
        fmt(R.total>0?d/R.total*100:0,2)+"%", brl((R.total+d)/(P.plantio||1),2)]);
    });
  });
  base.forEach(([nome, valor])=>{
    const d = valor*0.10;
    linhas.push([`${nome} −10%`, brl(valor), brl(-d), brl(R.total-d),
      fmt(R.total>0?-d/R.total*100:0,2)+"%", brl((R.total-d)/(P.plantio||1),2)]);
  });
  return sec("Cenários","Cenários — sensibilidade do custo total",
    ["Cenário","Valor na base","Variação em R$","Custo total no cenário","Impacto no total","R$/ha plantado"],
    [["Base (plano atual)", brl(R.total), "—", brl(R.total), "—", brl(R.total/(P.plantio||1),2)]]
      .concat(linhas));
};

/* ---------- 20. validação ---------- */
const validacao = R => sec("Validação","Validação do plano",["Situação","Verificação","Detalhe"],
  validar(R).map(v=>[v.ok?"OK":"PENDENTE", v.t, v.d||""]));

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

const porCentroCusto = R => sec("Centro de Custo","Orçamento por centro de custo",
  ["Centro de custo (etapa)","Custo direto","Arrendamento","Administrativo","Indireto","Total",
   "% do total","Hectares","Toneladas","Horas"],
  Object.entries(R.etapas).sort((a,b)=>b[1].total-a[1].total).map(([e,d])=>[e, brl(d.direto),
    brl(d.arrend||0), brl(d.admin||0), brl(d.indireto||0), brl(d.total),
    fmt(d.total/totEtapas(R)*100,1)+"%", fmt(d.ha), fmt(d.ton), fmt(d.horas||0)])
  .concat([["TOTAL", brl(R.diretoSum), brl(R.arrT), brl(R.admT), brl(R.indiretoPool),
    brl(totEtapas(R)), "100,0%", fmt(R.haOp), "", fmt(R.horasT)]]));

const porAtividade = R => sec("Por Atividade","Orçamento por atividade", CAB_ATIV.concat(["Etapa","Função"]),
  R.L.filter(r=>r.total>0).sort((a,b)=>b.direto-a.direto)
    .map(r=>linhaAtiv(r).concat([r.a.etapa, r.fcod+" · "+r.fnome])));

const indicadores = R => {
  const ton = R.FORN.tonTotal, ha = P.plantio||1;
  const colh = R.etapas["COLHEITA"]||{};
  return sec("Indicadores","Indicadores de custo",["Indicador","Valor","Base"],[
    ["Custo total", brl(R.total), MESES.length+" meses"],
    ["Custo por hectare plantado", brl(R.total/ha,2)+"/ha", fmt(ha)+" ha"],
    ["Custo por tonelada moída", ton>0?brl(R.total/ton,2)+"/t":"—", fmt(ton)+" t"],
    ["Custo médio da matéria-prima", ton>0?brl(R.FORN.rsTMedio,2)+"/t":"—", "todas as origens"],
    ["Custo por kg de ATR", R.FORN.atrTotal>0?brl(R.FORN.rsAtrMedio,4)+"/kg":"—", "ATR médio "+fmt(R.FORN.atrMedio,1)],
    ["Custo da cana própria", R.FORN.origens.propria.ton>0?brl(R.FORN.origens.propria.rsT,2)+"/t":"—", "produção"],
    ["Custo da cana de fornecedor", R.FORN.origens.fornecedor.ton>0?brl(R.FORN.origens.fornecedor.rsT,2)+"/t":"—", "aquisição"],
    ["Custo de colheita por tonelada", colh.ton>0?brl(colh.total/colh.ton,2)+"/t":"—", "etapa colheita"],
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

const logistica = R => sec("Logística","Orçamento de logística",
  ["Item","Volume","Horas","Frota","Custo","Observação"],
  R.TR.blocos.filter(b=>b.ton>0).map(b=>[b.nome||"—", fmt(b.ton)+" t", fmt(b.horas), b.frotaR,
    brl(b.total), "raio e ciclo das premissas"])
  .concat(R.TP.linhas.map(l=>[l.rota, fmt(l.kmRota)+" km", "", l.qtd, brl(l.total),
    l.veic+" · "+fmt(l.cap)+" lugares"]))
  .concat(R.FORN.linhas.filter(l=>l.frete>0).map(l=>["Frete de fornecedor · "+l.forn,
    fmt(l.ton)+" t", "", "", brl(l.frete), fmt(l.dist)+" km a "+brl(l.freteT,2)+"/t"]))
  .concat([["TOTAL","","","", brl(R.TR.total+R.tpessT+R.FORN.linhas.reduce((s,l)=>s+l.frete,0)), ""]]));

const planoOperacional = R => sec("Plano Operacional","Plano Operacional",
  ["Cod","Etapa","Atividade","Un",...MESES,"Total","Tratamento"],
  R.L.filter(r=>r.total>0).map(r=>[r.a.cod, r.a.etapa, r.a.nome, r.a.un,
    ...r.meses.map(m=>fmt(num(m))), fmt(r.total), r.trat||"—"]));

const dimensionamento = R => sec("Dimensionamento","Dimensionamento por atividade",
  ["Cod","Atividade","Volume","Rendimento","Utilização","Horas","Frota","Turnos","Escala","Fator","Efetivo","Máquina","Implemento"],
  R.L.filter(r=>r.total>0).map(r=>[r.a.cod, r.a.nome, fmt(r.total), fmt(r.rend,2), pct(r.util),
    fmt(r.horas), r.frotaR, (r.partes[0]?r.partes[0].turnosEf:r.a.turnos)+"t", r.escala||"padrão",
    fmt(r.fator,2), fmt(r.efetivo), r.maqEfetiva, r.impEfetivo]));

const combustivel = R => sec("Combustível","Combustível — diesel projetado",
  ["Mês","Período","Litros operação","Litros apoio","Litros total","Preço (R$/L)","Custo"],
  MESES.map((m,i)=>[m, periodoMes(i)==="safra"?"Safra":"Entressafra", fmt(R.CB.litrosOperMes[i]),
    fmt(R.CB.litrosApoioMes[i]), fmt(R.CB.litrosOperMes[i]+R.CB.litrosApoioMes[i]),
    brl(R.CB.preco[i],2), brl(R.CB.custoOperMes[i]+R.CB.custoApoioMes[i])])
  .concat([["TOTAL","","","", fmt(R.CB.litrosT), R.CB.litrosT>0?brl(R.dieselT/R.CB.litrosT,2):"—",
    brl(R.dieselT)]]));

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

/* ---------- catálogo ---------- */
const SECOES = {
  resumo, premissas, area, producao,
  plantio: porEtapa("Plantio","Orçamento de plantio","PLANTIO"),
  preparo: porEtapa("Preparo de Solo","Orçamento de preparo de solo","PREPARO DE SOLO"),
  tratos:  porEtapa("Tratos","Orçamento de tratos culturais","TRATOS CULTURAIS"),
  colheita:porEtapa("Colheita","Orçamento de colheita","COLHEITA"),
  apoioEtapa: porEtapa("Apoio e Conservação","Orçamento de apoio e conservação","APOIO E CONSERVAÇÃO"),
  transporte, frota, frotaBase, modelos, manutencao, maoDeObra, pessoasDept, fluxoMdo, insumos,
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
     "Meta/dia por equipamento","Horas/dia por equipamento","Meta/dia da frota","Custo"],
    lin.map(m=>[m.cod, m.nome, m.etapa, fmt(m.total), m.un,
      m.janela ? (m.janela.fonte==="datas" ? m.janela.ini+" a "+m.janela.fim : fmt(m.janela.meses,1)+" meses") : "—",
      fmt(m.rend,2)+" "+m.un+"/h", fmt(m.frota), fmt(m.efetivo),
      m.meta ? fmt(m.meta.qEquipDia,1)+" "+m.un : "—",
      m.meta ? fmt(m.meta.hEquipDia,1)+" h" : "—",
      m.meta ? fmt(m.meta.qFrotaDia,1)+" "+m.un : "—",
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
    E.atraso.map(l=>[l.cod, l.nome, GERENCIAS[l.gerencia]||l.gerencia, l.etapa, l.un,
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
  return sec("Acompanhamento", "Execução do plano — plano x realizado",
    ["Cod","Atividade","Gerência","Unid.", ...MESES.map(m=>m+" plano"), ...MESES.map(m=>m+" real"),
     "Plano medido","Realizado","Aderência","A fazer"],
    ex.linhas.map(l=>[l.cod, l.nome, GERENCIAS[l.gerencia]||l.gerencia, l.un,
      ...l.meses.map(m=>fmt(m.plano)),
      ...l.meses.map(m=>m.real!=null?fmt(m.real):"—"),
      fmt(l.planoAte), l.lancados?fmt(l.realizado):"—",
      l.aderencia!=null?pct(l.aderencia):"—", fmt(l.saldo)]));
};

/* Os 20 relatórios. `secoes` é a ordem em que as abas ou blocos saem. */
const RELATORIOS = [
  {id:"anual",   nome:"Orçamento Agrícola Anual",     secoes: ABAS_COMPLETO},
  {id:"fazenda", nome:"Orçamento por Fazenda",        secoes:["resumo","porFazenda","arrendamentos","fornecedores"]},
  {id:"cc",      nome:"Orçamento por Centro de Custo",secoes:["resumo","porCentroCusto","custoEtapa","administracao"]},
  {id:"ativ",    nome:"Orçamento por Atividade",      secoes:["resumo","porAtividade","planoOperacional","dimensionamento"]},
  {id:"nat",     nome:"Orçamento por Natureza",       secoes:["resumo","natureza","custoEtapa","contas"]},
  {id:"mensal",  nome:"Orçamento Mensal",             secoes:["resumo","mensal","periodos","fluxo"]},
  {id:"plantio", nome:"Orçamento de Plantio",         secoes:["plantio","preparo","insumos","tratamentos","dimensionamento"]},
  {id:"tratos",  nome:"Orçamento de Tratos",          secoes:["tratos","insumos","tratamentos","irrigacao","dimensionamento"]},
  {id:"colheita",nome:"Orçamento de Colheita",        secoes:["colheita","transporte","combustivel","dimensionamento"]},
  {id:"log",     nome:"Orçamento de Logística",       secoes:["logistica","transporte","combustivel"]},
  {id:"frota",   nome:"Orçamento de Frota",           secoes:["frota","frotaBase","manutencao","apoio","combustivel"]},
  {id:"mdo",     nome:"Orçamento de Mão de Obra",     secoes:["maoDeObra","pessoasDept","fluxoMdo"]},
  {id:"arrend",  nome:"Orçamento de Arrendamentos",   secoes:["arrendamentos","porFazenda"]},
  {id:"forn",    nome:"Orçamento de Fornecedores",    secoes:["fornecedores","producao","logistica"]},
  {id:"caixa",   nome:"Fluxo de Caixa Agrícola",      secoes:["fluxo","mensal","periodos"]},
  {id:"indic",   nome:"Indicadores de Custo",         secoes:["indicadores","natureza","cenarios"]},
  {id:"metaAgr", nome:"Metas — Gerência Agrícola",    secoes:["metasAgricola","planoOperacional","dimensionamento"]},
  {id:"metaLog", nome:"Metas — Gerência de Logística",secoes:["metasLogistica","transporte","combustivel"]},
  {id:"metaMan", nome:"Metas — Gerência de Manutenção",secoes:["metasManutencao","frota","manutencao"]},
  {id:"acomp",   nome:"Acompanhamento do Plano",      secoes:["excecoes","porGerencia","acompanhamento","metasAgricola","metasLogistica","metasManutencao"]},
];

/* Seções extras que só saem no nível detalhado do relatório anual. */
const DETALHE = ["planoOperacional","dimensionamento","porAtividade","porCentroCusto","porFazenda",
  "mensal","periodos","natureza","combustivel","apoio","irrigacao","pessoasDept","fluxoMdo",
  "logistica","indicadores","frotaBase","modelos","preparo","apoioEtapa","tratamentos"];

function montarSecoes(R, relId, nivel){
  const rel = RELATORIOS.find(r=>r.id===relId) || RELATORIOS[0];
  let ids = rel.secoes.slice();
  if(rel.id==="anual" && nivel==="detalhado") ids = ids.concat(DETALHE.filter(d=>!ids.includes(d)));
  return ids.map(id=>SECOES[id]).filter(Boolean).map(f=>f(R)).filter(Boolean);
}

export { ABAS_COMPLETO, RELATORIOS, SECOES, montarSecoes };
