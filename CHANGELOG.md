# Histórico de mudanças

## 2.9.0 — 2026-09-16 · Login e gestão de usuários

O sistema deixa de ficar aberto na internet — resolve a dívida nº1 do
[CLAUDE.md](CLAUDE.md). Tela de login, aba **Usuários** (só-admin) e sessão
por cookie.

### Autenticação

Hash de senha com `crypto.scrypt` nativo do Node — nenhuma dependência nova
(`package.json` segue só com `pg`). Sessão é um token opaco guardado na tabela
`sessoes`, não JWT: cada requisição confere contra o banco, então desativar um
usuário ou fazer logout derruba o acesso na hora. Cookie `httpOnly`,
`SameSite=Lax`, validade de 30 dias.

Duas tabelas novas em [schema.sql](server/store/schema.sql): `usuarios` e
`sessoes`. Implementado nos dois destinos de armazenamento — Postgres e o
modo arquivo local (`.data/usuarios.json`), mesma interface das duas.

### Primeiro usuário, sem senha no código

`POST /api/auth/bootstrap` cria o primeiro usuário (sempre admin) e só
funciona uma vez, enquanto a tabela estiver vazia — depois disso é sempre
409. Não há login nem senha fixos em nenhum arquivo do repositório.

### Papéis

**admin**: tudo, inclusive a aba Usuários (criar, ativar/desativar, redefinir
senha de qualquer um). **usuário**: lê e edita o plano normalmente, e pode
trocar a própria senha.

### Tela de login

Fundo animado exclusivo dessa tela — grade de pontos que reage ao cursor
(proximidade esquenta a cor, clique empurra com física de mola-amortecedor),
portado pra canvas + JS vanilla sem dependência nova.

### Arquivos

`server/auth.js` (novo), métodos de usuário/sessão em `server/store/postgres.js`
e `server/store/arquivo.js`, rotas novas em `server/api.js`.
`public/js/nucleo/sessao.js`, `public/js/io/autenticacao.js`,
`public/js/ui/login.js`, `public/js/ui/usuarios.js`,
`public/js/ui/fundo-login.js` (todos novos). O motor de cálculo não foi
alterado.


## 2.8.0 — 2026-09-16 · Turnos por atividade e necessidade mês a mês

### Turnos na atividade

Ao lado da escala, cada atividade agora escolhe os turnos: **1t, 2t ou 3t**, ou
Padrão, que segue o modo de execução ou o cadastro. A escolha grava em
`DIM[cod].turnos` e entra no efetivo junto com a escala. Na colheita do teste:
1t = 4 pessoas, 2t = 7, 3t = 11.

A coluna Ativos da função mostra, em cada linha, o quadro ativo informado para
aquela função — é conferência visual; o cruzamento que vale é por função,
na tabela abaixo.

### Necessidade x quadro ativo

A tabela por função passa a abrir com os campos informados — quadro ativo,
férias e demissões — seguidos de disponível, necessidade, pico mensal, a
contratar e excedente.

Abaixo dela, tabela nova: **necessidade mês a mês x disponível**. Uma linha por
função, uma coluna por mês do orçamento, o mês de pico em negrito e a célula em
vermelho quando a necessidade do mês passa o disponível. No rodapé, a
necessidade total de cada mês e quanto falta contratar naquele mês.

Enquanto nada é informado no quadro, a matriz não pinta falta — não há com o
que comparar.


## 2.7.0 — 2026-09-16 · Nível e escala por atividade

No bloco Dimensionamento de pessoas, cada atividade passa a ter uma linha com
**seletor de nível da função** e **seletor de escala**, e as frentes aparecem
como sub-linhas. A coluna Fator mostra o que a escala exige de gente por posto.

Escalas em `dados/escalas.js`: 6x1 (1,17), 5x1 (1,20), 5x2 (1,40), 4x1 (1,25) e
12x36 (2,00). Em branco, a atividade usa o fator das Premissas de Mão de Obra,
como antes. A escolha é gravada em `DIM[cod].esc`.

O fator entra no efetivo e no custo de mão de obra daquela atividade. Exemplo:
colheita com 11 pessoas no 6x1 passa a 13 no 5x2, e a mão de obra sobe de
R$ 184.457 para R$ 221.348.

### Correção

O seletor de nível do Plano Operacional estava sem efeito desde a entrada do
módulo de fornecedores: as duas telas usavam `data-fn`, e o handler de
fornecedor, que vem antes, engolia o evento. As linhas de fornecedor passaram a
usar `data-fnr`.


## 2.6.0 — 2026-09-16 · Dimensionamento em três blocos

A aba Dimensionamento passa a ter três dimensionamentos separados, cada um num
bloco recolhível com título destacado e um resumo que continua legível com o
bloco fechado. São `<details>` nativos: recolhem sem JavaScript e respondem ao
teclado.

