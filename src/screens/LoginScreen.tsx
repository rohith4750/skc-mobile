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
import { useToast } from '../components/Toast';

const LoginScreen = ({ navigation }: any) => {
  const { showToast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: Code & New Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');

  const handleLogin = async () => {
    if (!username || !password) {
      showToast('Please enter both username and password', 'error');
      return;
    }

    setLoading(true);
    try {
      await signIn(username, password);
      showToast('Welcome back!', 'success');
    } catch (err) {
      showToast('Invalid credentials or network error', 'error');
    } finally {
      setLoading(false);
      setError('An unexpected error occurred during sign in');
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      setError('Please enter your email address');
      return;
    }

    setForgotLoading(true);
    setError('');
    
    try {
      // Step 1: Request the 6-digit code
      const response = await fetch('https://www.skccaterers.in/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      
      const result = await response.json();
      setForgotLoading(false);
      
      if (response.ok) {
        setShowForgotModal(false);
        showToast('Reset code sent to Gmail', 'success');
        navigation.navigate('ResetPassword', { email: forgotEmail });
      } else {
        showToast(result.message || 'Failed to send reset link', 'error');
      }
    } catch (err) {
      setForgotLoading(false);
      showToast('Connection error. Please try again.', 'error');
    }
  };

  const handleResetPassword = async () => {
    // This is now handled in ResetPasswordScreen.tsx
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
            onPress={() => setShowForgotModal(true)}
            style={styles.forgotLink}
          >
            <Text style={styles.forgotLinkText}>Forgot Password?</Text>
          </TouchableOpacity>

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

        {/* Forgot Password Modal (Step 1 only) */}
        {showForgotModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <Text style={styles.modalSub}>Enter your Gmail to receive a 6-digit code</Text>
              
              <TextInput
                style={styles.modalInput}
                placeholder="example@gmail.com"
                value={forgotEmail}
                onChangeText={setForgotEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setShowForgotModal(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.sendButton}
                  onPress={handleForgotPassword}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.sendText}>Get Code</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

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
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  forgotLinkText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    ...Shadows.medium,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 20,
  },
  cancelText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  sendText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  successText: {
    color: Colors.success,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 20,
  }
});

export default LoginScreen;
