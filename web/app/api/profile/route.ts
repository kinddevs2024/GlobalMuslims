import { NextRequest } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import { DailyPrayerLog, RamadanLog, StatisticsCache, WebUser } from '@/lib/mongoModels';
import { clearAuthCookie, requireAuth } from '@/lib/auth';
import { json } from '@/lib/http';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest) {
    const session = await requireAuth(request);
    if (!session) {
        return json({ ok: false, message: 'Unauthorized' }, 401);
    }

    try {
        const { name, password, image, theme, language } = await request.json();
        console.log('Profile update request:', { name, hasPassword: !!password, hasImage: !!image, theme, language });

        if (image && image.length > 5 * 1024 * 1024) {
            return json({ ok: false, message: 'Image is too large (max 5MB)' }, 400);
        }

        await connectMongo();

        const updates: any = {};
        if (name) updates.name = name;
        if (password) {
            updates.password = await bcrypt.hash(password, 12);
        }
        if (image) updates.image = image;
        if (theme) updates.theme = theme;
        if (language) updates.language = language;

        const updatedUser = await WebUser.findByIdAndUpdate(
            session.id,
            { $set: updates },
            { new: true }
        ).lean() as any;

        if (!updatedUser) {
            return json({ ok: false, message: 'User not found' }, 404);
        }

        return json({
            ok: true, user: {
                id: String(updatedUser._id),
                name: updatedUser.name,
                email: updatedUser.email,
                image: updatedUser.image,
                theme: updatedUser.theme,
                language: updatedUser.language
            }
        });
    } catch (error: any) {
        console.error('Profile update error:', error);
        return json({ ok: false, message: 'Update failed' }, 500);
    }
}

export async function DELETE(request: NextRequest) {
    const session = await requireAuth(request);
    if (!session) {
        return json({ ok: false, message: 'Unauthorized' }, 401);
    }

    await connectMongo();
    await Promise.all([
        WebUser.deleteOne({ _id: session.id }),
        DailyPrayerLog.deleteMany({ userId: session.id }),
        RamadanLog.deleteMany({ userId: session.id }),
        StatisticsCache.deleteOne({ userId: session.id })
    ]);

    clearAuthCookie();
    return json({ ok: true });
}
