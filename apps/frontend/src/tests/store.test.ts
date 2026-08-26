import { beforeEach, describe, expect, it, vi } from 'vitest';
import { plan } from './fixtures';

const profile = vi.hoisted(() => ({
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
}));

vi.mock('@features/profile/api/profile', () => ({
  profileApi: {
    addFavorite: profile.addFavorite,
    removeFavorite: profile.removeFavorite,
  },
}));

const user = {
  id: 1,
  email: 'student@example.com',
  fullName: 'Student',
  createdAt: '2025-01-01T00:00:00.000Z',
};

const loadStore = async () => {
  vi.resetModules();
  return (await import('@features/workspace/model/useWorkspaceStore')).useWorkspaceStore;
};

beforeEach(() => {
  localStorage.clear();
  vi.resetAllMocks();
  profile.addFavorite.mockResolvedValue(undefined);
  profile.removeFavorite.mockResolvedValue(undefined);
});

describe('persisted app state', () => {
  it('loads a valid user, numeric favorites and versioned comparison state', async () => {
    localStorage.setItem('eduplan-user', JSON.stringify(user));
    localStorage.setItem('eduplan-favorites', JSON.stringify([1, 'bad', 2, null]));
    localStorage.setItem(
      'eduplan-compare',
      JSON.stringify({ version: 2, ids: [3, null], levels: ['Бакалавриат', null] }),
    );

    const store = await loadStore();
    expect(store.getState()).toMatchObject({
      user,
      favorites: [1, 2],
      compareIds: [3, null],
      compareLevels: ['Бакалавриат', null],
    });
  });

  it('recovers from malformed persisted values', async () => {
    localStorage.setItem('eduplan-user', '{');
    localStorage.setItem('eduplan-favorites', '{');
    localStorage.setItem('eduplan-compare', '{');
    let store = await loadStore();
    expect(store.getState()).toMatchObject({ user: null, favorites: [], compareIds: [null, null] });

    localStorage.setItem('eduplan-user', JSON.stringify({ id: 'not-number' }));
    localStorage.setItem('eduplan-favorites', JSON.stringify({ value: 1 }));
    localStorage.setItem(
      'eduplan-compare',
      JSON.stringify({ version: 1, ids: [1, 2], levels: ['A', 'A'] }),
    );
    store = await loadStore();
    expect(store.getState()).toMatchObject({ user: null, favorites: [], compareIds: [null, null] });

    localStorage.setItem('eduplan-user', JSON.stringify(user));
    localStorage.setItem('eduplan-favorites', '{');
    store = await loadStore();
    expect(store.getState().favorites).toEqual([]);

    localStorage.removeItem('eduplan-favorites');
    store = await loadStore();
    expect(store.getState().favorites).toEqual([]);

    localStorage.setItem('eduplan-favorites', JSON.stringify({ value: 1 }));
    store = await loadStore();
    expect(store.getState().favorites).toEqual([]);
  });

  it('rejects incomplete arrays and selected ids without levels', async () => {
    localStorage.setItem('eduplan-compare', JSON.stringify({ version: 2, ids: 'bad', levels: [] }));
    let store = await loadStore();
    expect(store.getState().compareIds).toEqual([null, null]);

    localStorage.setItem(
      'eduplan-compare',
      JSON.stringify({ version: 2, ids: [1, 'bad'], levels: [null, 42] }),
    );
    store = await loadStore();
    expect(store.getState().compareIds).toEqual([null, null]);

    localStorage.setItem(
      'eduplan-compare',
      JSON.stringify({ version: 2, ids: [null, 2], levels: [null, 'Магистратура'] }),
    );
    store = await loadStore();
    expect(store.getState().compareIds).toEqual([null, 2]);
  });
});

