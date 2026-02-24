import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import { WebUser } from '@/lib/mongoModels';
import { signToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const { telegramId, otp } = await request.json();

        if (!telegramId || !otp) {
            return NextResponse.json({ ok: false, message: 'Telegram ID and OTP are required' }, { status: 400 });
        }

        await connectMongo();

        // Find user by telegramId or username
        const normalizedId = String(telegramId).replace('@', '').toLowerCase();
        const user = await WebUser.findOne({
            $or: [
                { telegramId: normalizedId },
                { username: normalizedId },
                { username: String(telegramId) } // in case it was stored with @
            ],
            authCode: String(otp),
            authCodeExpires: { $gt: new Date() }
        });

        if (!user) {
            return NextResponse.json({ ok: false, message: 'Invalid or expired code' }, { status: 401 });
        }

        // Clear the code after successful use
        user.authCode = undefined;
        user.authCodeExpires = undefined;
        await user.save();

        // Create session
        const token = signToken({ userId: String(user._id) });
        setAuthCookie(token);

        return NextResponse.json({
            ok: true,
            user: {
                id: String(user._id),
                name: user.name,
                telegramId: user.telegramId
            }
        });
    } catch (error: any) {
        console.error('OTP verification error:', error);
        return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
    }
}
