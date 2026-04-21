# 專案記憶 (Project Memory)

## 專案內容
- **名稱**: Tarot Cards (聖境塔羅)
- **定位**: 一個結合美學、現代、直覺與流暢感的手勢塔羅應用。

## 已完成關鍵功能與決策
- [2026-04-14] 專案初始化。
- 使用 HTML5, Vanilla CSS, 純 JavaScript。
- 設計主標題、副標體及精美光影動畫。
- 提交 Git Commit (feat: 初始化聖境塔羅專案)。
- [2026-04-14] 導入 MediaPipe Hands 手勢選牌，並優化後端手勢邏輯，實現操作(開手)、停(握拳)與選定(一指)動畫與流程。
- [2026-04-14] 大量調整 UI 與架構，將卡牌排列改為 3D 圓環 (Carousel)，並加入 3D 景深與卡片旋轉定位引導效果。
- [2026-04-14] 實作 Deckaura 視覺風格：深色背景、金色發光、磨砂玻璃、特選符號(Unicode)與精緻字體。
- [2026-04-14] 對接 tarotapi.dev REST API (ekelen/tarot-api) 取得 78 張 Rider-Waite-Smith 牌組資料，處理正/逆位與對話語境。同步建立內建 78 張牌庫字典檔 `tarot_dict.js` 作為備援。
- [2026-04-14] 將 3D 卡牌換為 `sacred-texts.com` 的典藏版塔羅圖片，並保留在背景 Overlay 顯示名稱，確保視覺與意涵一致讀取。
- [2026-04-14] 重構 3D 引擎由 `rotateY` 改為視覺差投影算法（透過 `updateCardPositions()`），渲染出前大後小的環。新增卡牌飛入 slot 動畫（fixed 定位 + CSS transition）。平滑顯示牌陣，才翻牌。
- [2026-04-14] 修正佈局(body 100vh + overflow:hidden)，確保精簡 header/carousel/slot 區域，新增 max-height media query。
- [2026-04-15] 檢討 drawRandomCard() 機制：目前使用 Math.random()(PRNG)，對機率公平性尚可。建議若需求更高公平性可換用 crypto.getRandomValues() + 伺服器端洗牌系統。結論：當前用途足夠，暫維持。
- [2026-04-15] 修正選牌邏輯：原本使用者只能從環上 12 張挑（其餘 66 張抽不到），改為確保翻牌時才從 78 張牌陣真隨機中選一張(drawTrueRandomCard)，環上展示僅為效果。新增 updateCardFrontDOM() 在翻牌前換牌面。
- [2026-04-15] 新增 AI 模式選項：設定中加入下拉選單，支援 Gemini 3 Flash 與 Gemma 4 31B 兩種模型，透過- **資料儲存**：
  - AI API Key、模型偏好存於 `localStorage` (不傳輸至伺服器)。
  - 歷史占卜日誌儲存於瀏覽器內建 `IndexedDB` (`CelestialTarotDB`)，支援大量數據存儲。'gemini_model') 動態切換 API endpoint。提示詞 modal 會顯示目前使用模型名稱。
- [2026-04-15] PWA 支援：新增 manifest.json(含名稱、圖片、色調)、sw.js(Cache-First Service Worker)、icons 目錄(SVG 格式 192/512 圖片)。index.html 加入 PWA meta 標籤與 SW 註冊。支援桌面端與行動端安裝。
- [2026-04-15] 預設模型改為 gemma-4-31b-it：所有 fallback 都從 gemini-3-flash-preview 改為 gemma-4-31b-it，select 預設選項調為 Gemma 4 31B。
- [2026-04-15] API Key 取得教學：在設定 Modal 的 API Key 輸入框下方新增 Google AI Studio 連結位置、詳細教學語。
- [2026-04-15] 閱牌功能：完成 3 張牌的綜合啟示圖產生與儲存功能（提問 + 聖靈導引 + 卡牌與正逆位 + 解讀重點內容文字），AI 解讀採非同步 Promise。
- [2026-04-15] 螢幕恆亮：透過 Screen Wake Lock API 在選牌時防止螢幕自動熄滅，中斷時自動恢復。
- [2026-04-15] 讀解簡化：顯示 Modal 只保留重要的啟示解讀內容，其餘資訊列表化。

## 慣例與原則
- 使用繁體中文台灣用語。
- 專案文件（README、memory.md 等）預設使用繁體中文。
- 簡潔、開發流程：HTML 結構 -> CSS 設計系統 -> JS 邏輯。
- 每次異動必記 `walkthrough.md`。

## 2026-04-16 - Tarot Cards PWA 與效能調整
- **PWA Service Worker 快取策略**：針對要求每次都要開啟到最新版，將 `sw.js` 中的 `Cache-First` 策略更改為 `Network-First`，確保每次優先向網路要求成功才快取。若斷網則 fallback 到 Cache 提供離線能力。
- **手機端 MediaPipe 影像卡頓防治**：為了不讓手機因鏡頭連拍導致主線程卡死，實作了防堵塞鎖（`isProcessingFrame`），當一幀在分析時若 Camera 給另一幀，直接丟棄 (Drop frame)。並將手機的攝影解析度從 `640x480` 降為 `320x240`。
- **3D Array 減壓**：為降低手機 3D 和重繪壓力，在手機將 `numberOfCards` （旋轉卡牌總張數）從 10 降為 8 張。
- **漸層背景切換注意**：不要透過隱藏父級 `container` 來停止動畫，這會導致 `background: radial-gradient` 消失而造成畫面嚴重閃黑。
- **功能新增**：提問欄位增加「清空」按鈕，方便快速重置輸入。

## 2026-04-21 - Code Review 修復
- **XSS 安全修補**：新增 `escapeHtml()` 函式，AI 回應與錯誤訊息在插入 DOM 前先做 HTML 跳脫處理，防止潛在的 XSS 注入。
- **latestGuidanceText 修復**：原本為死碼（清空後從未寫回），修正為在 AI 成功回傳後寫入，使圖片匯出能直接使用。
- **mediaPipeInitialized 重置**：攝影機關閉時一併重置此旗標，避免重新洗牌時走到錯誤的早期返回邏輯。
- ✅ 完成 **PWA 部署與離線支援**，並補齊 `CORE_ASSETS` 以確保離線無虞。
- ✅ 實作 **IndexedDB 占卜日誌**，讓使用者能保存並隨時回顧歷史紀錄。從 2 個 JS 模組擴充至全部 9 個，確保離線首次訪問不會缺少資源。SW 註解同步由「Cache-First」更正為「Network-First」。
- **行尾字元統一**：`app.js` 從 CRLF 轉換為 LF，新增 `.gitattributes` 設定 `* text=auto eol=lf`。
