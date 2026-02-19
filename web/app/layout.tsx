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
          <header className="mb-8">
            <div className="mb-5 text-center">
              <p className="title-arabic">رمضان مبارك</p>
              <p className="subtitle-arabic">Global Muslims</p>
              <p className="mt-1 text-sm text-[#6b7d74]">Modern worship tracker • Minimal and focused</p>
            </div>

            <nav className="mx-auto flex w-fit flex-wrap gap-2 rounded-2xl border border-[#e4ddd1] bg-white/80 p-2 text-sm shadow-sm">
              <Link className="soft-btn" href="/dashboard">
                Dashboard
              </Link>
              <Link className="soft-btn" href="/analytics">
                Analytics
              </Link>
              <Link className="soft-btn" href="/profile">
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
