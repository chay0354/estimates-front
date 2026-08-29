import { theme, money, shortDate } from '../theme.js';

const COLUMNS = '112px 1.4fr 1fr .9fr 92px 110px 100px 150px 150px';
const head = { font: '500 11px/1 ' + theme.font.sans, letterSpacing: '.05em', textTransform: 'uppercase', color: theme.color.faint };

export default function EstimateTable({ rows, sort, onSort, highlightId, onConvert, convertingId }) {
  const arrow = (key) => (sort.sortKey === key ? (sort.sortDir === 'desc' ? ' ↓' : ' ↑') : '');

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: COLUMNS, alignItems: 'center', gap: 12, padding: '10px 15px', background: '#FBFAF8', borderBottom: '1px solid #EDE9E1' }}>
        <div style={head}>Estimate</div>
        <div style={head}>Customer</div>
        <div style={head}>Type</div>
        <div style={head}>Assigned</div>
        <div style={{ ...head, cursor: 'pointer' }} onClick={() => onSort('estimateDate')}>Date{arrow('estimateDate')}</div>
        <div style={{ ...head, textAlign: 'right', cursor: 'pointer' }} onClick={() => onSort('estimateAmount')}>Amount{arrow('estimateAmount')}</div>
        <div style={head}>Commission</div>
        <div style={head}>Status</div>
        <div style={head}>Job</div>
        <div style={head}></div>
      </div>

      {rows.map((r) => {
        const [bg, fg] = theme.statusColor[r.status] || ['#F1EEE8', '#5C574C'];
        return (
          <div key={r.id} style={{ display: 'grid', gridTemplateColumns: COLUMNS, alignItems: 'center', gap: 12, padding: '13px 15px', borderBottom: '1px solid #F2EFE9', background: r.id === highlightId ? '#FFFDF6' : '#fff' }}>
            <div>
              <div style={{ font: '500 13px/1 ' + theme.font.mono }}>{r.estimateNumber}</div>
              <div style={{ font: '400 11px/1 ' + theme.font.sans, color: '#A8A296', marginTop: 5 }}>{r.marketingSource?.name}</div>
            </div>
            <div>
              <div style={{ font: '500 13px/1.3 ' + theme.font.sans }}>{r.customer?.name}</div>
              <div style={{ font: '400 11px/1.3 ' + theme.font.sans, color: theme.color.faint, marginTop: 4 }}>{r.contact?.name}</div>
            </div>
            <div style={{ font: '400 13px/1.3 ' + theme.font.sans, color: theme.color.body }}>{r.estimateType?.name}</div>
            <div style={{ font: '400 13px/1.3 ' + theme.font.sans, color: theme.color.body }}>{r.assignedUser?.name}</div>
            <div style={{ font: '400 12px/1 ' + theme.font.mono, color: theme.color.muted }}>{shortDate(r.estimateDate)}</div>
            <div style={{ font: '500 13px/1 ' + theme.font.mono, textAlign: 'right' }}>{money(r.estimateAmount)}</div>
            <div style={{ font: '400 12px/1 ' + theme.font.sans, color: theme.color.muted }}>{r.commissionStructure}</div>
            <div>
              <span style={{ display: 'inline-block', padding: '5px 9px', borderRadius: 5, font: '500 11px/1.1 ' + theme.font.sans, background: bg, color: fg }}>{r.status}</span>
            </div>
            <div style={{ font: '400 11px/1.2 ' + theme.font.sans, color: r.converted ? theme.color.won : '#C4BEB2' }}>{r.converted ? r.jobStatus : '—'}</div>
            <div style={{ textAlign: 'right' }}>
              {r.converted ? (
                <button onClick={() => onConvert(r, 'open')} style={actionBtn}>Open job</button>
              ) : (
                <button onClick={() => onConvert(r, 'convert')} disabled={convertingId === r.id} style={{ ...actionBtn, background: theme.color.ink, color: '#fff', borderColor: theme.color.ink }}>
                  {convertingId === r.id ? 'Converting…' : 'Convert to Job'}
                </button>
              )}
            </div>
          </div>
        );
      })}

      {rows.length === 0 && (
        <div style={{ padding: 52, textAlign: 'center', font: '400 14px/1.5 ' + theme.font.sans, color: theme.color.faint }}>
          No estimates match these filters.
        </div>
      )}
    </div>
  );
}

const actionBtn = {
  height: 28,
  padding: '0 9px',
  border: '1px solid ' + theme.color.inputBorder,
  borderRadius: 5,
  background: '#fff',
  font: '500 11px/1 ' + theme.font.sans,
  cursor: 'pointer'
};
