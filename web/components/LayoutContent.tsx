'use client';

import Link from 'next/link';
import { useAppContext } from '@/lib/context';

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const { t } = useAppContext();
  
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <header className="mb-8">
        <div className="mb-5 text-center">
          <p className="title-arabic">{t('ramadan_kareem')}</p>
          <p className="subtitle-arabic">Global Muslims</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{t('modern_tracker')}</p>
        </div>

        <nav className="mx-auto flex w-fit flex-wrap gap-2 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-2 text-sm shadow-sm backdrop-blur">
          <Link className="soft-btn" href="/dashboard">
            {t('dashboard')}
          </Link>
          <Link className="soft-btn" href="/analytics">
            {t('analytics')}
          </Link>
          <Link className="soft-btn" href="/profile">
            {t('profile')}
          </Link>
        </nav>
      </header>
      {children}
    </main>
  );
}
