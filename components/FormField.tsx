import React, { ReactNode, useState, useEffect, useCallback, ReactElement, ComponentProps } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, useTheme, HelperText } from 'react-native-paper';
import { ExtendedMD3Theme } from '../providers/ThemeProvider';
import { Input } from './Input';

export type ValidationRule = {
  test: (value: string) => boolean;
  message: string;
};

export type ValidationRules = {
  required?: { value: boolean; message: string };
  minLength?: { value: number; message: string };
  maxLength?: { value: number; message: string };
  pattern?: { value: RegExp; message: string };
  custom?: ValidationRule[];
};

interface FormFieldProps {
  label: string;
  children: ReactNode;
  required?: boolean;
  helperText?: string;
  error?: boolean;
  errorMessage?: string;
  value?: string;
  onValidate?: (isValid: boolean) => void;
  validationRules?: ValidationRules;
  testID?: string;
  accessibilityLabel?: string;
  disabled?: boolean;
}

export function FormField({ 
  label, 
  children, 
  required = false,
  helperText,
  error = false,
  errorMessage,
  value = '',
  onValidate,
  validationRules,
  testID,
  accessibilityLabel,
  disabled = false
}: FormFieldProps) {
  const theme = useTheme<ExtendedMD3Theme>();
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  // Validate the input value against the provided validation rules
  const validate = useCallback((inputValue: string): boolean => {
    if (!validationRules) return true;
    
    // Check required validation
    if (validationRules.required?.value && !inputValue.trim()) {
      setValidationError(validationRules.required.message);
      return false;
    }
    
    // Check minimum length validation
    if (validationRules.minLength && inputValue.length < validationRules.minLength.value) {
      setValidationError(validationRules.minLength.message);
      return false;
    }
    
    // Check maximum length validation
    if (validationRules.maxLength && inputValue.length > validationRules.maxLength.value) {
      setValidationError(validationRules.maxLength.message);
      return false;
    }
    
    // Check pattern validation
    if (validationRules.pattern && !validationRules.pattern.value.test(inputValue)) {
      setValidationError(validationRules.pattern.message);
      return false;
    }
    
    // Check custom validations
    if (validationRules.custom) {
      for (const rule of validationRules.custom) {
        if (!rule.test(inputValue)) {
          setValidationError(rule.message);
          return false;
        }
      }
    }
    
    // If all validations pass
    setValidationError(null);
    return true;
  }, [validationRules]);
  
  // Run validation when value changes and the field is dirty
  useEffect(() => {
    if (isDirty && value !== undefined) {
      const isValid = validate(value);
      if (onValidate) {
        onValidate(isValid);
      }
    }
  }, [value, isDirty, validate, onValidate]);
  
  // Mark the field as dirty on first change
  useEffect(() => {
    if (value && !isDirty) {
      setIsDirty(true);
    }
  }, [value, isDirty]);
  
  // Determine if we should show an error
  const showError = error || (validationError !== null && isDirty && isTouched);
  const errorText = errorMessage || validationError || undefined;

  // Get state layer opacity based on current state
  const getStateLayerOpacity = () => {
    if (disabled) return theme.stateLayer.disabled;
    if (isFocused) return theme.stateLayer.focus;
    return 0;
  };
  
  // Clone children and add validation props
  const enhancedChildren = React.Children.map(children, child => {
    if (React.isValidElement<ComponentProps<typeof Input>>(child)) {
      // Only add error and validation props if the child is an Input
      const isInput = 
        child.type === Input || 
        (child.type as any)?.displayName === 'Input' ||
        (child.type as any)?.name === 'Input';
      
      if (!isInput) {
        return child;
      }

      const childProps: Partial<ComponentProps<typeof Input>> = {
        error: showError,
        testID: testID,
        disabled,
        accessibilityLabel: accessibilityLabel || label,
        accessibilityHint: showError ? errorText : helperText,
        accessibilityState: { 
          disabled,
          selected: child.props.accessibilityState?.selected,
          checked: child.props.accessibilityState?.checked,
          busy: child.props.accessibilityState?.busy,
          expanded: child.props.accessibilityState?.expanded,
        } as const,
      };

      // Add focus handlers
      if (!child.props.onFocus) {
        childProps.onFocus = () => setIsFocused(true);
      } else {
        const originalOnFocus = child.props.onFocus;
        childProps.onFocus = (e: any) => {
          setIsFocused(true);
          originalOnFocus(e);
        };
      }

      if (!child.props.onBlur) {
        childProps.onBlur = () => {
          setIsFocused(false);
          setIsTouched(true);
        };
      } else {
        const originalOnBlur = child.props.onBlur;
        childProps.onBlur = (e: any) => {
          setIsFocused(false);
          setIsTouched(true);
          originalOnBlur(e);
        };
      }

      return React.cloneElement(child, childProps);
    }
    return child;
  });
  
  return (
    <View 
      style={[
        styles.field,
        { backgroundColor: theme.colors.surface }
      ]}
      accessible={true}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityRole="none"
      testID={testID}
    >
      <View style={styles.fieldContainer}>
        <Text 
          variant="labelLarge" 
          style={[
            styles.label,
            { 
              color: showError 
                ? theme.colors.error 
                : disabled 
                  ? theme.colors.onSurfaceDisabled
                  : theme.colors.onSurfaceVariant
            }
          ]}
        >
          {label} {required && <Text variant="labelLarge" style={{ color: theme.colors.error }}>*</Text>}
        </Text>
        <View style={styles.inputContainer}>
          {enhancedChildren}
          <View 
            style={[
              styles.stateLayer,
              {
                backgroundColor: theme.colors.primary,
                opacity: getStateLayerOpacity(),
              }
            ]} 
          />
        </View>
      </View>
      
      {/* Show either validation error or helper text */}
      {showError && errorText ? (
        <HelperText 
          type="error" 
          visible={true}
          style={styles.helperText}
          accessibilityLiveRegion="polite"
        >
          {errorText}
        </HelperText>
      ) : helperText ? (
        <HelperText 
          type="info" 
          visible={true}
          style={[
            styles.helperText,
            { 
              color: disabled 
                ? theme.colors.onSurfaceDisabled
                : theme.colors.onSurfaceVariant
            }
          ]}
        >
          {helperText}
        </HelperText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        maxWidth: 500, // Better form field width on web
      },
      default: {
        width: '100%',
      },
    }),
  },
  fieldContainer: {
    padding: 8,
  },
  label: {
    marginBottom: 6,
  },
  inputContainer: {
    position: 'relative',
  },
  stateLayer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  helperText: {
    marginTop: 2,
    marginHorizontal: 8,
  },
});