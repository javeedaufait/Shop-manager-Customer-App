import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Cart } from '../../types/cart';
import { theme } from '../../utils/theme';

interface OrderSummaryProps {
  cart: Cart;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({ cart }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Bill Details</Text>

      <View style={styles.row}>
        <Text style={styles.label}>
          Item Subtotal ({cart.total_quantity} {cart.total_quantity === 1 ? 'item' : 'items'})
        </Text>
        <Text style={styles.value}>₹{cart.subtotal}</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.pickupLabelRow}>
          <Text style={styles.label}>Store Pickup Fee</Text>
          <View style={styles.freeBadge}>
            <Text style={styles.freeText}>FREE</Text>
          </View>
        </View>
        <Text style={[styles.value, styles.freeValue]}>₹0</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.totalLabel}>Grand Total</Text>
        <Text style={styles.totalValue}>₹{cart.subtotal}</Text>
      </View>

      <View style={styles.pickupNotice}>
        <Text style={styles.pickupNoticeIcon}>⚡</Text>
        <Text style={styles.pickupNoticeText}>
          Click & Collect: Skip billing queues. Order will be packed and waiting for you.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  pickupLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  freeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  freeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  freeValue: {
    color: '#15803D',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  pickupNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    gap: 8,
  },
  pickupNoticeIcon: {
    fontSize: 16,
  },
  pickupNoticeText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    flex: 1,
    lineHeight: 16,
  },
});
