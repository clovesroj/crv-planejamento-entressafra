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
import './ui/anp.js';            // referencia de mercado de combustivel (aba Combustivel)
import './ui/interacao.js';      // glow interativo dos cards (kpi/hero)
import './ui/usuarios.js';       // aba Usuarios (so-admin) e seu proprio listener
import './ui/permissoes.js';     // trava de edicao por perfil (barreira em fase de captura)
import './app/eventos.js';       // delegacao de input / change / click
import './app/acoes.js';         // botoes de acao (restaurar, exportar, tema)

/* 2. o que o arranque chama diretamente */
import { pintarPremissas } from './ui/premissas.js';
import { render } from './app/ciclo.js';
import { carregar, marcarBaseGravacao } from './io/persistencia.js';
import { iniciarTelaLogin, aplicarChromeUsuario } from './ui/login.js';
import { quemSou } from './io/autenticacao.js';
import { setUSUARIO } from './nucleo/sessao.js';

/* ---------- arranque ----------
   So chama pintarPremissas/render/carregar depois de confirmar sessao — sem
   isso o app so mostraria a tela de login por cima, mas ja teria pedido
   /api/plano (que 401 de qualquer forma, so ruido). */
function arrancar(){
  pintarPremissas(); render();
  // marcarBaseGravacao() depois do render: listas criadas ou normalizadas na
  // primeira pintura entram na base, e não viram aviso falso de "sem permissão"
  carregar().then(()=>{ pintarPremissas(); render(); marcarBaseGravacao(); });
}
quemSou().then(usuario=>{
  if(usuario){ setUSUARIO(usuario); aplicarChromeUsuario(usuario); arrancar(); }
  else iniciarTelaLogin(arrancar);
});
