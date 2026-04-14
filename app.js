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
const ROMAN_NUMERALS = ['0','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI'];

// 預設/fallback 的本地卡牌資料（22 張大阿爾克那）
let TAROT_CARDS = [
    { id: 0,  name: '愚者',     en: 'The Fool',            numeral: '0',     symbol: '☀', meaning_up: '新的開始、無限的可能性，代表天真、冒險和對未知的信任。', meaning_rev: '魯莽、漫無目的、缺乏方向。', desc: '一位年輕旅人站在懸崖邊，腳下是未知的深淵。' },
    { id: 1,  name: '魔術師',   en: 'The Magician',        numeral: 'I',     symbol: '∞', meaning_up: '創造力、意志力與行動，你擁有實現目標所需的一切資源。', meaning_rev: '操縱、欺騙、缺乏方向。', desc: '一位年輕人手持法杖，桌上擁有四元素的象徵。' },
    { id: 2,  name: '女祭司',   en: 'The High Priestess',  numeral: 'II',    symbol: '☽', meaning_up: '直覺、潛意識與奧秘，傾聽內在的聲音。', meaning_rev: '忽視直覺、表面知識。', desc: '她坐在兩根柱子之間，手中持有至聖律法的卷軸。' },
    { id: 3,  name: '皇后',     en: 'The Empress',         numeral: 'III',   symbol: '♛', meaning_up: '豐富、孕育與感受力，生命中的豐收與滋養。', meaning_rev: '依賴、虛榮、不安全感。', desc: '一位端莊的女性坐在豐收的花園中。' },
    { id: 4,  name: '皇帝',     en: 'The Emperor',         numeral: 'IV',    symbol: '♔', meaning_up: '權威、穩定與領導力，建立秩序與結構。', meaning_rev: '暴政、僵化、缺乏彈性。', desc: '一位國王端坐王座，手持權杖與地球。' },
    { id: 5,  name: '教皇',     en: 'The Hierophant',      numeral: 'V',     symbol: '✞', meaning_up: '傳統、智慧與精神指引，尋找心靈導師。', meaning_rev: '叛逆、非正統、挑戰傳統。', desc: '他戴著三重冠冕，坐在兩根柱子之間。' },
    { id: 6,  name: '戀人',     en: 'The Lovers',          numeral: 'VI',    symbol: '♡', meaning_up: '選擇、關係與和諧，重要的抉擇即將來臨。', meaning_rev: '失衡、不和諧、價值觀衝突。', desc: '一男一女在天使的祝福下站立。' },
    { id: 7,  name: '戰車',     en: 'The Chariot',         numeral: 'VII',   symbol: '⚔', meaning_up: '勝利、掌控與決心，堅持信念勇往直前。', meaning_rev: '失控、攻擊性、缺乏方向。', desc: '一位王子駕著由兩隻獅身人面獸拉動的戰車。' },
    { id: 8,  name: '力量',     en: 'Strength',            numeral: 'VIII',  symbol: '♌', meaning_up: '勇氣、耐心與內在力量，以柔克剛。', meaning_rev: '軟弱、自我懷疑、缺乏勇氣。', desc: '一位女性溫柔地馴服一頭獅子。' },
    { id: 9,  name: '隱者',     en: 'The Hermit',          numeral: 'IX',    symbol: '☆', meaning_up: '內省、指引與尋求真理，獨處中找到智慧。', meaning_rev: '孤立、偏執、退縮。', desc: '一位老者手持燈籠站在山頂。' },
    { id: 10, name: '命運之輪', en: 'Wheel of Fortune',    numeral: 'X',     symbol: '☸', meaning_up: '變遷、機會與命運，一切都在流轉中。', meaning_rev: '厄運、抗拒改變、失控。', desc: '一個巨大的命運之輪，旋轉不止。' },
    { id: 11, name: '正義',     en: 'Justice',             numeral: 'XI',    symbol: '⚖', meaning_up: '平衡、客觀與因果，公正的裁決。', meaning_rev: '不公正、推卸責任、偏見。', desc: '一位女性手持天秤與寶劍，端坐審判。' },
    { id: 12, name: '倒吊人',   en: 'The Hanged Man',      numeral: 'XII',   symbol: '♆', meaning_up: '犧牲、視角轉換與暫停，換個角度看世界。', meaning_rev: '拖延、抗拒犧牲、無意義的等待。', desc: '一個人被倒掛在T字架上，面容平靜。' },
    { id: 13, name: '死神',     en: 'Death',               numeral: 'XIII',  symbol: '♰', meaning_up: '結束、轉變與重生，告別舊事物迎接新生。', meaning_rev: '抗拒改變、停滯、恐懼。', desc: '一位騎馬的死神，在他面前人人平等。' },
    { id: 14, name: '節制',     en: 'Temperance',          numeral: 'XIV',   symbol: '☯', meaning_up: '平衡、耐心與調和，中庸之道。', meaning_rev: '過度、不平衡、缺乏耐心。', desc: '一位天使將水從一隻聖杯倒入另一隻。' },
    { id: 15, name: '惡魔',     en: 'The Devil',           numeral: 'XV',    symbol: '⛧', meaning_up: '束縛、誘惑與物質慾望，看清鎖鏈的本質。', meaning_rev: '釋放、突破限制、面對陰影。', desc: '一隻惡魔坐在祭壇上，兩個人被鎖鏈束縛。' },
    { id: 16, name: '高塔',     en: 'The Tower',           numeral: 'XVI',   symbol: '⚡', meaning_up: '劇變、破壞與啟示，崩塌之後是重建。', meaning_rev: '恐懼改變、延遲的災難。', desc: '一座高塔被閃電擊中，人們從塔上墜落。' },
    { id: 17, name: '星星',     en: 'The Star',            numeral: 'XVII',  symbol: '★', meaning_up: '希望、靈感與平靜，黑暗中的光。', meaning_rev: '絕望、缺乏信心、斷裂的希望。', desc: '一位裸女在星光下將水倒入溪流。' },
    { id: 18, name: '月亮',     en: 'The Moon',            numeral: 'XVIII', symbol: '☾', meaning_up: '幻象、不安與潛意識，穿越迷霧找到真相。', meaning_rev: '困惑消散、恢復清明。', desc: '月亮照耀著一條蜿蜒的小路，兩隻狗對月嚎叫。' },
    { id: 19, name: '太陽',     en: 'The Sun',             numeral: 'XIX',   symbol: '☀', meaning_up: '成功、活力與喜悅，光明與溫暖。', meaning_rev: '暫時的陰霾、過度樂觀。', desc: '一個孩子騎在白馬上，在陽光下歡笑。' },
    { id: 20, name: '審判',     en: 'Judgement',           numeral: 'XX',    symbol: '♮', meaning_up: '覺醒、反省與重生，回應內在的召喚。', meaning_rev: '逃避反省、自我否定。', desc: '天使吹響號角，亡者從墓地中復活。' },
    { id: 21, name: '世界',     en: 'The World',           numeral: 'XXI',   symbol: '◎', meaning_up: '完成、圓滿與整合，旅程的圓滿完成。', meaning_rev: '未完成、缺少收尾、延遲。', desc: '一位女性在月桂花環中舞蹈，四角有四活物。' }
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



// 手勢防抖（避免連續觸發）
let lastGestureTime = 0;
const GESTURE_COOLDOWN = 600;  // ms

// 3D 環形架構狀態
let numberOfCards = 12;        // 環上的牌數
let radius = 250;              // 圓半徑
let currentRotation = 0;       // 當前環的旋轉角度
let targetRotationSpeed = 1.0; // 每影格旋轉度數
let activeCardIndex = 0;       // 正前方面對使用者的卡片索引
let carouselEl = null;
let animationFrameId = null;

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
        star.style.left   = `${Math.random() * 100}%`;
        star.style.top    = `${Math.random() * 100}%`;
        const size = Math.random() * 2 + 1;
        star.style.width  = `${size}px`;
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
    if (!startBtn) return;

    startBtn.addEventListener('click', async () => {
        console.log('[聖境塔羅] 使用者點擊「開啟手勢抽牌」');
        startBtn.classList.add('hidden');

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
        initMediaPipe();
    });
}

