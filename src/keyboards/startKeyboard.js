const { Markup } = require('telegraf');

function buildDeepLink(botUsername, payload) {
  return `https://t.me/${botUsername}?start=${payload}`;
}

function buildStartKeyboard(botUsername) {
  if (!botUsername) {
    return Markup.inlineKeyboard([
      [Markup.button.switchToCurrentChat('📿 Namoz', '/prayer')],
      [Markup.button.switchToCurrentChat('🌙 Ramazon', '/calendar')],
      [Markup.button.switchToCurrentChat('📊 Statistika', '/statistika')],
      [Markup.button.switchToCurrentChat('⚙️ Sozlash', '/start settings')]
    ]);
  }

  return Markup.inlineKeyboard([
    [Markup.button.url('📿 Namoz', buildDeepLink(botUsername, 'prayer'))],
    [Markup.button.url('🌙 Ramazon', buildDeepLink(botUsername, 'ramadan'))],
    [Markup.button.url('📊 Statistika', buildDeepLink(botUsername, 'statistika'))],
    [Markup.button.url('⚙️ Sozlash', buildDeepLink(botUsername, 'settings'))]
  ]);
}

module.exports = {
  buildStartKeyboard
};
