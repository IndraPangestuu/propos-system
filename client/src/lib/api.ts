export async function api<T = any>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || response.statusText);
  }

  return response.json();
}

export const productsApi = {
  getAll: () => api('/api/products'),
  get: (id: string) => api(`/api/products/${id}`),
  create: (data: any) => api('/api/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => api(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => api(`/api/products/${id}`, { method: 'DELETE' }),
};

export const shiftsApi = {
  getActive: () => api('/api/shifts/active'),
  create: (data: any) => api('/api/shifts', { method: 'POST', body: JSON.stringify(data) }),
  close: (id: string, endCash: string) => api(`/api/shifts/${id}/close`, { method: 'POST', body: JSON.stringify({ endCash }) }),
};

export const transactionsApi = {
  create: (data: any) => api('/api/transactions', { method: 'POST', body: JSON.stringify(data) }),
  getAll: (limit?: number) => api(`/api/transactions${limit ? `?limit=${limit}` : ''}`),
  getByShift: (shiftId: string) => api(`/api/transactions/shift/${shiftId}`),
  getItems: (transactionId: string) => api(`/api/transactions/${transactionId}/items`),
};

export const statsApi = {
  getSales: (days?: number) => api(`/api/stats${days ? `?days=${days}` : ''}`),
  getWeekly: () => api('/api/stats/weekly'),
  getCategories: () => api('/api/stats/categories'),
};

export const categoriesApi = {
  getAll: () => api('/api/categories'),
  create: (data: { name: string }) => api('/api/categories', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => api(`/api/categories/${id}`, { method: 'DELETE' }),
};
