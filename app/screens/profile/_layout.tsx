import React, { memo, useMemo } from 'react';
import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { Platform, StatusBar } from 'react-native';

const ProfileLayout = () => {
  const theme = useTheme();

  // Material 3 header styles using theme colors
  const headerStyles = useMemo(() => ({
    headerStyle: {
      backgroundColor: theme.colors.surface,
      elevation: Platform.OS === 'android' ? 0 : undefined, // Material 3 uses no elevation for app bars
      shadowOpacity: Platform.OS === 'ios' ? 0 : undefined,
      borderBottomWidth: 0, // Remove border for clean Material 3 look
    },
    headerTintColor: theme.colors.onSurface,
    headerTitleStyle: {
      fontSize: 22,
      fontWeight: '500' as const, // Material 3 medium weight
      color: theme.colors.onSurface,
    },
    headerBackTitle: Platform.OS === 'ios' ? '' : undefined, // Clean back button on iOS
    headerBackTitleVisible: false, // Hide back title for cleaner look
    headerShadowVisible: false, // Material 3 app bars don't have shadows
  }), [theme]);

  // Memoize screen options to prevent recreation
  const indexOptions = useMemo(() => ({
    title: 'Profile',
    headerShown: false, // Profile screen has its own Appbar.Header
  }), []);

  const adminSettingsOptions = useMemo(() => ({
    title: 'Administrator Settings',
    headerTitleStyle: {
      ...headerStyles.headerTitleStyle,
      fontSize: 20, // Slightly smaller for longer titles
    },
  }), [headerStyles]);

  const scheduleOptions = useMemo(() => ({
    title: 'Schedule',
  }), []);

  const notesOptions = useMemo(() => ({
    title: 'Notes',
  }), []);

  // Common screen options for Material 3
  const commonScreenOptions = useMemo(() => ({
    headerShown: true,
    ...headerStyles,
    // Material 3 specific configurations
    animation: 'slide_from_right' as const,
    presentation: 'card' as const,
    gestureEnabled: true,
    // Status bar styling to match Material 3
    statusBarStyle: theme.dark ? 'light' as const : 'dark' as const,
    statusBarBackgroundColor: theme.colors.surface,
  }), [headerStyles, theme]);

  return (
    <Stack screenOptions={commonScreenOptions}>
      <Stack.Screen 
        name="index" 
        options={indexOptions}
      />
      <Stack.Screen 
        name="administrator-settings" 
        options={adminSettingsOptions}
      />
      <Stack.Screen 
        name="schedule" 
        options={scheduleOptions}
      />
      <Stack.Screen 
        name="notes" 
        options={notesOptions}
      />
    </Stack>
  );
};

export default memo(ProfileLayout);