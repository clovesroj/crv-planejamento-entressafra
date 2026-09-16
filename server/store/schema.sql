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
)
