const RamadanDay = require('../models/RamadanDay');
const {
  FASTING_STATUSES,
  RAMADAN_TOTAL_DAYS
} = require('../config/constants');
const {
  addDays,
  getTodayDate,
  getRamadanState,
  ensureRamadanDay,
  updateTodayStatus
} = require('../services/ramadanService');
const env = require('../config/env');
const {
  buildCalendarKeyboard,
  buildDayDetailKeyboard
} = require('../keyboards/calendarKeyboard');
const { safeEditMessageText } = require('../utils/telegram');
const { upsertTelegramUser } = require('../services/userService');
const { getTelegramIdentity } = require('../utils/telegram');

function buildCalendarText(todayDayNumber, isActive) {
  const lines = ['🗓 Ramazon kalendari'];

  if (isActive) {
    lines.push(`Bugun: ${todayDayNumber}-kun`);
  } else {
    lines.push('Ramazon faol emas');
  }

  lines.push('', 'Belgilar:', '✅ tutildi', '❌ tutmadi', '🟡 bugun', '🔒 kelgusi');

  return lines.join('\n');
}

function normalizeStatus(value) {
  if (value === 'completed') {
    return 'completed';
  }

  if (value === 'missed') {
    return 'missed';
  }

  return 'pending';
}

function getStatusEmoji(status, isToday, isFuture) {
  if (isFuture) {
    return '🔒';
  }

  if (isToday) {
    return '🟡';
  }

  if (status === 'completed') {
    return '✅';
  }

  if (status === 'missed' || status === 'pending') {
    return '❌';
  }

  return '❌';
}

async function fetchFreshRamadanStatusMap(userId) {
  const rows = await RamadanDay.find({ userId })
    .select('dayNumber status')
    .lean();

  return new Map(rows.map((row) => [row.dayNumber, normalizeStatus(row.status)]));
}

async function buildCalendarView(userId) {
  const today = getTodayDate();
  const state = getRamadanState(today);
  const statusMap = await fetchFreshRamadanStatusMap(userId);

  const days = [];
  for (let dayNumber = 1; dayNumber <= RAMADAN_TOTAL_DAYS; dayNumber += 1) {
    const isFuture = !state.isFinished && dayNumber > state.dayNumber;
    const isToday = state.isActive && dayNumber === state.dayNumber;
    const status = statusMap.get(dayNumber) || 'pending';

    days.push({
      dayNumber,
      emoji: getStatusEmoji(status, isToday, isFuture),
      callbackData: isFuture
        ? 'locked'
        : isToday
          ? 'calendar:day:today'
          : `calendar:past:${dayNumber}`
    });
  }

  return {
    text: buildCalendarText(state.dayNumber, state.isActive),
    keyboard: buildCalendarKeyboard(days),
    state
  };
}

function toAladhanDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}-${month}-${year}`;
}

function shiftDate(dateStr, days) {
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function getRamadanEndDate() {
  const startDate = new Date(`${env.ramadanStart}T00:00:00.000Z`);
  startDate.setUTCDate(startDate.getUTCDate() + (RAMADAN_TOTAL_DAYS - 1));
  return startDate.toISOString().slice(0, 10);
}

function isWithinRamadanRange(dateStr) {
  return dateStr >= env.ramadanStart && dateStr <= getRamadanEndDate();
}

function formatUzbekDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const monthNames = [
    'Yanvar',
    'Fevral',
    'Mart',
    'Aprel',
    'May',
    'Iyun',
    'Iyul',
    'Avgust',
    'Sentabr',
    'Oktabr',
    'Noyabr',
    'Dekabr'
  ];

  return `${day}-${monthNames[month - 1]} ${year}`;
}

function getClockOnly(value) {
  if (!value || typeof value !== 'string') {
    return '--:--';
  }

  return value.split(' ')[0];
}

function parseClockToMinutes(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const [hourText, minuteText] = value.split(':');
  if (!hourText || !minuteText) {
    return null;
  }

  return Number(hourText) * 60 + Number(minuteText);
}

function getNowMinutesInTimezone() {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: env.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const [hourText, minuteText] = formatter.format(new Date()).split(':');
  return Number(hourText) * 60 + Number(minuteText);
}

async function fetchPrayerTimes(dateStr) {
  const shiftDays = Number(process.env.RAMADAN_TIMETABLE_SHIFT_DAYS || 0);
  const sourceDate = shiftDate(dateStr, shiftDays);

  const [yearText, monthText] = sourceDate.split('-');
  const monthNumber = Number(monthText);
  const yearNumber = Number(yearText);

  const fallback = {
    date: dateStr,
    fajr: '--:--',
    dhuhr: '--:--',
    asr: '--:--',
    maghrib: '--:--',
    isha: '--:--',
    saharlik: '--:--',
    iftorlik: '--:--'
  };

  if (!isWithinRamadanRange(dateStr)) {
    return fallback;
  }

  const url = `https://api.aladhan.com/v1/calendarByCity/${yearNumber}/${monthNumber}?city=Tashkent&country=Uzbekistan&method=2&timezonestring=${encodeURIComponent(env.timezone)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return fallback;
    }

    const json = await response.json();
    const rows = Array.isArray(json?.data) ? json.data : [];
    const target = rows.find((row) => row?.date?.gregorian?.date === toAladhanDate(sourceDate));
    const timings = target?.timings || {};

    const fajr = getClockOnly(timings.Fajr);
    const dhuhr = getClockOnly(timings.Dhuhr);
    const asr = getClockOnly(timings.Asr);
    const maghrib = getClockOnly(timings.Maghrib);
    const isha = getClockOnly(timings.Isha);

    return {
      date: dateStr,
      fajr,
      dhuhr,
      asr,
      maghrib,
      isha,
      saharlik: fajr,
      iftorlik: maghrib
    };
  } catch (_error) {
    return fallback;
  }
}

