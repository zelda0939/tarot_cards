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

// 從 API 取得的完整牌庫（載入後覆蓋）
let apiCardsLoaded = false;

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

        apiCardsLoaded = true;
        console.log(`[聖境塔羅] ✅ 成功載入 ${TAROT_CARDS.length} 張牌（含完整 78 張）`);
    } catch (err) {
        console.warn('[聖境塔羅] ⚠️ API 載入失敗，使用本地 22 張大阿爾克那:', err.message);
        apiCardsLoaded = false;
    }
}

/* ============================
   全域狀態變數
   ============================ */
let mpHands = null;
let mpCamera = null;
let gameState = 'idle';        // idle | rotating | stopped | finished
let selectedCards = [];
let userQuestion = '';
let latestGuidanceText = '';
let saveImageBusy = false;

// 已使用的卡牌 ID 集合（防止重複抽到同一張）
let usedCardIds = new Set();

// 環上每個位置對應的卡牌資料
let ringCardData = [];

// 手勢防抖（避免連續觸發）
let lastGestureTime = 0;
const GESTURE_COOLDOWN = 600;  // ms

// 3D 圓環架構狀態
let numberOfCards = 10;        // 環上的牌數
let currentRotation = 0;       // 當前環的邏輯旋轉角度
let targetRotationSpeed = 1.2; // 每影格旋轉度數
let activeCardIndex = 0;       // 正前方面對使用者的卡片索引
let carouselEl = null;
let animationFrameId = null;
let spreadRadius = 300;        // 扇形展開的水平半徑 (px)
let cardElements = [];          // 儲存生成的卡牌 DOM 元素
let lastFrameTime = 0;          // delta-time 用，紀錄上一幀時間戳

// MediaPipe 是否已初始化
let mediaPipeInitialized = false;

// 螢幕恆亮 (Wake Lock)
let wakeLockSentinel = null;

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

