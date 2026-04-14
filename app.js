/**
 * 聖境塔羅 (Celestial Tarot)
 * 核心應用程式邏輯
 */

document.addEventListener('DOMContentLoaded', () => {
    initStars();
    initApp();
});

/**
 * 初始化背景星光效果
 */
function initStars() {
    const container = document.getElementById('stars-container');
    const starCount = 150;

    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        // 隨機位置
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        
        // 隨機大小
        const size = Math.random() * 2 + 1;
        
        // 隨機動畫時間
        const duration = Math.random() * 3 + 2;
        const delay = Math.random() * 5;

        star.style.left = `${x}%`;
        star.style.top = `${y}%`;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.setProperty('--duration', `${duration}s`);
        star.style.animationDelay = `${delay}s`;

        container.appendChild(star);
    }
}

/**
 * 初始化應用程式
 */
function initApp() {
    const shuffleBtn = document.getElementById('shuffle-btn');
    const drawBtn = document.getElementById('draw-btn');
    const board = document.getElementById('tarot-board');

    // 模擬載入過程
    setTimeout(() => {
        board.innerHTML = '<p class="subtitle">牌組已準備就緒，請靜心後抽牌...</p>';
    }, 2000);

    shuffleBtn.addEventListener('click', () => {
        console.log('洗牌中...');
        // 實作洗牌邏輯
    });

    drawBtn.addEventListener('click', () => {
        console.log('抽牌中...');
        // 實作抽牌邏輯
    });
}
