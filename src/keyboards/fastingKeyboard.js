const { Markup } = require('telegraf');
const { CALLBACK_PREFIX } = require('../config/constants');

function buildFastingIntentKeyboard(date) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('Ha', `${CALLBACK_PREFIX.FAST_INTENT}:${date}:yes`),
      Markup.button.callback('Yo‘q', `${CALLBACK_PREFIX.FAST_INTENT}:${date}:no`)
    ]
  ]);
}

function buildFastingResultKeyboard(date) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('Ha', `${CALLBACK_PREFIX.FAST_RESULT}:${date}:yes`),
      Markup.button.callback('Yo‘q', `${CALLBACK_PREFIX.FAST_RESULT}:${date}:no`)
    ]
  ]);
}

module.exports = {
  buildFastingIntentKeyboard,
  buildFastingResultKeyboard
};
