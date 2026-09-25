/**
 * Etapa de EXIBIÇÃO da atividade — camada de apresentação só, não dado.
 *
 * Até a versão 8 do cadastro de atividades (dados/atividades.js), este
 * arquivo também calculava um código de exibição (PS03 no lugar de A03,
 * numerado pela posição no cadastro) por cima do código interno, que era a
 * chave de tudo. Migrado: o código interno agora É o PS03/CO01/MF06... (ver
 * RENOMEACOES_ATIVIDADE em dados/atividades.js), então recalcular um código
 * de exibição por cima dele voltaria a ter o problema que essa camada
 * evitava — o número muda se o cadastro for reordenado ou ganhar atividade
 * nova no meio, só que agora por cima de um código que já é permanente.
 *
 * O que sobra aqui é só a ETAPA de exibição: Broca e Cigarrinha (MF01-MF10)
 * aparecem com etapa "MANEJO FITOSSANITÁRIO" no Plano Operacional e no
 * Dimensionamento, mas continuam etapa "TRATOS CULTURAIS" de verdade — é
 * essa etapa real que decide rateio de arrendamento/administrativo e os
 * relatórios por etapa. Só o texto que a pessoa lê muda.
 */
import { atividadesLista } from './estado.js';

// MF01-MF10: mesmo grupo que a tela já separa do resto dos tratos culturais.
// O prefixo do código (e não mais um Set de 10 códigos fixos) já basta,
// porque agora o código em si nasce "MF..." — um MF11 futuro entra sozinho.
const COD_FITOSSANITARIO = { has: cod => typeof cod === "string" && cod.startsWith("MF") };

function etapaExibir(a){ return COD_FITOSSANITARIO.has(a.cod) ? "MANEJO FITOSSANITÁRIO" : a.etapa; }

export { etapaExibir, COD_FITOSSANITARIO };
