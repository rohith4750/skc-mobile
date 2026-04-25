import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const login = async (username: string, password: string) => {
  try {
    const response = await api.post('/auth/login', { username, password });
    const { accessToken, user } = response.data;
    
    if (!accessToken) {
      throw new Error('No access token received from server');
    }
    
    await AsyncStorage.setItem('auth_token', accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    
    return { success: true, user, token: accessToken };
  } catch (error: any) {
    console.error('Login Error details:', error?.response?.data || error.message);
    return { 
      success: false, 
      message: error?.response?.data?.message || 'Invalid credentials or connection error' 
    };
  }
};

export const logout = async () => {
  await AsyncStorage.removeItem('auth_token');
  await AsyncStorage.removeItem('user');
};

export const isAuthenticated = async () => {
  const token = await AsyncStorage.getItem('auth_token');
  return !!token;
};

export const getUser = async () => {
  const userJson = await AsyncStorage.getItem('user');
  return userJson ? JSON.parse(userJson) : null;
};
