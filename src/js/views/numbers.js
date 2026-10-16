import {
  getAllMillenniumCards,
  getMillenniumCard,
  updateMillenniumCard,
  resetMillenniumCard,
  BLOCKS
} from '../millennium-data.js';
import { showToast } from '../app.js';
import { fitAllCardTexts } from '../card-helper.js';

export function renderNumbers(app, router) {
  return () => {
    const allInitialCards = getAllMillenniumCards();
    const minCardNum = allInitialCards.length > 0 ? parseInt(allInitialCards[0].number) : 50;
    const maxCardNum = allInitialCards.length > 0 ? parseInt(allInitialCards[allInitialCards.length - 1].number) : 99;

    let currentTab = 'flashcards'; // 'flashcards' | 'database' | 'guide'
    let selectedBlockId = 'all';
    let fromNum = minCardNum;
    let toNum = maxCardNum;
    let isShuffle = false;
    let cardDirection = 'num-to-word'; // 'num-to-word' | 'word-to-num'
    let playMode = 'manual'; // 'manual' | 'auto'
    let autoSpeedSec = 1.5;
    let searchQuery = '';
    let dbFilterBlock = 'all';

    function init() {
      renderMain();
    }

    function renderMain() {
      const cardsNow = getAllMillenniumCards();
      const currentMin = cardsNow.length > 0 ? cardsNow[0].number : '050';
      const currentMax = cardsNow.length > 0 ? cardsNow[cardsNow.length - 1].number : '099';

      app.innerHTML = `
        <div class="numbers-page page-enter">
          <!-- Header -->
          <div class="header">
            <button class="header-back" id="btn-back-hub" title="Yo'nalishlar">←</button>
            <span class="header-title">Raqamlar (${currentMin}–${currentMax})</span>
            <div class="header-spacer"></div>
          </div>

          <!-- Navigation Tabs -->
          <div class="numbers-tabs">
            <button class="num-tab ${currentTab === 'flashcards' ? 'active' : ''}" id="tab-flashcards">
              🃏 Flesh-karta
            </button>
            <button class="num-tab ${currentTab === 'database' ? 'active' : ''}" id="tab-database">
              📋 Baza (${cardsNow.length})
            </button>
            <button class="num-tab ${currentTab === 'guide' ? 'active' : ''}" id="tab-guide">
              ℹ️ CVC Qoidasi
            </button>
          </div>

          <!-- Tab Content Container -->
          <div id="tab-content" class="numbers-tab-content"></div>
        </div>
      `;

      // Back to hub
      document.getElementById('btn-back-hub').addEventListener('click', () => {
        router.navigate('/');
      });

      // Tabs click
      document.getElementById('tab-flashcards').addEventListener('click', () => {
        currentTab = 'flashcards';
        renderMain();
      });
      document.getElementById('tab-database').addEventListener('click', () => {
        currentTab = 'database';
        renderMain();
      });
      document.getElementById('tab-guide').addEventListener('click', () => {
        currentTab = 'guide';
        renderMain();
      });

      // Render tab view
      const contentEl = document.getElementById('tab-content');
      if (currentTab === 'flashcards') {
        renderFlashcardsSetup(contentEl);
      } else if (currentTab === 'database') {
        renderDatabaseView(contentEl);
      } else if (currentTab === 'guide') {
        renderGuideView(contentEl);
      }
    }

    // ══════════════════════════════════════════════
    // TAB 1: FLESH-KARTA SOZLAMALARI (SETUP)
    // ══════════════════════════════════════════════
    function renderFlashcardsSetup(container) {
      container.innerHTML = `
        <div class="num-setup-container">
          <!-- Diapazon tanlash -->
          <div class="setup-card">
            <div class="setup-section-title">
              <span>🎯</span> Diapazonni tanlang
            </div>

            <!-- Blok chiplari -->
            <div class="block-chips-grid">
              ${BLOCKS.map(b => `
                <button class="block-chip ${selectedBlockId === b.id ? 'active' : ''}" data-block-id="${b.id}">
                  ${b.label}
                </button>
              `).join('')}
            </div>

            <!-- Dan / Gacha aniq sonlar -->
            <div class="range-inputs" style="margin-top: 14px;">
              <div class="range-field">
                <label for="num-from">Dan</label>
                <input type="number" id="num-from" value="${fromNum}" min="${minCardNum}" max="${maxCardNum}" inputmode="numeric">
              </div>
              <div class="range-separator">—</div>
              <div class="range-field">
                <label for="num-to">Gacha</label>
                <input type="number" id="num-to" value="${toNum}" min="${minCardNum}" max="${maxCardNum}" inputmode="numeric">
              </div>
            </div>

            <div class="range-info" id="num-range-info" style="margin-top: 10px;">
              🎯 <strong>${allInitialCards.filter(c => parseInt(c.number) >= fromNum && parseInt(c.number) <= toNum).length}</strong> ta raqam takrorlanadi (${String(fromNum).padStart(3, '0')} dan ${String(toNum).padStart(3, '0')} gacha)
            </div>
          </div>

          <!-- Rejim va Tartib sozlamalari -->
          <div class="setup-card">
            <div class="setup-section-title">
              <span>⚙️</span> Mashq parametrlari
            </div>

            <!-- Karta yuzi -->
            <div class="setup-row">
              <label class="setup-label">Karta ko'rinishi</label>
              <div class="segmented-control">
                <button class="seg-btn ${cardDirection === 'num-to-word' ? 'active' : ''}" id="btn-dir-num">
                  Raqam ➔ Obraz
                </button>
                <button class="seg-btn ${cardDirection === 'word-to-num' ? 'active' : ''}" id="btn-dir-word">
                  Obraz ➔ Raqam
                </button>
              </div>
            </div>

            <!-- Tartib -->
            <div class="setup-row">
              <label class="setup-label">Tartib</label>
              <div class="segmented-control">
                <button class="seg-btn ${!isShuffle ? 'active' : ''}" id="btn-order-seq">
                  Ketma-ket
                </button>
                <button class="seg-btn ${isShuffle ? 'active' : ''}" id="btn-order-shuf">
                  Aralash 🔀
                </button>
              </div>
            </div>

            <!-- Rejim: Qo'lda / Avto -->
            <div class="setup-row">
              <label class="setup-label">Boshqaruv</label>
              <div class="segmented-control">
                <button class="seg-btn ${playMode === 'manual' ? 'active' : ''}" id="btn-mode-manual">
                  Qo'lda (Manual)
                </button>
                <button class="seg-btn ${playMode === 'auto' ? 'active' : ''}" id="btn-mode-auto">
                  Avtomat ⏱️
                </button>
              </div>
            </div>

            <!-- Avto tezlik tanlash (faqat avto yoqilganda) -->
            <div class="setup-row ${playMode === 'auto' ? '' : 'hidden'}" id="row-auto-speed">
              <label class="setup-label">Avto tezlik</label>
              <div class="speed-picker">
                ${[0.5, 1.0, 1.5, 2.0, 3.0].map(s => `
                  <button class="speed-btn ${autoSpeedSec === s ? 'active' : ''}" data-speed="${s}">
                    ${s}s
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Boshlash tugmasi -->
          <button class="btn-start-review" id="btn-start-training">
            ▶️ Mashg'ulotni boshlash
          </button>
        </div>
      `;

      // Event listeners for Setup
      const fromInput = document.getElementById('num-from');
      const toInput = document.getElementById('num-to');
      const infoEl = document.getElementById('num-range-info');

      function updateRangeDisplay() {
        let f = parseInt(fromInput.value);
        let t = parseInt(toInput.value);
        if (isNaN(f)) f = minCardNum;
        if (isNaN(t)) t = maxCardNum;
        f = Math.max(minCardNum, Math.min(f, maxCardNum));
        t = Math.max(f, Math.min(t, maxCardNum));
        fromNum = f;
        toNum = t;
        const count = allInitialCards.filter(c => {
          const n = parseInt(c.number);
          return n >= fromNum && n <= toNum;
        }).length;
        infoEl.innerHTML = `🎯 <strong>${count}</strong> ta raqam takrorlanadi (${String(fromNum).padStart(3, '0')} dan ${String(toNum).padStart(3, '0')} gacha)`;
      }

      container.querySelectorAll('.block-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('.block-chip').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          selectedBlockId = btn.dataset.blockId;
          const found = BLOCKS.find(b => b.id === selectedBlockId);
          if (found) {
            fromInput.value = found.range[0];
            toInput.value = found.range[1];
            updateRangeDisplay();
          }
        });
      });

      fromInput.addEventListener('input', () => {
        container.querySelectorAll('.block-chip').forEach(b => b.classList.remove('active'));
        updateRangeDisplay();
      });
      toInput.addEventListener('input', () => {
        container.querySelectorAll('.block-chip').forEach(b => b.classList.remove('active'));
        updateRangeDisplay();
      });

      // Direction
      document.getElementById('btn-dir-num').addEventListener('click', () => {
        cardDirection = 'num-to-word';
        document.getElementById('btn-dir-num').classList.add('active');
        document.getElementById('btn-dir-word').classList.remove('active');
      });
      document.getElementById('btn-dir-word').addEventListener('click', () => {
        cardDirection = 'word-to-num';
        document.getElementById('btn-dir-word').classList.add('active');
        document.getElementById('btn-dir-num').classList.remove('active');
      });

      // Order
      document.getElementById('btn-order-seq').addEventListener('click', () => {
        isShuffle = false;
        document.getElementById('btn-order-seq').classList.add('active');
        document.getElementById('btn-order-shuf').classList.remove('active');
      });
      document.getElementById('btn-order-shuf').addEventListener('click', () => {
        isShuffle = true;
        document.getElementById('btn-order-shuf').classList.add('active');
        document.getElementById('btn-order-seq').classList.remove('active');
      });

      // Mode
      document.getElementById('btn-mode-manual').addEventListener('click', () => {
        playMode = 'manual';
        document.getElementById('btn-mode-manual').classList.add('active');
        document.getElementById('btn-mode-auto').classList.remove('active');
        document.getElementById('row-auto-speed').classList.add('hidden');
      });
      document.getElementById('btn-mode-auto').addEventListener('click', () => {
        playMode = 'auto';
        document.getElementById('btn-mode-auto').classList.add('active');
        document.getElementById('btn-mode-manual').classList.remove('active');
        document.getElementById('row-auto-speed').classList.remove('hidden');
      });

      // Speed picker
      container.querySelectorAll('.speed-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          autoSpeedSec = parseFloat(btn.dataset.speed);
        });
      });

      // Start Training
      document.getElementById('btn-start-training').addEventListener('click', () => {
        const all = getAllMillenniumCards();
        let selectedCards = all.filter(c => {
          const n = parseInt(c.number);
          return n >= fromNum && n <= toNum;
        });
        if (selectedCards.length === 0) {
          showToast('❌ Diapazonda raqamlar topilmadi');
          return;
        }

        if (isShuffle) {
          selectedCards = shuffleArray([...selectedCards]);
        }

        startFlashcardSession(selectedCards, fromNum, toNum);
      });
    }

    // ══════════════════════════════════════════════
    // ACTIVE FLASHCARD SESSION (PLAYER)
    // ══════════════════════════════════════════════
    function startFlashcardSession(cards, startBound, endBound) {
      let currentIndex = 0;
      let isFlipped = false;
      const totalSessionStartTime = performance.now();
      let cardStartTime = performance.now();
      let cardTimerInterval = null;
      let autoPlayTimer = null;
      let isPaused = false;
      let pauseStartTime = 0;
      let pausedDurationOnCard = 0;

      function stopTimers() {
        if (cardTimerInterval) clearInterval(cardTimerInterval);
        if (autoPlayTimer) clearTimeout(autoPlayTimer);
      }

      function startCardStopwatch() {
        if (cardTimerInterval) clearInterval(cardTimerInterval);
        cardStartTime = performance.now();
        pausedDurationOnCard = 0;

        const el = document.getElementById('card-stopwatch');
        if (el) el.textContent = formatStopwatchMilli(0);

        cardTimerInterval = setInterval(() => {
          if (isPaused) return;
          const currentElapsed = performance.now() - cardStartTime - pausedDurationOnCard;
          const target = document.getElementById('card-stopwatch');
          if (target) {
            target.textContent = formatStopwatchMilli(currentElapsed);
          }
        }, 16);
      }

      function renderCard() {
        const item = cards[currentIndex];
        isFlipped = false;
        const progressPercent = Math.round(((currentIndex + 1) / cards.length) * 100);

        // Clean card contents: No badges, no formulas, no prompts
        const frontContent = cardDirection === 'num-to-word'
          ? `
            <div class="card-text num-huge">${item.number}</div>
          `
          : `
            <div class="card-text word-title">${escapeHtml(item.word)}</div>
            ${item.desc ? `<div class="card-desc-preview">${escapeHtml(item.desc)}</div>` : ''}
          `;

        const backContent = cardDirection === 'num-to-word'
          ? `
            <div class="card-text word-title">${escapeHtml(item.word)}</div>
            ${item.desc ? `<div class="card-desc-full">${escapeHtml(item.desc)}</div>` : ''}
          `
          : `
            <div class="card-text num-huge">${item.number}</div>
          `;

        app.innerHTML = `
          <div class="numbers-session supermiya-layout page-enter">
            <!-- Top bar: Stopwatch on left, "Hoziroq tugatish" on right -->
            <div class="supermiya-topbar">
              <div class="supermiya-timer" id="card-stopwatch">00:00:000</div>
              <button class="supermiya-finish-btn" id="btn-finish-session">Hoziroq tugatish</button>
            </div>

            <!-- Flashcard container -->
            <div class="supermiya-card-area">
              <div class="card-wrapper supermiya-card-wrapper" id="num-card">
                <div class="card-inner">
                  <div class="card-front">${frontContent}</div>
                  <div class="card-back">${backContent}</div>
                </div>
              </div>
            </div>

            <!-- Bottom area: Counter + Navigation arrows -->
            <div class="supermiya-bottom-area">
              <div class="supermiya-counter">${currentIndex + 1}/${cards.length}</div>
              
              <div class="supermiya-nav-row">
                <!-- Left arrow: Oldingisi -->
                <button class="supermiya-nav-btn ${currentIndex === 0 ? 'disabled' : ''}" id="btn-card-prev" ${currentIndex === 0 ? 'disabled' : ''} aria-label="Oldingisi" title="Oldingisi">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                </button>

                <!-- Middle double arrow: Boshiga qaytish -->
                <button class="supermiya-nav-btn ${currentIndex === 0 ? 'disabled' : ''}" id="btn-card-first" ${currentIndex === 0 ? 'disabled' : ''} aria-label="Boshiga qaytish" title="Boshiga qaytish">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="11 17 6 12 11 7"></polyline>
                    <polyline points="18 17 13 12 18 7"></polyline>
                  </svg>
                </button>

                <!-- Right arrow: Keyingisi -->
                <button class="supermiya-nav-btn ${currentIndex === cards.length - 1 ? 'disabled' : ''}" id="btn-card-next" aria-label="Keyingisi" title="Keyingisi">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </div>

              ${playMode === 'auto' ? `
                <div class="auto-play-controls" style="margin-top: 10px; width: 100%; max-width: 280px;">
                  <button class="btn-pause-play" id="btn-toggle-pause">
                    ${isPaused ? '▶️ Davom etish' : '⏸️ Pauza'}
                  </button>
                  <span class="auto-speed-indicator">Tezlik: ${autoSpeedSec}s</span>
                </div>
              ` : ''}
            </div>
          </div>
        `;

        requestAnimationFrame(() => {
          fitAllCardTexts(document.getElementById('num-card'));
        });

        // Start / Reset card stopwatch for this new card!
        startCardStopwatch();

        // Flip Card (does not reset card stopwatch)
        const cardEl = document.getElementById('num-card');
        const doFlip = () => {
          isFlipped = !isFlipped;
          cardEl.classList.toggle('flipped', isFlipped);
          fitAllCardTexts(cardEl);
        };

        cardEl.addEventListener('click', doFlip);

        // Previous (resets card stopwatch from zero)
        document.getElementById('btn-card-prev').addEventListener('click', () => {
          if (currentIndex > 0) {
            if (autoPlayTimer) clearTimeout(autoPlayTimer);
            currentIndex--;
            renderCard();
          }
        });

        // Middle button: Go to first card
        const firstBtn = document.getElementById('btn-card-first');
        if (firstBtn) {
          firstBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
              if (autoPlayTimer) clearTimeout(autoPlayTimer);
              currentIndex = 0;
              renderCard();
            }
          });
        }

        // Next (resets card stopwatch from zero)
        document.getElementById('btn-card-next').addEventListener('click', () => {
          goNext();
        });

        // Finish session ("Hoziroq tugatish")
        document.getElementById('btn-finish-session').addEventListener('click', () => {
          stopTimers();
          if (window._numKeyHandler) {
            document.removeEventListener('keydown', window._numKeyHandler);
            window._numKeyHandler = null;
          }
          showResults(currentIndex + 1, performance.now() - totalSessionStartTime);
        });

        // Auto mode toggle pause
        const pauseBtn = document.getElementById('btn-toggle-pause');
        if (pauseBtn) {
          pauseBtn.addEventListener('click', () => {
            isPaused = !isPaused;
            pauseBtn.textContent = isPaused ? '▶️ Davom etish' : '⏸️ Pauza';
            if (isPaused) {
              pauseStartTime = performance.now();
              if (autoPlayTimer) clearTimeout(autoPlayTimer);
            } else {
              pausedDurationOnCard += (performance.now() - pauseStartTime);
              if (playMode === 'auto') {
                scheduleAutoNext();
              }
            }
          });
        }

        // Auto advance timer
        if (playMode === 'auto' && !isPaused) {
          scheduleAutoNext();
        }

        function scheduleAutoNext() {
          if (autoPlayTimer) clearTimeout(autoPlayTimer);
          autoPlayTimer = setTimeout(() => {
            if (!isPaused) {
              goNext();
            }
          }, autoSpeedSec * 1000);
        }

        function goNext() {
          if (autoPlayTimer) clearTimeout(autoPlayTimer);
          if (currentIndex < cards.length - 1) {
            currentIndex++;
            renderCard();
          } else {
            stopTimers();
            showResults(cards.length, performance.now() - totalSessionStartTime);
          }
        }

        // Swipe support
        let touchStartX = 0;
        let touchEndX = 0;
        cardEl.addEventListener('touchstart', (e) => {
          touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        cardEl.addEventListener('touchend', (e) => {
          touchEndX = e.changedTouches[0].screenX;
          const diff = touchStartX - touchEndX;
          if (Math.abs(diff) > 50) {
            if (diff > 0) goNext();
            else if (currentIndex > 0) {
              currentIndex--;
              renderCard();
            }
          }
        }, { passive: true });

        // Keyboard handler
        const keyHandler = (e) => {
          if (e.key === 'ArrowRight') {
            goNext();
          } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
            currentIndex--;
            renderCard();
          } else if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            doFlip();
          }
        };

        if (window._numKeyHandler) {
          document.removeEventListener('keydown', window._numKeyHandler);
        }
        document.addEventListener('keydown', keyHandler);
        window._numKeyHandler = keyHandler;
      }

      function showResults(totalCount, totalMs) {
        if (window._numKeyHandler) {
          document.removeEventListener('keydown', window._numKeyHandler);
        }

        const totalSec = totalMs / 1000;
        const perCard = (totalSec / totalCount).toFixed(2);

        app.innerHTML = `
          <div class="results-page page-enter">
            <div class="results-card">
              <div class="results-icon">🏆</div>
              <div class="results-title">Mashg'ulot yakunlandi!</div>
              <div class="results-subtitle">Millennium 000–999 Flesh-karta natijasi</div>

              <div class="results-stats">
                <div class="results-stat">
                  <div class="results-stat-value">${formatStopwatch(totalMs)}</div>
                  <div class="results-stat-label">Jami vaqt</div>
                </div>
                <div class="results-stat">
                  <div class="results-stat-value">${perCard}s</div>
                  <div class="results-stat-label">Har bir raqam</div>
                </div>
                <div class="results-stat">
                  <div class="results-stat-value">${totalCount} ta</div>
                  <div class="results-stat-label">Bajarildi</div>
                </div>
              </div>

              <button class="btn-restart" id="btn-repeat">🔄 Qayta takrorlash</button>
              <button class="btn-home" id="btn-back-setup">⚙️ Sozlamalarga qaytish</button>
            </div>
          </div>
        `;

        document.getElementById('btn-repeat').addEventListener('click', () => {
          startFlashcardSession(cards, startBound, endBound);
        });
        document.getElementById('btn-back-setup').addEventListener('click', () => {
          renderMain();
        });
      }

      renderCard();
    }

    // ══════════════════════════════════════════════
    // TAB 2: OBRAZLAR BAZASI (000–999 KATALOGI)
    // ══════════════════════════════════════════════
    function renderDatabaseView(container) {
      const allCards = getAllMillenniumCards();

      container.innerHTML = `
        <div class="num-database-container">
          <!-- Search & Filter bar -->
          <div class="db-search-bar">
            <input type="text" id="db-search-input" placeholder="🔍 Raqam yoki obrazni qidiring (masalan: 135, telefon, kit)..." value="${escapeHtml(searchQuery)}">
          </div>

          <!-- Quick Block selector -->
          <div class="db-filter-chips">
            ${BLOCKS.map(b => `
              <button class="db-chip ${dbFilterBlock === b.id ? 'active' : ''}" data-db-block="${b.id}">
                ${b.label}
              </button>
            `).join('')}
          </div>

          <!-- Results counter -->
          <div class="db-results-count" id="db-count-label">
            Jami: ${allCards.length} ta obraz
          </div>

          <!-- Items List -->
          <div class="db-items-list" id="db-list"></div>
        </div>

        <!-- Edit Modal -->
        <div class="modal-overlay hidden" id="db-edit-modal">
          <div class="modal-card">
            <div class="modal-header">
              <h3 id="edit-modal-title">Obrazni tahrirlash</h3>
              <button class="modal-close" id="btn-close-edit">✕</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Raqam va CVC formulasi</label>
                <div id="edit-modal-formula" style="font-weight:600;color:var(--primary);margin-bottom:8px;"></div>
              </div>
              <div class="form-group">
                <label class="form-label" for="edit-input-word">Tanlangan Obraz (nomi)</label>
                <input type="text" class="form-input" id="edit-input-word" placeholder="Masalan: Telefon">
              </div>
              <div class="form-group">
                <label class="form-label" for="edit-input-desc">Vizual Tasavvur Mezoni (tavsif)</label>
                <textarea class="form-input form-textarea" id="edit-input-desc" rows="3" placeholder="Obrazning aniq moddiy ko'rinishi..."></textarea>
              </div>

              <div style="display:flex;gap:10px;margin-top:14px;">
                <button class="btn-save-edit primary" id="btn-save-edit" style="flex:1;">💾 Saqlash</button>
                <button class="btn-save-edit" id="btn-reset-default" style="background:#f1f2f6;color:#57606f;">Asliga qaytarish</button>
              </div>
            </div>
          </div>
        </div>
      `;

      const listEl = document.getElementById('db-list');
      const searchInput = document.getElementById('db-search-input');
      const countEl = document.getElementById('db-count-label');

      function filterAndRenderList() {
        const query = searchQuery.trim().toLowerCase();
        let filtered = allCards;

        // Block filter
        if (dbFilterBlock !== 'all') {
          const blk = BLOCKS.find(b => b.id === dbFilterBlock);
          if (blk) {
            filtered = filtered.filter(c => {
              const num = parseInt(c.number);
              return num >= blk.range[0] && num <= blk.range[1];
            });
          }
        }

        // Search query filter
        if (query) {
          filtered = filtered.filter(c => {
            return c.number.includes(query) ||
              (c.word || '').toLowerCase().includes(query) ||
              (c.desc || '').toLowerCase().includes(query) ||
              (c.formula || '').toLowerCase().includes(query);
          });
        }

        countEl.textContent = `Topildi: ${filtered.length} ta obraz`;

        if (filtered.length === 0) {
          listEl.innerHTML = `
            <div class="empty-state" style="padding: 30px 10px;">
              <div class="empty-state-icon">🔍</div>
              <div class="empty-state-text">Ushbu so'rov bo'yicha obraz topilmadi</div>
            </div>
          `;
          return;
        }

        listEl.innerHTML = filtered.map(item => `
          <div class="db-item-card ${item.isCustom ? 'customized' : ''}" data-num="${item.number}">
            <div class="db-item-left">
              <div class="db-item-num">${item.number}</div>
              <div class="db-item-formula">${item.formula || ''}</div>
            </div>
            <div class="db-item-center">
              <div class="db-item-word">
                ${escapeHtml(item.word)}
                ${item.isCustom ? '<span class="custom-tag">Shaxsiy</span>' : ''}
              </div>
              <div class="db-item-desc">${escapeHtml(item.desc || '')}</div>
            </div>
            <div class="db-item-right">
              <button class="btn-edit-item" data-edit-num="${item.number}" title="Tahrirlash">✏️</button>
            </div>
          </div>
        `).join('');

        // Wire edit clicks
        listEl.querySelectorAll('.btn-edit-item').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditModal(btn.dataset.editNum);
          });
        });
      }

      // Search event
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        filterAndRenderList();
      });

      // Filter chips event
      container.querySelectorAll('.db-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('.db-chip').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          dbFilterBlock = btn.dataset.dbBlock;
          filterAndRenderList();
        });
      });

      // Edit Modal Handling
      const modal = document.getElementById('db-edit-modal');
      const closeEditBtn = document.getElementById('btn-close-edit');
      const saveEditBtn = document.getElementById('btn-save-edit');
      const resetEditBtn = document.getElementById('btn-reset-default');
      let activeEditingNum = null;

      function openEditModal(numStr) {
        activeEditingNum = numStr;
        const card = getMillenniumCard(numStr);
        if (!card) return;

        document.getElementById('edit-modal-title').textContent = `${card.number} obrazini tahrirlash`;
        document.getElementById('edit-modal-formula').textContent = card.formula || '';
        document.getElementById('edit-input-word').value = card.word || '';
        document.getElementById('edit-input-desc').value = card.desc || '';
        modal.classList.remove('hidden');
      }

      closeEditBtn.addEventListener('click', () => modal.classList.add('hidden'));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
      });

      saveEditBtn.addEventListener('click', () => {
        if (!activeEditingNum) return;
        const newWord = document.getElementById('edit-input-word').value;
        const newDesc = document.getElementById('edit-input-desc').value;
        if (!newWord.trim()) {
          showToast('❌ Obraz nomi bo\'sh bo\'lishi mumkin emas');
          return;
        }
        updateMillenniumCard(activeEditingNum, newWord, newDesc);
        showToast(`✅ ${activeEditingNum} obrazi saqlandi`);
        modal.classList.add('hidden');
        renderDatabaseView(container);
      });

      resetEditBtn.addEventListener('click', () => {
        if (!activeEditingNum) return;
        resetMillenniumCard(activeEditingNum);
        showToast(`🔄 ${activeEditingNum} asl holatiga qaytarildi`);
        modal.classList.add('hidden');
        renderDatabaseView(container);
      });

      filterAndRenderList();
    }

    // ══════════════════════════════════════════════
    // TAB 3: CVC QOIDALARI VA QO'LLANMA
    // ══════════════════════════════════════════════
    function renderGuideView(container) {
      container.innerHTML = `
        <div class="num-guide-container">
          <div class="guide-card">
            <h3>⚡ Millennium Tizimi va CVC Formulasi</h3>
            <p>Millennium tizimi — jahon xotira chempionatlari va professional mnemonistlar foydalanadigan <strong>3 xonali sonlar (000–999)</strong> bazasidir. Har bir 3 xonali son qat'iy fonetik qoida asosida bitta so'zga aylanadi:</p>
            
            <div class="formula-box">
              <span class="f-part">C1 (Undosh)</span> + <span class="f-part vowel">V (Unli)</span> + <span class="f-part">C2 (Undosh)</span>
            </div>
          </div>

          <div class="guide-card">
            <h3>1️⃣ Undoshlar Jadvali (1 va 3-raqamlar)</h3>
            <table class="guide-table">
              <thead>
                <tr>
                  <th>Raqam</th>
                  <th>Asosiy</th>
                  <th>Qo'shimcha</th>
                  <th>Eslab qolish mantiqi</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><strong>0</strong></td><td><strong>Z</strong></td><td>S</td><td>Zero (nol) · S jarangli jufti</td></tr>
                <tr><td><strong>1</strong></td><td><strong>T</strong></td><td>D</td><td>Tik tayoqcha T · D jarangli jufti</td></tr>
                <tr><td><strong>2</strong></td><td><strong>N</strong></td><td>H</td><td>N ning 2 ta ustuni bor</td></tr>
                <tr><td><strong>3</strong></td><td><strong>M</strong></td><td>J</td><td>M ning 3 ta ustuni bor</td></tr>
                <tr><td><strong>4</strong></td><td><strong>R</strong></td><td>Ch</td><td>To'rt so'zida R bor · Chet-to'rt</td></tr>
                <tr><td><strong>5</strong></td><td><strong>L</strong></td><td>Sh</td><td>Rimcha L=50 · Besh so'zida Sh</td></tr>
                <tr><td><strong>6</strong></td><td><strong>B</strong></td><td>P</td><td>B ning doirasi 6 ga o'xshaydi</td></tr>
                <tr><td><strong>7</strong></td><td><strong>K</strong></td><td>Q</td><td>Ikkita 7 ni birlashtirsa K</td></tr>
                <tr><td><strong>8</strong></td><td><strong>F</strong></td><td>V</td><td>Yozma F 8 ga o'xshaydi</td></tr>
                <tr><td><strong>9</strong></td><td><strong>G</strong></td><td>Y</td><td>Kichik g 9 ga o'xshaydi</td></tr>
              </tbody>
            </table>
          </div>

          <div class="guide-card">
            <h3>2️⃣ Unlilar Jadvali (2-o'rindagi o'rta raqam)</h3>
            <table class="guide-table">
              <thead>
                <tr>
                  <th>Raqamlar juftligi</th>
                  <th>Unli</th>
                  <th>Mantiqiy qoida</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><strong>0</strong> va <strong>5</strong></td><td><strong style="color:#d69358;">a</strong></td><td>Eng ochiq va keng erkin unli A</td></tr>
                <tr><td><strong>1</strong> va <strong>6</strong></td><td><strong style="color:#d69358;">i</strong></td><td>Ingichka tik tayoqcha I</td></tr>
                <tr><td><strong>2</strong> va <strong>7</strong></td><td><strong style="color:#d69358;">u</strong></td><td>Cho'ziq va chuqur unli U</td></tr>
                <tr><td><strong>3</strong> va <strong>8</strong></td><td><strong style="color:#d69358;">e</strong></td><td>Teskari 3 shaklidagi E</td></tr>
                <tr><td><strong>4</strong> va <strong>9</strong></td><td><strong style="color:#d69358;">o</strong></td><td>Dumaloq to'liq unli O</td></tr>
              </tbody>
            </table>
          </div>

          <div class="guide-card">
            <h3>💡 Amaliy Misollar</h3>
            <ul class="examples-list">
              <li><strong>135</strong> ➔ 1(T) + 3(e) + 5(l) ➔ <strong>Telefon</strong></li>
              <li><strong>185</strong> ➔ 1(D) + 8(e) + 5(l) ➔ <strong>Delfin</strong></li>
              <li><strong>241</strong> ➔ 2(N) + 4(o) + 1(t) ➔ <strong>Nota</strong></li>
              <li><strong>401</strong> ➔ 4(R) + 0(a) + 1(t) ➔ <strong>Raketa</strong></li>
              <li><strong>441</strong> ➔ 4(R) + 4(o) + 1(t) ➔ <strong>Robot</strong></li>
              <li><strong>611</strong> ➔ 6(B) + 1(i) + 1(t) ➔ <strong>Bit (Hasharot)</strong></li>
              <li><strong>741</strong> ➔ 7(Q) + 4(o) + 1(t) ➔ <strong>Qozon</strong></li>
            </ul>
          </div>
        </div>
      `;
    }

    init();
  };
}

// Helpers
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function formatStopwatch(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hundredths = Math.floor((ms % 1000) / 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
}

function formatStopwatchMilli(ms) {
  const totalMs = Math.max(0, Math.floor(ms));
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const millis = totalMs % 1000;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(millis).padStart(3, '0')}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}
