import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    const [prayerLogs, ramadanLogs] = await Promise.all([
        prisma.dailyPrayerLog.findMany({
            where: {
                userId: user.id,
                date: {
                    gte: start,
                    lt: end
                }
            }
        }),
        prisma.ramadanLog.findMany({
            where: {
                userId: user.id,
                date: {
                    gte: start,
                    lt: end
                }
            }
        })
    ]);

    const prayer = buildPrayerSummary(prayerLogs, totalDays);
    const ramadan = buildRamadanSummary(ramadanLogs);

    const payload = {
        scope: parsed.data.scope,
        prayer,
        ramadan
    };

    await prisma.statisticsCache.upsert({
        where: { userId: user.id },
        update: {
            weeklyScore: parsed.data.scope === 'weekly' ? prayer.completionRate : undefined,
            monthlyScore: parsed.data.scope === 'monthly' ? prayer.completionRate : undefined,
            yearlyScore: parsed.data.scope === 'yearly' ? prayer.completionRate : undefined
        },
        create: {
            userId: user.id,
            weeklyScore: parsed.data.scope === 'weekly' ? prayer.completionRate : 0,
            monthlyScore: parsed.data.scope === 'monthly' ? prayer.completionRate : 0,
            yearlyScore: parsed.data.scope === 'yearly' ? prayer.completionRate : 0
        }
    });

    return json({ ok: true, data: payload });
}
