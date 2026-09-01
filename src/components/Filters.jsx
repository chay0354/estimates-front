import { theme } from '../theme.js';
import { ESTIMATE_STATUSES, COMMISSION_STRUCTURES, RANGES } from '../constants/enums.js';

const control = {
  height: 34,
  border: '1px solid #DFDBD2',
  borderRadius: 6,
  padding: '0 12px',
  font: '400 13px/1 ' + theme.font.sans,
  background: '#FBFAF8',
  color: theme.color.body,
  outline: 'none'
};

export default function Filters({ filters, setFilter, reset, lookups }) {
  return (
    <div style={{ padding: '13px 15px', borderBottom: '1px solid #EDE9E1', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      <input
        value={filters.q}
        onChange={(e) => setFilter('q', e.target.value)}
        placeholder="Search estimate #, customer, contact…"
        style={{ ...control, flex: 1, minWidth: 220 }}
      />
      <select value={filters.range} onChange={(e) => setFilter('range', e.target.value)} style={control}>
        {RANGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)} style={control}>
        <option value="all">All statuses</option>
        {ESTIMATE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select value={filters.assignedUserId} onChange={(e) => setFilter('assignedUserId', e.target.value)} style={control}>
        <option value="all">All users</option>
        {(lookups?.users || []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
      </select>
      <select value={filters.estimateTypeId} onChange={(e) => setFilter('estimateTypeId', e.target.value)} style={control}>
        <option value="all">All types</option>
        {(lookups?.estimateTypes || []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <select value={filters.technicianId || 'all'} onChange={(e) => setFilter('technicianId', e.target.value)} style={control}>
        <option value="all">All technicians</option>
        {(lookups?.technicians || []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <select value={filters.commissionStructure} onChange={(e) => setFilter('commissionStructure', e.target.value)} style={control}>
        <option value="all">All commissions</option>
        {COMMISSION_STRUCTURES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <select value={filters.converted} onChange={(e) => setFilter('converted', e.target.value)} style={control}>
        <option value="any">Converted: any</option>
        <option value="yes">Converted: yes</option>
        <option value="no">Converted: no</option>
      </select>
      <button onClick={reset} style={{ ...control, background: 'transparent', border: '1px solid transparent', color: theme.color.accent, font: '500 12px/1 ' + theme.font.sans, cursor: 'pointer' }}>Reset</button>
    </div>
  );
}
