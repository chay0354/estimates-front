import { theme } from '../theme.js';

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  height: 40,
  border: '1px solid ' + theme.color.inputBorder,
  borderRadius: 6,
  padding: '0 12px',
  font: '400 14px/1 ' + theme.font.sans,
  background: '#fff',
  color: theme.color.ink,
  outline: 'none'
};

export function Label({ children, required }) {
  return (
    <label style={{ display: 'block', font: '500 12px/1.4 ' + theme.font.sans, color: theme.color.body, marginBottom: 7 }}>
      {children} {required && <span style={{ color: theme.color.accent }}>*</span>}
    </label>
  );
}

export function TextField({ label, required, mono, error, ...props }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <input {...props} style={{ ...inputStyle, font: '400 14px/1 ' + (mono ? theme.font.mono : theme.font.sans), borderColor: error ? theme.color.lost : theme.color.inputBorder }} />
      {error && <div style={{ marginTop: 5, font: '400 11px/1.3 ' + theme.font.sans, color: theme.color.lost }}>{error}</div>}
    </div>
  );
}

export function SelectField({ label, required, options, error, emptyLabel, ...props }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <select {...props} style={{ ...inputStyle, borderColor: error ? theme.color.lost : theme.color.inputBorder }}>
        {emptyLabel && <option value="">{emptyLabel}</option>}
        {options.map((o) => (
          <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
        ))}
      </select>
      {error && <div style={{ marginTop: 5, font: '400 11px/1.3 ' + theme.font.sans, color: theme.color.lost }}>{error}</div>}
    </div>
  );
}

function withHttps(value) {
  let link = String(value || '').replace(/^\s+/, '');
  if (!link) return 'https://';
  const doubled = link.match(/^https?:\/\/(https?:\/\/\S+)/i);
  if (doubled) return doubled[1];
  if (/^https?:\/\//i.test(link) || /^https?:\/?$/i.test(link)) return link;
  if (/^[a-z][a-z0-9+.-]*:/i.test(link)) return link;
  return 'https://' + link.replace(/^\/\//, '');
}

export function LinkField({ label, required, error, value, onChange, ...props }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <input
        {...props}
        value={value}
        placeholder="https://"
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => onChange({ target: { value: withHttps(e.target.value) } })}
        onFocus={(e) => {
          const current = e.target.value;
          if (!current || current === 'http://') {
            onChange({ target: { value: 'https://' } });
          }
          if (!current || current === 'http://' || current === 'https://') {
            requestAnimationFrame(() => {
              const el = e.target;
              const len = el.value.length;
              try { el.setSelectionRange(len, len); } catch { /* ignore */ }
            });
          }
        }}
        style={{ ...inputStyle, font: '400 14px/1 ' + theme.font.sans, borderColor: error ? theme.color.lost : theme.color.inputBorder }}
      />
      {error && <div style={{ marginTop: 5, font: '400 11px/1.3 ' + theme.font.sans, color: theme.color.lost }}>{error}</div>}
    </div>
  );
}

export function MoneyField({ label, required, error, ...props }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: 8, borderColor: error ? theme.color.lost : theme.color.inputBorder }}>
        <span style={{ font: '400 14px/1 ' + theme.font.mono, color: theme.color.faint }}>$</span>
        <input {...props} placeholder="0.00" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', font: '500 14px/1 ' + theme.font.mono, color: theme.color.ink }} />
      </div>
      {error && <div style={{ marginTop: 5, font: '400 11px/1.3 ' + theme.font.sans, color: theme.color.lost }}>{error}</div>}
    </div>
  );
}

export function Segmented({ label, required, options, value, onChange }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <div style={{ display: 'flex', gap: 8 }}>
        {options.map((o) => {
          const active = value === o;
          return (
            <button
              key={String(o)}
              type="button"
              onClick={() => onChange(o)}
              style={{
                flex: 1, height: 40, borderRadius: 6, cursor: 'pointer',
                border: '1px solid ' + (active ? theme.color.ink : theme.color.inputBorder),
                background: active ? theme.color.ink : '#FBFAF8',
                color: active ? '#fff' : theme.color.body,
                font: '500 13px/1 ' + theme.font.sans
              }}
            >
              {String(o)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Card({ title, accent, children }) {
  return (
    <section style={{ background: theme.color.card, border: '1px solid ' + (accent || theme.color.border), borderRadius: 10, padding: '22px 24px 26px', marginBottom: 16, overflow: 'hidden', maxWidth: '100%', boxSizing: 'border-box' }}>
      <div style={{ font: '500 11px/1 ' + theme.font.sans, letterSpacing: '.07em', textTransform: 'uppercase', color: accent ? theme.color.won : theme.color.faint, marginBottom: 18 }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '18px 20px', alignItems: 'start' }}>{children}</div>
    </section>
  );
}
