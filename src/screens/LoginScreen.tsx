import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Image,
} from 'react-native';
import { User, Lock, ArrowRight } from 'lucide-react-native';
import { Colors, Shadows } from '../theme/colors';
import { useAuth } from '../services/AuthContext';

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const result = await signIn(username, password);
      console.log('SignIn process finished. Result:', result.success);
      
      if (!result.success) {
        setLoading(false);
        setError(result.message || 'Login failed');
      }
      // If success, AuthContext state change handles navigation
    } catch (err: any) {
      console.error('SignIn Exception:', err);
      setLoading(false);
      setError('An unexpected error occurred during sign in');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
             <Image 
                source={require('../assets/icon.png')}
                style={styles.logo}
                resizeMode="contain"
             />
          </View>
          <Text style={styles.title}>SKC Caterers</Text>
          <Text style={styles.subtitle}>Management Portal</Text>
        </View>

        <View style={styles.form}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.inputContainer}>
            <View style={styles.iconContainer}>
              <User size={20} color={Colors.textSecondary} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.iconContainer}>
              <Lock size={20} color={Colors.textSecondary} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.loginButtonText}>Sign In</Text>
                <ArrowRight size={20} color={Colors.white} />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 Sri Vatsasa Koundinya Caterers</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 24,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...Shadows.small,
  },
  logo: {
    width: 90,
    height: 90,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconContainer: {
    padding: 12,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 16,
    fontSize: 16,
    color: Colors.text,
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
    ...Shadows.medium,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    color: Colors.error,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});

export default LoginScreen;