describe('app state actions', () => {
  it('sets, clears and logs out the current user safely', async () => {
    const store = await loadStore();

    store.getState().setUser(user);
    expect(JSON.parse(localStorage.getItem('eduplan-user') ?? 'null')).toEqual(user);
    store.getState().setFavorites([1, 2]);
    expect(localStorage.getItem('eduplan-favorites')).toBe('[1,2]');

    store.getState().setUser(null);
    expect(store.getState()).toMatchObject({ user: null, favorites: [] });
    expect(localStorage.getItem('eduplan-user')).toBeNull();

    store.getState().setUser(user);
    localStorage.setItem('eduplan-token', 'token');
    store.getState().logout();
    expect(store.getState()).toMatchObject({ user: null, favorites: [] });
    expect(localStorage.getItem('eduplan-token')).toBeNull();
  });

  it('ignores favorite changes for guests and persists successful add/remove actions', async () => {
    const store = await loadStore();
    store.getState().toggleFavorite(1);
    expect(profile.addFavorite).not.toHaveBeenCalled();

    store.getState().setUser(user);
    store.getState().toggleFavorite(1);
    expect(store.getState().favorites).toEqual([1]);
    expect(profile.addFavorite).toHaveBeenCalledWith(1);

    store.getState().toggleFavorite(1);
    expect(store.getState().favorites).toEqual([]);
    expect(profile.removeFavorite).toHaveBeenCalledWith(1);
  });

  it('rolls back optimistic favorite additions and removals after API failures', async () => {
    const store = await loadStore();
    store.getState().setUser(user);

    profile.addFavorite.mockRejectedValueOnce(new Error('offline'));
    store.getState().toggleFavorite(1);
    await vi.waitFor(() => expect(store.getState().favorites).toEqual([]));
    expect(localStorage.getItem('eduplan-favorites')).toBe('[]');

    store.getState().setFavorites([1]);
    profile.removeFavorite.mockRejectedValueOnce(new Error('offline'));
    store.getState().toggleFavorite(1);
    await vi.waitFor(() => expect(store.getState().favorites).toEqual([1]));
  });

  it('sets either comparison slot while preventing duplicates and incompatible levels', async () => {
    const store = await loadStore();
    const bachelor = { id: 1, level: 'Бакалавриат' };
    const bachelorTwo = { id: 2, level: 'бакалавр' };
    const master = { id: 3, level: 'Магистратура' };

    expect(store.getState().setComparePlan(0, bachelor)).toBe('added');
    expect(store.getState().setComparePlan(1, bachelor)).toBe('already-selected');
    expect(store.getState().setComparePlan(1, master)).toBe('incompatible');
    expect(store.getState().setComparePlan(1, bachelorTwo)).toBe('added');
    expect(store.getState().setComparePlan(0, bachelorTwo)).toBe('already-selected');
    expect(store.getState().setComparePlan(0, master)).toBe('incompatible');
    expect(store.getState().setComparePlan(1, null)).toBe('added');
    expect(store.getState().compareIds).toEqual([1, null]);
    expect(JSON.parse(localStorage.getItem('eduplan-compare') ?? 'null')).toMatchObject({
      version: 2,
    });
  });

  it('adds comparison plans to empty and full selections and removes them with their levels', async () => {
    const store = await loadStore();
    const first = { id: 1, level: 'Бакалавриат' };
    const second = { id: 2, level: 'Бакалавриат' };
    const third = { id: 3, level: 'Бакалавриат' };

    expect(store.getState().addToCompare(first)).toBe('added');
    expect(store.getState().addToCompare(first)).toBe('already-selected');
    expect(store.getState().addToCompare({ id: 4, level: 'Магистратура' })).toBe('incompatible');
    expect(store.getState().addToCompare(second)).toBe('added');
    expect(store.getState().addToCompare(third)).toBe('added');
    expect(store.getState().compareIds).toEqual([1, 3]);

    store.getState().removeFromCompare(1);
    expect(store.getState()).toMatchObject({
      compareIds: [null, 3],
      compareLevels: [null, 'Бакалавриат'],
    });
    expect(store.getState().addToCompare(second)).toBe('added');
    expect(store.getState().compareIds).toEqual([2, 3]);
    store.getState().removeFromCompare(99);
    expect(store.getState().compareIds).toEqual([2, 3]);
  });

  it('deduplicates history and retains only the eight most recent plans', async () => {
    const store = await loadStore();
    for (let id = 1; id <= 10; id += 1) store.getState().addToHistory(plan({ id }));
    store.getState().addToHistory(plan({ id: 5, title: 'Updated' }));

    expect(store.getState().history).toHaveLength(8);
    expect(store.getState().history[0]).toMatchObject({ id: 5, title: 'Updated' });
    expect(store.getState().history.filter((item) => item.id === 5)).toHaveLength(1);
  });
});
