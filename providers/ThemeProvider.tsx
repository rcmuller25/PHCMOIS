// providers/ThemeProvider.tsx
import React, { createContext, useContext, useMemo, useState, ReactNode, useCallback } from 'react';
import { useColorScheme, Platform } from 'react-native';
import { 
  PaperProvider, 
  MD3Theme, 
  MD3LightTheme,
  MD3DarkTheme,
  adaptNavigationTheme,
  configureFonts,
  MD3TypescaleKey
} from 'react-native-paper'; 

// Extend MD3Theme to include our custom properties
export interface ExtendedMD3Theme extends MD3Theme {
  elevation: typeof elevationLevels;
  stateLayer: typeof stateLayerOpacity;
}

type Font = {
  fontFamily: string;
  fontSize: number;
  fontWeight: '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | 'normal' | 'bold';
  letterSpacing: number;
  lineHeight: number;
};
import { 
  DefaultTheme as NavigationDefaultTheme, 
  DarkTheme as NavigationDarkTheme
} from '@react-navigation/native';
import { colors } from '../constants/theme';

// Platform-specific font families
const getFontFamily = (baseFont: string, weight: string): string => {
  // iOS uses the weight as part of the font name
  if (Platform.OS === 'ios') {
    // Map weights to iOS font naming convention
    const weightMap: Record<string, string> = {
      '100': 'Thin',
      '200': 'ExtraLight',
      '300': 'Light',
      '400': '',  // Regular
      '500': 'Medium',
      '600': 'SemiBold',
      '700': 'Bold',
      '800': 'ExtraBold',
      '900': 'Black',
      'normal': '',
      'bold': 'Bold'
    };
    
    const suffix = weightMap[weight] || '';
    return suffix ? `${baseFont}-${suffix}` : baseFont;
  }
  
  // Android uses generic font families
  return baseFont;
};

// Configure fonts according to Material 3 type scale with platform-specific adjustments
const fontConfig: Record<MD3TypescaleKey, Font> = {
  displayLarge: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif',
      default: 'System'
    }),
    fontSize: 57,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 64,
  },
  displayMedium: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif',
      default: 'System'
    }),
    fontSize: 45,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 52,
  },
  displaySmall: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif',
      default: 'System'
    }),
    fontSize: 36,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 44,
  },
  headlineLarge: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif',
      default: 'System'
    }),
    fontSize: 32,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 40,
  },
  headlineMedium: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif',
      default: 'System'
    }),
    fontSize: 28,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 36,
  },
  headlineSmall: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif',
      default: 'System'
    }),
    fontSize: 24,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 32,
  },
  titleLarge: {
    fontFamily: Platform.select({
      ios: getFontFamily('System', '500'),
      android: 'sans-serif-medium',
      default: 'System'
    }),
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 28,
  },
  titleMedium: {
    fontFamily: Platform.select({
      ios: getFontFamily('System', '500'),
      android: 'sans-serif-medium',
      default: 'System'
    }),
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  titleSmall: {
    fontFamily: Platform.select({
      ios: getFontFamily('System', '500'),
      android: 'sans-serif-medium',
      default: 'System'
    }),
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  labelLarge: {
    fontFamily: Platform.select({
      ios: getFontFamily('System', '500'),
      android: 'sans-serif-medium',
      default: 'System'
    }),
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  labelMedium: {
    fontFamily: Platform.select({
      ios: getFontFamily('System', '500'),
      android: 'sans-serif-medium',
      default: 'System'
    }),
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  labelSmall: {
    fontFamily: Platform.select({
      ios: getFontFamily('System', '500'),
      android: 'sans-serif-medium',
      default: 'System'
    }),
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  bodyLarge: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif',
      default: 'System'
    }),
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.5,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif',
      default: 'System'
    }),
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.25,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif',
      default: 'System'
    }),
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.4,
    lineHeight: 16,
  },
};

// Material 3 elevation levels
export const elevationLevels = {
  level0: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  level1: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  level2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  level3: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  level4: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  level5: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 12,
  },
};

// State layer opacity system
export const stateLayerOpacity = {
  hover: 0.08,
  focus: 0.12,
  pressed: 0.12,
  dragged: 0.16,
  disabled: 0.38,
};

// Create base theme with Material 3 colors and platform-specific adjustments
const createTheme = (isDark: boolean): ExtendedMD3Theme => {
  const themeColors = isDark ? colors.dark : colors.light;
  const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;
  
  // Merge colors with base theme colors
  const mergedColors = {
    ...baseTheme.colors,
    ...themeColors,
  };

  // Platform-specific adjustments
  const platformAdjustments = Platform.select({
    ios: {
      animation: {
        scale: 1.0,
      },
      roundness: 8,
    },
    android: {
      animation: {
        scale: 1.0,
      },
      roundness: 4,
    },
    default: {
      animation: {
        scale: 1.0,
      },
      roundness: 4,
    },
  });

  return {
    ...baseTheme,
    ...platformAdjustments,
    colors: mergedColors,
    fonts: configureFonts({ config: fontConfig }),
    // Add elevation and state layer to theme
    elevation: elevationLevels,
    stateLayer: stateLayerOpacity,
  };
};

// Extend the theme with navigation theming
const { LightTheme: NavigationLight, DarkTheme: NavigationDark } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

// Create light and dark themes
const lightTheme = createTheme(false);
const darkTheme = createTheme(true);

type ThemeContextType = {
  theme: ExtendedMD3Theme;
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Create pre-computed themes to avoid recalculation
const precomputedLightTheme = createTheme(false);
const precomputedDarkTheme = createTheme(true);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Use device color scheme with fallback
  const deviceColorScheme = useColorScheme();
  // Initialize with device preference, defaulting to light if null
  const [isDark, setIsDark] = useState(deviceColorScheme === 'dark');
  
  // Update theme when device color scheme changes - only update if user hasn't manually changed it
  const [userChangedTheme, setUserChangedTheme] = useState(false);
  
  React.useEffect(() => {
    if (deviceColorScheme !== null && !userChangedTheme) {
      setIsDark(deviceColorScheme === 'dark');
    }
  }, [deviceColorScheme, userChangedTheme]);

  const toggleTheme = useCallback(() => {
    setUserChangedTheme(true);
    setIsDark(prev => !prev);
  }, []);

  // Use precomputed themes for better performance
  const theme = isDark ? precomputedDarkTheme : precomputedLightTheme;

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      theme,
      isDark,
      toggleTheme,
    }),
    [theme, isDark]
  );

  return (
    <ThemeContext.Provider value={value}>
      <PaperProvider theme={theme}>
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Export the theme for direct usage if needed
export { lightTheme, darkTheme };