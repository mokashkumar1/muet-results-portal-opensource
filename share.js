// share.js

const shareBtn = document.getElementById('shareAchievementBtn');
const shareModal = document.getElementById('shareModal');
const closeBtn = document.getElementById('closeShareModalBtn');
const canvas = document.getElementById('shareCanvas');
const previewImg = document.getElementById('sharePreviewImg');
const loadingEl = document.getElementById('sharePreviewLoading');

const downloadBtn = document.getElementById('downloadShareBtn');
const nativeShareBtn = document.getElementById('nativeShareBtn');
const copyLinkBtn = document.getElementById('copyShareLinkBtn');

const formatTabs = document.querySelectorAll('.toggle-tabs .tab-btn');

let currentFormat = 'story'; // 'story' or 'post'

// Get the student's highest priority achievement details
function getAchievementDetails(student) {
    const activeSems = student.semesters.filter(g => g > 0);

    // 1. Rank 1
    if (student.rank === 1) {
        return {
            title: 'Department Topper!',
            text: 'Outstanding! You have achieved Rank 1 in your department. A flawless showcase of academic brilliance.',
            emoji: '🏆'
        };
    }
    // 2. Rank 2
    if (student.rank === 2) {
        return {
            title: 'Department Rank 2!',
            text: 'Exceptional! Holding Rank 2 in your department reflects stellar determination and hard work.',
            emoji: '🥈'
        };
    }
    // 3. Rank 3
    if (student.rank === 3) {
        return {
            title: 'Department Rank 3!',
            text: 'Superb! Securing Rank 3 is an outstanding milestone in your academic journey.',
            emoji: '🥉'
        };
    }
    // 4. Top 10
    if (student.rank <= 10) {
        return {
            title: 'Top 10 Standing!',
            text: 'Brilliant! Ranking in the Top 10 shows immense consistency and dedication among your peers.',
            emoji: '⭐'
        };
    }
    // 5. CGPA Above 3.75
    if (student.cgpa >= 3.75) {
        return {
            title: 'Elite Academic Standing!',
            text: 'Outstanding! Maintaining a CGPA above 3.75 puts you in the top echelon of academic achievers.',
            emoji: '🎖️'
        };
    }
    // 6. Perfect Semester (4.00 GPA in any semester)
    if (activeSems.some(g => g === 4.00)) {
        return {
            title: 'Perfect Semester!',
            text: 'Flawless! Scoring a perfect 4.00 GPA in a semester is a remarkable academic accomplishment.',
            emoji: '💎'
        };
    }
    // 7. 4 Consecutive Semesters Above 3.5
    let consecutive = 0;
    let has4consecutive = false;
    for (let g of student.semesters) {
        if (g >= 3.5) {
            consecutive++;
            if (consecutive >= 4) has4consecutive = true;
        } else if (g > 0) {
            consecutive = 0;
        }
    }
    if (has4consecutive) {
        return {
            title: 'Dean\'s Honor List!',
            text: 'Resilient performance! Maintaining GPAs above 3.5 for four consecutive terms is highly commendable.',
            emoji: '🔥'
        };
    }
    // 8. High Performer
    if (student.cgpa >= 3.5) {
        return {
            title: 'High Performer!',
            text: 'Excellent effort! Maintaining a CGPA above 3.5 is a true reflection of your academic excellence.',
            emoji: '🛡️'
        };
    }
    // 9. Consistent Performer
    // Definition: at least 2 active semesters, standard deviation < 0.20, and all active semesters >= 3.3
    if (activeSems.length >= 2) {
        const mean = student.cgpa;
        const variance = activeSems.reduce((sum, g) => sum + Math.pow(g - mean, 2), 0) / activeSems.length;
        const sd = Math.sqrt(variance);
        const allAboveThreshold = activeSems.every(g => g >= 3.3);
        if (sd < 0.20 && allAboveThreshold) {
            return {
                title: 'Consistent Performer!',
                text: 'Impressive consistency! Your semester grades show steady academic excellence across terms.',
                emoji: '🎯'
            };
        }
    }
    // 10. Most Improved
    // Definition: at least 2 active semesters, last active semester is at least 0.3 higher than the first active semester
    if (activeSems.length >= 2) {
        const diff = activeSems[activeSems.length - 1] - activeSems[0];
        if (diff >= 0.3) {
            return {
                title: 'Most Improved!',
                text: 'Superb growth! Your rising semester GPA trend is a great testament to your adaptation and resolve.',
                emoji: '📈'
            };
        }
    }

    // Default Fallback
    return {
        title: 'Congratulations!',
        text: 'You have achieved a great rank in your department. Keep shining and inspiring others!',
        emoji: '🎓'
    };
}

