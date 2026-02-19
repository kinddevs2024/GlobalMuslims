import './globals.css';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Global Muslims',
  description: 'Worship & Ramadan Tracking System'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto w-full max-w-5xl px-4 py-8">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold">🌍 Global Muslims</h1>
            <nav className="flex gap-2 text-sm">
              <Link className="rounded-xl border border-white/20 px-3 py-1.5 hover:bg-white/10" href="/dashboard">
                Dashboard
              </Link>
              <Link className="rounded-xl border border-white/20 px-3 py-1.5 hover:bg-white/10" href="/analytics">
                Analytics
              </Link>
              <Link className="rounded-xl border border-white/20 px-3 py-1.5 hover:bg-white/10" href="/profile">
                Profile
              </Link>
            </nav>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
