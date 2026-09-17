import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getAllWords, addWord, addBatchWords, deleteWord, getWordCount, syncClientWords } from './db.js';
import { startBot } from './bot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, '../dist');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    wordsCount: getWordCount(),
    bot: '@flashcardsuzbot',
    timestamp: Date.now()
  });
});

// GET all words
app.get('/api/words', (req, res) => {
  try {
    const words = getAllWords();
    res.json({ success: true, count: words.length, words });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST new word(s)
app.post('/api/words', (req, res) => {
  try {
    const { word, translation, words, source = 'api' } = req.body;

    if (Array.isArray(words)) {
      const result = addBatchWords(words, source);
      return res.json({ success: true, ...result });
    }

    if (!word || !translation) {
      return res.status(400).json({ success: false, error: 'word and translation are required' });
    }

    const saved = addWord(word, translation, source);
    res.json({ success: true, word: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE word
app.delete('/api/words/:id', (req, res) => {
  try {
    const { id } = req.params;
    const deleted = deleteWord(id);
    res.json({ success: true, deleted, remaining: getWordCount() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST sync (bidirectional)
app.post('/api/sync', (req, res) => {
  try {
    const { clientWords = [] } = req.body;
    const result = syncClientWords(clientWords);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve frontend static build if exists (Render / Production)
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

// Start Server & Telegram Bot
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 FlashCards All-in-One Server running at http://0.0.0.0:${PORT}`);
  startBot();
});
