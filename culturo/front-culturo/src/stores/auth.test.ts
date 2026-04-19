import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('@/api/users', () => ({
  usersApi: {
    login: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

import { usersApi } from '@/api/users';
import { useAuthStore } from './auth';

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('isAuthenticated is false by default', () => {
    const store = useAuthStore();
    expect(store.isAuthenticated).toBe(false);
  });

  it('login stores token and user', async () => {
    vi.mocked(usersApi.login).mockResolvedValue({
      data: {
        accessToken: 'test-token-123',
        id: 1,
        role: 'admin',
      },
    } as never);

    const store = useAuthStore();
    await store.login('admin@culturo.be', '123456');

    expect(store.token).toBe('test-token-123');
    expect(store.user?.role).toBe('admin');
    expect(store.user?.email).toBe('admin@culturo.be');
    expect(store.isAdmin).toBe(true);
    expect(localStorage.getItem('culturo_token')).toBe('test-token-123');
  });

  it('logout clears token and user', () => {
    localStorage.setItem('culturo_token', 'stale-token');
    localStorage.setItem(
      'culturo_user',
      JSON.stringify({ id: 2, email: 'stagiaire@culturo.be', role: 'stagiaire' }),
    );

    const store = useAuthStore();
    store.loadFromStorage();
    store.logout();

    expect(store.token).toBeNull();
    expect(store.user).toBeNull();
    expect(localStorage.getItem('culturo_token')).toBeNull();
    expect(localStorage.getItem('culturo_user')).toBeNull();
  });

  it('fetchCurrentUser keeps the stored role if the backend omits it', async () => {
    vi.mocked(usersApi.getCurrentUser).mockResolvedValue({
      data: {
        id_user: 3,
        email: 'marc@culturo.be',
        user_first_name: 'Marc',
        user_last_name: 'Lefevre',
        user_active: true,
      },
    } as never);

    const store = useAuthStore();
    store.user = {
      id: 3,
      email: 'marc@culturo.be',
      role: 'formateur',
    };

    const user = await store.fetchCurrentUser();

    expect(user.role).toBe('formateur');
    expect(store.isFormateur).toBe(true);
    expect(store.user?.firstName).toBe('Marc');
  });
});
