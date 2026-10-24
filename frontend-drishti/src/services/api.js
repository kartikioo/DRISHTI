import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 90000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT auth token and user AI keys if configured
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('drishti_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach user-provided AI credentials if stored locally
    const customKey = localStorage.getItem('drishti_user_ai_key');
    const customProvider = localStorage.getItem('drishti_user_ai_provider');
    let customModel = localStorage.getItem('drishti_user_ai_model');

    // Auto-migrate legacy model names to active Gemini 3.8 Flash
    if (customModel && ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-pro'].includes(customModel)) {
      customModel = 'gemini-3.8-flash';
      localStorage.setItem('drishti_user_ai_model', 'gemini-3.8-flash');
    }

    if (customKey) {
      config.headers['x-ai-api-key'] = customKey;
    }
    if (customProvider) {
      config.headers['x-ai-provider'] = customProvider;
    }
    if (customModel) {
      config.headers['x-ai-model'] = customModel;
    }

    // Let the browser set the multipart boundary automatically when sending FormData
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Network request failed';
    return Promise.reject(new Error(message));
  }
);

export default api;
