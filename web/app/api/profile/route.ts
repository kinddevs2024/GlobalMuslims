import { NextRequest } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import { DailyPrayerLog, RamadanLog, StatisticsCache, WebUser } from '@/lib/mongoModels';
import { clearAuthCookie, requireAuth } from '@/lib/auth';
import { json } from '@/lib/http';

export async function DELETE(request: NextRequest) {
    const user = await requireAuth(request);
    if (!user) {
        return json({ ok: false, message: 'Unauthorized' }, 401);
    }

    await connectMongo();
    await Promise.all([
        WebUser.deleteOne({ _id: user.id }),
        DailyPrayerLog.deleteMany({ userId: user.id }),
        RamadanLog.deleteMany({ userId: user.id }),
        StatisticsCache.deleteOne({ userId: user.id })
    ]);

    clearAuthCookie();
    return json({ ok: true });
}
