# 聖境塔羅 (Celestial Tarot) - 專案指引 (GEMINI.md)

## 專案概覽 (Project Overview)
「聖境塔羅」是一個純前端 (Vanilla Web) 打造的沉浸式塔羅占卜平台。專案主打精美的視覺動效與流暢的互動體驗，並結合了先進的 Web API 技術。

**核心特色與技術棧：**
- **純前端架構 (Vanilla Stack)**: HTML5, CSS3, 原生 JavaScript (無大型框架如 React/Vue，無繁雜的建置工具)。
- **AI 深度解牌**: 串接 Google AI（Gemini 3 Flash、Gemma 4 31B，以 `analysis.js` 中 `AI_MODELS` 為準）進行塔羅牌陣解讀。
- **手勢辨識互動**: 整合 Google MediaPipe Hands 模型，實現無觸碰的 3D 牌環 (Carousel) 旋轉與抽牌。
- **PWA 與離線支援**: 透過 `manifest.json` 與 `sw.js`（一般資源採 Network-First，卡牌圖片 `assets/images/*.jpg` 採 Cache-First）支援安裝為應用程式並提供離線能力。
- **資料持久化**: 
  - `localStorage`: 儲存使用者偏好設定與 API Key。
  - `IndexedDB` (`CelestialTarotDB`): 儲存使用者的歷史占卜日誌。
- **極致動畫體驗**: 強調 60fps 的流暢度，包含複雜的 SVG 魔法陣、3D 翻轉、Canvas 粒子系統，並具備智慧效能分級 (Adaptive Performance) 針對手機進行降級優化。

## 目錄結構 (Directory Structure)
- `/js/`: 核心 JavaScript 邏輯模組（ES6 Module，單一進入點 `init.js`）。
  - `init.js`: 應用程式入口，處理初始化與事件綁定。
  - `app.js`: 整體流程控制、抽牌邏輯與遊戲狀態重置。
  - `state.js`: 全域狀態 (`AppState`) 與常數 (如牌位定義) 管理。
  - `ring.js`: 3D 牌環渲染邏輯與視覺差投影計算。
  - `daily.js`: 每日一抽系統邏輯、多階段魔幻動畫與粒子特效。
  - `celtic-cross.js`: 聖十字牌陣專屬邏輯、Grid 佈局生成與展牌動畫。
  - `analysis.js`: AI 提示詞建構、API 呼叫與結果展示模組。
  - `history.js`: IndexedDB 占卜日誌管理、多選刪除與接續提問邏輯。
  - `imageExport.js`: Canvas 匯出結果圖片，支援不同牌陣的自適應排版。
  - `gesture.js`: MediaPipe 手勢捕捉、效能調整與防抖處理。
  - `ui.js`: 通用 UI 元件（如 Confirm Dialog）與工具函式（如 HTML 跳脫）。
  - `question.js`: 提問輸入處理。
  - `version.js`: 版本號管理與快取更新控制。
- `/css/`: 樣式表。
  - `style.css`: 全域主樣式，包含星空背景、手勢抽牌動畫與響應式斷點。
  - `animations.css`: 專屬動畫關鍵幀（星環旋轉、粒子閃爍等）。
  - `celtic-cross.css`: 聖十字牌陣特定 Grid 佈局、3D 星盤與魔幻特效樣式。
- `/assets/`:
  - `data/tarot_dict.json`: 78 張塔羅牌中文字典（替代已移除的 `tarot_dict.js`）。
  - `images/`: 卡牌圖片 (`c01.jpg`…`w14.jpg`) 與 `card_back.png`。
  - `icons/`: PWA 應用圖示。
- `index.html`: 單頁應用 (SPA) 入口（含 Service Worker 註冊腳本）。
- `sw.js` / `manifest.json`: PWA 相關設定（SW 採 Network-First + Cache-First 混合策略）。

## 建置與執行 (Building and Running)
本專案不依賴 Node.js 建置工具 (如 Webpack/Vite)，只需任意靜態檔案伺服器即可運行。

**啟動開發伺服器：**
由於牽涉到 PWA Service Worker 與模組載入 (`<script type="module">`)，必須使用 HTTP Server，不能直接雙擊開啟 HTML 檔案 (會出現 CORS 或路徑錯誤)。
```bash
# 使用 Python 內建的 HTTP 伺服器
python -m http.server 8000

# 或是使用 Node.js 的 http-server
npx http-server -p 8000
```
然後在瀏覽器開啟 `http://localhost:8000`。

## 可用技能清單 (Available Skills)
本專案環境中預裝了以下專業技能，開發時應優先考慮啟動相關技能：

