import { NextRequest } from 'next/server';
import { json } from '@/lib/http';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const user = await requireAuth(request);

    if (!user) {
        return json({ ok: false, message: 'Unauthorized' }, 401);
    }

    return json({ ok: true, user });
}
