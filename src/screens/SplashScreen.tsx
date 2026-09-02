import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../utils/theme';
import { useAuth } from '../hooks/useAuth';
import { useLocalization } from '../hooks/useLocalization';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';

interface SplashScreenProps {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Splash'>;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const { isLoading, isAuthenticated } = useAuth();
  const { t } = useLocalization();

  useEffect(() => {
    if (!isLoading && navigation?.replace) {
      if (!isAuthenticated) {
        // Unauthenticated -> proceed to Language selection or Welcome
        const timer = setTimeout(() => {
          if (navigation?.replace) {
            navigation.replace('LanguageSelect');
          }
        }, 1200);
        return () => clearTimeout(timer);
      }
      // If authenticated, RootNavigator automatically switches stacks!
    }
  }, [isLoading, isAuthenticated, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoLetter}>N</Text>
        </View>
        <Text style={styles.logoText}>{t('common.appName')}</Text>
        <Text style={styles.tagline}>{t('common.tagline')}</Text>
      </View>

      <View style={styles.footer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.xl,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.base,
    ...theme.shadows.md,
  },
  logoLetter: {
    fontSize: 48,
    fontWeight: '800',
    color: '#ffffff',
  },
  logoText: {
    ...theme.typography.hero,
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    maxWidth: 280,
  },
  footer: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  loadingText: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
  },
});