import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
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

// Global logout listener callback for 401/403 session expiration
let logoutListener: (() => void) | null = null;
export const registerLogoutHandler = (handler: () => void) => {
  logoutListener = handler;
};
export const triggerGlobalLogout = () => {
  if (logoutListener) logoutListener();
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const signOut = useCallback(async () => {
    try {
      await apiLogout();
      await AsyncStorage.multiRemove(['auth_token', 'user']);
    } catch (e) {
      console.error('Error signing out', e);
    } finally {
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    registerLogoutHandler(() => {
      signOut();
    });
  }, [signOut]);

  // Check for token on app start
  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('auth_token');
        const savedUser = await AsyncStorage.getItem('user');
        
        if (savedToken && savedUser && savedToken.trim().length > 10) {
          setToken(savedToken.trim());
          setUser(JSON.parse(savedUser));
        } else {
          // Strictly clear invalid token so user must log in first
          await AsyncStorage.multiRemove(['auth_token', 'user']);
          setToken(null);
          setUser(null);
        }
      } catch (e) {
        console.error('Error loading auth data', e);
        await AsyncStorage.multiRemove(['auth_token', 'user']);
        setToken(null);
        setUser(null);
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
    
    if (result.success && result.token) {
      setToken(result.token);
      setUser(result.user);
    } else {
      setToken(null);
      setUser(null);
    }
    return result;
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
