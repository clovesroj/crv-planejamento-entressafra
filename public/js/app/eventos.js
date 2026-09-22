import { abrirDestino } from '../ui/navegacao.js';
import { destinoValida } from '../ui/validacao.js';
import { ETAPAS_ORD, PAG_LIVRE, mesesPag } from '../calculo/arrendamento.js';
import { AG_SEM_FROTA, FROTA_AG, FROTA_ESP, SEP_MOD, crmDe, espDe } from '../calculo/crm.js';
import { codigoTratValido, composicao, criarGrupoInsumo, criarTrat, destravar, duplicarTrat, marcarEtapa, mesclarBaseInsumos, removerGrupoInsumo, removerTrat,
  renomearGrupoInsumo, renomearTrat, setClasseGrupo, todasFamilias, tratCodigos, usosTrat } from '../calculo/insumos.js';
import { codigoAtividadeValido, criarAtividade, removerAtividade } from '../calculo/atividade.js';
import { CFG } from '../dados/cfg.js';
import { buscarAgrofit, bulaDoProduto } from '../io/agrofit.js';
import { salvar } from '../io/persistencia.js';
import { MESES, NM, periodoMes } from '../nucleo/calendario.js';
import { REAL, APOIO, APOIO_FIXO, ARR_PAR, ARR_RAT, BEN, CAT_SEL, CRM, CRM_ESP, DIESEL_MES, DIM, ENC, ESPOR, FROTA, FUN_SEL, GRAT, INSUMO, INSX, P, PLANO, QUADRO, TERC_TAR, TERC_SUB, TERC_DET, setTERC_DET, TPESS, TRATC, TRAT_ATIVO, TRAT_NOME, TRAT_OBS, TRAT_SEL, FORN_PAR, ADM_RAT, admLista, apoioLista, arrLista, atividadesLista, fornLista, insLista, matLista, tpessLista, setPERIODO_SEL, setACOMP_MES, MESES_SEL, setMESES_SEL, setCRIT_GER, setCRIT_CABE, setREF_BUSCA, setREF_AG, setREF_FAM, setREF_FROTA, setREF_PROP,
  setGR_INICIO, setGR_FIM, setGR_EMPRESA, setGR_ESP, setGR_AG, setGR_COMP, setGR_FROTA, setGR_PROP, setGR_REFORMA } from '../nucleo/estado.js';
import { AGROFIT_BUSCA, FITO_ABERTO, PLANO_ABERTO, FROTA_ABERTO, FROTA_UN, INS_EDIT, INS_FICHA, MAQ, setAGROFIT_BUSCA, setFROTA_DEST, setFROTA_ORIG, setINS_EDIT, setINS_FICHA } from '../nucleo/estado.js';
import { $, num } from '../nucleo/formato.js';
import { exportarTabela, filtrarPorNome } from '../ui/componentes.js';
import { alternarFam, aplicarFamIns, buscaExigeRedesenho, recolherTodas, todasRecolhidas } from '../ui/insumos.js';
import { lerPremissas } from '../ui/premissas.js';
import { leve, render, renderAgrofit, renderEditIns, renderFichaIns, renderRastro, renderRendMensal, renderTercDet } from './ciclo.js';
import { abrirRastro, aberto as rastroAberto, fecharRastro, filtrarBuscaItem, filtrarRastro, voltarRastro } from '../ui/rastro.js';
import { abrirRendMensal, aberto as rendMensalAberto, descartarRascunho, editarRascunho,
  fecharRendMensal, pendencias, salvarRascunho } from '../ui/rendmensal.js';
import { setAPOIO, setATIV_TRAT_SEL, setBEN, setCAT_SEL, setENC, setFUN_SEL, setINSX, setINSX_V, setTPESS, setTRAT_SEL } from '../nucleo/estado.js';
import { USUARIO, areasDePermissao, podeEditar } from '../nucleo/sessao.js';

/* Renomear ou remover um tratamento mexe tambem nas atividades que o usam, e
   isso e dado do Plano Operacional. Quem nao edita aquela aba tem essa parte
   descartada na gravacao (server/permissoes.js) — melhor avisar na hora.
   O vinculo mora em PLANO, que tem duas abas donas (Plano Operacional e
   Irrigacao): quem edita qualquer uma delas grava o vinculo, e nao e avisado. */
function avisoPlano(usos, acao){
  if(!USUARIO || podeEditar("plano")) return;
  if(areasDePermissao().some(a=>(a.chaves||[]).includes("PLANO") && podeEditar(a.id))) return;
  alert(`O tratamento foi ${acao}, mas seu perfil não edita o Plano Operacional: `+
        `o vínculo das atividades ${usos.join(", ")} não será salvo.`);
}
const MSG_COD_TRAT = "Código de tratamento aceita letras, números, espaço e . _ / + ( ) % , - "+
                     "(até 60 caracteres).";

