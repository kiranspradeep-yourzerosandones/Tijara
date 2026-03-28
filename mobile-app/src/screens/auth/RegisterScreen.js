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
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme';
import { sendRegistrationOtp } from '../../api/auth';
import { useAuthStore } from '../../store';
import { validatePhone, validateEmail, validateName } from '../../utils/validation';
import GoogleLogo from '../../components/common/GoogleLogo';

const { height } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const setRegistrationPhone = useAuthStore((state) => state.setRegistrationPhone);

  const handleGenerateOtp = async () => {
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
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Yellow Top Section */}
      <View style={styles.topSection}>
        {/* Shape 1 - Back shape */}
        <View style={styles.shape1} />
        {/* Shape 2 - Front shape */}
        <View style={styles.shape2} />

        <View style={styles.header}>
          <Text style={styles.welcomeText}>Create Your</Text>
          <Text style={styles.welcomeText}>Account</Text>
        </View>
      </View>

      {/* Black Bottom Card */}
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
            {/* Name Input */}
            <View style={styles.inputContainer}>
              <View
                style={[
                  styles.inputWrapper,
                  focusedInput === 'name' && styles.inputWrapperFocused,
                  errors.name && styles.inputWrapperError,
                ]}
              >
                <View style={styles.inputIconContainer}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={focusedInput === 'name' ? '#F5C518' : '#666'}
                  />
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="Full Name"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#666"
                  autoCapitalize="words"
                  onFocus={() => setFocusedInput('name')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
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
                    color={focusedInput === 'phone' ? '#F5C518' : '#666'}
                  />
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="Phone Number"
                  value={phone}
                  onChangeText={setPhone}
                  placeholderTextColor="#666"
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

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <View
                style={[
                  styles.inputWrapper,
                  focusedInput === 'email' && styles.inputWrapperFocused,
                  errors.email && styles.inputWrapperError,
                ]}
              >
                <View style={styles.inputIconContainer}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={focusedInput === 'email' ? '#F5C518' : '#666'}
                  />
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="Email (Optional)"
                  value={email}
                  onChangeText={setEmail}
                  placeholderTextColor="#666"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Sign Up Button */}
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

            {/* Login Link */}
            <View style={styles.loginLink}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLinkText}>Login here</Text>
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
    backgroundColor: '#F5C518',
  },
  topSection: {
    height: height * 0.45,
    backgroundColor: '#F5C518',
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
  formContainer: {
    flex: 1,
    marginTop: -35,
  },
  scrollContent: {
    flexGrow: 1,
  },
  card: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 24,
    paddingTop: 35,
    paddingBottom: 20,
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