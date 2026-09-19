import { getAllWords, bulkUpsertWords, deleteWordsByText } from './db.js';

export const PRODUCTION_API_URL = 'https://flashcard-app-tluu.onrender.com/api';

export function getApiUrl() {
  const custom = localStorage.getItem('api_server_url');
  if (custom) return custom.replace(/\/$/, '');

  // Local development on localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001/api';
  }

  // If loaded via live Render domain
  if (window.location.origin && window.location.origin.includes('onrender.com')) {
    return `${window.location.origin}/api`;
  }

  // Fallback to production Render server (PWA / Mobile / custom domains)
  return PRODUCTION_API_URL;
}

export function setCustomApiUrl(url) {
  if (url) {
    localStorage.setItem('api_server_url', url.trim());
  } else {
    localStorage.removeItem('api_server_url');
  }
}

export function getCustomApiUrl() {
  return localStorage.getItem('api_server_url') || '';
}

// Sample blocklist that should never be resurrected
export const SAMPLE_BLOCKLIST = ['developer', 'computer', 'language', 'apple', 'good'];

// ═══════════════════════════════════════
// Permanently Deleted Words & Queue (Offline Support)
// ═══════════════════════════════════════
export function getPermanentlyDeleted() {
  try {
    const raw = localStorage.getItem('permanently_deleted_words');
    const list = raw ? JSON.parse(raw) : [];
    const set = new Set([...SAMPLE_BLOCKLIST, ...list.map(w => String(w).trim().toLowerCase())]);
    return Array.from(set);
  } catch (e) {
    return [...SAMPLE_BLOCKLIST];
  }
}

export function markAsPermanentlyDeleted(wordText) {
  if (!wordText) return;
  const list = getPermanentlyDeleted();
  const normalized = wordText.trim().toLowerCase();
  if (!list.includes(normalized)) {
    list.push(normalized);
    localStorage.setItem('permanently_deleted_words', JSON.stringify(list));
  }
  queueDeletedWord(normalized);
}

function getDeletedQueue() {
  try {
    const raw = localStorage.getItem('pending_deleted_words');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveDeletedQueue(queue) {
  localStorage.setItem('pending_deleted_words', JSON.stringify(queue));
}

export function queueDeletedWord(wordText) {
  if (!wordText) return;
  const queue = getDeletedQueue();
  const normalized = wordText.trim().toLowerCase();
  if (!queue.includes(normalized)) {
    queue.push(normalized);
    saveDeletedQueue(queue);
  }
}

export function removeDeletedQueueItem(wordText) {
  if (!wordText) return;
  const queue = getDeletedQueue();
  const normalized = wordText.trim().toLowerCase();
  const filtered = queue.filter(item => item !== normalized);
  saveDeletedQueue(filtered);
}

// Immediately delete a word on the server
export async function deleteWordFromServer(wordText, wordId = null) {
  markAsPermanentlyDeleted(wordText);

  try {
    const apiUrl = getApiUrl();
    const target = encodeURIComponent(wordText || wordId);
    const response = await fetch(`${apiUrl}/words/${target}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: wordText, id: wordId }),
      signal: AbortSignal.timeout(6000)
    });

    if (response.ok) {
      removeDeletedQueueItem(wordText);
      return true;
    }
  } catch (err) {
    console.warn('Could not delete word immediately from server (will retry on sync):', err.message);
  }
  return false;
}

// Delete ALL words everywhere (Server + Local)
export async function deleteAllWordsEverywhere() {
  try {
    const apiUrl = getApiUrl();
    await fetch(`${apiUrl}/words/all`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(6000)
    });
  } catch (err) {
    console.warn('Failed to clear server words:', err.message);
  }
}

// ═══════════════════════════════════════
// Full Two-Way Sync
// ═══════════════════════════════════════
let isSyncing = false;

export async function syncWithServer() {
  if (isSyncing) return { success: false, reason: 'sync_in_progress' };
  isSyncing = true;

  try {
    const apiUrl = getApiUrl();
    const localWords = await getAllWords();
    const permDeleted = getPermanentlyDeleted();
    const permSet = new Set(permDeleted);

    // Filter out any deleted/blocked words from being pushed to server
    const validLocalWords = localWords.filter(w => !permSet.has(w.word.toLowerCase()));

    // If any deleted words still exist in local Dexie, delete them immediately
    const staleLocal = localWords.filter(w => permSet.has(w.word.toLowerCase()));
    if (staleLocal.length > 0) {
      await deleteWordsByText(staleLocal.map(w => w.word));
    }

    const pendingDeletions = Array.from(new Set([...getDeletedQueue(), ...permDeleted]));

    const response = await fetch(`${apiUrl}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientWords: validLocalWords,
        deletedWords: pendingDeletions
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`Server xatosi: ${response.status}`);
    }

    const data = await response.json();
    if (data.success && Array.isArray(data.serverWords)) {
      saveDeletedQueue([]);

      // Merge server recently deleted with local permanent deletions
      if (Array.isArray(data.recentlyDeleted) && data.recentlyDeleted.length > 0) {
        data.recentlyDeleted.forEach(w => markAsPermanentlyDeleted(w));
        await deleteWordsByText(data.recentlyDeleted);
      }

      const allDeleted = getPermanentlyDeleted();
      const upsertResult = await bulkUpsertWords(data.serverWords, allDeleted);
      localStorage.setItem('last_sync_timestamp', Date.now().toString());

      return {
        success: true,
        added: upsertResult.added,
        updated: upsertResult.updated,
        total: upsertResult.total
      };
    } else {
      throw new Error('Serverdan noto\'g\'ri javob keldi');
    }
  } catch (err) {
    console.warn('Sync failed (offline or server unreachable):', err.message);
    return { success: false, error: err.message };
  } finally {
    isSyncing = false;
  }
}

export function getLastSyncTime() {
  const ts = localStorage.getItem('last_sync_timestamp');
  if (!ts) return null;
  return new Date(parseInt(ts));
}

export function setupAutoSync(onSyncComplete) {
  // Sync on startup
  setTimeout(async () => {
    const res = await syncWithServer();
    if (res.success && onSyncComplete) {
      onSyncComplete(res);
    }
  }, 1000);

  // Sync when coming back online
  window.addEventListener('online', async () => {
    const res = await syncWithServer();
    if (res.success && onSyncComplete) {
      onSyncComplete(res);
    }
  });

  // Periodic background sync every 30 seconds if online
  setInterval(async () => {
    if (navigator.onLine) {
      const res = await syncWithServer();
      if (res.success && onSyncComplete) {
        onSyncComplete(res);
      }
    }
  }, 30000);
}
