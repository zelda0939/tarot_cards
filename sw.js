/**
 * 聖境塔羅 Service Worker
 * 採用 Network-First 策略確保每次取得最新資源，離線時 fallback 至快取
 * 
 * ⚠️ 更新版本號步驟：
 * 1. 修改 version.js 中的 APP_VERSION
 * 2. 同步修改下方 CACHE_VERSION
 * 3. 同步修改 index.html 中所有 ?v= 參數
 */

const CACHE_VERSION = '1.10.1';
const CACHE_NAME = `celestial-tarot-v${CACHE_VERSION}`;

// 需要預先快取的核心檔案
const CORE_ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './css/animations.css',
    './css/celtic-cross.css',
    './js/state.js',
    './js/ui.js',
    './js/question.js',
    './js/ring.js',
    './js/gesture.js',
    './js/imageExport.js',
    './js/db.js',
    './js/history.js',
    './js/analysis.js',
    './js/app.js',
    './js/daily.js',
    './js/celtic-cross.js',
    './js/init.js',
    './assets/data/tarot_dict.json',
    './manifest.json',
    './assets/icons/icon-192.png',
    './assets/images/card_back.png'
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

// 攔截請求：卡牌圖片走 Cache-First，其餘走 Network-First
self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.method !== 'GET') return;
    if (request.url.includes('generativelanguage.googleapis.com')) return;
    if (request.url.includes('tarotapi.dev')) return;

    const url = new URL(request.url);
    const isCardImage = url.pathname.startsWith('/assets/images/') && url.pathname.endsWith('.jpg');

    if (isCardImage) {
        // Cache-First for card images
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return networkResponse;
                });
            })
        );
        return;
    }

    // Network-First for everything else
    event.respondWith(
        fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
                const clone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
        }).catch(() => {
            return caches.match(request).then((cached) => {
                if (cached) return cached;
                if (request.destination === 'document') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
