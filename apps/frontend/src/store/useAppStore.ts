import { create } from 'zustand';
import type { EducationPlan, UserProfile } from '../types/plan';

type AppState = {
  user: UserProfile | null;
  favorites: number[];
  compareIds: number[];
  history: EducationPlan[];
  setUser: (user: UserProfile | null) => void;
  logout: () => void;
  toggleFavorite: (planId: number) => void;
  addToCompare: (planId: number) => void;
  removeFromCompare: (planId: number) => void;
  addToHistory: (plan: EducationPlan) => void;
};

const readNumbers = (key: string) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(value) ? value.filter((item) => typeof item === 'number') : [];
  } catch {
    return [];
  }
};

const saveNumbers = (key: string, value: number[]) =>
  localStorage.setItem(key, JSON.stringify(value));

const readUser = () => {
  try {
    const value = JSON.parse(localStorage.getItem('eduplan-user') ?? 'null');
    return value && typeof value.id === 'number' ? (value as UserProfile) : null;
  } catch {
    return null;
  }
};

const initialUser = readUser();

export const useAppStore = create<AppState>((set, get) => ({
  user: initialUser,
  favorites: initialUser ? readNumbers('eduplan-favorites') : [],
  compareIds: readNumbers('eduplan-compare').slice(0, 3),
  history: [],
  setUser: (user) => {
    if (user) {
      localStorage.setItem('eduplan-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('eduplan-user');
      localStorage.removeItem('eduplan-favorites');
    }
    set({ user, favorites: user ? get().favorites : [] });
  },
  logout: () => {
    localStorage.removeItem('eduplan-token');
    localStorage.removeItem('eduplan-user');
    localStorage.removeItem('eduplan-favorites');
    set({ user: null, favorites: [] });
  },
  toggleFavorite: (planId) => {
    if (!get().user) return;

    const favorites = get().favorites.includes(planId)
      ? get().favorites.filter((id) => id !== planId)
      : [...get().favorites, planId];
    saveNumbers('eduplan-favorites', favorites);
    set({ favorites });
  },
  addToCompare: (planId) => {
    const current = get().compareIds.filter((id) => id !== planId);
    const compareIds = [planId, ...current].slice(0, 3);
    saveNumbers('eduplan-compare', compareIds);
    set({ compareIds });
  },
  removeFromCompare: (planId) => {
    const compareIds = get().compareIds.filter((id) => id !== planId);
    saveNumbers('eduplan-compare', compareIds);
    set({ compareIds });
  },
  addToHistory: (plan) => {
    const history = [plan, ...get().history.filter((item) => item.id !== plan.id)].slice(0, 8);
    set({ history });
  },
}));
