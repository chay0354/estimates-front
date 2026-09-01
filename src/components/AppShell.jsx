import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useFlow } from '../context/FlowContext.jsx';
import { theme } from '../theme.js';
import { SETTINGS_ROLES } from '../constants/enums.js';

const STAGES = [
  { n: 1, to: '/estimates/new', label: 'New Estimate', match: (p, q, flow) => flow ? flow.stage === 'new-estimate' : p === '/estimates/new' },
  { n: 2, to: '/jobs?status=Work In Progress', label: 'Work In Progress', match: (p, q, flow) => flow ? !flow.stage && flow.status === 'Work In Progress' : q.status === 'Work In Progress' && !q.stage },
  { n: 3, to: '/jobs?stage=confirm-deposit', label: 'Confirm Deposit', match: (p, q, flow) => flow ? flow.stage === 'confirm-deposit' : q.stage === 'confirm-deposit' },
  { n: 4, to: '/jobs?status=Ready To Close', label: 'Ready to Close', match: (p, q, flow) => flow ? !flow.stage && flow.status === 'Ready To Close' : q.status === 'Ready To Close' },
  { n: 5, to: '/jobs?status=Admin Approval', label: 'Admin Approval', match: (p, q, flow) => flow ? !flow.stage && flow.status === 'Admin Approval' : q.status === 'Admin Approval' },
  { n: 6, to: '/', label: 'Estimates/Jobs', match: (p, q, flow) => flow ? flow.stage === 'overview' : p === '/' }
];

function queryOf(search) {
  const q = new URLSearchParams(search);
  return { status: q.get('status') || '', stage: q.get('stage') || '' };
}

const navItem = (active) => ({
  padding: '8px 11px',
  borderRadius: 6,
  font: (active ? 500 : 400) + " 13px/1.2 " + theme.font.sans,
  color: active ? '#fff' : '#8E8B85',
  background: active ? theme.color.shellHover : 'transparent',
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 10
});

export default function AppShell({ children }) {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const q = queryOf(loc.search);
  const { flow } = useFlow() || {};
  const canSettings = SETTINGS_ROLES.includes(user?.role);

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '216px 1fr' }}>
      <aside style={{ background: theme.color.shell, padding: '22px 16px', display: 'flex', flexDirection: 'column', gap: 22, position: 'sticky', top: 0, height: '100vh', boxSizing: 'border-box' }}>
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
          <div style={{ padding: '4px 11px 8px', font: '500 10px/1 ' + theme.font.sans, letterSpacing: '.08em', textTransform: 'uppercase', color: '#5F5C57' }}>
            Flow
          </div>
          {STAGES.map((item) => {
            const active = item.match(loc.pathname, q, flow);
            return (
              <Link key={item.label} to={item.to} style={navItem(active)} aria-current={active ? 'page' : undefined}>
                <span style={{
                  width: 18, height: 18, borderRadius: 9, flex: '0 0 18px',
                  font: '500 10px/18px ' + theme.font.sans, textAlign: 'center',
                  background: active ? theme.color.accent : '#2A2C2F',
                  color: active ? '#fff' : '#8E8B85'
                }}>{item.n}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid #26282B', paddingTop: 12 }}>
          {canSettings && (
            <NavLink to="/settings" style={({ isActive }) => ({ ...navItem(isActive), marginBottom: 10 })}>Settings</NavLink>
          )}
          <div style={{ font: '500 12px/1.2 ' + theme.font.sans, color: '#fff' }}>{user?.name}</div>
          <button onClick={signOut} style={{ marginTop: 8, background: 'none', border: 'none', padding: 0, color: '#6E6B66', font: '400 11px/1 ' + theme.font.sans, cursor: 'pointer' }}>Sign out</button>
        </div>
      </aside>
      <main style={{ minWidth: 0 }}>{children}</main>
    </div>
  );
}
