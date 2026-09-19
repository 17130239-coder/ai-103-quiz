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
  
  // --- Internationalization & Multi-Layout State ---
  let currentLanguage = localStorage.getItem('ai103_language') || 'en'; // Default: 'en'
  let currentLayout = localStorage.getItem('ai103_layout') || 'single'; // 'single' | 'all'
  let allQFilter = 'all'; // 'all' | 'unanswered' | 'wrong' | 'correct' | 'bookmarked'
  
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
  const elBtnTipsMode = document.getElementById('btnTipsMode');
  const elViewQuiz = document.getElementById('viewQuiz');
  const elViewTips = document.getElementById('viewTips');
  const elFloatingNavContainer = document.getElementById('floatingNavContainer');
  const elTipSearchInput = document.getElementById('tipSearchInput');
  const elBtnClearTipSearch = document.getElementById('btnClearTipSearch');
  const elTipCategoryPills = document.querySelectorAll('#tipCategoryPills .zen-tip-pill');
  const elTipsListContainer = document.getElementById('tipsListContainer');
  const elTipNoResults = document.getElementById('tipNoResults');
  const elBtnTipsScrollTop = document.getElementById('btnTipsScrollTop');
  const elGlobalToast = document.getElementById('globalToast');
  const elGlobalToastMsg = document.getElementById('globalToastMsg');
  const elGlobalToastIcon = document.getElementById('globalToastIcon');

  let currentTipCategory = 'all';
  let tipSearchKeyword = '';
  let toastTimeoutId = null;

  // ==========================================================================
  // Internationalization (i18n) Dictionary & Engine
  // ==========================================================================
  const I18N = {
    en: {
      mode_study: "Study",
      mode_exam: "Exam",
      mode_tips: "Tips",
      layout_single: "Single",
      layout_all: "All",
      layout_title: "Layout: Single Question / Continuous Scroll",
      lang_toggle_title: "Switch Language (EN / VI)",
      drawer_count: "{n} questions",
      theme_title: "Light / Dark Mode",
      q_pos: "Question {pos} / {total}",
      q_pos_filtered: "Question {id} ({pos}/{total})",
      type_multiple_choice_single: "Single Choice",
      type_multiple_choice_multi: "Multiple Choice",
      type_yes_no: "Yes / No Statements",
      type_drag_drop: "Matching / Sequence",
      type_matching_hot_area: "Dropdown / Selection",
      bookmark: "Bookmark [B]",
      bookmarked: "Bookmarked [B]",
      show_answer: "Show Answer",
      hide_answer: "Hide Answer",
      check_selection: "Check Selection",
      badge_correct: "Correct",
      badge_wrong: "Your Choice",
      badge_unanswered: "Unanswered",
      official_explanation: "Official Answer & Detailed Explanation",
      correct_answer_label: "Correct Answer:",
      explanation_label: "Detailed Explanation:",
      official_diagram: "Official Microsoft Answer Diagram",
      click_to_enlarge: "Click to enlarge image",
      nav_prev: "Previous [←]",
      nav_next: "Next [→]",
      nav_open_grid: "Open Matrix [G]",
      btn_submit_exam: "Submit Exam & Grade",
      exam_ready_submit: "Finished reviewing all questions?",
      jump_label: "Q:",
      jump_go: "Go",
      done_count: "{n} / {total} answered",
      filter_all: "All",
      filter_unanswered: "Unanswered",
      filter_wrong: "Incorrect",
      filter_correct: "Correct",
      filter_bookmarked: "Bookmarked",
      drawer_title: "Question Matrix (175)",
      drawer_search_placeholder: "Search question text, keyword, ID...",
      drawer_reset_progress: "Reset All Progress",
      drawer_confirm_reset: "Are you sure you want to reset all quiz progress?",
      tips_hero_title: "AI-103 Exam Hacks & Strategy Guide",
      tips_hero_desc: "16 essential rules, Microsoft keyword traps, precision/recall formulas, and interactive question techniques.",
      tips_search_placeholder: "Search tips (Prompt Shield, Precision, Video, OpenTelemetry, Managed Identity...)",
      tips_no_results: "No matching tips found",
      tips_no_results_desc: "Try searching with keywords like 'Foundry', 'SDK', 'Precision', or 'VNet'",
      tips_back_to_top: "Back to top",
      exam_result_title: "Exam Results",
      exam_passed: "🎉 PASSED (>=70%)",
      exam_failed: "NEEDS PRACTICE (<70%)",
      res_total: "Total Questions:",
      res_correct: "Correct:",
      res_wrong: "Incorrect:",
      res_skipped: "Unanswered:",
      res_time: "Time Taken:",
      res_review_wrong: "Review Mistakes",
      res_retake: "Retake Exam",
      toast_saved: "Progress saved",
      toast_reset: "Progress reset successfully",
      toast_bookmarked: "Question bookmarked",
      toast_unbookmarked: "Bookmark removed",
      toast_exam_submitted: "Exam submitted! Score: {score}%",
      interactive_guide_title: "Interactive Question / Diagram / Code",
      interactive_guide_desc: "Study the diagram or code above, then click the lightbulb icon below to see the answer and analysis."
    },
    vi: {
      mode_study: "Ôn tập",
      mode_exam: "Thi thử",
      mode_tips: "Tips",
      layout_single: "Từng câu",
      layout_all: "Cuộn tất cả",
      layout_title: "Kiểu xem: Từng câu / Cuộn tất cả câu hỏi",
      lang_toggle_title: "Đổi ngôn ngữ: Tiếng Anh / Tiếng Việt",
      drawer_count: "{n} câu",
      theme_title: "Chế độ Sáng / Tối",
      q_pos: "Câu {pos} / {total}",
      q_pos_filtered: "Câu {id} ({pos}/{total})",
      type_multiple_choice_single: "Trắc nghiệm đơn",
      type_multiple_choice_multi: "Chọn nhiều đáp án",
      type_yes_no: "Nhận định Đúng / Sai",
      type_drag_drop: "Kéo thả / Ghép cặp",
      type_matching_hot_area: "Hot Area / Lựa chọn",
      bookmark: "Lưu [B]",
      bookmarked: "Đã lưu [B]",
      show_answer: "Xem đáp án",
      hide_answer: "Ẩn đáp án",
      check_selection: "Kiểm tra kết quả lựa chọn",
      badge_correct: "Chính xác",
      badge_wrong: "Bạn đã chọn",
      badge_unanswered: "Chưa làm",
      official_explanation: "Giải thích & Đáp án chính thức",
      correct_answer_label: "Đáp án chính xác:",
      explanation_label: "Giải thích chi tiết:",
      official_diagram: "Sơ đồ đáp án gốc (Microsoft)",
      click_to_enlarge: "Bấm để xem ảnh lớn",
      nav_prev: "Câu trước [←]",
      nav_next: "Câu tiếp theo [→]",
      nav_open_grid: "Mở danh sách câu hỏi [G]",
      btn_submit_exam: "Nộp bài thi & Chấm điểm",
      exam_ready_submit: "Bạn đã hoàn thành xong các câu hỏi?",
      jump_label: "Câu:",
      jump_go: "Đến",
      done_count: "Đã làm: {n} / {total}",
      filter_all: "Tất cả",
      filter_unanswered: "Chưa làm",
      filter_wrong: "Sai",
      filter_correct: "Đúng",
      filter_bookmarked: "Đã lưu",
      drawer_title: "Danh sách 175 câu hỏi",
      drawer_search_placeholder: "Tìm kiếm từ khóa (Foundry, Search, Code...)",
      drawer_reset_progress: "Đặt lại toàn bộ tiến độ",
      drawer_confirm_reset: "Bạn có chắc chắn muốn xóa toàn bộ tiến độ làm bài?",
      tips_hero_title: "Cẩm nang Bí kíp & Mẹo thi AI-103",
      tips_hero_desc: "Tổng hợp 16 quy tắc cốt lõi, bẫy từ khóa của Microsoft, công thức phân biệt độ đo và phương pháp xử lý câu hỏi tương tác kéo thả.",
      tips_search_placeholder: "Tìm kiếm mẹo (Prompt Shield, Precision, Video, OpenTelemetry, Managed Identity...)",
      tips_no_results: "Không tìm thấy mẹo nào phù hợp",
      tips_no_results_desc: "Thử tìm kiếm với từ khóa khác như 'Foundry', 'SDK', 'Precision', hoặc 'VNet'",
      tips_back_to_top: "Lên đầu trang",
      exam_result_title: "Kết quả bài thi thử",
      exam_passed: "🎉 ĐẠT CHỈ TIÊU (PASS)",
      exam_failed: "CẦN ÔN TẬP THÊM",
      res_total: "Tổng số câu:",
      res_correct: "Số câu đúng:",
      res_wrong: "Số câu sai:",
      res_skipped: "Chưa trả lời:",
      res_time: "Thời gian hoàn thành:",
      res_review_wrong: "Xem lại câu sai",
      res_retake: "Làm lại bài thi",
      toast_saved: "Đã lưu tiến độ",
      toast_reset: "Đã đặt lại tiến độ làm bài",
      toast_bookmarked: "Đã lưu câu hỏi",
      toast_unbookmarked: "Đã bỏ lưu câu hỏi",
      toast_exam_submitted: "Đã nộp bài! Điểm số: {score}%",
      interactive_guide_title: "Dạng câu hỏi tương tác / Sơ đồ / Mã nguồn",
      interactive_guide_desc: "Hãy đọc sơ đồ hoặc đoạn mã ở trên, sau đó bấm icon bóng đèn bên dưới để xem đáp án và phân tích chi tiết."
    }
  };

  function t(key, params = {}) {
    const dict = I18N[currentLanguage] || I18N.en;
    let str = dict[key] || (I18N.en && I18N.en[key]) || key;
    Object.keys(params).forEach(k => {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
    });
    return str;
  }

  function applyLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('ai103_language', lang);
    if (elLangText) elLangText.textContent = lang.toUpperCase();

    // Update all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        const text = t(key);
        if (text) el.textContent = text;
      }
    });

    if (elBtnLayoutToggle) elBtnLayoutToggle.title = t('layout_title');
    if (elBtnLangToggle) elBtnLangToggle.title = t('lang_toggle_title');
    if (elLayoutText) elLayoutText.textContent = currentLayout === 'all' ? t('layout_all') : t('layout_single');
    if (elDrawerTriggerCount) elDrawerTriggerCount.textContent = `${questions.length} ${currentLanguage === 'en' ? 'questions' : 'câu'}`;

    updateStats();
    if (currentLayout === 'single') {
      renderCurrentQuestion();
    } else {
      renderAllQuestionsView();
    }
    if (mode === 'tips') {
      renderTipsList();
    }
  }

  function toggleLanguage() {
    const nextLang = currentLanguage === 'en' ? 'vi' : 'en';
    applyLanguage(nextLang);
    showToast(nextLang === 'en' ? 'Switched language to English' : 'Đã đổi ngôn ngữ sang Tiếng Việt', 'translate');
  }


  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showToast(msg, icon = 'info') {
    if (!elGlobalToast) return;
    if (toastTimeoutId) clearTimeout(toastTimeoutId);
    if (elGlobalToastMsg) elGlobalToastMsg.textContent = msg;
    if (elGlobalToastIcon) elGlobalToastIcon.textContent = icon;
    elGlobalToast.classList.add('show');
    toastTimeoutId = setTimeout(() => {
      elGlobalToast.classList.remove('show');
    }, 2400);
  }

  const elExamTimer = document.getElementById('examTimer');
  const elTimerText = document.getElementById('timerText');
  const elBtnThemeToggle = document.getElementById('btnThemeToggle');
  const elThemeIconSun = document.getElementById('themeIconSun');
  const elThemeIconMoon = document.getElementById('themeIconMoon');
  const elDrawerTriggerCount = document.getElementById('drawerTriggerCount');
  
  // Layout & Language Switcher Elements
  const elBtnLayoutToggle = document.getElementById('btnLayoutToggle');
  const elLayoutIcon = document.getElementById('layoutIcon');
  const elLayoutText = document.getElementById('layoutText');
  const elBtnLangToggle = document.getElementById('btnLangToggle');
  const elLangText = document.getElementById('langText');

  // Continuous Vertical Scroll (All Questions) Elements
  const elViewAllQuestions = document.getElementById('viewAllQuestions');
  const elAllQuestionsList = document.getElementById('allQuestionsList');
  const elAllQFilterPills = document.querySelectorAll('#allQFilterPills .all-q-filter-pill');
  const elAllQFilterCountAll = document.getElementById('allQFilterCountAll');
  const elAllQFilterCountUnanswered = document.getElementById('allQFilterCountUnanswered');
  const elAllQFilterCountWrong = document.getElementById('allQFilterCountWrong');
  const elAllQFilterCountCorrect = document.getElementById('allQFilterCountCorrect');
  const elAllQFilterCountBookmarked = document.getElementById('allQFilterCountBookmarked');
  const elAllQCounterText = document.getElementById('allQCounterText');
  const elAllQJumpInput = document.getElementById('allQJumpInput');
  const elBtnAllQJump = document.getElementById('btnAllQJump');
  const elAllQExamSubmitWrap = document.getElementById('allQExamSubmitWrap');
  const elBtnAllQExamSubmit = document.getElementById('btnAllQExamSubmit');
  const elBtnScrollToTop = document.getElementById('btnScrollToTop');

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
    setupEventListeners();
    loadSavedTheme();
    loadSavedState();
    initTipCategoryCounts();

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
  }

  function onDataReady() {
    updateFilteredIndices();
    updateStats();
    applyLanguage(currentLanguage);
    if (currentLayout === 'all') {
      setLayout('all');
    } else {
      renderCurrentQuestion();
    }
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


  // ==========================================================================
  // Layout Management (Single Question vs All Questions Continuous Scroll)
  // ==========================================================================
  function setLayout(targetLayout, targetQuestionIndex = null) {
    currentLayout = targetLayout;
    localStorage.setItem('ai103_layout', targetLayout);

    if (elLayoutIcon) {
      elLayoutIcon.textContent = currentLayout === 'all' ? 'view_stream' : 'view_agenda';
    }
    if (elLayoutText) {
      elLayoutText.textContent = currentLayout === 'all' ? t('layout_all') : t('layout_single');
    }

    if (mode === 'tips') {
      setMode('study');
    }

    if (currentLayout === 'all') {
      if (elViewQuiz) elViewQuiz.style.display = 'none';
      if (elFloatingNavContainer) elFloatingNavContainer.style.display = 'none';
      if (elViewAllQuestions) elViewAllQuestions.style.display = 'block';

      renderAllQuestionsView();

      const qIndexToScroll = targetQuestionIndex !== null ? targetQuestionIndex : currentIndex;
      if (questions[qIndexToScroll]) {
        setTimeout(() => {
          const card = document.getElementById(`all-q-card-${questions[qIndexToScroll].id}`);
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.classList.add('ring-2', 'ring-orange-500/50');
            setTimeout(() => card.classList.remove('ring-2', 'ring-orange-500/50'), 1500);
          }
        }, 120);
      }
    } else {
      if (elViewAllQuestions) elViewAllQuestions.style.display = 'none';
      if (elViewQuiz) elViewQuiz.style.display = 'block';
      if (elFloatingNavContainer) elFloatingNavContainer.style.display = 'flex';

      if (targetQuestionIndex !== null) {
        currentIndex = targetQuestionIndex;
      }
      renderCurrentQuestion();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function toggleLayout() {
    const nextLayout = currentLayout === 'single' ? 'all' : 'single';
    setLayout(nextLayout);
    const msg = nextLayout === 'all'
      ? (currentLanguage === 'en' ? 'Switched to All Questions (Continuous Scroll)' : 'Đã chuyển sang Cuộn tất cả câu hỏi')
      : (currentLanguage === 'en' ? 'Switched to Single Question layout' : 'Đã chuyển sang Từng câu hỏi');
    showToast(msg, nextLayout === 'all' ? 'view_stream' : 'view_agenda');
  }

  // ==========================================================================
  // Continuous Vertical Scroll (All Questions) Implementation
  // ==========================================================================
  function updateAllQFilterCounts() {
    let unans = 0, wrong = 0, correct = 0, bkmk = 0;
    questions.forEach(q => {
      const ans = userAnswers[q.id];
      if (bookmarks.has(q.id)) bkmk++;
      if (!isQuestionPartiallyAnswered(q, ans)) {
        unans++;
      } else if (ans.isCorrect === true) {
        correct++;
      } else if (ans.isCorrect === false) {
        wrong++;
      }
    });

    if (elAllQFilterCountAll) elAllQFilterCountAll.textContent = `(${questions.length})`;
    if (elAllQFilterCountUnanswered) elAllQFilterCountUnanswered.textContent = `(${unans})`;
    if (elAllQFilterCountWrong) elAllQFilterCountWrong.textContent = `(${wrong})`;
    if (elAllQFilterCountCorrect) elAllQFilterCountCorrect.textContent = `(${correct})`;
    if (elAllQFilterCountBookmarked) elAllQFilterCountBookmarked.textContent = `(${bkmk})`;

    const answeredCount = questions.length - unans;
    if (elAllQCounterText) {
      elAllQCounterText.textContent = t('done_count', { n: answeredCount, total: questions.length });
    }
  }

  function renderAllQuestionsView() {
    const list = elAllQuestionsList || document.getElementById('allQuestionsList');
    if (!list) return;

    updateAllQFilterCounts();

    const filtered = questions.filter(q => {
      const ansState = userAnswers[q.id];
      if (allQFilter === 'all') return true;
      if (allQFilter === 'bookmarked') return bookmarks.has(q.id);
      if (allQFilter === 'unanswered') return !isQuestionPartiallyAnswered(q, ansState);
      if (allQFilter === 'wrong') return ansState && ansState.isCorrect === false;
      if (allQFilter === 'correct') return ansState && ansState.isCorrect === true;
      return true;
    });

    list.innerHTML = '';

    if (filtered.length === 0) {
      list.innerHTML = `
        <div class="text-center py-16 space-y-2">
          <span class="material-symbols-outlined text-[36px] text-slate-400">filter_alt_off</span>
          <p class="text-sm font-medium text-slate-600 dark:text-slate-300">${currentLanguage === 'en' ? 'No questions in this filter' : 'Không có câu hỏi nào trong bộ lọc này'}</p>
        </div>
      `;
      return;
    }

    filtered.forEach(q => {
      const card = createQuestionCardElement(q);
      list.appendChild(card);
    });

    if (elAllQExamSubmitWrap) {
      elAllQExamSubmitWrap.style.display = mode === 'exam' ? 'flex' : 'none';
    }
  }

  function createQuestionCardElement(q) {
    const card = document.createElement('article');
    card.id = `all-q-card-${q.id}`;
    card.className = 'all-q-card space-y-4';
    if (bookmarks.has(q.id)) card.classList.add('is-bookmarked');

    const ansState = userAnswers[q.id] || { selectedKeys: [], interactiveAnswers: {}, isCorrect: null, revealed: false };
    if (ansState.isCorrect === true) card.classList.add('is-correct');
    else if (ansState.isCorrect === false) card.classList.add('is-wrong');

    // 1. Header: Q-number + Type + Bookmark + Status badge
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]';

    const leftGroup = document.createElement('div');
    leftGroup.className = 'flex items-center space-x-2';
    leftGroup.innerHTML = `
      <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
        Q${q.id}
      </span>
      <span class="text-[11px] text-slate-500 dark:text-slate-400 bg-black/[0.03] dark:bg-white/[0.06] px-2 py-0.5 rounded-full font-medium border border-black/[0.04] dark:border-white/[0.06]">
        ${t('type_' + q.type) || t('type_multiple_choice_single')}
      </span>
    `;

    const rightGroup = document.createElement('div');
    rightGroup.className = 'flex items-center space-x-2';

    // Status badge
    const statusBadge = document.createElement('span');
    statusBadge.id = `all-q-status-${q.id}`;
    updateCardStatusBadge(q, statusBadge, ansState);

    // Bookmark button
    const btnBkmk = document.createElement('button');
    btnBkmk.className = 'flex items-center space-x-1 text-xs text-slate-400 hover:text-amber-500 transition-colors active:scale-95';
    btnBkmk.title = t('bookmark');
    btnBkmk.innerHTML = `<span class="material-symbols-outlined text-[17px] ${bookmarks.has(q.id) ? 'text-amber-500' : ''}">${bookmarks.has(q.id) ? 'bookmark' : 'bookmark_border'}</span>`;
    btnBkmk.addEventListener('click', (e) => {
      e.stopPropagation();
      if (bookmarks.has(q.id)) {
        bookmarks.delete(q.id);
        card.classList.remove('is-bookmarked');
        btnBkmk.querySelector('.material-symbols-outlined').textContent = 'bookmark_border';
        btnBkmk.querySelector('.material-symbols-outlined').classList.remove('text-amber-500');
        showToast(t('toast_unbookmarked'));
      } else {
        bookmarks.add(q.id);
        card.classList.add('is-bookmarked');
        btnBkmk.querySelector('.material-symbols-outlined').textContent = 'bookmark';
        btnBkmk.querySelector('.material-symbols-outlined').classList.add('text-amber-500');
        showToast(t('toast_bookmarked'), 'bookmark');
      }
      saveState();
      updateStats();
      updateAllQFilterCounts();
      renderGridItems(elGridSearchInput ? elGridSearchInput.value : '');
    });

    rightGroup.appendChild(statusBadge);
    rightGroup.appendChild(btnBkmk);

    header.appendChild(leftGroup);
    header.appendChild(rightGroup);
    card.appendChild(header);

    // 2. Question Prompt
    const prompt = document.createElement('div');
    prompt.className = 'text-[14.5px] sm:text-[15.5px] font-medium leading-[1.65] text-slate-800 dark:text-slate-100 whitespace-pre-line tracking-[-0.01em]';
    prompt.textContent = q.question;
    card.appendChild(prompt);

    // 3. Question Images (Zero CLS aspect ratio + lazy loading)
    if (q.images && q.images.length > 0) {
      const imgsWrap = document.createElement('div');
      imgsWrap.className = 'flex flex-col gap-3 my-3';
      q.images.forEach(imgObj => {
        const wrap = document.createElement('div');
        wrap.className = 'q-img-wrap';
        wrap.title = t('click_to_enlarge');

        const frame = document.createElement('div');
        frame.className = 'q-img-frame';
        if (imgObj.width && imgObj.height) {
          frame.style.aspectRatio = `${imgObj.width} / ${imgObj.height}`;
        } else {
          frame.style.aspectRatio = '16 / 9';
        }

        const img = document.createElement('img');
        img.src = imgObj.path;
        img.alt = `Diagram Q${q.id}`;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.className = 'w-full h-full object-contain rounded-lg';
        frame.appendChild(img);

        wrap.appendChild(frame);
        wrap.addEventListener('click', () => openLightbox(imgObj.path));
        imgsWrap.appendChild(wrap);
      });
      card.appendChild(imgsWrap);
    }

    // 4. Options Container
    const optsContainer = document.createElement('div');
    optsContainer.id = `all-q-opts-${q.id}`;
    optsContainer.className = 'space-y-2.5 my-3';
    renderOptions(q, optsContainer);
    card.appendChild(optsContainer);

    // 5. Card Footer: Explanation & Action in Study mode
    const explSection = document.createElement('div');
    explSection.id = `all-q-expl-wrap-${q.id}`;
    explSection.className = 'pt-2 border-t border-black/[0.04] dark:border-white/[0.06] space-y-3';

    if (mode === 'study') {
      const explToggleBtn = document.createElement('button');
      explToggleBtn.className = 'flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20 text-xs font-semibold transition-all active:scale-95';
      const isRev = ansState && ansState.revealed;
      explToggleBtn.innerHTML = `
        <span class="material-symbols-outlined text-[15px]">lightbulb</span>
        <span>${isRev ? t('hide_answer') : t('show_answer')}</span>
      `;

      const explBox = document.createElement('div');
      explBox.id = `all-q-expl-box-${q.id}`;
      explBox.className = 'rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] dark:bg-emerald-500/[0.08] p-4 space-y-3 transition-all';
      explBox.style.display = isRev ? 'block' : 'none';
      renderCardExplanationContent(q, explBox);

      explToggleBtn.addEventListener('click', () => {
        const curRev = ansState.revealed;
        ansState.revealed = !curRev;
        userAnswers[q.id] = ansState;
        saveState();
        explBox.style.display = ansState.revealed ? 'block' : 'none';
        explToggleBtn.querySelector('span:last-child').textContent = ansState.revealed ? t('hide_answer') : t('show_answer');
        renderOptions(q, optsContainer);
      });

      explSection.appendChild(explToggleBtn);
      explSection.appendChild(explBox);
    } else {
      if (ansState && ansState.revealed) {
        const explBox = document.createElement('div');
        explBox.id = `all-q-expl-box-${q.id}`;
        explBox.className = 'rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] dark:bg-emerald-500/[0.08] p-4 space-y-3 transition-all';
        renderCardExplanationContent(q, explBox);
        explSection.appendChild(explBox);
      } else {
        explSection.style.display = 'none';
      }
    }

    card.appendChild(explSection);
    return card;
  }

  function updateCardStatusBadge(q, badgeEl, ansState) {
    if (!badgeEl) return;
    if (!isQuestionPartiallyAnswered(q, ansState)) {
      badgeEl.className = 'text-[11px] font-medium font-mono px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-500 dark:text-slate-400';
      badgeEl.textContent = t('badge_unanswered');
    } else if (ansState.isCorrect === true) {
      badgeEl.className = 'text-[11px] font-semibold font-mono px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      badgeEl.textContent = t('badge_correct');
    } else if (ansState.isCorrect === false) {
      badgeEl.className = 'text-[11px] font-semibold font-mono px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20';
      badgeEl.textContent = t('filter_wrong');
    } else {
      badgeEl.className = 'text-[11px] font-medium font-mono px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400';
      badgeEl.textContent = currentLanguage === 'en' ? 'In progress' : 'Đã chọn';
    }
  }

  function renderCardExplanationContent(q, container) {
    container.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between pb-2 border-b border-emerald-500/20';
    header.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-[14px]">check</span>
        </span>
        <span class="font-semibold text-xs sm:text-sm text-emerald-700 dark:text-emerald-400">
          ${t('official_explanation')}
        </span>
      </div>
      <span class="text-[10px] font-mono text-slate-400">Microsoft Learn</span>
    `;
    container.appendChild(header);

    const answerP = document.createElement('div');
    answerP.className = 'text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400';
    if (q.answer && q.answer.includes(' | ')) {
      answerP.innerHTML = `<span class="font-bold">${t('correct_answer_label')}</span><ul class="mt-1 list-disc list-inside space-y-0.5 text-xs text-emerald-800 dark:text-emerald-300 font-medium">` +
        q.answer.split(' | ').map(part => `<li>${escapeHtml(part)}</li>`).join('') +
        '</ul>';
    } else {
      answerP.textContent = `${t('correct_answer_label')} ` + q.answer;
    }
    container.appendChild(answerP);

    const bodyP = document.createElement('div');
    bodyP.className = 'text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-[1.7] whitespace-pre-line font-sans';
    bodyP.textContent = q.explanation;
    container.appendChild(bodyP);

    if (q.answer_images && q.answer_images.length > 0) {
      const imgsWrap = document.createElement('div');
      imgsWrap.className = 'pt-2 flex flex-col gap-3';
      const label = document.createElement('div');
      label.className = 'flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 pt-2 border-t border-emerald-500/20';
      label.innerHTML = `<span class="material-symbols-outlined text-[15px]">verified</span><span>${t('official_diagram')}</span>`;
      imgsWrap.appendChild(label);

      q.answer_images.forEach(imgObj => {
        const wrap = document.createElement('div');
        wrap.className = 'q-img-wrap';
        const frame = document.createElement('div');
        frame.className = 'q-img-frame';
        if (imgObj.width && imgObj.height) {
          frame.style.aspectRatio = `${imgObj.width} / ${imgObj.height}`;
        }
        const img = document.createElement('img');
        img.src = imgObj.path;
        img.alt = `Answer Diagram Q${q.id}`;
        img.loading = 'lazy';
        img.className = 'w-full h-full object-contain rounded-lg';
        frame.appendChild(img);

        const hint = document.createElement('div');
        hint.className = 'flex items-center justify-center space-x-1.5 text-[11px] text-slate-400 mt-2 font-mono';
        hint.innerHTML = `<span class="material-symbols-outlined text-[13px]">zoom_in</span><span>${t('click_to_enlarge')}</span>`;

        wrap.appendChild(frame);
        wrap.appendChild(hint);
        wrap.addEventListener('click', () => openLightbox(imgObj.path));
        imgsWrap.appendChild(wrap);
      });
      container.appendChild(imgsWrap);
    }
  }

  function updateSingleCardInAllView(q, card = null) {
    const targetCard = card || document.getElementById(`all-q-card-${q.id}`);
    if (!targetCard) return;

    const ansState = userAnswers[q.id] || { selectedKeys: [], interactiveAnswers: {}, isCorrect: null, revealed: false };

    targetCard.classList.remove('is-correct', 'is-wrong');
    if (ansState.isCorrect === true) targetCard.classList.add('is-correct');
    else if (ansState.isCorrect === false) targetCard.classList.add('is-wrong');

    const badgeEl = document.getElementById(`all-q-status-${q.id}`);
    if (badgeEl) updateCardStatusBadge(q, badgeEl, ansState);

    const optContainer = document.getElementById(`all-q-opts-${q.id}`);
    if (optContainer) renderOptions(q, optContainer);

    if (mode === 'study') {
      const explBox = document.getElementById(`all-q-expl-box-${q.id}`);
      if (explBox && ansState.revealed) {
        explBox.style.display = 'block';
        renderCardExplanationContent(q, explBox);
      }
    }

    updateAllQFilterCounts();
  }

  function refreshQuestionUI(q) {
    if (currentLayout === 'single') {
      renderCurrentQuestion();
    }
    updateSingleCardInAllView(q);
  }

  // --- Question Rendering ---
  function renderCurrentQuestion() {
    const q = questions[currentIndex];
    if (!q) return;

    // 1. Meta Badges
    const filterPos = filteredIndices.indexOf(currentIndex);
    const posText = filterPos !== -1 
      ? t('q_pos_filtered', { id: q.id, pos: filterPos + 1, total: filteredIndices.length })
      : t('q_pos', { pos: q.id, total: questions.length });
    elQNumber.textContent = posText;
    elNavStatus.textContent = `${currentIndex + 1} / ${questions.length}`;

    elQTypeBadge.textContent = t('type_' + q.type) || t('type_multiple_choice_single');

    // Bookmark state
    const icon = elBtnBookmark.querySelector('.material-symbols-outlined');
    if (bookmarks.has(q.id)) {
      elBtnBookmark.classList.add('bookmarked');
      elBookmarkText.textContent = t('bookmarked');
      if (icon) icon.textContent = 'bookmark';
    } else {
      elBtnBookmark.classList.remove('bookmarked');
      elBookmarkText.textContent = t('bookmark');
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

  function renderOptions(q, targetContainer = elOptionsContainer) {
    if (!targetContainer) return;
    targetContainer.innerHTML = '';
    const ansState = userAnswers[q.id] || { selectedKeys: [], interactiveAnswers: {}, isCorrect: null, revealed: false };

    // 1. Interactive Real Microsoft Exam Widgets
    if (q.interactive) {
      if (q.interactive.type === 'yes_no') {
        renderYesNoWidget(q, ansState, targetContainer);
      } else if (q.interactive.type === 'dropdown') {
        renderDropdownWidget(q, ansState, targetContainer);
      } else if (q.interactive.type === 'matching' || q.interactive.type === 'drag_drop_order') {
        renderMatchingWidget(q, ansState, targetContainer);
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
            statusBadgeHtml = `<span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 inline-flex items-center space-x-1"><span class="material-symbols-outlined text-[13px]">check</span><span>${t('badge_correct')}</span></span>`;
          } else if (isSelected && !isKeyCorrect) {
            item.classList.add('wrong');
            statusBadgeHtml = `<span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 inline-flex items-center space-x-1"><span class="material-symbols-outlined text-[13px]">close</span><span>${t('badge_wrong')}</span></span>`;
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
        targetContainer.appendChild(item);
      });

      // Multi-choice check button
      if (isMulti && mode === 'study' && ansState.selectedKeys && ansState.selectedKeys.length > 0 && !ansState.revealed) {
        const confirmWrap = document.createElement('div');
        confirmWrap.className = 'pt-2 flex justify-end';
        const btnConfirm = document.createElement('button');
        btnConfirm.className = 'w-full sm:w-auto px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-xs transition-all active:scale-95';
        btnConfirm.textContent = t('check_selection');
        btnConfirm.addEventListener('click', () => {
          submitMultiChoice(q);
        });
        confirmWrap.appendChild(btnConfirm);
        targetContainer.appendChild(confirmWrap);
      }

    } else {
      // Non-MC question fallback guide
      const helper = document.createElement('div');
      helper.className = 'interactive-guide flex items-start space-x-3';
      helper.innerHTML = `
        <span class="material-symbols-outlined text-orange-500 text-[18px] shrink-0 mt-0.5">info</span>
        <div>
          <strong class="font-semibold text-orange-600 dark:text-orange-400 block mb-1">${t('interactive_guide_title')}</strong>
          <span>${t('interactive_guide_desc')}</span>
        </div>
      `;
      targetContainer.appendChild(helper);
    }
  }

  // --- Interactive Widgets Implementations ---
  function renderYesNoWidget(q, ansState, targetContainer = elOptionsContainer) {
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
      btnConfirm.innerHTML = `<span class="material-symbols-outlined text-[16px]">check_circle</span><span>${t('check_selection')}</span>`;

      btnConfirm.addEventListener('click', () => submitInteractiveQuestion(q));
      confirmWrap.appendChild(btnConfirm);
      container.appendChild(confirmWrap);
    }

    targetContainer.appendChild(container);
  }

  function renderDropdownWidget(q, ansState, targetContainer = elOptionsContainer) {
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

    targetContainer.appendChild(container);
  }

  function renderMatchingWidget(q, ansState, targetContainer = elOptionsContainer) {
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

    targetContainer.appendChild(container);
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
    refreshQuestionUI(q);
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
    refreshQuestionUI(q);
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
    refreshQuestionUI(q);
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
    refreshQuestionUI(q);
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
        refreshQuestionUI(q);
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
    refreshQuestionUI(q);
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
        elExplCorrectAnswer.textContent = `${t('correct_answer_label')} ` + q.answer;
      }
      elExplBody.textContent = q.explanation;

      const elExplImages = document.getElementById('explImages');
      if (elExplImages) {
        elExplImages.innerHTML = '';
        if (q.answer_images && q.answer_images.length > 0) {
          elExplImages.style.display = 'flex';

          const header = document.createElement('div');
          header.className = 'flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 pt-2.5 border-t border-emerald-500/20';
          header.innerHTML = `<span class="material-symbols-outlined text-[15px]">verified</span><span>${t('official_diagram')}</span>`;
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
            hint.innerHTML = `<span class="material-symbols-outlined text-[13px]">zoom_in</span><span>${t('click_to_enlarge')}</span>`;

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
        closeDrawer();
        if (currentLayout === 'all') {
          setTimeout(() => {
            const card = document.getElementById(`all-q-card-${q.id}`);
            if (card) {
              card.scrollIntoView({ behavior: 'smooth', block: 'center' });
              card.classList.add('ring-2', 'ring-orange-500/50');
              setTimeout(() => card.classList.remove('ring-2', 'ring-orange-500/50'), 1500);
            }
          }, 150);
        } else {
          goToIndex(idx);
        }
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

  // --- Mode Logic (Study | Exam | Tips) ---
  function setMode(newMode) {
    mode = newMode;

    const btnStudy = elBtnStudyMode || document.getElementById('btnStudyMode');
    const btnExam = elBtnExamMode || document.getElementById('btnExamMode');
    const btnTips = elBtnTipsMode || document.getElementById('btnTipsMode');
    const viewQuiz = elViewQuiz || document.getElementById('viewQuiz');
    const viewTips = elViewTips || document.getElementById('viewTips');
    const navContainer = elFloatingNavContainer || document.getElementById('floatingNavContainer');
    const timer = elExamTimer || document.getElementById('examTimer');

    // Reset all segmented control buttons
    [btnStudy, btnExam, btnTips].forEach(btn => {
      if (btn) {
        btn.classList.remove('active');
        btn.classList.add('text-slate-500', 'dark:text-slate-400');
      }
    });

    if (mode === 'tips') {
      if (btnTips) {
        btnTips.classList.add('active');
        btnTips.classList.remove('text-slate-500', 'dark:text-slate-400');
      }
      if (viewQuiz) {
        viewQuiz.classList.add('hidden');
        viewQuiz.style.setProperty('display', 'none', 'important');
      }
      if (elViewAllQuestions) {
        elViewAllQuestions.classList.add('hidden');
        elViewAllQuestions.style.setProperty('display', 'none', 'important');
      }
      if (viewTips) {
        viewTips.classList.remove('hidden');
        viewTips.style.setProperty('display', 'block', 'important');
      }
      if (navContainer) {
        navContainer.classList.add('hidden');
        navContainer.style.setProperty('display', 'none', 'important');
      }
      if (timer) {
        timer.classList.add('hidden');
        timer.classList.remove('flex');
        timer.style.setProperty('display', 'none', 'important');
      }
      stopExamTimer();
      renderTipsList();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Study or Exam mode
    if (viewTips) {
      viewTips.classList.add('hidden');
      viewTips.style.setProperty('display', 'none', 'important');
    }
    if (currentLayout === 'all') {
      if (viewQuiz) {
        viewQuiz.classList.add('hidden');
        viewQuiz.style.setProperty('display', 'none', 'important');
      }
      if (elViewAllQuestions) {
        elViewAllQuestions.classList.remove('hidden');
        elViewAllQuestions.style.display = 'block';
      }
      if (navContainer) {
        navContainer.classList.add('hidden');
        navContainer.style.setProperty('display', 'none', 'important');
      }
      renderAllQuestionsView();
    } else {
      if (elViewAllQuestions) {
        elViewAllQuestions.classList.add('hidden');
        elViewAllQuestions.style.setProperty('display', 'none', 'important');
      }
      if (viewQuiz) {
        viewQuiz.classList.remove('hidden');
        viewQuiz.style.removeProperty('display');
      }
      if (navContainer) {
        navContainer.classList.remove('hidden');
        navContainer.style.removeProperty('display');
      }
      renderCurrentQuestion();
    }

    if (mode === 'study') {
      if (btnStudy) {
        btnStudy.classList.add('active');
        btnStudy.classList.remove('text-slate-500', 'dark:text-slate-400');
      }
      if (timer) {
        timer.classList.add('hidden');
        timer.classList.remove('flex');
        timer.style.setProperty('display', 'none', 'important');
      }
      stopExamTimer();
    } else if (mode === 'exam') {
      if (btnExam) {
        btnExam.classList.add('active');
        btnExam.classList.remove('text-slate-500', 'dark:text-slate-400');
      }
      if (timer) {
        timer.classList.remove('hidden');
        timer.classList.add('flex');
        timer.style.removeProperty('display');
      }
      startExamTimer();
    }
    renderCurrentQuestion();
  }

  // Global exposure for inline HTML onclick and external triggers
  window.setMode = setMode;
  window.goToQuestionFromTips = goToQuestionFromTips;

  // --- Tips & Tricks Renderer ---
  function renderTipsList() {
    const listContainer = elTipsListContainer || document.getElementById('tipsListContainer');
    if (!listContainer) return;
    const allTips = (typeof AI103_TIPS_DATA !== 'undefined' && AI103_TIPS_DATA) || window.AI103_TIPS_DATA || [];
    
    // Filter
    const kw = (tipSearchKeyword || '').trim().toLowerCase();
    const filtered = allTips.filter(tip => {
      // Category match
      if (currentTipCategory !== 'all' && tip.category !== currentTipCategory) {
        return false;
      }
      // Keyword search match
      if (kw) {
        const textToSearch = [
          tip.title,
          tip.highlight,
          tip.summary,
          ...(tip.tags || []),
          ...(tip.rules ? tip.rules.map(r => r.text) : []),
          tip.codeSnippet || ''
        ].join(' ').toLowerCase();
        
        if (!textToSearch.includes(kw)) {
          return false;
        }
      }
      return true;
    });

    // Toggle No results state
    const noRes = elTipNoResults || document.getElementById('tipNoResults');
    if (filtered.length === 0) {
      listContainer.innerHTML = '';
      if (noRes) noRes.classList.remove('hidden');
      return;
    }
    if (noRes) noRes.classList.add('hidden');

    listContainer.innerHTML = '';

    filtered.forEach((tip) => {
      const card = document.createElement('article');
      card.className = 'rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white/80 dark:bg-[#111726]/80 backdrop-blur-xl p-4 sm:p-5 shadow-xs transition-all hover:border-orange-500/30';
      
      // Category colors mapping
      const categoryTheme = {
        keywords: { badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20', icon: 'key' },
        interactive: { badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', icon: 'touch_app' },
        metrics: { badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', icon: 'calculate' },
        cheatsheet: { badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20', icon: 'code' },
        security: { badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20', icon: 'shield_lock' },
        strategy: { badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', icon: 'timer' }
      }[tip.category] || { badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20', icon: 'lightbulb' };

      const isEn = currentLanguage === 'en';
      const tipTitle = isEn && tip.title_en ? tip.title_en : tip.title;
      const tipCategoryLabel = isEn && tip.categoryLabel_en ? tip.categoryLabel_en : tip.categoryLabel;
      const tipHighlight = isEn && tip.highlight_en ? tip.highlight_en : tip.highlight;
      const tipSummary = isEn && tip.summary_en ? tip.summary_en : tip.summary;
      const tipRules = isEn && tip.rules_en ? tip.rules_en : (tip.rules || []);

      // Header row: Badges + Number
      let html = `
        <div class="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div class="flex items-center space-x-1.5">
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border ${categoryTheme.badge}">
              ${escapeHtml(tipCategoryLabel)}
            </span>
            <span class="text-[11px] font-mono text-slate-400 dark:text-slate-500">
              #${String(tip.id).padStart(2, '0')}
            </span>
          </div>
          <span class="material-symbols-outlined text-[18px] text-orange-500/80">
            ${tip.icon || 'lightbulb'}
          </span>
        </div>

        <h3 class="text-sm sm:text-[15px] font-semibold text-slate-900 dark:text-slate-100 tracking-[-0.01em] mb-2.5 leading-snug">
          ${escapeHtml(tipTitle)}
        </h3>

        <!-- Core Highlight Pill Banner -->
        <div class="p-3 rounded-xl bg-orange-500/[0.07] dark:bg-orange-500/[0.12] border-l-[3px] border-orange-500 text-xs sm:text-[13px] text-slate-800 dark:text-orange-100 font-medium mb-3 flex items-start gap-2 leading-relaxed">
          <span class="material-symbols-outlined text-[16px] text-orange-500 shrink-0 mt-0.5">bolt</span>
          <div>${escapeHtml(tipHighlight)}</div>
        </div>

        <p class="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
          ${escapeHtml(tipSummary)}
        </p>
      `;

      // Rules / Key Points
      if (tipRules && tipRules.length > 0) {
        html += `<div class="space-y-2 mb-3">`;
        tipRules.forEach(rule => {
          const isPick = rule.type === 'pick';
          const icon = isPick ? 'check_circle' : 'cancel';
          const iconColor = isPick ? 'text-emerald-500' : 'text-rose-500';
          const bgColor = isPick 
            ? 'bg-emerald-500/[0.04] dark:bg-emerald-500/[0.08] border-emerald-500/20' 
            : 'bg-rose-500/[0.04] dark:bg-rose-500/[0.08] border-rose-500/20';
          const textColor = isPick 
            ? 'text-emerald-950 dark:text-emerald-200' 
            : 'text-rose-950 dark:text-rose-200';

          html += `
            <div class="flex items-start gap-2 p-2 sm:p-2.5 rounded-lg border ${bgColor} text-xs leading-relaxed">
              <span class="material-symbols-outlined text-[15px] ${iconColor} shrink-0 mt-0.5">${icon}</span>
              <span class="${textColor}">${escapeHtml(rule.text)}</span>
            </div>
          `;
        });
        html += `</div>`;
      }

      // Code Snippet (if any)
      if (tip.codeSnippet) {
        const snippetId = `tip_snippet_${tip.id}`;
        html += `
          <div class="tip-code-block mb-3">
            <div class="flex items-center justify-between px-3 py-1.5 bg-black/20 border-b border-white/[0.06] text-[11px] font-mono text-slate-400">
              <span>Code / Payload</span>
              <button class="tip-code-copy-btn flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] text-slate-300 active:scale-95" data-copy-target="${snippetId}">
                <span class="material-symbols-outlined text-[12px]">content_copy</span>
                <span>${isEn ? 'Copy' : 'Sao chép'}</span>
              </button>
            </div>
            <pre id="${snippetId}" class="p-3 text-[11.5px] font-mono leading-relaxed text-slate-200 overflow-x-auto no-scrollbar whitespace-pre"><code>${escapeHtml(tip.codeSnippet)}</code></pre>
          </div>
        `;
      }

      // Related Questions (Interactive Links)
      if (tip.relatedQuestions && tip.relatedQuestions.length > 0) {
        html += `
          <div class="pt-2.5 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center flex-wrap gap-1.5">
            <span class="text-[11px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <span class="material-symbols-outlined text-[13px]">arrow_forward</span>
              Ôn luyện câu:
            </span>
        `;
        tip.relatedQuestions.forEach(qid => {
          html += `
            <button class="btn-tip-jump px-2 py-0.5 rounded-md bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/20 text-[11px] font-mono font-semibold transition-all active:scale-95" data-qid="${qid}">
              Câu ${qid} ↗
            </button>
          `;
        });
        html += `</div>`;
      }

      card.innerHTML = html;
      listContainer.appendChild(card);
    });

    // Attach copy events
    listContainer.querySelectorAll('.tip-code-copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-copy-target');
        const pre = document.getElementById(targetId);
        if (pre) {
          navigator.clipboard.writeText(pre.textContent.trim()).then(() => {
            showToast('Đã sao chép đoạn mã vào clipboard!', 'check');
          }).catch(() => {
            showToast('Không thể tự động sao chép', 'warning');
          });
        }
      });
    });

    // Attach jump events
    listContainer.querySelectorAll('.btn-tip-jump').forEach(btn => {
      btn.addEventListener('click', () => {
        const qid = parseInt(btn.getAttribute('data-qid'), 10);
        if (qid) {
          goToQuestionFromTips(qid);
        }
      });
    });
  }

  function goToQuestionFromTips(qid) {
    const idx = questions.findIndex(q => q.id === qid);
    if (idx !== -1) {
      setMode('study');
      if (currentLayout === 'all') {
        setTimeout(() => {
          const card = document.getElementById(`all-q-card-${qid}`);
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.classList.add('ring-2', 'ring-orange-500/50');
            setTimeout(() => card.classList.remove('ring-2', 'ring-orange-500/50'), 1500);
          }
        }, 150);
      } else {
        goToIndex(idx);
      }
      showToast(currentLanguage === 'en' ? `Opening Question ${qid}!` : `Đang mở Câu ${qid} để ôn tập ngay!`, 'verified');
    } else {
      showToast(currentLanguage === 'en' ? `Question ${qid} not found` : `Không tìm thấy câu ${qid}`, 'error');
    }
  }

  function initTipCategoryCounts() {
    const allTips = window.AI103_TIPS_DATA || [];
    const counts = { all: allTips.length };
    allTips.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    if (elTipCategoryPills) {
      elTipCategoryPills.forEach(pill => {
        const cat = pill.getAttribute('data-category');
        const count = counts[cat] || 0;
        const labelMap = {
          all: 'Tất cả',
          keywords: 'Từ khóa vàng',
          interactive: 'Câu tương tác',
          cheatsheet: 'Code & SDK',
          security: 'Bảo mật & Mạng',
          metrics: 'Công thức',
          strategy: 'Chiến thuật'
        };
        if (labelMap[cat]) {
          pill.textContent = `${labelMap[cat]} (${count})`;
        }
      });
    }
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
    elResultPassStatus.textContent = pct >= 70 ? t('exam_passed') : t('exam_failed');
    if (currentLayout === 'all') {
      renderAllQuestionsView();
    }
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
    if (elBtnTipsMode) elBtnTipsMode.addEventListener('click', () => setMode('tips'));

    // Tips & Mẹo Interactions
    if (elTipSearchInput) {
      elTipSearchInput.addEventListener('input', (e) => {
        tipSearchKeyword = e.target.value;
        if (elBtnClearTipSearch) {
          if (tipSearchKeyword) elBtnClearTipSearch.classList.remove('hidden');
          else elBtnClearTipSearch.classList.add('hidden');
        }
        renderTipsList();
      });
    }

    if (elBtnClearTipSearch) {
      elBtnClearTipSearch.addEventListener('click', () => {
        if (elTipSearchInput) {
          elTipSearchInput.value = '';
          tipSearchKeyword = '';
          elBtnClearTipSearch.classList.add('hidden');
          renderTipsList();
          elTipSearchInput.focus();
        }
      });
    }

    if (elTipCategoryPills) {
      elTipCategoryPills.forEach(pill => {
        pill.addEventListener('click', () => {
          elTipCategoryPills.forEach(p => {
            p.classList.remove('active');
            p.classList.add('text-slate-500', 'dark:text-slate-400');
          });
          pill.classList.add('active');
          pill.classList.remove('text-slate-500', 'dark:text-slate-400');
          currentTipCategory = pill.getAttribute('data-category') || 'all';
          renderTipsList();
        });
      });
    }

    if (elBtnTipsScrollTop) {
      elBtnTipsScrollTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }


    // Layout & Language Toggle
    if (elBtnLayoutToggle) {
      elBtnLayoutToggle.addEventListener('click', toggleLayout);
    }
    if (elBtnLangToggle) {
      elBtnLangToggle.addEventListener('click', toggleLanguage);
    }

    // All Questions Filter Pills
    if (elAllQFilterPills) {
      elAllQFilterPills.forEach(pill => {
        pill.addEventListener('click', () => {
          elAllQFilterPills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          allQFilter = pill.getAttribute('data-filter') || 'all';
          renderAllQuestionsView();
        });
      });
    }

    // All Questions Quick Jump
    function handleAllQJump() {
      const val = parseInt(elAllQJumpInput ? elAllQJumpInput.value : 0, 10);
      if (val >= 1 && val <= questions.length) {
        const target = document.getElementById(`all-q-card-${val}`);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          target.classList.add('ring-2', 'ring-orange-500/50');
          setTimeout(() => target.classList.remove('ring-2', 'ring-orange-500/50'), 1500);
        }
      }
    }
    if (elBtnAllQJump) elBtnAllQJump.addEventListener('click', handleAllQJump);
    if (elAllQJumpInput) {
      elAllQJumpInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleAllQJump();
      });
    }

    // All Questions Exam Submit
    if (elBtnAllQExamSubmit) {
      elBtnAllQExamSubmit.addEventListener('click', () => {
        if (confirm(t('exam_ready_submit'))) {
          submitExam();
        }
      });
    }

    // Scroll to Top Floating Button
    window.addEventListener('scroll', () => {
      if (elBtnScrollToTop) {
        if (window.scrollY > 400 && currentLayout === 'all' && mode !== 'tips') {
          elBtnScrollToTop.classList.add('visible');
        } else {
          elBtnScrollToTop.classList.remove('visible');
        }
      }
    }, { passive: true });

    if (elBtnScrollToTop) {
      elBtnScrollToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

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

      if (mode === 'tips') {
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
