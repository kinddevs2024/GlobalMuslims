const { Markup } = require('telegraf');

function buildCalendarKeyboard(days) {
  const rows = [];
  let currentRow = [];

  for (const day of days) {
    currentRow.push(Markup.button.callback(`${day.dayNumber} ${day.emoji}`, day.callbackData));

    if (currentRow.length === 7) {
      rows.push(currentRow);
      currentRow = [];
    }
  }

  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  return Markup.inlineKeyboard(rows);
}

function buildDayDetailKeyboard(isToday) {
  const rows = [];

  if (isToday) {
    rows.push([Markup.button.callback('✅ Ro‘za tutdim', 'calendar:set:completed')]);
    rows.push([Markup.button.callback('❌ Ro‘za tutmadim', 'calendar:set:missed')]);
  }

  rows.push([Markup.button.callback('⬅️ Ortga', 'calendar:back')]);

  return Markup.inlineKeyboard(rows);
}

module.exports = {
  buildCalendarKeyboard,
  buildDayDetailKeyboard
};
