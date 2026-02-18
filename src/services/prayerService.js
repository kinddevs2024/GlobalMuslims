const PrayerLog = require('../models/PrayerLog');
const { PRAYER_NAMES } = require('../config/constants');

async function getOrCreatePrayerLog(userId, date) {
  const defaultPrayers = {
    bomdod: false,
    peshin: false,
    asr: false,
    shom: false,
    xufton: false
  };

  return PrayerLog.findOneAndUpdate(
    { userId, date },
    {
      $setOnInsert: {
        prayers: defaultPrayers
      }
    },
    { new: true, upsert: true }
  );
}

async function markPrayer(userId, date, prayerKey) {
  const validPrayer = PRAYER_NAMES.some((item) => item.key === prayerKey);
  if (!validPrayer) {
    throw new Error('Invalid prayer key');
  }

  const prayerLog = await getOrCreatePrayerLog(userId, date);

  if (prayerLog.prayers[prayerKey]) {
    return { prayerLog, updated: false };
  }

  prayerLog.prayers[prayerKey] = true;
  await prayerLog.save();

  return { prayerLog, updated: true };
}

function buildPrayerText(prayerLog) {
  const lines = ['📿 Bugungi namozlar:', ''];

  for (const prayer of PRAYER_NAMES) {
    const icon = prayerLog.prayers[prayer.key] ? '✅' : '⬜';
    lines.push(`${icon} ${prayer.label}`);
  }

  lines.push('', 'Legend:', '✅ = belgilangan', '⬜ = belgilanmagan');

  return lines.join('\n');
}

module.exports = {
  getOrCreatePrayerLog,
  markPrayer,
  buildPrayerText
};
