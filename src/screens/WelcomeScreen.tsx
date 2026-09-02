import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../utils/theme';
import { Header } from '../components/common/Header';
import { useLocalization } from '../hooks/useLocalization';
import { useAuth } from '../hooks/useAuth';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';

interface WelcomeScreenProps {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const { t } = useLocalization();
  const { continueAsGuest } = useAuth();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Header />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroSection}>
          <View style={styles.brandBadge}>
            <Text style={styles.badgeText}>⚡ {t('common.appName')}</Text>
          </View>
          <Text style={styles.heroTitle}>{t('welcome.heroTitle')}</Text>
          <Text style={styles.heroSubtitle}>{t('welcome.heroSubtitle')}</Text>
        </View>

        <View style={styles.choiceSection}>
          {/* 1. Explore Nearby Stores (Direct Guest Discovery) */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.choiceCard, styles.guestCard]}
            onPress={continueAsGuest}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#dcfce7' }]}>
              <Text style={styles.cardIcon}>📍</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: '#16a34a' }]}>Explore Nearby Stores</Text>
              <Text style={styles.cardDesc}>Browse neighborhood shops & live distance as guest</Text>
            </View>
            <Text style={[styles.arrowText, { color: '#16a34a' }]}>→</Text>
          </TouchableOpacity>

          {/* 2. Customer Choice Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.choiceCard}
            onPress={() => navigation.navigate('CustomerLogin')}
          >
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryLight }]}>
              <Text style={styles.cardIcon}>🛍️</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{t('welcome.customerCta')}</Text>
              <Text style={styles.cardDesc}>{t('welcome.customerDesc')}</Text>
            </View>
            <Text style={styles.arrowText}>→</Text>
          </TouchableOpacity>

          {/* 3. Merchant Choice Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.choiceCard, styles.merchantCard]}
            onPress={() => navigation.navigate('MerchantLogin')}
          >
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.merchantLight }]}>
              <Text style={styles.cardIcon}>🏪</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{t('welcome.merchantCta')}</Text>
              <Text style={styles.cardDesc}>{t('welcome.merchantDesc')}</Text>
            </View>
            <Text style={[styles.arrowText, { color: theme.colors.merchantPrimary }]}>→</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>{t('common.appName')} {t('common.version')}</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
    justifyContent: 'space-between',
  },
  heroSection: {
    marginTop: theme.spacing.lg,
  },
  brandBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.md,
  },
  badgeText: {
    ...theme.typography.smallBold,
    color: theme.colors.primaryDark,
  },
  heroTitle: {
    ...theme.typography.hero,
    color: theme.colors.text,
  },
  heroSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    lineHeight: 24,
  },
  choiceSection: {
    gap: theme.spacing.base,
    marginVertical: theme.spacing.xl,
  },
  choiceCard: {
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    ...theme.shadows.sm,
  },
  guestCard: {
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
  },
  merchantCard: {
    borderColor: '#cbd5e1',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    fontSize: 26,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    ...theme.typography.subtitle,
    color: theme.colors.text,
  },
  cardDesc: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  arrowText: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  versionText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});