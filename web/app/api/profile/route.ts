import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clearAuthCookie, requireAuth } from '@/lib/auth';
import { json } from '@/lib/http';

export async function DELETE(request: NextRequest) {
    const user = await requireAuth(request);
    if (!user) {
        return json({ ok: false, message: 'Unauthorized' }, 401);
    }

    await prisma.user.delete({
        where: { id: user.id }
    });

    clearAuthCookie();
    return json({ ok: true });
}