if (shareBtn && shareModal && canvas) {
    // Wait for fonts to load before rendering
    if (document.fonts) {
        document.fonts.ready.then(() => {
            // Ready to render
        });
    }

    shareBtn.addEventListener('click', () => {
        if (!currentResultStudent || !currentResultBatchKey) return;

        shareModal.classList.remove('hidden');
        // Small delay to allow CSS transitions
        setTimeout(() => {
            shareModal.classList.add('active');
            renderCard();
        }, 10);
    });

    closeBtn.addEventListener('click', closeModal);

    shareModal.addEventListener('click', (e) => {
        if (e.target === shareModal) closeModal();
    });

    formatTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            formatTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFormat = tab.dataset.ratio;
            renderCard();
        });
    });

    // Download
    downloadBtn.addEventListener('click', () => {
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `MUET-Result-${currentResultStudent.id}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    // Native Share
    nativeShareBtn.addEventListener('click', async () => {
        const dataUrl = canvas.toDataURL('image/png');
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `MUET-Result-${currentResultStudent.id}.png`, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: 'My MUET Result',
                    text: `Check out my MUET result for ${currentResultStudent.id}! Rank #${currentResultStudent.rank} with ${currentResultStudent.cgpa.toFixed(2)} CGPA.`
                });
            } catch (err) {
                console.error('Share failed', err);
            }
        } else {
            showToast('Native sharing not supported on this browser.', 'error');
        }
    });

    // Copy Link
    copyLinkBtn.addEventListener('click', () => {
        const url = `${window.UNIVERSITY_CONFIG.SITE_URL}/result/${currentResultStudent.id}`;
        navigator.clipboard.writeText(url).then(() => {
            showToast('Result link copied to clipboard!', 'success');
        }).catch(() => {
            showToast('Failed to copy link.', 'error');
        });
    });
}

function closeModal() {
    shareModal.classList.remove('active');
    setTimeout(() => {
        shareModal.classList.add('hidden');
    }, 300);
}

