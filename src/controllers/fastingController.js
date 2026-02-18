const { FASTING_STATUSES } = require('../config/constants');
const {
  canEditDate,
  ensureRamadanDay,
  updateTodayStatus,
  getTodayDate
} = require('../services/ramadanService');
const { upsertTelegramUser } = require('../services/userService');
const { getTelegramIdentity, safeEditMessageText } = require('../utils/telegram');

async function handleFastingIntentCallback(ctx) {
  const [, , date, answer] = ctx.callbackQuery.data.split(':');

  if (!canEditDate(date)) {
    await ctx.answerCbQuery('Oldingi yoki kelgusi kunni tahrirlab bo‘lmaydi.', {
      show_alert: true
    });
    return;
  }

  const identity = getTelegramIdentity(ctx.from);
  const user = await upsertTelegramUser(identity);
  await ensureRamadanDay(user._id, date);

  const message =
    answer === 'yes'
      ? 'Qabul qilindi ✅\nNiyat qilganingiz uchun rahmat.'
      : 'Qabul qilindi.\nBugun niyat qilinmadi deb belgilandi.';

  await ctx.answerCbQuery('Javob qabul qilindi');
  await safeEditMessageText(ctx, message);
}

async function handleFastingResultCallback(ctx) {
  const [, , date, answer] = ctx.callbackQuery.data.split(':');

  const today = getTodayDate();
  if (!canEditDate(date) || date !== today) {
    await ctx.answerCbQuery('Faqat bugungi kunni tahrirlash mumkin.', { show_alert: true });
    return;
  }

  const identity = getTelegramIdentity(ctx.from);
  const user = await upsertTelegramUser(identity);

  const status = answer === 'yes' ? FASTING_STATUSES.COMPLETED : FASTING_STATUSES.MISSED;
  await updateTodayStatus(user._id, status);

  const message =
    status === FASTING_STATUSES.COMPLETED
      ? 'Ajoyib! Bugungi ro‘za: ✅ Tutildi'
      : 'Qabul qilindi. Bugungi ro‘za: ❌ Qoldirildi';

  await ctx.answerCbQuery('Holat yangilandi');
  await safeEditMessageText(ctx, message);
}

module.exports = {
  handleFastingIntentCallback,
  handleFastingResultCallback
};
