import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import * as api from '../api/estimates.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useFlow } from '../context/FlowContext.jsx';
import { theme, money, shortDate } from '../theme.js';
import { CREWS } from '../constants/enums.js';
import { Page, Panel, control, head, Empty } from '../components/Page.jsx';

const JOB_COLOR = {
  'Work In Progress': ['#FDF3E3', '#8A5A08'],
  'Ready To Close': ['#E9F0FB', '#1E4B8F'],
  'Admin Approval': ['#F3EAFB', '#6B2F9B'],
  'Closed': ['#E4F3EB', '#0F6B45']
};

const NEXT = {
  'Work In Progress': 'Ready To Close',
  'Ready To Close': 'Admin Approval',
  'Admin Approval': 'Closed'
};

const today = () => new Date().toISOString().slice(0, 10);
const num = (v) => Number(String(v || '').replace(/[^0-9.]/g, '')) || 0;

const primary = {
  height: 34, padding: '0 14px', border: 'none', borderRadius: 6,
  background: theme.color.ink, color: '#fff', font: '600 12px/1 ' + theme.font.sans, cursor: 'pointer'
};
const linkBtn = {
  height: 32, padding: '0 8px', border: 'none', background: 'transparent',
  color: '#1E4B8F', font: '500 12px/1 ' + theme.font.sans, cursor: 'pointer'
};
const iconLink = { color: '#8E887C', display: 'flex', alignItems: 'center' };
const icon = { width: 16, height: 16, stroke: 'currentColor', fill: 'none', strokeWidth: 1.6 };

function SaveIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#3B6FC4" strokeWidth="1.8">
      <path d="M5 4h11l3 3v13H5V4z" />
      <path d="M8 4v5h8V4M8 20v-7h8v7" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" {...icon}><circle cx="12" cy="12" r="9" /><path d="M10 8l4 4-4 4" /></svg>
  );
}
function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" {...icon}><path d="M6.5 3.5h3l1 4-2 1.5a12 12 0 006 6l1.5-2 4 1v3A2 2 0 0118 19 14 14 0 015 6a2 2 0 011.5-2.5z" /></svg>
  );
}
function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" {...icon}><path d="M5 6h14v10H8l-3 3V6z" /></svg>
  );
}
function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" {...icon}><rect x="4" y="6" width="16" height="12" rx="1.5" /><path d="M4 8l8 6 8-6" /></svg>
  );
}