function toStatusText(status) {
  if (status === FASTING_STATUSES.COMPLETED) {
    return '✅ Tutildi';
  }

  if (status === FASTING_STATUSES.MISSED) {
    return '❌ Tutmadi';
  }

  return '⏳ Kutilmoqda';
}

async function buildDayDetailView(userId, dayNumber) {
  const date = addDays(env.ramadanStart, dayNumber - 1);
  const today = getTodayDate();
  const todayState = getRamadanState(today);
  const isToday = todayState.isActive && dayNumber === todayState.dayNumber;
  const isFuture = !todayState.isFinished && dayNumber > todayState.dayNumber;

  if (isFuture) {
    return null;
  }

  if (isToday) {
    await ensureRamadanDay(userId, today);
  }

  const entry = await RamadanDay.findOne({ userId, dayNumber }).select('status').lean();
  const status = entry?.status || FASTING_STATUSES.PENDING;
  const prayerTimes = await fetchPrayerTimes(date);

  const text = [
    `🌙 Ramazon ${dayNumber}-kuni`,
    '',
    `📅 Sana: ${formatUzbekDate(date)}`,
    '',
    `🌅 Saharlik: ${prayerTimes.saharlik}`,
    `🌇 Iftorlik: ${prayerTimes.iftorlik}`,
    '',
    `Fajr: ${prayerTimes.fajr}`,
    `Dhuhr: ${prayerTimes.dhuhr}`,
    `Asr: ${prayerTimes.asr}`,
    `Maghrib: ${prayerTimes.maghrib}`,
    `Isha: ${prayerTimes.isha}`,
    '',
    'Holat:',
    toStatusText(status)
  ].join('\n');

  return {
    text,
    keyboard: buildDayDetailKeyboard(isToday),
    isToday
  };
}

async function handleCalendarCommand(ctx) {
  const identity = getTelegramIdentity(ctx.from);
  const user = await upsertTelegramUser(identity);

  const view = await buildCalendarView(user._id);
  await ctx.reply(view.text, view.keyboard);
}

async function handleCalendarCallback(ctx) {
  const data = ctx.callbackQuery.data;

  if (data === 'locked') {
    await ctx.answerCbQuery('Kelgusi kunlar bloklangan.', { show_alert: true });
    return;
  }

  const identity = getTelegramIdentity(ctx.from);
  const user = await upsertTelegramUser(identity);

  if (data === 'calendar:back') {
    const view = await buildCalendarView(user._id);
    await ctx.answerCbQuery('Kalendar yangilandi');
    await safeEditMessageText(ctx, view.text, view.keyboard);
    return;
  }

  if (data.startsWith('calendar:past:')) {
    await ctx.answerCbQuery('Oldingi kunlar faqat ko‘rish uchun.', { show_alert: true });
    return;
  }

  if (data === 'calendar:day:today') {
    const today = getTodayDate();
    const state = getRamadanState(today);
    const detailView = await buildDayDetailView(user._id, state.dayNumber);

    await ctx.answerCbQuery('Kun tafsiloti ochildi');
    await safeEditMessageText(ctx, detailView.text, detailView.keyboard);
    return;
  }

  if (data === 'calendar:set:completed' || data === 'calendar:set:missed') {
    const today = getTodayDate();
    const state = getRamadanState(today);

    if (!state.isActive) {
      await ctx.answerCbQuery('Ramazon faol emas.', { show_alert: true });
      return;
    }

    const status =
      data === 'calendar:set:completed'
        ? FASTING_STATUSES.COMPLETED
        : FASTING_STATUSES.MISSED;

    if (status === FASTING_STATUSES.COMPLETED) {
      const prayerTimes = await fetchPrayerTimes(today);
      const fajrMinutes = parseClockToMinutes(prayerTimes.fajr);
      const maghribMinutes = parseClockToMinutes(prayerTimes.maghrib);
      const nowMinutes = getNowMinutesInTimezone();

      const isWithinFastingWindow =
        typeof fajrMinutes === 'number' &&
        typeof maghribMinutes === 'number' &&
        nowMinutes >= fajrMinutes &&
        nowMinutes < maghribMinutes;

      if (!isWithinFastingWindow) {
        await ctx.answerCbQuery('Ro‘za holatini faqat saharlikdan iftorlikgacha belgilash mumkin.', {
          show_alert: true
        });
        return;
      }
    }

    await updateTodayStatus(user._id, status);

    const view = await buildCalendarView(user._id);
    await ctx.answerCbQuery('Holat saqlandi');
    await safeEditMessageText(ctx, view.text, view.keyboard);
    return;
  }

  await ctx.answerCbQuery('Noma’lum amal');
}

module.exports = {
  handleCalendarCommand,
  handleCalendarCallback
};