/* ---------- entrada ---------- */
document.addEventListener("input",e=>{
  const t=e.target;
  // busca de "incluir outro lançamento" dentro do rastro de um conjunto —
  // so filtra a lista do proprio modal, nao mexe no plano nem salva
  if(t.dataset.flagBusca!==undefined){ filtrarBuscaItem(t.value); return; }
  if(t.id&&t.id.startsWith("p_")){ lerPremissas(); salvar(); render(); return; }
  if(t.dataset.real!==undefined){ const c=t.dataset.real, i=+t.dataset.m;
    REAL[c] = REAL[c] || Array(NM).fill("");
    // campo vazio volta a nao ter lancamento, e o mes sai da conta de aderencia
    REAL[c][i] = t.value.trim()==="" ? "" : num(t.value);
    if(REAL[c].every(v=>v==="")) delete REAL[c];
    salvar(); leve(); return; }
  if(t.dataset.c!==undefined&&t.dataset.m!==undefined){
    const c=t.dataset.c; PLANO[c]=PLANO[c]||{m:Array(NM).fill(0),trat:""};
    PLANO[c].m[+t.dataset.m]=num(t.value); salvar(); leve(); return; }
  // area mes a mes de um tratamento EXTRA na mesma atividade — area exclusiva
  // dele, nao abate do principal nem de outro extra (ver calculo/atividade.js).
  // O total (data-c/PLANO[c].m) continua so dimensionando frota/horas.
  if(t.dataset.cx!==undefined){ const c=t.dataset.cx, i=+t.dataset.tx, j=+t.dataset.m;
    PLANO[c]=PLANO[c]||{m:Array(NM).fill(0),trat:""}; PLANO[c].trats=PLANO[c].trats||[];
    const e=PLANO[c].trats[i]; if(!e) return;
    e.m=Array.isArray(e.m)?e.m:Array(NM).fill(0); e.m[j]=num(t.value);
    salvar(); leve(); return; }
  // area mes a mes do tratamento PRINCIPAL, quando ha extra — tambem exclusiva
  // (nao e mais "o que sobra do total"). Sem isto ainda editado, o motor usa o
  // total inteiro (ver linha() em calculo/atividade.js); a primeira edicao
  // parte de uma copia do total, pra nao pular pra zero nos outros meses.
  if(t.dataset.cp!==undefined){ const c=t.dataset.cp, j=+t.dataset.m;
    PLANO[c]=PLANO[c]||{m:Array(NM).fill(0),trat:""};
    PLANO[c].tratM = Array.isArray(PLANO[c].tratM) ? PLANO[c].tratM : (PLANO[c].m||Array(NM).fill(0)).slice();
    PLANO[c].tratM[j]=num(t.value);
    salvar(); leve(); return; }
  if(t.dataset.r!==undefined){ DIM[t.dataset.r]=DIM[t.dataset.r]||{}; DIM[t.dataset.r].rend=num(t.value); salvar(); leve(); return; }
  // criterio por mes do modal de rendimento: rendimento, frota, disponibilidade e
  // utilizacao. Campo em branco volta a herdar o criterio da atividade, e por
  // isso guarda "" em vez de zero -- zero seria um criterio de fato lancado.
  // Criterio por mes: a tecla mexe so no rascunho do modal. Nao grava, nao
  // recalcula e nao redesenha -- era isso que destruia o campo no meio da
  // digitacao. Quem escreve no plano e o botao Salvar, mais abaixo.
  const MENSAIS = {rendm:"rendM", frotam:"frotaM", dispm:"dispM", utilm:"utilM", eficm:"eficM"};
  for(const [attr, chave] of Object.entries(MENSAIS)){
    if(t.dataset[attr]===undefined) continue;
    editarRascunho(chave, +t.dataset.i, t.value);
    marcarPendencia();
    return;
  }
  if(t.dataset.u!==undefined){ DIM[t.dataset.u]=DIM[t.dataset.u]||{}; DIM[t.dataset.u].util=num(t.value)/100; salvar(); leve(); return; }
  // frota alvo: em branco volta a sair do rendimento, e por isso e apagada em vez
  // de guardada como zero -- zero seria uma frota fixada em nenhuma maquina
  if(t.dataset.fr!==undefined){ const c=t.dataset.fr; DIM[c]=DIM[c]||{};
    const v=num(t.value); if(v>0) DIM[c].frota=v; else delete DIM[c].frota;
    salvar(); leve(); return; }
  if(t.dataset.fs!==undefined){ const f=CFG.funcoes.find(x=>x.cod===t.dataset.fs);
    if(f) f.sal=num(t.value);
    salvar(); leve(); return; }
  if(t.id==="in_grat"){ GRAT[FUN_SEL]={tipo:$("#sel_grat_tipo").value, valor:num(t.value)}; salvar(); leve(); return; }
  if(t.dataset.ap!==undefined){ const l=apoioLista()[+t.dataset.ap];
    l[t.dataset.f] = (t.dataset.f==="nome") ? t.value : num(t.value); salvar(); leve(); return; }
  if(t.dataset.apf!==undefined){ APOIO_FIXO[t.dataset.apf]=num(t.value); salvar(); leve(); return; }
  if(t.dataset.tt!==undefined){ TERC_TAR[t.dataset.tt]=num(t.value); salvar(); leve(); return; }
  if(t.dataset.tsub!==undefined){ const c=t.dataset.tsub, m=t.dataset.tsm, f=t.dataset.tsf;
    TERC_SUB[c]=TERC_SUB[c]||{}; TERC_SUB[c][m]=TERC_SUB[c][m]||{};
    TERC_SUB[c][m][f]=num(t.value); salvar(); leve(); return; }
  if(t.dataset.crm!==undefined){ const m=t.dataset.crm;
    CRM[m]=CRM[m]||{}; CRM[m][t.dataset.k]=num(t.value); salvar(); leve(); return; }
  if(t.dataset.crmesp!==undefined){ const e=t.dataset.crmesp;
    CRM_ESP[e]=CRM_ESP[e]||{}; CRM_ESP[e][t.dataset.k]=num(t.value); salvar(); leve(); return; }
  if(t.dataset.ref!==undefined){ const c=t.dataset.ref;
    FROTA_UN[c]=FROTA_UN[c]||{}; FROTA_UN[c].ref=FROTA_UN[c].ref||{};
    // campo vazio some do documento em vez de virar zero gravado
    if(t.value.trim()==="") delete FROTA_UN[c].ref[t.dataset.c];
    else FROTA_UN[c].ref[t.dataset.c]=num(t.value);
    salvar(); leve(); return; }
  if(t.dataset.uncrm!==undefined){ const c=t.dataset.uncrm;
    FROTA_UN[c]=FROTA_UN[c]||{}; FROTA_UN[c].crm=FROTA_UN[c].crm||{};
    // campo vazio volta a herdar da especialidade, entao apaga em vez de gravar zero
    if(t.value.trim()==="") delete FROTA_UN[c].crm[t.dataset.k];
    else FROTA_UN[c].crm[t.dataset.k]=num(t.value);
    salvar(); leve(); return; }
  // consumo por equipamento: grava no change (sair do campo / Enter), não a cada
  // tecla — o render redesenha a tabela e tiraria o foco de quem está digitando
  if(t.dataset.cmaq!==undefined) return;
  if(t.dataset.maq!==undefined){ const m=t.dataset.maq;
    MAQ[m]=MAQ[m]||{}; MAQ[m][t.dataset.k]=num(t.value); salvar(); render(); return; }
  if(t.dataset.fq!==undefined){ const m=t.dataset.fq;
    FROTA[m]=FROTA[m]||{}; FROTA[m].qtd=num(t.value); salvar(); leve(); return; }
  if(t.dataset.fh!==undefined){ const m=t.dataset.fh;
    FROTA[m]=FROTA[m]||{}; FROTA[m].hmes=num(t.value); salvar(); leve(); return; }
  if(t.dataset.tpe!==undefined){ const l=tpessLista()[+t.dataset.tpe], f=t.dataset.f;
    l.ent = l.ent || {};
    // campo vazio volta a herdar a safra, em vez de gravar zero
    if(t.value.trim()==="") delete l.ent[f]; else l.ent[f]=num(t.value);
    if(!Object.keys(l.ent).length) delete l.ent;
    salvar(); leve(); return; }
  if(t.dataset.tp!==undefined){ const l=tpessLista()[+t.dataset.tp], f=t.dataset.f;
    l[f] = ["rota","veic"].includes(f) ? t.value : num(t.value);
    salvar(); leve(); return; }
  if(t.dataset.in!==undefined){ const i=insLista()[+t.dataset.in], f=t.dataset.f;
    if(f==="prod"){
      const antigo=i.prod, novo=t.value;
      // renomear mantém o vínculo: acompanha tratamentos, preços e estoques.
      // O tratamento-base (sem customização) também cita o produto pelo nome, e
      // fica no cadastro, onde não dá pra renomear: sem trazê-lo para TRATC
      // antes, ele seguia apontando para o nome antigo, perdia o preço e o
      // custo por hectare caía. destravar() é o mesmo passo de editar uma dose.
      if(novo!==antigo) tratCodigos().forEach(c=>{
        if(!TRATC[c] && composicao(c).some(l=>l.prod===antigo)) destravar(c); });
      Object.keys(TRATC).forEach(c=>TRATC[c].forEach(l=>{ if(l.prod===antigo) l.prod=novo; }));
      if(INSUMO[antigo]){ INSUMO[novo]=INSUMO[antigo]; delete INSUMO[antigo]; }
      if(INS_EDIT===antigo) setINS_EDIT(novo);   // renomeado com o modal aberto: continua apontando pro mesmo produto
      i.prod=novo;
    } else if(["un","pa","conc","cod","classe","fam"].includes(f)){ i[f]=t.value; }
    else i[f]=num(t.value);
    salvar(); leve(); return; }
  if(t.dataset.mt!==undefined){ const l=matLista()[+t.dataset.mt], f=t.dataset.f;
    // mês de alocação: índice da janela, ou vazio para distribuir no ano
    if(f==="mes"){ l.mes = t.value==="" ? "" : +t.value; salvar(); render(); return; }
    l[f] = ["preco","qtd"].includes(f) ? num(t.value) : t.value;
    salvar(); leve(); return; }
  if(t.dataset.at!==undefined && t.tagName==="INPUT"){ const a=atividadesLista()[+t.dataset.at], f=t.dataset.f;
    a[f] = ["nome","maq","imp"].includes(f) ? t.value : num(t.value);
    salvar(); leve(); return; }
  if(t.dataset.atu!==undefined){ atividadesLista()[+t.dataset.atu].util = num(t.value)/100;
    salvar(); leve(); return; }
  if(t.dataset.mx!==undefined){ const c=t.dataset.mx;
    PLANO[c]=PLANO[c]||{m:Array(NM).fill(0),trat:""};
    PLANO[c].mix=PLANO[c].mix||{}; PLANO[c].mix[t.dataset.mo]=num(t.value);
    salvar(); leve(); return; }
  if(t.dataset.ip!==undefined){ INSUMO[t.dataset.ip]=INSUMO[t.dataset.ip]||{}; INSUMO[t.dataset.ip].preco=num(t.value); salvar(); leve(); return; }
  if(t.dataset.ie!==undefined){ INSUMO[t.dataset.ie]=INSUMO[t.dataset.ie]||{}; INSUMO[t.dataset.ie].est=num(t.value); salvar(); leve(); return; }
  if(t.dataset.ex!==undefined){ ESPOR[+t.dataset.ex][t.dataset.f]=t.dataset.f==="valor"?num(t.value):t.value; salvar(); leve(); return; }
  if(t.dataset.td!==undefined){ const c=destravar(TRAT_SEL); c[+t.dataset.td].dose=num(t.value); salvar(); leve(); return; }
  // frete de uma linha da composicao: valor (R$/un ou total pago) e a
  // quantidade da entrega, quando "total" (ver freteEfetivo em calculo/insumos.js)
  if(t.dataset.tfretevalor!==undefined){ const c=destravar(TRAT_SEL), l=c[+t.dataset.tfretevalor];
    l.frete = l.frete || {}; l.frete.valor = num(t.value); salvar(); leve(); return; }
  if(t.dataset.tfreteqtd!==undefined){ const c=destravar(TRAT_SEL), l=c[+t.dataset.tfreteqtd];
    l.frete = l.frete || {}; l.frete.qtd = num(t.value); salvar(); leve(); return; }
  if(t.id==="in_trat_nome"){ TRAT_NOME[TRAT_SEL]=t.value; salvar(); leve(); return; }
  if(t.id==="in_trat_obs"){ TRAT_OBS[TRAT_SEL]=t.value; salvar(); leve(); return; }
  // nome do tratamento editado na propria linha do cadastro
  if(t.dataset.trn!==undefined){ TRAT_NOME[t.dataset.trn]=t.value; salvar(); leve(); return; }
  // observacao do tratamento (recomendacao, instrucao de uso)
  if(t.dataset.tro!==undefined){ TRAT_OBS[t.dataset.tro]=t.value; salvar(); leve(); return; }
  // campo vazio volta ao preço base; null (e não delete) para a limpeza chegar ao servidor no merge
  if(t.dataset.dm!==undefined){ const v=t.value.trim(); DIESEL_MES[t.dataset.dm] = v==="" ? null : num(v);
    salvar(); leve(); return; }
  // selects também disparam "input": os da tabela de arrendamento são tratados no "change"
  if(t.dataset.arr!==undefined && t.tagName==="INPUT"){ const l=arrLista()[+t.dataset.arr], f=t.dataset.f;
    l[f] = ["faz","grupo"].includes(f) ? t.value : num(t.value); salvar(); leve(); return; }
  // linhas de custo administrativo: texto ou valor
  if(t.dataset.adm!==undefined && t.tagName==="INPUT"){ const l=admLista()[+t.dataset.adm], f=t.dataset.f;
    l[f] = f==="valor" ? num(t.value) : t.value; salvar(); leve(); return; }
  if(t.dataset.admrat!==undefined){ ADM_RAT[t.dataset.admrat]=num(t.value); salvar(); leve(); return; }
  if(t.dataset.arp!==undefined){ ARR_PAR[t.dataset.arp]=num(t.value); salvar(); leve(); return; }
  if(t.dataset.arrat!==undefined){ ARR_RAT[t.dataset.arrat]=num(t.value); salvar(); leve(); return; }
  // selects da tabela de fornecedores sao tratados no "change"; aqui so os campos digitados
  if(t.dataset.fnr!==undefined && t.tagName==="INPUT"){ const l=fornLista()[+t.dataset.fnr], f=t.dataset.f;
    l[f] = ["forn","prop"].includes(f) ? t.value : num(t.value); salvar(); leve(); return; }
  if(t.dataset.fnp!==undefined){ FORN_PAR[t.dataset.fnp]=num(t.value); salvar(); leve(); return; }
  // quadro de pessoal por funcao: ativo, ferias e demissoes programadas
  if(t.dataset.qd!==undefined){ const f=t.dataset.qd;
    QUADRO[f]=QUADRO[f]||{}; QUADRO[f][t.dataset.f]=num(t.value); salvar(); leve(); return; }
  if(t.dataset.enc!==undefined){ ENC[t.dataset.enc]=num(t.value); salvar(); leve(); return; }
  if(t.dataset.ben!==undefined){ BEN[t.dataset.ben]=num(t.value); salvar(); leve(); return; }
  // busca por nome: qualquer caixa .tbl-busca filtra a tabela que data-alvo aponta,
  // sem recalcular nada — mesma trava generica serve pra tabela nova nenhuma linha tocar aqui
  if(t.classList.contains("tbl-busca")){
    filtrarPorNome(t.dataset.alvo, t.value);
    // no cadastro de insumos a linha recolhida nem esta no DOM: filtrar nao acha
    // nada, entao a dobra precisa sair do caminho antes
    if(buscaExigeRedesenho(t.dataset.alvo, t.value)) render();
    return; }
  // busca por especialidade na Reforma de Frota: filtra ANTES de montar os
  // paineis (cada especialidade e um <div>, nao <tr> — filtrarPorNome nao
  // serve aqui), entao precisa de render() mesmo, nao so esconder linha
  if(t.id==="ref_busca"){ setREF_BUSCA(t.value); render(); return; }
  if(t.id==="ref_frota"){ setREF_FROTA(t.value); render(); return; }
  if(t.id==="gr_frota"){ setGR_FROTA(t.value); render(); return; }
});
document.addEventListener("change",e=>{
  const t=e.target;
  // marca/desmarca um lancamento do ERP no rastro do gasto real da reforma —
  // o total do conjunto (e da especialidade) so soma o que estiver marcado
  // (ver itensReforma() em calculo/reforma.js). Item do mapeamento automatico
  // (origem "auto") desmarcado vai pra lista de exclusao; item que a pessoa
  // incluiu a mao (origem "manual") desmarcado sai da lista de inclusao — e
  // volta a valer o mapeamento automatico dele, se houver algum.
  if(t.dataset.flagChave!==undefined){
    const cod = t.dataset.flagCod, conjunto = t.dataset.flagConjunto, chave = t.dataset.flagChave;
    FROTA_UN[cod] = FROTA_UN[cod] || {};
    if(t.dataset.flagOrigem==="manual"){
      const incl = new Set((FROTA_UN[cod].reformaIncl || {})[conjunto] || []);
      if(t.checked) incl.add(chave); else incl.delete(chave);
      FROTA_UN[cod].reformaIncl = FROTA_UN[cod].reformaIncl || {};
      if(incl.size) FROTA_UN[cod].reformaIncl[conjunto] = [...incl];
      else delete FROTA_UN[cod].reformaIncl[conjunto];
      const excl = new Set(FROTA_UN[cod].reformaExcl || []);
      excl.delete(chave); // desmarcar devolve pro mapeamento automatico, se houver
      FROTA_UN[cod].reformaExcl = [...excl];
    } else {
      const excl = new Set(FROTA_UN[cod].reformaExcl || []);
      if(t.checked) excl.delete(chave); else excl.add(chave);
      FROTA_UN[cod].reformaExcl = [...excl];
    }
    salvar(); render(); return; }
  // consumo por equipamento (aba Combustível): unidade, L/h, L/km, velocidade.
  // Grava no cadastro da máquina; campo vazio volta ao padrão.
  if(t.dataset.cmaq!==undefined){ const m=t.dataset.cmaq, k=t.dataset.ck;
    MAQ[m]=MAQ[m]||{};
    if(k==="unC") MAQ[m].unC = t.value;
    else if(t.value.trim()==="") delete MAQ[m][k];
    else MAQ[m][k]=num(t.value);
    salvar(); render(); return; }
  if(t.dataset.at!==undefined && t.tagName==="SELECT"){ atividadesLista()[+t.dataset.at][t.dataset.f]=t.value;
    salvar(); render(); return; }
  // libera/tranca o mix de modos (M/T/U/D/Q/3º) no Plano Operacional para
  // esta atividade — atividade criada pelo usuário nascia sem isso, e sem
  // controle na tela não dava pra ligar depois
  if(t.dataset.atmodo!==undefined){ atividadesLista()[+t.dataset.atmodo].modoOn = t.checked;
    salvar(); render(); return; }
  // ativa/inativa a atividade — some das buscas de vinculo novo (ver
  // buscaTratAtiv em ui/insumos.js), sem mexer no que ja esta lancado
  if(t.dataset.atativo!==undefined){ atividadesLista()[+t.dataset.atativo].ativo = t.checked;
    salvar(); render(); return; }
  // ativa/inativa o produto — some da busca de adicionar numa composicao NOVA
  // (ver buscaProd em ui/insumos.js), sem mexer no que ja esta lancado
  if(t.dataset.inativo!==undefined){ insLista()[+t.dataset.inativo].ativo = t.checked;
    salvar(); render(); return; }
  // ativa/inativa o tratamento — some das buscas de vincular a uma atividade
  // nova ou como extra (ver sel_trat_extra e o select do Plano Operacional)
  if(t.dataset.tra!==undefined){ TRAT_ATIVO[t.dataset.tra] = t.checked;
    salvar(); render(); return; }
  if(t.dataset.grpclasse!==undefined){
    const r = setClasseGrupo(t.dataset.grpclasse, t.value);
    if(!r.ok){ alert(r.erro); render(); return; }
    salvar(); render(); return; }
  // unidade da dose de uma linha da composicao: so muda em que unidade a
  // pessoa lancou o numero, o motor converte pra unidade do cadastro na hora
  // de custear (calculo/insumos.js, doseBase) -- o custo/ha nao muda sozinho
  if(t.dataset.tud!==undefined){
    const c=destravar(TRAT_SEL); c[+t.dataset.tud].un=t.value; salvar(); render(); return; }
  // liga/desliga e tipo do frete de uma linha — muda o que a celula mostra
  // (valor unico vs valor+quantidade), por isso redesenha (render), nao leve()
  if(t.dataset.tfrete!==undefined){ const c=destravar(TRAT_SEL), l=c[+t.dataset.tfrete];
    l.frete = l.frete || {tipo:"unit"}; l.frete.on = t.checked; salvar(); render(); return; }
  if(t.dataset.tfretetipo!==undefined){ const c=destravar(TRAT_SEL), l=c[+t.dataset.tfretetipo];
    l.frete = l.frete || {}; l.frete.tipo = t.value; salvar(); render(); return; }
  // codigo do tratamento: leva composicao, nome, etapas e as atividades que o usam
  if(t.dataset.trc!==undefined || t.id==="in_trat_cod"){
    const de = t.dataset.trc!==undefined ? t.dataset.trc : TRAT_SEL;
    const para = t.value.trim();
    if(!para){ alert("Informe o novo código do tratamento."); render(); return; }
    if(para===de){ render(); return; }
    if(!codigoTratValido(para)){ alert(MSG_COD_TRAT); render(); return; }
    if(tratCodigos().includes(para)){
      alert(`Já existe um tratamento com o código "${para}".`); render(); return; }
    const usos = usosTrat(de);
    if(renomearTrat(de, para)){
      if(TRAT_SEL===de) setTRAT_SEL(para);
      if(usos.length) avisoPlano(usos, "renomeado");
    }
    salvar(); render(); return; }
  // etapa em que o tratamento e usado
  if(t.dataset.tre!==undefined){
    marcarEtapa(t.dataset.tre, t.dataset.e, t.checked); salvar(); render(); return; }
  if(t.dataset.t!==undefined){
    const c=t.dataset.t; PLANO[c]=PLANO[c]||{m:Array(NM).fill(0),trat:""};
    PLANO[c].trat=t.value; salvar(); render(); return; }
  if(t.id==="sel_trat_ativ"){
    const c=t.value;
    setATIV_TRAT_SEL(c);
    if(c){ PLANO[c]=PLANO[c]||{m:Array(NM).fill(0),trat:""}; PLANO[c].trat=TRAT_SEL; salvar(); }
    render(); return; }
  if(t.dataset.ex!==undefined){ ESPOR[+t.dataset.ex][t.dataset.f]=t.value; salvar(); render(); return; }
  if(t.id==="p_fonte"){ lerPremissas(); salvar(); render(); return; }
  if(t.dataset.arr!==undefined && t.tagName==="SELECT"){ const l=arrLista()[+t.dataset.arr];
    if(t.dataset.f==="pag"){
      // periodicidade volta a gerar a serie de pagamentos; "meses especificos"
      // comeca do que a periodicidade anterior marcava, para o usuario ajustar
      const antes = mesesPag(l);
      l.pag = t.value;
      l.pmes = t.value===PAG_LIVRE ? antes : null;
    }else l[t.dataset.f] = t.dataset.f==="mes" ? +t.value : t.value;
    salvar(); render(); return; }
  // grade de meses de pagamento: marcar ou desmarcar um mes do contrato
  if(t.dataset.arrpm!==undefined){ const l=arrLista()[+t.dataset.arrpm], j=+t.dataset.m;
    const meses = new Set(mesesPag(l));
    if(t.checked) meses.add(j); else meses.delete(j);
    l.pmes = [...meses].sort((x,y)=>x-y);
    l.pag  = PAG_LIVRE;
    salvar(); render(); return; }
  if(t.dataset.adm!==undefined && t.tagName==="SELECT"){ const l=admLista()[+t.dataset.adm];
    l[t.dataset.f] = t.value;
    if(t.dataset.f==="crit" && t.value!=="cc") l.cc = "";   // centro de custo so vale nesse critorio
    salvar(); render(); return; }
  if(t.id==="arp_criterio"){ ARR_PAR.criterio=t.value; salvar(); render(); return; }
  if(t.dataset.fnr!==undefined){ const l=fornLista()[+t.dataset.fnr], f=t.dataset.f;
    l[f] = ["entIni","entFim"].includes(f) ? +t.value : t.value;
    // o fim da entrega nunca fica antes do inicio
    if(f==="entIni" && +l.entFim < +l.entIni) l.entFim = l.entIni;
    if(f==="entFim" && +l.entFim < +l.entIni) l.entIni = l.entFim;
    salvar(); render(); return; }
  if(t.id==="sel_trat"){ setTRAT_SEL(t.value); render(); return; }
  if(t.id==="sel_fun"){ setFUN_SEL(t.value); render(); return; }
  if(t.id==="sel_cat"){ setCAT_SEL(t.value); render(); return; }
  if(t.id==="sel_orig"){ setFROTA_ORIG(t.value); render(); return; }
  if(t.id==="sel_acomp_mes"){ setACOMP_MES(t.value===""?null:+t.value); render(); return; }
  if(t.id==="sel_dest"){ setFROTA_DEST(t.value); render(); return; }
  if(t.dataset.undest!==undefined){ const c=t.dataset.undest;
    FROTA_UN[c]=FROTA_UN[c]||{}; FROTA_UN[c].st=t.value; salvar(); render(); return; }
  if(t.dataset.dt!==undefined){ const c=t.dataset.dt, f=t.dataset.f, outroF=f==="ini"?"fim":"ini";
    DIM[c]=DIM[c]||{};
    // data em branco volta a janela para os meses com volume lançado
    if(!t.value) delete DIM[c][f]; else DIM[c][f]=t.value;
    // fim nunca fica antes do início: trava o calendário nativo do par (min/
    // max) pra não abrir em hoje e obrigar a rolar meses até uma janela
    // distante (ex.: início lançado em dezembro), e realinha o outro lado se
    // ficou invertido — mesma ideia já usada em entIni/entFim de fornecedores
    const outro = t.closest("table")?.querySelector(`input[data-dt="${CSS.escape(c)}"][data-f="${outroF}"]`);
    if(outro){
      const invertido = t.value && outro.value && (f==="ini" ? outro.value < t.value : outro.value > t.value);
      if(invertido){ outro.value = t.value; DIM[c][outroF] = t.value; }
      // recalcula os dois limites juntos — senão o lado que so' recebeu o
      // ajuste de "invertido" fica com um min/max desatualizado
      const ini = f==="ini" ? t : outro, fim = f==="ini" ? outro : t;
      fim.min = ini.value || ""; ini.max = fim.value || "";
    }
    // leve() preserva o foco; render() reconstruia a tabela e derrubava a
    // digitacao no meio da data
    salvar(); leve(); return; }
  if(t.dataset.fc!==undefined){ const c=t.dataset.fc;
    PLANO[c]=PLANO[c]||{m:Array(NM).fill(0),trat:""};
    PLANO[c].fcod=t.value; salvar(); render(); return; }

  // nivel da funcao e escala escolhidos no dimensionamento de pessoas, por atividade
  if(t.dataset.tur!==undefined){ const c=t.dataset.tur;
    DIM[c]=DIM[c]||{}; DIM[c].turnos=t.value==="" ? null : +t.value; salvar(); render(); return; }
  if(t.dataset.esc!==undefined){ const c=t.dataset.esc;
    DIM[c]=DIM[c]||{}; DIM[c].esc=t.value; salvar(); render(); return; }
  if(t.dataset.ap!==undefined){ const l=apoioLista()[+t.dataset.ap];
    l[t.dataset.f] = t.value;
    salvar(); render(); return; }
  // filtros do painel de criterio por mes: so mudam a visao, nao gravam nada
  // recorte de grupo do cadastro de insumos: so muda o que aparece
  if(t.id==="sel_ins_fam"){ aplicarFamIns(t.value); render(); return; }
  if(t.id==="sel_crit_ger"){ setCRIT_GER(t.value); render(); return; }
  if(t.id==="sel_crit_cabe"){ setCRIT_CABE(t.value); render(); return; }
  if(t.id==="sel_ref_ag"){ setREF_AG(t.value); render(); return; }
  if(t.id==="sel_ref_fam"){ setREF_FAM(t.value); render(); return; }
  if(t.id==="sel_ref_prop"){ setREF_PROP(t.value); render(); return; }
  if(t.id==="gr_inicio"){ setGR_INICIO(t.value); render(); return; }
  if(t.id==="gr_fim"){ setGR_FIM(t.value); render(); return; }
  if(t.id==="sel_gr_empresa"){ setGR_EMPRESA(t.value); render(); return; }
  if(t.id==="sel_gr_esp"){ setGR_ESP(t.value); render(); return; }
  if(t.id==="sel_gr_ag"){ setGR_AG(t.value); render(); return; }
  if(t.id==="sel_gr_comp"){ setGR_COMP(t.value); render(); return; }
  if(t.id==="sel_gr_prop"){ setGR_PROP(t.value); render(); return; }
  if(t.id==="sel_gr_reforma"){ setGR_REFORMA(t.value); render(); return; }
  if(t.id==="sel_grat_tipo"){ GRAT[FUN_SEL]={tipo:t.value, valor:num($("#in_grat").value)}; salvar(); render(); return; }
});
/* ---------- SELETOR DE MESES ----------
   A lista e desenhada aqui, e nao numa tela de ui/, porque vive na barra
   superior: nao pertence a nenhuma aba e nao pode depender de qual esta aberta. */
