import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../utils/theme';

interface ErrorBannerProps {
  message?: string | null;
  onDismiss?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: theme.colors.dangerLight,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.danger,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.base,
  },
  text: {
    ...theme.typography.smallBold,
    color: theme.colors.danger,
    flex: 1,
  },
  dismissBtn: {
    paddingLeft: theme.spacing.sm,
  },
  dismissText: {
    color: theme.colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
});