/* ============================
   AI 解牌流程
   ============================ */
const AI_MODELS = {
    'gemini-3-flash-preview': { name: 'Gemini 3 Flash', id: 'gemini-3-flash-preview' },
    'gemma-4-31b-it': { name: 'Gemma 4 31B', id: 'gemma-4-31b-it' }
};

/**
 * HTML 特殊字元跳脫（防止 XSS 注入）
 * @param {string} str - 原始字串
 * @returns {string} 跳脫後的安全字串
 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function showAnalysis() {
    const modal = document.getElementById('reading-modal');
    const container = document.getElementById('cards-analysis-container');
    const geminiLoading = document.getElementById('gemini-loading');
    const geminiText = document.getElementById('gemini-text');
    const questionText = getActiveQuestionText();

    if (!modal || !container) return;
    AppState.latestGuidanceText = '';
    AppState.saveImageBusy = false;
    setSaveImageStatus('');
    setSaveImageButtonState(true, '等待星辰指引...');

    showLoadingOverlay();

    container.innerHTML = '';
    let positions;
    const isCelticCross = AppState.spreadMode === 'celtic-cross';

    if (AppState.isDailyMode) {
        positions = ['今日運勢'];
    } else if (isCelticCross) {
        positions = CELTIC_CROSS_POSITIONS.map(p => `${p.id}. ${p.name}`);
    } else {
        positions = ['第1張', '第2張', '第3張'];
    }

    // 聖十字模式的分析容器加上專屬 class
    if (isCelticCross) {
        container.classList.add('celtic-cross-analysis');
    } else {
        container.classList.remove('celtic-cross-analysis');
    }
    let html = '';
    const cardNamesForPrompt = [];

    AppState.selectedCards.forEach((card, idx) => {
        const posture = card.isReversed ? '逆位' : '正位';
        const activeMeaning = card.isReversed ? card.meaning_rev : card.meaning_up;
        const imgUrl = `assets/images/${card.name_short}.jpg`;
        const imgReversedClass = card.isReversed ? ' reversed-img' : '';
        const cardDesc = card.desc ? `<div class="analysis-desc">${card.desc.substring(0, 150)}...</div>` : '';
        const meaningLabel = card.isReversed ? '▽ 逆位' : '▲ 正位';
        const meaningClass = card.isReversed ? 'analysis-meaning-rev' : 'analysis-meaning';

        const posLabel = positions[idx] || '';

        html += `
        <div class="analysis-card ${AppState.isDailyMode ? 'daily-layout-card' : ''}">
            <div class="analysis-position">${posLabel}</div>
            <div class="analysis-card-img">
                <img src="${imgUrl}" alt="${card.name}" class="${imgReversedClass}" onerror="this.parentElement.style.display='none'">
            </div>
            <div class="analysis-header">
                <div class="analysis-symbol">${card.symbol || '✦'}</div>
                <div class="analysis-name">${card.name} <span class="analysis-posture-tag">[${posture}]</span></div>
                <div class="analysis-en">${card.en}</div>
            </div>
            ${cardDesc}
            <div class="${meaningClass}"><strong>${meaningLabel}：</strong><br>${activeMeaning}</div>
        </div>`;

        cardNamesForPrompt.push(`${positions[idx]}是「${card.name}」的【${posture}】（代表意義：${activeMeaning}）`);
    });

    // 聖十字模式：在卡牌逐張解析之前插入牌陣佈局圖
    if (isCelticCross && typeof buildCelticCrossLayoutHTML === 'function') {
        html = buildCelticCrossLayoutHTML(AppState.selectedCards) + html;
    }

    container.innerHTML = html;

    const modelId = localStorage.getItem('gemini_model') || 'gemma-4-31b-it';
    const modelInfo = AI_MODELS[modelId] || AI_MODELS['gemma-4-31b-it'];
    const geminiHeader = document.querySelector('.gemini-header');
    if (geminiHeader) {
        geminiHeader.innerHTML = `<span class="gold-star">❉</span> 綜合神諭 <span style="font-size: 0.7em; opacity: 0.7;">powered by ${modelInfo.name}</span> <span class="gold-star">❉</span>`;
    }

    const closeBtn = document.getElementById('close-reading-modal');
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.classList.add('hidden');
        };
    }

    fetchGeminiAnalysis(cardNamesForPrompt, questionText).then((result) => {
        hideLoadingOverlay(() => {
            if (geminiLoading) geminiLoading.classList.add('hidden');
            if (geminiText) {
                geminiText.classList.remove('hidden');
                if (result.success) {
                    // 將 AI 回傳結果寫入全域變數，供圖片匯出使用
                    AppState.latestGuidanceText = result.text;
                    
                    // 將紀錄寫入 IndexedDB 占卜日誌
                    if (typeof saveHistoryRecord === 'function') {
                        saveHistoryRecord({
                            question: getActiveQuestionText(),
                            spreadMode: AppState.spreadMode || 'three-card',
                            cards: AppState.selectedCards.map(c => ({
                                id: c.id,
                                name: c.name,
                                name_short: c.name_short,
                                isReversed: c.isReversed,
                                symbol: c.symbol,
                                meaning: c.isReversed ? c.meaning_rev : c.meaning_up
                            })),
                            aiText: result.text
                        }).catch(e => console.error('[聖境塔羅] 存入歷史紀錄失敗', e));
                    }
                    // 跳脫 HTML 特殊字元後再插入 DOM，防止 XSS
                    const formattedReply = escapeHtml(result.text).replace(/\n/g, '<br>');
                    geminiText.innerHTML = '';
                    let i = 0;
                    if (!formattedReply.length) {
                        setSaveImageButtonState(false, '儲存提問＋星辰指引圖');
                    }
                    // 使用 insertAdjacentHTML 取代 innerHTML +=
                    // 避免每 15ms 觸發完整 DOM 重新解析
                    const typeWriter = setInterval(() => {
                        if (formattedReply.substring(i, i + 4) === '<br>') {
                            geminiText.insertAdjacentHTML('beforeend', '<br>');
                            i += 4;
                        } else {
                            geminiText.insertAdjacentHTML('beforeend', formattedReply.charAt(i));
                            i++;
                        }
                        if (i >= formattedReply.length) {
                            clearInterval(typeWriter);
                            setSaveImageButtonState(false, '儲存提問＋星辰指引圖');
                        }
                    }, 15);
                } else {
                    geminiText.innerHTML = result.text;
                    setSaveImageButtonState(false, '儲存提問＋星辰指引圖');
                }
            }
            modal.classList.remove('hidden');
        });
    }).catch(() => {
        hideLoadingOverlay(() => {
            if (geminiLoading) geminiLoading.classList.add('hidden');
            if (geminiText) {
                geminiText.classList.remove('hidden');
                geminiText.innerHTML = '<em>星辰短暫失聯，請稍後再試一次。</em>';
            }
            setSaveImageButtonState(false, '儲存提問＋星辰指引圖');
            modal.classList.remove('hidden');
        });
    });
}

async function fetchGeminiAnalysis(cardsLog, userQuestionText) {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
        return {
            success: false,
            text: '<em>您尚未設定 API Key，請點擊右上角 ⚙️ 設定金鑰以啟用星辰綜合解析。目前僅能提供單張牌意參考。</em>'
        };
    }

    const modelId = localStorage.getItem('gemini_model') || 'gemma-4-31b-it';
    const modelInfo = AI_MODELS[modelId] || AI_MODELS['gemma-4-31b-it'];
    console.log(`[聖境塔羅] 使用模型: ${modelInfo.name} (${modelInfo.id})`);
    const normalizedQuestion = (userQuestionText || '').trim() || '未提供明確提問';

    let systemPrompt = '';
    let userPrompt = '';

    if (AppState.isDailyMode) {
        systemPrompt = `你是一位充滿智慧、語氣溫柔且帶有神祕感的高階塔羅占卜師。
這是使用者的「每日一抽」指引。請根據使用者抽出的單一張牌，給予今天專屬的深入分析與重點建議。

【嚴格規則】
- 不要打招呼、不要自我介紹
- 請直接輸出內容，使用繁體中文（台灣用語）
- 依序輸出三個區塊：【✦ 今日主題 ✦】、【✧ 重點建議 ✧】、【❉ 綜合指引 ❉】
- 語氣保持溫暖、神祕、具啟發性，總字數約 300字左右`;

        userPrompt = `使用者針對今日運勢抽出了這張專屬塔羅牌：
【${cardsLog[0]}】

請給予今日的星辰指引。`;
    } else {
        systemPrompt = `你是一位充滿智慧、語氣溫柔且帶有神祕感的高階塔羅占卜師。
你的任務是先根據使用者提問，定義本次占卜中 三張牌 的角色，再綜合三張塔羅牌給出整體運勢解析與未來指引。

客觀的對應邏輯如下：
時間發展型問題（如：這件事接下來的走向？）：AI 會預設為 「過去 / 現在 / 未來」。
決策行動型問題（如：遇到這個瓶頸我該怎麼做？）：AI 會預設為 「現況 / 建議 / 結果」 或 「內部因素 / 外部阻礙 / 解決方案」。
人際關係型問題（如：我跟他的合作關係？）：AI 會預設為 「自己 / 對方 / 雙方互動」。

【嚴格規則】
- 先輸出「牌陣的定義」，再輸出「綜合運勢解析」
- 牌陣的定義必須緊扣使用者提問，不能套用固定的過去/現在/未來
- 不要逐張牌分開解讀，請強調所有已選牌彼此的關聯與整體訊息
- 直接輸出內容，不要打招呼、不要自我介紹
- 使用白話文，約 320~520 字
- 語氣保持溫柔、神祕、有智慧感`;

        userPrompt = `使用者提問：
${normalizedQuestion}

使用者抽出了以下三張牌（順序為第1張到第3張）：
1. ${cardsLog[0]}
2. ${cardsLog[1]}
3. ${cardsLog[2]}

請依照以下格式輸出：
【牌陣的定義】
第1張：...
第2張：...
第3張：...

【綜合運勢解析】
...`;
    }

    // 聖十字牌陣模式
    if (AppState.spreadMode === 'celtic-cross' && !AppState.isDailyMode) {
        const posDefs = CELTIC_CROSS_POSITIONS.map(p => `${p.id}. ${p.name}（${p.en}）— ${p.desc}`).join('\n');
        systemPrompt = `你是一位充滿智慧、語氣溫柔且帶有神祕感的高階塔羅占卜師。
這是使用者的「聖十字牌陣」（Celtic Cross）深度占卜。共有 10 張牌，各有特定位置意義。

【十牌位定義】
${posDefs}

【嚴格規則】
- 不要打招呼、不要自我介紹
- 直接輸出內容，使用繁體中文（台灣用語）
- 依序輸出四個區塊：【✦ 核心牌陣解析 ✦】、【✧ 理想與基礎的對話 ✧】、【⚡ 外在影響與內在態度 ⚡】、【❉ 最終指引 ❉】
- 強調牌與牌之間的關聯，不要逐張分開解讀
- 語氣保持溫柔、神祕、有智慧感
- 總字數約 700~900 字`;

        userPrompt = `使用者提問：
${normalizedQuestion}

聖十字牌陣（10 張）：
${cardsLog.join('\n')}

請依照以下格式輸出：
【✦ 核心牌陣解析 ✦】
分析十字區的核心訊息（牌 1、2、5、6 的相互關係，探討過去、現在、未來的發展）...

【✧ 理想與基礎的對話 ✧】
比較牌 3（${CELTIC_CROSS_POSITIONS[2].name}）與牌 4（${CELTIC_CROSS_POSITIONS[3].name}）的潛在能量，探討目標與現實基礎的關係...

【⚡ 外在影響與內在態度 ⚡】
分析權杖區（牌 7~9）如何影響最終結果...

【❉ 最終指引 ❉】
結合牌 10（${CELTIC_CROSS_POSITIONS[9].name}）給出整體指引...`;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelInfo.id}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents: [{ role: 'user', parts: [{ text: userPrompt }] }]
            })
        });

        if (!response.ok) {
            throw new Error(`API 錯誤狀態碼: ${response.status}`);
        }

        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        const replyParts = parts.filter(p => !p.thought);
        const reply = replyParts.map(p => p.text).join('') || '';

        return { success: true, text: reply };
    } catch (err) {
        console.error('[聖境塔羅] AI API 呼叫失敗:', err);
        // 跳脫錯誤訊息中的特殊字元，防止 XSS
        const safeErrMsg = escapeHtml(err.message || '未知錯誤');
        return {
            success: false,
            text: `<span style="color: #ff6b6b;">無法取得神諭指引。請確認您的 API Key 是否正確或網路是否通暢。(錯誤: ${safeErrMsg})</span>`
        };
    }
}
