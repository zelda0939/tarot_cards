/* ============================
   解牌結果圖片匯出
   ============================ */
function normalizeGuidanceText(rawText) {
    if (!rawText) return '';
    return String(rawText)
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/?[^>]+>/g, '')
        .replace(/\r\n/g, '\n')
        .replace(/\u00a0/g, ' ')
        .trim();
}

function wrapCanvasText(ctx, text, maxWidth) {
    const lines = [];
    const paragraphs = String(text || '').split('\n');

    paragraphs.forEach((paragraph, paragraphIndex) => {
        if (!paragraph.trim()) {
            lines.push('');
            return;
        }

        let currentLine = '';
        for (const char of paragraph) {
            if (!currentLine && /\s/.test(char)) {
                continue;
            }

            const nextLine = currentLine + char;
            if (ctx.measureText(nextLine).width > maxWidth && currentLine) {
                lines.push(currentLine.trimEnd());
                currentLine = /\s/.test(char) ? '' : char;
            } else {
                currentLine = nextLine;
            }
        }

        if (currentLine) lines.push(currentLine.trimEnd());
        if (paragraphIndex !== paragraphs.length - 1) lines.push('');
    });

    while (lines.length > 0 && lines[lines.length - 1] === '') {
        lines.pop();
    }

    return lines;
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
    const r = Math.max(0, Math.min(radius, width / 2, height / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawStarField(ctx, width, height, starCount) {
    for (let i = 0; i < starCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 1.8 + 0.4;
        const opacity = Math.random() * 0.65 + 0.2;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

const waitImageLoad = (src) => new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
});

async function buildGuidanceImageCanvas(questionText, guidanceText, cards) {
    const width = 1080;
    const padding = 82;
    const contentWidth = width - padding * 2;

    const safeQuestion = (questionText || '未提供提問').trim();
    const safeGuidance = (guidanceText || '尚未取得星辰指引').trim();

    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    measureCtx.font = "500 43px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
    const questionLines = wrapCanvasText(measureCtx, safeQuestion, contentWidth - 96);
    measureCtx.font = "400 37px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
    const rawGuidanceLines = wrapCanvasText(measureCtx, safeGuidance, contentWidth - 96);
    const maxGuidanceLines = 40;
    const guidanceLines = rawGuidanceLines.slice(0, maxGuidanceLines);
    if (rawGuidanceLines.length > maxGuidanceLines && guidanceLines.length > 0) {
        guidanceLines[guidanceLines.length - 1] += '…';
    }

    let cardsBoxHeight = 0;
    const cardImgWidth = 230;
    const cardImgHeight = 391;
    const cardGap = 66;
    const meaningLineHeight = 36;
    let cardImages = [];
    const isSingleCard = cards && cards.length === 1;

    if (cards && cards.length) {
        cardImages = await Promise.all(cards.map(card => waitImageLoad(`assets/images/${card.name_short}.jpg`)));

        measureCtx.font = "400 24px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
        meaningsLinesArr = cards.map(card => {
            const text = card.isReversed ? card.meaning_rev : card.meaning_up;
            const label = (card.isReversed ? '▽ 逆位：' : '▲ 正位：') + text;
            const textWidth = isSingleCard ? (contentWidth - 96) : cardImgWidth;
            return wrapCanvasText(measureCtx, label, textWidth);
        });
        const maxMeaningLines = Math.max(1, ...meaningsLinesArr.map(l => l.length));

        const cardAreaHeader = 70 + 31 + 30;
        const cardBlockHeight = 40 + 20 + cardImgHeight + 30 + 30 + 16 + (maxMeaningLines * meaningLineHeight) + 40;
        cardsBoxHeight = cardAreaHeader + cardBlockHeight;
    }

    const questionLineHeight = 62;
    const guidanceLineHeight = 55;
    const questionTextHeight = Math.max(1, questionLines.length) * questionLineHeight;
    const guidanceTextHeight = Math.max(1, guidanceLines.length) * guidanceLineHeight;
    const questionBoxHeight = Math.max(220, 70 + questionTextHeight + 58);
    const guidanceBoxHeight = Math.max(420, 70 + guidanceTextHeight + 64);

    const headerHeight = 230;
    const betweenSections = 48;
    const footerHeight = 118;
    const cardsSectionTotalSpace = cardsBoxHeight > 0 ? cardsBoxHeight + betweenSections : 0;
    const totalHeight = headerHeight + questionBoxHeight + betweenSections + cardsSectionTotalSpace + guidanceBoxHeight + footerHeight + padding;
    const height = Math.min(4500, Math.max(1500, Math.ceil(totalHeight)));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#050713');
    bgGradient.addColorStop(0.58, '#0f1733');
    bgGradient.addColorStop(1, '#151c44');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    const nebulaColors = [
        'rgba(61, 87, 190, 0.22)',
        'rgba(112, 72, 185, 0.16)',
        'rgba(18, 128, 120, 0.14)'
    ];
    nebulaColors.forEach((color, idx) => {
        const r = 240 + idx * 90;
        const x = idx === 1 ? width * 0.72 : width * (0.24 + idx * 0.2);
        const y = idx === 2 ? height * 0.66 : height * (0.22 + idx * 0.16);
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
        glow.addColorStop(0, color);
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    });

    drawStarField(ctx, width, height, 320);

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, 36, 36, width - 72, height - 72, 30);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f8e8a8';
    ctx.font = "700 60px 'Cinzel', serif";
    ctx.fillText('Celestial Tarot', width / 2, 122);

    ctx.fillStyle = 'rgba(249, 229, 150, 0.95)';
    ctx.font = "500 34px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
    ctx.fillText('聖境塔羅', width / 2, 178);

    const questionBoxY = 236;
    const questionBoxX = padding;
    drawRoundedRect(ctx, questionBoxX, questionBoxY, contentWidth, questionBoxHeight, 28);
    ctx.fillStyle = 'rgba(6, 11, 28, 0.72)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.36)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#f6d77a';
    ctx.font = "600 31px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
    ctx.fillText('你的提問', questionBoxX + 46, questionBoxY + 62);

    ctx.fillStyle = '#ffffff';
    ctx.font = "500 43px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
    let questionY = questionBoxY + 124;
    questionLines.forEach((line) => {
        ctx.fillText(line || ' ', questionBoxX + 46, questionY);
        questionY += questionLineHeight;
    });

    let currentSectionY = questionBoxY + questionBoxHeight + betweenSections;

    if (cards && cards.length) {
        drawRoundedRect(ctx, questionBoxX, currentSectionY, contentWidth, cardsBoxHeight, 28);
        ctx.fillStyle = 'rgba(6, 11, 28, 0.72)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.36)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.fillStyle = '#f6d77a';
        ctx.font = "600 31px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
        ctx.fillText('所選卡牌', questionBoxX + 46, currentSectionY + 62);

        cards.forEach((card, idx) => {
            // 單卡模式置中
            const cx = isSingleCard
                ? (width / 2 - cardImgWidth / 2)
                : (questionBoxX + 46 + idx * (cardImgWidth + cardGap));
                
            let childY = currentSectionY + 130;

            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(212, 175, 55, 0.12)';
            drawRoundedRect(ctx, cx + cardImgWidth / 2 - 60, childY - 28, 120, 40, 20);
            ctx.fill();
            ctx.fillStyle = '#f8e8a8';
            ctx.font = "500 24px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
            const posLabel = isSingleCard ? '今日指引' : `第 ${idx + 1} 張`;
            ctx.fillText(posLabel, cx + cardImgWidth / 2, childY);

            childY += 36;

            const img = cardImages[idx];
            if (img) {
                if (card.isReversed) {
                    ctx.save();
                    ctx.translate(cx + cardImgWidth / 2, childY + cardImgHeight / 2);
                    ctx.rotate(Math.PI);
                    ctx.drawImage(img, -cardImgWidth / 2, -cardImgHeight / 2, cardImgWidth, cardImgHeight);
                    ctx.restore();
                } else {
                    ctx.drawImage(img, cx, childY, cardImgWidth, cardImgHeight);
                }

                ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
                ctx.lineWidth = 2;
                ctx.strokeRect(cx, childY, cardImgWidth, cardImgHeight);
            }

            childY += cardImgHeight + 36;

            const posture = card.isReversed ? '逆位' : '正位';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#f6d77a';
            ctx.font = "700 26px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
            ctx.fillText(`${card.symbol || '✦'} ${card.name} [${posture}]`, cx + cardImgWidth / 2, childY);

            childY += 40;

            ctx.fillStyle = '#eaf1ff';
            ctx.font = "400 24px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
            const lines = meaningsLinesArr[idx];
            
            if (isSingleCard) {
                ctx.textAlign = 'center';
                lines.forEach(line => {
                    ctx.fillText(line || ' ', width / 2, childY);
                    childY += meaningLineHeight;
                });
            } else {
                ctx.textAlign = 'left';
                lines.forEach(line => {
                    ctx.fillText(line || ' ', cx, childY);
                    childY += meaningLineHeight;
                });
            }
        });

        currentSectionY += cardsBoxHeight + betweenSections;
    }

    const guidanceBoxY = currentSectionY;
    drawRoundedRect(ctx, questionBoxX, guidanceBoxY, contentWidth, guidanceBoxHeight, 28);
    ctx.fillStyle = 'rgba(5, 9, 24, 0.76)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.36)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#f6d77a';
    ctx.font = "600 31px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
    ctx.fillText('星辰指引', questionBoxX + 46, guidanceBoxY + 62);

    ctx.fillStyle = '#eaf1ff';
    ctx.font = "400 37px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
    let guidanceY = guidanceBoxY + 124;
    guidanceLines.forEach((line) => {
        ctx.fillText(line || ' ', questionBoxX + 46, guidanceY);
        guidanceY += guidanceLineHeight;
    });

    const generatedAt = new Date().toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(249, 229, 150, 0.82)';
    ctx.font = "400 24px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
    ctx.fillText(`生成時間 ${generatedAt}`, width / 2, height - 64);

    return canvas;
}

function canvasToPngBlob(canvas) {
    return new Promise((resolve, reject) => {
        if (!canvas) {
            reject(new Error('Canvas is unavailable'));
            return;
        }

        if (canvas.toBlob) {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to export image blob'));
                }
            }, 'image/png');
            return;
        }

        try {
            const dataUrl = canvas.toDataURL('image/png');
            const base64 = dataUrl.split(',')[1] || '';
            const binary = atob(base64);
            const len = binary.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            resolve(new Blob([bytes], { type: 'image/png' }));
        } catch (err) {
            reject(err);
        }
    });
}

