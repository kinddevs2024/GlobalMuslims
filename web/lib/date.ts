export function normalizeTimezone(timezone?: string) {
    const fallback = 'UTC';

    if (!timezone) {
        return fallback;
    }

    try {
        Intl.DateTimeFormat(undefined, { timeZone: timezone });
        return timezone;
    } catch {
        return fallback;
    }
}

function getDateParts(date: Date, timezone: string) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    const [year, month, day] = formatter.format(date).split('-').map(Number);
    return { year, month, day };
}

export function getUserDateKey(date = new Date(), timezone?: string) {
    const safeTimezone = normalizeTimezone(timezone);
    const { year, month, day } = getDateParts(date, safeTimezone);
    return new Date(Date.UTC(year, month - 1, day));
}

export function getRangeByScope(scope: 'weekly' | 'monthly' | 'yearly', timezone?: string) {
    const today = getUserDateKey(new Date(), timezone);
    const end = new Date(today);
    end.setUTCDate(end.getUTCDate() + 1);

    const start = new Date(today);

    if (scope === 'weekly') {
        start.setUTCDate(start.getUTCDate() - 6);
    } else if (scope === 'monthly') {
        start.setUTCDate(1);
    } else {
        start.setUTCMonth(0, 1);
    }

    return { start, end };
}
