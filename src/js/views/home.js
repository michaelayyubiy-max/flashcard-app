import { getWordCount } from '../db.js';
import { exportToJSON, importFromJSON } from '../db.js';
import { syncWithServer, getLastSyncTime } from '../sync.js';
import { showToast } from '../app.js';

export function renderHome(app, router) {
  return async () => {
    let count = await getWordCount();

    app.innerHTML = `
      <div class="home page-enter">
        <div class="home-logo">
          <h1>📚 Flash<span>Cards</span></h1>
          <p>So'zlarni yodla — istalgan joyda</p>
        </div>

        <div class="home-cards">
          <div class="home-card" id="btn-learn">
            <div class="home-card-icon learn">📝</div>
            <h3>Yodlash</h3>
            <p>Kartalarni ko'rib o'rgan</p>
          </div>
          <div class="home-card" id="btn-review">
            <div class="home-card-icon review">🔄</div>
            <h3>Takrorlash</h3>
            <p>Timer bilan mashq qil</p>
          </div>
        </div>

        <button class="home-add-btn" id="btn-add">
          <span class="icon">+</span>
          So'z qo'shish
        </button>

        <div class="home-stats">
          <div class="home-stat">
            <div class="home-stat-value" id="word-count">${count}</div>
            <div class="home-stat-label">Jami so'zlar</div>
          </div>
        </div>

        <!-- Telegram Bot Link -->
        <a href="https://t.me/flashcardsuzbot" target="_blank" rel="noopener" class="home-bot-card" id="bot-card">
          <div class="home-bot-info">
            <div class="home-bot-icon">🤖</div>
            <div class="home-bot-text">
              <h4>Telegram Bot</h4>
              <p>@flashcardsuzbot orqali so'z qo'shish</p>
            </div>
          </div>
          <span class="home-bot-badge">Ochish ↗</span>
        </a>

        <div class="home-sync">
          <button class="home-sync-btn primary" id="btn-sync">🔄 Sinxronlash</button>
          <button class="home-sync-btn" id="btn-export">📤 Export</button>
          <button class="home-sync-btn" id="btn-import">📥 Import</button>
        </div>
        <input type="file" accept=".json" class="file-input-hidden" id="file-import">
      </div>
    `;

    // Refresh word count helper
    async function refreshCount() {
      count = await getWordCount();
      const countEl = document.getElementById('word-count');
      if (countEl) countEl.textContent = count;
    }

    // Auto-sync in background on home open
    syncWithServer().then(res => {
      if (res.success && (res.added > 0 || res.updated > 0)) {
        refreshCount();
        showToast(`🔄 Sinxronlandi: ${res.added} yangi so'z`);
      }
    }).catch(() => {});

    // Navigation
    document.getElementById('btn-learn').addEventListener('click', () => {
      if (count === 0) {
        showToast('Avval so\'z qo\'shing!');
        return;
      }
      router.navigate('/learn');
    });

    document.getElementById('btn-review').addEventListener('click', () => {
      if (count === 0) {
        showToast('Avval so\'z qo\'shing!');
        return;
      }
      router.navigate('/review');
    });

    document.getElementById('btn-add').addEventListener('click', () => {
      router.navigate('/add');
    });

    // Manual Sync
    const syncBtn = document.getElementById('btn-sync');
    syncBtn.addEventListener('click', async () => {
      syncBtn.textContent = '⏳ Sinxronlanmoqda...';
      syncBtn.disabled = true;

      const res = await syncWithServer();
      await refreshCount();

      syncBtn.textContent = '🔄 Sinxronlash';
      syncBtn.disabled = false;

      if (res.success) {
        showToast(`✅ Sinxronlandi! Jami: ${res.total} ta so'z`);
      } else {
        showToast(`ℹ️ Oflayn rejim (Serverga ulanib bo'lmadi)`);
      }
    });

    // Export
    document.getElementById('btn-export').addEventListener('click', async () => {
      await exportToJSON();
      showToast('✅ So\'zlar export qilindi');
    });

    // Import
    document.getElementById('btn-import').addEventListener('click', () => {
      document.getElementById('file-import').click();
    });

    document.getElementById('file-import').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const result = await importFromJSON(file);
        showToast(`✅ ${result.added} ta yangi, ${result.updated} ta yangilandi`);
        await refreshCount();
        // Sync imported words to server
        syncWithServer();
      } catch (err) {
        showToast('❌ Import xatolik: ' + err.message);
      }
      e.target.value = '';
    });
  };
}
