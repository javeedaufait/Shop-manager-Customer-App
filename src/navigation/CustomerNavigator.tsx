import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CustomerStackParamList } from './types';
import { NearbyShopsScreen } from '../screens/NearbyShopsScreen';
import { LocationPermissionScreen } from '../screens/LocationPermissionScreen';
import { AreaSelectScreen } from '../screens/AreaSelectScreen';
import { CustomerHomeScreen } from '../screens/CustomerHomeScreen';
import { ShopCatalogScreen } from '../screens/ShopCatalogScreen';
import { ShopDetailsScreen } from '../screens/ShopDetailsScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { CartScreen } from '../screens/CartScreen';

const Stack = createNativeStackNavigator<CustomerStackParamList>();

export const CustomerNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="NearbyShops"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="NearbyShops" component={NearbyShopsScreen} />
      <Stack.Screen name="LocationPermission" component={LocationPermissionScreen} />
      <Stack.Screen name="AreaSelect" component={AreaSelectScreen} />
      <Stack.Screen name="CustomerHome" component={CustomerHomeScreen} />
      <Stack.Screen name="ShopCatalog" component={ShopCatalogScreen} />
      <Stack.Screen name="ShopDetails" component={ShopDetailsScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
    </Stack.Navigator>
  );
};
