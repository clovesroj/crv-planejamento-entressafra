'use strict';
/**
 * Perfis e permissões de edição.
 *
 * Regra do produto: todo usuário logado VÊ todas as abas; o perfil decide em
 * quais delas ele pode EDITAR. O administrador edita tudo e é o único que
 * gerencia usuários e perfis.
 *
 * A trava da interface (public/js/ui/permissoes.js) é conveniência. A regra de
 * verdade é esta: em toda gravação do plano, filtrarGravacao() descarta o que o
 * perfil não pode alterar, antes de chegar ao banco. Sem isso, qualquer usuário
 * logado editaria tudo chamando a API direto.
 *
 * O plano é um documento só, com uma chave por assunto (PLANO, DIM, INSUMO...).
 * Cada ÁREA abaixo é uma aba editável e lista as chaves que aquela aba grava —
 * mapa medido na interface, controle por controle, e não deduzido do código.
 * Uma chave pode pertencer a mais de uma aba (Irrigação grava a área irrigada
 * em PLANO; o destino das unidades de frota aparece em três abas): editar
 * qualquer uma dessas abas libera a chave. P, as premissas, é dividida campo a
 * campo, porque quatro abas diferentes editam partes dela.
 *
 * AO CRIAR UM DADO NOVO NO PLANO: inclua a chave (ou o campo de P) na área da
 * aba que o edita. Chave fora do catálogo só o administrador grava — a aba
 * Validação acusa o esquecimento.
 */

const janela = require('./janela');

const TUDO = '*';   // em editaveis: edita todas as abas, inclusive as criadas no futuro

const AREAS = [
  { id: 'acomp', nome: 'Acompanhamento do Plano', grupo: 'Visão geral', chaves: ['REAL'] },

  { id: 'premissas', nome: 'Premissas', grupo: 'Planejamento',
    campos: ['dens', 'tch', 'plantio', 'haTratosPlanta', 'haTratosSoca', 'haColheita', 'tonColheita', 'hdia', 'disp', 'efic', 'dias', 'diesel', 'imob', 'dep', 'ipreco',
             'hPorMec', 'eqPorAjud', 'colPorLider', 'tercAereaTar', 'tercSistTar', 'tercSistHa'] },
  { id: 'plano', nome: 'Plano Operacional', grupo: 'Planejamento', chaves: ['PLANO', 'DIM'] },
  { id: 'dimens', nome: 'Dimensionamento', grupo: 'Planejamento',
    chaves: ['DIM', 'APOIO_FIXO', 'QUADRO', 'FROTA_UN', 'MO_APOIO'] },
  { id: 'cadativ', nome: 'Cadastro de Atividades', grupo: 'Planejamento',
    chaves: ['ATVX', 'ATVX_V'] },

  // NIV (níveis salariais) não tem mais controle na tela; segue aqui porque
  // documentos antigos ainda o trazem e ele é dado de mão de obra.
  { id: 'mdo', nome: 'Mão de Obra', grupo: 'Pessoas',
    chaves: ['ENC', 'BEN', 'NIV', 'GRAT', 'FUN', 'FAT'], campos: ['diasOper', 'diasTrab', 'hTurno'] },
  // O quadro ativo (ajuste, férias e demissões por função) era editado no
  // Dimensionamento; foi para o Resumo de Pessoas, ao lado das outras respostas
  // sobre gente. QUADRO segue também em 'dimens' porque uma chave pode ter mais
  // de uma aba dona — quem já tinha só 'dimens' no perfil não perde a edição.
  { id: 'pessoas', nome: 'Resumo de Pessoas', grupo: 'Pessoas', chaves: ['QUADRO'] },

  { id: 'insumos', nome: 'Insumos', grupo: 'Agricultura',
    chaves: ['INSUMO', 'INSX', 'INSX_V', 'TRATC', 'TRAT_NOME', 'TRAT_OBS', 'TRAT_ETAPA', 'TRAT_DEL', 'TRAT_ATIVO', 'MATX', 'GRUPOS_INS', 'FAM_NOME', 'FAM_CLASSE'] },
  { id: 'irrig', nome: 'Irrigação', grupo: 'Agricultura',
    chaves: ['PLANO'], campos: ['perdaCarga', 'desnivel', 'rendBomba', 'kwh', 'fonte'] },
  { id: 'forn', nome: 'Fornecedores de Cana', grupo: 'Agricultura', chaves: ['FORN', 'FORN_PAR'] },

  // capTransb é derivado (volume × densidade) e recalculado a cada conta
  { id: 'transp', nome: 'Transporte', grupo: 'Frota e logística',
    campos: ['densCarga', 'volTransb', 'velC', 'velV', 'tCarga', 'tDesc', 'hDiaTr', 'dispTr',
             'consTr', 'manutTr', 'raioSafra', 'raioMuda', 'capTransb'] },
  { id: 'combust', nome: 'Combustível', grupo: 'Frota e logística', chaves: ['DIESEL_MES', 'MAQ'] },
  { id: 'apoio', nome: 'Apoio', grupo: 'Frota e logística', chaves: ['APOIO'] },
  { id: 'tpess', nome: 'Transporte de Pessoal', grupo: 'Frota e logística', chaves: ['TPESS'] },

  { id: 'frota', nome: 'Manutenção de Frota', grupo: 'Manutenção de frota',
    chaves: ['CRM', 'CRM_ESP', 'FROTA', 'MAQ', 'FROTA_UN'] },
  { id: 'reforma', nome: 'Reforma de Frota', grupo: 'Manutenção de frota', chaves: ['FROTA_UN'] },
  // APOIO_FIXO (quantidade da frota de apoio) veio do Dimensionamento junto com
  // a tabela; segue também lá, pelo mesmo motivo de QUADRO acima.
  { id: 'resumofrota', nome: 'Resumo de Frota', grupo: 'Manutenção de frota',
    chaves: ['FROTA_UN', 'APOIO_FIXO'] },

  { id: 'arrend', nome: 'Arrendamentos', grupo: 'Custos', chaves: ['ARREND', 'ARR_PAR', 'ARR_RAT'] },
  { id: 'adm', nome: 'Custos Administrativos', grupo: 'Custos', chaves: ['ADM', 'ADM_RAT'] },
  { id: 'custos', nome: 'Custos', grupo: 'Custos', chaves: ['ESPOR'] },
  { id: 'contas', nome: 'Plano de Contas', grupo: 'Custos', chaves: ['TERC_TAR', 'TERC_SUB'] },
];

