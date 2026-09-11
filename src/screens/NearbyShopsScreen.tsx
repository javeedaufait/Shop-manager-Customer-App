import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  BackHandler,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../components/common/Header';
import { ShopCard } from '../components/shops/ShopCard';
import { NearbyProductCard } from '../components/products/NearbyProductCard';
import { theme } from '../utils/theme';
import { useLocalization } from '../hooks/useLocalization';
import { useLocation } from '../hooks/useLocation';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useFavorites } from '../hooks/useFavorites';
import { shopsApi } from '../api/shopsApi';
import { searchApi } from '../api/searchApi';
import { Shop } from '../types/shops';
import { NearbyProductResult } from '../types/catalog';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomerStackParamList } from '../navigation/types';

interface NearbyShopsScreenProps {
  navigation: NativeStackNavigationProp<CustomerStackParamList, 'NearbyShops'>;
}

export const NearbyShopsScreen: React.FC<NearbyShopsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();
  const { user, isAuthenticated, isGuest, exitGuestMode, logout } = useAuth();
  const { location, isLoading: locationLoading, requestCurrentLocation } = useLocation();
  const { cart } = useCart();
  const { favoriteShopIds, favoriteShops } = useFavorites();

  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedTab, setSelectedTab] = useState<'all' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchProducts, setSearchProducts] = useState<NearbyProductResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShops = useCallback(async () => {
    if (locationLoading) return;

    if (!location?.latitude && !location?.areaName) {
      setIsLoading(false);
      setRefreshing(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params: any = {};
      if (location?.latitude && location?.longitude) {
        params.lat = location.latitude;
        params.lng = location.longitude;
        params.radius = 30; // 30 km radius
      } else if (location?.areaName) {
        params.area = location.areaName;
      }

      const res = await shopsApi.getNearbyShops(params);
      if (res && Array.isArray(res.shops)) {
        setShops(res.shops);
      }
    } catch (err: any) {
      console.warn('Error fetching nearby shops:', err);
      setError(err?.message || t('shops.errorSubtitle'));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [location?.latitude, location?.longitude, location?.areaName, locationLoading, t]);

  useEffect(() => {
    if (!locationLoading) {
      fetchShops();
    }
  }, [fetchShops, locationLoading]);

  // Debounced product search across nearby shops
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchProducts([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const params: any = {
          q: query,
          radius: 30,
          limit: 30,
        };
        if (location?.latitude && location?.longitude) {
          params.lat = location.latitude;
          params.lng = location.longitude;
        } else if (location?.areaName) {
          params.area = location.areaName;
        }

        const res = await searchApi.searchNearbyProducts(params);
        if (res && Array.isArray(res.products)) {
          setSearchProducts(res.products);
        } else {
          setSearchProducts([]);
        }
      } catch (err) {
        console.warn('Error searching nearby products:', err);
        setSearchProducts([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, location?.latitude, location?.longitude, location?.areaName]);

  // Hardware Back button handling for guest users
  useEffect(() => {
    if (!isGuest) return;
    const backAction = () => {
      exitGuestMode();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [isGuest, exitGuestMode]);

  const handleLogout = () => {
    Alert.alert(
      t('common.logout') || 'Log Out',
      t('auth.logoutConfirm') || 'Are you sure you want to log out?',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('common.logout') || 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleProfilePress = () => {
    if (isGuest || !isAuthenticated) {
      Alert.alert(
        'Guest Mode',
        t('welcome.heroSubtitle') || 'You are exploring NearMart as a guest.',
        [
          { text: t('common.cancel') || 'Cancel', style: 'cancel' },
          {
            text: t('auth.loginTitle') || 'Login / Register',
            onPress: exitGuestMode,
          },
        ]
      );
    } else {
      Alert.alert(
        user?.name || t('roles.customer') || 'My Account',
        user?.email || '',
        [
          { text: t('common.cancel') || 'Cancel', style: 'cancel' },
          {
            text: t('home.profileTitle') || 'View Profile',
            onPress: () => navigation.navigate('CustomerHome'),
          },
          {
            text: `🚪 ${t('common.logout') || 'Log Out'}`,
            style: 'destructive',
            onPress: handleLogout,
          },
        ]
      );
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchShops();
  };

  const handleShopPress = (shop: Shop) => {
    navigation.navigate('ShopCatalog', {
      shopId: shop.shop_id,
      shopName: shop.name,
      shop: shop,
    });
  };

  const handleProductPress = (item: NearbyProductResult) => {
    navigation.navigate('ProductDetail', {
      product: item,
      shopName: item.shop_name,
      shopId: item.shop_id,
    });
  };

  const candidateShops =
    selectedTab === 'favorites'
      ? shops
          .filter((s) => favoriteShopIds.includes(s.shop_id))
          .concat(favoriteShops.filter((fs) => !shops.some((s) => s.shop_id === fs.shop_id)))
      : shops;

  const filteredShops = candidateShops.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.shop_type.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q)
    );
  });

  const isSearchActive = searchQuery.trim().length > 0;

  const locationDisplayText = location?.areaName
    ? location.areaName
    : location?.latitude
    ? t('location.currentLocation')
    : t('location.selectManually');

  const hasLocation = Boolean(location?.latitude || location?.areaName);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header onBack={isGuest ? exitGuestMode : undefined} />

      {/* Top Location Selector Bar */}
      <View style={styles.locationBar}>
        <TouchableOpacity
          style={styles.locationSelector}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('AreaSelect')}
        >
          <View style={styles.pinCircle}>
            <Text style={styles.pinIcon}>📍</Text>
          </View>
          <View style={styles.locationTextWrap}>
            <Text style={styles.locationSubText} numberOfLines={1}>
              Near You in
            </Text>
            <Text style={styles.locationTitle} numberOfLines={1} ellipsizeMode="tail">
              {locationDisplayText}
            </Text>
          </View>
          <Text style={styles.changeBtnText}>{t('location.changeLocation')}</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TouchableOpacity
            style={styles.profileBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('OrderHistory')}
          >
            <Text style={styles.profileIcon}>📋</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Cart')}
          >
            <Text style={styles.profileIcon}>🛍️</Text>
            {cart.total_quantity > 0 && (
              <View style={styles.headerCartBadge}>
                <Text style={styles.headerCartBadgeText}>{cart.total_quantity}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileBtn}
            activeOpacity={0.8}
            onPress={handleProfilePress}
          >
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={t('search.placeholder')}
          placeholderTextColor={theme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs: All Stores vs Favorite Stores */}
      {!isSearchActive && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, selectedTab === 'all' && styles.tabBtnActive]}
            onPress={() => setSelectedTab('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, selectedTab === 'all' && styles.tabBtnTextActive]}>
              🏪 {t('favorites.allStores')} ({shops.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, selectedTab === 'favorites' && styles.tabBtnActive]}
            onPress={() => setSelectedTab('favorites')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, selectedTab === 'favorites' && styles.tabBtnTextActive]}>
              ❤️ {t('favorites.favoriteStores')} ({favoriteShopIds.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content Area */}
      {isLoading && !refreshing ? (
        /* State 1: Initial Loading State */
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('shops.loadingShops')}</Text>
        </View>
      ) : error ? (
        /* State 4: Error State */
        <View style={styles.centerContainer}>
          <Text style={styles.stateEmoji}>⚠️</Text>
          <Text style={styles.stateTitle}>{t('shops.errorTitle')}</Text>
          <Text style={styles.stateSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.primaryActionBtn} onPress={fetchShops}>
            <Text style={styles.primaryActionBtnText}>{t('shops.retryBtn')}</Text>
          </TouchableOpacity>
        </View>
      ) : !hasLocation ? (
        /* State 3: Location Unavailable State */
        <View style={styles.centerContainer}>
          <Text style={styles.stateEmoji}>📍</Text>
          <Text style={styles.stateTitle}>{t('shops.locationUnavailableTitle')}</Text>
          <Text style={styles.stateSubtitle}>{t('shops.locationUnavailableSubtitle')}</Text>
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={async () => {
                const ok = await requestCurrentLocation();
                if (!ok) navigation.navigate('LocationPermission');
              }}
            >
              <Text style={styles.primaryActionBtnText}>{t('shops.enableLocation')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={() => navigation.navigate('AreaSelect')}
            >
              <Text style={styles.secondaryActionBtnText}>{t('location.selectManually')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : isSearchActive ? (
        /* Search Active Mode */
        isSearching && searchProducts.length === 0 && filteredShops.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>{t('search.searching')}</Text>
          </View>
        ) : !isSearching && searchProducts.length === 0 && filteredShops.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.stateEmoji}>🔍</Text>
            <Text style={styles.stateTitle}>{t('search.noResultsTitle')}</Text>
            <Text style={styles.stateSubtitle}>{t('search.noResultsSubtitle')}</Text>
            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.secondaryActionBtnText}>{t('search.clearSearch')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {isSearching && (
              <View style={styles.searchingBanner}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.searchingBannerText}>{t('search.searching')}</Text>
              </View>
            )}

            {/* Matching Products Section */}
            {searchProducts.length > 0 && (
              <View style={styles.searchSection}>
                <View style={styles.listHeader}>
                  <Text style={styles.feedTitle}>{t('search.nearbyResults')}</Text>
                  <Text style={styles.storeCount}>
                    {searchProducts.length} {t('search.productsFound')}
                  </Text>
                </View>
                {searchProducts.map((item) => (
                  <NearbyProductCard
                    key={`prod-${item.shop_id}-${item.id}`}
                    item={item}
                    onPress={() => handleProductPress(item)}
                  />
                ))}
              </View>
            )}

            {/* Matching Shops Section */}
            {filteredShops.length > 0 && (
              <View
                style={[
                  styles.searchSection,
                  searchProducts.length > 0 && { marginTop: theme.spacing.lg },
                ]}
              >
                <View style={styles.listHeader}>
                  <Text style={styles.feedTitle}>{t('search.shopsSection')}</Text>
                  <Text style={styles.storeCount}>
                    {filteredShops.length} {t('shops.totalStores')}
                  </Text>
                </View>
                {filteredShops.map((shop) => (
                  <ShopCard
                    key={`shop-${shop.shop_id}`}
                    shop={shop}
                    onPress={() => handleShopPress(shop)}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        )
      ) : !isSearchActive && selectedTab === 'favorites' && filteredShops.length === 0 ? (
        /* Favorites Empty State */
        <View style={styles.centerContainer}>
          <Text style={styles.stateEmoji}>❤️</Text>
          <Text style={styles.stateTitle}>{t('favorites.emptyTitle')}</Text>
          <Text style={styles.stateSubtitle}>{t('favorites.emptySubtitle')}</Text>
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={() => setSelectedTab('all')}
          >
            <Text style={styles.primaryActionBtnText}>{t('favorites.exploreStores')}</Text>
          </TouchableOpacity>
        </View>
      ) : filteredShops.length === 0 ? (
        /* Normal State 2: Empty Shops State */
        <View style={styles.centerContainer}>
          <Text style={styles.stateEmoji}>🏪</Text>
          <Text style={styles.stateTitle}>{t('shops.emptyTitle')}</Text>
          <Text style={styles.stateSubtitle}>{t('shops.emptySubtitle')}</Text>
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={() => navigation.navigate('AreaSelect')}
          >
            <Text style={styles.primaryActionBtnText}>{t('shops.chooseAnotherArea')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Normal Standard Feed */
        <FlatList
          data={filteredShops}
          keyExtractor={(item) => String(item.shop_id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.feedTitle}>
                {selectedTab === 'favorites' ? t('favorites.favoriteStores') : t('shops.nearbyTitle')}
              </Text>
              <Text style={styles.storeCount}>
                {filteredShops.length} {t('shops.totalStores')}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ShopCard
              shop={item}
              onPress={() => handleShopPress(item)}
            />
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  guestBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  guestBackIcon: {
    fontSize: 26,
    color: theme.colors.text,
    lineHeight: 28,
  },
  locationSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  pinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  pinIcon: {
    fontSize: 16,
  },
  locationTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  locationSubText: {
    ...theme.typography.caption,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  locationTitle: {
    ...theme.typography.smallBold,
    color: theme.colors.text,
    fontSize: 14,
  },
  changeBtnText: {
    ...theme.typography.smallBold,
    color: theme.colors.primary,
    marginLeft: 6,
    textDecorationLine: 'underline',
    flexShrink: 0,
  },
  headerCartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#DC2626',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  headerCartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  profileIcon: {
    fontSize: 18,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.base,
    height: 44,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body,
    fontSize: 14,
    color: theme.colors.text,
    height: '100%',
  },
  clearIcon: {
    fontSize: 14,
    color: theme.colors.textMuted,
    paddingHorizontal: 4,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    gap: 10,
  },
  tabBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  tabBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabBtnText: {
    ...theme.typography.smallBold,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  tabBtnTextActive: {
    color: '#ffffff',
  },
  searchingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  searchingBannerText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  searchSection: {
    marginBottom: theme.spacing.sm,
  },
  listContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  feedTitle: {
    ...theme.typography.title,
    fontSize: 19,
    color: theme.colors.text,
  },
  storeCount: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl * 1.5,
    gap: theme.spacing.sm,
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  stateEmoji: {
    fontSize: 54,
    marginBottom: theme.spacing.sm,
  },
  stateTitle: {
    ...theme.typography.title,
    fontSize: 20,
    color: theme.colors.text,
    textAlign: 'center',
  },
  stateSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  btnRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  primaryActionBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  primaryActionBtnText: {
    ...theme.typography.button,
    color: '#ffffff',
  },
  secondaryActionBtn: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  secondaryActionBtnText: {
    ...theme.typography.button,
    color: theme.colors.primary,
  },
});
