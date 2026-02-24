const { Markup } = require('telegraf');
const { getTelegramIdentity } = require('../utils/telegram');
const { generateTelegramHash } = require('../utils/auth');
const env = require('../config/env');
const { upsertTelegramUser } = require('../services/userService');
const { buildStartKeyboard } = require('../keyboards/startKeyboard');
const { handlePrayerCommand } = require('./prayerController');
const { handleCalendarCommand } = require('./calendarController');
const { handleStatisticsCommand } = require('./statisticsController');

function buildStartText() {
  return [
      '🌙 Assalomu alaykum!',
      '',
      'Global Muslims botiga xush kelibsiz.',
      '',
      'Bu yerda siz:',
      '📿 Namozlaringizni belgilaysiz',
      '🌙 Ramazon ro‘zangizni kuzatasiz',
      '📊 Oylik va yillik statistikangizni ko‘rasiz',
      '🌅 Saharlik va 🌇 iftorlik vaqtlarini bilasiz',
      '',
      'Boshlash uchun quyidagi tugmalardan birini tanlang:'
  ].join('\n');
}

function buildSettingsText() {
  return [
    '⚙️ Sozlash',
    '',
    'Eslatmalar va profil sozlamalari ushbu bo‘limda boshqariladi.'
  ].join('\n');
}

async function handleStart(ctx) {
  const identity = getTelegramIdentity(ctx.from);
  await upsertTelegramUser(identity);

  const payload = (ctx.startPayload || '').trim().toLowerCase();

  if (payload === 'prayer') {
    await handlePrayerCommand(ctx);
    return;
  }

  if (payload === 'ramadan') {
    await handleCalendarCommand(ctx);
    return;
  }

  if (payload === 'stats' || payload === 'statistika') {
    await handleStatisticsCommand(ctx);
    return;
  }

  if (payload === 'login') {
    const WebUser = require('../models/WebUser');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const telegramId = String(ctx.from.id);
    const name = ctx.from.first_name + (ctx.from.last_name ? ` ${ctx.from.last_name}` : '');

    await WebUser.findOneAndUpdate(
      { telegramId },
      {
        $set: {
          authCode: otp,
          authCodeExpires: expires,
          name, // Update name if it changed
          username: ctx.from.username ? ctx.from.username.toLowerCase() : null
        },
        $setOnInsert: {
          telegramId,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    await ctx.reply(
      [
        '🔐 Veb-saytga kirish uchun kod:',
        '',
        `<code>${otp}</code>`,
        '',
        'Ushbu kodni saytdagi maydonga kiriting. Kod 10 daqiqa davomida amal qiladi.',
        '',
        '⚠️ Hech kimga ushbu kodni bermang!'
      ].join('\n'),
      { parse_mode: 'HTML' }
    );
    return;
  }

  if (payload === 'register') {
    const WebUser = require('../models/WebUser');
    const telegramId = String(ctx.from.id);
    const name = ctx.from.first_name + (ctx.from.last_name ? ` ${ctx.from.last_name}` : '');

    await WebUser.findOneAndUpdate(
      { telegramId },
      {
        $set: {
          authStep: 'awaiting_password',
          name,
          username: ctx.from.username ? ctx.from.username.toLowerCase() : null
        },
        $setOnInsert: {
          telegramId,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    await ctx.reply(
      [
        '🔐 Sayt uchun yangi parol kiriting:',
        '',
        'Parol kamida 8 ta belgidan iborat bo‘lishi kerak.',
        '',
        '⚠️ Ushbu parolni saytga kirishda ishlata olasiz.'
      ].join('\n')
    );
    return;
  }

  const botUsername = ctx.botInfo?.username;
  const keyboard = buildStartKeyboard(botUsername);

  if (payload === 'settings') {
    await ctx.reply(buildSettingsText(), keyboard);
    return;
  }

  await ctx.reply(buildStartText(), keyboard);
}

module.exports = {
  handleStart
};
