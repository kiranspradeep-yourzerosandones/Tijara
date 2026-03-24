import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, SHADOWS } from '../../theme';
import { Button, Loading, Card } from '../../components/common';
import { ordersAPI } from '../../api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../../utils/constants';

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

  const handleCallSupport = () => {
    Linking.openURL('tel:+919876543210');
  };

  const renderStatusTimeline = () => {
    const statuses = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];
    const currentIndex = statuses.indexOf(order.status);

    if (order.status === 'cancelled') {
      return (
        <View style={styles.cancelledContainer}>
          <Ionicons name="close-circle" size={48} color={COLORS.error} />
          <Text style={styles.cancelledText}>Order Cancelled</Text>
          {order.cancellation?.reason && (
            <Text style={styles.cancelledReason}>
              Reason: {order.cancellation.reason}
            </Text>
          )}
        </View>
      );
    }

    return (
      <View style={styles.timeline}>
        {statuses.map((status, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <View key={status} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View
                  style={[
                    styles.timelineDot,
                    isCompleted && styles.timelineDotCompleted,
                    isCurrent && styles.timelineDotCurrent,
                  ]}
                >
                  {isCompleted && (
                    <Ionicons name="checkmark" size={12} color={COLORS.white} />
                  )}
                </View>
                {index < statuses.length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      isCompleted && index < currentIndex && styles.timelineLineCompleted,
                    ]}
                  />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text
                  style={[
                    styles.timelineStatus,
                    isCompleted && styles.timelineStatusCompleted,
                    isCurrent && styles.timelineStatusCurrent,
                  ]}
                >
                  {ORDER_STATUS_LABELS[status]}
                </Text>
                {isCurrent && order.statusHistory && (
                  <Text style={styles.timelineDate}>
                    {formatDate(order.statusHistory[order.statusHistory.length - 1]?.timestamp, 'datetime')}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  if (isLoading) {
    return <Loading fullScreen message="Loading order..." />;
  }

  if (!order) {
    return null;
  }

  const statusColor = ORDER_STATUS_COLORS[order.status] || COLORS.gray;

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
        <View style={styles.headerCenter}>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.orderDate}>{formatDate(order.createdAt, 'datetime')}</Text>
        </View>
        <TouchableOpacity
          style={styles.helpButton}
          onPress={handleCallSupport}
        >
          <Ionicons name="call-outline" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {ORDER_STATUS_LABELS[order.status]}
              </Text>
            </View>
            <Text style={styles.totalAmount}>{formatCurrency(order.totalAmount)}</Text>
          </View>

          {renderStatusTimeline()}
        </Card>

        {/* Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <Card style={styles.itemsCard}>
            {order.items?.map((item, index) => (
              <View
                key={item._id}
                style={[
                  styles.orderItem,
                  index < order.items.length - 1 && styles.orderItemBorder,
                ]}
              >
                <View style={styles.orderItemInfo}>
                  <Text style={styles.orderItemTitle} numberOfLines={2}>
                    {item.productSnapshot?.title}
                  </Text>
                  <Text style={styles.orderItemMeta}>
                    {formatCurrency(item.unitPrice)} × {item.quantity} {item.productSnapshot?.unit}
                  </Text>
                </View>
                <Text style={styles.orderItemSubtotal}>
                  {formatCurrency(item.subtotal)}
                </Text>
              </View>
            ))}
          </Card>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <Card>
            <View style={styles.addressHeader}>
              <View style={styles.addressLabelBadge}>
                <Text style={styles.addressLabelText}>
                  {order.deliveryAddress?.label}
                </Text>
              </View>
            </View>
            <Text style={styles.shopName}>{order.deliveryAddress?.shopName}</Text>
            <Text style={styles.addressText}>
              {order.deliveryAddress?.addressLine1}
              {order.deliveryAddress?.addressLine2 && `, ${order.deliveryAddress.addressLine2}`}
            </Text>
            <Text style={styles.addressText}>
              {order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}
            </Text>
            <Text style={styles.contactText}>
              📞 {order.deliveryAddress?.contactPhone}
            </Text>
          </Card>
        </View>

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <Card>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCurrency(order.subtotal)}</Text>
            </View>
            {order.discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                  -{formatCurrency(order.discount)}
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text style={[styles.summaryValue, { color: COLORS.success }]}>FREE</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.totalAmount)}</Text>
            </View>
            <View style={[styles.paymentStatusBadge, {
              backgroundColor: order.paymentStatus === 'paid' ? COLORS.successLight : COLORS.warningLight,
            }]}>
              <Ionicons
                name={order.paymentStatus === 'paid' ? 'checkmark-circle' : 'time'}
                size={16}
                color={order.paymentStatus === 'paid' ? COLORS.success : COLORS.warning}
              />
              <Text style={[styles.paymentStatusText, {
                color: order.paymentStatus === 'paid' ? COLORS.success : COLORS.warning,
              }]}>
                {order.paymentStatus === 'paid' ? 'Paid' : 
                 order.paymentStatus === 'partial' ? 'Partially Paid' : 'Payment Pending'}
              </Text>
            </View>
          </Card>
        </View>

        {/* Customer Notes */}
        {order.customerNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Notes</Text>
            <Card>
              <Text style={styles.notesText}>{order.customerNotes}</Text>
            </Card>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        {order.canCancel && (
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
          <Button
            title="Reorder"
            onPress={handleReorder}
            style={styles.reorderButton}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  orderNumber: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  orderDate: {
    ...FONTS.caption,
    color: COLORS.gray,
    marginTop: 2,
  },
  helpButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.screenPadding,
  },
  statusCard: {
    marginBottom: SPACING.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: SPACING.buttonRadius,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  statusText: {
    ...FONTS.label,
    fontWeight: '600',
  },
  totalAmount: {
    ...FONTS.priceLarge,
    color: COLORS.textPrimary,
  },
  timeline: {
    paddingLeft: SPACING.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 50,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 24,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  timelineDotCompleted: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  timelineDotCurrent: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  timelineLineCompleted: {
    backgroundColor: COLORS.success,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  timelineStatus: {
    ...FONTS.body,
    color: COLORS.gray,
  },
  timelineStatusCompleted: {
    color: COLORS.textPrimary,
  },
  timelineStatusCurrent: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  timelineDate: {
    ...FONTS.caption,
    color: COLORS.gray,
    marginTop: 2,
  },
  cancelledContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  cancelledText: {
    ...FONTS.h4,
    color: COLORS.error,
    marginTop: SPACING.sm,
  },
  cancelledReason: {
    ...FONTS.bodySmall,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
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
    ...FONTS.body,
    color: COLORS.textPrimary,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  orderItemMeta: {
    ...FONTS.caption,
    color: COLORS.gray,
  },
  orderItemSubtotal: {
    ...FONTS.price,
    color: COLORS.textPrimary,
  },
  addressHeader: {
    marginBottom: SPACING.sm,
  },
  addressLabelBadge: {
    backgroundColor: COLORS.primaryLight + '30',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: SPACING.xs,
    alignSelf: 'flex-start',
  },
  addressLabelText: {
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
  addressText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  contactText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    ...FONTS.body,
    color: COLORS.textPrimary,
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
  paymentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: SPACING.cardRadiusSmall,
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  paymentStatusText: {
    ...FONTS.label,
    fontWeight: '600',
  },
  notesText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
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