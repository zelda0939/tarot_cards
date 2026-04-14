const https = require('https');
const fs = require('fs');

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }
};

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function scrapeAlbum() {
  const images = [];
  const starts = [0, 18, 36, 54, 72];

  for (const s of starts) {
    const url = `https://www.douban.com/photos/album/145972492/?m_start=${s}`;
    const html = await fetchPage(url);
    
    // <img src="https://img9.doubanio.com/view/photo/m/public/p2208623414.jpg" alt="" />
    const regex = /<img\s+src="([^"]+doubanio\.com\/view\/photo\/m\/public\/p\d+\.jpg)"/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      images.push(match[1].replace('/m/public/', '/l/public/'));
    }
  }

  fs.writeFileSync('scratch/douban.json', JSON.stringify(images, null, 2), 'utf8');
  console.log(`Saved ${images.length} images.`);
}

scrapeAlbum().catch(console.error);
