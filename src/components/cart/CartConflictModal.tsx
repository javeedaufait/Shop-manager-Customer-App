import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { useCart } from '../../hooks/useCart';
import { theme } from '../../utils/theme';

export const CartConflictModal: React.FC = () => {
  const { conflict, resolveConflict } = useCart();

  if (!conflict) return null;

  return (
    <Modal visible={true} transparent={true} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>🏪</Text>
          </View>

          <Text style={styles.title}>Start a New Cart?</Text>

          <Text style={styles.message}>
            Your cart contains items from{' '}
            <Text style={styles.boldText}>{conflict.current_shop_name}</Text>.
            NearMart orders are packed per store.
          </Text>

          <Text style={styles.submessage}>
            Adding items from{' '}
            <Text style={styles.boldText}>{conflict.new_shop_name}</Text> will
            replace your current cart.
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => resolveConflict(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>Keep Current</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.replaceBtn}
              onPress={() => resolveConflict(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.replaceBtnText}>Replace Cart</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  submessage: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  boldText: {
    fontWeight: '700',
    color: theme.colors.text,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  replaceBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  replaceBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
