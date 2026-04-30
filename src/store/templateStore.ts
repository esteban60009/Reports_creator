import { create } from 'zustand';
import { api } from '../services/api';
import type { Template } from '../types';

interface TemplateState {
  items: Template[];
  loading: boolean;
  error: string | null;
  fetch: (equipmentId?: string) => Promise<void>;
  getById: (id: string) => Promise<Template>;
  create: (data: Partial<Template>) => Promise<Template>;
  update: (id: string, data: Partial<Template>) => Promise<Template>;
  remove: (id: string) => Promise<void>;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetch: async (equipmentId?) => {
    set({ loading: true, error: null });
    try {
      const items = await api.templates.list(equipmentId);
      set({ items, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  getById: async (id) => {
    const cached = get().items.find(t => t.id === id);
    if (cached) return cached;
    return api.templates.get(id);
  },

  create: async (data) => {
    const created = await api.templates.create(data);
    set(s => ({ items: [...s.items, created] }));
    return created;
  },

  update: async (id, data) => {
    const updated = await api.templates.update(id, data);
    set(s => ({ items: s.items.map(t => t.id === id ? updated : t) }));
    return updated;
  },

  remove: async (id) => {
    await api.templates.delete(id);
    set(s => ({ items: s.items.filter(t => t.id !== id) }));
  },
}));
