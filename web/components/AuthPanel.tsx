'use client';

import { useState } from 'react';

type AuthPanelProps = {
  onAuthed: () => void;
};

export function AuthPanel({ onAuthed }: AuthPanelProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError('');

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = mode === 'login' ? { email, password } : { name, email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : null;

      if (!response.ok || !data?.ok) {
        setError(data?.message || `Authentication failed (${response.status})`);
        return;
      }

      onAuthed();
    } catch {
      setError('Server returned an invalid response. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="glass-card">
      <div className="mb-3 flex gap-2">
        <button
          className={`rounded-xl px-3 py-1.5 text-sm font-medium ${mode === 'login' ? 'bg-[#0d6b4f] text-white' : 'bg-[#edf2ee] text-[#365547]'}`}
          onClick={() => setMode('login')}
        >
          Login
        </button>
        <button
          className={`rounded-xl px-3 py-1.5 text-sm font-medium ${mode === 'register' ? 'bg-[#0d6b4f] text-white' : 'bg-[#edf2ee] text-[#365547]'}`}
          onClick={() => setMode('register')}
        >
          Register
        </button>
      </div>

      <div className="grid gap-2">
        {mode === 'register' && (
          <input
            className="rounded-2xl border border-[#d1d9d4] bg-[#fdfdfb] px-4 py-2.5"
            placeholder="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        )}
        <input
          className="rounded-2xl border border-[#d1d9d4] bg-[#fdfdfb] px-4 py-2.5"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          className="rounded-2xl border border-[#d1d9d4] bg-[#fdfdfb] px-4 py-2.5"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <button
        className="mt-3 rounded-2xl bg-[#0d6b4f] px-4 py-2.5 text-white transition hover:bg-[#0a5640] disabled:opacity-50"
        onClick={submit}
        disabled={loading}
      >
        {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
      </button>
    </section>
  );
}
