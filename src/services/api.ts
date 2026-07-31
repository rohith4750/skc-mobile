import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config';
import { triggerGlobalLogout } from './AuthContext';

const API_BASE_URL = BASE_URL;

console.log('📡 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to headers
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token && token.trim()) {
      config.headers.Authorization = `Bearer ${token.trim()}`;
      config.headers.authorization = `Bearer ${token.trim()}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle 401/403 token expiry strictly
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn('🔒 401/403 Unauthorized detected. Booting back to login screen strictly.');
      await AsyncStorage.multiRemove(['auth_token', 'user']);
      triggerGlobalLogout();
    }
    return Promise.reject(error);
  }
);

export default api;
