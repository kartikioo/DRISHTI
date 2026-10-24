import api from './api.js';

export const authService = {
  async register(data) {
    const res = await api.post('/auth/register', data);
    if (res.data?.token) {
      localStorage.setItem('drishti_token', res.data.token);
    }
    return res.data;
  },

  async login(data) {
    const res = await api.post('/auth/login', data);
    if (res.data?.token) {
      localStorage.setItem('drishti_token', res.data.token);
    }
    return res.data;
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  async guestLogin() {
    const res = await api.post('/auth/guest');
    if (res.data?.token) {
      localStorage.setItem('drishti_token', res.data.token);
    }
    return res.data;
  },

  logout() {
    localStorage.removeItem('drishti_token');
  }
};
