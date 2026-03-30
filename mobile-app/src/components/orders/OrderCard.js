// D:\yzo_ongoing\Tijara\mobile-app\src\components\orders\OrderCard.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, SHADOWS } from '../../theme';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../../utils/constants';

const OrderCard = ({ order, onPress }) => {
  const statusColor = ORDER_STATUS_COLORS[order.status] || COLORS.gray;
  const statusLabel = ORDER_STATUS_LABELS[order.status] || order.status;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.date}>{formatDate(order.createdAt, 'datetime')}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* Items Preview */}
      <View style={styles.itemsPreview}>
        <Text style={styles.itemsText} numberOfLines={2}>
          {order.items?.map(item => item.productSnapshot?.title || item.productTitle).join(', ')}
        </Text>
        <Text style={styles.itemsCount}>
          {order.totalItems || order.items?.length} items
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.deliveryInfo}>
          <Ionicons name="location-outline" size={14} color={COLORS.gray} />
          <Text style={styles.deliveryText} numberOfLines={1}>
            {order.deliveryAddress?.shopName || order.deliveryAddress?.city}
          </Text>
        </View>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>{formatCurrency(order.totalAmount)}</Text>
        </View>
      </View>

      {/* Payment Status */}
      {order.paymentStatus !== 'paid' && order.status !== 'cancelled' && (
        <View style={styles.paymentWarning}>
          <Ionicons name="alert-circle" size={14} color={COLORS.warning} />
          <Text style={styles.paymentWarningText}>
            {order.paymentStatus === 'partial' ? 'Partial Payment' : 'Payment Pending'}
          </Text>
        </View>
      )}

      {/* Arrow */}
      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.cardPadding,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  orderNumber: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  date: {
    ...FONTS.caption,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: SPACING.buttonRadius,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: SPACING.xs,
  },
  statusText: {
    ...FONTS.labelSmall,
    fontWeight: '600',
  },
  itemsPreview: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  itemsText: {
    ...FONTS.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  itemsCount: {
    ...FONTS.caption,
    color: COLORS.gray,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.md,
  },
  deliveryText: {
    ...FONTS.caption,
    color: COLORS.gray,
    marginLeft: SPACING.xs,
    flex: 1,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    ...FONTS.bodySmall,
    color: COLORS.gray,
    marginRight: SPACING.xs,
  },
  totalAmount: {
    ...FONTS.price,
    color: COLORS.textPrimary,
  },
  paymentWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.warningLight,
    borderRadius: SPACING.cardRadiusSmall,
  },
  paymentWarningText: {
    ...FONTS.caption,
    color: COLORS.warning,
    marginLeft: SPACING.xs,
  },
  arrowContainer: {
    position: 'absolute',
    right: SPACING.cardPadding,
    top: '50%',
    marginTop: -10,
  },
});

export default OrderCard;