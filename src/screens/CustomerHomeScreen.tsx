import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { theme } from '../utils/theme';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { RoleBadge } from '../components/common/RoleBadge';
import { useAuth } from '../hooks/useAuth';
import { useLocalization } from '../hooks/useLocalization';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomerStackParamList } from '../navigation/types';

interface CustomerHomeScreenProps {
  navigation: NativeStackNavigationProp<CustomerStackParamList, 'CustomerHome'>;
}

export const CustomerHomeScreen: React.FC<CustomerHomeScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { t } = useLocalization();

  const handleLogout = () => {
    Alert.alert(
      t('common.logout'),
      t('auth.logoutConfirm') || 'Are you sure you want to log out?',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('common.logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('NearbyShops');
    }
  };

  const firstLetter = (user?.name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Header title={t('home.profileTitle')} onBack={handleBack} />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Card */}
        <View style={styles.heroCard}>
          <Text style={styles.greeting}>{t('home.customerGreeting')}</Text>
          <Text style={styles.subtitle}>{t('home.customerSubtitle')}</Text>
        </View>

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.cardHeader}>
            <View style={styles.userHeaderLeft}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>{firstLetter}</Text>
              </View>
              <View>
                <Text style={styles.cardTitle}>{user?.name || t('roles.customer')}</Text>
                <Text style={styles.cardSubtitle}>#{user?.id ? `ID: ${user.id}` : ''}</Text>
              </View>
            </View>
            {user?.role && <RoleBadge role={user.role} />}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{user?.name || '—'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{user?.email || '—'}</Text>
          </View>

          {!!user?.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{user.phone}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.label}>User ID:</Text>
            <Text style={styles.value}>#{user?.id}</Text>
          </View>
        </Card>

        {/* Quick Navigation Card */}
        <Card style={styles.navCard}>
          <TouchableOpacity
            style={styles.navRow}
            onPress={() => navigation.navigate('OrderHistory')}
            activeOpacity={0.7}
          >
            <View style={styles.navLeft}>
              <View style={styles.navIconBox}>
                <Text style={styles.navIcon}>📋</Text>
              </View>
              <View>
                <Text style={styles.navTitle}>{t('orders.title')}</Text>
                <Text style={styles.navSubtitle}>{t('orderConfirmation.viewHistory')}</Text>
              </View>
            </View>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.navRow}
            onPress={() => navigation.navigate('NearbyShops')}
            activeOpacity={0.7}
          >
            <View style={styles.navLeft}>
              <View style={styles.navIconBox}>
                <Text style={styles.navIcon}>🏬</Text>
              </View>
              <View>
                <Text style={styles.navTitle}>{t('cart.exploreStores')}</Text>
                <Text style={styles.navSubtitle}>{t('welcome.customerDesc')}</Text>
              </View>
            </View>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>
        </Card>

        {/* Logout Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutBtnText}>🚪 {t('common.logout')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    paddingBottom: 40,
    gap: 14,
  },
  heroCard: {
    backgroundColor: theme.colors.primaryLight,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  greeting: {
    ...theme.typography.title,
    color: theme.colors.primaryDark,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    lineHeight: 20,
  },
  profileCard: {
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.md,
  },
  userHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  avatarLetter: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  label: {
    ...theme.typography.smallBold,
    color: theme.colors.textSecondary,
  },
  value: {
    ...theme.typography.small,
    color: theme.colors.text,
    fontWeight: '600',
  },
  navCard: {
    padding: 6,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fontSize: 18,
  },
  navTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  navSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  navArrow: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 12,
  },
  footer: {
    marginTop: 10,
  },
  logoutBtn: {
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
});