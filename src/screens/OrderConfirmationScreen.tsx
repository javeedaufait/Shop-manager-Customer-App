import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CustomerStackParamList } from '../navigation/types';
import { useLocalization } from '../hooks/useLocalization';
import { theme } from '../utils/theme';

type Props = NativeStackScreenProps<CustomerStackParamList, 'OrderConfirmation'>;

export const OrderConfirmationScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();
  const { order } = route.params;

  const hasStorePriced =
    (order as any).is_total_final === false ||
    order.pricing_status === 'pending_verification' ||
    (order.items &&
      order.items.some(
        (it: any) =>
          it.pricing_type === 'store_priced' ||
          (it.price !== undefined && it.price <= 0) ||
          (it.item_total !== undefined && it.item_total <= 0)
      ));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Header Icon */}
        <View style={styles.successHeader}>
          <View style={styles.iconCircle}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>
          <Text style={styles.successTitle}>{t('orderConfirmation.title')}</Text>
          <Text style={styles.successSubtitle}>{t('orderConfirmation.subtitle')}</Text>
        </View>

        {/* Pickup Code Card */}
        <View style={styles.pickupCodeCard}>
          <Text style={styles.pickupCodeLabel}>{t('orderConfirmation.pickupCode')}</Text>
          <Text style={styles.pickupCodeValue}>{order.pickup_code}</Text>
          <View style={styles.pickupCodeBadge}>
            <Text style={styles.pickupCodeNotice}>
              📌 {t('orderConfirmation.pickupCodeNotice')}
            </Text>
          </View>
        </View>

        {/* Order Details Card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>{t('orderConfirmation.orderNumber')}</Text>
            <Text style={styles.valueBold}>{order.order_number}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('orders.store')}</Text>
            <Text style={styles.valueBold}>{order.shop_name}</Text>
          </View>
          {order.shop_address ? (
            <View style={styles.addressRow}>
              <Text style={styles.addressText}>📍 {order.shop_address}</Text>
            </View>
          ) : null}
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>{t('orders.items')}</Text>
            <Text style={styles.value}>
              {order.total_quantity} items ({order.items.length} unique)
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{hasStorePriced ? t('orderConfirmation.estTotal') : t('orders.total')}</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.priceValue}>₹{order.total}{hasStorePriced ? '*' : ''}</Text>
              {hasStorePriced && (
                <Text style={styles.weighedProduceBadge}>{t('orderConfirmation.excludesWeighedProduce')}</Text>
              )}
            </View>
          </View>
          {hasStorePriced && (
            <View style={styles.weighedNoticeBox}>
              <Text style={styles.weighedNoticeIcon}>⚖️</Text>
              <Text style={styles.weighedNoticeText}>
                {t('orderConfirmation.weighedNotice')}
              </Text>
            </View>
          )}
          <View style={styles.etaBox}>
            <Text style={styles.etaIcon}>⏱️</Text>
            <Text style={styles.etaText}>{t('orderConfirmation.estimatedTime')}</Text>
          </View>
        </View>

        {/* Customer Contact Confirmation */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('orders.customerInfo')}</Text>
          <View style={styles.row}>
            <Text style={styles.label}>{t('checkout.nameLabel')}</Text>
            <Text style={styles.value}>{order.customer_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('checkout.phoneLabel')}</Text>
            <Text style={styles.value}>{order.customer_phone}</Text>
          </View>
          {order.customer_note ? (
            <View style={styles.noteRow}>
              <Text style={styles.label}>{t('orders.note')}:</Text>
              <Text style={styles.noteText}>"{order.customer_note}"</Text>
            </View>
          ) : null}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('OrderStatus', { orderId: order.id, order })}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>{t('orderConfirmation.trackOrder')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('OrderHistory')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnText}>{t('orderConfirmation.viewHistory')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.textBtn}
            onPress={() => navigation.navigate('CustomerHome')}
            activeOpacity={0.7}
          >
            <Text style={styles.textBtnText}>← {t('orderConfirmation.continueShopping')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  successHeader: {
    alignItems: 'center',
    marginVertical: 20,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  checkIcon: {
    fontSize: 38,
    color: '#fff',
    fontWeight: '900',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  pickupCodeCard: {
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#C7D2FE',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  pickupCodeLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#4338CA',
    marginBottom: 4,
  },
  pickupCodeValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1E1B4B',
    letterSpacing: 2,
    marginBottom: 8,
  },
  pickupCodeBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  pickupCodeNotice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3730A3',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  addressRow: {
    marginTop: 4,
    marginBottom: 6,
  },
  addressText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  label: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  value: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  valueBold: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '700',
  },
  priceValue: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: '800',
  },
  weighedProduceBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7E22CE',
    marginTop: 2,
  },
  weighedNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  weighedNoticeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  weighedNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#6B21A8',
    lineHeight: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  etaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  etaIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  etaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  noteRow: {
    marginTop: 8,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
  },
  noteText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: theme.colors.text,
    marginTop: 2,
  },
  actionsContainer: {
    marginTop: 10,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryBtnText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  textBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  textBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
