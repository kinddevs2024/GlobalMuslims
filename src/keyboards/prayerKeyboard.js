const { Markup } = require('telegraf');
const { CALLBACK_PREFIX } = require('../config/constants');

const PRAYER_BUTTONS = [
  { key: 'bomdod', label: 'Bomdod' },
  { key: 'peshin', label: 'Peshin' },
  { key: 'asr', label: 'Asr' },
  { key: 'shom', label: 'Shom' },
  { key: 'xufton', label: 'Xufton' }
];

function buildPrayerKeyboard(date, options = {}) {
  const {
    isClosed = false,
    toggleConfirmPrayer = null,
    showCloseActions = false
  } = options;

  const rows = PRAYER_BUTTONS.map((prayer) => {
    const callback = isClosed
      ? `${CALLBACK_PREFIX.PRAYER}:${date}:closed`
      : `${CALLBACK_PREFIX.PRAYER}:${date}:mark:${prayer.key}`;

    return [Markup.button.callback(prayer.label, callback)];
  });

  if (toggleConfirmPrayer) {
    rows.push([
      Markup.button.callback(
        'Ha',
        `${CALLBACK_PREFIX.PRAYER}:${date}:toggle:${toggleConfirmPrayer}:yes`
      ),
      Markup.button.callback(
        'Yo‘q',
        `${CALLBACK_PREFIX.PRAYER}:${date}:toggle:${toggleConfirmPrayer}:no`
      )
    ]);
  }

  if (showCloseActions && !isClosed) {
    rows.push([
      Markup.button.callback('✅ Ha', `${CALLBACK_PREFIX.PRAYER}:${date}:close:yes`),
      Markup.button.callback('❌ Yo‘q', `${CALLBACK_PREFIX.PRAYER}:${date}:close:no`)
    ]);
  }

  return Markup.inlineKeyboard(rows);
}

module.exports = {
  buildPrayerKeyboard
};
