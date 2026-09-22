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

## Para quem está chegando

Três documentos, cada um com um papel:

| Leia | Para saber |
|---|---|
| Este README | o que o sistema faz, como está organizado, como rodar e publicar |
| [CLAUDE.md](CLAUDE.md) | as regras que não podem quebrar, as armadilhas já conhecidas e como provar que uma mudança não alterou nada — **leia antes de mexer** (vale para pessoas e para assistentes de IA) |
| [CHANGELOG.md](CHANGELOG.md) | o que mudou em cada versão e por quê, com o commit e o autor |

O modelo mental cabe em uma linha: **o que o usuário edita mora em
`nucleo/estado.js` → `calcular()` transforma isso em números → cada aba pinta os
números → `salvar()` grava o documento → o servidor filtra pelo perfil antes de
gravar.** Nenhuma tela calcula custo, e nenhum cálculo toca na tela.

O time publica direto no `main`, e todo push no `main` vai para produção (o
Render faz o deploy sozinho). Trabalhe num branch e só leve ao `main` o que foi
conferido.

## Módulos

O menu lateral agrupa as abas assim:

| Grupo | Aba | Conteúdo |
|---|---|---|
| Visão geral | Capa | Custo total, custo por hectare, hectares operados, efetivo e situação do plano |
| | Painel | Indicadores, custo de colheita R$/t, grandes contas por mês |
| | Acompanhamento do Plano | Realizado × planejado mês a mês, metas por gerência e **critério por mês** (o que cada mês exige de frota, rendimento, disponibilidade e utilização) |
| | Validação | Checagens automáticas de consistência — inclusive dado sem aba de permissão, janela de datas descartada e conta sem mapeamento no Plano de Contas |
| Planejamento | Premissas | Parâmetros agronômicos, operacionais e econômicos, incluindo a **base física dos custos** (áreas de plantio, tratos por cultura e colheita, volume colhido — o divisor de todo custo por hectare/tonelada), disponibilidade mecânica e eficiência operacional |
| | Plano Operacional | Área/tonelada por atividade e mês, até dois tratamentos por atividade dividindo a área, janela de datas de execução |
| | Dimensionamento | Horas, rendimento, frota e efetivo por atividade; frota como entrada (o rendimento passa a ser o calculado) e critério mês a mês no modal da atividade |
| | Cadastro de Atividades | As atividades que aparecem no Plano Operacional e no Dimensionamento, com rendimento em ha/h ou ton/h; cria atividade nova além do cadastro padrão do sistema |
| Pessoas | Mão de Obra | Encargos, benefícios, funções, níveis salariais e escalas |
| | Resumo de Pessoas | Efetivo por departamento e função, mobilização e custo de mão de obra mês a mês |
| Agricultura | Insumos | Composição dos tratamentos — editar, duplicar e remover por linha, com vínculo direto a uma atividade — e materiais de manutenção, com mês de alocação do recurso |
| | Manejo Fitossanitário | Broca e Cigarrinha à parte do resto do Plano Operacional: volume, valor de insumo e terceirização (aérea ou terrestre) por onda de aplicação |
| | Irrigação | Dimensionamento hidráulico e energia por modalidade |
| | Fornecedores de Cana | Contratos, estimativa de entrega, ATR e preço |
| Frota e logística | Transporte | Transbordo e transporte de cana por raio, ciclo e capacidade |
| | Combustível | Volume de diesel mês a mês, consumo editável por equipamento (L/h para máquina ou L/km para veículo, com horas e km projetados), preço projetado por mês; referência de mercado (ANP) por município e combustível, com histórico semanal e detalhe por posto pesquisado |
| | Apoio | Equipamentos de apoio por quantidade e horas |
| | Transporte de Pessoal | Rotas, diárias de ônibus e quilometragem |
| Manutenção de frota | Manutenção de Frota | CRM por especialidade, modelo e equipamento; destino de cada frota na safra |
| | Reforma de Frota | Provisionamento da reforma, orçado por equipamento e conjunto |
| | Resumo de Frota | Necessidade do plano confrontada com a frota cadastrada |
| Custos | Arrendamentos | Contratos, forma e meses de pagamento (valor por pagamento), custo mensal e rateio por etapa (referência PECEGE/USP) |
| | Custos Administrativos | Estrutura, pessoal administrativo e rateio |
| | Custos | Custo por etapa, por natureza e mensal; **custo operacional** (o que cada operação gasta, sem rateio) e **custo contábil** (com os rateios), lado a lado |
| | Plano de Contas | Custo projetado por conta contábil, fechando com o custo total do plano — o que não tem conta cai numa linha "Sem conta" à parte |
| Configurações | Cadastro de Insumos | Os produtos, em blocos por família e ordem de princípio ativo; ficha técnica, editar em modal e link da bula pela API AGROFIT (Embrapa) |
| | Grupos de Insumos | Grupos personalizados, além das famílias padrão |
| Administração | Orientações | Como usar o sistema e as premissas que ainda precisam de confirmação (só o administrador vê) |
| | Usuários | Usuários, perfis e a matriz de quais abas cada perfil edita (só o administrador vê) |

