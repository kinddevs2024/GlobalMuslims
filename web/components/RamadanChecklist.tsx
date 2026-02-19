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
        <h2 className="text-lg font-semibold">Ramadan mode</h2>
        <button
          className={`rounded-lg px-3 py-1.5 text-sm ${active ? 'bg-accent text-black' : 'bg-white/10'}`}
          onClick={() => onActiveChange(!active)}
        >
          {active ? 'Active' : 'Off'}
        </button>
      </div>

      {active ? (
        <div className="grid gap-2">
          <button className="flex justify-between rounded-lg border border-white/20 bg-black/20 px-3 py-2" onClick={() => onToggle('fastCompleted')}>
            <span>Fast completed</span>
            <span>{log.fastCompleted ? '✅' : '⬜'}</span>
          </button>
          <button className="flex justify-between rounded-lg border border-white/20 bg-black/20 px-3 py-2" onClick={() => onToggle('taraweeh')}>
            <span>Taraweeh</span>
            <span>{log.taraweeh ? '✅' : '⬜'}</span>
          </button>
          <button className="flex justify-between rounded-lg border border-white/20 bg-black/20 px-3 py-2" onClick={() => onToggle('quranReading')}>
            <span>Qur’an reading</span>
            <span>{log.quranReading ? '✅' : '⬜'}</span>
          </button>
        </div>
      ) : (
        <p className="text-sm text-white/70">Enable Ramadan mode manually or connect Hijri calendar API later.</p>
      )}
    </section>
  );
}
