import { theme, shortMoney } from '../theme.js';

export default function KpiRow({ summary }) {
  const cards = [
    { label: 'Open pipeline', value: shortMoney(summary.openPipeline), note: summary.openCount + ' estimates awaiting decision' },
    { label: 'Won value', value: shortMoney(summary.wonValue), note: summary.wonCount + ' converted to jobs' },
    { label: 'Conversion rate', value: summary.conversionRate + '%', note: 'of estimates in current view' },
    { label: 'Needs follow-up', value: String(summary.needsFollowUp), note: 'no estimate provided or pending' }
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
      {cards.map((c) => (
        <div key={c.label} style={{ background: theme.color.card, border: '1px solid ' + theme.color.border, borderRadius: 10, padding: '16px 17px' }}>
          <div style={{ font: '500 11px/1 ' + theme.font.sans, letterSpacing: '.06em', textTransform: 'uppercase', color: theme.color.faint }}>{c.label}</div>
          <div style={{ font: '500 27px/1 ' + theme.font.mono, margin: '13px 0 9px', letterSpacing: '-.02em' }}>{c.value}</div>
          <div style={{ font: '400 12px/1 ' + theme.font.sans, color: theme.color.muted }}>{c.note}</div>
        </div>
      ))}
    </div>
  );
}
