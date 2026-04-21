#!/usr/bin/env node
/**
 * 版本號自動同步工具
 * 用法：node scripts/bump-version.js <新版本號>
 * 範例：node scripts/bump-version.js 1.5.0
 *
 * 會同時更新以下三處：
 *   1. js/version.js   → APP_VERSION
 *   2. sw.js           → CACHE_VERSION
 *   3. index.html      → 所有 ?v= 查詢字串
 */
const fs = require('fs');
const path = require('path');

const newVersion = process.argv[2];
if (!newVersion || !/^\d+\.\d+\.\d+$/.test(newVersion)) {
    console.error('❌ 請提供合法的版本號 (格式: x.y.z)');
    console.error('   用法: node scripts/bump-version.js 1.5.0');
    process.exit(1);
}

const ROOT = path.resolve(__dirname, '..');

// 讀取目前版本號
const versionFilePath = path.join(ROOT, 'js', 'version.js');
const versionContent = fs.readFileSync(versionFilePath, 'utf-8');
const currentMatch = versionContent.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
const currentVersion = currentMatch ? currentMatch[1] : '未知';

if (currentVersion === newVersion) {
    console.log(`ℹ️  版本號已經是 ${newVersion}，無需更新。`);
    process.exit(0);
}

console.log(`🔄 版本更新：${currentVersion} → ${newVersion}\n`);

// 1. 更新 js/version.js
const newVersionContent = versionContent.replace(
    /APP_VERSION\s*=\s*['"][^'"]+['"]/,
    `APP_VERSION = '${newVersion}'`
);
fs.writeFileSync(versionFilePath, newVersionContent, 'utf-8');
console.log(`  ✅ js/version.js  → APP_VERSION = '${newVersion}'`);

// 2. 更新 sw.js
const swPath = path.join(ROOT, 'sw.js');
let swContent = fs.readFileSync(swPath, 'utf-8');
swContent = swContent.replace(
    /CACHE_VERSION\s*=\s*['"][^'"]+['"]/,
    `CACHE_VERSION = '${newVersion}'`
);
fs.writeFileSync(swPath, swContent, 'utf-8');
console.log(`  ✅ sw.js          → CACHE_VERSION = '${newVersion}'`);

// 3. 更新 index.html 中所有 ?v=xxx 查詢字串
const htmlPath = path.join(ROOT, 'index.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf-8');
const replacedCount = (htmlContent.match(/\?v=[^"'\s]+/g) || []).length;
htmlContent = htmlContent.replace(/\?v=[^"'\s]+/g, `?v=${newVersion}`);
fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
console.log(`  ✅ index.html     → 共更新 ${replacedCount} 處 ?v= 查詢字串`);

console.log(`\n🎉 版本號已同步更新為 ${newVersion}`);
