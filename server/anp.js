'use strict';
/**
 * Proxy e cache do "Resumo semanal" de preços de combustíveis da ANP — usado
 * como referência de mercado na aba Combustível (Ituiutaba/MG, a cidade
 * pesquisada mais perto de Capinópolis, é o padrão sugerido) e para consulta
 * livre por semana, município e combustível.
 *
 * O servidor só busca os bytes da planilha e guarda em cache — quem
 * interpreta é o navegador, que já carrega o SheetJS (xlsx.full.min.js, usado
 * para gerar o relatório em Excel) para montar a tela; não duplica a
 * biblioteca no servidor por causa disto.
 *
 * O nome dos arquivos muda toda semana (resumo_semanal_lpc_<inicio>_<fim>.xlsx
 * e revendas_lpc_<inicio>_<fim>.xlsx — este segundo é o detalhe por posto,
 * usado quando alguém clica num dos cartões da referência), por isso a lista
 * é raspada da página de listagem (que traz os dois links por semana, meses
 * para trás) em vez de tentar montar a data. A rota de download só aceita uma
 * URL que já saiu dessa raspagem — nunca uma URL arbitrária que o cliente
 * mande, para o proxy não virar porta aberta.
 *
 * A ANP tem uma inconsistência própria de formatação num nome de arquivo às
 * vezes ("resumo_semanal_lpc_2026-08-30-2026-09-5.xlsx" — separador "-" em
 * vez de "_", dia sem zero à esquerda), então o par resumo/revendas de uma
 * mesma semana é casado pela data normalizada, não pelo texto cru do nome.
 *
 * Um "User-Agent" de navegador é obrigatório: o site da ANP recusa (403) o
 * fingerprint TLS de ferramentas de linha de comando (curl) mesmo com header
 * de navegador, mas aceita o fetch() nativo do Node com este header — testado
 * antes de escrever este arquivo, não é suposição.
 */
const { erroHTTP } = require('./http');

const LISTA_URL = 'https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/levantamento-de-precos-de-combustiveis-ultimas-semanas-pesquisadas';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const PRAZO_MS = 20000;
const VALIDADE_LISTA_MS = 12 * 60 * 60 * 1000;        // a lista de semanas muda 1x/semana
const VALIDADE_ARQUIVO_MS = 7 * 24 * 60 * 60 * 1000;  // arquivo de semana passada nunca muda — cache bem mais longo
const MAX_ARQUIVOS_CACHEADOS = 30;                    // limite simples, o processo fica de pé por muito tempo

let listaCache = null;                // {semanas:[{inicio,fim,url,revendas}], buscadoEm}
const arquivoCache = new Map();       // url -> {bytes, buscadoEm}

function falhaDeRede(e, etapa) {
  const nome = e && e.name;
  if (nome === 'TimeoutError' || nome === 'AbortError') {
    return erroHTTP(424, `ANP não respondeu em ${PRAZO_MS / 1000} s (${etapa}) — tente de novo`);
  }
  return erroHTTP(424, `ANP: falha de rede (${etapa})`);
}

const pad2 = s => s.padStart(2, '0');
const normalizarData = d => d.split('-').map((p, i) => i === 0 ? p : pad2(p)).join('-');
const chaveSemana = (inicio, fim) => `${normalizarData(inicio)}_${normalizarData(fim)}`;

/** Map chaveSemana -> {url, inicio, fim}, na ordem em que aparecem na página (mais recente primeiro). */
function extrairArquivos(html, prefixo) {
  const re = new RegExp(`https://www\\.gov\\.br/anp/[^"]*${prefixo}_(\\d{4}-\\d{2}-\\d{1,2})[_-](\\d{4}-\\d{2}-\\d{1,2})\\.xlsx`, 'g');
  const mapa = new Map();
  let m;
  while ((m = re.exec(html))) {
    const chave = chaveSemana(m[1], m[2]);
    if (!mapa.has(chave)) mapa.set(chave, { url: m[0], inicio: normalizarData(m[1]), fim: normalizarData(m[2]) });
  }
  return mapa;
}

/** [{inicio, fim, url, revendas}], mais recente primeiro — raspado da página de listagem, cacheado.
    `revendas` é a URL do detalhe por posto daquela semana, ou null quando a ANP não publicou. */
async function listarSemanas() {
  if (listaCache && Date.now() - listaCache.buscadoEm < VALIDADE_LISTA_MS) return listaCache.semanas;
  let r;
  try {
    r = await fetch(LISTA_URL, { headers: { 'user-agent': USER_AGENT }, signal: AbortSignal.timeout(PRAZO_MS) });
  } catch (e) { throw falhaDeRede(e, 'lista de semanas'); }
  if (!r.ok) throw erroHTTP(424, `ANP: não consegui abrir a lista de semanas (${r.status})`);
  const html = await r.text();
  const resumos = extrairArquivos(html, 'resumo_semanal_lpc');
  const revendas = extrairArquivos(html, 'revendas_lpc');
  const semanas = [...resumos.entries()].map(([chave, r]) => ({
    inicio: r.inicio, fim: r.fim, url: r.url, revendas: (revendas.get(chave) || {}).url || null,
  }));
  if (!semanas.length) throw erroHTTP(424, 'ANP: não achei nenhum link de resumo semanal na página — o site pode ter mudado');
  listaCache = { semanas, buscadoEm: Date.now() };
  return semanas;
}

/** Bytes crus do resumo semanal daquela URL (uma das que listarSemanas() devolveu). */
async function baixarArquivo(url) {
  const existente = arquivoCache.get(url);
  if (existente && Date.now() - existente.buscadoEm < VALIDADE_ARQUIVO_MS) return existente.bytes;
  let r;
  try {
    r = await fetch(url, { headers: { 'user-agent': USER_AGENT }, signal: AbortSignal.timeout(PRAZO_MS) });
  } catch (e) { throw falhaDeRede(e, 'planilha'); }
  if (!r.ok) throw erroHTTP(424, `ANP: falha ao baixar a planilha (${r.status})`);
  const bytes = Buffer.from(await r.arrayBuffer());
  arquivoCache.set(url, { bytes, buscadoEm: Date.now() });
  if (arquivoCache.size > MAX_ARQUIVOS_CACHEADOS) {
    const maisAntiga = [...arquivoCache.entries()].sort((a, b) => a[1].buscadoEm - b[1].buscadoEm)[0];
    arquivoCache.delete(maisAntiga[0]);
  }
  return bytes;
}

module.exports = { listarSemanas, baixarArquivo };
