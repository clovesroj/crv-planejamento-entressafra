'use strict';
/**
 * Armazenamento em arquivo — usado quando nao ha DATABASE_URL.
 *
 * Serve para rodar na maquina local. No Render o disco e efemero e some a cada
 * deploy: por isso duravel:false, e o rodape do app avisa que a gravacao e
 * temporaria.
 */
const fsp = require('node:fs/promises');
const path = require('node:path');
const { DIR_DADOS } = require('../config');

function storeArquivo() {
  const dir = DIR_DADOS;
  const arq = path.join(dir, 'plano.json');

  // Uma fila serializa as gravações: sem ela, dois PATCH simultâneos leriam o
  // mesmo estado e o último apagaria o campo que o primeiro acabou de gravar.
  let fila = Promise.resolve();
  const enfileirar = fn => {
    const r = fila.then(fn, fn);
    fila = r.catch(() => {});
    return r;
  };

  async function doDisco() {
    try {
      return JSON.parse(await fsp.readFile(arq, 'utf8'));
    } catch (e) {
      if (e.code === 'ENOENT') return null;
      throw e;
    }
  }

  async function paraDisco(doc) {
    await fsp.mkdir(dir, { recursive: true });
    const tmp = `${arq}.tmp`;
    await fsp.writeFile(tmp, JSON.stringify(doc));
    await fsp.rename(tmp, arq);   // troca atômica: nunca deixa um JSON pela metade
    return { data: doc, updated_at: new Date().toISOString() };
  }

  return {
    tipo: 'arquivo',
    duravel: false,
    async ler() {
      const d = await doDisco();
      if (!d) return null;
      const st = await fsp.stat(arq);
      return { data: d, updated_at: st.mtime.toISOString() };
    },
    mesclar: doc => enfileirar(async () => paraDisco({ ...(await doDisco()), ...doc })),
    substituir: doc => enfileirar(() => paraDisco(doc)),
    async checar() { await fsp.mkdir(dir, { recursive: true }); },
  };
}

module.exports = { storeArquivo };
