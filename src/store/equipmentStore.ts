import { create } from 'zustand';
import { api } from '../services/api';
import type { Equipment } from '../types';

interface EquipmentState {
  items: Equipment[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  searchQuery: string;
  categoryFilter: string;
  fetch: () => Promise<void>;
  create: (data: Partial<Equipment>) => Promise<Equipment>;
  update: (id: string, data: Partial<Equipment>) => Promise<Equipment>;
  remove: (id: string) => Promise<void>;
  setSelectedId: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  setCategoryFilter: (cat: string) => void;
  filtered: () => Equipment[];
}

export const useEquipmentStore = create<EquipmentState>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  selectedId: null,
  searchQuery: '',
  categoryFilter: '',

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const items = await api.equipment.list();
      set({ items, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  create: async (data) => {
    const created = await api.equipment.create(data);
    set(s => ({ items: [...s.items, created] }));
    return created;
  },

  update: async (id, data) => {
    const updated = await api.equipment.update(id, data);
    set(s => ({ items: s.items.map(e => e.id === id ? updated : e) }));
    return updated;
  },

  remove: async (id) => {
    await api.equipment.delete(id);
    set(s => ({ items: s.items.filter(e => e.id !== id) }));
  },

  setSelectedId: (id) => set({ selectedId: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setCategoryFilter: (cat) => set({ categoryFilter: cat }),

  filtered: () => {
    const { items, searchQuery, categoryFilter } = get();
    let result = items;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.brand.toLowerCase().includes(q) ||
        e.model.toLowerCase().includes(q)
      );
    }
    if (categoryFilter) {
      result = result.filter(e => e.category === categoryFilter);
    }
    return result;
  },
}));
