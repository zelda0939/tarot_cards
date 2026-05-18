/* ============================
   提問面板邏輯
   ============================ */
import { AppState } from './state.js';

export function getActiveQuestionText() {
    const questionInput = document.getElementById('user-question-input');
    const typedQuestion = questionInput ? questionInput.value.trim() : '';
    return typedQuestion || AppState.userQuestion;
}

export function syncQuestionPreview() {
    const previewEl = document.getElementById('question-preview');
    if (!previewEl) return;
    const activeQuestion = getActiveQuestionText();
    previewEl.textContent = activeQuestion
        ? `目前提問：${activeQuestion}`
        : '尚未填寫提問，點「修改問題」輸入。';
}

export function setQuestionPanelCompact(shouldCompact, options = {}) {
    const questionPanel = document.getElementById('question-panel');
    const questionToggleBtn = document.getElementById('question-toggle-btn');
    const questionClearBtn = document.getElementById('question-clear-btn');
    const questionPreview = document.getElementById('question-preview');
    const questionInput = document.getElementById('user-question-input');
    if (!questionPanel) return;

    if (shouldCompact) {
        questionPanel.classList.add('compact');
        syncQuestionPreview();
        if (questionPreview) questionPreview.classList.remove('hidden');
        if (questionToggleBtn) {
            questionToggleBtn.classList.remove('hidden');
            questionToggleBtn.textContent = '修改問題';
        }
        if (questionClearBtn) questionClearBtn.classList.add('hidden');
        return;
    }

    questionPanel.classList.remove('compact');
    if (questionPreview) questionPreview.classList.add('hidden');
    if (questionToggleBtn) {
        questionToggleBtn.classList.remove('hidden');
        questionToggleBtn.textContent = '收合';
    }
    if (questionClearBtn) questionClearBtn.classList.remove('hidden');
    if (!options.skipFocus && questionInput) questionInput.focus();
}
