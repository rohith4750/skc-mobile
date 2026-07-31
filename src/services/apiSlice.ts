import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config';
import { triggerGlobalLogout } from './AuthContext';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${BASE_URL}/`,
  prepareHeaders: async (headers) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token && token.trim()) {
      headers.set('Authorization', `Bearer ${token.trim()}`);
      headers.set('authorization', `Bearer ${token.trim()}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  
  if (result.error && (result.error.status === 401 || result.error.status === 403)) {
    // Session is invalid/expired - purge token and boot back to Login Screen strictly
    await AsyncStorage.multiRemove(['auth_token', 'user']);
    triggerGlobalLogout();
  }
  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Order', 'Customer', 'Product', 'Stock', 'Material', 'Supervisor', 'Expense', 'Workforce'],
  endpoints: () => ({}),
});
