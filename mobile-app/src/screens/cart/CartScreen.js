// src/screens/cart/CartScreen.js
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, SHADOWS } from '../../theme';
import { Button, EmptyState, Screen } from '../../components/common';
import { CartItemSkeleton } from '../../components/common/Skeleton';
import { CartItem } from '../../components/cart';
import { useCartStore } from '../../store';
import { formatCurrency } from '../../utils/helpers';

// ─── Confirm Dialog ───────────────────────────────────────────
const ConfirmDialog = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = COLORS.error,
  onConfirm,
  onCancel,
  icon,
  iconColor,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
    <Modal visible={visible} transparent animationType="fade">
      <View style={dialogStyles.overlay}>
        <Animated.View
          style={[
            dialogStyles.card,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {icon && (
            <View
              style={[
                dialogStyles.iconCircle,
                { backgroundColor: (iconColor || confirmColor) + '20' },
              ]}
            >
              <Ionicons
                name={icon}
                size={28}
                color={iconColor || confirmColor}
              />
            </View>
          )}
          <Text style={dialogStyles.title}>{title}</Text>
          <Text style={dialogStyles.message}>{message}</Text>

          <View style={dialogStyles.buttons}>
            <TouchableOpacity
              style={dialogStyles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={dialogStyles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                dialogStyles.confirmButton,
                { backgroundColor: confirmColor },
              ]}
              onPress={onConfirm}
              activeOpacity={0.7}
            >
              <Text style={dialogStyles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const dialogStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    ...SHADOWS.large,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  confirmButton: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
});

// ─── Cart Screen ──────────────────────────────────────────────
const CartScreen = ({ navigation }) => {
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.subtotal);
  const total = useCartStore((state) => state.total);
  const totalItems = useCartStore((state) => state.totalItems);
  const warnings = useCartStore((state) => state.warnings);
  const isLoading = useCartStore((state) => state.isLoading);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const clearCart = useCartStore((state) => state.clearCart);
  const validateCart = useCartStore((state) => state.validateCart);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    fetchCart();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCart();
    setIsRefreshing(false);
  };

  const handleClearCart = async () => {
    setShowClearDialog(false);
    try {
      await clearCart();
    } catch (error) {
      console.error('Clear cart error:', error);
    }
  };

  const handleCheckout = async () => {
    try {
      const validation = await validateCart();

      if (!validation.isValid) {
        setValidationErrors(validation.errors || []);
        setShowValidationError(true);
        return;
      }

      navigation.navigate('PlaceOrder');
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  const handleProductPress = (item) => {
    if (item.product && typeof item.product === 'object') {
      navigation.navigate('ProductDetail', { product: item.product });
    }
  };

  // ✅ Skeleton while loading
  if (isLoading && items.length === 0) {
    return (
      <Screen backgroundColor={COLORS.backgroundLight}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={COLORS.textPrimary}
            />
          </TouchableOpacity>
          <Text style={styles.title}>Cart</Text>
          <View style={styles.headerRight} />
        </View>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <CartItemSkeleton key={i} />
          ))}
        </ScrollView>
      </Screen>
    );
  }

  if (items.length === 0) {
    return (
      <Screen backgroundColor={COLORS.backgroundLight}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={COLORS.textPrimary}
            />
          </TouchableOpacity>
          <Text style={styles.title}>Cart</Text>
          <View style={styles.headerRight} />
        </View>
        <EmptyState
          icon="cart-outline"
          title="Your Cart is Empty"
          message="Looks like you haven't added any items to your cart yet"
          actionText="Start Shopping"
          onAction={() => navigation.navigate('Home')}
        />
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
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Cart ({totalItems})</Text>
        <TouchableOpacity onPress={() => setShowClearDialog(true)}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Warnings */}
      {warnings?.length > 0 && (
        <View style={styles.warningContainer}>
          {warnings.map((warning, index) => (
            <View key={index} style={styles.warningItem}>
              <Ionicons
                name="alert-circle"
                size={16}
                color={COLORS.warning}
              />
              <Text style={styles.warningText}>{warning}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Cart Items */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {items.map((item) => (
          <CartItem
            key={item._id}
            item={item}
            onPress={() => handleProductPress(item)}
          />
        ))}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Summary & Checkout */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(subtotal)}
            </Text>
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
        </View>

        <Button
          title="Proceed to Checkout"
          onPress={handleCheckout}
          loading={isLoading}
          icon={
            <Ionicons name="arrow-forward" size={20} color={COLORS.black} />
          }
          iconPosition="right"
        />
      </View>

      {/* ✅ Clear Cart Confirmation */}
      <ConfirmDialog
        visible={showClearDialog}
        title="Clear Cart?"
        message="This will remove all items from your cart. This action cannot be undone."
        confirmText="Clear Cart"
        cancelText="Keep Items"
        confirmColor={COLORS.error}
        icon="trash-outline"
        iconColor={COLORS.error}
        onConfirm={handleClearCart}
        onCancel={() => setShowClearDialog(false)}
      />

      {/* ✅ Validation Error Dialog */}
      <ConfirmDialog
        visible={showValidationError}
        title="Cart Issue"
        message={
          validationErrors.length > 0
            ? validationErrors.map((e) => e.error).join('\n')
            : 'Some items in your cart have issues.'
        }
        confirmText="OK"
        cancelText=""
        confirmColor={COLORS.primary}
        icon="alert-circle-outline"
        iconColor={COLORS.warning}
        onConfirm={() => setShowValidationError(false)}
        onCancel={() => setShowValidationError(false)}
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
  title: { ...FONTS.h4, color: COLORS.textPrimary },
  headerRight: { width: 40 },
  clearText: { ...FONTS.body, color: COLORS.error },
  warningContainer: {
    backgroundColor: COLORS.warningLight,
    padding: SPACING.md,
    margin: SPACING.screenPadding,
    borderRadius: SPACING.cardRadiusSmall,
    gap: SPACING.xs,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  warningText: { ...FONTS.caption, color: COLORS.warning, flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.screenPadding },
  bottomSpacing: { height: 20 },
  summaryContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.medium,
  },
  summaryCard: { marginBottom: SPACING.lg },
  summaryTitle: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  summaryLabel: { ...FONTS.body, color: COLORS.textSecondary },
  summaryValue: { ...FONTS.body, color: COLORS.textPrimary, fontWeight: '500' },
  summaryValueFree: { ...FONTS.body, color: COLORS.success, fontWeight: '500' },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  totalLabel: { ...FONTS.h4, color: COLORS.textPrimary },
  totalValue: { ...FONTS.priceLarge, color: COLORS.textPrimary },
});

export default CartScreen;