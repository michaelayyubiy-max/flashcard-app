import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseWordsFromText } from './parser.js';
import { addBatchWords, getAllWords, getWordCount, deleteWord, deleteAllWords } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOT_TOKEN = process.env.BOT_TOKEN || '8877215841:AAFtI7g99tYjJaEc0_DaSmF_3r5vh7yjwO8';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
export const WEB_APP_URL = process.env.RENDER_EXTERNAL_URL || process.env.WEB_APP_URL || 'https://flashcard-app-tluu.onrender.com';

let isPolling = false;
let lastUpdateId = 0;

export function getMillenniumCards() {
  try {
    const p = path.join(__dirname, 'data/millennium.json');
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
  } catch (e) {
    console.warn('Error reading millennium.json in bot:', e.message);
  }
  return [];
}

export function findMillenniumCard(input) {
  if (!input) return null;
  const clean = input.trim();
  if (!/^\d{1,3}$/.test(clean)) return null;
  const numStr = clean.padStart(3, '0');
  const cards = getMillenniumCards();
  return cards.find(c => c.number === numStr) || null;
}

export async function telegramApi(method, body = {}) {
  try {
    const res = await fetch(`${TELEGRAM_API}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch (err) {
    console.error(`Telegram API error (${method}):`, err.message);
    return null;
  }
}

export async function sendMessage(chatId, text, options = {}) {
  return await telegramApi('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: options.parse_mode || 'HTML',
    ...options
  });
}

export function getMainKeyboard(webAppUrl = WEB_APP_URL) {
  const url = (webAppUrl || WEB_APP_URL).replace(/\/$/, '');
  return {
    keyboard: [
      [
        { text: "🔢 Raqamlar (050–099)", web_app: { url: `${url}/#/numbers` } },
        { text: "📖 So'zlar", web_app: { url: `${url}/#/words` } }
      ],
      [
        { text: "📱 Barcha bo'limlar (Hub)", web_app: { url: `${url}/#/` } }
      ],
      [
        { text: "📚 So'zlar ro'yxati" },
        { text: "📊 Statistika" }
      ],
      [
        { text: "🗑 So'zni o'chirish" }
      ]
    ],
    resize_keyboard: true
  };
}

