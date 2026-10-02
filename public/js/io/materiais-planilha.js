/**
 * Planilha de materiais do ERP (exportação "TCO13T") -> itens do Cadastro de Materiais.
 *
 * Função pura: recebe as linhas já lidas (`XLSX.utils.sheet_to_json(ws, {header:1})`)
 * e devolve os itens. Quem lê o arquivo e envia ao servidor é ui/materiais-cad.js.
 *
 * As colunas são reconhecidas PELO NOME do cabeçalho (sem acento, caixa ou espaço
 * sobrando), não pela posição — a exportação pode mudar de ordem. A primeira coluna
 * da exportação, "Código da Empresa de Compras", é constante e fica de fora: o código
 * do material é a coluna "Código". Coluna que o cadastro não usa (embalagem, cor,
 * vasilhame, tolerâncias, princípio ativo...) vem vazia ou constante no ERP e é ignorada.
 */

const COLUNAS = {
  codigo: 'codigo',
  descricao: 'descricao',
  compl1: 'descricao complementar 1',
  compl2: 'descricao complementar 2',
  saldo: 'saldo atual',
  grupo: 'grupo de produto',
  un: 'unidade medida consumo',
  utiliza_custo: 'utiliza no custo',
  nbm: 'codigo nbm',
  tipo: 'tipo de produto',
};

const normalizar = h => String(h == null ? '' : h)
  .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

const texto = v => String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
// 1308543 vem como número do Excel; vira "1308543", sem ".0" nem notação científica
const codigoDe = v => typeof v === 'number' && Number.isFinite(v) ? String(v) : texto(v);
const numeroDe = v => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const n = Number(texto(v).replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

/**
 * @param {Array<Array>} linhas  planilha inteira, cabeçalho incluso
 * @returns {{itens, lidas, semCodigo, repetidas, colunas, faltando}}
 */
function extrairMateriais(linhas) {
  // cabeçalho: a primeira linha (entre as 10 primeiras) que tem "Código" e "Descrição"
  let cab = -1, pos = null;
  for (let i = 0; i < Math.min(10, linhas.length) && cab < 0; i++) {
    const nomes = (linhas[i] || []).map(normalizar);
    if (nomes.includes(COLUNAS.codigo) && nomes.includes(COLUNAS.descricao)) {
      cab = i;
      pos = Object.fromEntries(Object.entries(COLUNAS).map(([campo, nome]) => [campo, nomes.indexOf(nome)]));
    }
  }
  if (cab < 0) throw new Error('Não encontrei as colunas "Código" e "Descrição" no começo da planilha. É a exportação de materiais do ERP?');

  const itens = [], vistos = new Set();
  let lidas = 0, semCodigo = 0, repetidas = 0;
  const pegar = (l, campo) => pos[campo] >= 0 ? l[pos[campo]] : null;
  for (let i = cab + 1; i < linhas.length; i++) {
    const l = linhas[i];
    if (!l || !l.some(c => c !== null && c !== undefined && c !== '')) continue;   // linha em branco
    lidas++;
    const codigo = codigoDe(pegar(l, 'codigo'));
    if (!codigo) { semCodigo++; continue; }
    if (vistos.has(codigo)) { repetidas++; continue; }
    vistos.add(codigo);
    itens.push({
      codigo,
      descricao: texto(pegar(l, 'descricao')),
      compl1: texto(pegar(l, 'compl1')),
      compl2: texto(pegar(l, 'compl2')),
      grupo: texto(pegar(l, 'grupo')),
      un: texto(pegar(l, 'un')),
      saldo: numeroDe(pegar(l, 'saldo')),
      tipo: texto(pegar(l, 'tipo')),
      utiliza_custo: texto(pegar(l, 'utiliza_custo')),
      nbm: texto(pegar(l, 'nbm')),
    });
  }
  return {
    itens, lidas, semCodigo, repetidas,
    colunas: Object.keys(COLUNAS).filter(c => pos[c] >= 0),
    faltando: Object.keys(COLUNAS).filter(c => pos[c] < 0),
  };
}

export { COLUNAS, extrairMateriais, normalizar };
