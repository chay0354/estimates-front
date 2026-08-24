import { theme } from '../theme.js';

export default function Distribution({ distribution, total }) {
  if (!distribution?.length) return null;
  return (
    <div style={{ background: theme.color.card, border: '1px solid ' + theme.color.border, borderRadius: 10, padding: '15px 17px 17px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 13 }}>
        <div style={{ font: '500 11px/1 ' + theme.font.sans, letterSpacing: '.06em', textTransform: 'uppercase', color: theme.color.faint }}>Distribution by status</div>
        <div style={{ font: '400 12px/1 ' + theme.font.sans, color: theme.color.muted }}>{total} estimates</div>
      </div>
      <div style={{ display: 'flex', height: 9, borderRadius: 5, overflow: 'hidden', background: '#F1EEE8', gap: 2 }}>
        {distribution.map((d) => (
          <div key={d.status} title={d.status} style={{ width: (total ? (d.count / total) * 100 : 0) + '%', background: theme.statusColor[d.status]?.[2] || '#C4BEB2' }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 13 }}>
        {distribution.map((d) => (
          <div key={d.status} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: theme.statusColor[d.status]?.[2] || '#C4BEB2' }} />
            <span style={{ font: '400 12px/1 ' + theme.font.sans, color: theme.color.body }}>{d.status}</span>
            <span style={{ font: '500 12px/1 ' + theme.font.mono, color: theme.color.faint }}>{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