// Main Telegram Update Handler (Used by both Webhook and Polling)
export async function handleTelegramUpdate(update) {
  if (!update) return;

  // Handle callback queries (Inline button clicks)
  if (update.callback_query) {
    await handleCallbackQuery(update.callback_query);
    return;
  }

  const message = update.message;
  if (!message || !message.text) return;

  const chatId = message.chat.id;
  const text = message.text.trim();

  // /start or /help
  if (text === '/start' || text === '/help') {
    const totalWords = getWordCount();
    const millenniumCards = getMillenniumCards();
    const minNum = millenniumCards.length > 0 ? millenniumCards[0].number : '050';
    const maxNum = millenniumCards.length > 0 ? millenniumCards[millenniumCards.length - 1].number : '099';

    const welcome = `👋 <b>Assalomu alaykum!</b>\n\n` +
      `Bu bot sizning <b>FlashCards & Millennium System</b> ilovangiz bilan bitta umumiy serverda 24/7 ishlaydi.\n\n` +
      `🔢 <b>Raqamlar (${minNum}–${maxNum}):</b>\n` +
      `• Millennium CVC obrazlari bazasi va professional sekundamerli flesh-karta mashg'uloti.\n` +
      `• Istalgan raqamni yozib yuboring (masalan: <code>050</code> yoki <code>75</code>) — bot sizga uning obrazini ko'rsatadi!\n\n` +
      `📖 <b>So'z yodlash (Lug'at):</b>\n` +
      `• So'z qo'shish: <code>apple - olma</code>\n` +
      `• O'chirish: <code>/delete apple</code>\n\n` +
      `📱 <b>Telegram ichida ochish:</b>\n` +
      `Pastdagi tugmalar orqali istalgan bo'limni to'g'ridan-to'g'ri Telegram ichida oching:\n` +
      `• <b>🔢 Raqamlar (${minNum}–${maxNum})</b> — Flesh-karta & sekundamer\n` +
      `• <b>📖 So'zlar</b> — So'z yodlash\n` +
      `• <b>📱 Barcha bo'limlar</b> — Asosiy Hub\n\n` +
      `📊 Bazada: <b>${millenniumCards.length} ta raqam</b> · <b>${totalWords} ta so'z</b>`;

    await sendMessage(chatId, welcome, {
      reply_markup: getMainKeyboard()
    });
    return;
  }

  // /numbers or /raqamlar
  if (text === '/numbers' || text === '/raqamlar' || text.startsWith('/number')) {
    const cards = getMillenniumCards();
    const minNum = cards.length > 0 ? cards[0].number : '050';
    const maxNum = cards.length > 0 ? cards[cards.length - 1].number : '099';

    const msg = `🔢 <b>Millennium Tizimi (${minNum}–${maxNum})</b>\n\n` +
      `🎯 Jami: <b>${cards.length} ta</b> CVC obraz bazada mavjud.\n` +
      `⏱ Har bir karta uchun alohida sekundamer va avtomatik hisoblagich bor.\n\n` +
      `💡 <i>Botga <code>050</code>, <code>065</code>, <code>099</code> kabi raqam yuborsangiz, uning obrazini ko'rsatadi.</i>\n\n` +
      `Mashq qilish uchun pastdagi tugmani bosing:`;

    await sendMessage(chatId, msg, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🚀 Raqamlar Flesh-kartalarini ochish", web_app: { url: `${WEB_APP_URL}/#/numbers` } }],
          [{ text: "📱 Barcha bo'limlar (Hub)", web_app: { url: `${WEB_APP_URL}/#/` } }]
        ]
      }
    });
    return;
  }

  // Lookup single number card (e.g. "050" or "50")
  const numCard = findMillenniumCard(text);
  if (numCard) {
    const cardMsg = `🔢 <b>Raqam: ${numCard.number}</b>\n\n` +
      `🎯 <b>Obraz:</b> <b>${escapeHtml(numCard.word)}</b>\n` +
      (numCard.meaning ? `📖 <b>Ta'rif:</b> ${escapeHtml(numCard.meaning)}\n` : '') +
      `🧩 <b>CVC formulasi:</b> <code>${escapeHtml(numCard.formula || '')}</code> (${escapeHtml(numCard.letters || '')})`;

    await sendMessage(chatId, cardMsg, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🃏 Flesh-kartada ochish", web_app: { url: `${WEB_APP_URL}/#/numbers` } }]
        ]
      }
    });
    return;
  }

  // /clear or /deleteall
  if (text === '/clear' || text === '/deleteall') {
    deleteAllWords();
    await sendMessage(chatId, `🗑 <b>Barcha so'zlar serverdan butunlay tozalandi!</b>\n📊 Jami so'zlar: <b>0 ta</b>`, {
      reply_markup: getMainKeyboard()
    });
    return;
  }

  // /count or "📊 Statistika"
  if (text === '/count' || text === "📊 Statistika") {
    const total = getWordCount();
    const cards = getMillenniumCards();
    await sendMessage(chatId, `📊 <b>Statistika:</b>\n\n` +
      `🔢 Millennium raqamlari: <b>${cards.length} ta</b> (050–099)\n` +
      `📖 Foydalanuvchi so'zlari: <b>${total} ta</b>\n\n` +
      `🌐 Sayt: <a href="https://flashcard-app-tluu.onrender.com">flashcard-app-tluu.onrender.com</a>`);
    return;
  }

  // /words, /list or "📚 So'zlar ro'yxati"
  if (text === '/words' || text === '/list' || text === "📚 So'zlar ro'yxati") {
    const words = getAllWords();
    if (words.length === 0) {
      await sendMessage(chatId, `📭 Hozircha birorta ham so'z mavjud emas.\nSo'z qo'shish uchun shunchaki <code>apple - olma</code> deb yozib yuboring!`);
      return;
    }

    const lastWords = words.slice(-20).reverse();
    let listText = `📚 <b>Oxirgi so'zlar (jami ${words.length} ta):</b>\n\n`;
    lastWords.forEach((w, idx) => {
      listText += `${idx + 1}. <b>${escapeHtml(w.word)}</b> ➔ ${escapeHtml(w.translation)}\n`;
    });

    if (words.length > 20) {
      listText += `\n<i>... va yana ${words.length - 20} ta so'z saytingizda bor</i>\n`;
    }

    listText += `\n💡 <i>Biror so'zni o'chirish uchun <code>/delete so'z</code> deb yozing yoki pastdagi "🗑 So'zni o'chirish" tugmasini bosing.</i>`;
    await sendMessage(chatId, listText);
    return;
  }

  // /delete or "🗑 So'zni o'chirish"
  if (text.startsWith('/delete') || text === "🗑 So'zni o'chirish") {
    let target = text.replace('/delete', '').replace("🗑 So'zni o'chirish", '').trim();

    // If word is provided: /delete apple
    if (target) {
      const deleted = deleteWord(target);
      const total = getWordCount();
      if (deleted) {
        await sendMessage(chatId, `🗑 <b>"${escapeHtml(target)}"</b> so'zi serverdan muvaffaqiyatli o'chirildi!\n📊 Qolgan so'zlar: <b>${total} ta</b>`);
      } else {
        await sendMessage(chatId, `❌ <b>"${escapeHtml(target)}"</b> so'zi bazada topilmadi.`);
      }
      return;
    }

    // If no word provided, show interactive inline buttons with last 10 words
    const words = getAllWords();
    if (words.length === 0) {
      await sendMessage(chatId, `📭 Bazada o'chirish uchun so'z yo'q.`);
      return;
    }

    const recent = words.slice(-10).reverse();
    const inlineKeyboard = recent.map(w => [
      {
        text: `🗑 ${w.word} — ${w.translation}`,
        callback_data: `del:${w.id}:${w.word.substring(0, 30)}`
      }
    ]);

    await sendMessage(chatId, `🗑 <b>O'chirmoqchi bo'lgan so'zni tanlang:</b>\n<i>(Bitta tugmani bosishingiz bilan serverdan o'chiriladi)</i>`, {
      reply_markup: { inline_keyboard: inlineKeyboard }
    });
    return;
  }

  // Parse words from plain text
  const parsed = parseWordsFromText(text);

  if (parsed.length === 0) {
    await sendMessage(
      chatId,
      `❓ So'z aniqlanmadi.\n\nIltimos, quyidagi formatlardan birida yozing:\n` +
      `• <code>apple olma</code>\n` +
      `• <code>apple - olma</code>\n` +
      `• <code>apple\nolma</code>`
    );
    return;
  }

  const result = addBatchWords(parsed, 'telegram_bot');
  const total = getWordCount();

  if (parsed.length === 1) {
    const item = parsed[0];
    const isUpdated = result.updated.length > 0;
    const actionText = isUpdated ? 'yangilandi' : 'qo\'shildi';
    const reply = `✅ So'z <b>${actionText}</b>!\n\n` +
      `📖 <b>${escapeHtml(item.word)}</b> ➔ ${escapeHtml(item.translation)}\n\n` +
      `📊 Jami so'zlar: <b>${total} ta</b>\n` +
      `🌐 Ilova va saytda ham darhol yangilandi!`;
    await sendMessage(chatId, reply, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🚀 FlashCards Ilovasida ochish", web_app: { url: WEB_APP_URL } }]
        ]
      }
    });
  } else {
    let reply = `✅ <b>${parsed.length} ta</b> so'z muvaffaqiyatli saqlandi!\n\n`;
    parsed.forEach((item, idx) => {
      reply += `${idx + 1}. <b>${escapeHtml(item.word)}</b> ➔ ${escapeHtml(item.translation)}\n`;
    });
    reply += `\n📊 Jami so'zlar: <b>${total} ta</b>\n` +
      `🌐 Ilova va saytda ham darhol yangilandi!`;
    await sendMessage(chatId, reply, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🚀 FlashCards Ilovasida ochish", web_app: { url: WEB_APP_URL } }]
        ]
      }
    });
  }
}

