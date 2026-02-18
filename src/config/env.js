const dotenv = require('dotenv');

dotenv.config();

const requiredVars = ['BOT_TOKEN', 'MONGODB_URI', 'RAMADAN_START'];

for (const key of requiredVars) {
  if (!process.env[key]) {
    throw new Error(`Environment variable is required: ${key}`);
  }
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  botMode: process.env.BOT_MODE || 'polling',
  port: Number(process.env.PORT || 3002),
  botToken: process.env.BOT_TOKEN,
  mongoUri: process.env.MONGODB_URI,
  webhookDomain: process.env.WEBHOOK_DOMAIN || '',
  webhookPath: process.env.WEBHOOK_PATH || '/telegram/webhook',
  ramadanStart: process.env.RAMADAN_START,
  timezone: process.env.APP_TIMEZONE || 'Asia/Tashkent'
};
