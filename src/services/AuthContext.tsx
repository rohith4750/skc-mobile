import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, logout as apiLogout } from './auth';

interface AuthContextType {
  user: any;
  token: string | null;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<any>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for token on app start
  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('auth_token');
        const savedUser = await AsyncStorage.getItem('user');
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (e) {
        console.error('Error loading auth data', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadStorageData();
  }, []);

  const signIn = async (username: string, password: string) => {
    console.log('Attempting sign in for:', username);
    const result = await apiLogin(username, password);
    console.log('Login result:', result.success ? 'Success' : 'Failed');
    
    if (result.success) {
      setToken(result.token);
      setUser(result.user);
    }
    return result;
  };

  const signOut = async () => {
    await apiLogout();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
