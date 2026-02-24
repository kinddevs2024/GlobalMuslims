'use client';

import { useAppContext } from '@/lib/context';

type RamadanLog = {
  fastCompleted: boolean;
  taraweeh: boolean;
  quranReading: boolean;
};

type RamadanChecklistProps = {
  active: boolean;
  log: RamadanLog;
  onToggle: (field: 'fastCompleted' | 'taraweeh' | 'quranReading') => void;
  onActiveChange: (value: boolean) => void;
};

export function RamadanChecklist({ active, log, onToggle, onActiveChange }: RamadanChecklistProps) {
  const { t } = useAppContext();
  
  return (
    <section className="glass-card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">{t('ramadan_kareem')}</h2>
        <button
          className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${active ? 'bg-[var(--accent)] text-white' : 'bg-[var(--background)] text-[var(--text-muted)]'}`}
          onClick={() => onActiveChange(!active)}
        >
          {active ? 'ON' : 'OFF'}
        </button>
      </div>

      {active ? (
        <div className="grid gap-2">
          <button className="flex justify-between rounded-2xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-3 transition hover:border-[var(--accent)]/45" onClick={() => onToggle('fastCompleted')}>
            <span className="text-[var(--foreground)]">Fast completed</span>
            <span className={log.fastCompleted ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}>{log.fastCompleted ? '✓' : '○'}</span>
          </button>
          <button className="flex justify-between rounded-2xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-3 transition hover:border-[var(--accent)]/45" onClick={() => onToggle('taraweeh')}>
            <span className="text-[var(--foreground)]">Taraweeh</span>
            <span className={log.taraweeh ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}>{log.taraweeh ? '✓' : '○'}</span>
          </button>
          <button className="flex justify-between rounded-2xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-3 transition hover:border-[var(--accent)]/45" onClick={() => onToggle('quranReading')}>
            <span className="text-[var(--foreground)]">Qur’an reading</span>
            <span className={log.quranReading ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}>{log.quranReading ? '✓' : '○'}</span>
          </button>
        </div>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">Enable Ramadan mode manually.</p>
      )}
    </section>
  );
}
