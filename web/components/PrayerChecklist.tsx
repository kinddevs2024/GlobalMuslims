'use client';

import { PRAYER_KEYS, PrayerKey } from '@/lib/constants';
import { useAppContext } from '@/lib/context';

const labels: Record<PrayerKey, string> = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha'
};

type PrayerLog = {
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
};

type PrayerChecklistProps = {
  log: PrayerLog;
  onToggle: (prayer: PrayerKey) => void;
};

export function PrayerChecklist({ log, onToggle }: PrayerChecklistProps) {
  const { t } = useAppContext();
  
  return (
    <section className="glass-card">
      <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">{t('todays_prayers')}</h2>
      <div className="grid gap-2.5">
        {PRAYER_KEYS.map((key) => (
          <button
            key={key}
            className="flex items-center justify-between rounded-2xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-[var(--accent)]/45 hover:shadow-sm"
            onClick={() => onToggle(key)}
          >
            <span className="font-medium text-[var(--foreground)]">{labels[key]}</span>
            <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${log[key] ? 'bg-[var(--accent)] text-white' : 'bg-[var(--background)] border border-[var(--card-border)] text-[var(--text-muted)]'}`}>
              {log[key] ? '✓' : '○'}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
