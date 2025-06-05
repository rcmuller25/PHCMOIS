// app/stores/authStore.ts
import { create } from 'zustand';
import { AuthState, UserRole, UserProfile, LoginCredentials } from '../../types/user';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Import the AuthService
import { AuthService } from '../../services/authService';
import NetInfo from '@react-native-community/netinfo';

// Define RegistrationData interface locally since we removed the import
interface RegistrationData {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  confirmPassword: string;
  termsAccepted: boolean;
}

export interface AuthStore extends AuthState {
  // User management
  setUser: (user: AuthState['user']) => void;
  clearError: () => void;
  
  // Token management
  setToken: (token: string, refreshToken: string) => Promise<void>;
  getToken: () => Promise<string | null>;
  getRefreshToken: () => Promise<string | null>;
  refreshTokenIfNeeded: () => Promise<boolean>;
  
  // Session management
  checkSessionExpiry: () => void;
  updateLastActivity: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Authentication
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: RegistrationData) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string, newPassword: string) => Promise<boolean>;
  
  // Profile management
  updateProfile: (userId: string, updates: Partial<UserProfile>) => Promise<void>;
  
  // Permissions
  hasPermission: (permission: string) => boolean;
  hasRole: (requiredRole: UserRole | UserRole[]) => boolean;
  
  // Network state
  checkNetworkStatus: () => Promise<boolean>;
  setOfflineMode: (isOffline: boolean) => void;
  syncWithServer: () => Promise<boolean>;
  refreshSession: () => Promise<void>;
  updateActivity: () => void;
}

// Token storage keys
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

