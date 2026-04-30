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

## 2026-04-21 - 每日指引 (Daily Card) 實作
- **功能定位**：於首頁新增不須經由手勢互動與提問的「一鍵抽牌」入口，培養使用者高頻次回訪率。
- **純 CSS 動畫分離**：為配合「每日一抽極致流暢」的體驗，獨立開發專屬單卡翻轉 3D 特效與背景光晕(`#daily-animation-overlay`)，保證視覺衝擊效果。
- **特規 Prompt 與排版優化**：
  - `AppState.isDailyMode` 切換：此模式下向 AI 送出的提問與規則改變，強制輸出「今日主題 / 重點建議 / 綜合指引」。
  - 獨立相容圖片的單機匯出：單卡的產生圖片(`buildGuidanceImageCanvas`)自動置中佈局放寬文字段落長度，產出類似神諭卡的高級感。
  - 防呆保護：使用 `localStorage.getItem('dailyCardDate')` 紀錄今日日期，同日再次點擊會遭到攔截。
- [2026-04-24] Bug Fix: 修正 `index.html` 每日指引卡背圖檔副檔名錯誤 (由 `.jpg` 改為 `.png`)。
- [2026-04-24] Bug Fix: 統一 `showConfirmDialog` 實作為 Promise 基礎版本至 `ui.js`，解決了因 `history.js` 載入順序覆蓋函數並造成閉包箭頭函數意外被轉換成字串渲染在提示彈跳窗的臭蟲。
- [2026-04-24] Bug Fix: 修正匯出圖片 `js/imageExport.js` 的每日一抽（單卡模式）會遺留 `ctx.textAlign = 'center'` 給下分段 星辰指引區塊的排版問題，補上重新歸零 `left`。
- [2026-04-24] UX 優化: 在 `app.js` 的 `resetGame` 中加入判斷，如果是從「每日一抽」結束後點擊重新抽牌，會自動清空前一次隱性設定的「今日運勢...」提問以及輸入框，避免異常沿用到下一次的手勢抽牌。

## 2026-04-24 - 每日一抽動畫大改版
- **特效升級**：完全重構每日一抽動畫系統，由簡單的 CSS 翻牌改為多階段魔幻開牌儀式（總長約 15s）：
  - Stage 1 (50ms): 背景漸入 + 星雲呼吸 + 雙層公轉光芒 + SVG 魔法陣旋轉 + 浮遊符文
  - Stage 2 (800ms): **19 張密集扇形牌陣動態展開**（JS 動態產生，CSS `--i`/`--mid` 控制扇角）
  - **掃描系統 (1600ms~5000ms)**：requestAnimationFrame 驅動的掃描光柱（真實 DOM `.daily-scan-beam`），三階段路徑：
    - Phase 1: 左→右完整掃一遍 (1.2s)
    - Phase 2: 右→左回掃 (1.2s)
    - Phase 3: 從左側漸慢滑到隨機選中牌位置 (1.0s, ease-out)
    - **掃到的牌會微微上浮** (`.peeking` class, translateY -38px)，掃過後沉回原位 (0.4s ease-in)
    - 掃描結束後選中牌閃金光彈起 (`cardChosenGlow` 動畫)
  - Stage 3 (5300ms): 選中牌被上浮抽出（scale 1.3，至 translateY -90px），其餘牌散開模糊消失
  - Stage 4 (6500ms): 主卡牌從抽出牌的位置（scale 0.42, translateY -90px）無縫接替，並滑動放大至畫面正中央 + 光暈環(Aura)脈動
  - Stage 5 (8200ms): 能量蓄積（暗化微縮再亮起）
  - Stage 6 (9500ms): 540° 翻牌 + 多層衝擊波 + 螢幕震動 + 鏡頭光暈 + 150 顆爆發粒子
  - Stage 7 (11500ms): 牌名揭示文字飛入（毛玻璃膠囊背景）
  - Stage 8 (14000ms): 淡出 → 進入分析畫面
