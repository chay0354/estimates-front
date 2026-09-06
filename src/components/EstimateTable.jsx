import { useNavigate } from 'react-router-dom';
import { theme, money, shortDate } from '../theme.js';
import { flowStage } from '../lib/flowStage.js';

const STAGE_COLOR = {
  'New Estimate': ['#F1EEE8', '#5C574C'],
  'Work In Progress': ['#FDF3E3', '#8A5A08'],
  'Confirm Deposit': ['#FDF1EC', '#8C2F09'],
  'Ready To Close': ['#E9F0FB', '#1E4B8F'],
  'Admin Approval': ['#F3EAFB', '#6B2F9B'],
  'Ready To Pay': ['#E8F6F3', '#0E6655'],
  Closed: ['#E4F3EB', '#0F6B45']
};

const COLUMNS = 'minmax(108px, 1fr) minmax(140px, 1.4fr) minmax(110px, 1fr) minmax(90px, .9fr) 78px 104px minmax(88px, .8fr) minmax(148px, 1.1fr) minmax(128px, 1fr) 168px';
const head = {
  font: '500 11px/1.2 ' + theme.font.sans,
  letterSpacing: '.05em',
  textTransform: 'uppercase',
  color: theme.color.faint,
  minWidth: 0
};
const cell = {
  minWidth: 0,
  overflowWrap: 'anywhere'
};

function Pill({ text, bg, fg }) {
  return (
    <span style={{
      display: 'inline-block',
      maxWidth: '100%',
      padding: '5px 8px',
      borderRadius: 5,
      font: '500 11px/1.25 ' + theme.font.sans,
      background: bg,
      color: fg,
      overflowWrap: 'anywhere'
    }}>{text}</span>
  );
}

export default function EstimateTable({ rows, sort, onSort, highlightId, onConvert, convertingId }) {
  const nav = useNavigate();
  const arrow = (key) => (sort.sortKey === key ? (sort.sortDir === 'desc' ? ' ↓' : ' ↑') : '');
  const row = {
    display: 'grid',
    gridTemplateColumns: COLUMNS,
    alignItems: 'center',
    columnGap: 12,
    minWidth: 1080,
    boxSizing: 'border-box'
  };

  return (
    <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
      <div style={{ ...row, padding: '10px 15px', background: '#FBFAF8', borderBottom: '1px solid #EDE9E1' }}>
        <div style={head}>Estimate</div>
        <div style={head}>Customer</div>
        <div style={head}>Type</div>
        <div style={head}>Assigned</div>
        <div style={{ ...head, cursor: 'pointer' }} onClick={() => onSort('estimateDate')}>Date{arrow('estimateDate')}</div>
        <div style={{ ...head, textAlign: 'right', cursor: 'pointer' }} onClick={() => onSort('estimateAmount')}>Amount{arrow('estimateAmount')}</div>
        <div style={head}>Commission</div>
        <div style={head}>Status</div>
        <div style={head}>Stage</div>
        <div style={head} />
      </div>

      {rows.map((r) => {
        const [statusBg, statusFg] = theme.statusColor[r.status] || ['#F1EEE8', '#5C574C'];
        const stage = flowStage(r);
        const [stageBg, stageFg] = STAGE_COLOR[stage] || ['#F1EEE8', '#5C574C'];
        return (
          <div
            key={r.id}
            style={{
              ...row,
              padding: '12px 15px',
              borderBottom: '1px solid #F2EFE9',
              background: r.id === highlightId ? '#FFFDF6' : '#fff'
            }}
          >
            <div style={cell}>
              <div style={{ font: '500 13px/1.3 ' + theme.font.mono }}>{r.estimateNumber}</div>
              <div style={{ font: '400 11px/1.3 ' + theme.font.sans, color: '#A8A296', marginTop: 4 }}>{r.marketingSource?.name}</div>
            </div>
            <div style={cell}>
              <div style={{ font: '500 13px/1.3 ' + theme.font.sans }}>{r.customer?.name}</div>
              <div style={{ font: '400 11px/1.3 ' + theme.font.sans, color: theme.color.faint, marginTop: 4 }}>{r.contact?.name}</div>
            </div>
            <div style={{ ...cell, font: '400 13px/1.3 ' + theme.font.sans, color: theme.color.body }}>{r.estimateType?.name}</div>
            <div style={{ ...cell, font: '400 13px/1.3 ' + theme.font.sans, color: theme.color.body }}>{r.assignedUser?.name}</div>
            <div style={{ ...cell, font: '400 12px/1.3 ' + theme.font.mono, color: theme.color.muted }}>{shortDate(r.estimateDate)}</div>
            <div style={{ ...cell, font: '500 13px/1.3 ' + theme.font.mono, textAlign: 'right' }}>{money(r.estimateAmount)}</div>
            <div style={{ ...cell, font: '400 12px/1.3 ' + theme.font.sans, color: theme.color.muted }}>{r.commissionStructure}</div>
            <div style={cell}><Pill text={r.status} bg={statusBg} fg={statusFg} /></div>
            <div style={cell}><Pill text={stage} bg={stageBg} fg={stageFg} /></div>
            <div style={{ ...cell, display: 'flex', justifyContent: 'flex-end', gap: 6, flexWrap: 'wrap' }}>
              <button onClick={() => nav('/estimates/' + r.id)} style={actionBtn}>Edit</button>
              {r.converted ? (
                <button onClick={() => onConvert(r, 'open')} style={actionBtn}>Open job</button>
              ) : (
                <button onClick={() => onConvert(r, 'convert')} disabled={convertingId === r.id} style={{ ...actionBtn, background: theme.color.ink, color: '#fff', borderColor: theme.color.ink }}>
                  {convertingId === r.id ? 'Converting…' : 'Convert'}
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
  cursor: 'pointer',
  whiteSpace: 'nowrap'
};
