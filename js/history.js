/* ============================
   UI 互動邏輯
   ============================ */
let _currentHistoryRecord = null;


function updateHistoryActionButtons() {
    const deleteBtn = document.getElementById('delete-selected-history-btn');
    const selectAllCheckbox = document.getElementById('history-select-all');
    const allCheckboxes = document.querySelectorAll('.history-item-checkbox');
    
    if (deleteBtn) {
        deleteBtn.disabled = AppState.selectedHistoryIds.size === 0;
        deleteBtn.textContent = AppState.selectedHistoryIds.size > 0 ? `刪除所選 (${AppState.selectedHistoryIds.size})` : '刪除所選';
    }
    
    if (selectAllCheckbox && allCheckboxes.length > 0) {
        selectAllCheckbox.checked = AppState.selectedHistoryIds.size === allCheckboxes.length;
    }
}

async function openHistoryModal() {
    const modal = document.getElementById('history-modal');
    if (!modal) return;
    
    // 初始化確保顯示列表視圖，隱藏詳細視圖
    document.getElementById('history-list-view').classList.remove('hidden');
    document.getElementById('history-detail-view').classList.add('hidden');
    
    // 重置多選狀態
    AppState.selectedHistoryIds.clear();
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
    AppState.selectedHistoryIds.clear();
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
                AppState.selectedHistoryIds.add(id);
                if (historyItem) historyItem.classList.add('selected');
            } else {
                AppState.selectedHistoryIds.delete(id);
                if (historyItem) historyItem.classList.remove('selected');
            }
            updateHistoryActionButtons();
        });
    });
}

// 將資料呈現於已有的 HTML 結構 (利用內建的排版，或動態建構)
async function exportHistoryImage(record) {
    const btn = document.getElementById('history-export-btn');
    if (btn) btn.textContent = '儲存中...';
    try {
        const options = {
            spreadMode: record.spreadMode,
            followupChats: record.followupChats || []
        };
        const canvas = await buildGuidanceImageCanvas(record.question, record.aiText, record.cards, options);
        
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const dateStr = record.dateString.replace(/[\/\s:]/g, '');
            a.download = `tarot_history_${dateStr}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            if (btn) btn.textContent = '儲存圖片';
        }, 'image/jpeg', 0.85);
    } catch (e) {
        if (btn) btn.textContent = '儲存圖片';
        alert('儲存圖片失敗：' + e.message);
    }
}


async function showHistoryDetail(id) {
    const records = await getAllHistory();
    const record = records.find(r => r.id === Number(id));
    if (!record) return;

    document.getElementById('history-list-view').classList.add('hidden');
    document.getElementById('history-detail-view').classList.remove('hidden');

    const detailContainer = document.getElementById('history-detail-content');

    _currentHistoryRecord = record;

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
        ${_renderHistoryFollowupSection(record)}
    `;

    // 綁定延伸提問事件
    _bindHistoryFollowupEvents(record);
}

/**
 * 渲染歷史紀錄中的延伸提問區（包含過往對話與輸入框）
 * @param {Object} record - 歷史紀錄物件
 * @returns {string} HTML 字串
 */
function _renderHistoryFollowupSection(record) {
    const followupChats = record.followupChats || [];
    
    let html = `
        <div class="followup-section" id="history-followup-section" style="margin-top: 2rem; margin-bottom: 2rem;">
            <div class="followup-divider">
                <span>✦ 延伸提問 ✦</span>
            </div>
            <div class="followup-history" id="history-followup-container" style="max-height: 50vh; overflow-y: auto; padding-right: 5px;">`;

    followupChats.forEach(chat => {
        const safeQ = escapeHtml(chat.question);
        const safeR = escapeHtml(chat.reply).replace(/\n/g, '<br>');
        html += `
                <div class="followup-bubble followup-bubble-user">
                    <div class="followup-bubble-label">您的追問</div>${safeQ}
                </div>
                <div class="followup-bubble followup-bubble-ai">
                    <div class="followup-bubble-label">✦ 星辰回應</div>${safeR}
                </div>`;
    });

    html += `
            </div>
            <div class="followup-input-row" style="margin-top: 15px; display: flex; gap: 10px;">
                <textarea id="history-followup-input" rows="2" maxlength="200" 
                    placeholder="針對這次占卜，還有什麼想追問星辰的嗎？" 
                    style="flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(212,175,55,0.3); color: #fff; padding: 10px; border-radius: 8px; font-family: inherit; resize: none;"></textarea>
                <button id="history-followup-send-btn" class="premium-btn followup-send-btn" type="button" 
                    style="padding: 0 20px; font-size: 0.9em; white-space: nowrap;">送出</button>
            </div>
        </div>`;
    return html;
}

/**
 * 綁定歷史紀錄延伸提問區的事件
 * @param {Object} record - 歷史紀錄物件
 */
function _bindHistoryFollowupEvents(record) {
    _currentHistoryRecord = record;
    const sendBtn = document.getElementById('history-followup-send-btn');
    const input = document.getElementById('history-followup-input');

    if (sendBtn) {
        sendBtn.onclick = () => sendHistoryFollowupQuestion(record);
    }

    if (input) {
        input.onkeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendHistoryFollowupQuestion(record);
            }
        };
    }
}