function showToast(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="${type === 'success' ? 'ri-checkbox-circle-fill' : 'ri-error-warning-fill'}"></i> ${msg}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-fadeout');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==========================================
// Canvas Rendering Engine Constants
// ==========================================

const COLORS = {
    bg: '#FDFDFE',
    cardBg: '#FFFFFF',
    border: '#E5E7EB',
    ink: '#111827',
    inkSoft: '#6B7280',
    inkFaint: '#9CA3AF',
    accent: '#6366F1',
    accentTint: '#EEF2FF',
    accentTintBorder: '#E0E3FA',
    success: '#059669',
    successTint: '#ECFDF5',
    successBorder: '#D1FAE5',
    track: '#EEF0F3',
    shadow: 'rgba(17, 24, 39, 0.10)',
    pillBg: '#FAFAFB'
};

const TYPOGRAPHY = {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
};

function getFont(weight, sizePx) {
    return `${weight} ${sizePx}px ${TYPOGRAPHY.fontFamily}`;
}

const MEASUREMENTS = {
    radiusLg: 24,
    radiusMd: 16,
    radiusSm: 10,
    badgeSize: 64,
    statBoxH: 105,
    progressTrackH: 12,
    semTrackH: 8,
    noteIconSize: 40,
    gapHeaderStat: 40,
    gapSection: 36,
    gapFooter: 32,
    statRowGap: 20
};

const LAYOUT = {
    story: {
        canvasW: 1080, canvasH: 1920,
        cardW: 936, cardH: 1752,
        padTop: 64, padRight: 56, padBottom: 48, padLeft: 56,
        isGrid: false
    },
    post: {
        canvasW: 1080, canvasH: 1080,
        cardW: 984, cardH: 936,
        padTop: 52, padRight: 56, padBottom: 40, padLeft: 56,
        isGrid: true
    }
};

let fontLoaded = false;
async function ensureFontsReady() {
    if (fontLoaded) return;
    if (document.fonts) {
        try {
            await Promise.all([
                document.fonts.load('400 12px Inter'),
                document.fonts.load('500 12px Inter'),
                document.fonts.load('600 12px Inter'),
                document.fonts.load('700 12px Inter'),
                document.fonts.load('800 12px Inter')
            ]);
            await document.fonts.ready;
            fontLoaded = true;
        } catch (e) {
            console.warn('Inter font load failed, falling back to system sans-serif', e);
        }
    }
}

// Start preloading fonts immediately
ensureFontsReady();

async function renderCard() {
    const student = currentResultStudent;
    const batchKey = currentResultBatchKey;
    if (!student) return;

    loadingEl.style.display = 'flex';
    previewImg.classList.remove('loaded');

    // Ensure fonts are fully loaded before render
    await ensureFontsReady();

    requestAnimationFrame(() => {
        setTimeout(() => {
            drawCanvas(student, batchKey, currentFormat);

            const dataUrl = canvas.toDataURL('image/png');
            previewImg.onload = () => {
                loadingEl.style.display = 'none';
                previewImg.classList.add('loaded');
            };
            previewImg.src = dataUrl;
        }, 50);
    });
}

function drawCanvas(student, batchKey, format) {
    const ctx = canvas.getContext('2d');
    const layout = LAYOUT[format];

    canvas.width = layout.canvasW;
    canvas.height = layout.canvasH;

    drawBackground(ctx, layout.canvasW, layout.canvasH);
    
    const cardX = (layout.canvasW - layout.cardW) / 2;
    const cardY = (layout.canvasH - layout.cardH) / 2;
    drawCard(ctx, cardX, cardY, layout.cardW, layout.cardH);

    const innerX = cardX + layout.padLeft;
    const innerY = cardY + layout.padTop;
    const innerW = layout.cardW - layout.padLeft - layout.padRight;

    // Derived Context for sections
    const drawCtx = { ctx, x: innerX, y: innerY, w: innerW, student, batchKey, isGrid: layout.isGrid };
    const details = getAchievementDetails(student);
    const eyebrow = details.title.endsWith('!') ? details.title.slice(0, -1) : details.title;
    
    let badgeText = '';
    if (student.rank <= 3) badgeText = student.rank.toString();
    else if (details.emoji === '📈') badgeText = '↑';
    else badgeText = details.emoji;

    drawCtx.y += drawHeader(drawCtx, badgeText, eyebrow);
    drawCtx.y += MEASUREMENTS.gapHeaderStat;

    drawCtx.y += drawStats(drawCtx);
    drawCtx.y += MEASUREMENTS.gapSection;

    drawCtx.y += drawProgress(drawCtx);
    drawCtx.y += MEASUREMENTS.gapSection;

    drawCtx.y += drawSemesterGrid(drawCtx);
    drawCtx.y += MEASUREMENTS.gapSection;

    drawAchievementNote(drawCtx, eyebrow, details.text);

    // Footer is bottom pinned
    const footerY = cardY + layout.cardH - layout.padBottom;
    drawFooter(drawCtx, footerY);
}

// ----------------------------------------------------
// Section Drawers
// ----------------------------------------------------

function drawBackground(ctx, w, h) {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);
}

function drawCard(ctx, x, y, w, h) {
    ctx.shadowColor = COLORS.shadow;
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 16;
    drawRoundedRect(ctx, x, y, w, h, MEASUREMENTS.radiusLg, COLORS.cardBg, null, 0);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    drawRoundedRect(ctx, x, y, w, h, MEASUREMENTS.radiusLg, null, COLORS.border, 1);
}

