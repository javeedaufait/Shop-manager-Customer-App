import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Order } from '../../types/orders';
import { ordersApi, ReorderValidationResponse, ReorderItem } from '../../api/ordersApi';
import { useCart } from '../../hooks/useCart';
import { useLocalization } from '../../hooks/useLocalization';
import { theme } from '../../utils/theme';
import { Product } from '../../types/catalog';

interface BuyAgainCardProps {
  order: Order;
  onViewCart?: () => void;
  onNavigateToShop?: (shopId: number, shopName: string) => void;
}

export const BuyAgainCard: React.FC<BuyAgainCardProps> = ({
  order,
  onViewCart,
  onNavigateToShop,
}) => {
  const { t } = useLocalization();
  const { addToCart, getItemQuantity } = useCart();

  const [validation, setValidation] = useState<ReorderValidationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAddingAll, setIsAddingAll] = useState<boolean>(false);
  const [addedItemIds, setAddedItemIds] = useState<Record<number, boolean>>({});

  const fetchValidation = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await ordersApi.getReorderValidation(order.id);
      if (res && Array.isArray(res.items)) {
        setValidation(res);
      }
    } catch (err) {
      console.warn('Failed to validate order items for reorder:', err);
    } finally {
      setIsLoading(false);
    }
  }, [order.id]);

  useEffect(() => {
    fetchValidation();
  }, [fetchValidation]);

  const mapToProduct = (item: ReorderItem): Product => {
    return {
      id: item.product_id,
      name: item.name,
      unit: item.unit,
      image: item.image,
      brand: item.brand,
      category: item.category || 'Grocery',
      price: item.regular_price || item.current_price,
      sale_price: item.sale_price,
      available: item.available,
      stock_quantity: item.stock_quantity,
      is_store_priced: item.is_store_priced,
      pricing_type: item.pricing_type,
    } as any;
  };

  const handleAddSingle = async (item: ReorderItem) => {
    if (!item.can_reorder || !item.available) {
      Alert.alert(t('reorder.outOfStock'), item.name + ' ' + t('reorder.outOfStock'));
      return;
    }

    const product = mapToProduct(item);
    const success = await addToCart(
      product,
      validation?.shop_id || order.shop_id,
      validation?.shop_name || order.shop_name,
      item.requested_quantity || 1
    );

    if (success) {
      setAddedItemIds((prev) => ({ ...prev, [item.product_id]: true }));
    }
  };

  const handleAddAll = async () => {
    if (!validation || validation.items.length === 0) return;

    const availableItems = validation.items.filter((it) => it.can_reorder && it.available);
    if (availableItems.length === 0) {
      Alert.alert(t('reorder.title'), t('reorder.noItemsAvailable'));
      return;
    }

    setIsAddingAll(true);
    let addedCount = 0;
    const newAddedState: Record<number, boolean> = { ...addedItemIds };

    for (const item of availableItems) {
      const product = mapToProduct(item);
      const ok = await addToCart(
        product,
        validation.shop_id || order.shop_id,
        validation.shop_name || order.shop_name,
        item.requested_quantity || 1
      );
      if (ok) {
        addedCount++;
        newAddedState[item.product_id] = true;
      }
    }

    setAddedItemIds(newAddedState);
    setIsAddingAll(false);

    const hasUnavailable = validation.unavailable_count > 0;
    const message = hasUnavailable ? t('reorder.partialSuccess') : t('reorder.reorderSuccess');

    Alert.alert(t('reorder.title'), message, [
      { text: t('common.continue') || 'OK', style: 'default' },
      ...(onViewCart
        ? [
            {
              text: t('reorder.viewCart') || 'View Cart',
              onPress: onViewCart,
            },
          ]
        : []),
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.card}>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('reorder.loading')}</Text>
        </View>
      </View>
    );
  }

  if (!validation || validation.items.length === 0) {
    return null;
  }

  const availableCount = validation.available_count;

  return (
    <View style={styles.card}>
      {/* Store Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onNavigateToShop?.(validation.shop_id, validation.shop_name)}
          style={styles.shopInfo}
        >
          <Text style={styles.shopIcon}>🏬</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.shopName} numberOfLines={1}>
              {validation.shop_name}
            </Text>
            <Text style={styles.orderRef}>
              {t('orderConfirmation.orderNumber')}: #{order.order_number}
            </Text>
          </View>
        </TouchableOpacity>

        {availableCount > 0 && (
          <TouchableOpacity
            style={[styles.addAllBtn, isAddingAll && { opacity: 0.7 }]}
            activeOpacity={0.8}
            onPress={handleAddAll}
            disabled={isAddingAll}
          >
            {isAddingAll ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.addAllBtnText}>
                {t('reorder.addAllToCart')} ({availableCount})
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.divider} />

      {/* Items List */}
      <View style={styles.itemsList}>
        {validation.items.map((item) => {
          const inCartQty = getItemQuantity(item.product_id);
          const isAdded = inCartQty > 0 || !!addedItemIds[item.product_id];
          const isAvailable = item.can_reorder && item.available;

          return (
            <View key={`reorder-item-${item.product_id}`} style={styles.itemRow}>
              {/* Product Image */}
              <View style={styles.imageWrap}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
                ) : (
                  <Text style={styles.placeholderEmoji}>📦</Text>
                )}
              </View>

              {/* Product Info */}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.name}
                </Text>

                <View style={styles.metaRow}>
                  {item.unit && <Text style={styles.itemUnit}>{item.unit}</Text>}
                  {item.brand && (
                    <>
                      <Text style={styles.dot}>•</Text>
                      <Text style={styles.itemBrand}>{item.brand}</Text>
                    </>
                  )}
                </View>

                {/* Pricing & Stock Badges */}
                <View style={styles.priceRow}>
                  {item.is_store_priced ? (
                    <View style={styles.weighedChip}>
                      <Text style={styles.weighedText}>{t('reorder.weighedAtShop')}</Text>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                      <Text style={styles.currentPrice}>₹{item.current_price.toFixed(2)}</Text>
                      {item.price_changed && (
                        <Text style={styles.oldPrice}>₹{item.old_price.toFixed(2)}</Text>
                      )}
                    </View>
                  )}

                  <View
                    style={[
                      styles.stockChip,
                      isAvailable ? styles.stockChipIn : styles.stockChipOut,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stockText,
                        isAvailable ? styles.stockTextIn : styles.stockTextOut,
                      ]}
                    >
                      {isAvailable ? t('reorder.inStock') : t('reorder.outOfStock')}
                    </Text>
                  </View>
                </View>

                {item.price_changed && !item.is_store_priced && (
                  <Text style={styles.priceChangeNotice}>
                    {t('reorder.priceUpdated', {
                      old: item.old_price.toFixed(0),
                      current: item.current_price.toFixed(0),
                    })}
                  </Text>
                )}
              </View>

              {/* Action Button */}
              <View style={styles.actionWrap}>
                <TouchableOpacity
                  style={[
                    styles.addBtn,
                    !isAvailable && styles.addBtnDisabled,
                    isAdded && styles.addBtnAdded,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleAddSingle(item)}
                  disabled={!isAvailable}
                >
                  <Text
                    style={[
                      styles.addBtnText,
                      !isAvailable && styles.addBtnTextDisabled,
                      isAdded && styles.addBtnTextAdded,
                    ]}
                  >
                    {isAdded ? `✓ ${t('reorder.addedToCart')}` : t('reorder.addToCart')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: 14,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  loadingText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  shopInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shopIcon: {
    fontSize: 22,
  },
  shopName: {
    ...theme.typography.smallBold,
    fontSize: 15,
    color: theme.colors.text,
  },
  orderRef: {
    ...theme.typography.caption,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  addAllBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAllBtnText: {
    ...theme.typography.smallBold,
    color: '#FFFFFF',
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  itemsList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  imageWrap: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderEmoji: {
    fontSize: 20,
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    ...theme.typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  itemUnit: {
    ...theme.typography.caption,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  dot: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  itemBrand: {
    ...theme.typography.caption,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  currentPrice: {
    ...theme.typography.smallBold,
    fontSize: 13,
    color: theme.colors.primary,
  },
  oldPrice: {
    ...theme.typography.caption,
    fontSize: 11,
    color: theme.colors.textMuted,
    textDecorationLine: 'line-through',
  },
  weighedChip: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  weighedText: {
    ...theme.typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  stockChip: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: theme.borderRadius.sm,
  },
  stockChipIn: {
    backgroundColor: '#ECFDF5',
  },
  stockChipOut: {
    backgroundColor: '#FEF2F2',
  },
  stockText: {
    ...theme.typography.caption,
    fontSize: 10,
    fontWeight: '700',
  },
  stockTextIn: {
    color: '#059669',
  },
  stockTextOut: {
    color: '#DC2626',
  },
  priceChangeNotice: {
    ...theme.typography.caption,
    fontSize: 10,
    color: '#B45309',
    marginTop: 2,
  },
  actionWrap: {
    marginLeft: 6,
  },
  addBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    backgroundColor: '#FFFFFF',
  },
  addBtnDisabled: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  addBtnAdded: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  addBtnText: {
    ...theme.typography.smallBold,
    fontSize: 11,
    color: theme.colors.primary,
  },
  addBtnTextDisabled: {
    color: theme.colors.textMuted,
  },
  addBtnTextAdded: {
    color: '#FFFFFF',
  },
});
