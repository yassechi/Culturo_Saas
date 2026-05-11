// culturo/front-culturo/src/api/admin.ts
import apiClient from './client';

export interface ApiUser {
  id_user: number;
  user_first_name: string;
  user_last_name: string;
  email: string;
  phone?: string;
  user_active: boolean;
  id_role: number;
  role?: { id_role: number; role_name: string };
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
};
