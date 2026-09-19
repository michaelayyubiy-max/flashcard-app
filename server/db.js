import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'words.json');

// In-memory cache
let inMemoryData = { lastId: 0, words: [] };

// Database pool if DATABASE_URL is configured
let pool = null;
const DATABASE_URL = process.env.DATABASE_URL;

if (DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    console.log('📦 Cloud PostgreSQL ma\'lumotlar bazasiga ulandi');
    initPostgres();
  } catch (err) {
    console.error('Postgres init error:', err.message);
  }
}

async function initPostgres() {
  if (!pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS words (
        id SERIAL PRIMARY KEY,
        word VARCHAR(255) NOT NULL,
        translation TEXT NOT NULL,
        source VARCHAR(50) DEFAULT 'bot',
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );
    `);
    // Load words from DB into memory
    const res = await pool.query('SELECT * FROM words ORDER BY id ASC');
    if (res.rows.length > 0) {
      inMemoryData.words = res.rows.map(r => ({
        id: r.id,
        word: r.word,
        translation: r.translation,
        source: r.source,
        createdAt: Number(r.created_at),
        updatedAt: Number(r.updated_at)
      }));
      inMemoryData.lastId = Math.max(...inMemoryData.words.map(w => w.id), 0);
    }
  } catch (err) {
    console.error('Postgres table creation error:', err.message);
  }
}

// Local file system setup
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadFileData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading words.json:', err);
  }
  return { lastId: 0, words: [] };
}

// Initial load
inMemoryData = loadFileData();

function persistData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(inMemoryData, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving words.json:', err);
  }
}

async function syncToPostgres(wordObj, isDelete = false) {
  if (!pool) return;
  try {
    if (isDelete) {
      await pool.query('DELETE FROM words WHERE id = $1 OR LOWER(word) = LOWER($2)', [
        typeof wordObj === 'number' ? wordObj : null,
        String(wordObj)
      ]);
    } else {
      const existing = await pool.query('SELECT id FROM words WHERE LOWER(word) = LOWER($1)', [wordObj.word]);
      if (existing.rows.length > 0) {
        await pool.query(
          'UPDATE words SET translation = $1, updated_at = $2, source = $3 WHERE id = $4',
          [wordObj.translation, wordObj.updatedAt, wordObj.source, existing.rows[0].id]
        );
      } else {
        await pool.query(
          'INSERT INTO words (word, translation, source, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)',
          [wordObj.word, wordObj.translation, wordObj.source, wordObj.createdAt, wordObj.updatedAt]
        );
      }
    }
  } catch (err) {
    console.warn('Postgres sync error:', err.message);
  }
}

const DELETED_FILE = path.join(DATA_DIR, 'deleted_words.json');

// Default unwanted sample words that must never reappear
const SAMPLE_BLOCKLIST = ['developer', 'computer', 'language', 'apple', 'good'];

function loadDeletedWords() {
  try {
    const set = new Set(SAMPLE_BLOCKLIST);
    if (fs.existsSync(DELETED_FILE)) {
      const raw = fs.readFileSync(DELETED_FILE, 'utf8');
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        arr.forEach(w => set.add(String(w).trim().toLowerCase()));
      }
    }
    return set;
  } catch (err) {
    console.error('Error loading deleted_words.json:', err);
    return new Set(SAMPLE_BLOCKLIST);
  }
}

let recentlyDeleted = loadDeletedWords();

function persistDeletedWords() {
  try {
    fs.writeFileSync(DELETED_FILE, JSON.stringify(Array.from(recentlyDeleted), null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving deleted_words.json:', err);
  }
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');

function loadCategoriesData() {
  try {
    if (fs.existsSync(CATEGORIES_FILE)) {
      const raw = fs.readFileSync(CATEGORIES_FILE, 'utf8');
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return arr;
      }
    }
  } catch (err) {
    console.error('Error loading categories.json:', err);
  }
  return ['Umumiy'];
}

let categoriesData = loadCategoriesData();

function persistCategoriesData() {
  try {
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categoriesData, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving categories.json:', err);
  }
}

export function getAllCategories() {
  const set = new Set(['Umumiy', ...categoriesData]);
  return Array.from(set);
}

export function addCategory(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return false;
  if (!categoriesData.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) {
    categoriesData.push(trimmed);
    persistCategoriesData();
    return true;
  }
  return false;
}

export function deleteCategory(name, deleteWordsAlso = false) {
  const target = (name || '').trim();
  if (!target || target.toLowerCase() === 'umumiy') return { success: false, reason: 'cannot_delete_default' };

  categoriesData = categoriesData.filter(c => c.toLowerCase() !== target.toLowerCase());
  persistCategoriesData();

  let affectedCount = 0;
  if (deleteWordsAlso) {
    // 1-Variant: Delete words also
    const toDelete = inMemoryData.words.filter(w => (w.category || 'Umumiy').toLowerCase() === target.toLowerCase());
    affectedCount = toDelete.length;
    toDelete.forEach(w => recentlyDeleted.add(w.word.toLowerCase()));
    inMemoryData.words = inMemoryData.words.filter(w => (w.category || 'Umumiy').toLowerCase() !== target.toLowerCase());
  } else {
    // 2-Variant: Preserve words, move to 'Umumiy'
    inMemoryData.words.forEach(w => {
      if ((w.category || 'Umumiy').toLowerCase() === target.toLowerCase()) {
        w.category = 'Umumiy';
        w.updatedAt = Date.now();
        affectedCount++;
      }
    });
  }

  persistData();
  persistDeletedWords();
  return { success: true, affectedCount };
}

export function getAllWords() {
  return inMemoryData.words;
}

export function getWordCount() {
  return inMemoryData.words.length;
}

export function getRecentlyDeleted() {
  return Array.from(recentlyDeleted);
}

export function deleteAllWords() {
  const all = [...inMemoryData.words];
  all.forEach(w => recentlyDeleted.add(w.word.toLowerCase()));
  inMemoryData.words = [];
  persistData();
  persistDeletedWords();
  if (pool) {
    pool.query('DELETE FROM words').catch(e => console.error('Postgres clear error:', e.message));
  }
  return true;
}

export function addWord(wordText, translationText, category = 'Umumiy', source = 'bot') {
  const trimmedWord = (wordText || '').trim();
  const trimmedTrans = (translationText || '').trim();
  const trimmedCat = (category || 'Umumiy').trim();
  if (!trimmedWord || !trimmedTrans) return null;

  // If this word was recently deleted, unmark it
  recentlyDeleted.delete(trimmedWord.toLowerCase());
  if (trimmedCat && trimmedCat.toLowerCase() !== 'umumiy') {
    addCategory(trimmedCat);
  }

  const now = Date.now();
  const existingIdx = inMemoryData.words.findIndex(
    w => w.word.toLowerCase() === trimmedWord.toLowerCase()
  );

  if (existingIdx !== -1) {
    inMemoryData.words[existingIdx].translation = trimmedTrans;
    inMemoryData.words[existingIdx].category = trimmedCat;
    inMemoryData.words[existingIdx].updatedAt = now;
    inMemoryData.words[existingIdx].source = source;
    persistData();
    syncToPostgres(inMemoryData.words[existingIdx]);
    return { ...inMemoryData.words[existingIdx], isNew: false };
  }

  inMemoryData.lastId = (inMemoryData.lastId || 0) + 1;
  const newWord = {
    id: inMemoryData.lastId,
    word: trimmedWord,
    translation: trimmedTrans,
    category: trimmedCat,
    createdAt: now,
    updatedAt: now,
    source
  };

  inMemoryData.words.push(newWord);
  persistData();
  syncToPostgres(newWord);
  return { ...newWord, isNew: true };
}

export function addBatchWords(items, source = 'bot') {
  const now = Date.now();
  const added = [];
  const updated = [];

  for (const item of items) {
    const trimmedWord = (item.word || '').trim();
    const trimmedTrans = (item.translation || '').trim();
    const trimmedCat = (item.category || 'Umumiy').trim();
    if (!trimmedWord || !trimmedTrans) continue;

    recentlyDeleted.delete(trimmedWord.toLowerCase());
    if (trimmedCat && trimmedCat.toLowerCase() !== 'umumiy') {
      addCategory(trimmedCat);
    }

    const existingIdx = inMemoryData.words.findIndex(
      w => w.word.toLowerCase() === trimmedWord.toLowerCase()
    );

    if (existingIdx !== -1) {
      inMemoryData.words[existingIdx].translation = trimmedTrans;
      inMemoryData.words[existingIdx].category = trimmedCat;
      inMemoryData.words[existingIdx].updatedAt = now;
      inMemoryData.words[existingIdx].source = source;
      updated.push(inMemoryData.words[existingIdx]);
      syncToPostgres(inMemoryData.words[existingIdx]);
    } else {
      inMemoryData.lastId = (inMemoryData.lastId || 0) + 1;
      const newWord = {
        id: inMemoryData.lastId,
        word: trimmedWord,
        translation: trimmedTrans,
        category: trimmedCat,
        createdAt: now,
        updatedAt: now,
        source
      };
      inMemoryData.words.push(newWord);
      added.push(newWord);
      syncToPostgres(newWord);
    }
  }

  persistData();
  return { added, updated, total: inMemoryData.words.length };
}

  persistData();
  return { added, updated, total: inMemoryData.words.length };
}

export function deleteWord(idOrWord) {
  const initialLen = inMemoryData.words.length;
  let removedWord = null;

  if (typeof idOrWord === 'number' || (!isNaN(Number(idOrWord)) && String(idOrWord).trim() !== '')) {
    const targetId = Number(idOrWord);
    const target = inMemoryData.words.find(w => w.id === targetId);
    if (target) {
      removedWord = target.word.toLowerCase();
      recentlyDeleted.add(removedWord);
    }
    inMemoryData.words = inMemoryData.words.filter(w => w.id !== targetId);
    syncToPostgres(targetId, true);
  } else {
    const targetWord = String(idOrWord).trim().toLowerCase();
    removedWord = targetWord;
    recentlyDeleted.add(targetWord);
    inMemoryData.words = inMemoryData.words.filter(w => w.word.toLowerCase() !== targetWord);
    syncToPostgres(targetWord, true);
  }

  const deleted = inMemoryData.words.length < initialLen;
  if (deleted) {
    persistData();
    persistDeletedWords();
  }
  return deleted;
}

export function syncClientWords(clientWords = [], deletedWords = [], clientCategories = []) {
  const now = Date.now();
  let addedCount = 0;
  let updatedCount = 0;
  let deletedCount = 0;

  // Process client categories
  if (Array.isArray(clientCategories) && clientCategories.length > 0) {
    for (const cat of clientCategories) {
      if (cat && typeof cat === 'string') addCategory(cat);
    }
  }

  // Process client deletions first
  if (Array.isArray(deletedWords) && deletedWords.length > 0) {
    for (const delItem of deletedWords) {
      if (!delItem) continue;
      const target = String(delItem).trim().toLowerCase();
      recentlyDeleted.add(target);
      const before = inMemoryData.words.length;
      inMemoryData.words = inMemoryData.words.filter(w => {
        if (typeof delItem === 'number' && w.id === delItem) return false;
        return w.word.toLowerCase() !== target;
      });
      if (inMemoryData.words.length < before) {
        deletedCount++;
        syncToPostgres(delItem, true);
      }
    }
  }

  // Process client additions and updates (skip if recently deleted on server)
  for (const cw of clientWords) {
    if (!cw.word || !cw.translation) continue;
    const lower = cw.word.trim().toLowerCase();
    const cat = cw.category || 'Umumiy';

    // If this word was deleted on server, do not re-add it
    if (recentlyDeleted.has(lower)) {
      continue;
    }

    if (cat && cat.toLowerCase() !== 'umumiy') {
      addCategory(cat);
    }

    const existingIdx = inMemoryData.words.findIndex(
      w => w.word.toLowerCase() === lower
    );

    if (existingIdx !== -1) {
      const clientTime = cw.updatedAt || cw.createdAt || 0;
      if (clientTime > (inMemoryData.words[existingIdx].updatedAt || 0) || (cw.category && cw.category !== inMemoryData.words[existingIdx].category)) {
        inMemoryData.words[existingIdx].translation = cw.translation.trim();
        inMemoryData.words[existingIdx].category = cat;
        inMemoryData.words[existingIdx].updatedAt = clientTime || now;
        updatedCount++;
        syncToPostgres(inMemoryData.words[existingIdx]);
      }
    } else {
      inMemoryData.lastId = (inMemoryData.lastId || 0) + 1;
      const newWord = {
        id: inMemoryData.lastId,
        word: cw.word.trim(),
        translation: cw.translation.trim(),
        category: cat,
        createdAt: cw.createdAt || now,
        updatedAt: cw.updatedAt || now,
        source: 'client'
      };
      inMemoryData.words.push(newWord);
      addedCount++;
      syncToPostgres(newWord);
    }
  }

  if (addedCount > 0 || updatedCount > 0 || deletedCount > 0) {
    persistData();
    persistDeletedWords();
  }

  return {
    serverWords: inMemoryData.words,
    categories: getAllCategories(),
    recentlyDeleted: Array.from(recentlyDeleted),
    serverTimestamp: now,
    stats: { added: addedCount, updated: updatedCount, deleted: deletedCount }
  };
}