export default function JobDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const confirmDeposit = params.get('stage') === 'confirm-deposit';
  const { user } = useAuth();
  const { setFlow } = useFlow() || {};
  const [job, setJob] = useState(null);
  const [lookups, setLookups] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.getJob(id).then(setJob);

  useEffect(() => {
    Promise.all([api.getJob(id), api.getLookups()])
      .then(([j, l]) => { setJob(j); setLookups(l); })
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    if (!job || !setFlow) return;
    const unconfirmed = (job.totals?.unconfirmedPayments || 0) > 0;
    if (unconfirmed) setFlow({ stage: 'confirm-deposit', status: job.jobStatus });
    else if (job.jobStatus) setFlow({ stage: null, status: job.jobStatus });
    else setFlow({ stage: 'new-estimate', status: null });
  }, [job?.id, job?.jobStatus, job?.totals?.unconfirmedPayments, setFlow]);

  useEffect(() => () => { if (setFlow) setFlow(null); }, [id, setFlow]);

  const patch = async (body) => {
    setSaving(true);
    setError('');
    try {
      setJob(await api.updateJob(id, body));
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const add = async (kind, body) => {
    setError('');
    try { setJob(await api.addJobItem(id, kind, body)); }
    catch (e) { setError(e.message); throw e; }
  };

  const remove = async (kind, itemId) => {
    setError('');
    try { setJob(await api.removeJobItem(id, kind, itemId)); }
    catch (e) { setError(e.message); }
  };

  if (!job || !lookups) {
    return <div style={{ padding: 32, color: theme.color.muted, font: '400 14px/1 ' + theme.font.sans }}>{error || 'Loading…'}</div>;
  }

  const t = job.totals || {};
  const listPath = t.unconfirmedPayments > 0
    ? '/jobs?stage=confirm-deposit'
    : job.jobStatus
      ? '/jobs?status=' + encodeURIComponent(job.jobStatus)
      : '/jobs';
  const [bg, fg] = JOB_COLOR[job.jobStatus] || ['#F1EEE8', '#5C574C'];
  const next = NEXT[job.jobStatus];
  const canApprove = ['ADMIN', 'MANAGER'].includes(user?.role);
  const readyToClose = job.jobStatus === 'Ready To Close';
  const moveLabel = next === 'Admin Approval' ? 'Move to Ready to Pay' : next ? 'Move to ' + next : '';

  if (confirmDeposit) {
    return (
      <Page
        title="Confirm Deposit"
        subtitle={[job.jobNumber || job.estimateNumber, job.customer?.name].filter(Boolean).join(' · ')}
        action={<button onClick={() => nav(listPath)} style={{ height: 34, padding: '0 14px', border: '1px solid ' + theme.color.inputBorder, borderRadius: 6, background: '#fff', font: '500 12px/1 ' + theme.font.sans, cursor: 'pointer' }}>Back</button>}
      >
        {error && <div style={{ background: '#FDF1EC', border: '1px solid #F0C8B6', borderRadius: 8, padding: '12px 14px', font: '400 13px/1.5 ' + theme.font.sans, color: '#8C2F09' }}>{error}</div>}
        <Panel>
          <div style={{ padding: '8px 20px 12px' }}>
            <StarLine name="Google" value={job.googleReview || 0} />
            <StarLine name="Yelp" value={job.yelpReview || 0} />
            <Stack label="Status" value={job.jobStatus} />
            <Stack label="Estimate Number" value={job.estimateNumber} />
            <Stack label="Estimate Link" value={job.estimateLink} href={job.estimateLink} />
            <Stack label="Customer Name" value={job.customer?.name} trailing={<ChevronIcon />} />
            <Stack label="Contact Name" value={job.contact?.name} />
            <Stack
              label="Phone Number"
              value={job.phone}
              trailing={(
                <span style={{ display: 'flex', gap: 8 }}>
                  {job.phone && <a href={'tel:' + job.phone} style={iconLink}><PhoneIcon /></a>}
                  {job.phone && <a href={'sms:' + job.phone} style={iconLink}><ChatIcon /></a>}
                </span>
              )}
            />
            <Stack label="Email" value={job.email} trailing={job.email ? <a href={'mailto:' + job.email} style={iconLink}><MailIcon /></a> : null} />
            <Stack label="Marketing Source" value={job.marketingSource?.name} />
            <Stack label="Estimate Date" value={shortDate(job.estimateDate)} />
            <Stack label="Assigned Installers" value={(job.installers || []).map((i) => i.name).join(', ')} />
            <Stack label="Estimate Type" value={job.estimateType?.name} />
            <Stack label="Commission Structure" value={job.commissionStructure} />
            <Stack label="Estimate Amount" value={job.estimateAmount ? money(job.estimateAmount) : ''} />
            <Stack label="Job Number" value={job.jobNumber || job.estimateNumber} />
            <Stack label="Job Link" value={job.jobLink} href={job.jobLink} />
            <Stack label="Job Date" value={shortDate(job.jobDate)} />
            <Stack label="Job Amount" value={t.jobAmount ? money(t.jobAmount) : ''} />
            <Stack label="Customer Balance" value={money(t.customerBalance)} />
          </div>
        </Panel>
        <ItemTable
          title="Customer Payments" rows={job.payments} lookups={lookups}
          columns={['Payment Date', 'Amount', 'Payment Method', 'Reference', 'Made By', 'Notes']}
          render={(r) => [shortDate(r.paymentDate), money(r.amount), r.method?.name || '—', r.reference || '—', r.madeBy, r.notes || '—']}
          onDelete={(row) => remove('payments', row.id)}
          stacked
          defaults={{ madeBy: job.customer?.name || '' }}
          fields={[
            ['paymentDate', 'Payment Date', 'date', true],
            ['methodId', 'Payment Method', 'paymentMethods', true],
            ['reference', 'Reference', 'text'],
            ['madeBy', 'Made By', 'text'],
            ['amount', 'Amount', 'money', true],
            ['notes', 'Notes', 'notes']
          ]}
          onAdd={(body) => add('payments', { ...body, paymentDate: body.paymentDate || today() })}
        />
      </Page>
    );
  }

  return (
    <>
    <style>{`.job-review-slider::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#fff;border:1px solid #C9D7EE;box-shadow:0 1px 2px rgba(0,0,0,.15);cursor:pointer}.job-review-slider::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:#fff;border:1px solid #C9D7EE;box-shadow:0 1px 2px rgba(0,0,0,.15);cursor:pointer}`}</style>
    <Page
      title={null}
      subtitle={null}
      action={<button onClick={() => nav(listPath)} style={{ height: 34, padding: '0 14px', border: '1px solid ' + theme.color.inputBorder, borderRadius: 6, background: '#fff', font: '500 12px/1 ' + theme.font.sans, cursor: 'pointer' }}>Back to jobs</button>}
    >
      <div>
        <div style={{ font: '400 12px/1.4 ' + theme.font.sans, color: theme.color.muted, marginBottom: 8 }}>
          {job.jobStatus} <span style={{ color: '#C4BEB2' }}>›</span> {job.jobNumber || job.estimateNumber} | {job.customer?.name} | {money(t.jobAmount)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h1 style={{ font: '600 25px/1.2 ' + theme.font.sans, margin: 0 }}>{job.customer?.name}</h1>
          <span style={{ padding: '5px 9px', borderRadius: 5, font: '500 11px/1 ' + theme.font.sans, background: bg, color: fg }}>{job.jobStatus}</span>
        </div>
      </div>

      {error && <div style={{ background: '#FDF1EC', border: '1px solid #F0C8B6', borderRadius: 8, padding: '12px 14px', font: '400 13px/1.5 ' + theme.font.sans, color: '#8C2F09' }}>{error}</div>}

      <Panel>
        <div style={{ padding: '18px 20px 8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            {next ? (
              <button
                disabled={saving || (next === 'Ready To Close' && t.unconfirmedPayments > 0) || (['Admin Approval', 'Closed'].includes(next) && !canApprove)}
                onClick={() => patch({
                  googleReview: job.googleReview, yelpReview: job.yelpReview,
                  fullRebate: job.fullRebate, mixedRebate: job.mixedRebate, membershipSold: job.membershipSold,
                  jobStatus: next, adminApproved: next === 'Closed' || next === 'Admin Approval'
                })}
                style={{
                  border: 'none', background: 'transparent', padding: 0, cursor: 'pointer',
                  font: '600 16px/1 ' + theme.font.sans, color: '#3B6FC4',
                  textDecoration: 'underline', textUnderlineOffset: 3, opacity: saving ? 0.7 : 1
                }}
              >
                {t.unconfirmedPayments > 0 && next === 'Ready To Close' ? 'Confirm deposits first' : moveLabel}
              </button>
            ) : (
              <div style={{ font: '600 16px/1 ' + theme.font.sans, color: '#3B6FC4', textDecoration: 'underline', textUnderlineOffset: 3 }}>Job closed</div>
            )}
            <button
              title="Save"
              onClick={() => patch({
                googleReview: job.googleReview, yelpReview: job.yelpReview,
                fullRebate: job.fullRebate, mixedRebate: job.mixedRebate, membershipSold: job.membershipSold
              })}
              style={{ ...linkBtn, width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <SaveIcon />
            </button>
          </div>

          <ReviewSlider name="Google" value={job.googleReview || 0} onChange={(v) => setJob((j) => ({ ...j, googleReview: v }))} />
          <ReviewSlider name="Yelp" value={job.yelpReview || 0} onChange={(v) => setJob((j) => ({ ...j, yelpReview: v }))} />

          <Stack label="Status" value={job.jobStatus} />
          <ToggleRow label="Full Rebate?*" on={job.fullRebate} onChange={(v) => setJob((j) => ({ ...j, fullRebate: v }))} />
          {readyToClose && <ToggleRow label="Mixed Rebate?*" on={job.mixedRebate} onChange={(v) => setJob((j) => ({ ...j, mixedRebate: v }))} />}
          <ToggleRow label="Membership Sold?*" on={job.membershipSold} onChange={(v) => setJob((j) => ({ ...j, membershipSold: v }))} />
          <Stack label="Customer Name" value={job.customer?.name} trailing={<ChevronIcon />} />
          <Stack label="Contact Name" value={job.contact?.name} />
          <Stack label="Commission Structure" value={job.commissionStructure} />
          <Stack label="Estimate Type" value={job.estimateType?.name} />
          <Stack
            label="Phone Number"
            value={job.phone}
            trailing={(
              <span style={{ display: 'flex', gap: 8 }}>
                {job.phone && <a href={'tel:' + job.phone} style={iconLink}><PhoneIcon /></a>}
                {job.phone && <a href={'sms:' + job.phone} style={iconLink}><ChatIcon /></a>}
              </span>
            )}
          />
          <Stack
            label="Email"
            value={job.email}
            trailing={job.email ? <a href={'mailto:' + job.email} style={iconLink}><MailIcon /></a> : null}
          />
          <Stack label="Assigned User" value={job.assignedUser?.name} />
          <Stack label="Marketing Source" value={job.marketingSource?.name} />
          <Stack label="Follow-up Complete?" value={['b.1 No Est Prov HVAC', 'b.2. Follow-up HVAC'].includes(job.status) ? 'No' : 'Yes'} />
          <Stack label="Estimate Number" value={job.estimateNumber} />
          <Stack label="Estimate Link" value={job.estimateLink} href={job.estimateLink} />
          <Stack label="Estimate Date" value={shortDate(job.estimateDate)} />
          <Stack label="Estimate Amount" value={job.estimateAmount ? money(job.estimateAmount) : ''} />
          <Stack label="Converted" value="Yes" />
          <Stack label="Assigned Installers" value={(job.installers || []).map((i) => i.name).join(', ')} />
          <Stack label="Job Number" value={job.jobNumber || job.estimateNumber} />
          <Stack label="Job Link" value={job.jobLink} href={job.jobLink} />
          <Stack label="Job Date" value={shortDate(job.jobDate)} />
        </div>
      </Panel>

      <ItemTable
        title="Expenses" rows={job.expenses} lookups={lookups}
        columns={['Expense Type', 'Amount', 'Purchased From']}
        render={(r) => [r.expenseType?.name, money(r.amount), r.vendor?.name || '—']}
        onDelete={(row) => remove('expenses', row.id)}
        fields={[
          ['expenseTypeId', 'Expense Type', 'expenseTypes'],
          ['amount', 'Amount', 'money'],
          ['vendorId', 'Purchased From', 'vendors']
        ]}
        onAdd={(body) => add('expenses', body)}
      />
      <TotalCard label="Total Expenses" value={t.totalExpenses} />

      <ItemTable
        title="Company Installer Labor" rows={job.installerLabor} lookups={lookups}
        columns={readyToClose
          ? ['Expense Type', 'Amount', 'Purchased From', 'Crew', 'Installer']
          : ['Expense Type', 'Amount', 'Purchased From', 'Crew', 'Paid To', 'Installer']}
        render={(r) => readyToClose
          ? [r.expenseType?.name || 'Company Installer Labor', money(r.amount), r.vendor?.name || '—', r.crew || '—', r.installer?.name]
          : [r.expenseType?.name || 'Company Installer Labor', money(r.amount), r.vendor?.name || '—', r.crew || '—', r.paidTo?.name || '—', r.installer?.name]}
        onDelete={(row) => remove('installer-labor', row.id)}
        stacked
        fields={readyToClose
          ? [
              ['amount', 'Amount', 'money', true],
              ['vendorId', 'Purchased From', 'vendors'],
              ['crew', 'Crew', 'crew'],
              ['installerId', 'Installer', 'installers', true]
            ]
          : [
              ['amount', 'Amount', 'money', true],
              ['paidToId', 'Paid To', 'installers'],
              ['crew', 'Crew', 'crew'],
              ['installerId', 'Installer', 'installers', true]
            ]}
        onAdd={(body) => add('installer-labor', {
          ...body,
          expenseTypeId: (lookups.expenseTypes || []).find((t) => t.name === 'Company Installer Labor')?.id || ''
        })}
      />

      <TotalCard label="Total Installer Labor" value={t.totalInstallerLabor} />

      <ItemTable
        title="Company Repair Tech Labor" rows={job.repairLabor} lookups={lookups}
        columns={['Expense Type', 'Amount', 'Purchased From', 'Tech']}
        render={(r) => [r.expenseType?.name || 'Company Repair Tech Labor', money(r.amount), r.vendor?.name || '—', r.technician?.name]}
        onDelete={(row) => remove('repair-labor', row.id)}
        stacked
        fields={[
          ['amount', 'Amount', 'money', true],
          ['technicianId', 'Tech', 'technicians', true],
          ['workDate', 'Job Date', 'date', true]
        ]}
        onAdd={(body) => add('repair-labor', {
          ...body,
          workDate: body.workDate || today(),
          expenseTypeId: (lookups.expenseTypes || []).find((t) => t.name === 'Company Repair Tech Labor')?.id || ''
        })}
      />
      <TotalCard label="Total Repair Tech Labor" value={t.totalRepairTechLabor} />

      <ItemTable
        title="Customer Payments" rows={job.payments} lookups={lookups}
        columns={['Payment Date', 'Amount', 'Payment Method', 'Reference', 'Made By', 'Notes']}
        render={(r) => [shortDate(r.paymentDate), money(r.amount), r.method?.name || '—', r.reference || '—', r.madeBy, r.notes || '—']}
        onDelete={(row) => remove('payments', row.id)}
        stacked
        defaults={{ madeBy: job.customer?.name || '' }}
        fields={[
          ['paymentDate', 'Payment Date', 'date', true],
          ['methodId', 'Payment Method', 'paymentMethods', true],
          ['reference', 'Reference', 'text'],
          ['madeBy', 'Made By', 'text'],
          ['amount', 'Amount', 'money', true],
          ['notes', 'Notes', 'notes']
        ]}
        onAdd={(body) => add('payments', { ...body, paymentDate: body.paymentDate || today() })}
      />
      <TotalCard label="Customer Balance" value={t.customerBalance} />

      <ItemTable
        title="Tech Payments" rows={job.techPayments} lookups={lookups}
        columns={['Payment Date', 'Payment Method', 'Reference', 'Made By', 'Amount', 'Notes']}
        render={(r) => [shortDate(r.paidDate), r.method?.name || '—', r.reference || '—', r.madeBy || r.technician?.name || '—', money(r.amount), r.notes || '—']}
        onDelete={(row) => remove('tech-payments', row.id)}
        stacked
        defaults={{ madeBy: user?.name || '', paymentDate: today() }}
        fields={[
          ['paymentDate', 'Payment Date', 'date', true],
          ['methodId', 'Payment Method', 'paymentMethods', true],
          ['reference', 'Reference', 'text', true],
          ['madeBy', 'Made By', 'text'],
          ['amount', 'Amount', 'money', true],
          ['notes', 'Notes', 'notes']
        ]}
        onAdd={(body) => add('tech-payments', { ...body, paidDate: body.paymentDate || today() })}
      />

      <Panel>
        <SectionTitle>Job financials</SectionTitle>
        <div style={{ padding: '8px 20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Read label="Tech Open Balance" value={money(t.techOpenBalance)} />
          <MoneyEdit label="Tech Advance Payment" prefix="$" value={job.techAdvancePayment} onSave={(v) => patch({ techAdvancePayment: v })} />
          <Read label="Job Amount" value={money(t.jobAmount)} />
          <Read label="Total Expenses" value={money(t.totalExpenses)} />
          <Read label="Total Installer Labor" value={money(t.totalInstallerLabor)} />
          <Read label="Total Repair Tech Labor" value={money(t.totalRepairTechLabor)} />
          <Read label="Profit (% From Gross)" value={money(t.profit) + ' (' + t.profitPct + '%)'} />
          <MoneyEdit label="Commission Percent" required prefix="%" value={job.commissionPercent} onSave={(v) => patch({ commissionPercent: v })} />
        </div>
      </Panel>

      <Panel>
        <SectionTitle>Bonuses</SectionTitle>
        <div style={{ padding: '8px 20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <MoneyEdit label="Tech Bonus" prefix="$" value={job.techBonus} onSave={(v) => patch({ techBonus: v })} />
          <MoneyEdit label="Membership Bonus" prefix="$" value={job.membershipBonus} onSave={(v) => patch({ membershipBonus: v })} />
          <MoneyEdit label="Google 5 Star Bonus" prefix="$" value={job.googleStarBonus} onSave={(v) => patch({ googleStarBonus: v })} />
          <MoneyEdit label="Yelp 5 Star Bonus" prefix="$" value={job.yelpStarBonus} onSave={(v) => patch({ yelpStarBonus: v })} />
          <Read label="Company Profit After Tech (% From Gross)" value={money(t.companyProfitAfterTech) + ' (' + t.companyProfitAfterTechPct + '%)'} />
          <Read label="Total To Tech (% From Gross)" value={money(t.totalToTech) + ' (' + t.totalToTechPct + '%)'} />
        </div>
      </Panel>
    </Page>
    </>
  );
}

function SectionTitle({ children }) {
  return <div style={{ padding: '14px 18px 0', font: '600 15px/1.2 ' + theme.font.sans }}>{children}</div>;
}

function Stack({ label, value, trailing, href }) {
  const shown = value || '';
  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid #F2EFE9' }}>
      <div style={{ font: '400 12px/1.3 ' + theme.font.sans, color: '#8E887C', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minWidth: 0 }}>
        {href && shown ? (
          <a href={href} target="_blank" rel="noreferrer" style={{ font: '500 15px/1.35 ' + theme.font.sans, color: theme.color.ink, overflowWrap: 'anywhere', minWidth: 0 }}>{shown}</a>
        ) : (
          <div style={{ font: '500 15px/1.35 ' + theme.font.sans, color: theme.color.ink, overflowWrap: 'anywhere', minWidth: 0 }}>{shown}</div>
        )}
        {trailing}
      </div>
    </div>
  );
}

function StarLine({ name, value }) {
  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid #F2EFE9', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ font: '400 13px/1 ' + theme.font.sans, color: theme.color.body }}>{name}:</span>
      <span style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} style={{ color: n <= Number(value || 0) ? '#E0A02A' : '#D9D5CC', fontSize: 16, lineHeight: 1 }}>★</span>
        ))}
      </span>
    </div>
  );
}

function ReviewSlider({ name, value, onChange }) {
  const pct = (Number(value) / 5) * 100;
  return (
    <div style={{ padding: '10px 0 14px', borderBottom: '1px solid #F2EFE9' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ font: '400 13px/1 ' + theme.font.sans, color: theme.color.body }}>{name}:</span>
        <span style={{ display: 'flex', gap: 2 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} style={{ color: n <= value ? '#E0A02A' : '#D9D5CC', fontSize: 16, lineHeight: 1 }}>★</span>
          ))}
        </span>
      </div>
      <div style={{ font: '400 12px/1.3 ' + theme.font.sans, color: '#8E887C', marginBottom: 6 }}>
        {name} Review<span style={{ color: '#3B6FC4' }}>*</span>
      </div>
      <div style={{ position: 'relative', paddingTop: 18 }}>
        <div style={{
          position: 'absolute', top: 0, left: pct + '%', transform: 'translateX(-50%)',
          font: '600 12px/1 ' + theme.font.sans, color: theme.color.ink, pointerEvents: 'none'
        }}>{value}</div>
        <input
          className="job-review-slider"
          type="range" min="0" max="5" step="1" value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            width: '100%', height: 6, borderRadius: 99, outline: 'none', cursor: 'pointer',
            background: 'linear-gradient(to right, #3B6FC4 0%, #3B6FC4 ' + pct + '%, #E7E3DA ' + pct + '%, #E7E3DA 100%)',
            WebkitAppearance: 'none', appearance: 'none'
          }}
        />
      </div>
    </div>
  );
}