| Bloco | Conteúdo |
|---|---|
| Dimensionamento por atividade | indicadores e a tabela de atividades e frentes |
| Dimensionamento de frota | frota por tipo de máquina, necessidade x base do ERP, frota de apoio |
| Dimensionamento de pessoas | **novo** |

### Dimensionamento de pessoas

Primeira tabela: atividade › especialidade › função › pessoas, uma linha por
frente, com frota e horas. A especialidade vem da base de frota do ERP quando a
máquina está cadastrada lá.

Segunda tabela, por função: necessidade dimensionada, pico mensal (com o mês),
quadro ativo, férias programadas e demissões programadas — os três editáveis —
mais disponível, a contratar e excedente. Disponível = ativo − férias −
demissões; a contratar compara o disponível com o **pico mensal**, não com a
soma do dimensionamento, que contrataria gente para mês em que a atividade não
roda.

O quadro informado é gravado no documento (`QUADRO`, por função).

Falta o modelo do cliente para estender: nível e escala por linha, colunas por
período (entressafra e safra) e o par equipamento/pessoas da planilha de mão de
obra agrícola.

## 2.3.0 — 2026-09-16 · Calcário e gesso em tratos culturais

Duas operações novas no Plano Operacional, dentro de TRATOS CULTURAIS:
**A37 Aplicação de calcário** e **A38 Aplicação de gesso**, em ha/mês.

Cada uma aceita só dois modos de execução, marcados na coluna Modo de execução:
**Trator** (Trator 4x4 150 CV + Distribuidor de sólidos, operador de máquinas
agrícolas) ou **Terceiro** (prestador de serviço pela tarifa em R$/ha, sem frota
nem efetivo próprios). Dá para dividir a área entre os dois.

Para isso o cadastro de atividade ganhou dois campos opcionais, lidos em
`calculo/atividade.js`: `modos`, que limita os modos oferecidos, e `modoCfg`,
que ajusta máquina, implemento, rendimento ou função de um modo naquela
atividade. Atividade sem esses campos continua com os cinco modos de sempre.

Rendimentos de partida: 5,0 ha/h para calcário e 5,5 ha/h para gesso; ambas
classificadas como cana planta no rateio de tratos. Ajustáveis na aba
Dimensionamento e no cadastro.


## 2.2.0 — 2026-09-16 · Ano agrícola completo no Plano Operacional

### Janela do orçamento: 9 para 12 meses

De Out/26–Jun/27 para **Abr/26 a Mar/27**, o ano agrícola inteiro: oito meses de
safra (abr a nov) seguidos dos quatro de entressafra (dez a mar).

**O orçamento muda de tamanho.** Custos mensais e fixos — administração,
depreciação, arrendamento, estrutura indireta, equipe de manutenção, apoio —
passam a contar 12 meses em vez de 9. O total projetado sobe por consequência.

### Migração do documento gravado

`io/persistencia.js` remapeia o documento de 9 meses pelo **nome** do mês, não
pelo índice: Out/26 continua em Out/26. Abr/27, Mai/27 e Jun/27 não existem na
janela nova e vão para o mês equivalente do novo ano (Abr/26, Mai/26, Jun/26) —
nada se perde. Remapeia `PLANO`, `DIESEL_MES`, o mês de pagamento de `ARREND` e
o mês dos lançamentos esporádicos.

### Plano Operacional

- Colunas de safra em verde e de entressafra em palha, com legenda.
- Filtro **Mostrar meses**: todos, só safra ou só entressafra. Esconde colunas,
  nunca apaga lançamento.
- Setas do teclado, Tab e Enter andam entre as células como numa planilha. As
  setas laterais só trocam de célula quando o cursor está na ponta do texto, e
  pulam as colunas escondidas pelo filtro.

### Atenção

O contrato de regressão em [CLAUDE.md](CLAUDE.md) foi capturado com a janela de
9 meses. Os totais e as impressões digitais de lá não valem mais e precisam ser
recapturados.


## 2.1.0 — 2026-09-16 · Módulo de fornecedores de cana

Nova aba **Fornecedores de Cana** e consolidação da matéria-prima por origem.

### Cadastro

Fornecedor, propriedade, área, toneladas contratadas e estimadas, TCH, ATR,
distância, período de entrega, modalidade de contrato, preço, prêmio, descontos,
frete, logística, qualidade e histórico da safra anterior.

Modalidades: Consecana (ATR × preço do kg), preço fixo por tonelada, parceria
(% da produção) e permuta (cana por área, valorada pelo Consecana). Tonelada
estimada em branco usa área × TCH; frete em branco usa distância × tarifa/km.

### Origens, sem misturar naturezas contábeis

| Origem | Natureza | De onde vem o custo |
|---|---|---|
| Cana própria | Custo de produção — área própria | plano agrícola, parcela da área própria |
| Cana arrendada | Custo de produção + arrendamento | plano agrícola + todo o arrendamento |
| Cana de fornecedor | Aquisição de matéria-prima | contrato de compra |
| Cana de parceria | Aquisição — partilha da produção | contrato de parceria |

