import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as api from '../api/estimates.js';
import { theme, money, shortMoney, shortDate } from '../theme.js';
import { COMMISSION_STRUCTURES, JOB_STATUSES } from '../constants/enums.js';
import { Page, Panel, Kpis, control, head, Empty } from '../components/Page.jsx';
import LatePaymentBars from '../components/LatePaymentBars.jsx';

const JOB_COLOR = {
  'Work In Progress': ['#FDF3E3', '#8A5A08'],
  'Ready To Close': ['#E9F0FB', '#1E4B8F'],
  'Admin Approval': ['#F3EAFB', '#6B2F9B'],
  'Ready To Pay': ['#E8F6F3', '#0E6655'],
  'Closed': ['#E4F3EB', '#0F6B45']
};

const COLUMNS = '112px 1.4fr 150px 92px 110px 1fr .9fr';
const DEPOSIT_COLUMNS = '112px 1.4fr 150px 92px 110px 110px 1fr .9fr';

const STAGE_META = {
  'confirm-deposit': { title: 'Confirm Deposit', subtitle: 'deposits for every job, any stage' },
  'Work In Progress': { title: 'Work In Progress', subtitle: 'active jobs' },
  'Ready To Close': { title: 'Ready to Close', subtitle: 'awaiting closeout' },
  'Admin Approval': { title: 'Admin Approval', subtitle: 'ready for payout' },
  'Ready To Pay': { title: 'Ready to Pay', subtitle: 'tech payouts' },
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
  const [lookups, setLookups] = useState(null);
  const [pay, setPay] = useState({
    dateFrom: '', dateTo: '', month: '', year: '',
    employeeId: '', techId: '', commission: '', jobNumber: '', customerId: ''
  });

  const readyPay = statusFilter === 'Ready To Pay';

  useEffect(() => { setStatus(statusFilter); }, [statusFilter]);

  useEffect(() => {
    api.listEstimates({ range: 'all', converted: 'yes', pageSize: 200, sortKey: 'estimateDate', sortDir: 'desc' })
      .then((r) => setRows(r.rows || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (readyPay) api.getLookups().then(setLookups).catch(() => {});
  }, [readyPay]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (stage === 'confirm-deposit') {
        // every converted job, any stage — deposits stay editable after Ready to Close
      } else if (status === 'Work In Progress') {
        if (r.jobStatus !== status || r.awaitingDeposit) return false;
      } else if (status !== 'all' && r.jobStatus !== status) return false;

      if (readyPay) {
        const d = r.estimateDate ? new Date(r.estimateDate) : null;
        if (pay.dateFrom && (!d || d < new Date(pay.dateFrom + 'T00:00:00'))) return false;
        if (pay.dateTo && (!d || d > new Date(pay.dateTo + 'T23:59:59'))) return false;
        if (pay.month && (!d || String(d.getMonth() + 1) !== pay.month)) return false;
        if (pay.year && (!d || String(d.getFullYear()) !== pay.year)) return false;
        if (pay.employeeId && r.assignedUserId !== pay.employeeId && r.assignedUser?.id !== pay.employeeId) return false;
        if (pay.commission && r.commissionStructure !== pay.commission) return false;
        if (pay.jobNumber) {
          const n = pay.jobNumber.trim().toLowerCase();
          if (![r.jobNumber, r.estimateNumber].some((v) => String(v || '').toLowerCase().includes(n))) return false;
        }
        if (pay.customerId && r.customer?.id !== pay.customerId && r.customerId !== pay.customerId) return false;
        if (pay.techId && !(r.installers || []).some((i) => i.id === pay.techId)) return false;
      }

      if (!needle) return true;
      return [r.estimateNumber, r.jobNumber, r.customer?.name, r.contact?.name, r.jobStatus]
        .some((v) => String(v || '').toLowerCase().includes(needle));
    });
  }, [rows, q, status, stage, readyPay, pay]);

  const counts = Object.fromEntries(JOB_STATUSES.map((s) => [s, rows.filter((r) => r.jobStatus === s && !(s === 'Work In Progress' && r.awaitingDeposit)).length]));
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
        { label: 'Ready to pay', value: String(counts['Ready To Pay'] || 0), note: 'tech payouts' },
        { label: 'Closed', value: String(counts['Closed'] || 0), note: 'finished jobs' }
      ]} />

      {stage === 'confirm-deposit' && <LatePaymentBars rows={rows} />}

      <Panel>
        {readyPay ? (
          <ReadyPayFilters pay={pay} setPay={setPay} lookups={lookups} rows={rows} />
        ) : (
          <div style={{ padding: '13px 15px', borderBottom: '1px solid #EDE9E1', display: 'flex', gap: 8 }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search job, customer, contact…" style={{ ...control, flex: 1 }} />
            <select value={status} onChange={(e) => nav(e.target.value === 'all' ? '/jobs' : '/jobs?status=' + encodeURIComponent(e.target.value))} style={control}>
              <option value="all">All job statuses</option>
              {JOB_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
        <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: stage === 'confirm-deposit' ? DEPOSIT_COLUMNS : COLUMNS, gap: 12, padding: '10px 15px', background: '#FBFAF8', borderBottom: '1px solid #EDE9E1' }}>
          <div style={head}>Estimate</div>
          <div style={head}>Customer</div>
          <div style={head}>Job status</div>
          <div style={head}>Job date</div>
          <div style={{ ...head, textAlign: 'right' }}>Job amount</div>
          {stage === 'confirm-deposit' && <div style={{ ...head, textAlign: 'right' }}>Deposits</div>}
          <div style={head}>Installers</div>
          <div style={head}>Assigned</div>
        </div>
        {filtered.map((r) => {
          const [bg, fg] = JOB_COLOR[r.jobStatus] || ['#F1EEE8', '#5C574C'];
          return (
            <div key={r.id} onClick={() => nav(stage === 'confirm-deposit' ? '/jobs/' + r.id + '?stage=confirm-deposit' : '/jobs/' + r.id + (r.jobStatus ? '?status=' + encodeURIComponent(r.jobStatus) : ''))} style={{ display: 'grid', gridTemplateColumns: stage === 'confirm-deposit' ? DEPOSIT_COLUMNS : COLUMNS, gap: 12, padding: '13px 15px', borderBottom: '1px solid #F2EFE9', alignItems: 'center', cursor: 'pointer' }}>
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
              {stage === 'confirm-deposit' && (
                <div style={{ font: '500 13px/1 ' + theme.font.mono, textAlign: 'right', color: r.depositCovered ? theme.color.won : theme.color.body }}>
                  {money(r.totalPayments)}
                </div>
              )}
              <div style={{ font: '400 12px/1.3 ' + theme.font.sans, color: theme.color.body }}>
                {(r.installers || []).map((i) => i.name).join(', ') || '—'}
              </div>
              <div style={{ font: '400 13px/1.3 ' + theme.font.sans, color: theme.color.body }}>{r.assignedUser?.name}</div>
            </div>
          );
        })}
        </div>
        {!loading && filtered.length === 0 && <Empty>{stage === 'confirm-deposit' ? 'No jobs yet.' : 'No jobs in this stage.'}</Empty>}
      </Panel>
    </Page>
  );
}

