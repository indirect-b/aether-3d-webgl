const fs = require('fs');
const https = require('https');
const path = require('path');

const catalog = JSON.parse(fs.readFileSync('all_assets_catalog.json', 'utf8'));

// Helper to download a single file
function downloadFile(url, destPath) {
  return new Promise((resolve) => {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    
    // Check if already downloaded and not empty
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
      return resolve({ url, success: true, cached: true });
    }

    const file = fs.createWriteStream(destPath);
    const req = https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlinkSync(destPath);
        return resolve(downloadFile(res.headers.location, destPath));
      }
      if (res.statusCode !== 200) {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        return resolve({ url, success: false, status: res.statusCode });
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve({ url, success: true, size: fs.statSync(destPath).size });
      });
    });

    req.on('error', (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      resolve({ url, success: false, error: err.message });
    });

    req.setTimeout(25000, () => {
      req.destroy();
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      resolve({ url, success: false, error: 'Timeout' });
    });
  });
}

// Pool worker for concurrency
async function downloadPool(items, concurrency = 12) {
  let index = 0;
  let completed = 0;
  let succeeded = 0;
  let failed = [];

  async function worker() {
    while (index < items.length) {
      const i = index++;
      const item = items[i];
      const url = `https://activetheory.net/${encodeURI(item)}`;
      // Strip query parameters for local destination path
      const localItem = item.split('?')[0];
      const dest = path.join(__dirname, localItem);
      
      const res = await downloadFile(url, dest);
      completed++;
      if (res.success) {
        succeeded++;
      } else {
        failed.push({ item, res });
      }
      if (completed % 20 === 0 || completed === items.length) {
        console.log(`Progress: ${completed}/${items.length} (Success: ${succeeded}, Failed: ${failed.length})`);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  return { succeeded, failed };
}

(async () => {
  console.log(`Starting mirror of ${catalog.length} asset files...`);
  const result = await downloadPool(catalog, 15);
  console.log(`Mirror complete! Succeeded: ${result.succeeded}, Failed: ${result.failed.length}`);
  if (result.failed.length > 0) {
    console.log('Failed items:', result.failed.slice(0, 10));
    fs.writeFileSync('failed_downloads.json', JSON.stringify(result.failed, null, 2));
  }
})();
