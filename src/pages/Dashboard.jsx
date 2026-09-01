import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as api from '../api/estimates.js';
import { theme, shortMoney } from '../theme.js';
import Distribution from '../components/Distribution.jsx';
import Filters from '../components/Filters.jsx';
import EstimateTable from '../components/EstimateTable.jsx';
import { flowStage } from '../lib/flowStage.js';

const DEFAULTS = {
  q: '', range: 'all', status: 'all', assignedUserId: 'all', estimateTypeId: 'all',
  technicianId: 'all', commissionStructure: 'all', converted: 'any', sortKey: 'estimateDate', sortDir: 'desc', page: 1, pageSize: 200
};

export default function Dashboard() {
  const nav = useNavigate();
  const location = useLocation();
  const highlightId = location.state?.createdId;
  const convertedParam = new URLSearchParams(location.search).get('converted');

  const [filters, setFilters] = useState({ ...DEFAULTS, converted: convertedParam === 'no' || convertedParam === 'yes' ? convertedParam : 'any' });
  const [debouncedQ, setDebouncedQ] = useState('');
  const [lookups, setLookups] = useState(null);
  const [data, setData] = useState({ rows: [], summary: { distribution: [] } });
  const [loading, setLoading] = useState(true);
  const [convertingId, setConvertingId] = useState(null);
  const [banner, setBanner] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  useEffect(() => { api.getLookups().then(setLookups).catch(() => {}); }, []);
  useEffect(() => {
    if (convertedParam === 'no' || convertedParam === 'yes' || convertedParam === 'any') {
      setFilters((f) => (f.converted === convertedParam ? f : { ...f, converted: convertedParam, page: 1 }));
    }
  }, [convertedParam]);
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
  const allRows = data.rows || [];
  const stageCounts = useMemo(() => {
    const counts = {
      'New Estimate': 0,
      'Work In Progress': 0,
      'Confirm Deposit': 0,
      'Ready To Close': 0,
      'Admin Approval': 0,
      Closed: 0
    };
    for (const row of allRows) counts[flowStage(row)] = (counts[flowStage(row)] || 0) + 1;
    return counts;
  }, [allRows]);
  const visibleRows = useMemo(
    () => (stageFilter ? allRows.filter((row) => flowStage(row) === stageFilter) : allRows),
    [allRows, stageFilter]
  );

  const onConvert = async (row, action) => {
    if (action === 'open' || row.converted) {
      nav('/jobs/' + row.id + (row.jobStatus ? '?status=' + encodeURIComponent(row.jobStatus) : ''));
      return;
    }
    setConvertingId(row.id);
    setBanner('');
    try {
      await api.convertEstimate(row.id, {});
      nav('/jobs/' + row.id + '?status=' + encodeURIComponent('Work In Progress'));
    } catch (err) {
      setBanner(err.message || 'Could not convert this estimate');
      setConvertingId(null);
    }
  };

  return (
    <div style={{ padding: '26px 32px 48px', display: 'flex', flexDirection: 'column', gap: 22, minWidth: 0, width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <h1 style={{ font: '600 25px/1.2 ' + theme.font.sans, margin: 0, letterSpacing: '-.015em' }}>
            Estimates/Jobs
          </h1>
          <p style={{ font: '400 13px/1.5 ' + theme.font.sans, color: theme.color.muted, margin: '6px 0 0' }}>
            {loading ? 'Loading…' : visibleRows.length + ' records · ' + shortMoney(s.totalValue) + (stageFilter ? ' in ' + stageFilter : ' across every stage')}
          </p>
        </div>
        <button onClick={() => nav('/estimates/new')} style={{ height: 34, padding: '0 14px', border: 'none', borderRadius: 6, background: theme.color.ink, color: '#fff', font: '600 12px/1 ' + theme.font.sans, cursor: 'pointer' }}>
          New estimate
        </button>
      </div>

      {banner && (
        <div style={{ background: '#FDF1EC', border: '1px solid #F0C8B6', borderRadius: 8, padding: '12px 14px', font: '400 13px/1.5 ' + theme.font.sans, color: '#8C2F09' }}>{banner}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          ['New Estimate', 'not converted'],
          ['Work In Progress', 'active jobs'],
          ['Confirm Deposit', 'awaiting accounting'],
          ['Ready To Close', 'closeout'],
          ['Admin Approval', 'ready for payout'],
          ['Closed', 'finished jobs']
        ].map(([label, note]) => {
          const on = stageFilter === label;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setStageFilter(on ? '' : label)}
              style={{
                textAlign: 'left',
                background: on ? '#FFF8F3' : theme.color.card,
                border: '1px solid ' + (on ? theme.color.accent : theme.color.border),
                borderRadius: 10,
                padding: '16px 17px',
                cursor: 'pointer'
              }}
            >
              <div style={{ font: '500 11px/1 ' + theme.font.sans, letterSpacing: '.06em', textTransform: 'uppercase', color: theme.color.faint }}>{label}</div>
              <div style={{ font: '500 27px/1 ' + theme.font.mono, margin: '13px 0 9px', letterSpacing: '-.02em' }}>{String(stageCounts[label] || 0)}</div>
              <div style={{ font: '400 12px/1 ' + theme.font.sans, color: theme.color.muted }}>{note}</div>
            </button>
          );
        })}
      </div>
      <Distribution distribution={s.distribution} total={s.total || 0} />

      <div style={{ background: theme.color.card, border: '1px solid ' + theme.color.border, borderRadius: 10, overflow: 'hidden' }}>
        <Filters filters={filters} setFilter={setFilter} reset={() => { setFilters(DEFAULTS); setStageFilter(''); }} lookups={lookups} />
        <EstimateTable rows={visibleRows} sort={filters} onSort={onSort} highlightId={highlightId} onConvert={onConvert} convertingId={convertingId} />
      </div>
    </div>
  );
}
