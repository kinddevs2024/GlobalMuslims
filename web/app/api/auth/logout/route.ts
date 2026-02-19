import { clearAuthCookie } from '@/lib/auth';
import { json } from '@/lib/http';

export async function POST() {
    clearAuthCookie();
    return json({ ok: true });
}
