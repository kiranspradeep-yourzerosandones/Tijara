// src/screens/profile/EditProfileScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, SHADOWS } from '../../theme';
import { Button, Input, Screen } from '../../components/common';
import { ConfirmDialog } from '../../components/common';
import Toast from '../../components/common/Toast';
import useToast from '../../hooks/useToast';
import { useAuthStore } from '../../store';
import { validateName, validateEmail } from '../../utils/validation';

const EditProfileScreen = ({ navigation }) => {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const isLoading = useAuthStore((state) => state.isLoading);

  const { toast, showToast } = useToast();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    businessName: user?.businessName || '',
    businessType: user?.businessType || '',
    gstNumber: user?.gstNumber || '',
  });
  const [errors, setErrors] = useState({});
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // ─── Track if form has changes ────────────────────────────
  const hasChanges =
    formData.name !== (user?.name || '') ||
    formData.email !== (user?.email || '') ||
    formData.businessName !== (user?.businessName || '') ||
    formData.businessType !== (user?.businessType || '') ||
    formData.gstNumber !== (user?.gstNumber || '');

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // ─── Handle back press ────────────────────────────────────
  const handleBack = () => {
    if (hasChanges) {
      setShowDiscardDialog(true);
    } else {
      navigation.goBack();
    }
  };

  // ─── Save profile ─────────────────────────────────────────
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
      showToast('Profile updated successfully', 'success');
      setTimeout(() => navigation.goBack(), 1200);
    } catch (error) {
      showToast(error.message || 'Failed to update profile', 'error');
    }
  };

  return (
    <Screen backgroundColor={COLORS.white}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        {/* ✅ Save button in header */}
        <TouchableOpacity
          style={[
            styles.saveHeaderButton,
            (!hasChanges || isLoading) && styles.saveHeaderButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!hasChanges || isLoading}
        >
          <Text
            style={[
              styles.saveHeaderText,
              (!hasChanges || isLoading) && styles.saveHeaderTextDisabled,
            ]}
          >
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── Avatar Section ─────────────────────────────── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {formData.name
                  ? formData.name
                      .trim()
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)
                  : '??'}
              </Text>
            </View>
          </View>
          <Text style={styles.avatarHint}>
            {user?.phone}
          </Text>
        </View>

        {/* ─── Personal Information ────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <Input
            label="Full Name *"
            placeholder="Your full name"
            value={formData.name}
            onChangeText={(v) => updateField('name', v)}
            error={errors.name}
            autoCapitalize="words"
            icon="person-outline"
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
            placeholder="Your email address (optional)"
            value={formData.email}
            onChangeText={(v) => updateField('email', v)}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="mail-outline"
          />
        </View>

        {/* ─── Business Information ────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Information</Text>

          <Input
            label="Business Name"
            placeholder="Your business or shop name"
            value={formData.businessName}
            onChangeText={(v) => updateField('businessName', v)}
            autoCapitalize="words"
            icon="business-outline"
          />

          <Input
            label="Business Type"
            placeholder="e.g., Retail, Wholesale, Manufacturing"
            value={formData.businessType}
            onChangeText={(v) => updateField('businessType', v)}
            autoCapitalize="words"
            icon="briefcase-outline"
          />

          <Input
            label="GST Number"
            placeholder="GST Number (if applicable)"
            value={formData.gstNumber}
            onChangeText={(v) => updateField('gstNumber', v.toUpperCase())}
            autoCapitalize="characters"
            icon="document-text-outline"
          />
        </View>

        {/* ─── Security ────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>

          <TouchableOpacity
            style={styles.securityButton}
            onPress={() => navigation.navigate('ChangePassword')}
            activeOpacity={0.7}
          >
            <View style={styles.securityLeft}>
              <View style={styles.securityIcon}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={COLORS.textPrimary}
                />
              </View>
              <View>
                <Text style={styles.securityTitle}>Change Password</Text>
                <Text style={styles.securitySubtitle}>
                  Update your account password
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.gray}
            />
          </TouchableOpacity>
        </View>

        {/* ─── Save Button ─────────────────────────────────── */}
        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={isLoading}
          disabled={!hasChanges || isLoading}
          style={styles.saveButton}
        />

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* ✅ Discard Changes Dialog */}
      <ConfirmDialog
        visible={showDiscardDialog}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to go back?"
        confirmText="Discard"
        cancelText="Keep Editing"
        confirmColor={COLORS.error}
        icon="alert-circle-outline"
        iconColor={COLORS.warning}
        onConfirm={() => {
          setShowDiscardDialog(false);
          navigation.goBack();
        }}
        onCancel={() => setShowDiscardDialog(false)}
      />

      {/* ✅ Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
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
  saveHeaderButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
  },
  saveHeaderButtonDisabled: {
    backgroundColor: COLORS.lightGray,
  },
  saveHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.black,
  },
  saveHeaderTextDisabled: {
    color: COLORS.gray,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    marginBottom: SPACING.md,
  },
  avatarContainer: {
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.black,
  },
  avatarHint: {
    ...FONTS.bodySmall,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },

  // Sections
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.screenPadding },
  section: { marginBottom: SPACING.xl },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  disabledInput: { opacity: 0.5 },

  // Security
  securityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    padding: SPACING.cardPadding,
    borderRadius: SPACING.cardRadius,
  },
  securityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  securityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  securityTitle: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  securitySubtitle: {
    ...FONTS.caption,
    color: COLORS.gray,
    marginTop: 2,
  },

  saveButton: { marginTop: SPACING.lg },
  bottomSpacing: { height: SPACING.xxxl },
});

export default EditProfileScreen;