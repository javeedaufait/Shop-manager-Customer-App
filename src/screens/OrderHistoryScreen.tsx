import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CustomerStackParamList } from '../navigation/types';
import { useLocalization } from '../hooks/useLocalization';
import { useAuth } from '../hooks/useAuth';
import { ordersApi } from '../api/ordersApi';
import { Order, OrderStatus } from '../types/orders';
import { theme } from '../utils/theme';

type Props = NativeStackScreenProps<CustomerStackParamList, 'OrderHistory'>;

type TabType = 'all' | 'active' | 'completed';

export const OrderHistoryScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();
  const { user } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await ordersApi.getOrders(user?.phone || undefined);
      setOrders(data);
    } catch (err) {
      console.warn('Failed to load orders:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.phone]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchOrders();
  };

  const getFilteredOrders = () => {
    if (activeTab === 'active') {
      return orders.filter((o) =>
        ['pending', 'accepted', 'preparing', 'ready_for_pickup'].includes(o.status)
      );
    }
    if (activeTab === 'completed') {
      return orders.filter((o) =>
        ['completed', 'cancelled', 'rejected'].includes(o.status)
      );
    }
    return orders;
  };

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

  const renderOrderItem = ({ item }: { item: Order }) => {
    const badge = getStatusBadgeStyle(item.status);
    const dateFormatted = new Date(item.created_at).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetails', { orderId: item.id, order: item })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderNumber}>{item.order_number}</Text>
            <Text style={styles.orderDate}>{dateFormatted}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: badge.bg, borderColor: badge.border },
            ]}
          >
            <Text style={[styles.statusBadgeText, { color: badge.text }]}>
              {t(`orders.status.${item.status}` as any) || item.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.shopName} numberOfLines={1}>🏬 {item.shop_name}</Text>
          <Text style={styles.itemSummary}>
            {item.total_quantity} {t('orders.items')} • {item.items.map((i) => i.name).slice(0, 2).join(', ')}
            {item.items.length > 2 ? '...' : ''}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.totalLabel}>{t('orders.total')}</Text>
            <Text style={styles.totalValue}>₹{item.total}</Text>
          </View>
          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() => navigation.navigate('OrderStatus', { orderId: item.id, order: item })}
          >
            <Text style={styles.trackBtnText}>{t('orders.trackStatus')}</Text>
            <Text style={styles.trackBtnArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const filteredOrders = getFilteredOrders();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('orders.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            {t('orders.all')} ({orders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            {t('orders.active')} (
            {orders.filter((o) => ['pending', 'accepted', 'preparing', 'ready_for_pickup'].includes(o.status)).length}
            )
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            {t('orders.completed')} (
            {orders.filter((o) => ['completed', 'cancelled', 'rejected'].includes(o.status)).length}
            )
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={styles.emptyTitle}>{t('orders.emptyTitle')}</Text>
              <Text style={styles.emptySubtitle}>{t('orders.emptySubtitle')}</Text>
              <TouchableOpacity
                style={styles.startShopBtn}
                onPress={() => navigation.navigate('CustomerHome')}
              >
                <Text style={styles.startShopBtnText}>{t('orders.startShopping')}</Text>
              </TouchableOpacity>
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
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F1F5F9',
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  activeTabText: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '700',
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
  cardBody: {
    marginVertical: 4,
  },
  shopName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  itemSummary: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  totalLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  trackBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  trackBtnArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
    marginLeft: 4,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 50,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  startShopBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  startShopBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
