import React, { useState, useEffect, useCallback } from 'react';
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
import { Header } from '../components/common/Header';
import { ShopCard } from '../components/shops/ShopCard';
import { theme } from '../utils/theme';
import { useLocalization } from '../hooks/useLocalization';
import { useLocation } from '../hooks/useLocation';
import { shopsApi } from '../api/shopsApi';
import { Shop } from '../types/shops';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomerStackParamList } from '../navigation/types';

interface NearbyShopsScreenProps {
  navigation: NativeStackNavigationProp<CustomerStackParamList, 'NearbyShops'>;
}

export const NearbyShopsScreen: React.FC<NearbyShopsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();
  const { location, isLoading: locationLoading, requestCurrentLocation } = useLocation();

  const [shops, setShops] = useState<Shop[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShops = useCallback(async () => {
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
      if (res?.shops) {
        setShops(res.shops);
      }
    } catch (err: any) {
      console.warn('Error fetching nearby shops:', err);
      setError(err?.message || t('shops.errorSubtitle'));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [location, t]);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchShops();
  };

  const filteredShops = shops.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.shop_type.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q)
    );
  });

  const locationDisplayText = location?.areaName
    ? location.areaName
    : location?.latitude
    ? t('location.currentLocation')
    : t('location.currentLocation');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header />

      {/* Top Location Selector Bar */}
      <View style={styles.locationBar}>
        <TouchableOpacity
          style={styles.locationSelector}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('AreaSelect')}
        >
          <View style={styles.pinCircle}>
            <Text style={styles.pinIcon}>ðŸ“</Text>
          </View>
          <View style={styles.locationTextWrap}>
            <Text style={styles.locationSubText}>{'Near You in'}</Text>
            <Text style={styles.locationTitle} numberOfLines={1}>
              {locationDisplayText}
            </Text>
          </View>
          <Text style={styles.changeBtnText}>{t('location.changeLocation')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.profileBtn}
          activeOpacity={0.8}
          onPress={() => {
            navigation.navigate('AreaSelect');
          }}
        >
          <Text style={styles.profileIcon}>ðŸ‘¤</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>ðŸ”</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={t('shops.searchPlaceholder')}
          placeholderTextColor={theme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearIcon}>âœ•</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Content Area */}
      {isLoading && !refreshing ? (
        /* State 1: Loading State */
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('shops.loadingShops')}</Text>
        </View>
      ) : error ? (
        /* State 4: Error State */
        <View style={styles.centerContainer}>
          <Text style={styles.stateEmoji}>âš ï¸</Text>
          <Text style={styles.stateTitle}>{t('shops.errorTitle')}</Text>
          <Text style={styles.stateSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.primaryActionBtn} onPress={fetchShops}>
            <Text style={styles.primaryActionBtnText}>{t('shops.retryBtn')}</Text>
          </TouchableOpacity>
        </View>
      ) : filteredShops.length === 0 ? (
        /* State 2: Empty State */
        <View style={styles.centerContainer}>
          <Text style={styles.stateEmoji}>ðŸª</Text>
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
        /* Standard Feed */
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
              <Text style={styles.feedTitle}>{t('shops.nearbyTitle')}</Text>
              <Text style={styles.storeCount}>
                {filteredShops.length} {t('shops.totalStores')}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ShopCard
              shop={item}
              onPress={() => {
                // Reserved for future catalog viewing
              }}
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
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  profileIcon: {
    fontSize: 20,
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
});