function downloadImageBlob(blob, fileName) {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
}

async function saveReadingAsImage() {
    if (AppState.saveImageBusy) return;

    const questionText = getActiveQuestionText();
    const guidanceText = normalizeGuidanceText(
        AppState.latestGuidanceText || document.getElementById('gemini-text')?.innerHTML || ''
    );

    if (!guidanceText) {
        setSaveImageStatus('目前還沒有可儲存的星辰指引，請先完成解牌。', 'error');
        return;
    }

    AppState.saveImageBusy = true;
    setSaveImageStatus('');
    setSaveImageButtonState(true, '產生圖片中...');

    try {
        const canvas = await buildGuidanceImageCanvas(questionText, guidanceText, AppState.selectedCards);
        const blob = await canvasToPngBlob(canvas);
        const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
        const fileName = `celestial-tarot-guidance-${stamp}.png`;
        downloadImageBlob(blob, fileName);
        setSaveImageStatus('圖片已下載，已包含提問與星辰指引。', 'success');
    } catch (err) {
        console.error('[星辰塔羅] 儲存圖片失敗:', err);
        setSaveImageStatus('儲存圖片失敗，請稍後再試。', 'error');
    } finally {
        AppState.saveImageBusy = false;
        setSaveImageButtonState(false, '儲存提問＋星辰指引圖');
    }
}
