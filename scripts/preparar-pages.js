// Ajustes no site exportado para o GitHub Pages, que serve arquivos estáticos:
// - 404.html igual ao index.html: um endereço como /item/3, aberto direto ou
//   recarregado, carrega o app, e o Expo Router mostra a tela certa;
// - .nojekyll: impede o Pages de ignorar a pasta _expo (começa com "_").
const fs = require('node:fs');
const path = require('node:path');

const dist = path.join(__dirname, '..', 'dist');
fs.copyFileSync(path.join(dist, 'index.html'), path.join(dist, '404.html'));
fs.writeFileSync(path.join(dist, '.nojekyll'), '');
console.log('dist/ pronto para o GitHub Pages.');
