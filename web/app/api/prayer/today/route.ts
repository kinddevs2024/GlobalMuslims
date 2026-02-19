import { NextRequest } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import { DailyPrayerLog } from '@/lib/mongoModels';
import { json } from '@/lib/http';
import { requireAuth } from '@/lib/auth';
import { getUserDateKey, toDateKey } from '@/lib/date';
import { prayerUpdateSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
    const user = await requireAuth(request);
    if (!user) {
        return json({ ok: false, message: 'Unauthorized' }, 401);
    }

    const timezone = request.nextUrl.searchParams.get('timezone') || undefined;
    const date = getUserDateKey(new Date(), timezone);
    const dateKey = toDateKey(date);

    await connectMongo();
    const log = await DailyPrayerLog.findOneAndUpdate(
        { userId: user.id, dateKey },
        { $setOnInsert: { userId: user.id, date, dateKey } },
        { upsert: true, new: true }
    ).lean();

    return json({ ok: true, log });
}

export async function PUT(request: NextRequest) {
    const user = await requireAuth(request);
    if (!user) {
        return json({ ok: false, message: 'Unauthorized' }, 401);
    }

    const body = await request.json().catch(() => null);
    const parsed = prayerUpdateSchema.safeParse(body);

    if (!parsed.success) {
        return json({ ok: false, message: 'Invalid payload', errors: parsed.error.flatten() }, 400);
    }

    const { prayer, value, timezone } = parsed.data;
    const date = getUserDateKey(new Date(), timezone);
    const dateKey = toDateKey(date);

    await connectMongo();

    const existing = await DailyPrayerLog.findOne({ userId: user.id, dateKey }).lean();
    const existingValue = Boolean((existing as Record<string, unknown> | null)?.[prayer]);

    if (existingValue && value) {
        return json({ ok: false, message: 'Prayer already marked for today' }, 409);
    }

    const log = await DailyPrayerLog.findOneAndUpdate(
        { userId: user.id, dateKey },
        {
            $set: { [prayer]: value },
            $setOnInsert: { userId: user.id, date, dateKey }
        },
        { upsert: true, new: true }
    ).lean();

    return json({ ok: true, log });
}
