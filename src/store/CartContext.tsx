import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Cart, CartItem, CartConflict, AddToCartPayload } from '../types/cart';
import { Product } from '../types/catalog';
import { cartApi } from '../api/cartApi';
import { storageService } from '../services/storageService';
import { useAuth } from '../hooks/useAuth';

const LOCAL_CART_KEY = '@nearmart_local_cart_v1';

export interface CartContextValue {
  cart: Cart;
  isLoading: boolean;
  conflict: CartConflict | null;
  addToCart: (product: Product, shopId: number, shopName: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  resolveConflict: (replace: boolean) => Promise<void>;
  dismissConflict: () => void;
  getItemQuantity: (productId: number) => number;
  getItem: (productId: number) => CartItem | undefined;
}

const EMPTY_CART: Cart = {
  shop_id: null,
  shop_name: null,
  items: [],
  item_count: 0,
  total_quantity: 0,
  subtotal: 0,
};

function computeTotals(items: CartItem[]): { item_count: number; total_quantity: number; subtotal: number } {
  let totalQty = 0;
  let subtotal = 0;
  items.forEach((item) => {
    totalQty += item.quantity;
    subtotal += item.item_total;
  });
  return {
    item_count: items.length,
    total_quantity: totalQty,
    subtotal: Math.round(subtotal * 100) / 100,
  };
}

export const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [conflict, setConflict] = useState<CartConflict | null>(null);
  const [pendingItem, setPendingItem] = useState<{
    product: Product;
    shopId: number;
    shopName: string;
    quantity: number;
  } | null>(null);

  // Helper to persist local cart
  const persistCart = async (newCart: Cart) => {
    setCart(newCart);
    await storageService.setItem(LOCAL_CART_KEY, JSON.stringify(newCart));
  };

