'use client';

import { PRAYER_KEYS, PrayerKey } from '@/lib/constants';

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
  return (
    <section className="glass-card">
      <h2 className="mb-3 text-lg font-semibold">Today’s prayer checklist</h2>
      <div className="grid gap-2">
        {PRAYER_KEYS.map((key) => (
          <button
            key={key}
            className="flex items-center justify-between rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-left hover:bg-white/10"
            onClick={() => onToggle(key)}
          >
            <span>{labels[key]}</span>
            <span>{log[key] ? '✅' : '⬜'}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