function popAberto(){ const el = $("#pop_meses"); return el && !el.hidden; }
function abrirMeses(v){
  const el = $("#pop_meses"), bt = $("#btn_meses");
  if(!el) return;
  el.hidden = !v;
  if(bt) bt.setAttribute("aria-expanded", v ? "true" : "false");
  if(v) pintarMeses();
}
function fecharMeses(){ abrirMeses(false); }
/** Redesenha a lista e o contador do botao a partir da selecao corrente. */
function pintarMeses(){
  const lista = $("#pop_meses_lista");
  if(lista) lista.innerHTML = MESES.map((m,i)=>{
    const on = MESES_SEL.includes(i);
    return `<label class="${on?"on ":""}p-${periodoMes(i)}" data-mes="${i}">
      <input type="checkbox" ${on?"checked":""} tabindex="-1" aria-hidden="true">${m}</label>`;}).join("");
  const n = $("#btn_meses_n");
  if(n) n.textContent = MESES_SEL.length ? "("+MESES_SEL.length+")" : "";
}

/* A barra de acao do modal de criterio reage a cada tecla, mas sem repintar o
   modal: so o texto e o estado dos dois botoes mudam. Repintar aqui recriaria o
   campo em que se esta digitando, que e justamente o bug que o rascunho corrige. */