  // Bootstrap cart from storage and server
  useEffect(() => {
    let mounted = true;

    async function initCart() {
      setIsLoading(true);
      try {
        const stored = await storageService.getItem(LOCAL_CART_KEY);
        if (stored && mounted) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed && Array.isArray(parsed.items)) {
              setCart(parsed);
            }
          } catch (e) {
            // Ignore parse error
          }
        }

        // Sync with backend API
        const serverData = await cartApi.getCart();
        if (serverData?.cart && mounted) {
          if (serverData.cart.items.length > 0) {
            await persistCart(serverData.cart);
          }
        }
      } catch (err) {
        console.warn('Cart initialization error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initCart();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  const getItemQuantity = useCallback(
    (productId: number): number => {
      const match = cart.items.find((item) => item.product_id === productId);
      return match ? match.quantity : 0;
    },
    [cart.items]
  );

  const getItem = useCallback(
    (productId: number): CartItem | undefined => {
      return cart.items.find((item) => item.product_id === productId);
    },
    [cart.items]
  );

  const addToCart = useCallback(
    async (product: Product, shopId: number, shopName: string, quantity = 1): Promise<boolean> => {
      // 1. Single-Shop MVP Rule Check
      if (cart.shop_id && cart.items.length > 0 && cart.shop_id !== shopId) {
        setConflict({
          current_shop_id: cart.shop_id,
          current_shop_name: cart.shop_name || 'Current Shop',
          new_shop_id: shopId,
          new_shop_name: shopName,
        });
        setPendingItem({ product, shopId, shopName, quantity });
        return false;
      }

      // 2. Add or increment item
      const effectivePrice =
        product.sale_price !== null && product.sale_price !== undefined && product.sale_price < product.price
          ? product.sale_price
          : product.price;

      const existingIndex = cart.items.findIndex((i) => i.product_id === product.id);
      let newItems = [...cart.items];

      if (existingIndex >= 0) {
        const item = newItems[existingIndex];
        const newQty = item.quantity + quantity;
        newItems[existingIndex] = {
          ...item,
          quantity: newQty,
          item_total: Math.round(newQty * item.price * 100) / 100,
        };
      } else {
        newItems.push({
          item_id: 'item_' + product.id,
          product_id: product.id,
          shop_id: shopId,
          name: product.name,
          image: product.image,
          unit: product.unit,
          price: effectivePrice,
          quantity: quantity,
          item_total: Math.round(effectivePrice * quantity * 100) / 100,
        });
      }

      const totals = computeTotals(newItems);
      const updatedCart: Cart = {
        shop_id: shopId,
        shop_name: shopName,
        items: newItems,
        ...totals,
      };

      await persistCart(updatedCart);

      // Background API sync
      cartApi
        .addItem({
          shop_id: shopId,
          shop_name: shopName,
          product_id: product.id,
          name: product.name,
          image: product.image,
          unit: product.unit,
          price: effectivePrice,
          quantity: quantity,
        })
        .catch((e) => console.warn('Background cart add sync failed:', e));

      return true;
    },
    [cart]
  );

  const resolveConflict = useCallback(
    async (replace: boolean) => {
      if (!replace || !pendingItem) {
        setConflict(null);
        setPendingItem(null);
        return;
      }

      const { product, shopId, shopName, quantity } = pendingItem;
      const effectivePrice =
        product.sale_price !== null && product.sale_price !== undefined && product.sale_price < product.price
          ? product.sale_price
          : product.price;

      const singleItem: CartItem = {
        item_id: 'item_' + product.id,
        product_id: product.id,
        shop_id: shopId,
        name: product.name,
        image: product.image,
        unit: product.unit,
        price: effectivePrice,
        quantity: quantity,
        item_total: Math.round(effectivePrice * quantity * 100) / 100,
      };

      const newCart: Cart = {
        shop_id: shopId,
        shop_name: shopName,
        items: [singleItem],
        item_count: 1,
        total_quantity: quantity,
        subtotal: singleItem.item_total,
      };

      setConflict(null);
      setPendingItem(null);
      await persistCart(newCart);

      // Background API sync with replace_cart: true
      cartApi
        .addItem({
          shop_id: shopId,
          shop_name: shopName,
          product_id: product.id,
          name: product.name,
          image: product.image,
          unit: product.unit,
          price: effectivePrice,
          quantity: quantity,
          replace_cart: true,
        })
        .catch((e) => console.warn('Background cart replace sync failed:', e));
    },
    [pendingItem]
  );

  const dismissConflict = useCallback(() => {
    setConflict(null);
    setPendingItem(null);
  }, []);

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        await removeItem(itemId);
        return;
      }

      const newItems = cart.items.map((item) => {
        if (item.item_id === itemId) {
          return {
            ...item,
            quantity,
            item_total: Math.round(item.price * quantity * 100) / 100,
          };
        }
        return item;
      });

      const totals = computeTotals(newItems);
      const updatedCart: Cart = {
        ...cart,
        items: newItems,
        ...totals,
      };

      await persistCart(updatedCart);

      cartApi.updateItem(itemId, quantity).catch((e) => console.warn('Cart update sync failed:', e));
    },
    [cart]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      const newItems = cart.items.filter((item) => item.item_id !== itemId);
      const totals = computeTotals(newItems);

      const updatedCart: Cart = {
        shop_id: newItems.length > 0 ? cart.shop_id : null,
        shop_name: newItems.length > 0 ? cart.shop_name : null,
        items: newItems,
        ...totals,
      };

      await persistCart(updatedCart);

      cartApi.removeItem(itemId).catch((e) => console.warn('Cart remove sync failed:', e));
    },
    [cart]
  );

  const clearCart = useCallback(async () => {
    await persistCart(EMPTY_CART);
    cartApi.clearCart().catch((e) => console.warn('Cart clear sync failed:', e));
  }, []);

  const value = useMemo(
    () => ({
      cart,
      isLoading,
      conflict,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      resolveConflict,
      dismissConflict,
      getItemQuantity,
      getItem,
    }),
    [
      cart,
      isLoading,
      conflict,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      resolveConflict,
      dismissConflict,
      getItemQuantity,
      getItem,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
