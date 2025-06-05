// components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Surface, useTheme, MD3Theme } from 'react-native-paper';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

// The base error boundary class component
class ErrorBoundaryBase extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      // Use the custom fallback if provided, otherwise use the default one
      return this.props.fallback || (
        <DefaultErrorFallback 
          error={this.state.error} 
          resetError={this.handleReset} 
        />
      );
    }

    return this.props.children;
  }
}

// Props for the default error fallback component
interface DefaultErrorFallbackProps {
  error?: Error;
  resetError: () => void;
}

// A functional component that uses the theme hook
const DefaultErrorFallback = ({ error, resetError }: DefaultErrorFallbackProps) => {
  const theme = useTheme<MD3Theme>();
  
  return (
    <Surface style={styles.container} elevation={1}>
      <Text 
        variant="headlineSmall" 
        style={{ color: theme.colors.onSurface, marginBottom: 16 }}
      >
        Something went wrong
      </Text>
      <Text 
        variant="bodyMedium" 
        style={{ 
          color: theme.colors.error, 
          marginBottom: 24, 
          textAlign: 'center' 
        }}
      >
        {error?.message}
      </Text>
      <Button 
        mode="contained" 
        onPress={resetError}
        buttonColor={theme.colors.primary}
      >
        Try again
      </Button>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    margin: 16,
  },
});

// Export the error boundary component
export const ErrorBoundary = ErrorBoundaryBase;