function drawHeader(dCtx, badgeText, eyebrow) {
    const { ctx, x, y, w, student, batchKey } = dCtx;
    
    drawBadge(ctx, x, y, badgeText);
    drawStudentInfo(ctx, x + MEASUREMENTS.badgeSize + 20, y, eyebrow, student.id);
    
    const batchLabel = batches?.[batchKey]?.label || batchKey;
    const rankLabel = `${batchLabel} Rank`;
    const rankText = `#${student.rank}`;
    const totalText = ` / ${batches?.[batchKey]?.students?.length || '-'}`;
    
    drawRankPill(ctx, x + w, y, rankLabel, rankText, totalText);

    return 68; // approx height of rank pill/badge
}

function drawBadge(ctx, x, y, text) {
    const size = MEASUREMENTS.badgeSize;
    const cx = x + size / 2;
    const cy = y + size / 2;
    
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.accentTint;
    ctx.fill();

    ctx.fillStyle = COLORS.accent;
    ctx.font = getFont(800, 24);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy);
}

function drawStudentInfo(ctx, x, y, eyebrow, id) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    
    ctx.font = getFont(700, 13.5);
    ctx.fillStyle = COLORS.accent;
    ctx.fillText(eyebrow.toUpperCase(), x, y + 4 + 11);

    ctx.font = getFont(800, 40);
    ctx.fillStyle = COLORS.ink;
    ctx.fillText(id, x, y + 26 + 32);
}

function drawRankPill(ctx, rightX, y, label, rankText, totalText) {
    ctx.font = getFont(700, 11.5);
    const labelW = ctx.measureText(label.toUpperCase()).width;
    
    ctx.font = getFont(800, 26);
    const valW = ctx.measureText(rankText).width;
    
    ctx.font = getFont(600, 15);
    const totalW = ctx.measureText(totalText).width;
    
    const paddingX = 22;
    const pillW = Math.max(labelW, valW + totalW + 4) + paddingX * 2;
    const pillH = 68;
    const x = rightX - pillW;

    drawRoundedRect(ctx, x, y, pillW, pillH, MEASUREMENTS.radiusMd, COLORS.pillBg, COLORS.border, 1);

    const innerRightX = x + pillW - paddingX;
    
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.font = getFont(700, 11.5);
    ctx.fillStyle = COLORS.inkFaint;
    ctx.fillText(label.toUpperCase(), innerRightX, y + 14 + 9);

    ctx.font = getFont(600, 15);
    ctx.fillStyle = COLORS.inkFaint;
    ctx.fillText(totalText, innerRightX, y + pillH - 14);

    const totalWidthActual = ctx.measureText(totalText).width;
    ctx.font = getFont(800, 26);
    ctx.fillStyle = COLORS.ink;
    ctx.fillText(rankText, innerRightX - totalWidthActual - 4, y + pillH - 14);
}

function drawStats(dCtx) {
    const { ctx, x, y, w, student } = dCtx;
    const boxW = (w - MEASUREMENTS.statRowGap) / 2;
    const boxH = MEASUREMENTS.statBoxH;

    // Net CGPA box
    drawStatBox(ctx, x, y, boxW, boxH, 'Net CGPA', student.cgpa.toFixed(2), true, null);
    
    // Grade Class box
    const chipText = student.cgpa >= 3.8 ? 'Excellent' : null;
    drawStatBox(ctx, x + boxW + MEASUREMENTS.statRowGap, y, boxW, boxH, 'Grade Class', student.grade, false, chipText);

    return boxH;
}

function drawStatBox(ctx, x, y, w, h, label, value, isAccent, chipText) {
    drawRoundedRect(ctx, x, y, w, h, MEASUREMENTS.radiusMd, COLORS.cardBg, COLORS.border, 1);

    const padX = 26;
    const padY = 22;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = getFont(700, 12.5);
    ctx.fillStyle = COLORS.inkFaint;
    ctx.fillText(label.toUpperCase(), x + padX, y + padY + 10);

    ctx.font = getFont(800, 38);
    ctx.fillStyle = isAccent ? COLORS.accent : COLORS.ink;
    ctx.fillText(value, x + padX, y + padY + 12.5 + 10 + 32);

    if (chipText) {
        ctx.font = getFont(700, 11.5);
        const textW = ctx.measureText(chipText).width;
        const chipW = textW + 20;
        const chipH = 22;
        const chipX = x + w - 18 - chipW;
        const chipY = y + 18;

        drawRoundedRect(ctx, chipX, chipY, chipW, chipH, 11, COLORS.successTint, COLORS.successBorder, 1);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = COLORS.success;
        ctx.fillText(chipText, chipX + chipW / 2, chipY + chipH / 2 + 0.5);
    }
}

