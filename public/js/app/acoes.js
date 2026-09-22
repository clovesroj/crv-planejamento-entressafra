import { calcular } from '../calculo/index.js';
import { calcularCompleto } from './ciclo.js';
import { CFG } from '../dados/cfg.js';
import { FORN_LINHA } from '../dados/fornecedores.js';
import { ADM_GRUPOS } from '../dados/administrativo.js';
import { baixar } from '../io/arquivo.js';
import { salvar } from '../io/persistencia.js';
import { MESES, PERIODOS, periodoMes } from '../nucleo/calendario.js';
import { ESPOR, P, admLista, fornLista } from '../nucleo/estado.js';
import { $, num } from '../nucleo/formato.js';
import { comps } from '../ui/custos.js';
import { pintarPremissas } from '../ui/premissas.js';
import { render } from './ciclo.js';
import { PADRAO } from '../dados/padroes.js';
import { setP } from '../nucleo/estado.js';

/* ---------- ações ---------- */
$("#btn_reset").onclick=()=>{ if(!confirm("Restaurar premissas aos valores padrão? O plano é mantido.")) return;
  setP({...PADRAO}); pintarPremissas(); salvar(); render(); };
$("#btn_theme").onclick=()=>{ const c=document.documentElement.getAttribute("data-theme");
  document.documentElement.setAttribute("data-theme",c==="dark"?"light":"dark"); };
$("#btn_esp").onclick=()=>{ ESPOR.push({mes:MESES[0],desc:"",cc:CFG.cc_list[0],valor:0,status:"Provisão"});
  salvar(); render(); };
$("#btn_adm_add").onclick=()=>{
  admLista().push({grupo:Object.keys(ADM_GRUPOS)[0], desc:"Nova linha", valor:0, crit:"direto", cc:""});
  salvar(); render();
};
$("#btn_forn_add").onclick=()=>{ fornLista().push({...FORN_LINHA}); salvar(); render(); };
$("#btn_export").onclick=async()=>{
  const R=calcular();
  let c="PLANO OPERACIONAL\nCod;Etapa;Atividade;Un;"+MESES.join(";")+";Total;Tratamento;Funcao;Horas;Frota;Efetivo;Custo direto\n";
  R.L.forEach(r=>c+=[r.a.cod,r.a.etapa,r.a.nome,r.a.un,...r.meses.map(num),r.total,r.trat||"",r.fcod,
    r.horas.toFixed(1),r.frotaR,r.efetivo,r.direto.toFixed(2)].join(";")+"\n");
  c+="\nCOMPOSICAO DE CUSTOS\nNatureza;Total\n";
  comps(R).forEach(([n,v])=>c+=n+";"+v.toFixed(2)+"\n");
  c+="TOTAL;"+R.total.toFixed(2)+"\n";
  c+="\nCUSTO MENSAL\nMes;Periodo;Custo\n";
  MESES.forEach((m,i)=>c+=m+";"+(periodoMes(i)==="safra"?"Safra":"Entressafra")+";"+R.meses[i].toFixed(2)+"\n");
  c+="\nCUSTO POR PERIODO\nPeriodo;Custo\n";
  Object.keys(PERIODOS).forEach(p=>c+=PERIODOS[p]+";"+R.PER[p].total.toFixed(2)+"\n");
  const RC=calcularCompleto();
  c+="\nMATERIA-PRIMA POR ORIGEM\nOrigem;Natureza;Area ha;Toneladas;ATR medio;Custo;R$/t;R$/kg ATR\n";
  Object.values(RC.FORN.origens).forEach(o=>c+=[o.nome,o.nat,o.area.toFixed(0),o.ton.toFixed(2),
    o.atrMedio.toFixed(1),o.custo.toFixed(2),o.rsT.toFixed(2),o.rsAtr.toFixed(4)].join(";")+"\n");
  c+=["MEDIA PONDERADA","","",RC.FORN.tonTotal.toFixed(2),RC.FORN.atrMedio.toFixed(1),
    RC.FORN.custoTotal.toFixed(2),RC.FORN.rsTMedio.toFixed(2),RC.FORN.rsAtrMedio.toFixed(4)].join(";")+"\n";
  c+="\nFORNECEDORES DE CANA\nFornecedor;Propriedade;Origem;Modalidade;Area ha;TCH;t contratadas;t estimadas;ATR;Preco;Premio;Descontos;Frete R$/t;Logistica;Distancia km;Entrega;Qualidade;Safra anterior t;Custo;R$/t\n";
  RC.FORN.linhas.forEach(l=>c+=[l.forn,l.prop,l.origem,l.mod,l.area,l.tch,l.tonContr,l.ton.toFixed(2),
    l.atr,l.preco,l.premio,l.desc,l.freteT.toFixed(2),l.logist,l.dist,l.mesesEnt.join(" a "),l.qual,
    l.tonHist,l.custo.toFixed(2),l.rsT.toFixed(2)].join(";")+"\n");
  c+="\nMAO DE OBRA\nCod;Funcao;Salario;Custo mensal;Custo hora\n";
  CFG.funcoes.forEach(f=>{const x=R.MP.custoFuncao[f.cod];
    c+=[f.cod,f.nome,f.sal,x.mensal.toFixed(2),x.hora.toFixed(2)].join(";")+"\n";});
  // O BOM faz o Excel abrir o arquivo como UTF-8 em vez de estropiar os acentos.
  await baixar("\uFEFF"+c, "plano_entressafra_crv.csv", "text/csv;charset=utf-8");
};

