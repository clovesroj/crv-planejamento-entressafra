/**
 * CFG — cadastro mestre, montado a partir dos modulos de dados deste diretorio.
 *
 * Era um literal de 46 KB numa unica linha do index.html. O conteudo e a ordem
 * das chaves sao os mesmos; o que mudou e que cada bloco passou a viver num
 * arquivo proprio, editavel sem abrir o resto do sistema.
 *
 * Para alterar um dado de negocio, edite o arquivo correspondente:
 *
 *   atividades.js          atividades do plano operacional
 *   maquinas.js            consumo e horas por modelo de equipamento
 *   mao-de-obra.js         encargos, beneficios, funcoes, indiretos
 *   plano-contas.js        contas contabeis e centros de custo
 *   irrigacao.js           modalidades, tecnica e composicao de custo
 *   materiais.js           materiais de manutencao
 *   apoio.js               frota de apoio e equipamentos de apoio
 *   insumos.js             insumos e composicao dos tratamentos
 *   transporte.js          parametros de referencia do transporte de cana
 *   modos.js               modos de aplicacao e tarifa de terceirizacao
 *   crm.js                 custos de reparo e manutencao por item
 *   frota-base.js          frota real cadastrada, por especialidade e modelo
 *   transporte-pessoal.js  rotas de onibus
 *
 * CFG e o cadastro de referencia; o que o usuario ajusta vive em
 * nucleo/estado.js e sobrepoe estes valores na hora do calculo. A excecao e
 * CFG.funcoes[i].sal, que a persistencia regrava ao aplicar um plano salvo —
 * comportamento herdado do arquivo unico e mantido de proposito.
 */
import { ATIVIDADES, ATIVIDADES_V } from './atividades.js';
import { MAQUINAS } from './maquinas.js';
import { ENCARGOS, BENEFICIOS, FUNCOES, INDIRETOS, FUNCAO_POR_ATIVIDADE } from './mao-de-obra.js';
import { CONTAS, CC_LIST } from './plano-contas.js';
import { IRR_TEC, IRR_CUSTOS, IRR_ACTS } from './irrigacao.js';
import { MATERIAIS } from './materiais.js';
import { APOIO_FROTA, APOIO_EQ } from './apoio.js';
import { INSUMOS, INSUMOS_V, TRAT_DET } from './insumos.js';
import { TRANSP_PAR } from './transporte.js';
import { MODOS, TERC_TAR_PAD } from './modos.js';
import { CRM_ITENS, CRM_CATS } from './crm.js';
import { FROTA_BASE } from './frota-base.js';
import { TPESS_ROTAS } from './transporte-pessoal.js';

export const CFG = {
  atividades:   ATIVIDADES,
  atividades_v: ATIVIDADES_V,
  maquinas:     MAQUINAS,
  encargos:     ENCARGOS,
  beneficios:   BENEFICIOS,
  funcoes:      FUNCOES,
  indiretos:    INDIRETOS,
  func_at:      FUNCAO_POR_ATIVIDADE,
  contas:       CONTAS,
  cc_list:      CC_LIST,
  irr_tec:      IRR_TEC,
  irr_custos:   IRR_CUSTOS,
  irr_acts:     IRR_ACTS,
  materiais:    MATERIAIS,
  apoio:        APOIO_FROTA,
  insumos:      INSUMOS,
  insumos_v:    INSUMOS_V,
  trat_det:     TRAT_DET,
  transp_par:   TRANSP_PAR,
  apoio_eq:     APOIO_EQ,
  modos:        MODOS,
  terc_tar_pad: TERC_TAR_PAD,
  crm:          CRM_ITENS,
  crm_cats:     CRM_CATS,
  frota_base:   FROTA_BASE,
  tpess:        TPESS_ROTAS,
};
