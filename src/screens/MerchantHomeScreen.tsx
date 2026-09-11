import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MerchantStackParamList } from '../navigation/types';
import { theme } from '../utils/theme';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { RoleBadge } from '../components/common/RoleBadge';
import { useAuth } from '../hooks/useAuth';
import { useLocalization } from '../hooks/useLocalization';
import { notificationService } from '../services/notificationService';

type Props = NativeStackScreenProps<MerchantStackParamList, 'MerchantHome'>;

export const MerchantHomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { t } = useLocalization();

  const [hasNewOrder, setHasNewOrder] = useState<boolean>(false);
  const [newOrderInfo, setNewOrderInfo] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = notificationService.subscribeToForegroundNotifications((notification) => {
      const data = notification?.request?.content?.data;
      const role = data?.target_role || data?.user_type;
      const type = data?.type;
      if (role === 'merchant' || type === 'merchant_new_order') {
        setHasNewOrder(true);
        const orderNum = data?.order_number || (data?.order_id ? `#${data.order_id}` : '');
        setNewOrderInfo(orderNum);
      }
    });
    return () => unsubscribe();
  }, []);

  const shop = user?.shop;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Header title="NearMart Partner" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.greeting}>{t('home.merchantGreeting')}</Text>
          <Text style={styles.subtitle}>Welcome, {user?.name}</Text>
        </View>

        {/* Foreground New Order Indicator Banner */}
        {hasNewOrder && (
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.newOrderBanner}
            onPress={() => {
              setHasNewOrder(false);
              navigation.navigate('MerchantOrders');
            }}
          >
            <Text style={styles.newOrderBannerIcon}>🔔</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.newOrderBannerTitle}>
                {newOrderInfo ? `${t('notifications.merchantNewOrderTitle')} (${newOrderInfo})` : t('notifications.merchantNewOrderTitle')}
              </Text>
              <Text style={styles.newOrderBannerSubtitle}>{t('notifications.newOrdersBanner')}</Text>
            </View>
            <View style={styles.newOrderBannerAction}>
              <Text style={styles.newOrderBannerActionText}>›</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Store Orders Quick Action Card */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.ordersActionCard, hasNewOrder && styles.ordersActionCardAlert]}
          onPress={() => {
            setHasNewOrder(false);
            navigation.navigate('MerchantOrders');
          }}
        >
          <View style={styles.ordersActionLeft}>
            <View style={[styles.ordersIconCircle, hasNewOrder && { backgroundColor: '#FEE2E2' }]}>
              <Text style={{ fontSize: 24 }}>📦</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.ordersActionTitle}>{t('merchantOrders.title')}</Text>
                {hasNewOrder && (
                  <View style={styles.newOrderBadge}>
                    <Text style={styles.newOrderBadgeText}>● {t('notifications.newOrderIndicator')}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.ordersActionSubtitle}>{t('merchantOrders.subtitle')}</Text>
            </View>
          </View>
          <View style={styles.ordersActionArrow}>
            <Text style={styles.arrowText}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Store Catalog Quick Action Card (APP-9.2) */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.ordersActionCard}
          onPress={() => navigation.navigate('MerchantCatalog')}
        >
          <View style={styles.ordersActionLeft}>
            <View style={[styles.ordersIconCircle, { backgroundColor: '#ECFDF5' }]}>
              <Text style={{ fontSize: 24 }}>🛒</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.ordersActionTitle}>{t('merchantCatalog.title')}</Text>
              <Text style={styles.ordersActionSubtitle}>{t('merchantCatalog.subtitle')}</Text>
            </View>
          </View>
          <View style={styles.ordersActionArrow}>
            <Text style={styles.arrowText}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Linked Shop Card */}
        {shop ? (
          <Card style={styles.shopCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.shopName}>{shop.name}</Text>
                <Text style={styles.shopType}>{shop.shop_type || 'Supermarket'}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{shop.status.toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Shop ID:</Text>
              <Text style={styles.value}>#{shop.shop_id}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('home.shopAddress')}:</Text>
              <Text style={[styles.value, { flex: 1, textAlign: 'right' }]}>{shop.address}</Text>
            </View>

            {!!shop.phone && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Phone:</Text>
                <Text style={styles.value}>{shop.phone}</Text>
              </View>
            )}
          </Card>
        ) : (
          <Card style={styles.noShopCard}>
            <Text style={styles.noShopText}>No store profile linked to this merchant account.</Text>
          </Card>
        )}

        {/* Merchant Account Details */}
        <Card style={styles.profileCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('home.profileTitle')}</Text>
            {user?.role && <RoleBadge role={user.role} />}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Merchant Name:</Text>
            <Text style={styles.value}>{user?.name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Account ID:</Text>
            <Text style={styles.value}>#{user?.id}</Text>
          </View>
        </Card>

        <View style={styles.footer}>
          <Button
            title={t('common.logout')}
            variant="outline"
            onPress={logout}
            style={styles.logoutBtn}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  heroCard: {
    backgroundColor: theme.colors.merchantLight,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  greeting: {
    ...theme.typography.title,
    color: theme.colors.merchantDark,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  ordersActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  ordersActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  ordersIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ordersActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ordersActionSubtitle: {
    fontSize: 12,
    color: '#BFDBFE',
  },
  ordersActionArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  arrowText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
    lineHeight: 22,
  },
  shopCard: {
    gap: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.md,
  },
  shopName: {
    ...theme.typography.title,
    color: theme.colors.text,
  },
  shopType: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    ...theme.typography.caption,
    color: '#15803d',
    fontWeight: '700',
  },
  noShopCard: {
    padding: theme.spacing.lg,
  },
  noShopText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  profileCard: {
    gap: theme.spacing.md,
  },
  cardTitle: {
    ...theme.typography.subtitle,
    color: theme.colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    ...theme.typography.smallBold,
    color: theme.colors.textSecondary,
  },
  value: {
    ...theme.typography.small,
    color: theme.colors.text,
  },
  footer: {
    marginTop: theme.spacing.xl,
  },
  logoutBtn: {
    width: '100%',
  },
  newOrderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  newOrderBannerIcon: {
    fontSize: 22,
  },
  newOrderBannerTitle: {
    ...theme.typography.smallBold,
    color: '#991B1B',
  },
  newOrderBannerSubtitle: {
    ...theme.typography.caption,
    color: '#B91C1C',
    marginTop: 2,
  },
  newOrderBannerAction: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newOrderBannerActionText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#DC2626',
  },
  ordersActionCardAlert: {
    borderColor: '#F87171',
    borderWidth: 1.5,
  },
  newOrderBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
  },
  newOrderBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
