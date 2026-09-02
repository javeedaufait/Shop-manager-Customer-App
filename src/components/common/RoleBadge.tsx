import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UserRole } from '../../types/auth';
import { theme } from '../../utils/theme';
import { t } from '../../i18n';

interface RoleBadgeProps {
  role: UserRole;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const getBadgeConfig = () => {
    switch (role) {
      case 'merchant':
        return {
          label: t('roles.merchant'),
          bg: theme.colors.merchantLight,
          color: theme.colors.merchantDark,
        };
      case 'administrator':
        return {
          label: t('roles.administrator'),
          bg: '#f3e8ff',
          color: '#7e22ce',
        };
      default:
        return {
          label: t('roles.customer'),
          bg: theme.colors.primaryLight,
          color: theme.colors.primaryDark,
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  text: {
    ...theme.typography.caption,
    fontWeight: '700',
  },
});