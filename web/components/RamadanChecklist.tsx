'use client';

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
  return (
    <section className="glass-card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#1f3a2e]">Ramadan mode</h2>
        <button
          className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${active ? 'bg-[#0d6b4f] text-white' : 'bg-[#edf2ee] text-[#365547]'}`}
          onClick={() => onActiveChange(!active)}
        >
          {active ? 'Active' : 'Off'}
        </button>
      </div>

      {active ? (
        <div className="grid gap-2">
          <button className="flex justify-between rounded-2xl border border-[#d6ddd7] bg-[#fcfcfa] px-4 py-3 transition hover:border-[#0d6b4f]/45" onClick={() => onToggle('fastCompleted')}>
            <span>Fast completed</span>
            <span className={log.fastCompleted ? 'text-[#0d6b4f]' : 'text-[#7c9085]'}>{log.fastCompleted ? '✓' : '○'}</span>
          </button>
          <button className="flex justify-between rounded-2xl border border-[#d6ddd7] bg-[#fcfcfa] px-4 py-3 transition hover:border-[#0d6b4f]/45" onClick={() => onToggle('taraweeh')}>
            <span>Taraweeh</span>
            <span className={log.taraweeh ? 'text-[#0d6b4f]' : 'text-[#7c9085]'}>{log.taraweeh ? '✓' : '○'}</span>
          </button>
          <button className="flex justify-between rounded-2xl border border-[#d6ddd7] bg-[#fcfcfa] px-4 py-3 transition hover:border-[#0d6b4f]/45" onClick={() => onToggle('quranReading')}>
            <span>Qur’an reading</span>
            <span className={log.quranReading ? 'text-[#0d6b4f]' : 'text-[#7c9085]'}>{log.quranReading ? '✓' : '○'}</span>
          </button>
        </div>
      ) : (
        <p className="text-sm text-[#6f8479]">Enable Ramadan mode manually or connect Hijri calendar API later.</p>
      )}
    </section>
  );
}
