const fs = require('fs');

fs.copyFileSync('index.html', '404.html');
fs.copyFileSync('index.html', 'dist/404.html');
console.log('404.html created for SPA fallback on GitHub Pages!');
