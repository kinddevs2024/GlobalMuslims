const { Telegraf } = require('telegraf');
const env = require('./config/env');
const logger = require('./config/logger');
const { CALLBACK_PREFIX } = require('./config/constants');
const { handleStart } = require('./controllers/startController');
const { handlePrayerCommand, handlePrayerCallback } = require('./controllers/prayerController');
const { handleCalendarCommand, handleCalendarCallback } = require('./controllers/calendarController');
const {
  handleStatisticsCommand,
  handleStatisticsCallback
} = require('./controllers/statisticsController');
const { handleTextMessage } = require('./controllers/messageController');
const {
  handleFastingIntentCallback,
  handleFastingResultCallback
} = require('./controllers/fastingController');

const bot = new Telegraf(env.botToken);

bot.catch((error, ctx) => {
  logger.error({ err: error.message, update: ctx.update }, 'Unhandled bot error');
});

bot.start(handleStart);
bot.command('help', handleStart);
bot.command('menu', handleStart);
bot.command('prayer', handlePrayerCommand);
bot.command('calendar', handleCalendarCommand);
bot.command('statistika', handleStatisticsCommand);
bot.on('text', handleTextMessage);

bot.action(new RegExp(`^${CALLBACK_PREFIX.PRAYER}`), handlePrayerCallback);
bot.action(new RegExp(`^${CALLBACK_PREFIX.FAST_INTENT}`), handleFastingIntentCallback);
bot.action(new RegExp(`^${CALLBACK_PREFIX.FAST_RESULT}`), handleFastingResultCallback);
bot.action('locked', handleCalendarCallback);
bot.action(new RegExp(`^${CALLBACK_PREFIX.CALENDAR}`), handleCalendarCallback);
bot.action(new RegExp(`^${CALLBACK_PREFIX.STATS}`), handleStatisticsCallback);

module.exports = bot;
