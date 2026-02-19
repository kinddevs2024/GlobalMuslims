export const PRAYER_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

export type PrayerKey = (typeof PRAYER_KEYS)[number];

export const RAMADAN_KEYS = ['fastCompleted', 'taraweeh', 'quranReading'] as const;

export type RamadanKey = (typeof RAMADAN_KEYS)[number];
