const PrayerLog = require('../models/PrayerLog');
const env = require('../config/env');
const { PRAYER_NAMES } = require('../config/constants');
const {
  MONTHS,
  buildMonthSelectorKeyboard,
  buildMonthSummaryKeyboard,
  buildDayDetailKeyboard,
  buildYearlySummaryKeyboard
} = require('../keyboards/statisticsKeyboard');
const { safeEditMessageText, getTelegramIdentity } = require('../utils/telegram');
const { upsertTelegramUser } = require('../services/userService');
const { formatDate } = require('../utils/date');

function getTodayDate() {
  return formatDate(new Date(), env.timezone);
}

function getCurrentYear() {
  return Number(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: env.timezone,
      year: 'numeric'
    }).format(new Date())
  );
}

function getMonthRange(monthNumber, year, today) {
  const month = Number(monthNumber);
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const monthLastDate = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  const end = monthLastDate < today ? monthLastDate : today;

  return {
    start,
    end,
    isFutureMonth: start > today
  };
}

function formatUzbekDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return `${day}-${MONTHS[month - 1]} ${year}`;
}

function buildYearlySummaryText(year, counters, total) {
  return [
    `📊 ${year}-yil yillik statistikasi`,
    '',
    `Bomdod: ${counters.bomdod}`,
    `Peshin: ${counters.peshin}`,
    `Asr: ${counters.asr}`,
    `Shom: ${counters.shom}`,
    `Xufton: ${counters.xufton}`,
    '',
    `Jami: ${total} ta namoz`
  ].join('\n');
}

function buildMonthSummaryText(monthName, counters, total) {
  return [
    `📊 ${monthName} oyi statistikasi`,
    '',
    `Bomdod: ${counters.bomdod}`,
    `Peshin: ${counters.peshin}`,
    `Asr: ${counters.asr}`,
    `Shom: ${counters.shom}`,
    `Xufton: ${counters.xufton}`,
    '',
    `Jami: ${total} ta namoz`
  ].join('\n');
}

function buildDayDetailText(date, prayers) {
  const lines = [`📅 ${formatUzbekDate(date)}`, ''];

  for (const prayer of PRAYER_NAMES) {
    lines.push(`${prayers[prayer.key] ? '🟢' : '⚪'} ${prayer.label}`);
  }

  return lines.join('\n');
}

async function buildMonthSummaryView(userId, monthNumber) {
  const today = getTodayDate();
  const year = getCurrentYear();
  const range = getMonthRange(monthNumber, year, today);

  const emptyCounters = {
    bomdod: 0,
    peshin: 0,
    asr: 0,
    shom: 0,
    xufton: 0
  };

  if (range.isFutureMonth) {
    return {
      text: buildMonthSummaryText(MONTHS[Number(monthNumber) - 1], emptyCounters, 0),
      keyboard: buildMonthSummaryKeyboard([], monthNumber)
    };
  }

  const logs = await PrayerLog.find({
    userId,
    date: {
      $gte: range.start,
      $lte: range.end
    }
  }).lean();

  const counters = logs.reduce(
    (acc, log) => {
      for (const prayer of PRAYER_NAMES) {
        if (log.prayers?.[prayer.key] === true) {
          acc[prayer.key] += 1;
        }
      }
      return acc;
    },
    { ...emptyCounters }
  );

  const total = Object.values(counters).reduce((sum, value) => sum + value, 0);
  const availableDays = range.end.slice(8, 10);
  const dayCount = Number(availableDays);
  const days = Array.from({ length: dayCount }, (_item, index) => index + 1);

  return {
    text: buildMonthSummaryText(MONTHS[Number(monthNumber) - 1], counters, total),
    keyboard: buildMonthSummaryKeyboard(days, monthNumber)
  };
}

async function buildYearlySummaryView(userId) {
  const year = getCurrentYear();
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  const emptyCounters = {
    bomdod: 0,
    peshin: 0,
    asr: 0,
    shom: 0,
    xufton: 0
  };

  const logs = await PrayerLog.find({
    userId,
    date: {
      $gte: start,
      $lte: end
    }
  }).lean();

  const counters = logs.reduce(
    (acc, log) => {
      for (const prayer of PRAYER_NAMES) {
        if (log.prayers?.[prayer.key] === true) {
          acc[prayer.key] += 1;
        }
      }
      return acc;
    },
    { ...emptyCounters }
  );

  const total = Object.values(counters).reduce((sum, value) => sum + value, 0);

  return {
    text: buildYearlySummaryText(year, counters, total),
    keyboard: buildYearlySummaryKeyboard()
  };
}

async function buildDayDetailView(userId, monthNumber, dayNumber) {
  const today = getTodayDate();
  const year = getCurrentYear();
  const month = String(Number(monthNumber)).padStart(2, '0');
  const day = String(Number(dayNumber)).padStart(2, '0');
  const targetDate = `${year}-${month}-${day}`;

  if (targetDate > today) {
    return null;
  }

  const log = await PrayerLog.findOne({ userId, date: targetDate }).lean();

  const prayers = {
    bomdod: Boolean(log?.prayers?.bomdod),
    peshin: Boolean(log?.prayers?.peshin),
    asr: Boolean(log?.prayers?.asr),
    shom: Boolean(log?.prayers?.shom),
    xufton: Boolean(log?.prayers?.xufton)
  };

  return {
    text: buildDayDetailText(targetDate, prayers),
    keyboard: buildDayDetailKeyboard(month)
  };
}

async function handleStatisticsCommand(ctx) {
  const identity = getTelegramIdentity(ctx.from);
  const user = await upsertTelegramUser(identity);

  const yearlyView = await buildYearlySummaryView(user._id);

  await ctx.reply(yearlyView.text, buildMonthSelectorKeyboard());
}

async function handleStatisticsCallback(ctx) {
  const data = ctx.callbackQuery.data;
  const parts = data.split(':');

  if (parts[0] !== 'stats') {
    return;
  }

  const identity = getTelegramIdentity(ctx.from);
  const user = await upsertTelegramUser(identity);

  if (data === 'stats:back:months') {
    const yearlyView = await buildYearlySummaryView(user._id);
    await ctx.answerCbQuery('Oylar ro‘yxati');
    await safeEditMessageText(
      ctx,
      yearlyView.text,
      buildMonthSelectorKeyboard()
    );
    return;
  }

  if (parts[1] === 'month') {
    const monthNumber = parts[2];
    const view = await buildMonthSummaryView(user._id, monthNumber);

    await ctx.answerCbQuery('Oylik statistika');
    await safeEditMessageText(ctx, view.text, view.keyboard);
    return;
  }

  if (parts[1] === 'day') {
    const monthNumber = parts[2];
    const dayNumber = parts[3];
    const view = await buildDayDetailView(user._id, monthNumber, dayNumber);

    if (!view) {
      await ctx.answerCbQuery('Kelgusi kunni ko‘rib bo‘lmaydi.', { show_alert: true });
      return;
    }

    await ctx.answerCbQuery('Kunlik tafsilot');
    await safeEditMessageText(ctx, view.text, view.keyboard);
    return;
  }

  if (parts[1] === 'back' && parts[2] === 'month') {
    const monthNumber = parts[3];
    const view = await buildMonthSummaryView(user._id, monthNumber);

    await ctx.answerCbQuery('Oylik statistika');
    await safeEditMessageText(ctx, view.text, view.keyboard);
    return;
  }

  await ctx.answerCbQuery('Noma’lum amal');
}

module.exports = {
  handleStatisticsCommand,
  handleStatisticsCallback,
  buildMonthSummaryText,
  buildDayDetailText
};