**Relatórios:** 21 relatórios (orçamento anual, por fazenda, por etapa, fluxo de
caixa, metas por gerência, critério operacional por mês e outros), em nível
resumido ou detalhado, pelo atalho **Relatório** no menu lateral. O painel
mostra uma **pré-visualização** na tela e gera **PDF** (folha A4), **Excel** (uma
aba por seção) ou **CSV**.

### Recursos de todas as telas

- **Filtro de período** na barra superior — Ano todo, Safra, Entressafra ou meses
  escolhidos a dedo. Vale para toda tabela mensal do app, e os totais passam a
  ser do período à mostra.
- **Busca por nome** acima das tabelas, filtrando as linhas enquanto se digita.
- **Coluna arrastável**: o cabeçalho pode ser arrastado para trocar colunas de
  lugar. A ordem fica guardada no navegador, por usuário — não muda a tela de
  mais ninguém.
- **KPIs e rastro clicáveis**: cada número de destaque abre de onde ele veio.
- **Navegação em blocos**: aba com mais de um assunto (Mão de Obra, Manutenção
  de Frota, Combustível, Arrendamentos, Custos, Plano de Contas, Fornecedores de
  Cana, Resumo de Frota, Resumo de Pessoas, Acompanhamento do Plano, Usuários...)
  abre o submenu lateral como página de fato: só um bloco fica visível por vez,
  não é scroll disfarçado de navegação.
- **Campo de busca em seletor com catálogo grande** (função, máquina base,
  tratamento, relatório, município da referência de combustível): digita e
  filtra a lista, em vez de rolar um `<select>` com centenas de opções.

Filtro, busca, ordem de coluna, grupos recolhidos e modais abertos são
**visão**, não dado: não entram no plano salvo e funcionam para qualquer perfil,
inclusive quem só visualiza.

## Arquitetura