- **Canvas 粒子系統**：120 顆漂浮星塵 + 翻牌瞬間 150 顆爆發粒子，requestAnimationFrame 驅動。
- **HTML 結構擴充**：`#daily-animation-overlay` 內新增 canvas、星雲、sunburst、SVG 魔法陣、符文、扇形牌陣容器（JS 動態產生牌 + 掃描光柱）、Aura、Lens Flare、揭示文字。
- **牌名辨識修正**：毛玻璃膠囊背景 + 白色大字 + 多層金色 text-shadow，避免與卡片重疊。

## 2026-04-30 - Bug Fix: 每日一抽殘留狀態汙染手勢抽牌
- **問題**：使用者做完「每日一抽」後按關閉（非重新洗牌），再填寫提問開啟手勢抽牌時，`AppState.selectedCards` 仍殘留 daily 的牌，導致手勢選牌從 slot-2 開始填入。
- **根因**：`analysis.js` 的 reading modal 關閉按鈕只隱藏 modal，沒有清除 `AppState.selectedCards` 和 `isDailyMode`。
- **修復**：在 `init.js` 的「開啟手勢抽牌」按鈕 click handler 中，開始前先檢查並清除殘留的 daily 狀態（selectedCards、usedCardIds、isDailyMode、slot UI）。
- **每日一抽動畫優化**：
  - 重構 `js/daily.js` 階段邏輯，新增 `prepareDailyCardEntryStart()` 實現主牌從扇形牌陣原位「接棒」起飛。
  - 修正 CSS `visibility: hidden` 解決過渡殘影，確保動畫切換無縫流暢。
- **版本控制**：升級至 **v1.7.8**，同步更新 `sw.js` 快取與 `index.html` 資源版本。

## 2026-04-30 - 效能修復：手機多次抽牌後 Lag
- **問題**：手機上交替使用「每日一抽」和「手勢抽牌」多次後，App 越來越卡頓。
- **根因 (6 個洩漏源)**：
  1. `daily.js` 的 8~10 個 `setTimeout` 未被追蹤或取消，閉包持有 overlay/fanCards/particles/canvas 引用無法被 GC。
  2. 扇形牌陣 DOM（15~19 張 `.daily-deck-card` + `.daily-scan-beam`）在動畫結束後未清理，只增不減。
  3. CSS infinite 動畫（nebulaBreath、rotateSunburst、magicCircleSpin 等）在 overlay 隱藏後仍持續消耗 GPU（因使用 `opacity: 0` 而非 `display: none`）。
  4. Canvas 位圖記憶體（`innerWidth × innerHeight × 4` bytes）未顯式釋放。
  5. Wake Lock `requestWakeLock()` 在 `visibilitychange` 事件中重複請求，舊 sentinel 未釋放。
- **修復**：
  - 新增 `cleanupDailyAnimation()` 統一清理函式：清除所有 timer、cancelAnimationFrame、清空 deckFan DOM、Canvas width/height 歸零、重置 overlay class。
  - 所有 setTimeout 改用 `_dailyTimers[]` 追蹤，rAF 改用模組級變數 `_dailyParticleAnimId` / `_dailyScanAnimId`。
  - CSS 新增 `#daily-animation-overlay.hidden { display: none; }` 停止所有內部動畫。
  - Wake Lock 新增防重複檢查 + release 事件中清空 sentinel 引用。
  - `init.js` 在手勢抽牌和重新洗牌入口都呼叫 `cleanupDailyAnimation()`。
- **版本控制**：升級至 **v1.7.9**。

## 2026-04-30 - Bug Fix: 每日一抽完成後無法再次觸發
- **問題**：使用者在完成一次每日一抽並關閉結果視窗後，再次點擊「每日一抽」並在確認對話框按確定時無反應。
- **根因**：`startDailyFlow()` 中有 `AppState.gameState` 的防呆檢查，但每日一抽完成後狀態停留在 `'finished'`，關閉視窗時未重置，導致後續觸發被擋掉。
- **修復**：在 `js/daily.js` 的 `triggerDailyCard()` 中，呼叫 `startDailyFlow()` 前強制將 `AppState.gameState` 重置為 `'idle'`。
- **版本控制**：升級至 **v1.7.10**。


