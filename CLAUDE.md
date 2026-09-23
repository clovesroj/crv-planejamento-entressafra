# Orientações para quem for mexer neste repositório

Este arquivo é lido automaticamente por assistentes de código. Leia antes de
propor qualquer mudança. O [README](README.md) descreve o produto; aqui estão as
decisões de estrutura, os invariantes e como provar que uma alteração não
quebrou nada.

## De onde este código veio

Até setembro de 2026 o sistema inteiro era **um arquivo**: `index.html` com
3.495 linhas — CSS, marcação, 2.608 linhas de JavaScript, uma linha de 46 KB com
todo o cadastro de negócio e outra de 14 KB com o logotipo em base64. Funcionava,
e o código era bem escrito: comentários que explicam o *porquê*, tratamento de
concorrência pensado, sistema de design com tokens. O problema não era a escrita,
era o formato — qualquer alteração exigia carregar o arquivo inteiro, e edição
cirúrgica numa linha de 46 KB é inviável.

A separação em `public/` (front), `server/` (back) e `public/js/dados/`
(cadastro) foi conduzida por **Caio Souza** em 2026-09-15, sob um requisito que
vale repetir porque moldou tudo: **não perder nada e não alterar uma vírgula da
lógica de cálculo.**

O método importa tanto quanto o resultado, e é o que torna esta base confiável:

1. **Nada foi reescrito.** Os 2.608 linhas de JavaScript foram recortadas por
   intervalos de linha, a partir de um manifesto contíguo e sem buracos.
   Reconcatenar os pedaços na ordem reproduz o original byte a byte — isso foi
   verificado, não presumido.
2. **Um contrato de regressão foi capturado antes de mexer** (ver abaixo), com os
   dados reais de produção como fixture, e conferido de novo no fim.
3. **O motor de cálculo e as 19 telas renderizadas saíram idênticos**, conferidos
   por impressão digital, não por inspeção visual.

Se você for refatorar algo aqui, use o mesmo padrão: capture o contrato antes,
mova sem reescrever, prove a equivalência depois.

### Como a base evoluiu depois disso

De 15 a 17/09 a base foi da 2.0.0 à 2.22.1, com quatro pessoas publicando
direto no `main` — **Caio Souza** (estrutura, login, perfis e permissões,
revisões de continuidade), **tkaique9-cloud** (dimensionamento, critério por
mês, filtro de período, cadastro de insumos por família), **clovesroj**
(arrendamento, classificação técnica dos insumos) e **aureniorg3**
(Configurações, AGROFIT). O [CHANGELOG](CHANGELOG.md) tem cada versão; o que
entrou só pelo git no dia 17 está consolidado lá, por assunto, com o commit.