function drawProgress(dCtx) {
    const { ctx, x, y, w, student } = dCtx;
    const title = 'CGPA Progress';
    const fractionText = `${student.cgpa.toFixed(2)} / 4.00`;
    const progress = student.cgpa / 4.0;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = getFont(700, 16);
    ctx.fillStyle = COLORS.ink;
    ctx.fillText(title, x, y + 13);

    ctx.textAlign = 'right';
    ctx.font = getFont(700, 15);
    ctx.fillStyle = COLORS.inkSoft;
    ctx.fillText(fractionText, x + w, y + 13);

    const trackY = y + 16 + 12; // Title height + margin-bottom
    const trackH = MEASUREMENTS.progressTrackH;
    
    drawRoundedRect(ctx, x, trackY, w, trackH, trackH / 2, COLORS.track, null, 0);

    const fillW = w * Math.min(1, Math.max(0, progress));
    if (fillW > 0) {
        drawRoundedRect(ctx, x, trackY, fillW, trackH, trackH / 2, COLORS.accent, null, 0);
    }

    return 16 + 12 + trackH; // Total height used by progress block
}

function drawSemesterGrid(dCtx) {
    const { ctx, x, y, w, student, isGrid } = dCtx;
    const activeSemesters = student.semesters
        .map((val, idx) => ({ label: `S${idx + 1}`, val }))
        .filter(sem => sem.val > 0);
    const numSems = activeSemesters.length;
    
    const padX = 28;
    const padY = 26;
    const titleMargin = 22;
    const rowGap = 18;
    const rowH = 20;

    let boxH = padY + 18 + titleMargin + padY; // Base height
    if (isGrid) {
        const rows = Math.ceil(numSems / 2);
        boxH += rows * rowH + (rows - 1) * rowGap;
    } else {
        boxH += numSems * rowH + (numSems - 1) * rowGap;
    }

    drawRoundedRect(ctx, x, y, w, boxH, MEASUREMENTS.radiusMd, COLORS.cardBg, COLORS.border, 1);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = getFont(700, 18);
    ctx.fillStyle = COLORS.ink;
    ctx.fillText('Semester Breakdown', x + padX, y + padY + 15);

    const startY = y + padY + 18 + titleMargin;
    
    if (isGrid) {
        const colGap = 28;
        const colW = (w - padX * 2 - colGap) / 2;
        const col1X = x + padX;
        const col2X = col1X + colW + colGap;

        activeSemesters.forEach((sem, idx) => {
            const isLast = idx === numSems - 1;
            const row = Math.floor(idx / 2);
            const col = idx % 2;
            const rx = col === 0 ? col1X : col2X;
            const ry = startY + row * (rowH + rowGap);
            drawSemesterRow(ctx, rx, ry, colW, sem, isLast);
        });
    } else {
        const rowW = w - padX * 2;
        const rx = x + padX;
        activeSemesters.forEach((sem, idx) => {
            const isLast = idx === numSems - 1;
            const ry = startY + idx * (rowH + rowGap);
            drawSemesterRow(ctx, rx, ry, rowW, sem, isLast);
        });
    }

    return boxH;
}