// Create the auth store with Zustand
const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state matching AuthState interface
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  lastActivity: new Date(),
  sessionExpiry: null,
  isOffline: false,

  // User management
  setUser: (user) => set((state) => ({ ...state, user })),
  clearError: () => set((state) => ({ ...state, error: null })),
  
  // UI state management
  setLoading: (isLoading) => set((state) => ({ ...state, isLoading })),
  setError: (error) => set((state) => ({ ...state, error })),
  
  // Token management
  setToken: async (token, refreshToken) => {
    try {
      // Store tokens in secure storage when possible
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      } else {
        // Fallback to AsyncStorage for web
        await AsyncStorage.setItem(TOKEN_KEY, token);
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
      
      // Update state
      set((state) => ({
        ...state,
        token,
        refreshToken,
        isAuthenticated: true,
        lastActivity: new Date(),
        sessionExpiry: new Date(Date.now() + SESSION_TIMEOUT)
      }));
    } catch (error) {
      console.error('Error storing tokens:', error);
      set((state) => ({ ...state, error: 'Failed to store authentication tokens' }));
    }
  },
  
  // Get the current auth token
  getToken: async () => {
    try {
      // Try to get from state first
      const { token } = get();
      if (token) return token;
      
      // Otherwise retrieve from storage
      if (Platform.OS !== 'web') {
        return await SecureStore.getItemAsync(TOKEN_KEY);
      } else {
        return await AsyncStorage.getItem(TOKEN_KEY);
      }
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  },
  
  // Get the current refresh token
  getRefreshToken: async () => {
    try {
      // Try to get from state first
      const { refreshToken } = get();
      if (refreshToken) return refreshToken;
      
      // Otherwise retrieve from storage
      if (Platform.OS !== 'web') {
        return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      } else {
        return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      }
    } catch (error) {
      console.error('Error retrieving refresh token:', error);
      return null;
    }
  },
  
  // Session management
  updateLastActivity: () => {
    const now = new Date();
    set((state) => ({
      ...state,
      lastActivity: now,
      sessionExpiry: new Date(now.getTime() + SESSION_TIMEOUT)
    }));
  },
  
  checkSessionExpiry: () => {
    const { sessionExpiry } = get();
    if (!sessionExpiry) return false;
    
    const isExpired = new Date() > sessionExpiry;
    if (isExpired) {
      // Auto logout on session expiry
      get().logout();
    }
    return isExpired;
  },
  
  // Token refresh
  refreshTokenIfNeeded: async () => {
    const { refreshToken, token } = get();
    if (!refreshToken) return false;
    
    try {
      // Simple token validation (in a real app, you'd decode and check expiry)
      const tokenNeedsRefresh = !token || get().checkSessionExpiry();
      
      if (tokenNeedsRefresh) {
        // In a real app, you would call your API to refresh the token
        // For now, we'll simulate a successful refresh
        const newToken = 'offline-token-' + Date.now();
        await get().setToken(newToken, refreshToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      set((state) => ({ ...state, error: 'Session expired. Please log in again.' }));
      get().logout();
      return false;
    }
  },
  
  // Authentication methods
  login: async (emailOrUsername: string, password: string, rememberMe = false) => {
    try {
      // Normalize input
      const identifier = emailOrUsername.trim().toLowerCase();
      console.log('Login initiated for:', identifier);
      set({ isLoading: true, error: null });
      
      // Check network status
      const isOnline = await get().checkNetworkStatus();
      console.log('Network status:', isOnline ? 'Online' : 'Offline');
      
      if (!isOnline) {
        const errorMsg = 'Cannot login while offline. Please check your connection.';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Check for common email typos
      if (identifier.endsWith('@phmos.com')) {
        console.warn('User tried to log in with @phmos.com - did you mean @phmos.org?');
      }
      
      // Use the AuthService for login
      console.log('Attempting login with AuthService...');
      const response = await AuthService.login(identifier, password);
      console.log('AuthService response:', JSON.stringify(response, null, 2));
      
      if (!response.success) {
        let errorMsg = response.message || 'Login failed. Please check your credentials.';
        
        // Provide more specific error messages
        if (errorMsg.includes('not found') || errorMsg.includes('invalid credentials')) {
          errorMsg = 'Invalid username/email or password. Please try again.';
          
          // Check if it might be a typo in the email domain
          if (identifier.endsWith('@phmos.com')) {
            errorMsg += ' Note: The correct domain is @phmos.org';
          }
        }
        
        console.error('Login failed:', errorMsg);
        throw new Error(errorMsg);
      }
      
      if (!response.user || !response.token) {
        const errorMsg = 'Invalid response from authentication service. Please try again.';
        console.error(errorMsg, { response });
        throw new Error(errorMsg);
      }
      
      // Convert the AuthService user to UserProfile format
      const user: UserProfile = {
        id: response.user.id,
        email: response.user.email,
        displayName: response.user.username,
        role: response.user.role as UserRole,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        permissions: [],
        profile: {
          firstName: response.user.firstName || '',
          lastName: response.user.lastName || ''
        }
      };
      
      console.log('User profile created:', user);
      
      // Store tokens
      console.log('Storing auth tokens...');
      await get().setToken(response.token, response.token);
      
      // Store user data if remember me is enabled
      if (rememberMe) {
        console.log('Remember me enabled, storing user data...');
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }
      
      // Update auth state
      console.log('Updating auth state...');
      set({ 
        user, 
        isAuthenticated: true, 
        isLoading: false,
        error: null
      });
      
      console.log('Login successful');
    } catch (error: any) {
      console.error('Login failed:', error);
      set({
        isLoading: false,
        error: error.message || 'Login failed. Please check your credentials.'
      });
      throw error; // Re-throw the error to be caught by the login form
    }
  },
  
  register: async (data) => {
    try {
      set({ isLoading: true, error: null });
      
      // Check network status
      const isOnline = await get().checkNetworkStatus();
      if (!isOnline) {
        throw new Error('Cannot register while offline. Please check your connection.');
      }
      
      // Use the AuthService for registration
      console.log('Registration attempted with:', data.email);
      
      // Extract first and last name from display name
      const firstName = data.displayName.split(' ')[0];
      const lastName = data.displayName.split(' ').slice(1).join(' ');
      
      // Register the user with AuthService
      const response = await AuthService.register(
        data.displayName, // username
        data.email,
        data.password,
        'doctor', // Use doctor as default role since admin can only be created during initialization
        firstName,
        lastName
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Registration failed');
      }
      
      if (!response.user) {
        throw new Error('Invalid response from authentication service');
      }
      
      // Convert the AuthService user to UserProfile format
      const user: UserProfile = {
        id: response.user.id,
        email: response.user.email,
        displayName: response.user.username,
        role: response.user.role as UserRole,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        permissions: [],
        profile: {
          firstName: response.user.firstName || '',
          lastName: response.user.lastName || ''
        }
      };
      
      // Login after successful registration
      const loginResponse = await AuthService.login(data.email, data.password);
      
      if (loginResponse.success && loginResponse.token) {
        // Store tokens
        await get().setToken(loginResponse.token, loginResponse.token);
        
        // Store user data
        await AsyncStorage.setItem('user', JSON.stringify(user));
        
        set({ 
          user: user, 
          isAuthenticated: true, 
          isLoading: false,
          error: null
        });
      } else {
        // Registration successful but login failed
        set({
          isLoading: false,
          error: 'Registration successful. Please login with your credentials.'
        });
        router.replace('/login');
        return;
      }
      
      router.replace('/');
    } catch (error: any) {
      console.error('Registration failed:', error);
      set({
        isLoading: false,
        error: error.message || 'Registration failed. Please try again.'
      });
    }
  },
  
  logout: async () => {
    try {
      set({ isLoading: true });
      
      // Use the AuthService for logout
      await AuthService.logout();
      
      // Clear state
      set({
        user: null, 
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        lastActivity: new Date(),
        sessionExpiry: null
      });
      
      // Navigate to login
      router.replace('/');
    } catch (error: any) {
      console.error('Error during logout:', error);
      set({
        user: null, 
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message || 'Failed to log out properly',
        lastActivity: new Date(),
        sessionExpiry: null
      });
      router.replace('/');
    }
  },
  
  resetPassword: async (email, newPassword) => {
    try {
      set({ isLoading: true, error: null });
      
      // Simplified password reset logic since AuthService is not available
      console.log('Password reset requested for:', email);
      const result = true;
      
      set({ isLoading: false });
      return result;
    } catch (error: any) {
      console.error('Password reset failed:', error);
      set({
        isLoading: false,
        error: error.message || 'Password reset failed. Please try again.'
      });
      throw error;
    }
  },
  
  // Profile management
  updateProfile: async (userId, updates) => {
    try {
      set({ isLoading: true, error: null });
      
      // Simplified profile update logic since AuthService is not available
      console.log('Profile update requested for:', userId, updates);
      const currentUser = get().user;
      if (!currentUser) {
        throw new Error('No user found to update');
      }
      
      // Create a properly typed updated user
      const updatedUser: UserProfile = {
        ...currentUser,
        ...updates,
        updatedAt: new Date() // Update the updatedAt timestamp
      };
      
      // Update state with updated user
      set({ user: updatedUser, isLoading: false });
    } catch (error: any) {
      console.error('Profile update failed:', error);
      set({
        isLoading: false,
        error: error.message || 'Profile update failed. Please try again.'
      });
      throw error;
    }
  },
  
  // Permission checking
  hasPermission: (permission) => {
    const { user } = get();
    if (!user) return false;
    
    // Simple permission check based on role
    return user.role === 'admin';
  },
  
  hasRole: (requiredRole) => {
    const { user } = get();
    if (!user) return false;
    return user.role === requiredRole || user.role === 'admin';
  },
  
  // Network state
  checkNetworkStatus: async () => {
    try {
      const netInfo = await NetInfo.fetch();
      const isOnline = netInfo.isConnected === true;
      set((state) => ({ ...state, isOffline: !isOnline }));
      return isOnline;
    } catch (error) {
      console.error('Network check failed:', error);
      set((state) => ({ ...state, isOffline: true }));
      return false;
    }
  },
  
  setOfflineMode: (isOffline) => {
    set((state) => ({ ...state, isOffline }));
  },
  
  syncWithServer: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Check network status
      const isOnline = await get().checkNetworkStatus();
      if (!isOnline) {
        set({ 
          isLoading: false, 
          error: 'Cannot sync while offline. Please check your connection.'
        });
        return false;
      }
      
      // In a real app, you would implement sync logic here
      // For now, we'll just simulate a successful sync
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      console.error('Sync failed:', error);
      set({
        isLoading: false,
        error: error.message || 'Sync failed. Please try again.'
      });
      return false;
    }
  },
  
  // Session refresh
  refreshSession: async () => {
    try {
      const token = await get().getToken();
      const refreshToken = await get().getRefreshToken();
      
      if (!token || !refreshToken) {
        throw new Error('No tokens available for refresh');
      }
      
      // For now, just extend the session
      get().updateActivity();
      
      // In a real implementation, you would call an API to refresh the token
      // const response = await api.refreshToken(refreshToken);
      // await get().setToken(response.token, response.refreshToken);
    } catch (error) {
      console.error('Failed to refresh session:', error);
      await get().logout();
    }
  },
  
  // Activity tracking
  updateActivity: () => {
    const now = new Date();
    set({
      lastActivity: now,
      sessionExpiry: new Date(now.getTime() + SESSION_TIMEOUT)
    });
  }
}));