As mensagens de commit do time carregam a conferência, e vale manter o hábito:
o caso que motivou, a conta refeita à mão, se mexe em custo ("plano vazio segue
X" quando não mexe) e o que foi testado ("as 21 folhas geram sem erro"). É dali
que se reconstrói o porquê de uma regra.

## Invariantes — não quebre estes

**1. O grafo de dependências é acíclico e sobe numa direção só.**
`dados → nucleo → calculo → ui → app`. Foi verificado que não há ciclos. Se você
precisar importar "para trás" (um módulo de `calculo` querendo algo de `ui`, por
exemplo), o desenho está errado — passe o valor por parâmetro.

**2. `calculo/` não conhece o DOM e não faz I/O.**
É função pura de estado → números. É o que permite testá-lo e o que permitiria
movê-lo para o servidor um dia. Não chame `document` ali dentro.

**3. Dado de negócio mora em `public/js/dados/`, nunca no meio da lógica.**
Preço, dose, máquina, conta contábil, rota de ônibus: tudo em arquivo próprio,
um registro por linha. Se você se pegar escrevendo um número de negócio dentro
de `calculo/` ou `ui/`, ele está no lugar errado.

**4. Estado mutável só troca por setter.**
Módulos ES não deixam atribuir a um símbolo importado. `nucleo/estado.js` exporta
o valor **e** o setter:

```js
import { P, setP } from '../nucleo/estado.js';
P.diesel = 6.5;          // mexer no conteúdo: direto
setP({ ...PADRAO });     // trocar o objeto: pelo setter
```

Esquecer isso dá `TypeError: Assignment to constant variable`.

**5. O formato do documento salvo é contrato com o banco de produção.**
As chaves de `estado()` em `io/persistencia.js`, o `v:10` e a chave
`crv_plano_v10` do `localStorage` correspondem ao que está gravado **hoje, em
uso, no Postgres do Render**. Mudar qualquer um deles exige migrar o documento
existente. Campo novo entra em `nucleo/estado.js`, em `estado()` e em `aplicar()`
— nessa ordem, e sem renomear os que já existem.

**6. Cache: `.js` e `.css` revalidam a cada carga.**
Está assim de propósito em `server/estatico.js`. Como o app carrega ~90 módulos
por URL fixa, cache longo faria o navegador juntar HTML novo com módulo velho no
primeiro acesso depois de um deploy. Se o custo incomodar, a saída é versionar a
URL dos módulos num build — **não** aumentar o `max-age`.

**7. Dado e visão não se misturam.**
`nucleo/estado.js` guarda os dois. **Dado** é o plano: entra em `estado()`, é
gravado e passa pelo filtro de permissões. **Visão** é o que a pessoa está olhando
— período (`PERIODO_SEL`, `MESES_SEL`), filtros (`CRIT_GER`, grupo de insumo),
modal aberto (`INS_FICHA`, `AGROFIT_BUSCA`), item selecionado: não entra em
`estado()` e não chama `salvar()`. Preferência de uma pessoa que precisa
sobreviver ao recarregar (ordem de coluna, menu recolhido) vai para o
`localStorage` com o login na chave, nunca para o documento compartilhado.
Controle de visão novo entra em `VISUAIS` (`ui/permissoes.js`), senão fica
travado para quem só visualiza.

## Contrato de regressão

Qualquer mudança que não pretenda alterar números deve preservar isto. Aplique a
fixture com `aplicar()` e compare.

Hash = DJB2 sobre serialização canônica (chaves ordenadas recursivamente):

```js
const canon = v => v===null||typeof v!=='object' ? JSON.stringify(v)
  : Array.isArray(v) ? '['+v.map(canon).join(',')+']'
  : '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}';
const h = s => { let x=5381; for(let i=0;i<s.length;i++) x=((x*33)^s.charCodeAt(i))>>>0;
                 return x.toString(16).padStart(8,'0'); };
```

| Cenário | `calcularCompleto()` | `total` |
|---|---|---|
| Fixture de produção (2026-09-15) | `8af884c9`, 94.322 chars | 37.921.587,66733203 |
| Plano vazio (só `PADRAO`) | — | 29.260.997,973158002 |

> **A linha "plano vazio" acima está defasada.** Ela foi capturada antes dos commits
> de arrendamentos, fornecedores, combustível e segmentação safra/entressafra, que
> mudaram o total legitimamente. Remedido na árvore limpa em `050a344`:
> 38.897.437,297543995, com `crmTotal` 402.033,5999999999.
>
> **Valor corrente, a partir da correção do `conv` na frota de apoio:**
> plano vazio = **39.158.394,097544**, `crmTotal` 402.033,5999999999.
> A alta de 260.956,80 (+0,671%) é a correção, não regressão — ver o commit.
>
> A linha da fixture de produção não foi reconferida: exige a fixture, que não
> está no repositório.
>
> **Depois disso houve mais mudanças intencionais de cálculo** (CHANGELOG da
> 2.18.0 em diante: arrendamento por pagamento, eficiência operacional,
> transporte herdando a janela da colheita). Os commits de 17/09 citam
> plano vazio = **39.270.751,842344** como referência. Antes de usar qualquer
> número desta seção, meça no HEAD e compare antes/depois da sua mudança — é
> a comparação que prova, não o número absoluto.

**Dois invariantes que vale a pena checar:**

1. O CRM rateado por etapa fecha com o CRM total. Era isto que o `conv` esquecido
   quebrava.
2. Toda linha do registro com especialidade usa a unidade que o ERP atribui a ela.
   A categoria do app só decide para item sem frota (serviço, mão de obra).

```js
const R = ciclo.calcularCompleto();
Math.abs(R.crmTotal - Object.values(R.crmEtapa).reduce((a,b)=>a+b,0)) < 0.01;   // true
R.crmFrotaL.every(l => !l.esp || l.unidade === (baseDe(l.esp)==='K' ? 'km' : 'h')); // true
```

O alinhamento das unidades com o ERP foi feito convertendo as taxas pela mesma
velocidade média, então **não mexeu no total** — 39.158.394,097544 antes e depois.
Só é neutro porque a correção do `conv` veio antes: enquanto a frota de apoio
ignorava `conv`, trocar a unidade de um item mudava o custo dele.

Impressão digital do `innerHTML` das 19 seções após `render()`, com a mesma
fixture:

```
apoio 63be5c7c:29573     arrend be67fdd7:13455   capa 1770d70a:13229
combust 243d269e:13906   contas d61f799f:15736   custos cd8e325c:16125
dimens 57ab09e6:34080    frota 83b9a7d9:11050    insumos bdaf7ce0:80956
irrig fe003929:4986      mdo 21f945dc:19778      painel 018901ac:16928
pessoas 6a0c2148:25629   plano 60d2c9d7:191347   premissas b5dd8f72:2862
resumofrota 96c06105:8184 tpess d22ea418:7759    transp 4ce4228f:3447
valida 606fcb08:3806     nav 82c7a62e            topbar 97be9816
```

Os módulos são singletons, então dá para medir pelo console sem alterar código:

```js
const ciclo = await import('/js/app/ciclo.js');
const pers  = await import('/js/io/persistencia.js');
pers.aplicar(await (await fetch('/api/plano')).json().then(d => d.data));
const R = ciclo.calcularCompleto();
h(canon(R)) + ':' + canon(R).length;
```

## Onde mexer para cada tipo de mudança

| Mudança | Arquivo |
|---|---|
| Preço, dose, máquina, conta contábil | `public/js/dados/<assunto>.js` |
| Valor padrão de uma premissa | `public/js/dados/padroes.js` |
| Fórmula de custo de uma atividade | `public/js/calculo/atividade.js` |
| Janela de datas, dias do mês, critério por mês, meta diária | `public/js/calculo/atividade.js` (`janelaDe()`, `diasDoMes()`, `criterioMensal()`, `metaDe()`) — a mesma conta serve modal, rastro, motor e relatórios; não duplique |
| Hora efetiva (jornada × disponibilidade × utilização × eficiência) | `public/js/calculo/atividade.js` (`eficPadrao()` e o uso de `P.disp`, `util`, `efic`) |
| Rateio entre etapas, consolidação | `public/js/calculo/index.js` |
| Gerência (agrícola × logística) de uma atividade | `public/js/calculo/acompanhamento.js` — a lista é a da agrícola; o resto é logística |
| Família de insumo deduzida da classe | `public/js/dados/insumos.js` (`FAMILIAS_INSUMO`; a ordem é o desempate) |
| Layout ou colunas de uma aba | `public/js/ui/<aba>.js` |
| Alinhamento de coluna nova | nada de CSS: o flag `1` em `th([...])` marca a coluna numérica, e o cabeçalho cai sozinho no eixo do dado (`th`/`th.num` em `componentes.css`). Flag errado agora aparece na tela, não fica escondido atrás de um cabeçalho centralizado |
| Frota ou efetivo mostrado numa tela | `frotaDaAtividade()` / `pessoasDaAtividade()` (`calculo/atividade.js`) — **`pico` é o que tem de existir, `media` é o que rateia custo**; nunca leia `r.frotaR`/`r.efetivo` direto para mostrar |
| Jornada/disponibilidade de uma atividade | `premissasDe(a)` (`calculo/atividade.js`) — transporte tem as suas (`hDiaTr`, `dispTr`); não leia `P.hdia`/`P.disp` direto |
| Ordem de uma lista de atividades | `ordenarPorEtapa()` (`ui/componentes.js`) — ordem agronômica, estável dentro da etapa |
| Tabela mensal nova | `clsMes(i)` no `<th>` e no `<td>` de cada mês, e `somaSel()`/`maxSel()` no total — senão o filtro de período desalinha a tabela e o total não fecha |
| Busca e coluna arrastável | só marcação (`<input class="tbl-busca" data-alvo="#tabela">`); `ui/componentes.js` aplica no fim de `render()` |
| Relatório ou seção de relatório | `public/js/io/secoes.js` — leia as funções do cálculo, não recalcule |
| Campo novo que precisa ser salvo | `nucleo/estado.js` → `io/persistencia.js` (`estado()` e `aplicar()`) → aba dona em `server/permissoes.js` |
| Campo de texto novo no cadastro de insumos | também na lista de campos de texto do editor de linha (`app/eventos.js`, hoje `["un","pa","conc","cod","classe","fam"]`) — fora dela, o valor é convertido em número e grava `NaN` |
| Quais dados cada aba edita (permissões) | `server/permissoes.js` (`AREAS`) |
| Migração de formato do documento (ex.: 9 → 12 meses) | `io/persistencia.js` (`migrarJanela`) **e** `server/janela.js` — as duas, com a mesma regra |
| Controle que só muda a visualização | `public/js/ui/permissoes.js` (`VISUAIS`) |
| Rota da API | `server/api.js` |
| API externa (ex.: AGROFIT) | `server/<nome>.js`, com prazo (`AbortSignal.timeout`) e credencial por variável de ambiente (`server/env.js` lê o `.env` local) |
| Hash de senha, sessão, guardas de rota | `server/auth.js` |
| Esquema do banco (`plano`, `usuarios`, `sessoes`, `perfis`) | `server/store/schema.sql` |

## Autenticação

Desde 2026-09-16 o acesso exige login — `server/auth.js` (hash de senha com
`crypto.scrypt` nativo, sem dependência nova) + tabelas `usuarios` e `sessoes`
em [schema.sql](server/store/schema.sql). Sessão é um **token opaco em
cookie** (`httpOnly`, `SameSite=Lax`), não JWT: cada requisição confere o
token contra `store.sessaoValida()`, então desativar um usuário ou fazer
logout mata a sessão na hora, não só no próximo login.

`POST /api/auth/bootstrap` cria o primeiro usuário (sempre `admin`) e só
funciona **uma vez**, enquanto a tabela `usuarios` estiver vazia — depois
disso responde sempre 409. É assim que o primeiro admin é criado sem senha
nenhuma em texto puro no código-fonte, schema ou histórico do git.

Sessão do usuário logado mora em `public/js/nucleo/sessao.js`, deliberadamente
**fora** de `estado()`/`aplicar()` em `io/persistencia.js` — não é dado do
plano, não entra no documento salvo (não conflita com o invariante nº5).

### Perfis e permissões

Implementado por **Caio Souza** em 2026-09-17 (versão 2.17.0). Todo usuário
logado vê todas as abas; o perfil define em quais ele edita. Se for mexer aqui,
estes são os pontos que não podem quebrar:

- **O servidor é a autoridade.** `filtrarGravacao()` em
  [server/permissoes.js](server/permissoes.js) descarta, em toda gravação do
  plano, o que o perfil não pode alterar. A trava da tela
  ([public/js/ui/permissoes.js](public/js/ui/permissoes.js)) é conveniência —
  nunca mova a regra só para o front.
- **Todo dado salvo precisa de uma aba dona em `AREAS`.** Chave (ou campo de
  `P`) fora do catálogo só o administrador grava: para os outros perfis, a
  edição some em silêncio. A aba Validação acusa isso em *"Todo dado editável
  tem aba de permissão"*. O catálogo foi **medido** — cada controle de cada aba
  acionado, anotando que chave mudou —, não deduzido lendo o código. Uma chave
  pode ter mais de uma aba dona (`PLANO` é editado no Plano e na Irrigação;
  `FROTA_UN` em quatro abas).
- **Controle novo nasce travado para quem não edita a aba.** Se ele só muda a
  visualização, inclua em `VISUAIS`; senão o perfil perde um filtro ou um
  detalhamento.
- **O navegador manda o documento inteiro** a cada gravação, e o app cria ou
  normaliza listas ao abrir. Por isso o servidor compara com o banco (em forma
  canônica — o jsonb reordena chaves) e a tela só avisa do que o usuário mudou
  desde a primeira pintura (`marcarBaseGravacao()`); sem isso, todo perfil
  restrito veria um aviso falso de "sem permissão" a cada gravação.
- **Migração que mexe em várias chaves precisa chegar inteira ao banco.** O
  perfil grava só parte das chaves; se a migração for detectada por uma chave
  e aplicada em outras, o documento fica metade em cada formato. Por isso o
  servidor completa a migração de 9 para 12 meses (`server/janela.js`) na
  gravação de quem não grava PLANO, DIESEL_MES e ARREND juntos — foi o bug
  corrigido na 2.22.1.
- **A permissão é por chave do documento, não por campo.** Quem edita a
  Irrigação grava `PLANO` inteiro no servidor; a tela é que só deixa mexer no
  que a Irrigação mostra. Se um dia isso precisar ser mais fino, o caminho é
  dividir a chave em `AREAS` como já se faz com os campos de `P`.
- **Ao perguntar "este perfil grava a chave X?", olhe todas as abas donas.**
  `podeEditar("plano")` sozinho erra para quem edita Irrigação, que também grava
  `PLANO` — era o aviso falso de "vínculo não será salvo" corrigido na 2.22.1.
  Use `areasDePermissao()` (`nucleo/sessao.js`) e procure a chave.
- **Abas sem permissão própria** seguem a de outra: Cadastro de Insumos, Grupos
  de Insumos e a rota da AGROFIT seguem `insumos` (`areaDe()` em
  `ui/permissoes.js` e a guarda em `server/api.js`).
- **Perfil inexistente cai em somente visualização**, nunca em acesso total.
  `admin` não mora na tabela `perfis` e edita tudo sempre. `usuario` nasce com
  `["*"]` para ninguém perder acesso no deploy.
- **Nunca sem administrador ativo:** a API recusa rebaixar ou desativar o
  último, e um administrador não rebaixa nem desativa a si mesmo.

Verificação feita ao implementar: 31 testes da API (permissão, guardas, perfil
apagado, permissão alterada com sessão aberta) e a tela real rodando contra o
servidor real no navegador, com um perfil restrito forçando edição em 143 tipos
de controle — no banco só mudaram dados das abas permitidas — e o motor de
cálculo idêntico.

## Armadilhas já conhecidas

Cada item abaixo já custou um bug. Vale ler antes de mexer na área.

- **Janela de datas do Plano** (`janelaDe()`): vale a data da própria atividade;
  sem ela, transporte e transbordo herdam a da colheita; sem nenhuma, os meses
  com volume; sem volume, o ano inteiro. Janela inutilizável — só uma data, data
  inválida, fim antes do início, ou totalmente fora de Abr/26–Mar/27 — é
  **ignorada** e cai nos meses com volume. A aba Validação acusa as três
  situações: janela ignorada, janela que passa do ano agrícola e volume fora da
  janela. `mesesEntre()` recorta a janela no horizonte, e `diasDoMes()` recorta o
  mês pela janela (mês parcial).
- **Critério por mês manda na frota alvo da atividade.** Com algum mês lançado, a
  frota da atividade fica suspensa (tarja *frota do mês manda*). Frota fixada só
  vale em atividade de frente única.
- **Pico e média são respostas diferentes.** A frota (e a equipe) do mês que
  mais pede é o que tem de existir; a média da janela é o que o motor usa para
  ratear custo. Toda tela mostra o **pico**; onde aparecer a média, ela tem de
  estar rotulada como média. Misturar as duas foi o que deixou 44 numa tela e 70
  na outra para o mesmo transbordo.
- **Tabela reordenada na tela carrega o índice original.** O cadastro de insumos
  sai por família, mas cada linha leva `data-in` com a posição em `insLista()`.
  Usar a posição exibida faz editar um produto e gravar em outro.
- **`[hidden]` perde para `display` próprio.** Elemento com classe que define
  `display` (`.chip`, `.tela-login`) precisa de `[hidden]{display:none}`
  explícito — foi o chip "Somente visualização" aparecendo para o administrador.
- **Texto do usuário que vai para HTML:** `esc()` de `nucleo/formato.js`. URL
  externa em `href`: `urlWeb()` (só http/https — `esc()` não barra
  `javascript:`). Código de tratamento: só o formato de `codigoTratValido()`
  (`calculo/insumos.js`), porque ele vai cru para muitos lugares.
- **Migração que toca várias chaves precisa chegar inteira ao banco** — ver
  Perfis e permissões. Mudou `migrarJanela()`, mude `server/janela.js`.
- **`render()` roda a cada tecla.** O arrasto só mexe no DOM quando há ordem
  salva, e abrir ou fechar modal redesenha só o modal. A busca reaplica as 45
  caixas a cada `render()`. Não pendure mais trabalho pesado no fim dele.

## Como provar que uma mudança não quebrou nada

Não há suíte de testes (ver dívidas). O que o time usa, e o que foi usado nas
revisões:

1. **Motor:** hash de `calcularCompleto()` antes e depois, com o mesmo documento
   (ver Contrato de regressão). Mudança que não pretende alterar número tem de
   dar o mesmo hash; a que pretende deve dizer, no commit, quanto e por quê.
2. **Telas:** hash do `innerHTML` de cada `section[id]` depois de `render()`.
3. **Relatórios:** gerar os 21, nos dois níveis, sem erro.
4. **Validação:** nenhum "!" novo que não seja o esperado.
5. **Permissões,** se mexeu em dado salvo ou em controle: entrar com um perfil
   restrito, acionar os controles de todas as abas e conferir no banco que só
   mudaram as chaves das abas liberadas. Chave nova sem aba dona aparece na
   Validação em *"Todo dado editável tem aba de permissão"*.
6. **Documento antigo:** abrir um plano gravado antes da mudança (a fixture de
   15/09 ainda está em 9 meses) e salvar com um perfil restrito — é onde as
   migrações quebram.

## Dívidas conhecidas

Não são descuido — foram levantadas, documentadas e deixadas para depois de
propósito. Em ordem de gravidade:

1. **Escape de HTML incompleto.** `esc()` agora é um só (`nucleo/formato.js`) e
   14 módulos o usam, mas 17 telas de `ui/` ainda montam HTML sem ele — algumas
   só com números e nomes do cadastro, outras com texto livre (fornecedor,
   fazenda, detalhe da Validação). Menos grave porque só usuário autenticado
   grava, mas continua sendo XSS armazenado em potencial entre usuários.
2. **O merge não é campo a campo como o README dá a entender.** O `||` do `jsonb`
   mescla apenas o primeiro nível, e o cliente envia o objeto inteiro. Duas
   pessoas editando atividades diferentes ao mesmo tempo: a última grava por cima.
3. **Sem `package-lock.json`, sem testes, sem lint, sem CI** — num motor de
   cálculo que define orçamento.
4. **Postgres gratuito do Render expira em 30 dias** e apaga os dados —
   inclusive os usuários agora.
5. **Um blob, uma linha, uma safra.** Não há histórico nem auditoria de quem
   mudou o quê (autenticação sabe *quem está logado*, não guarda *quem editou
   cada campo*), nem suporte a mais de uma safra ou unidade.
6. **Sem token CSRF dedicado, sem rate-limit de login.** O `SameSite=Lax` do
   cookie cobre o vetor clássico de CSRF, e a mensagem de erro do login não
   distingue usuário inexistente de senha errada — mitigação proporcional ao
   resto da postura de segurança atual, não blindagem completa.
7. **Regra de migração em dois lugares.** A migração de 9 para 12 meses existe no
   navegador (`migrarJanela()`) e no servidor (`server/janela.js`), porque o
   servidor precisa completá-la para perfis restritos. Sem build, não há como
   compartilhar o código entre os dois; o comentário de cada lado aponta o outro.
8. **Todo mundo publica no `main`, e o `main` vai para produção.** Não há
   revisão obrigatória antes do deploy: um erro chega aos usuários no mesmo
   push. Trabalhar num branch e conferir com os passos acima reduz isso.

## Ambiente de desenvolvimento

O app precisa de servidor: por `file://` o navegador trata a página como origem
opaca e recusa módulos ES. `npm install && npm start` sobe em
`http://localhost:10000`. Sem `DATABASE_URL`, grava em `.data/plano.json`.
Credenciais de API externa (hoje só a AGROFIT) vão num `.env` na raiz, que o
git ignora; ver *Variáveis de ambiente* no [README](README.md).

---

*Reestruturação de setembro de 2026, perfis e permissões e revisões de
continuidade por Caio Souza. Se você é um assistente e vai propor mudanças aqui,
respeite os invariantes acima e prove suas alterações contra o contrato de
regressão — foi assim que esta base chegou até você.*
