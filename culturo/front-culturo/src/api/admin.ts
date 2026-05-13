// culturo/front-culturo/src/api/admin.ts
import apiClient from './client';

export interface ApiGroup {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface ApiUser {
  id_user: number;
  user_first_name: string;
  user_last_name: string;
  email: string;
  phone?: string;
  user_active: boolean;
  id_role: number;
  role?: { id_role: number; role_name: string };
  id_group: number | null;
  group?: ApiGroup | null;
}

export interface CreateUserPayload {
  user_first_name: string;
  user_last_name: string;
  email: string;
  hpassword: string;
  phone?: string;
  id_role: number;
  user_active: boolean;
  birth_date: string;
  path_photo: string;
}

export interface UpdateUserPayload {
  id_user: number;
  user_first_name?: string;
  user_last_name?: string;
  email?: string;
  hpassword?: string;
  phone?: string;
  id_role?: number;
  user_active?: boolean;
}

export const adminApi = {
  getAllUsers() {
    return apiClient.get<ApiUser[]>('/users');
  },
  createUser(payload: CreateUserPayload) {
    return apiClient.post<ApiUser>('/users/register', payload);
  },
  updateUser(payload: UpdateUserPayload) {
    return apiClient.put<{ status: number; msg: string }>('/users', payload);
  },
  setStatus(id: number, active: boolean) {
    return apiClient.patch(`/users/status/${id}/${active}`);
  },
  getAllGroups() {
    return apiClient.get<ApiGroup[]>('/groups');
  },
  createGroup(name: string, description: string | null) {
    return apiClient.post<ApiGroup>('/groups', { name, description });
  },
  updateGroup(id: number, name: string, description: string | null) {
    return apiClient.put<ApiGroup>(`/groups/${id}`, { name, description });
  },
  deleteGroup(id: number) {
    return apiClient.delete(`/groups/${id}`);
  },
  assignGroup(userId: number, groupId: number | null) {
    return apiClient.put(`/groups/assign/${userId}`, { groupId });
  },
};
