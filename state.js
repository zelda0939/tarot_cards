/* ============================
   全域狀態（集中管理）
   ============================ */
let mpHands = null;
let mpCamera = null;
let gameState = 'idle';        // idle | rotating | stopped | finished
let selectedCards = [];
let userQuestion = '';
let latestGuidanceText = '';
let saveImageBusy = false;

// 牌庫載入狀態
let apiCardsLoaded = false;

// 已使用的卡牌 ID 集合（防止重複抽到同一張）
let usedCardIds = new Set();

// 環上每個位置對應的卡牌資料
let ringCardData = [];

// 手勢防抖（避免連續觸發）
let lastGestureTime = 0;
const GESTURE_COOLDOWN = 600;  // ms

// 3D 圓環架構狀態
let numberOfCards = 10;        // 環上的牌數
let currentRotation = 0;       // 當前環的邏輯旋轉角度
let targetRotationSpeed = 1.2; // 每影格旋轉度數
let activeCardIndex = 0;       // 正前方面對使用者的卡片索引
let carouselEl = null;
let animationFrameId = null;
let spreadRadius = 300;        // 扇形展開的水平半徑 (px)
let cardElements = [];         // 儲存生成的卡牌 DOM 元素
let lastFrameTime = 0;         // delta-time 用，紀錄上一幀時間戳

// MediaPipe 是否已初始化
let mediaPipeInitialized = false;

// 螢幕恆亮 (Wake Lock)
let wakeLockSentinel = null;
