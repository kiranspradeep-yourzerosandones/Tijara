import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, SHADOWS } from '../../theme';
import { Button, Loading, EmptyState } from '../../components/common';
import { CartItem } from '../../components/cart';
import { useCartStore } from '../../store';
import { formatCurrency } from '../../utils/helpers';

const CartScreen = ({ navigation }) => {
  const {
    items,
    subtotal,
    total,
    totalItems,
    warnings,
    isLoading,
    fetchCart,
    clearCart,
    validateCart,
  } = useCartStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCart();
    setIsRefreshing(false);
  };

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearCart();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleCheckout = async () => {
    try {
      const validation = await validateCart();
      
      if (!validation.isValid) {
        const errorMessages = validation.errors?.map(e => e.error).join('\n');
        Alert.alert('Cart Validation Failed', errorMessages);
        return;
      }

      navigation.navigate('PlaceOrder');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleProductPress = (item) => {
    if (item.product && typeof item.product === 'object') {
      navigation.navigate('ProductDetail', { product: item.product });
    }
  };

  if (isLoading && items.length === 0) {
    return <Loading fullScreen message="Loading cart..." />;
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
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
      </SafeAreaView>
    );
  }

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
        <Text style={styles.title}>Cart ({totalItems})</Text>
        <TouchableOpacity onPress={handleClearCart}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Warnings */}
      {warnings?.length > 0 && (
        <View style={styles.warningContainer}>
          {warnings.map((warning, index) => (
            <View key={index} style={styles.warningItem}>
              <Ionicons name="alert-circle" size={16} color={COLORS.warning} />
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
        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>

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
        </View>

        {/* Checkout Button */}
        <Button
          title="Proceed to Checkout"
          onPress={handleCheckout}
          loading={isLoading}
          icon={<Ionicons name="arrow-forward" size={20} color={COLORS.black} />}
          iconPosition="right"
        />
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
  clearText: {
    ...FONTS.body,
    color: COLORS.error,
  },
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
  warningText: {
    ...FONTS.caption,
    color: COLORS.warning,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.screenPadding,
  },
  bottomSpacing: {
    height: 20,
  },
  summaryContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.medium,
  },
  summaryCard: {
    marginBottom: SPACING.lg,
  },
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
  summaryLabel: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    fontWeight: '500',
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
});

export default CartScreen;