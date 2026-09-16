-- Tabela unica do plano compartilhado.
-- Executado por garantirTabela() na primeira consulta, entao um deploy novo
-- nao precisa de migracao manual. Idempotente por causa do IF NOT EXISTS.
CREATE TABLE IF NOT EXISTS plano (
  id         text PRIMARY KEY,
  data       jsonb       NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
)
