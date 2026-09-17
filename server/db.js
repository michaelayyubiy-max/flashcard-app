import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'words.json');

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadData() {
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

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving words.json:', err);
  }
}

export function getAllWords() {
  const data = loadData();
  return data.words;
}

export function getWordCount() {
  const data = loadData();
  return data.words.length;
}

export function addWord(wordText, translationText, source = 'bot') {
  const data = loadData();
  const trimmedWord = (wordText || '').trim();
  const trimmedTrans = (translationText || '').trim();
  if (!trimmedWord || !trimmedTrans) return null;

  const now = Date.now();
  // Check if word already exists (case-insensitive)
  const existingIdx = data.words.findIndex(
    w => w.word.toLowerCase() === trimmedWord.toLowerCase()
  );

  if (existingIdx !== -1) {
    // Update existing translation
    data.words[existingIdx].translation = trimmedTrans;
    data.words[existingIdx].updatedAt = now;
    data.words[existingIdx].source = source;
    saveData(data);
    return { ...data.words[existingIdx], isNew: false };
  }

  // Add new
  data.lastId = (data.lastId || 0) + 1;
  const newWord = {
    id: data.lastId,
    word: trimmedWord,
    translation: trimmedTrans,
    createdAt: now,
    updatedAt: now,
    source
  };

  data.words.push(newWord);
  saveData(data);
  return { ...newWord, isNew: true };
}

export function addBatchWords(items, source = 'bot') {
  const data = loadData();
  const now = Date.now();
  const added = [];
  const updated = [];

  for (const item of items) {
    const trimmedWord = (item.word || '').trim();
    const trimmedTrans = (item.translation || '').trim();
    if (!trimmedWord || !trimmedTrans) continue;

    const existingIdx = data.words.findIndex(
      w => w.word.toLowerCase() === trimmedWord.toLowerCase()
    );

    if (existingIdx !== -1) {
      data.words[existingIdx].translation = trimmedTrans;
      data.words[existingIdx].updatedAt = now;
      data.words[existingIdx].source = source;
      updated.push(data.words[existingIdx]);
    } else {
      data.lastId = (data.lastId || 0) + 1;
      const newWord = {
        id: data.lastId,
        word: trimmedWord,
        translation: trimmedTrans,
        createdAt: now,
        updatedAt: now,
        source
      };
      data.words.push(newWord);
      added.push(newWord);
    }
  }

  saveData(data);
  return { added, updated, total: data.words.length };
}

export function deleteWord(idOrWord) {
  const data = loadData();
  const initialLen = data.words.length;

  if (typeof idOrWord === 'number' || !isNaN(Number(idOrWord))) {
    const targetId = Number(idOrWord);
    data.words = data.words.filter(w => w.id !== targetId);
  } else {
    const targetWord = String(idOrWord).trim().toLowerCase();
    data.words = data.words.filter(w => w.word.toLowerCase() !== targetWord);
  }

  const deleted = data.words.length < initialLen;
  if (deleted) saveData(data);
  return deleted;
}

export function syncClientWords(clientWords = []) {
  const data = loadData();
  const now = Date.now();
  let addedCount = 0;
  let updatedCount = 0;

  // Merge client words into server
  for (const cw of clientWords) {
    if (!cw.word || !cw.translation) continue;
    const existingIdx = data.words.findIndex(
      w => w.word.toLowerCase() === cw.word.trim().toLowerCase()
    );

    if (existingIdx !== -1) {
      // If client word is newer, update
      const clientTime = cw.updatedAt || cw.createdAt || 0;
      if (clientTime > (data.words[existingIdx].updatedAt || 0)) {
        data.words[existingIdx].translation = cw.translation.trim();
        data.words[existingIdx].updatedAt = clientTime || now;
        updatedCount++;
      }
    } else {
      data.lastId = (data.lastId || 0) + 1;
      data.words.push({
        id: data.lastId,
        word: cw.word.trim(),
        translation: cw.translation.trim(),
        createdAt: cw.createdAt || now,
        updatedAt: cw.updatedAt || now,
        source: 'client'
      });
      addedCount++;
    }
  }

  if (addedCount > 0 || updatedCount > 0) {
    saveData(data);
  }

  return {
    serverWords: data.words,
    serverTimestamp: now,
    stats: { added: addedCount, updated: updatedCount }
  };
}
