import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError('');
    const fn =
      mode === 'login'
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });
    const { error } = await fn;
    if (error) setError(error.message);
    setBusy(false);
  };

  return (
    <div className="page" style={{ maxWidth: 420, margin: '0 auto', paddingTop: 'calc(60px + var(--safe-top))' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: '2.5rem' }}>🏗️</div>
        <h1>Ремонт Бюджет</h1>
        <p className="muted">Общ бюджет. Много проекти. Пълна картина.</p>
      </div>
      <div className="card">
        <label>Имейл</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <label>Парола</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
        {error && <p style={{ color: 'var(--danger)', marginTop: 8, fontSize: '0.85rem' }}>{error}</p>}
        <button style={{ width: '100%', marginTop: 16 }} onClick={submit} disabled={busy}>
          {mode === 'login' ? 'Вход' : 'Регистрация'}
        </button>
        <p className="muted" style={{ textAlign: 'center', marginTop: 12, cursor: 'pointer' }}
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Нямаш акаунт? Регистрирай се' : 'Имаш акаунт? Влез'}
        </p>
      </div>
    </div>
  );
}