function ToggleRow({ label, on, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 0', borderBottom: '1px solid #F2EFE9' }}>
      <div style={{ font: '400 12px/1.3 ' + theme.font.sans, color: '#8E887C' }}>{label}</div>
      <button type="button" onClick={() => onChange(!on)} style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', flex: '0 0 44px',
        background: on ? '#3B6FC4' : '#D9D5CC', position: 'relative'
      }}>
        <span style={{ position: 'absolute', top: 2, left: on ? 22 : 2, width: 20, height: 20, borderRadius: 10, background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.12)' }} />
      </button>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div style={{ minWidth: 0, maxWidth: '100%' }}>
      <div style={{ font: '500 11px/1.4 ' + theme.font.sans, color: theme.color.muted, marginBottom: 6 }}>
        {label}{required ? <span style={{ color: '#3B6FC4' }}> *</span> : null}
      </div>
      {children}
    </div>
  );
}

function Read({ label, value }) {
  return <Field label={label}><div style={{ font: '500 14px/1.4 ' + theme.font.sans, color: theme.color.ink, overflowWrap: 'anywhere' }}>{value || '—'}</div></Field>;
}

function MoneyEdit({ label, value, prefix, suffix, required, onSave }) {
  const [v, setV] = useState(value ?? 0);
  useEffect(() => setV(value ?? 0), [value]);
  return (
    <Field label={label} required={required}>
      <div style={{ ...control, width: '100%', display: 'flex', alignItems: 'center', gap: 8 }}>
        {prefix && <span style={{ font: '400 13px/1 ' + theme.font.sans, color: theme.color.faint }}>{prefix}</span>}
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          onBlur={() => onSave(num(v))}
          style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', font: '400 13px/1 ' + theme.font.sans, color: theme.color.body }}
        />
        {suffix && <span style={{ font: '400 12px/1 ' + theme.font.sans, color: theme.color.faint }}>{suffix}</span>}
      </div>
    </Field>
  );
}

