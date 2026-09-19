import { getAllWords } from '../db.js';
import { showToast } from '../app.js';
import { fitAllCardTexts } from '../card-helper.js';

export function renderLearn(app, router) {
  return async () => {
    const words = await getAllWords();

    if (words.length === 0) {
      app.innerHTML = `
        <div class="page-enter">
          <div class="header">
            <button class="header-back" id="btn-back">←</button>
            <span class="header-title">Yodlash</span>
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

    let currentIndex = 0;
    let isFlipped = false;

    function render() {
      const word = words[currentIndex];
      isFlipped = false;

      app.innerHTML = `
        <div class="page-enter">
          <div class="header">
            <button class="header-back" id="btn-back">←</button>
            <span class="header-title">Yodlash</span>
            <button class="header-action" id="btn-finish">Tugatish</button>
          </div>

          <div class="flashcard-page">
            <div class="card-container">
              <div class="card-wrapper" id="card">
                <div class="card-inner">
                  <div class="card-front">
                    <div class="card-label">📁 ${escapeHtml(word.category || 'Umumiy')}</div>
                    <div class="card-text">${escapeHtml(word.word)}</div>
                  </div>
                  <div class="card-back">
                    <div class="card-label">📁 ${escapeHtml(word.category || 'Umumiy')}</div>
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
              <button class="card-nav-btn primary" id="btn-next" ${currentIndex === words.length - 1 ? 'disabled' : ''}>
                →
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

      // Navigation
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
        }
      });

      // Back & Finish
      document.getElementById('btn-back').addEventListener('click', () => router.navigate('/'));
      document.getElementById('btn-finish').addEventListener('click', () => router.navigate('/'));

      // Swipe support
      let touchStartX = 0;
      let touchEndX = 0;
      const cardEl = document.getElementById('card');

      cardEl.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      cardEl.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      }, { passive: true });

      function handleSwipe() {
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) < 50) return; // Too small

        if (diff > 0 && currentIndex < words.length - 1) {
          // Swipe left = next
          currentIndex++;
          render();
        } else if (diff < 0 && currentIndex > 0) {
          // Swipe right = prev
          currentIndex--;
          render();
        }
      }

      // Keyboard support
      const handleKey = (e) => {
        if (e.key === 'ArrowRight' && currentIndex < words.length - 1) {
          currentIndex++;
          render();
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

      document.addEventListener('keydown', handleKey);
      // Cleanup on next render
      window._learnKeyHandler = handleKey;
    }

    // Clean up previous keyboard handler
    if (window._learnKeyHandler) {
      document.removeEventListener('keydown', window._learnKeyHandler);
    }

    render();
  };
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
