import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CustomerStackParamList } from '../navigation/types';
import { useLocalization } from '../hooks/useLocalization';
import { ordersApi } from '../api/ordersApi';
import { Order, OrderStatus, PricingStatus, PaymentStatus } from '../types/orders';
import { theme } from '../utils/theme';

type Props = NativeStackScreenProps<CustomerStackParamList, 'OrderStatus'>;

interface StepInfo {
  status: OrderStatus;
  titleKey: string;
  icon: string;
  descKey: string;
}

const ORDER_STEPS: StepInfo[] = [
  {
    status: 'pending',
    titleKey: 'orders.status.pending',
    icon: '📝',
    descKey: 'orders.statusDesc.pending',
  },
  {
    status: 'accepted',
    titleKey: 'orders.status.accepted',
    icon: '✅',
    descKey: 'orders.statusDesc.accepted',
  },
  {
    status: 'preparing',
    titleKey: 'orders.status.preparing',
    icon: '📦',
    descKey: 'orders.statusDesc.preparing',
  },
  {
    status: 'ready_for_pickup',
    titleKey: 'orders.status.ready_for_pickup',
    icon: '🛍️',
    descKey: 'orders.statusDesc.ready_for_pickup',
  },
  {
    status: 'completed',
    titleKey: 'orders.status.completed',
    icon: '🎉',
    descKey: 'orders.statusDesc.completed',
  },
];

