/**
 * 聖境塔羅 (Celestial Tarot)
 * 聖十字牌陣 (Celtic Cross) — 一鍵展牌動畫與流程
 */

/* ============================
   聖十字資源追蹤與統一清理
   ============================ */
let _ccTimers = [];
let _ccParticleAnimId = null;

/**
 * 統一清理聖十字動畫所有資源
 */
function cleanupCelticCrossAnimation() {
    _ccTimers.forEach(id => clearTimeout(id));
    _ccTimers = [];

    if (_ccParticleAnimId) {
        cancelAnimationFrame(_ccParticleAnimId);
        _ccParticleAnimId = null;
    }

    const canvas = document.getElementById('cc-particle-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = 0;
        canvas.height = 0;
    }

    const stage = document.getElementById('cc-anim-card-stage');
    if (stage) stage.innerHTML = '';

    const overlay = document.getElementById('celtic-cross-animation-overlay');
    if (overlay) {
        overlay.classList.remove('show', 'stage-fadeout');
        overlay.classList.add('hidden');
    }
}

/**
 * 啟動聖十字牌陣一鍵展牌流程
 */
async function triggerCelticCross() {
    const activeQuestion = getActiveQuestionText();
    if (!activeQuestion) {
        const instruction = document.getElementById('gesture-instruction');
        if (instruction) instruction.classList.remove('hidden');
        updateInstruction('請先輸入想提問的問題，再進行展牌。');
        const questionInput = document.getElementById('user-question-input');
        if (questionInput) questionInput.focus();
        return;
    }

    // 先清理前一輪殘留
    cleanupCelticCrossAnimation();
    if (typeof cleanupDailyAnimation === 'function') cleanupDailyAnimation();
    if (typeof cleanupGestureTransientEffects === 'function') cleanupGestureTransientEffects();
    if (typeof stopMediaPipeCamera === 'function') stopMediaPipeCamera('celtic-cross');
    if (typeof stopCardRingAnimation === 'function') stopCardRingAnimation();

    // 設定狀態
    AppState.spreadMode = 'celtic-cross';
    AppState.isDailyMode = false;
    AppState.gameState = 'finished';
    AppState.userQuestion = activeQuestion;
    AppState.selectedCards = [];
    AppState.usedCardIds.clear();

    // 確保牌庫已載入
    if (!AppState.apiCardsLoaded) {
        await fetchCardsFromAPI();
    }

    // 真隨機抽 10 張牌
    for (let i = 0; i < 10; i++) {
        const card = drawTrueRandomCard();
        if (!card) break;
        AppState.selectedCards.push(card);
    }

    if (AppState.selectedCards.length < 10) {
        console.error('[聖境塔羅] 聖十字抽牌不足 10 張');
        return;
    }

    // 允許捲動（10 張牌需要空間）
    const controlPanel = document.getElementById('control-panel');
    const questionPanel = document.getElementById('question-panel');
    if (controlPanel) controlPanel.classList.remove('centered-mode');
    if (questionPanel) questionPanel.classList.remove('centered-mode');
    if (typeof setQuestionPanelCompact === 'function') setQuestionPanelCompact(true);
    document.body.classList.remove('centered-start');

    document.body.classList.add('celtic-cross-active');

    // 啟動動畫
    startCelticCrossAnimation();
}

/**
 * 聖十字一鍵展牌動畫
 * 10 張牌依序飛入 Celtic Cross 位置，牌背→翻牌
 */