const IDS_AREA = new Set(AREAS.map(a => a.id));
const PERFIS_FIXOS = { admin: 'Administrador', usuario: 'Usuário' };

// Comparação independente da ordem das chaves: o jsonb do Postgres reordena
// objetos, então JSON.stringify direto acusaria diferença em dado idêntico.
function canon(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v === undefined ? null : v);
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
}
const igual = (a, b) => canon(a) === canon(b);

// Lista de áreas válida e sem repetição; o que não é área conhecida é descartado.
function normalizarEditaveis(lista) {
  if (!Array.isArray(lista)) return [];
  if (lista.includes(TUDO)) return [TUDO];
  return [...new Set(lista.filter(id => IDS_AREA.has(id)))];
}

// Resolve o que o usuário pode editar. Perfil inexistente (apagado, digitado
// errado no banco) cai em só visualização — nunca em acesso total.
async function permissoesDe(usuario, store) {
  if (!usuario) return { admin: false, tudo: false, editaveis: [] };
  if (usuario.papel === 'admin') return { admin: true, tudo: true, editaveis: [TUDO] };
  const perfil = await store.perfilPorId(usuario.papel);
  const editaveis = normalizarEditaveis(perfil ? perfil.editaveis : []);
  return { admin: false, tudo: editaveis.includes(TUDO), editaveis, perfilNome: perfil ? perfil.nome : null };
}

