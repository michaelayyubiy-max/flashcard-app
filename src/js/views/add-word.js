import { 
  addWord, 
  updateWord, 
  deleteWord, 
  getAllWords, 
  searchWords, 
  cleanupSampleWords, 
  clearAllWords,
  getAllCategories,
  addCategory,
  deleteCategory 
} from '../db.js';
import { 
  syncWithServer, 
  deleteWordFromServer, 
  deleteCategoryFromServer,
  deleteAllWordsEverywhere 
} from '../sync.js';
import { showToast } from '../app.js';

export function renderAddWord(app, router) {
  let editingId = null;
  let allWords = [];
  let allCategories = ['Umumiy'];
  let selectedCategoryFilter = 'all';
  let currentFormCategory = 'Umumiy';

  return async () => {
    // Auto-clean any legacy sample words
    await cleanupSampleWords();
    allWords = await getAllWords();
    allCategories = await getAllCategories();
    editingId = null;

    renderPage();

    async function refreshData() {
      allWords = await getAllWords();
      allCategories = await getAllCategories();
    }

    async function renderPage() {
      const filteredWords = getFilteredWords();

      app.innerHTML = `
        <div class="page-enter">
          <div class="header">
            <button class="header-back" id="btn-back">←</button>
            <span class="header-title">So'z qo'shish</span>
            <div class="header-spacer"></div>
          </div>

          <div class="add-page">
            <!-- Word Input Form -->
            <div class="form-group">
              <label class="form-label">So'z (inglizcha)</label>
              <input type="text" class="form-input" id="input-word" placeholder="apple" autocomplete="off">
            </div>
            <div class="form-group">
              <label class="form-label">Tarjimasi (o'zbekcha)</label>
              <input type="text" class="form-input" id="input-translation" placeholder="olma" autocomplete="off">
            </div>

            <!-- Category Selector & Add Category Button -->
            <div class="form-group">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <label class="form-label" style="margin-bottom:0;">Bo'lim (Kategoriya)</label>
                <button type="button" id="btn-create-cat" style="font-size:12px;color:var(--primary);background:none;border:none;cursor:pointer;font-weight:600;display:flex;align-items:center;gap:4px;">
                  <span>➕</span> Yangi bo'lim
                </button>
              </div>
              <select class="form-input" id="select-category" style="cursor:pointer;">
                ${renderCategoryOptions(allCategories, currentFormCategory)}
              </select>
            </div>

            <button class="btn-save" id="btn-save">💾 Saqlash</button>

            <!-- Word List Section -->
            <div class="word-list">
              <!-- Search Bar -->
              <div class="search-bar" style="padding: 0; margin-bottom: 12px; margin-top: 24px;">
                <div class="search-wrapper">
                  <span class="search-icon">🔍</span>
                  <input type="text" class="search-input" id="search-input" placeholder="Qidirish..." autocomplete="off">
                </div>
              </div>

              <!-- Category Filter Chips -->
              <div class="category-filter-container" style="margin-bottom: 16px;">
                <div class="category-chips-scroll" style="display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;scrollbar-width:none;-webkit-overflow-scrolling:touch;">
                  <button class="cat-chip ${selectedCategoryFilter === 'all' ? 'active' : ''}" data-cat="all" style="flex-shrink:0;padding:6px 12px;border-radius:20px;font-size:13px;border:1px solid var(--border);background:${selectedCategoryFilter === 'all' ? 'var(--primary)' : 'var(--bg-card)'};color:${selectedCategoryFilter === 'all' ? '#fff' : 'var(--text)'};cursor:pointer;font-weight:500;">
                    📁 Barchasi (${allWords.length})
                  </button>
                  ${allCategories.map(cat => {
                    const count = allWords.filter(w => (w.category || 'Umumiy').trim().toLowerCase() === cat.trim().toLowerCase()).length;
                    const isActive = selectedCategoryFilter.toLowerCase() === cat.toLowerCase();
                    const isDefault = cat.toLowerCase() === 'umumiy';
                    return `
                      <div class="cat-chip-wrap" style="flex-shrink:0;display:inline-flex;align-items:center;background:${isActive ? 'var(--primary)' : 'var(--bg-card)'};border:1px solid ${isActive ? 'var(--primary)' : 'var(--border)'};border-radius:20px;padding:2px 8px 2px 12px;">
                        <button class="cat-chip-btn" data-cat="${escapeHtml(cat)}" style="background:none;border:none;color:${isActive ? '#fff' : 'var(--text)'};font-size:13px;cursor:pointer;padding:4px 0;font-weight:500;">
                          ${escapeHtml(cat)} (${count})
                        </button>
                        ${!isDefault ? `
                          <button class="cat-chip-del-btn" data-cat="${escapeHtml(cat)}" title="Bo'limni o'chirish" style="background:none;border:none;color:${isActive ? '#fff' : '#e74c3c'};cursor:pointer;font-size:14px;margin-left:6px;padding:2px 4px;line-height:1;border-radius:50%;">
                            ✕
                          </button>
                        ` : ''}
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- List Header -->
              <div class="word-list-title" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <span>So'zlar ro'yxati <span id="list-count" style="font-size:14px;color:var(--text-secondary);font-weight:normal;">(${filteredWords.length} ta)</span></span>
                ${allWords.length > 0 ? `<button id="btn-clear-all" style="font-size:12px;color:#e74c3c;background:none;border:none;cursor:pointer;padding:4px 8px;border-radius:6px;background:rgba(231,76,60,0.08);">🗑 Hammasini tozalash</button>` : ''}
              </div>

              <!-- Items -->
              <div id="word-list-items">
                ${renderWordList(filteredWords)}
              </div>
            </div>
          </div>
        </div>
      `;

      // Back navigation
      document.getElementById('btn-back').addEventListener('click', () => {
        router.navigate('/');
      });

      // Save word
      document.getElementById('btn-save').addEventListener('click', handleSave);

      // Enter keys
      document.getElementById('input-translation').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSave();
      });
      document.getElementById('input-word').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('input-translation').focus();
      });

      // Category select change
      document.getElementById('select-category').addEventListener('change', (e) => {
        currentFormCategory = e.target.value;
      });

      // Create category button
      document.getElementById('btn-create-cat').addEventListener('click', () => {
        showCreateCategoryModal();
      });

      // Search input
      document.getElementById('search-input').addEventListener('input', async (e) => {
        const query = e.target.value;
        const results = await searchWords(query);
        const filtered = filterBySelectedCategory(results);
        document.getElementById('word-list-items').innerHTML = renderWordList(filtered);
        document.getElementById('list-count').textContent = filtered.length + ' ta';
        attachWordListeners();
      });

      // Filter chips click
      document.querySelectorAll('.cat-chip, .cat-chip-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          selectedCategoryFilter = btn.dataset.cat;
          renderPage();
        });
      });

      // Delete category click
      document.querySelectorAll('.cat-chip-del-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const catName = btn.dataset.cat;
          showDeleteCategoryModal(catName);
        });
      });

      // Clear all words
      const clearAllBtn = document.getElementById('btn-clear-all');
      if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
          showClearAllModal();
        });
      }

      attachWordListeners();
    }

    function getFilteredWords() {
      if (selectedCategoryFilter === 'all') {
        return allWords;
      }
      return allWords.filter(w => (w.category || 'Umumiy').trim().toLowerCase() === selectedCategoryFilter.trim().toLowerCase());
    }

    function filterBySelectedCategory(list) {
      if (selectedCategoryFilter === 'all') return list;
      return list.filter(w => (w.category || 'Umumiy').trim().toLowerCase() === selectedCategoryFilter.trim().toLowerCase());
    }

    function renderCategoryOptions(categories, selected) {
      return categories.map(cat => `
        <option value="${escapeHtml(cat)}" ${cat.toLowerCase() === selected.toLowerCase() ? 'selected' : ''}>
          📁 ${escapeHtml(cat)}
        </option>
      `).join('');
    }

    // Modal: Create New Category
    function showCreateCategoryModal() {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal">
          <div class="modal-title">📁 Yangi bo'lim yaratish</div>
          <div style="margin: 16px 0;">
            <input type="text" class="form-input" id="input-new-cat" placeholder="Masalan: 1-dars yoki Sayohat" style="width:100%;">
          </div>
          <div class="modal-buttons">
            <button class="modal-btn cancel" id="modal-cat-cancel">Bekor</button>
            <button class="modal-btn confirm" id="modal-cat-save">Qo'shish</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('active'));

      const input = overlay.querySelector('#input-new-cat');
      setTimeout(() => input.focus(), 150);

      async function saveNewCategory() {
        const name = input.value.trim();
        if (!name) {
          showToast('Bo\'lim nomini kiriting');
          return;
        }

        await addCategory(name);
        currentFormCategory = name;
        await refreshData();

        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
        showToast(`✅ "${name}" bo'limi yaratildi`);
        renderPage();

        // Background sync to server
        syncWithServer();
      }

      overlay.querySelector('#modal-cat-save').addEventListener('click', saveNewCategory);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveNewCategory();
      });

      overlay.querySelector('#modal-cat-cancel').addEventListener('click', () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
      });

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
          setTimeout(() => overlay.remove(), 300);
        }
      });
    }

    // Modal: Delete Category (2 Modes!)
    function showDeleteCategoryModal(catName) {
      const wordsInCat = allWords.filter(w => (w.category || 'Umumiy').trim().toLowerCase() === catName.trim().toLowerCase());
      const count = wordsInCat.length;

      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal" style="max-width: 400px; text-align: left;">
          <div class="modal-title" style="text-align: center; margin-bottom: 8px;">📁 "${escapeHtml(catName)}" bo'limini o'chirish</div>
          <div class="modal-text" style="text-align: center; margin-bottom: 20px; font-size: 14px; color: var(--text-secondary);">
            Ushbu bo'limda <b>${count} ta</b> so'z mavjud.<br>O'chirish usulini tanlang:
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <!-- Mode 1: Delete with words -->
            <button id="btn-del-cat-with-words" style="padding: 12px 16px; border-radius: 10px; background: #e74c3c; color: #fff; border: none; font-size: 14px; font-weight: 600; cursor: pointer; text-align: center;">
              💥 So'zlari bilan birga o'chirish (${count} ta so'z)
            </button>
            
            <!-- Mode 2: Delete category only -->
            <button id="btn-del-cat-only" style="padding: 12px 16px; border-radius: 10px; background: var(--bg); color: var(--text); border: 1px solid var(--border); font-size: 14px; font-weight: 500; cursor: pointer; text-align: center;">
              📁 Faqat bo'limni o'chirish (so'zlar saqlanadi)
            </button>
            
            <!-- Cancel -->
            <button id="btn-del-cat-cancel" style="padding: 10px; border-radius: 10px; background: transparent; color: var(--text-secondary); border: none; font-size: 13px; cursor: pointer; text-align: center; margin-top: 4px;">
              Bekor qilish
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('active'));

      function closeModal() {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
      }

      // Mode 1: Delete with words
      overlay.querySelector('#btn-del-cat-with-words').addEventListener('click', async () => {
        const res = await deleteCategory(catName, true);
        await deleteCategoryFromServer(catName, true);
        closeModal();
        showToast(`🗑 "${catName}" va barcha so'zlari o'chirildi`);
        
        if (selectedCategoryFilter.toLowerCase() === catName.toLowerCase()) {
          selectedCategoryFilter = 'all';
        }
        if (currentFormCategory.toLowerCase() === catName.toLowerCase()) {
          currentFormCategory = 'Umumiy';
        }
        await refreshData();
        renderPage();
      });

      // Mode 2: Delete category only, preserve words
      overlay.querySelector('#btn-del-cat-only').addEventListener('click', async () => {
        const res = await deleteCategory(catName, false);
        await deleteCategoryFromServer(catName, false);
        closeModal();
        showToast(`📁 "${catName}" bo'limi o'chirildi, so'zlar "Umumiy" ga o'tkazildi`);
        
        if (selectedCategoryFilter.toLowerCase() === catName.toLowerCase()) {
          selectedCategoryFilter = 'all';
        }
        if (currentFormCategory.toLowerCase() === catName.toLowerCase()) {
          currentFormCategory = 'Umumiy';
        }
        await refreshData();
        renderPage();
      });

      overlay.querySelector('#btn-del-cat-cancel').addEventListener('click', closeModal);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
      });
    }

    // Modal: Clear all words
    function showClearAllModal() {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal">
          <div class="modal-title">Barchasini tozalash</div>
          <div class="modal-text">Haqiqatan ham barcha (${allWords.length} ta) so'zlarni butunlay o'chirmoqchimisiz?</div>
          <div class="modal-buttons">
            <button class="modal-btn cancel" id="modal-clear-cancel">Bekor</button>
            <button class="modal-btn confirm" id="modal-clear-confirm" style="background:#e74c3c;color:white;">Hammasini o'chirish</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('active'));

      document.getElementById('modal-clear-cancel').addEventListener('click', () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
      });

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
          setTimeout(() => overlay.remove(), 300);
        }
      });

      document.getElementById('modal-clear-confirm').addEventListener('click', async () => {
        await clearAllWords();
        await deleteAllWordsEverywhere();
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
        showToast('🗑 Barcha so\'zlar tozalandi');

        allWords = [];
        document.getElementById('word-list-items').innerHTML = renderWordList([]);
        document.getElementById('list-count').textContent = '0 ta';
        const clrBtn = document.getElementById('btn-clear-all');
        if (clrBtn) clrBtn.remove();
      });
    }

    // Handle Save Word
    async function handleSave() {
      const wordInput = document.getElementById('input-word');
      const transInput = document.getElementById('input-translation');
      const catSelect = document.getElementById('select-category');

      const word = wordInput.value.trim();
      const translation = transInput.value.trim();
      const category = (catSelect ? catSelect.value : currentFormCategory) || 'Umumiy';

      if (!word || !translation) {
        showToast('Iltimos, so\'z va tarjimani to\'ldiring');
        return;
      }

      try {
        if (editingId) {
          await updateWord(editingId, word, translation, category);
          showToast('✅ So\'z yangilandi');
          editingId = null;
        } else {
          await addWord(word, translation, category);
          showToast('✅ So\'z qo\'shildi');
        }

        wordInput.value = '';
        transInput.value = '';
        wordInput.focus();

        await refreshData();
        const filtered = getFilteredWords();
        document.getElementById('word-list-items').innerHTML = renderWordList(filtered);
        document.getElementById('list-count').textContent = filtered.length + ' ta';
        document.getElementById('search-input').value = '';
        attachWordListeners();

        document.getElementById('btn-save').textContent = '💾 Saqlash';

        // Background sync to server
        syncWithServer();
      } catch (err) {
        showToast('❌ Xatolik: ' + err.message);
      }
    }

    function attachWordListeners() {
      // Edit buttons
      document.querySelectorAll('.word-item-btn.edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = parseInt(btn.dataset.id);
          const word = allWords.find(w => w.id === id);
          if (word) {
            editingId = id;
            document.getElementById('input-word').value = word.word;
            document.getElementById('input-translation').value = word.translation;
            if (document.getElementById('select-category')) {
              document.getElementById('select-category').value = word.category || 'Umumiy';
            }
            document.getElementById('input-word').focus();
            document.getElementById('btn-save').textContent = '✏️ Yangilash';
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
      });

      // Delete buttons
      document.querySelectorAll('.word-item-btn.delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const id = parseInt(btn.dataset.id);
          showDeleteModal(id);
        });
      });
    }

    function showDeleteModal(id) {
      const word = allWords.find(w => w.id === id);
      if (!word) return;

      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal">
          <div class="modal-title">O'chirish</div>
          <div class="modal-text">"${word.word}" so'zini o'chirmoqchimisiz?</div>
          <div class="modal-buttons">
            <button class="modal-btn cancel" id="modal-cancel">Bekor</button>
            <button class="modal-btn confirm" id="modal-confirm">O'chirish</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('active'));

      document.getElementById('modal-cancel').addEventListener('click', () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
      });

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
          setTimeout(() => overlay.remove(), 300);
        }
      });

      document.getElementById('modal-confirm').addEventListener('click', async () => {
        const wordText = word.word;

        // 1. Delete locally from IndexedDB
        await deleteWord(id);

        // 2. Immediately delete on server
        deleteWordFromServer(wordText, id);

        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
        showToast('🗑 So\'z o\'chirildi');

        await refreshData();
        const filtered = getFilteredWords();
        document.getElementById('word-list-items').innerHTML = renderWordList(filtered);
        document.getElementById('list-count').textContent = filtered.length + ' ta';
        attachWordListeners();

        if (editingId === id) {
          editingId = null;
          document.getElementById('input-word').value = '';
          document.getElementById('input-translation').value = '';
          document.getElementById('btn-save').textContent = '💾 Saqlash';
        }
      });
    }
  };
}

function renderWordList(words) {
  if (words.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-text">Bu bo'limda so'zlar yo'q</div>
      </div>
    `;
  }

  return words.map((w, i) => `
    <div class="word-item">
      <div class="word-item-number">${i + 1}</div>
      <div class="word-item-content">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span class="word-item-word">${escapeHtml(w.word)}</span>
          <span style="font-size:11px;padding:2px 6px;border-radius:10px;background:rgba(214,147,88,0.12);color:var(--primary-dark);font-weight:500;">
            📁 ${escapeHtml(w.category || 'Umumiy')}
          </span>
        </div>
        <div class="word-item-translation">${escapeHtml(w.translation)}</div>
      </div>
      <div class="word-item-actions">
        <button class="word-item-btn edit" data-id="${w.id}">✏️</button>
        <button class="word-item-btn delete" data-id="${w.id}">🗑</button>
      </div>
    </div>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}
