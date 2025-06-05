// services/securityService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from './secureStorage';
import { ErrorHandlingService, ErrorType, ErrorSeverity } from './errorHandlingService';

export enum SecurityLevel {
  STANDARD = 'STANDARD',
  ENHANCED = 'ENHANCED',
  HIGH = 'HIGH',
}

export interface SecuritySettings {
  level: SecurityLevel;
  encryptLocalData: boolean;
  requireAuthForSensitiveData: boolean;
  inactivityTimeout: number; // in minutes
  sensitiveKeys: string[];
}

export class SecurityService {
  private static readonly SECURITY_SETTINGS_KEY = '@phmos/security_settings';
  private static readonly DEFAULT_SETTINGS: SecuritySettings = {
    level: SecurityLevel.STANDARD,
    encryptLocalData: false,
    requireAuthForSensitiveData: true,
    inactivityTimeout: 15, // 15 minutes
    sensitiveKeys: ['PATIENTS', 'MEDICAL_RECORDS'],
  };
  
  /**
   * Get security settings
   */
  static async getSettings(): Promise<SecuritySettings> {
    try {
      const settingsJson = await AsyncStorage.getItem(this.SECURITY_SETTINGS_KEY);
      return settingsJson ? JSON.parse(settingsJson) : this.DEFAULT_SETTINGS;
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.WARNING,
        { method: 'getSettings' }
      );
      return this.DEFAULT_SETTINGS;
    }
  }
  
  /**
   * Update security settings
   */
  static async updateSettings(settings: Partial<SecuritySettings>): Promise<boolean> {
    try {
      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      await AsyncStorage.setItem(this.SECURITY_SETTINGS_KEY, JSON.stringify(newSettings));
      return true;
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.WARNING,
        { method: 'updateSettings', settings }
      );
      return false;
    }
  }
  
  /**
   * Check if a storage key contains sensitive data
   */
  static async isSensitiveData(key: string): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.sensitiveKeys.includes(key);
  }
  
  /**
   * Encrypt data if needed based on security settings
   */
  static async secureData(key: string, data: any): Promise<string> {
    const settings = await this.getSettings();
    
    // In securityService.ts
    if (settings.encryptLocalData && settings.sensitiveKeys.includes(key)) {
      return await secureStorage.encrypt(JSON.stringify(data));
    }
    
    // Otherwise, just stringify
    return JSON.stringify(data);
  }
  
  /**
   * Decrypt data if needed based on security settings
   */
  static async retrieveData(key: string, data: string): Promise<any> {
    const settings = await this.getSettings();
    
    // If encryption is enabled and this is sensitive data
    if (settings.encryptLocalData && settings.sensitiveKeys.includes(key)) {
      const decrypted = await secureStorage.decrypt(data);
      return JSON.parse(decrypted);
    }
    
    // Otherwise, just parse
    return JSON.parse(data);
  }
  
  /**
   * Apply security level presets
   */
  static async applySecurityLevel(level: SecurityLevel): Promise<boolean> {
    let settings: Partial<SecuritySettings> = { level };
    
    switch (level) {
      case SecurityLevel.STANDARD:
        settings = {
          ...settings,
          encryptLocalData: false,
          requireAuthForSensitiveData: true,
          inactivityTimeout: 15,
        };
        break;
        
      case SecurityLevel.ENHANCED:
        settings = {
          ...settings,
          encryptLocalData: true,
          requireAuthForSensitiveData: true,
          inactivityTimeout: 10,
        };
        break;
        
      case SecurityLevel.HIGH:
        settings = {
          ...settings,
          encryptLocalData: true,
          requireAuthForSensitiveData: true,
          inactivityTimeout: 5,
        };
        break;
    }
    
    return this.updateSettings(settings);
  }
}