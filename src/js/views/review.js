import { getAllWords, getAllCategories } from '../db.js';
import { showToast } from '../app.js';
import { fitAllCardTexts } from '../card-helper.js';

export function renderReview(app, router) {
  return async () => {
    const allWords = await getAllWords();
    const rawCategories = await getAllCategories();

    if (allWords.length === 0) {
      app.innerHTML = `
        <div class="page-enter">
          <div class="header">
            <button class="header-back" id="btn-back">←</button>
            <span class="header-title">Takrorlash</span>
            <div class="header-spacer"></div>
          </div>
          <div class="empty-state">
            <div class="empty-state-icon">📭</div>
            <div class="empty-state-text">Hali so'z qo'shilmagan</div>
            <button class="empty-state-btn" id="btn-go-add">So'z qo'shish</button>
          </div>
        </div>
      `;
      document.getElementById('btn-back').addEventListener('click', () => router.navigate('/'));
      document.getElementById('btn-go-add').addEventListener('click', () => router.navigate('/add'));
      return;
    }

    // Build unique categories list from DB and words
    const categorySet = new Set(['Umumiy']);
    rawCategories.forEach(c => {
      const name = (typeof c === 'string' ? c : c?.name || '').trim();
      if (name) categorySet.add(name);
    });
    allWords.forEach(w => {
      const c = (w.category || '').trim();
      if (c) categorySet.add(c);
    });
    const categories = Array.from(categorySet);

    // Count words per category
    const catCounts = {};
    allWords.forEach(w => {
      const c = (w.category || 'Umumiy').trim();
      catCounts[c] = (catCounts[c] || 0) + 1;
    });

    let selectedCategory = 'all';

    function getFilteredWords(cat) {
      if (cat === 'all') return allWords;
      return allWords.filter(w => (w.category || 'Umumiy').trim().toLowerCase() === cat.trim().toLowerCase());
    }

    // Show setup page first
    renderSetup();

    function renderSetup() {
      let currentWords = getFilteredWords(selectedCategory);

      app.innerHTML = `
        <div class="page-enter">
          <div class="header">
            <button class="header-back" id="btn-back">←</button>
            <span class="header-title">Takrorlash</span>
            <div class="header-spacer"></div>
          </div>

          <div class="review-setup">
            <div class="range-selector">
              <div class="range-title">Diapazonni tanlang</div>

              <!-- Bo'lim tanlash -->
              <div class="range-category-field">
                <label for="review-category">Bo'lim</label>
                <select id="review-category" class="range-category-select">
                  <option value="all" ${selectedCategory === 'all' ? 'selected' : ''}>🌐 Barcha bo'limlar (${allWords.length} ta)</option>
                  ${categories.map(cat => {
                    const cnt = catCounts[cat] || 0;
                    return `<option value="${escapeHtml(cat)}" ${selectedCategory === cat ? 'selected' : ''}>📁 ${escapeHtml(cat)} (${cnt} ta)</option>`;
                  }).join('')}
                </select>
              </div>

              <!-- Dan / Gacha inputlari -->
              <div class="range-inputs">
                <div class="range-field">
                  <label for="range-from">Dan</label>
                  <input type="number" id="range-from" value="1" min="1" max="${currentWords.length || 1}" inputmode="numeric" ${currentWords.length === 0 ? 'disabled' : ''}>
                </div>
                <div class="range-separator">—</div>
                <div class="range-field">
                  <label for="range-to">Gacha</label>
                  <input type="number" id="range-to" value="${currentWords.length || 1}" min="1" max="${currentWords.length || 1}" inputmode="numeric" ${currentWords.length === 0 ? 'disabled' : ''}>
                </div>
              </div>
            </div>

            <div class="range-info" id="range-info">
              ${getInfoHtml(1, currentWords.length, selectedCategory, currentWords.length)}
            </div>

            <button class="btn-start-review" id="btn-start" ${currentWords.length === 0 ? 'disabled' : ''}>
              ▶️ Boshlash
            </button>
          </div>
        </div>
      `;

      document.getElementById('btn-back').addEventListener('click', () => router.navigate('/'));

      const catSelect = document.getElementById('review-category');
      const fromInput = document.getElementById('range-from');
      const toInput = document.getElementById('range-to');
      const infoEl = document.getElementById('range-info');
      const btnStart = document.getElementById('btn-start');

      function getInfoHtml(from, to, cat, total) {
        if (total === 0) {
          return `<span style="color:#e74c3c;font-weight:600;">⚠️ Ushbu bo'limda so'zlar mavjud emas</span>`;
        }
        const count = Math.max(0, to - from + 1);
        if (cat === 'all') {
          return `<strong>${count}</strong> ta so'z takrorlanadi`;
        } else {
          return `📁 <strong>${escapeHtml(cat)}</strong> bo'limidan <strong>${count}</strong> ta so'z takrorlanadi`;
        }
      }

      function updateInfo() {
        const total = currentWords.length;
        if (total === 0) {
          infoEl.innerHTML = getInfoHtml(0, 0, selectedCategory, 0);
          btnStart.disabled = true;
          return;
        }
        let from = parseInt(fromInput.value) || 1;
        let to = parseInt(toInput.value) || total;
        from = Math.max(1, Math.min(from, total));
        to = Math.max(from, Math.min(to, total));
        infoEl.innerHTML = getInfoHtml(from, to, selectedCategory, total);
        btnStart.disabled = false;
      }

      catSelect.addEventListener('change', () => {
        selectedCategory = catSelect.value;
        currentWords = getFilteredWords(selectedCategory);
        const total = currentWords.length;

        if (total === 0) {
          fromInput.value = 0;
          toInput.value = 0;
          fromInput.disabled = true;
          toInput.disabled = true;
          btnStart.disabled = true;
          infoEl.innerHTML = getInfoHtml(0, 0, selectedCategory, 0);
        } else {
          fromInput.disabled = false;
          toInput.disabled = false;
          fromInput.min = 1;
          fromInput.max = total;
          toInput.min = 1;
          toInput.max = total;
          fromInput.value = 1;
          toInput.value = total;
          btnStart.disabled = false;
          updateInfo();
        }
      });

      fromInput.addEventListener('input', updateInfo);
      toInput.addEventListener('input', updateInfo);

      btnStart.addEventListener('click', () => {
        const total = currentWords.length;
        if (total === 0) {
          showToast('❌ Bu bo\'limda so\'z yo\'q');
          return;
        }

        let from = parseInt(fromInput.value) || 1;
        let to = parseInt(toInput.value) || total;
        from = Math.max(1, Math.min(from, total));
        to = Math.max(from, Math.min(to, total));

        if (from > to) {
          showToast('❌ "Dan" qiymati "Gacha"dan kichik bo\'lishi kerak');
          return;
        }

        const selectedWords = currentWords.slice(from - 1, to);
        startReview(selectedWords, from, to, selectedCategory);
      });
    }

    function startReview(words, fromNum, toNum, categoryName = 'all') {
      let currentIndex = 0;
      let isFlipped = false;
      const startTime = performance.now();
      let timerInterval = null;

      // Start timer with ~30ms interval for smooth centisecond updates (00:00.00)
      timerInterval = setInterval(() => {
        const elapsedMs = performance.now() - startTime;
        const timerEl = document.getElementById('timer');
        if (timerEl) {
          timerEl.textContent = formatStopwatch(elapsedMs);
        }
      }, 33);

      function render() {
        const word = words[currentIndex];
        isFlipped = false;
        const currentElapsed = performance.now() - startTime;

        app.innerHTML = `
          <div class="page-enter">
            <div class="header">
              <button class="header-back" id="btn-back">←</button>
              <span class="header-title">Takrorlash</span>
              <button class="header-action" id="btn-finish">Tugatish</button>
            </div>

            <div class="flashcard-page">
              <div class="timer-display" id="timer">${formatStopwatch(currentElapsed)}</div>

              <div class="card-container">
                <div class="card-wrapper" id="card">
                  <div class="card-inner">
                    <div class="card-front">
                      <div class="card-text">${escapeHtml(word.word)}</div>
                    </div>
                    <div class="card-back">
                      <div class="card-text">${escapeHtml(word.translation)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="card-indicator">
                <strong>${currentIndex + 1}</strong> / ${words.length}
              </div>

              <div class="card-nav">
                <button class="card-nav-btn" id="btn-prev" ${currentIndex === 0 ? 'disabled' : ''}>
                  ←
                </button>
                <button class="card-nav-btn primary" id="btn-next">
                  ${currentIndex === words.length - 1 ? '✓' : '→'}
                </button>
              </div>
            </div>
          </div>
        `;

        // Auto-fit card text font size on render
        requestAnimationFrame(() => {
          fitAllCardTexts(document.getElementById('card'));
        });

        // Card flip
        document.getElementById('card').addEventListener('click', () => {
          isFlipped = !isFlipped;
          const card = document.getElementById('card');
          card.classList.toggle('flipped', isFlipped);
          fitAllCardTexts(card);
        });

        // Nav
        document.getElementById('btn-prev').addEventListener('click', () => {
          if (currentIndex > 0) {
            currentIndex--;
            render();
          }
        });

        document.getElementById('btn-next').addEventListener('click', () => {
          if (currentIndex < words.length - 1) {
            currentIndex++;
            render();
          } else {
            // Finished!
            finishReview();
          }
        });

        document.getElementById('btn-back').addEventListener('click', () => {
          clearInterval(timerInterval);
          renderSetup();
        });

        document.getElementById('btn-finish').addEventListener('click', () => {
          finishReview();
        });

        // Swipe
        let touchStartX = 0;
        const cardEl = document.getElementById('card');

        cardEl.addEventListener('touchstart', (e) => {
          touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        cardEl.addEventListener('touchend', (e) => {
          const diff = touchStartX - e.changedTouches[0].screenX;
          if (Math.abs(diff) < 50) return;
          if (diff > 0 && currentIndex < words.length - 1) {
            currentIndex++;
            render();
          } else if (diff < 0 && currentIndex > 0) {
            currentIndex--;
            render();
          }
        }, { passive: true });

        // Keyboard
        const handleKey = (e) => {
          if (e.key === 'ArrowRight') {
            if (currentIndex < words.length - 1) {
              currentIndex++;
              render();
            } else {
              finishReview();
            }
          } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
            currentIndex--;
            render();
          } else if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            isFlipped = !isFlipped;
            const card = document.getElementById('card');
            card.classList.toggle('flipped', isFlipped);
            fitAllCardTexts(card);
          }
        };
        if (window._reviewKeyHandler) {
          document.removeEventListener('keydown', window._reviewKeyHandler);
        }
        document.addEventListener('keydown', handleKey);
        window._reviewKeyHandler = handleKey;
      }

      function finishReview() {
        clearInterval(timerInterval);
        if (window._reviewKeyHandler) {
          document.removeEventListener('keydown', window._reviewKeyHandler);
        }

        const totalElapsedMs = performance.now() - startTime;
        const reviewed = currentIndex + 1;
        const perWord = reviewed > 0 ? (totalElapsedMs / 1000 / reviewed).toFixed(2) : '0.00';

        const categorySubtitle = categoryName === 'all'
          ? `Barcha bo'limlar: so'zlar ${fromNum}–${toNum} takrorlandi`
          : `📁 ${escapeHtml(categoryName)}: so'zlar ${fromNum}–${toNum} takrorlandi`;

        app.innerHTML = `
          <div class="page-enter">
            <div class="header">
              <button class="header-back" id="btn-back">←</button>
              <span class="header-title">Natija</span>
              <div class="header-spacer"></div>
            </div>

            <div class="results-page">
              <div class="results-emoji">🎉</div>
              <div class="results-title">Ajoyib!</div>
              <div class="results-subtitle">${categorySubtitle}</div>

              <div class="results-stats">
                <div class="results-stat">
                  <div class="results-stat-value">${formatStopwatch(totalElapsedMs)}</div>
                  <div class="results-stat-label">Umumiy vaqt</div>
                </div>
                <div class="results-stat">
                  <div class="results-stat-value">${reviewed}</div>
                  <div class="results-stat-label">So'zlar soni</div>
                </div>
                <div class="results-stat">
                  <div class="results-stat-value">${perWord}s</div>
                  <div class="results-stat-label">Har bir so'z</div>
                </div>
              </div>

              <button class="btn-restart" id="btn-again">🔄 Qayta takrorlash</button>
              <button class="btn-home" id="btn-home">🏠 Bosh sahifa</button>
            </div>
          </div>
        `;

        document.getElementById('btn-back').addEventListener('click', () => router.navigate('/'));
        document.getElementById('btn-again').addEventListener('click', () => {
          startReview(words, fromNum, toNum, categoryName);
        });
        document.getElementById('btn-home').addEventListener('click', () => router.navigate('/'));
      }

      render();
    }
  };
}

function formatStopwatch(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const hundredths = Math.floor((ms % 1000) / 10);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
