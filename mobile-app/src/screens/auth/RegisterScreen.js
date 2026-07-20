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
  Alert,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sendRegistrationOtp } from '../../api/auth';
import { useAuthStore } from '../../store';
import { validatePhone, validateEmail, validateName } from '../../utils/validation';
import GoogleLogo from '../../components/common/GoogleLogo';

const { height } = Dimensions.get('window');

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
}) => (
  <View style={styles.inputContainer}>
    <View
      style={[
        styles.inputWrapper,
        focused && styles.inputWrapperFocused,
        error && styles.inputWrapperError,
      ]}
    >
      <View style={styles.inputIconContainer}>
        <Ionicons
          name={icon}
          size={20}
          color={focused ? '#F5C518' : '#666'}
        />
      </View>
      <TextInput
        style={styles.textInput}
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        placeholderTextColor="#666"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </View>
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

const SocialButtons = () => (
  <>
    <View style={styles.divider}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>Or sign with</Text>
      <View style={styles.dividerLine} />
    </View>

    <View style={styles.socialButtons}>
      <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
        <GoogleLogo size={24} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
        <Ionicons name="logo-apple" size={26} color="#000" />
      </TouchableOpacity>
    </View>
  </>
);

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const setRegistrationPhone = useAuthStore((state) => state.setRegistrationPhone);

  const handleGenerateOtp = useCallback(async () => {
    const nameValidation = validateName(name);
    const phoneValidation = validatePhone(phone);
    const emailValidation = email ? validateEmail(email) : { isValid: true };

    const newErrors = {};
    if (!nameValidation.isValid) newErrors.name = nameValidation.message;
    if (!phoneValidation.isValid) newErrors.phone = phoneValidation.message;
    if (!emailValidation.isValid) newErrors.email = emailValidation.message;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
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
      Alert.alert('Error', err.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  }, [name, phone, email, navigation, setRegistrationPhone]);

  const handleFocus = useCallback((field) => () => setFocusedInput(field), []);
  const handleBlur = useCallback(() => setFocusedInput(null), []);

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
          {/* Top Section */}
          <View style={styles.topSection}>
            <View style={styles.shape1} />
            <View style={styles.shape2} />

            <View style={styles.header}>
              <Text style={styles.welcomeText}>Create Your</Text>
              <Text style={styles.welcomeText}>Account</Text>
            </View>
          </View>

          {/* Bottom Fill */}
          <View style={styles.bottomSection}>
            <View style={styles.card}>
              <FormInput
                icon="person-outline"
                placeholder="Full Name"
                value={name}
                onChange={setName}
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
                onChange={setPhone}
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
                onChange={setEmail}
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

              <SocialButtons />

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5C518',
  },
  scrollContent: {
    flexGrow: 1,
  },
  topSection: {
    height: height * 0.45,
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
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    transform: [{ rotate: '-55deg' }],
  },
  shape2: {
    position: 'absolute',
    top: 160,
    right: -145,
    width: 220,
    height: 220,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.10)',
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
    paddingBottom: 20,
    marginTop: -35,
    flexGrow: 1,
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
  inputIconContainer: {
    width: 30,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    paddingVertical: 0,
  },
  errorText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 6,
    marginLeft: 4,
  },
  otpButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5C518',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#F5C518',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
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
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 12,
    fontWeight: '400',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialButton: {
    width: 80,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
    paddingBottom: 10,
  },
  loginText: {
    fontSize: 14,
    color: '#777',
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default RegisterScreen;