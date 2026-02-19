const { buildPrayerKeyboard } = require('../keyboards/prayerKeyboard');
const { getOrCreatePrayerLog } = require('../services/prayerService');
const { getTodayDate } = require('../services/ramadanService');
const { upsertTelegramUser } = require('../services/userService');
const { getTelegramIdentity, safeEditMessageText } = require('../utils/telegram');
const env = require('../config/env');

const PRAYERS = [
  { key: 'bomdod', label: 'Bomdod', apiKey: 'Fajr' },
  { key: 'peshin', label: 'Peshin', apiKey: 'Dhuhr' },
  { key: 'asr', label: 'Asr', apiKey: 'Asr' },
  { key: 'shom', label: 'Shom', apiKey: 'Maghrib' },
  { key: 'xufton', label: 'Xufton', apiKey: 'Isha' }
];

function getNowMinutesTashkent() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: env.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const [hourText, minuteText] = formatter.format(now).split(':');
  return Number(hourText) * 60 + Number(minuteText);
}

function parseTimeToMinutes(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const clock = value.split(' ')[0];
  const [hourText, minuteText] = clock.split(':');

  if (!hourText || !minuteText) {
    return null;
  }

  return Number(hourText) * 60 + Number(minuteText);
}

function getPrayerStartMinutes(prayerKey, timings) {
  const prayerTimeMap = {
    bomdod: timings.fajr,
    peshin: timings.dhuhr,
    asr: timings.asr,
    shom: timings.maghrib,
    xufton: timings.isha
  };

  return parseTimeToMinutes(prayerTimeMap[prayerKey]);
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
  startDate.setUTCDate(startDate.getUTCDate() + 29);
  return startDate.toISOString().slice(0, 10);
}

function isWithinRamadanRange(dateStr) {
  return dateStr >= env.ramadanStart && dateStr <= getRamadanEndDate();
}

