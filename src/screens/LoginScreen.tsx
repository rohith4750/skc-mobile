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
import { User, Lock, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react-native';
import { Colors, Shadows, Radii } from '../theme/colors';
import { useAuth } from '../services/AuthContext';
import { useToast } from '../components/Toast';

const LoginScreen = ({ navigation }: any) => {
  const { showToast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      showToast('Please enter both username and password', 'error');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await signIn(username, password);
      if (res && res.success) {
        showToast('Welcome back!', 'success');
      } else {
        const msg = res?.message || 'Invalid username or password';
        showToast(msg, 'error');
        setError(msg);
      }
    } catch (err: any) {
      showToast('Invalid credentials or network error', 'error');
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      showToast('Please enter your email address', 'error');
      return;
    }

    setForgotLoading(true);
    try {
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.contentContainer}>
          {/* Header & Logo */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
               <Image 
                  source={require('../assets/icon.png')}
                  style={styles.logo}
                  resizeMode="contain"
               />
            </View>
            <Text style={styles.title}>SKC Caterers</Text>
            <View style={styles.badgeContainer}>
              <ShieldCheck size={14} color={Colors.primaryDark} />
              <Text style={styles.badgeText}>MANAGEMENT PORTAL</Text>
            </View>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>
            <Text style={styles.cardSub}>Access your manager dashboard</Text>

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputContainer}>
                <User size={18} color={Colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity 
                  onPress={() => setShowForgotModal(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotLinkText}>Forgot?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputContainer}>
                <Lock size={18} color={Colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor={Colors.textTertiary}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  activeOpacity={0.7}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={Colors.primaryDark} />
                  ) : (
                    <Eye size={18} color={Colors.textTertiary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Sign In</Text>
                  <ArrowRight size={18} color={Colors.white} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Modal */}
          {showForgotModal && (
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Reset Password</Text>
                <Text style={styles.modalSub}>Enter your registered Gmail to receive a 6-digit verification code</Text>
                
                <TextInput
                  style={styles.modalInput}
                  placeholder="name@example.com"
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={Colors.textTertiary}
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setShowForgotModal(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalSubmitBtn, forgotLoading && styles.loginButtonDisabled]}
                    onPress={handleForgotPassword}
                    disabled={forgotLoading}
                    activeOpacity={0.8}
                  >
                    {forgotLoading ? (
                      <ActivityIndicator color={Colors.white} size="small" />
                    ) : (
                      <Text style={styles.modalSubmitText}>Send Code</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: Radii.xl,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.medium,
  },
  logo: {
    width: 48,
    height: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    marginTop: 8,
    gap: 5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.medium,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  cardSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 20,
  },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: Radii.md,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.error + '20',
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  forgotLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
  },
  eyeBtn: {
    padding: 6,
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: Radii.md,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
    ...Shadows.small,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: 20,
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.large,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  modalSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radii.md,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCancelText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radii.md,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  modalSubmitText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});

export default LoginScreen;
