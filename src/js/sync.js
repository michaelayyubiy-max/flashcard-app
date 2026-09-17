import { getAllWords, bulkUpsertWords } from './db.js';

function getApiUrl() {
  const custom = localStorage.getItem('api_server_url');
  if (custom) return custom.replace(/\/$/, '');

  // If running in Vite dev server (port 3000), use backend on port 3001
  if (window.location.port === '3000') {
    const host = window.location.hostname || 'localhost';
    return `http://${host}:3001/api`;
  }

  // Otherwise (Render, Production, custom domain), use origin
  return `${window.location.origin}/api`;
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

let isSyncing = false;

export async function syncWithServer() {
  if (isSyncing) return { success: false, reason: 'sync_in_progress' };
  isSyncing = true;

  try {
    const apiUrl = getApiUrl();
    const localWords = await getAllWords();

    const response = await fetch(`${apiUrl}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientWords: localWords }),
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      throw new Error(`Server xatosi: ${response.status}`);
    }

    const data = await response.json();
    if (data.success && Array.isArray(data.serverWords)) {
      const upsertResult = await bulkUpsertWords(data.serverWords);
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
  // Try sync on startup
  setTimeout(async () => {
    const res = await syncWithServer();
    if (res.success && (res.added > 0 || res.updated > 0) && onSyncComplete) {
      onSyncComplete(res);
    }
  }, 1000);

  // Sync when internet connection returns
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
      if (res.success && (res.added > 0 || res.updated > 0) && onSyncComplete) {
        onSyncComplete(res);
      }
    }
  }, 30000);
}
