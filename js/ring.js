/* ============================
   抽牌環渲染與動畫
   ============================ */
let _smoothTransitionTimer = null;
const _ringAnimationFrameIds = new Set();

function clearSmoothTransitionTimer() {
    if (_smoothTransitionTimer) {
        clearTimeout(_smoothTransitionTimer);
        _smoothTransitionTimer = null;
    }
    AppState.cardElements.forEach(el => {
        if (el) el.classList.remove('smooth-transition');
    });
}

function drawRandomCard() {
    const available = TAROT_CARDS.filter(c => !AppState.usedCardIds.has(c.id));
    if (available.length === 0) {
        AppState.usedCardIds.clear();
        const baseCard = TAROT_CARDS[Math.floor(Math.random() * TAROT_CARDS.length)];
        return { ...baseCard, isReversed: Math.random() >= 0.5 };
    }
    const baseCard = available[Math.floor(Math.random() * available.length)];
    AppState.usedCardIds.add(baseCard.id);
    return { ...baseCard, isReversed: Math.random() >= 0.5 };
}

function drawTrueRandomCard() {
    const selectedIds = new Set(AppState.selectedCards.map(c => c.id));
    const available = TAROT_CARDS.filter(c => !selectedIds.has(c.id));
    if (available.length === 0) return null;
    const baseCard = available[Math.floor(Math.random() * available.length)];
    return { ...baseCard, isReversed: Math.random() >= 0.5 };
}

/**
 * 取得卡牌的視覺屬性（共用邏輯，消除 createCardElement 與 updateCardFrontDOM 的重複）
 * @param {Object} card - 卡牌資料
 * @returns {{ reversedClass: string, artStyle: string, postureText: string }}
 */
function getCardVisualProps(card) {
    const reversedClass = card.isReversed ? 'reversed' : '';
    const artStyle = card.isReversed
        ? `background-image: url('./assets/images/${card.name_short}.jpg'); transform: rotate(180deg);`
        : `background-image: url('./assets/images/${card.name_short}.jpg');`;
    const postureText = card.isReversed
        ? '<span style="display: block; font-size: 0.85em; color: #a03030; margin-top: 1px;">(逆位)</span>'
        : '';
    return { reversedClass, artStyle, postureText };
}

