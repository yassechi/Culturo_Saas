import apiClient from './client';

export const usersApi = {
  login(email: string, password: string) {
    return apiClient.post('/users/login', {
      email,
      hpassword: password,
    });
  },

  getCurrentUser() {
    return apiClient.post('/users/current');
  },

  register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roleId: number;
  }) {
    return apiClient.post('/users/register', {
      email: data.email,
      hpassword: data.password,
      user_first_name: data.firstName,
      user_last_name: data.lastName,
      id_role: data.roleId,
    });
  },

  forgotPassword(email: string) {
    return apiClient.post('/users/forgot-password', { email });
  },

  resetPassword(token: string, newPassword: string) {
    return apiClient.post('/users/reset-password', { token, newPassword });
  },
};
