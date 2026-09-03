import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Shop } from '../../types/shops';
import { theme } from '../../utils/theme';
import { useLocalization } from '../../hooks/useLocalization';

interface ShopCardProps {
  shop: Shop;
  onPress?: () => void;
}

export const ShopCard: React.FC<ShopCardProps> = ({ shop, onPress }) => {
  const { t } = useLocalization();
  const isOpen = shop.is_open;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={styles.card}
    >
      {/* Top Banner / Image */}
      <View style={styles.imageContainer}>
        {shop.photo_url ? (
          <Image
            source={{ uri: shop.photo_url }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>🏪</Text>
          </View>
        )}

        {/* Distance Badge */}
        {shop.distance_text ? (
          <View style={styles.distanceBadge}>
            <Text style={styles.distancePin}>📍</Text>
            <Text style={styles.distanceText}>
              {shop.distance_text} {t('shops.kmAway')}
            </Text>
          </View>
        ) : null}

        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            isOpen ? styles.statusOpen : styles.statusClosed,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOpen ? '#16a34a' : '#ef4444' },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: isOpen ? '#15803d' : '#b91c1c' },
            ]}
          >
            {isOpen ? t('shops.openNow') : t('shops.closed')}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {shop.name}
          </Text>
          {shop.status === 'verified' && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedIcon}>✓</Text>
            </View>
          )}
        </View>

        <Text style={styles.type}>{shop.shop_type}</Text>

        <View style={styles.addressRow}>
          <Text style={styles.addressPin}>📍</Text>
          <Text style={styles.address} numberOfLines={2}>
            {shop.address || 'Neighborhood Store'}
          </Text>
        </View>

        {/* Footer features */}
        <View style={styles.footer}>
          <View style={styles.pickupPill}>
            <Text style={styles.pickupText}>📦 {t('shops.pickupReady')}</Text>
          </View>

          <View style={styles.viewShopBtn}>
            <Text style={styles.viewShopText}>{t('shops.viewShop')} →</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.base,
    ...theme.shadows.md,
  },
  imageContainer: {
    height: 140,
    width: '100%',
    backgroundColor: theme.colors.primaryLight,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  placeholderIcon: {
    fontSize: 44,
  },
  distanceBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.sm,
  },
  distancePin: {
    fontSize: 12,
    marginRight: 4,
  },
  distanceText: {
    ...theme.typography.smallBold,
    color: theme.colors.text,
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.sm,
  },
  statusOpen: {
    backgroundColor: '#dcfce7',
  },
  statusClosed: {
    backgroundColor: '#fee2e2',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    ...theme.typography.smallBold,
  },
  content: {
    padding: theme.spacing.base,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    ...theme.typography.title,
    fontSize: 18,
    color: theme.colors.text,
    flex: 1,
    marginRight: 6,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedIcon: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  type: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: theme.spacing.sm,
    gap: 6,
  },
  addressPin: {
    fontSize: 12,
    marginTop: 2,
  },
  address: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  pickupPill: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  pickupText: {
    ...theme.typography.smallBold,
    fontSize: 11,
    color: '#16a34a',
  },
  viewShopBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewShopText: {
    ...theme.typography.smallBold,
    color: theme.colors.primary,
  },
});