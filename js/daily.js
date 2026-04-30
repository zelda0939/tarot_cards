/**
 * 聖境塔羅 (Celestial Tarot)
 * 每日指引 (Daily Draw) 動畫特效與流程
 */

/* ============================
   每日一抽資源追蹤與統一清理
   防止多次抽牌後 setTimeout / rAF / DOM / Canvas 洩漏
   ============================ */
let _dailyTimers = [];      // 追蹤所有 setTimeout ID
let _dailyParticleAnimId = null;
let _dailyScanAnimId = null;

/**
 * 統一清理每日一抽動畫所有資源
 * — 清除所有排程中的 setTimeout
 * — 取消所有 requestAnimationFrame
 * — 清空扇形牌陣 DOM 節點
 * — 釋放 Canvas 位圖記憶體
 * — 重置 overlay class 狀態
 */
function cleanupDailyAnimation() {
    // 1. 清除所有排程中的 setTimeout
    _dailyTimers.forEach(id => clearTimeout(id));
    _dailyTimers = [];

    // 2. 取消 requestAnimationFrame
    if (_dailyParticleAnimId) {
        cancelAnimationFrame(_dailyParticleAnimId);
        _dailyParticleAnimId = null;
    }
    if (_dailyScanAnimId) {
        cancelAnimationFrame(_dailyScanAnimId);
        _dailyScanAnimId = null;
    }

    // 3. 清空扇形牌陣 DOM（移除動態產生的牌 + 掃描光柱）
    const deckFan = document.getElementById('daily-deck-fan');
    if (deckFan) deckFan.innerHTML = '';

    // 4. 釋放 Canvas 位圖記憶體
    const canvas = document.getElementById('daily-particle-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        // 設定 width/height 為 0 可強制瀏覽器回收位圖記憶體
        canvas.width = 0;
        canvas.height = 0;
    }

    // 5. 重置 overlay class 狀態
    const overlay = document.getElementById('daily-animation-overlay');
    if (overlay) {
        overlay.classList.remove(
            'show', 'stage-deck', 'stage-draw', 'stage-enter',
            'stage-charge', 'stage-flip', 'stage-reveal', 'stage-fadeout',
            'daily-perf-mobile', 'daily-perf-lite'
        );
        overlay.classList.add('hidden');
    }
}

/* ============================
   每日指引特效與邏輯
   ============================ */
async function triggerDailyCard() {
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastDailyDate = localStorage.getItem('dailyCardDate');

    if (lastDailyDate === todayStr) {
        // 今日已抽過
        const msg = "您今日已經抽取過每日指引了！塔羅的意義在於一天的沉澱。\n\n如果您想回顧今日的指引，請前往「占卜日誌」。\n\n是否仍要強制重新抽取一組新的？";
        const confirmed = await showConfirmDialog('重新抽取指引', msg);
        if (confirmed) {
            startDailyFlow(todayStr); // 強制重新抽取
        }
        return;
    }

    startDailyFlow(todayStr);
}

