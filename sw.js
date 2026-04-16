/**
 * 聖境塔羅 Service Worker
 * 採用 Cache-First 策略快取核心靜態資源，支援離線訪問
 * 
 * ⚠️ 更新版本號步驟：
 * 1. 修改 version.js 中的 APP_VERSION
 * 2. 同步修改下方 CACHE_VERSION
 * 3. 同步修改 index.html 中所有 ?v= 參數
 */

const CACHE_VERSION = '1.4.15';
const CACHE_NAME = `celestial-tarot-v${CACHE_VERSION}`;

// 需要預先快取的核心檔案 (精簡版以確保安裝成功率)
const CORE_ASSETS = [
    './',
    './index.html',
    './version.js',
    './style.css',
    './app.js',
    './tarot_dict.js',
    './manifest.json',
    './icons/icon-192.png'
];

// 安裝：預先快取核心資源
self.addEventListener('install', (event) => {
    console.log('[SW] 安裝中，預快取核心資源...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(CORE_ASSETS);
        }).then(() => {
            // 立即啟用，不等舊的 SW 結束
            return self.skipWaiting();
        })
    );
});

// 啟用：清除舊版快取
self.addEventListener('activate', (event) => {
    console.log('[SW] 啟用中，清除舊快取...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => {
            // 立即接管所有頁面
            return self.clients.claim();
        })
    );
});

// 攔截請求：Network-First (網路優先) + Cache Fallback
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // 只處理 GET 請求；API 呼叫不走快取
    if (request.method !== 'GET') return;
    if (request.url.includes('generativelanguage.googleapis.com')) return;
    if (request.url.includes('tarotapi.dev')) return;

    event.respondWith(
        fetch(request).then((networkResponse) => {
            // 從網路成功取得資源，將新版存入快取供日後離線使用
            if (networkResponse && networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, responseClone);
                });
            }
            return networkResponse;
        }).catch(() => {
            // 網路失敗 (例如離線或伺服器異常) -> Fallback 到快取
            return caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                // 離線且快取無此資源 — 返回 fallback 首頁
                if (request.destination === 'document') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
