import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const message = error.response?.data?.message;
    const sessionInvalid = error.response?.status === 401 && (
      error.response?.data?.code === 'SESSION_INVALID'
      || message === 'Invalid or inactive user'
      || message === 'Account is disabled'
      || message === 'Invalid refresh token'
    );

    if (sessionInvalid) {
      localStorage.clear();
      const deactivated = message === 'Invalid or inactive user' || message === 'Account is disabled';
      const loginUrl = deactivated ? '/login?deactivated=1' : '/login';
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = loginUrl;
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.data.accessToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
