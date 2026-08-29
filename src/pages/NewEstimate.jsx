import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api/estimates.js';
import { useAuth } from '../context/AuthContext.jsx';
import { theme } from '../theme.js';
import { ESTIMATE_STATUSES, COMMISSION_STRUCTURES } from '../constants/enums.js';
import { Card, TextField, SelectField, MoneyField, LinkField, Segmented } from '../components/Field.jsx';

const today = () => new Date().toISOString().slice(0, 10);

const EMPTY = {
  estimateNumber: '', estimateLink: 'https://', customerId: '', contactId: '', phone: '', email: '',
  addressId: '', marketingSourceId: '', estimateDate: today(), assignedUserId: '', estimateTypeId: '',
  commissionStructure: 'HVAC', estimateAmount: '', converted: false, status: ESTIMATE_STATUSES[0],
  installerIds: []
};

export default function NewEstimate() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [lookups, setLookups] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState('');
  const [saving, setSaving] = useState(false);
  const [newCustomer, setNewCustomer] = useState(false);
  const [newSource, setNewSource] = useState('');
  const [newType, setNewType] = useState('');
  const [draft, setDraft] = useState({ customerName: '', contactName: '', address: '' });

  useEffect(() => {
    api.getLookups().then((l) => {
      setLookups(l);
      setNewCustomer(!(l.customers || []).length);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (user?.id) setForm((f) => ({ ...f, assignedUserId: f.assignedUserId || user.id }));
  }, [user]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target ? e.target.value : e }));
  const customer = useMemo(() => lookups?.customers.find((c) => c.id === form.customerId), [lookups, form.customerId]);

  const onCustomer = (e) => {
    const id = e.target.value;
    if (id === '__new__') {
      setNewCustomer(true);
      setForm((f) => ({ ...f, customerId: '', contactId: '', addressId: '', phone: '', email: '' }));
      return;
    }
    const c = lookups.customers.find((x) => x.id === id);
    setNewCustomer(false);
    setForm((f) => ({
      ...f,
      customerId: c?.id || '',
      contactId: c?.contacts[0]?.id || '',
      addressId: c?.addresses[0]?.id || '',
      phone: c?.contacts[0]?.phone || '',
      email: c?.contacts[0]?.email || ''
    }));
  };

  const ensureLookups = async () => {
    let next = { ...form };
    let nextLookups = lookups;

    if (newCustomer || !next.customerId) {
      const created = await api.createCustomer({
        name: draft.customerName,
        contactName: draft.contactName,
        phone: next.phone,
        email: next.email,
        address: draft.address
      });
      nextLookups = {
        ...nextLookups,
        customers: [...(nextLookups.customers || []), created]
      };
      next = {
        ...next,
        customerId: created.id,
        contactId: created.contacts[0].id,
        addressId: created.addresses[0].id
      };
    }

    if (newSource.trim()) {
      const source = await api.createMarketingSource({ name: newSource.trim() });
      nextLookups = { ...nextLookups, marketingSources: [...(nextLookups.marketingSources || []), source] };
      next.marketingSourceId = source.id;
      setNewSource('');
    }

    if (newType.trim()) {
      const type = await api.createEstimateType({ name: newType.trim() });
      nextLookups = { ...nextLookups, estimateTypes: [...(nextLookups.estimateTypes || []), type] };
      next.estimateTypeId = type.id;
      setNewType('');
    }

    setLookups(nextLookups);
    setForm(next);
    return next;
  };

  const toLink = (value) => {
    const link = String(value || '').trim();
    if (!link) return '';
    if (/^[a-z][a-z0-9+.-]*:/i.test(link)) return link;
    return 'https://' + link.replace(/^\/\//, '');
  };

  const submit = async () => {
    setSaving(true);
    setErrors({});
    setBanner('');
    try {
      const ready = await ensureLookups();
      const payload = {
        ...ready,
        estimateLink: toLink(ready.estimateLink),
        estimateAmount: Number(String(ready.estimateAmount).replace(/[^0-9.]/g, '')) || 0,
        converted: false,
        installerIds: []
      };
      const created = await api.createEstimate(payload);
      nav('/', { state: { createdId: created.id } });
    } catch (err) {
      const map = {};
      (err.issues || []).forEach((i) => { map[i.field] = i.message; });
      if (err.field && !map[err.field]) map[err.field] = err.message;
      setErrors(map);
      setBanner(err.issues?.length ? err.issues.length + ' field(s) need attention.' : err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!lookups) return <div style={{ padding: 32, color: theme.color.muted, font: '400 14px/1 ' + theme.font.sans }}>Loading…</div>;

  return (
    <div style={{ padding: '26px 32px 60px', maxWidth: 1080, width: '100%', boxSizing: 'border-box', minWidth: 0, overflowX: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, marginBottom: 22 }}>
        <div>
          <h1 style={{ font: '600 25px/1.2 ' + theme.font.sans, margin: 0, letterSpacing: '-.015em' }}>New estimate</h1>
          <p style={{ font: '400 13px/1.5 ' + theme.font.sans, color: theme.color.muted, margin: '6px 0 0' }}>
            All required fields on one page. Fields marked <span style={{ color: theme.color.accent }}>*</span> must be filled before saving. New customers and lookups are saved to the database.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => nav('/')} style={{ height: 36, padding: '0 14px', border: '1px solid ' + theme.color.inputBorder, borderRadius: 6, background: '#fff', color: theme.color.body, font: '500 13px/1 ' + theme.font.sans, cursor: 'pointer' }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ height: 36, padding: '0 18px', border: 'none', borderRadius: 6, background: theme.color.accent, color: '#fff', font: '600 13px/1 ' + theme.font.sans, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save estimate'}
          </button>
        </div>
      </div>

      {banner && (
        <div style={{ background: '#FDF1EC', border: '1px solid #F0C8B6', borderRadius: 8, padding: '12px 14px', marginBottom: 18, font: '400 13px/1.5 ' + theme.font.sans, color: '#8C2F09' }}>{banner}</div>
      )}

      <Card title="Estimate & customer">
        <TextField label="Estimate Number" required mono value={form.estimateNumber} onChange={set('estimateNumber')} error={errors.estimateNumber} />
        <div style={{ gridColumn: 'span 2' }}>
          <LinkField label="Estimate Link" required value={form.estimateLink} onChange={set('estimateLink')} error={errors.estimateLink} />
        </div>
        {newCustomer ? (
          <>
            <TextField label="Customer Name" required value={draft.customerName} onChange={(e) => setDraft((d) => ({ ...d, customerName: e.target.value }))} error={errors.customerId || errors.name} />
            <TextField label="Contact Name" required value={draft.contactName} onChange={(e) => setDraft((d) => ({ ...d, contactName: e.target.value }))} error={errors.contactId || errors.contactName} />
            <TextField label="Phone Number" required value={form.phone} onChange={set('phone')} error={errors.phone} />
            <TextField label="Email" value={form.email} onChange={set('email')} error={errors.email} />
            <div style={{ gridColumn: 'span 2' }}>
              <TextField label="Address" required value={draft.address} onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))} error={errors.addressId || errors.address} />
            </div>
            {lookups.customers.length > 0 && (
              <button type="button" onClick={() => setNewCustomer(false)} style={{ gridColumn: 'span 3', justifySelf: 'start', height: 32, padding: '0 10px', border: 'none', background: 'transparent', color: theme.color.accent, font: '500 12px/1 ' + theme.font.sans, cursor: 'pointer' }}>
                Choose an existing customer
              </button>
            )}
          </>
        ) : (
          <>
            <SelectField label="Customer Name" required emptyLabel="Select…" value={form.customerId} onChange={onCustomer} error={errors.customerId}
              options={[...lookups.customers.map((c) => ({ value: c.id, label: c.name })), { value: '__new__', label: 'Add new customer…' }]} />
            <SelectField label="Contact Name" required emptyLabel="Select…" value={form.contactId} onChange={set('contactId')} error={errors.contactId}
              options={(customer?.contacts || []).map((c) => ({ value: c.id, label: c.name }))} />
            <TextField label="Phone Number" required value={form.phone} onChange={set('phone')} error={errors.phone} />
            <TextField label="Email" value={form.email} onChange={set('email')} error={errors.email} />
            <div style={{ gridColumn: 'span 2' }}>
              <SelectField label="Address" required emptyLabel="Select…" value={form.addressId} onChange={set('addressId')} error={errors.addressId}
                options={(customer?.addresses || []).map((a) => ({ value: a.id, label: a.line }))} />
            </div>
          </>
        )}
      </Card>

      <Card title="Assignment & source">
        {newSource || !lookups.marketingSources.length ? (
          <TextField label="Marketing Source" required value={newSource} onChange={(e) => setNewSource(e.target.value)} error={errors.marketingSourceId} />
        ) : (
          <SelectField label="Marketing Source" required emptyLabel="Select…" value={form.marketingSourceId} onChange={(e) => {
            if (e.target.value === '__new__') { setNewSource(' '); setForm((f) => ({ ...f, marketingSourceId: '' })); return; }
            setForm((f) => ({ ...f, marketingSourceId: e.target.value }));
          }} error={errors.marketingSourceId}
            options={[...lookups.marketingSources.map((s) => ({ value: s.id, label: s.name })), { value: '__new__', label: 'Add new source…' }]} />
        )}
        <TextField label="Estimate Date" required type="date" value={form.estimateDate} onChange={set('estimateDate')} error={errors.estimateDate} />
        <SelectField label="Assigned User" required emptyLabel="Select…" value={form.assignedUserId} onChange={set('assignedUserId')} error={errors.assignedUserId}
          options={lookups.users.map((u) => ({ value: u.id, label: u.name }))} />
        {newType || !lookups.estimateTypes.length ? (
          <TextField label="Estimate Type" required value={newType} onChange={(e) => setNewType(e.target.value)} error={errors.estimateTypeId} />
        ) : (
          <SelectField label="Estimate Type" required emptyLabel="Select…" value={form.estimateTypeId} onChange={(e) => {
            if (e.target.value === '__new__') { setNewType(' '); setForm((f) => ({ ...f, estimateTypeId: '' })); return; }
            setForm((f) => ({ ...f, estimateTypeId: e.target.value }));
          }} error={errors.estimateTypeId}
            options={[...lookups.estimateTypes.map((t) => ({ value: t.id, label: t.name })), { value: '__new__', label: 'Add new type…' }]} />
        )}
        <div style={{ gridColumn: 'span 2' }}>
          <Segmented label="Commission Structure" required options={COMMISSION_STRUCTURES}
            value={form.commissionStructure} onChange={(v) => setForm((f) => ({ ...f, commissionStructure: v }))} />
        </div>
      </Card>

      <Card title="Amount & status">
        <MoneyField label="Estimate Amount" required value={form.estimateAmount} onChange={set('estimateAmount')} error={errors.estimateAmount} />
        <SelectField label="Status" required value={form.status} onChange={set('status')} error={errors.status} options={ESTIMATE_STATUSES} />
      </Card>
    </div>
  );
}
