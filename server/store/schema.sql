-- Tabela unica do plano compartilhado.
-- Executado por garantirTabela() na primeira consulta, entao um deploy novo
-- nao precisa de migracao manual. Idempotente por causa do IF NOT EXISTS.
CREATE TABLE IF NOT EXISTS plano (
  id         text PRIMARY KEY,
  data       jsonb       NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Autenticacao. senha_hash nunca guarda texto puro (ver server/auth.js).
CREATE TABLE IF NOT EXISTS usuarios (
  id            bigserial PRIMARY KEY,
  login         text UNIQUE NOT NULL,
  senha_hash    text NOT NULL,
  nome          text,
  papel         text NOT NULL DEFAULT 'usuario' CHECK (papel IN ('admin','usuario')),
  ativo         boolean NOT NULL DEFAULT true,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  ultimo_acesso timestamptz
);

-- Sessao = token opaco, sem JWT/assinatura. Apagar a linha revoga na hora
-- (logout ou desativar usuario), o que um token auto-contido nao permitiria.
CREATE TABLE IF NOT EXISTS sessoes (
  token      text PRIMARY KEY,
  usuario_id bigint NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  criado_em  timestamptz NOT NULL DEFAULT now(),
  expira_em  timestamptz NOT NULL
);

-- Perfis de acesso. Todo usuario logado VE todas as abas; o perfil diz em quais
-- ele pode EDITAR (editaveis = ids das areas de server/permissoes.js, ou ["*"]
-- para todas, inclusive as criadas no futuro). 'admin' nao mora aqui: edita
-- tudo e gerencia usuarios sempre.
CREATE TABLE IF NOT EXISTS perfis (
  id        text PRIMARY KEY,
  nome      text NOT NULL,
  editaveis jsonb NOT NULL DEFAULT '[]'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- 'usuario' nasce editando tudo: e o comportamento de antes dos perfis, entao
-- ninguem perde acesso no deploy. DO NOTHING preserva o que o admin ajustar.
INSERT INTO perfis (id, nome, editaveis) VALUES ('usuario', 'Usuário', '["*"]'::jsonb)
  ON CONFLICT (id) DO NOTHING;

-- papel deixou de ser so admin|usuario. Remove o CHECK antigo sem depender do
-- nome que o Postgres gerou para ele: qualquer CHECK de usuarios que cite papel.
DO $$
DECLARE c text;
BEGIN
  FOR c IN SELECT conname FROM pg_constraint
            WHERE conrelid = 'usuarios'::regclass AND contype = 'c'
              AND pg_get_constraintdef(oid) LIKE '%papel%'
  LOOP
    EXECUTE format('ALTER TABLE usuarios DROP CONSTRAINT %I', c);
  END LOOP;
END $$;

-- Quadro nominal do ADM e da oficina (chave PESSOAL: matricula, nome e salario
-- por pessoa) saiu do sistema na 2.45.2 -- o plano projeta gente por funcao e
-- departamento, sem nomes. Apaga o que tiver sido lancado. Idempotente: plano
-- sem a chave nao e tocado. A API tambem nao deixa a chave voltar
-- (CHAVES_RETIRADAS, server/permissoes.js).
UPDATE plano SET data = data - 'PESSOAL' WHERE data ? 'PESSOAL';

-- Lancamentos de gasto real do ERP (Power BI, Movimentacoes Internas).
-- Gravados pelo script local (npm run gasto-reforma-bi -- --banco ...) e lidos
-- pelo servidor para o filtro de datas ao vivo na aba Reforma de Frota.
-- A restricao UNIQUE evita contar o mesmo lancamento duas vezes (deduplicacao).
CREATE TABLE IF NOT EXISTS gasto_reforma_bi (
  id            bigserial PRIMARY KEY,
  frota         text        NOT NULL,
  compartimento text        NOT NULL,
  descricao     text        NOT NULL,
  valor         numeric(14,2) NOT NULL,
  data          date        NOT NULL,
  empresa       text,
  reforma       text        CHECK (reforma IN ('SIM', 'NAO')),
  extraido_em   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT gasto_reforma_bi_uniq
    UNIQUE (frota, compartimento, descricao, valor, data, empresa)
);
CREATE INDEX IF NOT EXISTS idx_grbi_data  ON gasto_reforma_bi(data);
CREATE INDEX IF NOT EXISTS idx_grbi_frota ON gasto_reforma_bi(frota);

