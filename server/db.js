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

export function getAllWords() {
  return inMemoryData.words;
}

export function getWordCount() {
  return inMemoryData.words.length;
}

export function addWord(wordText, translationText, source = 'bot') {
  const trimmedWord = (wordText || '').trim();
  const trimmedTrans = (translationText || '').trim();
  if (!trimmedWord || !trimmedTrans) return null;

  const now = Date.now();
  const existingIdx = inMemoryData.words.findIndex(
    w => w.word.toLowerCase() === trimmedWord.toLowerCase()
  );

  if (existingIdx !== -1) {
    inMemoryData.words[existingIdx].translation = trimmedTrans;
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
    if (!trimmedWord || !trimmedTrans) continue;

    const existingIdx = inMemoryData.words.findIndex(
      w => w.word.toLowerCase() === trimmedWord.toLowerCase()
    );

    if (existingIdx !== -1) {
      inMemoryData.words[existingIdx].translation = trimmedTrans;
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

export function deleteWord(idOrWord) {
  const initialLen = inMemoryData.words.length;

  if (typeof idOrWord === 'number' || !isNaN(Number(idOrWord))) {
    const targetId = Number(idOrWord);
    inMemoryData.words = inMemoryData.words.filter(w => w.id !== targetId);
    syncToPostgres(targetId, true);
  } else {
    const targetWord = String(idOrWord).trim().toLowerCase();
    inMemoryData.words = inMemoryData.words.filter(w => w.word.toLowerCase() !== targetWord);
    syncToPostgres(targetWord, true);
  }

  const deleted = inMemoryData.words.length < initialLen;
  if (deleted) persistData();
  return deleted;
}

export function syncClientWords(clientWords = []) {
  const now = Date.now();
  let addedCount = 0;
  let updatedCount = 0;

  for (const cw of clientWords) {
    if (!cw.word || !cw.translation) continue;
    const existingIdx = inMemoryData.words.findIndex(
      w => w.word.toLowerCase() === cw.word.trim().toLowerCase()
    );

    if (existingIdx !== -1) {
      const clientTime = cw.updatedAt || cw.createdAt || 0;
      if (clientTime > (inMemoryData.words[existingIdx].updatedAt || 0)) {
        inMemoryData.words[existingIdx].translation = cw.translation.trim();
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
        createdAt: cw.createdAt || now,
        updatedAt: cw.updatedAt || now,
        source: 'client'
      };
      inMemoryData.words.push(newWord);
      addedCount++;
      syncToPostgres(newWord);
    }
  }

  if (addedCount > 0 || updatedCount > 0) {
    persistData();
  }

  return {
    serverWords: inMemoryData.words,
    serverTimestamp: now,
    stats: { added: addedCount, updated: updatedCount }
  };
}
