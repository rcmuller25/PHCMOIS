export const colors = {
  // Light mode colors
  light: {
    // Primary colors
    primary: '#2C3E50',
    primaryLight: '#34495E',
    primaryDark: '#1A252F',
    
    // Neutral colors
    background: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceHover: '#F1F3F5',
    
    // Text colors
    textPrimary: '#2C3E50',
    textSecondary: '#6C757D',
    textTertiary: '#ADB5BD',
    
    // Status colors (muted versions)
    success: '#2ECC71',
    warning: '#F1C40F',
    error: '#E74C3C',
    info: '#3498DB',
    
    // Border and divider
    border: '#E9ECEF',
    divider: '#DEE2E6',
    
    // Shadows
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  
  // Dark mode colors
  dark: {
    // Primary colors
    primary: '#3498DB',
    primaryLight: '#2980B9',
    primaryDark: '#1F618D',
    
    // Neutral colors
    background: '#1A1A1A',
    surface: '#2D2D2D',
    surfaceHover: '#3D3D3D',
    
    // Text colors
    textPrimary: '#FFFFFF',
    textSecondary: '#B3B3B3',
    textTertiary: '#808080',
    
    // Status colors (muted versions)
    success: '#27AE60',
    warning: '#F39C12',
    error: '#C0392B',
    info: '#2980B9',
    
    // Border and divider
    border: '#404040',
    divider: '#333333',
    
    // Shadows
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  fontFamily: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  lineHeights: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 36,
    xxxl: 40,
  },
  fontWeights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  } as const,
};

export const borderRadius = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const animation = {
  duration: {
    fastest: 100,
    fast: 150,
    normal: 250,
    slow: 350,
    slowest: 500,
  },
  easing: {
    easeInOut: 'ease-in-out',
    easeOut: 'ease-out',
    easeIn: 'ease-in',
    spring: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
  },
  scale: {
    pressed: 0.98,
    hover: 1.02,
  },
};

export const layout = {
  maxWidth: 1200,
  gridGutter: spacing.md,
  containerPadding: spacing.md,
  sectionSpacing: spacing.xl,
};

export const shadows = {
  small: {
    shadowColor: colors.light.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.light.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: colors.light.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const elevation = {
  none: {
    shadowOpacity: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
}; 