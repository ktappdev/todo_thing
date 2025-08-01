import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import CreateHouseholdScreen from '../screens/onboarding/CreateHouseholdScreen';
import JoinHouseholdScreen from '../screens/onboarding/JoinHouseholdScreen';

export type OnboardingStackParamList = {
  Welcome: undefined;
  CreateHousehold: undefined;
  JoinHousehold: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

const OnboardingNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#6200EE',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Welcome" 
        component={WelcomeScreen} 
        options={{ title: 'Household Todo' }}
      />
      <Stack.Screen 
        name="CreateHousehold" 
        component={CreateHouseholdScreen} 
        options={{ title: 'Create Household' }}
      />
      <Stack.Screen 
        name="JoinHousehold" 
        component={JoinHouseholdScreen} 
        options={{ title: 'Join Household' }}
      />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;