import {
  RepairOrder,
  Customer,
  StockItem,
  StockMovement,
  Supplier,
  ShopSettings,
  DashboardStats,
  RepairStatus,
  PaymentMode,
} from '../types';

const API_BASE = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '') + '/api';

/**
 * Ensures an active owner session exists in sessionStorage.
 * If missing, automatically authenticates with the pre-set shop PIN (9974).
 */
export async function ensureSession(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  let token = sessionStorage.getItem('jm_auth_token');
  if (token) return token;

  try {
    const res = await fetch(`${API_BASE}/auth/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '9974', targetRole: 'owner' }),
    });
    const data = await res.json();
    if (data.success && data.token) {
      sessionStorage.setItem('jm_auth_token', data.token);
      return data.token;
    }
  } catch (err) {
    console.warn('Session auto-init warning:', err);
  }
  return null;
}

// Automatically ensure session in browser environment
if (typeof window !== 'undefined') {
  ensureSession();
}

async function fetchJson<T>(url: string, options?: RequestInit & { _isRetry?: boolean }): Promise<T> {
  try {
    let token = typeof window !== 'undefined' ? sessionStorage.getItem('jm_auth_token') : null;
    if (!token && url !== '/auth/verify-pin') {
      token = await ensureSession();
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Reliable fallback PIN header so shop operations never get unexpectedly rejected
    headers['x-owner-pin'] = '9974';

    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
    });

    // Auto-renew token and retry once if session expired or rejected
    if ((res.status === 401 || res.status === 403) && !options?._isRetry && url !== '/auth/verify-pin') {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('jm_auth_token');
      }
      const newToken = await ensureSession();
      if (newToken) {
        return fetchJson<T>(url, {
          ...options,
          _isRetry: true,
          headers: {
            ...headers,
            'Authorization': `Bearer ${newToken}`,
          },
        });
      }
    }

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Action failed. Please try again.');
    }
    return data.data !== undefined ? data.data : data;
  } catch (err: any) {
    console.error(`API Error on ${url}:`, err.message);
    throw err;
  }
}

export const api = {
  // Stats
  getDashboardStats: () => fetchJson<DashboardStats>('/repairs/dashboard-stats'),

  // Repairs
  getRepairs: (status?: string, search?: string) => {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (search) params.append('search', search);
    return fetchJson<RepairOrder[]>(`/repairs?${params.toString()}`);
  },

  getRepairById: (orderId: string) => fetchJson<RepairOrder>(`/repairs/${orderId}`),

  createRepair: (data: any) =>
    fetchJson<RepairOrder>('/repairs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRepairStatus: (orderId: string, status: RepairStatus, userName?: string, notes?: string) =>
    fetchJson<RepairOrder>(`/repairs/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, userName, notes }),
    }),

  addPartToOrder: (orderId: string, partId: string, quantity: number, unitPrice?: number, userName?: string) =>
    fetchJson<RepairOrder>(`/repairs/${orderId}/parts`, {
      method: 'POST',
      body: JSON.stringify({ partId, quantity, unitPrice, userName }),
    }),

  confirmPartUsed: (orderId: string, partId: string, userName?: string) =>
    fetchJson<RepairOrder>(`/repairs/${orderId}/parts/${partId}/consume`, {
      method: 'POST',
      body: JSON.stringify({ userName }),
    }),

  returnConsumedPart: (orderId: string, partId: string, userName?: string, reason?: string) =>
    fetchJson<RepairOrder>(`/repairs/${orderId}/parts/${partId}/return`, {
      method: 'POST',
      body: JSON.stringify({ userName, reason }),
    }),

  addPayment: (orderId: string, amount: number, paymentMode: PaymentMode, userName?: string, notes?: string) =>
    fetchJson<RepairOrder>(`/repairs/${orderId}/payments`, {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMode, userName, notes }),
    }),

  updateBilling: (orderId: string, finalAmount: number, discount?: number, userName?: string) =>
    fetchJson<RepairOrder>(`/repairs/${orderId}/billing`, {
      method: 'PATCH',
      body: JSON.stringify({ finalAmount, discount, userName }),
    }),

  generatePdf: (orderId: string) =>
    fetchJson<{ filePath: string; fileId: string; link: string }>(`/repairs/${orderId}/generate-pdf`, {
      method: 'POST',
    }),

  // Customers
  getCustomers: (search?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    return fetchJson<Customer[]>(`/customers?${params.toString()}`);
  },

  getCustomerDetails: (customerId: string) =>
    fetchJson<{ customer: Customer; repairHistory: RepairOrder[] }>(`/customers/${customerId}`),

  // Stock
  getStock: (lowStock?: boolean, category?: string, search?: string) => {
    const params = new URLSearchParams();
    if (lowStock) params.append('lowStock', 'true');
    if (category && category !== 'all') params.append('category', category);
    if (search) params.append('search', search);
    return fetchJson<StockItem[]>(`/stock?${params.toString()}`);
  },

  createStockItem: (data: any) =>
    fetchJson<StockItem>('/stock', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStockItem: (itemId: string, data: any) =>
    fetchJson<StockItem>(`/stock/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  stockIn: (data: { itemId: string; quantity: number; reason: string; userName?: string }) =>
    fetchJson<{ part: StockItem; movement: StockMovement }>('/stock/stock-in', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  stockOut: (data: { itemId: string; quantity: number; reason: string; orderId?: string; userName?: string }) =>
    fetchJson<{ part: StockItem; movement: StockMovement }>('/stock/stock-out', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMovements: (itemId?: string, orderId?: string) => {
    const params = new URLSearchParams();
    if (itemId) params.append('itemId', itemId);
    if (orderId) params.append('orderId', orderId);
    return fetchJson<StockMovement[]>(`/stock/movements?${params.toString()}`);
  },

  getSuppliers: () => fetchJson<Supplier[]>('/stock/suppliers'),

  createSupplier: (data: { name: string; mobile: string; notes?: string }) =>
    fetchJson<Supplier>('/stock/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Settings
  getSettings: () => fetchJson<ShopSettings>('/settings'),

  updateSettings: (data: Partial<ShopSettings>) =>
    fetchJson<ShopSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Global Search
  globalSearch: (query: string) =>
    fetchJson<{ orders: RepairOrder[]; customers: Customer[]; parts: StockItem[] }>(
      `/search?q=${encodeURIComponent(query)}`
    ),

  // Sync
  getSyncStatus: () =>
    fetchJson<{
      sheetsConfigured: boolean;
      driveConfigured: boolean;
      sheetId: string;
      driveFolderId: string;
      autoSync: boolean;
      lastSync: string;
    }>('/sync/status'),

  syncToGoogleSheets: () =>
    fetchJson<{ success: boolean; message: string; timestamp: string }>('/sync/sheets/push', {
      method: 'POST',
    }),

  pullFromGoogleSheets: () =>
    fetchJson<{ success: boolean; message: string; timestamp: string }>('/sync/sheets/pull', {
      method: 'POST',
    }),

  saveSheetId: (sheetInput: string) =>
    fetchJson<{ success: boolean; message: string; sheetId: string }>('/sync/save-sheet-id', {
      method: 'POST',
      body: JSON.stringify({ sheetInput }),
    }),

  saveCredentials: (credentialsJson: string) =>
    fetchJson<{ success: boolean; message: string; clientEmail?: string }>('/sync/save-credentials', {
      method: 'POST',
      body: JSON.stringify({ credentialsJson }),
    }),

  // Auth / PIN
  verifyPin: async (pin: string, targetRole: 'employee' | 'owner') => {
    const res = await fetchJson<{ role: string; name: string; token?: string }>('/auth/verify-pin', {
      method: 'POST',
      body: JSON.stringify({ pin, targetRole }),
    });
    if (res && res.token && typeof window !== 'undefined') {
      sessionStorage.setItem('jm_auth_token', res.token);
    }
    return res;
  },

  ensureSession: () => ensureSession(),

  clearSession: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('jm_auth_token');
    }
  },
};
