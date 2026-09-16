import { CFG } from '../dados/cfg.js';
import { NM } from '../nucleo/calendario.js';
import { P } from '../nucleo/estado.js';

/* ================== TERCEIRIZAÇÃO ================== */
function terceirizacao(L){
  const aerea = L.find(x=>x.a.nome==="Aplicação de Inseticida aéreo");
  const itens = [
    {cod:"T01", desc:"Aplicação aérea de inseticida", cc:CFG.cc_list[2],
     un:"ha", tarifa:P.tercAereaTar, vol: aerea?aerea.total:0},
    {cod:"T02", desc:"Sistematização com escavadeira (terceiro)", cc:CFG.cc_list[1],
     un:"ha", tarifa:P.tercSistTar, vol:P.tercSistHa},
    {cod:"T03", desc:"Outras terceirizações recorrentes", cc:CFG.cc_list[0],
     un:"mês", tarifa:P.tercOutros, vol:NM}
  ];
  itens.forEach(i=> i.total = i.tarifa*i.vol);
  return {itens, total: itens.reduce((s,i)=>s+i.total,0)};
}


export { terceirizacao };