function marcarPendencia(){
  const n = pendencias();
  const rot = $(".rm-pend"), desc = $("#rm_descartar"), sal = $("#rm_salvar");
  if(!rot) return;
  rot.classList.toggle("tem", n > 0);
  rot.innerHTML = n ? `<b>${n}</b> campo${n>1?"s":""} não salvo${n>1?"s":""}` : "tudo salvo";
  if(desc) desc.disabled = !n;
  if(sal) sal.disabled = !n;
}

document.addEventListener("click",e=>{
  // "incluir outro lançamento" na busca dentro do rastro de um conjunto —
  // soma no orcamento (reformaIncl) e ja tira da exclusao, se estivesse la
  // (ver itensReforma() em calculo/reforma.js pra regra de nao contar 2x)
  const addItem = e.target.closest && e.target.closest("[data-flag-add-chave]");
  if(addItem){
    const cod = addItem.dataset.flagAddCod, conjunto = addItem.dataset.flagAddConjunto, chave = addItem.dataset.flagAddChave;
    FROTA_UN[cod] = FROTA_UN[cod] || {};
    FROTA_UN[cod].reformaIncl = FROTA_UN[cod].reformaIncl || {};
    const incl = new Set(FROTA_UN[cod].reformaIncl[conjunto] || []);
    incl.add(chave);
    FROTA_UN[cod].reformaIncl[conjunto] = [...incl];
    const excl = new Set(FROTA_UN[cod].reformaExcl || []);
    excl.add(chave); // impede que o mesmo lancamento conte de novo na tag nativa dele
    FROTA_UN[cod].reformaExcl = [...excl];
    salvar(); render(); return; }
  // pendência da Validação: vai direto ao ponto onde se corrige
  const vi = e.target.closest && e.target.closest("[data-valir]");
  if(vi){ abrirDestino(destinoValida(vi.dataset.valir)); return; }
  // exportar tabela (CSV/Excel/PDF) — botao generico plantado por
  // reaplicarExportar() (ui/componentes.js) antes de toda <table id>
  const botaoExp = e.target.closest && e.target.closest("[data-exportar]");
  if(botaoExp){ exportarTabela(botaoExp.dataset.alvo, botaoExp.dataset.exportar); return; }
  // dobra de grupo no cadastro de insumos. A faixa inteira e o alvo: e o titulo
  // do bloco, entao clicar nela para recolher e o gesto esperado.
  const faixa = e.target.closest && e.target.closest("#t_ins tr.stage[data-fam]");
  if(faixa){ alternarFam(faixa.dataset.fam); render(); return; }
  if(e.target.id === "btn_ins_recolher"){ recolherTodas(!todasRecolhidas()); render(); return; }
  // filtro de periodo do rastro (ano todo / safra / entressafra) — checa antes do
  // data-rastro geral, pois os botoes do filtro moram dentro do proprio modal
  // filtro global de periodo, na barra superior
  const alvoPer = e.target.closest && e.target.closest("#per_sel [data-periodo]");
  if(alvoPer){
    const p = alvoPer.dataset.periodo;
    // "Meses" abre a lista em vez de aplicar um recorte pronto; os outros tres
    // fecham a lista, senao ela ficaria aberta contradizendo o botao aceso
    if(p === "meses"){ abrirMeses(!popAberto()); return; }
    fecharMeses(); setPERIODO_SEL(p); render(); return;
  }
  // escolha mes a mes
  const alvoMes = e.target.closest && e.target.closest("#pop_meses [data-mes]");
  if(alvoMes){
    const i = +alvoMes.dataset.mes;
    const atual = MESES_SEL.filter(x=>x!==i);
    setMESES_SEL(MESES_SEL.includes(i) ? atual : [...atual, i].sort((a,b)=>a-b));
    setPERIODO_SEL("meses"); render(); pintarMeses(); return;
  }
  const atalho = e.target.closest && e.target.closest("#pop_meses [data-meses-atalho]");
  if(atalho){
    const k = atalho.dataset.mesesAtalho;
    const idx = MESES.map((m,i)=>i);
    // "Limpar" deixa a selecao vazia, e selecao vazia nao filtra: o recorte
    // volta a ser o ano, que e o que a tela mostra de qualquer jeito
    setMESES_SEL(k==="limpar" ? [] : k==="todos" ? idx : idx.filter(i=>periodoMes(i)===k));
    setPERIODO_SEL("meses"); render(); pintarMeses(); return;
  }
  // clique fora fecha a lista
  if(popAberto() && !(e.target.closest && e.target.closest("#pop_meses"))) fecharMeses();
  const alvoPeriodo = e.target.closest && e.target.closest("[data-ra-periodo]");
  if(alvoPeriodo){ filtrarRastro(alvoPeriodo.dataset.raPeriodo); return; }
  // rastro do calculo: qualquer elemento com data-rastro abre ou desce um nivel
  const alvoRastro = e.target.closest && e.target.closest("[data-rastro]");
  if(alvoRastro){ abrirRastro(alvoRastro.dataset.rastro); renderRastro(); return; }
  if(e.target.closest && e.target.closest("#ra_voltar")){ voltarRastro(); renderRastro(); return; }
  if((e.target.closest && e.target.closest("#ra_fechar")) || e.target.id==="rastro_fundo"){
    fecharRastro(); renderRastro(); return; }
  // rendimento por mes: botao "mês" ao lado do rendimento padrao, no Dimensionamento
  const alvoRendMes = e.target.closest && e.target.closest("[data-rendmes]");
  if(alvoRendMes){ abrirRendMensal(alvoRendMes.dataset.rendmes); renderRendMensal(); return; }
  if(e.target.closest && e.target.closest("#rm_salvar")){
    if(salvarRascunho()){ salvar(); render(); }
    return; }
  if(e.target.closest && e.target.closest("#rm_descartar")){
    descartarRascunho(); renderRendMensal(); return; }
  // fechar com campo digitado e nao salvo perderia o que foi digitado: avisa
  if((e.target.closest && e.target.closest("#rm_fechar")) || e.target.id==="rendm_fundo"){
    const n = pendencias();
    if(n && !confirm(`Há ${n} campo(s) digitado(s) e não salvo(s). Fechar e descartar?`)) return;
    fecharRendMensal(); renderRendMensal(); return; }
  // ficha tecnica em modal. E visao, nao dado: nao passa por salvar(), e redesenha
  // so o modal, porque nenhum numero das abas muda ao abrir ou fechar.
  if((e.target.closest && e.target.closest("#fx_fechar")) || e.target.id==="fichains_fundo"){
    setINS_FICHA(null); renderFichaIns(); return; }
  const fx = e.target.closest && e.target.closest("[data-infx]");
  if(fx){ setINS_FICHA(fx.dataset.infx === INS_FICHA ? null : fx.dataset.infx);
    renderFichaIns(); return; }
  // editar produto em modal — mesmo criterio da ficha: um por vez, fecha com o X
  if((e.target.closest && e.target.closest("#inedit_fechar")) || e.target.id==="insedit_fundo"){
    setINS_EDIT(null); renderEditIns(); return; }
  const ined = e.target.closest && e.target.closest("[data-inedit]");
  if(ined){ setINS_EDIT(ined.dataset.inedit === INS_EDIT ? null : ined.dataset.inedit);
    renderEditIns(); return; }
  // detalhamento do terceiro por sub-modo, em modal — mesmo criterio da ficha:
  // abrir/fechar nao muda numero nenhum, nao passa por salvar().
  if((e.target.closest && e.target.closest("#td_fechar")) || e.target.id==="tercdet_fundo"){
    setTERC_DET(null); renderTercDet(); return; }
  const td = e.target.closest && e.target.closest("[data-tercdet]");
  if(td){ setTERC_DET(td.dataset.tercdet === TERC_DET ? null : td.dataset.tercdet);
    renderTercDet(); return; }
  // busca de bula na Agrofit, em modal. Visao, nao dado: abrir, fechar ou
  // trocar de candidato nao passa por salvar() -- so "Vincular" grava no insumo.
  if((e.target.closest && e.target.closest("#agro_fechar")) || e.target.id==="agrofit_fundo"){
    setAGROFIT_BUSCA(null); renderAgrofit(); return; }
  const agb = e.target.closest && e.target.closest("[data-agrobusca]");
  if(agb){
    const ix = +agb.dataset.agrobusca, i = insLista()[ix];
    setAGROFIT_BUSCA({ix, carregando:true, erro:null, resultados:null});
    renderAgrofit();
    // so pelo nome: o fabricante do nosso cadastro e o "titular_registro" da
    // Agrofit raramente batem como texto (ex.: "Corteva Agriscience" no nosso
    // cadastro e "CTVA Protecao de Cultivos Ltda" na Agrofit, mesma empresa
    // depois de uma troca de razao social) -- filtrar pelos dois eliminava o
    // candidato certo. O fabricante aparece no card so pra conferencia visual.
    buscarAgrofit({marca:i.prod}).then(resultados=>{
      if(!AGROFIT_BUSCA || AGROFIT_BUSCA.ix!==ix) return;   // fechou ou trocou de produto enquanto buscava
      setAGROFIT_BUSCA({ix, carregando:false, erro:null, resultados});
      renderAgrofit();
    }).catch(err=>{
      if(!AGROFIT_BUSCA || AGROFIT_BUSCA.ix!==ix) return;
      setAGROFIT_BUSCA({ix, carregando:false, erro:err.message, resultados:null});
      renderAgrofit();
    });
    return;
  }
  const agv = e.target.closest && e.target.closest("[data-agrovinc]");
  if(agv && AGROFIT_BUSCA && AGROFIT_BUSCA.resultados){
    const p = AGROFIT_BUSCA.resultados[+agv.dataset.agrovinc];
    const bula = p && bulaDoProduto(p);
    if(!bula) return;
    const i = insLista()[AGROFIT_BUSCA.ix];
    i.agrofit_registro = p.numero_registro;
    i.agrofit_titular = p.titular_registro;
    i.bula_url = bula.url;
    setAGROFIT_BUSCA(null);
    salvar(); render();
    return;
  }
  const ab = e.target.closest && e.target.closest("[data-abrefrota]");
  if(ab){ const k = ab.dataset.abrefrota;
    // abrir a lista de unidades e visao, nao dado: nao passa por salvar()
    if(FROTA_ABERTO[k]) delete FROTA_ABERTO[k]; else FROTA_ABERTO[k]=true;
    render(); return; }
  // estratificação por modo de execução, no Manejo Fitossanitário — mesmo
  // criterio do abre-frota: visao, nao dado, nao passa por salvar()
  const fa = e.target.closest && e.target.closest("[data-fitoabre]");
  if(fa){ const k = fa.dataset.fitoabre;
    if(FITO_ABERTO[k]) delete FITO_ABERTO[k]; else FITO_ABERTO[k]=true;
    render(); return; }
  // dois tratamentos na mesma atividade: expande a quebra por tratamento, no
  // Plano Operacional — visao, nao dado, nao passa por salvar()
  const pa = e.target.closest && e.target.closest("[data-planoabre]");
  if(pa){ const k = pa.dataset.planoabre;
    if(PLANO_ABERTO[k]) delete PLANO_ABERTO[k]; else PLANO_ABERTO[k]=true;
    render(); return; }
  // dois tratamentos na mesma atividade: adicionar um tratamento extra, que
  // passa a dividir a mesma área com o principal (ver calculo/atividade.js)
  if(e.target.closest && e.target.closest("#btn_trat_extra_add")){
    const cod = document.getElementById("sel_trat_ativ")?.value;
    const trat = document.getElementById("sel_trat_extra")?.value;
    if(!cod || !trat) return;
    PLANO[cod] = PLANO[cod] || {m:Array(NM).fill(0), trat:""};
    PLANO[cod].trats = Array.isArray(PLANO[cod].trats) ? PLANO[cod].trats : [];
    PLANO[cod].trats.push({trat, m:Array(NM).fill(0)});
    salvar(); render(); return;
  }
  const txrm = e.target.closest && e.target.closest("[data-txrm]");
  if(txrm){ const cod = txrm.dataset.txrm, i = +txrm.dataset.txi;
    const trats = PLANO[cod] && PLANO[cod].trats;
    if(!trats || !trats[i]) return;
    if(!confirm(`Remover o tratamento extra "${trats[i].trat}" desta atividade? A área lançada mês a mês se perde.`)) return;
    trats.splice(i,1); salvar(); render(); return;
  }
  const t=e.target;
  if(t.dataset.rm!==undefined){ ESPOR.splice(+t.dataset.rm,1); salvar(); render(); return; }
  if(t.dataset.admrm!==undefined){ const l=admLista()[+t.dataset.admrm];
    if(!confirm(`Remover "${l.desc}" dos custos administrativos?`)) return;
    admLista().splice(+t.dataset.admrm,1); salvar(); render(); return; }
  if(t.dataset.arrm!==undefined){ const l=arrLista()[+t.dataset.arrm];
    if(!confirm(`Remover "${l.faz}" dos arrendamentos?`)) return;
    arrLista().splice(+t.dataset.arrm,1); salvar(); render(); return; }
  if(t.dataset.fnrm!==undefined){ const l=fornLista()[+t.dataset.fnrm];
    if(!confirm(`Remover "${l.forn}" dos fornecedores?`)) return;
    fornLista().splice(+t.dataset.fnrm,1); salvar(); render(); return; }
  if(t.dataset.tr!==undefined){ const c=destravar(TRAT_SEL); c.splice(+t.dataset.tr,1); salvar(); render(); return; }
  if(t.dataset.trdup!==undefined){ const de=t.dataset.trdup;
    const novo = prompt(`Código do tratamento duplicado a partir de "${de}":`, `${de} (cópia)`);
    if(!novo) return;
    if(!codigoTratValido(novo.trim())){ alert(MSG_COD_TRAT); return; }
    if(!duplicarTrat(de, novo.trim())){ alert(`Já existe um tratamento com o código "${novo.trim()}".`); return; }
    setTRAT_SEL(novo.trim());
    salvar(); render(); return; }
  if(t.dataset.trrm!==undefined){ const cod=t.dataset.trrm, usos=usosTrat(cod);
    if(!confirm(usos.length
      ? `Remover o tratamento "${cod}"? As atividades ${usos.join(", ")} ficam sem tratamento.`
      : `Remover o tratamento "${cod}"?`)) return;
    removerTrat(cod);
    if(TRAT_SEL===cod) setTRAT_SEL(null);
    if(usos.length) avisoPlano(usos, "removido");
    salvar(); render(); return; }
  if(t.dataset.aprm!==undefined){ apoioLista().splice(+t.dataset.aprm,1); salvar(); render(); return; }
  if(t.dataset.mtrm!==undefined){ matLista().splice(+t.dataset.mtrm,1); salvar(); render(); return; }
  if(t.dataset.tprm!==undefined){ tpessLista().splice(+t.dataset.tprm,1); salvar(); render(); return; }
  if(t.dataset.inrm!==undefined){
    const i=insLista()[+t.dataset.inrm];
    const usos=tratCodigos().filter(c=>composicao(c).some(l=>l.prod===i.prod));
    if(usos.length && !confirm(`"${i.prod}" é usado em ${usos.length} tratamento(s). Remover assim mesmo?`)) return;
    insLista().splice(+t.dataset.inrm,1); salvar(); render(); return; }
  if(t.dataset.grprm!==undefined){
    const r = removerGrupoInsumo(t.dataset.grprm);
    if(!r.ok){ alert(r.erro); return; }
    salvar(); render(); return; }
  if(t.dataset.atrm!==undefined){
    const cod = t.dataset.atrm, p = PLANO[cod];
    const emUso = p && (p.trat || (p.m||[]).some(v=>num(v)>0));
    if(emUso && !confirm(`"${cod}" tem área/tonelada ou tratamento lançado no Plano Operacional. Remover assim mesmo?`)) return;
    if(!removerAtividade(cod)){ alert("Essa atividade não pode ser removida aqui."); return; }
    salvar(); render(); return; }
  if(t.dataset.grpren!==undefined){
    const id = t.dataset.grpren, g = todasFamilias().find(x=>x.id===id);
    const nome = prompt("Novo nome do grupo:", g ? g.nome : "");
    if(!nome || (g && nome.trim()===g.nome)) return;
    const r = renomearGrupoInsumo(id, nome);
    if(!r.ok){ alert(r.erro); return; }
    salvar(); render(); return; }
});