- **`frontend-design`**: 核心美學技能。用於設計、實作或優化極致華麗的網頁介面、SVG 動畫與 CSS 特效，並確保其在手機端的效能。
- **`find-skills`**: 探索技能。當專案需要新的工具化能力（如測試、效能分析等）時，用於搜尋並安裝適合的 Agent Skills。
- **`mobile-touch`**: 行動端互動優化技能。專門用於處理行動裝置的觸控事件、多指手勢、解決 `click` 延遲、以及優化觸控回饋（如震動、視覺反饋）等行動端特有的互動問題。
- **`skill-creator`**: 擴充技能。用於為此專案建立新的自訂技能，或更新現有的技能定義。

> **提示**：可使用 `npx skills find [query]` 搜尋更多技能，或使用 `activate_skill [name]` 啟動上述技能。

## 開發慣例與原則 (Development Conventions)

1. **語言與溝通**: 
   - 專案程式碼註解與系統提示 (Prompt) 一律使用**繁體中文 (台灣用語)**。
   - 文件 (README、commit messages、Agent 生成之記憶檔等) 皆使用繁體中文。

2. **技術限制與架構**: 
   - **嚴格維持 Vanilla JavaScript**，不引入 React、Vue 等外部大型 UI 框架。
   - 不依賴複雜的建置系統，所有 JS 模組均為 ES6 Module，由瀏覽器原生解析。
   - 資料流盡量單純：模組間透過 `import`/`export` 匯入匯出函數，搭配 `AppState` 共用狀態；避免複雜的雙向綁定或事件匯流排。

3. **視覺與效能優先**: 
   - 必須確保手機端的流暢度。新增複雜特效時，需考量使用 `@media (max-width: 768px)` 進行效能降級 (Graceful Degradation)。
   - 動畫優先使用 CSS Transitions / Keyframes，並盡量使用 `transform` 與 `opacity` 配合 `will-change` 以觸發 GPU 硬體加速，避免修改 `top`, `left`, `width` 等會觸發 reflow 的屬性。
   - 對於複雜、數量龐大的粒子效果，應使用 Canvas API (`requestAnimationFrame`) 來實作，而非大量生成 DOM 節點。

4. **安全性**:
   - 輸出的 AI 內容或使用者輸入，在插入 DOM 前必須經過 HTML 跳脫處理 (Escape) 防範 XSS 攻擊。
   - API Keys 僅留存於客戶端 `localStorage`，絕不可寫死於程式碼中或傳輸至第三方非官方 API。

5. **進度與記憶追蹤**: 
   - 每次重要的開發異動或修復，必須更新紀錄至 `walkthrough.md`。
   - Agent 開始任務前需參閱 `.agent/memory.md` 了解既有的決策脈絡，任務結束後將關鍵決策記錄回去。

6. **技能優先原則 (Skill Check First)**:
   - 在執行任何指令或進行大規模開發前，必須先檢查目前專案是否有適合的或必須先執行的**技能 (Skills)** 可供使用。
   - 若存在相關技能（如：`frontend-design`、`find-skills` 等），應優先啟動技能以獲得更專業的開發指引或自動化協助。

## 核心程式開發規範 (Core Engineering Guidelines)

1. **編碼前先思考**: 不要默默做假設。說明假設，暴露權衡點。在猜測之前先提問。
2. **簡單優先**: 用能解決問題的最少程式碼。不要加入想像中的功能，不要為一次性程式碼設計抽象層。
3. **外科手術式修改**: 只改必須改的部分。不要順手「最佳化」相鄰程式碼、註釋或格式。不要重構沒有壞掉的東西。
4. **以目標為導向執行**: 先定義成功標準，然後循環迭代，直到完成驗證。
5. **嚴格的 API 呼叫規則**: 顯式處理 API 呼叫失敗。必須有 retry 機制，不得在不穩定網路環境中假設請求成功。
6. **防止函數覆蓋衝突**: 在新增函數前，必須掃描現有程式碼。優先使用已有函數，避免因 import 順序覆蓋導致的定義衝突。
7. **實質性測試驗證**: 測試目標必須是正確的邏輯輸出，而非僅是「返回資料」。必須驗證數值準確性，防止回傳常量的虛假測試通過。
8. **上下文保留與上下文管理**: 在跨檔案重構任務中，必須明確記錄當前步驟。防止在錯誤狀態下繼續工作。
9. **一致性優先於創新**: 保持與現有程式碼風格一致。即使 AI 認為新寫法更好，引入第二套模式本身就是一種錯誤。
10. **檢查點確認機制**: 長時間運行任務或多步驟重構時，每完成一個階段必須停下來要求確認（checkpoint），確認無誤後再進行下一步。
11. **顯式錯誤處理**: 禁止靜默失敗。任何潛在的執行錯誤，必須透過拋出異常或紀錄日誌的方式顯式暴露。
12. **環境一致性校驗**: 執行代碼前，確認本地環境、變數、依賴項與目標項目一致，防止環境衝突。