import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CustomerStackParamList } from '../navigation/types';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useLocalization } from '../hooks/useLocalization';
import { ordersApi } from '../api/ordersApi';
import { theme } from '../utils/theme';

type Props = NativeStackScreenProps<CustomerStackParamList, 'Checkout'>;

export const CheckoutScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();
  const { user } = useAuth();
  const { cart, clearCart } = useCart();

  const [customerName, setCustomerName] = useState<string>(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState<string>(user?.phone || '');
  const [customerNote, setCustomerNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isEmpty = !cart.items || cart.items.length === 0;

  const hasStorePriced = cart.items.some(
    (it) => it.price <= 0 || (it as any).pricing_type === 'store_priced'
  );

  const handlePlaceOrder = async () => {
    setErrorMessage(null);

    const name = customerName.trim();
    const phone = customerPhone.trim();

    if (!name || name.length < 2) {
      setErrorMessage(t('checkout.nameRequired'));
      return;
    }

    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (!cleanPhone || cleanPhone.length < 7) {
      setErrorMessage(t('checkout.phoneRequired'));
      return;
    }

    if (!cart.shop_id || isEmpty) {
      Alert.alert('Empty Cart', 'Your cart is empty.');
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await ordersApi.createOrder({
        shop_id: cart.shop_id,
        items: cart.items.map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
        })),
        customer_name: name,
        customer_phone: phone,
        customer_note: customerNote.trim() || undefined,
      });

      // Clear the local cart upon successful order
      await clearCart();

      // Navigate to order confirmation
      navigation.replace('OrderConfirmation', { order });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || t('checkout.errorPlacing');
      setErrorMessage(msg);
      Alert.alert('Order Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEmpty) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('checkout.title')}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('cart.emptyTitle')}</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('CustomerHome')}>
            <Text style={styles.emptyBtnText}>{t('cart.exploreStores')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} disabled={isSubmitting}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('checkout.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Error Banner */}
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Selected Store Card */}
        <View style={styles.card}>
          <View style={styles.storeHeader}>
            <View style={styles.storeIconWrap}>
              <Text style={styles.storeIcon}>🏬</Text>
            </View>
            <View style={styles.storeInfo}>
              <Text style={styles.storeLabel}>{t('orders.store')}</Text>
              <Text style={styles.storeName}>{cart.shop_name}</Text>
            </View>
          </View>
          <View style={styles.pickupBadge}>
            <Text style={styles.pickupBadgeText}>🛍️ {t('checkout.storePickup')} ({t('checkout.pickupFree')})</Text>
          </View>
          <Text style={styles.pickupHint}>{t('checkout.pickupInstructions')}</Text>
        </View>

        {/* Customer Contact Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('checkout.contactInfo')}</Text>
          <Text style={styles.sectionSubtitle}>{t('checkout.contactNotice')}</Text>

          <Text style={styles.inputLabel}>{t('checkout.nameLabel')} *</Text>
          <TextInput
            style={styles.textInput}
            value={customerName}
            onChangeText={setCustomerName}
            placeholder={t('checkout.namePlaceholder')}
            placeholderTextColor={theme.colors.textSecondary}
            editable={!isSubmitting}
          />

          <Text style={styles.inputLabel}>{t('checkout.phoneLabel')} *</Text>
          <TextInput
            style={styles.textInput}
            value={customerPhone}
            onChangeText={setCustomerPhone}
            placeholder={t('checkout.phonePlaceholder')}
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="phone-pad"
            editable={!isSubmitting}
          />

          <Text style={styles.inputLabel}>{t('checkout.orderNote')}</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={customerNote}
            onChangeText={setCustomerNote}
            placeholder={t('checkout.orderNotePlaceholder')}
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            editable={!isSubmitting}
          />
        </View>

        {/* Cart Items Review */}
        <View style={styles.card}>
          <View style={styles.cartReviewHeader}>
            <Text style={styles.sectionTitle}>{t('checkout.itemsSummary')}</Text>
            <Text style={styles.itemCountText}>
              {cart.items.length} {t('orders.items')}
            </Text>
          </View>

          {cart.items.map((item, idx) => (
            <View key={item.item_id || String(idx)} style={styles.itemRow}>
              <View style={styles.itemMain}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                {item.unit ? <Text style={styles.itemUnit}>{item.unit}</Text> : null}
              </View>
              <View style={styles.itemRight}>
                <Text style={styles.itemQty}>x{item.quantity}</Text>
                <Text style={styles.itemTotal}>₹{item.item_total}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Price Breakdown */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('orders.summary')}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{hasStorePriced ? 'Fixed Items Subtotal' : t('checkout.subtotal')}</Text>
            <Text style={styles.summaryValue}>₹{cart.subtotal}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('checkout.pickupFee')}</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.success }]}>
              {t('checkout.pickupFree')}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>
              {hasStorePriced ? 'Est. Total to Pay' : t('checkout.totalToPay')}
            </Text>
            <Text style={styles.totalValue}>
              ₹{cart.subtotal}{hasStorePriced ? '*' : ''}
            </Text>
          </View>
          {hasStorePriced && (
            <View style={styles.weighedNoticeBox}>
              <Text style={styles.weighedNoticeIcon}>⚖️</Text>
              <Text style={styles.weighedNoticeText}>
                *Final total includes produce weighed at store pickup. Pay exact amount at counter.
              </Text>
            </View>
          )}
          <View style={styles.paymentNoticeBox}>
            <Text style={styles.paymentNoticeIcon}>ℹ️</Text>
            <Text style={styles.paymentNoticeText}>{t('checkout.payAtStore')}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer / Place Order CTA */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.footerPrice}>
          <Text style={styles.footerSubtotalLabel}>
            {hasStorePriced ? 'Est. Total to Pay' : t('checkout.totalToPay')}
          </Text>
          <Text style={styles.footerPriceValue}>
            ₹{cart.subtotal}{hasStorePriced ? '*' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.placeBtn, isSubmitting && styles.placeBtnDisabled]}
          onPress={handlePlaceOrder}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.placeBtnText}>{t('checkout.placeOrderBtn')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: theme.colors.text,
    fontWeight: '300',
    lineHeight: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
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
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  storeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  storeIcon: {
    fontSize: 22,
  },
  storeInfo: {
    flex: 1,
  },
  storeLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  storeName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 2,
  },
  pickupBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: 8,
  },
  pickupBadgeText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  pickupHint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 17,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 6,
    marginTop: 4,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 70,
    paddingTop: 10,
  },
  cartReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemCountText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  itemMain: {
    flex: 1,
    paddingRight: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  itemUnit: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemQty: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginRight: 14,
    fontWeight: '500',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    minWidth: 55,
    textAlign: 'right',
  },
  itemWeighedNote: {
    fontSize: 11,
    color: '#7E22CE',
    fontWeight: '600',
    marginTop: 2,
  },
  itemTotalTbd: {
    color: '#7E22CE',
    fontWeight: '700',
  },
  weighedNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  paymentNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  paymentNoticeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  paymentNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  emptyBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerPrice: {
    flex: 1,
    marginRight: 14,
  },
  footerSubtotalLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  footerPriceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
  },
  placeBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  placeBtnDisabled: {
    opacity: 0.7,
  },
  placeBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