function toggleStars(isVisible) {
    const container = document.getElementById('stars-container');
    if (!container) return;
    
    // 只隱藏星星，不隱藏 container 本身，以免漸層背景消失導致閃變全黑
    const stars = container.querySelectorAll('.star');
    const displayVal = isVisible ? 'block' : 'none';
    stars.forEach(star => {
        star.style.display = displayVal;
    });
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
                userQuestion = '';
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
        userQuestion = activeQuestion;

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
        toggleStars(false); // 隱藏星空以減少負載

        // 嘗試從 API 載入牌庫
        await fetchCardsFromAPI();

        // 隱藏 loader
        if (loader) loader.classList.add('hidden');

        document.getElementById('gesture-instruction').classList.remove('hidden');
        document.getElementById('selected-cards-container').classList.remove('hidden');

        // 生成 3D 卡牌環
        generateCardRing();

        // 🔥 立即開始旋轉卡牌，讓使用者馬上看到效果
        gameState = 'rotating';
        animateCardRing();
        updateInstruction('🔄 卡牌旋轉中，正在啟動鏡頭...');

        // 非同步啟動 MediaPipe（不阻塞旋轉）
        if (!mediaPipeInitialized) {
            initMediaPipe();
        }
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
   從 78 張牌中隨機抽一張未使用的卡，並隨機賦予正逆位
   ============================ */
function drawRandomCard() {
    const available = TAROT_CARDS.filter(c => !usedCardIds.has(c.id));
    if (available.length === 0) {
        // 若全部用完則重置（極端情況）
        usedCardIds.clear();
        const baseCard = TAROT_CARDS[Math.floor(Math.random() * TAROT_CARDS.length)];
        return { ...baseCard, isReversed: Math.random() >= 0.5 };
    }
    const baseCard = available[Math.floor(Math.random() * available.length)];
    usedCardIds.add(baseCard.id);
    return { ...baseCard, isReversed: Math.random() >= 0.5 };
}

/* ============================
   從全牌庫真隨機抽牌（僅排除已選定的牌）
   環上展示的牌只是視覺效果，不影響抽取範圍
   ============================ */
function drawTrueRandomCard() {
    const selectedIds = new Set(selectedCards.map(c => c.id));
    const available = TAROT_CARDS.filter(c => !selectedIds.has(c.id));
    if (available.length === 0) return null;
    const baseCard = available[Math.floor(Math.random() * available.length)];
    return { ...baseCard, isReversed: Math.random() >= 0.5 };
}

/**
 * 更新卡牌 DOM 元素的正面內容（在翻牌前替換為真正抽到的牌）
 */
function updateCardFrontDOM(cardEl, card) {
    const reversedClass = card.isReversed ? 'reversed' : '';
    const artStyle = card.isReversed
        ? `background-image: url('./images/${card.name_short}.jpg'); transform: rotate(180deg);`
        : `background-image: url('./images/${card.name_short}.jpg');`;

    const postureText = card.isReversed
        ? '<span style="display: block; font-size: 0.85em; color: #a03030; margin-top: 1px;">(逆位)</span>'
        : '';

    const cardArt = cardEl.querySelector('.card-art');
    const cardName = cardEl.querySelector('.card-name');

    if (cardArt) {
        cardArt.className = `card-art ${reversedClass}`;
        cardArt.style.cssText = artStyle;
    }
    if (cardName) {
        cardName.innerHTML = `${card.name}${postureText}`;
    }
}

/* ============================
   生成 3D 卡牌環
   ============================ */
function generateCardRing() {
    carouselEl = document.getElementById('carousel');
    carouselEl.innerHTML = '';
    cardElements = [];
    latestGuidanceText = '';
    saveImageBusy = false;
    setSaveImageStatus('');
    setSaveImageButtonState(true, '儲存提問＋星辰指引圖');
    ringCardData = [];

    // 根據螢幕寬度動態調整扇形展開半徑與旋轉速度
    const vw = window.innerWidth;
    if (vw <= 480) {
        spreadRadius = 200;
        targetRotationSpeed = 1.5; // 手機板旋轉速度加倍
    } else if (vw <= 768) {
        spreadRadius = 220;
        targetRotationSpeed = 1.5;
    } else {
        spreadRadius = 300;
        //targetRotationSpeed = 1;
    }

    // 從 78 張牌中隨機選出 numberOfCards 張擺在環上
    for (let i = 0; i < numberOfCards; i++) {
        const card = drawRandomCard();
        ringCardData[i] = card;
        const cardEl = createCardElement(i, card);
        carouselEl.appendChild(cardEl);
        cardElements[i] = cardEl;
    }

    // 初始化佈局
    updateCardPositions();
}

/* ============================
   建立單張卡牌的 DOM 元素
   ============================ */
function createCardElement(index, card) {
    const cardEl = document.createElement('div');
    cardEl.className = 'tarot-card';
    cardEl.dataset.index = index;
    cardEl.dataset.id = card.id;
    cardEl.style.willChange = 'transform, opacity, z-index';

    // 判斷是否為逆位，若是則加上 reversed class 處理圓角，並旋轉圖片 180 度，然後在名稱加上標註
    const reversedClass = card.isReversed ? 'reversed' : '';
    const artStyle = card.isReversed
        ? `background-image: url('./images/${card.name_short}.jpg'); transform: rotate(180deg);`
        : `background-image: url('./images/${card.name_short}.jpg');`;

    // 將逆位文字用 span 包裝並設為 display: block 強制優雅換行
    const postureText = card.isReversed
        ? '<span style="display: block; font-size: 0.85em; color: #a03030; margin-top: 1px;">(逆位)</span>'
        : '';

    cardEl.innerHTML = `
        <div class="card-inner">
            <div class="card-front">
                <div class="card-art ${reversedClass}" style="${artStyle}"></div>
                <div class="card-name-plate">
                    <span class="card-name">${card.name}${postureText}</span>
                </div>
            </div>
            <div class="card-back"></div>
        </div>
    `;
    return cardEl;
}

/* ============================
   補牌：在指定位置替換為新的卡牌
   ============================ */
function refillCardSlot(slotIndex) {
    const newCard = drawRandomCard();
    ringCardData[slotIndex] = newCard;

    // 建立新的卡牌 DOM
    const newCardEl = createCardElement(slotIndex, newCard);

    // 替換 DOM
    const oldEl = cardElements[slotIndex];
    if (oldEl && oldEl.parentNode) {
        oldEl.parentNode.removeChild(oldEl);
    }
    carouselEl.appendChild(newCardEl);
    cardElements[slotIndex] = newCardEl;

    // 立即讓它出現在正確位置（下一幀 updateCardPositions 會處理）
    updateCardPositions();
}

/* ============================
   景深佈局計算：完整橢圓軌道
   前方卡牌在下方正中，兩側與後方形成完整橢圓環
   ============================ */
function updateCardPositions() {
    const anglePerCard = 360 / numberOfCards;

    // 橢圓垂直展開半徑（兩側卡牌向上偏移的最大幅度）
    const ellipseVerticalRadius = spreadRadius * 0.4;

    cardElements.forEach((el, i) => {
        if (!el || el.classList.contains('flying')) return; // 飛行中的卡不參與佈局

        // 計算此卡相對於正前方的角度差
        let cardAngle = i * anglePerCard + currentRotation;
        // 歸一化到 -180 ~ 180
        cardAngle = ((cardAngle % 360) + 540) % 360 - 180;

        // 計算角度差的絕對值（0 = 正前方）
        const absAngle = Math.abs(cardAngle);

        // 使用真正的橢圓軌道，全 360° 可見
        const rad = cardAngle * Math.PI / 180;

        // 水平位移：完整 sin 曲線
        const tx = Math.sin(rad) * spreadRadius;

        // 垂直位移：用 cos 產生橢圓弧線
        // angle=0(前方) → ty=0, angle=±180(後方) → ty = -ellipseVerticalRadius*2 (最高)
        const ty = (Math.cos(rad) - 1) * ellipseVerticalRadius;

        // 深度（Z 軸）：前方靠近觀眾，後方遠離
        const tz = (Math.cos(rad) - 1) * 150; // 前方 tz=0, 後方 tz=-300

        // 縮放：前方最大，後方最小
        const scale = 0.55 + (Math.cos(rad) + 1) * 0.3; // 0.55 ~ 1.15

        // 透明度：前方最亮，後方淡出但仍可見
        const opacity = 0.2 + (Math.cos(rad) + 1) * 0.4; // 0.2 ~ 1.0

        // Z-index：前方最高
        const zIndex = Math.round(50 + Math.cos(rad) * 50); // 0 ~ 100

        el.style.transform = `translateX(${tx}px) translateY(${ty}px) translateZ(${tz}px) scale(${scale})`;
        el.style.opacity = String(opacity.toFixed(3));
        el.style.zIndex = String(zIndex);

        const isActive = (absAngle < anglePerCard / 2);
        if (isActive !== (el.dataset.isActive === 'true')) {
            el.dataset.isActive = isActive ? 'true' : 'false';
            el.style.pointerEvents = isActive ? 'auto' : 'none';
            if (isActive) {
                el.classList.add('focus', 'active');
            } else {
                el.classList.remove('focus', 'active');
            }
        }
    });
}

/* ============================
   卡牌環行動畫引擎 (3D 景深)
   使用 delta-time 確保旋轉速度與幀率無關（無論 60fps / 144fps 都一樣順）
   ============================ */
function animateCardRing(timestamp) {
    if (!timestamp) timestamp = performance.now();
    if (!lastFrameTime) lastFrameTime = timestamp;
    const elapsed = timestamp - lastFrameTime;
    const delta = elapsed > 0 ? elapsed / 16.667 : 1; // 歸一化到 60fps 的倍率，首幀預設 1
    lastFrameTime = timestamp;

    if (gameState === 'rotating') {
        currentRotation -= targetRotationSpeed * delta;
        updateCardPositions();
    }
    // 透過 RAF 維持迴圈
    if (gameState !== 'finished') {
        animationFrameId = requestAnimationFrame(animateCardRing);
    }
}

/* ============================
   停止與定位選定的卡牌
   ============================ */
function stopCardRing() {
    gameState = 'stopped';
    const anglePerCard = 360 / numberOfCards;

    // Snap 到最近的整數卡位
    let logicalPos = Math.round(-currentRotation / anglePerCard);
    currentRotation = -logicalPos * anglePerCard;

    // 計算正前方的卡片 index
    let activeIdx = logicalPos % numberOfCards;
    if (activeIdx < 0) activeIdx += numberOfCards;
    activeCardIndex = activeIdx;

    // 加入平滑過渡做 snap 動畫
    cardElements.forEach(el => {
        if (el) el.classList.add('smooth-transition');
    });

    // 更新佈局與焦點
    updateCardPositions();

    // 過渡結束後移除 transition class，避免影響下次旋轉
    setTimeout(() => {
        cardElements.forEach(el => {
            if (el) el.classList.remove('smooth-transition');
        });
    }, 400);
}

/* ============================
   MediaPipe Hands 初始化
   ============================ */
function initMediaPipe() {
    const videoElement = document.getElementById('videoElement');

    if (typeof Hands === 'undefined') {
        console.error('[聖境塔羅] MediaPipe Hands 未載入！');
        updateInstruction('❌ MediaPipe 載入失敗，請確認網路連線');
        return;
    }

    mpHands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });

    const isMobile = window.innerWidth <= 768;
    mpHands.setOptions({
        maxNumHands: 1,
        modelComplexity: isMobile ? 0 : 1, // 手機直接用最快的模型，降低 CPU 負擔
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    mpHands.onResults(onHandResults);

    if (typeof Camera === 'undefined') {
        console.error('[聖境塔羅] MediaPipe Camera 未載入！');
        updateInstruction('❌ Camera 工具載入失敗');
        return;
    }

    let isProcessingFrame = false;

    mpCamera = new Camera(videoElement, {
        onFrame: async () => {
            // 防止推積：上一幀還沒算完就不要送新的進去
            if (mpHands && !isProcessingFrame) {
                isProcessingFrame = true;
                try {
                    await mpHands.send({ image: videoElement });
                } catch (e) {
                    console.error('[MediaPipe] 偵測錯誤:', e);
                } finally {
                    isProcessingFrame = false;
                }
            }
        },
        facingMode: 'user',
        width: isMobile ? 320 : 640,
        height: isMobile ? 240 : 480
    });

    mpCamera.start()
        .then(() => {
            console.log('[聖境塔羅] ✅ 鏡頭啟動成功！');
            mediaPipeInitialized = true;
            updateInstruction('🔄 轉動中... 請【握拳 ✊】停留');
        })
        .catch((err) => {
            console.error('[聖境塔羅] ❌ 鏡頭啟動失敗:', err);
            updateInstruction('❌ 無法啟動鏡頭，請允許瀏覽器存取攝影機權限後重新整理');
        });
}

/* ============================
   手勢辨識結果處理
   ============================ */
function onHandResults(results) {
    if (gameState === 'finished') return;

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        return;
    }

    const landmarks = results.multiHandLandmarks[0];

    // Y 座標越小代表越高。判斷指尖 (Tip) 是否高於 第二關節 (PIP)
    const isIndexExtended = landmarks[8].y < landmarks[6].y;
    const isMiddleExtended = landmarks[12].y < landmarks[10].y;
    const isRingExtended = landmarks[16].y < landmarks[14].y;
    const isPinkyExtended = landmarks[20].y < landmarks[18].y;

    const fingersUp = [isIndexExtended, isMiddleExtended, isRingExtended, isPinkyExtended];
    const countUp = fingersUp.filter(Boolean).length;

    // 張開手掌：判定只要有 3 根以上伸直即算，容錯率更高
    const isOpenPalm = countUp >= 3;

    // 握拳：幾乎沒有手指伸直
    const isClosedFist = countUp === 0;

    // 比 1 (Pointing)：
    // 1. 食指伸直，且其他三指彎曲
    // 2. 食指指尖(8) 必須「明顯高於」中指指尖(12)，差值大於 0.08
    // 這可以完美防止使用者「張開手掌」因為角度問題被誤判為「比 1」
    const isPointing = isIndexExtended &&
        !isMiddleExtended &&
        !isRingExtended &&
        !isPinkyExtended &&
        (landmarks[12].y - landmarks[8].y > 0.08);

    // 優先判斷 Pointing，再判斷 Open Palm（如果 Pointing 誤觸發機率已極低）
    if (isOpenPalm && !isPointing) {
        triggerGesture('open_palm');
    } else if (isClosedFist) {
        triggerGesture('closed_fist');
    } else if (isPointing && gameState === 'stopped') {
        triggerGesture('pointing');
    }
}

