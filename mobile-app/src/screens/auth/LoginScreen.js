// src/screens/auth/LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../../theme';
import { Button, Input } from '../../components/common';
import { useAuthStore } from '../../store';
import { sendLoginOtp } from '../../api/auth';
import { validatePhone, validatePassword } from '../../utils/validation';

const LoginScreen = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loginMethod, setLoginMethod] = useState('password'); // password | otp
  const [isLoading, setIsLoading] = useState(false);
  
  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    // Validate inputs
    const phoneValidation = validatePhone(phone);
    const passwordValidation = validatePassword(password);

    if (!phoneValidation.isValid || !passwordValidation.isValid) {
      setErrors({
        phone: phoneValidation.message,
        password: passwordValidation.message,
      });
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      await login(phone, password);
      // Navigation handled by RootNavigator
    } catch (err) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpLogin = async () => {
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
      setErrors({ phone: phoneValidation.message });
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      await sendLoginOtp(phone);
      navigation.navigate('OTPVerification', {
        phone,
        type: 'login',
      });
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Hello</Text>
          <Text style={styles.welcomeText}>Welcome Back</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.formContainer}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.card}>
            {/* Login Method Toggle */}
            <View style={styles.methodToggle}>
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  loginMethod === 'password' && styles.methodButtonActive,
                ]}
                onPress={() => setLoginMethod('password')}
              >
                <Text
                  style={[
                    styles.methodButtonText,
                    loginMethod === 'password' && styles.methodButtonTextActive,
                  ]}
                >
                  Password
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  loginMethod === 'otp' && styles.methodButtonActive,
                ]}
                onPress={() => setLoginMethod('otp')}
              >
                <Text
                  style={[
                    styles.methodButtonText,
                    loginMethod === 'otp' && styles.methodButtonTextActive,
                  ]}
                >
                  OTP
                </Text>
              </TouchableOpacity>
            </View>

            {/* Phone Input */}
            <Input
              variant="underline"
              icon="call-outline"
              placeholder="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
              error={errors.phone}
            />

            {/* Password Input (only for password method) */}
            {loginMethod === 'password' && (
              <Input
                variant="underline"
                icon="lock-closed-outline"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                error={errors.password}
              />
            )}

            {/* Forgot Password */}
            {loginMethod === 'password' && (
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* Login Button */}
            <Button
              title={loginMethod === 'password' ? 'Login' : 'Get OTP'}
              onPress={loginMethod === 'password' ? handleLogin : handleOtpLogin}
              loading={isLoading}
              style={styles.loginButton}
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login */}
            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-google" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-apple" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Sign Up Link */}
            <View style={styles.signupLink}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.signupLinkText}>Sign up here</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gradient: {
    height: '35%',
    justifyContent: 'center',
    paddingHorizontal: SPACING.screenPadding,
  },
  header: {
    marginTop: SPACING.xxl,
  },
  welcomeText: {
    ...FONTS.heading,
    fontSize: 32,
    color: COLORS.white,
  },
  formContainer: {
    flex: 1,
    marginTop: -30,
  },
  scrollContent: {
    flexGrow: 1,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SPACING.cardRadiusLarge,
    borderTopRightRadius: SPACING.cardRadiusLarge,
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xl,
  },
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: SPACING.buttonRadius,
    padding: 4,
    marginBottom: SPACING.xl,
  },
  methodButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: SPACING.buttonRadius - 4,
  },
  methodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  methodButtonText: {
    ...FONTS.label,
    color: COLORS.textSecondary,
  },
  methodButtonTextActive: {
    color: COLORS.black,
    fontWeight: '600',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
  },
  forgotPasswordText: {
    ...FONTS.bodySmall,
    color: COLORS.primary,
  },
  loginButton: {
    marginTop: SPACING.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    ...FONTS.caption,
    color: COLORS.gray,
    marginHorizontal: SPACING.md,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  signupLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  signupText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  signupLinkText: {
    ...FONTS.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default LoginScreen;