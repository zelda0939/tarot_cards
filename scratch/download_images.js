const fs = require('fs');
const https = require('https');
const path = require('path');

const doubanUrls = JSON.parse(fs.readFileSync('scratch/douban.json', 'utf8'));

// Sequence array corresponding to the subagent's discovery:
// 1. 18-21 (ar18, ar19, ar20, ar21)
// 2. Wands (waac, wa02-wa10, wapa, wakn, waqu, waki)
// 3. Cups (cuac, cu02-cu10, cupa, cukn, cuqu, cuki)
// 4. Swords (swac, sw02-sw10, swpa, swkn, swqu, swki)
// 5. Pentacles (peac, pe02-pe10, pepa, pekn, pequ, peki)
// 6. 13-17 (ar13, ar14, ar15, ar16, ar17)
// 7. 0-12 (ar00, ar01, ..., ar12)

const names = [
  'ar18', 'ar19', 'ar20', 'ar21',
  'waac', 'wa02', 'wa03', 'wa04', 'wa05', 'wa06', 'wa07', 'wa08', 'wa09', 'wa10', 'wapa', 'wakn', 'waqu', 'waki',
  'cuac', 'cu02', 'cu03', 'cu04', 'cu05', 'cu06', 'cu07', 'cu08', 'cu09', 'cu10', 'cupa', 'cukn', 'cuqu', 'cuki',
  'swac', 'sw02', 'sw03', 'sw04', 'sw05', 'sw06', 'sw07', 'sw08', 'sw09', 'sw10', 'swpa', 'swkn', 'swqu', 'swki',
  'peac', 'pe02', 'pe03', 'pe04', 'pe05', 'pe06', 'pe07', 'pe08', 'pe09', 'pe10', 'pepa', 'pekn', 'pequ', 'peki',
  'ar13', 'ar14', 'ar15', 'ar16', 'ar17',
  'ar00', 'ar01', 'ar02', 'ar03', 'ar04', 'ar05', 'ar06', 'ar07', 'ar08', 'ar09', 'ar10', 'ar11', 'ar12'
];

if (names.length !== 78 || doubanUrls.length !== 78) {
  console.error("Length mismatch!", names.length, doubanUrls.length);
  process.exit(1);
}

const dir = path.join(__dirname, '..', 'images');
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.douban.com/' } }, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function main() {
  for (let i = 0; i < 78; i++) {
    const url = doubanUrls[i];
    const dest = path.join(dir, `${names[i]}.jpg`);
    await download(url, dest);
    console.log(`Downloaded ${names[i]} (${i+1}/78)`);
  }
  console.log("All done!");
}

main().catch(console.error);
