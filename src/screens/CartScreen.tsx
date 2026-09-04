import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CustomerStackParamList } from '../navigation/types';
import { useCart } from '../hooks/useCart';
import { useLocalization } from '../hooks/useLocalization';
import { CartItemComponent } from '../components/cart/CartItemComponent';
import { OrderSummary } from '../components/cart/OrderSummary';
import { theme } from '../utils/theme';

type Props = NativeStackScreenProps<CustomerStackParamList, 'Cart'>;

export const CartScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();
  const { cart, updateQuantity, removeItem, clearCart } = useCart();

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => clearCart() },
      ]
    );
  };

  const handleProceedToPickup = () => {
    Alert.alert(
      'Pickup Ready Notice',
      `Your cart from ${cart.shop_name} contains ${cart.total_quantity} items totaling ₹${cart.subtotal}. Store pickup scheduling and payment processing will be available in Phase APP-7.`,
      [{ text: 'OK' }]
    );
  };

  const isEmpty = !cart.items || cart.items.length === 0;

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

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Your Cart</Text>
          {!isEmpty && (
            <Text style={styles.headerSubtitle}>
              {cart.total_quantity} {cart.total_quantity === 1 ? 'item' : 'items'}
            </Text>
          )}
        </View>

        {!isEmpty ? (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={handleClearCart}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      {isEmpty ? (
        /* Empty State */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyIcon}>🛍️</Text>
          </View>
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Looks like you haven't added any groceries yet. Explore neighborhood supermarkets near you.
          </Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('NearbyShops')}
          >
            <Text style={styles.exploreBtnText}>Explore Nearby Stores</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Cart List Content */
        <FlatList
          data={cart.items}
          keyExtractor={(item) => item.item_id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            /* Active Store Banner */
            <View style={styles.storeBanner}>
              <View style={styles.storeIconBox}>
                <Text style={styles.storeIcon}>🏪</Text>
              </View>
              <View style={styles.storeInfo}>
                <Text style={styles.storeTag}>Ordering from</Text>
                <Text style={styles.storeName}>{cart.shop_name}</Text>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <CartItemComponent
              item={item}
              onIncrease={() => updateQuantity(item.item_id, item.quantity + 1)}
              onDecrease={() => updateQuantity(item.item_id, item.quantity - 1)}
              onRemove={() => removeItem(item.item_id)}
            />
          )}
          ListFooterComponent={
            <View style={styles.footerContainer}>
              <OrderSummary cart={cart} />

              <View style={styles.trustNote}>
                <Text style={styles.trustIcon}>🛡️</Text>
                <Text style={styles.trustText}>
                  NearMart Hyperlocal Guarantee: Direct from store shelves, zero middlemen.
                </Text>
              </View>
            </View>
          }
        />
      )}

      {/* Bottom Sticky Checkout Action Bar */}
      {!isEmpty && (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <View style={styles.bottomInfo}>
            <Text style={styles.bottomTotalLabel}>Total to Pay at Pickup</Text>
            <Text style={styles.bottomTotalAmount}>₹{cart.subtotal}</Text>
          </View>

          <TouchableOpacity
            style={styles.checkoutBtn}
            activeOpacity={0.85}
            onPress={handleProceedToPickup}
          >
            <Text style={styles.checkoutBtnText}>Proceed to Pickup ›</Text>
          </TouchableOpacity>
        </View>
      )}
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  storeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    gap: 12,
  },
  storeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeIcon: {
    fontSize: 20,
  },
  storeInfo: {
    flex: 1,
  },
  storeTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 110,
  },
  footerContainer: {
    marginTop: 6,
  },
  trustNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginTop: 4,
  },
  trustIcon: {
    fontSize: 16,
  },
  trustText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  bottomInfo: {
    flexDirection: 'column',
  },
  bottomTotalLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
  },
  bottomTotalAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  checkoutBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyIcon: {
    fontSize: 44,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  exploreBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
