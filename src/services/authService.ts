// app/services/authService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Buffer } from 'buffer';
import { z } from 'zod';

// Constants for security configuration
const SECURITY_CONFIG = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_ATTEMPT_WINDOW: 15 * 60 * 1000, // 15 minutes
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  TOKEN_REFRESH_THRESHOLD: 60 * 60 * 1000, // 1 hour
  SALT_ROUNDS: 10,
} as const;

// Validation schemas
const passwordSchema = z.string()
  .min(SECURITY_CONFIG.PASSWORD_MIN_LENGTH, `Password must be at least ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} characters`)
  .max(SECURITY_CONFIG.PASSWORD_MAX_LENGTH, `Password must be at most ${SECURITY_CONFIG.PASSWORD_MAX_LENGTH} characters`)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const emailSchema = z.string().email('Invalid email address');

// Types
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'health_worker' | 'supervisor';
  profile?: {
    firstName: string;
    lastName: string;
    phone?: string;
    organization?: string;
  };
  passwordHash?: string;
  lastLoginAttempt?: number;
  loginAttempts?: number;
  sessionToken?: string;
  sessionExpiry?: number;
}

interface LoginAttempt {
  timestamp: number;
  count: number;
}

interface SessionData {
  token: string;
  expiry: number;
  refreshToken: string;
}

// Security utilities
const securityUtils = {
  async hashPassword(password: string): Promise<string> {
    const salt = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      Crypto.randomUUID()
    );
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password + salt
    );
    return `${salt}:${hash}`;
  },

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    const [salt, hash] = hashedPassword.split(':');
    const verifyHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password + salt
    );
    return hash === verifyHash;
  },

  generateSessionToken(): string {
    return Buffer.from(Crypto.randomUUID()).toString('base64');
  },

  generateRefreshToken(): string {
    return Buffer.from(Crypto.randomUUID()).toString('base64');
  },

  isSessionValid(expiry: number): boolean {
    return Date.now() < expiry;
  },

  shouldRefreshSession(expiry: number): boolean {
    return Date.now() > (expiry - SECURITY_CONFIG.TOKEN_REFRESH_THRESHOLD);
  }
};

// Mock user data - replace with your actual user storage
const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    passwordHash: '$2b$10$example_hash', // This will be properly hashed in production
    role: 'admin',
    profile: {
      firstName: 'Admin',
      lastName: 'User'
    }
  }
];

export class AuthService {
  private static loginAttempts: Map<string, LoginAttempt> = new Map();

  private static async validatePassword(password: string): Promise<void> {
    try {
      await passwordSchema.parseAsync(password);
    } catch (error) {
      throw new Error('Password does not meet security requirements');
    }
  }

  private static async validateEmail(email: string): Promise<void> {
    try {
      await emailSchema.parseAsync(email);
    } catch (error) {
      throw new Error('Invalid email address');
    }
  }

  private static async checkLoginAttempts(email: string): Promise<void> {
    const attempt = this.loginAttempts.get(email);
    const now = Date.now();

    if (attempt && now - attempt.timestamp < SECURITY_CONFIG.LOGIN_ATTEMPT_WINDOW) {
      if (attempt.count >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
        throw new Error('Too many login attempts. Please try again later.');
      }
      attempt.count++;
    } else {
      this.loginAttempts.set(email, { timestamp: now, count: 1 });
    }
  }

  private static async createSession(user: User): Promise<SessionData> {
    const sessionToken = securityUtils.generateSessionToken();
    const refreshToken = securityUtils.generateRefreshToken();
    const expiry = Date.now() + SECURITY_CONFIG.SESSION_DURATION;

    const sessionData: SessionData = {
      token: sessionToken,
      expiry,
      refreshToken
    };

    await AsyncStorage.setItem(`session_${user.id}`, JSON.stringify(sessionData));
    return sessionData;
  }

  static async signIn(email: string, password: string) {
    try {
      await this.validateEmail(email);
      await this.checkLoginAttempts(email);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const user = MOCK_USERS.find(u => u.email === email);
      if (!user || !user.passwordHash) {
        throw new Error('Invalid email or password');
      }

      const isValid = await securityUtils.verifyPassword(password, user.passwordHash);
      if (!isValid) {
        throw new Error('Invalid email or password');
      }

      // Create new session
      const session = await this.createSession(user);

      // Remove sensitive data before storing
      const { passwordHash, ...userWithoutSensitiveData } = user;
      await AsyncStorage.setItem('user', JSON.stringify(userWithoutSensitiveData));

      return { 
        user: userWithoutSensitiveData,
        session
      };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  static async signOut() {
    try {
      const user = await this.getCurrentUser();
      if (user) {
        await AsyncStorage.removeItem(`session_${user.id}`);
      }
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  static async getCurrentUser() {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (!userJson) return null;

      const user = JSON.parse(userJson) as User;
      const sessionJson = await AsyncStorage.getItem(`session_${user.id}`);
      
      if (!sessionJson) {
        await this.signOut();
        return null;
      }

      const session = JSON.parse(sessionJson) as SessionData;
      
      if (!securityUtils.isSessionValid(session.expiry)) {
        await this.signOut();
        return null;
      }

      if (securityUtils.shouldRefreshSession(session.expiry)) {
        const newSession = await this.createSession(user);
        return { ...user, session: newSession };
      }

      return { ...user, session };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  static async resetPassword(email: string) {
    try {
      await this.validateEmail(email);
      
      // In a real app, you would:
      // 1. Generate a secure reset token
      // 2. Store it with an expiry
      // 3. Send an email with a reset link
      // 4. Implement rate limiting for reset attempts
      
      const resetToken = securityUtils.generateSessionToken();
      const expiry = Date.now() + 3600000; // 1 hour
      
      await AsyncStorage.setItem(`reset_${email}`, JSON.stringify({
        token: resetToken,
        expiry
      }));

      return { 
        success: true,
        message: 'Password reset instructions sent to your email'
      };
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  static async updatePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      await this.validatePassword(newPassword);
      
      const user = MOCK_USERS.find(u => u.id === userId);
      if (!user || !user.passwordHash) {
        throw new Error('User not found');
      }

      const isValid = await securityUtils.verifyPassword(currentPassword, user.passwordHash);
      if (!isValid) {
        throw new Error('Current password is incorrect');
      }

      const newHash = await securityUtils.hashPassword(newPassword);
      // In a real app, update the password hash in the database
      
      return { success: true };
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  }
}