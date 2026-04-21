/**
 * 聖境塔羅 (Celestial Tarot)
 * 核心應用程式邏輯與手勢辨識整合 (3D 環形架構)
 */

/* ============================
   塔羅牌資料（本地 fallback + API 整合）
   ============================ */

// 符號對照表（用於卡牌正面圖騰展示）
const CARD_SYMBOLS = {
    'The Fool': '☀', 'The Magician': '∞', 'The High Priestess': '☽',
    'The Empress': '♛', 'The Emperor': '♔', 'The Hierophant': '✞',
    'The Lovers': '♡', 'The Chariot': '⚔', 'Strength': '♌', 'Fortitude': '♌',
    'The Hermit': '☆', 'Wheel Of Fortune': '☸', 'Justice': '⚖',
    'The Hanged Man': '♆', 'Death': '♰', 'Temperance': '☯',
    'The Devil': '⛧', 'The Tower': '⚡', 'The Star': '★',
    'The Moon': '☾', 'The Sun': '☀', 'The Last Judgment': '♮', 'Judgement': '♮',
    'The World': '◎'
};

// 羅馬數字對照表
const ROMAN_NUMERALS = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];

// 預設/fallback 的本地卡牌資料（22 張大阿爾克那）
let TAROT_CARDS = [
    { id: 0, name: '愚者', en: 'The Fool', name_short: 'ar00', numeral: '0', symbol: '☀', meaning_up: '新的開始、無限的可能性，代表天真、冒險和對未知的信任。', meaning_rev: '魯莽、漫無目的、缺乏方向。', desc: '一位年輕旅人站在懸崖邊，腳下是未知的深淵。' },
    { id: 1, name: '魔術師', en: 'The Magician', name_short: 'ar01', numeral: 'I', symbol: '∞', meaning_up: '創造力、意志力與行動，你擁有實現目標所需的一切資源。', meaning_rev: '操縱、欺騙、缺乏方向。', desc: '一位年輕人手持法杖，桌上擁有四元素的象徵。' },
    { id: 2, name: '女祭司', en: 'The High Priestess', name_short: 'ar02', numeral: 'II', symbol: '☽', meaning_up: '直覺、潛意識與奧秘，傾聽內在的聲音。', meaning_rev: '忽視直覺、表面知識。', desc: '她坐在兩根柱子之間，手中持有至聖律法的卷軸。' },
    { id: 3, name: '皇后', en: 'The Empress', name_short: 'ar03', numeral: 'III', symbol: '♛', meaning_up: '豐富、孕育與感受力，生命中的豐收與滋養。', meaning_rev: '依賴、虛榮、不安全感。', desc: '一位端莊的女性坐在豐收的花園中。' },
    { id: 4, name: '皇帝', en: 'The Emperor', name_short: 'ar04', numeral: 'IV', symbol: '♔', meaning_up: '權威、穩定與領導力，建立秩序與結構。', meaning_rev: '暴政、僵化、缺乏彈性。', desc: '一位國王端坐王座，手持權杖與地球。' },
    { id: 5, name: '教皇', en: 'The Hierophant', name_short: 'ar05', numeral: 'V', symbol: '✞', meaning_up: '傳統、智慧與精神指引，尋找心靈導師。', meaning_rev: '叛逆、非正統、挑戰傳統。', desc: '他戴著三重冠冕，坐在兩根柱子之間。' },
    { id: 6, name: '戀人', en: 'The Lovers', name_short: 'ar06', numeral: 'VI', symbol: '♡', meaning_up: '選擇、關係與和諧，重要的抉擇即將來臨。', meaning_rev: '失衡、不和諧、價值觀衝突。', desc: '一男一女在天使的祝福下站立。' },
    { id: 7, name: '戰車', en: 'The Chariot', name_short: 'ar07', numeral: 'VII', symbol: '⚔', meaning_up: '勝利、掌控與決心，堅持信念勇往直前。', meaning_rev: '失控、攻擊性、缺乏方向。', desc: '一位王子駕著由兩隻獅身人面獸拉動的戰車。' },
    { id: 8, name: '力量', en: 'Strength', name_short: 'ar08', numeral: 'VIII', symbol: '♌', meaning_up: '勇氣、耐心與內在力量，以柔克剛。', meaning_rev: '軟弱、自我懷疑、缺乏勇氣。', desc: '一位女性溫柔地馴服一頭獅子。' },
    { id: 9, name: '隱者', en: 'The Hermit', name_short: 'ar09', numeral: 'IX', symbol: '☆', meaning_up: '內省、指引與尋求真理，獨處中找到智慧。', meaning_rev: '孤立、偏執、退縮。', desc: '一位老者手持燈籠站在山頂。' },
    { id: 10, name: '命運之輪', en: 'Wheel of Fortune', name_short: 'ar10', numeral: 'X', symbol: '☸', meaning_up: '變遷、機會與命運，一切都在流轉中。', meaning_rev: '厄運、抗拒改變、失控。', desc: '一個巨大的命運之輪，旋轉不止。' },
    { id: 11, name: '正義', en: 'Justice', name_short: 'ar11', numeral: 'XI', symbol: '⚖', meaning_up: '平衡、客觀與因果，公正的裁決。', meaning_rev: '不公正、推卸責任、偏見。', desc: '一位女性手持天秤與寶劍，端坐審判。' },
    { id: 12, name: '倒吊人', en: 'The Hanged Man', name_short: 'ar12', numeral: 'XII', symbol: '♆', meaning_up: '犧牲、視角轉換與暫停，換個角度看世界。', meaning_rev: '拖延、抗拒犧牲、無意義的等待。', desc: '一個人被倒掛在T字架上，面容平靜。' },
    { id: 13, name: '死神', en: 'Death', name_short: 'ar13', numeral: 'XIII', symbol: '♰', meaning_up: '結束、轉變與重生，告別舊事物迎接新生。', meaning_rev: '抗拒改變、停滯、恐懼。', desc: '一位騎馬的死神，在他面前人人平等。' },
    { id: 14, name: '節制', en: 'Temperance', name_short: 'ar14', numeral: 'XIV', symbol: '☯', meaning_up: '平衡、耐心與調和，中庸之道。', meaning_rev: '過度、不平衡、缺乏耐心。', desc: '一位天使將水從一隻聖杯倒入另一隻。' },
    { id: 15, name: '惡魔', en: 'The Devil', name_short: 'ar15', numeral: 'XV', symbol: '⛧', meaning_up: '束縛、誘惑與物質慾望，看清鎖鏈的本質。', meaning_rev: '釋放、突破限制、面對陰影。', desc: '一隻惡魔坐在祭壇上，兩個人被鎖鏈束縛。' },
    { id: 16, name: '高塔', en: 'The Tower', name_short: 'ar16', numeral: 'XVI', symbol: '⚡', meaning_up: '劇變、破壞與啟示，崩塌之後是重建。', meaning_rev: '恐懼改變、延遲的災難。', desc: '一座高塔被閃電擊中，人們從塔上墜落。' },
    { id: 17, name: '星星', en: 'The Star', name_short: 'ar17', numeral: 'XVII', symbol: '★', meaning_up: '希望、靈感與平靜，黑暗中的光。', meaning_rev: '絕望、缺乏信心、斷裂的希望。', desc: '一位裸女在星光下將水倒入溪流。' },
    { id: 18, name: '月亮', en: 'The Moon', name_short: 'ar18', numeral: 'XVIII', symbol: '☾', meaning_up: '幻象、不安與潛意識，穿越迷霧找到真相。', meaning_rev: '困惑消散、恢復清明。', desc: '月亮照耀著一條蜿蜒的小路，兩隻狗對月嚎叫。' },
    { id: 19, name: '太陽', en: 'The Sun', name_short: 'ar19', numeral: 'XIX', symbol: '☀', meaning_up: '成功、活力與喜悅，光明與溫暖。', meaning_rev: '暫時的陰霾、過度樂觀。', desc: '一個孩子騎在白馬上，在陽光下歡笑。' },
    { id: 20, name: '審判', en: 'Judgement', name_short: 'ar20', numeral: 'XX', symbol: '♮', meaning_up: '覺醒、反省與重生，回應內在的召喚。', meaning_rev: '逃避反省、自我否定。', desc: '天使吹響號角，亡者從墓地中復活。' },
    { id: 21, name: '世界', en: 'The World', name_short: 'ar21', numeral: 'XXI', symbol: '◎', meaning_up: '完成、圓滿與整合，旅程的圓滿完成。', meaning_rev: '未完成、缺少收尾、延遲。', desc: '一位女性在月桂花環中舞蹈，四角有四活物。' }
];

