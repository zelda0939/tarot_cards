/* ============================
   歷史紀錄 (IndexedDB)
   ============================ */
const DB_NAME = 'CelestialTarotDB';
const DB_VERSION = 1;
const STORE_NAME = 'historyLogs';

let dbInstance = null;

function initDB() {
    return new Promise((resolve, reject) => {
        if (dbInstance) {
            resolve(dbInstance);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            dbInstance = event.target.result;
            resolve(dbInstance);
        };

        request.onerror = (event) => {
            console.error('[聖境塔羅] IndexedDB 初始化失敗:', event.target.error);
            reject(event.target.error);
        };
    });
}

async function saveHistoryRecord(record) {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            const timestamp = Date.now();
            const dateObj = new Date(timestamp);
            const dataToSave = {
                id: timestamp,
                dateString: dateObj.toLocaleString('zh-TW', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit'
                }),
                ...record
            };

            const request = store.add(dataToSave);

            request.onsuccess = () => resolve(dataToSave);
            request.onerror = (e) => {
                console.error('[聖境塔羅] 儲存歷史紀錄失敗:', e.target.error);
                reject(e.target.error);
            };
        });
    } catch (err) {
        console.error(err);
    }
}

async function getAllHistory() {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                // 將最新的排在前面
                const results = request.result || [];
                results.sort((a, b) => b.id - a.id);
                resolve(results);
            };
            request.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        console.error(err);
        return [];
    }
}

async function deleteHistoryRecord(id) {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(Number(id));

            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        console.error(err);
    }
}

async function clearAllHistory() {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        console.error(err);
    }
}

/* ============================
   UI 互動邏輯
   ============================ */

async function openHistoryModal() {
    const modal = document.getElementById('history-modal');
    if (!modal) return;
    
    // 初始化確保顯示列表視圖，隱藏詳細視圖
    document.getElementById('history-list-view').classList.remove('hidden');
    document.getElementById('history-detail-view').classList.add('hidden');
    
    modal.classList.remove('hidden');
    await renderHistoryList();
}

function closeHistoryModal() {
    const modal = document.getElementById('history-modal');
    if (modal) modal.classList.add('hidden');
}

async function renderHistoryList() {
    const container = document.getElementById('history-list-container');
    if (!container) return;

    container.innerHTML = '<div class="history-loading-msg">讀取中...</div>';

    const records = await getAllHistory();

    if (records.length === 0) {
        container.innerHTML = '<div class="history-empty-msg">空空如也。您尚未留下任何占卜星軌。</div>';
        return;
    }

    let html = '';
    records.forEach(record => {
        // 預覽前單張牌的名稱串接 (加入正逆位)
        const cardNames = record.cards.map(c => {
            const posture = c.isReversed ? '(逆)' : '(正)';
            return `${c.name} ${posture}`;
        }).join('、');
        const previewQuestion = record.question || '一般指引 (未輸入明確提問)';

        html += `
        <div class="history-item">
            <div class="history-item-header">
                <span class="history-item-date">${record.dateString}</span>
                <button class="history-delete-single-btn" data-id="${record.id}" title="刪除此紀錄">✖</button>
            </div>
            <div class="history-item-body" onclick="showHistoryDetail(${record.id})">
                <div class="history-item-question">${escapeHtml(previewQuestion)}</div>
                <div class="history-item-cards">✦ ${cardNames}</div>
            </div>
        </div>
        `;
    });

    container.innerHTML = html;

    // 綁定單筆刪除事件
    container.querySelectorAll('.history-delete-single-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation(); // 避免觸發進入詳細頁面
            const confirmed = await showConfirmDialog('刪除日誌', '確定要刪除這筆占卜紀錄嗎？');
            if (confirmed) {
                const id = btn.getAttribute('data-id');
                await deleteHistoryRecord(id);
                // 重新渲染
                await renderHistoryList();
            }
        };
    });
}

