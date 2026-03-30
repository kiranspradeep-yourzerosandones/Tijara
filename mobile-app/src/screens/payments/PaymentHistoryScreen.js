// src/screens/payments/PaymentHistoryScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../../theme';
import { Loading, EmptyState, Card, Screen } from '../../components/common';
import { paymentsAPI } from '../../api';
import { formatCurrency, formatDate } from '../../utils/helpers';

const PAYMENT_METHOD_ICONS = {
  cash: 'cash-outline',
  bank_transfer: 'business-outline',
  cheque: 'document-text-outline',
  upi: 'phone-portrait-outline',
  credit: 'card-outline',
  other: 'ellipsis-horizontal-outline',
};

const PaymentHistoryScreen = ({ navigation }) => {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadPayments(true);
  }, []);

  const loadPayments = async (refresh = false) => {
    const currentPage = refresh ? 1 : page;
    
    if (!refresh && !hasMore) return;

    try {
      const response = await paymentsAPI.getPayments({
        page: currentPage,
        limit: 20,
      });

      const newPayments = response.data?.payments || [];

      if (refresh) {
        setPayments(newPayments);
      } else {
        setPayments(prev => [...prev, ...newPayments]);
      }

      setHasMore(response.data?.pagination?.pages > currentPage);
      setPage(currentPage + 1);
    } catch (error) {
      console.error('Load payments error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setPage(1);
    setHasMore(true);
    loadPayments(true);
  };

  const handleEndReached = () => {
    if (!isLoading && hasMore) {
      loadPayments(false);
    }
  };

  const renderPayment = ({ item }) => (
    <Card style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentIcon}>
          <Ionicons 
            name={PAYMENT_METHOD_ICONS[item.method] || 'card-outline'} 
            size={22} 
            color={COLORS.primary} 
          />
        </View>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentNumber}>{item.paymentNumber}</Text>
          <Text style={styles.paymentDate}>
            {formatDate(item.paymentDate, 'datetime')}
          </Text>
        </View>
        <View style={styles.paymentAmountContainer}>
          <Text style={styles.paymentAmount}>
            {formatCurrency(item.amount)}
          </Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.status === 'completed' ? COLORS.successLight : COLORS.warningLight }
          ]}>
            <Text style={[
              styles.statusText,
              { color: item.status === 'completed' ? COLORS.success : COLORS.warning }
            ]}>
              {item.status}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.paymentDetails}>
        <View style={styles.paymentDetailRow}>
          <Text style={styles.detailLabel}>Order</Text>
          <TouchableOpacity
            onPress={() => {
              if (item.order?._id) {
                navigation.navigate('OrderDetail', { orderId: item.order._id });
              }
            }}
          >
            <Text style={styles.detailValueLink}>
              {item.order?.orderNumber || item.orderNumber}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.paymentDetailRow}>
          <Text style={styles.detailLabel}>Method</Text>
          <Text style={styles.detailValue}>
            {item.method?.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        {item.notes && (
          <Text style={styles.paymentNotes}>{item.notes}</Text>
        )}
      </View>
    </Card>
  );

  const renderEmpty = () => (
    <EmptyState
      icon="receipt-outline"
      title="No Payments Yet"
      message="Your payment history will appear here"
    />
  );

  const renderFooter = () => {
    if (!isLoading || payments.length === 0) return null;
    return <Loading size="small" />;
  };

  if (isLoading && payments.length === 0) {
    return (
      <Screen backgroundColor={COLORS.backgroundLight}>
        <Loading fullScreen message="Loading payments..." />
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
        <Text style={styles.title}>Payment History</Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={payments}
        renderItem={renderPayment}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
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
  title: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  headerRight: {
    width: 40,
  },
  listContent: {
    padding: SPACING.screenPadding,
    paddingBottom: SPACING.xxxl,
  },
  paymentCard: {
    marginBottom: SPACING.md,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  paymentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentNumber: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  paymentDate: {
    ...FONTS.caption,
    color: COLORS.gray,
    marginTop: 2,
  },
  paymentAmountContainer: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    ...FONTS.price,
    color: COLORS.success,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: SPACING.xs,
    marginTop: SPACING.xs,
  },
  statusText: {
    ...FONTS.caption,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  paymentDetails: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACING.md,
  },
  paymentDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  detailLabel: {
    ...FONTS.bodySmall,
    color: COLORS.gray,
  },
  detailValue: {
    ...FONTS.bodySmall,
    color: COLORS.textPrimary,
  },
  detailValueLink: {
    ...FONTS.bodySmall,
    color: COLORS.primary,
    fontWeight: '500',
  },
  paymentNotes: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: SPACING.sm,
  },
});

export default PaymentHistoryScreen;