/**
 * 從 tarotapi.dev 取得完整 78 張牌資料
 * 成功後將覆蓋本地 TAROT_CARDS 陣列
 */
async function fetchCardsFromAPI() {
    try {
        console.log('[聖境塔羅] 正在從 tarotapi.dev 載入牌庫...');
        const response = await fetch('https://tarotapi.dev/api/v1/cards');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (!data.cards || !Array.isArray(data.cards)) throw new Error('Invalid data format');

        // 將 API 資料轉換為專案格式並套用繁體中文翻譯
        TAROT_CARDS = data.cards.map((card, index) => {
            const valueInt = card.value_int || index;
            // 取得本地的翻譯資料，若無則 fallback 原始英文
            const zh = window.TAROT_ZH && window.TAROT_ZH[card.name_short] ? window.TAROT_ZH[card.name_short] : {};

            return {
                id: index,
                name: zh.name || card.name,
                en: card.name,
                name_short: card.name_short,
                type: card.type,   // 'major' | 'minor'
                suit: card.suit || null,
                numeral: card.type === 'major' ? (ROMAN_NUMERALS[valueInt] || String(valueInt)) : (card.value || ''),
                symbol: CARD_SYMBOLS[card.name] || '✦',
                meaning_up: zh.meaning_up || card.meaning_up || '',
                meaning_rev: zh.meaning_rev || card.meaning_rev || '',
                desc: zh.desc || card.desc || ''
            };
        });

        AppState.apiCardsLoaded = true;
        console.log(`[聖境塔羅] ✅ 成功載入 ${TAROT_CARDS.length} 張牌（含完整 78 張）`);
    } catch (err) {
        console.warn('[聖境塔羅] ⚠️ API 載入失敗，使用本地 22 張大阿爾克那:', err.message);
        AppState.apiCardsLoaded = false;
    }
}

