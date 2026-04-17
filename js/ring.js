/* ============================
   抽牌環渲染與動畫
   ============================ */
function drawRandomCard() {
    const available = TAROT_CARDS.filter(c => !usedCardIds.has(c.id));
    if (available.length === 0) {
        usedCardIds.clear();
        const baseCard = TAROT_CARDS[Math.floor(Math.random() * TAROT_CARDS.length)];
        return { ...baseCard, isReversed: Math.random() >= 0.5 };
    }
    const baseCard = available[Math.floor(Math.random() * available.length)];
    usedCardIds.add(baseCard.id);
    return { ...baseCard, isReversed: Math.random() >= 0.5 };
}

function drawTrueRandomCard() {
    const selectedIds = new Set(selectedCards.map(c => c.id));
    const available = TAROT_CARDS.filter(c => !selectedIds.has(c.id));
    if (available.length === 0) return null;
    const baseCard = available[Math.floor(Math.random() * available.length)];
    return { ...baseCard, isReversed: Math.random() >= 0.5 };
}

function updateCardFrontDOM(cardEl, card) {
    const reversedClass = card.isReversed ? 'reversed' : '';
    const artStyle = card.isReversed
        ? `background-image: url('./assets/images/${card.name_short}.jpg'); transform: rotate(180deg);`
        : `background-image: url('./assets/images/${card.name_short}.jpg');`;

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

function generateCardRing() {
    carouselEl = document.getElementById('carousel');
    carouselEl.innerHTML = '';
    cardElements = [];
    latestGuidanceText = '';
    saveImageBusy = false;
    setSaveImageStatus('');
    setSaveImageButtonState(true, '儲存提問＋星辰指引圖');
    ringCardData = [];

    const vw = window.innerWidth;
    if (vw <= 480) {
        spreadRadius = 200;
        targetRotationSpeed = 1.5;
        numberOfCards = 8;
    } else if (vw <= 768) {
        spreadRadius = 220;
        targetRotationSpeed = 1.5;
        numberOfCards = 8;
    } else {
        spreadRadius = 300;
        numberOfCards = 10;
    }

    for (let i = 0; i < numberOfCards; i++) {
        const card = drawRandomCard();
        ringCardData[i] = card;
        const cardEl = createCardElement(i, card);
        carouselEl.appendChild(cardEl);
        cardElements[i] = cardEl;
    }

    updateCardPositions();
}

function createCardElement(index, card) {
    const cardEl = document.createElement('div');
    cardEl.className = 'tarot-card';
    cardEl.dataset.index = index;
    cardEl.dataset.id = card.id;
    cardEl.style.willChange = 'transform, opacity, z-index';

    const reversedClass = card.isReversed ? 'reversed' : '';
    const artStyle = card.isReversed
        ? `background-image: url('./assets/images/${card.name_short}.jpg'); transform: rotate(180deg);`
        : `background-image: url('./assets/images/${card.name_short}.jpg');`;

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

function refillCardSlot(slotIndex) {
    const newCard = drawRandomCard();
    ringCardData[slotIndex] = newCard;

    const newCardEl = createCardElement(slotIndex, newCard);

    const oldEl = cardElements[slotIndex];
    if (oldEl && oldEl.parentNode) {
        oldEl.parentNode.removeChild(oldEl);
    }
    carouselEl.appendChild(newCardEl);
    cardElements[slotIndex] = newCardEl;

    updateCardPositions();
}

function updateCardPositions() {
    const anglePerCard = 360 / numberOfCards;
    const ellipseVerticalRadius = spreadRadius * 0.4;

    cardElements.forEach((el, i) => {
        if (!el || el.classList.contains('flying')) return;

        let cardAngle = i * anglePerCard + currentRotation;
        cardAngle = ((cardAngle % 360) + 540) % 360 - 180;
        const absAngle = Math.abs(cardAngle);
        const rad = cardAngle * Math.PI / 180;

        const tx = Math.sin(rad) * spreadRadius;
        const ty = (Math.cos(rad) - 1) * ellipseVerticalRadius;
        const tz = (Math.cos(rad) - 1) * 150;
        const scale = 0.55 + (Math.cos(rad) + 1) * 0.3;
        const opacity = 0.2 + (Math.cos(rad) + 1) * 0.4;
        const zIndex = Math.round(50 + Math.cos(rad) * 50);

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

function animateCardRing(timestamp) {
    if (!timestamp) timestamp = performance.now();
    if (!lastFrameTime) lastFrameTime = timestamp;
    const elapsed = timestamp - lastFrameTime;
    const delta = elapsed > 0 ? elapsed / 16.667 : 1;
    lastFrameTime = timestamp;

    if (gameState === 'rotating') {
        currentRotation -= targetRotationSpeed * delta;
        updateCardPositions();
    }
    if (gameState !== 'finished') {
        animationFrameId = requestAnimationFrame(animateCardRing);
    }
}

function stopCardRing() {
    gameState = 'stopped';
    const anglePerCard = 360 / numberOfCards;

    const logicalPos = Math.round(-currentRotation / anglePerCard);
    currentRotation = -logicalPos * anglePerCard;

    let activeIdx = logicalPos % numberOfCards;
    if (activeIdx < 0) activeIdx += numberOfCards;
    activeCardIndex = activeIdx;

    cardElements.forEach(el => {
        if (el) el.classList.add('smooth-transition');
    });

    updateCardPositions();

    setTimeout(() => {
        cardElements.forEach(el => {
            if (el) el.classList.remove('smooth-transition');
        });
    }, 400);
}
