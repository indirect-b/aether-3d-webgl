const fs = require('fs');

let app = fs.readFileSync('assets/js/app.1780406240914.js', 'utf8');

const target = 'ure),_this.texture.image||(_this.texture.image=_video.video,_this.texture.upload()),_this.colorParser&&_this.colorParser.update(_video.time)';

console.log('Includes target:', app.includes(target));

const replacement = 'ure),_this.texture&&(_this.texture.image||(_this.texture.image=_video.video,_this.texture.upload())),_this.colorParser&&_this.colorParser.update(_video.time)';

app = app.replace(target, replacement);

fs.writeFileSync('assets/js/app.1780406240914.js', app, 'utf8');
console.log('VideoTexture update patched!');
