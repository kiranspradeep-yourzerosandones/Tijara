// src/screens/orders/PlaceOrderScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, SHADOWS } from '../../theme';
import { Button, Loading, Card, Screen } from '../../components/common';
import { useCartStore, useAuthStore } from '../../store';
import { locationsAPI, ordersAPI } from '../../api';
import { formatCurrency } from '../../utils/helpers';

const PlaceOrderScreen = ({ navigation }) => {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [customerNotes, setCustomerNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const { items, subtotal, total, totalItems, resetCart } = useCartStore();
  const { user } = useAuthStore();

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const response = await locationsAPI.getLocations();
      const locationList = response.data?.locations || [];
      setLocations(locationList);
      
      const defaultLocation = locationList.find(loc => loc.isDefault) || locationList[0];
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

  const handlePlaceOrder = async () => {
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }

    Alert.alert(
      'Confirm Order',
      `Place order for ${formatCurrency(total)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Place Order',
          onPress: async () => {
            setIsPlacingOrder(true);
            try {
              const response = await ordersAPI.placeOrder(
                selectedLocation._id,
                customerNotes.trim()
              );
              
              resetCart();
              
              Alert.alert(
                'Order Placed! 🎉',
                `Your order #${response.data.order.orderNumber} has been placed successfully.`,
                [
                  {
                    text: 'View Order',
                    onPress: () => {
                      navigation.reset({
                        index: 1,
                        routes: [
                          { name: 'Home' },
                          { 
                            name: 'OrderDetail', 
                            params: { orderId: response.data.order._id } 
                          }
                        ],
                      });
                    },
                  },
                  {
                    text: 'Continue Shopping',
                    onPress: () => {
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Home' }],
                      });
                    },
                  },
                ]
              );
            } catch (error) {
              Alert.alert('Error', error.message);
            } finally {
              setIsPlacingOrder(false);
            }
          },
        },
      ]
    );
  };

  const handleAddNewLocation = () => {
    setShowLocationPicker(false);
    navigation.navigate('AddLocation', {
      onLocationAdded: (newLocation) => {
        setLocations(prev => [...prev, newLocation]);
        setSelectedLocation(newLocation);
      },
    });
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
          {locations.map((location) => (
            <TouchableOpacity
              key={location._id}
              style={[
                styles.locationOption,
                selectedLocation?._id === location._id && styles.locationOptionSelected,
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
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                )}
              </View>
              <Text style={styles.locationShopName}>{location.shopName}</Text>
              <Text style={styles.locationAddress}>{location.fullAddress}</Text>
              <Text style={styles.locationPhone}>📞 {location.contactPhone}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.addNewLocationButton}
            onPress={handleAddNewLocation}
          >
            <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
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
        {/* Delivery Address Section */}
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
                      {selectedLocation.displayLabel || selectedLocation.label}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                </View>
                <Text style={styles.shopName}>{selectedLocation.shopName}</Text>
                <Text style={styles.address}>{selectedLocation.fullAddress}</Text>
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
              <Ionicons name="location-outline" size={32} color={COLORS.gray} />
              <Text style={styles.addLocationText}>Select Delivery Address</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>

        {/* Order Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items ({totalItems})</Text>
          
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

        {/* Notes Section */}
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

        {/* Payment Method Section */}
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
              <Ionicons name="card-outline" size={24} color={COLORS.primary} />
            </View>
          </Card>
        </View>

        {/* Credit Info */}
        {user?.creditLimit > 0 && (
          <View style={styles.creditInfoCard}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.info} />
            <View style={styles.creditInfoContent}>
              <Text style={styles.creditInfoText}>
                Available Credit: {formatCurrency(user.availableCredit)}
              </Text>
              <Text style={styles.creditInfoSubtext}>
                Credit Limit: {formatCurrency(user.creditLimit)}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Order Summary & Place Order Button */}
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
          title="Place Order"
          onPress={handlePlaceOrder}
          loading={isPlacingOrder}
          disabled={!selectedLocation}
          style={styles.placeOrderButton}
        />
      </View>

      {renderLocationPicker()}
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
  selectedLocationCard: {
    backgroundColor: COLORS.white,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.cardPadding,
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.small,
  },
  locationInfo: {
    flex: 1,
  },
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
  contactPhone: {
    ...FONTS.bodySmall,
    color: COLORS.textSecondary,
  },
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
  addLocationText: {
    ...FONTS.body,
    color: COLORS.gray,
    flex: 1,
  },
  itemsCard: {
    padding: 0,
    overflow: 'hidden',
  },
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
  orderItemInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  orderItemTitle: {
    ...FONTS.bodySmall,
    color: COLORS.textPrimary,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  orderItemPrice: {
    ...FONTS.caption,
    color: COLORS.gray,
  },
  orderItemSubtotal: {
    ...FONTS.priceSmall,
    color: COLORS.textPrimary,
  },
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
  paymentCard: {
    padding: 0,
  },
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
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  paymentDescription: {
    ...FONTS.caption,
    color: COLORS.gray,
    marginTop: 2,
  },
  creditInfoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.infoLight,
    borderRadius: SPACING.cardRadiusSmall,
    padding: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  creditInfoContent: {
    flex: 1,
  },
  creditInfoText: {
    ...FONTS.bodySmall,
    color: COLORS.info,
    fontWeight: '500',
  },
  creditInfoSubtext: {
    ...FONTS.caption,
    color: COLORS.info,
    marginTop: 2,
  },
  bottomSpacing: {
    height: 20,
  },
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
  summaryLabel: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    ...FONTS.body,
    color: COLORS.textPrimary,
  },
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
  totalLabel: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  totalValue: {
    ...FONTS.priceLarge,
    color: COLORS.textPrimary,
  },
  placeOrderButton: {
    marginTop: SPACING.md,
  },
  // Modal styles
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.screenPadding,
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
  defaultBadgeText: {
    ...FONTS.labelSmall,
    color: COLORS.success,
  },
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
  locationPhone: {
    ...FONTS.caption,
    color: COLORS.gray,
  },
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
  },
  addNewLocationText: {
    ...FONTS.body,
    color: COLORS.primary,
    fontWeight: '500',
  },
});

export default PlaceOrderScreen;