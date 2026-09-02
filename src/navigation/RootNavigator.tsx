import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { AuthNavigator } from './AuthNavigator';
import { CustomerNavigator } from './CustomerNavigator';
import { MerchantNavigator } from './MerchantNavigator';
import { theme } from '../utils/theme';

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, role, isLoading } = useAuth();

  return (
    <NavigationContainer>
      {isLoading ? (
        <View style={{ flex: 1, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : !isAuthenticated ? (
        <AuthNavigator />
      ) : role === 'merchant' || role === 'administrator' ? (
        <MerchantNavigator />
      ) : (
        <CustomerNavigator />
      )}
    </NavigationContainer>
  );
};
