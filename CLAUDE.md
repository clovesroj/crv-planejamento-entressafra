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
Está assim de propósito em `server/estatico.js`. Como o app carrega ~50 módulos
por URL fixa, cache longo faria o navegador juntar HTML novo com módulo velho no
primeiro acesso depois de um deploy. Se o custo incomodar, a saída é versionar a
URL dos módulos num build — **não** aumentar o `max-age`.

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
| Rateio entre etapas, consolidação | `public/js/calculo/index.js` |
| Layout ou colunas de uma aba | `public/js/ui/<aba>.js` |
| Campo novo que precisa ser salvo | `nucleo/estado.js` → `io/persistencia.js` (`estado()` e `aplicar()`) |
| Rota da API, autenticação | `server/api.js` |
| Esquema do banco | `server/store/schema.sql` |

## Dívidas conhecidas

Não são descuido — foram levantadas, documentadas e deixadas para depois de
propósito. Em ordem de gravidade:

1. **Sem autenticação.** O serviço está aberto na internet: qualquer pessoa com
   o endereço lê e grava o plano, incluindo salários. `server/api.js` é o ponto
   de entrada e hoje tem menos de 60 linhas — a mudança é pequena.
2. **Escape de HTML inconsistente.** Campos de texto livre (fazenda, insumo,
   rota) vão para `innerHTML` sem escapar na maioria das telas; só duas definem
   um `esc` local. Combinado com o item 1, é XSS armazenado.
3. **O merge não é campo a campo como o README dá a entender.** O `||` do `jsonb`
   mescla apenas o primeiro nível, e o cliente envia o objeto inteiro. Duas
   pessoas editando atividades diferentes ao mesmo tempo: a última grava por cima.
4. **Sem `package-lock.json`, sem testes, sem lint, sem CI** — num motor de
   cálculo que define orçamento.
5. **Postgres gratuito do Render expira em 30 dias** e apaga os dados.
6. **Um blob, uma linha, uma safra.** Não há histórico, usuário, auditoria, nem
   suporte a mais de uma safra ou unidade.

## Ambiente de desenvolvimento

O app precisa de servidor: por `file://` o navegador trata a página como origem
opaca e recusa módulos ES. `npm install && npm start` sobe em
`http://localhost:10000`.

---

*Reestruturação de setembro de 2026 por Caio Souza. Se você é um assistente e
vai propor mudanças aqui, respeite os invariantes acima e prove suas alterações
contra o contrato de regressão — foi assim que esta base chegou até você.*
