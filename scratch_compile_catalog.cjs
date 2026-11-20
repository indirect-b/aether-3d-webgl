const fs = require('fs');
const https = require('https');
const path = require('path');

// Read uil.json and app.js matches
async function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

(async () => {
  console.log('Fetching app.js and uil.json to compile complete asset catalog...');
  const appJs = await fetchText('https://activetheory.net/assets/js/app.1780406240914.js');
  const uilJson = await fetchText('https://activetheory.net/assets/data/uil.1780406240914.json');

  const assetSet = new Set();

  function scan(text) {
    const regex = /["'`](assets\/[^"'`]+)["'`]/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      let p = match[1];
      if (!p.includes('${') && !p.endsWith('/') && p.includes('.')) {
        assetSet.add(p);
      }
    }
  }

  scan(appJs);
  scan(uilJson);

  // Fonts
  const fonts = [
    'assets/fonts/NBArchitektStd-Regular-export/NBArchitektStd-Regular.woff2',
    'assets/fonts/NBArchitektStd-Regular-export/NBArchitektStd-Regular.woff',
    'assets/fonts/NBArchitektStd-Regular-export/NBArchitektStd-Regular.otf',
    'assets/fonts/NBArchitektStd-Light-export/NBArchitektStd-Light.woff2',
    'assets/fonts/NBArchitektStd-Light-export/NBArchitektStd-Light.woff',
    'assets/fonts/NBArchitektStd-Light-export/NBArchitektStd-Light.otf',
    'assets/fonts/NBArchitektStd-Bold-export/NBArchitektStd-Bold.woff2',
    'assets/fonts/NBArchitektStd-Bold-export/NBArchitektStd-Bold.woff',
    'assets/fonts/NBArchitektStd-Bold-export/NBArchitektStd-Bold.otf'
  ];
  fonts.forEach(f => assetSet.add(f));

  // Meta
  const meta = [
    'assets/meta/apple-touch-icon.png',
    'assets/meta/favicon-32x32.png',
    'assets/meta/favicon-16x16.png',
    'assets/meta/manifest.json',
    'assets/meta/safari-pinned-tab.svg'
  ];
  meta.forEach(m => assetSet.add(m));

  // Core files
  assetSet.add('assets/js/app.1780406240914.js');
  assetSet.add('assets/data/uil.1780406240914.json');

  const allAssets = Array.from(assetSet).sort();
  console.log(`Total unique asset files to mirror: ${allAssets.length}`);
  fs.writeFileSync('all_assets_catalog.json', JSON.stringify(allAssets, null, 2));
  console.log('Catalog written to all_assets_catalog.json');
})();
