import { PRAYER_KEYS } from './constants';

type DailyPrayerLike = {
    date: Date;
    fajr: boolean;
    dhuhr: boolean;
    asr: boolean;
    maghrib: boolean;
    isha: boolean;
};

type RamadanLike = {
    fastCompleted: boolean;
    taraweeh: boolean;
    quranReading: boolean;
};

type PrayerSummary = {
    totalPossible: number;
    completed: number;
    missed: number;
    completionRate: number;
    currentStreak: number;
    longestStreak: number;
    mostMissedPrayerType: string | null;
};

function countCompletedPrayers(log: DailyPrayerLike) {
    return PRAYER_KEYS.reduce((total, key) => total + (log[key] ? 1 : 0), 0);
}

function getDailyCompleted(log: DailyPrayerLike[]) {
    return log
        .slice()
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((entry) => countCompletedPrayers(entry));
}

function calcStreaks(dailyCompleted: number[]) {
    let longestStreak = 0;
    let currentStreak = 0;

    for (const completed of dailyCompleted) {
        if (completed === 5) {
            currentStreak += 1;
            longestStreak = Math.max(longestStreak, currentStreak);
        } else {
            currentStreak = 0;
        }
    }

    return { currentStreak, longestStreak };
}

function findMostMissed(logs: DailyPrayerLike[]) {
    const missedMap: Record<string, number> = {
        fajr: 0,
        dhuhr: 0,
        asr: 0,
        maghrib: 0,
        isha: 0
    };

    for (const log of logs) {
        for (const key of PRAYER_KEYS) {
            if (!log[key]) {
                missedMap[key] += 1;
            }
        }
    }

    const entries = Object.entries(missedMap);
    const [mostMissedKey, mostMissedCount] = entries.reduce((best, current) =>
        current[1] > best[1] ? current : best
    );

    return mostMissedCount > 0 ? mostMissedKey : null;
}

export function buildPrayerSummary(logs: DailyPrayerLike[], totalDays: number): PrayerSummary {
    const totalPossible = totalDays * 5;
    const completed = logs.reduce((sum, log) => sum + countCompletedPrayers(log), 0);
    const missed = Math.max(totalPossible - completed, 0);
    const completionRate = totalPossible === 0 ? 0 : Math.round((completed / totalPossible) * 100);
    const dailyCompleted = getDailyCompleted(logs);
    const { currentStreak, longestStreak } = calcStreaks(dailyCompleted);
    const mostMissedPrayerType = findMostMissed(logs);

    return {
        totalPossible,
        completed,
        missed,
        completionRate,
        currentStreak,
        longestStreak,
        mostMissedPrayerType
    };
}

export function buildRamadanSummary(logs: RamadanLike[]) {
    const fastDays = logs.filter((item) => item.fastCompleted).length;
    const taraweehDays = logs.filter((item) => item.taraweeh).length;
    const quranDays = logs.filter((item) => item.quranReading).length;

    return {
        totalDays: logs.length,
        fastDays,
        taraweehDays,
        quranDays
    };
}
