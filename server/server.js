import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getAllWords, addWord, addBatchWords, deleteWord, deleteAllWords, getWordCount, syncClientWords, getAllCategories, addCategory, deleteCategory } from './db.js';
import { handleTelegramUpdate, setBotWebhook, startBotPolling, setupBotMenuButton } from './bot.js';

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
    categoriesCount: getAllCategories().length,
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

// GET all categories
app.get('/api/categories', (req, res) => {
  try {
    const categories = getAllCategories();
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST new category
app.post('/api/categories', (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Category name is required' });
    }
    const added = addCategory(name);
    res.json({ success: true, added, categories: getAllCategories() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE category (2 modes: deleteWords=true/false)
app.delete('/api/categories/:name', (req, res) => {
  try {
    const { name } = req.params;
    const deleteWords = req.query.deleteWords === 'true' || req.body?.deleteWords === true;
    const result = deleteCategory(name, deleteWords);
    res.json({ success: true, ...result, categories: getAllCategories(), remainingWords: getWordCount() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
    const { word, translation, category = 'Umumiy', words, source = 'api' } = req.body;

    if (Array.isArray(words)) {
      const result = addBatchWords(words, source);
      return res.json({ success: true, ...result });
    }

    if (!word || !translation) {
      return res.status(400).json({ success: false, error: 'word and translation are required' });
    }

    const saved = addWord(word, translation, category, source);
    res.json({ success: true, word: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE ALL words
app.delete('/api/words/all', (req, res) => {
  try {
    deleteAllWords();
    res.json({ success: true, message: 'Barcha so\'zlar o\'chirildi', count: 0 });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE word by ID or Word in URL
app.delete('/api/words/:idOrWord', (req, res) => {
  try {
    const { idOrWord } = req.params;
    if (idOrWord === 'all') {
      deleteAllWords();
      return res.json({ success: true, message: 'Barcha so\'zlar o\'chirildi', count: 0 });
    }
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

// POST sync (bidirectional with deletion sync and categories)
app.post('/api/sync', (req, res) => {
  try {
    const { clientWords = [], deletedWords = [], clientCategories = [] } = req.body;
    const result = syncClientWords(clientWords, deletedWords, clientCategories);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve frontend static build if exists (Render / Production)
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR, {
    setHeaders: (res, filePath) => {
      if (
        filePath.endsWith('sw.js') ||
        filePath.endsWith('registerSW.js') ||
        filePath.endsWith('index.html') ||
        filePath.endsWith('.webmanifest')
      ) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  }));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

// Start Server & Connect Telegram Bot
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 FlashCards All-in-One Server running at http://0.0.0.0:${PORT}`);

  // Configure Telegram Mini App menu button
  try {
    await setupBotMenuButton(SERVER_PUBLIC_URL);
  } catch (e) {}

  // In production / Render, register Webhook
  if (process.env.NODE_ENV === 'production' || process.env.RENDER || SERVER_PUBLIC_URL.includes('onrender.com')) {
    await setBotWebhook(SERVER_PUBLIC_URL);
  } else {
    startBotPolling();
  }
});
