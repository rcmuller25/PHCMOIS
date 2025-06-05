import React, { useState } from 'react';
import { StyleSheet, View, ViewStyle, Pressable } from 'react-native';
import { Text, useTheme, Surface, TouchableRipple } from 'react-native-paper';
import { ExtendedMD3Theme } from '../providers/ThemeProvider';
import { elevationLevels } from '../providers/ThemeProvider';
import { ChevronDown } from 'lucide-react-native';

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label?: string;
  value?: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  containerStyle?: ViewStyle;
  elevation?: keyof typeof elevationLevels;
  left?: React.ReactNode;
  right?: React.ReactNode;
}

export function Select({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  error = false,
  helperText,
  containerStyle,
  elevation = 'level1',
  left,
  right
}: SelectProps) {
  const theme = useTheme<ExtendedMD3Theme>();
  const [isFocused, setIsFocused] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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

  // Get selected option label
  const selectedOption = options.find(option => option.value === value);
  const displayValue = selectedOption?.label || placeholder;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text 
          variant="labelLarge" 
          style={[
            styles.label,
            { 
              color: error 
                ? theme.colors.error 
                : disabled 
                  ? theme.colors.onSurfaceDisabled
                  : theme.colors.onSurfaceVariant
            }
          ]}
        >
          {label}
        </Text>
      )}
      
      <Pressable
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        style={({ pressed }) => [
          styles.select,
          {
            backgroundColor: theme.colors.surface,
            elevation: getElevation(),
            borderColor: error 
              ? theme.colors.error 
              : isFocused 
                ? theme.colors.primary 
                : theme.colors.outline,
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
        
        {left && <View style={styles.leftIcon}>{left}</View>}
        
        <Text 
          variant="bodyLarge" 
          style={[
            styles.value,
            { 
              color: value 
                ? theme.colors.onSurface 
                : theme.colors.onSurfaceVariant
            }
          ]}
        >
          {displayValue}
        </Text>
        
        {right || (
          <ChevronDown 
            size={20} 
            color={theme.colors.onSurfaceVariant} 
            style={styles.rightIcon}
          />
        )}
      </Pressable>

      {helperText && (
        <Text 
          variant="bodySmall" 
          style={[
            styles.helperText,
            { 
              color: error 
                ? theme.colors.error 
                : disabled 
                  ? theme.colors.onSurfaceDisabled
                  : theme.colors.onSurfaceVariant
            }
          ]}
        >
          {helperText}
        </Text>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <Surface 
          style={[
            styles.dropdown,
            {
              backgroundColor: theme.colors.surface,
              elevation: 4,
            }
          ]}
        >
          {options.map((option) => (
            <TouchableRipple
              key={option.value}
              onPress={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              style={[
                styles.option,
                {
                  backgroundColor: option.value === value 
                    ? theme.colors.primaryContainer 
                    : 'transparent'
                }
              ]}
            >
              <Text 
                variant="bodyLarge"
                style={{ 
                  color: option.value === value 
                    ? theme.colors.onPrimaryContainer 
                    : theme.colors.onSurface
                }}
              >
                {option.label}
              </Text>
            </TouchableRipple>
          ))}
        </Surface>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  label: {
    marginBottom: 6,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 56,
    paddingHorizontal: 16,
  },
  stateLayer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
    borderRadius: 12,
  },
  value: {
    flex: 1,
  },
  leftIcon: {
    marginRight: 12,
  },
  rightIcon: {
    marginLeft: 12,
  },
  helperText: {
    marginTop: 4,
    marginHorizontal: 16,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 1000,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
}); 