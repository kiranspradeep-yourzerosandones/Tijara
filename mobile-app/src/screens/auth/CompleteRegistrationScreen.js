// src/screens/auth/CompleteRegistrationScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../../theme';
import { Button, Input } from '../../components/common';
import { useAuthStore } from '../../store';
import { validatePassword } from '../../utils/validation';

const CompleteRegistrationScreen = ({ navigation, route }) => {
  const { phone, name, email } = route.params;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [errors, setErrors] = useState({});

  const completeRegistration = useAuthStore((state) => state.completeRegistration);
  const isLoading = useAuthStore((state) => state.isLoading);

  const handleComplete = async () => {
    const passwordValidation = validatePassword(password);
    const newErrors = {};

    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    try {
      await completeRegistration({
        phone,
        name,
        email,
        password,
        businessName,
        businessType,
        gstNumber,
      });
      // Navigation handled by RootNavigator
    } catch (err) {
      Alert.alert('Registration Failed', err.message || 'Something went wrong');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Set your password and business details
          </Text>

          {/* Password Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>
            
            <Input
              label="Password"
              placeholder="Enter password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              error={errors.confirmPassword}
            />
          </View>

          {/* Business Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business Details (Optional)</Text>
            
            <Input
              label="Business Name"
              placeholder="Your business name"
              value={businessName}
              onChangeText={setBusinessName}
              autoCapitalize="words"
            />

            <Input
              label="Business Type"
              placeholder="e.g., Retail, Wholesale"
              value={businessType}
              onChangeText={setBusinessType}
              autoCapitalize="words"
            />

            <Input
              label="GST Number"
              placeholder="Enter GST number (if applicable)"
              value={gstNumber}
              onChangeText={setGstNumber}
              autoCapitalize="characters"
            />
          </View>

          <Button
            title="Complete Registration"
            onPress={handleComplete}
            loading={isLoading}
            style={styles.completeButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: SPACING.screenPadding,
    paddingBottom: SPACING.xxxl,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  completeButton: {
    marginTop: SPACING.lg,
  },
});

export default CompleteRegistrationScreen;