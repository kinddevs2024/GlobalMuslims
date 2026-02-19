import { mongoose } from './mongo';

const { Schema, model, models, Types } = mongoose;

const webUserSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
        password: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    },
    { versionKey: false }
);

const dailyPrayerLogSchema = new Schema(
    {
        userId: { type: Types.ObjectId, required: true, index: true, ref: 'WebUser' },
        date: { type: Date, required: true, index: true },
        dateKey: { type: String, required: true, index: true },
        fajr: { type: Boolean, default: false },
        dhuhr: { type: Boolean, default: false },
        asr: { type: Boolean, default: false },
        maghrib: { type: Boolean, default: false },
        isha: { type: Boolean, default: false }
    },
    { versionKey: false }
);

dailyPrayerLogSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

const ramadanLogSchema = new Schema(
    {
        userId: { type: Types.ObjectId, required: true, index: true, ref: 'WebUser' },
        date: { type: Date, required: true, index: true },
        dateKey: { type: String, required: true, index: true },
        fastCompleted: { type: Boolean, default: false },
        taraweeh: { type: Boolean, default: false },
        quranReading: { type: Boolean, default: false }
    },
    { versionKey: false }
);

ramadanLogSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

const statisticsCacheSchema = new Schema(
    {
        userId: { type: Types.ObjectId, required: true, unique: true, index: true, ref: 'WebUser' },
        weeklyScore: { type: Number, default: 0 },
        monthlyScore: { type: Number, default: 0 },
        yearlyScore: { type: Number, default: 0 }
    },
    { versionKey: false }
);

export const WebUser = models.WebUser || model('WebUser', webUserSchema, 'web_users');
export const DailyPrayerLog =
    models.DailyPrayerLog || model('DailyPrayerLog', dailyPrayerLogSchema, 'web_daily_prayer_logs');
export const RamadanLog =
    models.RamadanLog || model('RamadanLog', ramadanLogSchema, 'web_ramadan_logs');
export const StatisticsCache =
    models.StatisticsCache || model('StatisticsCache', statisticsCacheSchema, 'web_statistics_cache');
