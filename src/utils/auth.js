const crypto = require('crypto');
const env = require('../config/env');

/**
 * Generates a HMAC-SHA256 hash for Telegram user data,
 * compatible with the Telegram Login Widget verification logic.
 */
function generateTelegramHash(data) {
  const token = env.botToken;
  if (!token) {
    throw new Error('BOT_TOKEN is missing in env');
  }

  // Telegram data check string construction
  // 1. Sort keys alphabetically
  // 2. Format as key=value join with \n
  const { hash, ...rest } = data;
  const dataCheckString = Object.entries(rest)
    .filter(([_, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto.createHash('sha256').update(token).digest();
  const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  return hmac;
}

module.exports = {
  generateTelegramHash
};
