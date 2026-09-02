import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Platform-agnostic Storage Service
 * Uses SecureStore for tokens on iOS/Android, AsyncStorage fallback on Web/unsupported
 */
class StorageService {
  private isSecureAvailable = false;

  constructor() {
    this.checkSecureAvailability();
  }

  private async checkSecureAvailability() {
    try {
      if (Platform.OS !== 'web') {
        this.isSecureAvailable = await SecureStore.isAvailableAsync();
      }
    } catch {
      this.isSecureAvailable = false;
    }
  }

  async setSecureItem(key: string, value: string): Promise<void> {
    try {
      if (this.isSecureAvailable && Platform.OS !== 'web') {
        await SecureStore.setItemAsync(key, value);
        return;
      }
    } catch (e) {
      console.warn('SecureStore error, falling back to AsyncStorage:', e);
    }
    await AsyncStorage.setItem(key, value);
  }

  async getSecureItem(key: string): Promise<string | null> {
    try {
      if (this.isSecureAvailable && Platform.OS !== 'web') {
        return await SecureStore.getItemAsync(key);
      }
    } catch (e) {
      console.warn('SecureStore read error, trying AsyncStorage:', e);
    }
    return await AsyncStorage.getItem(key);
  }

  async deleteSecureItem(key: string): Promise<void> {
    try {
      if (this.isSecureAvailable && Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (e) {
      console.warn('SecureStore delete error:', e);
    }
    await AsyncStorage.removeItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async getItem(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(key);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  async clearAll(): Promise<void> {
    await AsyncStorage.clear();
  }
}

export const storageService = new StorageService();