function TotalCard({ label, value }) {
  return (
    <div style={{ background: theme.color.card, border: '1px solid ' + theme.color.border, borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ font: '500 11px/1 ' + theme.font.sans, color: theme.color.faint, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
      <div style={{ font: '500 22px/1.4 ' + theme.font.mono, marginTop: 6 }}>{money(value)}</div>
    </div>
  );
}

function ItemTable({ title, rows, columns, render, fields, lookups, onAdd, onDelete, defaults, stacked }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({});
  const submit = async () => {
    try {
      await onAdd({
        ...draft,
        amount: num(draft.amount),
        madeBy: draft.madeBy || defaults?.madeBy || 'Customer',
        purchasedDate: draft.purchasedDate || today(),
        workDate: draft.workDate || today(),
        paidDate: draft.paidDate || today(),
        paymentDate: draft.paymentDate || today()
      });
      setDraft({});
      setOpen(false);
    } catch {
      /* error banner is set by parent */
    }
  };
  const cols = '1.2fr '.repeat(columns.length) + '40px';
  return (
    <Panel>
      <div style={{ padding: '14px 18px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ font: '600 15px/1.2 ' + theme.font.sans }}>{title}</div>
        <span style={{ width: 20, height: 20, borderRadius: 10, background: '#EDE9E1', font: '500 11px/20px ' + theme.font.sans, textAlign: 'center', color: theme.color.muted }}>{rows.length}</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 12, padding: '8px 18px', background: '#FBFAF8', borderTop: '1px solid #EDE9E1', minWidth: columns.length * 96 }}>
        {columns.map((c) => <div key={c} style={head}>{c}</div>)}
        <div />
      </div>
      {rows.map((r) => (
        <div key={r.id} style={{ display: 'grid', gridTemplateColumns: cols, gap: 12, padding: '12px 18px', borderBottom: '1px solid #F2EFE9', alignItems: 'center', minWidth: columns.length * 96 }}>
          {render(r).map((cell, i) => <div key={i} style={{ font: '400 13px/1.3 ' + theme.font.sans, minWidth: 0, overflowWrap: 'anywhere' }}>{cell}</div>)}
          <button onClick={() => onDelete(r)} style={{ ...linkBtn, color: theme.color.lost }}>×</button>
        </div>
      ))}
      </div>
      {rows.length === 0 && !open && <Empty>No items</Empty>}
      {open && (
        <div style={{ display: 'grid', gridTemplateColumns: stacked ? '1fr' : 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, padding: 16, borderTop: '1px solid #EDE9E1' }}>
          {fields.map(([key, label, type, required]) => (
            <Field key={key} label={label} required={required}>
              <ItemInput type={type} value={draft[key] || ''} lookups={lookups} onChange={(v) => setDraft((d) => ({ ...d, [key]: v }))} />
            </Field>
          ))}
          <div style={{ display: 'flex', alignItems: 'end', gap: 8 }}>
            <button onClick={submit} style={primary}>Save</button>
            <button onClick={() => setOpen(false)} style={linkBtn}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{ padding: '10px 18px 14px', textAlign: 'right' }}>
        <button onClick={() => { setDraft(defaults || {}); setOpen(true); }} style={linkBtn}>Add</button>
      </div>
    </Panel>
  );
}

function ItemInput({ type, value, onChange, lookups }) {
  if (type === 'money' || type === 'text') return <input value={value} onChange={(e) => onChange(e.target.value)} style={{ ...control, width: '100%' }} />;
  if (type === 'notes') return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      style={{ ...control, width: '100%', height: 'auto', minHeight: 72, padding: '8px 12px', resize: 'vertical', lineHeight: 1.4 }}
    />
  );
  if (type === 'date') return <input type="date" value={value} onChange={(e) => onChange(e.target.value)} style={{ ...control, width: '100%' }} />;
  if (type === 'crew') return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...control, width: '100%' }}>
      <option value="">Select…</option>
      {CREWS.map((c) => <option key={c} value={c}>{c}</option>)}
    </select>
  );
  const options = lookups[type] || [];
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...control, width: '100%' }}>
      <option value="">Select…</option>
      {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
    </select>
  );
}
