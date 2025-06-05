// app/_layout.tsx
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';
import { ThemeProvider, useTheme } from '../providers/ThemeProvider';
import { Text } from 'react-native-paper';

// Network status component - memoized to prevent unnecessary re-renders
const NetworkStatus = React.memo(() => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const { colors } = useTheme().theme;

  useEffect(() => {
    // Initial check for connection status
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected);
    });
    
    // Subscribe to connection changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (isConnected === null) return null;

  return !isConnected ? (
    <View style={[styles.networkStatus, { backgroundColor: colors.error }]}>
      <Text style={styles.networkText}>No internet connection</Text>
    </View>
  ) : null;
});

// Main layout component
const RootLayoutContent = () => {
  const { theme, isDark } = useTheme();

  useEffect(() => {
    // Authentication initialization will be handled elsewhere
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NetworkStatus />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
};

// Root layout with theme provider
export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  networkStatus: {
    padding: 8,
    alignItems: 'center',
  },
  networkText: {
    color: 'white',
    fontSize: 14,
  },
});