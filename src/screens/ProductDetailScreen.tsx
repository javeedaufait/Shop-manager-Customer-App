import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CustomerStackParamList } from '../navigation/types';
import { useCart } from '../hooks/useCart';
import { QuantityControl } from '../components/cart/QuantityControl';
import { theme } from '../utils/theme';

type Props = NativeStackScreenProps<CustomerStackParamList, 'ProductDetail'>;

export const ProductDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { product, shopName } = route.params;
  const { cart, getItemQuantity, addToCart, updateQuantity, getItem } = useCart();

  const shopId = cart.shop_id || 101;
  const quantity = getItemQuantity(product.id);

  const isAvailable =
    product.available !== false &&
    (product.stock_quantity === undefined ||
      product.stock_quantity === null ||
      product.stock_quantity > 0);

  const hasDiscount =
    product.sale_price !== null &&
    product.sale_price !== undefined &&
    product.sale_price < product.price;

  let discountPercent = 0;
  let savingsAmount = 0;
  if (hasDiscount && product.price > 0) {
    savingsAmount = product.price - product.sale_price!;
    discountPercent = Math.round((savingsAmount / product.price) * 100);
  }

  const effectivePrice = (hasDiscount && product.sale_price !== null && product.sale_price !== undefined ? product.sale_price : product.price) || 0;

  const handleIncrease = () => {
    addToCart(product, shopId, shopName, 1);
  };

  const handleDecrease = () => {
    const item = getItem(product.id);
    if (item) {
      updateQuantity(item.item_id, quantity - 1);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Product Details
        </Text>

        {/* Cart Icon */}
        <TouchableOpacity
          style={styles.cartIconBtn}
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.8}
        >
          <Text style={styles.cartIconEmoji}>🛍️</Text>
          {cart.total_quantity > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cart.total_quantity}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {product.image ? (
            <Image
              source={{ uri: product.image }}
              style={[styles.productImage, !isAvailable && styles.imageMuted]}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderEmoji}>📦</Text>
            </View>
          )}

          {/* Stock Tag */}
          <View
            style={[
              styles.stockBadge,
              isAvailable ? styles.stockBadgeIn : styles.stockBadgeOut,
            ]}
          >
            <Text
              style={[
                styles.stockBadgeText,
                isAvailable ? styles.stockTextIn : styles.stockTextOut,
              ]}
            >
              {isAvailable ? '✓ In Stock' : '✕ Out of Stock'}
            </Text>
          </View>
        </View>

        {/* Product Details Section */}
        <View style={styles.infoSection}>
          <View style={styles.metaRow}>
            {product.brand ? (
              <Text style={styles.brandText}>{product.brand}</Text>
            ) : null}
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{product.category}</Text>
            </View>
          </View>

          <Text style={styles.title}>{product.name}</Text>

          {product.unit ? (
            <View style={styles.unitRow}>
              <Text style={styles.unitLabel}>Pack Size:</Text>
              <Text style={styles.unitValue}>{product.unit}</Text>
            </View>
          ) : null}

          {/* Price Card */}
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <View style={styles.priceBlock}>
                <Text style={styles.priceLabel}>Price</Text>
                <View style={styles.priceWithSymbol}>
                  <Text style={styles.currency}>₹</Text>
                  <Text style={styles.priceValue}>{effectivePrice}</Text>
                </View>
              </View>

              {hasDiscount && (
                <View style={styles.discountBlock}>
                  <Text style={styles.mrpText}>MRP ₹{product.price}</Text>
                  <View style={styles.savingsPill}>
                    <Text style={styles.savingsText}>
                      Save ₹{savingsAmount} ({discountPercent}% OFF)
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          {product.description ? (
            <View style={styles.descBlock}>
              <Text style={styles.sectionHeading}>Product Overview</Text>
              <Text style={styles.descText}>{product.description}</Text>
            </View>
          ) : null}

          {/* Sold by Partner Store */}
          <View style={styles.sellerCard}>
            <View style={styles.sellerIconBox}>
              <Text style={styles.sellerIcon}>🏪</Text>
            </View>
            <View style={styles.sellerDetails}>
              <Text style={styles.sellerLabel}>Sold & Fulfilled by</Text>
              <Text style={styles.sellerName}>{shopName}</Text>
              <Text style={styles.sellerNote}>
                Available for local neighborhood pickup
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Cart Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.bottomPriceColumn}>
          <Text style={styles.bottomPriceLabel}>
            {quantity > 0 ? `${quantity} in Cart` : 'Item Price'}
          </Text>
          <Text style={styles.bottomPriceValue}>
            ₹{quantity > 0 ? effectivePrice * quantity : effectivePrice}
          </Text>
        </View>

        {isAvailable ? (
          <QuantityControl
            quantity={quantity}
            onIncrease={handleIncrease}
            onDecrease={handleDecrease}
            onAdd={handleIncrease}
            size="medium"
          />
        ) : (
          <View style={styles.outOfStockBtn}>
            <Text style={styles.outOfStockBtnText}>Out of Stock</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 26,
    color: theme.colors.text,
    lineHeight: 28,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  cartIconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartIconEmoji: {
    fontSize: 22,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: '#DC2626',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  scrollContent: {
    paddingBottom: 90,
  },
  imageContainer: {
    width: '100%',
    height: 280,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  productImage: {
    width: '90%',
    height: '90%',
  },
  imageMuted: {
    opacity: 0.4,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 72,
  },
  stockBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  stockBadgeIn: {
    backgroundColor: '#DCFCE7',
  },
  stockBadgeOut: {
    backgroundColor: '#FEE2E2',
  },
  stockBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stockTextIn: {
    color: '#15803D',
  },
  stockTextOut: {
    color: '#B91C1C',
  },
  infoSection: {
    padding: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  brandText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    lineHeight: 28,
    marginBottom: 10,
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  unitLabel: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  unitValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  priceCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceBlock: {
    flexDirection: 'column',
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
  },
  priceWithSymbol: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
    marginRight: 2,
  },
  priceValue: {
    fontSize: 26,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  discountBlock: {
    alignItems: 'flex-end',
  },
  mrpText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  savingsPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  savingsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  descBlock: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
  },
  descText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
  },
  sellerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerIcon: {
    fontSize: 22,
  },
  sellerDetails: {
    flex: 1,
  },
  sellerLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 1,
  },
  sellerNote: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: 18,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  bottomPriceColumn: {
    flexDirection: 'column',
  },
  bottomPriceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  bottomPriceValue: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  outOfStockBtn: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  outOfStockBtnText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
});
