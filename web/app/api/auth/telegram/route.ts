import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import { WebUser } from '@/lib/mongoModels';
import { signToken, setAuthCookie, verifyTelegramAuth, TelegramUserData } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as TelegramUserData;

        // 1. Verify Telegram hash
        const isValid = verifyTelegramAuth(body);
        if (!isValid) {
            return NextResponse.json({ ok: false, message: 'Invalid Telegram data' }, { status: 401 });
        }

        // 2. Check auth_date (e.g., within last 24 hours to prevent replay attacks)
        const now = Math.floor(Date.now() / 1000);
        if (now - body.auth_date > 86400) {
            return NextResponse.json({ ok: false, message: 'Auth data expired' }, { status: 401 });
        }

        await connectMongo();

        // 3. Find or create user
        let user = await WebUser.findOne({ telegramId: String(body.id) });

        if (!user) {
            // Try to link by email if username looks like email (rare for TG but possible metadata)
            // or just create new user
            user = await WebUser.create({
                telegramId: String(body.id),
                name: body.first_name + (body.last_name ? ` ${body.last_name}` : ''),
                image: body.photo_url,
                // We don't have email/password for TG-only users
            });
        } else {
            // Update info if changed
            user.name = body.first_name + (body.last_name ? ` ${body.last_name}` : '');
            user.image = body.photo_url;
            await user.save();
        }

        // 4. Create session
        const token = signToken({ userId: String(user._id) });
        setAuthCookie(token);

        return NextResponse.json({
            ok: true,
            user: {
                id: String(user._id),
                name: user.name,
                telegramId: user.telegramId,
                image: user.image
            }
        });
    } catch (error: any) {
        console.error('Telegram auth error:', error);
        return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
    }
}
