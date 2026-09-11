import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MerchantStackParamList } from '../navigation/types';
import { useLocalization } from '../hooks/useLocalization';
import { merchantApi, MerchantCatalogProduct } from '../api/merchantApi';
import { theme } from '../utils/theme';

type Props = NativeStackScreenProps<MerchantStackParamList, 'MerchantCatalog'>;

type FilterStatus = 'all' | 'instock' | 'outofstock';

export const MerchantCatalogScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { t, language } = useLocalization();

  const [products, setProducts] = useState<MerchantCatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [updatingIds, setUpdatingIds] = useState<Record<number, boolean>>({});

  // Fetch catalog from backend
  const fetchCatalog = useCallback(
    async (isRefresh: boolean = false) => {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const resp = await merchantApi.getProducts({
          search: searchQuery.trim(),
          status: activeFilter,
          limit: 100,
          lang: language as 'en' | 'ml',
        });
        if (resp && Array.isArray(resp.products)) {
          setProducts(resp.products);
        }
      } catch (err: any) {
        console.warn('Failed to fetch merchant catalog:', err);
        Alert.alert(
          'Notice',
          err?.response?.data?.message || t('merchantCatalog.updateFailed')
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [searchQuery, activeFilter, language, t]
  );

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCatalog(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, activeFilter]);

  // Handle 1-Tap Toggle Availability
  const handleToggleAvailability = async (product: MerchantCatalogProduct) => {
    const nextAvailable = !product.available;
    const targetId = product.id;

    // Optimistic UI update
    setUpdatingIds((prev) => ({ ...prev, [targetId]: true }));
    setProducts((prev) =>
      prev.map((item) =>
        item.id === targetId
          ? {
              ...item,
              available: nextAvailable,
              stock_status: nextAvailable ? 'instock' : 'outofstock',
            }
          : item
      )
    );

    try {
      const updated = await merchantApi.updateProductAvailability(
        targetId,
        nextAvailable
      );

      // Reconcile with authoritative response
      setProducts((prev) =>
        prev.map((item) =>
          item.id === targetId
            ? {
                ...item,
                available: updated.available,
                stock_status: updated.stock_status,
              }
            : item
        )
      );
    } catch (err: any) {
      console.warn('Failed to update product availability:', err);
      // Revert optimistic update
      setProducts((prev) =>
        prev.map((item) =>
          item.id === targetId
            ? {
                ...item,
                available: !nextAvailable,
                stock_status: !nextAvailable ? 'instock' : 'outofstock',
              }
            : item
        )
      );
      const errMsg =
        err?.response?.data?.message || t('merchantCatalog.updateFailed');
      Alert.alert('Notice', errMsg);
    } finally {
      setUpdatingIds((prev) => {
        const copy = { ...prev };
        delete copy[targetId];
        return copy;
      });
    }
  };

  // Counts for filters
  const counts = useMemo(() => {
    let inStockCount = 0;
    let outOfStockCount = 0;
    products.forEach((p) => {
      if (p.available) inStockCount++;
      else outOfStockCount++;
    });
    return {
      all: products.length,
      instock: inStockCount,
      outofstock: outOfStockCount,
    };
  }, [products]);

  const renderProductItem = ({ item }: { item: MerchantCatalogProduct }) => {
    const isUpdating = !!updatingIds[item.id];
    const isAvailable = item.available;

    const subtitleParts: string[] = [];
    if (item.unit) subtitleParts.push(item.unit);
    if (item.brand) subtitleParts.push(item.brand);
    if (item.shop_sku) subtitleParts.push(`SKU: ${item.shop_sku}`);
    const subtitle = subtitleParts.join(' • ');

    const hasSale =
      item.sale_price !== null &&
      item.sale_price !== undefined &&
      item.sale_price < item.price;

    return (
      <View style={styles.productCard}>
        {/* Left: Thumbnail / Fallback Graphic */}
        <View style={styles.thumbContainer}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.thumbImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <Text style={styles.thumbEmoji}>📦</Text>
            </View>
          )}
        </View>

        {/* Middle: Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>

          {!!subtitle && (
            <Text style={styles.productSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}

          {/* Pricing */}
          <View style={styles.pricingRow}>
            {hasSale ? (
              <>
                <Text style={styles.salePriceText}>
                  ₹{Number(item.sale_price).toFixed(2)}
                </Text>
                <Text style={styles.regularPriceStrike}>
                  ₹{Number(item.price).toFixed(2)}
                </Text>
              </>
            ) : (
              <Text style={styles.priceText}>
                ₹{Number(item.price).toFixed(2)}
              </Text>
            )}
          </View>
        </View>

        {/* Right: 1-Tap Availability Toggle Button */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              isAvailable ? styles.toggleAvailable : styles.toggleUnavailable,
            ]}
            onPress={() => handleToggleAvailability(item)}
            disabled={isUpdating}
            activeOpacity={0.8}
          >
            {isUpdating ? (
              <ActivityIndicator
                size="small"
                color={isAvailable ? '#059669' : '#DC2626'}
              />
            ) : (
              <>
                <Text
                  style={[
                    styles.toggleIcon,
                    isAvailable
                      ? styles.toggleIconAvailable
                      : styles.toggleIconUnavailable,
                  ]}
                >
                  {isAvailable ? '✓' : '✕'}
                </Text>
                <Text
                  style={[
                    styles.toggleText,
                    isAvailable
                      ? styles.toggleTextAvailable
                      : styles.toggleTextUnavailable,
                  ]}
                >
                  {isAvailable
                    ? t('merchantCatalog.availableBadge')
                    : t('merchantCatalog.unavailableBadge')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{t('merchantCatalog.title')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('merchantCatalog.subtitle')}
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={t('merchantCatalog.searchPlaceholder')}
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
          autoCapitalize="none"
          autoCorrect={false}
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

      {/* Filter Pills */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterPill,
            activeFilter === 'all' && styles.filterPillActive,
          ]}
          onPress={() => setActiveFilter('all')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.filterPillText,
              activeFilter === 'all' && styles.filterPillTextActive,
            ]}
          >
            {t('merchantCatalog.filterAll')} ({counts.all})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterPill,
            activeFilter === 'instock' && styles.filterPillActiveAvailable,
          ]}
          onPress={() => setActiveFilter('instock')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.filterPillText,
              activeFilter === 'instock' && styles.filterPillTextActiveAvailable,
            ]}
          >
            ● {t('merchantCatalog.filterAvailable')} ({counts.instock})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterPill,
            activeFilter === 'outofstock' && styles.filterPillActiveUnavailable,
          ]}
          onPress={() => setActiveFilter('outofstock')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.filterPillText,
              activeFilter === 'outofstock' &&
                styles.filterPillTextActiveUnavailable,
            ]}
          >
            ○ {t('merchantCatalog.filterUnavailable')} ({counts.outofstock})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Product List */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderProductItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchCatalog(true)}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={styles.emptyTitle}>
                {t('merchantCatalog.emptyCatalog')}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery.trim().length > 0
                  ? 'Try searching with a different product name or SKU.'
                  : 'Your store catalog will appear here once items are added.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  backText: {
    fontSize: 26,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 28,
    marginTop: -2,
    marginRight: 2,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...theme.shadows.sm,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 2,
  },
  clearIcon: {
    fontSize: 14,
    color: '#94A3B8',
    paddingHorizontal: 4,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterPillActiveAvailable: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  filterPillActiveUnavailable: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  filterPillTextActiveAvailable: {
    color: '#059669',
  },
  filterPillTextActiveUnavailable: {
    color: '#DC2626',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    ...theme.shadows.sm,
  },
  thumbContainer: {
    width: 52,
    height: 52,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbEmoji: {
    fontSize: 24,
  },
  detailsContainer: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
  productSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  salePriceText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
  regularPriceStrike: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  actionContainer: {
    marginLeft: 4,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 95,
    gap: 4,
  },
  toggleAvailable: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  toggleUnavailable: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  toggleIcon: {
    fontSize: 11,
    fontWeight: '800',
  },
  toggleIconAvailable: {
    color: '#059669',
  },
  toggleIconUnavailable: {
    color: '#DC2626',
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  toggleTextAvailable: {
    color: '#059669',
  },
  toggleTextUnavailable: {
    color: '#DC2626',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 44,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});
