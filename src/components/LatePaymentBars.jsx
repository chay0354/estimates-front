import { money, theme } from '../theme.js';

const AGING = [
  { key: '0-15', label: '0–15 days', hint: 'Current', color: '#3B6FC4' },
  { key: '15-30', label: '15–30 days', hint: 'Watch', color: '#0F7B4F' },
  { key: '30-60', label: '30–60 days', hint: 'Aging', color: '#C9A227' },
  { key: '60-90', label: '60–90 days', hint: 'Late', color: '#C2410C' },
  { key: '90+', label: '90+ days', hint: 'Critical', color: '#B3261E' }
];

const REBATES = [
  { key: 'full', label: 'Full rebate', color: '#6B2F9B' },
  { key: 'mixed', label: 'Mixed rebate', color: '#4A235A' }
];

function daysBetween(from, to) {
  const a = new Date(from);
  const b = new Date(to);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((b - a) / 86400000));
}

function bucket(days) {
  if (days < 15) return '0-15';
  if (days < 30) return '15-30';
  if (days < 60) return '30-60';
  if (days < 90) return '60-90';
  return '90+';
}

export function latePaymentTotals(rows) {
  const totals = { '0-15': 0, '15-30': 0, '30-60': 0, '60-90': 0, '90+': 0, full: 0, mixed: 0 };
  const today = new Date();
  for (const row of rows || []) {
    const start = row.estimateDate || row.createdAt || row.jobDate;
    const jobAmount = Number(row.jobAmount || row.estimateAmount || 0);
    let paid = 0;
    for (const p of row.deposits || []) {
      const amount = Number(p.amount || 0);
      paid += amount;
      totals[bucket(daysBetween(start, p.paymentDate || today))] += amount;
    }
    const remaining = Math.round((jobAmount - paid) * 100) / 100;
    if (remaining > 0) totals[bucket(daysBetween(start, today))] += remaining;
    if (row.fullRebate) totals.full += remaining > 0 ? remaining : jobAmount;
    if (row.mixedRebate) totals.mixed += remaining > 0 ? remaining : jobAmount;
  }
  return totals;
}

function Row({ label, hint, color, value, max }) {
  const pct = max > 0 ? Math.max(value > 0 ? 8 : 0, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: color, flex: '0 0 8px' }} />
          <span style={{ font: '500 13px/1.2 ' + theme.font.sans, color: theme.color.ink }}>{label}</span>
          {hint && <span style={{ font: '400 11px/1 ' + theme.font.sans, color: theme.color.faint }}>{hint}</span>}
        </div>
        <span style={{ font: '500 13px/1 ' + theme.font.mono, color: theme.color.ink, fontVariantNumeric: 'tabular-nums' }}>{money(value)}</span>
      </div>
      <div style={{ height: 8, borderRadius: 99, background: '#F1EEE8', overflow: 'hidden' }}>
        <div style={{
          width: pct + '%',
          height: '100%',
          borderRadius: 99,
          background: color,
          opacity: value > 0 ? 1 : 0.22,
          transition: 'width .25s ease'
        }} />
      </div>
    </div>
  );
}

export default function LatePaymentBars({ rows }) {
  const totals = latePaymentTotals(rows);
  const agingMax = Math.max(1, ...AGING.map((b) => totals[b.key] || 0));
  const agingSum = AGING.reduce((s, b) => s + (totals[b.key] || 0), 0);

  return (
    <div style={{
      background: theme.color.card,
      border: '1px solid ' + theme.color.border,
      borderRadius: 10,
      overflow: 'hidden'
    }}>
      <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid #EDE9E1', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16 }}>
        <div>
          <div style={{ font: '600 15px/1.2 ' + theme.font.sans, color: theme.color.ink }}>Late payments</div>
          <div style={{ font: '400 12px/1.4 ' + theme.font.sans, color: theme.color.muted, marginTop: 4 }}>
            Days from estimate date to the deposit in Confirm Deposit. Open balances count through today.
          </div>
        </div>
        <div style={{ font: '500 18px/1 ' + theme.font.mono, color: theme.color.ink, whiteSpace: 'nowrap' }}>{money(agingSum)}</div>
      </div>

      <div style={{ padding: '18px 18px 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {AGING.map((bar) => (
          <Row key={bar.key} label={bar.label} hint={bar.hint} color={bar.color} value={totals[bar.key] || 0} max={agingMax} />
        ))}
      </div>

      <div style={{ margin: '8px 18px 0', borderTop: '1px solid #EDE9E1' }} />

      <div style={{ padding: '16px 18px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {REBATES.map((bar) => (
          <div key={bar.key} style={{
            background: '#FBFAF8',
            border: '1px solid #EDE9E1',
            borderRadius: 8,
            padding: '12px 14px'
          }}>
            <div style={{ font: '500 11px/1 ' + theme.font.sans, letterSpacing: '.06em', textTransform: 'uppercase', color: theme.color.faint }}>{bar.label}</div>
            <div style={{ font: '500 20px/1.3 ' + theme.font.mono, color: bar.color, marginTop: 8 }}>{money(totals[bar.key] || 0)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
