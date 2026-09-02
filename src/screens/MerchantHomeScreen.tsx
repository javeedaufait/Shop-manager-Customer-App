import React from 'react';
import { View, Text, StyleSheet,  ScrollView } from 'react-native';
import { theme } from '../utils/theme';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { RoleBadge } from '../components/common/RoleBadge';
import { useAuth } from '../hooks/useAuth';
import { useLocalization } from '../hooks/useLocalization';

export const MerchantHomeScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useLocalization();

  const shop = user?.shop;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Header title="NearMart Partner" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.greeting}>{t('home.merchantGreeting')}</Text>
          <Text style={styles.subtitle}>Welcome, {user?.name}</Text>
        </View>

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
});