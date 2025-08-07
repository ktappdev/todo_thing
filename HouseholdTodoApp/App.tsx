/**
 * Household Todo App
 * A React Native app for managing household tasks with shareable links/codes
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import AppNavigator from './src/navigation/AppNavigator';

SplashScreen.preventAutoHideAsync();

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  
  useEffect(() => {
    // Hide splash screen when component mounts
    SplashScreen.hideAsync().catch(error => {
      console.warn('Error hiding splash screen:', error);
    });
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppNavigator />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
