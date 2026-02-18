const RamadanDay = require('../models/RamadanDay');
const env = require('../config/env');
const { FASTING_STATUSES, RAMADAN_TOTAL_DAYS } = require('../config/constants');
const { dayDiff, formatDate } = require('../utils/date');

function getTodayDate() {
  return formatDate(new Date(), env.timezone);
}

function getRamadanState(date = getTodayDate()) {
  const dayNumber = dayDiff(env.ramadanStart, date) + 1;

  return {
    dayNumber,
    isActive: dayNumber >= 1 && dayNumber <= RAMADAN_TOTAL_DAYS,
    isNotStarted: dayNumber < 1,
    isFinished: dayNumber > RAMADAN_TOTAL_DAYS
  };
}

function addDays(dateStr, days) {
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function ensureRamadanDay(userId, date = getTodayDate()) {
  const state = getRamadanState(date);

  if (!state.isActive) {
    return null;
  }

  return RamadanDay.findOneAndUpdate(
    { userId, date },
    {
      $set: {
        dayNumber: state.dayNumber
      },
      $setOnInsert: {
        status: FASTING_STATUSES.PENDING
      }
    },
    { new: true, upsert: true }
  );
}

async function updateTodayStatus(userId, status) {
  const today = getTodayDate();
  const state = getRamadanState(today);

  if (!state.isActive) {
    throw new Error('Ramadan is not active');
  }

  const ramadanDay = await ensureRamadanDay(userId, today);
  ramadanDay.status = status;
  await ramadanDay.save();

  return ramadanDay;
}

async function markPendingAsMissedForToday() {
  const today = getTodayDate();
  const state = getRamadanState(today);

  if (!state.isActive) {
    return { modifiedCount: 0 };
  }

  const result = await RamadanDay.updateMany(
    { date: today, status: FASTING_STATUSES.PENDING },
    { $set: { status: FASTING_STATUSES.MISSED } }
  );

  return { modifiedCount: result.modifiedCount || 0 };
}

async function getTodayStatusByUser(userId) {
  const today = getTodayDate();
  const state = getRamadanState(today);

  if (!state.isActive) {
    return null;
  }

  return ensureRamadanDay(userId, today);
}

async function getCalendarDays(userId) {
  const today = getTodayDate();
  const stateToday = getRamadanState(today);

  const entries = await RamadanDay.find({ userId }).select('date status').lean();
  const statusMap = new Map(entries.map((item) => [item.date, item.status]));
  const days = [];

  for (let dayNumber = 1; dayNumber <= RAMADAN_TOTAL_DAYS; dayNumber += 1) {
    let emoji = '🔒';
    let callbackData = 'locked';

    if (stateToday.isNotStarted) {
      emoji = '🔒';
      callbackData = 'locked';
    } else if (stateToday.isFinished) {
      const dayDate = addDays(env.ramadanStart, dayNumber - 1);
      const status = statusMap.get(dayDate);
      if (status === FASTING_STATUSES.COMPLETED) {
        emoji = '✅';
      } else if (status === FASTING_STATUSES.MISSED) {
        emoji = '❌';
      } else {
        emoji = '⬜';
      }
      callbackData = `calendar:past:${dayNumber}`;
    } else {
      if (dayNumber < stateToday.dayNumber) {
        const dayDate = addDays(env.ramadanStart, dayNumber - 1);
        const status = statusMap.get(dayDate);
        if (status === FASTING_STATUSES.COMPLETED) {
          emoji = '✅';
        } else if (status === FASTING_STATUSES.MISSED) {
          emoji = '❌';
        } else {
          emoji = '⬜';
        }
        callbackData = `calendar:past:${dayNumber}`;
      } else if (dayNumber === stateToday.dayNumber) {
        emoji = '🟡';
        callbackData = 'calendar:today';
      } else {
        emoji = '🔒';
        callbackData = 'locked';
      }
    }

    days.push({
      dayNumber,
      emoji,
      callbackData
    });
  }

  return {
    days,
    todayDayNumber: stateToday.dayNumber,
    isActive: stateToday.isActive
  };
}

function canEditDate(targetDate) {
  const today = getTodayDate();
  const state = getRamadanState(today);
  return state.isActive && targetDate === today;
}

module.exports = {
  getTodayDate,
  getRamadanState,
  addDays,
  ensureRamadanDay,
  updateTodayStatus,
  markPendingAsMissedForToday,
  getTodayStatusByUser,
  getCalendarDays,
  canEditDate
};
