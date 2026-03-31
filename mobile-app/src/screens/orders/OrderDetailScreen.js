// src/screens/orders/OrderDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../../theme';
import { Button, Loading, Screen } from '../../components/common';
import { ordersAPI } from '../../api';
import { formatCurrency, formatDate, getImageUrl } from '../../utils/helpers';

const OrderDetailScreen = ({ navigation, route }) => {
  const { orderId } = route.params;
  
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const response = await ordersAPI.getOrder(orderId);
      setOrder(response.data?.order);
    } catch (error) {
      console.error('Load order error:', error);
      Alert.alert('Error', 'Failed to load order details');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setIsCancelling(true);
            try {
              await ordersAPI.cancelOrder(orderId, 'Customer requested cancellation');
              Alert.alert('Success', 'Order cancelled successfully');
              loadOrder();
            } catch (error) {
              Alert.alert('Error', error.message);
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleReorder = async () => {
    try {
      const response = await ordersAPI.reorder(orderId);
      Alert.alert(
        'Items Added',
        `${response.data.addedItems?.length || 0} items added to cart`,
        [
          { text: 'Continue Shopping', style: 'cancel' },
          { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDownloadInvoice = () => {
    Alert.alert('Coming Soon', 'Invoice download will be available soon');
  };

  const getProductImage = (item) => {
    if (!item) return null;
    const imageSource = 
      item.productSnapshot?.image ||
      item.product?.images?.[0] ||
      null;
    return imageSource ? getImageUrl(imageSource) : null;
  };

  // Format expected date nicely
  const formatExpectedDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return date.toLocaleDateString('en-IN', options);
  };

  // Check if a date is in the past
  const isPastDate = (dateString) => {
    if (!dateString) return false;
    return new Date() > new Date(dateString);
  };

  // ✅ RENDER TRACKING TIMELINE (Flipkart Style)
  const renderTrackingTimeline = () => {
    // Use trackingTimeline from API if available
    const timeline = order?.trackingTimeline || [];

    if (order?.status === 'cancelled') {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Status</Text>
          <View style={styles.cancelledBox}>
            <Ionicons name="close-circle" size={48} color={COLORS.error} />
            <Text style={styles.cancelledTitle}>Order Cancelled</Text>
            <Text style={styles.cancelledReason}>
              {order.cancellation?.reason || 'This order has been cancelled.'}
            </Text>
            <Text style={styles.cancelledDate}>
              {formatDate(order.cancelledAt || order.updatedAt, 'datetime')}
            </Text>
          </View>
        </View>
      );
    }

    // If no timeline from API, build default
    const steps = timeline.length > 0 ? timeline : buildDefaultTimeline();

    return (
      <View style={styles.section}>
        <View style={styles.timelineHeader}>
          <Text style={styles.sectionTitle}>Order Tracking</Text>
          {order?.expectedDeliveryDate && (
            <View style={styles.expectedDeliveryBadge}>
              <Ionicons name="time-outline" size={14} color={COLORS.primary} />
              <Text style={styles.expectedDeliveryText}>
                {order.isDelayed ? 'Delayed - ' : ''}
                Expected by {formatExpectedDate(order.expectedDeliveryDate)}
              </Text>
            </View>
          )}
        </View>

        {order?.isDelayed && order?.delayReason && (
          <View style={styles.delayBanner}>
            <Ionicons name="warning" size={18} color="#B45309" />
            <Text style={styles.delayText}>{order.delayReason}</Text>
          </View>
        )}

        <View style={styles.timelineContainer}>
          {steps.map((step, index) => {
            const isCompleted = step.isCompleted || step.status === 'completed';
            const isCurrent = step.isCurrent || step.status === 'current';
            const isPending = step.isPending || step.status === 'pending';
            const isDelayed = step.isDelayed;
            const isLast = index === steps.length - 1;

            return (
              <View key={step.key || index} style={styles.timelineStep}>
                {/* Left side - Line and Dot */}
                <View style={styles.timelineLeft}>
                  {/* Dot */}
                  <View style={[
                    styles.timelineDot,
                    isCompleted && styles.timelineDotCompleted,
                    isCurrent && styles.timelineDotCurrent,
                    isPending && styles.timelineDotPending,
                    isDelayed && styles.timelineDotDelayed,
                  ]}>
                    {isCompleted && (
                      <Ionicons name="checkmark" size={12} color={COLORS.white} />
                    )}
                    {isCurrent && !isCompleted && (
                      <View style={styles.currentDotInner} />
                    )}
                  </View>

                  {/* Line */}
                  {!isLast && (
                    <View style={[
                      styles.timelineLine,
                      isCompleted && !isCurrent && styles.timelineLineCompleted,
                      isPending && styles.timelineLinePending,
                    ]} />
                  )}
                </View>

                {/* Right side - Content */}
                <View style={styles.timelineContent}>
                  <View style={styles.timelineMainRow}>
                    <Text style={[
                      styles.timelineTitle,
                      isCompleted && styles.timelineTitleCompleted,
                      isCurrent && styles.timelineTitleCurrent,
                      isPending && styles.timelineTitlePending,
                      isDelayed && styles.timelineTitleDelayed,
                    ]}>
                      {step.title}
                    </Text>
                    {isDelayed && (
                      <View style={styles.delayedBadge}>
                        <Text style={styles.delayedBadgeText}>Delayed</Text>
                      </View>
                    )}
                  </View>

                  <Text style={[
                    styles.timelineDescription,
                    isPending && styles.timelineDescriptionPending,
                  ]}>
                    {step.description}
                  </Text>

                  {/* Date info */}
                  {isCompleted && (step.completedAt || step.actualDate) && (
                    <Text style={styles.timelineDate}>
                      {formatDate(step.completedAt || step.actualDate, 'datetime')}
                    </Text>
                  )}

                  {isPending && step.expectedDate && (
                    <Text style={[
                      styles.timelineExpectedDate,
                      isPastDate(step.expectedDate) && styles.timelineExpectedDateOverdue,
                    ]}>
                      {isPastDate(step.expectedDate) 
                        ? `Was expected by ${formatExpectedDate(step.expectedDate)}`
                        : `Expected by ${formatExpectedDate(step.expectedDate)}`
                      }
                    </Text>
                  )}

                  {step.note && (
                    <Text style={styles.timelineNote}>📝 {step.note}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // Build default timeline if not provided by API
  const buildDefaultTimeline = () => {
    const statusOrder = ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
    const currentIndex = statusOrder.indexOf(order?.status || 'pending');

    const defaultSteps = [
      { key: 'pending', title: 'Order Placed', description: 'Your order has been placed', icon: 'checkmark-circle' },
      { key: 'confirmed', title: 'Order Confirmed', description: 'Seller has processed your order', icon: 'checkmark-done' },
      { key: 'packed', title: 'Packed', description: 'Your item has been packed', icon: 'cube' },
      { key: 'shipped', title: 'Shipped', description: 'Your item has been shipped', icon: 'airplane' },
      { key: 'out_for_delivery', title: 'Out for Delivery', description: 'Your item is out for delivery', icon: 'car' },
      { key: 'delivered', title: 'Delivered', description: 'Your item has been delivered', icon: 'checkmark-circle' },
    ];

    return defaultSteps.map((step, index) => ({
      ...step,
      isCompleted: index < currentIndex || (index === currentIndex && order?.status === 'delivered'),
      isCurrent: index === currentIndex && order?.status !== 'delivered',
      isPending: index > currentIndex,
      completedAt: index === 0 ? order?.createdAt : null,
      expectedDate: order?.expectedTimeline?.[step.key]?.expectedDate,
      actualDate: order?.expectedTimeline?.[step.key]?.actualDate,
      isDelayed: false,
    }));
  };

  if (isLoading) {
    return (
      <Screen backgroundColor={COLORS.backgroundLight}>
        <Loading fullScreen message="Loading order..." />
      </Screen>
    );
  }

  if (!order) {
    return null;
  }

  const firstItem = order.items?.[0];
  const itemImage = getProductImage(firstItem);
  const productTitle = firstItem?.productSnapshot?.title || 'Product';
  const itemCount = order.items?.length || 1;
  const canCancel = order.canCancel || order.nextStatuses?.includes('cancelled');

  return (
    <Screen backgroundColor={COLORS.backgroundLight}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Product Card */}
        <View style={styles.topProductCard}>
          {itemImage ? (
            <Image source={{ uri: itemImage }} style={styles.topImage} resizeMode="cover" />
          ) : (
            <View style={[styles.topImage, styles.imagePlaceholder]}>
              <Ionicons name="cube-outline" size={32} color={COLORS.gray} />
            </View>
          )}
          <View style={styles.topProductInfo}>
            <Text style={styles.productTitle} numberOfLines={2}>{productTitle}</Text>
            <Text style={styles.topMeta}>Ordered on {formatDate(order.createdAt, 'date')}</Text>
            <Text style={styles.topMeta}>
              quantity - {firstItem?.quantity || 1}
              {itemCount > 1 && ` (+${itemCount - 1} more)`}
            </Text>
          </View>
        </View>

        {/* Order ID */}
        <Text style={styles.orderId}>Order #{order.orderNumber}</Text>

        {/* Expected Delivery Banner */}
        {order.expectedDeliveryDate && order.status !== 'delivered' && order.status !== 'cancelled' && (
          <View style={[
            styles.deliveryBanner,
            order.isDelayed && styles.deliveryBannerDelayed
          ]}>
            <Ionicons 
              name={order.isDelayed ? "warning" : "time"} 
              size={20} 
              color={order.isDelayed ? "#B45309" : COLORS.primary} 
            />
            <View style={styles.deliveryBannerContent}>
              <Text style={[
                styles.deliveryBannerTitle,
                order.isDelayed && styles.deliveryBannerTitleDelayed
              ]}>
                {order.isDelayed ? 'Delivery Delayed' : 'Expected Delivery'}
              </Text>
              <Text style={styles.deliveryBannerDate}>
                {formatExpectedDate(order.expectedDeliveryDate)}
              </Text>
              {order.isDelayed && order.delayReason && (
                <Text style={styles.deliveryBannerReason}>{order.delayReason}</Text>
              )}
            </View>
          </View>
        )}

        {/* Tracking Timeline */}
        {renderTrackingTimeline()}

        {/* Multiple Items Section */}
        {itemCount > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Items ({itemCount})</Text>
            <View style={styles.itemsContainer}>
              {order.items.map((item, index) => {
                const itemImg = getProductImage(item);
                return (
                  <View
                    key={item._id || index}
                    style={[styles.itemRow, index < order.items.length - 1 && styles.itemRowBorder]}
                  >
                    {itemImg ? (
                      <Image source={{ uri: itemImg }} style={styles.itemImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                        <Ionicons name="cube-outline" size={18} color={COLORS.gray} />
                      </View>
                    )}
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle} numberOfLines={2}>
                        {item.productSnapshot?.title || 'Product'}
                      </Text>
                      <Text style={styles.itemMeta}>
                        {formatCurrency(item.unitPrice)} × {item.quantity}
                      </Text>
                    </View>
                    <Text style={styles.itemSubtotal}>{formatCurrency(item.subtotal)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Delivery Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Ionicons name="location" size={18} color={COLORS.primary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Delivery Address</Text>
                {order.deliveryAddress ? (
                  <>
                    <Text style={styles.detailValue}>
                      {order.deliveryAddress.addressLine1}
                      {order.deliveryAddress.addressLine2 && `, ${order.deliveryAddress.addressLine2}`}
                    </Text>
                    <Text style={styles.detailValue}>
                      {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.detailValue}>Address not available</Text>
                )}
              </View>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Ionicons name="person" size={18} color={COLORS.primary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Recipient</Text>
                <Text style={styles.detailValue}>
                  {order.deliveryAddress?.shopName || order.customerSnapshot?.name || 'Customer'}
                </Text>
                {order.deliveryAddress?.contactPhone && (
                  <Text style={styles.detailValuePhone}>📞 {order.deliveryAddress.contactPhone}</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Price Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Details</Text>
          <View style={styles.priceContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Sub total</Text>
              <Text style={styles.priceValue}>{formatCurrency(order.subtotal)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Shipping</Text>
              <Text style={[styles.priceValue, { color: COLORS.success }]}>
                {order.deliveryCharges > 0 ? formatCurrency(order.deliveryCharges) : 'FREE'}
              </Text>
            </View>
            {order.discount > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Discount</Text>
                <Text style={[styles.priceValue, { color: COLORS.success }]}>
                  -{formatCurrency(order.discount)}
                </Text>
              </View>
            )}
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceTotalLabel}>Total</Text>
              <Text style={styles.priceTotalValue}>{formatCurrency(order.totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Download Invoice */}
        <TouchableOpacity style={styles.downloadBtn} onPress={handleDownloadInvoice} activeOpacity={0.8}>
          <Ionicons name="download-outline" size={18} color={COLORS.textPrimary} />
          <Text style={styles.downloadBtnText}>Download Invoice</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Actions */}
      {(canCancel || order.status === 'delivered') && (
        <View style={styles.bottomActions}>
          {canCancel && order.status !== 'cancelled' && (
            <Button
              title="Cancel Order"
              variant="outline"
              onPress={handleCancelOrder}
              loading={isCancelling}
              style={styles.cancelButton}
              textStyle={{ color: COLORS.error }}
            />
          )}
          {order.status === 'delivered' && (
            <Button title="Reorder" onPress={handleReorder} style={styles.reorderButton} />
          )}
        </View>
      )}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.screenPadding,
  },

  // Top Product Card
  topProductCard: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  topImage: {
    width: 75,
    height: 75,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: COLORS.white,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topProductInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  topMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  orderId: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },

  // Delivery Banner
  deliveryBanner: {
    flexDirection: 'row',
    backgroundColor: '#EDE9DD',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
    gap: 10,
  },
  deliveryBannerDelayed: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  deliveryBannerContent: {
    flex: 1,
  },
  deliveryBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  deliveryBannerTitleDelayed: {
    color: '#B45309',
  },
  deliveryBannerDate: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  deliveryBannerReason: {
    fontSize: 12,
    color: '#92400E',
    marginTop: 4,
  },

  // Timeline
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expectedDeliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  expectedDeliveryText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '500',
  },
  delayBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    gap: 8,
  },
  delayText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
  },
  timelineContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
  },
  timelineStep: {
    flexDirection: 'row',
  },
  timelineLeft: {
    width: 28,
    alignItems: 'center',
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotCompleted: {
    backgroundColor: '#E6B800',
    borderColor: '#E6B800',
  },
  timelineDotCurrent: {
    backgroundColor: COLORS.white,
    borderColor: '#E6B800',
    borderWidth: 3,
  },
  timelineDotPending: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  timelineDotDelayed: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  currentDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E6B800',
  },
  timelineLine: {
    width: 2,
    height: 50,
    backgroundColor: '#E6B800',
    marginTop: 4,
  },
  timelineLineCompleted: {
    backgroundColor: '#E6B800',
  },
  timelineLinePending: {
    backgroundColor: '#E5E7EB',
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 24,
  },
  timelineMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  timelineTitleCompleted: {
    color: COLORS.textPrimary,
  },
  timelineTitleCurrent: {
    color: '#B45309',
    fontWeight: '700',
  },
  timelineTitlePending: {
    color: '#9CA3AF',
  },
  timelineTitleDelayed: {
    color: '#B45309',
  },
  timelineDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  timelineDescriptionPending: {
    color: '#9CA3AF',
  },
  timelineDate: {
    fontSize: 11,
    color: '#059669',
    marginTop: 4,
    fontWeight: '500',
  },
  timelineExpectedDate: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  timelineExpectedDateOverdue: {
    color: '#DC2626',
  },
  timelineNote: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  delayedBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  delayedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#B45309',
  },

  // Cancelled Box
  cancelledBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  cancelledTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.error,
    marginTop: 12,
  },
  cancelledReason: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  cancelledDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },

  // Items
  itemsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: COLORS.lightGray,
  },
  itemImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  // Details
  detailsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  detailDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 8,
    marginLeft: 30,
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  detailValuePhone: {
    fontSize: 13,
    color: COLORS.primary,
    marginTop: 4,
  },

  // Price
  priceContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  priceDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  priceTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  priceTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // Download Button
  downloadBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3EFE6',
    padding: 14,
    borderRadius: 12,
    marginTop: 6,
    gap: 8,
  },
  downloadBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  bottomSpacing: {
    height: 100,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: SPACING.screenPadding,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    borderColor: COLORS.error,
  },
  reorderButton: {
    flex: 1,
  },
});

export default OrderDetailScreen;