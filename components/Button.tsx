import React, { useState } from 'react';
import { StyleSheet, ViewStyle, Pressable, View } from 'react-native';
import { Button as PaperButton, useTheme, MD3Theme } from 'react-native-paper';
import { ExtendedMD3Theme } from '../providers/ThemeProvider';

interface ButtonProps {
  title: string;
  onPress: () => void;
  mode?: 'text' | 'outlined' | 'contained' | 'elevated' | 'contained-tonal';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  icon?: string;
  textColor?: string;
  buttonColor?: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'default';
  compact?: boolean;
  elevation?: keyof typeof elevationLevels;
}

export function Button({ 
  title, 
  onPress, 
  mode = 'contained', 
  disabled = false, 
  loading = false,
  style,
  icon,
  textColor,
  buttonColor,
  variant = 'default',
  compact = false,
  elevation = 'level1'
}: ButtonProps) {
  const theme = useTheme<ExtendedMD3Theme>();
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Determine button and text colors based on variant
  const getButtonColors = () => {
    switch(variant) {
      case 'primary':
        return { 
          buttonColor: buttonColor || theme.colors.primary,
          textColor: textColor || theme.colors.onPrimary
        };
      case 'secondary':
        return { 
          buttonColor: buttonColor || theme.colors.secondary,
          textColor: textColor || theme.colors.onSecondary
        };
      case 'tertiary':
        return { 
          buttonColor: buttonColor || theme.colors.tertiary,
          textColor: textColor || theme.colors.onTertiary
        };
      default:
        return { 
          buttonColor: buttonColor,
          textColor: textColor
        };
    }
  };
  
  const { buttonColor: themeButtonColor, textColor: themeTextColor } = getButtonColors();
  
  // Get state layer opacity based on current state
  const getStateLayerOpacity = () => {
    if (disabled) return theme.stateLayer.disabled;
    if (isPressed) return theme.stateLayer.pressed;
    if (isHovered) return theme.stateLayer.hover;
    return 0;
  };

  // Get elevation based on mode and state
  const getElevation = () => {
    if (mode === 'text' || mode === 'outlined') return theme.elevation.level0;
    if (isPressed) return theme.elevation.level1;
    return theme.elevation[elevation];
  };
  
  return (
    <Pressable
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        style,
        getElevation(),
      ]}
    >
      <View style={[
        styles.stateLayer,
        {
          backgroundColor: themeButtonColor,
          opacity: getStateLayerOpacity(),
        }
      ]} />
      <PaperButton 
        mode={mode}
        onPress={onPress}
        disabled={disabled}
        loading={loading}
        icon={icon}
        textColor={themeTextColor}
        buttonColor={themeButtonColor}
        compact={compact}
        style={styles.paperButton}
      >
        {title}
      </PaperButton>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    marginVertical: 8,
    overflow: 'hidden',
  },
  compact: {
    height: 36,
    paddingHorizontal: 8,
  },
  stateLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  paperButton: {
    backgroundColor: 'transparent',
  },
});