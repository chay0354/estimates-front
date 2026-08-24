// Keep in sync with backend/src/constants/enums.js — these strings are user-visible verbatim.
export const ESTIMATE_STATUSES = [
  'b.1 No Est Prov HVAC',
  'b.2. Follow-up HVAC',
  'Estimate Provided',
  'Estimate Won HVAC',
  'b.5 LOST HVAC',
  'b.6 CANCELLED HVAC'
];
export const JOB_STATUSES = ['Work In Progress', 'Ready To Close', 'Ready To Pay', 'Job Completed'];
export const COMMISSION_STRUCTURES = ['HVAC', 'Repair', 'Membership Only'];
export const RANGES = [
  ['all', 'All time'],
  ['7d', 'Last 7 days'],
  ['30d', 'Last 30 days'],
  ['quarter', 'Last quarter']
];
