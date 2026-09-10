import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MerchantStackParamList } from '../navigation/types';
import { useLocalization } from '../hooks/useLocalization';
import { merchantApi } from '../api/merchantApi';
import { Order, OrderStatus, WeighedItemInput, MerchantFulfillmentAction } from '../types/orders';
import { theme } from '../utils/theme';

type Props = NativeStackScreenProps<MerchantStackParamList, 'MerchantOrderDetails'>;

interface WeighedInputState {
  [key: string]: {
    weight: string;
    price: string;
  };
}

export const MerchantOrderDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { t, language } = useLocalization();
  const { orderId, order: initialOrder } = route.params;

  const [order, setOrder] = useState<Order | null>(initialOrder || null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialOrder);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // Modals visibility
  const [isWeighModalOpen, setIsWeighModalOpen] = useState<boolean>(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState<boolean>(false);

  // Weighing form state
  const [weighedInputs, setWeighedInputs] = useState<WeighedInputState>({});
  const [isSavingWeigh, setIsSavingWeigh] = useState<boolean>(false);

  // Reject form state
  const [selectedRejectPreset, setSelectedRejectPreset] = useState<string>('out_of_stock');
  const [customRejectReason, setCustomRejectReason] = useState<string>('');

  const refreshOrder = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await merchantApi.getOrderDetail(orderId);
      if (data) setOrder(data);
    } catch (err) {
      console.warn('Failed to refresh merchant order details:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    refreshOrder(false);
  };

  useEffect(() => {
    refreshOrder(!initialOrder);
  }, [orderId]);

  const handleCallCustomer = (phone?: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`);
    }
  };

  const getWhatsAppMessage = (orderObj: Order, lang: string) => {
    const customerName = orderObj.customer_name || (lang === 'ml' ? 'ഉപഭോക്താവ്' : 'Customer');
    const shopTitle = orderObj.shop_name || (lang === 'ml' ? 'നിയർമാർട്ട് സ്റ്റോർ' : 'NearMart Store');
    const orderNum = orderObj.order_number || String(orderObj.id);
    const code = orderObj.pickup_code || '';
    const total = orderObj.total ? `₹${orderObj.total}` : '';

    if (lang === 'ml') {
      switch (orderObj.status) {
        case 'ready_for_pickup':
          return `നമസ്കാരം ${customerName},\n${shopTitle}-ൽ നിന്നുള്ള നിങ്ങളുടെ ഓർഡർ #${orderNum} കൗണ്ടർ പിക്കപ്പിനായി തയ്യാറാണ്! 🎉\n\n📌 പിക്കപ്പ് കോഡ്: *${code}*\n${total ? `💰 ആകെ തുക: *${total}*\n` : ''}\nകടയിലെത്തി പിക്കപ്പ് കോഡ് കാണിച്ച് ഓർഡർ വാങ്ങാവുന്നതാണ്. നന്ദി!`;

        case 'preparing':
          return `നമസ്കാരം ${customerName},\n${shopTitle}-ൽ നിന്നുള്ള നിങ്ങളുടെ ഓർഡർ #${orderNum} പായ്ക്ക് ചെയ്തു തയ്യാറാക്കുന്നു. 📦\n\n📌 പിക്കപ്പ് കോഡ്: *${code}*${total ? `\n💰 ആകെ തുക: *${total}*` : ''}\n\nഓർഡർ പിക്കപ്പിനായി തയ്യാറാകുമ്പോൾ ഞങ്ങൾ ഉടൻ അറിയിക്കാം. നന്ദി!`;

        case 'accepted':
          return `നമസ്കാരം ${customerName},\n${shopTitle} നിങ്ങളുടെ ഓർഡർ #${orderNum} സ്വീകരിച്ചിരിക്കുന്നു. ✅\n\n📌 പിക്കപ്പ് കോഡ്: *${code}*\n\nഞങ്ങൾ ഉടൻ തന്നെ സാധനങ്ങൾ പാക്ക് ചെയ്യാൻ തുടങ്ങും. നന്ദി!`;

        case 'completed':
          return `നമസ്കാരം ${customerName},\nനിയർമാർട്ട് വഴി ${shopTitle}-ൽ നിന്ന് സാധനങ്ങൾ വാങ്ങിയതിന് നന്ദി! ✨\nനിങ്ങളുടെ ഓർഡർ #${orderNum} വിജയകരമായി പൂർത്തിയായി.\nവീണ്ടും സേവിക്കാൻ കാത്തിരിക്കുന്നു.`;

        case 'rejected':
        case 'cancelled':
          return `നമസ്കാരം ${customerName},\n${shopTitle}-ൽ നിന്നുള്ള നിങ്ങളുടെ ഓർഡർ #${orderNum} നൽകാൻ സാധിച്ചില്ല എന്ന് ഖേദപൂർവ്വം അറിയിക്കുന്നു.${orderObj.rejection_reason ? `\nകാരണം: ${orderObj.rejection_reason}` : ''}\nനേരിട്ട അസൗകര്യത്തിൽ ഞങ്ങൾ ക്ഷമ ചോദിക്കുന്നു.`;

        case 'pending':
        default:
          return `നമസ്കാരം ${customerName},\n${shopTitle} നിങ്ങളുടെ ഓർഡർ #${orderNum} ലഭിച്ചിട്ടുണ്ട്.\n\n📌 പിക്കപ്പ് കോഡ്: *${code}*\n\nഉടൻ തന്നെ ഓർഡർ സ്വീകരിച്ചു തയ്യാറാക്കുന്നതായിരിക്കും. നന്ദി!`;
      }
    } else {
      switch (orderObj.status) {
        case 'ready_for_pickup':
          return `Hello ${customerName},\nYour NearMart order #${orderNum} from ${shopTitle} is READY for counter pickup! 🎉\n\n📌 Pickup Code: *${code}*\n${total ? `💰 Total Amount: *${total}*\n` : ''}\nPlease show this pickup code at the store counter to collect your order. Thank you!`;

        case 'preparing':
          return `Hello ${customerName},\nYour NearMart order #${orderNum} is being packed and prepared by ${shopTitle}. 📦\n\n📌 Pickup Code: *${code}*${total ? `\n💰 Total Amount: *${total}*` : ''}\n\nWe will notify you as soon as it is ready for pickup. Thank you!`;

        case 'accepted':
          return `Hello ${customerName},\nYour NearMart order #${orderNum} has been accepted by ${shopTitle}. ✅\n\n📌 Pickup Code: *${code}*\n\nWe are preparing your items. Thank you!`;

        case 'completed':
          return `Hello ${customerName},\nThank you for shopping with ${shopTitle} via NearMart! ✨\nYour order #${orderNum} has been completed and collected.\nWe look forward to serving you again!`;

        case 'rejected':
        case 'cancelled':
          return `Hello ${customerName},\nRegarding your NearMart order #${orderNum} from ${shopTitle}: unfortunately, the order could not be fulfilled.${orderObj.rejection_reason ? `\nReason: ${orderObj.rejection_reason}` : ''}\nWe sincerely apologize for the inconvenience.`;

        case 'pending':
        default:
          return `Hello ${customerName},\nWe have received your NearMart order #${orderNum} at ${shopTitle}.\n\n📌 Pickup Code: *${code}*\n\nWe will confirm and begin packing your items shortly. Thank you!`;
      }
    }
  };

  const handleWhatsAppCustomer = (phone?: string) => {
    if (!phone || !order) return;
    const cleanDigits = phone.replace(/[^0-9]/g, '');
    const internationalPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;

    const message = getWhatsAppMessage(order, language);
    const encodedText = encodeURIComponent(message);
    const whatsappUrl = `whatsapp://send?phone=${internationalPhone}&text=${encodedText}`;
    const webWhatsappUrl = `https://wa.me/${internationalPhone}?text=${encodedText}`;

    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          return Linking.openURL(webWhatsappUrl);
        }
      })
      .catch(() => {
        Linking.openURL(webWhatsappUrl).catch(() => {
          Alert.alert('Notice', 'Unable to open WhatsApp.');
        });
      });
  };

  // Status transitions
  const handleStatusTransition = async (nextStatus: OrderStatus, reason?: string) => {
    if (!order) return;
    setIsActionLoading(true);
    try {
      const updated = await merchantApi.updateOrderStatus(order.id, nextStatus, reason);
      setOrder(updated);

      if (nextStatus === 'accepted') {
        Alert.alert('✓', t('merchantOrders.actions.acceptSuccess'));
      } else if (nextStatus === 'preparing') {
        Alert.alert('📦', t('merchantOrders.actions.startPreparingSuccess'));
      } else if (nextStatus === 'ready_for_pickup') {
        Alert.alert('🛍️', t('merchantOrders.actions.markReadySuccess'));
      } else if (nextStatus === 'completed') {
        Alert.alert('🎉', t('merchantOrders.actions.confirmPickupSuccess'));
      } else if (nextStatus === 'rejected') {
        Alert.alert('✓', t('merchantOrders.actions.rejectSuccess'));
      }
    } catch (err: any) {
      console.warn('Status transition error:', err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        t('merchantOrders.actions.actionFailed');
      Alert.alert('Notice', msg);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Produce weighing
  const openWeighModal = () => {
    if (!order) return;
    const initialInputs: WeighedInputState = {};
    order.items.forEach((item, index) => {
      if (item.pricing_type === 'store_priced') {
        const key = String(item.order_item_id || item.product_id || index);
        const currentQty =
          item.actual_quantity !== null && item.actual_quantity !== undefined
            ? String(item.actual_quantity)
            : String(item.requested_quantity || item.quantity || 1);
        const currentPrice =
          item.price !== undefined && item.price !== null
            ? String(item.price)
            : '';
        initialInputs[key] = {
          weight: currentQty,
          price: currentPrice,
        };
      }
    });
    setWeighedInputs(initialInputs);
    setIsWeighModalOpen(true);
  };

  const handleWeightInputChange = (key: string, field: 'weight' | 'price', value: string) => {
    setWeighedInputs((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const storePricedItems = useMemo(() => {
    if (!order) return [];
    return order.items.filter((i) => i.pricing_type === 'store_priced');
  }, [order]);

  // Live calculation for weighing modal
  const { liveProduceSubtotal, liveGrandTotal } = useMemo(() => {
    let produceSub = 0;
    storePricedItems.forEach((item, index) => {
      const key = String(item.order_item_id || item.product_id || index);
      const input = weighedInputs[key];
      const w = parseFloat(input?.weight || '0') || 0;
      const p = parseFloat(input?.price || '0') || 0;
      produceSub += w * p;
    });

    const fixedSub = Number(order?.fixed_items_subtotal || 0);
    return {
      liveProduceSubtotal: round2(produceSub),
      liveGrandTotal: round2(fixedSub + produceSub),
    };
  }, [storePricedItems, weighedInputs, order]);

  const handleSaveWeighing = async () => {
    if (!order) return;

    // Validate inputs
    const payload: WeighedItemInput[] = [];
    for (let i = 0; i < storePricedItems.length; i++) {
      const item = storePricedItems[i];
      const key = String(item.order_item_id || item.product_id || i);
      const input = weighedInputs[key];
      const w = parseFloat(input?.weight || '0');
      const p = parseFloat(input?.price || '0');

      if (!w || w <= 0 || isNaN(w) || isNaN(p) || p < 0) {
        Alert.alert('Notice', t('merchantOrders.weighModal.invalidInputs'));
        return;
      }

      payload.push({
        order_item_id: item.order_item_id,
        product_id: item.product_id,
        actual_quantity: w,
        unit_price: p,
      });
    }

    setIsSavingWeigh(true);
    try {
      const updated = await merchantApi.weighOrderItems(order.id, payload);
      setOrder(updated);
      setIsWeighModalOpen(false);
      Alert.alert('✓', t('merchantOrders.weighModal.success'));
    } catch (err: any) {
      console.warn('Failed to weigh items:', err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        t('merchantOrders.actions.actionFailed');
      Alert.alert('Notice', msg);
    } finally {
      setIsSavingWeigh(false);
    }
  };

  // Rejection confirmation
  const handleConfirmReject = () => {
    if (!order) return;
    const presetLabel =
      t(`merchantOrders.rejectModal.reasons.${selectedRejectPreset}` as any) ||
      selectedRejectPreset;
    const finalReason = customRejectReason.trim()
      ? `${presetLabel}: ${customRejectReason.trim()}`
      : presetLabel;

    setIsRejectModalOpen(false);
    handleStatusTransition('rejected', finalReason);
  };

  // Pickup confirmation
  const handleConfirmPickup = () => {
    setIsPickupModalOpen(false);
    handleStatusTransition('completed');
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'ready_for_pickup':
        return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' };
      case 'preparing':
        return { bg: '#EEF2FF', text: '#4F46E5', border: '#C7D2FE' };
      case 'accepted':
        return { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' };
      case 'completed':
        return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
      case 'cancelled':
      case 'rejected':
        return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' };
      case 'pending':
      default:
        return { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' };
    }
  };

  const getPricingBadge = (orderObj: Order) => {
    if (orderObj.pricing_status === 'finalized') {
      return { label: t('merchantOrders.badges.finalized'), bg: '#ECFDF5', text: '#059669' };
    }
    if (orderObj.has_pending_prices || orderObj.pricing_status === 'pending_verification') {
      return { label: t('merchantOrders.badges.store_priced'), bg: '#FFF7ED', text: '#EA580C' };
    }
    return { label: t('merchantOrders.badges.fixed'), bg: '#F8FAFC', text: '#64748B' };
  };

  const getPaymentBadge = (status?: string) => {
    if (status === 'paid') {
      return { label: t('merchantOrders.badges.paid'), bg: '#ECFDF5', text: '#16A34A' };
    }
    return { label: t('merchantOrders.badges.unpaid'), bg: '#FEF2F2', text: '#DC2626' };
  };

  // Determine available actions
  const effectiveActions: MerchantFulfillmentAction[] = useMemo(() => {
    if (!order) return [];
    if (Array.isArray(order.available_actions) && order.available_actions.length > 0) {
      return order.available_actions;
    }

    // Fallback derivation if server hasn't populated available_actions
    const st = order.fulfillment_status || order.status;
    const hasUnweighed =
      order.requires_weighing ??
      (order.items &&
        order.items.some(
          (i) => i.pricing_type === 'store_priced' && i.pricing_status !== 'finalized'
        ));

    switch (st) {
      case 'pending':
        return ['accept', 'reject'];
      case 'accepted':
        return ['start_preparing'];
      case 'preparing':
        return hasUnweighed ? ['weigh_produce'] : ['mark_ready_for_pickup'];
      case 'ready_for_pickup':
        return ['confirm_pickup'];
      default:
        return [];
    }
  }, [order]);

  if (isLoading || !order) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('merchantOrders.orderDetails')}</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  const badge = getStatusBadge(order.status);
  const pricingBadge = getPricingBadge(order);
  const paymentBadge = getPaymentBadge(order.payment_status);

  const dateFormatted = new Date(order.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isEstimated = order.has_pending_prices || order.pricing_status === 'pending_verification';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{order.order_number}</Text>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => refreshOrder(true)}
          disabled={isActionLoading}
        >
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Rejection Notice Banner if rejected */}
        {order.status === 'rejected' && (
          <View style={styles.rejectedBanner}>
            <Text style={styles.rejectedBannerTitle}>
              🚫 {t('orders.status.rejected')}
            </Text>
            {!!order.rejection_reason && (
              <Text style={styles.rejectedBannerReason}>
                {t('merchantOrders.rejectionReason')}: {order.rejection_reason}
              </Text>
            )}
          </View>
        )}

        {/* Pickup Code Verification Card */}
        <View style={styles.pickupCard}>
          <Text style={styles.pickupHeaderLabel}>{t('merchantOrders.pickupCode')}</Text>
          <Text style={styles.pickupCodeLarge}>{order.pickup_code}</Text>
          <Text style={styles.pickupNotice}>{t('merchantOrders.pickupCodeInstruction')}</Text>
        </View>

        {/* Statuses Row Card */}
        <View style={styles.card}>
          <View style={styles.statusBadgesRow}>
            <View
              style={[
                styles.badgePill,
                { backgroundColor: badge.bg, borderColor: badge.border },
              ]}
            >
              <Text style={[styles.badgeText, { color: badge.text }]}>
                {t(`orders.status.${order.status}` as any) || order.status}
              </Text>
            </View>

            <View style={[styles.badgePill, { backgroundColor: pricingBadge.bg, borderColor: '#E2E8F0' }]}>
              <Text style={[styles.badgeText, { color: pricingBadge.text }]}>
                {pricingBadge.label}
              </Text>
            </View>

            <View style={[styles.badgePill, { backgroundColor: paymentBadge.bg, borderColor: '#E2E8F0' }]}>
              <Text style={[styles.badgeText, { color: paymentBadge.text }]}>
                {paymentBadge.label}
              </Text>
            </View>
          </View>
          <Text style={styles.timestampText}>{dateFormatted}</Text>
        </View>

        {/* Customer Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardSectionTitle}>{t('merchantOrders.customer')}</Text>
            {!!order.customer_phone && (
              <View style={styles.contactActionsRow}>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => handleCallCustomer(order.customer_phone)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.callButtonText}>📞 {t('merchantOrders.callCustomer')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.whatsappButton}
                  onPress={() => handleWhatsAppCustomer(order.customer_phone)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.whatsappButtonText}>💬 {t('merchantOrders.whatsappCustomer') || 'WhatsApp'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={styles.customerDetailRow}>
            <Text style={styles.customerNameLarge}>{order.customer_name}</Text>
            <Text style={styles.customerPhoneLarge}>{order.customer_phone}</Text>
          </View>
          {!!order.customer_note && (
            <View style={styles.noteBox}>
              <Text style={styles.noteLabel}>{t('orders.note')}:</Text>
              <Text style={styles.noteText}>{order.customer_note}</Text>
            </View>
          )}
        </View>

        {/* Line Items Snapshot List */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardSectionTitle}>
              {t('merchantOrders.orderItems')} ({order.items.length})
            </Text>
            {order.status === 'preparing' && storePricedItems.length > 0 && (
              <TouchableOpacity style={styles.editWeighLink} onPress={openWeighModal}>
                <Text style={styles.editWeighLinkText}>
                  ⚖️ {order.pricing_status === 'finalized' ? 'Edit Weights' : t('merchantOrders.actions.weighProduce')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.itemsList}>
            {order.items.map((item, idx) => {
              const isProduce = item.pricing_type === 'store_priced';
              const isFinalized = item.pricing_status === 'finalized';

              return (
                <View key={item.order_item_id || idx} style={styles.itemRow}>
                  <View style={styles.itemInfoCol}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View style={styles.itemMetaRow}>
                      <Text style={styles.itemQtyText}>
                        Requested: {item.requested_quantity || item.quantity} {item.unit || ''}
                      </Text>
                      {isProduce ? (
                        <View style={[styles.produceBadge, isFinalized && styles.produceBadgeFinalized]}>
                          <Text style={[styles.produceBadgeText, isFinalized && styles.produceBadgeTextFinalized]}>
                            ⚖️ {isFinalized ? `Actual: ${item.actual_quantity} ${item.unit || ''}` : t('merchantOrders.badges.store_priced')}
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.itemPriceRate}>@ ₹{Number(item.price || 0).toFixed(2)}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.itemPriceCol}>
                    {isProduce && !isFinalized ? (
                      <Text style={styles.producePendingText}>Pending Weigh</Text>
                    ) : (
                      <>
                        <Text style={styles.itemLineTotal}>
                          ₹{Number(item.item_total || 0).toFixed(2)}
                        </Text>
                        {isProduce && isFinalized && (
                          <Text style={styles.itemRateSub}>@ ₹{Number(item.price || 0).toFixed(2)}</Text>
                        )}
                      </>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Order Summary & Totals */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>{t('merchantOrders.orderSummary')}</Text>

          {isEstimated && (
            <View style={styles.produceNoticeBox}>
              <Text style={styles.produceNoticeText}>
                ⚠️ {t('merchantOrders.produceNotice')}
              </Text>
            </View>
          )}

          {typeof order.fixed_items_subtotal === 'number' && isEstimated && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('merchantOrders.fixedSubtotal')}</Text>
              <Text style={styles.summaryValue}>
                ₹{Number(order.fixed_items_subtotal).toFixed(2)}
              </Text>
            </View>
          )}

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalRowLabel}>
              {isEstimated ? t('merchantOrders.estTotal') : t('merchantOrders.finalTotal')}
            </Text>
            <Text style={styles.totalRowValue}>
              ₹{Number(order.total || 0).toFixed(2)}
              {isEstimated && <Text style={styles.asteriskText}>*</Text>}
            </Text>
          </View>
        </View>

        {/* Interactive Fulfillment Actions Controller (APP-8.2) */}
        <View style={styles.actionCard}>
          <Text style={styles.actionCardTitle}>Fulfillment Actions</Text>

          {isActionLoading ? (
            <View style={styles.actionLoadingRow}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.actionLoadingText}>{t('merchantOrders.actions.updating')}</Text>
            </View>
          ) : (
            <View style={styles.actionButtonsContainer}>
              {/* 1. Pending: Accept / Reject */}
              {effectiveActions.includes('accept') && (
                <View style={styles.splitButtonRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => setIsRejectModalOpen(true)}
                  >
                    <Text style={styles.rejectBtnText}>
                      ✕ {t('merchantOrders.actions.reject')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.acceptBtn]}
                    onPress={() => handleStatusTransition('accepted')}
                  >
                    <Text style={styles.acceptBtnText}>
                      ✓ {t('merchantOrders.actions.accept')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* 2. Accepted: Start Preparing */}
              {effectiveActions.includes('start_preparing') && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.preparingBtn]}
                  onPress={() => handleStatusTransition('preparing')}
                >
                  <Text style={styles.preparingBtnText}>
                    📦 {t('merchantOrders.actions.startPreparing')}
                  </Text>
                </TouchableOpacity>
              )}

              {/* 3. Preparing & Unweighed: Weigh & Finalize */}
              {effectiveActions.includes('weigh_produce') && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.weighBtn]}
                  onPress={openWeighModal}
                >
                  <Text style={styles.weighBtnText}>
                    ⚖️ {t('merchantOrders.actions.weighProduce')}
                  </Text>
                </TouchableOpacity>
              )}

              {/* 4. Preparing & Finalized: Mark Ready for Pickup */}
              {effectiveActions.includes('mark_ready_for_pickup') && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.readyBtn]}
                  onPress={() => handleStatusTransition('ready_for_pickup')}
                >
                  <Text style={styles.readyBtnText}>
                    🛍️ {t('merchantOrders.actions.markReady')}
                  </Text>
                </TouchableOpacity>
              )}

              {/* 5. Ready for Pickup: Confirm Pickup */}
              {effectiveActions.includes('confirm_pickup') && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.confirmPickupBtn]}
                  onPress={() => setIsPickupModalOpen(true)}
                >
                  <Text style={styles.confirmPickupBtnText}>
                    🎉 {t('merchantOrders.actions.confirmPickup')}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Terminal state label */}
              {effectiveActions.length === 0 && (
                <View style={styles.terminalNotice}>
                  <Text style={styles.terminalNoticeText}>
                    {order.status === 'completed'
                      ? '✓ Order fulfillment completed successfully.'
                      : order.status === 'rejected'
                      ? '✕ Order was rejected.'
                      : 'Order has reached a terminal state.'}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ======================================================= */}
      {/* MODAL 1: Produce Weighing & Finalization Modal          */}
      {/* ======================================================= */}
      <Modal
        visible={isWeighModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsWeighModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t('merchantOrders.weighModal.title')}</Text>
                <Text style={styles.modalSubtitle}>{t('merchantOrders.weighModal.subtitle')}</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsWeighModalOpen(false)}
              >
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {storePricedItems.map((item, idx) => {
                const key = String(item.order_item_id || item.product_id || idx);
                const input = weighedInputs[key] || { weight: '', price: '' };
                const curW = parseFloat(input.weight || '0') || 0;
                const curP = parseFloat(input.price || '0') || 0;
                const lineTot = round2(curW * curP);

                return (
                  <View key={key} style={styles.weighItemCard}>
                    <View style={styles.weighItemHeader}>
                      <Text style={styles.weighItemName}>{item.name}</Text>
                      <View style={styles.reqQtyBadge}>
                        <Text style={styles.reqQtyBadgeText}>
                          {t('merchantOrders.weighModal.requested')}: {item.requested_quantity || item.quantity} {item.unit || ''}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.weighInputsRow}>
                      <View style={styles.inputCol}>
                        <Text style={styles.inputLabel}>
                          {t('merchantOrders.weighModal.actualWeight')} ({item.unit || 'unit'})
                        </Text>
                        <TextInput
                          style={styles.textInput}
                          keyboardType="decimal-pad"
                          placeholder="0.00"
                          value={input.weight}
                          onChangeText={(v) => handleWeightInputChange(key, 'weight', v)}
                        />
                      </View>

                      <View style={styles.inputCol}>
                        <Text style={styles.inputLabel}>
                          {t('merchantOrders.weighModal.ratePerUnit')}
                        </Text>
                        <TextInput
                          style={styles.textInput}
                          keyboardType="decimal-pad"
                          placeholder="0.00"
                          value={input.price}
                          onChangeText={(v) => handleWeightInputChange(key, 'price', v)}
                        />
                      </View>
                    </View>

                    <View style={styles.lineTotalRow}>
                      <Text style={styles.lineTotalLabel}>
                        {t('merchantOrders.weighModal.lineTotal')}:
                      </Text>
                      <Text style={styles.lineTotalValue}>₹{lineTot.toFixed(2)}</Text>
                    </View>
                  </View>
                );
              })}

              {/* Totals Preview in Modal */}
              <View style={styles.modalTotalsCard}>
                <View style={styles.modalTotalsRow}>
                  <Text style={styles.modalTotalsLabel}>
                    {t('merchantOrders.weighModal.fixedSubtotal')}:
                  </Text>
                  <Text style={styles.modalTotalsVal}>
                    ₹{Number(order.fixed_items_subtotal || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.modalTotalsRow}>
                  <Text style={styles.modalTotalsLabel}>
                    {t('merchantOrders.weighModal.produceSubtotal')}:
                  </Text>
                  <Text style={styles.modalTotalsVal}>₹{liveProduceSubtotal.toFixed(2)}</Text>
                </View>
                <View style={[styles.modalTotalsRow, styles.modalGrandTotalRow]}>
                  <Text style={styles.modalGrandTotalLabel}>
                    {t('merchantOrders.weighModal.grandTotal')}:
                  </Text>
                  <Text style={styles.modalGrandTotalVal}>₹{liveGrandTotal.toFixed(2)}</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsWeighModalOpen(false)}
                disabled={isSavingWeigh}
              >
                <Text style={styles.modalCancelBtnText}>{t('merchantOrders.weighModal.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, isSavingWeigh && styles.modalSubmitBtnDisabled]}
                onPress={handleSaveWeighing}
                disabled={isSavingWeigh}
              >
                {isSavingWeigh ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>
                    {t('merchantOrders.weighModal.saveAndFinalize')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ======================================================= */}
      {/* MODAL 2: Order Rejection Modal                         */}
      {/* ======================================================= */}
      <Modal
        visible={isRejectModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRejectModalOpen(false)}
      >
        <View style={styles.centerModalOverlay}>
          <View style={styles.centerModalCard}>
            <Text style={styles.rejectModalTitle}>
              🚫 {t('merchantOrders.rejectModal.title')}
            </Text>
            <Text style={styles.rejectModalSubtitle}>
              {t('merchantOrders.rejectModal.subtitle')}
            </Text>

            <View style={styles.reasonsList}>
              {['out_of_stock', 'store_closing', 'damaged', 'too_busy', 'other'].map((preset) => {
                const isSelected = selectedRejectPreset === preset;
                const label = t(`merchantOrders.rejectModal.reasons.${preset}` as any) || preset;
                return (
                  <TouchableOpacity
                    key={preset}
                    style={[styles.reasonChip, isSelected && styles.reasonChipSelected]}
                    onPress={() => setSelectedRejectPreset(preset)}
                  >
                    <Text style={[styles.reasonChipText, isSelected && styles.reasonChipTextSelected]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              style={styles.rejectReasonInput}
              placeholder={t('merchantOrders.rejectModal.customPlaceholder')}
              value={customRejectReason}
              onChangeText={setCustomRejectReason}
              multiline
              numberOfLines={2}
            />

            <View style={styles.centerModalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsRejectModalOpen(false)}
              >
                <Text style={styles.modalCancelBtnText}>
                  {t('merchantOrders.rejectModal.cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn, { flex: 1, paddingVertical: 12 }]}
                onPress={handleConfirmReject}
              >
                <Text style={styles.rejectBtnText}>
                  {t('merchantOrders.rejectModal.confirmReject')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================= */}
      {/* MODAL 3: Counter Pickup Code Confirmation Modal        */}
      {/* ======================================================= */}
      <Modal
        visible={isPickupModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPickupModalOpen(false)}
      >
        <View style={styles.centerModalOverlay}>
          <View style={styles.centerModalCard}>
            <Text style={styles.pickupModalTitle}>
              🛍️ {t('merchantOrders.confirmPickupModal.title')}
            </Text>
            <Text style={styles.pickupModalSubtitle}>
              {t('merchantOrders.confirmPickupModal.subtitle')}
            </Text>

            <View style={styles.pickupModalCodeBox}>
              <Text style={styles.pickupModalCodeLabel}>
                {t('merchantOrders.confirmPickupModal.codeLabel')}
              </Text>
              <Text style={styles.pickupModalCodeValue}>{order.pickup_code}</Text>
            </View>

            <Text style={styles.pickupModalInstruction}>
              {t('merchantOrders.confirmPickupModal.instruction')}
            </Text>

            <View style={styles.centerModalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsPickupModalOpen(false)}
              >
                <Text style={styles.modalCancelBtnText}>
                  {t('merchantOrders.confirmPickupModal.cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.confirmPickupBtn, { flex: 1, paddingVertical: 12 }]}
                onPress={handleConfirmPickup}
              >
                <Text style={styles.confirmPickupBtnText}>
                  {t('merchantOrders.confirmPickupModal.confirmButton')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  backIcon: {
    fontSize: 26,
    color: '#1E293B',
    lineHeight: 28,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  refreshIcon: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectedBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  rejectedBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  rejectedBannerReason: {
    fontSize: 13,
    color: '#991B1B',
  },
  pickupCard: {
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  pickupHeaderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#93C5FD',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pickupCodeLarge: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  pickupNotice: {
    fontSize: 12,
    color: '#DBEAFE',
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  statusBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timestampText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  editWeighLink: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editWeighLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C2410C',
  },
  contactActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  callButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  callButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  whatsappButton: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  whatsappButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  customerDetailRow: {
    gap: 2,
  },
  customerNameLarge: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  customerPhoneLarge: {
    fontSize: 13,
    color: '#64748B',
  },
  noteBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    marginTop: 4,
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  noteText: {
    fontSize: 13,
    color: '#92400E',
    marginTop: 2,
  },
  itemsList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemInfoCol: {
    flex: 1,
    gap: 4,
  },
  itemPriceCol: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  itemQtyText: {
    fontSize: 12,
    color: '#64748B',
  },
  itemPriceRate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  produceBadge: {
    backgroundColor: '#FFF7ED',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  produceBadgeFinalized: {
    backgroundColor: '#ECFDF5',
  },
  produceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EA580C',
  },
  produceBadgeTextFinalized: {
    color: '#059669',
  },
  itemLineTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemRateSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  producePendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EA580C',
  },
  produceNoticeBox: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    borderRadius: 8,
    padding: 10,
  },
  produceNoticeText: {
    fontSize: 12,
    color: '#9A3412',
    lineHeight: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    marginTop: 4,
  },
  totalRowLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalRowValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  asteriskText: {
    color: '#EA580C',
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    marginTop: 4,
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  actionLoadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  actionButtonsContainer: {
    gap: 10,
  },
  splitButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {
    flex: 2,
    backgroundColor: '#16A34A',
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectBtnText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
  preparingBtn: {
    backgroundColor: '#4F46E5',
  },
  preparingBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  weighBtn: {
    backgroundColor: '#EA580C',
  },
  weighBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  readyBtn: {
    backgroundColor: '#059669',
  },
  readyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  confirmPickupBtn: {
    backgroundColor: '#1E3A8A',
  },
  confirmPickupBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  terminalNotice: {
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    alignItems: 'center',
  },
  terminalNoticeText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseIcon: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '700',
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  weighItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    gap: 10,
  },
  weighItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weighItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  reqQtyBadge: {
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  reqQtyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4F46E5',
  },
  weighInputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputCol: {
    flex: 1,
    gap: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  lineTotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  lineTotalLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  lineTotalValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalTotalsCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 14,
    gap: 6,
    marginBottom: 16,
  },
  modalTotalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalTotalsLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  modalTotalsVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalGrandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1',
    paddingTop: 8,
    marginTop: 4,
  },
  modalGrandTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalGrandTotalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  modalActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    paddingTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  modalSubmitBtn: {
    flex: 2,
    borderRadius: 12,
    backgroundColor: '#EA580C',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnDisabled: {
    opacity: 0.6,
  },
  modalSubmitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Center Modal (Rejection / Pickup Confirmation)
  centerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  centerModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    gap: 14,
  },
  rejectModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DC2626',
    textAlign: 'center',
  },
  rejectModalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  reasonsList: {
    gap: 8,
  },
  reasonChip: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
  },
  reasonChipSelected: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  reasonChipText: {
    fontSize: 13,
    color: '#334155',
  },
  reasonChipTextSelected: {
    color: '#DC2626',
    fontWeight: '700',
  },
  rejectReasonInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    backgroundColor: '#F8FAFC',
    textAlignVertical: 'top',
  },
  centerModalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  pickupModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A8A',
    textAlign: 'center',
  },
  pickupModalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  pickupModalCodeBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  pickupModalCodeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
    textTransform: 'uppercase',
  },
  pickupModalCodeValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1E3A8A',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  pickupModalInstruction: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});
