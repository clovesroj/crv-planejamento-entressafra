// Atalho de compatibilidade. O servidor mudou para server/index.js; este arquivo
// existe para o caso de o comando de start configurado no painel do Render ainda
// ser "node server.js" em vez de "npm start".
//
// Pode apagar assim que o painel do Render mostrar startCommand: npm start
// (Settings > Build & Deploy > Start Command).
require('./server/index.js');
