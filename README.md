# CRV Industrial — Sistema de Planejamento de Entressafra

Sistema web de planejamento operacional e de custos da entressafra — **Safra 2026/2027, Unidade Capinópolis-MG**, Departamento Agrícola.

O código é separado em front (`public/`), back (`server/`) e cadastro de dados
(`public/js/dados/`). Não há passo de build — o navegador carrega os módulos ES
direto. Veja [Arquitetura](#arquitetura).

> Estrutura reorganizada por **Caio Souza** em setembro de 2026, a partir de um
> arquivo único de 3.495 linhas, sem alterar um número sequer do cálculo.
> O que mudou e como a equivalência foi provada está no
> [CHANGELOG](CHANGELOG.md); os invariantes que mantêm isso de pé, e o contrato
> de regressão para conferir qualquer alteração futura, estão no
> [CLAUDE.md](CLAUDE.md) — leia antes de mexer.

## Módulos

| Aba | Conteúdo |
|---|---|
| Premissas | Parâmetros agronômicos, operacionais e econômicos |
| Mão de Obra | Encargos, benefícios, funções, níveis salariais e escalas |
| Plano Operacional | Área/tonelada por atividade e mês, tratamentos vinculados |
| Dimensionamento | Horas, rendimento, frota e efetivo por atividade |
| Transporte | Transbordo e transporte de cana por raio, ciclo e capacidade |
| Apoio | Equipamentos de apoio por quantidade e horas |
| Combustível | Volume de diesel mês a mês, preço projetado por mês, consumo por etapa e equipamento |
| Manutenção de Frota | CRM por especialidade e modelo, com filtro próprio/terceiro |
| Transporte de Pessoal | Rotas, diárias de ônibus e quilometragem |
| Irrigação | Dimensionamento hidráulico e energia por modalidade |
| Insumos | Cadastro, composição de tratamentos e volume demandado |
| Arrendamentos | Fazendas e grupos arrendados, forma de pagamento, custo mensal e rateio por etapa (referência PECEGE/USP) |
| Custos | Custo por etapa, por natureza e mensal |
| Plano de Contas | Custo projetado por conta contábil |
| Resumo de Frota | Necessidade do plano confrontada com a frota cadastrada |
| Resumo de Pessoas | Efetivo por departamento e função, mobilização e custo de mão de obra mês a mês |
| Painel | Indicadores, custo de colheita R$/t, grandes contas por mês |
| Validação | Checagens automáticas de consistência |

Relatórios resumido ou detalhado em **PDF** e **Excel** pelo botão *Relatório* no cabeçalho,
e exportação em CSV pela aba Plano Operacional.

## Arquitetura

```
public/                 FRONT — servido ao navegador
  index.html            só marcação: as 19 abas e a moldura
  css/                  tokens → layout → componentes → responsivo → impressão
                        (a ordem dos <link> importa: é a cascata)
  js/
    dados/              CADASTRO — o que se edita para mudar uma regra de negócio
      cfg.js            monta o CFG a partir dos arquivos ao lado
      atividades.js     44 atividades · maquinas.js · insumos.js · crm.js · ...
    nucleo/             base sem dependências
      estado.js         o que o usuário edita, com setters (ver nota abaixo)
      formato.js        $, fmt, brl, num, pct
      calendario.js     MESES, safra × entressafra
    calculo/            MOTOR — sem DOM, sem I/O
      index.js          calcular(): orquestra e faz os rateios
      atividade.js      linha(): horas, frota, diesel, mão de obra por atividade
      crm.js · mao-de-obra.js · arrendamento.js · irrigacao.js · ...
    ui/                 uma função pintar* por aba, só leem o resultado do cálculo
    io/                 persistencia.js · relatorio.js · arquivo.js
    app/                ciclo.js (render/leve) · eventos.js · acoes.js
    main.js             arranque

server/                 BACK
  index.js              monta o HTTP, roteia, trata SIGTERM
  config.js             porta, caminhos, limites
  http.js               erro com status, resposta JSON, leitura de corpo
  api.js                /api/health e /api/plano  ← pôr autenticação aqui
  estatico.js           arquivos de public/
  store/                BANCO
    index.js            escolhe o destino por DATABASE_URL
    postgres.js         produção · arquivo.js  local
    schema.sql          DDL da tabela plano
```

O grafo de dependências é **acíclico** e sobe numa só direção:
`dados → nucleo → calculo → ui → app`. Um módulo de cálculo nunca toca no DOM;
um módulo de `ui` nunca decide uma regra de custo. Para achar onde mexer, o
caminho é a aba → `ui/<aba>.js` → o módulo de `calculo` que ela lê.

### Estado mutável e setters

Módulos ES não deixam um arquivo atribuir a um símbolo importado. Por isso
`nucleo/estado.js` exporta o valor **e** um setter:

```js
import { P, setP } from '../nucleo/estado.js';
P.diesel = 6.5;            // mexer no conteúdo: direto
setP({ ...PADRAO });       // trocar o objeto inteiro: pelo setter
```

Quem importa `P` enxerga a troca — são bindings vivos. Esquecer o setter dá
`TypeError: Assignment to constant variable`.

### Onde mexer para cada tipo de mudança

| Mudança | Arquivo |
|---|---|
| Preço, dose, máquina, conta contábil | `public/js/dados/<assunto>.js` |
| Valor padrão de uma premissa | `public/js/dados/padroes.js` |
| Fórmula de custo de uma atividade | `public/js/calculo/atividade.js` |
| Rateio entre etapas, consolidação | `public/js/calculo/index.js` |
| Layout ou colunas de uma aba | `public/js/ui/<aba>.js` |
| Campo novo que precisa ser salvo | `nucleo/estado.js` + `io/persistencia.js` (`estado()` e `aplicar()`) |
| Rota da API, autenticação | `server/api.js` |
| Esquema do banco | `server/store/schema.sql` |

## Base de frota

A frota real vem do cadastro do ERP e mora em
[`public/js/dados/frota-base.js`](public/js/dados/frota-base.js): **1.220 unidades
ativas**, 980 próprias e 240 de terceiros, em **408 modelos** e **81 especialidades**.
A taxonomia é a do próprio cadastro, em três níveis:

```
agrupamento (8)  >  grupo (18)  >  especialidade (81)  >  modelo (408)
OPERACIONAIS     >  TRATOR      >  TRATOR - TRANSBORDO >  JOHN DEERE 6110J
```

Especialidade é a unidade de trabalho: é nela que se lança o custo de manutenção, e todo
modelo dela herda a taxa. Um modelo só precisa de número próprio quando foge da média —
aí o valor dele prevalece. As abas Manutenção de Frota e Resumo de Frota filtram por
**próprios / terceiros**, e o relatório sai agrupado pela mesma taxonomia, com duas abas
novas: *Frota cadastrada* (necessidade x existente) e *Modelos da frota*.

O mesmo modelo pode estar cadastrado em mais de uma especialidade — o mesmo trator serve
de agrícola e de transbordo. Por isso a identidade de um item do registro é o par
especialidade+modelo, não o nome do modelo.

Os arquétipos do planejamento (`Trator 4x4 230 CV`, `Colhedora CH570`…) continuam
existindo e com as taxas que já tinham: o campo `esp` em
[`dados/crm.js`](public/js/dados/crm.js) só os liga à especialidade correspondente, para
agrupar. **Nenhum número de custo mudou com a carga da base.**

### Taxas ainda não levantadas

Das 81 especialidades, 31 já têm taxa pelos equipamentos que estavam cadastrados; as
outras **50 estão zeradas** e aparecem na aba Validação. Entram no custo como zero — o
orçamento não é inflado por estimativa, mas também não está completo enquanto não forem
preenchidas.

## Persistência

O app procura um destino compartilhado nesta ordem e usa o primeiro que responder:

| Destino | Quando | Rodapé mostra |
|---|---|---|
| API deste repositório (`/api/plano`) | Servido pelo `server/` — Render ou qualquer host Node | *Salvo no servidor* |
| Banco do Artifact da Claude | Publicado como Artifact | *Salvo no servidor* |
| `localStorage` | Os dois acima fora do ar | *Salvo neste navegador* |

O `localStorage` é sempre gravado como rascunho, mesmo com servidor ativo: fechar a aba
no meio de uma gravação não perde o que foi digitado. Quando o servidor cai, o rodapé
passa a dizer *Servidor fora — salvo neste navegador*, porque nesse momento os outros
usuários ainda não estão vendo a alteração.

As gravações usam merge por campo: uma sessão nunca apaga dados preenchidos por outra.
No Postgres o merge acontece dentro do próprio `UPDATE` (operador `||` de `jsonb`), e não
em ler-alterar-gravar, então duas pessoas salvando ao mesmo tempo não se sobrescrevem.

## Hospedagem no Render

O repositório traz um [`render.yaml`](render.yaml) que cria o web service e o Postgres já
conectados. No painel do Render: **New › Blueprint**, aponte para este repositório e
confirme. Não há variável para preencher à mão — o `DATABASE_URL` é injetado pelo próprio
blueprint.

Para criar os serviços manualmente, em vez do blueprint:

1. **New › Postgres**, plano *Free*, região *Ohio*.
2. **New › Web Service** apontando para este repositório, runtime *Node*,
   build `npm install`, start `npm start`, health check `/api/health`.
3. No web service, adicione a variável `DATABASE_URL` com a *Internal Database URL* do
   Postgres criado no passo 1 (a interna exige que os dois estejam na mesma região).

O servidor cria a tabela `plano` sozinho no primeiro acesso, com o DDL de [`server/store/schema.sql`](server/store/schema.sql).

### O que muda no deploy com a separação em pastas

O `render.yaml` não mudou: `buildCommand: npm install`, `startCommand: npm start`,
`healthCheckPath: /api/health` continuam valendo. O que mudou foi o alvo do
`npm start`, que agora é `server/index.js`.

- **Confira o Start Command no painel** (*Settings › Build & Deploy*). Se o
  serviço foi criado pelo blueprint, está `npm start` e não há o que fazer. Se
  foi criado à mão e ficou `node server.js`, continua funcionando por causa do
  atalho em [`server.js`](server.js) — que pode ser apagado depois de corrigir o
  painel para `npm start`.
- **O formato do documento salvo não mudou** (mesmas chaves, mesmo `v:10`, mesma
  chave `crv_plano_v10` no `localStorage`). O plano que está no Postgres continua
  sendo lido normalmente; não há migração a fazer.
- **O deploy só dispara no branch padrão** (`main`), porque é o que o
  `autoDeploy` observa. Empurrar um branch de trabalho não publica nada.
- Se o start falhar, o Render mantém a versão anterior no ar e marca o deploy
  como falho — a queda seria do deploy, não do site.

### Limites do plano gratuito

- O web service **hiberna após 15 minutos** sem acesso; o primeiro acesso seguinte leva
  cerca de 50 segundos para responder.
- O **Postgres gratuito expira em 30 dias**. Antes disso é preciso migrar para o plano
  pago ou criar outro banco — expirado, os dados são apagados. Para exportar, use o botão
  *Relatório › Excel* ou `pg_dump` na *External Database URL*.

### Verificar um deploy

```bash
curl -s https://SEU-SERVICO.onrender.com/api/health
```

Deve responder `"armazenamento":"postgres"` e `"banco":"ok"`. Se vier
`"armazenamento":"arquivo"`, o `DATABASE_URL` não chegou ao serviço e os dados serão
perdidos no próximo deploy — o rodapé do app avisa com *(temporário)*.

## Rodar localmente

```bash
npm install && npm start
```

Abre em `http://localhost:10000`. Sem `DATABASE_URL`, grava em `.data/plano.json` — bom
para testar, mas sem o compartilhamento real. Para usar um Postgres:

> **Precisa de um servidor.** Abrir `public/index.html` com duplo clique não
> funciona mais: por `file://` o navegador trata a página como origem opaca e
> recusa carregar módulos ES. Qualquer servidor estático resolve — `npm start` é
> o mais simples. Era possível no formato de arquivo único; se abrir sem
> servidor voltar a ser necessário, o caminho é um script de build que concatene
> `public/` num `index.html` único.

```bash
DATABASE_URL=postgres://usuario:senha@host:5432/banco npm start
```

## Acesso

O serviço fica **aberto na internet**: qualquer pessoa com o endereço lê e edita o plano,
incluindo salários, custos e programação de safra. Se isso mudar, o ponto de entrada para
colocar autenticação é a função `api()` de [`server/api.js`](server/api.js).

## Premissas a confirmar

- Densidade de muda e TCH da cana-muda — time agronômico
- Salários e benefícios — CCT do sindicato rural de Capinópolis/MG
- Custo de manutenção e consumo de diesel — ajustar pela frota real
- Depreciação, administração e área arrendada — orçamento oficial

### Quando o TLS do banco falha

O [`server/store/postgres.js`](server/store/postgres.js) decide sozinho se usa TLS pelo formato do host: a URL interna do
Render é um nome sem ponto (`dpg-xxxx-a`) e dispensa TLS; a externa é um FQDN e
exige. Num host fora desse padrão, force com a variável `DATABASE_SSL`:

- `DATABASE_SSL=off` — erro `The server does not support SSL connections`
- `DATABASE_SSL=on` — erro `no pg_hba.conf entry ... no encryption`

O log de arranque mostra a decisão: `[pg] host <nome> — TLS ligado|desligado`.