$("#btn_grp_add").onclick=()=>{
  const r = criarGrupoInsumo($("#in_grp_novo").value);
  if(!r.ok){ alert(r.erro); return; }
  $("#in_grp_novo").value="";
  salvar(); render();
};

$("#btn_ativ_add").onclick=()=>{
  const cod = $("#in_ativ_novo").value.trim();
  if(!cod){ alert("Informe o código da nova atividade."); return; }
  if(!codigoAtividadeValido(cod)){ alert("Código inválido: use letras, números, espaço, ponto, hífen, barra, +, %, vírgula ou parênteses."); return; }
  if(!criarAtividade(cod)){ alert(`Já existe uma atividade com o código "${cod}".`); return; }
  $("#in_ativ_novo").value="";
  salvar(); render();
};

$("#btn_trat_add").onclick=()=>{
  const cod = $("#in_trat_novo").value.trim();
  if(!cod){ alert("Informe o código do novo tratamento."); return; }
  if(!codigoTratValido(cod)){ alert(MSG_COD_TRAT); return; }
  if(!criarTrat(cod)){ alert(`Já existe um tratamento com o código "${cod}".`); return; }
  setTRAT_SEL(cod); $("#in_trat_novo").value="";
  salvar(); render();
};

$("#btn_add_prod").onclick=()=>{
  const prod=$("#sel_prod").value, dose=num($("#in_dose").value);
  if(!prod||dose<=0){ alert("Escolha um produto e informe uma dose maior que zero."); return; }
  const c=destravar(TRAT_SEL);
  const ja=c.find(l=>l.prod===prod);
  if(ja){ ja.dose=num(ja.dose)+dose; }
  else{
    // a unidade e a do cadastro do produto, nao da composicao-base: um produto
    // que nunca esteve em nenhum tratamento base nao tem linha em CFG.trat_det,
    // e a unidade ficava em branco mesmo estando cadastrada no insumo
    const reg=insLista().find(i=>i.prod===prod);
    c.push({prod,dose,un:reg?reg.un:""});
  }
  salvar(); render();
};

