import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/store/AuthContext';
import { CartProvider } from './src/store/CartContext';
import { FavoritesProvider } from './src/store/FavoritesContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { notificationService } from './src/services/notificationService';

export default function App() {
  useEffect(() => {
    const unsubscribe = notificationService.initNotificationListeners();
    return () => {
      unsubscribe();
    };
  }, []);
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <FavoritesProvider>
            <CartProvider>
              <StatusBar style="dark" />
              <RootNavigator />
            </CartProvider>
          </FavoritesProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
