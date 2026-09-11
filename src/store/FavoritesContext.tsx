import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { Shop } from '../types/shops';
import { favoritesApi } from '../api/favoritesApi';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from '../hooks/useLocation';
import { useLocalization } from '../hooks/useLocalization';

export interface FavoritesContextValue {
  favoriteShopIds: number[];
  favoriteShops: Shop[];
  isLoading: boolean;
  isFavorite: (shopId: number) => boolean;
  toggleFavorite: (shop: Shop) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
}

export const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isGuest, exitGuestMode } = useAuth();
  const { location } = useLocation();
  const { t } = useLocalization();

  const [favoriteShopIds, setFavoriteShopIds] = useState<number[]>([]);
  const [favoriteShops, setFavoriteShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated || isGuest) {
      setFavoriteShopIds([]);
      setFavoriteShops([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await favoritesApi.getFavorites({
        lat: location?.latitude,
        lng: location?.longitude,
      });
      if (res && Array.isArray(res.shop_ids)) {
        setFavoriteShopIds(res.shop_ids);
        setFavoriteShops(res.shops || []);
      }
    } catch (err) {
      console.warn('Failed to load customer favorites:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isGuest, location?.latitude, location?.longitude]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const isFavorite = useCallback(
    (shopId: number): boolean => {
      return favoriteShopIds.includes(shopId);
    },
    [favoriteShopIds]
  );

  const toggleFavorite = useCallback(
    async (shop: Shop): Promise<boolean> => {
      if (!isAuthenticated || isGuest) {
        Alert.alert(
          t('favorites.loginRequiredTitle') || 'Save Favorite Stores',
          t('favorites.loginRequiredSubtitle') || 'Please sign in to save your favorite stores.',
          [
            { text: t('common.cancel') || 'Cancel', style: 'cancel' },
            {
              text: t('auth.loginTitle') || 'Sign In',
              onPress: exitGuestMode,
            },
          ]
        );
        return false;
      }

      const shopId = shop.shop_id;
      const currentlyFav = favoriteShopIds.includes(shopId);

      // Optimistic Update
      if (currentlyFav) {
        setFavoriteShopIds((prev) => prev.filter((id) => id !== shopId));
        setFavoriteShops((prev) => prev.filter((s) => s.shop_id !== shopId));
      } else {
        setFavoriteShopIds((prev) => [...prev, shopId]);
        setFavoriteShops((prev) => [...prev, shop]);
      }

      try {
        if (currentlyFav) {
          await favoritesApi.removeFavorite(shopId);
        } else {
          await favoritesApi.addFavorite(shopId);
        }
        return !currentlyFav;
      } catch (err: any) {
        console.warn('Favorite toggle sync failed:', err);
        // Rollback optimistic update
        if (currentlyFav) {
          setFavoriteShopIds((prev) => [...prev, shopId]);
          setFavoriteShops((prev) => [...prev, shop]);
        } else {
          setFavoriteShopIds((prev) => prev.filter((id) => id !== shopId));
          setFavoriteShops((prev) => prev.filter((s) => s.shop_id !== shopId));
        }
        Alert.alert(t('errors.generic') || 'Error', err?.message || 'Could not update favorites.');
        return currentlyFav;
      }
    },
    [isAuthenticated, isGuest, favoriteShopIds, exitGuestMode, t]
  );

  return (
    <FavoritesContext.Provider
      value={{
        favoriteShopIds,
        favoriteShops,
        isLoading,
        isFavorite,
        toggleFavorite,
        refreshFavorites: fetchFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};
