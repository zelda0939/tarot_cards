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
let selectedHistoryIds = new Set();

function updateHistoryActionButtons() {
    const deleteBtn = document.getElementById('delete-selected-history-btn');
    const selectAllCheckbox = document.getElementById('history-select-all');
    const allCheckboxes = document.querySelectorAll('.history-item-checkbox');
    
    if (deleteBtn) {
        deleteBtn.disabled = selectedHistoryIds.size === 0;
        deleteBtn.textContent = selectedHistoryIds.size > 0 ? `刪除所選 (${selectedHistoryIds.size})` : '刪除所選';
    }
    
    if (selectAllCheckbox && allCheckboxes.length > 0) {
        selectAllCheckbox.checked = selectedHistoryIds.size === allCheckboxes.length;
    }
}

async function openHistoryModal() {
    const modal = document.getElementById('history-modal');
    if (!modal) return;
    
    // 初始化確保顯示列表視圖，隱藏詳細視圖
    document.getElementById('history-list-view').classList.remove('hidden');
    document.getElementById('history-detail-view').classList.add('hidden');
    
    // 重置多選狀態
    selectedHistoryIds.clear();
    const selectAllCheckbox = document.getElementById('history-select-all');
    if (selectAllCheckbox) selectAllCheckbox.checked = false;
    updateHistoryActionButtons();
    
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

    const actionsBar = document.getElementById('history-actions-bar');
    selectedHistoryIds.clear();
    updateHistoryActionButtons();

    if (records.length === 0) {
        container.innerHTML = '<div class="history-empty-msg">空空如也。您尚未留下任何占卜星軌。</div>';
        if (actionsBar) actionsBar.classList.add('hidden');
        return;
    }

    if (actionsBar) actionsBar.classList.remove('hidden');

    let html = '';
    records.forEach(record => {
        // 預覽前單張牌的名稱串接 (加入正逆位)
        const cardNames = record.cards.map(c => {
            const posture = c.isReversed ? '(逆)' : '(正)';
            return `${c.name} ${posture}`;
        }).join('、');
        const previewQuestion = record.question || '一般指引 (未輸入明確提問)';

        html += `
        <div class="history-item" id="history-item-${record.id}">
            <div class="history-item-header">
                <label class="history-checkbox-label" onclick="event.stopPropagation()">
                    <input type="checkbox" class="history-item-checkbox" value="${record.id}">
                    <span class="custom-checkbox"></span>
                    <span class="history-item-date">${record.dateString}</span>
                </label>
                <button class="history-delete-single-btn" data-id="${record.id}" title="刪除此紀錄" onclick="event.stopPropagation()">✖</button>
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

    // 綁定 Checkbox 事件
    container.querySelectorAll('.history-item-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const id = Number(e.target.value);
            const historyItem = document.getElementById(`history-item-${id}`);
            
            if (e.target.checked) {
                selectedHistoryIds.add(id);
                if (historyItem) historyItem.classList.add('selected');
            } else {
                selectedHistoryIds.delete(id);
                if (historyItem) historyItem.classList.remove('selected');
            }
            updateHistoryActionButtons();
        });
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

    // 根據 spreadMode 決定牌位名稱
    const isCelticCross = record.spreadMode === 'celtic-cross';
    let positions;
    if (isCelticCross && typeof CELTIC_CROSS_POSITIONS !== 'undefined') {
        positions = CELTIC_CROSS_POSITIONS.map(p => `${p.id}. ${p.name}`);
    } else if (record.cards.length === 1) {
        positions = ['今日指引'];
    } else {
        positions = ['第1張', '第2張', '第3張'];
    }
    let cardsHtml = '';
    
    // 聖十字模式只顯示佈局圖，不生成逐牌解析卡片
    if (!isCelticCross) {
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
    }

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
        
        <div class="cards-analysis-container${isCelticCross ? ' celtic-cross-analysis' : ''} mb-2">
            ${isCelticCross && typeof buildCelticCrossLayoutHTML === 'function'
                ? buildCelticCrossLayoutHTML(record.cards)
                : ''}
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
    
    // 全選 Checkbox
    const selectAllCheckbox = document.getElementById('history-select-all');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            const checkboxes = document.querySelectorAll('.history-item-checkbox');
            
            checkboxes.forEach(cb => {
                cb.checked = isChecked;
                const id = Number(cb.value);
                const historyItem = document.getElementById(`history-item-${id}`);
                
                if (isChecked) {
                    selectedHistoryIds.add(id);
                    if (historyItem) historyItem.classList.add('selected');
                } else {
                    selectedHistoryIds.delete(id);
                    if (historyItem) historyItem.classList.remove('selected');
                }
            });
            updateHistoryActionButtons();
        });
    }

    // 刪除所選按鈕
    const deleteSelectedBtn = document.getElementById('delete-selected-history-btn');
    if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', async () => {
            if (selectedHistoryIds.size === 0) return;
            
            const confirmed = await showConfirmDialog('刪除日誌', `確定要刪除選取的 ${selectedHistoryIds.size} 筆占卜紀錄嗎？`);
            if (confirmed) {
                // 批次刪除
                await Promise.all(Array.from(selectedHistoryIds).map(id => deleteHistoryRecord(id)));
                selectedHistoryIds.clear();
                await renderHistoryList();
            }
        });
    }
    
    // 初始化本地資料庫
    initDB();
});


