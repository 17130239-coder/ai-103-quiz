// ==========================================================================
// AI-103 Quiz Application Logic (Enhanced UI/UX via Stitch)
// ==========================================================================

(function () {
  'use strict';

  // --- App State ---
  const STORAGE_KEY = 'ai103_quiz_state_v3';
  
  let questions = [];
  let currentIndex = 0;
  let mode = 'study'; // 'study' | 'exam'
  let currentFilter = 'all'; // 'all' | 'unanswered' | 'wrong' | 'correct' | 'bookmarked'
  let filteredIndices = [];
  
  let userAnswers = {}; // { [qId]: { selectedKeys: [], isCorrect: boolean, revealed: boolean } }
  let bookmarks = new Set();
  let isDarkMode = true;
  
  let examTimerId = null;
  let examSeconds = 0;

  // --- DOM Elements ---
  const elBtnStudyMode = document.getElementById('btnStudyMode');
  const elBtnExamMode = document.getElementById('btnExamMode');
  const elExamTimer = document.getElementById('examTimer');
  const elTimerText = document.getElementById('timerText');
  const elBtnThemeToggle = document.getElementById('btnThemeToggle');
  const elThemeIconSun = document.getElementById('themeIconSun');
  const elThemeIconMoon = document.getElementById('themeIconMoon');

  const elFilterPills = document.querySelectorAll('.filter-pill');
  const elCountAll = document.getElementById('countAll');
  const elCountUnanswered = document.getElementById('countUnanswered');
  const elCountWrong = document.getElementById('countWrong');
  const elCountCorrect = document.getElementById('countCorrect');
  const elCountBookmarked = document.getElementById('countBookmarked');
  const elProgressBarFill = document.getElementById('progressBarFill');
  const elProgressLabel = document.getElementById('progressLabel');

  const elQNumber = document.getElementById('qNumber');
  const elQTypeBadge = document.getElementById('qTypeBadge');
  const elBtnBookmark = document.getElementById('btnBookmark');
  const elBookmarkText = document.getElementById('bookmarkText');
  const elQuestionText = document.getElementById('questionText');
  const elQuestionImages = document.getElementById('questionImages');
  const elOptionsContainer = document.getElementById('optionsContainer');

  const elBtnToggleExplanation = document.getElementById('btnToggleExplanation');
  const elToggleExplText = document.getElementById('toggleExplText');
  const elBtnResetAnswer = document.getElementById('btnResetAnswer');
  const elBtnExamSubmit = document.getElementById('btnExamSubmit');
  const elExplanationBox = document.getElementById('explanationBox');
  const elExplCorrectAnswer = document.getElementById('explCorrectAnswer');
  const elExplBody = document.getElementById('explBody');

  const elBtnPrev = document.getElementById('btnPrev');
  const elBtnNext = document.getElementById('btnNext');
  const elNavStatus = document.getElementById('navStatus');

  // Drawer
  const elToggleDrawerBtn = document.getElementById('toggleDrawerBtn');
  const elQuestionDrawer = document.getElementById('questionDrawer');
  const elCloseDrawerBtn = document.getElementById('closeDrawerBtn');
  const elDrawerOverlay = document.getElementById('drawerOverlay');
  const elGridContainer = document.getElementById('gridContainer');
  const elGridSearchInput = document.getElementById('gridSearchInput');
  const elBtnResetAllProgress = document.getElementById('btnResetAllProgress');

  // Lightbox
  const elLightboxModal = document.getElementById('lightboxModal');
  const elLightboxImg = document.getElementById('lightboxImg');
  const elBtnCloseLightbox = document.getElementById('btnCloseLightbox');

  // Exam Result Modal
  const elExamResultModal = document.getElementById('examResultModal');
  const elBtnCloseExamResult = document.getElementById('btnCloseExamResult');
  const elResultScorePercent = document.getElementById('resultScorePercent');
  const elResultPassStatus = document.getElementById('resultPassStatus');
  const elResTotal = document.getElementById('resTotal');
  const elResCorrect = document.getElementById('resCorrect');
  const elResWrong = document.getElementById('resWrong');
  const elResSkipped = document.getElementById('resSkipped');
  const elResTime = document.getElementById('resTime');
  const elBtnReviewWrong = document.getElementById('btnReviewWrong');
  const elBtnRestartExam = document.getElementById('btnRestartExam');

  // --- Initializer ---
  async function initApp() {
    loadSavedTheme();
    loadSavedState();

    if (window.QUIZ_DATA && window.QUIZ_DATA.questions) {
      questions = window.QUIZ_DATA.questions;
      onDataReady();
    } else {
      try {
        const res = await fetch('data/ai-103-questions.json');
        const data = await res.json();
        questions = data.questions;
        onDataReady();
      } catch (err) {
        console.error('Failed to load questions:', err);
        elQuestionText.textContent = 'Không thể nạp file dữ liệu ai-103-questions.json.';
      }
    }

    setupEventListeners();
  }

  function onDataReady() {
    updateFilteredIndices();
    updateStats();
    renderCurrentQuestion();
    renderGridItems();
  }

  // --- Persistence ---
  function loadSavedState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.userAnswers) userAnswers = parsed.userAnswers;
        if (parsed.bookmarks) bookmarks = new Set(parsed.bookmarks);
        if (typeof parsed.currentIndex === 'number') currentIndex = parsed.currentIndex;
      }
    } catch (e) {
      console.warn('Could not load stored state:', e);
    }
  }

  function saveState() {
    try {
      const payload = {
        userAnswers,
        bookmarks: Array.from(bookmarks),
        currentIndex
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Could not save state:', e);
    }
  }

  function loadSavedTheme() {
    const saved = localStorage.getItem('ai103_quiz_dark');
    if (saved !== null) {
      isDarkMode = saved === 'true';
    } else {
      isDarkMode = true; // Default modern dark slate theme
    }
    applyTheme(isDarkMode);
  }

  function applyTheme(dark) {
    isDarkMode = dark;
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      elThemeIconSun.classList.remove('hidden');
      elThemeIconMoon.classList.add('hidden');
    } else {
      document.documentElement.classList.remove('dark');
      elThemeIconSun.classList.add('hidden');
      elThemeIconMoon.classList.remove('hidden');
    }
    localStorage.setItem('ai103_quiz_dark', isDarkMode);
  }

  // --- Filtering & Navigation ---
  function updateFilteredIndices() {
    const indices = [];
    questions.forEach((q, idx) => {
      const ans = userAnswers[q.id];
      const isBookmarked = bookmarks.has(q.id);

      if (currentFilter === 'all') {
        indices.push(idx);
      } else if (currentFilter === 'unanswered') {
        if (!ans || !ans.selectedKeys || ans.selectedKeys.length === 0) indices.push(idx);
      } else if (currentFilter === 'correct') {
        if (ans && ans.isCorrect === true) indices.push(idx);
      } else if (currentFilter === 'wrong') {
        if (ans && ans.isCorrect === false) indices.push(idx);
      } else if (currentFilter === 'bookmarked') {
        if (isBookmarked) indices.push(idx);
      }
    });

    filteredIndices = indices;
    if (filteredIndices.length === 0) {
      filteredIndices = [currentIndex];
    } else if (!filteredIndices.includes(currentIndex)) {
      currentIndex = filteredIndices[0];
    }
  }

  function goToIndex(newIndex) {
    if (newIndex < 0 || newIndex >= questions.length) return;
    currentIndex = newIndex;
    saveState();
    renderCurrentQuestion();
    updateNavButtons();
    renderGridItems(elGridSearchInput ? elGridSearchInput.value : '');
  }

  function goToNext() {
    const pos = filteredIndices.indexOf(currentIndex);
    if (pos !== -1 && pos < filteredIndices.length - 1) {
      goToIndex(filteredIndices[pos + 1]);
    } else if (currentIndex < questions.length - 1) {
      goToIndex(currentIndex + 1);
    }
  }

  function goToPrev() {
    const pos = filteredIndices.indexOf(currentIndex);
    if (pos > 0) {
      goToIndex(filteredIndices[pos - 1]);
    } else if (currentIndex > 0) {
      goToIndex(currentIndex - 1);
    }
  }

  // --- Question Rendering ---
  function renderCurrentQuestion() {
    const q = questions[currentIndex];
    if (!q) return;

    // 1. Meta
    const filterPos = filteredIndices.indexOf(currentIndex);
    const posText = filterPos !== -1 
      ? `Câu ${q.id} (${filterPos + 1}/${filteredIndices.length})`
      : `Câu ${q.id} / ${questions.length}`;
    elQNumber.textContent = posText;
    elNavStatus.textContent = `${currentIndex + 1} / ${questions.length}`;

    // Badge Type
    const typeNames = {
      multiple_choice_single: 'Trắc nghiệm đơn',
      multiple_choice_multi: 'Chọn nhiều đáp án',
      yes_no: 'Nhận định Đúng / Sai',
      drag_drop: 'Kéo thả / Ghép cặp',
      matching_hot_area: 'Hot Area / Lựa chọn'
    };
    elQTypeBadge.textContent = typeNames[q.type] || 'Trắc nghiệm';

    // Bookmark
    if (bookmarks.has(q.id)) {
      elBtnBookmark.classList.add('bookmarked');
      elBookmarkText.textContent = 'Đã lưu [B]';
    } else {
      elBtnBookmark.classList.remove('bookmarked');
      elBookmarkText.textContent = 'Đánh dấu [B]';
    }

    // 2. Question Prompt
    elQuestionText.textContent = q.question;

    // 3. Images
    renderImages(q);

    // 4. Options
    renderOptions(q);

    // 5. Explanation
    renderExplanation(q);

    // 6. Action buttons
    updateActionButtons(q);

    // 7. Nav Buttons
    updateNavButtons();
  }

  function renderImages(q) {
    elQuestionImages.innerHTML = '';
    if (q.images && q.images.length > 0) {
      elQuestionImages.style.display = 'flex';
      q.images.forEach((imgObj, i) => {
        const wrap = document.createElement('div');
        wrap.className = 'q-img-wrap';
        wrap.title = 'Click để xem kích thước chuẩn';
        
        const img = document.createElement('img');
        img.src = imgObj.path;
        img.alt = `Sơ đồ / Bảng câu hỏi Q${q.id}`;
        img.loading = 'lazy';

        const hint = document.createElement('span');
        hint.className = 'block text-xs text-on-surface-variant/80 mt-2 font-mono';
        hint.textContent = `🔍 Hình ${i + 1} (Trang ${imgObj.page}) - Click để phóng to`;

        wrap.appendChild(img);
        wrap.appendChild(hint);

        wrap.addEventListener('click', () => openLightbox(imgObj.path));
        elQuestionImages.appendChild(wrap);
      });
    } else {
      elQuestionImages.style.display = 'none';
    }
  }

  function renderOptions(q) {
    elOptionsContainer.innerHTML = '';
    const ansState = userAnswers[q.id] || { selectedKeys: [], isCorrect: null, revealed: false };

    if (q.options && q.options.length > 0) {
      const isMulti = q.type === 'multiple_choice_multi';
      
      q.options.forEach((opt, optIndex) => {
        const item = document.createElement('div');
        item.className = 'option-item group';
        item.dataset.key = opt.key;

        const isSelected = ansState.selectedKeys.includes(opt.key);
        if (isSelected) item.classList.add('selected');

        // Status badges for Study mode
        let statusBadgeHtml = '';

        if (mode === 'study' && ansState.selectedKeys.length > 0) {
          const isKeyCorrect = q.answer_keys.includes(opt.key);
          if (isKeyCorrect) {
            item.classList.add('correct');
            statusBadgeHtml = `<span class="px-2 py-0.5 rounded bg-secondary/20 text-secondary text-[11px] font-mono font-semibold ml-2">Chính xác</span>`;
          } else if (isSelected && !isKeyCorrect) {
            item.classList.add('wrong');
            statusBadgeHtml = `<span class="px-2 py-0.5 rounded bg-tertiary/20 text-tertiary text-[11px] font-mono font-semibold ml-2">Bạn đã chọn</span>`;
          }
        }

        const keyBadge = document.createElement('div');
        keyBadge.className = 'option-key';
        keyBadge.textContent = opt.key;

        const body = document.createElement('div');
        body.className = 'option-body';
        body.textContent = opt.text;

        const trailing = document.createElement('div');
        trailing.className = 'shrink-0 flex items-center ml-2';
        trailing.innerHTML = `
          ${statusBadgeHtml}
          <span class="text-[10px] font-mono text-on-surface-variant border border-outline-variant/40 px-1.5 py-0.5 rounded bg-surface-container ml-2 hidden sm:inline opacity-60 group-hover:opacity-100">${optIndex + 1}</span>
        `;

        item.appendChild(keyBadge);
        item.appendChild(body);
        item.appendChild(trailing);

        item.addEventListener('click', () => handleOptionClick(q, opt.key));
        elOptionsContainer.appendChild(item);
      });

      // Multi-choice confirmation button
      if (isMulti && mode === 'study' && ansState.selectedKeys.length > 0 && !ansState.revealed) {
        const confirmWrap = document.createElement('div');
        confirmWrap.className = 'pt-2';
        const btnConfirm = document.createElement('button');
        btnConfirm.className = 'btn-primary';
        btnConfirm.textContent = 'Kiểm tra kết quả lựa chọn';
        btnConfirm.addEventListener('click', () => {
          submitMultiChoice(q);
        });
        confirmWrap.appendChild(btnConfirm);
        elOptionsContainer.appendChild(confirmWrap);
      }

    } else {
      // Non-MC question guide
      const helper = document.createElement('div');
      helper.className = 'interactive-guide';
      helper.innerHTML = `<strong>Dạng câu hỏi tương tác:</strong> Câu hỏi này sử dụng sơ đồ / đoạn mã / bảng đối chiếu kéo thả ở trên. Bạn hãy đọc đề, suy nghĩ phương án rồi bấm <strong>"Xem đáp án & giải thích"</strong> bên dưới để đối chiếu.`;
      elOptionsContainer.appendChild(helper);
    }
  }

  function handleOptionClick(q, key) {
    const isMulti = q.type === 'multiple_choice_multi';
    const current = userAnswers[q.id] || { selectedKeys: [], isCorrect: null, revealed: false };

    if (mode === 'study') {
      if (isMulti) {
        let keys = [...current.selectedKeys];
        if (keys.includes(key)) {
          keys = keys.filter(k => k !== key);
        } else {
          keys.push(key);
        }
        userAnswers[q.id] = { selectedKeys: keys, isCorrect: null, revealed: false };
        saveState();
        renderOptions(q);
      } else {
        const isCorrect = q.answer_keys.includes(key);
        userAnswers[q.id] = {
          selectedKeys: [key],
          isCorrect: isCorrect,
          revealed: true
        };
        saveState();
        updateStats();
        renderCurrentQuestion();
        renderGridItems(elGridSearchInput ? elGridSearchInput.value : '');
      }
    } else {
      // Exam mode
      if (isMulti) {
        let keys = [...current.selectedKeys];
        if (keys.includes(key)) {
          keys = keys.filter(k => k !== key);
        } else {
          keys.push(key);
        }
        userAnswers[q.id] = { selectedKeys: keys, isCorrect: null, revealed: false };
      } else {
        userAnswers[q.id] = { selectedKeys: [key], isCorrect: null, revealed: false };
      }
      saveState();
      updateStats();
      renderOptions(q);
      renderGridItems(elGridSearchInput ? elGridSearchInput.value : '');
    }
  }

  function submitMultiChoice(q) {
    const current = userAnswers[q.id];
    if (!current || current.selectedKeys.length === 0) return;

    const selectedSorted = [...current.selectedKeys].sort().join(',');
    const correctSorted = [...q.answer_keys].sort().join(',');
    const isCorrect = selectedSorted === correctSorted;

    userAnswers[q.id] = {
      selectedKeys: current.selectedKeys,
      isCorrect: isCorrect,
      revealed: true
    };

    saveState();
    updateStats();
    renderCurrentQuestion();
    renderGridItems(elGridSearchInput ? elGridSearchInput.value : '');
  }

  function renderExplanation(q) {
    const ansState = userAnswers[q.id];
    const isRevealed = ansState && ansState.revealed;

    if (isRevealed && mode === 'study') {
      elExplanationBox.style.display = 'block';
      elExplCorrectAnswer.textContent = q.answer;
      elExplBody.textContent = q.explanation;
      elToggleExplText.textContent = 'Ẩn giải thích';
    } else {
      elExplanationBox.style.display = 'none';
      elToggleExplText.textContent = 'Xem đáp án & giải thích';
    }
  }

  function updateActionButtons(q) {
    const ansState = userAnswers[q.id];

    if (mode === 'study') {
      elBtnToggleExplanation.style.display = 'flex';
      elBtnExamSubmit.style.display = 'none';

      if (ansState && ansState.selectedKeys.length > 0) {
        elBtnResetAnswer.style.display = 'inline-flex';
      } else {
        elBtnResetAnswer.style.display = 'none';
      }
    } else {
      elBtnToggleExplanation.style.display = 'none';
      elBtnResetAnswer.style.display = 'none';
      elBtnExamSubmit.style.display = 'inline-flex';
    }
  }

  function updateNavButtons() {
    const filterPos = filteredIndices.indexOf(currentIndex);
    elBtnPrev.disabled = filterPos <= 0 && currentIndex <= 0;
    elBtnNext.disabled = filterPos === filteredIndices.length - 1 && currentIndex === questions.length - 1;
  }

  // --- Stats and Progress ---
  function updateStats() {
    let answered = 0;
    let correct = 0;
    let wrong = 0;

    questions.forEach(q => {
      const a = userAnswers[q.id];
      if (a && a.selectedKeys && a.selectedKeys.length > 0) {
        answered++;
        if (a.isCorrect === true) correct++;
        if (a.isCorrect === false) wrong++;
      }
    });

    const unanswered = questions.length - answered;
    const bookmarkedCount = bookmarks.size;

    elCountAll.textContent = questions.length;
    elCountUnanswered.textContent = unanswered;
    elCountWrong.textContent = wrong;
    elCountCorrect.textContent = correct;
    elCountBookmarked.textContent = bookmarkedCount;

    const percent = Math.round((answered / (questions.length || 1)) * 100);
    elProgressBarFill.style.width = `${percent}%`;
    elProgressLabel.innerHTML = `<strong class="text-on-surface font-medium">${answered}</strong> / ${questions.length} hoàn thành (${percent}%)`;
  }

  // --- Slide-over Drawer ---
  function openDrawer() {
    elQuestionDrawer.classList.remove('translate-x-full');
    elDrawerOverlay.classList.remove('opacity-0', 'pointer-events-none');
    renderGridItems(elGridSearchInput.value);
    elGridSearchInput.focus();
  }

  function closeDrawer() {
    elQuestionDrawer.classList.add('translate-x-full');
    elDrawerOverlay.classList.add('opacity-0', 'pointer-events-none');
  }

  function renderGridItems(keyword = '') {
    elGridContainer.innerHTML = '';
    const kw = keyword.toLowerCase().trim();

    questions.forEach((q, idx) => {
      if (kw) {
        const textMatch = q.question.toLowerCase().includes(kw) || 
                          q.explanation.toLowerCase().includes(kw) ||
                          `câu ${q.id}`.includes(kw) ||
                          `q${q.id}`.includes(kw);
        if (!textMatch) return;
      }

      const item = document.createElement('button');
      item.className = 'grid-item';
      item.textContent = q.id;

      if (idx === currentIndex) item.classList.add('current');
      if (bookmarks.has(q.id)) item.classList.add('bookmarked');

      const ans = userAnswers[q.id];
      if (ans && ans.selectedKeys && ans.selectedKeys.length > 0) {
        if (ans.isCorrect === true) item.classList.add('correct');
        else if (ans.isCorrect === false) item.classList.add('wrong');
      }

      item.addEventListener('click', () => {
        goToIndex(idx);
        closeDrawer();
      });

      elGridContainer.appendChild(item);
    });
  }

  // --- Lightbox ---
  function openLightbox(src) {
    elLightboxImg.src = src;
    elLightboxModal.style.display = 'flex';
  }

  function closeLightbox() {
    elLightboxModal.style.display = 'none';
    elLightboxImg.src = '';
  }

  // --- Exam Mode Logic ---
  function setMode(newMode) {
    mode = newMode;
    if (mode === 'study') {
      elBtnStudyMode.className = 'px-3.5 py-1 rounded-md text-xs sm:text-sm font-medium transition-all bg-primary-container text-on-primary-container shadow-sm';
      elBtnExamMode.className = 'px-3.5 py-1 rounded-md text-xs sm:text-sm font-medium transition-all text-on-surface-variant hover:text-on-surface';
      elExamTimer.classList.add('hidden');
      elExamTimer.classList.remove('flex');
      stopExamTimer();
    } else {
      elBtnExamMode.className = 'px-3.5 py-1 rounded-md text-xs sm:text-sm font-medium transition-all bg-primary-container text-on-primary-container shadow-sm';
      elBtnStudyMode.className = 'px-3.5 py-1 rounded-md text-xs sm:text-sm font-medium transition-all text-on-surface-variant hover:text-on-surface';
      elExamTimer.classList.remove('hidden');
      elExamTimer.classList.add('flex');
      startExamTimer();
    }
    renderCurrentQuestion();
  }

  function startExamTimer() {
    clearInterval(examTimerId);
    examSeconds = 0;
    updateTimerDisplay();
    examTimerId = setInterval(() => {
      examSeconds++;
      updateTimerDisplay();
    }, 1000);
  }

  function stopExamTimer() {
    clearInterval(examTimerId);
  }

  function updateTimerDisplay() {
    const mins = Math.floor(examSeconds / 60);
    const secs = examSeconds % 60;
    elTimerText.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function submitExam() {
    stopExamTimer();

    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    questions.forEach(q => {
      const ans = userAnswers[q.id];
      if (!ans || !ans.selectedKeys || ans.selectedKeys.length === 0) {
        skipped++;
      } else {
        if (q.options && q.options.length > 0) {
          const selected = [...ans.selectedKeys].sort().join(',');
          const correctAns = [...q.answer_keys].sort().join(',');
          if (selected === correctAns) {
            ans.isCorrect = true;
            correct++;
          } else {
            ans.isCorrect = false;
            wrong++;
          }
        } else {
          ans.isCorrect = true;
          correct++;
        }
        ans.revealed = true;
      }
    });

    saveState();
    updateStats();

    const total = questions.length;
    const pct = Math.round((correct / total) * 100);
    elResultScorePercent.textContent = `${pct}%`;
    elResultPassStatus.textContent = pct >= 70 ? '🎉 ĐẠT CHỈ TIÊU (PASS)' : 'CẦN ÔN TẬP THÊM';
    elResTotal.textContent = total;
    elResCorrect.textContent = correct;
    elResWrong.textContent = wrong;
    elResSkipped.textContent = skipped;
    elResTime.textContent = elTimerText.textContent;

    elExamResultModal.style.display = 'flex';
  }

  // --- Event Listeners ---
  function setupEventListeners() {
    // Mode Switch
    elBtnStudyMode.addEventListener('click', () => setMode('study'));
    elBtnExamMode.addEventListener('click', () => setMode('exam'));

    // Theme Toggle
    elBtnThemeToggle.addEventListener('click', () => {
      applyTheme(!isDarkMode);
    });

    // Drawer Toggle
    elToggleDrawerBtn.addEventListener('click', openDrawer);
    elCloseDrawerBtn.addEventListener('click', closeDrawer);
    elDrawerOverlay.addEventListener('click', closeDrawer);
    elGridSearchInput.addEventListener('input', (e) => {
      renderGridItems(e.target.value);
    });

    // Reset All Progress
    elBtnResetAllProgress.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn đặt lại toàn bộ lịch sử làm bài và điểm số không?')) {
        userAnswers = {};
        bookmarks.clear();
        saveState();
        updateStats();
        updateFilteredIndices();
        renderCurrentQuestion();
        renderGridItems();
        closeDrawer();
      }
    });

    // Lightbox
    elBtnCloseLightbox.addEventListener('click', closeLightbox);
    elLightboxModal.addEventListener('click', (e) => {
      if (e.target === elLightboxModal) closeLightbox();
    });

    // Exam Submit & Modal
    elBtnExamSubmit.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn nộp bài và chấm điểm thi thử ngay bây giờ không?')) {
        submitExam();
      }
    });
    elBtnCloseExamResult.addEventListener('click', () => {
      elExamResultModal.style.display = 'none';
      setMode('study');
    });
    elBtnRestartExam.addEventListener('click', () => {
      elExamResultModal.style.display = 'none';
      userAnswers = {};
      saveState();
      updateStats();
      goToIndex(0);
      setMode('exam');
    });
    elBtnReviewWrong.addEventListener('click', () => {
      elExamResultModal.style.display = 'none';
      setMode('study');
      document.querySelector('.filter-pill[data-filter="wrong"]').click();
    });

    // Filter Pills
    elFilterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        elFilterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentFilter = pill.dataset.filter;
        updateFilteredIndices();
        renderCurrentQuestion();
      });
    });

    // Bookmark Toggle
    elBtnBookmark.addEventListener('click', () => {
      const q = questions[currentIndex];
      if (!q) return;
      if (bookmarks.has(q.id)) {
        bookmarks.delete(q.id);
      } else {
        bookmarks.add(q.id);
      }
      saveState();
      updateStats();
      renderCurrentQuestion();
      renderGridItems(elGridSearchInput ? elGridSearchInput.value : '');
    });

    // Toggle Explanation
    elBtnToggleExplanation.addEventListener('click', () => {
      const q = questions[currentIndex];
      if (!q) return;
      const ans = userAnswers[q.id] || { selectedKeys: [], isCorrect: null, revealed: false };
      ans.revealed = !ans.revealed;
      userAnswers[q.id] = ans;
      saveState();
      renderExplanation(q);
    });

    // Reset current question
    elBtnResetAnswer.addEventListener('click', () => {
      const q = questions[currentIndex];
      if (!q) return;
      delete userAnswers[q.id];
      saveState();
      updateStats();
      renderCurrentQuestion();
      renderGridItems(elGridSearchInput ? elGridSearchInput.value : '');
    });

    // Navigation buttons
    elBtnNext.addEventListener('click', goToNext);
    elBtnPrev.addEventListener('click', goToPrev);

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') {
        if (e.key === 'Escape') closeDrawer();
        return;
      }

      if (e.key === 'Escape') {
        closeDrawer();
        closeLightbox();
        elExamResultModal.style.display = 'none';
        return;
      }

      if (e.key === 'ArrowRight' || e.key === ']' || e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowLeft' || e.key === '[' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (mode === 'study') elBtnToggleExplanation.click();
      } else if (e.key === 'b' || e.key === 'B' || e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        elBtnBookmark.click();
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        if (elQuestionDrawer.classList.contains('translate-x-full')) {
          openDrawer();
        } else {
          closeDrawer();
        }
      } else {
        const keyMap = {
          '1': 'A', 'a': 'A', 'A': 'A',
          '2': 'B', 'b': 'B', 'B': 'B',
          '3': 'C', 'c': 'C', 'C': 'C',
          '4': 'D', 'd': 'D', 'D': 'D',
          '5': 'E', 'e': 'E', 'E': 'E',
          '6': 'F', 'f': 'F', 'F': 'F'
        };
        const optKey = keyMap[e.key];
        if (optKey) {
          const q = questions[currentIndex];
          if (q && q.options && q.options.some(o => o.key === optKey)) {
            handleOptionClick(q, optKey);
          }
        }
      }
    });
  }

  // Run
  initApp();
})();
