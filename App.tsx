import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Provider as StoreProvider } from 'react-redux';
import { Provider as PaperProvider } from 'react-native-paper';
import { store } from './src/redux/store';
import AppNavigator from './src/navigation';
import { AuthProvider } from './src/services/AuthContext';
import { ToastProvider } from './src/components/Toast';

// App Setup
export default function App() {
  return (
    <StoreProvider store={store}>
      <PaperProvider>
        <SafeAreaProvider>
          <AuthProvider>
            <ToastProvider>
              <NavigationContainer>
                <StatusBar style="auto" />
                <AppNavigator />
              </NavigationContainer>
            </ToastProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </PaperProvider>
    </StoreProvider>
  );
}
