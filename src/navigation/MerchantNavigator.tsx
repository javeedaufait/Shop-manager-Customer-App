import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MerchantStackParamList } from './types';
import { MerchantHomeScreen } from '../screens/MerchantHomeScreen';
import { MerchantOrdersScreen } from '../screens/MerchantOrdersScreen';
import { MerchantOrderDetailsScreen } from '../screens/MerchantOrderDetailsScreen';
import { MerchantCatalogScreen } from '../screens/MerchantCatalogScreen';

const Stack = createNativeStackNavigator<MerchantStackParamList>();

export const MerchantNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MerchantHome" component={MerchantHomeScreen} />
      <Stack.Screen name="MerchantOrders" component={MerchantOrdersScreen} />
      <Stack.Screen name="MerchantOrderDetails" component={MerchantOrderDetailsScreen} />
      <Stack.Screen name="MerchantCatalog" component={MerchantCatalogScreen} />
    </Stack.Navigator>
  );
};