/**
 * 歷史紀錄延伸提問：送出並取得 AI 回覆
 * @param {Object} record - 原始歷史紀錄
 */
async function sendHistoryFollowupQuestion(record) {
    const input = document.getElementById('history-followup-input');
    const historyContainer = document.getElementById('history-followup-container');
    const sendBtn = document.getElementById('history-followup-send-btn');

    if (!input || !historyContainer || !record) return;

    const questionText = input.value.trim();
    if (!questionText) return;

    const apiKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
    if (!apiKey) {
        _appendHistoryFollowupBubble(historyContainer, 'ai',
            '<em style="color: #ff6b6b;">您尚未設定 API Key，請先點擊主畫面右上角 ⚙️ 設定。</em>');
        return;
    }

    // 禁用輸入與按鈕
    input.value = '';
    input.disabled = true;
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.textContent = '...';
    }

    // 追加使用者提問氣泡
    _appendHistoryFollowupBubble(historyContainer, 'user', escapeHtml(questionText));

    // 追加 AI loading 氣泡
    const loadingBubble = _appendHistoryFollowupBubble(historyContainer, 'ai-loading', '');

    // 自動捲到底部
    _scrollHistoryFollowupToBottom(historyContainer);

    // 重建對話歷史
    const conversationHistory = [
        { role: 'user', parts: [{ text: `使用者針對以下提問進行占卜：\n「${record.question || '一般指引'}」\n\n獲得的綜合神諭如下：\n${record.aiText}\n\n請根據以上脈絡回答使用者的後續追問。` }] },
        { role: 'model', parts: [{ text: '理解了。我已掌握先前的牌陣訊息與神諭內容，請說出您的追問。' }] }
    ];

    // 加入現有的追問紀錄
    if (Array.isArray(record.followupChats)) {
        record.followupChats.forEach(chat => {
            conversationHistory.push({ role: 'user', parts: [{ text: chat.question }] });
            conversationHistory.push({ role: 'model', parts: [{ text: chat.reply }] });
        });
    }

    // 加入本次提問
    conversationHistory.push({ role: 'user', parts: [{ text: questionText }] });

    try {
        const modelId = localStorage.getItem(STORAGE_KEYS.MODEL) || 'gemma-4-31b-it';
        const modelInfo = (typeof AI_MODELS !== 'undefined' ? AI_MODELS[modelId] : null) || { id: modelId };

        const followupSystemPrompt = `你是一位充滿智慧、語氣溫柔且帶有神祕感的高階塔羅占卜師。
使用者現在針對這筆歷史占卜紀錄進行延伸追問。請根據先前的牌陣分析結果與對話脈絡回答。
- 保持同樣的占卜師角色與語氣
- 回答精簡有力，約 150~350 字
- 使用繁體中文（台灣用語）
- 不要重複已經說過的內容`;

        const response = await fetchWithRetry(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelInfo.id}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: followupSystemPrompt }] },
                    contents: conversationHistory
                })
            }
        );

        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        const replyParts = parts.filter(p => !p.thought);
        const reply = replyParts.map(p => p.text).join('') || '星辰暫時無法給出回應...';

        // 替換 loading 氣泡為打字機效果回覆
        if (loadingBubble) {
            const formattedReply = escapeHtml(reply).replace(/\n/g, '<br>');
            loadingBubble.innerHTML = '<div class="followup-bubble-label">✦ 星辰回應</div>';
            loadingBubble.classList.remove('followup-bubble-loading');

            const textContainer = document.createElement('span');
            loadingBubble.appendChild(textContainer);

            typewriteText(textContainer, formattedReply, {
                onChar: (i) => {
                    if (i % 20 === 0) _scrollHistoryFollowupToBottom(historyContainer);
                },
                onComplete: () => {
                    input.disabled = false;
                    if (sendBtn) {
                        sendBtn.disabled = false;
                        sendBtn.textContent = '送出';
                    }
                    _scrollHistoryFollowupToBottom(historyContainer);
                }
            });
        }

        // 將延伸對話更新至 IndexedDB
        const newChat = {
            question: questionText,
            reply: reply,
            timestamp: Date.now()
        };
        await updateHistoryFollowup(record.id, newChat);

        // 同步更新記憶體中的 record，確保在不重新進入詳情的情況下能正確匯出
        if (!record.followupChats) record.followupChats = [];
        record.followupChats.push(newChat);

    } catch (err) {
        console.error('[聖境塔羅] 歷史延伸提問失敗:', err);
        if (loadingBubble) {
            const safeErr = escapeHtml(err.message || '未知錯誤');
            loadingBubble.innerHTML = `<div class="followup-bubble-label">✦ 星辰回應</div>
                <span style="color: #ff6b6b;">星辰暫時失聯了 (${safeErr})。請稍後再試。</span>
                <div style="text-align: center; margin-top: 12px;">
                    <button class="premium-btn followup-retry-btn" style="padding: 6px 14px; font-size: 0.78em;">✦ 重新送出</button>
                </div>`;
            loadingBubble.classList.remove('followup-bubble-loading');
            const retryBtn = loadingBubble.querySelector('.followup-retry-btn');
            if (retryBtn) {
                retryBtn.onclick = () => {
                    const userBubble = loadingBubble.previousElementSibling;
                    if (userBubble && userBubble.classList.contains('followup-bubble-user')) userBubble.remove();
                    loadingBubble.remove();
                    input.value = questionText;
                    input.disabled = false;
                    if (sendBtn) sendBtn.disabled = false;
                    sendHistoryFollowupQuestion(record);
                };
            }
        }
        input.disabled = false;
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.textContent = '送出';
        }
    }
}