```
public/                 FRONT — servido ao navegador
  index.html            só marcação: as 29 abas, os modais e a moldura
  css/                  tokens → layout → componentes → responsivo → impressão
                        (a ordem dos <link> importa: é a cascata)
  js/                   ~90 módulos ES, sem build
    dados/              CADASTRO — o que se edita para mudar uma regra de negócio
      cfg.js            monta o CFG a partir dos arquivos ao lado
      atividades.js     44 atividades · maquinas.js · insumos.js (produtos,
                        tratamentos, FAMILIAS_INSUMO) · crm.js · frota-base.js · ...
    nucleo/             base sem dependências
      estado.js         o que o usuário edita (dado) e o que ele está vendo
                        (visão), com setters — ver nota abaixo
      formato.js        $, fmt, brl, num, pct, esc (escape de HTML), urlWeb
      calendario.js     MESES (Abr/26–Mar/27), safra × entressafra, clsMes(),
                        dias do mês e janela de datas
      sessao.js         usuário logado e podeEditar(aba) — fora do plano salvo
    calculo/            MOTOR — sem DOM, sem I/O
      index.js          calcular(): orquestra e faz os rateios
      atividade.js      linha(): horas, frota, diesel, mão de obra por atividade;
                        janelaDe(), criterioMensal(), metaDe()
      acompanhamento.js realizado × planejado, criterioPorMes()
      base-fisica.js    divisor de cada operação (área de plantio, de cana
                        planta/soca, volume colhido...) — lido pela tela,
                        pelo relatório e pelo rastro, um lugar só
      contas.js         mapeia cada custo pra conta do Plano de Contas
      custo-operacao.js custo operacional × contábil, por operação
      consumo.js        L/h ou L/km por equipamento, na aba Combustível
      crm.js · mao-de-obra.js · arrendamento.js · insumos.js · irrigacao.js · ...
    ui/                 uma função pintar* por aba, só leem o resultado do cálculo;
                        componentes.js tem busca, combobox de busca, coluna
                        arrastável e somaSel()
    io/                 persistencia.js (estado/aplicar/migração) · relatorio.js ·
                        secoes.js (os 21 relatórios) · agrofit.js · anp.js
                        (referência de combustível) · arquivo.js
    app/                ciclo.js (render/leve) · eventos.js · acoes.js
    main.js             arranque

server/                 BACK
  index.js              monta o HTTP, roteia, trata SIGTERM
  env.js                carrega .env local sem sobrescrever o ambiente
  config.js             porta, caminhos, limites
  http.js               erro com status, resposta JSON, leitura de corpo
  auth.js               hash de senha, cookie de sessão, guardas de rota
  permissoes.js         catálogo aba → dados; filtra cada gravação pelo perfil
  janela.js             completa a migração 9 → 12 meses nas gravações filtradas
  agrofit.js            cliente da API AGROFIT (Embrapa), OAuth2 e prazo de 15 s
  anp.js                scraping da ANP (preço de combustível): descobre os
                        links da semana e baixa sob demanda, cache 12h/7 dias
  api.js                /api/health, /api/plano, /api/auth/*, /api/usuarios
                        (inclusive excluir), /api/perfis, /api/anp/*,
                        /api/agrofit/produtos-formulados
  estatico.js           arquivos de public/
  store/                BANCO
    index.js            escolhe o destino por DATABASE_URL
    postgres.js         produção · arquivo.js  local
    schema.sql          DDL de plano, usuarios, sessoes, perfis
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

`estado.js` guarda dois tipos de coisa, e a diferença importa:

- **dado** — o plano (`P`, `PLANO`, `DIM`, `INSX`, `ARREND`...). Entra em
  `estado()`, é gravado no servidor e passa pelo filtro de permissões;
- **visão** — o que a pessoa está olhando agora (`PERIODO_SEL`, `MESES_SEL`,
  `CRIT_GER`, `INS_FICHA`, `AGROFIT_BUSCA`, aba e item selecionados). Não entra em
  `estado()`, não passa por `salvar()` e não é compartilhada.

### Onde mexer para cada tipo de mudança

| Mudança | Arquivo |
|---|---|
| Preço, dose, máquina, conta contábil | `public/js/dados/<assunto>.js` |
| Valor padrão de uma premissa | `public/js/dados/padroes.js` |
| Fórmula de custo de uma atividade | `public/js/calculo/atividade.js` |
| Rateio entre etapas, consolidação | `public/js/calculo/index.js` |
| Divisor de um custo por hectare/tonelada (base física) | `public/js/calculo/base-fisica.js` |
| Em que conta contábil um custo cai | `public/js/calculo/contas.js` — lido pela aba, pelo relatório, pelo rastro e pela Validação, um lugar só |
| Consumo de diesel (L/h ou L/km) de um equipamento | `public/js/calculo/consumo.js` |
| Layout ou colunas de uma aba | `public/js/ui/<aba>.js` |
| Critério por mês, meta diária, janela de datas | `public/js/calculo/atividade.js` (`criterioMensal()`, `metaDe()`, `janelaDe()`) |
| Família (bloco) de um insumo pela classe | `public/js/dados/insumos.js` (`FAMILIAS_INSUMO` — a ordem é o desempate) |
| Relatório novo ou seção de relatório | `public/js/io/secoes.js` (`RELATORIOS` e as seções) |
| Tabela mensal nova | a aba em `ui/`, com `clsMes(i)` no cabeçalho e na célula e `somaSel()` no total, para o filtro de período funcionar |
| Busca ou coluna arrastável numa tabela | só marcação: `<input class="tbl-busca" data-alvo="#tabela">`; o resto é automático (`ui/componentes.js`) |
| Campo novo que precisa ser salvo | `nucleo/estado.js` + `io/persistencia.js` (`estado()` e `aplicar()`) + a aba dona dele em `server/permissoes.js` |
| Migração de formato do documento | `io/persistencia.js` **e** o espelho no servidor (hoje `server/janela.js`) — ver CLAUDE.md |
| Quais dados cada aba edita (permissões) | `server/permissoes.js` (`AREAS`) |
| Controle novo que só muda a visualização (filtro, abrir detalhe) | `public/js/ui/permissoes.js` (`VISUAIS`) |
| Rota da API | `server/api.js` |
| Integração com API externa (ex.: AGROFIT, ANP) | `server/<nome>.js`, credencial por variável de ambiente quando houver, nunca no código |
| Hash de senha, sessão, guardas de rota | `server/auth.js` |
| Esquema do banco (`plano`, `usuarios`, `sessoes`, `perfis`) | `server/store/schema.sql` |

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

Cada modelo abre no botão **+**, mostrando a frota física: código, ano de fabricação,
idade e se é própria ou de terceiro. Equipamento com 15 anos ou mais sai destacado.

### Item do plano x modelo da base

O plano dimensiona por **classe** (`Trator 4x4 150 CV`), a base cadastra **modelos**
(`JOHN DEERE 5090E`). Os dois convivem: o item do plano declara em `mod` qual modelo da
base representa, e aparece aninhado sob ele no registro, sem virar o modelo. Isso preserva
os parâmetros de projeto do item — diesel, horas e utilização são dele, não do modelo.

Dos 46 itens do plano com especialidade, **12 declaram um modelo**: os que têm
correspondência inequívoca (`Colhedora CH570` → JOHN DEERE CH570), os que são o único
modelo da especialidade, e a colheita de muda, que usa a mesma colhedora de cana. Os
outros 34 são classes sem modelo único correspondente — três classes de trator agrícola
para 28 modelos em campo não viram um modelo só — e aparecem marcados como *classe do
plano*. Preencher o `mod` deles é trabalho de quem conhece a frota.

### CRM por equipamento

O custo de manutenção pode ser lançado em três níveis, e o mais específico manda:

```
especialidade   taxa digitada na linha-mãe, vale para todo modelo dela
   modelo       taxa própria, quando o modelo foge da média
      frota      ← orçado por equipamento; a média sobe para o modelo e para a especialidade
