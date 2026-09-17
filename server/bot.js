import { parseWordsFromText } from './parser.js';
import { addBatchWords, getAllWords, getWordCount, deleteWord } from './db.js';

const BOT_TOKEN = process.env.BOT_TOKEN || '8877215841:AAFtI7g99tYjJaEc0_DaSmF_3r5vh7yjwO8';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

let isPolling = false;
let lastUpdateId = 0;

export async function sendMessage(chatId, text, options = {}) {
  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options.parse_mode || 'HTML',
        ...options
      })
    });
    return await res.json();
  } catch (err) {
    console.error('Failed to send Telegram message:', err.message);
  }
}

async function handleUpdate(update) {
  const message = update.message;
  if (!message || !message.text) return;

  const chatId = message.chat.id;
  const text = message.text.trim();

  // /start or /help
  if (text === '/start' || text === '/help') {
    const total = getWordCount();
    const welcome = `👋 <b>Assalomu alaykum!</b>\n\n` +
      `Bu bot orqali siz <b>FlashCards</b> ilovangizga so'zlarni istalgan formatda tez va oson qo'shishingiz mumkin.\n\n` +
      `📝 <b>So'z qo'shish formatlari:</b>\n` +
      `• <code>apple olma</code> (bo'sh joy bilan)\n` +
      `• <code>apple - olma</code>\n` +
      `• <code>apple : olma</code>\n` +
      `• <code>apple = olma</code>\n` +
      `• Ikki qatorda:\n<code>apple\nolma</code>\n\n` +
      `• Bir vaqtda bir nechta so'z (ro'yxat):\n` +
      `<code>apple - olma\nbanana - banan\ncar - mashina</code>\n\n` +
      `⚡️ <i>Qo'shilgan so'zlar avtomatik tarzda kompyuteringiz va telefoningizdagi ilovada paydo bo'ladi!</i>\n\n` +
      `📊 Hozirgi jami so'zlar: <b>${total} ta</b>\n\n` +
      `📌 <b>Buyruqlar:</b>\n` +
      `/words — Oxirgi so'zlar ro'yxati\n` +
      `/count — Jami so'zlar soni\n` +
      `/delete &lt;so'z&gt; — So'zni o'chirish`;

    await sendMessage(chatId, welcome);
    return;
  }

  // /count
  if (text === '/count') {
    const total = getWordCount();
    await sendMessage(chatId, `📊 Jami so'zlar soni: <b>${total} ta</b>`);
    return;
  }

  // /words or /list
  if (text === '/words' || text === '/list') {
    const words = getAllWords();
    if (words.length === 0) {
      await sendMessage(chatId, `📭 Hozircha birorta ham so'z qo'shilmagan.\nSo'z qo'shish uchun shunchaki <code>word - translation</code> yuboring!`);
      return;
    }

    const lastWords = words.slice(-20).reverse();
    let listText = `📚 <b>Oxirgi so'zlar (jami ${words.length} ta):</b>\n\n`;
    lastWords.forEach((w, idx) => {
      listText += `${idx + 1}. <b>${escapeHtml(w.word)}</b> ➔ ${escapeHtml(w.translation)}\n`;
    });

    if (words.length > 20) {
      listText += `\n<i>... va yana ${words.length - 20} ta so'z ilovangizda bor</i>`;
    }

    await sendMessage(chatId, listText);
    return;
  }

  // /delete <word>
  if (text.startsWith('/delete')) {
    const target = text.replace('/delete', '').trim();
    if (!target) {
      await sendMessage(chatId, `ℹ️ So'zni o'chirish uchun: <code>/delete apple</code> formatida yozing.`);
      return;
    }

    const deleted = deleteWord(target);
    if (deleted) {
      const total = getWordCount();
      await sendMessage(chatId, `🗑 <b>"${escapeHtml(target)}"</b> so'zi o'chirildi.\n📊 Qolgan so'zlar: <b>${total} ta</b>`);
    } else {
      await sendMessage(chatId, `❌ <b>"${escapeHtml(target)}"</b> bazada topilmadi.`);
    }
    return;
  }

  // Parse words from text message
  const parsed = parseWordsFromText(text);

  if (parsed.length === 0) {
    await sendMessage(
      chatId,
      `❓ So'z aniqlanmadi.\n\nIltimos, quyidagi formatlardan birida yuboring:\n` +
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
      `📊 Jami so'zlar: <b>${total} ta</b>`;
    await sendMessage(chatId, reply);
  } else {
    let reply = `✅ <b>${parsed.length} ta</b> so'z muvaffaqiyatli saqlandi!\n\n`;
    parsed.forEach((item, idx) => {
      reply += `${idx + 1}. <b>${escapeHtml(item.word)}</b> ➔ ${escapeHtml(item.translation)}\n`;
    });
    reply += `\n📊 Jami so'zlar: <b>${total} ta</b>`;
    await sendMessage(chatId, reply);
  }
}

export async function startBot() {
  if (isPolling) return;
  isPolling = true;
  console.log('🤖 Telegram Bot (@flashcardsuzbot) ishga tushdi...');

  // Set bot commands
  try {
    await fetch(`${TELEGRAM_API}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: [
          { command: 'start', description: 'Botni ishga tushirish va qo\'llanma' },
          { command: 'words', description: 'Oxirgi qo\'shilgan so\'zlar ro\'yxati' },
          { command: 'count', description: 'Jami so\'zlar soni' },
          { command: 'help', description: 'Qo\'llanma va formatlar' }
        ]
      })
    });
  } catch (e) {
    console.warn('Failed to set bot commands:', e.message);
  }

  // Polling loop with error recovery
  while (isPolling) {
    try {
      const res = await fetch(`${TELEGRAM_API}/getUpdates?offset=${lastUpdateId + 1}&timeout=15`);
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          lastUpdateId = Math.max(lastUpdateId, update.update_id);
          await handleUpdate(update);
        }
      } else if (data.error_code === 409) {
        // Conflict - another instance is polling, wait a bit
        console.warn('409 Conflict: boshqa bot instansiyasi ishlayapti, kutilmoqda...');
        await new Promise(r => setTimeout(r, 5000));
      } else {
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (err) {
      // Network hiccup or pause
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
