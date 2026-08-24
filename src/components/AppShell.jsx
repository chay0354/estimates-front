import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { theme } from '../theme.js';

const navItem = (active) => ({
  padding: '9px 11px',
  borderRadius: 6,
  font: (active ? 500 : 400) + " 13px/1 " + theme.font.sans,
  color: active ? '#fff' : '#8E8B85',
  background: active ? theme.color.shellHover : 'transparent',
  textDecoration: 'none'
});

export default function AppShell({ children }) {
  const { user, signOut } = useAuth();
  const nav = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '216px 1fr' }}>
      <aside style={{ background: theme.color.shell, padding: '22px 16px', display: 'flex', flexDirection: 'column', gap: 26, position: 'sticky', top: 0, height: '100vh', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 6px' }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: theme.color.accent }} />
          <span style={{ font: '600 14px/1 ' + theme.font.sans, color: '#fff' }}>Estimate System</span>
        </div>

        <button
          onClick={() => nav('/estimates/new')}
          style={{ height: 38, border: 'none', borderRadius: 7, background: theme.color.accent, color: '#fff', font: '600 13px/1 ' + theme.font.sans, cursor: 'pointer' }}
        >
          + New Estimate
        </button>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Link to="/" style={navItem(true)}>Estimates</Link>
          <span style={navItem(false)}>Jobs</span>
          <span style={navItem(false)}>Customers</span>
          <span style={navItem(false)}>Commissions</span>
          <span style={navItem(false)}>Reports</span>
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid #26282B', paddingTop: 12 }}>
          <div style={{ font: '500 12px/1.2 ' + theme.font.sans, color: '#fff' }}>{user?.name}</div>
          <button onClick={signOut} style={{ marginTop: 8, background: 'none', border: 'none', padding: 0, color: '#6E6B66', font: '400 11px/1 ' + theme.font.sans, cursor: 'pointer' }}>Sign out</button>
        </div>
      </aside>
      <main style={{ minWidth: 0 }}>{children}</main>
    </div>
  );
}
