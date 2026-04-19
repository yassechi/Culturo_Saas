import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { usersApi } from '@/api/users';

export type UserRole = 'admin' | 'formateur' | 'stagiaire';

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  active?: boolean;
}

const TOKEN_KEY = 'culturo_token';
const USER_KEY = 'culturo_user';

function readStoredUser(): AuthUser | null {
  const rawUser = localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

function normalizeRole(role: unknown): UserRole {
  if (role === 'admin' || role === 'formateur' || role === 'stagiaire') {
    return role;
  }

  return 'stagiaire';
}

function normalizeUser(
  payload: Record<string, unknown>,
  fallback?: Partial<AuthUser>,
): AuthUser {
  const rolePayload =
    typeof payload.role === 'object' &&
    payload.role !== null &&
    'role_name' in payload.role
      ? String(payload.role.role_name)
      : payload.role ?? fallback?.role;

  return {
    id: Number(payload.id ?? payload.id_user ?? fallback?.id ?? 0),
    email: String(payload.email ?? fallback?.email ?? ''),
    role: normalizeRole(rolePayload),
    firstName:
      typeof payload.firstName === 'string'
        ? payload.firstName
        : typeof payload.user_first_name === 'string'
          ? payload.user_first_name
          : fallback?.firstName,
    lastName:
      typeof payload.lastName === 'string'
        ? payload.lastName
        : typeof payload.user_last_name === 'string'
          ? payload.user_last_name
          : fallback?.lastName,
    active:
      typeof payload.active === 'boolean'
        ? payload.active
        : typeof payload.user_active === 'boolean'
          ? payload.user_active
          : fallback?.active,
  };
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY));
  const user = ref<AuthUser | null>(readStoredUser());

  const isAuthenticated = computed(() => Boolean(token.value));
  const isAdmin = computed(() => user.value?.role === 'admin');
  const isFormateur = computed(() => user.value?.role === 'formateur');
  const isStagiaire = computed(() => user.value?.role === 'stagiaire');

  function persistSession(nextToken: string, nextUser: AuthUser) {
    token.value = nextToken;
    user.value = nextUser;
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }

  function loadFromStorage() {
    token.value = localStorage.getItem(TOKEN_KEY);
    user.value = readStoredUser();
  }

  async function login(email: string, password: string) {
    const response = await usersApi.login(email, password);
    const accessToken = response.data.access_token ?? response.data.accessToken;

    if (!accessToken) {
      throw new Error('Missing access token in login response');
    }

    const nextUser = response.data.user
      ? normalizeUser(response.data.user)
      : normalizeUser(
          {
            id: response.data.id,
            email,
            role: response.data.role,
          },
          { email },
        );

    persistSession(accessToken, nextUser);
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  async function fetchCurrentUser() {
    const response = await usersApi.getCurrentUser();
    const nextUser = normalizeUser(
      response.data,
      user.value ?? undefined,
    );

    user.value = nextUser;
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));

    return nextUser;
  }

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    isFormateur,
    isStagiaire,
    loadFromStorage,
    login,
    logout,
    fetchCurrentUser,
  };
});
