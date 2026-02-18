module.exports = {
  PRAYER_NAMES: [
    { key: 'bomdod', label: 'Bomdod' },
    { key: 'peshin', label: 'Peshin' },
    { key: 'asr', label: 'Asr' },
    { key: 'shom', label: 'Shom' },
    { key: 'xufton', label: 'Xufton' }
  ],
  RAMADAN_TOTAL_DAYS: 30,
  FASTING_STATUSES: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    MISSED: 'missed'
  },
  CALLBACK_PREFIX: {
    PRAYER: 'prayer:set',
    FAST_INTENT: 'fast:intent',
    FAST_RESULT: 'fast:result',
    CALENDAR: 'calendar',
    STATS: 'stats'
  }
};
