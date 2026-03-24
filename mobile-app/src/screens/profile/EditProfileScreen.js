import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../../theme';
import { Button, Input } from '../../components/common';
import { useAuthStore } from '../../store';
import { validateName, validateEmail } from '../../utils/validation';

const EditProfileScreen = ({ navigation }) => {
  const { user, updateProfile, isLoading } = useAuthStore();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    businessName: user?.businessName || '',
    businessType: user?.businessType || '',
    gstNumber: user?.gstNumber || '',
  });
  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSave = async () => {
    const nameValidation = validateName(formData.name);
    const emailValidation = validateEmail(formData.email);

    const newErrors = {};
    if (!nameValidation.isValid) newErrors.name = nameValidation.message;
    if (!emailValidation.isValid) newErrors.email = emailValidation.message;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await updateProfile(formData);
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <Input
            label="Full Name *"
            placeholder="Your full name"
            value={formData.name}
            onChangeText={(v) => updateField('name', v)}
            error={errors.name}
            autoCapitalize="words"
          />

          <Input
            label="Phone Number"
            value={user?.phone}
            editable={false}
            icon="lock-closed-outline"
            containerStyle={styles.disabledInput}
          />

          <Input
            label="Email"
            placeholder="Your email address"
            value={formData.email}
            onChangeText={(v) => updateField('email', v)}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Business Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Information</Text>
          
          <Input
            label="Business Name"
            placeholder="Your business name"
            value={formData.businessName}
            onChangeText={(v) => updateField('businessName', v)}
            autoCapitalize="words"
          />

          <Input
            label="Business Type"
            placeholder="e.g., Retail, Wholesale"
            value={formData.businessType}
            onChangeText={(v) => updateField('businessType', v)}
            autoCapitalize="words"
          />

          <Input
            label="GST Number"
            placeholder="GST Number (if applicable)"
            value={formData.gstNumber}
            onChangeText={(v) => updateField('gstNumber', v)}
            autoCapitalize="characters"
          />
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <TouchableOpacity
            style={styles.changePasswordButton}
            onPress={handleChangePassword}
          >
            <View style={styles.changePasswordLeft}>
              <Ionicons name="lock-closed-outline" size={22} color={COLORS.textPrimary} />
              <Text style={styles.changePasswordText}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={isLoading}
          style={styles.saveButton}
        />

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.screenPadding,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  disabledInput: {
    opacity: 0.6,
  },
  changePasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    padding: SPACING.cardPadding,
    borderRadius: SPACING.cardRadius,
  },
  changePasswordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  changePasswordText: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  saveButton: {
    marginTop: SPACING.lg,
  },
  bottomSpacing: {
    height: SPACING.xxxl,
  },
});

export default EditProfileScreen;