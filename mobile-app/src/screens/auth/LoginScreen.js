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
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme';
import { useAuthStore } from '../../store';
import { sendLoginOtp } from '../../api/auth';
import { validatePhone, validatePassword } from '../../utils/validation';
import GoogleLogo from '../../components/common/GoogleLogo';

const { height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loginMethod, setLoginMethod] = useState('password');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
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
      {/* Dark Gradient Top Section */}
      <LinearGradient
        colors={['#000000', '#0a0a0a', '#1a1500']}
        style={styles.topSection}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Shape 1 - Back shape */}
        <View style={styles.shape1} />
        {/* Shape 2 - Front shape */}
        <View style={styles.shape2} />

        <View style={styles.header}>
          <Text style={styles.welcomeText}>Hello</Text>
          <Text style={styles.welcomeText}>Sign In !</Text>
        </View>
      </LinearGradient>

      {/* White Bottom Card */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.formContainer}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
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
                <Ionicons
                  name="lock-closed"
                  size={16}
                  color={loginMethod === 'password' ? '#000' : '#888'}
                  style={styles.methodIcon}
                />
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
                <Ionicons
                  name="keypad"
                  size={16}
                  color={loginMethod === 'otp' ? '#000' : '#888'}
                  style={styles.methodIcon}
                />
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
            <View style={styles.inputContainer}>
              <View
                style={[
                  styles.inputWrapper,
                  focusedInput === 'phone' && styles.inputWrapperFocused,
                  errors.phone && styles.inputWrapperError,
                ]}
              >
                <View style={styles.inputIconContainer}>
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color={focusedInput === 'phone' ? '#F5C518' : '#888'}
                  />
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="Phone Number"
                  value={phone}
                  onChangeText={setPhone}
                  placeholderTextColor="#888"
                  keyboardType="phone-pad"
                  maxLength={10}
                  onFocus={() => setFocusedInput('phone')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}
            </View>

            {/* Password Input */}
            {loginMethod === 'password' && (
              <View style={styles.inputContainer}>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedInput === 'password' && styles.inputWrapperFocused,
                    errors.password && styles.inputWrapperError,
                  ]}
                >
                  <View style={styles.inputIconContainer}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={focusedInput === 'password' ? '#F5C518' : '#888'}
                    />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholderTextColor="#888"
                    secureTextEntry={!showPassword}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#888"
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>
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
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.buttonDisabled]}
              onPress={loginMethod === 'password' ? handleLogin : handleOtpLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>
                    {loginMethod === 'password' ? 'Sign In' : 'Generate OTP'}
                  </Text>
                  <View style={styles.buttonArrow}>
                    <Ionicons name="arrow-forward" size={18} color="#000" />
                  </View>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or sign with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Buttons */}
            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                <GoogleLogo size={24} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                <Ionicons name="logo-apple" size={26} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Sign Up Link */}
            <View style={styles.signupLink}>
              <Text style={styles.signupText}>You don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.signupLinkText}>Signup here</Text>
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
    backgroundColor: '#000',
  },
  topSection: {
    height: height * 0.45,
    justifyContent: 'center',
    paddingHorizontal: 24,
    overflow: 'hidden',
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
  formContainer: {
    flex: 1,
    marginTop: -35,
  },
  scrollContent: {
    flexGrow: 1,
  },
  card: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 20,
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
    marginBottom: 28,
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
  errorText: {
    fontSize: 12,
    color: '#FF4444',
    marginTop: 6,
    marginLeft: 4,
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
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  signupLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
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