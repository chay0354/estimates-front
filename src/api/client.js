const BASE = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? 'https://estimates-back.vercel.app/api' : 'http://localhost:4000/api');
const TOKEN_KEY = 'es_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

export class ApiError extends Error {
  constructor(status, payload) {
    super(payload?.error?.message || 'Request failed');
    this.status = status;
    this.field = payload?.error?.field;
    this.issues = payload?.error?.issues || [];
  }
}

export async function request(path, { method = 'GET', body, params } = {}) {
  const url = new URL(BASE + path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
  }

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: 'Bearer ' + getToken() } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (res.status === 401) {
    setToken(null);
    if (!location.pathname.startsWith('/login')) location.assign('/login');
    throw new ApiError(401, { error: { message: 'Session expired' } });
  }
  const payload = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, payload);
  return payload;
}
