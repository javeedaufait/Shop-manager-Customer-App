import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../utils/theme';

interface QuantityControlProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  onAdd?: () => void;
  size?: 'small' | 'medium';
  disabled?: boolean;
}

export const QuantityControl: React.FC<QuantityControlProps> = ({
  quantity,
  onIncrease,
  onDecrease,
  onAdd,
  size = 'small',
  disabled = false,
}) => {
  const isSmall = size === 'small';

  if (quantity === 0) {
    return (
      <TouchableOpacity
        style={[
          styles.addBtn,
          isSmall ? styles.addBtnSmall : styles.addBtnMedium,
          disabled && styles.disabledBtn,
        ]}
        onPress={onAdd || onIncrease}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.addBtnText,
            isSmall ? styles.addBtnTextSmall : styles.addBtnTextMedium,
          ]}
        >
          ADD +
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.stepperContainer,
        isSmall ? styles.stepperSmall : styles.stepperMedium,
        disabled && styles.disabledContainer,
      ]}
    >
      <TouchableOpacity
        style={[styles.stepBtn, isSmall ? styles.stepBtnSmall : styles.stepBtnMedium]}
        onPress={onDecrease}
        disabled={disabled}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[styles.stepBtnText, isSmall ? styles.stepBtnTextSmall : styles.stepBtnTextMedium]}>
          −
        </Text>
      </TouchableOpacity>

      <Text
        style={[
          styles.qtyText,
          isSmall ? styles.qtyTextSmall : styles.qtyTextMedium,
        ]}
      >
        {quantity}
      </Text>

      <TouchableOpacity
        style={[styles.stepBtn, isSmall ? styles.stepBtnSmall : styles.stepBtnMedium]}
        onPress={onIncrease}
        disabled={disabled}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[styles.stepBtnText, isSmall ? styles.stepBtnTextSmall : styles.stepBtnTextMedium]}>
          +
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  addBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#059669',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnSmall: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  addBtnMedium: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#059669',
    fontWeight: '800',
  },
  addBtnTextSmall: {
    fontSize: 12,
  },
  addBtnTextMedium: {
    fontSize: 15,
  },
  disabledBtn: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  stepperSmall: {
    height: 30,
    minWidth: 84,
    paddingHorizontal: 4,
  },
  stepperMedium: {
    height: 42,
    minWidth: 120,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  disabledContainer: {
    opacity: 0.6,
  },
  stepBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnSmall: {
    width: 24,
    height: 24,
  },
  stepBtnMedium: {
    width: 32,
    height: 32,
  },
  stepBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  stepBtnTextSmall: {
    fontSize: 16,
    lineHeight: 18,
  },
  stepBtnTextMedium: {
    fontSize: 20,
    lineHeight: 22,
  },
  qtyText: {
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
  },
  qtyTextSmall: {
    fontSize: 13,
    minWidth: 20,
  },
  qtyTextMedium: {
    fontSize: 16,
    minWidth: 28,
  },
});
