import { useEffect, useMemo, useState } from 'react';
import * as api from '../api/estimates.js';
import { theme, money, shortMoney } from '../theme.js';
import { ESTIMATE_STATUSES, COMMISSION_STRUCTURES, RANGES } from '../constants/enums.js';
import { Page, Panel, Kpis, head, Empty, control } from '../components/Page.jsx';
import Distribution from '../components/Distribution.jsx';

export default function Reports() {
  const [data, setData] = useState({ rows: [], summary: { distribution: [] } });
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('all');

  useEffect(() => {
    setLoading(true);
    api.listEstimates({ range, pageSize: 200, sortKey: 'estimateDate', sortDir: 'desc' })
      .then(setData)
      .finally(() => setLoading(false));
  }, [range]);

  const rows = data.rows || [];
  const s = data.summary || {};

  const byType = useMemo(() => {
    const map = {};
    for (const r of rows) {
      const name = r.estimateType?.name || 'Unknown';
      map[name] = map[name] || { name, count: 0, value: 0 };
      map[name].count += 1;
      map[name].value += Number(r.estimateAmount || 0);
    }
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [rows]);

  const bySource = useMemo(() => {
    const map = {};
    for (const r of rows) {
      const name = r.marketingSource?.name || 'Unknown';
      map[name] = map[name] || { name, count: 0, value: 0 };
      map[name].count += 1;
      map[name].value += Number(r.estimateAmount || 0);
    }
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [rows]);

  const byMonth = useMemo(() => {
    const map = {};
    for (const r of rows) {
      const d = r.estimateDate ? new Date(r.estimateDate) : null;
      if (!d) continue;
      const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      map[key] = map[key] || { name: key, count: 0, value: 0, sort: d.getTime() };
      map[key].count += 1;
      map[key].value += Number(r.estimateAmount || 0);
    }
    return Object.values(map).sort((a, b) => a.sort - b.sort);
  }, [rows]);

  const byCommission = useMemo(() => COMMISSION_STRUCTURES.map((name) => {
    const list = rows.filter((r) => r.commissionStructure === name);
    return { name, count: list.length, value: list.reduce((sum, r) => sum + Number(r.estimateAmount || 0), 0) };
  }), [rows]);

  return (
    <Page
      title="Reports"
      subtitle={loading ? 'Loading…' : (s.total || 0) + ' estimates · ' + shortMoney(s.totalValue) + ' total value'}
      action={
        <select value={range} onChange={(e) => setRange(e.target.value)} style={control}>
          {RANGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      }
    >
      <Kpis cards={[
        { label: 'Total value', value: shortMoney(s.totalValue), note: (s.total || 0) + ' estimates in range' },
        { label: 'Open pipeline', value: shortMoney(s.openPipeline), note: (s.openCount || 0) + ' awaiting decision' },
        { label: 'Won value', value: shortMoney(s.wonValue), note: (s.wonCount || 0) + ' converted to jobs' },
        { label: 'Conversion', value: (s.conversionRate || 0) + '%', note: (s.needsFollowUp || 0) + ' need follow-up' }
      ]} />

      <Distribution distribution={s.distribution} total={s.total || 0} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Breakdown title="By estimate type" rows={byType} />
        <Breakdown title="By marketing source" rows={bySource} />
        <Breakdown title="By commission structure" rows={byCommission} />
        <Breakdown title="By month" rows={byMonth} />
      </div>

      <Panel>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #EDE9E1', font: '500 11px/1 ' + theme.font.sans, letterSpacing: '.06em', textTransform: 'uppercase', color: theme.color.faint }}>
          Status mix
        </div>
        {ESTIMATE_STATUSES.map((status) => {
          const count = rows.filter((r) => r.status === status).length;
          const value = rows.filter((r) => r.status === status).reduce((sum, r) => sum + Number(r.estimateAmount || 0), 0);
          const [bg, fg] = theme.statusColor[status] || ['#F1EEE8', '#5C574C'];
          return (
            <div key={status} style={{ display: 'grid', gridTemplateColumns: '1.6fr 80px 120px', gap: 12, padding: '12px 16px', borderBottom: '1px solid #F2EFE9', alignItems: 'center' }}>
              <div>
                <span style={{ display: 'inline-block', padding: '5px 9px', borderRadius: 5, font: '500 11px/1.1 ' + theme.font.sans, background: bg, color: fg }}>{status}</span>
              </div>
              <div style={{ font: '500 13px/1 ' + theme.font.mono, textAlign: 'right' }}>{count}</div>
              <div style={{ font: '500 13px/1 ' + theme.font.mono, textAlign: 'right' }}>{money(value)}</div>
            </div>
          );
        })}
        {!loading && rows.length === 0 && <Empty>No estimates in this range.</Empty>}
      </Panel>
    </Page>
  );
}

function Breakdown({ title, rows }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <Panel>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #EDE9E1', font: '500 11px/1 ' + theme.font.sans, letterSpacing: '.06em', textTransform: 'uppercase', color: theme.color.faint }}>
        {title}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 100px', gap: 12, padding: '10px 16px', background: '#FBFAF8', borderBottom: '1px solid #EDE9E1' }}>
        <div style={head}>Name</div>
        <div style={{ ...head, textAlign: 'right' }}>Count</div>
        <div style={{ ...head, textAlign: 'right' }}>Value</div>
      </div>
      {rows.map((r) => (
        <div key={r.name} style={{ padding: '12px 16px', borderBottom: '1px solid #F2EFE9' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 100px', gap: 12, alignItems: 'center' }}>
            <div style={{ font: '500 13px/1.3 ' + theme.font.sans }}>{r.name}</div>
            <div style={{ font: '500 13px/1 ' + theme.font.mono, textAlign: 'right' }}>{r.count}</div>
            <div style={{ font: '500 13px/1 ' + theme.font.mono, textAlign: 'right' }}>{money(r.value)}</div>
          </div>
          <div style={{ height: 5, background: '#F1EEE8', borderRadius: 4, marginTop: 8, overflow: 'hidden' }}>
            <div style={{ width: (r.value / max) * 100 + '%', height: '100%', background: theme.color.ink, opacity: 0.75 }} />
          </div>
        </div>
      ))}
      {rows.length === 0 && <Empty>Nothing to show.</Empty>}
    </Panel>
  );
}
