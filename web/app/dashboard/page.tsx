'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { AuthPanel } from '@/components/AuthPanel';
import { PrayerChecklist } from '@/components/PrayerChecklist';
import { RamadanChecklist } from '@/components/RamadanChecklist';
import { StatCard } from '@/components/StatCard';
import { PrayerKey } from '@/lib/constants';
import { useAppContext } from '@/lib/context';

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

const ayatList = [
  {
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    translation:
      'Our Lord, give us in this world good and in the Hereafter good and protect us from the punishment of the Fire.'
  },
  {
    arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    translation: 'Indeed, with hardship will be ease. Indeed, with hardship will be ease.'
  },
  {
    arabic: 'وَمَنْ يَتَّقِ اللَّهَ يَجْعَلْ لَهُ مَخْرَجًا ۝ وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ',
    translation: 'Whoever fears Allah, He makes a way out and provides from where one does not expect.'
  }
];

export default function DashboardPage() {
  const { t } = useAppContext();
  const [user, setUser] = useState<User | null>(null);
  const [prayer, setPrayer] = useState<PrayerLog>(emptyPrayer);
  const [ramadan, setRamadan] = useState<RamadanLog>(emptyRamadan);
  const [ramadanActive, setRamadanActive] = useState(false);
  const [timezone, setTimezone] = useState('');
  const [ramadanStart, setRamadanStart] = useState<Date | null>(null);
  const [monthFastedDays, setMonthFastedDays] = useState(0);
  const dashboardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
        setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
        setRamadanStart(new Date('2026-02-18T00:00:00'));
    } catch (e) {
        console.error('Timezone init error:', e);
    }
  }, []);

  async function loadUser() {
    try {
      console.log('Loading user...');
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      console.log('User data response:', data);
      if (response.ok && data.ok) {
        setUser(data.user);
      } else {
        console.warn('User not authenticated or error:', data.message);
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to load user:', err);
      setUser(null);
    }
  }

  async function loadToday() {
    try {
      console.log('Loading today data for timezone:', timezone);
      const [prayerResponse, ramadanResponse, analyticsResponse] = await Promise.all([
        fetch(`/api/prayer/today?timezone=${encodeURIComponent(timezone)}`),
        fetch(`/api/ramadan/today?timezone=${encodeURIComponent(timezone)}`),
        fetch(`/api/analytics/summary?scope=monthly&timezone=${encodeURIComponent(timezone)}`)
      ]);

      const prayerData = await prayerResponse.json();
      const ramadanData = await ramadanResponse.json();
      const analyticsData = await analyticsResponse.json();

      console.log('Today data loaded:', { prayerData, ramadanData, analyticsData });

      if (prayerData.ok) {
        setPrayer(prayerData.log);
      }

      if (ramadanData.ok) {
        setRamadan(ramadanData.log);
      }

      if (analyticsData.ok) {
        setMonthFastedDays(analyticsData.data?.ramadan?.fastDays || 0);
      }
    } catch (err) {
      console.error('Failed to load today data:', err);
    }
  }

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user && timezone) {
      loadToday();
    }
  }, [user, timezone]);

  useEffect(() => {
    if (!dashboardRef.current || !user) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from('[data-animate="fade-up"]', {
        y: 20,
        opacity: 0,
        duration: 0.55,
        stagger: 0.08,
        ease: 'power2.out'
      });
    }, dashboardRef);

    return () => ctx.revert();
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
  const progressPercent = Math.round((completedCount / 5) * 100);
  const dayDiff = ramadanStart ? Math.floor((Date.now() - ramadanStart.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 1;
  const currentRamadanDay = Math.min(Math.max(dayDiff, 1), 30);
  const todaysAyah = ayatList[(currentRamadanDay - 1) % ayatList.length];

  if (!timezone) {
    return <div className="p-8 text-center text-[var(--text-muted)] animate-pulse">Initializing...</div>;
  }

  if (!user) {
    return <AuthPanel onAuthed={loadUser} />;
  }

  return (
    <div ref={dashboardRef} className="grid gap-4">
      <section data-animate="fade-up" className="glass-card">
        <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Ramadan Kareem 1447</p>
        <h2 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">{t('welcome')}, {user.name}</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{t('modern_tracker')}</p>
      </section>

      <div data-animate="fade-up" className="grid gap-3 sm:grid-cols-3">
        <StatCard title={t('day')} value={`${currentRamadanDay}/30`} subtitle={t('ramadan_progress')} />
        <StatCard title={t('completed_today')} value={`${completedCount}/5`} subtitle={t('todays_prayers')} />
        <StatCard title={t('completion_rate')} value={`${progressPercent}%`} subtitle={t('daily_prayer_completion')} />
      </div>

      <section data-animate="fade-up" className="glass-card">
        <h3 className="mb-3 text-lg font-semibold text-[var(--foreground)]">{t('your_journey')}</h3>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
          {Array.from({ length: 30 }, (_, index) => {
            const day = index + 1;
            const isToday = day === currentRamadanDay;
            const isCompleted = day <= monthFastedDays;

            return (
              <div
                key={day}
                className={`flex aspect-square items-center justify-center rounded-full border text-sm font-semibold transition ${isCompleted ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'border-[var(--card-border)] bg-[var(--background)] text-[var(--text-muted)]'} ${isToday ? 'ring-2 ring-[var(--secondary)] ring-offset-2 ring-offset-[var(--background)]' : ''}`}
              >
                {day}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-[var(--text-muted)]">{t('fasted_days')}: {monthFastedDays}</p>
      </section>

      <section data-animate="fade-up" className="rounded-3xl border border-[#f0dca0] bg-gradient-to-br from-[#fefcf2] to-[#fff9e8] p-6 shadow-[0_8px_20px_rgba(201,163,71,0.12)]">
        <p className="text-right text-3xl leading-relaxed text-[#1f3a2e]" style={{ fontFamily: 'Scheherazade New, serif' }}>
          {todaysAyah.arabic}
        </p>
        <p className="mt-3 text-sm italic text-[#5f7469]">{todaysAyah.translation}</p>
      </section>

      <div data-animate="fade-up">
        <PrayerChecklist log={prayer} onToggle={togglePrayer} />
      </div>
      <div data-animate="fade-up">
        <RamadanChecklist
          active={ramadanActive}
          log={ramadan}
          onToggle={toggleRamadan}
          onActiveChange={setRamadanActive}
        />
      </div>
    </div>
  );
}
