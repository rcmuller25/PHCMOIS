import React, { useMemo } from 'react';
import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { useTheme as usePaperTheme } from 'react-native-paper';
import { Theme } from '../types/theme'; // Import our custom theme type

/**
 * Creates a stylesheet with theme-aware styles
 */
export const createStyles = <T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  styles: (theme: Theme) => T | StyleSheet.NamedStyles<T>
) => {
  return (theme: Theme) => StyleSheet.create(styles(theme));
};

/**
 * Combines multiple style objects into one
 */
export const combineStyles = <T extends ViewStyle | TextStyle | ImageStyle>(
  ...styles: (T | false | null | undefined)[]
): T => {
  return styles.reduce((combined: any, style) => {
    if (style) {
      return { ...combined, ...style };
    }
    return combined;
  }, {});
};

/**
 * Creates a memoized style object that updates when the theme changes
 */
export const useThemedStyles = <T extends StyleSheet.NamedStyles<T>>(
  styles: (theme: Theme) => T | StyleSheet.NamedStyles<T>
) => {
  const theme = usePaperTheme() as unknown as Theme;
  return useMemo(() => createStyles(styles)(theme), [theme, styles]);
};

/**
 * Creates a memoized color value that updates when the theme changes
 */
export const useThemedColor = <T extends keyof Theme['colors']>(
  colorKey: T
): Theme['colors'][T] => {
  const theme = usePaperTheme() as unknown as Theme;
  return useMemo(() => theme.colors[colorKey], [theme, colorKey]);
};

/**
 * Creates a memoized spacing value that updates when the theme changes
 */
export const useSpacing = (key: keyof Theme['spacing']): number => {
  const theme = usePaperTheme() as unknown as Theme;
  return useMemo(() => theme.spacing[key], [theme, key]);
};

/**
 * Creates a memoized typography style that updates when the theme changes
 */
export const useTypography = (
  variant: keyof Theme['typography']['fontSizes'],
  options: {
    weight?: keyof Theme['typography']['fontWeights'];
    color?: keyof Theme['colors'] | string;
    lineHeight?: keyof Theme['typography']['lineHeights'];
  } = {}
): TextStyle => {
  const theme = usePaperTheme() as unknown as Theme;
  
  return useMemo(() => {
    const weight = options.weight || 'regular';
    const fontSize = theme.typography.fontSizes[variant];
    const lineHeight = options.lineHeight 
      ? theme.typography.lineHeights[options.lineHeight] 
      : fontSize * 1.5;
    const color = options.color 
      ? (typeof theme.colors[options.color as keyof Theme['colors']] === 'string' ? theme.colors[options.color as keyof Theme['colors']] : String(options.color)) as string
      : theme.colors.onSurface;
      
    return {
      fontFamily: theme.typography.fontFamily[weight],
      fontSize,
      lineHeight,
      color,
    };
  }, [theme, variant, options.weight, options.lineHeight, options.color]);
};

/**
 * Creates a memoized shadow style that updates when the theme changes
 */
export const useShadow = (level: keyof Theme['elevation']): ViewStyle => {
  const theme = usePaperTheme() as unknown as Theme;
  return useMemo(() => ({
    ...theme.elevation[level],
    shadowColor: theme.colors.shadow,
  }), [theme, level]);
};
