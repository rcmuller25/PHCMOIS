import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export const resetAuthState = async () => {
  try {
    // Clear all auth-related storage
    await AsyncStorage.multiRemove([
      'authToken',
      'refresh_token',
      'currentUser',
      'user',
      'users'
    ]);

    // Clear secure storage items
    // Note: SecureStore doesn't have getAllItemsAsync in expo-secure-store
    // We'll just clear the known keys
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await SecureStore.deleteItemAsync('user_1_password'); // Default admin password

    console.log('Auth state has been reset');
    return true;
  } catch (error) {
    console.error('Error resetting auth state:', error);
    return false;
  }
};

export const initializeDefaultAdmin = async () => {
  try {
    // Check if we have any users
    const usersJson = await AsyncStorage.getItem('users');
    let users = usersJson ? JSON.parse(usersJson) : [];
    
    // If no users exist, create default admin
    if (users.length === 0) {
      const defaultAdmin = {
        id: '1',
        username: 'admin',
        email: 'admin@phmos.org',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User'
      };
      
      users = [defaultAdmin];
      await AsyncStorage.setItem('users', JSON.stringify(users));
      
      // Store default password (in a real app, this would be hashed)
      await SecureStore.setItemAsync(`user_1_password`, 'password123');
      
      console.log('Default admin user created');
      return { success: true, user: defaultAdmin };
    }
    
    return { success: true, message: 'Users already exist' };
  } catch (error) {
    console.error('Error initializing default admin:', error);
    return { success: false, error };
  }
};
