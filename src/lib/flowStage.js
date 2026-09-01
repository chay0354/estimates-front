export function flowStage(row) {
  if (!row.converted) return 'New Estimate';
  if (row.awaitingDeposit && row.jobStatus === 'Work In Progress') return 'Confirm Deposit';
  return row.jobStatus || 'Work In Progress';
}