/* ============================
   全域狀態變數已集中至 state.js
   ============================ */

/* ============================
   DOMContentLoaded 入口
   ============================ */
document.addEventListener('DOMContentLoaded', () => {
    console.log('[聖境塔羅] 頁面載入完成');
    detectInAppBrowser(); // 偵測 LINE 等 in-app 瀏覽器
    initStars();
    initApp();
    requestWakeLock(); // 啟動螢幕恆亮
});

/* ============================
   偵測 LINE / Facebook 等 In-App 瀏覽器
   手勢辨識需要完整的攝影機 API，LINE 內建瀏覽器不支援
   ============================ */
function detectInAppBrowser() {
    const ua = navigator.userAgent || '';
    // LINE 內建瀏覽器的 UA 包含 "Line/"
    // Facebook 內建瀏覽器包含 "FBAN" 或 "FBAV"
    const isLine = /Line\//i.test(ua);
    const isFB = /FBAN|FBAV/i.test(ua);

    if (isLine || isFB) {
        const appName = isLine ? 'LINE' : 'Facebook';
        const banner = document.createElement('div');
        banner.id = 'inapp-browser-warning';
        banner.innerHTML = `
            <div style="
                position: fixed; top: 0; left: 0; width: 100%; z-index: 9999;
                background: linear-gradient(135deg, #1a0a00, #2a1500);
                border-bottom: 2px solid var(--gold);
                padding: 1rem 1.2rem;
                text-align: center;
                box-shadow: 0 4px 20px rgba(0,0,0,0.6);
                animation: slideDown 0.5s ease;
            ">
                <p style="color: var(--gold-light); font-size: 0.85rem; margin-bottom: 0.5rem; line-height: 1.5;">
                    ⚠️ 偵測到您正在使用 <strong>${appName}</strong> 內建瀏覽器
                </p>
                <p style="color: var(--text-white); font-size: 0.8rem; margin-bottom: 0.8rem; line-height: 1.5;">
                    手勢抽牌功能需要攝影機權限，<strong>${appName}</strong> 瀏覽器可能無法正常使用。<br>
                    請點擊下方按鈕用 <strong>Chrome</strong> 開啟以獲得最佳體驗 ✨
                </p>
                <a href="${window.location.href}" target="_blank" rel="noopener"
                   style="display: inline-block; background: var(--gold); color: #111; padding: 0.5rem 1.5rem; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 0.85rem;">
                    用外部瀏覽器開啟
                </a>
                <button onclick="this.closest('#inapp-browser-warning').remove()"
                    style="display: block; margin: 0.6rem auto 0; background: transparent; border: none; color: var(--text-muted); font-size: 0.7rem; cursor: pointer;">
                    略過此提示
                </button>
            </div>
        `;
        document.body.prepend(banner);
        console.warn(`[聖境塔羅] ⚠️ 偵測到 ${appName} 內建瀏覽器，已顯示提示`);
    }
}

