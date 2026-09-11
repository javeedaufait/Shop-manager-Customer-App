import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { NearbyProductResult } from '../../types/catalog';
import { theme } from '../../utils/theme';
import { useLocalization } from '../../hooks/useLocalization';

interface NearbyProductCardProps {
  item: NearbyProductResult;
  onPress: () => void;
}

export const NearbyProductCard: React.FC<NearbyProductCardProps> = ({ item, onPress }) => {
  const { t } = useLocalization();

  const isStorePriced =
    item.is_store_priced ||
    item.pricing_type === 'store_priced' ||
    item.price <= 0;

  const hasDiscount =
    !isStorePriced &&
    item.sale_price !== null &&
    item.sale_price !== undefined &&
    item.sale_price < item.price;

  let discountPercent = 0;
  if (hasDiscount && item.price > 0) {
    discountPercent = Math.round(((item.price - item.sale_price!) / item.price) * 100);
  }

  const displayPrice = hasDiscount ? item.sale_price : item.price;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={onPress}
    >
      {/* Product Image */}
      <View style={styles.imageContainer}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderEmoji}>📦</Text>
          </View>
        )}
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercent}% OFF</Text>
          </View>
        )}
      </View>

      {/* Product & Store Details */}
      <View style={styles.contentContainer}>
        {/* Brand & Unit Subtitle */}
        <View style={styles.metaRow}>
          {!!item.brand && (
            <Text style={styles.brandText} numberOfLines={1}>
              {item.brand}
            </Text>
          )}
          {!!item.brand && !!item.unit && <Text style={styles.dotSeparator}>·</Text>}
          {!!item.unit && (
            <Text style={styles.unitText} numberOfLines={1}>
              {item.unit}
            </Text>
          )}
        </View>

        {/* Product Title */}
        <Text style={styles.title} numberOfLines={2}>
          {item.name}
        </Text>

        {/* Store Context (Shop Name & Distance) */}
        <View style={styles.shopRow}>
          <Text style={styles.shopIcon}>🏬</Text>
          <Text style={styles.shopName} numberOfLines={1}>
            {item.shop_name}
          </Text>
          {!!item.distance_text && (
            <>
              <Text style={styles.dotSeparator}>·</Text>
              <Text style={styles.distanceText}>{item.distance_text}</Text>
            </>
          )}
        </View>

        {/* Price & Action Row */}
        <View style={styles.footerRow}>
          {/* Price / Store-Priced Tag */}
          <View style={styles.priceContainer}>
            {isStorePriced ? (
              <View style={styles.weighedBadge}>
                <Text style={styles.weighedText}>⚖️ {t('search.weighedAtShop')}</Text>
              </View>
            ) : (
              <View style={styles.priceRow}>
                <Text style={styles.priceSymbol}>₹</Text>
                <Text style={styles.priceValue}>{displayPrice}</Text>
                {hasDiscount && (
                  <Text style={styles.originalPrice}>₹{item.price}</Text>
                )}
              </View>
            )}
          </View>

          {/* Action CTA Button */}
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.85}
            onPress={onPress}
          >
            <Text style={styles.actionBtnText}>{t('search.viewProduct')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...theme.shadows.sm,
  },
  imageContainer: {
    width: 90,
    height: 90,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    marginRight: theme.spacing.md,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  placeholderEmoji: {
    fontSize: 32,
  },
  discountBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  brandText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  unitText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  dotSeparator: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginHorizontal: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  shopIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  shopName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    flexShrink: 1,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  priceContainer: {
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceSymbol: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginRight: 6,
  },
  originalPrice: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textDecorationLine: 'line-through',
  },
  weighedBadge: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  weighedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EA580C',
  },
  actionBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});
