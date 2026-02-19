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

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok || !data.ok) {
      setError(data.message || 'Authentication failed');
      return;
    }

    onAuthed();
  }

  return (
    <section className="glass-card">
      <div className="mb-3 flex gap-2">
        <button
          className={`rounded-lg px-3 py-1.5 text-sm ${mode === 'login' ? 'bg-accent text-black' : 'bg-white/10'}`}
          onClick={() => setMode('login')}
        >
          Login
        </button>
        <button
          className={`rounded-lg px-3 py-1.5 text-sm ${mode === 'register' ? 'bg-accent text-black' : 'bg-white/10'}`}
          onClick={() => setMode('register')}
        >
          Register
        </button>
      </div>

      <div className="grid gap-2">
        {mode === 'register' && (
          <input
            className="rounded-lg border border-white/20 bg-black/30 px-3 py-2"
            placeholder="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        )}
        <input
          className="rounded-lg border border-white/20 bg-black/30 px-3 py-2"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          className="rounded-lg border border-white/20 bg-black/30 px-3 py-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}

      <button
        className="mt-3 rounded-lg bg-accent px-4 py-2 text-black disabled:opacity-50"
        onClick={submit}
        disabled={loading}
      >
        {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
      </button>
    </section>
  );
}
