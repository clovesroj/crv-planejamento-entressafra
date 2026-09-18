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
 */
const FATOR_BASE = { g: 0.001, kg: 1, ton: 1000, ml: 0.001, lt: 1 };
const FAMILIA = { g: "massa", kg: "massa", ton: "massa", ml: "volume", lt: "volume" };

/** Unidades da família de `unBase` (a do cadastro do insumo), menor pra
    maior. Família desconhecida (pc, un, "") não tem alternativa de dose —
    devolve só ela mesma, ou nada se também estiver vazia. */
function unidadesDaFamilia(unBase){
  const fam = FAMILIA[unBase];
  if(!fam) return unBase ? [unBase] : [];
  return Object.keys(FAMILIA).filter(u => FAMILIA[u] === fam);
}

/** Fator que multiplica uma dose lançada em `unLinha` para virar dose na
    unidade do cadastro (`unBase`) — a que o preço do insumo usa. Unidade
    vazia, igual à base, desconhecida ou de família diferente: 1 (não
    converte — mais seguro que adivinhar uma correspondência que não existe). */
function fatorParaBase(unLinha, unBase){
  if(!unLinha || !unBase || unLinha === unBase) return 1;
  if(FAMILIA[unLinha] !== FAMILIA[unBase]) return 1;
  return FATOR_BASE[unLinha] / FATOR_BASE[unBase];
}

export { FATOR_BASE, FAMILIA, unidadesDaFamilia, fatorParaBase };