function drawSemesterRow(ctx, x, y, w, sem, isLast) {
    const lblW = 34;
    const gap = 18;
    const valW = 56;
    const trackW = w - lblW - gap - valW - gap;
    const trackH = MEASUREMENTS.semTrackH;
    
    ctx.textAlign = 'left';
    ctx.font = getFont(700, 14);
    ctx.fillStyle = COLORS.inkSoft;
    ctx.fillText(sem.label, x, y + 15);

    const trackX = x + lblW + gap;
    const trackY = y + 6;
    drawRoundedRect(ctx, trackX, trackY, trackW, trackH, trackH / 2, COLORS.track, null, 0);

    const fillW = trackW * (sem.val / 4.0);
    if (fillW > 0) {
        const fillCol = isLast ? COLORS.accent : 'rgba(99, 102, 241, 0.55)';
        drawRoundedRect(ctx, trackX, trackY, fillW, trackH, trackH / 2, fillCol, null, 0);
    }

    ctx.textAlign = 'right';
    ctx.font = getFont(700, 15);
    ctx.fillStyle = isLast ? COLORS.accent : COLORS.ink;
    ctx.fillText(sem.val.toFixed(2), x + w, y + 15);
}

function drawAchievementNote(dCtx, title, desc) {
    const { ctx, x, y, w } = dCtx;
    const padX = 26;
    const padY = 22;
    const iconSize = MEASUREMENTS.noteIconSize;
    const gap = 18;
    
    const textStartX = x + padX + iconSize + gap;
    const textMaxW = w - padX * 2 - iconSize - gap;
    
    ctx.font = getFont(500, 14.5);
    const lines = getWrappedLines(ctx, desc, textMaxW);
    const lineHeight = 14.5 * 1.5;
    const textH = 16.5 + 5 + lines.length * lineHeight; // title + gap + desc lines
    
    const noteH = Math.max(iconSize, textH) + padY * 2;
    
    drawRoundedRect(ctx, x, y, w, noteH, MEASUREMENTS.radiusMd, COLORS.accentTint, COLORS.accentTintBorder, 1);

    const iconCx = x + padX + iconSize / 2;
    const iconCy = y + padY + iconSize / 2;
    ctx.beginPath();
    ctx.arc(iconCx, iconCy, iconSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.accent;
    ctx.fill();

    drawCheckIcon(ctx, iconCx, iconCy);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = getFont(700, 16.5);
    ctx.fillStyle = COLORS.ink;
    ctx.fillText(title, textStartX, y + padY + 13);

    ctx.font = getFont(500, 14.5);
    ctx.fillStyle = COLORS.inkSoft;
    let currentY = y + padY + 16.5 + 5 + 11.5;
    lines.forEach(line => {
        ctx.fillText(line, textStartX, currentY);
        currentY += lineHeight;
    });

    return noteH;
}

function drawFooter(dCtx, bottomY) {
    const { ctx, x, w } = dCtx;
    
    // Left L2 (bottom aligned)
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = getFont(800, 16);
    ctx.fillStyle = COLORS.accent;
    ctx.fillText('muetcsresults.vercel.app', x, bottomY);

    // Left L1
    ctx.font = getFont(600, 13);
    ctx.fillStyle = COLORS.inkFaint;
    ctx.fillText('Check your rank now!', x, bottomY - 16 - 4);

    // Right L2
    ctx.textAlign = 'right';
    ctx.font = getFont(800, 14);
    ctx.fillStyle = COLORS.ink;
    ctx.fillText('MUET Results Portal', x + w, bottomY);

    // Right L1
    ctx.font = getFont(600, 12);
    ctx.fillStyle = COLORS.inkFaint;
    ctx.fillText('Powered by', x + w, bottomY - 14 - 4);
}

// ----------------------------------------------------
// Low-Level Drawing Utilities
// ----------------------------------------------------

function drawRoundedRect(ctx, x, y, w, h, r, fillStyle = null, strokeStyle = null, strokeWidth = 1) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
    }
    if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
    }
}

function drawCheckIcon(ctx, cx, cy) {
    ctx.beginPath();
    ctx.moveTo(cx - 5.25, cy + 0.75);
    ctx.lineTo(cx - 2.25, cy + 3.75);
    ctx.lineTo(cx + 5.25, cy - 3.75);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.95;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
}

function getWrappedLines(ctx, text, maxWidth) {
    const words = text.split(' ');
    let lines = [];
    let currentLine = '';

    for (let n = 0; n < words.length; n++) {
        const testLine = currentLine + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && n > 0) {
            lines.push(currentLine.trim());
            currentLine = words[n] + ' ';
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) {
        lines.push(currentLine.trim());
    }
    return lines;
}
