import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { theme } from '../theme.js';

export default function Login() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('12345678');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn(email, password);
      nav('/');
    } catch (err) {
      setError(err.message || 'Could not sign in');
    } finally {
      setBusy(false);
    }
  };

  const input = {
    width: '100%', boxSizing: 'border-box', height: 44, border: '1px solid ' + theme.color.inputBorder,
    borderRadius: 7, padding: '0 13px', font: '400 14px/1 ' + theme.font.sans, background: '#fff', outline: 'none'
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1.1fr .9fr' }}>
      <div style={{ background: theme.color.shell, padding: '56px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: theme.color.accent }} />
          <span style={{ font: '600 15px/1 ' + theme.font.sans, color: '#fff' }}>Estimate System</span>
        </div>
        <div style={{ maxWidth: 460 }}>
          <div style={{ font: '500 12px/1 ' + theme.font.mono, color: theme.color.accent, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 20 }}>Internal tool</div>
          <h1 style={{ font: '600 42px/1.1 ' + theme.font.sans, color: '#fff', margin: '0 0 18px', letterSpacing: '-.02em' }}>Estimates and jobs, in one place.</h1>
          <p style={{ font: '400 16px/1.6 ' + theme.font.sans, color: '#8E8B85', margin: 0 }}>
            Log an estimate, track it through to a job, and see the pipeline your team is working. Access is limited to staff accounts.
          </p>
        </div>
        <div style={{ font: '400 12px/1.6 ' + theme.font.sans, color: '#5F5C57' }}>Trouble signing in? Contact your system administrator.</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <form onSubmit={submit} style={{ width: '100%', maxWidth: 352 }}>
          <h2 style={{ font: '600 26px/1.2 ' + theme.font.sans, margin: '0 0 8px' }}>Sign in</h2>
          <p style={{ font: '400 14px/1.5 ' + theme.font.sans, color: theme.color.muted, margin: '0 0 28px' }}>Use your work account to continue.</p>

          <label style={{ display: 'block', font: '500 11px/1.4 ' + theme.font.sans, letterSpacing: '.06em', color: theme.color.muted, textTransform: 'uppercase', marginBottom: 7 }}>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="username" style={{ ...input, marginBottom: 18 }} />

          <label style={{ display: 'block', font: '500 11px/1.4 ' + theme.font.sans, letterSpacing: '.06em', color: theme.color.muted, textTransform: 'uppercase', marginBottom: 7 }}>Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" style={{ ...input, marginBottom: 22 }} />

          {error && <div style={{ marginBottom: 16, font: '400 13px/1.4 ' + theme.font.sans, color: theme.color.lost }}>{error}</div>}

          <button type="submit" disabled={busy} style={{ width: '100%', height: 46, border: 'none', borderRadius: 7, background: theme.color.accent, color: '#fff', font: '600 14px/1 ' + theme.font.sans, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1 }}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
