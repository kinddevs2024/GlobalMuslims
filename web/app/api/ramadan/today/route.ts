import { NextRequest } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import { RamadanLog } from '@/lib/mongoModels';
import { json } from '@/lib/http';
import { requireAuth } from '@/lib/auth';
import { getUserDateKey, toDateKey } from '@/lib/date';
import { ramadanUpdateSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
    const user = await requireAuth(request);
    if (!user) {
        return json({ ok: false, message: 'Unauthorized' }, 401);
    }

    const timezone = request.nextUrl.searchParams.get('timezone') || undefined;
    const date = getUserDateKey(new Date(), timezone);
    const dateKey = toDateKey(date);

    await connectMongo();

    const log = await RamadanLog.findOneAndUpdate(
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
    const parsed = ramadanUpdateSchema.safeParse(body);

    if (!parsed.success) {
        return json({ ok: false, message: 'Invalid payload', errors: parsed.error.flatten() }, 400);
    }

    const { field, value, timezone } = parsed.data;
    const date = getUserDateKey(new Date(), timezone);
    const dateKey = toDateKey(date);

    await connectMongo();

    const log = await RamadanLog.findOneAndUpdate(
        { userId: user.id, dateKey },
        {
            $set: { [field]: value },
            $setOnInsert: { userId: user.id, date, dateKey }
        },
        { upsert: true, new: true }
    ).lean();

    return json({ ok: true, log });
}