/**
 * 歷史紀錄專用：追加對話氣泡
 */
function _appendHistoryFollowupBubble(container, type, content) {
    const bubble = document.createElement('div');
    if (type === 'user') {
        bubble.className = 'followup-bubble followup-bubble-user';
        bubble.innerHTML = `<div class="followup-bubble-label">您的追問</div>${content}`;
    } else if (type === 'ai-loading') {
        bubble.className = 'followup-bubble followup-bubble-ai followup-bubble-loading';
        bubble.innerHTML = `<div class="followup-bubble-label">✦ 星辰回應</div><div class="followup-loading"><div class="spinner"></div>星辰正在凝視過往牌面...</div>`;
    } else {
        bubble.className = 'followup-bubble followup-bubble-ai';
        bubble.innerHTML = `<div class="followup-bubble-label">✦ 星辰回應</div>${content}`;
    }
    container.appendChild(bubble);
    return bubble;
}

/**
 * 歷史紀錄專用：捲動到底部
 */
function _scrollHistoryFollowupToBottom(container) {
    requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
        // 歷史 Modal 比較大，確保整個內容區也盡量向下捲動
        const modalContent = document.querySelector('#history-modal .modal-content');
        if (modalContent) {
            modalContent.scrollTop = modalContent.scrollHeight;
        }
    });
}

/**
 * 渲染歷史紀錄中的延伸提問對話 HTML
 * @param {Array|undefined} followupChats - 延伸對話陣列
 * @returns {string} HTML 字串
 */
function _renderFollowupChatsHTML(followupChats) {
    if (!Array.isArray(followupChats) || followupChats.length === 0) return '';

    let html = `
        <div class="followup-section" style="margin-top: 1.5rem;">
            <div class="followup-divider">
                <span>✦ 延伸提問紀錄 ✦</span>
            </div>
            <div class="followup-history" style="max-height: none;">`;

    followupChats.forEach(chat => {
        const safeQ = escapeHtml(chat.question);
        const safeR = escapeHtml(chat.reply).replace(/\n/g, '<br>');
        html += `
                <div class="followup-bubble followup-bubble-user">
                    <div class="followup-bubble-label">您的追問</div>${safeQ}
                </div>
                <div class="followup-bubble followup-bubble-ai">
                    <div class="followup-bubble-label">✦ 星辰回應</div>${safeR}
                </div>`;
    });

    html += `
            </div>
        </div>`;
    return html;
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
                    AppState.selectedHistoryIds.add(id);
                    if (historyItem) historyItem.classList.add('selected');
                } else {
                    AppState.selectedHistoryIds.delete(id);
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
            if (AppState.selectedHistoryIds.size === 0) return;
            
            const confirmed = await showConfirmDialog('刪除日誌', `確定要刪除選取的 ${AppState.selectedHistoryIds.size} 筆占卜紀錄嗎？`);
            if (confirmed) {
                // 批次刪除
                await Promise.all(Array.from(AppState.selectedHistoryIds).map(id => deleteHistoryRecord(id)));
                AppState.selectedHistoryIds.clear();
                await renderHistoryList();
            }
        });
    }
    
    // 匯出按鈕：靜態元素，一次綁定即可（透過 _currentHistoryRecord 取得當前紀錄）
    const exportBtn = document.getElementById('history-export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (_currentHistoryRecord) exportHistoryImage(_currentHistoryRecord);
        });
    }

    // 初始化本地資料庫
    initDB();
});