/* ============================
   背景星光效果
   ============================ */
function initStars() {
    const container = document.getElementById('stars-container');
    if (!container) return;

    // 手機端減少星星數量，桌面端維持 150
    const isMobile = window.innerWidth <= 768;
    const starCount = isMobile ? 50 : 150;

    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        const size = Math.random() * 2 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.setProperty('--duration', `${Math.random() * 3 + 2}s`);
        star.style.animationDelay = `${Math.random() * 5}s`;
        container.appendChild(star);
    }
}


/* ============================
   應用程式初始化
   ============================ */
function initApp() {
    const startBtn = document.getElementById('start-gesture-btn');
    const restartBtn = document.getElementById('restart-btn');
    const controlPanel = document.getElementById('control-panel');
    const questionPanel = document.getElementById('question-panel');
    const questionInput = document.getElementById('user-question-input');
    const questionToggleBtn = document.getElementById('question-toggle-btn');
    const questionClearBtn = document.getElementById('question-clear-btn');

    // 初始進入時將按鈕置中
    if (controlPanel) {
        controlPanel.classList.add('centered-mode');
    }
    if (questionPanel) {
        questionPanel.classList.add('centered-mode');
    }

    // 綁定設定按鈕 (API Key + 模型選擇)
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsModal = document.getElementById('close-settings-modal');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const apiKeyInput = document.getElementById('gemini-api-key');
    const modelSelect = document.getElementById('model-select');

    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', () => {
            // 回填已存的設定
            const savedKey = localStorage.getItem('gemini_api_key');
            if (savedKey) apiKeyInput.value = savedKey;
            const savedModel = localStorage.getItem('gemini_model') || 'gemma-4-31b-it';
            if (modelSelect) modelSelect.value = savedModel;
            settingsModal.classList.remove('hidden');
        });
        closeSettingsModal.addEventListener('click', () => settingsModal.classList.add('hidden'));
        saveSettingsBtn.addEventListener('click', () => {
            const key = apiKeyInput.value.trim();
            if (key) {
                localStorage.setItem('gemini_api_key', key);
            } else {
                localStorage.removeItem('gemini_api_key');
            }
            // 儲存模型選擇
            if (modelSelect) {
                localStorage.setItem('gemini_model', modelSelect.value);
            }
            settingsModal.classList.add('hidden');
        });
    }

    if (questionInput) {
        questionInput.addEventListener('input', () => {
            if (questionPanel && questionPanel.classList.contains('compact')) {
                syncQuestionPreview();
            }
        });
    }

    if (questionClearBtn) {
        questionClearBtn.addEventListener('click', () => {
            if (questionInput) {
                questionInput.value = '';
                AppState.userQuestion = '';
                if (questionPanel && questionPanel.classList.contains('compact')) {
                    syncQuestionPreview();
                }
                questionInput.focus();
            }
        });
    }

    if (questionToggleBtn) {
        questionToggleBtn.addEventListener('click', () => {
            const shouldCompact = !questionPanel || !questionPanel.classList.contains('compact');
            setQuestionPanelCompact(shouldCompact);
        });
    }

    if (!startBtn) return;

    // 開始按鈕
    startBtn.addEventListener('click', async () => {
        const activeQuestion = getActiveQuestionText();
        if (!activeQuestion) {
            const instruction = document.getElementById('gesture-instruction');
            if (instruction) instruction.classList.remove('hidden');
            updateInstruction('請先輸入想提問的問題，再開始選牌。');
            if (questionInput) questionInput.focus();
            return;
        }
        AppState.userQuestion = activeQuestion;

        console.log('[聖境塔羅] 使用者點擊「開啟手勢抽牌」');
        startBtn.classList.add('hidden');
        if (controlPanel) {
            controlPanel.classList.remove('centered-mode');
        }
        if (questionPanel) {
            questionPanel.classList.remove('centered-mode');
        }
        setQuestionPanelCompact(true);

        // 顯示 loader，呈現載入狀態
        const loader = document.getElementById('loader');
        document.getElementById('carousel-scene').classList.remove('hidden');
        updateInstruction('🔮 正在連接星域牌庫...');

        // 嘗試從 API 載入牌庫
        await fetchCardsFromAPI();

        // 隱藏 loader
        if (loader) loader.classList.add('hidden');

        document.getElementById('gesture-instruction').classList.remove('hidden');
        document.getElementById('selected-cards-container').classList.remove('hidden');

        // 生成 3D 卡牌環
        generateCardRing();

        // 🔥 立即開始旋轉卡牌，讓使用者馬上看到效果
        AppState.gameState = 'rotating';
        animateCardRing();
        updateInstruction('🔄 卡牌旋轉中，正在啟動鏡頭...');

        // 非同步啟動/重啟 MediaPipe（不阻塞旋轉）
        initMediaPipe();
    });

    // 重新抽牌按鈕
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            resetGame();
        });
    }

    // Modal 內的重新洗牌按鈕
    const modalRestartBtn = document.getElementById('modal-restart-btn');
    if (modalRestartBtn) {
        modalRestartBtn.addEventListener('click', () => {
            document.getElementById('reading-modal').classList.add('hidden');
            resetGame();
        });
    }

    const saveReadingImageBtn = document.getElementById('save-reading-image-btn');
    if (saveReadingImageBtn) {
        saveReadingImageBtn.addEventListener('click', saveReadingAsImage);
        saveReadingImageBtn.disabled = true;
    }

    const saveImageStatus = document.getElementById('save-image-status');
    if (saveImageStatus) {
        saveImageStatus.classList.add('hidden');
        saveImageStatus.textContent = '';
    }
}

