type RateLimitState = {
    count: number;
    resetAt: number;
};

const store = new Map<string, RateLimitState>();

export function checkRateLimit(key: string, limit = 30, windowMs = 60_000) {
    const now = Date.now();
    const current = store.get(key);

    if (!current || now > current.resetAt) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, retryAfterSec: 0 };
    }

    if (current.count >= limit) {
        const retryAfterSec = Math.ceil((current.resetAt - now) / 1000);
        return { allowed: false, retryAfterSec };
    }

    current.count += 1;
    store.set(key, current);
    return { allowed: true, retryAfterSec: 0 };
}
