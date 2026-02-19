'use client';

import { useState } from 'react';

export default function ProfilePage() {
  const [message, setMessage] = useState('');

  async function exportData() {
    const response = await fetch('/api/profile/export');
    const body = await response.json();

    if (!response.ok || !body.ok) {
      setMessage(body.message || 'Export failed');
      return;
    }

    const blob = new Blob([JSON.stringify(body.export, null, 2)], {
      type: 'application/json;charset=utf-8'
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'global-muslims-export.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setMessage('Export completed');
  }

  async function deleteAccount() {
    const confirmed = window.confirm('Delete account permanently?');
    if (!confirmed) {
      return;
    }

    const response = await fetch('/api/profile', { method: 'DELETE' });
    const body = await response.json();

    if (!response.ok || !body.ok) {
      setMessage(body.message || 'Delete failed');
      return;
    }

    setMessage('Account deleted');
  }

  return (
    <div className="grid gap-4">
      <section className="glass-card">
        <h2 className="text-xl font-semibold">Profile</h2>
        <p className="mt-1 text-sm text-white/70">Account settings, data export and account deletion.</p>
      </section>

      <section className="glass-card grid gap-3">
        <button className="rounded-lg bg-accent px-4 py-2 text-black" onClick={exportData}>
          Export data
        </button>
        <button className="rounded-lg border border-red-400/50 px-4 py-2 text-red-300" onClick={deleteAccount}>
          Delete account
        </button>
        {message && <p className="text-sm text-white/80">{message}</p>}
      </section>
    </div>
  );
}
