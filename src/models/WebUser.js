const { Schema, model } = require('mongoose');

const webUserSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, unique: true, index: true, lowercase: true, trim: true, sparse: true },
        password: { type: String },
        telegramId: { type: String, unique: true, index: true, sparse: true },
        username: { type: String, index: true, sparse: true },
        image: { type: String },
        authCode: { type: String },
        authCodeExpires: { type: Date },
        authStep: { type: String, default: null },
        createdAt: { type: Date, default: Date.now }
    },
    { versionKey: false }
);

// We use 'web_users' collection to match the Web module
module.exports = model('WebUser', webUserSchema, 'web_users');
