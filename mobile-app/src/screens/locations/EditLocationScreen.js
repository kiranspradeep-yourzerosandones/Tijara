// src/screens/locations/EditLocationScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../../theme';
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

  const updateField = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    if (errors[field] || errors[field.split('.')[1]]) {
      setErrors(prev => {
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
      Alert.alert('Success', 'Address updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await locationsAPI.deleteLocation(location._id);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
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
          <Input
            placeholder="Any special instructions for delivery..."
            value={formData.deliveryInstructions}
            onChangeText={(v) => updateField('deliveryInstructions', v)}
            multiline
            numberOfLines={3}
          />
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