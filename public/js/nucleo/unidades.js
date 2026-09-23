/**
 * Conversão entre unidades de dose de insumo.
 *
 * A coluna "Un." da composição do tratamento pode ser outra unidade da
 * família do cadastro — dosar em kg/ha um produto comprado em ton, ou em
 * g/ha um comprado em kg — sem mexer no preço, que é sempre por unidade do
 * cadastro (ADUBO 16.00.20 SUPER N é comprado em ton; lançar a dose em kg/ha
 * é só conveniência de digitação, o custo por hectare tem de sair igual).
 *
 * Só converte dentro da mesma família (massa ou volume): não há como
 * converter kg em litro sem densidade, que o cadastro não guarda.
 *
 * Dois furos faziam a dose entrar crua no custo, e o custo/ha sair mil vezes
 * maior: Flumyzin a 50 ml/ha, com preço de R$ 143,52 por litro, custava
 * R$ 7.176,00/ha em vez de R$ 7,18.
 *   1. A unidade chega escrita de vários jeitos — "lt/ha", "Kg", "lt/há",
 *      "L" — e só "lt", "kg", "ml", "g" e "ton" exatos eram reconhecidos.
 *      Agora toda unidade passa por normUn antes da conta.
 *   2. Produto sem unidade no cadastro (os que vieram só com nome e preço)
 *      não tinha base para converter. O preço desses é por litro ou por
 *      quilo — é como veio da planilha e do ERP —, então a base passa a ser
 *      a unidade de preço da família da dose: lt para volume, kg para massa.
 */
const FATOR_BASE = { g: 0.001, kg: 1, ton: 1000, ml: 0.001, lt: 1 };
const FAMILIA = { g: "massa", kg: "massa", ton: "massa", ml: "volume", lt: "volume" };
// unidade de preço de cada família, quando o cadastro não diz
const PRECO_DA_FAMILIA = { massa: "kg", volume: "lt" };

const ALIAS = {
  l: "lt", lt: "lt", lts: "lt", litro: "lt", litros: "lt",
  ml: "ml", mililitro: "ml", mililitros: "ml",
  kg: "kg", kgs: "kg", quilo: "kg", quilos: "kg",
  g: "g", gr: "g", grs: "g", grama: "g", gramas: "g",
  t: "ton", ton: "ton", tonelada: "ton", toneladas: "ton",
};
/** Unidade como a conta entende: minúscula, sem espaço e sem o "/ha" da
    dose ("lt/ha" → "lt", "Kg" → "kg", "L" → "lt"). Unidade que não é de
    massa nem de volume (pc, un, fr...) volta só minúscula. */
function normUn(u){
  const s = String(u || "").trim().toLowerCase().replace(/\s+/g, "").replace(/\/h[aá]$/, "");
  return ALIAS[s] || s;
}

/** Unidade em que o preço do insumo está. É a do cadastro; sem ela, a de
    preço da família em que a dose foi lançada (lt ou kg). Sem nenhuma das
    duas, "" — e aí não há o que converter. */
function unPreco(unBase, unLinha){
  const b = normUn(unBase);
  if(b) return b;
  const fam = FAMILIA[normUn(unLinha)];
  return fam ? PRECO_DA_FAMILIA[fam] : "";
}

/** Unidades em que a dose de um produto pode ser lançada, menor pra maior.
    Com a unidade do cadastro conhecida, as da família dela. Sem unidade no
    cadastro, todas as de massa e volume: é a escolha da dose que diz a
    família. Unidade de outro tipo (pc, un...) só tem ela mesma. */
function unidadesDaFamilia(unBase){
  const b = normUn(unBase);
  if(!b) return Object.keys(FAMILIA);
  const fam = FAMILIA[b];
  if(!fam) return [b];
  return Object.keys(FAMILIA).filter(u => FAMILIA[u] === fam);
}

/** Fator que multiplica uma dose lançada em `unLinha` para virar dose na
    unidade do preço (`unBase`, a do cadastro). Unidade igual, desconhecida
    ou de família diferente: 1 — não converte, mais seguro que adivinhar
    uma correspondência que não existe. */
function fatorParaBase(unLinha, unBase){
  const l = normUn(unLinha), b = unPreco(unBase, unLinha);
  if(!l || !b || l === b) return 1;
  if(!FAMILIA[l] || FAMILIA[l] !== FAMILIA[b]) return 1;
  return FATOR_BASE[l] / FATOR_BASE[b];
}

export { FATOR_BASE, FAMILIA, fatorParaBase, normUn, unPreco, unidadesDaFamilia };
