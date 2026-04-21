/* ============================
   全域狀態（集中管理）
   所有模組透過 AppState.xxx 存取，方便 grep 追蹤來源
   ============================ */
const AppState = {
    // MediaPipe 實體
    mpHands: null,
    mpCamera: null,
    mediaPipeInitialized: false,

    // 遊戲狀態：idle | rotating | stopped | finished
    gameState: 'idle',
    selectedCards: [],
    userQuestion: '',
    latestGuidanceText: '',
    saveImageBusy: false,

    // 牌庫載入狀態
    apiCardsLoaded: false,

    // 已使用的卡牌 ID 集合（防止重複抽到同一張）
    usedCardIds: new Set(),

    // 環上每個位置對應的卡牌資料
    ringCardData: [],

    // 手勢防抖（避免連續觸發）
    lastGestureTime: 0,
    GESTURE_COOLDOWN: 600,  // ms（常數，但放在 namespace 方便集中管理）

    // 3D 圓環架構狀態
    numberOfCards: 10,         // 環上的牌數
    currentRotation: 0,        // 當前環的邏輯旋轉角度
    targetRotationSpeed: 1.2,  // 每影格旋轉度數
    activeCardIndex: 0,        // 正前方面對使用者的卡片索引
    carouselEl: null,
    animationFrameId: null,
    spreadRadius: 300,         // 扇形展開的水平半徑 (px)
    cardElements: [],          // 儲存生成的卡牌 DOM 元素
    lastFrameTime: 0,          // delta-time 用，紀錄上一幀時間戳

    // 螢幕恆亮 (Wake Lock)
    wakeLockSentinel: null
};
