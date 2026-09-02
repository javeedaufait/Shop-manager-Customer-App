import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CustomerStackParamList } from './types';
import { CustomerHomeScreen } from '../screens/CustomerHomeScreen';

const Stack = createNativeStackNavigator<CustomerStackParamList>();

export const CustomerNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="CustomerHome" component={CustomerHomeScreen} />
    </Stack.Navigator>
  );
};