/* ============================
   抽牌環渲染與動畫已拆分至 ring.js
   ============================ */

/* ============================
   手勢辨識邏輯已拆分至 gesture.js
   ============================ */

/* ============================
   確認選定與翻蓋動畫 + 飛入 Slot
   使用 clone 元素掛到 body，避免 carousel 的 3D perspective 干擾
   飛入結束後將 clone 嵌入 slot，保持卡牌正面原樣
   ============================ */
function confirmSelection() {
    if (AppState.selectedCards.length >= 3) return;

    const activeQuestion = getActiveQuestionText();
    if (!activeQuestion) {
        setQuestionPanelCompact(false);
        const instruction = document.getElementById('gesture-instruction');
        if (instruction) instruction.classList.remove('hidden');
        updateInstruction('請先輸入想提問的問題，再進行選牌。');
        const questionInput = document.getElementById('user-question-input');
        if (questionInput) questionInput.focus();
        return;
    }
    AppState.userQuestion = activeQuestion;

    const activeEl = AppState.cardElements[AppState.activeCardIndex];
    if (!activeEl || activeEl.classList.contains('flipped')) return;

    // ★ 核心改動：不從環上取牌，改為從全部 78 張牌庫中真隨機抽取
    // 環上展示的牌只是視覺效果，確保每張最終選定的牌都是從完整牌庫中均等抽取
    const card = drawTrueRandomCard();
    if (!card) return;

    // 在翻牌前，將卡牌正面更新為真正抽到的牌
    updateCardFrontDOM(activeEl, card);

    // 第一階段：翻牌動畫
    activeEl.classList.add('flipped');

    // 記住要補牌的位置索引
    const refillIndex = AppState.activeCardIndex;

    // 等待翻牌動畫完成後執行飛入動畫
    setTimeout(() => {
        AppState.selectedCards.push(card);
        const slotIndex = AppState.selectedCards.length;
        const slot = document.getElementById(`slot-${slotIndex}`);
        if (!slot) return;

        // 取得卡牌目前的視覺座標（包含 3D perspective 投影後的位置）
        const cardRect = activeEl.getBoundingClientRect();
        const slotRect = slot.getBoundingClientRect();

        // ⚠️ 重要：先 clone 再隱藏原卡，避免 clone 繼承 visibility: hidden
        const flyClone = activeEl.cloneNode(true);

        // 隱藏原始卡牌
        activeEl.style.visibility = 'hidden';

        // 設定 clone 為飛行狀態，掛到 body 脫離 carousel 的 3D 上下文
        flyClone.classList.remove('focus', 'active');
        flyClone.classList.add('flying');
        // 以起始座標固定 left/top/width/height，後續只用 transform 移動（走 GPU 合成層）
        flyClone.style.cssText = `
            position: fixed;
            left: ${cardRect.left}px;
            top: ${cardRect.top}px;
            width: ${cardRect.width}px;
            height: ${cardRect.height}px;
            margin: 0;
            transform: translate(0, 0) scale(1);
            opacity: 1;
            z-index: 9999;
            transform-style: preserve-3d;
        `;
        document.body.appendChild(flyClone);

        // 強制 reflow 註冊起始位置
        void flyClone.offsetHeight;

        // 計算位移量與縮放比（使用 transform 而非修改 left/top，避免 layout reflow）
        const dx = slotRect.left - cardRect.left + (slotRect.width - cardRect.width) / 2;
        const dy = slotRect.top - cardRect.top + (slotRect.height - cardRect.height) / 2;
        const scaleX = slotRect.width / cardRect.width;
        const scaleY = slotRect.height / cardRect.height;
        const scaleFactor = Math.min(scaleX, scaleY);

        // 第二階段：飛入 slot（CSS transition 驅動 transform 動畫）
        flyClone.style.transform = `translate(${dx}px, ${dy}px) scale(${scaleFactor})`;

        // 追蹤是否已執行結束處理
        let flyEndHandled = false;

        // 動畫結束後處理
        const onFlyEnd = () => {
            if (flyEndHandled) return;
            flyEndHandled = true;
            flyClone.removeEventListener('transitionend', onFlyEnd);

            // 將 clone 從 body 移入 slot，保持卡牌正面原樣顯示
            if (flyClone.parentNode) {
                flyClone.parentNode.removeChild(flyClone);
            }

            // 重新設定 clone 的樣式，讓它填滿 slot
            flyClone.classList.remove('flying', 'flipped');
            flyClone.className = 'tarot-card in-slot';
            flyClone.style.cssText = '';  // 清除所有 inline styles

            // 將 card-inner 直接顯示正面（不用 3D 翻轉）
            const cardInner = flyClone.querySelector('.card-inner');
            if (cardInner) {
                cardInner.style.transform = 'none';
            }
            // 隱藏卡背、顯示卡正面
            const cardBack = flyClone.querySelector('.card-back');
            if (cardBack) cardBack.style.display = 'none';
            const cardFront = flyClone.querySelector('.card-front');
            if (cardFront) {
                cardFront.style.transform = 'none';
                cardFront.style.backfaceVisibility = 'visible';
            }

            // 清空 slot 並嵌入 clone
            slot.innerHTML = '';
            slot.appendChild(flyClone);
            slot.classList.add('filled');

            // 補牌：在原位置放上新的卡片
            refillCardSlot(refillIndex);

            if (AppState.selectedCards.length === 3) {
                AppState.gameState = 'finished';
                // 選完三張牌後關閉攝影機偵測，節省資源
                if (AppState.mpCamera) {
                    console.log('[聖境塔羅] 牌陣已滿，正在關閉攝影機...');
                    AppState.mpCamera.stop();
                    AppState.mpCamera = null; // 清除實體以確保下一次可以重新獲取權限並啟動
                    AppState.mediaPipeInitialized = false; // 重置初始化旗標，避免下次走到錯誤的早期返回
                }
                const restartBtn = document.getElementById('restart-btn');
                if (restartBtn) restartBtn.classList.remove('hidden');
                updateInstruction('✨ 星辰已定，正在解讀命運的軌跡...');
                setTimeout(showAnalysis, 1500);
            } else {
                AppState.gameState = 'idle';
                updateInstruction(`已選擇 ${slotIndex} 張牌。請【張開手掌 🖐】繼續`);
            }
        };
        flyClone.addEventListener('transitionend', onFlyEnd, { once: true });

        // 安全網：若 transitionend 未觸發，2s 後強制執行
        setTimeout(() => {
            if (!flyEndHandled) {
                onFlyEnd();
            }
        }, 2000);

    }, 1000); // 等待 1 秒翻牌動畫
}

