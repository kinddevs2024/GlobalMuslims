'use client';

import { useState, useEffect } from 'react';
import { useAppContext } from '@/lib/context';

export default function ProfilePage() {
  const { theme, setTheme, language, setLanguage, t } = useAppContext();
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (res.ok && data.ok) setUser(data.user);
  }

  async function updateProfile(updates: any) {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        setMessage('Profile updated successfully');
        if (data.user) setUser(data.user);
        // Fallback for some updates
        if (updates.image || updates.name) loadUser();
      } else {
        setMessage(data.message || 'Update failed');
      }
    } catch {
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
        updateProfile({ image: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

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
    const confirmed = window.confirm(t('delete_account') + '?');
    if (!confirmed) return;
    const response = await fetch('/api/profile', { method: 'DELETE' });
    const body = await response.json();
    if (!response.ok || !body.ok) {
      setMessage(body.message || 'Delete failed');
      return;
    }
    window.location.reload();
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/dashboard';
  }

  return (
    <div className="grid gap-4 max-w-2xl mx-auto">
      <section className="glass-card flex items-center gap-4">
        <div className="relative group">
            <div className="h-20 w-20 rounded-full bg-[var(--background)] border-2 border-[var(--accent)] overflow-hidden flex items-center justify-center">
                {user?.image ? (
                    <img src={user.image} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                    <span className="text-2xl font-bold text-[var(--accent)]">{user?.name?.[0]}</span>
                )}
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition rounded-full cursor-pointer">
                <span className="text-[10px] font-bold uppercase">{loading ? '...' : t('upload_photo')}</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={loading} />
            </label>
        </div>
        <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">{user?.name || t('profile')}</h2>
            <p className="text-sm text-[var(--text-muted)]">{user?.email}</p>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="glass-card">
            <h3 className="font-medium mb-3 text-[var(--foreground)]">{t('dark_mode')}</h3>
            <div className="flex bg-[var(--background)] p-1 rounded-xl border border-[var(--card-border)]">
                <button 
                    onClick={() => setTheme('light')}
                    className={`flex-1 py-1.5 rounded-lg text-sm transition ${theme === 'light' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-muted)]'}`}
                >
                    {t('light_mode')}
                </button>
                <button 
                    onClick={() => setTheme('dark')}
                    className={`flex-1 py-1.5 rounded-lg text-sm transition ${theme === 'dark' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-muted)]'}`}
                >
                    {t('dark_mode')}
                </button>
            </div>
        </section>

        <section className="glass-card">
            <h3 className="font-medium mb-3 text-[var(--foreground)]">{t('language')}</h3>
            <div className="flex bg-[var(--background)] p-1 rounded-xl border border-[var(--card-border)]">
                <button 
                    onClick={() => { setLanguage('uz'); updateProfile({ language: 'uz' }); }}
                    className={`flex-1 py-1.5 rounded-lg text-sm transition ${language === 'uz' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-muted)]'}`}
                >
                    O‘zbek
                </button>
                <button 
                    onClick={() => { setLanguage('en'); updateProfile({ language: 'en' }); }}
                    className={`flex-1 py-1.5 rounded-lg text-sm transition ${language === 'en' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-muted)]'}`}
                >
                    English
                </button>
            </div>
        </section>
      </div>

      <section className="glass-card">
        <h3 className="font-medium mb-3 text-[var(--foreground)]">{t('change_password')}</h3>
        <div className="grid gap-3">
            <input 
                type="password"
                placeholder={t('change_password')}
                className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5 outline-none focus:ring-2 focus:ring-[var(--accent)]"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
            />
            <button 
                onClick={() => updateProfile({ password: newPassword })}
                disabled={loading || !newPassword}
                className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
                {loading ? '...' : t('save_changes')}
            </button>
        </div>
      </section>

      <section className="glass-card grid gap-3">
        <button className="soft-btn w-full" onClick={exportData}>
          {t('export_data')}
        </button>
        <button className="w-full rounded-xl bg-gray-100 py-2.5 text-gray-700 transition hover:bg-gray-200" onClick={logout}>
          {t('logout') || 'Logout'}
        </button>
        <button className="w-full text-xs text-red-500 hover:underline mt-2" onClick={deleteAccount}>
          {t('delete_account')}
        </button>
        {message && <p className="text-sm text-center font-medium text-[var(--accent)]">{message}</p>}
      </section>
    </div>
  );
}
