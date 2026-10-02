/**
 * Ponto de entrada. Carregado por <script type="module"> no fim do index.html.
 *
 * Modulos ES sao deferidos: quando este arquivo executa, o documento ja foi
 * lido inteiro, entao os handlers encontram os elementos — mesma situacao do
 * script inline no fim do <body> que existia antes.
 *
 * A primeira secao importa modulos so pelo efeito colateral: eles registram
 * handlers ou mexem no DOM ao serem avaliados, e ninguem os importa por um
 * simbolo. A ORDEM IMPORTA e reproduz a ordem em que esses trechos apareciam
 * no arquivo unico: ha mais de um listener de clique no document (o que fecha
 * o menu de relatorio e o que trata remocao de linha), e quem registra antes
 * dispara antes.
 */

/* 1. efeitos colaterais, na ordem original do index.html */
import './io/relatorio.js';      // botao Relatorio + clique que fecha o menu
import './ui/logo.js';           // aplica o logo e gera a versao branca
import './io/persistencia.js';   // listeners de visibilitychange / pagehide / blur
import './ui/navegacao.js';      // menu lateral, abas, botao de tema
import './ui/interacao.js';      // glow interativo dos cards (kpi/hero)
import './ui/usuarios.js';       // aba Usuarios (so-admin) e seu proprio listener
import './ui/materiais-cad.js';  // aba Cadastro de Materiais (busca no servidor, fora do render())
import './ui/permissoes.js';     // trava de edicao por perfil (barreira em fase de captura)
import './app/eventos.js';       // delegacao de input / change / click
import './app/acoes.js';         // botoes de acao (restaurar, exportar, tema)

/* 2. o que o arranque chama diretamente */
import { pintarPremissas } from './ui/premissas.js';
import { render } from './app/ciclo.js';
import { carregar, marcarBaseGravacao, mostrarToast, oferecerResgate, salvar } from './io/persistencia.js';
import { CFG } from './dados/cfg.js';
import { TPESS_ROTAS_V1 } from './dados/transporte-pessoal.js';
import { copiaRota, setTPESS, tpessLista } from './nucleo/estado.js';
import { podeEditar } from './nucleo/sessao.js';
import { iniciarTelaLogin, aplicarChromeUsuario } from './ui/login.js';
import { quemSou } from './io/autenticacao.js';
import { setUSUARIO } from './nucleo/sessao.js';

/* ---------- arranque ----------
   So chama pintarPremissas/render/carregar depois de confirmar sessao — sem
   isso o app so mostraria a tela de login por cima, mas ja teria pedido
   /api/plano (que 401 de qualquer forma, so ruido). */
/* Rotas do Transporte de Pessoal sobrescritas pelo padrão antigo (as quatro
   rotas genéricas) -- o que a gravação durante o carregamento fazia (ver
   alteracoes() em io/persistencia.js) -- voltam a ser as rotas da usina, que
   agora são o padrão (dados/transporte-pessoal.js), e o plano é gravado. Só
   quando a lista é EXATAMENTE a antiga: rota que alguém editou não é tocada. */
export function restaurarRotasPerdidas(){
  const chave = t => JSON.stringify(["rota","veic","cap","qtd","kmDia","diasMes","rsKm","diaria","kmExtra","rsKmExtra"]
    .map(f=>f==="rota"||f==="veic" ? String(t[f]||"") : +t[f]||0)) + (t.ent && Object.keys(t.ent).length ? JSON.stringify(t.ent) : "");
  // só quem edita a aba grava a restauração (para os outros o servidor recusaria)
  if(!podeEditar("tpess")) return;
  const atual = tpessLista();
  if(atual.length !== TPESS_ROTAS_V1.length || !atual.every((t,i)=>chave(t)===chave(TPESS_ROTAS_V1[i]))) return;
  setTPESS(CFG.tpess.map(copiaRota));
  salvar(); render();
  mostrarToast("Rotas do Transporte de Pessoal restauradas (estavam no padrão antigo)");
}
function arrancar(){
  pintarPremissas(); render();
  // marcarBaseGravacao() depois do render: listas criadas ou normalizadas na
  // primeira pintura entram na base, e não viram aviso falso de "sem permissão"
  carregar().then(()=>{ pintarPremissas(); render(); marcarBaseGravacao(); restaurarRotasPerdidas();
    // dados que o servidor perdeu e este navegador ainda tem (ver guardarResgate)
    if(oferecerResgate()){ pintarPremissas(); render(); } });
}
quemSou().then(usuario=>{
  if(usuario){ setUSUARIO(usuario); aplicarChromeUsuario(usuario); arrancar(); }
  else iniciarTelaLogin(arrancar);
});