/* ============================
   重新抽牌 — 重置所有狀態
   ============================ */
function resetGame() {
    console.log('[聖境塔羅] 🔄 重新抽牌');

    // 取消動畫循環
    if (AppState.animationFrameId) {
        cancelAnimationFrame(AppState.animationFrameId);
        AppState.animationFrameId = null;
    }

    // 重置狀態
    AppState.gameState = 'idle';
    AppState.selectedCards = [];
    AppState.usedCardIds.clear();
    AppState.currentRotation = 0;
    AppState.lastFrameTime = 0;  // 重設 delta-time 計算
    AppState.activeCardIndex = 0;
    AppState.ringCardData = [];
    AppState.cardElements = [];

    // 重置 slot UI
    for (let i = 1; i <= 3; i++) {
        const slot = document.getElementById(`slot-${i}`);
        if (slot) {
            slot.innerHTML = '';
            slot.classList.remove('filled');
        }
    }

    // 隱藏重新抽牌按鈕
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) restartBtn.classList.add('hidden');

    // 隱藏解牌 modal
    const modal = document.getElementById('reading-modal');
    if (modal) modal.classList.add('hidden');

    // 重新生成卡牌環
    generateCardRing();

    // 重新啟動旋轉
    AppState.gameState = 'rotating';
    animateCardRing();

    // 重新啟動 MediaPipe 攝像頭
    initMediaPipe();
}

/* ============================
   圖片匯出與 AI 解牌函式已拆分至:
   - question.js
   - ui.js
   - imageExport.js
   - analysis.js
   ============================ */

/* ============================
   螢幕恆亮 (Screen Wake Lock API)
   防止使用手勢操作時螢幕自動關閉
   ============================ */
async function requestWakeLock() {
    if (!('wakeLock' in navigator)) {
        console.warn('[聖境塔羅] 此瀏覽器不支援 Screen Wake Lock API');
        return;
    }
    try {
        AppState.wakeLockSentinel = await navigator.wakeLock.request('screen');
        console.log('[聖境塔羅] ✅ 螢幕恆亮已啟用');
        AppState.wakeLockSentinel.addEventListener('release', () => {
            console.log('[聖境塔羅] 螢幕恆亮已釋放');
        });
    } catch (err) {
        console.warn('[聖境塔羅] 螢幕恆亮請求失敗:', err.message);
    }
}

// 頁面重新可見時自動重新請求 (切回分頁時恢復)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        requestWakeLock();
    }
});

/* ============================
   AI 模型設定對照表
   ============================ */
/* ============================
   AI 解牌流程已拆分至 analysis.js
   ============================ */

