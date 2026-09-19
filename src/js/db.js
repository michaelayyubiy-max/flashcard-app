import Dexie from 'dexie';

const db = new Dexie('FlashCardsDB');

db.version(1).stores({
  words: '++id, word, translation, createdAt, updatedAt'
});

// ═══════════════════════════════════════
// CRUD Operations
// ═══════════════════════════════════════

export async function addWord(word, translation) {
  const now = Date.now();
  const id = await db.words.add({
    word: word.trim(),
    translation: translation.trim(),
    createdAt: now,
    updatedAt: now
  });
  return id;
}

export async function updateWord(id, word, translation) {
  await db.words.update(id, {
    word: word.trim(),
    translation: translation.trim(),
    updatedAt: Date.now()
  });
}

export async function deleteWord(id) {
  await db.words.delete(id);
}

export async function deleteWordByText(wordText) {
  const normalized = (wordText || '').trim().toLowerCase();
  const all = await getAllWords();
  const match = all.find(w => w.word.toLowerCase() === normalized);
  if (match) {
    await db.words.delete(match.id);
  }
}

export async function deleteWordsByText(wordTexts = []) {
  if (!Array.isArray(wordTexts) || wordTexts.length === 0) return;
  const set = new Set(wordTexts.map(t => String(t).trim().toLowerCase()));
  const all = await getAllWords();
  const toDelete = all.filter(w => set.has(w.word.toLowerCase()));
  if (toDelete.length > 0) {
    await db.transaction('rw', db.words, async () => {
      for (const item of toDelete) {
        await db.words.delete(item.id);
      }
    });
  }
}

export async function getWord(id) {
  return await db.words.get(id);
}

export async function getAllWords() {
  return await db.words.orderBy('id').toArray();
}

export async function getWordCount() {
  return await db.words.count();
}

export async function getWordsInRange(startIndex, endIndex) {
  const allWords = await getAllWords();
  return allWords.slice(startIndex, endIndex);
}

export async function searchWords(query) {
  const q = query.toLowerCase().trim();
  if (!q) return getAllWords();
  const all = await getAllWords();
  return all.filter(w =>
    w.word.toLowerCase().includes(q) ||
    w.translation.toLowerCase().includes(q)
  );
}

export async function bulkUpsertWords(serverWords, recentlyDeleted = []) {
  if (!Array.isArray(serverWords)) return { added: 0, updated: 0, total: await getWordCount() };

  const deletedSet = new Set((recentlyDeleted || []).map(w => String(w).trim().toLowerCase()));
  const existingWords = await getAllWords();
  const existingMap = new Map(existingWords.map(w => [w.word.toLowerCase(), w]));

  let added = 0;
  let updated = 0;

  await db.transaction('rw', db.words, async () => {
    // Delete any words that are in deletedSet
    for (const [key, item] of existingMap.entries()) {
      if (deletedSet.has(key)) {
        await db.words.delete(item.id);
        existingMap.delete(key);
      }
    }

    for (const sw of serverWords) {
      if (!sw.word || !sw.translation) continue;
      const lower = sw.word.toLowerCase();
      if (deletedSet.has(lower)) continue;

      const existing = existingMap.get(lower);

      if (existing) {
        if (sw.translation !== existing.translation || (sw.updatedAt || 0) > (existing.updatedAt || 0)) {
          await db.words.update(existing.id, {
            translation: sw.translation.trim(),
            updatedAt: sw.updatedAt || Date.now()
          });
          updated++;
        }
      } else {
        await db.words.add({
          word: sw.word.trim(),
          translation: sw.translation.trim(),
          createdAt: sw.createdAt || Date.now(),
          updatedAt: sw.updatedAt || Date.now()
        });
        added++;
      }
    }
  });

  return { added, updated, total: await getWordCount() };
}

// ═══════════════════════════════════════
// Export / Import (JSON sync)
// ═══════════════════════════════════════

export async function exportToJSON() {
  const words = await getAllWords();
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    words: words
  };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `flashcards_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.words || !Array.isArray(data.words)) {
          throw new Error('Noto\'g\'ri fayl formati');
        }

        const existingWords = await getAllWords();
        const existingMap = new Map(existingWords.map(w => [w.word.toLowerCase(), w]));

        let added = 0;
        let updated = 0;

        for (const word of data.words) {
          const existing = existingMap.get(word.word.toLowerCase());
          if (existing) {
            // Update if the imported one is newer
            if (word.updatedAt > existing.updatedAt) {
              await updateWord(existing.id, word.word, word.translation);
              updated++;
            }
          } else {
            await addWord(word.word, word.translation);
            added++;
          }
        }

        resolve({ added, updated, total: data.words.length });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Faylni o\'qib bo\'lmadi'));
    reader.readAsText(file);
  });
}

export default db;
