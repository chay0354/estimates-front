import { theme } from '../theme.js';

export function Page({ title, subtitle, action, children }) {
  return (
    <div style={{ padding: '26px 32px 48px', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <h1 style={{ font: '600 25px/1.2 ' + theme.font.sans, margin: 0, letterSpacing: '-.015em' }}>{title}</h1>
          {subtitle && (
            <p style={{ font: '400 13px/1.5 ' + theme.font.sans, color: theme.color.muted, margin: '6px 0 0' }}>{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function Panel({ children }) {
  return (
    <div style={{ background: theme.color.card, border: '1px solid ' + theme.color.border, borderRadius: 10, overflow: 'hidden' }}>
      {children}
    </div>
  );
}

export function Kpis({ cards }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(cards.length, 4)}, 1fr)`, gap: 12 }}>
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

export const control = {
  height: 34,
  border: '1px solid #DFDBD2',
  borderRadius: 6,
  padding: '0 12px',
  font: '400 13px/1 ' + theme.font.sans,
  background: '#FBFAF8',
  color: theme.color.body,
  outline: 'none'
};

export const head = {
  font: '500 11px/1 ' + theme.font.sans,
  letterSpacing: '.05em',
  textTransform: 'uppercase',
  color: theme.color.faint
};

export function Empty({ children }) {
  return (
    <div style={{ padding: 52, textAlign: 'center', font: '400 14px/1.5 ' + theme.font.sans, color: theme.color.faint }}>
      {children}
    </div>
  );
}