```

Abrindo um modelo no **+**, cada equipamento aparece com ano, idade, origem e quatro campos
de CRM. O que for digitado ali gera a taxa do modelo pela média, e a média dos modelos gera
a da especialidade — que passa a exibir a tarja *da frota*. Campo em branco volta a herdar.

### Destino da frota na safra

Cada equipamento tem um destino, escolhido na mesma linha:

| Destino | Efeito |
|---|---|
| **Vai rodar** | Carrega CRM de safra e entra na média do modelo |
| **Vai reformar** | Sai da conta do CRM e entra no provisionamento da aba Reforma de Frota |
| **Stand by** | Não gera custo nenhum — nem CRM, nem reforma |

São excludentes: só o equipamento marcado como *vai rodar* gera CRM. O que está na bancada
entra na reforma, e o que está parado não entra em lugar nenhum. Cobrar manutenção de safra
de um equipamento em reforma contaria o mesmo custo duas vezes; de um parado, contaria custo
que não existe. Nos dois casos os campos de CRM ficam travados na linha.

O filtro **Destino na safra** isola um dos três — é assim que se abre "somente o que vai
rodar" para orçar a manutenção da safra.

O destino pode ser marcado em **três telas**, e é o mesmo dado nas três:

| Tela | Onde |
|---|---|
| Dimensionamento | *Frota por tipo de máquina* — abre a frota real da máquina no **+** |
| Manutenção de Frota | Ao abrir o modelo, junto dos campos de CRM |
| Resumo de Frota | Ao abrir a especialidade, com colunas de quantos rodam, reformam e estão parados |

Estão no Dimensionamento porque é ali que se olha quanta frota o plano exige — é onde a
pergunta "esse aqui vai aguentar a safra ou vai para a bancada?" aparece.

## Reforma de frota

Provisionamento da reforma de entressafra, orçado **por equipamento** e aberto nos conjuntos
mecânicos que vão à bancada. A lista de conjuntos muda conforme a família, seguindo a planilha
de orçamento de reforma da safra:

| Família | Conjuntos | Especialidades |
|---|---|---|
| Frota geral | 21 — motor, suspensão, freio, cabine, câmbio, diferencial… | todas as demais |
| Colhedora e esteira | 28 — corte de base, extratores, elevador, rolos, esteira, sapatas… | COLHEDORA - CANA, MAQUINA PESADA - TRATOR ESTEIRA |

A estrutura está em [`dados/reforma.js`](public/js/dados/reforma.js) e **nenhum valor vem
pré-preenchido** — o orçamento é digitado equipamento por equipamento. Só aparece na aba o
que estiver marcado como *vai reformar*.

A aba consolida por especialidade (equipamentos, orçados, total e média) e mostra em que
conjunto a reforma concentra gasto.

### Parâmetros de máquina

Diesel (L/h), horas disponíveis por mês e fator de utilização são editáveis na aba
Manutenção de Frota, por item do plano. São premissas de projeto, não medição: a mesma
colhedora pode entrar com números diferentes colhendo cana e colhendo muda. Em branco,
vale o cadastro de [`dados/maquinas.js`](public/js/dados/maquinas.js).

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

As gravações usam merge por **chave do documento** (`PLANO`, `DIM`, `ARREND`...): no
Postgres o merge acontece dentro do próprio `UPDATE` (operador `||` de `jsonb`), e não
em ler-alterar-gravar. Duas pessoas salvando ao mesmo tempo em assuntos diferentes não se
sobrescrevem; no **mesmo** assunto (duas atividades do Plano, por exemplo), vale a última
gravação, porque o navegador manda a chave inteira. Está anotado como dívida no
[CLAUDE.md](CLAUDE.md#dívidas-conhecidas).

Antes de gravar, o servidor descarta o que o perfil do usuário não pode editar (ver
[Perfis e permissões](#perfis-e-permissões)).

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

O servidor cria as tabelas (`plano`, `usuarios`, `sessoes`, `perfis`) sozinho no primeiro
acesso, com o DDL de [`server/store/schema.sql`](server/store/schema.sql).

### Variáveis de ambiente

| Variável | Obrigatória | De onde vem |
|---|---|---|
| `DATABASE_URL` | sim, em produção | injetada pelo blueprint (`render.yaml`) |
| `NODE_VERSION` | — | `render.yaml` (22) |
| `DATABASE_SSL` | não | só para forçar TLS — ver [Quando o TLS do banco falha](#quando-o-tls-do-banco-falha) |
| `AGROFIT_CLIENT_ID`, `AGROFIT_CLIENT_SECRET` | não | credenciais da AgroAPI da Embrapa. **Não estão no `render.yaml`**: crie à mão em *Environment* no painel do Render. Sem elas, o botão *Buscar* da bula responde "AGROFIT não configurado" e o resto do sistema funciona normalmente |

Localmente, as mesmas variáveis podem ir num arquivo `.env` na raiz (ignorado pelo git);
`server/env.js` o carrega sem sobrescrever o que já veio do ambiente.

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
  pago ou criar outro banco — expirado, os dados são apagados. Para exportar, use
  *Relatório › Excel* no menu lateral ou `pg_dump` na *External Database URL*.

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
para testar, mas sem o compartilhamento real. No primeiro acesso, crie o administrador
(ver [Acesso](#acesso)). Para testar a busca de bula, ponha as credenciais da AGROFIT num
`.env` (ver [Variáveis de ambiente](#variáveis-de-ambiente)). Para usar um Postgres:

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

O sistema exige login (usuário e senha, sem diferenciar maiúsculas de
minúsculas no usuário) — os campos de senha, na tela de login e no cadastro de
usuários, têm alternância mostrar/ocultar. Sessão por cookie (`httpOnly`,
`SameSite=Lax`, 30 dias), token opaco conferido contra a tabela `sessoes` a
cada requisição — desativar um usuário ou fazer logout derruba o acesso na
hora, não só no próximo login.
Detalhes de implementação (hash de senha, guardas de rota) estão no
[CLAUDE.md](CLAUDE.md#autenticação).

### Perfis e permissões

Todo usuário logado **vê todas as abas**. O **perfil** define em quais ele
**edita** — nas demais, os campos e botões aparecem desativados, com o aviso
*Somente visualização*, e filtros, detalhamentos, exportar e tema continuam
funcionando.

- **Administrador** edita tudo e é o único que gerencia usuários e perfis.
- **Usuário** é o perfil padrão e nasce com *Edita tudo* — o comportamento de
  antes dos perfis, então ninguém perdeu acesso quando eles entraram.
- Perfis novos (ex.: *Agrícola*, *Logística*) são criados na aba **Usuários ›
  Perfis e permissões**, numa matriz aba × perfil. Perfil novo nasce só com
  visualização; o administrador marca as abas que ele edita. *Edita tudo* vale
  também para abas criadas no futuro.

Algumas abas não têm permissão própria e seguem a de outra: *Cadastro de
Insumos*, *Grupos de Insumos* e a busca de bula na AGROFIT seguem a de
**Insumos**. Um mesmo dado pode ter duas abas donas: a área irrigada mora no
Plano, então quem edita **Irrigação** também grava o Plano. A tela só deixa mexer
no que a Irrigação mostra, mas o servidor controla por assunto do documento, não
por campo — ver [CLAUDE.md](CLAUDE.md#perfis-e-permissões).

Trocar as permissões de um perfil vale na hora, inclusive para quem já está com
o sistema aberto: o servidor confere o perfil a cada gravação. Não dá para
excluir perfil em uso, nem tirar o acesso do último administrador ativo, nem um
administrador rebaixar ou desativar a si mesmo.

Um usuário pode ser **desativado** (corta o acesso na hora, mantém o cadastro
e o histórico) ou **excluído** (apaga o cadastro de vez — não dá para desfazer).
As mesmas travas valem para os dois: ninguém desativa ou exclui o próprio
usuário logado, nem o último administrador ativo.

**A regra de verdade está no servidor**
([`server/permissoes.js`](server/permissoes.js)): em toda gravação do plano, o
que o perfil não pode alterar é descartado antes de chegar ao banco, e o rodapé
avisa *Salvo — sem permissão para alterar: …*. A trava da tela
([`public/js/ui/permissoes.js`](public/js/ui/permissoes.js)) é conveniência.

A troca da própria senha fica na aba Usuários, que hoje só o administrador vê —
para os demais perfis, quem redefine a senha é o administrador.

**Primeiro acesso**: com o banco vazio, `POST /api/auth/bootstrap
{"login":"...","senha":"..."}` cria o primeiro usuário como admin — e só
funciona essa vez; depois disso responde sempre 409. Não há usuário nem senha
fixos no código-fonte.

## Premissas a confirmar

A mesma lista, sempre atualizada, está na aba **Orientações** do app (grupo
Administração, só o administrador vê) — foi tirada da Capa em 2026-09-21 para
não repetir a cada acesso.

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
