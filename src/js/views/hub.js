export function renderHub(app, router) {
  return () => {
    app.innerHTML = `
      <div class="hub-page page-enter">
        <!-- Top SuperMiya Header -->
        <header class="supermiya-header">
          <div class="supermiya-logo-box">
            <span class="logo-super">SUPER</span><span class="logo-miya">MIYA</span>
          </div>
          <button class="supermiya-menu-btn" id="btn-menu-info" aria-label="Ma'lumot">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <line x1="4" y1="12" x2="20" y2="12"></line>
              <line x1="4" y1="6" x2="20" y2="6"></line>
              <line x1="4" y1="18" x2="20" y2="18"></line>
            </svg>
          </button>
        </header>

        <!-- Banner Card -->
        <div class="supermiya-banner">
          <div class="banner-content">
            <h2>Supermiya platformasidan qanday qilib to'g'ri foydalanish</h2>
            <button class="banner-btn" id="btn-banner-guide">O'rganish</button>
          </div>
        </div>

        <!-- Yo'nalishlar Bo'limi -->
        <div class="hub-sections-container">
          <h2 class="hub-section-title">Yo'nalishlar</h2>
          
          <div class="hub-cards-grid">
            <!-- 1. Raqamlar (Millennium 000-999) -->
            <div class="hub-card" id="card-numbers">
              <div class="hub-card-icon-box num-icon">
                <span class="hash-icon">#</span>
              </div>
              <h3 class="hub-card-title">Raqamlar</h3>
              <p class="hub-card-desc">000–999 Millennium tizimi</p>
            </div>

            <!-- 2. So'zlar (Lug'at va Flashcards) -->
            <div class="hub-card" id="card-words">
              <div class="hub-card-icon-box word-icon">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m5 8 6 6"></path>
                  <path d="m4 14 6-6 2-3"></path>
                  <path d="M2 5h12"></path>
                  <path d="M7 2h1"></path>
                  <path d="m22 22-5-10-5 10"></path>
                  <path d="M14 18h6"></path>
                </svg>
              </div>
              <h3 class="hub-card-title">So'zlar</h3>
              <p class="hub-card-desc">Lug'at va Flash Cards</p>
            </div>
          </div>
        </div>

        <!-- Quick Help Modal -->
        <div class="modal-overlay hidden" id="guide-modal">
          <div class="modal-card">
            <div class="modal-header">
              <h3>💡 SuperMiya Qo'llanmasi</h3>
              <button class="modal-close" id="btn-close-modal">✕</button>
            </div>
            <div class="modal-body">
              <p><strong>1. Raqamlar (Millennium tizimi):</strong> 000 dan 999 gacha bo'lgan 1,000 ta 3 xonali sonlarni CVC fonetik kodi orqali eslab qolish va sekundomer bilan flesh-karta mashg'ulotlari.</p>
              <p style="margin-top:10px;"><strong>2. So'zlar:</strong> O'zingiz qo'shgan so'zlar yoki Telegram bot orqali kiritilgan lug'atni yodlash va timer bilan takrorlash.</p>
              <div style="margin-top:14px; text-align:center;">
                <a href="https://www.youtube.com/watch?v=LR1HjJXikD8" target="_blank" rel="noopener" class="video-guide-link">
                  ▶️ Videodarslikni ko'rish (YouTube)
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Navigation events
    document.getElementById('card-numbers').addEventListener('click', () => {
      router.navigate('/numbers');
    });

    document.getElementById('card-words').addEventListener('click', () => {
      router.navigate('/words');
    });

    // Guide Modal
    const modal = document.getElementById('guide-modal');
    const openBtn = document.getElementById('btn-banner-guide');
    const menuBtn = document.getElementById('btn-menu-info');
    const closeBtn = document.getElementById('btn-close-modal');

    const showModal = () => modal.classList.remove('hidden');
    const hideModal = () => modal.classList.add('hidden');

    openBtn.addEventListener('click', showModal);
    menuBtn.addEventListener('click', showModal);
    closeBtn.addEventListener('click', hideModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) hideModal();
    });
  };
}