/* ============================
   手勢觸發
   ============================ */
function triggerGesture(gesture) {
    const now = Date.now();
    if (now - lastGestureTime < GESTURE_COOLDOWN) return;

    if (gesture === 'open_palm' && (gameState === 'idle' || gameState === 'stopped')) {
        gameState = 'rotating';
        toggleStars(false);
        updateInstruction('🔄 轉動中... 請【握拳 ✊】停留');
        lastGestureTime = now;

    } else if (gesture === 'closed_fist' && gameState === 'rotating') {
        stopCardRing();
        toggleStars(true);
        updateInstruction(`已鎖定！請【比 1 ☝️】翻牌，或【張開手掌 🖐】重轉`);
        lastGestureTime = now;

    } else if (gesture === 'pointing' && gameState === 'stopped') {
        confirmSelection();
        lastGestureTime = now;
    }
}

/* ============================
   確認選定與翻蓋動畫 + 飛入 Slot
   使用 clone 元素掛到 body，避免 carousel 的 3D perspective 干擾
   飛入結束後將 clone 嵌入 slot，保持卡牌正面原樣
   ============================ */
function confirmSelection() {
    if (selectedCards.length >= 3) return;

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
    userQuestion = activeQuestion;

    const activeEl = cardElements[activeCardIndex];
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
    const refillIndex = activeCardIndex;

    // 等待翻牌動畫完成後執行飛入動畫
    setTimeout(() => {
        selectedCards.push(card);
        const slotIndex = selectedCards.length;
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

            if (selectedCards.length === 3) {
                gameState = 'finished';
                toggleStars(true);
                const restartBtn = document.getElementById('restart-btn');
                if (restartBtn) restartBtn.classList.remove('hidden');
                updateInstruction('✨ 星辰已定，正在解讀命運的軌跡...');
                setTimeout(showAnalysis, 1500);
            } else {
                gameState = 'idle';
                toggleStars(true);
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
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    // 重置狀態
    gameState = 'idle';
    toggleStars(true);
    selectedCards = [];
    usedCardIds.clear();
    currentRotation = 0;
    lastFrameTime = 0;  // 重設 delta-time 計算
    activeCardIndex = 0;
    ringCardData = [];
    cardElements = [];

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
    gameState = 'rotating';
    animateCardRing();
    updateInstruction('🔄 轉動中... 請【握拳 ✊】停留');
}

/* ============================
   更新指示器
   ============================ */
function updateInstruction(text) {
    const el = document.querySelector('#gesture-instruction p');
    if (el) {
        el.textContent = text;
    }
}

function getActiveQuestionText() {
    const questionInput = document.getElementById('user-question-input');
    const typedQuestion = questionInput ? questionInput.value.trim() : '';
    return typedQuestion || userQuestion;
}

function syncQuestionPreview() {
    const previewEl = document.getElementById('question-preview');
    if (!previewEl) return;
    const activeQuestion = getActiveQuestionText();
    previewEl.textContent = activeQuestion
        ? `目前提問：${activeQuestion}`
        : '尚未填寫提問，點「修改問題」輸入。';
}

function setQuestionPanelCompact(shouldCompact) {
    const questionPanel = document.getElementById('question-panel');
    const questionToggleBtn = document.getElementById('question-toggle-btn');
    const questionClearBtn = document.getElementById('question-clear-btn');
    const questionPreview = document.getElementById('question-preview');
    const questionInput = document.getElementById('user-question-input');
    if (!questionPanel) return;

    if (shouldCompact) {
        questionPanel.classList.add('compact');
        syncQuestionPreview();
        if (questionPreview) questionPreview.classList.remove('hidden');
        if (questionToggleBtn) {
            questionToggleBtn.classList.remove('hidden');
            questionToggleBtn.textContent = '修改問題';
        }
        if (questionClearBtn) questionClearBtn.classList.add('hidden');
        return;
    }

    questionPanel.classList.remove('compact');
    if (questionPreview) questionPreview.classList.add('hidden');
    if (questionToggleBtn) {
        questionToggleBtn.classList.remove('hidden');
        questionToggleBtn.textContent = '收合';
    }
    if (questionClearBtn) questionClearBtn.classList.remove('hidden');
    if (questionInput) questionInput.focus();
}

function setSaveImageStatus(message, statusType = '') {
    const statusEl = document.getElementById('save-image-status');
    if (!statusEl) return;

    statusEl.classList.remove('success', 'error');

    if (!message) {
        statusEl.textContent = '';
        statusEl.classList.add('hidden');
        return;
    }

    statusEl.textContent = message;
    statusEl.classList.remove('hidden');
    if (statusType === 'success' || statusType === 'error') {
        statusEl.classList.add(statusType);
    }
}

function setSaveImageButtonState(disabled, buttonText) {
    const btn = document.getElementById('save-reading-image-btn');
    if (!btn) return;
    btn.disabled = !!disabled;
    btn.textContent = buttonText || '儲存提問＋星辰指引圖';
}

function normalizeGuidanceText(rawText) {
    if (!rawText) return '';
    return String(rawText)
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/?[^>]+>/g, '')
        .replace(/\r\n/g, '\n')
        .replace(/\u00a0/g, ' ')
        .trim();
}

function wrapCanvasText(ctx, text, maxWidth) {
    const lines = [];
    const paragraphs = String(text || '').split('\n');

    paragraphs.forEach((paragraph, paragraphIndex) => {
        if (!paragraph.trim()) {
            lines.push('');
            return;
        }

        let currentLine = '';
        for (const char of paragraph) {
            if (!currentLine && /\s/.test(char)) {
                continue;
            }

            const nextLine = currentLine + char;
            if (ctx.measureText(nextLine).width > maxWidth && currentLine) {
                lines.push(currentLine.trimEnd());
                currentLine = /\s/.test(char) ? '' : char;
            } else {
                currentLine = nextLine;
            }
        }

        if (currentLine) lines.push(currentLine.trimEnd());
        if (paragraphIndex !== paragraphs.length - 1) lines.push('');
    });

    while (lines.length > 0 && lines[lines.length - 1] === '') {
        lines.pop();
    }

    return lines;
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
    const r = Math.max(0, Math.min(radius, width / 2, height / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawStarField(ctx, width, height, starCount) {
    for (let i = 0; i < starCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 1.8 + 0.4;
        const opacity = Math.random() * 0.65 + 0.2;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

const waitImageLoad = (src) => new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
});

async function buildGuidanceImageCanvas(questionText, guidanceText, cards) {
    const width = 1080;
    const padding = 82;
    const contentWidth = width - padding * 2;

    const safeQuestion = (questionText || '未提供提問').trim();
    const safeGuidance = (guidanceText || '尚未取得星辰指引').trim();

    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    measureCtx.font = "500 43px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
    const questionLines = wrapCanvasText(measureCtx, safeQuestion, contentWidth - 96);
    measureCtx.font = "400 37px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
    const rawGuidanceLines = wrapCanvasText(measureCtx, safeGuidance, contentWidth - 96);
    const maxGuidanceLines = 40;
    const guidanceLines = rawGuidanceLines.slice(0, maxGuidanceLines);
    if (rawGuidanceLines.length > maxGuidanceLines && guidanceLines.length > 0) {
        guidanceLines[guidanceLines.length - 1] += '…';
    }

    // --- 計算卡牌區塊高度 ---
    let cardsBoxHeight = 0;
    let meaningsLinesArr = [];
    const cardImgWidth = 230;
    const cardImgHeight = 391;
    const cardGap = 66; // (contentWidth - 92 - 230*3) / 2 = 67
    const meaningLineHeight = 36;
    let cardImages = [];

    if (cards && cards.length) {
        // 先載入所有圖片
        cardImages = await Promise.all(cards.map(card => waitImageLoad(`images/${card.name_short}.jpg`)));

        measureCtx.font = "400 24px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
        meaningsLinesArr = cards.map(card => {
            const text = card.isReversed ? card.meaning_rev : card.meaning_up;
            const label = (card.isReversed ? '▽ 逆位：' : '▲ 正位：') + text;
            return wrapCanvasText(measureCtx, label, cardImgWidth);
        });
        const maxMeaningLines = Math.max(1, ...meaningsLinesArr.map(l => l.length));

        const cardAreaHeader = 70 + 31 + 30; // padding top + text + padding
        const cardBlockHeight = 40 + 20 + cardImgHeight + 30 + 30 + 16 + (maxMeaningLines * meaningLineHeight) + 40;
        cardsBoxHeight = cardAreaHeader + cardBlockHeight;
    }

    // --- 計算高度總和 ---
    const questionLineHeight = 62;
    const guidanceLineHeight = 55;
    const questionTextHeight = Math.max(1, questionLines.length) * questionLineHeight;
    const guidanceTextHeight = Math.max(1, guidanceLines.length) * guidanceLineHeight;
    const questionBoxHeight = Math.max(220, 70 + questionTextHeight + 58);
    const guidanceBoxHeight = Math.max(420, 70 + guidanceTextHeight + 64);

    const headerHeight = 230;
    const betweenSections = 48;
    const footerHeight = 118;
    const cardsSectionTotalSpace = cardsBoxHeight > 0 ? cardsBoxHeight + betweenSections : 0;
    const totalHeight = headerHeight + questionBoxHeight + betweenSections + cardsSectionTotalSpace + guidanceBoxHeight + footerHeight + padding;
    const height = Math.min(4500, Math.max(1500, Math.ceil(totalHeight)));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#050713');
    bgGradient.addColorStop(0.58, '#0f1733');
    bgGradient.addColorStop(1, '#151c44');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    const nebulaColors = [
        'rgba(61, 87, 190, 0.22)',
        'rgba(112, 72, 185, 0.16)',
        'rgba(18, 128, 120, 0.14)'
    ];
    nebulaColors.forEach((color, idx) => {
        const r = 240 + idx * 90;
        const x = idx === 1 ? width * 0.72 : width * (0.24 + idx * 0.2);
        const y = idx === 2 ? height * 0.66 : height * (0.22 + idx * 0.16);
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
        glow.addColorStop(0, color);
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    });

    drawStarField(ctx, width, height, 320);

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, 36, 36, width - 72, height - 72, 30);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f8e8a8';
    ctx.font = "700 60px 'Cinzel', serif";
    ctx.fillText('Celestial Tarot', width / 2, 122);

    ctx.fillStyle = 'rgba(249, 229, 150, 0.95)';
    ctx.font = "500 34px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
    ctx.fillText('聖境塔羅', width / 2, 178);

    const questionBoxY = 236;
    const questionBoxX = padding;
    drawRoundedRect(ctx, questionBoxX, questionBoxY, contentWidth, questionBoxHeight, 28);
    ctx.fillStyle = 'rgba(6, 11, 28, 0.72)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.36)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#f6d77a';
    ctx.font = "600 31px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
    ctx.fillText('你的提問', questionBoxX + 46, questionBoxY + 62);

    ctx.fillStyle = '#ffffff';
    ctx.font = "500 43px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
    let questionY = questionBoxY + 124;
    questionLines.forEach((line) => {
        ctx.fillText(line || ' ', questionBoxX + 46, questionY);
        questionY += questionLineHeight;
    });

    let currentSectionY = questionBoxY + questionBoxHeight + betweenSections;

    // --- 繪製卡牌區塊 ---
    if (cards && cards.length) {
        drawRoundedRect(ctx, questionBoxX, currentSectionY, contentWidth, cardsBoxHeight, 28);
        ctx.fillStyle = 'rgba(6, 11, 28, 0.72)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.36)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.fillStyle = '#f6d77a';
        ctx.font = "600 31px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
        ctx.fillText('所選卡牌', questionBoxX + 46, currentSectionY + 62);

        cards.forEach((card, idx) => {
            const cx = questionBoxX + 46 + idx * (cardImgWidth + cardGap);
            let childY = currentSectionY + 130;

            // 位置
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(212, 175, 55, 0.12)';
            drawRoundedRect(ctx, cx + cardImgWidth / 2 - 60, childY - 28, 120, 40, 20);
            ctx.fill();
            ctx.fillStyle = '#f8e8a8';
            ctx.font = "500 24px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
            ctx.fillText(`第 ${idx + 1} 張`, cx + cardImgWidth / 2, childY);

            childY += 36;

            // 圖片
            const img = cardImages[idx];
            if (img) {
                if (card.isReversed) {
                    ctx.save();
                    ctx.translate(cx + cardImgWidth / 2, childY + cardImgHeight / 2);
                    ctx.rotate(Math.PI);
                    ctx.drawImage(img, -cardImgWidth / 2, -cardImgHeight / 2, cardImgWidth, cardImgHeight);
                    ctx.restore();
                } else {
                    ctx.drawImage(img, cx, childY, cardImgWidth, cardImgHeight);
                }

                // 框線
                ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
                ctx.lineWidth = 2;
                ctx.strokeRect(cx, childY, cardImgWidth, cardImgHeight);
            }

            childY += cardImgHeight + 36;

            // 牌名
            const posture = card.isReversed ? '逆位' : '正位';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#f6d77a';
            ctx.font = "700 26px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
            ctx.fillText(`${card.symbol || '✦'} ${card.name} [${posture}]`, cx + cardImgWidth / 2, childY);

            childY += 40;

            // 牌意
            ctx.textAlign = 'left';
            ctx.fillStyle = '#eaf1ff';
            ctx.font = "400 24px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
            const lines = meaningsLinesArr[idx];
            lines.forEach(line => {
                ctx.fillText(line || ' ', cx, childY);
                childY += meaningLineHeight;
            });
        });

        currentSectionY += cardsBoxHeight + betweenSections;
    }

    // --- 繪製星辰指引區塊 ---
    const guidanceBoxY = currentSectionY;
    drawRoundedRect(ctx, questionBoxX, guidanceBoxY, contentWidth, guidanceBoxHeight, 28);
    ctx.fillStyle = 'rgba(5, 9, 24, 0.76)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.36)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = '#f6d77a';
    ctx.font = "600 31px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
    ctx.fillText('星辰指引', questionBoxX + 46, guidanceBoxY + 62);

    ctx.fillStyle = '#eaf1ff';
    ctx.font = "400 37px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
    let guidanceY = guidanceBoxY + 124;
    guidanceLines.forEach((line) => {
        ctx.fillText(line || ' ', questionBoxX + 46, guidanceY);
        guidanceY += guidanceLineHeight;
    });

    const generatedAt = new Date().toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(249, 229, 150, 0.82)';
    ctx.font = "400 24px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
    ctx.fillText(`生成時間 ${generatedAt}`, width / 2, height - 64);

    return canvas;
}

function canvasToPngBlob(canvas) {
    return new Promise((resolve, reject) => {
        if (!canvas) {
            reject(new Error('Canvas is unavailable'));
            return;
        }

        if (canvas.toBlob) {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to export image blob'));
                }
            }, 'image/png');
            return;
        }

        try {
            const dataUrl = canvas.toDataURL('image/png');
            const base64 = dataUrl.split(',')[1] || '';
            const binary = atob(base64);
            const len = binary.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            resolve(new Blob([bytes], { type: 'image/png' }));
        } catch (err) {
            reject(err);
        }
    });
}

function downloadImageBlob(blob, fileName) {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
}

async function saveReadingAsImage() {
    if (saveImageBusy) return;

    const questionText = getActiveQuestionText();
    const guidanceText = normalizeGuidanceText(
        latestGuidanceText || document.getElementById('gemini-text')?.innerHTML || ''
    );

    if (!guidanceText) {
        setSaveImageStatus('目前還沒有可儲存的星辰指引，請先完成解牌。', 'error');
        return;
    }

    saveImageBusy = true;
    setSaveImageStatus('');
    setSaveImageButtonState(true, '產生圖片中...');

    try {
        const canvas = await buildGuidanceImageCanvas(questionText, guidanceText, selectedCards);
        const blob = await canvasToPngBlob(canvas);
        const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
        const fileName = `celestial-tarot-guidance-${stamp}.png`;
        downloadImageBlob(blob, fileName);
        setSaveImageStatus('圖片已下載，已包含提問與星辰指引。', 'success');
    } catch (err) {
        console.error('[星辰塔羅] 儲存圖片失敗:', err);
        setSaveImageStatus('儲存圖片失敗，請稍後再試。', 'error');
    } finally {
        saveImageBusy = false;
        setSaveImageButtonState(false, '儲存提問＋星辰指引圖');
    }
}

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
        wakeLockSentinel = await navigator.wakeLock.request('screen');
        console.log('[聖境塔羅] ✅ 螢幕恆亮已啟用');
        wakeLockSentinel.addEventListener('release', () => {
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
const AI_MODELS = {
    'gemini-3-flash-preview': { name: 'Gemini 3 Flash', id: 'gemini-3-flash-preview' },
    'gemma-4-31b-it': { name: 'Gemma 4 31B', id: 'gemma-4-31b-it' }
};

/* ============================
   顯示等待畫面 + 在背景呼叫 AI
   AI 回應完成後才切換到解牌 Modal
   ============================ */
function showAnalysis() {
    const loadingOverlay = document.getElementById('loading-overlay');
    const modal = document.getElementById('reading-modal');
    const container = document.getElementById('cards-analysis-container');
    const geminiLoading = document.getElementById('gemini-loading');
    const geminiText = document.getElementById('gemini-text');
    const questionText = getActiveQuestionText();

    if (!modal || !container) return;
    latestGuidanceText = '';
    saveImageBusy = false;
    setSaveImageStatus('');
    setSaveImageButtonState(true, '等待星辰指引...');

    // === 第一階段：顯示等待畫面 ===
    showLoadingOverlay();

    // 準備解牌 Modal 的 HTML（在背景組裝），但先不顯示
    container.innerHTML = '';
    const positions = ['第1張', '第2張', '第3張'];
    let html = '';
    let cardNamesForPrompt = [];

    selectedCards.forEach((card, idx) => {
        const posture = card.isReversed ? '逆位' : '正位';
        const activeMeaning = card.isReversed ? card.meaning_rev : card.meaning_up;
        const imgUrl = `images/${card.name_short}.jpg`;
        const imgRotateAttr = card.isReversed ? 'transform: rotate(180deg);' : '';

        const cardDesc = card.desc ? `<div class="analysis-desc">${card.desc.substring(0, 150)}...</div>` : '';

        // 只顯示抽到的正位或逆位意義
        const meaningLabel = card.isReversed ? '▽ 逆位' : '▲ 正位';
        const meaningClass = card.isReversed ? 'analysis-meaning-rev' : 'analysis-meaning';

        html += `
        <div class="analysis-card">
            <div class="analysis-position">${positions[idx]}</div>
            <div style="text-align: center; margin-bottom: 1rem;">
                <img src="${imgUrl}" alt="${card.name}" onerror="this.parentElement.style.display='none'" style="width: 140px; border-radius: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); border: 1px solid var(--gold-glow); ${imgRotateAttr}">
            </div>
            <div class="analysis-header">
                <div class="analysis-symbol">${card.symbol || '✦'}</div>
                <div class="analysis-name">${card.name} <span style="font-size: 0.8rem; color: var(--gold-light);">[${posture}]</span></div>
                <div class="analysis-en">${card.en}</div>
            </div>
            ${cardDesc}
            <div class="${meaningClass}"><strong>${meaningLabel}：</strong><br>${activeMeaning}</div>
        </div>`;

        // 傳給 AI 的 prompt 包含正逆位與實際意義
        cardNamesForPrompt.push(`${positions[idx]}是「${card.name}」的【${posture}】（代表意義：${activeMeaning}）`);
    });

    container.innerHTML = html;

    // 設定模型名稱標頭
    const modelId = localStorage.getItem('gemini_model') || 'gemma-4-31b-it';
    const modelInfo = AI_MODELS[modelId] || AI_MODELS['gemma-4-31b-it'];
    const geminiHeader = document.querySelector('.gemini-header');
    if (geminiHeader) {
        geminiHeader.innerHTML = `<span class="gold-star">❉</span> 綜合神諭 <span style="font-size: 0.7em; opacity: 0.7;">powered by ${modelInfo.name}</span> <span class="gold-star">❉</span>`;
    }

    // 關閉按鈕
    const closeBtn = document.getElementById('close-reading-modal');
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.classList.add('hidden');
        };
    }

    // === 第二階段：在背景呼叫 AI API ===
    fetchGeminiAnalysis(cardNamesForPrompt, questionText).then((result) => {
        // === 第三階段：AI 完成，關閉等待畫面，顯示解牌 Modal ===
        hideLoadingOverlay(() => {
            // 設定綜合神諭內容
            if (geminiLoading) geminiLoading.classList.add('hidden');
            if (geminiText) {
                geminiText.classList.remove('hidden');
                if (result.success) {
                    // 打字機效果
                    const formattedReply = result.text.replace(/\n/g, '<br>');
                    geminiText.innerHTML = '';
                    let i = 0;
                    if (!formattedReply.length) {
                        setSaveImageButtonState(false, '儲存提問＋星辰指引圖');
                    }
                    const typeWriter = setInterval(() => {
                        if (formattedReply.substring(i, i + 4) === '<br>') {
                            geminiText.innerHTML += '<br>';
                            i += 4;
                        } else {
                            geminiText.innerHTML += formattedReply.charAt(i);
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

/* ============================
   顯示等待畫面 (Loading Overlay)
   ============================ */
function showLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    const cardsRow = document.getElementById('loading-selected-cards');
    if (!overlay) return;

    // 填入已選卡牌縮圖
    if (cardsRow) {
        cardsRow.innerHTML = '';
        selectedCards.forEach(card => {
            const imgRotate = card.isReversed ? 'transform: rotate(180deg);' : '';
            const thumb = document.createElement('div');
            thumb.className = 'loading-card-thumb';
            thumb.innerHTML = `<img src="images/${card.name_short}.jpg" alt="${card.name}" style="${imgRotate}">`;
            cardsRow.appendChild(thumb);
        });
    }

    overlay.classList.remove('hidden', 'fade-out');
}

/* ============================
   隱藏等待畫面 (帶淡出動畫)
   ============================ */
function hideLoadingOverlay(callback) {
    const overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        if (callback) callback();
        return;
    }

    overlay.classList.add('fade-out');
    // 動畫結束後隱藏並執行回呼
    const onEnd = () => {
        overlay.removeEventListener('animationend', onEnd);
        overlay.classList.add('hidden');
        overlay.classList.remove('fade-out');
        if (callback) callback();
    };
    overlay.addEventListener('animationend', onEnd, { once: true });
    // 安全網
    setTimeout(() => {
        if (!overlay.classList.contains('hidden')) {
            onEnd();
        }
    }, 1000);
}

/* ============================
   呼叫 AI API 產生綜合解讀（純資料層，回傳 Promise）
   ============================ */
async function fetchGeminiAnalysis(cardsLog, userQuestionText) {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
        return {
            success: false,
            text: '<em>您尚未設定 API Key，請點擊右上角 ⚙️ 設定金鑰以啟用星辰綜合解析。目前僅能提供單張牌意參考。</em>'
        };
    }

    // 讀取使用者選擇的模型
    const modelId = localStorage.getItem('gemini_model') || 'gemma-4-31b-it';
    const modelInfo = AI_MODELS[modelId] || AI_MODELS['gemma-4-31b-it'];
    console.log(`[聖境塔羅] 使用模型: ${modelInfo.name} (${modelInfo.id})`);
    const normalizedQuestion = (userQuestionText || '').trim() || '未提供明確提問';

    // 系統角色設定（使用 systemInstruction 與 user prompt 分離，避免 Gemma 4 等模型將角色設定當成對話重複輸出）
    const systemPrompt = `你是一位充滿智慧、語氣溫柔且帶有神祕感的高階塔羅占卜師。
你的任務是先根據使用者提問，定義本次占卜中 三張牌 的角色，再綜合三張塔羅牌給出整體運勢解析與未來指引。

客觀的對應邏輯如下：
時間發展型問題（如：這件事接下來的走向？）：AI 會預設為 「過去 / 現在 / 未來」。
決策行動型問題（如：遇到這個瓶頸我該怎麼做？）：AI 會預設為 「現況 / 建議 / 結果」 或 「內部因素 / 外部阻礙 / 解決方案」。
人際關係型問題（如：我跟他的合作關係？）：AI 會預設為 「自己 / 對方 / 雙方互動」。

【嚴格規則】
- 先輸出「三張牌定義」，再輸出「綜合運勢解析」
- 三張牌的定義必須緊扣使用者提問，不能套用固定的過去/現在/未來
- 不要逐張牌分開解讀，請強調三張牌彼此的關聯與整體訊息
- 直接輸出內容，不要打招呼、不要自我介紹
- 使用白話文，約 320~520 字
- 語氣保持溫柔、神祕、有智慧感`;

    const userPrompt = `使用者提問：
${normalizedQuestion}

使用者抽出了以下三張牌（順序為第1張到第3張）：
1. ${cardsLog[0]}
2. ${cardsLog[1]}
3. ${cardsLog[2]}

請依照以下格式輸出：
【三張牌的定義】
第1張：...
第2張：...
第3張：...

【綜合運勢解析】
...`;

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
        // 過濾掉 Gemma 4 的 thinking parts（thought: true），只取實際回答
        const parts = data.candidates?.[0]?.content?.parts || [];
        const replyParts = parts.filter(p => !p.thought);
        const reply = replyParts.map(p => p.text).join('') || '';

        return { success: true, text: reply };

    } catch (err) {
        console.error('[聖境塔羅] AI API 呼叫失敗:', err);
        return {
            success: false,
            text: `<span style="color: #ff6b6b;">無法取得神諭指引。請確認您的 API Key 是否正確或網路是否通暢。(錯誤: ${err.message})</span>`
        };
    }
}

