const { getTelegramIdentity } = require('../utils/telegram');
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
