import { parseWordsFromText } from './parser.js';
import { addBatchWords, getAllWords, getWordCount, deleteWord, deleteAllWords } from './db.js';

const BOT_TOKEN = process.env.BOT_TOKEN || '8877215841:AAFtI7g99tYjJaEc0_DaSmF_3r5vh7yjwO8';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
export const WEB_APP_URL = process.env.RENDER_EXTERNAL_URL || process.env.WEB_APP_URL || 'https://flashcard-app-tluu.onrender.com';

let isPolling = false;
let lastUpdateId = 0;

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
      [{ text: "📱 FlashCards Ilovasini ochish", web_app: { url } }],
      [{ text: "📚 So'zlar ro'yxati" }, { text: "📊 Statistika" }],
      [{ text: "🗑 So'zni o'chirish" }]
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
    const total = getWordCount();
    const welcome = `👋 <b>Assalomu alaykum!</b>\n\n` +
      `Bu bot sizning <b>FlashCards</b> ilovangiz bilan bitta umumiy serverda 24/7 ishlaydi.\n\n` +
      `📱 <b>Telegram ichida ilovani ochish:</b>\n` +
      `Pastdagi <b>"📱 FlashCards Ilovasini ochish"</b> tugmasi yoki ekranning chap pastki burchagidagi Menyu orqali ilovani to'g'ridan-to'g'ri Telegram ichida ochishingiz mumkin!\n\n` +
      `🔄 <b>To'liq sinxron:</b>\n` +
      `Siz bu yerda so'z qo'shsangiz, sayt va Telegram ilovasida ham <b>bir xil darhol ishlaydi</b>.\n\n` +
      `📝 <b>So'z qo'shish qulay va oson:</b>\n` +
      `• <code>apple olma</code>\n` +
      `• <code>apple - olma</code>\n` +
      `• Ikki qatorda:\n<code>apple\nolma</code>\n` +
      `• Bir nechta so'z:\n<code>apple - olma\nbook - kitob</code>\n\n` +
      `🗑 <b>So'zni o'chirish:</b>\n` +
      `• <code>/delete apple</code>\n` +
      `• Yoki pastdagi "🗑 So'zni o'chirish" tugmasini bosing\n\n` +
      `📊 Jami bazadagi so'zlar: <b>${total} ta</b>`;

    await sendMessage(chatId, welcome, {
      reply_markup: getMainKeyboard()
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
    await sendMessage(chatId, `📊 Hozirda bazada jami: <b>${total} ta</b> so'z mavjud.\n\n` +
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
export async function setupBotMenuButton(serverUrl = WEB_APP_URL) {
  const url = (serverUrl || WEB_APP_URL).replace(/\/$/, '');
  const res = await telegramApi('setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text: '📱 FlashCards',
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
    // Also configure Menu Button
    await setupBotMenuButton(serverUrl);
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
