const https = require('https');

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
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
  const baseUrl = 'https://www.douban.com/photos/album/145972492/';
  let currentUrl = baseUrl;

  for (let i = 0; i < 5; i++) {
    const html = await fetchPage(currentUrl);
    
    // 找出圖片的 pattern `<img src="https://img1.doubanio.com/view/photo/m/public/pXXXX.jpg" />` 或是找 `<a href... class="photolst_photo" title="XXX">`
    const regex = /<a\s+href="[^"]+"\s+class="photolst_photo"\s+title="([^"]+)">\s*<img\s+src="([^"]+)"/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      images.push({ title: match[1], url: match[2].replace('/m/', '/l/') }); // /m/ is thumb, /l/ is large
    }

    // 取得下一頁連結
    const nextRegex = /<link rel="next" href="([^"]+)"\s*\/>/;
    const nextMatch = html.match(nextRegex);
    if (!nextMatch) break;
    currentUrl = nextMatch[1];
  }

  console.log(JSON.stringify(images, null, 2));
}

scrapeAlbum();
