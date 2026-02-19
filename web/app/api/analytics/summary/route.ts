import { NextRequest } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import { DailyPrayerLog, RamadanLog, StatisticsCache } from '@/lib/mongoModels';
import { json } from '@/lib/http';
import { requireAuth } from '@/lib/auth';
import { analyticsQuerySchema } from '@/lib/validation';
import { buildPrayerSummary, buildRamadanSummary } from '@/lib/statistics';
import { getRangeByScope, getUserDateKey } from '@/lib/date';

function calcTotalDays(scope: 'weekly' | 'monthly' | 'yearly', timezone?: string) {
    if (scope === 'weekly') {
        return 7;
    }

    const today = getUserDateKey(new Date(), timezone);

    if (scope === 'monthly') {
        return today.getUTCDate();
    }

    const startOfYear = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
    const diff = today.getTime() - startOfYear.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

export async function GET(request: NextRequest) {
    const user = await requireAuth(request);
    if (!user) {
        return json({ ok: false, message: 'Unauthorized' }, 401);
    }

    const scope = request.nextUrl.searchParams.get('scope') || 'weekly';
    const timezone = request.nextUrl.searchParams.get('timezone') || undefined;
    const parsed = analyticsQuerySchema.safeParse({ scope, timezone });

    if (!parsed.success) {
        return json({ ok: false, message: 'Invalid query', errors: parsed.error.flatten() }, 400);
    }

    const { start, end } = getRangeByScope(parsed.data.scope, parsed.data.timezone);
    const totalDays = calcTotalDays(parsed.data.scope, parsed.data.timezone);

    await connectMongo();

    const [prayerLogsRaw, ramadanLogsRaw] = await Promise.all([
        DailyPrayerLog.find({
            userId: user.id,
            date: {
                $gte: start,
                $lt: end
            }
        }).lean(),
        RamadanLog.find({
            userId: user.id,
            date: {
                $gte: start,
                $lt: end
            }
        }).lean()
    ]);

    const prayerLogs = prayerLogsRaw.map((item) => ({
        date: item.date,
        fajr: Boolean(item.fajr),
        dhuhr: Boolean(item.dhuhr),
        asr: Boolean(item.asr),
        maghrib: Boolean(item.maghrib),
        isha: Boolean(item.isha)
    }));

    const ramadanLogs = ramadanLogsRaw.map((item) => ({
        fastCompleted: Boolean(item.fastCompleted),
        taraweeh: Boolean(item.taraweeh),
        quranReading: Boolean(item.quranReading)
    }));

    const prayer = buildPrayerSummary(prayerLogs, totalDays);
    const ramadan = buildRamadanSummary(ramadanLogs);

    const payload = {
        scope: parsed.data.scope,
        prayer,
        ramadan
    };

    const cacheUpdate: Record<string, number> = {};
    if (parsed.data.scope === 'weekly') {
        cacheUpdate.weeklyScore = prayer.completionRate;
    }
    if (parsed.data.scope === 'monthly') {
        cacheUpdate.monthlyScore = prayer.completionRate;
    }
    if (parsed.data.scope === 'yearly') {
        cacheUpdate.yearlyScore = prayer.completionRate;
    }

    await StatisticsCache.findOneAndUpdate(
        { userId: user.id },
        {
            $set: cacheUpdate,
            $setOnInsert: { userId: user.id }
        },
        { upsert: true, new: true }
    );

    return json({ ok: true, data: payload });
}
