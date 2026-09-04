import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { CartItem } from '../../types/cart';
import { theme } from '../../utils/theme';
import { QuantityControl } from './QuantityControl';

interface CartItemProps {
  item: CartItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

export const CartItemComponent: React.FC<CartItemProps> = ({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}) => {
  return (
    <View style={styles.card}>
      {/* Thumbnail */}
      <View style={styles.imageBox}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.image} resizeMode="contain" />
        ) : (
          <Text style={styles.placeholderEmoji}>📦</Text>
        )}
      </View>

      {/* Item Details */}
      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        {item.unit ? <Text style={styles.unit}>{item.unit}</Text> : null}
        <Text style={styles.price}>₹{item.price} each</Text>
      </View>

      {/* Stepper & Total Column */}
      <View style={styles.actionsColumn}>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>

        <Text style={styles.totalPrice}>₹{item.item_total}</Text>

        <QuantityControl
          quantity={item.quantity}
          onIncrease={onIncrease}
          onDecrease={onDecrease}
          size="small"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    gap: 12,
  },
  imageBox: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderEmoji: {
    fontSize: 28,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    lineHeight: 18,
    marginBottom: 4,
  },
  unit: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  price: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  actionsColumn: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
  },
  deleteBtn: {
    padding: 2,
  },
  deleteIcon: {
    fontSize: 14,
  },
  totalPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.primary,
  },
});
