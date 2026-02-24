import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import { WebUser } from '@/lib/mongoModels';
import { signToken, setAuthCookie, verifyTelegramAuth, TelegramUserData } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const data: any = {};
        searchParams.forEach((value, key) => {
            data[key] = value;
        });

        // Convert types for verification
        const authData: TelegramUserData = {
            id: Number(data.id),
            first_name: data.first_name,
            last_name: data.last_name || undefined,
            username: data.username || undefined,
            photo_url: data.photo_url || undefined,
            auth_date: Number(data.auth_date),
            hash: data.hash
        };

        // 1. Verify Telegram hash
        const isValid = verifyTelegramAuth(authData);
        if (!isValid) {
            return NextResponse.json({ ok: false, message: 'Invalid Telegram data' }, { status: 401 });
        }

        // 2. Check auth_date
        const now = Math.floor(Date.now() / 1000);
        if (now - authData.auth_date > 86400) {
            return NextResponse.json({ ok: false, message: 'Auth data expired' }, { status: 401 });
        }

        await connectMongo();

        // 3. Find or create user
        let user = await WebUser.findOne({ telegramId: String(authData.id) });

        if (!user) {
            user = await WebUser.create({
                telegramId: String(authData.id),
                name: authData.first_name + (authData.last_name ? ` ${authData.last_name}` : ''),
                image: authData.photo_url,
            });
        } else {
            user.name = authData.first_name + (authData.last_name ? ` ${authData.last_name}` : '');
            if (authData.photo_url) user.image = authData.photo_url;
            await user.save();
        }

        // 4. Create session
        const token = signToken({ userId: String(user._id) });
        setAuthCookie(token);

        // 5. Redirect to dashboard
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        return NextResponse.redirect(`${siteUrl}/dashboard`);
    } catch (error: any) {
        console.error('Telegram callback error:', error);
        return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
    }
}
