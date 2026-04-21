/* ============================
   UI 輔助函式
   ============================ */
function updateInstruction(text) {
    const el = document.querySelector('#gesture-instruction p');
    if (el) {
        el.textContent = text;
    }
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

function showLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    const cardsRow = document.getElementById('loading-selected-cards');
    if (!overlay) return;

    if (cardsRow) {
        cardsRow.innerHTML = '';
        AppState.selectedCards.forEach(card => {
            const imgRotate = card.isReversed ? 'transform: rotate(180deg);' : '';
            const thumb = document.createElement('div');
            thumb.className = 'loading-card-thumb';
            thumb.innerHTML = `<img src="assets/images/${card.name_short}.jpg" alt="${card.name}" style="${imgRotate}">`;
            cardsRow.appendChild(thumb);
        });
    }

    overlay.classList.remove('hidden', 'fade-out');
}

function hideLoadingOverlay(callback) {
    const overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        if (callback) callback();
        return;
    }

    overlay.classList.add('fade-out');
    const onEnd = () => {
        overlay.removeEventListener('animationend', onEnd);
        overlay.classList.add('hidden');
        overlay.classList.remove('fade-out');
        if (callback) callback();
    };
    overlay.addEventListener('animationend', onEnd, { once: true });
    setTimeout(() => {
        if (!overlay.classList.contains('hidden')) {
            onEnd();
        }
    }, 1000);
}
