const fs = require('fs');

let app = fs.readFileSync('assets/js/app.1780406240914.js', 'utf8');

// The original buggy block:
// for await(const key of pages){if(window.CMS_DATA[key]){_data[key]=window.CMS_DATA[key];continue}const data=await get(`https://storage.googleapis.com/activetheory-v6.appspot.com/cms/${key}-${dataVersion}.json?v=CMS_DATA_${Date.now()}`).catch((e=>console.log(e)));if(data)

const oldCode = 'if(window.CMS_DATA[key]){_data[key]=window.CMS_DATA[key];continue}const data=await get(`https://storage.googleapis.com/activetheory-v6.appspot.com/cms/${key}-${dataVersion}.json?v=CMS_DATA_${Date.now()}`).catch((e=>console.log(e)));';

console.log('Includes oldCode:', app.includes(oldCode));

// Replace so that if window.CMS_DATA[key] exists, data is set to it, and the rest of the parsing (reshape, sort, etc.) ALWAYS executes!
const newCode = 'const data=(window.CMS_DATA&&window.CMS_DATA[key])||await get(`https://storage.googleapis.com/activetheory-v6.appspot.com/cms/${key}-dev.json`).catch((e=>console.log(e)));_data[key]=data;';

app = app.replace(oldCode, newCode);

fs.writeFileSync('assets/js/app.1780406240914.js', app, 'utf8');
console.log('app.1780406240914.js patched successfully!');
