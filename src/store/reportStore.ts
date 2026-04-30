import { create } from 'zustand';
import { api } from '../services/api';
import type { Report } from '../types';

interface ReportState {
  items: Report[];
  loading: boolean;
  error: string | null;
  fetch: (filters?: Record<string, string>) => Promise<void>;
  getById: (id: string) => Promise<Report>;
  create: (data: Partial<Report>) => Promise<Report>;
  update: (id: string, data: Partial<Report>) => Promise<Report>;
  remove: (id: string) => Promise<void>;
}

export const useReportStore = create<ReportState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetch: async (filters?) => {
    set({ loading: true, error: null });
    try {
      const items = await api.reports.list(filters);
      set({ items, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  getById: async (id) => {
    const cached = get().items.find(r => r.id === id);
    if (cached) return cached;
    return api.reports.get(id);
  },

  create: async (data) => {
    const created = await api.reports.create(data);
    set(s => ({ items: [created, ...s.items] }));
    return created;
  },

  update: async (id, data) => {
    const updated = await api.reports.update(id, data);
    set(s => ({ items: s.items.map(r => r.id === id ? updated : r) }));
    return updated;
  },

  remove: async (id) => {
    await api.reports.delete(id);
    set(s => ({ items: s.items.filter(r => r.id !== id) }));
  },
}));
