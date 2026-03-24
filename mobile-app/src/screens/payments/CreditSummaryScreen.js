import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, SHADOWS } from '../../theme';
import { Loading, Card } from '../../components/common';
import { paymentsAPI } from '../../api';
import { formatCurrency, formatDate } from '../../utils/helpers';

const CreditSummaryScreen = ({ navigation }) => {
  const [creditSummary, setCreditSummary] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [outstandingOrders, setOutstandingOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [creditRes, outstandingRes] = await Promise.all([
        paymentsAPI.getCreditSummary(),
        paymentsAPI.getOutstandingPayments(),
      ]);

      setCreditSummary(creditRes.data?.creditSummary);
      setPaymentSummary(creditRes.data?.paymentSummary);
      setOutstandingOrders(outstandingRes.data?.orders || []);
    } catch (error) {
      console.error('Load credit summary error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  if (isLoading) {
    return <Loading fullScreen message="Loading credit summary..." />;
  }

  const utilizationPercentage = creditSummary?.creditUtilization || 0;

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
        <Text style={styles.title}>Credit Summary</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Credit Card */}
        <View style={styles.creditCard}>
          <View style={styles.creditHeader}>
            <Text style={styles.creditLabel}>Available Credit</Text>
            <View style={[
              styles.statusBadge,
              creditSummary?.isCreditBlocked && styles.statusBadgeBlocked
            ]}>
              <Text style={[
                styles.statusText,
                creditSummary?.isCreditBlocked && styles.statusTextBlocked
              ]}>
                {creditSummary?.isCreditBlocked ? 'Blocked' : 'Active'}
              </Text>
            </View>
          </View>
          <Text style={styles.creditAmount}>
            {formatCurrency(creditSummary?.availableCredit || 0)}
          </Text>
          
          <View style={styles.creditProgress}>
            <View 
              style={[
                styles.creditProgressBar, 
                { width: `${Math.min(utilizationPercentage, 100)}%` },
                utilizationPercentage > 80 && styles.creditProgressBarWarning
              ]} 
            />
          </View>

          <View style={styles.creditDetails}>
            <View style={styles.creditDetailItem}>
              <Text style={styles.creditDetailLabel}>Credit Limit</Text>
              <Text style={styles.creditDetailValue}>
                {formatCurrency(creditSummary?.creditLimit || 0)}
              </Text>
            </View>
            <View style={styles.creditDetailItem}>
              <Text style={styles.creditDetailLabel}>Pending Amount</Text>
              <Text style={[styles.creditDetailValue, { color: COLORS.warning }]}>
                {formatCurrency(creditSummary?.pendingAmount || 0)}
              </Text>
            </View>
            <View style={styles.creditDetailItem}>
              <Text style={styles.creditDetailLabel}>Utilization</Text>
              <Text style={styles.creditDetailValue}>{utilizationPercentage}%</Text>
            </View>
          </View>
        </View>

        {/* Credit Blocked Warning */}
        {creditSummary?.isCreditBlocked && (
          <View style={styles.blockedWarning}>
            <Ionicons name="warning" size={24} color={COLORS.error} />
            <View style={styles.blockedWarningContent}>
              <Text style={styles.blockedWarningTitle}>Credit Blocked</Text>
              <Text style={styles.blockedWarningReason}>
                {creditSummary.creditBlockedReason || 'Contact support for details'}
              </Text>
            </View>
          </View>
        )}

        {/* Payment Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Payments</Text>
            <Text style={styles.summaryValue}>
              {paymentSummary?.totalPayments || 0}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Paid</Text>
            <Text style={[styles.summaryValue, { color: COLORS.success }]}>
              {formatCurrency(creditSummary?.totalPaid || 0)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payment Terms</Text>
            <Text style={styles.summaryValue}>
              {creditSummary?.paymentTerms || 30} days
            </Text>
          </View>
          {paymentSummary?.lastPaymentDate && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Last Payment</Text>
              <Text style={styles.summaryValue}>
                {formatDate(paymentSummary.lastPaymentDate, 'short')}
              </Text>
            </View>
          )}
        </Card>

        {/* Outstanding Orders */}
        {outstandingOrders.length > 0 && (
          <View style={styles.outstandingSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Outstanding Payments ({outstandingOrders.length})
              </Text>
            </View>

            {outstandingOrders.slice(0, 5).map((order) => (
              <TouchableOpacity
                key={order._id}
                style={styles.outstandingItem}
                onPress={() => navigation.navigate('OrderDetail', { orderId: order._id })}
              >
                <View style={styles.outstandingLeft}>
                  <Text style={styles.outstandingOrderNumber}>
                    {order.orderNumber}
                  </Text>
                  <Text style={styles.outstandingDate}>
                    Due: {formatDate(order.dueDate, 'short')}
                  </Text>
                </View>
                <View style={styles.outstandingRight}>
                  <Text style={styles.outstandingAmount}>
                    {formatCurrency(order.outstanding)}
                  </Text>
                  {order.isOverdue && (
                    <View style={styles.overdueBadge}>
                      <Text style={styles.overdueText}>
                        {order.daysOverdue}d overdue
                      </Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
              </TouchableOpacity>
            ))}

            {outstandingOrders.length > 5 && (
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>
                  View All ({outstandingOrders.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Payment History Link */}
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('PaymentHistory')}
        >
          <Ionicons name="time-outline" size={22} color={COLORS.primary} />
          <Text style={styles.historyButtonText}>View Payment History</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.screenPadding,
  },
  creditCard: {
    backgroundColor: COLORS.cardDark,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.cardPadding,
    marginBottom: SPACING.lg,
  },
  creditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  creditLabel: {
    ...FONTS.bodySmall,
    color: COLORS.gray,
  },
  statusBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: SPACING.xs,
  },
  statusBadgeBlocked: {
    backgroundColor: COLORS.errorLight,
  },
  statusText: {
    ...FONTS.labelSmall,
    color: COLORS.success,
  },
  statusTextBlocked: {
    color: COLORS.error,
  },
  creditAmount: {
    ...FONTS.h1,
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  creditProgress: {
    height: 8,
    backgroundColor: COLORS.borderDark,
    borderRadius: 4,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  creditProgressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  creditProgressBarWarning: {
    backgroundColor: COLORS.warning,
  },
  creditDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  creditDetailItem: {
    alignItems: 'center',
  },
  creditDetailLabel: {
    ...FONTS.caption,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
  },
  creditDetailValue: {
    ...FONTS.body,
    color: COLORS.white,
    fontWeight: '600',
  },
  blockedWarning: {
    flexDirection: 'row',
    backgroundColor: COLORS.errorLight,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.cardPadding,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  blockedWarningContent: {
    flex: 1,
  },
  blockedWarningTitle: {
    ...FONTS.body,
    color: COLORS.error,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  blockedWarningReason: {
    ...FONTS.bodySmall,
    color: COLORS.error,
  },
  summaryCard: {
    marginBottom: SPACING.lg,
  },
  cardTitle: {
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
    fontWeight: '600',
  },
  outstandingSection: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  outstandingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.cardPadding,
    borderRadius: SPACING.cardRadius,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  outstandingLeft: {
    flex: 1,
  },
  outstandingOrderNumber: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  outstandingDate: {
    ...FONTS.caption,
    color: COLORS.gray,
    marginTop: 2,
  },
  outstandingRight: {
    alignItems: 'flex-end',
    marginRight: SPACING.sm,
  },
  outstandingAmount: {
    ...FONTS.price,
    color: COLORS.textPrimary,
  },
  overdueBadge: {
    backgroundColor: COLORS.errorLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: SPACING.xs,
    marginTop: SPACING.xs,
  },
  overdueText: {
    ...FONTS.caption,
    color: COLORS.error,
    fontSize: 10,
  },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  viewAllText: {
    ...FONTS.body,
    color: COLORS.primary,
    fontWeight: '500',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight + '30',
    paddingVertical: SPACING.md,
    borderRadius: SPACING.cardRadius,
    gap: SPACING.sm,
  },
  historyButtonText: {
    ...FONTS.body,
    color: COLORS.primary,
    fontWeight: '500',
    flex: 1,
    marginLeft: SPACING.sm,
  },
  bottomSpacing: {
    height: SPACING.xxxl,
  },
});

export default CreditSummaryScreen;