// Initialize the auth service and load user from storage
const initializeAuth = async () => {
  try {
    console.log('Initializing auth service...');
    
    // First initialize the AuthService to create default admin if needed
    await AuthService.initialize();
    
    // Check if we have a stored token
    const token = await AsyncStorage.getItem('authToken');
    console.log('Found stored token:', !!token);
    
    if (token) {
      // Try to load user data from storage
      const userJson = await AsyncStorage.getItem('user');
      console.log('Found user data in storage:', !!userJson);
      
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          console.log('Setting authenticated user:', user.email);
          useAuthStore.setState({ 
            user, 
            isAuthenticated: true,
            isLoading: false,
            token: token,
            refreshToken: token // Using same token as refresh for simplicity
          });
        } catch (error) {
          console.error('Error parsing user data:', error);
          // Clear invalid data
          await AsyncStorage.removeItem('user');
          await AsyncStorage.removeItem('authToken');
        }
      }
    }
  } catch (error) {
    console.error('Failed to initialize auth:', error);
    // Ensure loading state is false even if initialization fails
    useAuthStore.setState({ isLoading: false });
  }
};

// Initialize the auth store
console.log('Starting auth store initialization...');
initializeAuth().then(() => {
  console.log('Auth store initialization complete');  
});

export default useAuthStore;
export { useAuthStore };