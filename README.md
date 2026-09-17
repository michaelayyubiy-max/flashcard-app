# 📚 FlashCards — So'z Yodlash Ilovasi + Telegram Bot

SuperMiya uslubidagi shaxsiy so'z yodlash va takrorlash ilovasi, Telegram bot (@flashcardsuzbot) va avtomatik bulutli sinxronizatsiya.

## 🚀 Render.com ga Deploy qilish

1. GitHub'da yangi repozitoriy oching va kodni yuklang:
```bash
git remote add origin https://github.com/<SIZNING_GITHUB>/flashcard-app.git
git branch -M main
git push -u origin main
```

2. [Render Dashboard](https://dashboard.render.com/) ga kiring.
3. **"New +"** ➔ **"Web Service"** ni tanlang.
4. Repozitoriyangizni ulang va quyidagi sozlamalarni kiriting:
   - **Name**: `flashcards-app`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `BOT_TOKEN`: `8877215841:AAFtI7g99tYjJaEc0_DaSmF_3r5vh7yjwO8`

5. **"Deploy Web Service"** tugmasini bosing.

Deploy tugagach, sizga bepul `https://flashcards-app.onrender.com` domeni beriladi. Sayt va Telegram Bot 24/7 internetda ishlaydi!
