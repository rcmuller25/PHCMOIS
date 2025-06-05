import React, { memo, useCallback, useMemo } from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View, Platform } from 'react-native';
import { Home, PlusCircle, Settings, User } from 'lucide-react-native';
import { 
  useTheme, 
  MD3LightTheme, 
  MD3DarkTheme, 
  Provider as PaperProvider,
  configureFonts 
} from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';

// Material 3 font configuration
const fontConfig = {
  displayLarge: {
    fontFamily: 'System',
    fontSize: 57,
    fontWeight: '400' as const,
    lineHeight: 64,
    letterSpacing: -0.25,
  },
  headlineLarge: {
    fontFamily: 'System',
    fontSize: 32,
    fontWeight: '400' as const,
    lineHeight: 40,
    letterSpacing: 0,
  },
  titleLarge: {
    fontFamily: 'System',
    fontSize: 22,
    fontWeight: '500' as const,
    lineHeight: 28,
    letterSpacing: 0,
  },
  labelMedium: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
};

// Enhanced MD3 theme with proper Material You colors
const createMaterial3Theme = (isDark: boolean) => {
  const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;
  
  return {
    ...baseTheme,
    fonts: configureFonts({ config: fontConfig }),
    colors: {
      ...baseTheme.colors,
      // Primary colors - Healthcare green theme
      primary: '#006C4C',
      onPrimary: '#FFFFFF',
      primaryContainer: '#7CFACD',
      onPrimaryContainer: '#002113',
      
      // Secondary colors
      secondary: '#4F6355',
      onSecondary: '#FFFFFF',
      secondaryContainer: '#D1E8D6',
      onSecondaryContainer: '#0C1F14',
      
      // Tertiary colors
      tertiary: '#3F6471',
      onTertiary: '#FFFFFF',
      tertiaryContainer: '#C2EAF8',
      onTertiaryContainer: '#001F27',
      
      // Error colors
      error: '#BA1A1A',
      onError: '#FFFFFF',
      errorContainer: '#FFDAD6',
      onErrorContainer: '#410002',
      
      // Surface colors
      background: isDark ? '#0F1711' : '#F6FDF7',
      onBackground: isDark ? '#DDE5DD' : '#1A1C1A',
      surface: isDark ? '#0F1711' : '#F6FDF7',
      onSurface: isDark ? '#DDE5DD' : '#1A1C1A',
      surfaceVariant: isDark ? '#3F4942' : '#DDE5DD',
      onSurfaceVariant: isDark ? '#BFC9BE' : '#414942',
      
      // Outline colors
      outline: isDark ? '#89938B' : '#717970',
      outlineVariant: isDark ? '#3F4942' : '#C1CCC1',
      
      // Additional Material 3 colors
      inverseSurface: isDark ? '#DDE5DD' : '#2F312E',
      inverseOnSurface: isDark ? '#2F312E' : '#DDE5DD',
      inversePrimary: isDark ? '#006C4C' : '#7CFACD',
      scrim: '#000000',
      shadow: '#000000',
      surfaceDisabled: isDark ? 'rgba(221, 229, 221, 0.12)' : 'rgba(26, 28, 26, 0.12)',
      onSurfaceDisabled: isDark ? 'rgba(221, 229, 221, 0.38)' : 'rgba(26, 28, 26, 0.38)',
    },
    roundness: 12, // Material 3 standard roundness
  };
};

type TabBarIconProps = {
  focused: boolean;
  color: string;
  size: number;
  icon: React.ComponentType<{ color: string; size: number }>;
};

const TabBarIcon = memo(({ focused, color, size, icon: Icon }: TabBarIconProps) => {
  const theme = useTheme();
  
  // Optimize rendering by pre-computing styles
  const iconContainerStyle = useMemo(() => [
    styles.iconContainer,
    focused && {
      backgroundColor: theme.colors.primaryContainer,
    }
  ], [focused, theme.colors.primaryContainer]);

  const iconColor = focused ? theme.colors.onPrimaryContainer : color;

  // Use React.memo for the icon to prevent unnecessary re-renders
  return (
    <View style={iconContainerStyle}>
      <Icon color={iconColor} size={size} />
    </View>
  );
});

TabBarIcon.displayName = 'TabBarIcon';

// Pre-compute light and dark themes to avoid recalculation on each render
const lightTheme = createMaterial3Theme(false);
const darkTheme = createMaterial3Theme(true);