Própria e arrendada somadas reproduzem exatamente o custo total do plano — não há
dupla contagem. A aquisição de terceiros fica à parte e só se junta no custo médio
ponderado da tonelada.

### Indicadores

Custo da cana própria, custo da cana de fornecedor, custo médio ponderado, R$/t,
R$/kg de ATR e participação percentual por origem, em tonelada e em custo. Também
a entrada de cana por mês e origem.

O custo médio ponderado considera só origem com tonelada lançada: enquanto a
colheita (A01) não estiver no Plano Operacional, o custo agrícola aparece à parte
em vez de inflar o R$/t.

### Arquivos

`public/js/dados/fornecedores.js` (cadastro), `public/js/calculo/fornecedores.js`
(cálculo puro), `public/js/ui/fornecedores.js` (tela), seção em `public/index.html`
e campos `FORN` e `FORN_PAR` em `nucleo/estado.js` e `io/persistencia.js`.
Relatório, CSV e Validação incluídos. O motor de custo do plano não foi alterado.


## 2.0.0 — 2026-09-15 · Separação em front, back e dados

Reestruturação conduzida por **Caio Souza**.

Nenhuma mudança de comportamento, de número ou de tela. O sistema calcula e
renderiza exatamente o mesmo que na versão 1.0.0 — isso foi verificado por
impressão digital, não presumido. Ver [CLAUDE.md](CLAUDE.md) para os invariantes
e o contrato de regressão.

### Estrutura

De 6 arquivos para 82. O `index.html` de 3.495 linhas (273 KB) virou:

| Antes | Depois |
|---|---|
| `index.html` — CSS, marcação, JS e dados juntos | `public/index.html` — 552 linhas, só marcação |
| CSS embutido, 338 linhas | `public/css/` — 5 arquivos por responsabilidade |
| `const CFG` — 46 KB **numa única linha** | `public/js/dados/` — 12 arquivos, 789 linhas legíveis |
| `const LOGO` — 14 KB numa linha | `public/js/dados/logo.js` |
| 2.608 linhas de JavaScript | 45 módulos ES em `nucleo/ calculo/ ui/ io/ app/` |
| `server.js` — 297 linhas | `server/` — 8 arquivos, com `store/schema.sql` à parte |

Maior arquivo JavaScript hoje: 238 linhas. O grafo de dependências é acíclico e
sobe numa direção só: `dados → nucleo → calculo → ui → app`.

### Como a equivalência foi provada

- **Extração byte a byte.** O JavaScript foi recortado por um manifesto contíguo
  e sem buracos; reconcatenar na ordem reproduz o original exatamente.
- **Contrato de regressão** capturado do original *antes* de qualquer alteração,
  usando os dados reais de produção como fixture. Depois: as 56 chaves de
  `calcularCompleto()` idênticas, `total` igual ao centavo.
- **DOM renderizado**: as 19 seções, o menu e a barra superior com hash idêntico.
- **Interações**: digitação em premissa e em célula do plano, navegação, tema,
  botões de adicionar e remover, debounce de gravação, montagem do relatório.
- **Back-end**: grafo de módulos carregado e rotas exercitadas — `health`, `GET`,
  `PATCH`, merge preservando gravação anterior, e os erros 405 / 404 / 400.
- 97 de 97 funções do original presentes.

### Corrigido no caminho

- **Cache de módulos.** O `index.html` único era servido com `no-cache`, então um
  deploy valia na hora. Fatiado em ~50 arquivos com `max-age=3600`, um usuário
  que recarregasse após um deploy rodaria HTML novo com JavaScript velho. Agora
  `.html`, `.js` e `.css` revalidam; imagem e fonte ficam em cache longo.
- **Lista de arquivos ocultos eliminada.** O servidor estático recusava
  `server.js`, `package.json` e afins um a um. Com o código do servidor fora de
  `public/`, não há rota que chegue neles.
- **DDL fora do código.** O esquema da tabela `plano` virou
  `server/store/schema.sql`.

### Compatibilidade

- **O formato do documento salvo não mudou**: mesmas chaves em `estado()`, mesmo
  `v:10`, mesma chave `crv_plano_v10` no `localStorage`. O plano gravado no
  Postgres continua sendo lido sem migração.
- `render.yaml` inalterado. O `npm start` passou a apontar para
  `server/index.js`; [`server.js`](server.js) permanece como atalho de
  compatibilidade caso o Start Command no painel do Render ainda seja
  `node server.js`.
- **Abrir `public/index.html` por `file://` deixou de funcionar** — única
  capacidade perdida. Módulos ES exigem origem HTTP. Use `npm start`.

## 1.0.0 — até 2026-09-15

Sistema em arquivo único. Ver o histórico do git até `c8d4ee7`.
