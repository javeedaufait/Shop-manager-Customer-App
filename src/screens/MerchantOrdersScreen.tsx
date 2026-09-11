import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { MerchantStackParamList } from '../navigation/types';
import { useLocalization } from '../hooks/useLocalization';
import { useAuth } from '../hooks/useAuth';
import { merchantApi } from '../api/merchantApi';
import { Order, OrderStatus } from '../types/orders';
import { theme } from '../utils/theme';
import { notificationService } from '../services/notificationService';

type Props = NativeStackScreenProps<MerchantStackParamList, 'MerchantOrders'>;

type TabType = 'all' | 'pending' | 'preparing' | 'ready_for_pickup' | 'completed';

export const MerchantOrdersScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();
  const { user } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pricingFilter, setPricingFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      // Fetch merchant orders from API
      const resp = await merchantApi.getOrders({
        search: searchQuery.trim() || undefined,
        fulfillment_status: activeTab !== 'all' ? activeTab : undefined,
        pricing_status: pricingFilter !== 'all' ? pricingFilter : undefined,
        payment_status: paymentFilter !== 'all' ? paymentFilter : undefined,
        limit: 100,
      });
      setOrders(resp.orders || []);
    } catch (err) {
      console.warn('Failed to load merchant orders:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, activeTab, pricingFilter, paymentFilter]);

  // Refresh when screen gains focus (e.g. returning from Order Details)
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      fetchOrders();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  // Listen for real-time foreground order notifications
  useEffect(() => {
    const unsubscribe = notificationService.subscribeToForegroundNotifications((notification) => {
      const data = notification?.request?.content?.data;
      const role = data?.target_role || data?.user_type;
      const type = data?.type;
      if (role === 'merchant' || type === 'merchant_new_order') {
        fetchOrders();
        setToastNotice(t('notifications.ordersUpdatedToast'));
        const timer = setTimeout(() => {
          setToastNotice(null);
        }, 4000);
        return () => clearTimeout(timer);
      }
    });
    return () => unsubscribe();
  }, [fetchOrders, t]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchOrders();
  };

  /**
   * Client-side filter guarantees that tabs and chips filter instantaneously
   * and stay resilient even if the remote staging server backend hasn't finished syncing.
   */
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderStatus = (order.fulfillment_status || order.status || 'pending').toLowerCase();

      // 1. Tab / Fulfillment Status Filter
      if (activeTab === 'pending') {
        if (orderStatus !== 'pending' && orderStatus !== 'accepted') {
          return false;
        }
      } else if (activeTab === 'preparing') {
        if (orderStatus !== 'preparing') {
          return false;
        }
      } else if (activeTab === 'ready_for_pickup') {
        if (orderStatus !== 'ready_for_pickup' && orderStatus !== 'ready') {
          return false;
        }
      } else if (activeTab === 'completed') {
        if (!['completed', 'cancelled', 'rejected'].includes(orderStatus)) {
          return false;
        }
      }

      // 2. Pricing Status Filter
      const isStorePriced =
        order.has_pending_prices ||
        order.pricing_status === 'pending_verification' ||
        (Array.isArray(order.items) && order.items.some((i) => i.pricing_type === 'store_priced'));

      if (pricingFilter === 'store_priced' && !isStorePriced) {
        return false;
      }
      if (pricingFilter === 'fixed' && isStorePriced) {
        return false;
      }

      // 3. Payment Status Filter
      const isPaid = order.payment_status === 'paid';
      if (paymentFilter === 'paid' && !isPaid) {
        return false;
      }
      if (paymentFilter === 'unpaid' && isPaid) {
        return false;
      }

      // 4. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const orderNum = (order.order_number || '').toLowerCase();
        const pickup = (order.pickup_code || '').toLowerCase();
        const custName = (order.customer_name || '').toLowerCase();
        const custPhone = (order.customer_phone || '').toLowerCase();

        if (
          !orderNum.includes(q) &&
          !pickup.includes(q) &&
          !custName.includes(q) &&
          !custPhone.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [orders, activeTab, pricingFilter, paymentFilter, searchQuery]);

  const getStatusBadgeStyle = (status: OrderStatus) => {
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

  const getPricingBadge = (order: Order) => {
    if (order.pricing_status === 'finalized') {
      return { label: t('merchantOrders.badges.finalized'), bg: '#ECFDF5', text: '#059669' };
    }
    const isStorePriced =
      order.has_pending_prices ||
      order.pricing_status === 'pending_verification' ||
      (Array.isArray(order.items) && order.items.some((i) => i.pricing_type === 'store_priced'));

    if (isStorePriced) {
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

  const tabs: { key: TabType; label: string }[] = [
    { key: 'all', label: t('merchantOrders.tabs.all') },
    { key: 'pending', label: t('merchantOrders.tabs.pending') },
    { key: 'preparing', label: t('merchantOrders.tabs.preparing') },
    { key: 'ready_for_pickup', label: t('merchantOrders.tabs.ready') },
    { key: 'completed', label: t('merchantOrders.tabs.completed') },
  ];

  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusBadge = getStatusBadgeStyle(item.status);
    const pricingBadge = getPricingBadge(item);
    const paymentBadge = getPaymentBadge(item.payment_status);

    const dateFormatted = new Date(item.created_at).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const isEstimated =
      item.has_pending_prices ||
      item.pricing_status === 'pending_verification' ||
      (Array.isArray(item.items) && item.items.some((i) => i.pricing_type === 'store_priced'));

    return (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('MerchantOrderDetails', { orderId: item.id, order: item })}
      >
        {/* Card Header: Order Number & Pickup Badge */}
        <View style={styles.cardTopRow}>
          <View style={styles.orderIdBlock}>
            <Text style={styles.orderNumber}>{item.order_number}</Text>
            <Text style={styles.dateText}>{dateFormatted}</Text>
          </View>
          <View style={styles.pickupCodeBadge}>
            <Text style={styles.pickupCodeLabel}>PICKUP</Text>
            <Text style={styles.pickupCodeText}>{item.pickup_code}</Text>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.customerRow}>
          <View style={styles.customerAvatar}>
            <Text style={styles.customerAvatarText}>
              {(item.customer_name || 'C').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.customerMeta}>
            <Text style={styles.customerName}>{item.customer_name}</Text>
            <Text style={styles.customerPhone}>{item.customer_phone}</Text>
          </View>
          <View style={styles.itemsBadge}>
            <Text style={styles.itemsCountText}>
              {item.item_count || item.items?.length || 0} {t('orders.items')}
            </Text>
          </View>
        </View>

        {/* 3-Tier Badges */}
        <View style={styles.badgesRow}>
          <View
            style={[
              styles.badgePill,
              { backgroundColor: statusBadge.bg, borderColor: statusBadge.border },
            ]}
          >
            <Text style={[styles.badgeText, { color: statusBadge.text }]}>
              {t(`orders.status.${item.status}` as any) || item.status}
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

        {/* Card Footer: Order Total & CTA */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.totalLabel}>
              {isEstimated ? t('merchantOrders.estTotal') : t('merchantOrders.finalTotal')}
            </Text>
            <Text style={styles.totalValue}>
              ₹{Number(item.total || 0).toFixed(2)}
              {isEstimated && <Text style={styles.asteriskText}>*</Text>}
            </Text>
          </View>
          <View style={styles.viewBtn}>
            <Text style={styles.viewBtnText}>{t('merchantOrders.viewOrder')} ›</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle}>{t('merchantOrders.title')}</Text>
          <Text style={styles.shopSubtitle}>{user?.shop?.name || 'Partner Store'}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t('merchantOrders.searchPlaceholder')}
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Real-time Order Notification Toast */}
      {toastNotice && (
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.notificationNotice}
          onPress={() => setToastNotice(null)}
        >
          <Text style={styles.notificationNoticeText}>{toastNotice}</Text>
          <Text style={styles.notificationNoticeClose}>✕</Text>
        </TouchableOpacity>
      )}

      {/* Fulfillment Status Scroll Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, isActive && styles.activeTabButton]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabButtonText, isActive && styles.activeTabText]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Secondary Filter Chips */}
      <View style={styles.chipsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScrollContent}
        >
          {/* Pricing Chips */}
          <TouchableOpacity
            style={[styles.chip, pricingFilter === 'store_priced' && styles.activeChip]}
            onPress={() => setPricingFilter(pricingFilter === 'store_priced' ? 'all' : 'store_priced')}
          >
            <Text style={[styles.chipText, pricingFilter === 'store_priced' && styles.activeChipText]}>
              ⚖️ {t('merchantOrders.badges.store_priced')}
            </Text>
          </TouchableOpacity>

          {/* Payment Chips */}
          <TouchableOpacity
            style={[styles.chip, paymentFilter === 'unpaid' && styles.activeChip]}
            onPress={() => setPaymentFilter(paymentFilter === 'unpaid' ? 'all' : 'unpaid')}
          >
            <Text style={[styles.chipText, paymentFilter === 'unpaid' && styles.activeChipText]}>
              ⏳ {t('merchantOrders.badges.unpaid')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, paymentFilter === 'paid' && styles.activeChip]}
            onPress={() => setPaymentFilter(paymentFilter === 'paid' ? 'all' : 'paid')}
          >
            <Text style={[styles.chipText, paymentFilter === 'paid' && styles.activeChipText]}>
              ✓ {t('merchantOrders.badges.paid')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Orders List / Empty State */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderOrderItem}
          contentContainerStyle={filteredOrders.length === 0 ? styles.emptyListContent : styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={styles.emptyTitle}>{t('merchantOrders.emptyTitle')}</Text>
              <Text style={styles.emptySubtitle}>{t('merchantOrders.emptySubtitle')}</Text>
            </View>
          }
        />
      )}
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
  headerTitleBlock: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  shopSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  clearIcon: {
    fontSize: 14,
    color: '#94A3B8',
    padding: 4,
  },
  tabsWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  activeTabButton: {
    backgroundColor: theme.colors.primary,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  chipsWrapper: {
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
  },
  chipsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeChip: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  activeChipText: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  orderIdBlock: {
    gap: 2,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  pickupCodeBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  pickupCodeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  pickupCodeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1D4ED8',
    fontFamily: 'monospace',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  customerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  customerMeta: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  customerPhone: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  itemsBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  itemsCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 2,
  },
  totalLabel: {
    fontSize: 11,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  asteriskText: {
    color: '#EA580C',
    fontSize: 16,
  },
  viewBtn: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 280,
  },
  notificationNotice: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationNoticeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#991B1B',
    flex: 1,
  },
  notificationNoticeClose: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
    marginLeft: 8,
    padding: 2,
  },
});