function startCelticCrossAnimation() {
    const overlay = document.getElementById('celtic-cross-animation-overlay');
    const stage = document.getElementById('cc-anim-card-stage');
    const statusEl = document.getElementById('cc-anim-status');

    if (!overlay || !stage) {
        // fallback: 直接跳到分析
        populateCelticCrossSlots();
        showAnalysis();
        return;
    }

    // 清空
    stage.innerHTML = '';
    overlay.classList.remove('hidden', 'show', 'stage-fadeout');

    // 牌的依序展開順序（按專業塔羅放牌順序）
    // 1→2→3→4→5→6→7→8→9→10
    const dealOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; // index into selectedCards

    // 對應的 CSS grid 位置 class
    const posClasses = [
        'cc-anim-pos-center',  // 1: 現況
        'cc-anim-pos-center',  // 2: 挑戰（堆疊在 1 上面）
        'cc-anim-pos-3',       // 3: 過去
        'cc-anim-pos-4',       // 4: 近未來
        'cc-anim-pos-5',       // 5: 意識
        'cc-anim-pos-6',       // 6: 潛意識
        'cc-anim-pos-7',       // 7: 自我態度
        'cc-anim-pos-8',       // 8: 外在環境
        'cc-anim-pos-9',       // 9: 希望與恐懼
        'cc-anim-pos-10'       // 10: 最終結果
    ];

    // 建立中心堆疊容器（牌 1 和牌 2）
    const centerContainer = document.createElement('div');
    centerContainer.className = 'cc-anim-pos-center';
    stage.appendChild(centerContainer);

    // 建立所有動畫牌元素
    const animCards = [];
    AppState.selectedCards.forEach((card, idx) => {
        const pos = CELTIC_CROSS_POSITIONS[idx];
        const cardEl = document.createElement('div');
        const isRotated = pos.rotated;

        cardEl.className = `cc-anim-card${isRotated ? ' cc-anim-rotated' : ''}`;

        // 牌面圖片
        const faceStyle = card.isReversed
            ? `background-image: url('assets/images/${card.name_short}.jpg'); transform: rotate(180deg);`
            : `background-image: url('assets/images/${card.name_short}.jpg');`;

        cardEl.innerHTML = `
            <div class="cc-anim-card-back"></div>
            <div class="cc-anim-card-face" style="${faceStyle}"></div>
            <div class="cc-anim-card-label">${pos.name}</div>
        `;

        // 牌 1 和牌 2 放入中心容器
        if (idx === 0 || idx === 1) {
            if (idx === 0) {
                cardEl.style.position = 'relative';
                cardEl.style.zIndex = '1';
            } else {
                cardEl.style.position = 'absolute';
                cardEl.style.zIndex = '2';
            }
            centerContainer.appendChild(cardEl);
        } else {
            cardEl.classList.add(posClasses[idx]);
            stage.appendChild(cardEl);
        }

        animCards.push(cardEl);
    });

    // 顯示 overlay
    _ccTimers.push(setTimeout(() => {
        overlay.classList.add('show');
    }, 50));

    // 初始化粒子
    const canvas = document.getElementById('cc-particle-canvas');
    let particles = [];
    if (canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = Math.floor(window.innerWidth * 0.8);
        canvas.height = Math.floor(window.innerHeight * 0.8);

        // 產生漂浮星塵
        for (let i = 0; i < 60; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: -0.2 - Math.random() * 0.8,
                size: 0.5 + Math.random() * 1.5,
                opacity: 0.1 + Math.random() * 0.4,
                decay: 0.001 + Math.random() * 0.002,
                hue: 35 + Math.random() * 40
            });
        }

        function drawCCParticles(now) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.opacity -= p.decay;
                if (p.opacity <= 0) {
                    // 重生
                    particles[i] = {
                        x: Math.random() * canvas.width,
                        y: canvas.height + 10,
                        vx: (Math.random() - 0.5) * 0.4,
                        vy: -0.2 - Math.random() * 0.8,
                        size: 0.5 + Math.random() * 1.5,
                        opacity: 0.1 + Math.random() * 0.4,
                        decay: 0.001 + Math.random() * 0.002,
                        hue: 35 + Math.random() * 40
                    };
                    continue;
                }
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${p.opacity})`;
                ctx.fill();
            }
            _ccParticleAnimId = requestAnimationFrame(drawCCParticles);
        }
        _ccParticleAnimId = requestAnimationFrame(drawCCParticles);
    }

    // 依序展開 10 張牌（每張間隔 600ms）
    const DEAL_INTERVAL = 600;
    const DEAL_START = 800; // overlay 淡入後開始

    dealOrder.forEach((cardIdx, dealIdx) => {
        const revealDelay = DEAL_START + dealIdx * DEAL_INTERVAL;
        const flipDelay = revealDelay + 400; // 顯示牌背 400ms 後翻面

        // 更新狀態文字
        _ccTimers.push(setTimeout(() => {
            const pos = CELTIC_CROSS_POSITIONS[cardIdx];
            if (statusEl) {
                statusEl.textContent = `✦ 第 ${cardIdx + 1} 張：${pos.name}`;
            }
        }, revealDelay));

        // 牌飛入（reveal）
        _ccTimers.push(setTimeout(() => {
            animCards[cardIdx].classList.add('revealed');
        }, revealDelay));

        // 翻牌
        _ccTimers.push(setTimeout(() => {
            animCards[cardIdx].classList.add('flipped');
        }, flipDelay));
    });

    // 全部展完後等待一下再淡出
    const TOTAL_DEAL_TIME = DEAL_START + 10 * DEAL_INTERVAL + 800;

    _ccTimers.push(setTimeout(() => {
        if (statusEl) statusEl.textContent = '✦ 星辰已定，正在解讀命運的軌跡...';
    }, TOTAL_DEAL_TIME - 500));

    _ccTimers.push(setTimeout(() => {
        overlay.classList.add('stage-fadeout');

        _ccTimers.push(setTimeout(() => {
            cleanupCelticCrossAnimation();
            particles = [];

            // 填入靜態 slot
            populateCelticCrossSlots();

            // 顯示分析
            showAnalysis();
        }, 900));
    }, TOTAL_DEAL_TIME));
}

/**
 * 將已抽的 10 張牌填入靜態聖十字 slot 佈局
 */
function populateCelticCrossSlots() {
    const container = document.getElementById('celtic-cross-container');
    if (container) container.classList.remove('hidden');

    AppState.selectedCards.forEach((card, idx) => {
        const slotId = `cc-slot-${idx + 1}`;
        const slot = document.getElementById(slotId);
        if (!slot) return;

        const { reversedClass, artStyle, postureText } = getCardVisualProps(card);

        const cardEl = document.createElement('div');
        cardEl.className = 'tarot-card in-slot';
        cardEl.innerHTML = `
            <div class="card-inner" style="transform: none;">
                <div class="card-front" style="transform: none; backface-visibility: visible;">
                    <div class="card-art ${reversedClass}" style="${artStyle}"></div>
                    <div class="card-name-plate">
                        <span class="card-name">${card.name}${postureText}</span>
                    </div>
                </div>
            </div>
        `;

        slot.innerHTML = '';
        slot.appendChild(cardEl);
        slot.classList.add('filled');

        // 加入 dealing 動畫 class，依序延遲
        slot.classList.add('dealing');
        setTimeout(() => {
            slot.classList.remove('dealing');
        }, 800);
    });
}

/**
 * 清空聖十字 slot UI
 */
function clearCelticCrossSlots() {
    for (let i = 1; i <= 10; i++) {
        const slot = document.getElementById(`cc-slot-${i}`);
        if (slot) {
            slot.innerHTML = '';
            slot.classList.remove('filled', 'dealing');
        }
    }
}

/**
 * 產生聖十字牌陣佈局 HTML（共用於星辰指引 Modal、占卜日誌）
 * @param {Array} cards — 10 張卡牌資料
 * @returns {string} HTML 字串
 */
function buildCelticCrossLayoutHTML(cards) {
    if (!cards || cards.length < 10) return '';

    function cardMiniHTML(card, posIdx, options = {}) {
        const isReversed = card.isReversed;
        const reversedClass = isReversed ? 'cc-lp-reversed' : '';
        const posture = isReversed ? '(逆)' : '';
        const imageOnlyClass = options.imageOnly ? ' cc-layout-card--image-only' : '';
        return `
            <div class="cc-layout-card ${reversedClass}${imageOnlyClass}">
                <img src="assets/images/${card.name_short}.jpg" alt="${card.name}" class="cc-layout-card-img${isReversed ? ' reversed-img' : ''}">
                ${options.imageOnly ? '' : `<div class="cc-layout-card-name">${card.name}${posture}</div>`}
            </div>`;
    }

    function cardCaptionText(card) {
        return `${card.name}${card.isReversed ? '(逆)' : ''}`;
    }

    return `
    <div class="cc-layout-preview">
        <div class="cc-layout-title">✦ 聖十字牌陣佈局 ✦</div>
        <div class="cc-layout-grid">
            <div class="cc-lp cc-lp-3" data-pos="3.${CELTIC_CROSS_POSITIONS[2].name}">
                ${cardMiniHTML(cards[2], 2)}
            </div>
            <div class="cc-lp cc-lp-5" data-pos="5.${CELTIC_CROSS_POSITIONS[4].name}">
                ${cardMiniHTML(cards[4], 4)}
            </div>
            <div class="cc-lp cc-lp-center">
                <div class="cc-lp-cross-stack">
                    <div class="cc-lp-stack-1" data-pos="1.${CELTIC_CROSS_POSITIONS[0].name}">
                        ${cardMiniHTML(cards[0], 0, { imageOnly: true })}
                    </div>
                    <div class="cc-lp-stack-2 cc-lp-rotated" data-pos="2.${CELTIC_CROSS_POSITIONS[1].name}">
                        ${cardMiniHTML(cards[1], 1, { imageOnly: true })}
                    </div>
                </div>
                <div class="cc-lp-center-captions">
                    <div class="cc-lp-center-caption">
                        <span class="cc-lp-center-card-name">${cardCaptionText(cards[0])}</span>
                        <span class="cc-lp-center-pos">1.${CELTIC_CROSS_POSITIONS[0].name}</span>
                    </div>
                    <div class="cc-lp-center-caption">
                        <span class="cc-lp-center-card-name">${cardCaptionText(cards[1])}</span>
                        <span class="cc-lp-center-pos">2.${CELTIC_CROSS_POSITIONS[1].name}</span>
                    </div>
                </div>
            </div>
            <div class="cc-lp cc-lp-6" data-pos="6.${CELTIC_CROSS_POSITIONS[5].name}">
                ${cardMiniHTML(cards[5], 5)}
            </div>
            <div class="cc-lp cc-lp-4" data-pos="4.${CELTIC_CROSS_POSITIONS[3].name}">
                ${cardMiniHTML(cards[3], 3)}
            </div>
            <div class="cc-lp cc-lp-10" data-pos="10.${CELTIC_CROSS_POSITIONS[9].name}">
                ${cardMiniHTML(cards[9], 9)}
            </div>
            <div class="cc-lp cc-lp-9" data-pos="9.${CELTIC_CROSS_POSITIONS[8].name}">
                ${cardMiniHTML(cards[8], 8)}
            </div>
            <div class="cc-lp cc-lp-8" data-pos="8.${CELTIC_CROSS_POSITIONS[7].name}">
                ${cardMiniHTML(cards[7], 7)}
            </div>
            <div class="cc-lp cc-lp-7" data-pos="7.${CELTIC_CROSS_POSITIONS[6].name}">
                ${cardMiniHTML(cards[6], 6)}
            </div>
        </div>
    </div>`;
}
