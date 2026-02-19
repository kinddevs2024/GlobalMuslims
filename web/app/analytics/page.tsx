'use client';

import { useEffect, useMemo, useState } from 'react';
import { StatCard } from '@/components/StatCard';

type Scope = 'weekly' | 'monthly' | 'yearly';

type AnalyticsPayload = {
  scope: Scope;
  prayer: {
    totalPossible: number;
    completed: number;
    missed: number;
    completionRate: number;
    currentStreak: number;
    longestStreak: number;
    mostMissedPrayerType: string | null;
  };
  ramadan: {
    totalDays: number;
    fastDays: number;
    taraweehDays: number;
    quranDays: number;
  };
};

export default function AnalyticsPage() {
  const [scope, setScope] = useState<Scope>('weekly');
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [error, setError] = useState('');

  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  async function load(scopeValue: Scope) {
    setError('');

    const response = await fetch(
      `/api/analytics/summary?scope=${scopeValue}&timezone=${encodeURIComponent(timezone)}`
    );
    const body = await response.json();

    if (!response.ok || !body.ok) {
      setError(body.message || 'Failed to load analytics');
      return;
    }

    setData(body.data);
  }

  useEffect(() => {
    load(scope);
  }, [scope]);

  return (
    <div className="grid gap-4">
      <section className="glass-card">
        <h2 className="text-xl font-semibold">Analytics</h2>
        <p className="mt-1 text-sm text-white/70">Weekly graph, monthly graph and year summary (MVP cards)</p>
        <div className="mt-3 flex gap-2">
          {(['weekly', 'monthly', 'yearly'] as Scope[]).map((item) => (
            <button
              key={item}
              className={`rounded-lg px-3 py-1.5 text-sm ${scope === item ? 'bg-accent text-black' : 'bg-white/10'}`}
              onClick={() => setScope(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {error && <p className="text-red-300">{error}</p>}

      {data && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard title="Completion rate" value={`${data.prayer.completionRate}%`} />
            <StatCard title="Missed prayers" value={data.prayer.missed} />
            <StatCard title="Current streak" value={data.prayer.currentStreak} />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard title="Longest streak" value={data.prayer.longestStreak} />
            <StatCard title="Most missed prayer" value={data.prayer.mostMissedPrayerType || '—'} />
            <StatCard title="Total prayers" value={data.prayer.completed} />
          </div>

          <section className="glass-card">
            <h3 className="text-lg font-semibold">Ramadan performance summary</h3>
            <p className="mt-2 text-sm text-white/80">
              Fast days: {data.ramadan.fastDays} · Taraweeh days: {data.ramadan.taraweehDays} · Qur’an days: {data.ramadan.quranDays}
            </p>
          </section>
        </>
      )}
    </div>
  );
}
