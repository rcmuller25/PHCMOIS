import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// User interface
interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'doctor' | 'nurse' | 'receptionist';
  firstName?: string;
  lastName?: string;
}

// Authentication response interface
interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

// Default users for development/testing
const DEFAULT_USERS = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@phmos.org',
    role: 'admin' as const,
    firstName: 'Admin',
    lastName: 'User'
  },
  {
    id: '2',
    username: 'nurse1',
    email: 'nurse@phmos.org',
    role: 'nurse' as const,
    firstName: 'Nurse',
    lastName: 'Practitioner'
  }
];

// Default password for all users
const DEFAULT_PASSWORD = 'Friday@45';

/**
 * Authentication Service
 * Handles user authentication, registration, and session management
 */
export class AuthService {
  private static currentUser: User | null = null;
  private static authToken: string | null = null;
  
  /**
   * Initialize the auth service
   * Creates a default admin account if none exists
   */
  static async initialize(): Promise<void> {
    try {
      // Check if we have any users
      const usersJson = await AsyncStorage.getItem('users');
      let users: User[] = usersJson ? JSON.parse(usersJson) : [];
      
      // If no users exist, create default users
      if (users.length === 0) {
        users = [...DEFAULT_USERS];
        await AsyncStorage.setItem('users', JSON.stringify(users));
        
        // Store default passwords (in a real app, these would be hashed)
        await Promise.all(
          DEFAULT_USERS.map(user => 
            SecureStore.setItemAsync(`user_${user.id}_password`, DEFAULT_PASSWORD)
          )
        );
      }
      
      // Check if we have a stored token
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        this.authToken = token;
        const userJson = await AsyncStorage.getItem('currentUser');
        if (userJson) {
          this.currentUser = JSON.parse(userJson);
        }
      }
    } catch (error) {
      console.error('Error initializing auth service:', error);
    }
  }
  
  /**
   * Login with username/email and password
   */
  static async login(usernameOrEmail: string, password: string): Promise<AuthResponse> {
    try {
      // Get all users
      const usersJson = await AsyncStorage.getItem('users');
      if (!usersJson) {
        return { success: false, message: 'No users found' };
      }
      
      const users: User[] = JSON.parse(usersJson);
      
      // Find user by username or email
      const user = users.find(
        u => u.username === usernameOrEmail || u.email === usernameOrEmail
      );
      
      if (!user) {
        return { success: false, message: 'User not found' };
      }
      
      // Get stored password for user
      const storedPassword = await SecureStore.getItemAsync(`user_${user.id}_password`);
      
      if (storedPassword !== password) {
        return { success: false, message: 'Invalid password' };
      }
      
      // Generate token (in a real app, this would be a JWT)
      const token = `token_${user.id}_${Date.now()}`;
      
      // Store token and user
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));
      
      this.authToken = token;
      this.currentUser = user;
      
      return { success: true, user, token };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'An error occurred during login' };
    }
  }
  
  /**
   * Register a new user
   */
  static async register(
    username: string,
    email: string,
    password: string,
    role: 'doctor' | 'nurse' | 'receptionist',
    firstName?: string,
    lastName?: string
  ): Promise<AuthResponse> {
    try {
      // Get all users
      const usersJson = await AsyncStorage.getItem('users');
      const users: User[] = usersJson ? JSON.parse(usersJson) : [];
      
      // Check if username or email already exists
      const existingUser = users.find(
        u => u.username === username || u.email === email
      );
      
      if (existingUser) {
        return { 
          success: false, 
          message: 'Username or email already in use' 
        };
      }
      
      // Create new user
      const newUser: User = {
        id: `${Date.now()}`,
        username,
        email,
        role,
        firstName,
        lastName
      };
      
      // Add to users array
      users.push(newUser);
      await AsyncStorage.setItem('users', JSON.stringify(users));
      
      // Store password
      await SecureStore.setItemAsync(`user_${newUser.id}_password`, password);
      
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'An error occurred during registration' };
    }
  }
  
  /**
   * Logout the current user
   */
  static async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('currentUser');
      
      this.authToken = null;
      this.currentUser = null;
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
  
  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return !!token;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  }
  
  /**
   * Get the current authenticated user
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      if (this.currentUser) {
        return this.currentUser;
      }
      
      const userJson = await AsyncStorage.getItem('currentUser');
      if (!userJson) {
        return null;
      }
      
      this.currentUser = JSON.parse(userJson);
      return this.currentUser;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }
  
  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    updates: Partial<Omit<User, 'id' | 'role'>>
  ): Promise<AuthResponse> {
    try {
      // Get all users
      const usersJson = await AsyncStorage.getItem('users');
      if (!usersJson) {
        return { success: false, message: 'No users found' };
      }
      
      const users: User[] = JSON.parse(usersJson);
      
      // Find user by ID
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        return { success: false, message: 'User not found' };
      }
      
      // Update user
      users[userIndex] = {
        ...users[userIndex],
        ...updates
      };
      
      // Save updated users
      await AsyncStorage.setItem('users', JSON.stringify(users));
      
      // If updating current user, update in memory and storage
      if (this.currentUser && this.currentUser.id === userId) {
        this.currentUser = users[userIndex];
        await AsyncStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      }
      
      return { success: true, user: users[userIndex] };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, message: 'An error occurred while updating profile' };
    }
  }
  
  /**
   * Change password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<AuthResponse> {
    try {
      // Get stored password
      const storedPassword = await SecureStore.getItemAsync(`user_${userId}_password`);
      
      if (!storedPassword || storedPassword !== currentPassword) {
        return { success: false, message: 'Current password is incorrect' };
      }
      
      // Store new password
      await SecureStore.setItemAsync(`user_${userId}_password`, newPassword);
      
      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: 'An error occurred while changing password' };
    }
  }
}
