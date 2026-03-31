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
  credit_note: 'document-outline',
  other: 'ellipsis-horizontal-outline',
};

const PAYMENT_METHOD_LABELS = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  upi: 'UPI',
  credit: 'Credit',
  credit_note: 'Credit Note',
  other: 'Other',
};

const PaymentHistoryScreen = ({ navigation }) => {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    loadPayments(true);
  }, []);

  const loadPayments = async (refresh = false) => {
    const currentPage = refresh ? 1 : page;
    
    if (!refresh && !hasMore) return;
    if (!refresh && isLoadingMore) return;

    if (!refresh) setIsLoadingMore(true);

    try {
      const response = await paymentsAPI.getPayments({
        page: currentPage,
        limit: 20,
      });

      const newPayments = response.data?.payments || [];

      if (refresh) {
        setPayments(newPayments);
        setPage(2);
      } else {
        setPayments(prev => [...prev, ...newPayments]);
        setPage(currentPage + 1);
      }

      setHasMore(response.data?.pagination?.pages > currentPage);
      
      // Calculate total from all payments
      if (refresh && newPayments.length > 0) {
        const total = newPayments.reduce((sum, p) => 
          p.status === 'completed' ? sum + p.amount : sum, 0
        );
        setTotalAmount(total);
      }
    } catch (error) {
      console.error('Load payments error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setHasMore(true);
    loadPayments(true);
  };

  const handleEndReached = () => {
    if (!isLoading && !isLoadingMore && hasMore) {
      loadPayments(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return { bg: COLORS.successLight, text: COLORS.success };
      case 'pending':
        return { bg: COLORS.warningLight, text: COLORS.warning };
      case 'cancelled':
      case 'failed':
        return { bg: COLORS.errorLight, text: COLORS.error };
      default:
        return { bg: COLORS.grayLight, text: COLORS.gray };
    }
  };

  const renderPayment = ({ item }) => {
    const statusColors = getStatusColor(item.status);
    
    return (
      <Card style={styles.paymentCard}>
        <View style={styles.paymentHeader}>
          <View style={styles.paymentIcon}>
            <Ionicons 
              name={PAYMENT_METHOD_ICONS[item.method] || 'card-outline'} 
              size={20} 
              color={COLORS.primary} 
            />
          </View>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentNumber} numberOfLines={1}>
              {item.paymentNumber}
            </Text>
            <Text style={styles.paymentDate}>
              {formatDate(item.paymentDate, 'datetime')}
            </Text>
          </View>
          <View style={styles.paymentAmountContainer}>
            <Text style={styles.paymentAmount}>
              {formatCurrency(item.amount)}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
              <Text style={[styles.statusText, { color: statusColors.text }]}>
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
              {PAYMENT_METHOD_LABELS[item.method] || item.method}
            </Text>
          </View>
          {item.notes && (
            <Text style={styles.paymentNotes} numberOfLines={2}>
              {item.notes}
            </Text>
          )}
        </View>
      </Card>
    );
  };

  const renderHeader = () => {
    if (payments.length === 0) return null;
    
    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Payments</Text>
        <Text style={styles.summaryAmount}>{formatCurrency(totalAmount)}</Text>
        <Text style={styles.summaryCount}>{payments.length} transactions</Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <EmptyState
      icon="receipt-outline"
      title="No Payments Yet"
      message="Your payment history will appear here once payments are recorded"
    />
  );

  const renderFooter = () => {
    if (!isLoadingMore) return <View style={styles.footerSpacing} />;
    return (
      <View style={styles.loadingMore}>
        <Loading size="small" />
      </View>
    );
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
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
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
  summaryCard: {
    backgroundColor: COLORS.primary,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.cardPadding,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  summaryLabel: {
    ...FONTS.bodySmall,
    color: COLORS.black + 'CC',
  },
  summaryAmount: {
    ...FONTS.h1,
    color: COLORS.black,
    marginVertical: SPACING.xs,
  },
  summaryCount: {
    ...FONTS.caption,
    color: COLORS.black + 'AA',
  },
  paymentCard: {
    marginBottom: SPACING.sm,
    padding: SPACING.md,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentNumber: {
    ...FONTS.bodySmall,
    color: COLORS.textPrimary,
    fontWeight: '600',
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
    ...FONTS.body,
    color: COLORS.success,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: SPACING.xs,
    marginTop: 4,
  },
  statusText: {
    ...FONTS.caption,
    fontWeight: '600',
    textTransform: 'capitalize',
    fontSize: 10,
  },
  paymentDetails: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACING.sm,
    marginTop: SPACING.sm,
  },
  paymentDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  detailLabel: {
    ...FONTS.caption,
    color: COLORS.gray,
  },
  detailValue: {
    ...FONTS.caption,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  detailValueLink: {
    ...FONTS.caption,
    color: COLORS.primary,
    fontWeight: '600',
  },
  paymentNotes: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },
  loadingMore: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  footerSpacing: {
    height: SPACING.xl,
  },
});

export default PaymentHistoryScreen;