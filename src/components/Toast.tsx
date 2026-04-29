import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
  Platform,
  Image
} from 'react-native';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';
import { Colors, Shadows } from '../theme/colors';

const LOGO = require('../assets/icon.png');

type ToastType = 'success' | 'error' | 'info';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({} as ToastContextType);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setToast(null));
  }, [fadeAnim, slideAnim]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, type });
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 20,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      hideToast();
    }, 3500);
  }, [fadeAnim, slideAnim, hideToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <SafeAreaView style={styles.toastWrapper}>
          <Animated.View
            style={[
              styles.toastContainer,
              Shadows.medium,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                backgroundColor: toast.type === 'success' ? '#10B981' : toast.type === 'error' ? '#EF4444' : '#3B82F6',
              },
            ]}
          >
            <View style={styles.iconArea}>
              <Image source={LOGO} style={styles.logo} resizeMode="contain" />
            </View>
            <View style={styles.textArea}>
              <Text style={styles.toastMessage}>{toast.message}</Text>
            </View>
            <View style={styles.typeIndicator}>
               {toast.type === 'success' && <CheckCircle2 size={16} color="#FFF" />}
               {toast.type === 'error' && <AlertCircle size={16} color="#FFF" />}
            </View>
          </Animated.View>
        </SafeAreaView>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: Dimensions.get('window').width - 40,
    padding: 16,
    borderRadius: 20,
    marginTop: Platform.OS === 'ios' ? 0 : 40,
  },
  iconArea: {
    marginRight: 12,
    backgroundColor: '#FFF',
    padding: 6,
    borderRadius: 12,
  },
  logo: {
    width: 28,
    height: 28,
  },
  textArea: {
    flex: 1,
  },
  toastMessage: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  typeIndicator: {
    marginLeft: 8,
    opacity: 0.8,
  }
});
