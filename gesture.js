/* ============================
   手勢辨識與 MediaPipe 控制
   ============================ */
function initMediaPipe() {
    const videoElement = document.getElementById('videoElement');

    if (typeof Hands === 'undefined') {
        console.error('[聖境塔羅] MediaPipe Hands 未載入！');
        updateInstruction('❌ MediaPipe 載入失敗，請確認網路連線');
        return;
    }

    if (mpCamera && mediaPipeInitialized) {
        console.log('[聖境塔羅] 重新啟動既有攝影機實體');
        mpCamera.start()
            .then(() => {
                updateInstruction('🔄 轉動中... 請【握拳 ✊】停留');
            })
            .catch(err => {
                console.error('[聖境塔羅] 重新啟動失敗:', err);
                updateInstruction('❌ 攝影機重新啟動失敗');
            });
        return;
    }

    const isMobile = window.innerWidth <= 768;

    if (!mpHands) {
        mpHands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        mpHands.setOptions({
            maxNumHands: 1,
            modelComplexity: isMobile ? 0 : 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        mpHands.onResults(onHandResults);
    }

    if (typeof Camera === 'undefined') {
        console.error('[聖境塔羅] MediaPipe Camera 未載入！');
        updateInstruction('❌ Camera 工具載入失敗');
        return;
    }

    let isProcessingFrame = false;

    mpCamera = new Camera(videoElement, {
        onFrame: async () => {
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

function onHandResults(results) {
    if (gameState === 'finished') return;

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
    } else if (isPointing && gameState === 'stopped') {
        triggerGesture('pointing');
    }
}

function triggerGesture(gesture) {
    const now = Date.now();
    if (now - lastGestureTime < GESTURE_COOLDOWN) return;

    if (gesture === 'open_palm' && (gameState === 'idle' || gameState === 'stopped')) {
        gameState = 'rotating';
        updateInstruction('🔄 轉動中... 請【握拳 ✊】停留');
        lastGestureTime = now;
    } else if (gesture === 'closed_fist' && gameState === 'rotating') {
        stopCardRing();
        updateInstruction('已鎖定！請【比 1 ☝️】翻牌，或【張開手掌 🖐】重轉');
        lastGestureTime = now;
    } else if (gesture === 'pointing' && gameState === 'stopped') {
        confirmSelection();
        lastGestureTime = now;
    }
}