export const OrderStatusScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();
  const { orderId, order: initialOrder } = route.params;

  const [order, setOrder] = useState<Order | null>(initialOrder || null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialOrder);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const isFetchingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async (isSilent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!isSilent) setIsLoading(true);
    try {
      const data = await ordersApi.getOrderById(orderId);
      setOrder(data);
      if (['completed', 'cancelled', 'rejected'].includes(data.status)) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    } catch (err) {
      console.warn('Failed to refresh order status:', err);
    } finally {
      isFetchingRef.current = false;
      if (!isSilent) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [orderId]);

  useFocusEffect(
    useCallback(() => {
      fetchStatus(false);

      const isTerminal = order ? ['completed', 'cancelled', 'rejected'].includes(order.status) : false;
      if (!isTerminal) {
        timerRef.current = setInterval(() => {
          fetchStatus(true);
        }, 13000);
      }

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }, [fetchStatus, order?.status])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchStatus(false);
  };

  const handleCallStore = () => {
    if (order?.shop_phone) {
      Linking.openURL(`tel:${order.shop_phone.replace(/[^0-9+]/g, '')}`);
    }
  };

  const handleSimulateNextStep = async () => {
    if (!order) return;
    const lifecycle: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready_for_pickup', 'completed'];
    const currentIndex = lifecycle.indexOf(order.status);
    if (currentIndex < 0 || currentIndex >= lifecycle.length - 1) {
      Alert.alert('Status Demo', 'This order has reached its final state or was cancelled.');
      return;
    }

    const nextStatus = lifecycle[currentIndex + 1];
    setIsSimulating(true);
    try {
      const updated = await ordersApi.updateOrderStatus(order.id, nextStatus);
      setOrder(updated);
    } catch (err: any) {
      Alert.alert('Simulation Note', 'Updated locally for preview.');
      setOrder({ ...order, status: nextStatus });
    } finally {
      setIsSimulating(false);
    }
  };

  const getPricingBadge = (pricingStatus?: PricingStatus) => {
    switch (pricingStatus) {
      case 'pending_verification':
        return {
          bg: '#FEF3C7',
          text: '#B45309',
          border: '#FDE68A',
          label: t('orders.pricingStatus.pending_verification'),
        };
      case 'finalized':
        return {
          bg: '#ECFDF5',
          text: '#047857',
          border: '#A7F3D0',
          label: t('orders.pricingStatus.finalized'),
        };
      case 'fixed':
      default:
        return {
          bg: '#EFF6FF',
          text: '#1D4ED8',
          border: '#BFDBFE',
          label: t('orders.pricingStatus.fixed'),
        };
    }
  };

  const getPaymentBadge = (paymentStatus?: PaymentStatus) => {
    switch (paymentStatus) {
      case 'paid':
        return {
          bg: '#ECFDF5',
          text: '#047857',
          border: '#A7F3D0',
          label: t('orders.paymentStatus.paid'),
        };
      case 'payment_pending':
        return {
          bg: '#EEF2FF',
          text: '#4338CA',
          border: '#C7D2FE',
          label: t('orders.paymentStatus.payment_pending'),
        };
      case 'failed':
        return {
          bg: '#FEF2F2',
          text: '#B91C1C',
          border: '#FECACA',
          label: t('orders.paymentStatus.failed'),
        };
      case 'refunded':
        return {
          bg: '#F1F5F9',
          text: '#475569',
          border: '#CBD5E1',
          label: t('orders.paymentStatus.refunded'),
        };
      case 'unpaid':
      default:
        return {
          bg: '#FFFBEB',
          text: '#B45309',
          border: '#FDE68A',
          label: t('orders.paymentStatus.unpaid'),
        };
    }
  };

  if (isLoading || !order) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('orders.trackStatus')}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  const isCancelledOrRejected = order.status === 'cancelled' || order.status === 'rejected';
  const currentStepIndex = isCancelledOrRejected
    ? -1
    : ORDER_STEPS.findIndex((s) => s.status === order.status);

  const pricingBadge = getPricingBadge(order.pricing_status);
  const paymentBadge = getPaymentBadge(order.payment_status);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('orders.trackStatus')}</Text>
          <Text style={styles.headerSubtitle}>{order.order_number}</Text>
        </View>
        <TouchableOpacity
          style={styles.detailsHeaderBtn}
          onPress={() => navigation.navigate('OrderDetails', { orderId: order.id, order })}
        >
          <Text style={styles.detailsHeaderText}>{t('orders.viewDetails')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        {/* Cancelled / Rejected Alert */}
        {isCancelledOrRejected ? (
          <View style={styles.cancelledBox}>
            <Text style={styles.cancelledIcon}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cancelledTitle}>
                {t(`orders.status.${order.status}` as any)}
              </Text>
              <Text style={styles.cancelledDesc}>
                {t(`orders.statusDesc.${order.status}` as any)}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Live Pickup Code & Ready Banner */}
        <View style={styles.pickupHighlightCard}>
          <View style={styles.pickupHighlightHeader}>
            <View>
              <Text style={styles.pickupHighlightLabel}>{t('orderConfirmation.pickupCode')}</Text>
              <Text style={styles.pickupHighlightCode}>{order.pickup_code}</Text>
            </View>
            <View style={styles.pickupBadge}>
              <Text style={styles.pickupBadgeText}>
                {order.status === 'ready_for_pickup'
                  ? t('orders.tracking.readyBadge')
                  : t('orders.tracking.inProgressBadge')}
              </Text>
            </View>
          </View>
          <Text style={styles.pickupInstruction}>
            {order.status === 'ready_for_pickup'
              ? t('orders.tracking.readyNotice')
              : t('orders.tracking.inProgressNotice')}
          </Text>
        </View>

        {/* Order Summary & Pricing Synchronization Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryCardHeader}>
            <Text style={styles.summaryCardTitle}>{t('orders.summary')}</Text>
            <View style={styles.chipsRow}>
              <View
                style={[
                  styles.chipBadge,
                  { backgroundColor: pricingBadge.bg, borderColor: pricingBadge.border },
                ]}
              >
                <Text style={[styles.chipText, { color: pricingBadge.text }]}>
                  ⚖️ {pricingBadge.label}
                </Text>
              </View>
              <View
                style={[
                  styles.chipBadge,
                  { backgroundColor: paymentBadge.bg, borderColor: paymentBadge.border },
                ]}
              >
                <Text style={[styles.chipText, { color: paymentBadge.text }]}>
                  💳 {paymentBadge.label}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.amountRow}>
            <View>
              <Text style={styles.amountLabel}>
                {order.has_pending_prices
                  ? t('orders.tracking.estPayable')
                  : t('orders.tracking.finalPayable')}
              </Text>
              <Text style={styles.amountSubtext}>
                {order.item_count || order.items.length} {t('orders.items')}
              </Text>
            </View>
            <Text style={styles.amountValue}>
              {order.has_pending_prices
                ? (order.estimated_total ? `~₹${order.estimated_total}*` : t('orders.pricingStatus.pending_verification'))
                : `₹${order.final_total ?? order.total}`}
            </Text>
          </View>

          {/* Pricing Notices */}
          {order.has_pending_prices ? (
            <View style={styles.weighedNoticeBox}>
              <Text style={styles.weighedNoticeText}>
                {t('orders.tracking.estTotalNotice')}
              </Text>
            </View>
          ) : order.pricing_status === 'finalized' ? (
            <View style={styles.finalizedNoticeBox}>
              <Text style={styles.finalizedNoticeText}>
                {t('orders.tracking.finalTotalNotice')}
              </Text>
            </View>
          ) : null}

          {/* Payment Notice / Eligibility */}
          <View style={styles.paymentNoticeBox}>
            <Text style={styles.paymentNoticeIcon}>ℹ️</Text>
            <Text style={styles.paymentNoticeText}>
              {order.payment_eligibility?.notice || t('orders.tracking.payAtStoreNotice')}
            </Text>
          </View>
        </View>

        {/* Progress Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>{t('orders.orderTimeline')}</Text>

          {ORDER_STEPS.map((step, index) => {
            const isCompleted = !isCancelledOrRejected && index < currentStepIndex;
            const isCurrent = !isCancelledOrRejected && index === currentStepIndex;
            const isFuture = !isCancelledOrRejected && index > currentStepIndex;

            return (
              <View key={step.status} style={styles.stepContainer}>
                <View style={styles.timelineCol}>
                  <View
                    style={[
                      styles.stepDot,
                      isCompleted && styles.stepDotCompleted,
                      isCurrent && styles.stepDotCurrent,
                      isFuture && styles.stepDotFuture,
                    ]}
                  >
                    {isCompleted ? (
                      <Text style={styles.stepCheckmark}>✓</Text>
                    ) : (
                      <Text style={styles.stepIcon}>{step.icon}</Text>
                    )}
                  </View>
                  {index < ORDER_STEPS.length - 1 ? (
                    <View
                      style={[
                        styles.timelineLine,
                        isCompleted && styles.timelineLineCompleted,
                      ]}
                    />
                  ) : null}
                </View>

                <View style={styles.stepContent}>
                  <Text
                    style={[
                      styles.stepTitle,
                      isCurrent && styles.stepTitleCurrent,
                      isFuture && styles.stepTitleFuture,
                    ]}
                  >
                    {t(step.titleKey as any)}
                  </Text>
                  <Text style={styles.stepDesc}>{t(step.descKey as any)}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Store Contact Card */}
        <View style={styles.card}>
          <View style={styles.storeHeader}>
            <View style={styles.storeIconWrap}>
              <Text style={styles.storeIcon}>🏬</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.storeLabel}>{t('orders.store')}</Text>
              <Text style={styles.storeName}>{order.shop_name}</Text>
              {order.shop_address ? (
                <Text style={styles.storeAddress}>{order.shop_address}</Text>
              ) : null}
            </View>
          </View>

          {order.shop_phone ? (
            <TouchableOpacity style={styles.callStoreBtn} onPress={handleCallStore}>
              <Text style={styles.callStoreText}>📞 {t('orders.callStore')} ({order.shop_phone})</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Development Simulation Controller */}
        {order.status !== 'completed' && !isCancelledOrRejected ? (
          <View style={styles.simulationCard}>
            <Text style={styles.simulationTitle}>🧪 {t('orders.tracking.stageSimulation')}</Text>
            <Text style={styles.simulationSubtitle}>
              {t('orders.tracking.stageSimulationSubtitle')}
            </Text>
            <TouchableOpacity
              style={[styles.simulateBtn, isSimulating && styles.simulateBtnDisabled]}
              onPress={handleSimulateNextStep}
              disabled={isSimulating}
              activeOpacity={0.8}
            >
              {isSimulating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.simulateBtnText}>▶ {t('orders.simulateNext')}</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: theme.colors.text,
    fontWeight: '300',
    lineHeight: 32,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  detailsHeaderBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  detailsHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  cancelledBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  cancelledIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  cancelledTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 4,
  },
  cancelledDesc: {
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 16,
  },
  pickupHighlightCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#1E1B4B',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  pickupHighlightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  pickupHighlightLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#A5B4FC',
    marginBottom: 2,
  },
  pickupHighlightCode: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
  pickupBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pickupBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  pickupInstruction: {
    fontSize: 12,
    color: '#C7D2FE',
    lineHeight: 17,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chipBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  amountLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  amountSubtext: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  amountValue: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  weighedNoticeBox: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  weighedNoticeText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
    lineHeight: 16,
  },
  finalizedNoticeBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  finalizedNoticeText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
    lineHeight: 16,
  },
  paymentNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  paymentNoticeIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  paymentNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 16,
    fontWeight: '500',
  },
  timelineCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 18,
  },
  stepContainer: {
    flexDirection: 'row',
    minHeight: 64,
  },
  timelineCol: {
    alignItems: 'center',
    width: 36,
    marginRight: 12,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    zIndex: 2,
  },
  stepDotCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepDotCurrent: {
    backgroundColor: '#EEF2FF',
    borderColor: theme.colors.primary,
    borderWidth: 2.5,
  },
  stepDotFuture: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  stepCheckmark: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
  stepIcon: {
    fontSize: 14,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  timelineLineCompleted: {
    backgroundColor: '#10B981',
  },
  stepContent: {
    flex: 1,
    paddingBottom: 16,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  stepTitleCurrent: {
    color: theme.colors.primary,
    fontSize: 15,
  },
  stepTitleFuture: {
    color: '#94A3B8',
  },
  stepDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  storeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  storeIcon: {
    fontSize: 22,
  },
  storeLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  storeName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 2,
  },
  storeAddress: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  callStoreBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  callStoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  simulationCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  simulationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  simulationSubtitle: {
    fontSize: 12,
    color: '#78350F',
    marginBottom: 12,
    lineHeight: 16,
  },
  simulateBtn: {
    backgroundColor: '#D97706',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simulateBtnDisabled: {
    opacity: 0.6,
  },
  simulateBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
