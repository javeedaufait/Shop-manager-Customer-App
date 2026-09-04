import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useCart } from '../../hooks/useCart';
import { theme } from '../../utils/theme';

interface FloatingCartBarProps {
  currentShopId: number;
  onPressViewCart: () => void;
}

export const FloatingCartBar: React.FC<FloatingCartBarProps> = ({
  currentShopId,
  onPressViewCart,
}) => {
  const { cart } = useCart();

  // Only display if cart has items from this specific shop
  if (!cart.shop_id || cart.items.length === 0 || cart.shop_id !== currentShopId) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.bar}
        activeOpacity={0.9}
        onPress={onPressViewCart}
      >
        <View style={styles.leftInfo}>
          <Text style={styles.itemCountText}>
            {cart.total_quantity} {cart.total_quantity === 1 ? 'item' : 'items'}
          </Text>
          <Text style={styles.subtotalText}>₹{cart.subtotal}</Text>
        </View>

        <View style={styles.rightAction}>
          <Text style={styles.viewCartText}>View Cart</Text>
          <Text style={styles.arrowIcon}>›</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  bar: {
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  leftInfo: {
    flexDirection: 'column',
  },
  itemCountText: {
    color: '#D1FAE5',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtotalText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 1,
  },
  rightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewCartText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  arrowIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 22,
  },
});
