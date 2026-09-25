#!/usr/bin/env node
/**
 * Importa a planilha semanal de Desligamentos (aba BASE) direto pro banco,
 * sem precisar subir pela tela -- mesmo parser usado la (extrairRegistrosBase,
 * calculo/desligamentos-ctt.js), so que lendo o arquivo do disco em vez de um
 * <input type=file>.
 *
 * Uso: node scripts/importar-desligamentos.mjs "caminho\planilha.xlsx"
 * Precisa de DATABASE_URL no .env (mesmo do gasto-reforma-bi.mjs).
 */
import { readFileSync } from 'node:fs';
import XLSX from 'xlsx';
import pg from 'pg';
import { extrairRegistrosBase } from '../public/js/calculo/desligamentos-ctt.js';
import '../server/env.js';

const caminho = process.argv[2];
if (!caminho) {
  console.error('Uso: node scripts/importar-desligamentos.mjs <planilha.xlsx>');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL nao definida -- confira o .env.');
  process.exit(1);
}

const wb = XLSX.read(readFileSync(caminho));
const nomeAba = wb.SheetNames.find(n => n.toUpperCase() === 'BASE') || wb.SheetNames[0];
const linhas = XLSX.utils.sheet_to_json(wb.Sheets[nomeAba], { header: 1, defval: null, raw: true });
const { registros, dataBase } = extrairRegistrosBase(linhas);
if (!registros.length) {
  console.error(`Nenhum registro encontrado na aba "${nomeAba}". Confira o modelo da planilha.`);
  process.exit(1);
}

const meta = { dataBase, atualizadoEm: new Date().toISOString() };
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
await client.query(
  `UPDATE plano SET data = jsonb_set(jsonb_set(data, '{CTT_DESLIG}', $1::jsonb, true), '{CTT_DESLIG_META}', $2::jsonb, true)`,
  [JSON.stringify(registros), JSON.stringify(meta)]
);
await client.end();
console.log(`Gravado: ${registros.length} desligamentos, base ${dataBase || '(nao encontrada na planilha)'}.`);
