const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('Syncing dist folder...');
fs.mkdirSync('dist', { recursive: true });

// Copy index.html and unsupported.html
fs.copyFileSync('index.html', 'dist/index.html');
if (fs.existsSync('unsupported.html')) {
  fs.copyFileSync('unsupported.html', 'dist/unsupported.html');
}

// Copy assets
console.log('Copying assets directory...');
copyDir('assets', 'dist/assets');

// Add .nojekyll
fs.writeFileSync('dist/.nojekyll', '');

console.log('dist directory synced successfully!');
