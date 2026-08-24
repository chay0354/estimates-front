import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api/estimates.js';
import { theme, money, shortMoney } from '../theme.js';
import { Page, Panel, Kpis, control, head, Empty } from '../components/Page.jsx';
import { TextField } from '../components/Field.jsx';

const COLUMNS = '1.3fr 1fr 120px 1.4fr 90px 110px';

export default function Customers() {
  const nav = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState({ name: '', contactName: '', phone: '', email: '', address: '' });

  const load = () => Promise.all([
    api.getLookups(),
    api.listEstimates({ range: 'all', pageSize: 200, sortKey: 'estimateDate', sortDir: 'desc' })
  ]).then(([lookups, list]) => {
    setCustomers(lookups.customers || []);
    setEstimates(list.rows || []);
  });

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => customers.map((c) => {
    const related = estimates.filter((e) => e.customer?.id === c.id || e.customerId === c.id);
    const contact = c.contacts?.[0];
    return {
      ...c,
      contact,
      estimateCount: related.length,
      totalValue: related.reduce((s, e) => s + Number(e.estimateAmount || 0), 0)
    };
  }), [customers, estimates]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((c) => [c.name, c.contact?.name, c.contact?.phone, c.contact?.email, c.addresses?.[0]?.line]
      .some((v) => String(v || '').toLowerCase().includes(needle)));
  }, [rows, q]);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await api.createCustomer(draft);
      setDraft({ name: '', contactName: '', phone: '', email: '', address: '' });
      setAdding(false);
      await load();
    } catch (err) {
      setError(err.message || 'Could not save customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page
      title="Customers"
      subtitle={loading ? 'Loading…' : filtered.length + ' customers · ' + shortMoney(rows.reduce((s, r) => s + r.totalValue, 0)) + ' in estimates'}
      action={
        <button onClick={() => setAdding((v) => !v)} style={{ height: 34, padding: '0 14px', border: 'none', borderRadius: 6, background: theme.color.ink, color: '#fff', font: '600 12px/1 ' + theme.font.sans, cursor: 'pointer' }}>
          {adding ? 'Cancel' : 'Add customer'}
        </button>
      }
    >
      <Kpis cards={[
        { label: 'Customers', value: String(customers.length), note: 'in the database' },
        { label: 'With estimates', value: String(rows.filter((r) => r.estimateCount > 0).length), note: 'have at least one estimate' },
        { label: 'Pipeline value', value: shortMoney(rows.reduce((s, r) => s + r.totalValue, 0)), note: 'across all customers' },
        { label: 'Avg per customer', value: shortMoney(customers.length ? rows.reduce((s, r) => s + r.totalValue, 0) / customers.length : 0), note: 'estimate value' }
      ]} />

      {adding && (
        <Panel>
          <div style={{ padding: '18px 20px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px 18px' }}>
            <TextField label="Customer name" required value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
            <TextField label="Contact name" required value={draft.contactName} onChange={(e) => setDraft((d) => ({ ...d, contactName: e.target.value }))} />
            <TextField label="Phone" required value={draft.phone} onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))} />
            <TextField label="Email" value={draft.email} onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))} />
            <div style={{ gridColumn: 'span 2' }}>
              <TextField label="Address" required value={draft.address} onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))} />
            </div>
            <div style={{ gridColumn: 'span 3', display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={save} disabled={saving} style={{ height: 34, padding: '0 16px', border: 'none', borderRadius: 6, background: theme.color.accent, color: '#fff', font: '600 12px/1 ' + theme.font.sans, cursor: 'pointer' }}>
                {saving ? 'Saving…' : 'Save customer'}
              </button>
              {error && <span style={{ font: '400 12px/1 ' + theme.font.sans, color: theme.color.lost }}>{error}</span>}
            </div>
          </div>
        </Panel>
      )}

      <Panel>
        <div style={{ padding: '13px 15px', borderBottom: '1px solid #EDE9E1' }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customer, contact, phone…" style={{ ...control, width: '100%', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: COLUMNS, gap: 12, padding: '10px 15px', background: '#FBFAF8', borderBottom: '1px solid #EDE9E1' }}>
          <div style={head}>Customer</div>
          <div style={head}>Contact</div>
          <div style={head}>Phone</div>
          <div style={head}>Address</div>
          <div style={{ ...head, textAlign: 'right' }}>Estimates</div>
          <div style={{ ...head, textAlign: 'right' }}>Value</div>
        </div>
        {filtered.map((c) => (
          <div key={c.id} style={{ display: 'grid', gridTemplateColumns: COLUMNS, gap: 12, padding: '13px 15px', borderBottom: '1px solid #F2EFE9', alignItems: 'center' }}>
            <div>
              <div style={{ font: '500 13px/1.3 ' + theme.font.sans }}>{c.name}</div>
              <div style={{ font: '400 11px/1.3 ' + theme.font.sans, color: theme.color.faint, marginTop: 4 }}>{c.contact?.email || '—'}</div>
            </div>
            <div style={{ font: '400 13px/1.3 ' + theme.font.sans, color: theme.color.body }}>{c.contact?.name || '—'}</div>
            <div style={{ font: '400 12px/1 ' + theme.font.mono, color: theme.color.muted }}>{c.contact?.phone || '—'}</div>
            <div style={{ font: '400 12px/1.3 ' + theme.font.sans, color: theme.color.body }}>{c.addresses?.[0]?.line || '—'}</div>
            <div style={{ font: '500 13px/1 ' + theme.font.mono, textAlign: 'right' }}>{c.estimateCount}</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>
              <span style={{ font: '500 13px/1 ' + theme.font.mono }}>{money(c.totalValue)}</span>
              <button onClick={() => nav('/estimates/new')} style={{ height: 28, padding: '0 9px', border: '1px solid ' + theme.color.inputBorder, borderRadius: 5, background: '#fff', font: '500 11px/1 ' + theme.font.sans, cursor: 'pointer' }}>New est.</button>
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && <Empty>No customers yet.</Empty>}
      </Panel>
    </Page>
  );
}
