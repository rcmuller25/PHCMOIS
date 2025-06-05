export type UserRole = 'admin' | 'clinician' | 'support' | 'user';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatar?: string;
  phoneNumber?: string;
  address?: string;
  bio?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  permissions: string[];
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    organization?: string;
  };
  preferences?: {
    language?: string;
    timezone?: string;
    theme?: 'light' | 'dark' | 'system';
    notifications?: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
    };
  };
}

export interface UserSession {
  token: string;
  refreshToken: string;
  expiresAt: Date;
  user: UserProfile;
}

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastActivity: Date | null;
  sessionExpiry: Date | null;
  isOffline: boolean;
  setLoading?: (isLoading: boolean) => void;
  hasRole?: (requiredRole: UserRole | UserRole[]) => boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData extends LoginCredentials {
  displayName: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

export interface PasswordResetData {
  email: string;
  token?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    quietHours: {
      enabled: boolean;
      startTime: string;
      endTime: string;
    };
  };
  accessibility: {
    fontSize: 'small' | 'medium' | 'large' | 'xlarge';
    highContrast: boolean;
    reduceMotion: boolean;
    screenReader: boolean;
  };
  privacy: {
    analytics: boolean;
    crashReporting: boolean;
    autoLock: number;
  };
}