$("#btn_tp_add").onclick=()=>{
  tpessLista().push({rota:"Nova rota",veic:"Veículo",cap:20,qtd:1,kmDia:80,diasMes:26,
                     rsKm:3.50,diaria:90,kmExtra:0,rsKmExtra:4.50});
  salvar(); render();
};
$("#btn_tp_reset").onclick=()=>{
  if(!confirm("Restaurar as rotas padrão de transporte de pessoal?")) return;
  setTPESS(CFG.tpess.map(t=>({...t}))); salvar(); render();
};

$("#btn_ins_add").onclick=()=>{
  insLista().push({prod:"Novo insumo", un:"kg", pa:"", conc:"", est:0, preco:0});
  salvar(); render();
};
$("#btn_ins_sinc").onclick=()=>{
  const r = mesclarBaseInsumos();
  setINSX_V(CFG.insumos_v);
  salvar(); render();
  alert(r.novos || r.completados
    ? `Cadastro atualizado: ${r.novos} produto(s) novo(s) e ${r.completados} com a classificação técnica `+
      `completada. São ${r.total} produtos no cadastro.`
    : `Nada a trazer: os ${r.total} produtos do cadastro já estão com a classificação técnica da base.`);
};
$("#btn_ins_reset").onclick=()=>{
  if(!confirm("Restaurar o cadastro original de insumos? Preços e estoques ajustados são mantidos.")) return;
  setINSX(CFG.insumos.map(i=>({...i}))); salvar(); render();
};

