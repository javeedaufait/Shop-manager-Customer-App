import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MerchantStackParamList } from './types';
import { MerchantHomeScreen } from '../screens/MerchantHomeScreen';

const Stack = createNativeStackNavigator<MerchantStackParamList>();

export const MerchantNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MerchantHome" component={MerchantHomeScreen} />
    </Stack.Navigator>
  );
};