const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    telegramId: { type: String, required: true, unique: true, index: true },
    username: { type: String, default: null },
    city: { type: String, default: 'Toshkent' },
    remindersEnabled: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

module.exports = model('User', userSchema);
