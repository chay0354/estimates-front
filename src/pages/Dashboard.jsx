import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as api from '../api/estimates.js';
import { theme, shortMoney } from '../theme.js';
import KpiRow from '../components/KpiRow.jsx';
import Distribution from '../components/Distribution.jsx';
import Filters from '../components/Filters.jsx';
import EstimateTable from '../components/EstimateTable.jsx';

const DEFAULTS = {
  q: '', range: 'all', status: 'all', assignedUserId: 'all', estimateTypeId: 'all',
  commissionStructure: 'all', converted: 'any', sortKey: 'estimateDate', sortDir: 'desc', page: 1
};

export default function Dashboard() {
  const nav = useNavigate();
  const highlightId = useLocation().state?.createdId;

  const [filters, setFilters] = useState(DEFAULTS);
  const [debouncedQ, setDebouncedQ] = useState('');
  const [lookups, setLookups] = useState(null);
  const [data, setData] = useState({ rows: [], summary: { distribution: [] } });
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.getLookups().then(setLookups).catch(() => {}); }, []);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(filters.q), 250);
    return () => clearTimeout(t);
  }, [filters.q]);

  const query = useMemo(() => ({ ...filters, q: debouncedQ }), [filters, debouncedQ]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.listEstimates(query)
      .then((r) => { if (alive) setData(r); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [query]);

  const setFilter = useCallback((key, value) => setFilters((f) => ({ ...f, [key]: value, page: 1 })), []);
  const onSort = (key) =>
    setFilters((f) => ({ ...f, sortKey: key, sortDir: f.sortKey === key && f.sortDir === 'desc' ? 'asc' : 'desc' }));

  const s = data.summary || {};

  return (
    <div style={{ padding: '26px 32px 48px', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <h1 style={{ font: '600 25px/1.2 ' + theme.font.sans, margin: 0, letterSpacing: '-.015em' }}>Estimate pipeline</h1>
          <p style={{ font: '400 13px/1.5 ' + theme.font.sans, color: theme.color.muted, margin: '6px 0 0' }}>
            {loading ? 'Loading…' : (s.total || 0) + ' estimates · ' + shortMoney(s.totalValue) + ' total value'}
          </p>
        </div>
        <button onClick={() => nav('/estimates/new')} style={{ height: 34, padding: '0 14px', border: 'none', borderRadius: 6, background: theme.color.ink, color: '#fff', font: '600 12px/1 ' + theme.font.sans, cursor: 'pointer' }}>
          New estimate
        </button>
      </div>

      <KpiRow summary={{ openPipeline: 0, wonValue: 0, conversionRate: 0, needsFollowUp: 0, openCount: 0, wonCount: 0, ...s }} />
      <Distribution distribution={s.distribution} total={s.total || 0} />

      <div style={{ background: theme.color.card, border: '1px solid ' + theme.color.border, borderRadius: 10, overflow: 'hidden' }}>
        <Filters filters={filters} setFilter={setFilter} reset={() => setFilters(DEFAULTS)} lookups={lookups} />
        <EstimateTable rows={data.rows} sort={filters} onSort={onSort} highlightId={highlightId} />
      </div>
    </div>
  );
}
