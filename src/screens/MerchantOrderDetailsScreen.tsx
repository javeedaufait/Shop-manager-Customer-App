import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MerchantStackParamList } from '../navigation/types';
import { useLocalization } from '../hooks/useLocalization';
import { merchantApi } from '../api/merchantApi';
import { Order, OrderStatus } from '../types/orders';
import { theme } from '../utils/theme';

type Props = NativeStackScreenProps<MerchantStackParamList, 'MerchantOrderDetails'>;

export const MerchantOrderDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();
  const { orderId, order: initialOrder } = route.params;

  const [order, setOrder] = useState<Order | null>(initialOrder || null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialOrder);

  useEffect(() => {
    if (!initialOrder) {
      merchantApi
        .getOrderDetail(orderId)
        .then((data) => setOrder(data))
        .catch((err) => console.warn('Failed to load merchant order details:', err))
        .finally(() => setIsLoading(false));
    }
  }, [orderId, initialOrder]);

  const handleCallCustomer = (phone?: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'ready_for_pickup':
        return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' };
      case 'preparing':
        return { bg: '#EEF2FF', text: '#4F46E5', border: '#C7D2FE' };
      case 'accepted':
        return { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' };
      case 'completed':
        return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
      case 'cancelled':
      case 'rejected':
        return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' };
      case 'pending':
      default:
        return { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' };
    }
  };

  const getPricingBadge = (orderObj: Order) => {
    if (orderObj.pricing_status === 'finalized') {
      return { label: t('merchantOrders.badges.finalized'), bg: '#ECFDF5', text: '#059669' };
    }
    if (orderObj.has_pending_prices || orderObj.pricing_status === 'pending_verification') {
      return { label: t('merchantOrders.badges.store_priced'), bg: '#FFF7ED', text: '#EA580C' };
    }
    return { label: t('merchantOrders.badges.fixed'), bg: '#F8FAFC', text: '#64748B' };
  };

  const getPaymentBadge = (status?: string) => {
    if (status === 'paid') {
      return { label: t('merchantOrders.badges.paid'), bg: '#ECFDF5', text: '#16A34A' };
    }
    return { label: t('merchantOrders.badges.unpaid'), bg: '#FEF2F2', text: '#DC2626' };
  };

  if (isLoading || !order) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('merchantOrders.orderDetails')}</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  const badge = getStatusBadge(order.status);
  const pricingBadge = getPricingBadge(order);
  const paymentBadge = getPaymentBadge(order.payment_status);

  const dateFormatted = new Date(order.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isEstimated = order.has_pending_prices || order.pricing_status === 'pending_verification';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{order.order_number}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Pickup Code Verification Card */}
        <View style={styles.pickupCard}>
          <Text style={styles.pickupHeaderLabel}>{t('merchantOrders.pickupCode')}</Text>
          <Text style={styles.pickupCodeLarge}>{order.pickup_code}</Text>
          <Text style={styles.pickupNotice}>{t('merchantOrders.pickupCodeInstruction')}</Text>
        </View>

        {/* Statuses Row Card */}
        <View style={styles.card}>
          <View style={styles.statusBadgesRow}>
            <View
              style={[
                styles.badgePill,
                { backgroundColor: badge.bg, borderColor: badge.border },
              ]}
            >
              <Text style={[styles.badgeText, { color: badge.text }]}>
                {t(`orders.status.${order.status}` as any) || order.status}
              </Text>
            </View>

            <View style={[styles.badgePill, { backgroundColor: pricingBadge.bg, borderColor: '#E2E8F0' }]}>
              <Text style={[styles.badgeText, { color: pricingBadge.text }]}>
                {pricingBadge.label}
              </Text>
            </View>

            <View style={[styles.badgePill, { backgroundColor: paymentBadge.bg, borderColor: '#E2E8F0' }]}>
              <Text style={[styles.badgeText, { color: paymentBadge.text }]}>
                {paymentBadge.label}
              </Text>
            </View>
          </View>
          <Text style={styles.timestampText}>{dateFormatted}</Text>
        </View>

        {/* Customer Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardSectionTitle}>{t('merchantOrders.customer')}</Text>
            {!!order.customer_phone && (
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => handleCallCustomer(order.customer_phone)}
              >
                <Text style={styles.callButtonText}>📞 {t('merchantOrders.callCustomer')}</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.customerDetailRow}>
            <Text style={styles.customerNameLarge}>{order.customer_name}</Text>
            <Text style={styles.customerPhoneLarge}>{order.customer_phone}</Text>
          </View>
          {!!order.customer_note && (
            <View style={styles.noteBox}>
              <Text style={styles.noteLabel}>{t('orders.note')}:</Text>
              <Text style={styles.noteText}>{order.customer_note}</Text>
            </View>
          )}
        </View>

        {/* Line Items Snapshot List */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>
            {t('merchantOrders.orderItems')} ({order.items.length})
          </Text>
          <View style={styles.itemsList}>
            {order.items.map((item, idx) => {
              const isProduce = item.pricing_type === 'store_priced';
              return (
                <View key={idx} style={styles.itemRow}>
                  <View style={styles.itemInfoCol}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View style={styles.itemMetaRow}>
                      <Text style={styles.itemQtyText}>
                        Qty: {item.requested_quantity || item.quantity} {item.unit || ''}
                      </Text>
                      {isProduce ? (
                        <View style={styles.produceBadge}>
                          <Text style={styles.produceBadgeText}>
                            ⚖️ {t('merchantOrders.badges.store_priced')}
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.itemPriceRate}>@ ₹{Number(item.price || 0).toFixed(2)}</Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.itemLineTotal}>
                    {isProduce ? (
                      <Text style={styles.producePendingText}>At Shop</Text>
                    ) : (
                      `₹${Number(item.item_total || 0).toFixed(2)}`
                    )}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Order Summary & Totals */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>{t('merchantOrders.orderSummary')}</Text>

          {isEstimated && (
            <View style={styles.produceNoticeBox}>
              <Text style={styles.produceNoticeText}>
                ⚠️ {t('merchantOrders.produceNotice')}
              </Text>
            </View>
          )}

          {typeof order.fixed_items_subtotal === 'number' && isEstimated && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('merchantOrders.fixedSubtotal')}</Text>
              <Text style={styles.summaryValue}>
                ₹{Number(order.fixed_items_subtotal).toFixed(2)}
              </Text>
            </View>
          )}

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalRowLabel}>
              {isEstimated ? t('merchantOrders.estTotal') : t('merchantOrders.finalTotal')}
            </Text>
            <Text style={styles.totalRowValue}>
              ₹{Number(order.total || 0).toFixed(2)}
              {isEstimated && <Text style={styles.asteriskText}>*</Text>}
            </Text>
          </View>
        </View>

        {/* Action Phase Notice */}
        <View style={styles.phaseNoticeBox}>
          <Text style={styles.phaseNoticeTitle}>ℹ️ APP-8.1 Foundation Scope</Text>
          <Text style={styles.phaseNoticeDesc}>
            Order inspection is active. Order fulfillment actions (Accept, Reject, Produce Weighing & Finalization) will be enabled in APP-8.2.
          </Text>
        </View>
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  backIcon: {
    fontSize: 26,
    color: '#1E293B',
    lineHeight: 28,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupCard: {
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  pickupHeaderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#93C5FD',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pickupCodeLarge: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  pickupNotice: {
    fontSize: 12,
    color: '#DBEAFE',
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  statusBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timestampText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  callButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  callButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  customerDetailRow: {
    gap: 2,
  },
  customerNameLarge: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  customerPhoneLarge: {
    fontSize: 13,
    color: '#64748B',
  },
  noteBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    marginTop: 4,
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  noteText: {
    fontSize: 13,
    color: '#92400E',
    marginTop: 2,
  },
  itemsList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemInfoCol: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemQtyText: {
    fontSize: 12,
    color: '#64748B',
  },
  itemPriceRate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  produceBadge: {
    backgroundColor: '#FFF7ED',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  produceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EA580C',
  },
  itemLineTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 12,
  },
  producePendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EA580C',
  },
  produceNoticeBox: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    borderRadius: 8,
    padding: 10,
  },
  produceNoticeText: {
    fontSize: 12,
    color: '#9A3412',
    lineHeight: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    marginTop: 4,
  },
  totalRowLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalRowValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  asteriskText: {
    color: '#EA580C',
  },
  phaseNoticeBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 14,
    gap: 4,
    marginBottom: 20,
  },
  phaseNoticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  phaseNoticeDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
});