const MONTHS = [
  ['1', 'January'], ['2', 'February'], ['3', 'March'], ['4', 'April'],
  ['5', 'May'], ['6', 'June'], ['7', 'July'], ['8', 'August'],
  ['9', 'September'], ['10', 'October'], ['11', 'November'], ['12', 'December']
];

const fieldLabel = {
  font: '500 11px/1.3 ' + theme.font.sans,
  color: theme.color.faint,
  letterSpacing: '.04em',
  textTransform: 'uppercase',
  marginBottom: 6
};

function ReadyPayFilters({ pay, setPay, lookups, rows }) {
  const set = (key) => (e) => setPay((p) => ({ ...p, [key]: e.target.value }));
  const years = Array.from(new Set((rows || []).map((r) => r.estimateDate && new Date(r.estimateDate).getFullYear()).filter(Boolean)))
    .sort((a, b) => b - a);
  const thisYear = new Date().getFullYear();
  if (!years.includes(thisYear)) years.unshift(thisYear);
  const techs = [...(lookups?.installers || []), ...(lookups?.technicians || [])]
    .filter((t, i, all) => all.findIndex((x) => x.id === t.id) === i);
  const customers = lookups?.customers?.length
    ? lookups.customers
    : Array.from(new Map((rows || []).filter((r) => r.customer?.id).map((r) => [r.customer.id, r.customer])).values());
  const empty = !pay.dateFrom && !pay.dateTo && !pay.month && !pay.year && !pay.employeeId && !pay.techId && !pay.commission && !pay.jobNumber && !pay.customerId;

  return (
    <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid #EDE9E1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <div style={{ font: '600 13px/1.2 ' + theme.font.sans }}>Filter payouts</div>
        <button
          type="button"
          onClick={() => setPay({ dateFrom: '', dateTo: '', month: '', year: '', employeeId: '', techId: '', commission: '', jobNumber: '', customerId: '' })}
          disabled={empty}
          style={{ border: 'none', background: 'transparent', color: empty ? '#C4BEB2' : theme.color.accent, font: '500 12px/1 ' + theme.font.sans, cursor: empty ? 'default' : 'pointer' }}
        >
          Clear
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        <label>
          <div style={fieldLabel}>Estimate from</div>
          <input type="date" value={pay.dateFrom} onChange={set('dateFrom')} style={{ ...control, width: '100%' }} />
        </label>
        <label>
          <div style={fieldLabel}>Estimate to</div>
          <input type="date" value={pay.dateTo} onChange={set('dateTo')} style={{ ...control, width: '100%' }} />
        </label>
        <label>
          <div style={fieldLabel}>Month</div>
          <select value={pay.month} onChange={set('month')} style={{ ...control, width: '100%' }}>
            <option value="">All months</option>
            {MONTHS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label>
          <div style={fieldLabel}>Year</div>
          <select value={pay.year} onChange={set('year')} style={{ ...control, width: '100%' }}>
            <option value="">All years</option>
            {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
          </select>
        </label>
        <label>
          <div style={fieldLabel}>Employee</div>
          <select value={pay.employeeId} onChange={set('employeeId')} style={{ ...control, width: '100%' }}>
            <option value="">All employees</option>
            {(lookups?.users || []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </label>
        <label>
          <div style={fieldLabel}>Lead tech</div>
          <select value={pay.techId} onChange={set('techId')} style={{ ...control, width: '100%' }}>
            <option value="">All techs</option>
            {techs.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <label>
          <div style={fieldLabel}>Commission</div>
          <select value={pay.commission} onChange={set('commission')} style={{ ...control, width: '100%' }}>
            <option value="">All structures</option>
            {COMMISSION_STRUCTURES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>
          <div style={fieldLabel}>Job number</div>
          <input value={pay.jobNumber} onChange={set('jobNumber')} placeholder="JOB / EST" style={{ ...control, width: '100%' }} />
        </label>
        <label>
          <div style={fieldLabel}>Customer</div>
          <select value={pay.customerId} onChange={set('customerId')} style={{ ...control, width: '100%' }}>
            <option value="">All customers</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}
