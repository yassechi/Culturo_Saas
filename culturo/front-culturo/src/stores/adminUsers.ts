// culturo/front-culturo/src/stores/adminUsers.ts
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { adminApi, type ApiUser, type CreateUserPayload } from '@/api/admin';

export type RoleName = 'admin' | 'formateur' | 'stagiaire';

export const ROLE_ID: Record<RoleName, number> = {
  admin: 1,
  formateur: 2,
  stagiaire: 3,
};

export const ROLE_NAME: Record<number, RoleName> = {
  1: 'admin',
  2: 'formateur',
  3: 'stagiaire',
};

export type FilterStatus = 'all' | 'active' | 'inactive';
export type FilterRole = 'all' | RoleName;

export interface UserForm {
  user_first_name: string;
  user_last_name: string;
  email: string;
  hpassword: string;
  phone: string;
  role: RoleName;
  user_active: boolean;
}

function emptyForm(): UserForm {
  return {
    user_first_name: '',
    user_last_name: '',
    email: '',
    hpassword: '',
    phone: '',
    role: 'stagiaire',
    user_active: true,
  };
}

export const useAdminUsersStore = defineStore('adminUsers', () => {
  const users = ref<ApiUser[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const filterStatus = ref<FilterStatus>('all');
  const filterRole = ref<FilterRole>('all');
  const search = ref('');

  const modalOpen = ref(false);
  const modalMode = ref<'create' | 'edit'>('create');
  const modalUserId = ref<number | null>(null);
  const modalForm = ref<UserForm>(emptyForm());
  const modalError = ref<string | null>(null);
  const modalLoading = ref(false);

  // ── Getters ────────────────────────────────────────────────────────────────

  function resolveRoleName(u: ApiUser): RoleName {
    if (u.role?.role_name) return u.role.role_name as RoleName;
    return ROLE_NAME[u.id_role] ?? 'stagiaire';
  }

  const filteredUsers = computed(() => {
    const q = search.value.trim().toLowerCase();
    return users.value.filter((u) => {
      if (filterStatus.value === 'active' && !u.user_active) return false;
      if (filterStatus.value === 'inactive' && u.user_active) return false;
      const roleName = resolveRoleName(u);
      if (filterRole.value !== 'all' && roleName !== filterRole.value) return false;
      if (q) {
        const full = `${u.user_first_name} ${u.user_last_name} ${u.email}`.toLowerCase();
        if (!full.includes(q)) return false;
      }
      return true;
    });
  });

  const stats = computed(() => ({
    total: users.value.length,
    active: users.value.filter((u) => u.user_active).length,
    inactive: users.value.filter((u) => !u.user_active).length,
    admins: users.value.filter((u) => resolveRoleName(u) === 'admin').length,
    formateurs: users.value.filter((u) => resolveRoleName(u) === 'formateur').length,
    stagiaires: users.value.filter((u) => resolveRoleName(u) === 'stagiaire').length,
  }));

  // ── Actions ────────────────────────────────────────────────────────────────

  async function loadUsers() {
    loading.value = true;
    error.value = null;
    try {
      const resp = await adminApi.getAllUsers();
      users.value = resp.data;
    } catch {
      error.value = 'Impossible de charger la liste des utilisateurs.';
    } finally {
      loading.value = false;
    }
  }

  async function toggleStatus(user: ApiUser) {
    const next = !user.user_active;
    try {
      await adminApi.setStatus(user.id_user, next);
      user.user_active = next;
    } catch {
      error.value = `Impossible de modifier le statut de ${user.user_first_name}.`;
    }
  }

  async function changeRole(user: ApiUser, role: RoleName) {
    try {
      await adminApi.updateUser({ id_user: user.id_user, id_role: ROLE_ID[role] });
      user.id_role = ROLE_ID[role];
      if (user.role) user.role.role_name = role;
    } catch {
      error.value = `Impossible de modifier le rôle de ${user.user_first_name}.`;
    }
  }

  function openCreateModal() {
    modalMode.value = 'create';
    modalUserId.value = null;
    modalForm.value = emptyForm();
    modalError.value = null;
    modalOpen.value = true;
  }

  function openEditModal(user: ApiUser) {
    modalMode.value = 'edit';
    modalUserId.value = user.id_user;
    modalForm.value = {
      user_first_name: user.user_first_name,
      user_last_name: user.user_last_name,
      email: user.email,
      hpassword: '',
      phone: user.phone ?? '',
      role: resolveRoleName(user),
      user_active: user.user_active,
    };
    modalError.value = null;
    modalOpen.value = true;
  }

  function closeModal() {
    modalOpen.value = false;
    modalError.value = null;
  }

  async function submitModal() {
    modalLoading.value = true;
    modalError.value = null;
    try {
      if (modalMode.value === 'create') {
        const payload: CreateUserPayload = {
          user_first_name: modalForm.value.user_first_name.trim(),
          user_last_name: modalForm.value.user_last_name.trim(),
          email: modalForm.value.email.trim(),
          hpassword: modalForm.value.hpassword,
          phone: modalForm.value.phone.trim(),
          id_role: ROLE_ID[modalForm.value.role],
          user_active: modalForm.value.user_active,
          birth_date: '2000-01-01',
          path_photo: '',
        };
        const resp = await adminApi.createUser(payload);
        users.value.push(resp.data);
      } else if (modalUserId.value !== null) {
        const payload: Record<string, any> = {
          id_user: modalUserId.value,
          user_first_name: modalForm.value.user_first_name.trim(),
          user_last_name: modalForm.value.user_last_name.trim(),
          email: modalForm.value.email.trim(),
          phone: modalForm.value.phone.trim(),
          id_role: ROLE_ID[modalForm.value.role],
          user_active: modalForm.value.user_active,
        };
        if (modalForm.value.hpassword) payload.hpassword = modalForm.value.hpassword;
        await adminApi.updateUser(payload);
        const idx = users.value.findIndex((u) => u.id_user === modalUserId.value);
        if (idx !== -1) {
          const u = users.value[idx];
          Object.assign(u, {
            user_first_name: payload.user_first_name,
            user_last_name: payload.user_last_name,
            email: payload.email,
            phone: payload.phone,
            id_role: payload.id_role,
            user_active: payload.user_active,
          });
          if (u.role) u.role.role_name = modalForm.value.role;
        }
      }
      closeModal();
    } catch (e: any) {
      modalError.value =
        e?.response?.data?.message ?? 'Une erreur est survenue. Vérifiez les champs.';
    } finally {
      modalLoading.value = false;
    }
  }

  return {
    users,
    loading,
    error,
    filterStatus,
    filterRole,
    search,
    filteredUsers,
    stats,
    modalOpen,
    modalMode,
    modalForm,
    modalError,
    modalLoading,
    resolveRoleName,
    loadUsers,
    toggleStatus,
    changeRole,
    openCreateModal,
    openEditModal,
    closeModal,
    submitModal,
  };
});
