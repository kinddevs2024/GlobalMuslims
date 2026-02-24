import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { connectMongo } from './mongo';
import { WebUser } from './mongoModels';

const JWT_EXPIRES_IN =
    (process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] | undefined) || '7d';
const COOKIE_NAME = 'gm_token';

function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is required');
    }

    return secret;
}

type JwtPayload = {
    userId: string;
};

export type TelegramUserData = {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
};

export function verifyTelegramAuth(data: TelegramUserData): boolean {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        throw new Error('TELEGRAM_BOT_TOKEN is required');
    }

    const { hash, ...rest } = data;
    const dataCheckString = Object.entries(rest)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

    const secretKey = crypto.createHash('sha256').update(token).digest();
    const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    return hmac === hash;
}

export function signToken(payload: JwtPayload) {
    return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload | null {
    try {
        const decoded = jwt.verify(token, getJwtSecret()) as unknown;

        if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded) {
            return decoded as JwtPayload;
        }

        return null;
    } catch {
        return null;
    }
}

export function setAuthCookie(token: string) {
    cookies().set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7
    });
}

export function clearAuthCookie() {
    cookies().set(COOKIE_NAME, '', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 0
    });
}

export async function requireAuth(request: NextRequest) {
    const bearer = request.headers.get('authorization');
    const bearerToken = bearer?.startsWith('Bearer ') ? bearer.slice(7) : null;
    const cookieToken = request.cookies.get(COOKIE_NAME)?.value;
    const token = bearerToken || cookieToken;

    if (!token) {
        return null;
    }

    const payload = verifyToken(token);
    if (!payload?.userId) {
        return null;
    }

    await connectMongo();
    const user = (await WebUser.findById(payload.userId).lean()) as
        | {
            _id: unknown;
            name: string;
            email?: string;
            telegramId?: string;
            image?: string;
            createdAt: Date;
        }
        | null;

    if (!user) {
        return null;
    }

    return {
        id: String(user._id),
        name: user.name,
        email: user.email,
        telegramId: user.telegramId,
        image: user.image,
        createdAt: user.createdAt
    };
}
