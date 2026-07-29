// src/screens/auth/RegisterScreen.js
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
import { Ionicons } from '@expo/vector-icons';
import { sendRegistrationOtp } from '../../api/auth';
import { mapAuthError } from '../../api/client';
import { useAuthStore } from '../../store';
import { validatePhone, validateEmail, validateName } from '../../utils/validation';

const { height } = Dimensions.get('window');

/* ─── Reusable Input ─────────────────────────────────────── */
const FormInput = ({
  icon,
  placeholder,
  value,
  onChange,
  error,
  focused,
  onFocus,
  onBlur,
  keyboardType = 'default',
  autoCapitalize = 'none',
  maxLength,
  editable = true,
}) => (
  <View style={styles.inputContainer}>
    <View
      style={[
        styles.inputWrapper,
        focused   && styles.inputWrapperFocused,
        error     && styles.inputWrapperError,
        !editable && styles.inputWrapperDisabled,
      ]}
    >
      <View style={styles.inputIconContainer}>
        <Ionicons
          name={icon}
          size={20}
          color={error ? '#FF4444' : focused ? '#F5C518' : '#666'}
        />
      </View>
      <TextInput
        style={styles.textInput}
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        placeholderTextColor="#555"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        onFocus={onFocus}
        onBlur={onBlur}
        editable={editable}
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

/* ─── Error Banner ───────────────────────────────────────── */
const ErrorBanner = ({ message, onDismiss }) => {
  if (!message) return null;
  return (
    <View style={styles.apiBanner}>
      <Ionicons
        name="warning-outline"
        size={16}
        color="#FF4444"
        style={{ marginRight: 8, flexShrink: 0 }}
      />
      <Text style={styles.apiBannerText}>{message}</Text>
      {onDismiss ? (
        <TouchableOpacity
          onPress={onDismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close-outline" size={18} color="#FF6B6B" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

/* ─── Divider ────────────────────────────────────────────── */
const Divider = () => (
  <View style={styles.divider}>
    <View style={styles.dividerLine} />
    <Text style={styles.dividerText}>Or</Text>
    <View style={styles.dividerLine} />
  </View>
);

/* ─── Main Screen ────────────────────────────────────────── */
const RegisterScreen = ({ navigation }) => {
  const [name,  setName]  = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors,    setErrors]    = useState({});
  const [apiError,  setApiError]  = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const setRegistrationPhone = useAuthStore((s) => s.setRegistrationPhone);

  /* ── Clear field error as user types ── */
  const handleNameChange = useCallback((v) => {
    setName(v);
    if (errors.name) setErrors((e) => ({ ...e, name: '' }));
    if (apiError)    setApiError('');
  }, [errors.name, apiError]);

  const handlePhoneChange = useCallback((v) => {
    setPhone(v);
    if (errors.phone) setErrors((e) => ({ ...e, phone: '' }));
    if (apiError)     setApiError('');
  }, [errors.phone, apiError]);

  const handleEmailChange = useCallback((v) => {
    setEmail(v);
    if (errors.email) setErrors((e) => ({ ...e, email: '' }));
    if (apiError)     setApiError('');
  }, [errors.email, apiError]);

  /* ── Route mapped error to correct state setter ── */
  const applyMappedError = useCallback((mapped) => {
    switch (mapped.field) {
      case 'name':
        setErrors((e) => ({ ...e, name: mapped.message }));
        break;
      case 'phone':
        setErrors((e) => ({ ...e, phone: mapped.message }));
        break;
      case 'email':
        setErrors((e) => ({ ...e, email: mapped.message }));
        break;
      default:
        setApiError(mapped.message);
    }
  }, []);

  const handleGenerateOtp = useCallback(async () => {
    /* ── Client-side validation ── */
    const nameV  = validateName(name);
    const phoneV = validatePhone(phone);
    const emailV = email ? validateEmail(email) : { isValid: true };

    const newErrors = {};
    if (!nameV.isValid)  newErrors.name  = nameV.message;
    if (!phoneV.isValid) newErrors.phone = phoneV.message;
    if (!emailV.isValid) newErrors.email = emailV.message;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setApiError('');
    setIsLoading(true);

    try {
      await sendRegistrationOtp(phone);
      setRegistrationPhone(phone);
      navigation.navigate('OTPVerification', {
        phone,
        name,
        email,
        type: 'register',
      });
    } catch (err) {
      const mapped = mapAuthError(err);
      applyMappedError(mapped);
    } finally {
      setIsLoading(false);
    }
  }, [name, phone, email, navigation, setRegistrationPhone, applyMappedError]);

  const handleFocus = useCallback((field) => () => setFocusedInput(field), []);
  const handleBlur  = useCallback(() => setFocusedInput(null), []);

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
          <View style={styles.topSection}>
            <View style={styles.shape1} />
            <View style={styles.shape2} />
            <View style={styles.header}>
              <Text style={styles.welcomeText}>Create Your</Text>
              <Text style={styles.welcomeText}>Account</Text>
            </View>
          </View>

          {/* ── Form Card ── */}
          <View style={styles.bottomSection}>
            <View style={styles.card}>

              <ErrorBanner
                message={apiError}
                onDismiss={() => setApiError('')}
              />

              <FormInput
                icon="person-outline"
                placeholder="Full Name"
                value={name}
                onChange={handleNameChange}
                error={errors.name}
                focused={focusedInput === 'name'}
                onFocus={handleFocus('name')}
                onBlur={handleBlur}
                autoCapitalize="words"
              />

              <FormInput
                icon="call-outline"
                placeholder="Phone Number"
                value={phone}
                onChange={handlePhoneChange}
                error={errors.phone}
                focused={focusedInput === 'phone'}
                onFocus={handleFocus('phone')}
                onBlur={handleBlur}
                keyboardType="phone-pad"
                maxLength={10}
              />

              <FormInput
                icon="mail-outline"
                placeholder="Email (Optional)"
                value={email}
                onChange={handleEmailChange}
                error={errors.email}
                focused={focusedInput === 'email'}
                onFocus={handleFocus('email')}
                onBlur={handleBlur}
                keyboardType="email-address"
              />

              <TouchableOpacity
                style={[styles.otpButton, isLoading && styles.buttonDisabled]}
                onPress={handleGenerateOtp}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <>
                    <Text style={styles.otpButtonText}>Sign Up</Text>
                    <View style={styles.buttonArrow}>
                      <Ionicons name="arrow-forward" size={18} color="#000" />
                    </View>
                  </>
                )}
              </TouchableOpacity>

              <Divider />

              <View style={styles.loginLink}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLinkText}>Login here</Text>
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
    backgroundColor: '#F5C518',
  },
  scrollContent: {
    flexGrow: 1,
  },
  topSection: {
    height: height * 0.38,
    backgroundColor: '#F5C518',
    justifyContent: 'center',
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  bottomSection: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  shape1: {
    position: 'absolute',
    top: 80,
    right: -145,
    width: 220,
    height: 220,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.06)',
    transform: [{ rotate: '-55deg' }],
  },
  shape2: {
    position: 'absolute',
    top: 160,
    right: -145,
    width: 220,
    height: 220,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.10)',
    transform: [{ rotate: '-53deg' }],
  },
  header: {
    marginTop: 40,
  },
  welcomeText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 44,
  },
  card: {
    backgroundColor: '#0A0A0A',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 24,
    paddingTop: 35,
    paddingBottom: 24,
    marginTop: -35,
    flexGrow: 1,
  },
  apiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 20,
  },
  apiBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#FF6B6B',
    fontWeight: '500',
    lineHeight: 18,
  },
  inputContainer: {
    marginBottom: 18,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
    paddingHorizontal: 16,
    height: 56,
  },
  inputWrapperFocused: {
    borderColor: '#F5C518',
    backgroundColor: '#1F1F1F',
  },
  inputWrapperError: {
    borderColor: '#FF4444',
    backgroundColor: '#1A1515',
  },
  inputWrapperDisabled: {
    opacity: 0.5,
  },
  inputIconContainer: {
    width: 30,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    paddingVertical: 0,
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
  otpButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5C518',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#F5C518',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  otpButtonText: {
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
    backgroundColor: '#2A2A2A',
  },
  dividerText: {
    fontSize: 12,
    color: '#555',
    marginHorizontal: 12,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    paddingBottom: 10,
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F5C518',
  },
});

export default RegisterScreen;