/* ============================
   手勢辨識與 MediaPipe 控制
   ============================ */
let _mediaPipeSessionId = 0;

function stopMediaPipeCamera(reason = 'manual-stop') {
    _mediaPipeSessionId++;

    if (AppState.mpCamera) {
        try {
            AppState.mpCamera.stop();
            console.log(`[聖境塔羅] 攝影機已停止：${reason}`);
        } catch (err) {
            console.warn('[聖境塔羅] 停止攝影機時發生錯誤:', err);
        }
    }

    const videoElement = document.getElementById('videoElement');
    if (videoElement && videoElement.srcObject && typeof videoElement.srcObject.getTracks === 'function') {
        videoElement.srcObject.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
    }

    AppState.mpCamera = null;
    AppState.mediaPipeInitialized = false;
    AppState.mediaPipeRunning = false;
    AppState.mediaPipeStarting = false;
}

function initMediaPipe() {
    const videoElement = document.getElementById('videoElement');

    if (typeof Hands === 'undefined') {
        console.error('[聖境塔羅] MediaPipe Hands 未載入！');
        updateInstruction('❌ MediaPipe 載入失敗，請確認網路連線');
        return;
    }

    if (AppState.mediaPipeRunning || AppState.mediaPipeStarting) {
        updateInstruction('🔄 轉動中... 請【握拳 ✊】停留');
        return;
    }

    if (AppState.mpCamera) {
        stopMediaPipeCamera('replace-stale-camera');
    }

    const isMobile = window.innerWidth <= 768;

    if (!AppState.mpHands) {
        AppState.mpHands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        AppState.mpHands.setOptions({
            maxNumHands: 1,
            modelComplexity: isMobile ? 0 : 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        AppState.mpHands.onResults(onHandResults);
    }

    if (typeof Camera === 'undefined') {
        console.error('[聖境塔羅] MediaPipe Camera 未載入！');
        updateInstruction('❌ Camera 工具載入失敗');
        return;
    }

    let isProcessingFrame = false;

    AppState.mpCamera = new Camera(videoElement, {
        onFrame: async () => {
            if (AppState.isDailyMode || AppState.gameState === 'finished') return;
            if (AppState.mpHands && !isProcessingFrame) {
                isProcessingFrame = true;
                try {
                    await AppState.mpHands.send({ image: videoElement });
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

    AppState.mediaPipeStarting = true;
    const sessionId = ++_mediaPipeSessionId;
    AppState.mpCamera.start()
        .then(() => {
            if (sessionId !== _mediaPipeSessionId) return;
            console.log('[聖境塔羅] ✅ 鏡頭啟動成功！');
            AppState.mediaPipeInitialized = true;
            AppState.mediaPipeRunning = true;
            AppState.mediaPipeStarting = false;
            updateInstruction('🔄 轉動中... 請【握拳 ✊】停留');
        })
        .catch((err) => {
            if (sessionId !== _mediaPipeSessionId) return;
            console.error('[聖境塔羅] ❌ 鏡頭啟動失敗:', err);
            AppState.mediaPipeInitialized = false;
            AppState.mediaPipeRunning = false;
            AppState.mediaPipeStarting = false;
            AppState.mpCamera = null;
            updateInstruction('❌ 無法啟動鏡頭，請允許瀏覽器存取攝影機權限後重新整理');
        });
}

function onHandResults(results) {
    if (AppState.isDailyMode || AppState.gameState === 'finished') return;

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        return;
    }

    const landmarks = results.multiHandLandmarks[0];

    const isIndexExtended = landmarks[8].y < landmarks[6].y;
    const isMiddleExtended = landmarks[12].y < landmarks[10].y;
    const isRingExtended = landmarks[16].y < landmarks[14].y;
    const isPinkyExtended = landmarks[20].y < landmarks[18].y;

    const fingersUp = [isIndexExtended, isMiddleExtended, isRingExtended, isPinkyExtended];
    const countUp = fingersUp.filter(Boolean).length;

    const isOpenPalm = countUp >= 3;
    const isClosedFist = countUp === 0;
    const isPointing = isIndexExtended &&
        !isMiddleExtended &&
        !isRingExtended &&
        !isPinkyExtended &&
        (landmarks[12].y - landmarks[8].y > 0.08);

    if (isOpenPalm && !isPointing) {
        triggerGesture('open_palm');
    } else if (isClosedFist) {
        triggerGesture('closed_fist');
    } else if (isPointing && AppState.gameState === 'stopped') {
        triggerGesture('pointing');
    }
}

function triggerGesture(gesture) {
    const now = Date.now();
    if (now - AppState.lastGestureTime < AppState.GESTURE_COOLDOWN) return;

    if (gesture === 'open_palm' && (AppState.gameState === 'idle' || AppState.gameState === 'stopped')) {
        AppState.gameState = 'rotating';
        updateInstruction('🔄 轉動中... 請【握拳 ✊】停留');
        AppState.lastGestureTime = now;
    } else if (gesture === 'closed_fist' && AppState.gameState === 'rotating') {
        stopCardRing();
        updateInstruction('已鎖定！請【比 1 ☝️】翻牌，或【張開手掌 🖐】重轉');
        AppState.lastGestureTime = now;
    } else if (gesture === 'pointing' && AppState.gameState === 'stopped') {
        confirmSelection();
        AppState.lastGestureTime = now;
    }
}
