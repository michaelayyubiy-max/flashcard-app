import { getAllWords } from '../db.js';
import { showToast } from '../app.js';

export function renderReview(app, router) {
  return async () => {
    const allWords = await getAllWords();

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

    // Show setup page first
    renderSetup();

    function renderSetup() {
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
              <div class="range-inputs">
                <div class="range-field">
                  <label>Dan</label>
                  <input type="number" id="range-from" value="1" min="1" max="${allWords.length}" inputmode="numeric">
                </div>
                <div class="range-separator">—</div>
                <div class="range-field">
                  <label>Gacha</label>
                  <input type="number" id="range-to" value="${allWords.length}" min="1" max="${allWords.length}" inputmode="numeric">
                </div>
              </div>
            </div>

            <div class="range-info" id="range-info">
              <strong>${allWords.length}</strong> ta so'z takrorlanadi
            </div>

            <button class="btn-start-review" id="btn-start">
              ▶️ Boshlash
            </button>
          </div>
        </div>
      `;

      document.getElementById('btn-back').addEventListener('click', () => router.navigate('/'));

      const fromInput = document.getElementById('range-from');
      const toInput = document.getElementById('range-to');
      const infoEl = document.getElementById('range-info');

      function updateInfo() {
        let from = parseInt(fromInput.value) || 1;
        let to = parseInt(toInput.value) || allWords.length;
        from = Math.max(1, Math.min(from, allWords.length));
        to = Math.max(from, Math.min(to, allWords.length));
        const count = to - from + 1;
        infoEl.innerHTML = `<strong>${count}</strong> ta so'z takrorlanadi`;
      }

      fromInput.addEventListener('input', updateInfo);
      toInput.addEventListener('input', updateInfo);

      document.getElementById('btn-start').addEventListener('click', () => {
        let from = parseInt(fromInput.value) || 1;
        let to = parseInt(toInput.value) || allWords.length;
        from = Math.max(1, Math.min(from, allWords.length));
        to = Math.max(from, Math.min(to, allWords.length));

        if (from > to) {
          showToast('❌ "Dan" qiymati "Gacha"dan kichik bo\'lishi kerak');
          return;
        }

        const selectedWords = allWords.slice(from - 1, to);
        startReview(selectedWords, from, to);
      });
    }

    function startReview(words, fromNum, toNum) {
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

        // Card flip
        document.getElementById('card').addEventListener('click', () => {
          isFlipped = !isFlipped;
          document.getElementById('card').classList.toggle('flipped', isFlipped);
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
            document.getElementById('card').classList.toggle('flipped', isFlipped);
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
              <div class="results-subtitle">So'zlar ${fromNum}-${toNum} takrorlandi</div>

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
          startReview(words, fromNum, toNum);
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
