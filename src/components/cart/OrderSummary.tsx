import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Cart } from '../../types/cart';
import { theme } from '../../utils/theme';
import { useLocalization } from '../../hooks/useLocalization';

interface OrderSummaryProps {
  cart: Cart;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({ cart }) => {
  const { t } = useLocalization();
  const hasStorePriced = cart.items.some(
    (it) => it.price <= 0 || (it as any).pricing_type === 'store_priced'
  );
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('orders.summary')}</Text>

      <View style={styles.row}>
        <Text style={styles.label}>
          {hasStorePriced ? `${t('cart.fixedItemsSubtotal')} (${cart.total_quantity})` : `${t('cart.itemSubtotal')} (${cart.total_quantity})`}
        </Text>
        <Text style={styles.value}>₹{cart.subtotal}</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.pickupLabelRow}>
          <Text style={styles.label}>{t('cart.pickupFee')}</Text>
          <View style={styles.freeBadge}>
            <Text style={styles.freeText}>{t('cart.free')}</Text>
          </View>
        </View>
        <Text style={[styles.value, styles.freeValue]}>₹0</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.totalLabel}>
          {hasStorePriced ? t('cart.estGrandTotal') : t('cart.grandTotal')}
        </Text>
        <Text style={styles.totalValue}>
          ₹{cart.subtotal}{hasStorePriced ? '*' : ''}
        </Text>
      </View>

      {hasStorePriced && (
        <View style={styles.weighedNoticeBox}>
          <Text style={styles.weighedNoticeIcon}>⚖️</Text>
          <Text style={styles.weighedNoticeText}>
            {t('cart.weighedNotice')}
          </Text>
        </View>
      )}

      <View style={styles.pickupNotice}>
        <Text style={styles.pickupNoticeIcon}>⚡</Text>
        <Text style={styles.pickupNoticeText}>
          {t('cart.pickupNotice')}
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
  weighedNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    padding: 10,
    marginTop: 8,
    gap: 8,
  },
  weighedNoticeIcon: {
    fontSize: 16,
  },
  weighedNoticeText: {
    fontSize: 12,
    color: '#6B21A8',
    flex: 1,
    lineHeight: 16,
    fontWeight: '500',
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
