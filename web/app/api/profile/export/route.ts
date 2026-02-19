import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { json } from '@/lib/http';

export async function GET(request: NextRequest) {
    const user = await requireAuth(request);
    if (!user) {
        return json({ ok: false, message: 'Unauthorized' }, 401);
    }

    const [prayers, ramadan, statsCache] = await Promise.all([
        prisma.dailyPrayerLog.findMany({
            where: { userId: user.id },
            orderBy: { date: 'asc' }
        }),
        prisma.ramadanLog.findMany({
            where: { userId: user.id },
            orderBy: { date: 'asc' }
        }),
        prisma.statisticsCache.findUnique({
            where: { userId: user.id }
        })
    ]);

    return json({
        ok: true,
        export: {
            user,
            prayers,
            ramadan,
            statsCache,
            exportedAt: new Date().toISOString()
        }
    });
}
