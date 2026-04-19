import apiClient from './client';

export const usersApi = {
  login(email: string, password: string) {
    return apiClient.post('/users/login', {
      email,
      password,
      hpassword: password,
    });
  },

  getCurrentUser() {
    return apiClient.post('/users/current');
  },
};
