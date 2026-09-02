import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import { SplashScreen } from '../screens/SplashScreen';
import { LanguageSelectScreen } from '../screens/LanguageSelectScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { CustomerLoginScreen } from '../screens/CustomerLoginScreen';
import { CustomerRegisterScreen } from '../screens/CustomerRegisterScreen';
import { MerchantLoginScreen } from '../screens/MerchantLoginScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="LanguageSelect" component={LanguageSelectScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="CustomerLogin" component={CustomerLoginScreen} />
      <Stack.Screen name="CustomerRegister" component={CustomerRegisterScreen} />
      <Stack.Screen name="MerchantLogin" component={MerchantLoginScreen} />
    </Stack.Navigator>
  );
};