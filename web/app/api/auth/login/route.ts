import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import { WebUser } from '@/lib/mongoModels';
import { json, withRateLimit } from '@/lib/http';
import { loginSchema } from '@/lib/validation';
import { setAuthCookie, signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
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

        await connectMongo();
        const user = await WebUser.findOne({ email });
        if (!user) {
            return json({ ok: false, message: 'Invalid credentials' }, 401);
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return json({ ok: false, message: 'Invalid credentials' }, 401);
        }

        const token = signToken({ userId: String(user._id) });
        setAuthCookie(token);

        return json({
            ok: true,
            user: {
                id: String(user._id),
                name: user.name,
                email: user.email,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error';

        if (message.includes('ECONNREFUSED') || message.includes('connect ECONNREFUSED')) {
            return json(
                {
                    ok: false,
                    message: 'MongoDB is not running on 127.0.0.1:27017. Start MongoDB service.'
                },
                500
            );
        }

        return json({ ok: false, message: 'Login failed. Check MONGODB_URI and database.' }, 500);
    }
}
