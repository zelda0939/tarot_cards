/**
 * 聖境塔羅 (Celestial Tarot)
 * 初始化控制模組
 */

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
        let targetUrl = window.location.href;
        
        // LINE 支援使用 openExternalBrowser=1 參數強制跳轉至系統預設瀏覽器
        if (isLine) {
            try {
                const urlObj = new URL(window.location.href);
                urlObj.searchParams.set('openExternalBrowser', '1');
                targetUrl = urlObj.toString();
            } catch (e) {
                targetUrl += (targetUrl.includes('?') ? '&' : '?') + 'openExternalBrowser=1';
            }
        }

        const banner = document.createElement('div');
        banner.id = 'inapp-browser-warning';
        banner.innerHTML = `
            <div style="
                position: fixed; top: 0; left: 0; width: 100vw; z-index: 9999;
                background: linear-gradient(135deg, #1a0a00, #2a1500);
                border-bottom: 2px solid var(--gold);
                padding: 1.2rem 5vw;
                box-sizing: border-box;
                text-align: center;
                box-shadow: 0 4px 20px rgba(0,0,0,0.6);
                animation: slideDown 0.5s ease;
            ">
                <p style="color: var(--gold-light); font-size: 0.95rem; margin: 0 0 0.5rem 0; line-height: 1.4; white-space: normal; word-break: break-word;">
                    ⚠️ 偵測到您正在使用 <strong>${appName}</strong> 內建瀏覽器
                </p>
                <p style="color: var(--text-white); font-size: 0.85rem; margin: 0 0 1rem 0; line-height: 1.5; opacity: 0.9; white-space: normal; word-break: break-word;">
                    手勢抽牌功能需要攝影機權限，<strong>${appName}</strong> 瀏覽器可能無法正常取得授權。<br>
                    請點擊下方按鈕以 <strong>Chrome 或 Safari 系統瀏覽器</strong> 開啟，獲得最佳體驗 ✨
                </p>
                <a href="${targetUrl}" target="_blank" rel="noopener"
                   style="display: inline-block; background: var(--gold); color: #111; padding: 0.6rem 2rem; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 0.95rem; letter-spacing: 0.5px; box-shadow: 0 2px 10px rgba(212,175,55,0.3);">
                    🌐 用外部瀏覽器開啟
                </a>
                <button onclick="this.closest('#inapp-browser-warning').remove()"
                    style="display: block; margin-top: 0.8rem; background: transparent; border: none; color: var(--text-muted); font-size: 0.75rem; padding: 0.5rem; cursor: pointer; text-decoration: underline;">
                    略過此提示並繼續
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

    const dailyBtn = document.getElementById('daily-card-btn');
    if (dailyBtn) {
        dailyBtn.addEventListener('click', triggerDailyCard);
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

        // ── 清除可能殘留的每日一抽狀態與動畫資源（使用者在 daily 結果頁按關閉後直接開手勢抽牌）──
        if (typeof cleanupDailyAnimation === 'function') cleanupDailyAnimation();
        if (typeof cleanupGestureTransientEffects === 'function') cleanupGestureTransientEffects();
        if (typeof stopCardRingAnimation === 'function') stopCardRingAnimation();
        if (typeof stopMediaPipeCamera === 'function') stopMediaPipeCamera('start-gesture');
        if (AppState.isDailyMode || AppState.selectedCards.length > 0) {
            AppState.isDailyMode = false;
            AppState.selectedCards = [];
            AppState.usedCardIds.clear();
            // 清空 slot UI，避免殘留牌面
            for (let i = 1; i <= 3; i++) {
                const slot = document.getElementById(`slot-${i}`);
                if (slot) {
                    slot.innerHTML = '';
                    slot.classList.remove('filled');
                }
            }
        }

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
        startCardRingAnimation();
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
            if (typeof cleanupDailyAnimation === 'function') cleanupDailyAnimation();
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
