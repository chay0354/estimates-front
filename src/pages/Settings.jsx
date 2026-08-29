import { useEffect, useState } from 'react';
import * as api from '../api/estimates.js';
import { useAuth } from '../context/AuthContext.jsx';
import { theme } from '../theme.js';
import { SETTINGS_ROLES } from '../constants/enums.js';
import { Page, Panel, control, Empty } from '../components/Page.jsx';

const LISTS = [
  ['marketing-sources', 'Marketing Source'],
  ['repair-categories', 'Repair Categories'],
  ['expense-types', 'Expense Types'],
  ['vendors', 'Purchased From'],
  ['payment-methods', 'Payment Methods'],
  ['rebate-types', 'Rebate Lists'],
  ['installers', 'Installers (crews)'],
  ['technicians', 'Repair technicians']
];

export default function Settings() {
  const { user } = useAuth();
  const allowed = SETTINGS_ROLES.includes(user?.role);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = () => api.getSettings().then(setData).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  if (!allowed) {
    return <Page title="Settings" subtitle="Only a manager or admin can edit dropdown lists." />;
  }

  return (
    <Page title="Settings" subtitle="These lists feed every dropdown on estimates and jobs. Add names here instead of typing them freehand.">
      {error && <div style={{ color: theme.color.lost, font: '400 13px/1.4 ' + theme.font.sans }}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {LISTS.map(([key, label]) => (
          <ListCard key={key} list={key} label={label} rows={data?.[key] || []} onChange={load} onError={setError} />
        ))}
      </div>
    </Page>
  );
}

function ListCard({ list, label, rows, onChange, onError }) {
  const [name, setName] = useState('');
  const add = async () => {
    if (!name.trim()) return;
    try {
      await api.createListItem(list, { name: name.trim() });
      setName('');
      onChange();
    } catch (e) { onError(e.message); }
  };
  const toggle = async (row) => {
    try {
      await api.patchListItem(list, row.id, { active: !row.active });
      onChange();
    } catch (e) { onError(e.message); }
  };
  return (
    <Panel>
      <div style={{ padding: '14px 16px', font: '600 14px/1.2 ' + theme.font.sans, borderBottom: '1px solid #EDE9E1' }}>{label}</div>
      {rows.map((r) => (
        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #F2EFE9' }}>
          <span style={{ font: '400 13px/1.3 ' + theme.font.sans, color: r.active ? theme.color.ink : theme.color.faint, textDecoration: r.active ? 'none' : 'line-through' }}>{r.name}</span>
          <button onClick={() => toggle(r)} style={{ border: 'none', background: 'transparent', color: '#1E4B8F', font: '500 12px/1 ' + theme.font.sans, cursor: 'pointer' }}>
            {r.active ? 'Hide' : 'Show'}
          </button>
        </div>
      ))}
      {rows.length === 0 && <Empty>No items</Empty>}
      <div style={{ display: 'flex', gap: 8, padding: 14 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add name" style={{ ...control, flex: 1 }} />
        <button onClick={add} style={{ height: 34, padding: '0 12px', border: 'none', borderRadius: 6, background: theme.color.ink, color: '#fff', font: '600 12px/1 ' + theme.font.sans, cursor: 'pointer' }}>Add</button>
      </div>
    </Panel>
  );
}
