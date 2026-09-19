import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getAllWords, addWord, addBatchWords, deleteWord, getWordCount, syncClientWords, getRecentlyDeleted } from './db.js';
import { handleTelegramUpdate, setBotWebhook, startBotPolling } from './bot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, '../dist');

const app = express();
const PORT = process.env.PORT || 3001;
const SERVER_PUBLIC_URL = process.env.RENDER_EXTERNAL_URL || 'https://flashcard-app-tluu.onrender.com';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    wordsCount: getWordCount(),
    recentlyDeletedCount: getRecentlyDeleted().length,
    bot: '@flashcardsuzbot',
    publicUrl: SERVER_PUBLIC_URL,
    timestamp: Date.now()
  });
});

// Telegram Webhook Endpoint
app.post('/api/telegram-webhook', async (req, res) => {
  try {
    await handleTelegramUpdate(req.body);
    res.json({ ok: true });
  } catch (err) {
    console.error('Webhook processing error:', err.message);
    res.status(200).json({ ok: false, error: err.message });
  }
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

// DELETE word by ID or Word in URL
app.delete('/api/words/:idOrWord', (req, res) => {
  try {
    const { idOrWord } = req.params;
    const deleted = deleteWord(idOrWord);
    res.json({ success: true, deleted, remaining: getWordCount() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE word by body or query
app.delete('/api/words', (req, res) => {
  try {
    const target = req.body?.word || req.body?.id || req.query?.word || req.query?.id;
    if (!target) {
      return res.status(400).json({ success: false, error: 'word or id is required' });
    }
    const deleted = deleteWord(target);
    res.json({ success: true, deleted, remaining: getWordCount() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST sync (bidirectional with deletion sync)
app.post('/api/sync', (req, res) => {
  try {
    const { clientWords = [], deletedWords = [] } = req.body;
    const result = syncClientWords(clientWords, deletedWords);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve frontend static build if exists (Render / Production)
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

// Start Server & Connect Telegram Bot
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 FlashCards All-in-One Server running at http://0.0.0.0:${PORT}`);

  // In production / Render, register Webhook
  if (process.env.NODE_ENV === 'production' || process.env.RENDER || SERVER_PUBLIC_URL.includes('onrender.com')) {
    await setBotWebhook(SERVER_PUBLIC_URL);
  } else {
    startBotPolling();
  }
});
