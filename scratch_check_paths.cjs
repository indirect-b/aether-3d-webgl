const fs = require('fs');
const app = fs.readFileSync('assets/js/app.1780406240914.js', 'utf8');

const regex = /['"][^'"]*draco[^'"]*['"]/gi;
let m;
while ((m = regex.exec(app)) !== null) {
  console.log('Draco:', m[0]);
}

const regex2 = /['"][^'"]*basis[^'"]*['"]/gi;
while ((m = regex2.exec(app)) !== null) {
  console.log('Basis:', m[0]);
}