$("#btn_mat_add").onclick=()=>{
  matLista().push({cat:"Outros",item:"Novo material",un:"un",preco:0,qtd:0,ap:""});
  salvar(); render();
};
$("#btn_crm_reset").onclick=()=>{
  const esps = FROTA_AG[CAT_SEL] || [];
  // itens do agrupamento: modelos da base mais os arquétipos cuja especialidade é dele
  const itens = [...new Set([
    ...esps.flatMap(e=>(FROTA_ESP[e].mods||[]).map(m=>e+SEP_MOD+m.m)),
    ...Object.keys(CFG.crm).filter(m=>{ const e=espDe(m);
      return CAT_SEL===AG_SEM_FROTA ? !e : (e && FROTA_ESP[e] && FROTA_ESP[e].ag===CAT_SEL); })
  ])];
  const sujos = itens.filter(m=>CRM[m]).length + esps.filter(e=>CRM_ESP[e]).length;
  if(!sujos){ alert("Este agrupamento já está com os valores padrão."); return; }
  if(!confirm("Restaurar os valores padrão de "+CAT_SEL+"? Isso apaga as taxas por especialidade e por modelo deste agrupamento.")) return;
  itens.forEach(m=>delete CRM[m]); esps.forEach(e=>delete CRM_ESP[e]);
  salvar(); render();
};