async function fetchPrayerTimings(date) {
  const shiftDays = Number(process.env.RAMADAN_TIMETABLE_SHIFT_DAYS || 0);
  const sourceDate = shiftDate(date, shiftDays);

  const [yearText, monthText] = sourceDate.split('-');
  const yearNumber = Number(yearText);
  const monthNumber = Number(monthText);

  const fallback = {
    date,
    fajr: '--:--',
    dhuhr: '--:--',
    asr: '--:--',
    maghrib: '--:--',
    isha: '--:--',
    saharlik: '--:--',
    iftorlik: '--:--'
  };

  if (!isWithinRamadanRange(date)) {
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

    const fajr = (timings.Fajr || '--:--').split(' ')[0];
    const dhuhr = (timings.Dhuhr || '--:--').split(' ')[0];
    const asr = (timings.Asr || '--:--').split(' ')[0];
    const maghrib = (timings.Maghrib || '--:--').split(' ')[0];
    const isha = (timings.Isha || '--:--').split(' ')[0];

    return {
      date,
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

function buildTimeState(timings) {
  const nowMinutes = getNowMinutesTashkent();
  const lowerMap = {
    Fajr: timings.fajr,
    Dhuhr: timings.dhuhr,
    Asr: timings.asr,
    Maghrib: timings.maghrib,
    Isha: timings.isha
  };

  const prayerMinutes = PRAYERS.map((prayer) => parseTimeToMinutes(lowerMap[prayer.apiKey]));
  const activeMap = new Map();
  const passedMap = new Map();

  let activeIndex = -1;

  for (let i = 0; i < prayerMinutes.length; i += 1) {
    const current = prayerMinutes[i];
    const next = prayerMinutes[i + 1] ?? (24 * 60 + 1);

    if (typeof current === 'number' && nowMinutes >= current && nowMinutes < next) {
      activeIndex = i;
      break;
    }
  }

  for (let i = 0; i < PRAYERS.length; i += 1) {
    const prayer = PRAYERS[i];
    const minute = prayerMinutes[i];

    if (typeof minute !== 'number') {
      activeMap.set(prayer.key, false);
      passedMap.set(prayer.key, false);
      continue;
    }

    const isActive = i === activeIndex;
    const isPassed = nowMinutes >= minute && i !== activeIndex;

    activeMap.set(prayer.key, isActive);
    passedMap.set(prayer.key, isPassed);
  }

  return { activeMap, passedMap };
}

function prayerLineIcon(prayerKey, prayerLog, activeMap, passedMap) {
  if (prayerLog.prayers[prayerKey]) {
    return '🟢';
  }

  if (activeMap.get(prayerKey)) {
    return '🟡';
  }

  if (passedMap.get(prayerKey)) {
    return '⚪';
  }

  return '';
}

function countCompleted(prayerLog) {
  return PRAYERS.filter((prayer) => prayerLog.prayers[prayer.key]).length;
}

function getPrayerTimeByKey(prayer, timings) {
  if (prayer.apiKey === 'Fajr') {
    return timings.fajr;
  }

  if (prayer.apiKey === 'Dhuhr') {
    return timings.dhuhr;
  }

  if (prayer.apiKey === 'Asr') {
    return timings.asr;
  }

  if (prayer.apiKey === 'Maghrib') {
    return timings.maghrib;
  }

  if (prayer.apiKey === 'Isha') {
    return timings.isha;
  }

  return '--:--';
}

function buildPrayerText(prayerLog, state, timings, uiState = {}) {
  if (prayerLog.isClosed) {
    return [
      '🔒 Bugungi kun yopilgan.',
      'Namozlarni o‘zgartirib bo‘lmaydi.'
    ].join('\n');
  }

  const lines = ['📿 Bugungi namozlar', ''];

  for (const prayer of PRAYERS) {
    const icon = prayerLineIcon(prayer.key, prayerLog, state.activeMap, state.passedMap);
    const time = getPrayerTimeByKey(prayer, timings);
    lines.push(icon ? `${icon} ${prayer.label} — ${time}` : `${prayer.label} — ${time}`);
  }

  const completedCount = countCompleted(prayerLog);
  lines.push('', `(${completedCount}/5 bajarildi)`);

  if (uiState.toggleConfirmPrayer) {
    lines.push(
      '',
      '⚠️ Bu namoz allaqachon belgilangan.',
      'Ortga qaytarmoqchimisiz?'
    );
  }

  if (completedCount === 5) {
    lines.push('', '🌙 Kunni yakunlamoqchimisiz?');
  }

  return lines.join('\n');
}

async function buildPrayerView(prayerLog, date, uiState = {}) {
  const timings = await fetchPrayerTimings(date);
  const timeState = buildTimeState(timings);
  const completedCount = countCompleted(prayerLog);

  return {
    text: buildPrayerText(prayerLog, timeState, timings, uiState),
    keyboard: prayerLog.isClosed
      ? undefined
      : buildPrayerKeyboard(date, {
          isClosed: false,
          toggleConfirmPrayer: uiState.toggleConfirmPrayer || null,
          showCloseActions: completedCount === 5
        })
  };
}

async function handlePrayerCommand(ctx) {
  const identity = getTelegramIdentity(ctx.from);
  const user = await upsertTelegramUser(identity);
  const today = getTodayDate();

  const prayerLog = await getOrCreatePrayerLog(user._id, today);
  const view = await buildPrayerView(prayerLog, today);
  await ctx.reply(view.text, view.keyboard);
}

async function handlePrayerCallback(ctx) {
  const parts = ctx.callbackQuery.data.split(':');
  const [prefixA, prefixB, date, action, arg1, arg2] = parts;
  const callbackPrefix = `${prefixA}:${prefixB}`;

  if (callbackPrefix !== 'prayer:set') {
    return;
  }

  const today = getTodayDate();
  if (date !== today) {
    await ctx.answerCbQuery('Faqat bugungi kunni tahrirlash mumkin.', { show_alert: true });
    return;
  }

  const identity = getTelegramIdentity(ctx.from);
  const user = await upsertTelegramUser(identity);

  const prayerLog = await getOrCreatePrayerLog(user._id, date);

  if (action === 'closed') {
    await ctx.answerCbQuery('Bugungi kun yakunlangan. Tahrirlab bo‘lmaydi.', {
      show_alert: true
    });
    return;
  }

  if (prayerLog.isClosed && action !== 'close') {
    await ctx.answerCbQuery('Bugungi kun yakunlangan. Tahrirlash yopilgan.', {
      show_alert: true
    });
    const lockedView = await buildPrayerView(prayerLog, date);
    await safeEditMessageText(ctx, lockedView.text, lockedView.keyboard);
    return;
  }

  if (action === 'mark') {
    const prayerKey = arg1;
    if (!PRAYERS.some((prayer) => prayer.key === prayerKey)) {
      await ctx.answerCbQuery('Noto‘g‘ri namoz turi.');
      return;
    }

    if (prayerLog.prayers[prayerKey]) {
      const confirmView = await buildPrayerView(prayerLog, date, {
        toggleConfirmPrayer: prayerKey
      });

      await ctx.answerCbQuery('Tasdiqlash kerak');
      await safeEditMessageText(ctx, confirmView.text, confirmView.keyboard);
      return;
    }

    const timings = await fetchPrayerTimings(date);
    const prayerStartMinutes = getPrayerStartMinutes(prayerKey, timings);
    const nowMinutes = getNowMinutesTashkent();

    if (typeof prayerStartMinutes !== 'number' || nowMinutes < prayerStartMinutes) {
      await ctx.answerCbQuery('Hali namoz vaqti kelmadi.', { show_alert: true });
      return;
    }

    prayerLog.prayers[prayerKey] = true;
    await prayerLog.save();

    const updatedView = await buildPrayerView(prayerLog, date);
    await ctx.answerCbQuery('Belgilandi ✅');
    await safeEditMessageText(ctx, updatedView.text, updatedView.keyboard);
    return;
  }

  if (action === 'toggle') {
    const prayerKey = arg1;
    const decision = arg2;
    if (!PRAYERS.some((prayer) => prayer.key === prayerKey)) {
      await ctx.answerCbQuery('Noto‘g‘ri namoz turi.');
      return;
    }

    if (decision === 'yes') {
      prayerLog.prayers[prayerKey] = false;
      await prayerLog.save();
      await ctx.answerCbQuery('Belgi qaytarildi');
    } else {
      await ctx.answerCbQuery('Bekor qilindi');
    }

    const updatedView = await buildPrayerView(prayerLog, date);
    await safeEditMessageText(ctx, updatedView.text, updatedView.keyboard);
    return;
  }

  if (action === 'close') {
    const decision = arg1;
    if (decision === 'yes') {
      const completedCount = countCompleted(prayerLog);
      if (completedCount !== 5) {
        await ctx.answerCbQuery('Avval 5 ta namozni yakunlang.', { show_alert: true });
      } else {
        prayerLog.isClosed = true;
        await prayerLog.save();
        await ctx.answerCbQuery('✅ Kun yopildi.');
      }
    } else {
      await ctx.answerCbQuery('Kun ochiq qoldi.');
    }

    const updatedView = await buildPrayerView(prayerLog, date);
    await safeEditMessageText(ctx, updatedView.text, updatedView.keyboard);
    return;
  }

  await ctx.answerCbQuery('Noma’lum amal');
}

module.exports = {
  handlePrayerCommand,
  handlePrayerCallback
};
