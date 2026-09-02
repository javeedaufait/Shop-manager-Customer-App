import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../components/common/Header';
import { Button } from '../components/common/Button';
import { theme } from '../utils/theme';
import { useLocalization } from '../hooks/useLocalization';
import { useLocation } from '../hooks/useLocation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomerStackParamList } from '../navigation/types';

interface LocationPermissionScreenProps {
  navigation: NativeStackNavigationProp<CustomerStackParamList, 'LocationPermission'>;
}

export const LocationPermissionScreen: React.FC<LocationPermissionScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();
  const { requestCurrentLocation } = useLocation();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAllowLocation = async () => {
    setLoading(true);
    setErrorMsg(null);
    const granted = await requestCurrentLocation();
    setLoading(false);

    if (granted) {
      navigation.replace('NearbyShops');
    } else {
      setErrorMsg(t('location.permissionDenied'));
    }
  };

  const handleSelectManually = () => {
    navigation.navigate('AreaSelect');
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <Header
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      />

      <View style={styles.content}>
        {/* Visual Icon Illustration */}
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>📍</Text>
        </View>

        <Text style={styles.title}>{t('location.permissionTitle')}</Text>
        <Text style={styles.subtitle}>{t('location.permissionSubtitle')}</Text>

        {/* Benefits list */}
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🏬</Text>
            <View style={styles.benefitTextWrap}>
              <Text style={styles.benefitTitle}>Neighborhood Stores</Text>
              <Text style={styles.benefitDesc}>Find trusted local supermarkets right next door.</Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>⚡</Text>
            <View style={styles.benefitTextWrap}>
              <Text style={styles.benefitTitle}>Real-time Distance</Text>
              <Text style={styles.benefitDesc}>Accurate store distances and live pickup readiness.</Text>
            </View>
          </View>
        </View>

        {errorMsg && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Button
          title={t('location.allowAccess')}
          onPress={handleAllowLocation}
          loading={loading}
          style={styles.primaryBtn}
        />

        <TouchableOpacity
          style={styles.manualBtn}
          onPress={handleSelectManually}
          activeOpacity={0.7}
        >
          <Text style={styles.manualBtnText}>{t('location.selectManually')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'space-between',
  },
  content: {
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#bbf7d0',
    marginBottom: theme.spacing.xl,
    ...theme.shadows.md,
  },
  iconEmoji: {
    fontSize: 48,
  },
  title: {
    ...theme.typography.title,
    fontSize: 24,
    color: theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    lineHeight: 22,
    paddingHorizontal: theme.spacing.md,
  },
  benefitsContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
    ...theme.shadows.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  benefitIcon: {
    fontSize: 26,
  },
  benefitTextWrap: {
    flex: 1,
  },
  benefitTitle: {
    ...theme.typography.smallBold,
    color: theme.colors.text,
    fontSize: 14,
  },
  benefitDesc: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.base,
    width: '100%',
  },
  errorText: {
    ...theme.typography.small,
    color: '#b91c1c',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  primaryBtn: {
    width: '100%',
  },
  manualBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    backgroundColor: '#ffffff',
  },
  manualBtnText: {
    ...theme.typography.button,
    color: theme.colors.primary,
  },
});