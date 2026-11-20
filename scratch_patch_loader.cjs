const fs = require('fs');

let app = fs.readFileSync('assets/js/app.1780406240914.js', 'utf8');

const target = '_this.params.loader.add(2),_this.bind("FXScroll/firstScene"';
console.log('Includes target:', app.includes(target));

app = app.replace(target, '_this.params.loader.add(1),_this.bind("FXScroll/firstScene"');

fs.writeFileSync('assets/js/app.1780406240914.js', app, 'utf8');
console.log('Loader count patched!');
