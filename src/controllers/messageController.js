const WebUser = require('../models/WebUser');
const bcrypt = require('bcryptjs');

async function handleTextMessage(ctx) {
  const text = (ctx.message?.text || '').trim();

  if (!text || text.startsWith('/')) {
    return;
  }

  const telegramId = String(ctx.from.id);
  const user = await WebUser.findOne({ telegramId });

  if (user && user.authStep === 'awaiting_password') {
    if (text.length < 8) {
      await ctx.reply('⚠️ Parol kamida 8 ta belgidan iborat bo‘lishi kerak. Qayta urinib ko‘ring:');
      return;
    }

    const hashedPassword = await bcrypt.hash(text, 10);
    user.password = hashedPassword;
    user.authStep = null;
    await user.save();

    await ctx.reply(
      [
        '✅ Parolingiz muvaffaqiyatli saqlandi!',
        '',
        'Endi saytga o‘tishingiz va o‘z @username (yoki Telegram ID) hamda ushbu parol orqali kirishingiz mumkin.',
        '',
        '🔗 Sayt manzili: http://localhost:3000'
      ].join('\n')
    );
    return;
  }

  await ctx.reply(
    [
      'Xabaringiz qabul qilindi ✅',
      '',
      'Quyidagi buyruqlardan foydalaning:',
      '/prayer - Bugungi namozlar holati',
      '/calendar - Ramadan kalendari',
      '/statistika - Namoz va roza statistikasi'
    ].join('\n')
  );
}

module.exports = {
  handleTextMessage
};
