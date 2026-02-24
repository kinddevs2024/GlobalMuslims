import './globals.css';
import Link from 'next/link';
import type { Metadata } from 'next';
import { AppProvider } from '@/lib/context';
import { LayoutContent } from '@/components/LayoutContent';

export const metadata: Metadata = {
  title: 'Global Muslims',
  description: 'Worship & Ramadan Tracking System'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <LayoutContent>{children}</LayoutContent>
        </AppProvider>
      </body>
    </html>
  );
}
