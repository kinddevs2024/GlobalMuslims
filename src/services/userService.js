const User = require('../models/User');

async function upsertTelegramUser(identity) {
  return User.findOneAndUpdate(
    { telegramId: identity.telegramId },
    {
      $set: { username: identity.username },
      $setOnInsert: {
        city: 'Toshkent',
        remindersEnabled: true,
        createdAt: new Date()
      }
    },
    { new: true, upsert: true }
  );
}

async function listReminderUsers() {
  return User.find({ remindersEnabled: true }).select('_id telegramId').lean();
}

async function listAllUsers() {
  return User.find({}).select('_id telegramId remindersEnabled').lean();
}

module.exports = {
  upsertTelegramUser,
  listReminderUsers,
  listAllUsers
};
