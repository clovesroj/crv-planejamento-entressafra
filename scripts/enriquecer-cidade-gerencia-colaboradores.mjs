#!/usr/bin/env node
/**
 * Acrescenta Cidade e Gerência a cada colaborador de
 * public/js/dados/base-colaboradores.js, casando por matrícula com a aba "BD"
 * da planilha de desligamentos (mesmo arquivo do RH, aba diferente da usada
 * por importar-desligamentos.mjs) -- é lá que mora Cidade-Resid/Desc-Gerência,
 * que a base atual não tem.
 *
 * Uso: node scripts/enriquecer-cidade-gerencia-colaboradores.mjs "planilha.xlsx"
 * Reescreve base-colaboradores.js no lugar (sem gravar no banco).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import XLSX from 'xlsx';

const caminho = process.argv[2];
if (!caminho) {
  console.error('Uso: node scripts/enriquecer-cidade-gerencia-colaboradores.mjs <planilha.xlsx>');
  process.exit(1);
}

const ARQUIVO_DESTINO = new URL('../public/js/dados/base-colaboradores.js', import.meta.url);

const CIDADES_CONHECIDAS = {
  CAPINOPOLIS: 'Capinópolis', ITUIUTABA: 'Ituiutaba', IPIACU: 'Ipiaçu',
  'CACHOEIRA DOURADA': 'Cachoeira Dourada', CANAPOLIS: 'Canápolis', UBERLANDIA: 'Uberlândia',
};
const MENORES = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);
// sigla (CTT, RH, II, C.O.A.) mantém como veio; palavra normal vira Primeira-Maiuscula
const tituloCase = s => s.split(' ').map((p, i) => {
  const minusc = p.toLowerCase();
  if (i > 0 && MENORES.has(minusc)) return minusc;
  const letras = p.replace(/[^A-Za-zÀ-ÿ]/g, '');
  if (letras.length > 0 && letras.length <= 3 && letras === letras.toUpperCase()) return p;
  return minusc.replace(/[a-zà-ÿ]/i, c => c.toUpperCase());
}).join(' ');
const cidadeLabel = raw => CIDADES_CONHECIDAS[raw] || tituloCase(raw);

const wb = XLSX.read(readFileSync(caminho));
const linhasBD = XLSX.utils.sheet_to_json(wb.Sheets['BD'], { header: 1, defval: null, raw: true });
const header = linhasBD[0];
const iMat = header.indexOf('Mat-Func'), iCid = header.indexOf('Cidade-Resid'), iGer = header.indexOf('Desc-Gerência');

const porMatricula = new Map();
for (const r of linhasBD.slice(1)) {
  if (r[iMat] == null) continue;
  const cidade = (r[iCid] || '').toString().trim();
  const gerencia = (r[iGer] || '').toString().trim();
  porMatricula.set(String(r[iMat]), {
    cidade: cidade ? cidadeLabel(cidade) : '',
    gerencia: gerencia ? tituloCase(gerencia) : '',
  });
}

const listaOrdenada = valores => [...new Set(valores)].sort((a, b) => a.localeCompare(b, 'pt-BR'));
const CIDADES = [...listaOrdenada([...porMatricula.values()].map(v => v.cidade).filter(Boolean)), ''];
const GERENCIAS = [...listaOrdenada([...porMatricula.values()].map(v => v.gerencia).filter(Boolean)), ''];
const idxCidade = new Map(CIDADES.map((c, i) => [c, i]));
const idxGerencia = new Map(GERENCIAS.map((g, i) => [g, i]));
const SEM_CIDADE = idxCidade.get('');
const SEM_GERENCIA = idxGerencia.get('');

const { BASE_COLABORADORES } = await import(ARQUIVO_DESTINO);
let semCorrespondencia = 0;
const registros = BASE_COLABORADORES.map(r => {
  const info = porMatricula.get(String(r.m));
  if (!info) semCorrespondencia++;
  return {
    ...r,
    ci: info ? idxCidade.get(info.cidade) : SEM_CIDADE,
    g: info ? idxGerencia.get(info.gerencia) : SEM_GERENCIA,
  };
});

const jsArr = arr => JSON.stringify(arr);
const jsRegistro = r => `{m:${r.m},n:${JSON.stringify(r.n)},f:${r.f},cl:${r.cl},s:${r.s},se:${r.se},fr:${r.fr},d:${r.d},a:${JSON.stringify(r.a)},c:${r.c},ci:${r.ci},g:${r.g}}`;

let texto = readFileSync(ARQUIVO_DESTINO, 'utf8');

texto = texto.replace(
  /\{m:matricula,[^}]*\}\./,
  '{m:matricula, n:nome, f:indice em FUNCOES, cl:indice em CLASSIFICACOES, s:indice em SITUACOES, se:indice em SETORES, fr:indice em FRENTES, d:indice em DEPARTAMENTOS, a:data de admissao (ISO) ou null, c:indice em CONTRATOS, ci:indice em CIDADES, g:indice em GERENCIAS}. Os dois ultimos vieram da aba BD da planilha de desligamentos (Cidade-Resid/Desc-Gerência), casados por matricula; quem nao apareceu la cai no indice da string vazia.'
);

texto = texto.replace(
  /export const BASE_COLAB_CONTRATOS = \[[^\]]*\];\r?\n/,
  match => `${match}\r\nexport const BASE_COLAB_CIDADES = ${jsArr(CIDADES)};\r\nexport const BASE_COLAB_GERENCIAS = ${jsArr(GERENCIAS)};\r\n`
);

texto = texto.replace(
  /export const BASE_COLABORADORES = \[\r?\n[\s\S]*\r?\n\];\r?\n?/,
  `export const BASE_COLABORADORES = [\r\n${registros.map(jsRegistro).join(',\r\n')}\r\n];\r\n`
);

writeFileSync(ARQUIVO_DESTINO, texto);
console.log(`Cidades: ${CIDADES.length - 1} + sem registro. Gerências: ${GERENCIAS.length - 1} + sem registro.`);
console.log(`Sem correspondência na aba BD: ${semCorrespondencia} de ${BASE_COLABORADORES.length}.`);
