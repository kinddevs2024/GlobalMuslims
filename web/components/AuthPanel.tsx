'use client';

import { useState } from 'react';

type AuthPanelProps = {
  onAuthed: () => void;
};

const BOT_NAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || 'kenguru_promts_bot';
const BOT_CONNECT_URL = `https://t.me/${BOT_NAME}?start=login`;

export function AuthPanel({ onAuthed }: AuthPanelProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tgIdentity, setTgIdentity] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);

  async function submit() {
    setLoading(true);
    setError('');

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = mode === 'login' ? { identity: email, password } : { name, email, password };

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

  async function handleOtpSubmit() {
    if (!tgIdentity || !otp) {
      setError('Please enter both Telegram ID/Username and the code.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/telegram/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: tgIdentity, otp })
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.ok) {
        setError(data.message || 'Verification failed');
        return;
      }
      
      onAuthed();
    } catch {
      setError('Verification failed. Please try again.');
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
          placeholder={mode === 'login' ? "Email or Telegram Username/ID" : "Email"}
          type={mode === 'login' ? "text" : "email"}
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

      <div className="relative mt-6 mb-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#d1d9d4]"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#fcfcfa] px-2 text-[#768a80]">Or continue with</span>
        </div>
      </div>

      <div className="grid gap-3">
        {!showOtp ? (
          <div className="grid gap-2">
            <button
              onClick={() => {
                setShowOtp(true);
                window.open(`${BOT_CONNECT_URL}`, '_blank');
              }}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#0088cc] px-4 py-3 text-white transition hover:bg-[#0077b3]"
            >
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.51-.46-.01-1.33-.26-1.98-.48-.8-.27-1.43-.41-1.38-.87.03-.24.36-.48.99-.74 3.84-1.67 6.41-2.77 7.7-3.3 3.66-1.51 4.42-1.77 4.92-1.78.11 0 .35.03.5.16.13.1.17.24.18.33.02.1-.01.35-.02.43z" />
              </svg>
              <span className="font-medium">Get OTP Code in Telegram</span>
            </button>
            
            <button
              onClick={() => {
                window.open(`https://t.me/${BOT_NAME}?start=register`, '_blank');
              }}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white border border-[#0088cc] px-4 py-3 text-[#0088cc] transition hover:bg-blue-50"
            >
              <span className="font-medium">Set Password in Bot</span>
            </button>
          </div>
        ) : (
          <div className="grid gap-2 p-3 rounded-2xl bg-[#f0f4f2] border border-[#d1d9d4]">
            <p className="text-xs text-[#365547] mb-1">Enter your Telegram ID/Username and the 6-digit code from the bot.</p>
            <input
              className="rounded-xl border border-[#d1d9d4] bg-white px-3 py-2 text-sm"
              placeholder="Telegram ID or @username"
              value={tgIdentity}
              onChange={(e) => setTgIdentity(e.target.value)}
            />
            <input
              className="rounded-xl border border-[#d1d9d4] bg-white px-3 py-2 text-sm text-center tracking-widest font-bold"
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            />
            <div className="flex gap-2 mt-1">
              <button
                onClick={handleOtpSubmit}
                disabled={loading}
                className="flex-1 rounded-xl bg-[#0d6b4f] py-2 text-sm text-white hover:bg-[#0a5640] disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Login'}
              </button>
              <button
                onClick={() => setShowOtp(false)}
                className="px-3 rounded-xl bg-white border border-[#d1d9d4] text-sm hover:bg-gray-50"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
