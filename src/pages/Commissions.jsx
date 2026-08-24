import { useEffect, useMemo, useState } from 'react';
import * as api from '../api/estimates.js';
import { theme, money, shortMoney } from '../theme.js';
import { COMMISSION_STRUCTURES } from '../constants/enums.js';
import { Page, Panel, Kpis, head, Empty } from '../components/Page.jsx';

const WON = 'Estimate Won HVAC';

export default function Commissions() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listEstimates({ range: 'all', pageSize: 200, sortKey: 'estimateDate', sortDir: 'desc' })
      .then((r) => setRows(r.rows || []))
      .finally(() => setLoading(false));
  }, []);

  const groups = useMemo(() => COMMISSION_STRUCTURES.map((name) => {
    const list = rows.filter((r) => r.commissionStructure === name);
    const won = list.filter((r) => r.status === WON || r.converted);
    const estimateValue = list.reduce((s, r) => s + Number(r.estimateAmount || 0), 0);
    const wonValue = won.reduce((s, r) => s + Number(r.jobAmount || r.estimateAmount || 0), 0);
    return {
      name,
      count: list.length,
      wonCount: won.length,
      estimateValue,
      wonValue,
      conversion: list.length ? Math.round((won.length / list.length) * 100) : 0,
      rows: list
    };
  }), [rows]);

  const totalWon = groups.reduce((s, g) => s + g.wonValue, 0);

  return (
    <Page
      title="Commissions"
      subtitle={loading ? 'Loading…' : groups.reduce((s, g) => s + g.count, 0) + ' estimates · ' + shortMoney(totalWon) + ' won value by structure'}
    >
      <Kpis cards={groups.map((g) => ({
        label: g.name,
        value: shortMoney(g.wonValue),
        note: g.count + ' estimates · ' + g.conversion + '% converted'
      }))} />

      {groups.map((g) => (
        <Panel key={g.name}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #EDE9E1', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div style={{ font: '600 15px/1.2 ' + theme.font.sans }}>{g.name}</div>
              <div style={{ font: '400 12px/1.4 ' + theme.font.sans, color: theme.color.muted, marginTop: 4 }}>
                {g.count} estimates · {money(g.estimateValue)} pipeline · {g.wonCount} won
              </div>
            </div>
            <div style={{ font: '500 18px/1 ' + theme.font.mono }}>{money(g.wonValue)}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '112px 1.4fr 1fr 110px 150px 110px', gap: 12, padding: '10px 15px', background: '#FBFAF8', borderBottom: '1px solid #EDE9E1' }}>
            <div style={head}>Estimate</div>
            <div style={head}>Customer</div>
            <div style={head}>Assigned</div>
            <div style={{ ...head, textAlign: 'right' }}>Amount</div>
            <div style={head}>Status</div>
            <div style={{ ...head, textAlign: 'right' }}>Won / job</div>
          </div>
          {g.rows.map((r) => {
            const [bg, fg] = theme.statusColor[r.status] || ['#F1EEE8', '#5C574C'];
            return (
              <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '112px 1.4fr 1fr 110px 150px 110px', gap: 12, padding: '13px 15px', borderBottom: '1px solid #F2EFE9', alignItems: 'center' }}>
                <div style={{ font: '500 13px/1 ' + theme.font.mono }}>{r.estimateNumber}</div>
                <div style={{ font: '500 13px/1.3 ' + theme.font.sans }}>{r.customer?.name}</div>
                <div style={{ font: '400 13px/1.3 ' + theme.font.sans, color: theme.color.body }}>{r.assignedUser?.name}</div>
                <div style={{ font: '500 13px/1 ' + theme.font.mono, textAlign: 'right' }}>{money(r.estimateAmount)}</div>
                <div>
                  <span style={{ display: 'inline-block', padding: '5px 9px', borderRadius: 5, font: '500 11px/1.1 ' + theme.font.sans, background: bg, color: fg }}>{r.status}</span>
                </div>
                <div style={{ font: '500 13px/1 ' + theme.font.mono, textAlign: 'right', color: r.converted ? theme.color.won : '#C4BEB2' }}>
                  {r.converted ? money(r.jobAmount) : '—'}
                </div>
              </div>
            );
          })}
          {g.rows.length === 0 && <Empty>No {g.name} estimates.</Empty>}
        </Panel>
      ))}
    </Page>
  );
}
