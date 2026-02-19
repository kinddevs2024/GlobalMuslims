import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import { WebUser } from '@/lib/mongoModels';
import { json, withRateLimit } from '@/lib/http';
import { registerSchema } from '@/lib/validation';
import { setAuthCookie, signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
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

        await connectMongo();

        const existing = await WebUser.findOne({ email }).lean();
        if (existing) {
            return json({ ok: false, message: 'Email already exists' }, 409);
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await WebUser.create({ name, email, password: hashedPassword });

        const token = signToken({ userId: String(user._id) });
        setAuthCookie(token);

        return json(
            {
                ok: true,
                user: {
                    id: String(user._id),
                    name: user.name,
                    email: user.email,
                    createdAt: user.createdAt
                }
            },
            201
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error';

        if (message.includes('MONGODB_URI')) {
            return json({ ok: false, message: 'MONGODB_URI is missing in web/.env' }, 500);
        }

        if (message.includes('ECONNREFUSED') || message.includes('connect ECONNREFUSED')) {
            return json(
                {
                    ok: false,
                    message: 'MongoDB is not running on 127.0.0.1:27017. Start MongoDB service.'
                },
                500
            );
        }

        return json({ ok: false, message: 'Registration failed. Check server logs.' }, 500);
    }
}
