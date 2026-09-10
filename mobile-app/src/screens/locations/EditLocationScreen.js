// src/screens/locations/EditLocationScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, SHADOWS } from '../../theme';
import { Button, Input, Screen } from '../../components/common';
import { locationsAPI } from '../../api';
import { validateLocationForm } from '../../utils/validation';
import { LOCATION_LABELS } from '../../utils/constants';

const EditLocationScreen = ({ navigation, route }) => {
  const { location } = route.params;

  const [formData, setFormData] = useState({
    label: location.label || 'shop',
    customLabel: location.customLabel || '',
    shopName: location.shopName || '',
    contactPerson: location.contactPerson || '',
    contactPhone: location.contactPhone || '',
    address: {
      line1: location.address?.line1 || '',
      line2: location.address?.line2 || '',
      city: location.address?.city || '',
      state: location.address?.state || '',
      pincode: location.address?.pincode || '',
    },
    deliveryInstructions: location.deliveryInstructions || '',
    isDefault: location.isDefault || false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Custom dialog state (replaces native Alert)
  const [dialog, setDialog] = useState({
    visible: false,
    title: '',
    message: '',
    isSuccess: false,
    showCancel: false,
    confirmText: 'OK',
    cancelText: 'Cancel',
    confirmColor: COLORS.primary,
    icon: 'alert-circle-outline',
    iconColor: COLORS.primary,
    onConfirm: null,
    onCancel: null,
  });

  const closeDialog = () => {
    setDialog((prev) => ({ ...prev, visible: false }));
  };

  const showAlert = ({ title, message, isSuccess = false, onConfirm = null }) => {
    setDialog({
      visible: true,
      title,
      message,
      isSuccess,
      showCancel: false,
      confirmText: 'OK',
      confirmColor: isSuccess ? COLORS.primary : COLORS.error,
      icon: isSuccess ? 'checkmark-circle-outline' : 'alert-circle-outline',
      iconColor: isSuccess ? (COLORS.success || '#22C55E') : COLORS.error,
      onConfirm,
      onCancel: null,
    });
  };

  const showConfirm = ({ title, message, confirmText = 'Delete', cancelText = 'Cancel', onConfirm }) => {
    setDialog({
      visible: true,
      title,
      message,
      isSuccess: false,
      showCancel: true,
      confirmText,
      cancelText,
      confirmColor: COLORS.error,
      icon: 'trash-outline',
      iconColor: COLORS.error,
      onConfirm,
      onCancel: closeDialog,
    });
  };

  const updateField = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    if (errors[field] || errors[field.split('.')[1]]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        delete newErrors[field.split('.')[1]];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    const validation = validateLocationForm(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsLoading(true);

    try {
      await locationsAPI.updateLocation(location._id, formData);
      showAlert({
        title: 'Address Updated',
        message: 'Your address has been updated successfully.',
        isSuccess: true,
        onConfirm: () => navigation.goBack(),
      });
    } catch (error) {
      showAlert({
        title: 'Update Failed',
        message: error?.message || 'Failed to update address. Please try again.',
        isSuccess: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    showConfirm({
      title: 'Delete Address?',
      message: 'Are you sure you want to delete this address? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          setIsLoading(true);
          await locationsAPI.deleteLocation(location._id);
          navigation.goBack();
        } catch (error) {
          setIsLoading(false);
          showAlert({
            title: 'Delete Failed',
            message: error?.message || 'Could not delete address. Please try again.',
            isSuccess: false,
          });
        }
      },
    });
  };

  return (
    <Screen backgroundColor={COLORS.white}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Address</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Label Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address Type</Text>
          <View style={styles.labelContainer}>
            {LOCATION_LABELS.map((label) => (
              <TouchableOpacity
                key={label}
                style={[
                  styles.labelOption,
                  formData.label === label && styles.labelOptionActive,
                ]}
                onPress={() => updateField('label', label)}
              >
                <Text
                  style={[
                    styles.labelOptionText,
                    formData.label === label && styles.labelOptionTextActive,
                  ]}
                >
                  {label.charAt(0).toUpperCase() + label.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {formData.label === 'other' && (
            <Input
              placeholder="Custom label"
              value={formData.customLabel}
              onChangeText={(v) => updateField('customLabel', v)}
              containerStyle={styles.customLabelInput}
            />
          )}
        </View>

        {/* Shop Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shop Details</Text>
          <Input
            label="Shop Name *"
            placeholder="Your shop/business name"
            value={formData.shopName}
            onChangeText={(v) => updateField('shopName', v)}
            error={errors.shopName}
          />
          <Input
            label="Contact Person"
            placeholder="Name of contact person"
            value={formData.contactPerson}
            onChangeText={(v) => updateField('contactPerson', v)}
          />
          <Input
            label="Contact Phone *"
            placeholder="10-digit phone number"
            value={formData.contactPhone}
            onChangeText={(v) => updateField('contactPhone', v)}
            keyboardType="phone-pad"
            maxLength={10}
            error={errors.contactPhone}
          />
        </View>

        {/* Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address</Text>
          <Input
            label="Address Line 1 *"
            placeholder="Building, Street"
            value={formData.address.line1}
            onChangeText={(v) => updateField('address.line1', v)}
            error={errors.line1}
          />
          <Input
            label="Address Line 2"
            placeholder="Landmark, Area (Optional)"
            value={formData.address.line2}
            onChangeText={(v) => updateField('address.line2', v)}
          />
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input
                label="City *"
                placeholder="City"
                value={formData.address.city}
                onChangeText={(v) => updateField('address.city', v)}
                error={errors.city}
              />
            </View>
            <View style={styles.halfInput}>
              <Input
                label="Pincode *"
                placeholder="6 digits"
                value={formData.address.pincode}
                onChangeText={(v) => updateField('address.pincode', v)}
                keyboardType="number-pad"
                maxLength={6}
                error={errors.pincode}
              />
            </View>
          </View>
          <Input
            label="State *"
            placeholder="State"
            value={formData.address.state}
            onChangeText={(v) => updateField('address.state', v)}
            error={errors.state}
          />
        </View>

        {/* Delivery Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Instructions</Text>
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              placeholder="Any special instructions for delivery..."
              placeholderTextColor={COLORS.placeholder || COLORS.gray}
              value={formData.deliveryInstructions}
              onChangeText={(v) => updateField('deliveryInstructions', v)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>
          <Text style={styles.charCount}>
            {formData.deliveryInstructions.length}/500
          </Text>
        </View>

        {/* Default Toggle */}
        <View style={styles.defaultToggle}>
          <View style={styles.defaultInfo}>
            <Text style={styles.defaultTitle}>Set as Default</Text>
            <Text style={styles.defaultSubtitle}>
              This will be your primary delivery address
            </Text>
          </View>
          <Switch
            value={formData.isDefault}
            onValueChange={(v) => updateField('isDefault', v)}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={COLORS.white}
          />
        </View>

        <Button
          title="Save Changes"
          onPress={handleSubmit}
          loading={isLoading}
          style={styles.saveButton}
        />

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* ── Custom Dialog (replaces native Alert) ── */}
      <Modal
        visible={dialog.visible}
        transparent
        animationType="fade"
        onRequestClose={closeDialog}
      >
        <View style={dialogStyles.overlay}>
          <View style={dialogStyles.card}>
            <View
              style={[
                dialogStyles.iconCircle,
                {
                  backgroundColor: dialog.isSuccess
                    ? (COLORS.success || '#22C55E') + '18'
                    : COLORS.errorLight || '#FEE2E2',
                },
              ]}
            >
              <Ionicons
                name={dialog.icon}
                size={32}
                color={dialog.iconColor}
              />
            </View>

            <Text style={dialogStyles.title}>{dialog.title}</Text>
            <Text style={dialogStyles.message}>{dialog.message}</Text>

            <View style={dialogStyles.buttonRow}>
              {dialog.showCancel && (
                <TouchableOpacity
                  style={dialogStyles.cancelBtn}
                  onPress={() => {
                    closeDialog();
                    if (dialog.onCancel) dialog.onCancel();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={dialogStyles.cancelBtnText}>{dialog.cancelText}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  dialogStyles.confirmBtn,
                  { backgroundColor: dialog.confirmColor },
                  !dialog.showCancel && { flex: 1, marginLeft: 0 },
                ]}
                onPress={() => {
                  const cb = dialog.onConfirm;
                  closeDialog();
                  if (cb) cb();
                }}
                activeOpacity={0.7}
              >
                <Text style={dialogStyles.confirmBtnText}>{dialog.confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const dialogStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 340,
    alignItems: 'center',
    ...(SHADOWS?.large || {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 12,
    }),
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: SPACING.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

const styles = StyleSheet.create({
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
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
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
  labelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  labelOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: SPACING.buttonRadius,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  labelOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  labelOptionText: {
    ...FONTS.bodySmall,
    color: COLORS.textSecondary,
  },
  labelOptionTextActive: {
    color: COLORS.black,
    fontWeight: '600',
  },
  customLabelInput: {
    marginTop: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfInput: {
    flex: 1,
  },
  textAreaContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SPACING.inputRadius || 8,
    backgroundColor: COLORS.card,
    overflow: 'hidden',
  },
  textArea: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'ios' ? SPACING.md : SPACING.sm,
    paddingBottom: SPACING.sm,
    minHeight: 100,
    maxHeight: 150,
    textAlignVertical: 'top',
  },
  charCount: {
    ...FONTS.caption,
    color: COLORS.gray,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  defaultToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    padding: SPACING.cardPadding,
    borderRadius: SPACING.cardRadius,
    marginBottom: SPACING.xl,
  },
  defaultInfo: {
    flex: 1,
  },
  defaultTitle: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  defaultSubtitle: {
    ...FONTS.caption,
    color: COLORS.gray,
    marginTop: 2,
  },
  saveButton: {
    marginTop: SPACING.md,
  },
  bottomSpacing: {
    height: SPACING.xxxl,
  },
});

export default EditLocationScreen;