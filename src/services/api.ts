const API_BASE = 'http://localhost:3001/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Equipment
  equipment: {
    list: () => request<any[]>('/equipment'),
    get: (id: string) => request<any>(`/equipment/${id}`),
    create: (data: any) => request<any>('/equipment', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/equipment/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/equipment/${id}`, { method: 'DELETE' }),
  },
  // Templates
  templates: {
    list: (equipmentId?: string) => request<any[]>(`/templates${equipmentId ? `?equipmentId=${equipmentId}` : ''}`),
    get: (id: string) => request<any>(`/templates/${id}`),
    create: (data: any) => request<any>('/templates', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/templates/${id}`, { method: 'DELETE' }),
  },
  // Reports
  reports: {
    list: (filters?: Record<string, string>) => {
      const params = new URLSearchParams(filters || {}).toString();
      return request<any[]>(`/reports${params ? `?${params}` : ''}`);
    },
    get: (id: string) => request<any>(`/reports/${id}`),
    create: (data: any) => request<any>('/reports', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/reports/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/reports/${id}`, { method: 'DELETE' }),
  },
  // Settings
  settings: {
    getCompany: () => request<any>('/settings/company'),
    updateCompany: (data: any) => request<any>('/settings/company', { method: 'PUT', body: JSON.stringify(data) }),
    uploadLogo: async (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await fetch(`${API_BASE}/settings/company/logo`, { method: 'POST', body: formData });
      return res.json();
    },
    getTechnicians: () => request<any[]>('/settings/technicians'),
    createTechnician: (data: any) => request<any>('/settings/technicians', { method: 'POST', body: JSON.stringify(data) }),
    updateTechnician: (id: string, data: any) => request<any>(`/settings/technicians/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteTechnician: (id: string) => request<void>(`/settings/technicians/${id}`, { method: 'DELETE' }),
    getLayouts: () => request<any[]>('/settings/layouts'),
    updateLayout: (id: string, data: any) => request<any>(`/settings/layouts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  // AI
  ai: {
    analyzePDF: async (file: File, equipmentName: string) => {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('equipmentName', equipmentName);
      const res = await fetch(`${API_BASE}/ai/analyze-pdf`, { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error al analizar PDF' }));
        throw new Error(err.error || 'Error al analizar PDF');
      }
      return res.json();
    },
  },
};

