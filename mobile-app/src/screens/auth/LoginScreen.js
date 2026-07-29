// src/screens/auth/LoginScreen.js
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store';
import { sendLoginOtp } from '../../api/auth';
import { mapAuthError } from '../../api/client';
import { validatePhone, validatePassword } from '../../utils/validation';

const { height } = Dimensions.get('window');

const GRADIENT_COLORS = ['#000000', '#0a0a0a', '#1a1500'];
const GRADIENT_START  = { x: 0, y: 0 };
const GRADIENT_END    = { x: 1, y: 1 };

/* ─── Method Toggle ──────────────────────────────────────── */
const MethodToggle = ({ loginMethod, onSelect }) => (
  <View style={styles.methodToggle}>
    {['password', 'otp'].map((method) => (
      <TouchableOpacity
        key={method}
        style={[
          styles.methodButton,
          loginMethod === method && styles.methodButtonActive,
        ]}
        onPress={() => onSelect(method)}
        activeOpacity={0.8}
      >
        <Ionicons
          name={method === 'password' ? 'lock-closed' : 'keypad'}
          size={16}
          color={loginMethod === method ? '#000' : '#888'}
          style={styles.methodIcon}
        />
        <Text
          style={[
            styles.methodButtonText,
            loginMethod === method && styles.methodButtonTextActive,
          ]}
        >
          {method === 'password' ? 'Password' : 'OTP'}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

/* ─── Phone Input ────────────────────────────────────────── */
const PhoneInput = ({ value, onChange, error, focused, onFocus, onBlur }) => (
  <View style={styles.inputContainer}>
    <View
      style={[
        styles.inputWrapper,
        focused && styles.inputWrapperFocused,
        error  && styles.inputWrapperError,
      ]}
    >
      <View style={styles.inputIconContainer}>
        <Ionicons
          name="call-outline"
          size={20}
          color={error ? '#FF4444' : focused ? '#F5C518' : '#888'}
        />
      </View>
      <TextInput
        style={styles.textInput}
        placeholder="Phone Number"
        value={value}
        onChangeText={onChange}
        placeholderTextColor="#666"
        keyboardType="phone-pad"
        maxLength={10}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </View>
    {error ? (
      <View style={styles.errorRow}>
        <Ionicons name="alert-circle-outline" size={13} color="#FF4444" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    ) : null}
  </View>
);

/* ─── Password Input ─────────────────────────────────────── */
const PasswordInput = ({
  value,
  onChange,
  error,
  focused,
  onFocus,
  onBlur,
  showPassword,
  onToggleShow,
}) => (
  <View style={styles.inputContainer}>
    <View
      style={[
        styles.inputWrapper,
        focused && styles.inputWrapperFocused,
        error  && styles.inputWrapperError,
      ]}
    >
      <View style={styles.inputIconContainer}>
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color={error ? '#FF4444' : focused ? '#F5C518' : '#888'}
        />
      </View>
      <TextInput
        style={styles.textInput}
        placeholder="Password"
        value={value}
        onChangeText={onChange}
        placeholderTextColor="#666"
        secureTextEntry={!showPassword}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      <TouchableOpacity onPress={onToggleShow} style={styles.eyeButton}>
        <Ionicons
          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
          size={20}
          color="#888"
        />
      </TouchableOpacity>
    </View>
    {error ? (
      <View style={styles.errorRow}>
        <Ionicons name="alert-circle-outline" size={13} color="#FF4444" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    ) : null}
  </View>
);

/* ─── Error / Warning Banner ─────────────────────────────── */
const ErrorBanner = ({ message, variant = 'error', onDismiss }) => {
  if (!message) return null;
  const isWarning = variant === 'warning';
  return (
    <View
      style={[
        styles.apiBanner,
        isWarning ? styles.warningBanner : styles.errorBanner,
      ]}
    >
      <Ionicons
        name={isWarning ? 'information-circle-outline' : 'warning-outline'}
        size={16}
        color={isWarning ? '#B45309' : '#CC2222'}
        style={{ marginRight: 8, flexShrink: 0 }}
      />
      <Text
        style={[
          styles.apiBannerText,
          isWarning ? styles.warningBannerText : styles.errorBannerText,
        ]}
      >
        {message}
      </Text>
      {onDismiss ? (
        <TouchableOpacity onPress={onDismiss}>
          <Ionicons
            name="close-outline"
            size={18}
            color={isWarning ? '#B45309' : '#CC2222'}
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

/* ─── Main Screen ────────────────────────────────────────── */
const LoginScreen = ({ navigation }) => {
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [errors,   setErrors]   = useState({});
  const [apiError,        setApiError]        = useState('');
  const [credentialError, setCredentialError] = useState('');
  const [loginMethod,  setLoginMethod]  = useState('password');
  const [isLoading,    setIsLoading]    = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const login = useAuthStore((state) => state.login);

  /* ── Clear all errors ── */
  const clearAllErrors = useCallback(() => {
    setErrors({});
    setApiError('');
    setCredentialError('');
  }, []);

  /* ── Clear field error as user types ── */
  const handlePhoneChange = useCallback((v) => {
    setPhone(v);
    setErrors((e) => ({ ...e, phone: '' }));
    setApiError('');
    setCredentialError('');
  }, []);

  const handlePasswordChange = useCallback((v) => {
    setPassword(v);
    setErrors((e) => ({ ...e, password: '' }));
    setApiError('');
    setCredentialError('');
  }, []);

  /* ── Route mapped error to correct state setter ── */
  const applyMappedError = useCallback((mapped) => {
    switch (mapped.field) {
      case 'phone':
        setErrors((e) => ({ ...e, phone: mapped.message }));
        break;
      case 'password':
        setErrors((e) => ({ ...e, password: mapped.message }));
        break;
      case 'credentials':
        setCredentialError(mapped.message);
        break;
      case 'otp':
        setApiError(mapped.message);
        break;
      default:
        setApiError(mapped.message);
    }
  }, []);

  /* ── Password login ── */
  const handleLogin = useCallback(async () => {
    const phoneValidation    = validatePhone(phone);
    const passwordValidation = validatePassword(password);

    const newErrors = {};
    if (!phoneValidation.isValid)    newErrors.phone    = phoneValidation.message;
    if (!passwordValidation.isValid) newErrors.password = passwordValidation.message;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setApiError('');
      setCredentialError('');
      return;
    }

    clearAllErrors();
    setIsLoading(true);

    try {
      await login(phone, password);
    } catch (err) {
      const mapped = mapAuthError(err);
      applyMappedError(mapped);
    } finally {
      setIsLoading(false);
    }
  }, [phone, password, login, clearAllErrors, applyMappedError]);

  /* ── OTP login ── */
  const handleOtpLogin = useCallback(async () => {
    const phoneValidation = validatePhone(phone);

    if (!phoneValidation.isValid) {
      setErrors({ phone: phoneValidation.message });
      setApiError('');
      setCredentialError('');
      return;
    }

    clearAllErrors();
    setIsLoading(true);

    try {
      await sendLoginOtp(phone);
      navigation.navigate('OTPVerification', { phone, type: 'login' });
    } catch (err) {
      const mapped = mapAuthError(err);
      applyMappedError(mapped);
    } finally {
      setIsLoading(false);
    }
  }, [phone, navigation, clearAllErrors, applyMappedError]);

  const handleMethodSelect = useCallback((method) => {
    setLoginMethod(method);
    clearAllErrors();
  }, [clearAllErrors]);

  const handleFocus    = useCallback((field) => () => setFocusedInput(field), []);
  const handleBlur     = useCallback(() => setFocusedInput(null), []);
  const togglePassword = useCallback(() => setShowPassword((prev) => !prev), []);

  const isPasswordMode = loginMethod === 'password';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          bounces={false}
        >
          {/* ── Hero ── */}
          <LinearGradient
            colors={GRADIENT_COLORS}
            style={styles.topSection}
            start={GRADIENT_START}
            end={GRADIENT_END}
          >
            <View style={styles.shape1} />
            <View style={styles.shape2} />
            <View style={styles.header}>
              <Text style={styles.welcomeText}>Hello</Text>
              <Text style={styles.welcomeText}>Sign In !</Text>
            </View>
          </LinearGradient>

          {/* ── Form Card ── */}
          <View style={styles.bottomSection}>
            <View style={styles.card}>

              <MethodToggle
                loginMethod={loginMethod}
                onSelect={handleMethodSelect}
              />

              {/* Server / network error banner */}
              <ErrorBanner
                message={apiError}
                variant="error"
                onDismiss={() => setApiError('')}
              />

              {/* Credential mismatch banner (amber) */}
              <ErrorBanner
                message={credentialError}
                variant="warning"
                onDismiss={() => setCredentialError('')}
              />

              <PhoneInput
                value={phone}
                onChange={handlePhoneChange}
                error={errors.phone}
                focused={focusedInput === 'phone'}
                onFocus={handleFocus('phone')}
                onBlur={handleBlur}
              />

              {isPasswordMode && (
                <PasswordInput
                  value={password}
                  onChange={handlePasswordChange}
                  error={errors.password}
                  focused={focusedInput === 'password'}
                  onFocus={handleFocus('password')}
                  onBlur={handleBlur}
                  showPassword={showPassword}
                  onToggleShow={togglePassword}
                />
              )}

              {isPasswordMode && (
                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={() => navigation.navigate('ForgotPassword')}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                onPress={isPasswordMode ? handleLogin : handleOtpLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>
                      {isPasswordMode ? 'Sign In' : 'Generate OTP'}
                    </Text>
                    <View style={styles.buttonArrow}>
                      <Ionicons name="arrow-forward" size={18} color="#000" />
                    </View>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Or</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.signupLink}>
                <Text style={styles.signupText}>You don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.signupLinkText}>Signup here</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/* ─── Styles ─────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
  },
  topSection: {
    height: height * 0.45,
    justifyContent: 'center',
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  bottomSection: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  shape1: {
    position: 'absolute',
    top: 80,
    right: -145,
    width: 220,
    height: 220,
    borderRadius: 30,
    backgroundColor: 'rgba(245, 197, 24, 0.06)',
    transform: [{ rotate: '-55deg' }],
  },
  shape2: {
    position: 'absolute',
    top: 160,
    right: -145,
    width: 220,
    height: 220,
    borderRadius: 30,
    backgroundColor: 'rgba(245, 197, 24, 0.10)',
    transform: [{ rotate: '-53deg' }],
  },
  header: {
    marginTop: 40,
  },
  welcomeText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 44,
  },
  card: {
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 20,
    marginTop: -35,
    flexGrow: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: '#EEEEEE',
    borderRadius: 30,
    padding: 5,
    marginBottom: 24,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
  },
  methodButtonActive: {
    backgroundColor: '#F5C518',
    shadowColor: '#F5C518',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  methodIcon: {
    marginRight: 6,
  },
  methodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888',
  },
  methodButtonTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  apiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 14,
  },
  errorBanner: {
    backgroundColor: 'rgba(255,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.25)',
  },
  warningBanner: {
    backgroundColor: 'rgba(245,197,24,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(180,83,9,0.25)',
  },
  apiBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  errorBannerText: {
    color: '#CC2222',
  },
  warningBannerText: {
    color: '#92400E',
  },
  inputContainer: {
    marginBottom: 18,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    paddingHorizontal: 16,
    height: 56,
  },
  inputWrapperFocused: {
    borderColor: '#F5C518',
    backgroundColor: '#FFFEF5',
  },
  inputWrapperError: {
    borderColor: '#FF4444',
    backgroundColor: '#FFF5F5',
  },
  inputIconContainer: {
    width: 30,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 8,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#FF4444',
    flex: 1,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -10,
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#F5C518',
    fontWeight: '600',
  },
  loginButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5C518',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F5C518',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
    marginRight: 8,
  },
  buttonArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    fontSize: 12,
    color: '#999',
    marginHorizontal: 12,
    fontWeight: '400',
  },
  signupLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    paddingBottom: 10,
  },
  signupText: {
    fontSize: 14,
    color: '#888',
  },
  signupLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
});

export default LoginScreen;