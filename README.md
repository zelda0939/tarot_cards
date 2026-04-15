# 聖境塔羅 (Celestial Tarot)

✨ **探索靈魂的指引 — 美觀、直覺的高質感塔羅牌抽取與 AI 解讀體驗** ✨

這是一個基於網頁技術打造的互動式塔羅牌應用。不僅提供 3D 沉浸式的手勢抽牌體驗，更整合了 Google 的大型語言模型 (Gemma 4 31B / Gemini 3 Flash)，為你抽出的牌提供客製化的綜合神諭解析。

## 🌟 核心特色

- **沉浸式 3D 視覺體驗**
  - **星辰懸浮圓環**：透過數學運算打造出帶有景深 (Depth) 的 3D 卡牌圓環。
  - **物理感翻牌與飛入動畫**：卡片選取後翻面並平滑過渡至專屬欄位。
  - **Deckaura 視覺美學**：多層漸層卡背、雙層幾何裝飾框與原版萊德偉特塔羅牌面的完美融合。
  - **星辰編織等待畫面**：AI 分析時提供全螢幕的三層動態星環與呼吸燈文字，提升儀式感。

- **支援 AI 綜合神諭 (AI Insight)**
  - 支援 **Gemma 4 31B** (預設，深度解析) 與 **Gemini 3 Flash** (快速) 模型。
  - 將抽出的「過去、現在、未來」三張牌，包含正逆位意涵，交由 AI 占卜師進行通盤解讀。

- **智能手勢操作 (MediaPipe)**
  - 預設提供滑鼠點擊操作。
  - 開啟攝像頭後，可支援手勢辨識：
    - 🖐️ **張開手掌**：旋轉 3D 星環
    - ✊ **握拳**：停止旋轉並鎖定前方卡片
    - ☝️ **食指向上滑動**：確認選取該卡片

- **PWA (Progressive Web App) 支援**
  - 支援離線訪問，無須網路也能單機進行塔羅抽牌與觀看牌意。
  - 可安裝置桌面或手機主畫面，享有全螢幕的 App 級體驗。
  - 自動處理資源快取與版本更新機制。

- **螢幕保持恆亮**
  - 啟用 Screen Wake Lock API，在使用手勢抽牌時防止螢幕自動休眠。

## 🚀 快速開始

### 1. 運行專案

本專案由全純前端技術開發 (Vanilla HTML/CSS/JS)，無須安裝 Node.js 依賴或編譯。
為避免 CORS 問題 (尤其是載入本地圖片與 Service Worker)，請**一定要透過本地伺服器運行**，不要直接雙擊開啟 `index.html`。

你可以使用任何熟悉的輕量本地伺服器，例如：

**使用 Python:**
```bash
python -m http.server 8000
```

**使用 Node.js (http-server):**
```bash
npx http-server . -p 8000
```

然後在瀏覽器開啟：`http://localhost:8000`

### 2. 設定 AI 解析 (可選)

如果想要使用 AI 綜合解析功能，你需要設定 Google AI API Key：

1. 點擊畫面右上角的 **「⚙️ 設定金鑰」** 按鈕。
2. 點擊 **[取得 Google AI API Key]** 前往 Google AI Studio。
3. 登入 Google 帳號並點擊 "Create API key"。
4. 複製生成的 API Key，貼回聖境塔羅的設定畫面。
5. 選擇想使用的模型 (建議維持預設的 Gemma 4 31B)。
6. 點擊「儲存」即可啟用。*(Key 將安全地保存在你本地瀏覽器的 LocalStorage 中)*

## 📂 專案結構

- `index.html`：系統進入點與 UI 結構。
- `app.js`：核心邏輯 (3D 算繪、動畫控制、手勢辨識、AI API 串接)。
- `style.css`：設計系統、CSS 動畫與 Deckaura 樣式。
- `version.js`：系統版本定義，用於 PWA 破快取。
- `tarot_dict.js`：完整的 78 張萊德偉特塔羅牌中文翻譯與正逆位牌意辭典。
- `sw.js` / `manifest.json`：Progressive Web App 相關配置。
- `images/`：存放 78 張卡牌的正面圖片 (`*.jpg`) 與卡背 (`card_back.png`)。
- `icons/`：PWA 用的應用程式圖示。

## ⚠️ 異常排除

- **為何用手勢功能時畫面沒反應？**
  請確認瀏覽器是否已允許攝影機權限。手勢辨識模組首次載入需時約 3~5 秒。
  > 註：若在 LINE 或 Facebook 內建瀏覽器開啟，可能無法取用攝影機且不支援 PWA，系統會提示引導你透過 Chrome 或 Safari 開啟。
- **AI 解牌失敗？**
  請確認網路連線正常，且填入的 Google AI API Key 有效且未達配額上限。

## 📜 關於資源

- 塔羅牌基本資料來源：[tarotapi.dev](https://github.com/ekelen/tarot-api)
- 卡牌圖片來源：傳統萊德偉特 (Rider-Waite-Smith) 塔羅牌 (Public Domain)
- 手勢辨識技術：[Google MediaPipe](https://mediapipe.dev/)

---
*願星辰為你指引前進的道路 ✨*