$("#btn_ap_add").onclick=()=>{
  const nome=$("#in_ap_nome").value.trim(), maq=$("#sel_ap_maq").value;
  const qtd=num($("#in_ap_qtd").value), h=num($("#in_ap_h").value);
  if(!nome){ alert("Informe o nome do equipamento."); return; }
  if(qtd<=0||h<=0){ alert("Quantidade e horas/mês devem ser maiores que zero."); return; }
  apoioLista().push({nome, maq, qtd, hmes:h, fcod:"918"});
  $("#in_ap_nome").value=""; salvar(); render();
};
$("#btn_ap_reset").onclick=()=>{
  if(!confirm("Restaurar a lista padrão de equipamentos de apoio?")) return;
  setAPOIO(CFG.apoio_eq.map(a=>({...a}))); salvar(); render();
};

$("#btn_niv_reset").onclick=()=>{
  if(!GRAT[FUN_SEL]){ alert("Este cargo não tem gratificação lançada."); return; }
  if(!confirm("Restaurar níveis e gratificação de "+FUN_SEL+"?")) return;
  delete GRAT[FUN_SEL]; salvar(); render();
};

$("#btn_mdo_reset").onclick=()=>{
  if(!Object.keys(ENC).length && !Object.keys(BEN).length){
    alert("Encargos e benefícios já estão com os valores originais."); return; }
  if(!confirm("Restaurar encargos e benefícios aos valores originais?")) return;
  setENC({}); setBEN({}); salvar(); render();
};

$("#btn_trat_reset").onclick=()=>{
  if(!TRATC[TRAT_SEL]){ alert("Este tratamento já está com a composição original."); return; }
  if(!confirm("Restaurar a composição original de "+TRAT_SEL+"?")) return;
  delete TRATC[TRAT_SEL]; salvar(); render();
};
$("#btn_diesel_reaj").onclick=()=>{
  const r = num($("#in_diesel_reaj").value)/100;
  MESES.forEach((m,i)=>{ DIESEL_MES[i] = +(P.diesel*Math.pow(1+r,i)).toFixed(4); });
  salvar(); render();
};
$("#btn_arr_add").onclick=()=>{
  arrLista().push({faz:"Nova fazenda", grupo:"", area:0, forma:"rsha", qtd:0, pag:"Anual", mes:0, pmes:null});
  salvar(); render();
};
$("#btn_arr_rat_reset").onclick=()=>{
  if(!confirm("Restaurar os percentuais de referência do rateio por etapa?")) return;
  // null (e não apagar a chave) para a limpeza chegar ao servidor no merge
  ETAPAS_ORD.forEach(e=>{ ARR_RAT[e]=null; });
  salvar(); render();
};
$("#btn_diesel_base").onclick=()=>{
  if(!confirm("Usar o preço base das Premissas em todos os meses?")) return;
  MESES.forEach((m,i)=>{ DIESEL_MES[i] = null; });
  salvar(); render();
};

/* ---------- teclado no Plano Operacional ----------
   As celulas de mes andam como numa planilha: cima e baixo sempre trocam de
   linha; esquerda e direita so trocam de coluna quando o cursor ja esta na
   ponta do texto, para nao atrapalhar a edicao do numero; Enter desce. Tab
   segue sendo do navegador, que ja pula sozinho as colunas escondidas pelo
   filtro. Colunas escondidas sao ignoradas pelo teste de offsetParent. */
const visivelPlano = el => el && el.offsetParent !== null;
document.addEventListener("keydown", e=>{
  const t = e.target;
  if(!(t.tagName==="INPUT" && t.dataset.c!==undefined && t.dataset.m!==undefined)) return;
  if(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  if(!["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Enter"].includes(e.key)) return;
  if(e.key==="ArrowRight" && t.selectionStart < t.value.length) return;
  if(e.key==="ArrowLeft"  && t.selectionStart > 0) return;
  let alvo = null;
  if(e.key==="ArrowLeft" || e.key==="ArrowRight"){
    const passo = e.key==="ArrowRight" ? 1 : -1;
    for(let j=(+t.dataset.m)+passo; j>=0 && j<NM; j+=passo){
      const c = document.querySelector(`#t_plano input[data-c="${t.dataset.c}"][data-m="${j}"]`);
      if(visivelPlano(c)){ alvo = c; break; }
    }
  }else{
    const coluna = [...document.querySelectorAll(`#t_plano input[data-m="${t.dataset.m}"]`)].filter(visivelPlano);
    alvo = coluna[coluna.indexOf(t) + (e.key==="ArrowUp" ? -1 : 1)];
  }
  if(alvo){ e.preventDefault(); alvo.focus(); alvo.select(); }
});

/* Enter e espaco abrem o rastro de uma linha navegavel; Esc fecha a gaveta. */
document.addEventListener("keydown", e=>{
  if(e.key==="Escape" && rastroAberto()){ fecharRastro(); renderRastro(); return; }
  if(e.key==="Escape" && rendMensalAberto()){ fecharRendMensal(); renderRendMensal(); return; }
  if(e.key!=="Enter" && e.key!==" ") return;
  const alvo = e.target.closest && e.target.closest("[data-rastro]");
  if(alvo && e.target.getAttribute && e.target.getAttribute("role")==="button"){
    e.preventDefault(); abrirRastro(alvo.dataset.rastro); renderRastro(); return;
  }
  // mesmo gesto (Enter/espaço) pra incluir um item da busca por teclado
  const addItem = e.target.closest && e.target.closest("[data-flag-add-chave]");
  if(addItem){ e.preventDefault(); addItem.click(); }
});
