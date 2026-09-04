import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CustomerStackParamList } from '../navigation/types';
import { shopsApi } from '../api/shopsApi';
import { Shop } from '../types/shops';
import { Product } from '../types/catalog';
import { theme } from '../utils/theme';
import { useLocalization } from '../hooks/useLocalization';
import { useCart } from '../hooks/useCart';
import { CategoryFilter } from '../components/products/CategoryFilter';
import { ProductCard } from '../components/products/ProductCard';
import { FloatingCartBar } from '../components/cart/FloatingCartBar';
import { CartConflictModal } from '../components/cart/CartConflictModal';

type Props = NativeStackScreenProps<CustomerStackParamList, 'ShopCatalog'>;

export const ShopCatalogScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();
  const { cart } = useCart();
  const { shopId, shopName, shop: initialShop } = route.params;

  const [shop, setShop] = useState<Shop | null>(initialShop || null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load Shop Details if not passed
  useEffect(() => {
    if (!shop) {
      shopsApi.getShopDetails(shopId).then((res) => {
        if (res?.shop) setShop(res.shop);
      });
    }
  }, [shopId, shop]);

  // Fetch Catalog Products
  const loadCatalog = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setIsLoading(true);
      setError(null);

      try {
        const res = await shopsApi.getShopProducts(shopId, {
          category: selectedCategory === 'All' ? undefined : selectedCategory,
          search: searchQuery.trim() || undefined,
        });

        if (res && Array.isArray(res.products)) {
          setProducts(res.products);

          if (categories.length === 0 && res.products.length > 0) {
            const uniqueCats = Array.from(
              new Set(res.products.map((p) => p.category).filter(Boolean))
            );
            setCategories(uniqueCats);
          }
        }
      } catch (err: any) {
        console.warn('Error fetching shop products:', err);
        setError(err?.message || 'Could not load products');
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [shopId, selectedCategory, searchQuery, categories.length]
  );

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCatalog(true);
  };

  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCategory && selectedCategory !== 'All') {
      list = list.filter(
        (p) => p.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q))
      );
    }
    return list;
  }, [products, selectedCategory, searchQuery]);

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

        <View style={styles.headerInfo}>
          <Text style={styles.headerShopName} numberOfLines={1}>
            {shop?.name || shopName}
          </Text>
          <Text style={styles.headerShopSubtitle} numberOfLines={1}>
            {shop?.shop_type || 'Local Supermarket'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {shop && (
            <TouchableOpacity
              style={styles.infoBtn}
              onPress={() => navigation.navigate('ShopDetails', { shopId, shop })}
              activeOpacity={0.8}
            >
              <Text style={styles.infoBtnIcon}>ℹ️</Text>
            </TouchableOpacity>
          )}

          {/* Cart Icon in Header */}
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
      </View>

      {/* Store Banner */}
      <TouchableOpacity
        style={styles.storeBanner}
        activeOpacity={shop ? 0.8 : 1}
        onPress={() => {
          if (shop) navigation.navigate('ShopDetails', { shopId, shop });
        }}
      >
        <View style={styles.bannerRow}>
          <View style={styles.statusPill}>
            <Text style={styles.statusDot}>●</Text>
            <Text style={styles.statusPillText}>
              {shop?.availability?.badge || 'Open Now'}
            </Text>
          </View>
          {shop?.distance_text && (
            <Text style={styles.bannerMeta}>📍 {shop.distance_text}</Text>
          )}
          {shop?.availability?.timing && (
            <Text style={styles.bannerMeta}>🕒 {shop.availability.timing}</Text>
          )}
        </View>
        <Text style={styles.bannerAddress} numberOfLines={1}>
          {shop?.address || 'Local Neighborhood Partner'} ›
        </Text>
      </TouchableOpacity>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products in this store..."
          placeholderTextColor={theme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter Pills */}
      {categories.length > 0 && (
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      )}

      {/* Products Content */}
      {isLoading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading store catalog...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.stateEmoji}>⚠️</Text>
          <Text style={styles.stateTitle}>Could Not Load Products</Text>
          <Text style={styles.stateSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadCatalog()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.stateEmoji}>🛒</Text>
          <Text style={styles.stateTitle}>No Products Found</Text>
          <Text style={styles.stateSubtitle}>
            {searchQuery
              ? 'No products match your search query.'
              : 'No items currently available in this category.'}
          </Text>
          {(searchQuery !== '' || selectedCategory !== 'All') && (
            <TouchableOpacity
              style={styles.resetFilterBtn}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
            >
              <Text style={styles.resetFilterBtnText}>Show All Products</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={[
            styles.gridContent,
            cart.shop_id === shopId && cart.items.length > 0 && { paddingBottom: 85 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
          ListHeaderComponent={
            <View style={styles.catalogStats}>
              <Text style={styles.catalogStatsText}>
                {filteredProducts.length}{' '}
                {filteredProducts.length === 1 ? 'product' : 'products'} available
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              shopId={shopId}
              shopName={shop?.name || shopName}
              onPress={() =>
                navigation.navigate('ProductDetail', {
                  product: item,
                  shopName: shop?.name || shopName,
                })
              }
            />
          )}
        />
      )}

      {/* Floating Bottom Cart Bar (Sticky when this shop has items) */}
      <FloatingCartBar
        currentShopId={shopId}
        onPressViewCart={() => navigation.navigate('Cart')}
      />

      {/* Single-Shop Conflict Confirmation Modal */}
      <CartConflictModal />
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
    marginRight: 10,
  },
  backIcon: {
    fontSize: 26,
    color: theme.colors.text,
    lineHeight: 28,
  },
  headerInfo: {
    flex: 1,
  },
  headerShopName: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
  },
  headerShopSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoBtnIcon: {
    fontSize: 16,
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
  storeBanner: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    fontSize: 8,
    color: '#16A34A',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  bannerMeta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  bannerAddress: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: 14,
    marginVertical: 10,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
  },
  clearIcon: {
    fontSize: 14,
    color: theme.colors.textMuted,
    paddingHorizontal: 4,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  stateEmoji: {
    fontSize: 44,
    marginBottom: 12,
  },
  stateTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  stateSubtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  resetFilterBtn: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
  },
  resetFilterBtnText: {
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  gridContent: {
    paddingHorizontal: 10,
    paddingBottom: 24,
  },
  catalogStats: {
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  catalogStatsText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
});
