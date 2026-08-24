// Mirrors the HTML prototype at the repo root. Change here, not inline.
export const theme = {
  color: {
    accent: '#C2410C',
    accentHover: '#A63709',
    ink: '#17150F',
    body: '#3B372F',
    muted: '#6B6559',
    faint: '#8E887C',
    paper: '#F7F5F1',
    card: '#FFFFFF',
    border: '#E7E3DA',
    inputBorder: '#D9D5CC',
    shell: '#16181A',
    shellHover: '#24262A',
    won: '#0F7B4F',
    lost: '#B3261E'
  },
  font: {
    sans: "'Instrument Sans', system-ui, sans-serif",
    mono: "'IBM Plex Mono', ui-monospace, monospace"
  },
  statusColor: {
    'b.1 No Est Prov HVAC': ['#F1EEE8', '#5C574C', '#C4BEB2'],
    'b.2. Follow-up HVAC': ['#FDF3E3', '#8A5A08', '#E0A02A'],
    'Estimate Provided': ['#E9F0FB', '#1E4B8F', '#3B6FC4'],
    'Estimate Won HVAC': ['#E4F3EB', '#0F6B45', '#0F7B4F'],
    'b.5 LOST HVAC': ['#FCEAE7', '#9B2318', '#B3261E'],
    'b.6 CANCELLED HVAC': ['#EDEBE7', '#6B6559', '#8B857A']
  }
};

export const money = (n) =>
  '$' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });

export const shortMoney = (n) => {
  const v = Number(n || 0);
  if (v >= 1000000) return '$' + (v / 1000000).toFixed(2) + 'M';
  if (v >= 10000) return '$' + Math.round(v / 1000) + 'k';
  return money(v);
};

export const shortDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }) : '—');
