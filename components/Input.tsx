import React, { useState } from 'react';
import { StyleSheet, View, ViewStyle, Pressable } from 'react-native';
import { TextInput, useTheme, TextInputProps } from 'react-native-paper';
import { ExtendedMD3Theme } from '../providers/ThemeProvider';
import { elevationLevels } from '../providers/ThemeProvider';

interface InputProps extends Omit<TextInputProps, 'theme'> {
  containerStyle?: ViewStyle;
  elevation?: keyof typeof elevationLevels;
}

export function Input({
  mode = 'outlined',
  containerStyle,
  elevation = 'level1',
  disabled,
  error,
  ...props
}: InputProps) {
  const theme = useTheme<ExtendedMD3Theme>();
  const [isFocused, setIsFocused] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Get state layer opacity based on current state
  const getStateLayerOpacity = () => {
    if (disabled) return theme.stateLayer.disabled;
    if (isPressed) return theme.stateLayer.pressed;
    if (isFocused) return theme.stateLayer.focus;
    return 0;
  };

  // Get elevation based on state
  const getElevation = () => {
    if (disabled) return 0;
    if (isPressed) return 0;
    if (isFocused) return 2;
    return elevationLevels[elevation].elevation;
  };

  return (
    <Pressable
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={disabled}
      style={({ pressed }) => [
        styles.container,
        containerStyle,
        {
          backgroundColor: theme.colors.surface,
          elevation: getElevation(),
        }
      ]}
    >
      <View 
        style={[
          styles.stateLayer,
          {
            backgroundColor: error ? theme.colors.error : theme.colors.primary,
            opacity: getStateLayerOpacity(),
          }
        ]} 
      />
      <TextInput
        mode={mode}
        disabled={disabled}
        error={error}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        style={[
          styles.input,
          {
            backgroundColor: 'transparent',
          }
        ]}
        {...props}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  stateLayer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
  },
}); 