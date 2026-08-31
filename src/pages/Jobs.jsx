import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as api from '../api/estimates.js';
import { theme, money, shortMoney, shortDate } from '../theme.js';
import { JOB_STATUSES } from '../constants/enums.js';
import { Page, Panel, Kpis, control, head, Empty } from '../components/Page.jsx';

const JOB_COLOR = {
  'Work In Progress': ['#FDF3E3', '#8A5A08'],
  'Ready To Close': ['#E9F0FB', '#1E4B8F'],
  'Admin Approval': ['#F3EAFB', '#6B2F9B'],
  'Closed': ['#E4F3EB', '#0F6B45']
};

const COLUMNS = '112px 1.4fr 150px 92px 110px 1fr .9fr';

const STAGE_META = {
  'confirm-deposit': { title: 'Confirm Deposit', subtitle: 'payments waiting on accounting' },
  'Work In Progress': { title: 'Work In Progress', subtitle: 'active jobs' },
  'Ready To Close': { title: 'Ready to Close', subtitle: 'awaiting closeout' },
  'Admin Approval': { title: 'Admin Approval', subtitle: 'ready for payout' },
  'Closed': { title: 'Closed', subtitle: 'finished jobs' }
};

export default function Jobs() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const stage = params.get('stage') || '';
  const statusFilter = params.get('status') || 'all';
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState(statusFilter);

  useEffect(() => { setStatus(statusFilter); }, [statusFilter]);

  useEffect(() => {
    api.listEstimates({ range: 'all', converted: 'yes', pageSize: 200, sortKey: 'estimateDate', sortDir: 'desc' })
      .then((r) => setRows(r.rows || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (stage === 'confirm-deposit') {
        if (!r.unconfirmedPayments) return false;
      } else if (status === 'Work In Progress') {
        if (r.jobStatus !== status || r.unconfirmedPayments) return false;
      } else if (status !== 'all' && r.jobStatus !== status) return false;
      if (!needle) return true;
      return [r.estimateNumber, r.customer?.name, r.contact?.name, r.jobStatus]
        .some((v) => String(v || '').toLowerCase().includes(needle));
    });
  }, [rows, q, status, stage]);

  const counts = Object.fromEntries(JOB_STATUSES.map((s) => [s, rows.filter((r) => r.jobStatus === s).length]));
  const jobValue = filtered.reduce((s, r) => s + Number(r.jobAmount || 0), 0);
  const meta = STAGE_META[stage] || STAGE_META[statusFilter] || { title: 'Converted to Job', subtitle: 'jobs from won estimates' };

  return (
    <Page
      title={meta.title}
      subtitle={loading ? 'Loading…' : filtered.length + ' jobs · ' + shortMoney(jobValue) + ' ' + meta.subtitle}
    >
      <Kpis cards={[
        { label: 'In progress', value: String(counts['Work In Progress'] || 0), note: 'active installs' },
        { label: 'Ready to close', value: String(counts['Ready To Close'] || 0), note: 'awaiting closeout' },
        { label: 'Admin approval', value: String(counts['Admin Approval'] || 0), note: 'ready for payout' },
        { label: 'Closed', value: String(counts['Closed'] || 0), note: 'finished jobs' }
      ]} />

      <Panel>
        <div style={{ padding: '13px 15px', borderBottom: '1px solid #EDE9E1', display: 'flex', gap: 8 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search job, customer, contact…" style={{ ...control, flex: 1 }} />
          <select value={status} onChange={(e) => nav(e.target.value === 'all' ? '/jobs' : '/jobs?status=' + encodeURIComponent(e.target.value))} style={control}>
            <option value="all">All job statuses</option>
            {JOB_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: COLUMNS, gap: 12, padding: '10px 15px', background: '#FBFAF8', borderBottom: '1px solid #EDE9E1' }}>
          <div style={head}>Estimate</div>
          <div style={head}>Customer</div>
          <div style={head}>Job status</div>
          <div style={head}>Job date</div>
          <div style={{ ...head, textAlign: 'right' }}>Job amount</div>
          <div style={head}>Installers</div>
          <div style={head}>Assigned</div>
        </div>
        {filtered.map((r) => {
          const [bg, fg] = JOB_COLOR[r.jobStatus] || ['#F1EEE8', '#5C574C'];
          return (
            <div key={r.id} onClick={() => nav(stage === 'confirm-deposit' ? '/jobs/' + r.id + '?stage=confirm-deposit' : '/jobs/' + r.id + (r.jobStatus ? '?status=' + encodeURIComponent(r.jobStatus) : ''))} style={{ display: 'grid', gridTemplateColumns: COLUMNS, gap: 12, padding: '13px 15px', borderBottom: '1px solid #F2EFE9', alignItems: 'center', cursor: 'pointer' }}>
              <div style={{ font: '500 13px/1 ' + theme.font.mono }}>{r.estimateNumber}</div>
              <div>
                <div style={{ font: '500 13px/1.3 ' + theme.font.sans }}>{r.customer?.name}</div>
                <div style={{ font: '400 11px/1.3 ' + theme.font.sans, color: theme.color.faint, marginTop: 4 }}>{r.contact?.name}</div>
              </div>
              <div>
                <span style={{ display: 'inline-block', padding: '5px 9px', borderRadius: 5, font: '500 11px/1.1 ' + theme.font.sans, background: bg, color: fg }}>{r.jobStatus || '—'}</span>
              </div>
              <div style={{ font: '400 12px/1 ' + theme.font.mono, color: theme.color.muted }}>{shortDate(r.jobDate)}</div>
              <div style={{ font: '500 13px/1 ' + theme.font.mono, textAlign: 'right' }}>{money(r.jobAmount)}</div>
              <div style={{ font: '400 12px/1.3 ' + theme.font.sans, color: theme.color.body }}>
                {(r.installers || []).map((i) => i.name).join(', ') || '—'}
              </div>
              <div style={{ font: '400 13px/1.3 ' + theme.font.sans, color: theme.color.body }}>{r.assignedUser?.name}</div>
            </div>
          );
        })}
        </div>
        {!loading && filtered.length === 0 && <Empty>{stage === 'confirm-deposit' ? 'No payments waiting on deposit confirmation.' : 'No jobs in this stage.'}</Empty>}
      </Panel>
    </Page>
  );
}
