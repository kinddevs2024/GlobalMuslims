const cron = require('node-cron');
const env = require('../config/env');
const logger = require('../config/logger');
const RamadanDay = require('../models/RamadanDay');
const { listReminderUsers, listAllUsers } = require('../services/userService');
const {
  getTodayDate,
  addDays,
  ensureRamadanDay,
  getRamadanState
} = require('../services/ramadanService');
const { FASTING_STATUSES } = require('../config/constants');
const {
  buildFastingIntentKeyboard,
  buildFastingResultKeyboard
} = require('../keyboards/fastingKeyboard');

const CRON_FAJR = process.env.FAJR_CRON || '45 4 * * *';
const CRON_MAGHRIB = process.env.MAGHRIB_CRON || '30 18 * * *';
const CRON_MISSED = process.env.MISSED_CHECK_CRON || '5 0 * * *';

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

async function sendReminder(bot, type) {
  const today = getTodayDate();
  const state = getRamadanState(today);

  if (!state.isActive) {
    logger.info({ today, type }, 'Ramadan inactive, reminder skipped');
    return;
  }

  const timings = await fetchPrayerTimings(today);
  const shouldSend = shouldSendReminderNow(type, timings);

  if (!shouldSend.allowed) {
    logger.info(
      { type, today, nowMinutes: shouldSend.nowMinutes, thresholdMinutes: shouldSend.thresholdMinutes },
      'Reminder skipped: prayer time not reached yet'
    );
    return;
  }

  const users = await listReminderUsers();
  const text =
    type === 'fajr'
      ? 'Bugungi ro‘zaga niyat qildingizmi?'
      : 'Bugungi ro‘zani to‘liq tutdingizmi?';

  for (const user of users) {
    await ensureRamadanDay(user._id, today);

    const keyboard =
      type === 'fajr'
        ? buildFastingIntentKeyboard(today)
        : buildFastingResultKeyboard(today);

    try {
      await bot.telegram.sendMessage(user.telegramId, text, keyboard);
    } catch (error) {
      logger.error(
        { telegramId: user.telegramId, err: error.message, type },
        'Failed to send fasting reminder'
      );
    }
  }

  logger.info({ count: users.length, type, today }, 'Fasting reminder broadcast finished');
}

function parseClockToMinutes(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const [hourText, minuteText] = value.split(' ')[0].split(':');
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

async function fetchPrayerTimings(date) {
  if (!isWithinRamadanRange(date)) {
    return {};
  }

  const shiftDays = Number(process.env.RAMADAN_TIMETABLE_SHIFT_DAYS || 0);
  const sourceDate = shiftDate(date, shiftDays);

  const [yearText, monthText] = sourceDate.split('-');
  const yearNumber = Number(yearText);
  const monthNumber = Number(monthText);

  const url = `https://api.aladhan.com/v1/calendarByCity/${yearNumber}/${monthNumber}?city=Tashkent&country=Uzbekistan&method=2&timezonestring=${encodeURIComponent(env.timezone)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return {};
    }

    const json = await response.json();
    const rows = Array.isArray(json?.data) ? json.data : [];
    const target = rows.find((row) => row?.date?.gregorian?.date === toAladhanDate(sourceDate));
    const timings = target?.timings || {};

    return {
      fajr: (timings.Fajr || '--:--').split(' ')[0],
      maghrib: (timings.Maghrib || '--:--').split(' ')[0]
    };
  } catch (_error) {
    return {};
  }
}

function shouldSendReminderNow(type, timings) {
  const nowMinutes = getNowMinutesInTimezone();
  const thresholdMinutes =
    type === 'fajr'
      ? parseClockToMinutes(timings.fajr)
      : parseClockToMinutes(timings.maghrib);

  if (typeof thresholdMinutes !== 'number') {
    return {
      allowed: false,
      nowMinutes,
      thresholdMinutes: null
    };
  }

  return {
    allowed: nowMinutes >= thresholdMinutes,
    nowMinutes,
    thresholdMinutes
  };
}

async function syncYesterdayAndTodayRamadanDays() {
  const today = getTodayDate();
  const yesterday = addDays(today, -1);

  const yesterdayState = getRamadanState(yesterday);
  const todayState = getRamadanState(today);

  let modifiedCount = 0;
  if (yesterdayState.isActive) {
    const result = await RamadanDay.updateMany(
      { date: yesterday, status: FASTING_STATUSES.PENDING },
      { $set: { status: FASTING_STATUSES.MISSED } }
    );
    modifiedCount = result.modifiedCount || 0;
  }

  let createdTodayCount = 0;
  if (todayState.isActive) {
    const users = await listAllUsers();

    for (const user of users) {
      const day = await ensureRamadanDay(user._id, today);
      if (day) {
        createdTodayCount += 1;
      }
    }
  }

  return {
    yesterday,
    today,
    modifiedCount,
    createdTodayCount
  };
}

function startScheduler(bot) {
  syncYesterdayAndTodayRamadanDays()
    .then((result) => {
      logger.info(result, 'Startup Ramadan day sync completed');
    })
    .catch((error) => {
      logger.error({ err: error.message }, 'Startup Ramadan day sync failed');
    });

  cron.schedule(
    CRON_FAJR,
    async () => {
      await sendReminder(bot, 'fajr');
    },
    { timezone: env.timezone }
  );

  cron.schedule(
    CRON_MAGHRIB,
    async () => {
      await sendReminder(bot, 'maghrib');
    },
    { timezone: env.timezone }
  );

  cron.schedule(
    CRON_MISSED,
    async () => {
      const result = await syncYesterdayAndTodayRamadanDays();
      logger.info(result, '00:05 fasting sync completed');
    },
    { timezone: env.timezone }
  );

  logger.info(
    {
      timezone: env.timezone,
      CRON_FAJR,
      CRON_MAGHRIB,
      CRON_MISSED
    },
    'Scheduler started'
  );
}

module.exports = {
  startScheduler
};
