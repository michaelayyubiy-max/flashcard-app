import '../css/style.css';
import Router from './router.js';
import { renderHome } from './views/home.js';
import { renderAddWord } from './views/add-word.js';
import { renderLearn } from './views/learn.js';
import { renderReview } from './views/review.js';
import { setupAutoSync } from './sync.js';

// ═══════════════════════════════════════
// Toast notification
// ═══════════════════════════════════════
let toastTimeout = null;

export function showToast(message) {
  // Remove existing toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  if (toastTimeout) clearTimeout(toastTimeout);

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 350);
  }, 2500);
}

// ═══════════════════════════════════════
// App Init
// ═══════════════════════════════════════
const app = document.getElementById('app');
const router = new Router();

// Register routes
router
  .on('/', renderHome(app, router))
  .on('/add', renderAddWord(app, router))
  .on('/learn', renderLearn(app, router))
  .on('/review', renderReview(app, router));

// Initial resolve
if (!window.location.hash) {
  window.location.hash = '#/';
}
router.resolve();

// Background Auto Sync
setupAutoSync((res) => {
  if (window.location.hash === '#/' || !window.location.hash) {
    router.resolve();
  }
});

// Service Worker Auto Update & Cache Refresh
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(registration => {
    registration.update().catch(() => {});
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}


