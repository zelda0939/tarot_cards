# 執行紀錄 (Walkthrough)

## 2026-04-14
- **初始化專案**: 建立專案管理文件。
- **建立基礎架構**: 
    - 建立 [index.html](file:///g:/%E6%88%91%E7%9A%84%E9%9B%B2%E7%AB%AF%E7%A1%AC%E7%A2%9F/%E5%AE%89%E6%88%90%E5%B7%A5%E4%BD%9C%E8%B3%87%E6%96%99/%E5%90%8C%E6%AD%A5%E5%8D%80/case/tarot_cards/index.html) (HTML 結構與 SEO)
    - 建立 [style.css](file:///g:/%E6%88%91%E7%9A%84%E9%9B%B2%E7%AB%AF%E7%A1%AC%E7%A2%9F/%E5%AE%89%E6%88%90%E5%B7%A5%E4%BD%9C%E8%B3%87%E6%96%99/%E5%90%8C%E6%AD%A5%E5%8D%80/case/tarot_cards/style.css) (設計系統與星光背景)
    - 建立 [app.js](file:///g:/%E6%88%91%E7%9A%84%E9%9B%B2%E7%AB%AF%E7%A1%AC%E7%A2%9F/%E5%AE%89%E6%88%90%E5%B7%A5%E4%BD%9C%E8%B3%87%E6%96%99/%E5%90%8C%E6%AD%A5%E5%8D%80/case/tarot_cards/app.js) (核心邏輯初步實作)
- **版本控制**: 完成專案初始化提交 (4026f4c)。
- **修正尺寸與圖像裁切問題**:
    - 移除翻轉縮放：刪除了 `.flipped` 狀態下的 `scale(1.1)`，確保正面與卡背的視覺尺寸完全相同。
    - 精準匹配實體大小：由於實體的卡背圖檔（星空背景）其實四周自帶了一圈黑色的原邊距，且上下邊距留白明顯比左右還多，因此我在正面 `.card-front` 加回了純黑底色並設定了 **上下 18px、左右 8px 的內推邊距（padding）**。這完美模擬卡背星星圖塊的比例，強制將中間實體的白色卡紙比例壓扁變短，徹底解決「看起來比較長」的現象。
    - 重塑圓角白卡：為內部的白色塔羅與名牌區塊分別加上對應的外部圓角（`border-radius`），使其在黑底下形成一張邊角圓滑、尺寸與真正卡背圖形「完全一致」的實體感白塔羅。
- **3D 圓環景深效果與飛入動畫**:
    - 重構佈局引擎：將原本整體容器 `rotateY` 的 3D 旋轉，改為逐卡片計算的扇形景深佈局。新增 `updateCardPositions()` 函式，每幀根據邏輯角度差計算 `translateX`（sin 弧形）、`translateZ`（深度）、`scale`（縮放）、`opacity`（透明度），實現正中央焦點卡放大、兩側向後遞減的立體景深效果。
    - 飛入過場動畫：選取卡牌時，先翻面顯示正面 → 等待 1 秒 → 卡牌切換為 `position: fixed` + CSS transition，從圓環位置飛至下方選取區的 slot 精確座標並縮小為 slot 大小。
    - 旋轉時全部顯示卡背，僅在確認選取後才翻面顯示正面。

## 2026-04-15
- **抽牌隨機性審查與修正**:
    - 審查發現原本使用者只能從環上 12 張牌中選取，其餘 66 張牌在該輪完全沒有被選中的機會，不符合「從 78 張牌中均等隨機」的預期。
    - 修正方案：確認選牌時不再從環上的 `ringCardData` 取牌，改為呼叫新函式 `drawTrueRandomCard()` 從全部 78 張牌庫中真隨機抽取（僅排除已選定的牌）。
    - 新增 `updateCardFrontDOM()` 函式，在翻牌動畫觸發前即時替換卡牌正面的圖片與名稱，讓使用者翻牌後看到的就是真正隨機抽到的牌。
    - 環上展示的牌現在僅作為視覺裝飾效果，不影響最終抽牌結果。
- **旋轉動畫流暢度優化**:
    - 移除 `.tarot-card` 上的 CSS `transition`（原 0.4s），避免與 `requestAnimationFrame` 逐幀更新衝突造成延遲卡頓。
    - 新增 `.smooth-transition` class，僅在停止 snap 時動態加入做平滑定位過渡，400ms 後自動移除。
    - 動畫引擎改用 delta-time（`timestamp` 差值歸一化到 60fps），確保不同幀率裝置（60/120/144fps）的旋轉速度一致且流暢。
    - `resetGame()` 中加入 `lastFrameTime = 0` 重設，避免重新開局時第一幀跳躍。
- **PWA 化**:
    - 新增 [manifest.json](file:///g:/%E6%88%91%E7%9A%84%E9%9B%B2%E7%AB%AF%E7%A1%AC%E7%A2%9F/%E5%AE%89%E6%88%90%E5%B7%A5%E4%BD%9C%E8%B3%87%E6%96%99/%E5%90%8C%E6%AD%A5%E5%8D%80/case/tarot_cards/manifest.json)：定義應用名稱、圖示、主題色（金 #d4af37）、背景色（深黑 #07080a）、standalone 模式。
    - 新增 [sw.js](file:///g:/%E6%88%91%E7%9A%84%E9%9B%B2%E7%AB%AF%E7%A1%AC%E7%A2%9F/%E5%AE%89%E6%88%90%E5%B7%A5%E4%BD%9C%E8%B3%87%E6%96%99/%E5%90%8C%E6%AD%A5%E5%8D%80/case/tarot_cards/sw.js)：Cache-First Service Worker，預快取核心靜態資源，API 請求不走快取。
    - 新增 `icons/` 目錄：SVG 格式的 192x192 與 512x512 金色八芒星圖示。
    - index.html 加入 PWA meta 標籤（manifest link、theme-color、apple-mobile-web-app-capable）與 SW 註冊腳本。
- **預設模型改為 Gemma 4 31B**:
    - 所有 `localStorage.getItem('gemini_model')` 的 fallback 值從 `gemini-3-flash-preview` 改為 `gemma-4-31b-it`（共 3 處）。
    - select 下拉選單預設選項調整為 Gemma 4 31B（深度，預設）。
- **API Key 取得教學**:
    - 設定 Modal 中 API Key 輸入框下方新增 Google AI Studio 連結（`https://aistudio.google.com/apikey`）與三步驟圖文教學。
- **精美等待畫面（星辰編織）**:
    - 新增全螢幕 `#loading-overlay`：三層旋轉星環（外/中/內層，各自不同速度與方向旋轉）、中央發光脈衝核心、已選卡牌縮圖浮動展示、呼吸燈文字「星辰正在為您編織命運的軌跡」、跳動省略號。
    - `showAnalysis()` 重構為三階段流程：顯示等待畫面 → 背景非同步呼叫 AI → AI 完成後淡出等待畫面並顯示解牌 Modal。
    - `fetchGeminiAnalysis()` 從直接操作 DOM 改為純資料層，回傳 `{ success, text }` Promise。
- **螢幕恆亮**:
    - 使用 Screen Wake Lock API（`navigator.wakeLock.request('screen')`）防止手勢操作時螢幕自動休眠。
    - 頁面 `visibilitychange` 事件監聽，切回分頁時自動重新請求恆亮。
- **解牌顯示簡化**:
    - 星辰指引 Modal 中每張牌只顯示抽到的正位或逆位意義（一個 div），不再同時列出正位與逆位兩個區塊。