// O que vai para o navegador junto com o usuário: permissões e o catálogo,
// para a interface travar as abas e a Validação conferir o mapa.
function permissoesPublicas(perm) {
  return {
    admin: perm.admin, tudo: perm.tudo, editaveis: perm.editaveis, perfilNome: perm.perfilNome || null,
    areas: AREAS.map(a => ({ id: a.id, nome: a.nome, grupo: a.grupo, chaves: a.chaves || [], campos: a.campos || [] })),
  };
}

/**
 * Filtra uma gravação do plano pelo perfil.
 *
 * O navegador sempre envia o documento inteiro que tem em memória, inclusive as
 * chaves que o usuário não pode editar (com o valor que carregou). Por isso o
 * que não é permitido não gera erro: é descartado, e o valor gravado no banco
 * prevalece. Só entra em `ignorados` o que chegou DIFERENTE do banco — ou seja,
 * uma tentativa real de alterar algo sem permissão.
 *
 *   corpo        o que o navegador enviou
 *   atual        documento gravado hoje (ou {})
 *   substituir   true no PUT ("restaurar padrões"): o documento é reescrito,
 *                e chave permitida ausente do corpo sai do documento
 *
 * Devolve { doc, ignorados }. No PATCH, doc só tem o que pode ser mesclado.
 */
function filtrarGravacao(corpo, atual, perm, substituir) {
  if (perm.tudo) return { doc: corpo, ignorados: [] };

  const minhas = AREAS.filter(a => perm.editaveis.includes(a.id));
  const chaves = new Set(minhas.flatMap(a => a.chaves || []));
  const campos = new Set(minhas.flatMap(a => a.campos || []));
  // Banco ainda em 9 meses e o navegador já mandando 12: a migração tem de
  // entrar inteira, inclusive nas chaves que este perfil não grava — senão o
  // documento fica metade em cada formato (ver server/janela.js). Comparar com
  // o banco já migrado também evita acusar a migração como edição proibida.
  const migrando = janela.de9Meses(atual) && !janela.de9Meses(corpo);
  const base = migrando ? janela.migrar(atual) : (atual || {});
  const baseP = base.P || {};
  const ignorados = [];
  const doc = substituir ? { ...base } : {};
  if (migrando) janela.CHAVES.forEach(k => { if (k in base) doc[k] = base[k]; });

  if (substituir) chaves.forEach(k => { if (!(k in corpo)) delete doc[k]; });

  for (const [k, v] of Object.entries(corpo)) {
    if (k === 'v') { doc.v = v; continue; }           // versão do formato, não é dado

    if (k === 'P') {
      const novoP = { ...baseP };
      let mudouPermitido = false;
      for (const [f, fv] of Object.entries(v || {})) {
        if (igual(fv, baseP[f])) continue;
        if (campos.has(f)) { novoP[f] = fv; mudouPermitido = true; }
        else ignorados.push('P.' + f);
      }
      if (mudouPermitido) doc.P = novoP;
      continue;
    }

    if (chaves.has(k)) doc[k] = v;
    else if (!igual(v, base[k])) ignorados.push(k);
  }
  return { doc, ignorados };
}

/* Chaves que saíram do plano e não podem voltar ao banco, nem por um
   navegador com a versão antiga aberta, nem pelo administrador (que não passa
   por filtrarGravacao). PESSOAL era o quadro nominal do ADM e da oficina —
   matrícula, nome e salário por pessoa —, retirado na 2.45.2: o plano projeta
   gente por função e departamento, de forma impessoal. O que já estava gravado
   sai do banco em schema.sql. */
const CHAVES_RETIRADAS = ['PESSOAL'];
function semRetiradas(doc) {
  if (!doc || typeof doc !== 'object' || !CHAVES_RETIRADAS.some(k => k in doc)) return doc;
  const limpo = { ...doc };
  CHAVES_RETIRADAS.forEach(k => { delete limpo[k]; });
  return limpo;
}

// Identificador do perfil a partir do nome: minúsculo, sem acento nem espaço.
function idDoNome(nome) {
  return String(nome || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

module.exports = {
  AREAS, TUDO, PERFIS_FIXOS, normalizarEditaveis, permissoesDe, permissoesPublicas,
  filtrarGravacao, idDoNome, igual, CHAVES_RETIRADAS, semRetiradas,
};
