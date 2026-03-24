// src/screens/auth/OTPVerificationScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../../theme';
import { Button } from '../../components/common';
import { 
  verifyRegistrationOtp, 
  verifyLoginOtp, 
  sendRegistrationOtp,
  sendLoginOtp,
  sendForgotPasswordOtp 
} from '../../api/auth';
import { useAuthStore } from '../../store';
import { OTP_LENGTH, OTP_RESEND_DELAY } from '../../utils/constants';

const OTPVerificationScreen = ({ navigation, route }) => {
  const { phone, name, email, type = 'register' } = route.params;

  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(OTP_RESEND_DELAY);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);
  
  const loginWithOtp = useAuthStore((state) => state.loginWithOtp);
  const setPhoneVerified = useAuthStore((state) => state.setPhoneVerified);

  useEffect(() => {
    // Focus first input
    inputRefs.current[0]?.focus();

    // Start resend timer
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== OTP_LENGTH) {
      Alert.alert('Error', 'Please enter complete OTP');
      return;
    }

    setIsLoading(true);
    Keyboard.dismiss();

    try {
      if (type === 'register') {
        // Verify registration OTP
        await verifyRegistrationOtp(phone, otpString);
        setPhoneVerified(true);

        // Navigate to complete registration
        navigation.replace('CompleteRegistration', {
          phone,
          name,
          email,
        });
      } else if (type === 'login') {
        // Verify login OTP
        await loginWithOtp(phone, otpString);
        // Navigation handled by RootNavigator
      } else if (type === 'forgot_password') {
        // Navigate to reset password
        navigation.replace('ResetPassword', {
          phone,
          otp: otpString,
        });
      }
    } catch (err) {
      Alert.alert('Verification Failed', err.message || 'Invalid OTP');
      setOtp(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      if (type === 'register') {
        await sendRegistrationOtp(phone);
      } else if (type === 'login') {
        await sendLoginOtp(phone);
      } else if (type === 'forgot_password') {
        await sendForgotPasswordOtp(phone);
      }

      setResendTimer(OTP_RESEND_DELAY);
      setCanResend(false);
      setOtp(['', '', '', '']);
      inputRefs.current[0]?.focus();
      Alert.alert('Success', 'OTP sent successfully');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Verification Code</Text>
        <Text style={styles.subtitle}>
          We have sent OTP to{'\n'}
          <Text style={styles.phone}>+91 {phone}</Text>
        </Text>

        {/* OTP Inputs */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.otpInput,
                digit && styles.otpInputFilled,
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value.slice(-1), index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Resend */}
        <TouchableOpacity
          style={styles.resendContainer}
          onPress={handleResend}
          disabled={!canResend}
        >
          {canResend ? (
            <Text style={styles.resendText}>
              Didn't receive code? <Text style={styles.resendLink}>Resend</Text>
            </Text>
          ) : (
            <Text style={styles.timerText}>
              Resend code in {resendTimer}s
            </Text>
          )}
        </TouchableOpacity>

        {/* Verify Button */}
        <Button
          title="Continue"
          onPress={handleVerify}
          loading={isLoading}
          style={styles.verifyButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.xxxl,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  subtitle: {
    ...FONTS.body,
    color: COLORS.gray,
    lineHeight: 24,
  },
  phone: {
    color: COLORS.white,
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    marginTop: SPACING.xxxl,
    marginBottom: SPACING.xl,
  },
  otpInput: {
    width: 55,
    height: 55,
    borderRadius: SPACING.cardRadiusSmall,
    backgroundColor: COLORS.cardDark,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(245, 197, 24, 0.1)',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  resendText: {
    ...FONTS.body,
    color: COLORS.gray,
  },
  resendLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  timerText: {
    ...FONTS.body,
    color: COLORS.gray,
  },
  verifyButton: {
    marginTop: SPACING.lg,
  },
});

export default OTPVerificationScreen;