/* ============================
   全域狀態（集中管理）
   所有模組透過 AppState.xxx 存取，方便 grep 追蹤來源
   ============================ */
const AppState = {
    // MediaPipe 實體
    mpHands: null,
    mpCamera: null,
    mediaPipeInitialized: false,
    mediaPipeRunning: false,
    mediaPipeStarting: false,

    // 遊戲狀態：idle | rotating | stopped | finished
    gameState: 'idle',
    isDailyMode: false,
    // 牌陣模式：'three-card' | 'celtic-cross'
    spreadMode: 'three-card',
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
    ringAnimationRunning: false,
    spreadRadius: 300,         // 扇形展開的水平半徑 (px)
    cardElements: [],          // 儲存生成的卡牌 DOM 元素
    lastFrameTime: 0,          // delta-time 用，紀錄上一幀時間戳

    // 螢幕恆亮 (Wake Lock)
    wakeLockSentinel: null
};

/* ============================
   聖十字牌陣（Celtic Cross）10 牌位定義
   ============================ */
const CELTIC_CROSS_POSITIONS = [
    { id: 1, name: '現況', en: 'The Present', desc: '問題的核心，當前處境' },
    { id: 2, name: '挑戰', en: 'The Challenge', desc: '橫跨的阻礙或衝突', rotated: true },
    { id: 3, name: '理想', en: 'The Ideal', desc: '意識中的期望與目標' },
    { id: 4, name: '基礎', en: 'The Foundation', desc: '深層的基礎或潛意識' },
    { id: 5, name: '過去', en: 'The Past', desc: '導致現況的根本原因' },
    { id: 6, name: '未來', en: 'The Future', desc: '即將面臨的影響' },
    { id: 7, name: '自我態度', en: 'The Self', desc: '當前的心態與立場' },
    { id: 8, name: '外在環境', en: 'External Influences', desc: '外部人事物的影響' },
    { id: 9, name: '希望與恐懼', en: 'Hopes & Fears', desc: '內心的期待與焦慮' },
    { id: 10, name: '最終結果', en: 'The Outcome', desc: '維持現有軌跡的最終走向' }
];

