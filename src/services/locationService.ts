import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserLocationState } from '../types/shops';

const LOCATION_STORAGE_KEY = '@nearmart_customer_location';

export const locationService = {
  /**
   * Check if location permission is already granted.
   */
  async checkPermission(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === Location.PermissionStatus.GRANTED;
    } catch {
      return false;
    }
  },

  /**
   * Request foreground location permission.
   */
  async requestPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === Location.PermissionStatus.GRANTED;
    } catch (error) {
      console.warn('Location permission request failed:', error);
      return false;
    }
  },

  /**
   * Get device current GPS coordinates and resolve locality name.
   */
  async getCurrentLocation(): Promise<UserLocationState | null> {
    try {
      const hasPerm = await this.checkPermission();
      if (!hasPerm) {
        const granted = await this.requestPermission();
        if (!granted) return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;
      let areaName = 'Current Location';

      try {
        const [geocode] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geocode) {
          const parts = [
            geocode.district || geocode.subregion || geocode.name,
            geocode.city,
          ].filter(Boolean);
          if (parts.length > 0) {
            areaName = parts.join(', ');
          }
        }
      } catch (geoError) {
        console.warn('Reverse geocode failed, using default label:', geoError);
      }

      const locationState: UserLocationState = {
        latitude,
        longitude,
        areaName,
        isGps: true,
      };

      await this.saveLocation(locationState);
      return locationState;
    } catch (error) {
      console.warn('Failed to retrieve current location:', error);
      return null;
    }
  },

  /**
   * Save selected location to persistent storage.
   */
  async saveLocation(location: UserLocationState): Promise<void> {
    try {
      await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
    } catch (error) {
      console.warn('Failed to save location in storage:', error);
    }
  },

  /**
   * Get saved location from persistent storage.
   */
  async getSavedLocation(): Promise<UserLocationState | null> {
    try {
      const raw = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (error) {
      console.warn('Failed to get saved location:', error);
    }
    return null;
  },

  /**
   * Set manual area name (when customer picks an area without GPS).
   */
  async setManualArea(areaName: string): Promise<UserLocationState> {
    const locationState: UserLocationState = {
      latitude: null,
      longitude: null,
      areaName,
      isGps: false,
    };
    await this.saveLocation(locationState);
    return locationState;
  },
};