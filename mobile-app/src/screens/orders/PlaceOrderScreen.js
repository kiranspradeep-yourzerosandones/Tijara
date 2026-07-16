// src/screens/orders/PlaceOrderScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, SHADOWS } from '../../theme';
import { Button, Loading, Card, Screen } from '../../components/common';
import { useCartStore, useAuthStore } from '../../store';
import { locationsAPI, ordersAPI } from '../../api';
import { invalidateCacheByPrefix } from '../../utils/apiCache';
import { formatCurrency } from '../../utils/helpers';

// ─── Order Success Modal ──────────────────────────────────────
const OrderSuccessModal = ({ visible, orderNumber, total, onViewOrder, onContinue }) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={successStyles.overlay}>
        <Animated.View
          style={[
            successStyles.card,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Success Icon */}
          <View style={successStyles.iconContainer}>
            <View style={successStyles.iconCircle}>
              <Ionicons name="checkmark" size={40} color={COLORS.white} />
            </View>
          </View>

          <Text style={successStyles.title}>Order Placed!</Text>
          <Text style={successStyles.subtitle}>
            Your order has been placed successfully
          </Text>

          {/* Order Info */}
          <View style={successStyles.infoBox}>
            <View style={successStyles.infoRow}>
              <Text style={successStyles.infoLabel}>Order Number</Text>
              <Text style={successStyles.infoValue}>#{orderNumber}</Text>
            </View>
            <View style={successStyles.infoDivider} />
            <View style={successStyles.infoRow}>
              <Text style={successStyles.infoLabel}>Total Amount</Text>
              <Text style={successStyles.infoValueHighlight}>
                {formatCurrency(total)}
              </Text>
            </View>
            <View style={successStyles.infoDivider} />
            <View style={successStyles.infoRow}>
              <Text style={successStyles.infoLabel}>Payment</Text>
              <Text style={successStyles.infoValueSuccess}>Pay Later</Text>
            </View>
          </View>

          {/* Note */}
          <View style={successStyles.noteBox}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={COLORS.primary}
            />
            <Text style={successStyles.noteText}>
              We'll notify you when your order is confirmed
            </Text>
          </View>

          {/* Buttons */}
          <TouchableOpacity
            style={successStyles.primaryButton}
            onPress={onViewOrder}
            activeOpacity={0.8}
          >
            <Ionicons name="receipt-outline" size={20} color={COLORS.black} />
            <Text style={successStyles.primaryButtonText}>Track Order</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={successStyles.secondaryButton}
            onPress={onContinue}
            activeOpacity={0.8}
          >
            <Text style={successStyles.secondaryButtonText}>
              Continue Shopping
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────
const PlaceOrderScreen = ({ navigation, route }) => {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [customerNotes, setCustomerNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  const { items, subtotal, total, totalItems, resetCart } = useCartStore();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    loadLocations();
  }, []);

  // ✅ FIXED: Re-fetch locations when screen comes back into focus
  // This handles the case where user added a new location and came back
  useFocusEffect(
    useCallback(() => {
      // Only reload if we already have the initial load done
      // (avoids double-loading on first mount)
      if (!isLoading) {
        reloadLocations();
      }
    }, [isLoading])
  );

  const loadLocations = async () => {
    try {
      setIsLoading(true);
      const response = await locationsAPI.getLocations();
      const locationList = response.data?.locations || [];
      setLocations(locationList);

      const defaultLocation =
        locationList.find((loc) => loc.isDefault) || locationList[0];
      if (defaultLocation) {
        setSelectedLocation(defaultLocation);
      }
    } catch (error) {
      console.error('Load locations error:', error);
      Alert.alert('Error', 'Failed to load delivery addresses');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Reload without showing full loading screen
  const reloadLocations = async () => {
    try {
      const response = await locationsAPI.getLocations();
      const locationList = response.data?.locations || [];
      setLocations(locationList);

      // ✅ If no location is selected yet, auto-select default or first
      if (!selectedLocation && locationList.length > 0) {
        const defaultLocation =
          locationList.find((loc) => loc.isDefault) || locationList[0];
        setSelectedLocation(defaultLocation);
      }

      // ✅ If a location was selected, keep it selected
      // but update it with fresh data in case anything changed
      if (selectedLocation) {
        const updatedSelected = locationList.find(
          (loc) => loc._id === selectedLocation._id
        );
        if (updatedSelected) {
          setSelectedLocation(updatedSelected);
        } else if (locationList.length > 0) {
          // Previously selected location no longer exists
          const defaultLocation =
            locationList.find((loc) => loc.isDefault) || locationList[0];
          setSelectedLocation(defaultLocation);
        }
      }
    } catch (error) {
      console.error('Reload locations error:', error);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const response = await ordersAPI.placeOrder(
        selectedLocation._id,
        customerNotes.trim()
      );

      const order = response.data?.order;

      invalidateCacheByPrefix('products:');
      resetCart();

      setPlacedOrder(order);
      setShowSuccess(true);
    } catch (error) {
      Alert.alert('Order Failed', error.message || 'Failed to place order');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleViewOrder = () => {
    setShowSuccess(false);
    if (placedOrder?._id) {
      navigation.reset({
        index: 1,
        routes: [
          { name: 'MainTabs' },
          {
            name: 'OrderDetail',
            params: { orderId: placedOrder._id },
          },
        ],
      });
    }
  };

  const handleContinueShopping = () => {
    setShowSuccess(false);
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  // ✅ FIXED: No callback in params — just navigate
  const handleAddNewLocation = () => {
    setShowLocationPicker(false);
    navigation.navigate('AddLocation');
    // When user comes back, useFocusEffect will reload locations automatically
  };

  const renderLocationPicker = () => (
    <Modal
      visible={showLocationPicker}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowLocationPicker(false)}
    >
      <Screen backgroundColor={COLORS.white} extraTopPadding={0}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Delivery Address</Text>
          <TouchableOpacity onPress={() => setShowLocationPicker(false)}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {locations.length === 0 ? (
            <View style={styles.emptyLocations}>
              <Ionicons name="location-outline" size={48} color={COLORS.gray} />
              <Text style={styles.emptyLocationsText}>No addresses yet</Text>
              <Text style={styles.emptyLocationsSubtext}>
                Add a delivery address to continue
              </Text>
            </View>
          ) : (
            locations.map((location) => (
              <TouchableOpacity
                key={location._id}
                style={[
                  styles.locationOption,
                  selectedLocation?._id === location._id &&
                    styles.locationOptionSelected,
                ]}
                onPress={() => {
                  setSelectedLocation(location);
                  setShowLocationPicker(false);
                }}
              >
                <View style={styles.locationOptionHeader}>
                  <View style={styles.locationLabelBadge}>
                    <Text style={styles.locationLabelText}>
                      {location.displayLabel || location.label}
                    </Text>
                  </View>
                  {location.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                  {selectedLocation?._id === location._id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={COLORS.primary}
                    />
                  )}
                </View>
                <Text style={styles.locationShopName}>
                  {location.shopName}
                </Text>
                <Text style={styles.locationAddress}>
                  {location.fullAddress}
                </Text>
                <Text style={styles.locationPhone}>
                  📞 {location.contactPhone}
                </Text>
              </TouchableOpacity>
            ))
          )}

          <TouchableOpacity
            style={styles.addNewLocationButton}
            onPress={handleAddNewLocation}
          >
            <Ionicons
              name="add-circle-outline"
              size={24}
              color={COLORS.primary}
            />
            <Text style={styles.addNewLocationText}>Add New Address</Text>
          </TouchableOpacity>
        </ScrollView>
      </Screen>
    </Modal>
  );

  if (isLoading) {
    return (
      <Screen backgroundColor={COLORS.backgroundLight}>
        <Loading fullScreen message="Loading..." />
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={COLORS.backgroundLight}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Checkout</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>

          {selectedLocation ? (
            <TouchableOpacity
              style={styles.selectedLocationCard}
              onPress={() => setShowLocationPicker(true)}
            >
              <View style={styles.locationInfo}>
                <View style={styles.locationHeader}>
                  <View style={styles.locationLabelBadge}>
                    <Text style={styles.locationLabelText}>
                      {selectedLocation.displayLabel ||
                        selectedLocation.label}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={COLORS.gray}
                  />
                </View>
                <Text style={styles.shopName}>
                  {selectedLocation.shopName}
                </Text>
                <Text style={styles.address}>
                  {selectedLocation.fullAddress}
                </Text>
                <Text style={styles.contactPhone}>
                  📞 {selectedLocation.contactPhone}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.addLocationCard}
              onPress={() => setShowLocationPicker(true)}
            >
              <Ionicons
                name="location-outline"
                size={32}
                color={COLORS.gray}
              />
              <Text style={styles.addLocationText}>
                Select Delivery Address
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.gray}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Order Items ({totalItems})
          </Text>
          <Card style={styles.itemsCard}>
            {items.map((item, index) => (
              <View
                key={item._id}
                style={[
                  styles.orderItem,
                  index < items.length - 1 && styles.orderItemBorder,
                ]}
              >
                <View style={styles.orderItemInfo}>
                  <Text style={styles.orderItemTitle} numberOfLines={2}>
                    {item.productTitle || item.product?.title}
                  </Text>
                  <Text style={styles.orderItemPrice}>
                    {formatCurrency(item.priceAtAdd)} × {item.quantity}
                  </Text>
                </View>
                <Text style={styles.orderItemSubtotal}>
                  {formatCurrency(item.quantity * item.priceAtAdd)}
                </Text>
              </View>
            ))}
          </Card>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add any special instructions..."
            placeholderTextColor={COLORS.gray}
            value={customerNotes}
            onChangeText={setCustomerNotes}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <Card style={styles.paymentCard}>
            <View style={styles.paymentOption}>
              <View style={styles.paymentRadio}>
                <View style={styles.paymentRadioSelected} />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTitle}>Credit (Pay Later)</Text>
                <Text style={styles.paymentDescription}>
                  Payment due within {user?.paymentTerms || 30} days
                </Text>
              </View>
              <Ionicons
                name="card-outline"
                size={24}
                color={COLORS.primary}
              />
            </View>
          </Card>
        </View>

        {/* Credit Info */}
        {user?.creditLimit > 0 && (
          <View style={styles.creditInfoCard}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={COLORS.info}
            />
            <View style={styles.creditInfoContent}>
              <Text style={styles.creditInfoText}>
                Available Credit:{' '}
                {formatCurrency(user.availableCredit || 0)}
              </Text>
              <Text style={styles.creditInfoSubtext}>
                Credit Limit: {formatCurrency(user.creditLimit)}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Summary */}
      <View style={styles.bottomContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery</Text>
          <Text style={styles.summaryValueFree}>FREE</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
        </View>

        <Button
          title={isPlacingOrder ? 'Placing Order...' : 'Place Order'}
          onPress={handlePlaceOrder}
          loading={isPlacingOrder}
          disabled={!selectedLocation || isPlacingOrder}
          style={styles.placeOrderButton}
        />
      </View>

      {renderLocationPicker()}

      <OrderSuccessModal
        visible={showSuccess}
        orderNumber={placedOrder?.orderNumber}
        total={placedOrder?.totalAmount}
        onViewOrder={handleViewOrder}
        onContinue={handleContinueShopping}
      />
    </Screen>
  );
};

// ─── Success Modal Styles ─────────────────────────────────────
const successStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    ...SHADOWS.large,
  },
  iconContainer: { marginBottom: 20 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  infoBox: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoDivider: { height: 1, backgroundColor: COLORS.border },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  infoValueHighlight: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  infoValueSuccess: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.success,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    borderRadius: 10,
    padding: 12,
    marginBottom: 24,
    gap: 8,
    width: '100%',
  },
  noteText: { fontSize: 12, color: '#92400E', flex: 1, lineHeight: 18 },
  primaryButton: {
    width: '100%',
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.black },
  secondaryButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
});

// ─── Main Screen Styles ───────────────────────────────────────
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
  title: { ...FONTS.h4, color: COLORS.textPrimary },
  headerRight: { width: 40 },
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.screenPadding },
  section: { marginBottom: SPACING.xl },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  selectedLocationCard: {
    backgroundColor: COLORS.white,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.cardPadding,
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.small,
  },
  locationInfo: { flex: 1 },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  locationLabelBadge: {
    backgroundColor: COLORS.primaryLight + '30',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: SPACING.xs,
  },
  locationLabelText: {
    ...FONTS.labelSmall,
    color: COLORS.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  shopName: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  address: {
    ...FONTS.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    lineHeight: 20,
  },
  contactPhone: { ...FONTS.bodySmall, color: COLORS.textSecondary },
  addLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.cardPadding,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  addLocationText: { ...FONTS.body, color: COLORS.gray, flex: 1 },
  itemsCard: { padding: 0, overflow: 'hidden' },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.cardPadding,
  },
  orderItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  orderItemInfo: { flex: 1, marginRight: SPACING.md },
  orderItemTitle: {
    ...FONTS.bodySmall,
    color: COLORS.textPrimary,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  orderItemPrice: { ...FONTS.caption, color: COLORS.gray },
  orderItemSubtotal: { ...FONTS.priceSmall, color: COLORS.textPrimary },
  notesInput: {
    backgroundColor: COLORS.white,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.cardPadding,
    ...FONTS.body,
    color: COLORS.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paymentCard: { padding: 0 },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.cardPadding,
    gap: SPACING.md,
  },
  paymentRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentRadioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  paymentInfo: { flex: 1 },
  paymentTitle: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  paymentDescription: { ...FONTS.caption, color: COLORS.gray, marginTop: 2 },
  creditInfoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.infoLight,
    borderRadius: SPACING.cardRadiusSmall,
    padding: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  creditInfoContent: { flex: 1 },
  creditInfoText: {
    ...FONTS.bodySmall,
    color: COLORS.info,
    fontWeight: '500',
  },
  creditInfoSubtext: { ...FONTS.caption, color: COLORS.info, marginTop: 2 },
  bottomSpacing: { height: 20 },
  bottomContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.medium,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  summaryLabel: { ...FONTS.body, color: COLORS.textSecondary },
  summaryValue: { ...FONTS.body, color: COLORS.textPrimary },
  summaryValueFree: {
    ...FONTS.body,
    color: COLORS.success,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  totalLabel: { ...FONTS.h4, color: COLORS.textPrimary },
  totalValue: { ...FONTS.priceLarge, color: COLORS.textPrimary },
  placeOrderButton: { marginTop: SPACING.md },
  // Modal
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { ...FONTS.h4, color: COLORS.textPrimary },
  modalContent: { flex: 1, padding: SPACING.screenPadding },
  // ✅ NEW: Empty locations state in modal
  emptyLocations: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    gap: SPACING.md,
  },
  emptyLocationsText: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  emptyLocationsSubtext: {
    ...FONTS.bodySmall,
    color: COLORS.gray,
    textAlign: 'center',
  },
  locationOption: {
    backgroundColor: COLORS.card,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.cardPadding,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  locationOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  locationOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  defaultBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: SPACING.xs,
  },
  defaultBadgeText: { ...FONTS.labelSmall, color: COLORS.success },
  locationShopName: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  locationAddress: {
    ...FONTS.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  locationPhone: { ...FONTS.caption, color: COLORS.gray },
  addNewLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    borderRadius: SPACING.cardRadius,
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  addNewLocationText: {
    ...FONTS.body,
    color: COLORS.primary,
    fontWeight: '500',
  },
});

export default PlaceOrderScreen;