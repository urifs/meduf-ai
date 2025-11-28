import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to inject the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401s (logout)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect if it's a login attempt (let the component handle the error)
    if (error.response && error.response.status === 401 && !error.config.url.includes('/auth/login')) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