function updateCardFrontDOM(cardEl, card) {
    const { reversedClass, artStyle, postureText } = getCardVisualProps(card);

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

function generateCardRing() {
    clearSmoothTransitionTimer();
    AppState.carouselEl = document.getElementById('carousel');
    AppState.carouselEl.innerHTML = '';
    AppState.cardElements = [];
    AppState.latestGuidanceText = '';
    AppState.saveImageBusy = false;
    setSaveImageStatus('');
    setSaveImageButtonState(true, '儲存提問＋星辰指引圖');
    AppState.ringCardData = [];

    const vw = window.innerWidth;
    if (vw <= 480) {
        AppState.spreadRadius = 200;
        AppState.targetRotationSpeed = 1.5;
        AppState.numberOfCards = 8;
    } else if (vw <= 768) {
        AppState.spreadRadius = 220;
        AppState.targetRotationSpeed = 1.5;
        AppState.numberOfCards = 8;
    } else {
        AppState.spreadRadius = 300;
        AppState.numberOfCards = 10;
    }

    for (let i = 0; i < AppState.numberOfCards; i++) {
        const card = drawRandomCard();
        AppState.ringCardData[i] = card;
        const cardEl = createCardElement(i, card);
        AppState.carouselEl.appendChild(cardEl);
        AppState.cardElements[i] = cardEl;
    }

    updateCardPositions();
}

function createCardElement(index, card) {
    const cardEl = document.createElement('div');
    cardEl.className = 'tarot-card';
    cardEl.dataset.index = index;
    cardEl.dataset.id = card.id;

    const { reversedClass, artStyle, postureText } = getCardVisualProps(card);

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

function refillCardSlot(slotIndex) {
    const newCard = drawRandomCard();
    AppState.ringCardData[slotIndex] = newCard;

    const newCardEl = createCardElement(slotIndex, newCard);

    const oldEl = AppState.cardElements[slotIndex];
    if (oldEl && oldEl.parentNode) {
        oldEl.parentNode.removeChild(oldEl);
    }
    AppState.carouselEl.appendChild(newCardEl);
    AppState.cardElements[slotIndex] = newCardEl;

    updateCardPositions();
}

function updateCardPositions() {
    const anglePerCard = 360 / AppState.numberOfCards;
    const ellipseVerticalRadius = AppState.spreadRadius * 0.4;
    const spreadR = AppState.spreadRadius;
    const DEG_TO_RAD = Math.PI / 180;
    const halfAngle = anglePerCard / 2;
    const elements = AppState.cardElements;
    const rotation = AppState.currentRotation;

    for (let i = 0, len = elements.length; i < len; i++) {
        const el = elements[i];
        if (!el || el.classList.contains('flying')) continue;

        let cardAngle = i * anglePerCard + rotation;
        cardAngle = ((cardAngle % 360) + 540) % 360 - 180;
        const rad = cardAngle * DEG_TO_RAD;
        const cosVal = Math.cos(rad);

        const tx = Math.sin(rad) * spreadR;
        const ty = (cosVal - 1) * ellipseVerticalRadius;
        const tz = (cosVal - 1) * 150;
        const scale = 0.55 + (cosVal + 1) * 0.3;

        const s = el.style;
        s.transform = `translateX(${tx}px) translateY(${ty}px) translateZ(${tz}px) scale(${scale})`;
        s.opacity = 0.2 + (cosVal + 1) * 0.4;
        s.zIndex = 50 + (cosVal * 50 + 0.5) | 0;

        const isActive = (Math.abs(cardAngle) < halfAngle);
        if (isActive !== (el.dataset.isActive === 'true')) {
            el.dataset.isActive = isActive ? 'true' : 'false';
            s.pointerEvents = isActive ? 'auto' : 'none';
            if (isActive) {
                el.classList.add('focus', 'active');
            } else {
                el.classList.remove('focus', 'active');
            }
        }
    }
}

function scheduleRingAnimationFrame() {
    const frameId = requestAnimationFrame((timestamp) => {
        _ringAnimationFrameIds.delete(frameId);
        animateCardRing(timestamp);
    });
    _ringAnimationFrameIds.add(frameId);
    AppState.animationFrameId = frameId;
}

function animateCardRing(timestamp) {
    if (!AppState.ringAnimationRunning) return;

    if (!timestamp) timestamp = performance.now();
    if (!AppState.lastFrameTime) AppState.lastFrameTime = timestamp;
    const elapsed = timestamp - AppState.lastFrameTime;
    const delta = elapsed > 0 ? elapsed / 16.667 : 1;
    AppState.lastFrameTime = timestamp;

    if (AppState.gameState === 'rotating') {
        AppState.currentRotation -= AppState.targetRotationSpeed * delta;
        updateCardPositions();
    }
    if (AppState.gameState !== 'finished') {
        scheduleRingAnimationFrame();
    } else {
        AppState.animationFrameId = null;
        AppState.ringAnimationRunning = false;
        AppState.lastFrameTime = 0;
    }
}

function startCardRingAnimation() {
    if (AppState.ringAnimationRunning) return;

    AppState.ringAnimationRunning = true;
    AppState.lastFrameTime = 0;
    scheduleRingAnimationFrame();
}

function stopCardRingAnimation() {
    _ringAnimationFrameIds.forEach(frameId => cancelAnimationFrame(frameId));
    _ringAnimationFrameIds.clear();
    AppState.animationFrameId = null;
    AppState.ringAnimationRunning = false;
    AppState.lastFrameTime = 0;
    clearSmoothTransitionTimer();
}

function stopCardRing() {
    AppState.gameState = 'stopped';
    const anglePerCard = 360 / AppState.numberOfCards;

    const logicalPos = Math.round(-AppState.currentRotation / anglePerCard);
    AppState.currentRotation = -logicalPos * anglePerCard;

    let activeIdx = logicalPos % AppState.numberOfCards;
    if (activeIdx < 0) activeIdx += AppState.numberOfCards;
    AppState.activeCardIndex = activeIdx;

    AppState.cardElements.forEach(el => {
        if (el) el.classList.add('smooth-transition');
    });

    updateCardPositions();

    clearSmoothTransitionTimer();
    _smoothTransitionTimer = setTimeout(() => {
        AppState.cardElements.forEach(el => {
            if (el) el.classList.remove('smooth-transition');
        });
        _smoothTransitionTimer = null;
    }, 400);
}
