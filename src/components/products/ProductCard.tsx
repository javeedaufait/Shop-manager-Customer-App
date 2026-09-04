import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Product } from '../../types/catalog';
import { theme } from '../../utils/theme';
import { useCart } from '../../hooks/useCart';
import { QuantityControl } from '../cart/QuantityControl';

interface ProductCardProps {
  product: Product;
  shopId: number;
  shopName: string;
  onPress: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  shopId,
  shopName,
  onPress,
}) => {
  const { getItemQuantity, addToCart, updateQuantity, getItem } = useCart();
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
  if (hasDiscount && product.price > 0) {
    discountPercent = Math.round(
      ((product.price - product.sale_price!) / product.price) * 100
    );
  }

  const effectivePrice = hasDiscount ? product.sale_price : product.price;

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
    <TouchableOpacity
      style={[styles.card, !isAvailable && styles.cardUnavailable]}
      activeOpacity={0.88}
      onPress={onPress}
    >
      {/* Product Image Container */}
      <View style={styles.imageContainer}>
        {product.image ? (
          <Image
            source={{ uri: product.image }}
            style={[styles.image, !isAvailable && styles.imageMuted]}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderEmoji}>📦</Text>
          </View>
        )}

        {/* Discount Badge */}
        {hasDiscount && isAvailable && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercent}% OFF</Text>
          </View>
        )}

        {/* Out of stock overlay badge */}
        {!isAvailable && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Brand & Unit */}
        <View style={styles.tagRow}>
          {product.brand ? (
            <Text style={styles.brandText} numberOfLines={1}>
              {product.brand}
            </Text>
          ) : null}
          {product.unit ? (
            <View style={styles.unitBadge}>
              <Text style={styles.unitText}>{product.unit}</Text>
            </View>
          ) : null}
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Pricing Section & Stepper */}
        <View style={styles.priceRow}>
          <View style={styles.priceColumn}>
            <View style={styles.priceWithSymbol}>
              <Text style={styles.currency}>₹</Text>
              <Text style={styles.effectivePrice}>{effectivePrice}</Text>
            </View>
            {hasDiscount && (
              <Text style={styles.strikePrice}>₹{product.price}</Text>
            )}
          </View>

          {/* Stepper / ADD Button */}
          {isAvailable ? (
            <QuantityControl
              quantity={quantity}
              onIncrease={handleIncrease}
              onDecrease={handleDecrease}
              onAdd={handleIncrease}
              size="small"
            />
          ) : (
            <View style={styles.disabledTag}>
              <Text style={styles.disabledTagText}>N/A</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    marginBottom: 12,
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardUnavailable: {
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  imageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#F9FAFB',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageMuted: {
    opacity: 0.45,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 36,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  outOfStockBadge: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    padding: 10,
    flex: 1,
    justifyContent: 'space-between',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  brandText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  unitBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unitText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
    lineHeight: 18,
    marginBottom: 8,
    minHeight: 36,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 4,
  },
  priceColumn: {
    flexDirection: 'column',
  },
  priceWithSymbol: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
    marginRight: 1,
  },
  effectivePrice: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  strikePrice: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textDecorationLine: 'line-through',
    marginTop: 1,
  },
  disabledTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  disabledTagText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
});
