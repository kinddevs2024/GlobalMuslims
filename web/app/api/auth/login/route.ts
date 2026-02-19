import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, withRateLimit } from '@/lib/http';
import { loginSchema } from '@/lib/validation';
import { setAuthCookie, signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
    const limited = withRateLimit(request, 'auth:login', 20, 60_000);
    if (limited) {
        return limited;
    }

    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
        return json({ ok: false, message: 'Invalid payload', errors: parsed.error.flatten() }, 400);
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return json({ ok: false, message: 'Invalid credentials' }, 401);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
        return json({ ok: false, message: 'Invalid credentials' }, 401);
    }

    const token = signToken({ userId: user.id });
    setAuthCookie(token);

    return json({
        ok: true,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt
        }
    });
}
