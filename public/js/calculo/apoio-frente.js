import { CATEGORIAS_FUNCAO } from '../dados/mao-de-obra.js';
import { erpDe } from '../dados/atividades-erp.js';
import { DIM } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';

/* ================== APOIO DA FRENTE ==================
   Operacao de apoio nao tem area para lancar, mas tem gente e tem maquina: a
   pipa que molha o carreador, a area de vivencia, o onibus que leva a turma, o
   auxiliar rural que retampa o sulco. No ERP cada uma tem codigo proprio
   (dados/atividades-erp.js, lista `a` do de-para); no plano elas estavam
   invisiveis — o Plantio pedia dez conjuntos e nenhuma pipa.

   Aqui elas ganham quantidade e efetivo, presos a frente: rodam nos MESES em
   que a atividade principal tem volume, e param quando ela para. Um equipamento
   por frente e o padrao; a gente sai da mesma conta das outras atividades
   (quantidade x operadores x turnos x fator de escala), com os turnos da frente.

   O QUE ELE E o dimensionamento — quanta maquina e quanta gente a frente
   precisa. O QUE ELE NAO E custo: o caminhao pipa, o onibus e o comboio ja sao
   pagos hoje nos Equipamentos de Apoio e no Transporte de Pessoal, e somar de
   novo aqui contaria duas vezes a mesma frota. Por isso o efetivo entra sem
   custo de mao de obra proprio, como ja faz a reserva do transporte de cana. */

/* O que cada item de apoio exige, pela ESPECIALIDADE que o proprio ERP deu.
   Regra curta de proposito: a especialidade ja diz se aquilo e gente, maquina
   ou estrutura, e inventar uma tabela item a item seria inventar dado de
   negocio que ninguem conferiu.
     pessoa     nao tem frota: e gente (auxiliar rural, utilitario de operacao)
     estrutura  tem unidade, nao tem gente (area de vivencia, gerador, implemento)
     maquina    tem unidade e quem a opera (o resto) */
const ESP_PESSOA    = ["556", "551", "550"];
const ESP_ESTRUTURA = ["427", "453", "482", "422", "399", "421", "490", "491", "492", "493", "496", "502"];
const FUNCAO_POR_ESP = {
  "333": "902",   // onibus — motorista
  "327": "902",   // caminhao pipa/bombeiro — motorista
  "320": "902", "322": "902", "325": "902", "326": "902", "329": "902", "331": "902",
  "332": "902", "335": "902", "336": "902", "337": "902", "338": "902", "339": "902",
  "340": "902", "341": "902", "342": "902", "323": "902", "398": "902",
  "301": "902", "302": "902", "310": "902",   // veiculo leve, ambulancia, moto
  "361": "918", "363": "918", "364": "918", "365": "919", "367": "918",   // trator, carregadeira, colhedora
  "390": "917", "391": "917", "392": "917", "393": "917", "395": "917",   // maquina pesada
  "554": "918", "555": "596",
};
const tipoDaEsp = esp =>
  ESP_PESSOA.includes(esp) ? "pessoa" : ESP_ESTRUTURA.includes(esp) ? "estrutura" : "maquina";

/** Itens de apoio de UMA atividade, ja com quantidade, efetivo e meses. */
function apoioDaAtividade(r){
  const {apoio} = erpDe(r.a.cod);
  if(!apoio.length) return [];
  const p0 = r.partes && r.partes.length === 1 ? r.partes[0] : null;
  const turnos = num(p0 ? p0.turnosEf : r.a.turnos) || 1;
  const fator = num(r.fator) || 1;
  const meses = (r.meses || []).map(q => num(q) > 0 ? 1 : 0);
  const ativo = meses.some(v => v > 0);
  const lancado = (DIM[r.a.cod] || {}).apoio || {};
  return apoio.map(e=>{
    const esp = (e.esp && e.esp[0]) || "";
    const tipo = tipoDaEsp(esp);
    /* Quantidade lancada no Dimensionamento da atividade; em branco, um por
       frente. Em item de gente (auxiliar rural) a quantidade e por TURNO: dois
       auxiliares em tres turnos sao seis pessoas, que e como a frente se cobre. */
    const q = num(lancado[e.cod]);
    const qtd = ativo ? (q > 0 ? q : 1) : 0;
    const fcod = tipo === "pessoa" ? "596" : (FUNCAO_POR_ESP[esp] || "596");
    const pessoas = tipo === "estrutura" ? 0 : Math.ceil(qtd * turnos * fator);
    return {erp:e.cod, nome:e.nome, esp, tipo, fcod, qtd, pessoas, turnos,
            frota: tipo === "pessoa" ? 0 : qtd,
            qtdMes: meses.map(v => v * (tipo === "pessoa" ? 0 : qtd)),
            pessoasMes: meses.map(v => v * pessoas)};
  });
}

/** Todo o apoio de frente do plano, uma linha por item e por atividade. */
function apoioDeFrente(L){
  const out = [];
  (L || []).forEach(r=>{
    if(!(r.total > 0)) return;
    apoioDaAtividade(r).forEach(x => out.push({...x, cod:r.a.cod, atividade:r.a.nome, etapa:r.a.etapa}));
  });
  return out;
}

/** Soma por tipo, para o resumo da frente: quantos equipamentos e quanta gente. */
function resumoApoio(itens){
  return itens.reduce((s,x)=>({frota:s.frota + x.frota, pessoas:s.pessoas + x.pessoas}), {frota:0, pessoas:0});
}

export { apoioDaAtividade, apoioDeFrente, resumoApoio, tipoDaEsp };
