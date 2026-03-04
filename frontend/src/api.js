const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  getAccount: (customerId) => request(`/accounts/${customerId}`),
  getTranches: (accountId) => request(`/tranches/${accountId}`),
  getActiveTranche: (accountId) => request(`/tranches/${accountId}/active`),
  refuel: (body) => request('/tranches/refuel', { method: 'POST', body: JSON.stringify(body) }),
  getPayments: (accountId) => request(`/payments/${accountId}`),
  makePayment: (body) => request('/payments', { method: 'POST', body: JSON.stringify(body) }),
  getWallet: (customerId) => request(`/wallet/${customerId}`),
  topupWallet: (body) => request('/wallet/topup', { method: 'POST', body: JSON.stringify(body) }),
};
