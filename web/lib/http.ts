import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from './rateLimit';

export function json(data: unknown, status = 200) {
    return NextResponse.json(data, { status });
}

export function withRateLimit(request: NextRequest, keyPrefix: string, limit = 30, windowMs = 60_000) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const result = checkRateLimit(`${keyPrefix}:${ip}`, limit, windowMs);

    if (result.allowed) {
        return null;
    }

    const response = json(
        { ok: false, message: 'Too many requests. Try again later.' },
        429
    );
    response.headers.set('Retry-After', String(result.retryAfterSec));
    return response;
}