// Handle Inline button clicks (Delete word)
async function handleCallbackQuery(query) {
  const data = query.data || '';
  const chatId = query.message?.chat?.id;
  const messageId = query.message?.message_id;

  if (data.startsWith('del:')) {
    const parts = data.split(':');
    const wordId = parts[1];
    const wordText = parts[2] || wordId;

    const deleted = deleteWord(wordId) || deleteWord(wordText);
    const total = getWordCount();

    // Answer callback query (dismiss spinner)
    await telegramApi('answerCallbackQuery', {
      callback_query_id: query.id,
      text: deleted ? `"${wordText}" o'chirildi` : 'Topilmadi'
    });

    // Edit original message to reflect deletion
    if (chatId && messageId) {
      if (deleted) {
        await telegramApi('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: `🗑 <b>"${escapeHtml(wordText)}"</b> so'zi muvaffaqiyatli o'chirildi!\n📊 Qolgan so'zlar: <b>${total} ta</b>`,
          parse_mode: 'HTML'
        });
      } else {
        await telegramApi('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: `❌ <b>"${escapeHtml(wordText)}"</b> allaqachon o'chirilgan yoki topilmadi.\n📊 Jami so'zlar: <b>${total} ta</b>`,
          parse_mode: 'HTML'
        });
      }
    }
  }
}

// Configure permanent Telegram Menu Button (Mini App)
// Configure permanent Telegram Menu Button (Mini App)
export async function setupBotMenuButton(serverUrl = WEB_APP_URL) {
  const url = (serverUrl || WEB_APP_URL).replace(/\/$/, '');
  const res = await telegramApi('setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text: '📱 FlashCards & Raqamlar',
      web_app: {
        url: url
      }
    }
  });

  if (res && res.ok) {
    console.log(`📱 Telegram WebApp Menu Button o'rnatildi: ${url}`);
    return true;
  } else {
    console.warn('⚠️ Telegram Menu Button o\'rnatishda ogohlantirish:', res?.description || res);
    return false;
  }
}

// Set bot commands
export async function setBotCommands() {
  const res = await telegramApi('setMyCommands', {
    commands: [
      { command: 'start', description: 'Botni ishga tushirish va menyu' },
      { command: 'numbers', description: '🔢 Raqamlar (050–099) Millennium' },
      { command: 'words', description: '📚 So\'zlar ro\'yxati' },
      { command: 'count', description: '📊 Statistika' },
      { command: 'clear', description: '🗑 Barcha so\'zlarni tozalash' },
      { command: 'help', description: 'ℹ️ Qo\'llanma va formatlar' }
    ]
  });
  if (res && res.ok) {
    console.log('✅ Telegram Bot buyruqlari muvaffaqiyatli o\'rnatildi!');
  }
}

// Set Webhook for production 24/7 reliability on Render
export async function setBotWebhook(serverUrl) {
  const webhookUrl = `${serverUrl.replace(/\/$/, '')}/api/telegram-webhook`;
  console.log(`🔗 Telegram Webhook o'rnatilmoqda: ${webhookUrl}`);

  const res = await telegramApi('setWebhook', {
    url: webhookUrl,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: false
  });

  if (res && res.ok) {
    console.log('✅ Telegram Webhook muvaffaqiyatli o\'rnatildi!');
    // Configure Menu Button and Bot Commands
    await setupBotMenuButton(serverUrl);
    await setBotCommands();
    return true;
  } else {
    console.warn('⚠️ Webhook o\'rnatishda xatolik:', res?.description || res);
    return false;
  }
}

// Start polling fallback (for local development when webhook cannot reach localhost)
export async function startBotPolling() {
  if (isPolling) return;
  isPolling = true;
  console.log('🤖 Telegram Bot (@flashcardsuzbot) polling rejimida ishga tushdi...');

  // Delete webhook so polling can receive updates
  await telegramApi('deleteWebhook', { drop_pending_updates: false });

  while (isPolling) {
    try {
      const res = await fetch(`${TELEGRAM_API}/getUpdates?offset=${lastUpdateId + 1}&timeout=15`);
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          lastUpdateId = Math.max(lastUpdateId, update.update_id);
          await handleTelegramUpdate(update);
        }
      } else if (data.error_code === 409) {
        console.warn('409 Conflict: boshqa instansiya ishlayapti, kutilmoqda...');
        await new Promise(r => setTimeout(r, 5000));
      } else {
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (err) {
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

export function stopBot() {
  isPolling = false;
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
