'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AuthPanel } from '@/components/AuthPanel';
import { PrayerChecklist } from '@/components/PrayerChecklist';
import { RamadanChecklist } from '@/components/RamadanChecklist';
import { StatCard } from '@/components/StatCard';
import { PrayerKey } from '@/lib/constants';

type User = { id: string; name: string; email: string };
type PrayerLog = { fajr: boolean; dhuhr: boolean; asr: boolean; maghrib: boolean; isha: boolean };
type RamadanLog = { fastCompleted: boolean; taraweeh: boolean; quranReading: boolean };

const emptyPrayer: PrayerLog = {
  fajr: false,
  dhuhr: false,
  asr: false,
  maghrib: false,
  isha: false
};

const emptyRamadan: RamadanLog = {
  fastCompleted: false,
  taraweeh: false,
  quranReading: false
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [prayer, setPrayer] = useState<PrayerLog>(emptyPrayer);
  const [ramadan, setRamadan] = useState<RamadanLog>(emptyRamadan);
  const [ramadanActive, setRamadanActive] = useState(false);

  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  async function loadUser() {
    const response = await fetch('/api/auth/me');
    const data = await response.json();
    if (response.ok && data.ok) {
      setUser(data.user);
    } else {
      setUser(null);
    }
  }

  async function loadToday() {
    const [prayerResponse, ramadanResponse] = await Promise.all([
      fetch(`/api/prayer/today?timezone=${encodeURIComponent(timezone)}`),
      fetch(`/api/ramadan/today?timezone=${encodeURIComponent(timezone)}`)
    ]);

    const prayerData = await prayerResponse.json();
    const ramadanData = await ramadanResponse.json();

    if (prayerData.ok) {
      setPrayer(prayerData.log);
    }

    if (ramadanData.ok) {
      setRamadan(ramadanData.log);
    }
  }

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadToday();
    }
  }, [user]);

  async function togglePrayer(prayerKey: PrayerKey) {
    const response = await fetch('/api/prayer/today', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prayer: prayerKey, value: !prayer[prayerKey], timezone })
    });

    const data = await response.json();
    if (response.ok && data.ok) {
      setPrayer(data.log);
    }
  }

  async function toggleRamadan(field: 'fastCompleted' | 'taraweeh' | 'quranReading') {
    const response = await fetch('/api/ramadan/today', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field, value: !ramadan[field], timezone })
    });

    const data = await response.json();
    if (response.ok && data.ok) {
      setRamadan(data.log);
    }
  }

  const completedCount = Object.values(prayer).filter(Boolean).length;

  if (!user) {
    return <AuthPanel onAuthed={loadUser} />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4">
      <section className="glass-card">
        <h2 className="text-xl font-semibold">Assalamu alaikum, {user.name}</h2>
        <p className="mt-1 text-sm text-white/70">Build consistency with daily prayer and Ramadan discipline.</p>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard title="Completed today" value={`${completedCount}/5`} subtitle="Today’s prayers" />
        <StatCard title="Ramadan fast" value={ramadan.fastCompleted ? 'Done' : 'Pending'} subtitle="Daily fasting status" />
        <StatCard title="Quick progress" value={`${Math.round((completedCount / 5) * 100)}%`} subtitle="Prayer completion" />
      </div>

      <PrayerChecklist log={prayer} onToggle={togglePrayer} />
      <RamadanChecklist
        active={ramadanActive}
        log={ramadan}
        onToggle={toggleRamadan}
        onActiveChange={setRamadanActive}
      />
    </motion.div>
  );
}
