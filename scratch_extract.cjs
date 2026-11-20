const https = require('https');
const fs = require('fs');

https.get('https://activetheory.net/assets/js/app.1780406240914.js', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const regex = /["'](assets\/[^"']+)["']/g;
    let match;
    const set = new Set();
    while ((match = regex.exec(data)) !== null) {
      let p = match[1];
      if (!p.includes('${') && !p.endsWith('/')) {
        set.add(p);
      }
    }
    console.log('Total static asset paths found:', set.size);
    const arr = Array.from(set);
    fs.writeFileSync('extracted_assets.json', JSON.stringify(arr, null, 2));
    console.log('Saved to extracted_assets.json');
    console.log(arr.slice(0, 30));
  });
});
