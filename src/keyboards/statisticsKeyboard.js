const { Markup } = require('telegraf');

const MONTHS = [
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

function buildMonthSelectorKeyboard() {
  const rows = [];

  for (let i = 0; i < MONTHS.length; i += 3) {
    const slice = MONTHS.slice(i, i + 3);
    const row = slice.map((name, index) => {
      const monthNumber = String(i + index + 1).padStart(2, '0');
      return Markup.button.callback(name, `stats:month:${monthNumber}`);
    });
    rows.push(row);
  }

  return Markup.inlineKeyboard(rows);
}

function buildMonthSummaryKeyboard(days, monthNumber) {
  const rows = [];
  let row = [];

  for (const day of days) {
    row.push(Markup.button.callback(String(day), `stats:day:${monthNumber}:${String(day).padStart(2, '0')}`));
    if (row.length === 7) {
      rows.push(row);
      row = [];
    }
  }

  if (row.length > 0) {
    rows.push(row);
  }

  rows.push([Markup.button.callback('⬅️ Oylar', 'stats:back:months')]);

  return Markup.inlineKeyboard(rows);
}

function buildDayDetailKeyboard(monthNumber) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('⬅️ Oylik statistika', `stats:back:month:${monthNumber}`)],
    [Markup.button.callback('🗂 Oylar', 'stats:back:months')]
  ]);
}

module.exports = {
  MONTHS,
  buildMonthSelectorKeyboard,
  buildMonthSummaryKeyboard,
  buildDayDetailKeyboard
};
