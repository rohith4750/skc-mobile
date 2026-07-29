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
} from 'react-native';
import { Lock, CheckCircle, ArrowLeft, KeyRound, Eye, EyeOff } from 'lucide-react-native';
import { Colors, Shadows, Radii } from '../theme/colors';
import { useToast } from '../components/Toast';

const ResetPasswordScreen = ({ route, navigation }: any) => {
  const { showToast } = useToast();
  const { email } = route.params || {};
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    if (!code || code.length !== 6) {
      showToast('Please enter the 6-digit code', 'error');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://www.skccaterers.in/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          code, 
          newPassword 
        }),
      });
      
      const result = await response.json();
      setLoading(false);
      
      if (response.ok) {
        showToast('Password reset successful!', 'success');
        setSuccess(true);
        setTimeout(() => {
          navigation.navigate('Login');
        }, 2500);
      } else {
        showToast(result.message || 'Invalid code or expired', 'error');
      }
    } catch (err) {
      setLoading(false);
      showToast('Reset failed. Please try again.', 'error');
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIconBadge}>
            <CheckCircle size={56} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Password Updated!</Text>
          <Text style={styles.successSub}>Your password was updated successfully. Redirecting you to login screen...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <KeyRound size={28} color={Colors.primaryDark} />
          </View>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter 6-digit code sent to {email || 'your Gmail'}</Text>
        </View>

        <View style={styles.card}>
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>6-Digit Code</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { letterSpacing: 4, fontWeight: '700' }]}
                placeholder="000000"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputContainer}>
              <Lock size={18} color={Colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Min 6 characters"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                placeholderTextColor={Colors.textTertiary}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeBtn}
                activeOpacity={0.7}
              >
                {showNewPassword ? (
                  <EyeOff size={18} color={Colors.primaryDark} />
                ) : (
                  <Eye size={18} color={Colors.textTertiary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputContainer}>
              <Lock size={18} color={Colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Repeat password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                placeholderTextColor={Colors.textTertiary}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeBtn}
                activeOpacity={0.7}
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} color={Colors.primaryDark} />
                ) : (
                  <Eye size={18} color={Colors.textTertiary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.resetButton, loading && styles.buttonDisabled]}
            onPress={handleReset}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={styles.resetButtonText}>Save New Password</Text>
            )}
          </TouchableOpacity>
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
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 52,
    left: 24,
    width: 38,
    height: 38,
    borderRadius: Radii.md,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.medium,
  },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: Radii.md,
    padding: 10,
    marginBottom: 14,
  },
  errorBannerText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
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
  resetButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    ...Shadows.small,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resetButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  successIconBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  successSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ResetPasswordScreen;
