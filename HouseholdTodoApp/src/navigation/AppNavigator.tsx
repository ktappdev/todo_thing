import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, AppState } from 'react-native';

import { User } from '../types';
import { storage } from '../utils/storage';
import OnboardingNavigator from './OnboardingNavigator';
import TabNavigator from './TabNavigator';
import { QueryProvider } from '../providers/QueryProvider';
import { WebSocketProvider } from '../components/WebSocketProvider';
import { navigationRef } from './navigationRef';

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const checkUserSession = async () => {
    try {
      const savedUser = await storage.getUser();
      setUser(savedUser);
    } catch (error) {
      console.error('Error checking user session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkUserSession();

    // Listen for app state changes to re-check user when app becomes active
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        checkUserSession();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <QueryProvider>
      <WebSocketProvider>
        <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          initialRouteName={user ? 'Main' : 'Onboarding'}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
          <Stack.Screen name="Main" component={TabNavigator} />
        </Stack.Navigator>
        </NavigationContainer>
      </WebSocketProvider>
    </QueryProvider>
  );
};

export default AppNavigator;