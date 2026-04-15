# 專案記憶 (Project Memory)

## 專案內容
- **名稱**: Tarot Cards (塔羅牌應用)
- **願景**: 一個美觀、現代且具互動性的塔羅牌網頁應用。

## 關鍵提示詞與決策
- [2026-04-14] 初始化專案。
- 採用 HTML5, Vanilla CSS, 及原生 JavaScript。
- 設計風格追求高質感、神祕感，並包含豐富的微動畫。
- 完成首次 Git Commit (feat: 初始化聖境塔羅專案)。
- [2026-04-14] 導入 MediaPipe Hands 手勢辨識，決策將攝像頭畫面設為背景隱藏，並實作張開手掌(旋轉)、握拳(停留)與食指往上滑(確認)的互動抽牌流程。
- [2026-04-14] 大幅重構 UI 與邏輯，將卡牌陣列改為 3D 環形旋轉 (Carousel)，並加入 3D 卡背與食指上滑翻開正面的物理沉浸感效果。
- [2026-04-14] 升級至 Deckaura 風格視覺：多層漸層牌背、雙層幾何裝飾框、四角星芒、正面專屬符號圖騰(Unicode)與羅馬數字排版。
- [2026-04-14] 串接 tarotapi.dev REST API (ekelen/tarot-api)，取得完整 78 張 Rider-Waite-Smith 牌組資料，含正位/逆位意義與描述。同時建立包含 78 張卡牌口語化繁體中文字典檔 `tarot_dict.js` 來覆寫英文資料。
- [2026-04-14] 將 3D 卡牌的正面改為直接顯示 `sacred-texts.com` 的原始萊德偉特塔羅牌圖片，並保留底部半透明漸層 Overlay 來顯示中文名稱，確保「原味圖案與在地化文字」兼具的華麗體驗。
- [2026-04-14] 重構 3D 圓環：從整體容器 `rotateY` 改為逐卡片計算的扇形景深佈局（`updateCardPositions()`），實現焦點卡放大+兩側遞減的立體感。新增卡牌飛入 slot 的過場動畫（fixed 定位 + CSS transition）。旋轉時全部顯示卡背，選取後才翻面。
- [2026-04-14] 五項功能修正：(1) 新增重新抽牌按鈕與 `resetGame()`；(2) 將開啟按鈕移到頁面上方；(3) 改為從 78 張牌隨機抽取，翻牌後補上新牌（`drawRandomCard()`+`refillCardSlot()`）；(4) 飛入動畫改用 clone 元素掛 body，解決 3D perspective 干擾路徑問題；(5) slot 顯示卡牌正面圖片。
- [2026-04-14] 版面改為一屏式（body 100vh + overflow:hidden），縮小 header/carousel/slot 尺寸，新增 max-height media query。
- [2026-04-15] 審查 drawRandomCard() 隨機性：目前使用 Math.random()（PRNG），統計上公平但非密碼學安全。建議若需更高安全等級可改用 crypto.getRandomValues() + 拒絕取樣消除模取偏差。結論：娛樂用途已足夠，付費場景建議升級。
- [2026-04-15] 修正抽牌範圍問題：原本使用者只能從環上 12 張牌中選取（66 張牌無機會），改為確認選牌時才從全部 78 張牌庫中真隨機抽取（drawTrueRandomCard），環上展示僅為視覺效果。新增 updateCardFrontDOM() 在翻牌前替換卡牌正面。
- [2026-04-15] 新增 AI 模型切換功能：設定面板加入下拉選單，支援 Gemini 3 Flash 與 Gemma 4 31B 兩個模型，透過 AI_MODELS 對照表與 localStorage('gemini_model') 動態切換 API endpoint。解牌 modal 標頭顯示目前使用的模型名稱。
- [2026-04-15] PWA 化：新增 manifest.json（應用名稱、圖示、主題色）、sw.js（Cache-First Service Worker）、icons 目錄（SVG 格式 192/512 圖示）。index.html 加入 PWA meta 標籤與 SW 註冊。支援離線訪問與桌面安裝。
- [2026-04-15] 預設模型改為 gemma-4-31b-it：所有 fallback 值從 gemini-3-flash-preview 改為 gemma-4-31b-it，select 預設選項調整為 Gemma 4 31B。
- [2026-04-15] API Key 取得教學：設定 Modal 中 API Key 輸入框下方新增 Google AI Studio 連結與三步驟教學說明。
- [2026-04-15] 精美等待畫面：選完 3 張牌後進入全螢幕「星辰編織」等待畫面（三層旋轉星環 + 發光核心 + 卡牌縮圖浮動 + 呼吸燈文字），AI 分析完成後淡出切換到解牌 Modal。fetchGeminiAnalysis 重構為純資料層 Promise。
- [2026-04-15] 螢幕恆亮：透過 Screen Wake Lock API 防止手勢操作時螢幕自動休眠，頁面重新可見時自動恢復。
- [2026-04-15] 解牌簡化：星辰指引 Modal 中只顯示抽到的正位或逆位意義，不再同時列出兩者。

## 慣例與規則
- 使用繁體中文進行所有說明與註解。
- 遵循進步型開發流程：HTML 結構 -> CSS 設計系統 -> JS 邏輯。
- 每次更動需記錄於 `walkthrough.md`。
