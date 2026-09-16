import { calcular } from '../calculo/index.js';
import { CFG } from '../dados/cfg.js';
import { baixar } from '../io/arquivo.js';
import { salvar } from '../io/persistencia.js';
import { MESES, PERIODOS, periodoMes } from '../nucleo/calendario.js';
import { ESPOR, P } from '../nucleo/estado.js';
import { $, num } from '../nucleo/formato.js';
import { comps } from '../ui/custos.js';
import { pintarPremissas } from '../ui/premissas.js';
import { render } from './ciclo.js';
import { PADRAO } from '../dados/padroes.js';
import { setP } from '../nucleo/estado.js';

/* ---------- ações ---------- */
$("#btn_reset").onclick=()=>{ if(!confirm("Restaurar premissas aos valores padrão? O plano é mantido.")) return;
  setP({...PADRAO}); pintarPremissas(); salvar(true); render(); };
$("#btn_theme").onclick=()=>{ const c=document.documentElement.getAttribute("data-theme");
  document.documentElement.setAttribute("data-theme",c==="dark"?"light":"dark"); };
$("#btn_esp").onclick=()=>{ ESPOR.push({mes:MESES[0],desc:"",cc:CFG.cc_list[0],valor:0,status:"Provisão"});
  salvar(); render(); };
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
  c+="\nMAO DE OBRA\nCod;Funcao;Salario;Custo mensal;Custo hora\n";
  CFG.funcoes.forEach(f=>{const x=R.MP.custoFuncao[f.cod];
    c+=[f.cod,f.nome,f.sal,x.mensal.toFixed(2),x.hora.toFixed(2)].join(";")+"\n";});
  // O BOM faz o Excel abrir o arquivo como UTF-8 em vez de estropiar os acentos.
  await baixar("\uFEFF"+c, "plano_entressafra_crv.csv", "text/csv;charset=utf-8");
};

