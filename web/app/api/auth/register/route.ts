import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, withRateLimit } from '@/lib/http';
import { registerSchema } from '@/lib/validation';
import { setAuthCookie, signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
    const limited = withRateLimit(request, 'auth:register', 10, 60_000);
    if (limited) {
        return limited;
    }

    const body = await request.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
        return json({ ok: false, message: 'Invalid payload', errors: parsed.error.flatten() }, 400);
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        return json({ ok: false, message: 'Email already exists' }, 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword
        },
        select: { id: true, name: true, email: true, createdAt: true }
    });

    const token = signToken({ userId: user.id });
    setAuthCookie(token);

    return json({ ok: true, user }, 201);
}
