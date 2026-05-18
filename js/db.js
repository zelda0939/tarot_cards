/* ============================
   資料層 (IndexedDB) - CelestialTarotDB
   ============================ */
const DB_NAME = 'CelestialTarotDB';
const DB_VERSION = 1;
const STORE_NAME = 'historyLogs';

let dbInstance = null;

export function initDB() {
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

export async function saveHistoryRecord(record) {
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
        console.error('[聖境塔羅] 儲存歷史紀錄失敗:', err);
        throw err;
    }
}

export async function getAllHistory() {
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
        console.error('[聖境塔羅] 讀取歷史紀錄失敗:', err);
        throw err;
    }
}

export async function deleteHistoryRecord(id) {
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
        console.error('[聖境塔羅] 刪除歷史紀錄失敗:', err);
        throw err;
    }
}

export async function clearAllHistory() {
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
        console.error('[聖境塔羅] 清空歷史紀錄失敗:', err);
        throw err;
    }
}

/**
 * 將延伸提問的對話追加到指定的歷史紀錄中
 * @param {number} recordId - 歷史紀錄 ID
 * @param {{ question: string, reply: string, timestamp: number }} chat - 單筆延伸對話
 */
export async function updateHistoryFollowup(recordId, chat) {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const getRequest = store.get(Number(recordId));

            getRequest.onsuccess = () => {
                const record = getRequest.result;
                if (!record) {
                    resolve(null);
                    return;
                }
                // 初始化 followupChats 陣列（相容舊紀錄）
                if (!Array.isArray(record.followupChats)) {
                    record.followupChats = [];
                }
                record.followupChats.push(chat);

                const putRequest = store.put(record);
                putRequest.onsuccess = () => resolve(record);
                putRequest.onerror = (e) => reject(e.target.error);
            };
            getRequest.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        console.error('[聖境塔羅] 更新延伸對話失敗:', err);
        throw err;
    }
}
