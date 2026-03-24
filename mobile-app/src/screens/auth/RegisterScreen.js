// src/screens/auth/RegisterScreen.js
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
import { sendRegistrationOtp } from '../../api/auth';
import { useAuthStore } from '../../store';
import { validatePhone, validateEmail, validateName } from '../../utils/validation';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const setRegistrationPhone = useAuthStore((state) => state.setRegistrationPhone);

  const handleGenerateOtp = async () => {
    // Validate inputs
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
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Create</Text>
          <Text style={styles.welcomeText}>Account</Text>
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
            {/* Name Input */}
            <Input
              variant="underline"
              icon="person-outline"
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              error={errors.name}
            />

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

            {/* Email Input */}
            <Input
              variant="underline"
              icon="mail-outline"
              placeholder="Email (Optional)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            {/* Generate OTP Button */}
            <Button
              title="Generate OTP"
              onPress={handleGenerateOtp}
              loading={isLoading}
              style={styles.otpButton}
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Sign Up */}
            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-google" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-apple" size={24} color={COLORS.textPrimary} />
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
  otpButton: {
    marginTop: SPACING.lg,
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
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  loginText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  loginLinkText: {
    ...FONTS.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default RegisterScreen;