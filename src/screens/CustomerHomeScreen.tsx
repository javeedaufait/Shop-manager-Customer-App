import React from 'react';
import { View, Text, StyleSheet,  ScrollView } from 'react-native';
import { theme } from '../utils/theme';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { RoleBadge } from '../components/common/RoleBadge';
import { useAuth } from '../hooks/useAuth';
import { useLocalization } from '../hooks/useLocalization';

export const CustomerHomeScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useLocalization();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Header title={t('common.appName')} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.greeting}>{t('home.customerGreeting')}</Text>
          <Text style={styles.subtitle}>{t('home.customerSubtitle')}</Text>
        </View>

        <Card style={styles.profileCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('home.profileTitle')}</Text>
            {user?.role && <RoleBadge role={user.role} />}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{user?.name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{user?.email}</Text>
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
    backgroundColor: theme.colors.primaryLight,
    padding: theme.spacing.xl,
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
  },
  profileCard: {
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