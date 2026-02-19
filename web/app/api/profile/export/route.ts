import { NextRequest } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import { DailyPrayerLog, RamadanLog, StatisticsCache } from '@/lib/mongoModels';
import { requireAuth } from '@/lib/auth';
import { json } from '@/lib/http';

export async function GET(request: NextRequest) {
    const user = await requireAuth(request);
    if (!user) {
        return json({ ok: false, message: 'Unauthorized' }, 401);
    }

    await connectMongo();

    const [prayers, ramadan, statsCache] = await Promise.all([
        DailyPrayerLog.find({ userId: user.id }).sort({ date: 1 }).lean(),
        RamadanLog.find({ userId: user.id }).sort({ date: 1 }).lean(),
        StatisticsCache.findOne({ userId: user.id }).lean()
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
