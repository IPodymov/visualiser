import { create } from 'zustand';
import type { EducationPlan } from '@entities/plan/model/types';
import type { UserProfile } from '@entities/user/model/types';
import { areEducationLevelsCompatible } from '@features/comparison/lib/compareEligibility';
import { profileApi } from '@features/profile/api/profile';

type ComparePlanCandidate = Pick<EducationPlan, 'id' | 'level'>;
export type CompareSelectionResult = 'added' | 'already-selected' | 'incompatible';

type AppState = {
  user: UserProfile | null;
  favorites: number[];
  compareIds: [number | null, number | null];
  compareLevels: [string | null, string | null];
  history: EducationPlan[];
  setUser: (user: UserProfile | null) => void;
  logout: () => void;
  toggleFavorite: (planId: number) => void;
  setFavorites: (planIds: number[]) => void;
  setComparePlan: (slot: 0 | 1, plan: ComparePlanCandidate | null) => CompareSelectionResult;
  addToCompare: (plan: ComparePlanCandidate) => CompareSelectionResult;
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

const emptyCompareState = {
  ids: [null, null] as [number | null, number | null],
  levels: [null, null] as [string | null, string | null],
};

const readCompareState = () => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem('eduplan-compare') ?? 'null');
    if (
      !value ||
      typeof value !== 'object' ||
      !('version' in value) ||
      value.version !== 2 ||
      !('ids' in value) ||
      !('levels' in value)
    ) {
      return emptyCompareState;
    }

    const { ids, levels } = value as { ids?: unknown; levels?: unknown };
    if (!Array.isArray(ids) || !Array.isArray(levels)) return emptyCompareState;

    const compareIds: [number | null, number | null] = [
      typeof ids[0] === 'number' ? ids[0] : null,
      typeof ids[1] === 'number' ? ids[1] : null,
    ];
    const compareLevels: [string | null, string | null] = [
      typeof levels[0] === 'string' ? levels[0] : null,
      typeof levels[1] === 'string' ? levels[1] : null,
    ];

    if (compareIds.some((id, index) => id !== null && !compareLevels[index])) {
      return emptyCompareState;
    }

    return { ids: compareIds, levels: compareLevels };
  } catch {
    return emptyCompareState;
  }
};

const storedCompareState = readCompareState();

const saveCompareState = (
  ids: [number | null, number | null],
  levels: [string | null, string | null],
) => localStorage.setItem('eduplan-compare', JSON.stringify({ version: 2, ids, levels }));

export const useWorkspaceStore = create<AppState>((set, get) => ({
  user: initialUser,
  favorites: initialUser ? readNumbers('eduplan-favorites') : [],
  compareIds: storedCompareState.ids,
  compareLevels: storedCompareState.levels,
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

    const wasFavorite = get().favorites.includes(planId);
    const previous = get().favorites;
    const favorites = wasFavorite ? previous.filter((id) => id !== planId) : [...previous, planId];
    saveNumbers('eduplan-favorites', favorites);
    set({ favorites });
    const request = wasFavorite
      ? profileApi.removeFavorite(planId)
      : profileApi.addFavorite(planId);
    void request.catch(() => {
      saveNumbers('eduplan-favorites', previous);
      set({ favorites: previous });
    });
  },
  setFavorites: (planIds) => {
    saveNumbers('eduplan-favorites', planIds);
    set({ favorites: planIds });
  },
  setComparePlan: (slot, plan) => {
    const currentIds = get().compareIds;
    const currentLevels = get().compareLevels;
    const otherSlot = slot === 0 ? 1 : 0;
    if (plan && currentIds[otherSlot] === plan.id) return 'already-selected';
    if (
      plan &&
      currentLevels[otherSlot] &&
      !areEducationLevelsCompatible(plan.level, currentLevels[otherSlot])
    ) {
      return 'incompatible';
    }

    const compareIds: [number | null, number | null] = [...currentIds];
    const compareLevels: [string | null, string | null] = [...currentLevels];
    compareIds[slot] = plan?.id ?? null;
    compareLevels[slot] = plan?.level ?? null;
    saveCompareState(compareIds, compareLevels);
    set({ compareIds, compareLevels });
    return 'added';
  },
  addToCompare: (plan) => {
    const current = get().compareIds;
    const currentLevels = get().compareLevels;
    if (current.includes(plan.id)) return 'already-selected';

    const requiredLevel = currentLevels.find((level) => level !== null);
    if (requiredLevel && !areEducationLevelsCompatible(plan.level, requiredLevel)) {
      return 'incompatible';
    }

    const compareIds: [number | null, number | null] =
      current[0] === null
        ? [plan.id, current[1]]
        : current[1] === null
          ? [current[0], plan.id]
          : [current[0], plan.id];
    const compareLevels: [string | null, string | null] =
      current[0] === null
        ? [plan.level, currentLevels[1]]
        : current[1] === null
          ? [currentLevels[0], plan.level]
          : [currentLevels[0], plan.level];
    saveCompareState(compareIds, compareLevels);
    set({ compareIds, compareLevels });
    return 'added';
  },
  removeFromCompare: (planId) => {
    const compareIds = get().compareIds.map((id) => (id === planId ? null : id)) as [
      number | null,
      number | null,
    ];
    const compareLevels = get().compareLevels.map((level, index) =>
      get().compareIds[index] === planId ? null : level,
    ) as [string | null, string | null];
    saveCompareState(compareIds, compareLevels);
    set({ compareIds, compareLevels });
  },
  addToHistory: (plan) => {
    const history = [plan, ...get().history.filter((item) => item.id !== plan.id)].slice(0, 8);
    set({ history });
  },
}));
