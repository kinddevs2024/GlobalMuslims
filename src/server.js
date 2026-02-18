const express = require('express');
const env = require('./config/env');
const logger = require('./config/logger');
const { connectDatabase } = require('./config/database');
const bot = require('./bot');
const { startScheduler } = require('./scheduler/schedulerService');

async function registerTelegramCommands() {
  await bot.telegram.setMyCommands([
    { command: 'start', description: 'Asosiy menyu' },
    { command: 'prayer', description: 'Bugungi namozlarni belgilash' },
    { command: 'calendar', description: 'Ramazon kalendari' },
    { command: 'statistika', description: 'Namoz statistikasi' },
    { command: 'help', description: 'Yordam va menyu' }
  ]);
}

async function bootstrap() {
  await connectDatabase();
  await registerTelegramCommands();

  const app = express();
  app.use(express.json());

  app.get('/health', (_, res) => {
    res.status(200).json({ ok: true });
  });

  app.use((error, _req, res, _next) => {
    logger.error({ err: error.message }, 'HTTP error');
    res.status(500).json({ ok: false, message: 'Internal server error' });
  });

  if (env.botMode === 'polling') {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });

    app.listen(env.port, () => {
      logger.info({ port: env.port }, 'Server started in polling mode');
    });

    bot
      .launch({ dropPendingUpdates: true })
      .then(() => {
        logger.info('Telegram bot launched in polling mode');
      })
      .catch((error) => {
        logger.error({ err: error.message }, 'Polling launch failed');
      });

    startScheduler(bot);
  } else {
    if (!env.webhookDomain) {
      throw new Error('WEBHOOK_DOMAIN is required in webhook mode');
    }

    if (env.webhookDomain.includes('example.com')) {
      throw new Error('WEBHOOK_DOMAIN must be a real public HTTPS domain, not example.com');
    }

    app.use(env.webhookPath, bot.webhookCallback(env.webhookPath));

    const webhookUrl = `${env.webhookDomain}${env.webhookPath}`;
    await bot.telegram.setWebhook(webhookUrl, {
      drop_pending_updates: true
    });

    startScheduler(bot);

    app.listen(env.port, () => {
      logger.info({ port: env.port, webhookUrl }, 'Server started in webhook mode');
    });
  }

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

bootstrap().catch((error) => {
  logger.fatal({ err: error.message }, 'Fatal startup error');
  process.exit(1);
});
