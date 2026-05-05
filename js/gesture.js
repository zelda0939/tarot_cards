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

async function initMediaPipe() {
    const videoElement = document.getElementById('videoElement');

    if (typeof Hands === 'undefined') {
        console.error('[聖境塔羅] MediaPipe Hands 未載入！');
        updateInstruction('❌ MediaPipe 載入失敗，請確認網路連線');
        return false;
    }

    if (AppState.mediaPipeRunning || AppState.mediaPipeStarting) {
        updateInstruction('🔄 轉動中... 請【握拳 ✊】停留');
        return true;
    }

    if (AppState.mpCamera) {
        stopMediaPipeCamera('replace-stale-camera');
    }

    const isMobile = window.innerWidth <= 768;

    if (!AppState.mpHands) {
        updateInstruction('🔮 正在載入星辰視覺模型...');
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
        
        // 預先載入模型，避免第一幀送入時才同步載入霸佔主執行緒
        try {
            await AppState.mpHands.initialize();
        } catch (e) {
            console.warn('[MediaPipe] 模型預載入失敗:', e);
        }
    }

    if (typeof Camera === 'undefined') {
        console.error('[聖境塔羅] MediaPipe Camera 未載入！');
        updateInstruction('❌ Camera 工具載入失敗');
        return false;
    }

    return new Promise((resolve) => {
        AppState.mediaPipeStarting = true;
        const sessionId = ++_mediaPipeSessionId;
        
        let firstFrameResolved = false;
        let isProcessingFrame = false;
        // 手機上每隔多幀才送辨識，降低 CPU 與卡牌環 rAF 的競爭
        let _mpFrameCount = 0;
        const _mpFrameSkip = isMobile ? 5 : 2;

        AppState.mpCamera = new Camera(videoElement, {
            onFrame: () => {
                if (AppState.isDailyMode || AppState.gameState === 'finished') return;
                _mpFrameCount++;
                
                // 在暖機完成前，我們不跳幀，盡快抓取第一張畫面給模型！
                if (firstFrameResolved && _mpFrameCount % _mpFrameSkip !== 0) return; 

                if (AppState.mpHands && !isProcessingFrame) {
                    isProcessingFrame = true;
                    // 利用 setTimeout 讓出主執行緒，確保卡牌動畫(rAF)不會被阻塞
                    setTimeout(async () => {
                        try {
                            await AppState.mpHands.send({ image: videoElement });
                            
                            // 🔥 關鍵修復：第一張影像成功推論後（WebGL Shader 編譯完成），才結束等待狀態並開始旋轉！
                            if (!firstFrameResolved && sessionId === _mediaPipeSessionId) {
                                firstFrameResolved = true;
                                console.log('[聖境塔羅] ✅ 鏡頭開啟與視覺模型暖機完成！');
                                AppState.mediaPipeInitialized = true;
                                AppState.mediaPipeRunning = true;
                                AppState.mediaPipeStarting = false;
                                resolve(true);
                            }
                        } catch (e) {
                            console.error('[MediaPipe] 偵測錯誤:', e);
                        } finally {
                            isProcessingFrame = false;
                        }
                    }, 0);
                }
            },
            facingMode: 'user',
            width: isMobile ? 320 : 640,
            height: isMobile ? 240 : 480
        });

        AppState.mpCamera.start()
            .then(() => {
                if (sessionId !== _mediaPipeSessionId) {
                    resolve(false);
                    return;
                }
                console.log('[聖境塔羅] 📷 鏡頭已開啟，等待模型首幀暖機...');
                // 不要在這裡 resolve，等待 onFrame 第一張推論完成
            })
            .catch((err) => {
                if (sessionId !== _mediaPipeSessionId) {
                    resolve(false);
                    return;
                }
                console.error('[聖境塔羅] ❌ 鏡頭啟動失敗:', err);
                AppState.mediaPipeInitialized = false;
                AppState.mediaPipeRunning = false;
                AppState.mediaPipeStarting = false;
                AppState.mpCamera = null;
                updateInstruction('❌ 無法啟動鏡頭，請允許瀏覽器存取攝影機權限後重新整理');
                resolve(false);
            });
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
