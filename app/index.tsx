import { Redirect } from 'expo-router';
import { useAuthStore } from './stores/authStore';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Custom splash screen component with Material 3 theming
export default function Index() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { isLoading, isAuthenticated } = useAuthStore();
  const [authChecked, setAuthChecked] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Initializing...');

  // Check Firebase authentication on component mount
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // Use the store's action to set loading state
        useAuthStore.setState({ isLoading: true });
        setStatusMessage('Verifying authentication...');
        
        // Check if user is authenticated using AsyncStorage
        const authToken = await AsyncStorage.getItem('authToken');
        const isAuth = !!authToken;
        
        // Update auth state
        useAuthStore.setState({ isAuthenticated: isAuth });
        
        // Auth check complete
        setAuthChecked(true);
        useAuthStore.setState({ isLoading: false });
      } catch (error) {
        console.error('Authentication verification failed:', error);
        setStatusMessage('Authentication verification failed');
        setAuthChecked(true);
        useAuthStore.setState({ isLoading: false });
      }
    };

    verifyAuth();
  }, []);

  // Show loading state while checking auth status
  if (isLoading || !authChecked) {
    return (
      <View style={[
        styles.container,
        { 
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom 
        }
      ]}>
        <View style={styles.content}>
          <ActivityIndicator 
            size="large" 
            color={theme.colors.primary} 
            style={styles.loader}
          />
          <Text 
            variant="headlineSmall" 
            style={[styles.text, { color: theme.colors.onBackground }]}
          >
            {statusMessage}
          </Text>
        </View>
      </View>
    );
  }

  // Redirect to login if not authenticated, otherwise to home
  return isAuthenticated ? <Redirect href="/home" /> : <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loader: {
    marginBottom: 16,
  },
  text: {
    textAlign: 'center',
    marginTop: 8,
  },
});