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

/* ============================
   DOMContentLoaded 入口
   ============================ */
document.addEventListener('DOMContentLoaded', () => {
    console.log('[聖境塔羅] 頁面載入完成');
    initStars();
    initApp();
});

/* ============================
   背景星光效果
   ============================ */
function initStars() {
    const container = document.getElementById('stars-container');
    if (!container) return;
    const starCount = 150;

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

    // 初始進入時將按鈕置中
    if (controlPanel) {
        controlPanel.classList.add('centered-mode');
    }

    // 綁定設定按鈕 (Gemini API Key)
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsModal = document.getElementById('close-settings-modal');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const apiKeyInput = document.getElementById('gemini-api-key');

    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', () => {
            const savedKey = localStorage.getItem('gemini_api_key');
            if (savedKey) apiKeyInput.value = savedKey;
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
            settingsModal.classList.add('hidden');
            // 可以加入一個短暫的 Toast 或者直接覆蓋設定
        });
    }

    if (!startBtn) return;

    // 開始按鈕
    startBtn.addEventListener('click', async () => {
        console.log('[聖境塔羅] 使用者點擊「開啟手勢抽牌」');
        startBtn.classList.add('hidden');
        if (controlPanel) {
            controlPanel.classList.remove('centered-mode');
        }

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
        el.style.opacity = String(opacity);
        el.style.zIndex = String(zIndex);
        el.style.pointerEvents = absAngle < anglePerCard / 2 ? 'auto' : 'none';

        // 焦點標記：最前方的卡加上 focus class
        if (absAngle < anglePerCard / 2) {
            el.classList.add('focus');
            el.classList.add('active');
            el.style.pointerEvents = 'auto';
        } else {
            el.classList.remove('focus');
            el.classList.remove('active');
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

    mpHands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    mpHands.onResults(onHandResults);

    if (typeof Camera === 'undefined') {
        console.error('[聖境塔羅] MediaPipe Camera 未載入！');
        updateInstruction('❌ Camera 工具載入失敗');
        return;
    }

    mpCamera = new Camera(videoElement, {
        onFrame: async () => {
            if (mpHands) {
                await mpHands.send({ image: videoElement });
            }
        },
        facingMode: 'user',
        width: 640,
        height: 480
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
        updateInstruction('🔄 轉動中... 請【握拳 ✊】停留');
        lastGestureTime = now;

    } else if (gesture === 'closed_fist' && gameState === 'rotating') {
        stopCardRing();
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

            // 加入位置標籤（過去/現在/未來）
            const positionLabels = ['過去', '現在', '未來'];
            const badge = document.createElement('div');
            badge.className = 'slot-position-badge';
            badge.textContent = positionLabels[slotIndex - 1];
            flyClone.appendChild(badge);

            // 清空 slot 並嵌入 clone
            slot.innerHTML = '';
            slot.appendChild(flyClone);
            slot.classList.add('filled');

            // 補牌：在原位置放上新的卡片
            refillCardSlot(refillIndex);

            if (selectedCards.length === 3) {
                gameState = 'finished';
                const restartBtn = document.getElementById('restart-btn');
                if (restartBtn) restartBtn.classList.remove('hidden');
                updateInstruction('✨ 牌陣已完成，正在解讀星辰的指引...');
                setTimeout(showAnalysis, 1500);
            } else {
                gameState = 'idle';
                updateInstruction(`已收錄第 ${slotIndex} 張！請【張開手掌】繼續旋轉命運之輪`);
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
            slot.innerHTML = String(i);
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

/* ============================
   顯示解牌結果 & 呼叫 Gemini
   ============================ */
function showAnalysis() {
    const modal = document.getElementById('reading-modal');
    const container = document.getElementById('cards-analysis-container');
    const geminiLoading = document.getElementById('gemini-loading');
    const geminiText = document.getElementById('gemini-text');

    if (!modal || !container) return;

    // 清空並組合單張牌卡 HTML
    container.innerHTML = '';
    const positions = ['過去 / 原因', '現在 / 狀況', '未來 / 結果'];
    let html = '';
    let cardNamesForPrompt = [];

    selectedCards.forEach((card, idx) => {
        const posture = card.isReversed ? '逆位' : '正位';
        const activeMeaning = card.isReversed ? card.meaning_rev : card.meaning_up;
        const imgUrl = `images/${card.name_short}.jpg`;
        const imgRotateAttr = card.isReversed ? 'transform: rotate(180deg);' : '';

        // 分別處理正逆位的顯示樣式（將當前的位向高亮顯示）
        const upStyle = card.isReversed ? 'opacity: 0.4;' : 'opacity: 1;';
        const revStyle = card.isReversed ? 'opacity: 1;' : 'opacity: 0.4;';

        const cardDesc = card.desc ? `<div class="analysis-desc">${card.desc.substring(0, 150)}...</div>` : '';

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
            <div class="analysis-meaning" style="${upStyle}"><strong>▲ 正位：</strong><br>${card.meaning_up || ''}</div>
            <div class="analysis-meaning-rev" style="${revStyle}"><strong>▽ 逆位：</strong><br>${card.meaning_rev || ''}</div>
        </div>`;

        // 傳給 Gemini 的 prompt 包含正逆位與實際意義
        cardNamesForPrompt.push(`${positions[idx].split(' / ')[0]}是「${card.name}」的【${posture}】（代表意義：${activeMeaning}）`);
    });

    container.innerHTML = html;
    modal.classList.remove('hidden');

    const closeBtn = document.getElementById('close-reading-modal');
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.classList.add('hidden');
        };
    }

    // 觸發 Gemini 分析
    if (geminiLoading && geminiText) {
        geminiLoading.classList.remove('hidden');
        geminiText.classList.add('hidden');
        geminiText.innerHTML = '';
        fetchGeminiAnalysis(cardNamesForPrompt, geminiLoading, geminiText);
    }
}

/* ============================
   呼叫 Gemini API 產生綜合解讀
   ============================ */
async function fetchGeminiAnalysis(cardsLog, loadingEl, textEl) {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
        loadingEl.classList.add('hidden');
        textEl.classList.remove('hidden');
        textEl.innerHTML = '<em>您尚未設定 Gemini API Key，請點擊右上角 ⚙️ 設定金鑰以啟用星辰綜合解析。目前僅能提供單張牌意參考。</em>';
        return;
    }

    const promptText = `你是一位充滿智慧、語氣溫柔且帶有神祕感的高階塔羅占卜師。
使用者抽出了以下三張牌：
1. ${cardsLog[0]}
2. ${cardsLog[1]}
3. ${cardsLog[2]}

請綜合這三張牌的意涵，用你過往的資訊而非單純卡牌上的意思，用白話文給予使用者一段約 150-200 字整體的運勢解析與未來指引。
請直接輸出解析內容，不須打招呼。`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }]
            })
        });

        if (!response.ok) {
            throw new Error(`API 錯誤狀態碼: ${response.status}`);
        }

        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        loadingEl.classList.add('hidden');
        textEl.classList.remove('hidden');

        // 替換換行符號為 <br>
        let formattedReply = reply.replace(/\n/g, '<br>');

        // 簡單的打字機特效
        textEl.innerHTML = '';
        let i = 0;
        const typeWriter = setInterval(() => {
            // 如果遇到 HTML 標籤（例如 <br>），整塊一次寫入
            if (formattedReply.substring(i, i + 4) === '<br>') {
                textEl.innerHTML += '<br>';
                i += 4;
            } else {
                textEl.innerHTML += formattedReply.charAt(i);
                i++;
            }
            if (i >= formattedReply.length) clearInterval(typeWriter);
        }, 15);

    } catch (err) {
        console.error('[聖境塔羅] Gemini API 呼叫失敗:', err);
        loadingEl.classList.add('hidden');
        textEl.classList.remove('hidden');
        textEl.innerHTML = `<span style="color: #ff6b6b;">無法取得神諭指引。請確認您的 API Key 是否正確或網路是否通暢。(錯誤: ${err.message})</span>`;
    }
}