// 將資料呈現於已有的 HTML 結構 (利用內建的排版，或動態建構)
async function showHistoryDetail(id) {
    const records = await getAllHistory();
    const record = records.find(r => r.id === Number(id));
    if (!record) return;

    document.getElementById('history-list-view').classList.add('hidden');
    document.getElementById('history-detail-view').classList.remove('hidden');

    const detailContainer = document.getElementById('history-detail-content');
    
    const positions = ['第1張', '第2張', '第3張'];
    let cardsHtml = '';
    
    // 生成三張卡牌的 HTML（與 analysis.js showAnalysis 一致的結構）
    record.cards.forEach((card, idx) => {
        const posture = card.isReversed ? '逆位' : '正位';
        const imgUrl = `assets/images/${card.name_short}.jpg`;
        const imgReversedClass = card.isReversed ? ' reversed-img' : '';
        const meaningLabel = card.isReversed ? '▽ 逆位' : '▲ 正位';
        const meaningClass = card.isReversed ? 'analysis-meaning-rev' : 'analysis-meaning';

        cardsHtml += `
        <div class="analysis-card">
            <div class="analysis-position">${positions[idx]}</div>
            <div class="analysis-card-img">
                <img src="${imgUrl}" alt="${card.name}" class="${imgReversedClass}">
            </div>
            <div class="analysis-header">
                <div class="analysis-symbol">${card.symbol || '✦'}</div>
                <div class="analysis-name">${card.name} <span class="analysis-posture-tag">[${posture}]</span></div>
            </div>
            <div class="${meaningClass}"><strong>${meaningLabel}：</strong><br>${card.meaning}</div>
        </div>`;
    });

    // 組合整體視圖
    const safeQuestion = escapeHtml(record.question || '一般指引');
    const formattedAiText = record.aiText ? escapeHtml(record.aiText).replace(/\n/g, '<br>') : '';
    
    // 讓排版與 index.html 的 #reading-modal 完全一致
    detailContainer.innerHTML = `
        <div class="history-detail-date-container">
            <p class="history-detail-date">${record.dateString}</p>
        </div>

        <div id="gemini-analysis-section" class="history-question-container">
            <div class="gemini-header">
                <span class="gold-star">❉</span> 您的提問 <span class="gold-star">❉</span>
            </div>
            <div id="gemini-content-box">
                <div class="history-question-text">${safeQuestion}</div>
            </div>
        </div>
        
        <div class="cards-analysis-container mb-2">
            ${cardsHtml}
        </div>
        
        <div id="gemini-analysis-section" style="margin-bottom: 2rem; margin-top: 2rem;">
            <div class="gemini-header">
                <span class="gold-star">❉</span> 綜合神諭 (Gemini Insight) <span class="gold-star">❉</span>
            </div>
            <div id="gemini-content-box">
                <div id="gemini-text" style="display: block;">${formattedAiText}</div>
            </div>
        </div>
    `;
}

function backToHistoryList() {
    document.getElementById('history-detail-view').classList.add('hidden');
    document.getElementById('history-list-view').classList.remove('hidden');
}

// 綁定 DOM 事件
document.addEventListener('DOMContentLoaded', () => {
    // 歷史紀錄按鈕
    const historyBtn = document.getElementById('history-btn');
    const closeHistoryBtn = document.getElementById('close-history-modal');
    const clearAllBtn = document.getElementById('clear-history-btn');
    const backBtn = document.getElementById('history-back-btn');

    if (historyBtn) historyBtn.addEventListener('click', openHistoryModal);
    if (closeHistoryBtn) closeHistoryBtn.addEventListener('click', closeHistoryModal);
    if (backBtn) backBtn.addEventListener('click', backToHistoryList);
    
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', async () => {
            const confirmed = await showConfirmDialog('清空日誌', '確定要清除所有神諭日誌嗎？這將無法復原。');
            if (confirmed) {
                await clearAllHistory();
                await renderHistoryList();
            }
        });
    }
    
    // 初始化本地資料庫
    initDB();
});


