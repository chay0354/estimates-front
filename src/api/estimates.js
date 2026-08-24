import { request } from './client.js';

export const login = (email, password) => request('/auth/login', { method: 'POST', body: { email, password } });
export const me = () => request('/auth/me');
export const getLookups = () => request('/lookups');
export const createCustomer = (body) => request('/lookups/customers', { method: 'POST', body });
export const createMarketingSource = (body) => request('/lookups/marketing-sources', { method: 'POST', body });
export const createEstimateType = (body) => request('/lookups/estimate-types', { method: 'POST', body });
export const createInstaller = (body) => request('/lookups/installers', { method: 'POST', body });
export const listEstimates = (filters) => request('/estimates', { params: filters });
export const getEstimate = (id) => request('/estimates/' + id);
export const createEstimate = (body) => request('/estimates', { method: 'POST', body });
export const updateEstimate = (id, body) => request('/estimates/' + id, { method: 'PATCH', body });
