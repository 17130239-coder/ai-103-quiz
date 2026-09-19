// ==========================================================================
// AI-103 Studio Application Logic
// Mobile-First Responsive, Zero-CLS & Jitter-Free Performance
// ==========================================================================

(function () {
  'use strict';

  // --- App State ---
  const STORAGE_KEY = 'ai103_quiz_state_v6';
  
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

  // --- Intelligent Image Preloader ---
  const preloadedImageUrls = new Set();

  function preloadImageUrl(url) {
    if (!url || preloadedImageUrls.has(url)) return;
    preloadedImageUrls.add(url);
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
  }

  function preloadAdjacentImages() {
    const targetIndices = [
      currentIndex + 1,
      currentIndex + 2,
      currentIndex + 3,
      currentIndex - 1
    ];
    targetIndices.forEach(idx => {
      if (idx >= 0 && idx < questions.length) {
        const q = questions[idx];
        if (q && q.images && q.images.length > 0) {
          q.images.forEach(img => preloadImageUrl(img.path));
        }
        if (q && q.answer_images && q.answer_images.length > 0) {
          q.answer_images.forEach(img => preloadImageUrl(img.path));
        }
      }
    });
  }

  function startIdlePreloadAllImages() {
    const allImages = [];
    questions.forEach(q => {
      if (q.images && q.images.length > 0) {
        q.images.forEach(img => allImages.push(img.path));
      }
      if (q.answer_images && q.answer_images.length > 0) {
        q.answer_images.forEach(img => allImages.push(img.path));
      }
    });

    let imgIndex = 0;
    function preloadBatch() {
      const batchSize = 4;
      for (let i = 0; i < batchSize && imgIndex < allImages.length; i++) {
        preloadImageUrl(allImages[imgIndex++]);
      }
      if (imgIndex < allImages.length) {
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(preloadBatch, { timeout: 1000 });
        } else {
          setTimeout(preloadBatch, 200);
        }
      }
    }

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(preloadBatch, { timeout: 1500 });
    } else {
      setTimeout(preloadBatch, 1000);
    }
  }

  // --- DOM Elements ---
  const elBtnStudyMode = document.getElementById('btnStudyMode');
  const elBtnExamMode = document.getElementById('btnExamMode');
  const elExamTimer = document.getElementById('examTimer');
  const elTimerText = document.getElementById('timerText');
  const elBtnThemeToggle = document.getElementById('btnThemeToggle');
  const elThemeIconSun = document.getElementById('themeIconSun');
  const elThemeIconMoon = document.getElementById('themeIconMoon');
  const elDrawerTriggerCount = document.getElementById('drawerTriggerCount');

  const elFilterPills = document.querySelectorAll('.zen-filter-pill, .ios-filter-pill, .filter-pill');
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
  const elExamSubmitContainer = document.getElementById('examSubmitContainer');
  const elBtnExamSubmit = document.getElementById('btnExamSubmit');
  const elExplanationBox = document.getElementById('explanationBox');
  const elExplCorrectAnswer = document.getElementById('explCorrectAnswer');
  const elExplBody = document.getElementById('explBody');

  const elBtnPrev = document.getElementById('btnPrev');
  const elBtnNext = document.getElementById('btnNext');
  const elNavStatus = document.getElementById('navStatus');
  const elBtnNavMatrix = document.getElementById('btnNavMatrix');

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

    const inlineData = window.QUIZ_DATA || window.__QUESTIONS_DATA__;
    if (inlineData && inlineData.questions) {
      questions = inlineData.questions;
      onDataReady();
    } else {
      try {
        const res = await fetch('data/ai-103-questions.json');
        const data = await res.json();
        questions = data.questions;
        onDataReady();
      } catch (err) {
        console.error('Failed to load questions:', err);
        elQuestionText.textContent = 'Không thể nạp file dữ liệu câu hỏi.';
      }
    }

    setupEventListeners();
  }

  function onDataReady() {
    updateFilteredIndices();
    updateStats();
    renderCurrentQuestion();
    renderGridItems();
    startIdlePreloadAllImages();
  }

  // --- Persistence ---
  function loadSavedState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('ai103_quiz_state_v5') || localStorage.getItem('ai103_quiz_state_v4');
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
      isDarkMode = true;
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

  // --- Answering State Helpers ---
  function isQuestionPartiallyAnswered(q, ans) {
    if (!ans) return false;
    if (q.interactive) {
      return ans.interactiveAnswers && Object.keys(ans.interactiveAnswers).length > 0;
    }
    return ans.selectedKeys && ans.selectedKeys.length > 0;
  }

  function isQuestionFullyAnswered(q, ans) {
    if (!ans) return false;
    if (q.interactive) {
      if (!ans.interactiveAnswers) return false;
      const keys = Object.keys(ans.interactiveAnswers);
      if (q.interactive.type === 'yes_no') return keys.length >= q.interactive.statements.length;
      if (q.interactive.type === 'dropdown') return keys.length >= q.interactive.blanks.length;
      if (q.interactive.type === 'matching' || q.interactive.type === 'drag_drop_order') return keys.length >= q.interactive.targets.length;
      return keys.length > 0;
    }
    return ans.selectedKeys && ans.selectedKeys.length > 0;
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
        if (!isQuestionPartiallyAnswered(q, ans)) indices.push(idx);
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
    
    // Crucial: Instant scroll to top to prevent jitter / scroll desync
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    renderCurrentQuestion();
    updateNavButtons();
    renderGridItems(elGridSearchInput ? elGridSearchInput.value : '');
    preloadAdjacentImages();
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

    // 1. Meta Badges
    const filterPos = filteredIndices.indexOf(currentIndex);
    const posText = filterPos !== -1 
      ? `Câu ${q.id} (${filterPos + 1}/${filteredIndices.length})`
      : `Câu ${q.id} / ${questions.length}`;
    elQNumber.textContent = posText;
    elNavStatus.textContent = `${currentIndex + 1} / ${questions.length}`;

    const typeNames = {
      multiple_choice_single: 'Trắc nghiệm đơn',
      multiple_choice_multi: 'Chọn nhiều đáp án',
      yes_no: 'Nhận định Đúng / Sai',
      drag_drop: 'Kéo thả / Ghép cặp',
      matching_hot_area: 'Hot Area / Lựa chọn'
    };
    elQTypeBadge.textContent = typeNames[q.type] || 'Trắc nghiệm';

    // Bookmark state
    const icon = elBtnBookmark.querySelector('.material-symbols-outlined');
    if (bookmarks.has(q.id)) {
      elBtnBookmark.classList.add('bookmarked');
      elBookmarkText.textContent = 'Đã lưu [B]';
      if (icon) icon.textContent = 'bookmark';
    } else {
      elBtnBookmark.classList.remove('bookmarked');
      elBookmarkText.textContent = 'Lưu [B]';
      if (icon) icon.textContent = 'bookmark_border';
    }

    // 2. Question Prompt
    elQuestionText.textContent = q.question;

    // 3. Images (Zero-Layout-Shift with reserved aspect ratio & skeleton shimmer)
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
        wrap.title = 'Bấm để xem ảnh lớn';

        // Reserved aspect-ratio container prevents any layout shift (CLS = 0)
        const frame = document.createElement('div');
        frame.className = 'q-img-frame';
        if (imgObj.width && imgObj.height) {
          frame.style.aspectRatio = `${imgObj.width} / ${imgObj.height}`;
        } else {
          frame.style.aspectRatio = '16 / 9';
        }

        // Shimmer skeleton placeholder
        const shimmer = document.createElement('div');
        shimmer.className = 'skeleton-shimmer absolute inset-0 rounded-lg pointer-events-none';

        // Image with eager + async decoding
        const img = document.createElement('img');
        img.src = imgObj.path;
        img.alt = `Sơ đồ câu hỏi Q${q.id}`;
        if (imgObj.width) img.width = imgObj.width;
        if (imgObj.height) img.height = imgObj.height;
        img.loading = 'eager';
        img.decoding = 'async';
        img.className = 'w-full h-full object-contain rounded-lg opacity-0 transition-opacity duration-200';

        // If cached already by preloader, show immediately without flicker
        if (img.complete && img.naturalHeight !== 0) {
          img.classList.remove('opacity-0');
          shimmer.style.display = 'none';
        } else {
          img.onload = () => {
            img.classList.remove('opacity-0');
            shimmer.style.display = 'none';
          };
          img.onerror = () => {
            shimmer.style.display = 'none';
          };
        }

        frame.appendChild(shimmer);
        frame.appendChild(img);

        const hint = document.createElement('div');
        hint.className = 'flex items-center justify-center space-x-1.5 text-xs text-slate-400 mt-2 font-mono';
        hint.innerHTML = `<span class="material-symbols-outlined text-[14px]">zoom_in</span><span>Hình ${i + 1} (Trang ${imgObj.page}) • Chạm để phóng to</span>`;

        wrap.appendChild(frame);
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
    const ansState = userAnswers[q.id] || { selectedKeys: [], interactiveAnswers: {}, isCorrect: null, revealed: false };

    // 1. Interactive Real Microsoft Exam Widgets
    if (q.interactive) {
      if (q.interactive.type === 'yes_no') {
        renderYesNoWidget(q, ansState);
      } else if (q.interactive.type === 'dropdown') {
        renderDropdownWidget(q, ansState);
      } else if (q.interactive.type === 'matching' || q.interactive.type === 'drag_drop_order') {
        renderMatchingWidget(q, ansState);
      }
      return;
    }

    // 2. Standard Multiple Choice (Single or Multiple)
    if (q.options && q.options.length > 0) {
      const isMulti = q.type === 'multiple_choice_multi';
      
      q.options.forEach((opt, optIndex) => {
        const item = document.createElement('div');
        item.className = 'option-item group';
        item.dataset.key = opt.key;

        const isSelected = ansState.selectedKeys && ansState.selectedKeys.includes(opt.key);
        if (isSelected) item.classList.add('selected');

        // Status badges for Study mode
        let statusBadgeHtml = '';

        if (mode === 'study' && ansState.selectedKeys && ansState.selectedKeys.length > 0) {
          const isKeyCorrect = q.answer_keys.includes(opt.key);
          if (isKeyCorrect) {
            item.classList.add('correct');
            statusBadgeHtml = `<span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 inline-flex items-center space-x-1"><span class="material-symbols-outlined text-[13px]">check</span><span>Chính xác</span></span>`;
          } else if (isSelected && !isKeyCorrect) {
            item.classList.add('wrong');
            statusBadgeHtml = `<span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 inline-flex items-center space-x-1"><span class="material-symbols-outlined text-[13px]">close</span><span>Bạn đã chọn</span></span>`;
          }
        }

        const keyBadge = document.createElement('div');
        keyBadge.className = 'option-key';
        keyBadge.textContent = opt.key;

        const body = document.createElement('div');
        body.className = 'option-body';
        body.textContent = opt.text;

        const trailing = document.createElement('div');
        trailing.className = 'shrink-0 flex items-center ml-1 sm:ml-2';
        trailing.innerHTML = `
          ${statusBadgeHtml}
          <span class="text-[10px] font-mono text-slate-400 opacity-50 group-hover:opacity-100 ml-1.5 hidden sm:inline">[${optIndex + 1}]</span>
        `;

        item.appendChild(keyBadge);
        item.appendChild(body);
        item.appendChild(trailing);

        item.addEventListener('click', () => handleOptionClick(q, opt.key));
        elOptionsContainer.appendChild(item);
      });

      // Multi-choice check button
      if (isMulti && mode === 'study' && ansState.selectedKeys && ansState.selectedKeys.length > 0 && !ansState.revealed) {
        const confirmWrap = document.createElement('div');
        confirmWrap.className = 'pt-2 flex justify-end';
        const btnConfirm = document.createElement('button');
        btnConfirm.className = 'w-full sm:w-auto px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-xs transition-all active:scale-95';
        btnConfirm.textContent = 'Kiểm tra kết quả lựa chọn';
        btnConfirm.addEventListener('click', () => {
          submitMultiChoice(q);
        });
        confirmWrap.appendChild(btnConfirm);
        elOptionsContainer.appendChild(confirmWrap);
      }

    } else {
      // Non-MC question fallback guide
      const helper = document.createElement('div');
      helper.className = 'interactive-guide flex items-start space-x-3';
      helper.innerHTML = `
        <span class="material-symbols-outlined text-orange-500 text-[18px] shrink-0 mt-0.5">info</span>
        <div>
          <strong class="font-semibold text-orange-600 dark:text-orange-400 block mb-1">Dạng câu hỏi tương tác / Sơ đồ / Mã nguồn</strong>
          <span>Hãy đọc sơ đồ hoặc đoạn mã ở trên, sau đó bấm <strong>icon bóng đèn</strong> bên dưới để xem đáp án và phân tích chi tiết.</span>
        </div>
      `;
      elOptionsContainer.appendChild(helper);
    }
  }

  // --- Interactive Widgets Implementations ---
  function renderYesNoWidget(q, ansState) {
    const container = document.createElement('div');
    container.className = 'interactive-container';

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between pb-1 text-xs text-slate-500 dark:text-slate-400 font-medium';
    header.innerHTML = `
      <span class="flex items-center space-x-1.5"><span class="material-symbols-outlined text-[15px] text-orange-500">checklist</span><span>Nhận định (Statements)</span></span>
      <span>Đúng / Sai</span>
    `;
    container.appendChild(header);

    const card = document.createElement('div');
    card.className = 'interactive-card p-0 overflow-hidden';

    const userMap = ansState.interactiveAnswers || {};
    const isRevealed = ansState.revealed && mode === 'study';

    q.interactive.statements.forEach((stmt, idx) => {
      const row = document.createElement('div');
      row.className = 'yes-no-row';

      const textDiv = document.createElement('div');
      textDiv.className = 'yes-no-text';
      textDiv.innerHTML = `<span class="font-mono text-slate-400 font-semibold mr-1.5">${idx + 1}.</span>${stmt.text}`;

      const pillsDiv = document.createElement('div');
      pillsDiv.className = 'yes-no-pills';

      const selectedVal = userMap[stmt.id];

      const btnYes = document.createElement('button');
      btnYes.className = 'yes-no-btn';
      btnYes.textContent = 'Yes';
      if (selectedVal === 'Yes') btnYes.classList.add('selected-yes');

      const btnNo = document.createElement('button');
      btnNo.className = 'yes-no-btn';
      btnNo.textContent = 'No';
      if (selectedVal === 'No') btnNo.classList.add('selected-no');

      if (isRevealed) {
        const isYesCorrect = stmt.answer === 'Yes';
        const isNoCorrect = stmt.answer === 'No';

        if (selectedVal === 'Yes') {
          if (isYesCorrect) btnYes.classList.add('revealed-correct');
          else btnYes.classList.add('revealed-wrong');
        } else if (isYesCorrect) {
          btnYes.classList.add('revealed-key');
        }

        if (selectedVal === 'No') {
          if (isNoCorrect) btnNo.classList.add('revealed-correct');
          else btnNo.classList.add('revealed-wrong');
        } else if (isNoCorrect) {
          btnNo.classList.add('revealed-key');
        }
      }

      btnYes.addEventListener('click', () => handleYesNoSelect(q, stmt.id, 'Yes'));
      btnNo.addEventListener('click', () => handleYesNoSelect(q, stmt.id, 'No'));

      pillsDiv.appendChild(btnYes);
      pillsDiv.appendChild(btnNo);

      row.appendChild(textDiv);
      row.appendChild(pillsDiv);
      card.appendChild(row);
    });

    container.appendChild(card);

    const hasAny = Object.keys(userMap).length > 0;
    if (mode === 'study' && hasAny && !ansState.revealed) {
      const confirmWrap = document.createElement('div');
      confirmWrap.className = 'pt-2 flex justify-end';
      const btnConfirm = document.createElement('button');
      btnConfirm.className = 'w-full sm:w-auto px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 flex items-center justify-center space-x-1.5';
      btnConfirm.innerHTML = `<span class="material-symbols-outlined text-[16px]">check_circle</span><span>Kiểm tra kết quả</span>`;
      btnConfirm.addEventListener('click', () => submitInteractiveQuestion(q));
      confirmWrap.appendChild(btnConfirm);
      container.appendChild(confirmWrap);
    }

    elOptionsContainer.appendChild(container);
  }

  function renderDropdownWidget(q, ansState) {
    const container = document.createElement('div');
    container.className = 'interactive-container';

    const header = document.createElement('div');
    header.className = 'text-xs text-slate-500 dark:text-slate-400 font-medium pb-1 flex items-center space-x-1.5';
    header.innerHTML = `<span class="material-symbols-outlined text-[15px] text-orange-500">tune</span><span>Chọn giá trị phù hợp cho từng mục:</span>`;
    container.appendChild(header);

    const card = document.createElement('div');
    card.className = 'interactive-card space-y-3';

    const userMap = ansState.interactiveAnswers || {};
    const isRevealed = ansState.revealed && mode === 'study';

    q.interactive.blanks.forEach((blank, idx) => {
      const row = document.createElement('div');
      row.className = 'interactive-select-row';

      const labelWrap = document.createElement('div');
      labelWrap.className = 'flex items-center justify-between';
      
      const label = document.createElement('label');
      label.className = 'text-xs font-semibold text-slate-700 dark:text-slate-300';
      label.textContent = `${idx + 1}. ${blank.label}:`;
      labelWrap.appendChild(label);

      const selectedVal = userMap[blank.id] || '';
      if (isRevealed) {
        const isMatch = selectedVal === blank.answer;
        const badge = document.createElement('div');
        if (isMatch) {
          badge.className = 'text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center space-x-1';
          badge.innerHTML = `<span class="material-symbols-outlined text-[14px]">check</span><span>Chính xác</span>`;
        } else {
          badge.className = 'text-[11px] font-semibold text-rose-600 dark:text-rose-400 inline-flex items-center space-x-1';
          badge.innerHTML = `<span class="material-symbols-outlined text-[14px]">close</span><span>Đáp án: ${blank.answer}</span>`;
        }
        labelWrap.appendChild(badge);
      }
      row.appendChild(labelWrap);

      const select = document.createElement('select');
      select.className = 'interactive-select';
      if (isRevealed) {
        if (selectedVal === blank.answer) select.classList.add('select-correct');
        else select.classList.add('select-wrong');
      }

      const defaultOpt = document.createElement('option');
      defaultOpt.value = '';
      defaultOpt.disabled = true;
      defaultOpt.selected = !selectedVal;
      defaultOpt.textContent = '-- Chọn đáp án phù hợp --';
      select.appendChild(defaultOpt);

      blank.options.forEach(optText => {
        const opt = document.createElement('option');
        opt.value = optText;
        opt.textContent = optText;
        if (selectedVal === optText) opt.selected = true;
        select.appendChild(opt);
      });

      select.addEventListener('change', (e) => {
        handleDropdownSelect(q, blank.id, e.target.value);
      });

      row.appendChild(select);
      card.appendChild(row);
    });

    container.appendChild(card);

    const hasAny = Object.keys(userMap).length > 0;
    if (mode === 'study' && hasAny && !ansState.revealed) {
      const confirmWrap = document.createElement('div');
      confirmWrap.className = 'pt-2 flex justify-end';
      const btnConfirm = document.createElement('button');
      btnConfirm.className = 'w-full sm:w-auto px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 flex items-center justify-center space-x-1.5';
      btnConfirm.innerHTML = `<span class="material-symbols-outlined text-[16px]">check_circle</span><span>Kiểm tra kết quả</span>`;
      btnConfirm.addEventListener('click', () => submitInteractiveQuestion(q));
      confirmWrap.appendChild(btnConfirm);
      container.appendChild(confirmWrap);
    }

    elOptionsContainer.appendChild(container);
  }

  function renderMatchingWidget(q, ansState) {
    const container = document.createElement('div');
    container.className = 'interactive-container';

    if (q.interactive.pool && q.interactive.pool.length > 0) {
      const poolWrap = document.createElement('div');
      poolWrap.className = 'bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2';
      poolWrap.innerHTML = `<div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Lựa chọn khả dụng:</div>`;
      const tagsContainer = document.createElement('div');
      tagsContainer.className = 'flex flex-wrap gap-1.5';
      q.interactive.pool.forEach(item => {
        const tag = document.createElement('span');
        tag.className = 'pool-tag';
        tag.textContent = item;
        tagsContainer.appendChild(tag);
      });
      poolWrap.appendChild(tagsContainer);
      container.appendChild(poolWrap);
    }

    const card = document.createElement('div');
    card.className = 'interactive-card space-y-3';

    const userMap = ansState.interactiveAnswers || {};
    const isRevealed = ansState.revealed && mode === 'study';

    q.interactive.targets.forEach((target, idx) => {
      const row = document.createElement('div');
      row.className = 'interactive-select-row';

      const labelWrap = document.createElement('div');
      labelWrap.className = 'flex items-center justify-between';

      const label = document.createElement('label');
      label.className = 'text-xs font-semibold text-slate-700 dark:text-slate-300';
      label.textContent = `${idx + 1}. ${target.label}:`;
      labelWrap.appendChild(label);

      const selectedVal = userMap[target.id] || '';
      if (isRevealed) {
        const isMatch = selectedVal === target.answer;
        const badge = document.createElement('div');
        if (isMatch) {
          badge.className = 'text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center space-x-1';
          badge.innerHTML = `<span class="material-symbols-outlined text-[14px]">check</span><span>Chính xác</span>`;
        } else {
          badge.className = 'text-[11px] font-semibold text-rose-600 dark:text-rose-400 inline-flex items-center space-x-1';
          badge.innerHTML = `<span class="material-symbols-outlined text-[14px]">close</span><span>Đáp án: ${target.answer}</span>`;
        }
        labelWrap.appendChild(badge);
      }
      row.appendChild(labelWrap);

      const select = document.createElement('select');
      select.className = 'interactive-select';
      if (isRevealed) {
        if (selectedVal === target.answer) select.classList.add('select-correct');
        else select.classList.add('select-wrong');
      }

      const defaultOpt = document.createElement('option');
      defaultOpt.value = '';
      defaultOpt.disabled = true;
      defaultOpt.selected = !selectedVal;
      defaultOpt.textContent = '-- Chọn công cụ / hành động --';
      select.appendChild(defaultOpt);

      q.interactive.pool.forEach(optText => {
        const opt = document.createElement('option');
        opt.value = optText;
        opt.textContent = optText;
        if (selectedVal === optText) opt.selected = true;
        select.appendChild(opt);
      });

      select.addEventListener('change', (e) => {
        handleMatchingSelect(q, target.id, e.target.value);
      });

      row.appendChild(select);
      card.appendChild(row);
    });

    container.appendChild(card);

    const hasAny = Object.keys(userMap).length > 0;
    if (mode === 'study' && hasAny && !ansState.revealed) {
      const confirmWrap = document.createElement('div');
      confirmWrap.className = 'pt-2 flex justify-end';
      const btnConfirm = document.createElement('button');
      btnConfirm.className = 'w-full sm:w-auto px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 flex items-center justify-center space-x-1.5';
      btnConfirm.innerHTML = `<span class="material-symbols-outlined text-[16px]">check_circle</span><span>Kiểm tra kết quả</span>`;
      btnConfirm.addEventListener('click', () => submitInteractiveQuestion(q));
      confirmWrap.appendChild(btnConfirm);
      container.appendChild(confirmWrap);
    }

    elOptionsContainer.appendChild(container);
  }

  function handleYesNoSelect(q, stmtId, val) {
    const current = userAnswers[q.id] || { selectedKeys: [], interactiveAnswers: {}, isCorrect: null, revealed: false };
    const newAnswers = { ...(current.interactiveAnswers || {}), [stmtId]: val };

    if (mode === 'exam') {
      userAnswers[q.id] = {
        selectedKeys: [],
        interactiveAnswers: newAnswers,
        isCorrect: null,
        revealed: false
      };
      saveState();
      updateStats();
      renderOptions(q);
      renderGridItems(elGridSearchInput ? elGridSearchInput.value : '');
      return;
    }

    userAnswers[q.id] = {
      selectedKeys: [],
      interactiveAnswers: newAnswers,
      isCorrect: null,
      revealed: false
    };
    saveState();
    updateStats();
    renderOptions(q);
  }

  function handleDropdownSelect(q, blankId, val) {
    const current = userAnswers[q.id] || { selectedKeys: [], interactiveAnswers: {}, isCorrect: null, revealed: false };
    const newAnswers = { ...(current.interactiveAnswers || {}), [blankId]: val };

    if (mode === 'exam') {
      userAnswers[q.id] = {
        selectedKeys: [],
        interactiveAnswers: newAnswers,
        isCorrect: null,
        revealed: false
      };
      saveState();
      updateStats();
      renderOptions(q);
      renderGridItems(elGridSearchInput ? elGridSearchInput.value : '');
      return;
    }

    userAnswers[q.id] = {
      selectedKeys: [],
      interactiveAnswers: newAnswers,
      isCorrect: null,
      revealed: false
    };
    saveState();
    updateStats();
    renderOptions(q);
  }

  function handleMatchingSelect(q, targetId, val) {
    const current = userAnswers[q.id] || { selectedKeys: [], interactiveAnswers: {}, isCorrect: null, revealed: false };
    const newAnswers = { ...(current.interactiveAnswers || {}), [targetId]: val };

    if (mode === 'exam') {
      userAnswers[q.id] = {
        selectedKeys: [],
        interactiveAnswers: newAnswers,
        isCorrect: null,
        revealed: false
      };
      saveState();
      updateStats();
      renderOptions(q);
      renderGridItems(elGridSearchInput ? elGridSearchInput.value : '');
      return;
    }

    userAnswers[q.id] = {
      selectedKeys: [],
      interactiveAnswers: newAnswers,
      isCorrect: null,
      revealed: false
    };
    saveState();
    updateStats();
    renderOptions(q);
  }

  function submitInteractiveQuestion(q) {
    const current = userAnswers[q.id] || { selectedKeys: [], interactiveAnswers: {}, isCorrect: null, revealed: false };
    const ansMap = current.interactiveAnswers || {};
    let isAllCorrect = true;

    if (q.interactive.type === 'yes_no') {
      q.interactive.statements.forEach(st => {
        if (ansMap[st.id] !== st.answer) isAllCorrect = false;
      });
    } else if (q.interactive.type === 'dropdown') {
      q.interactive.blanks.forEach(b => {
        if (ansMap[b.id] !== b.answer) isAllCorrect = false;
      });
    } else if (q.interactive.type === 'matching' || q.interactive.type === 'drag_drop_order') {
      q.interactive.targets.forEach(t => {
        if (ansMap[t.id] !== t.answer) isAllCorrect = false;
      });
    }

    userAnswers[q.id] = {
      ...current,
      isCorrect: isAllCorrect,
      revealed: true
    };

    saveState();
    updateStats();
    renderCurrentQuestion();
    renderGridItems(elGridSearchInput ? elGridSearchInput.value : '');
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
      if (q.answer && q.answer.includes(' | ')) {
        elExplCorrectAnswer.innerHTML = '<span class="font-bold">Đáp án chính xác:</span><ul class="mt-1.5 list-disc list-inside space-y-1 text-xs text-emerald-800 dark:text-emerald-300 font-medium leading-relaxed">' +
          q.answer.split(' | ').map(part => `<li>${escapeHtml(part)}</li>`).join('') +
          '</ul>';
      } else {
        elExplCorrectAnswer.textContent = 'Đáp án: ' + q.answer;
      }
      elExplBody.textContent = q.explanation;

      const elExplImages = document.getElementById('explImages');
      if (elExplImages) {
        elExplImages.innerHTML = '';
        if (q.answer_images && q.answer_images.length > 0) {
          elExplImages.style.display = 'flex';

          const header = document.createElement('div');
          header.className = 'flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 pt-2.5 border-t border-emerald-500/20';
          header.innerHTML = `<span class="material-symbols-outlined text-[15px]">verified</span><span>Sơ đồ đáp án chính thức từ Microsoft:</span>`;
          elExplImages.appendChild(header);

          q.answer_images.forEach((imgObj) => {
            const wrap = document.createElement('div');
            wrap.className = 'q-img-wrap';

            const frame = document.createElement('div');
            frame.className = 'q-img-frame';
            if (imgObj.width && imgObj.height) {
              frame.style.aspectRatio = `${imgObj.width} / ${imgObj.height}`;
            }

            const img = document.createElement('img');
            img.src = imgObj.path;
            img.alt = `Sơ đồ đáp án chuẩn Q${q.id}`;
            img.loading = 'lazy';
            img.className = 'w-full h-full object-contain rounded-lg';
            frame.appendChild(img);

            const hint = document.createElement('div');
            hint.className = 'flex items-center justify-center space-x-1.5 text-[11px] text-slate-400 mt-2 font-mono';
            hint.innerHTML = `<span class="material-symbols-outlined text-[13px]">zoom_in</span><span>Chạm để phóng to xem chi tiết</span>`;

            wrap.appendChild(frame);
            wrap.appendChild(hint);
            wrap.addEventListener('click', () => openLightbox(imgObj.path));
            elExplImages.appendChild(wrap);
          });
        } else {
          elExplImages.style.display = 'none';
        }
      }
    } else {
      elExplanationBox.style.display = 'none';
    }
  }

  function updateActionButtons(q) {
    if (mode === 'study') {
      elBtnToggleExplanation.style.display = 'flex';
      if (elExamSubmitContainer) elExamSubmitContainer.style.display = 'none';
    } else {
      elBtnToggleExplanation.style.display = 'none';
      if (elExamSubmitContainer) elExamSubmitContainer.style.display = 'flex';
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
      if (isQuestionPartiallyAnswered(q, a)) {
        answered++;
        if (a.isCorrect === true) correct++;
        if (a.isCorrect === false) wrong++;
      }
    });

    const unanswered = questions.length - answered;
    const bookmarkedCount = bookmarks.size;

    if (elCountAll) elCountAll.textContent = questions.length;
    if (elCountUnanswered) elCountUnanswered.textContent = unanswered;
    if (elCountWrong) elCountWrong.textContent = wrong;
    if (elCountCorrect) elCountCorrect.textContent = correct;
    if (elCountBookmarked) elCountBookmarked.textContent = bookmarkedCount;

    const percent = Math.round((answered / (questions.length || 1)) * 100);
    elProgressBarFill.style.width = `${percent}%`;
    if (elProgressLabel) elProgressLabel.textContent = `${answered} / ${questions.length} câu (${percent}%)`;
    if (elDrawerTriggerCount) elDrawerTriggerCount.textContent = `${answered}/${questions.length}`;
  }

  // --- Drawer (Bottom sheet on Mobile, Slide-over on Desktop) ---
  function openDrawer() {
    elQuestionDrawer.classList.remove('translate-y-full', 'sm:translate-x-full');
    elQuestionDrawer.classList.add('translate-y-0', 'sm:translate-x-0');
    elDrawerOverlay.classList.remove('opacity-0', 'pointer-events-none');
    renderGridItems(elGridSearchInput.value);
    elGridSearchInput.focus();
  }

  function closeDrawer() {
    elQuestionDrawer.classList.add('translate-y-full', 'sm:translate-x-full');
    elQuestionDrawer.classList.remove('translate-y-0', 'sm:translate-x-0');
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
      if (isQuestionPartiallyAnswered(q, ans)) {
        if (mode === 'study') {
          if (ans.isCorrect === true) item.classList.add('correct');
          else if (ans.isCorrect === false) item.classList.add('wrong');
          else item.classList.add('answered');
        } else {
          item.classList.add('answered');
          if (ans.revealed) {
            if (ans.isCorrect === true) item.classList.add('correct');
            else if (ans.isCorrect === false) item.classList.add('wrong');
          }
        }
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
      elBtnStudyMode.classList.add('active');
      elBtnStudyMode.classList.remove('text-slate-500', 'dark:text-slate-400');
      elBtnExamMode.classList.remove('active');
      elBtnExamMode.classList.add('text-slate-500', 'dark:text-slate-400');
      elExamTimer.classList.add('hidden');
      elExamTimer.classList.remove('flex');
      stopExamTimer();
    } else {
      elBtnExamMode.classList.add('active');
      elBtnExamMode.classList.remove('text-slate-500', 'dark:text-slate-400');
      elBtnStudyMode.classList.remove('active');
      elBtnStudyMode.classList.add('text-slate-500', 'dark:text-slate-400');
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
      if (!isQuestionPartiallyAnswered(q, ans)) {
        skipped++;
      } else {
        if (q.interactive) {
          const ansMap = ans.interactiveAnswers || {};
          let isAllCorrect = true;
          if (q.interactive.type === 'yes_no') {
            q.interactive.statements.forEach(st => {
              if (ansMap[st.id] !== st.answer) isAllCorrect = false;
            });
          } else if (q.interactive.type === 'dropdown') {
            q.interactive.blanks.forEach(b => {
              if (ansMap[b.id] !== b.answer) isAllCorrect = false;
            });
          } else if (q.interactive.type === 'matching' || q.interactive.type === 'drag_drop_order') {
            q.interactive.targets.forEach(t => {
              if (ansMap[t.id] !== t.answer) isAllCorrect = false;
            });
          }
          ans.isCorrect = isAllCorrect;
          if (isAllCorrect) correct++;
          else wrong++;
        } else if (q.options && q.options.length > 0) {
          const selected = [...(ans.selectedKeys || [])].sort().join(',');
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
    if (elBtnNavMatrix) elBtnNavMatrix.addEventListener('click', openDrawer);
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
      const wrongPill = document.querySelector('.zen-filter-pill[data-filter="wrong"], .filter-pill[data-filter="wrong"]');
      if (wrongPill) wrongPill.click();
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
      const ans = userAnswers[q.id] || { selectedKeys: [], interactiveAnswers: {}, isCorrect: null, revealed: false };
      ans.revealed = !ans.revealed;
      userAnswers[q.id] = ans;
      saveState();
      renderOptions(q);
      renderExplanation(q);
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
        if (elQuestionDrawer.classList.contains('translate-y-full') || elQuestionDrawer.classList.contains('sm:translate-x-full')) {
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
