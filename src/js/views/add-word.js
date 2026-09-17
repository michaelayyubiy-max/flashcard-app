import { addWord, updateWord, deleteWord, getAllWords, searchWords } from '../db.js';
import { syncWithServer } from '../sync.js';
import { showToast } from '../app.js';

export function renderAddWord(app, router) {
  let editingId = null;
  let allWords = [];

  return async () => {
    allWords = await getAllWords();
    editingId = null;

    renderPage();

    async function renderPage() {
      app.innerHTML = `
        <div class="page-enter">
          <div class="header">
            <button class="header-back" id="btn-back">←</button>
            <span class="header-title">So'z qo'shish</span>
            <div class="header-spacer"></div>
          </div>

          <div class="add-page">
            <div class="form-group">
              <label class="form-label">So'z (inglizcha)</label>
              <input type="text" class="form-input" id="input-word" placeholder="apple" autocomplete="off">
            </div>
            <div class="form-group">
              <label class="form-label">Tarjimasi (o'zbekcha)</label>
              <input type="text" class="form-input" id="input-translation" placeholder="olma" autocomplete="off">
            </div>
            <button class="btn-save" id="btn-save">💾 Saqlash</button>

            <div class="word-list">
              <div class="search-bar" style="padding: 0; margin-bottom: 16px; margin-top: 24px;">
                <div class="search-wrapper">
                  <span class="search-icon">🔍</span>
                  <input type="text" class="search-input" id="search-input" placeholder="Qidirish..." autocomplete="off">
                </div>
              </div>
              <div class="word-list-title">
                So'zlar ro'yxati
                <span id="list-count">${allWords.length} ta</span>
              </div>
              <div id="word-list-items">
                ${renderWordList(allWords)}
              </div>
            </div>
          </div>
        </div>
      `;

      // Back
      document.getElementById('btn-back').addEventListener('click', () => {
        router.navigate('/');
      });

      // Save
      document.getElementById('btn-save').addEventListener('click', handleSave);

      // Enter key to save
      document.getElementById('input-translation').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSave();
      });

      document.getElementById('input-word').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('input-translation').focus();
      });

      // Search
      document.getElementById('search-input').addEventListener('input', async (e) => {
        const results = await searchWords(e.target.value);
        document.getElementById('word-list-items').innerHTML = renderWordList(results);
        document.getElementById('list-count').textContent = results.length + ' ta';
        attachWordListeners();
      });

      attachWordListeners();
    }

    async function handleSave() {
      const wordInput = document.getElementById('input-word');
      const transInput = document.getElementById('input-translation');
      const word = wordInput.value.trim();
      const translation = transInput.value.trim();

      if (!word || !translation) {
        showToast('Iltimos, ikkalasini ham to\'ldiring');
        return;
      }

      try {
        if (editingId) {
          await updateWord(editingId, word, translation);
          showToast('✅ So\'z yangilandi');
          editingId = null;
        } else {
          await addWord(word, translation);
          showToast('✅ So\'z qo\'shildi');
        }

        wordInput.value = '';
        transInput.value = '';
        wordInput.focus();

        // Refresh list
        allWords = await getAllWords();
        document.getElementById('word-list-items').innerHTML = renderWordList(allWords);
        document.getElementById('list-count').textContent = allWords.length + ' ta';
        document.getElementById('search-input').value = '';
        attachWordListeners();

        // Update save button text
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
        await deleteWord(id);
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
        showToast('🗑 So\'z o\'chirildi');

        allWords = await getAllWords();
        document.getElementById('word-list-items').innerHTML = renderWordList(allWords);
        document.getElementById('list-count').textContent = allWords.length + ' ta';
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
        <div class="empty-state-text">Hali so'z qo'shilmagan</div>
      </div>
    `;
  }

  return words.map((w, i) => `
    <div class="word-item">
      <div class="word-item-number">${i + 1}</div>
      <div class="word-item-content">
        <div class="word-item-word">${escapeHtml(w.word)}</div>
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
  div.textContent = text;
  return div.innerHTML;
}