function startDailyFlow(todayStr) {
    if (AppState.gameState !== 'idle' && AppState.gameState !== 'rotating') return; // 防呆，允許在初始或重新洗牌旋轉中抽取

    // 先清理前一輪可能殘留的動畫資源
    cleanupDailyAnimation();
    
    // 設定狀態
    AppState.isDailyMode = true;
    AppState.gameState = 'finished'; // 跳過鏡頭互動
    AppState.userQuestion = '今日運勢與星辰指引';
    localStorage.setItem('dailyCardDate', todayStr);

    // 真隨機抽牌 (1張)
    AppState.selectedCards = [];
    AppState.usedCardIds.clear();
    const card = drawTrueRandomCard();
    if (!card) return;
    AppState.selectedCards.push(card);

    // 啟動華麗動畫
    const overlay = document.getElementById('daily-animation-overlay');
    const faceImg = document.getElementById('daily-card-face-img');
    const cardNameEl = document.getElementById('daily-card-name-reveal');
    const cardSubEl = document.getElementById('daily-card-sub-reveal');

    if (!overlay || !faceImg) {
        // fallback
        showAnalysis();
        return;
    }

    overlay.classList.remove('daily-perf-mobile', 'daily-perf-lite');

    // 每日一抽效能分級：手機/低功耗裝置自動降載
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobileViewport = window.innerWidth <= 768;
    const touchCapable = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const isMobileDevice = isMobileViewport || (touchCapable && window.innerWidth <= 1024);
    const cpuCores = Number(navigator.hardwareConcurrency) || 8;
    const memoryGB = Number(navigator.deviceMemory) || 8;
    const isLowPowerMobile = isMobileDevice && (cpuCores <= 4 || memoryGB <= 4);

    let perfTier = 'full';
    if (prefersReducedMotion || isLowPowerMobile) {
        perfTier = 'lite';
    } else if (isMobileDevice) {
        perfTier = 'mobile';
    }

    if (perfTier === 'mobile') overlay.classList.add('daily-perf-mobile');
    if (perfTier === 'lite') overlay.classList.add('daily-perf-lite');

    const dailyPerf = perfTier === 'full'
        ? {
            tier: 'full',
            enableParticles: true,
            particleCount: 120,
            burstCount: 150,
            particleFrameInterval: 16,
            useSimpleParticles: false,
            canvasScale: 1,
            fanCards: 19,
            scanDelay: 1600,
            sweepPrimary: 1200,
            sweepSecondary: 1200,
            sweepToChosen: 1000
        }
        : perfTier === 'mobile'
            ? {
                tier: 'mobile',
                enableParticles: true,
                particleCount: 56,
                burstCount: 70,
                particleFrameInterval: 33,
                useSimpleParticles: true,
                canvasScale: 0.8,
                fanCards: 15,
                scanDelay: 1000,
                sweepPrimary: 900,
                sweepSecondary: 900,
                sweepToChosen: 700
            }
            : {
                tier: 'lite',
                enableParticles: false,
                particleCount: 0,
                burstCount: 0,
                particleFrameInterval: 50,
                useSimpleParticles: true,
                canvasScale: 0.7,
                fanCards: 11,
                scanDelay: 700,
                sweepPrimary: 700,
                sweepSecondary: 700,
                sweepToChosen: 550
            };

    // 綁定圖檔
    faceImg.src = `assets/images/${card.name_short}.jpg`;
    if (card.isReversed) {
        faceImg.style.transform = 'rotate(180deg)';
    } else {
        faceImg.style.transform = 'none';
    }

    // 綁定揭示文字
    if (cardNameEl) {
        const orientText = card.isReversed ? '（逆位）' : '（正位）';
        cardNameEl.textContent = `✦ ${card.name} ${orientText} ✦`;
    }
    if (cardSubEl) {
        cardSubEl.textContent = card.en || '';
    }

    // ── Canvas 粒子系統初始化 ──
    const canvas = document.getElementById('daily-particle-canvas');
    _dailyParticleAnimId = null;
    let particles = [];

    if (canvas && dailyPerf.enableParticles) {
        const ctx = canvas.getContext('2d');
        const canvasScale = dailyPerf.canvasScale;
        canvas.width = Math.max(1, Math.floor(window.innerWidth * canvasScale));
        canvas.height = Math.max(1, Math.floor(window.innerHeight * canvasScale));
        let lastParticleFrameTime = 0;

        // 粒子生成函式
        function createParticle(burst) {
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            if (burst) {
                // 爆發型粒子（翻牌衝擊波）
                const angle = Math.random() * Math.PI * 2;
                const speed = (dailyPerf.useSimpleParticles ? 1.4 : 2) + Math.random() * (dailyPerf.useSimpleParticles ? 5 : 8);
                return {
                    x: cx, y: cy,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: (dailyPerf.useSimpleParticles ? 0.8 : 1) + Math.random() * (dailyPerf.useSimpleParticles ? 2.2 : 3),
                    opacity: 0.8 + Math.random() * 0.2,
                    decay: 0.008 + Math.random() * 0.015,
                    hue: 35 + Math.random() * 30, // 金色色調
                    type: 'burst'
                };
            }

            // 漂浮星塵
            return {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * (dailyPerf.useSimpleParticles ? 0.35 : 0.5),
                vy: -0.3 - Math.random() * (dailyPerf.useSimpleParticles ? 0.8 : 1.2),
                size: 0.5 + Math.random() * (dailyPerf.useSimpleParticles ? 1.5 : 2),
                opacity: 0.1 + Math.random() * 0.5,
                decay: 0.001 + Math.random() * 0.003,
                hue: 35 + Math.random() * 50,
                type: 'dust'
            };
        }

        // 初始粒子填充
        for (let i = 0; i < dailyPerf.particleCount; i++) {
            particles.push(createParticle(false));
        }

        // 繪製循環（手機降為較低幀率 + 簡化渲染）
        function drawParticles(now) {
            if ((now - lastParticleFrameTime) < dailyPerf.particleFrameInterval) {
                _dailyParticleAnimId = requestAnimationFrame(drawParticles);
                return;
            }
            lastParticleFrameTime = now;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.opacity -= p.decay;

                if (p.opacity <= 0) {
                    if (p.type === 'dust') {
                        // 漂浮星塵重生
                        particles[i] = createParticle(false);
                    } else {
                        particles.splice(i, 1);
                    }
                    continue;
                }

                if (dailyPerf.useSimpleParticles) {
                    // 手機簡化版：單層圓點，避免大量 radial gradient
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
                    ctx.fillStyle = `hsla(${p.hue}, 82%, ${p.type === 'burst' ? '72%' : '64%'}, ${p.opacity})`;
                    ctx.fill();
                } else {
                    // 桌機完整發光效果
                    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
                    gradient.addColorStop(0, `hsla(${p.hue}, 80%, 75%, ${p.opacity})`);
                    gradient.addColorStop(0.4, `hsla(${p.hue}, 70%, 60%, ${p.opacity * 0.5})`);
                    gradient.addColorStop(1, `hsla(${p.hue}, 60%, 50%, 0)`);

                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
                    ctx.fillStyle = gradient;
                    ctx.fill();

                    // 核心亮點
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
                    ctx.fillStyle = `hsla(${p.hue}, 90%, 90%, ${p.opacity})`;
                    ctx.fill();
                }
            }
            _dailyParticleAnimId = requestAnimationFrame(drawParticles);
        }

        _dailyParticleAnimId = requestAnimationFrame(drawParticles);
    } else if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // ── 動態產生扇形牌陣 ──
    const deckFan = document.getElementById('daily-deck-fan');
    let chosenIndex = 0;
    const totalFanCards = dailyPerf.fanCards;
    const midIndex = Math.floor(totalFanCards / 2);
    _dailyScanAnimId = null;
    const fanCards = []; // 存放所有牌 DOM 參考

    if (deckFan) {
        deckFan.innerHTML = '';
        chosenIndex = Math.floor(Math.random() * totalFanCards);

        // 產生牌
        for (let i = 0; i < totalFanCards; i++) {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'daily-deck-card';
            cardDiv.style.setProperty('--i', i);
            cardDiv.style.setProperty('--mid', midIndex);
            cardDiv.dataset.index = i;
            const img = document.createElement('img');
            img.src = 'assets/images/card_back.png';
            img.alt = '';
            cardDiv.appendChild(img);
            deckFan.appendChild(cardDiv);
            fanCards.push(cardDiv);
        }

        // 產生掃描光 DOM 元素
        const scanBeam = document.createElement('div');
        scanBeam.className = 'daily-scan-beam';
        deckFan.appendChild(scanBeam);

        // ── 掃描動畫 ──
        // 在牌陣展開後才開始掃描
        const SCAN_DELAY = dailyPerf.scanDelay; // 從動畫開始算，等牌全部展開後
        const SWEEP_RIGHT = dailyPerf.sweepPrimary; // 第一段擺掃花費 (ms)
        const SWEEP_LEFT = dailyPerf.sweepSecondary; // 第二段橫掃花費 (ms)
        const SWEEP_TO_CHOSEN = dailyPerf.sweepToChosen; // 收尾滑到選中牌 (ms)
        const TOTAL_SCAN = SWEEP_RIGHT + SWEEP_LEFT + SWEEP_TO_CHOSEN;
        let scanStartTime = null;
        const firstSweepToRight = Math.random() < 0.5;
        const firstEdge = firstSweepToRight ? (totalFanCards - 1) : 0;
        const secondEdge = firstSweepToRight ? 0 : (totalFanCards - 1);

        // 掃描未啟動前先固定在中央，避免一出現就跳邊緣
        scanBeam.style.transform = 'rotate(0deg) translateY(-20px)';

        function updateScan(now) {
            if (!scanStartTime) scanStartTime = now;
            const elapsed = now - scanStartTime;

            if (elapsed > TOTAL_SCAN) {
                // ── 掃描結束：選中牌亮起 ──
                scanBeam.style.opacity = '0';
                fanCards.forEach(c => c.classList.remove('peeking'));
                const chosenCard = fanCards[chosenIndex];
                if (chosenCard) chosenCard.classList.add('chosen');
                return; // 停止 rAF
            }

            // ── 計算目前掃描位置（0~最後一張的浮點數）──
            let scanPos;
            if (elapsed < SWEEP_RIGHT) {
                // Phase 1: 中間 -> 第一側（左或右，隨機）
                const t = elapsed / SWEEP_RIGHT;
                const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
                scanPos = midIndex + (firstEdge - midIndex) * eased;
            } else if (elapsed < SWEEP_RIGHT + SWEEP_LEFT) {
                // Phase 2: 第一側 -> 另一側
                const t = (elapsed - SWEEP_RIGHT) / SWEEP_LEFT;
                const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
                scanPos = firstEdge + (secondEdge - firstEdge) * eased;
            } else {
                // Phase 3: 另一側 -> 目標牌，ease-out 收斂
                const t = (elapsed - SWEEP_RIGHT - SWEEP_LEFT) / SWEEP_TO_CHOSEN;
                const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
                scanPos = secondEdge + (chosenIndex - secondEdge) * eased;
            }

            // ── 更新掃描光位置（跟牌同弧度）──
            const beamAngle = (scanPos - midIndex) * 4;
            scanBeam.style.transform = `rotate(${beamAngle}deg) translateY(-20px)`;

            // ── 掃到的牌上浮（peek）──
            fanCards.forEach((card, i) => {
                const dist = Math.abs(i - scanPos);
                if (dist < 1.2) {
                    card.classList.add('peeking');
                } else {
                    card.classList.remove('peeking');
                }
            });

            _dailyScanAnimId = requestAnimationFrame(updateScan);
        }

        // 延遲啟動掃描
        _dailyTimers.push(setTimeout(() => {
            _dailyScanAnimId = requestAnimationFrame(updateScan);
        }, SCAN_DELAY));
    }

    const scanTotalMs = dailyPerf.sweepPrimary + dailyPerf.sweepSecondary + dailyPerf.sweepToChosen;
    const stagePacing = dailyPerf.tier === 'full'
        ? {
            deckAt: 800,
            drawLag: 300,
            enterGap: 0,
            chargeGap: 1700,
            flipGap: 1300,
            revealGap: 2000,
            fadeGap: 2500,
            cleanupDelay: 1000
        }
        : dailyPerf.tier === 'mobile'
            ? {
                deckAt: 620,
                drawLag: 220,
                enterGap: 0,
                chargeGap: 1200,
                flipGap: 900,
                revealGap: 1400,
                fadeGap: 1700,
                cleanupDelay: 800
            }
            : {
                deckAt: 520,
                drawLag: 180,
                enterGap: 0,
                chargeGap: 1000,
                flipGap: 780,
                revealGap: 1150,
                fadeGap: 1450,
                cleanupDelay: 700
            };

    const STAGE_SHOW_AT = 50;
    const STAGE_DECK_AT = stagePacing.deckAt;
    const STAGE_DRAW_AT = dailyPerf.scanDelay + scanTotalMs + stagePacing.drawLag;
    const STAGE_ENTER_AT = STAGE_DRAW_AT + stagePacing.enterGap;
    const STAGE_CHARGE_AT = STAGE_ENTER_AT + stagePacing.chargeGap;
    const STAGE_FLIP_AT = STAGE_CHARGE_AT + stagePacing.flipGap;
    const STAGE_REVEAL_AT = STAGE_FLIP_AT + stagePacing.revealGap;
    const STAGE_FADEOUT_AT = STAGE_REVEAL_AT + stagePacing.fadeGap;
    const STAGE_CLEANUP_DELAY = stagePacing.cleanupDelay;

    function getChosenFanCard() {
        if (!deckFan) return null;

        const chosenCard = deckFan.querySelector('.daily-deck-card.chosen');
        if (chosenCard) return chosenCard;

        const fallbackCard = fanCards[chosenIndex];
        if (!fallbackCard) return null;

        fanCards.forEach(c => c.classList.remove('peeking'));
        fallbackCard.classList.add('chosen');
        return fallbackCard;
    }

    function prepareDailyCardEntryStart() {
        const cardStage = overlay.querySelector('.daily-card-stage');
        const chosenCard = getChosenFanCard();

        if (!cardStage || !chosenCard) return false;

        const chosenRect = chosenCard.getBoundingClientRect();
        const overlayRect = overlay.getBoundingClientRect();

        // 以 overlay 中心作為終點，避免上一輪殘留的 transform 影響對齊。
        const chosenCenterX = chosenRect.left + chosenRect.width / 2;
        const chosenCenterY = chosenRect.top + chosenRect.height / 2;
        const stageCenterX = overlayRect.left + overlayRect.width / 2;
        const stageCenterY = overlayRect.top + overlayRect.height / 2;

        const offsetX = chosenCenterX - stageCenterX;
        const offsetY = chosenCenterY - stageCenterY;

        const flipContainer = cardStage.querySelector('.daily-card-flip-container');
        const stageStyles = window.getComputedStyle(flipContainer || cardStage);
        const stageWidth = Number.parseFloat(stageStyles.width) || 250;
        const stageHeight = Number.parseFloat(stageStyles.height) || 425;
        const rawScaleX = chosenRect.width / stageWidth;
        const rawScaleY = chosenRect.height / stageHeight;
        const startScale = Math.max(0.22, Math.min(0.55, (rawScaleX + rawScaleY) / 2));

        const cardIndex = Number.parseFloat(chosenCard.style.getPropertyValue('--i'))
            || Number.parseFloat(chosenCard.dataset.index || '0')
            || 0;
        const fanMid = Number.parseFloat(chosenCard.style.getPropertyValue('--mid'))
            || midIndex;
        const startRotate = (cardIndex - fanMid) * 4;

        cardStage.style.setProperty('--start-x', `${offsetX}px`);
        cardStage.style.setProperty('--start-y', `${offsetY}px`);
        cardStage.style.setProperty('--start-scale', startScale.toFixed(4));
        cardStage.style.setProperty('--start-rot', `${startRotate}deg`);

        // 強制重排，確保下一階段從這個扇形牌位置開始 transition。
        cardStage.offsetHeight;
        return true;
    }

    // ── 清除所有 class，重置動畫 ──
    overlay.classList.remove('hidden', 'show', 'stage-deck', 'stage-draw', 'stage-enter', 'stage-charge', 'stage-flip', 'stage-reveal', 'stage-fadeout');

    // ── Stage 1 (50ms): 背景漸隱出現 + 魔法陣 + 符文 + 星塵 ──
    _dailyTimers.push(setTimeout(() => {
        overlay.classList.add('show');
    }, STAGE_SHOW_AT));

    // ── Stage 2 (800ms): 扇形牌陣展開 ──
    _dailyTimers.push(setTimeout(() => {
        overlay.classList.add('stage-deck');
    }, STAGE_DECK_AT));

    // -- 掃描結束時間 = dailyPerf.scanDelay + (sweepPrimary + sweepSecondary + sweepToChosen) --

    // ── Stage 3 (5300ms): 直接從選中牌原始位置飛入，避免扇形牌先跑向中央 ──
    _dailyTimers.push(setTimeout(() => {
        prepareDailyCardEntryStart();
        overlay.classList.remove('stage-deck', 'stage-draw');
        overlay.classList.add('stage-enter');
    }, STAGE_DRAW_AT));

    // ── Stage 5 (8200ms): 能量蓄積 — 卡牌微縮暗化再亮起 ──
    _dailyTimers.push(setTimeout(() => {
        overlay.classList.add('stage-charge');
    }, STAGE_CHARGE_AT));

    // ── Stage 6 (9500ms): 翻牌 + 衝擊波 + 螢幕震動 + 鏡頭光暈 ──
    _dailyTimers.push(setTimeout(() => {
        overlay.classList.remove('stage-charge');
        overlay.classList.add('stage-flip');

        // 爆發粒子
        if (canvas && dailyPerf.enableParticles && dailyPerf.burstCount > 0) {
            for (let i = 0; i < dailyPerf.burstCount; i++) {
                particles.push(
                    (function() {
                        const cx = canvas.width / 2;
                        const cy = canvas.height / 2;
                        const angle = Math.random() * Math.PI * 2;
                        const speed = (dailyPerf.useSimpleParticles ? 1.4 : 2) + Math.random() * (dailyPerf.useSimpleParticles ? 5 : 8);
                        return {
                            x: cx, y: cy,
                            vx: Math.cos(angle) * speed,
                            vy: Math.sin(angle) * speed,
                            size: (dailyPerf.useSimpleParticles ? 0.8 : 1) + Math.random() * (dailyPerf.useSimpleParticles ? 2.2 : 3),
                            opacity: 0.8 + Math.random() * 0.2,
                            decay: 0.008 + Math.random() * 0.015,
                            hue: 35 + Math.random() * 30,
                            type: 'burst'
                        };
                    })()
                );
            }
        }
    }, STAGE_FLIP_AT));

    // ── Stage 7 (11500ms): 揭示牌名文字 ──
    _dailyTimers.push(setTimeout(() => {
        overlay.classList.add('stage-reveal');
    }, STAGE_REVEAL_AT));

    // ── Stage 8 (14000ms): 淡出 → 進入解析畫面 ──
    _dailyTimers.push(setTimeout(() => {
        overlay.classList.add('stage-fadeout');

        // 等淡出完成後清理並進入分析
        _dailyTimers.push(setTimeout(() => {
            // 使用統一清理函式釋放所有資源
            cleanupDailyAnimation();
            particles = [];
            showAnalysis();
        }, STAGE_CLEANUP_DELAY));
    }, STAGE_FADEOUT_AT));
}
