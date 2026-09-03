// src/screens/auth/CompleteRegistrationScreen.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Pressable,
<<<<<<< HEAD
=======
  StatusBar,
>>>>>>> 218207a3f53c183ca8d7c13f57daa798b6654532
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../../theme';
import { Button, Input } from '../../components/common';
import { useAuthStore } from '../../store';
import { productsAPI } from '../../api';
import { validatePassword } from '../../utils/validation';

const CompleteRegistrationScreen = ({ navigation, route }) => {
  const { phone, name, email } = route.params;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  
  // ✅ Category / Industry States
  const [categories, setCategories] = useState([]);
  const [preferredCategory, setPreferredCategory] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  const [errors, setErrors] = useState({});

  const completeRegistration = useAuthStore((state) => state.completeRegistration);
  const isLoading = useAuthStore((state) => state.isLoading);

  // ✅ Fetch active categories on load
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await productsAPI.getCategories();
        const activeCats = (response.categories || []).filter(c => c.isActive !== false);
        setCategories(activeCats);
      } catch (err) {
        console.error('Failed to load industries:', err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // ✅ Filter categories based on search input
  const filteredCategories = useMemo(() => {
    if (!searchText.trim()) return categories;
    return categories.filter(cat => 
      cat.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText, categories]);

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
<<<<<<< HEAD
        preferredCategory, // ✅ Pass preferredCategory along to the signup process
      });
      // Navigation handled automatically by RootNavigator
=======
        preferredCategory,
      });
>>>>>>> 218207a3f53c183ca8d7c13f57daa798b6654532
    } catch (err) {
      Alert.alert('Registration Failed', err.message || 'Something went wrong');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Title Section with Safe Clearance */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Set your password and business details
            </Text>
          </View>

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

          {/* Industry We Serve (Preferred Category Selection) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Industry Preference</Text>
            <Text style={styles.fieldDesc}>
              Select the industry you belong to. We will personalise products shown to you.
            </Text>
            
            <TouchableOpacity
              style={styles.dropdownSelector}
              onPress={() => setIsDropdownVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.dropdownSelectorContent}>
                <Ionicons name="business-outline" size={20} color={COLORS.textSecondary} style={styles.fieldIcon} />
                <Text style={[
                  styles.dropdownSelectorText,
                  preferredCategory && styles.dropdownSelectorTextActive
                ]}>
                  {preferredCategory || 'Select Industry (Optional)'}
                </Text>
              </View>
              {loadingCategories ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Ionicons name="chevron-down-outline" size={18} color={COLORS.textSecondary} />
              )}
            </TouchableOpacity>
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

      {/* ── Searchable Dropdown Modal ── */}
      <Modal
        visible={isDropdownVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDropdownVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsDropdownVisible(false)}>
          <View style={styles.modalSheet} onPress={e => e.stopPropagation()}>
            <Pressable style={styles.modalContentContainer}>
              {/* Drag Handle */}
              <View style={styles.modalHandle} />
              
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choose Your Industry</Text>
                <TouchableOpacity onPress={() => setIsDropdownVisible(false)}>
                  <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search industries..."
                  placeholderTextColor={COLORS.textSecondary}
                  value={searchText}
                  onChangeText={setSearchText}
                  autoCorrect={false}
                />
                {searchText.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchText('')}>
                    <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Clear Option */}
              <TouchableOpacity
                style={[styles.modalItem, !preferredCategory && styles.modalItemSelected]}
                onPress={() => {
                  setPreferredCategory(null);
                  setIsDropdownVisible(false);
                  setSearchText('');
                }}
              >
                <Ionicons name="apps-outline" size={20} color={!preferredCategory ? COLORS.primary : COLORS.textSecondary} />
                <Text style={[styles.modalItemText, !preferredCategory && styles.modalItemTextActive]}>
                  No Preference (Show all)
                </Text>
                {!preferredCategory && (
                  <Ionicons name="checkmark" size={20} color={COLORS.primary} style={styles.checkIcon} />
                )}
              </TouchableOpacity>

              {/* Category Options */}
              <FlatList
                data={filteredCategories}
                keyExtractor={(item) => item._id}
                keyboardShouldPersistTaps="handled"
                style={styles.listContainer}
                renderItem={({ item }) => {
                  const isSelected = item.name === preferredCategory;
                  return (
                    <TouchableOpacity
                      style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                      onPress={() => {
                        setPreferredCategory(item.name);
                        setIsDropdownVisible(false);
                        setSearchText('');
                      }}
                    >
                      <Ionicons name="business" size={20} color={isSelected ? COLORS.primary : COLORS.textSecondary} />
                      <Text style={[styles.modalItemText, isSelected && styles.modalItemTextActive]}>
                        {item.name}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark" size={20} color={COLORS.primary} style={styles.checkIcon} />
                      )}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptyList}>
                    <Ionicons name="search" size={40} color={COLORS.textSecondary} />
                    <Text style={styles.emptyText}>No industries found matching "{searchText}"</Text>
                  </View>
                }
              />
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
    paddingHorizontal: SPACING.screenPadding,
    // ✅ Generous top padding dynamically calculated to avoid camera hole/notch
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 24 : 20,
    paddingBottom: SPACING.xxxl,
  },
  headerSection: {
    marginBottom: SPACING.xl,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  fieldDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    lineHeight: 18,
  },
  completeButton: {
    marginTop: SPACING.lg,
  },
  
  // ✅ Dropdown Field Styles
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: SPACING.md,
    height: 52,
    marginTop: 4,
  },
  dropdownSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fieldIcon: {
    marginRight: 10,
  },
  dropdownSelectorText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  dropdownSelectorTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },

  // ✅ Searchable Select Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  modalContentContainer: {
    flex: 1,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalItemSelected: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginHorizontal: -8,
  },
  modalItemText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginLeft: 12,
    flex: 1,
  },
  modalItemTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 8,
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default CompleteRegistrationScreen;