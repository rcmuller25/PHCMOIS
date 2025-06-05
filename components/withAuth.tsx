import React, { useEffect, useState, useMemo, memo } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useTheme, MD3Theme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A Higher Order Component (HOC) that protects routes requiring authentication.
 * Redirects to login if user is not authenticated.
 */
const withAuth = (Component: React.ComponentType<any>) => {
  // Use memo to prevent unnecessary re-renders of the wrapped component
  const MemoizedComponent = memo(Component);
  
  const AuthWrapper = (props: any) => {
    const router = useRouter();
    const segments = useSegments();
    const theme = useTheme<MD3Theme>();
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Memoize the loading screen style to prevent recalculation on each render
    const loadingContainerStyle = useMemo(() => ({
      flex: 1, 
      justifyContent: 'center' as const, 
      alignItems: 'center' as const, 
      backgroundColor: theme.colors.background
    }), [theme.colors.background]);

    useEffect(() => {
      // Check authentication status
      const checkAuth = async () => {
        try {
          const authToken = await AsyncStorage.getItem('authToken');
          const isAuth = !!authToken;
          setIsAuthenticated(isAuth);
          
          // If not authenticated and trying to access a protected route
          // Fix type error by checking if segments[0] is not in the auth group
          if (!isAuth && segments[0] !== undefined && !['(auth)'].includes(segments[0])) {
            router.replace('/login');
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          setIsAuthenticated(false);
        } finally {
          setLoading(false);
        }
      };

      checkAuth();
    }, [router, segments]);

    if (loading) {
      return (
        <View style={loadingContainerStyle}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    // If authenticated, render the memoized protected component
    if (isAuthenticated) {
      return <MemoizedComponent {...props} />;
    }

    // This should not be visible as the useEffect should redirect,
    // but it's here as a fallback
    return null;
  };

  // Return a memoized version of the AuthWrapper to prevent unnecessary re-renders
  return memo(AuthWrapper);
};

export default withAuth;