// Memoize the entire TabLayout component to prevent unnecessary re-renders
const TabLayout = () => {
  const colorScheme = useColorScheme();
  // Use pre-computed themes based on color scheme
  const theme = useMemo(() => colorScheme === 'dark' ? darkTheme : lightTheme, [colorScheme]);
  const { colors } = theme;

  // Memoize common header style
  const headerStyle = useMemo(() => ({
    backgroundColor: colors.surface,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0, // Clean Material 3 look
  }), [colors.surface]);

  const headerTitleStyle = useMemo(() => ({
    fontSize: 22,
    fontWeight: '500' as const,
    color: colors.onSurface,
    fontFamily: 'System',
  }), [colors.onSurface]);

  const router = useRouter();

  // Memoize tab screen options
  const homeOptions = useCallback(() => ({
    title: 'Dashboard',
    tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
      <TabBarIcon icon={Home} color={color} size={24} focused={focused} />
    ),
    headerTitle: 'Dashboard',
    headerTitleStyle,
    headerStyle,
    headerTintColor: colors.primary,
    headerRight: () => (
      <IconButton
        icon={({ size, color }) => <User size={size} color={color} />}
        size={24}
        iconColor={colors.primary}
        onPress={() => router.push('/profile')}
      />
    ),
  }), [colors.primary, headerStyle, headerTitleStyle, router]);

  const addAppointmentOptions = useCallback(() => ({
    title: 'Add',
    tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
      <TabBarIcon icon={PlusCircle} color={color} size={26} focused={focused} />
    ),
    headerTitle: 'New Appointment',
    headerTitleStyle,
    headerStyle,
    headerTintColor: colors.primary,
  }), [colors.primary, headerStyle, headerTitleStyle]);

  // Profile options removed to fix duplicate route issue

  const settingsOptions = useCallback(() => ({
    title: 'Settings',
    tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
      <TabBarIcon icon={Settings} color={color} size={24} focused={focused} />
    ),
    headerTitle: 'Settings',
    headerTitleStyle,
    headerStyle,
    headerTintColor: colors.primary,
  }), [colors.primary, headerStyle, headerTitleStyle]);

  // Material 3 tab bar styling
  const tabBarStyle = useMemo(() => [
    styles.tabBar,
    {
      backgroundColor: colors.surface,
      borderTopColor: colors.outlineVariant,
      elevation: Platform.OS === 'android' ? 3 : 0,
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0,
      shadowRadius: 8,
    }
  ], [colors]);

  const tabBarLabelStyle = useMemo(() => [
    styles.tabBarLabel,
    {
      fontFamily: 'System',
      fontWeight: '500' as const,
    }
  ], []);

  // Screen options with Material 3 theming
  const screenOptions = useCallback(() => ({
    tabBarActiveTintColor: colors.onSurface,
    tabBarInactiveTintColor: colors.onSurfaceVariant,
    tabBarStyle,
    tabBarLabelStyle,
    tabBarItemStyle: styles.tabBarItem,
    headerShown: true,
    headerStyle,
    headerTitleStyle,
    headerTintColor: colors.primary,
    contentStyle: {
      backgroundColor: colors.background,
    },
    // Material 3 animations
    animation: 'shift' as const,
    lazy: true,
  }), [
    colors.onSurface,
    colors.onSurfaceVariant,
    colors.primary,
    colors.background,
    tabBarStyle,
    tabBarLabelStyle,
    headerStyle,
    headerTitleStyle,
  ]);

  return (
    <PaperProvider theme={theme}>
      <Tabs screenOptions={screenOptions}>
        <Tabs.Screen
          name="home"
          options={homeOptions}
        />
        <Tabs.Screen
          name="add-appointment"
          options={addAppointmentOptions}
        />
        {/* Profile tab removed to fix duplicate route issue */}
        <Tabs.Screen
          name="settings"
          options={settingsOptions}
        />
      </Tabs>
    </PaperProvider>
  );
};

export default memo(TabLayout);

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.select({
      ios: 88, // Accommodate safe area
      android: 72,
      default: 72,
    }),
    paddingBottom: Platform.select({
      ios: 24, // Safe area padding
      android: 8,
      default: 8,
    }),
    paddingTop: 8,
    borderTopWidth: 1,
  },
  tabBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tabBarLabel: {
    fontSize: 12,
    marginTop: 4,
    letterSpacing: 0.5,
    lineHeight: 16,
    textAlign: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64, // Material 3 navigation bar icon container
    height: 32,
    borderRadius: 16,
    marginBottom: 2,
  },
});