/* ============================
   生成 3D 卡牌環
   ============================ */
function generateCardRing() {
    carouselEl = document.getElementById('carousel');
    carouselEl.innerHTML = '';
    
    // 從大阿爾克那隨機選出 numberOfCards 張出來擺在環上
    const ringCards = [...TAROT_CARDS].sort(() => 0.5 - Math.random()).slice(0, numberOfCards);
    
    for (let i = 0; i < numberOfCards; i++) {
        const card = ringCards[i];
        const cardEl = document.createElement('div');
        cardEl.className = 'tarot-card';
        cardEl.dataset.index = i;
        cardEl.dataset.id = card.id;
        
        // 分佈角度，推動半徑形成環體
        const angle = i * (360 / numberOfCards);
        cardEl.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
        
        cardEl.innerHTML = `
            <div class="card-inner">
                <div class="card-front">
                    <div class="card-art" style="background-image: url('./images/${card.name_short}.jpg');"></div>
                    <div class="card-name-plate">
                        <span class="card-name">${card.name}</span>
                    </div>
                </div>
                <div class="card-back"></div>
            </div>
        `;
        carouselEl.appendChild(cardEl);
    }
}

/* ============================
   卡牌環行動畫引擎 (3D)
   ============================ */
function animateCardRing() {
    if (gameState === 'rotating') {
        currentRotation -= targetRotationSpeed; // 持續轉動
        if (carouselEl) {
            carouselEl.style.transform = `rotateY(${currentRotation}deg)`;
        }
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
    
    // 特殊邏輯：計算哪一張卡在最前方面對我們。
    // 環轉了 currentRotation 度 (通常是負值)，要找出最接近的正前方角度
    let logicalPos = Math.round(-currentRotation / anglePerCard);
    let targetRot = -logicalPos * anglePerCard;
    
    // 動畫 Snap 到定位
    currentRotation = targetRot;
    if (carouselEl) {
        carouselEl.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        carouselEl.style.transform = `rotateY(${currentRotation}deg)`;
    }
    
    // 計算出現在究竟是哪張卡的 index 是正前方 active
    let activeIdx = logicalPos % numberOfCards;
    if (activeIdx < 0) activeIdx += numberOfCards;
    activeCardIndex = activeIdx;
    
    // 為高光增加 CSS Class
    document.querySelectorAll('.carousel .tarot-card').forEach(el => el.classList.remove('active'));
    const activeEl = document.querySelector(`.carousel .tarot-card[data-index="${activeCardIndex}"]`);
    if(activeEl) activeEl.classList.add('active');
    
    // 轉完後把 transition 移除，以免影響下一次的手動持續轉動畫
    setTimeout(() => {
        if(carouselEl && gameState === 'stopped') carouselEl.style.transition = '';
    }, 550);
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

    const isThumbExtended  = landmarks[4].x < landmarks[3].x;
    const isIndexExtended  = landmarks[8].y  < landmarks[6].y;
    const isMiddleExtended = landmarks[12].y < landmarks[10].y;
    const isRingExtended   = landmarks[16].y < landmarks[14].y;
    const isPinkyExtended  = landmarks[20].y < landmarks[18].y;

    const fingersUp = [isIndexExtended, isMiddleExtended, isRingExtended, isPinkyExtended];
    const countUp = fingersUp.filter(Boolean).length;

    const isOpenPalm  = countUp >= 4;
    const isClosedFist = countUp === 0 && !isThumbExtended;
    const isPointing   = isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended;

    if (isOpenPalm) {
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
   確認選定與翻蓋動畫
   ============================ */
function confirmSelection() {
    if (selectedCards.length >= 3) return;

    const activeEl = document.querySelector(`.carousel .tarot-card[data-index="${activeCardIndex}"]`);
    if (!activeEl || activeEl.classList.contains('flipped')) return;

    const cardId = parseInt(activeEl.dataset.id);
    const card = TAROT_CARDS.find(c => c.id === cardId);
    if (!card) return;

    // 翻牌特效
    activeEl.classList.add('flipped');
    
    // 延遲讓使用者看清楚翻開的牌
    setTimeout(() => {
        selectedCards.push(card);
        const slotIndex = selectedCards.length;
        const slot = document.getElementById(`slot-${slotIndex}`);
        
        if (slot) {
            slot.innerHTML = `<span class="slot-label">${['過去', '現在', '未來'][slotIndex - 1]}</span><strong>${card.name}</strong>`;
            slot.classList.add('filled');
        }

        // 把該卡片隱藏
        activeEl.style.opacity = '0';
        activeEl.classList.remove('active');

        if (selectedCards.length === 3) {
            gameState = 'finished';
            updateInstruction('✨ 牌陣已完成，正在解讀星辰的指引...');
            setTimeout(showAnalysis, 1500);
        } else {
            gameState = 'idle';
            updateInstruction(`已收錄第 ${slotIndex} 張！請【張開手掌】繼續旋轉命運之輪`);
        }
    }, 1500); // 展示 1.5 秒後收編
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
   顯示解牌結果
   ============================ */
function showAnalysis() {
    const modal   = document.getElementById('reading-modal');
    const display = document.getElementById('card-display');
    const title   = document.getElementById('card-title');
    const desc    = document.getElementById('card-desc');

    if (!modal || !display || !title || !desc) return;

    display.innerHTML = '';
    const positions = ['過去 / 原因', '現在 / 狀況', '未來 / 結果'];
    let html = '';

    selectedCards.forEach((card, idx) => {
        const meaningUp = card.meaning_up || '';
        const meaningRev = card.meaning_rev || '';
        const cardDesc = card.desc ? `<div class="analysis-desc">${card.desc.substring(0, 200)}${card.desc.length > 200 ? '...' : ''}</div>` : '';
        html += `
        <div class="analysis-card">
            <div class="analysis-position">${positions[idx]}</div>
            <div class="analysis-symbol">${card.symbol || '✦'}</div>
            <div class="analysis-name">${card.name}</div>
            <div class="analysis-en">${card.en}</div>
            ${cardDesc}
            <div class="analysis-meaning"><strong>▲ 正位：</strong>${meaningUp}</div>
            <div class="analysis-meaning-rev"><strong>▽ 逆位：</strong>${meaningRev}</div>
        </div>`;
    });

    title.textContent = '✦ 星辰的指引 ✦';
    desc.innerHTML = html;
    modal.classList.remove('hidden');

    const closeBtn = document.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.classList.add('hidden');
        };
    }
}
