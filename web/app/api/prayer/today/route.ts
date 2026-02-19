import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json } from '@/lib/http';
import { requireAuth } from '@/lib/auth';
import { getUserDateKey } from '@/lib/date';
import { prayerUpdateSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
    const user = await requireAuth(request);
    if (!user) {
        return json({ ok: false, message: 'Unauthorized' }, 401);
    }

    const timezone = request.nextUrl.searchParams.get('timezone') || undefined;
    const date = getUserDateKey(new Date(), timezone);

    const log = await prisma.dailyPrayerLog.upsert({
        where: {
            userId_date: {
                userId: user.id,
                date
            }
        },
        update: {},
        create: {
            userId: user.id,
            date
        }
    });

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

    const existing = await prisma.dailyPrayerLog.findUnique({
        where: {
            userId_date: {
                userId: user.id,
                date
            }
        }
    });

    if (existing?.[prayer] && value) {
        return json({ ok: false, message: 'Prayer already marked for today' }, 409);
    }

    const log = await prisma.dailyPrayerLog.upsert({
        where: {
            userId_date: {
                userId: user.id,
                date
            }
        },
        update: {
            [prayer]: value
        },
        create: {
            userId: user.id,
            date,
            [prayer]: value
        }
    });

    return json({ ok: true, log });
}
