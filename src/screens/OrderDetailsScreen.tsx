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
import { CustomerStackParamList } from '../navigation/types';
import { useLocalization } from '../hooks/useLocalization';
import { ordersApi } from '../api/ordersApi';
import { Order, OrderStatus } from '../types/orders';
import { theme } from '../utils/theme';

type Props = NativeStackScreenProps<CustomerStackParamList, 'OrderDetails'>;

export const OrderDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();
  const { orderId, order: initialOrder } = route.params;

  const [order, setOrder] = useState<Order | null>(initialOrder || null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialOrder);

  useEffect(() => {
    if (!initialOrder) {
      ordersApi
        .getOrderById(orderId)
        .then((data) => setOrder(data))
        .catch((err) => console.warn('Failed to load order details:', err))
        .finally(() => setIsLoading(false));
    }
  }, [orderId, initialOrder]);

  const handleCallStore = (phone?: string) => {
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

  if (isLoading || !order) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  const badge = getStatusBadge(order.status);
  const dateFormatted = new Date(order.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{order.order_number}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.orderNumberTitle}>{order.order_number}</Text>
              <Text style={styles.orderDate}>{dateFormatted}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
              <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                {t(`orders.status.${order.status}` as any) || order.status}
              </Text>
            </View>
          </View>
          <Text style={styles.statusDesc}>
            {t(`orders.statusDesc.${order.status}` as any)}
          </Text>

          {/* Quick Track Action */}
          <TouchableOpacity
            style={styles.trackCta}
            onPress={() => navigation.navigate('OrderStatus', { orderId: order.id, order })}
          >
            <Text style={styles.trackCtaText}>📊 {t('orders.trackStatus')}</Text>
          </TouchableOpacity>
        </View>

        {/* Pickup Code Box */}
        <View style={styles.pickupCodeCard}>
          <Text style={styles.pickupCodeLabel}>{t('orderConfirmation.pickupCode')}</Text>
          <Text style={styles.pickupCodeValue}>{order.pickup_code}</Text>
          <Text style={styles.pickupCodeNotice}>
            {t('orderConfirmation.pickupCodeNotice')}
          </Text>
        </View>

        {/* Store Card */}
        <View style={styles.card}>
          <View style={styles.storeRow}>
            <View style={styles.storeIconWrap}>
              <Text style={styles.storeIcon}>🏬</Text>
            </View>
            <View style={styles.storeInfo}>
              <Text style={styles.storeLabel}>{t('orders.store')}</Text>
              <Text style={styles.storeName}>{order.shop_name}</Text>
              {order.shop_address ? (
                <Text style={styles.storeAddress}>{order.shop_address}</Text>
              ) : null}
            </View>
          </View>

          {order.shop_phone ? (
            <TouchableOpacity
              style={styles.callStoreBtn}
              onPress={() => handleCallStore(order.shop_phone)}
            >
              <Text style={styles.callStoreText}>📞 {t('orders.callStore')} ({order.shop_phone})</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Ordered Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {t('checkout.itemsSummary')} ({order.total_quantity} {t('orders.items')})
          </Text>

          {order.items.map((item, idx) => (
            <View key={item.product_id ? String(item.product_id) : String(idx)} style={styles.itemRow}>
              <View style={styles.itemMain}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemSub}>
                  {item.pricing_type === 'store_priced' && item.pricing_status === 'pending'
                    ? (item.unit ? `${item.unit} • Price decided at shop` : 'Price decided at shop')
                    : `${item.unit ? `${item.unit} • ` : ''}₹${item.price} each`}
                </Text>
              </View>
              <View style={styles.itemRight}>
                <Text style={styles.itemQty}>x{item.actual_quantity ? item.actual_quantity : item.quantity}</Text>
                <Text style={styles.itemTotal}>
                  {item.pricing_type === 'store_priced' && item.pricing_status === 'pending'
                    ? 'TBD'
                    : `₹${item.item_total}`}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Order Summary & Pricing */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('orders.summary')}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('checkout.subtotal')}</Text>
            <Text style={styles.summaryValue}>₹{order.subtotal}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('checkout.pickupFee')}</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.success }]}>
              {t('checkout.pickupFree')}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>{t('orders.total')}</Text>
            <Text style={styles.totalValue}>
              {order.has_pending_prices
                ? (order.estimated_total ? `Est. ~₹${order.estimated_total}` : 'Pending store weighing')
                : `₹${order.final_total ?? order.total}`}
            </Text>
          </View>
          {order.has_pending_prices ? (
            <View style={{ backgroundColor: '#FEF3C7', padding: 10, borderRadius: 8, marginTop: 8 }}>
              <Text style={{ fontSize: 12, color: '#92400E', fontWeight: '500' }}>
                ⚖️ Contains items weighed at the store. Final payable amount confirmed upon packing.
              </Text>
            </View>
          ) : null}
        </View>

        {/* Customer & Note */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('orders.customerInfo')}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('checkout.nameLabel')}</Text>
            <Text style={styles.summaryValue}>{order.customer_name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('checkout.phoneLabel')}</Text>
            <Text style={styles.summaryValue}>{order.customer_phone}</Text>
          </View>
          {order.customer_note ? (
            <View style={styles.noteBox}>
              <Text style={styles.noteTitle}>{t('orders.note')}:</Text>
              <Text style={styles.noteContent}>"{order.customer_note}"</Text>
            </View>
          ) : null}
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderNumberTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  orderDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  trackCta: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  trackCtaText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  pickupCodeCard: {
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#C7D2FE',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  pickupCodeLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#4338CA',
    marginBottom: 2,
  },
  pickupCodeValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1E1B4B',
    letterSpacing: 2,
    marginBottom: 4,
  },
  pickupCodeNotice: {
    fontSize: 12,
    color: '#4338CA',
    fontWeight: '500',
  },
  storeRow: {
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
  storeInfo: {
    flex: 1,
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
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  callStoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  itemMain: {
    flex: 1,
    paddingRight: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  itemSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemQty: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginRight: 14,
    fontWeight: '500',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    minWidth: 55,
    textAlign: 'right',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  noteBox: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
  },
  noteTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  noteContent: {
    fontSize: 13,
    fontStyle: 'italic',
    color: theme.colors.text,
    marginTop: 2,
  },
});
