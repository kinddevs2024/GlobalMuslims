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
      <h2 className="mb-4 text-lg font-semibold text-[#1f3a2e]">Today’s prayer checklist</h2>
      <div className="grid gap-2.5">
        {PRAYER_KEYS.map((key) => (
          <button
            key={key}
            className="flex items-center justify-between rounded-2xl border border-[#d6ddd7] bg-[#fcfcfa] px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-[#0d6b4f]/45 hover:shadow-sm"
            onClick={() => onToggle(key)}
          >
            <span className="font-medium text-[#274537]">{labels[key]}</span>
            <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${log[key] ? 'bg-[#0d6b4f] text-white' : 'bg-[#eef2ee] text-[#668074]'}`}>
              {log[key] ? '✓' : '○'}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
