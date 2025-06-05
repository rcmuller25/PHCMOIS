import AsyncStorage from '@react-native-async-storage/async-storage';
import { ValidationService } from './validationService';
import { ErrorHandlingService, ErrorType, ErrorSeverity } from './errorHandlingService';
import { SecurityService } from './securityService';
import { 
  patientValidationSchema, 
  appointmentValidationSchema, 
  medicalRecordValidationSchema 
} from './validationService';
import * as Yup from 'yup';
import { deflate, inflate } from 'react-native-gzip';
import * as Crypto from 'expo-crypto';

// Define storage keys
export const STORAGE_KEYS = {
  PATIENTS: 'PATIENTS',
  APPOINTMENTS: 'APPOINTMENTS',
  MEDICAL_RECORDS: 'MEDICAL_RECORDS',
  VISITS: 'VISITS',
  HEALTH_WORKERS: 'HEALTH_WORKERS',
  DATA_INITIALIZATION: 'DATA_INITIALIZATION',
  SYNC_QUEUE: 'SYNC_QUEUE',
  LAST_SYNC_TIME: 'LAST_SYNC_TIME',
  SCHEMA_VERSION: 'SCHEMA_VERSION',
  ARCHIVED_DATA: 'ARCHIVED_DATA',
  STORAGE_STATS: 'STORAGE_STATS',
} as const;

export type StorageKey = keyof typeof STORAGE_KEYS;

// Base interface for all stored items
export interface OfflineItem {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  _synced?: boolean;
  _deleted?: boolean;
  [key: string]: any;
}

// Compression threshold in bytes (only compress data larger than this)
const COMPRESSION_THRESHOLD = 1024; // 1KB

// Archive settings
const DEFAULT_ARCHIVE_SETTINGS = {
  enabled: true,
  olderThanDays: 90, // Archive items older than 90 days
  includeTypes: ['APPOINTMENTS', 'MEDICAL_RECORDS'] as StorageKey[],
  maxArchivedItems: 1000,
};

// Storage quota settings
const STORAGE_QUOTA = {
  warningThreshold: 0.8, // 80% of available storage
  criticalThreshold: 0.9, // 90% of available storage
  maxItemsPerType: 10000,
};

// Backup and recovery settings
const BACKUP_SETTINGS = {
  autoBackupEnabled: true,
  autoBackupInterval: 24 * 60 * 60 * 1000, // 24 hours
  maxBackups: 7, // Keep last 7 backups
  backupCompression: true,
  backupEncryption: true,
  backupTypes: ['PATIENTS', 'APPOINTMENTS', 'MEDICAL_RECORDS', 'VISITS', 'HEALTH_WORKERS'] as StorageKey[],
} as const;

interface BackupMetadata {
  id: string;
  timestamp: number;
  version: string;
  size: number;
  itemCounts: Record<StorageKey, number>;
  checksum: string;
  encrypted: boolean;
  compressed: boolean;
}

interface BackupData {
  metadata: BackupMetadata;
  data: Record<StorageKey, any[]>;
}

// Validation schemas for different data types
const validationSchemas: Partial<Record<StorageKey, Yup.ObjectSchema<any>>> = {
  PATIENTS: patientValidationSchema,
  APPOINTMENTS: appointmentValidationSchema,
  MEDICAL_RECORDS: medicalRecordValidationSchema,
};

// Current schema version
const CURRENT_SCHEMA_VERSION = '1.0.0';

// Schema migration definitions
interface SchemaMigration {
  version: string;
  migrate: (data: any) => Promise<any>;
}

const schemaMigrations: SchemaMigration[] = [
  {
    version: '1.0.0',
    migrate: async (data: any) => {
      // Initial schema version, no migration needed
      return data;
    }
  }
  // Add future migrations here
];

// Add new validation interfaces
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

// Update validation rules to include all storage keys
const VALIDATION_RULES = {
  REQUIRED_FIELDS: {
    PATIENTS: ['id', 'name', 'dateOfBirth'],
    APPOINTMENTS: ['id', 'patientId', 'date', 'type'],
    MEDICAL_RECORDS: ['id', 'patientId', 'date', 'type'],
    VISITS: ['id', 'patientId', 'date'],
    HEALTH_WORKERS: ['id', 'name', 'role'],
    DATA_INITIALIZATION: ['version', 'timestamp'],
    SYNC_QUEUE: ['id', 'storageKey', 'operation', 'data'],
    LAST_SYNC_TIME: ['timestamp'],
    SCHEMA_VERSION: ['version'],
    ARCHIVED_DATA: ['timestamp'],
    STORAGE_STATS: ['timestamp'],
  },
  FIELD_TYPES: {
    PATIENTS: {
      id: 'string',
      name: 'string',
      dateOfBirth: 'date',
      gender: 'string',
      phoneNumber: 'string',
      address: 'string',
    },
    APPOINTMENTS: {
      id: 'string',
      patientId: 'string',
      date: 'date',
      type: 'string',
      status: 'string',
      notes: 'string',
    },
    MEDICAL_RECORDS: {
      id: 'string',
      patientId: 'string',
      date: 'date',
      type: 'string',
      diagnosis: 'string',
      treatment: 'string',
      notes: 'string',
    },
    VISITS: {
      id: 'string',
      patientId: 'string',
      date: 'date',
      type: 'string',
      status: 'string',
    },
    HEALTH_WORKERS: {
      id: 'string',
      name: 'string',
      role: 'string',
      specialization: 'string',
    },
    DATA_INITIALIZATION: {
      version: 'string',
      timestamp: 'date',
    },
    SYNC_QUEUE: {
      id: 'string',
      storageKey: 'string',
      operation: 'string',
      data: 'object',
    },
    LAST_SYNC_TIME: {
      timestamp: 'date',
    },
    SCHEMA_VERSION: {
      version: 'string',
    },
    ARCHIVED_DATA: {
      timestamp: 'date',
    },
    STORAGE_STATS: {
      timestamp: 'date',
    },
  },
  FIELD_CONSTRAINTS: {
    PATIENTS: {
      name: { minLength: 2, maxLength: 100 },
      phoneNumber: { pattern: /^\+?[\d\s-]{10,}$/ },
      dateOfBirth: { maxDate: 'now' },
    },
    APPOINTMENTS: {
      date: { minDate: 'now' },
      type: { enum: ['checkup', 'followup', 'emergency', 'routine'] },
      status: { enum: ['scheduled', 'completed', 'cancelled', 'no-show'] },
    },
    MEDICAL_RECORDS: {
      type: { enum: ['consultation', 'procedure', 'test', 'prescription'] },
      diagnosis: { minLength: 3 },
      treatment: { minLength: 3 },
    },
    VISITS: {
      type: { enum: ['regular', 'emergency', 'followup'] },
      status: { enum: ['scheduled', 'completed', 'cancelled'] },
    },
    HEALTH_WORKERS: {
      role: { enum: ['doctor', 'nurse', 'specialist', 'admin'] },
      name: { minLength: 2, maxLength: 100 },
    },
  },
} as const;

export class StorageService {
  private static getKey(key: StorageKey): string {
    return STORAGE_KEYS[key];
  }

  private static async getSchemaVersion(): Promise<string> {
    try {
      const version = await AsyncStorage.getItem(STORAGE_KEYS.SCHEMA_VERSION);
      return version || '0.0.0';
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.ERROR,
        { method: 'getSchemaVersion' }
      );
      return '0.0.0';
    }
  }

  private static async setSchemaVersion(version: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, version);
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.ERROR,
        { method: 'setSchemaVersion', version }
      );
    }
  }

  private static async migrateData(key: StorageKey, data: any): Promise<any> {
    const currentVersion = await this.getSchemaVersion();
    
    if (currentVersion === CURRENT_SCHEMA_VERSION) {
      return data;
    }

    let migratedData = data;
    const applicableMigrations = schemaMigrations.filter(
      migration => migration.version > currentVersion
    );

    for (const migration of applicableMigrations) {
      try {
        migratedData = await migration.migrate(migratedData);
      } catch (error) {
        await ErrorHandlingService.handleError(
          error as Error,
          ErrorType.MIGRATION,
          ErrorSeverity.ERROR,
          { 
            method: 'migrateData',
            key,
            fromVersion: currentVersion,
            toVersion: migration.version
          }
        );
        throw error;
      }
    }

    await this.setSchemaVersion(CURRENT_SCHEMA_VERSION);
    return migratedData;
  }

  static async getItem<T>(key: StorageKey): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS[key]);
      if (!jsonValue) return null;

      // Check if data is compressed
      let decryptedValue;
      try {
        // Try to decompress first
        const decompressed = await inflate(jsonValue);
        decryptedValue = await SecurityService.retrieveData(key, decompressed);
      } catch {
        // If decompression fails, assume data is not compressed
        decryptedValue = await SecurityService.retrieveData(key, jsonValue);
      }

      // Migrate data if needed
      const migratedData = await this.migrateData(key, decryptedValue);
      
      return migratedData as T;
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.ERROR,
        { method: 'getItem', key }
      );
      return null;
    }
  }

  static async setItem<T>(key: StorageKey, value: T): Promise<boolean> {
    try {
      // Validate data if schema exists
      if (validationSchemas[key]) {
        const validationResult = await ValidationService.validate(validationSchemas[key], value);
        if (!validationResult.isValid) {
          await ErrorHandlingService.handleError(
            new Error(`Validation failed for ${key}`),
            ErrorType.VALIDATION,
            ErrorSeverity.ERROR,
            { method: 'setItem', key, errors: validationResult.errors }
          );
          return false;
        }
      }

      // Additional validation
      if (Array.isArray(value)) {
        for (const item of value) {
          const validationResult = this.validateData(key, item);
          if (!validationResult.isValid) {
            await ErrorHandlingService.handleError(
              new Error(`Data validation failed for ${key}`),
              ErrorType.VALIDATION,
              ErrorSeverity.ERROR,
              { method: 'setItem', key, errors: validationResult.errors }
            );
            return false;
          }
          if (validationResult.warnings.length > 0) {
            await ErrorHandlingService.handleError(
              new Error(`Data validation warnings for ${key}`),
              ErrorType.VALIDATION,
              ErrorSeverity.WARNING,
              { method: 'setItem', key, warnings: validationResult.warnings }
            );
          }
        }
      } else {
        const validationResult = this.validateData(key, value as OfflineItem);
        if (!validationResult.isValid) {
          await ErrorHandlingService.handleError(
            new Error(`Data validation failed for ${key}`),
            ErrorType.VALIDATION,
            ErrorSeverity.ERROR,
            { method: 'setItem', key, errors: validationResult.errors }
          );
          return false;
        }
        if (validationResult.warnings.length > 0) {
          await ErrorHandlingService.handleError(
            new Error(`Data validation warnings for ${key}`),
            ErrorType.VALIDATION,
            ErrorSeverity.WARNING,
            { method: 'setItem', key, warnings: validationResult.warnings }
          );
        }
      }

      // Continue with existing sanitization and storage logic
      const sanitizedValue = this.sanitizeData(value);
      const encryptedValue = await SecurityService.secureData(key, sanitizedValue);
      const shouldCompress = encryptedValue.length > COMPRESSION_THRESHOLD;
      const finalValue = shouldCompress ? await deflate(encryptedValue) : encryptedValue;
      
      await AsyncStorage.setItem(STORAGE_KEYS[key], finalValue);
      return true;
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.ERROR,
        { method: 'setItem', key }
      );
      return false;
    }
  }

  static async removeItem(key: StorageKey): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS[key]);
      return true;
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.ERROR,
        { method: 'removeItem', key }
      );
      return false;
    }
  }

  static async clearAll(): Promise<boolean> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
      return true;
    } catch (error) {
      console.error('Error clearing all storage:', error);
      return false;
    }
  }

  static async getItems<T extends OfflineItem>(key: StorageKey): Promise<T[]> {
    try {
      const items = await this.getItem<T[]>(key);
      return items || [];
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.ERROR,
        { method: 'getItems', key }
      );
      return [];
    }
  }

  static async addItem<T extends OfflineItem>(key: StorageKey, item: T): Promise<boolean> {
    try {
      // Validate single item if schema exists
      if (validationSchemas[key]) {
        const validationResult = await ValidationService.validate(validationSchemas[key], item);
        if (!validationResult.isValid) {
          await ErrorHandlingService.handleError(
            new Error(`Validation failed for ${key}`),
            ErrorType.VALIDATION,
            ErrorSeverity.ERROR,
            { method: 'addItem', key, errors: validationResult.errors }
          );
          return false;
        }
      }

      // Sanitize item
      const sanitizedItem = this.sanitizeData(item);

      const items = await this.getItems<T>(key);
      items.push(sanitizedItem);
      return await this.setItem(key, items);
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.ERROR,
        { method: 'addItem', key }
      );
      return false;
    }
  }

  static async updateItem<T extends OfflineItem>(key: StorageKey, id: string, updates: Partial<T>): Promise<boolean> {
    try {
      const items = await this.getItems<T>(key);
      const index = items.findIndex(item => item.id === id);
      
      if (index === -1) return false;

      // Create updated item
      const updatedItem = {
        ...items[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // Validate updated item if schema exists
      if (validationSchemas[key]) {
        const validationResult = await ValidationService.validate(validationSchemas[key], updatedItem);
        if (!validationResult.isValid) {
          await ErrorHandlingService.handleError(
            new Error(`Validation failed for ${key}`),
            ErrorType.VALIDATION,
            ErrorSeverity.ERROR,
            { method: 'updateItem', key, errors: validationResult.errors }
          );
          return false;
        }
      }

      // Sanitize updated item
      const sanitizedItem = this.sanitizeData(updatedItem);

      items[index] = sanitizedItem;
      return await this.setItem(key, items);
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.ERROR,
        { method: 'updateItem', key }
      );
      return false;
    }
  }

  static async deleteItem(key: StorageKey, id: string): Promise<boolean> {
    try {
      const items = await this.getItems<OfflineItem>(key);
      const filteredItems = items.filter(item => item.id !== id);
      return await this.setItem(key, filteredItems);
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.ERROR,
        { method: 'deleteItem', key }
      );
      return false;
    }
  }

  private static sanitizeData<T>(data: T): T {
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item)) as unknown as T;
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        // Skip internal properties
        if (key.startsWith('_')) {
          sanitized[key] = value;
          continue;
        }

        // Sanitize string values
        if (typeof value === 'string') {
          sanitized[key] = this.sanitizeString(value);
        } else if (Array.isArray(value)) {
          sanitized[key] = value.map(item => this.sanitizeData(item));
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.sanitizeData(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized as T;
    }

    return data;
  }

  private static sanitizeString(value: string): string {
    // Remove any potential script tags
    value = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove any potential HTML tags
    value = value.replace(/<[^>]*>/g, '');
    
    // Remove any potential SQL injection patterns
    value = value.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, char => {
      switch (char) {
        case '\0':
          return '\\0';
        case '\x08':
          return '\\b';
        case '\x09':
          return '\\t';
        case '\x1a':
          return '\\z';
        case '\n':
          return '\\n';
        case '\r':
          return '\\r';
        case '"':
        case "'":
        case '\\':
        case '%':
          return '\\' + char;
        default:
          return char;
      }
    });

    return value;
  }

  /**
   * Archive old data based on settings
   */
  static async archiveOldData(): Promise<{ success: boolean; archived: number }> {
    const result = { success: true, archived: 0 };
    
    try {
      const settings = DEFAULT_ARCHIVE_SETTINGS;
      
      if (!settings.enabled) {
        return result;
      }
      
      // Calculate the cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - settings.olderThanDays);
      const cutoffTimestamp = cutoffDate.toISOString();
      
      // Process each included storage type
      for (const key of settings.includeTypes) {
        const items = await this.getItems<OfflineItem>(key);
        
        // Find items to archive (older than cutoff date and already synced)
        const itemsToArchive = items.filter(item => {
          if (!item._synced || item._deleted) {
            return false;
          }
          
          const timestamp = item.updatedAt || item.createdAt;
          return timestamp && timestamp < cutoffTimestamp;
        });
        
        if (itemsToArchive.length > 0) {
          // Archive the items
          await this.archiveItems(key, itemsToArchive);
          
          // Remove archived items from active storage
          const remainingItems = items.filter(item => 
            !itemsToArchive.some(archiveItem => archiveItem.id === item.id)
          );
          
          await this.setItem(key, remainingItems);
          
          result.archived += itemsToArchive.length;
        }
      }
      
      // Update storage stats
      await this.updateStorageStats();
      
      return result;
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.ERROR,
        { method: 'archiveOldData' }
      );
      return { success: false, archived: result.archived };
    }
  }

  /**
   * Archive items
   */
  private static async archiveItems(key: StorageKey, items: OfflineItem[]): Promise<boolean> {
    try {
      // Get current archived data
      const archivedDataJson = await AsyncStorage.getItem(STORAGE_KEYS.ARCHIVED_DATA);
      const archivedData: Record<string, OfflineItem[]> = archivedDataJson 
        ? JSON.parse(archivedDataJson) 
        : {};
      
      // Add items to archive
      if (!archivedData[key]) {
        archivedData[key] = [];
      }
      
      // Add archive timestamp to items
      const itemsWithTimestamp = items.map(item => ({
        ...item,
        _archivedAt: new Date().toISOString(),
      }));
      
      archivedData[key] = [...archivedData[key], ...itemsWithTimestamp];
      
      // Limit the number of archived items if needed
      if (archivedData[key].length > DEFAULT_ARCHIVE_SETTINGS.maxArchivedItems) {
        archivedData[key] = archivedData[key].slice(-DEFAULT_ARCHIVE_SETTINGS.maxArchivedItems);
      }
      
      // Compress and save archived data
      const compressedData = await deflate(JSON.stringify(archivedData));
      await AsyncStorage.setItem(STORAGE_KEYS.ARCHIVED_DATA, compressedData);
      
      return true;
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.ERROR,
        { method: 'archiveItems', key, itemCount: items.length }
      );
      return false;
    }
  }

  /**
   * Get archived items
   */
  static async getArchivedItems<T extends OfflineItem>(key: StorageKey): Promise<T[]> {
    try {
      const archivedDataJson = await AsyncStorage.getItem(STORAGE_KEYS.ARCHIVED_DATA);
      
      if (!archivedDataJson) {
        return [];
      }
      
      const decompressed = await inflate(archivedDataJson);
      const archivedData = JSON.parse(decompressed) as Record<string, T[]>;
      return archivedData[key] || [];
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.ERROR,
        { method: 'getArchivedItems', key }
      );
      return [];
    }
  }

  /**
   * Restore archived item to active storage
   */
  static async restoreArchivedItem<T extends OfflineItem>(key: StorageKey, id: string): Promise<boolean> {
    try {
      // Get archived items
      const archivedItems = await this.getArchivedItems<T>(key);
      const itemToRestore = archivedItems.find(item => item.id === id);
      
      if (!itemToRestore) {
        return false;
      }
      
      // Remove _archivedAt property
      const { _archivedAt, ...restoredItem } = itemToRestore as any;
      
      // Add item back to active storage
      await this.addItem(key, restoredItem);
      
      // Remove from archived items
      const updatedArchivedItems = archivedItems.filter(item => item.id !== id);
      
      // Get all archived data
      const archivedDataJson = await AsyncStorage.getItem(STORAGE_KEYS.ARCHIVED_DATA);
      const decompressed = await inflate(archivedDataJson || '{}');
      const archivedData = JSON.parse(decompressed) as Record<string, T[]>;
      
      // Update archived data
      archivedData[key] = updatedArchivedItems as any;
      
      // Save updated archived data
      const compressedData = await deflate(JSON.stringify(archivedData));
      await AsyncStorage.setItem(STORAGE_KEYS.ARCHIVED_DATA, compressedData);
      
      // Update storage stats
      await this.updateStorageStats();
      
      return true;
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.ERROR,
        { method: 'restoreArchivedItem', key, id }
      );
      return false;
    }
  }

  /**
   * Update storage statistics
   */
  static async updateStorageStats(): Promise<boolean> {
    try {
      const stats: Record<string, any> = {
        timestamp: new Date().toISOString(),
        storageUsage: {},
        archivedItems: {},
      };
      
      // Get storage usage for each key
      for (const key of Object.keys(STORAGE_KEYS)) {
        const items = await this.getItems(key as StorageKey);
        stats.storageUsage[key] = {
          count: items.length,
          activeCount: items.filter(item => !item._deleted).length,
          deletedCount: items.filter(item => item._deleted).length,
          syncedCount: items.filter(item => item._synced).length,
          unsyncedCount: items.filter(item => !item._synced).length,
        };
      }
      
      // Get archived items count
      const archivedDataJson = await AsyncStorage.getItem(STORAGE_KEYS.ARCHIVED_DATA);
      if (archivedDataJson) {
        const decompressed = await inflate(archivedDataJson);
        const archivedData = JSON.parse(decompressed) as Record<string, OfflineItem[]>;
        
        for (const [key, items] of Object.entries(archivedData)) {
          stats.archivedItems[key] = items.length;
        }
      }
      
      // Save stats
      await AsyncStorage.setItem(STORAGE_KEYS.STORAGE_STATS, JSON.stringify(stats));
      return true;
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.WARNING,
        { method: 'updateStorageStats' }
      );
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<Record<string, any> | null> {
    try {
      const statsJson = await AsyncStorage.getItem(STORAGE_KEYS.STORAGE_STATS);
      return statsJson ? JSON.parse(statsJson) : null;
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.WARNING,
        { method: 'getStorageStats' }
      );
      return null;
    }
  }

  /**
   * Check storage quota and cleanup if needed
   */
  static async checkStorageQuota(): Promise<{ needsCleanup: boolean; warning: boolean; critical: boolean }> {
    try {
      const stats = await this.getStorageStats();
      if (!stats) return { needsCleanup: false, warning: false, critical: false };

      interface StorageUsage {
        count: number;
        activeCount: number;
        deletedCount: number;
        syncedCount: number;
        unsyncedCount: number;
      }

      const totalItems = Object.values(stats.storageUsage as Record<string, StorageUsage>).reduce(
        (sum: number, usage: StorageUsage) => sum + usage.count,
        0
      );

      const quotaStatus = {
        needsCleanup: false,
        warning: false,
        critical: false,
      };

      // Check per-type limits
      for (const [key, usage] of Object.entries(stats.storageUsage as Record<string, StorageUsage>)) {
        if (usage.count > STORAGE_QUOTA.maxItemsPerType) {
          quotaStatus.needsCleanup = true;
          quotaStatus.warning = true;
        }
      }

      // Check overall storage usage
      const storageUsage = totalItems / STORAGE_QUOTA.maxItemsPerType;
      if (storageUsage >= STORAGE_QUOTA.criticalThreshold) {
        quotaStatus.needsCleanup = true;
        quotaStatus.critical = true;
      } else if (storageUsage >= STORAGE_QUOTA.warningThreshold) {
        quotaStatus.needsCleanup = true;
        quotaStatus.warning = true;
      }

      return quotaStatus;
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.WARNING,
        { method: 'checkStorageQuota' }
      );
      return { needsCleanup: false, warning: false, critical: false };
    }
  }

  // Add validation methods
  private static validateData<T extends OfflineItem>(
    key: StorageKey,
    data: T
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Check required fields
    const requiredFields = VALIDATION_RULES.REQUIRED_FIELDS[key as keyof typeof VALIDATION_RULES.REQUIRED_FIELDS];
    if (requiredFields) {
      for (const field of requiredFields) {
        if (!data[field]) {
          result.isValid = false;
          result.errors.push({
            field,
            message: `${field} is required`,
            code: 'REQUIRED_FIELD',
            severity: 'error',
          });
        }
      }
    }

    // Check field types
    const fieldTypes = VALIDATION_RULES.FIELD_TYPES[key as keyof typeof VALIDATION_RULES.FIELD_TYPES];
    if (fieldTypes) {
      for (const [field, type] of Object.entries(fieldTypes)) {
        const value = data[field];
        if (value !== undefined && !this.validateFieldType(value, type)) {
          result.isValid = false;
          result.errors.push({
            field,
            message: `${field} must be of type ${type}`,
            code: 'INVALID_TYPE',
            severity: 'error',
          });
        }
      }
    }

    // Check field constraints
    const constraints = VALIDATION_RULES.FIELD_CONSTRAINTS[key as keyof typeof VALIDATION_RULES.FIELD_CONSTRAINTS];
    if (constraints) {
      for (const [field, constraint] of Object.entries(constraints)) {
        const value = data[field];
        if (value !== undefined) {
          const validationResult = this.validateFieldConstraint(value, constraint);
          if (!validationResult.isValid) {
            result.isValid = false;
            result.errors.push({
              field,
              message: validationResult.message,
              code: validationResult.code,
              severity: 'error',
            });
          }
          if (validationResult.warning) {
            result.warnings.push({
              field,
              message: validationResult.warning,
              code: 'VALIDATION_WARNING',
            });
          }
        }
      }
    }

    return result;
  }

  private static validateFieldType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'date':
        return this.isValidDate(value);
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }

  private static validateFieldConstraint(
    value: any,
    constraint: any
  ): { isValid: boolean; message: string; code: string; warning?: string } {
    if (constraint.minLength && typeof value === 'string' && value.length < constraint.minLength) {
      return {
        isValid: false,
        message: `Minimum length is ${constraint.minLength}`,
        code: 'MIN_LENGTH',
      };
    }

    if (constraint.maxLength && typeof value === 'string' && value.length > constraint.maxLength) {
      return {
        isValid: false,
        message: `Maximum length is ${constraint.maxLength}`,
        code: 'MAX_LENGTH',
      };
    }

    if (constraint.pattern && typeof value === 'string' && !constraint.pattern.test(value)) {
      return {
        isValid: false,
        message: 'Invalid format',
        code: 'INVALID_FORMAT',
      };
    }

    if (constraint.enum && !constraint.enum.includes(value)) {
      return {
        isValid: false,
        message: `Must be one of: ${constraint.enum.join(', ')}`,
        code: 'INVALID_ENUM',
      };
    }

    if (constraint.minDate && this.isValidDate(value)) {
      const minDate = constraint.minDate === 'now' ? new Date() : new Date(constraint.minDate);
      if (new Date(value) < minDate) {
        return {
          isValid: false,
          message: `Date must be after ${minDate.toISOString()}`,
          code: 'INVALID_DATE',
        };
      }
    }

    if (constraint.maxDate && this.isValidDate(value)) {
      const maxDate = constraint.maxDate === 'now' ? new Date() : new Date(constraint.maxDate);
      if (new Date(value) > maxDate) {
        return {
          isValid: false,
          message: `Date must be before ${maxDate.toISOString()}`,
          code: 'INVALID_DATE',
        };
      }
    }

    return { isValid: true, message: '', code: '' };
  }

  private static isValidDate(value: any): boolean {
    if (!value) return false;
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime());
  }

  private static async generateBackupId(): Promise<string> {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `backup_${timestamp}_${random}`;
  }

  private static async calculateChecksum(data: string): Promise<string> {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data
    );
    return hash;
  }

  private static async createBackup(): Promise<BackupMetadata> {
    try {
      const backupId = await this.generateBackupId();
      const backupData: BackupData = {
        metadata: {
          id: backupId,
          timestamp: Date.now(),
          version: await this.getSchemaVersion(),
          size: 0,
          itemCounts: {} as Record<StorageKey, number>,
          checksum: '',
          encrypted: BACKUP_SETTINGS.backupEncryption,
          compressed: BACKUP_SETTINGS.backupCompression,
        },
        data: {} as Record<StorageKey, any[]>,
      };

      // Collect data from all backup types
      for (const key of BACKUP_SETTINGS.backupTypes) {
        const items = await this.getItems(key);
        backupData.data[key] = items;
        backupData.metadata.itemCounts[key] = items.length;
      }

      // Convert to string for checksum calculation
      const dataString = JSON.stringify(backupData);
      backupData.metadata.checksum = await this.calculateChecksum(dataString);
      backupData.metadata.size = dataString.length;

      // Compress if enabled
      let finalData = dataString;
      if (BACKUP_SETTINGS.backupCompression) {
        finalData = await deflate(dataString);
      }

      // Encrypt if enabled
      if (BACKUP_SETTINGS.backupEncryption) {
        finalData = await SecurityService.secureData('backup', finalData);
      }

      // Store backup
      await AsyncStorage.setItem(`backup_${backupId}`, finalData);

      // Update backup list
      const backupList = await this.getBackupList();
      backupList.push(backupData.metadata);
      await AsyncStorage.setItem('backup_list', JSON.stringify(backupList));

      // Cleanup old backups
      await this.cleanupOldBackups();

      return backupData.metadata;
    } catch (error) {
      ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.ERROR,
        { method: 'createBackup' }
      );
      throw error;
    }
  }

  private static async getBackupList(): Promise<BackupMetadata[]> {
    try {
      const listJson = await AsyncStorage.getItem('backup_list');
      return listJson ? JSON.parse(listJson) : [];
    } catch (error) {
      ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.WARNING,
        { method: 'getBackupList' }
      );
      return [];
    }
  }

  private static async cleanupOldBackups(): Promise<void> {
    try {
      const backupList = await this.getBackupList();
      if (backupList.length <= BACKUP_SETTINGS.maxBackups) {
        return;
      }

      // Sort by timestamp descending
      backupList.sort((a, b) => b.timestamp - a.timestamp);

      // Remove excess backups
      const backupsToRemove = backupList.slice(BACKUP_SETTINGS.maxBackups);
      for (const backup of backupsToRemove) {
        await AsyncStorage.removeItem(`backup_${backup.id}`);
      }

      // Update backup list
      await AsyncStorage.setItem(
        'backup_list',
        JSON.stringify(backupList.slice(0, BACKUP_SETTINGS.maxBackups))
      );
    } catch (error) {
      ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.WARNING,
        { method: 'cleanupOldBackups' }
      );
    }
  }

  static async restoreFromBackup(backupId: string): Promise<boolean> {
    try {
      // Get backup data
      const backupData = await AsyncStorage.getItem(`backup_${backupId}`);
      if (!backupData) {
        throw new Error('Backup not found');
      }

      // Decrypt if encrypted
      let decryptedData = backupData;
      if (BACKUP_SETTINGS.backupEncryption) {
        decryptedData = await SecurityService.retrieveData('backup', backupData);
      }

      // Decompress if compressed
      let decompressedData = decryptedData;
      if (BACKUP_SETTINGS.backupCompression) {
        decompressedData = await inflate(decryptedData);
      }

      // Parse backup data
      const backup: BackupData = JSON.parse(decompressedData);

      // Verify checksum
      const checksum = await this.calculateChecksum(JSON.stringify(backup));
      if (checksum !== backup.metadata.checksum) {
        throw new Error('Backup data integrity check failed');
      }

      // Create a temporary backup of current data
      await this.createBackup();

      // Restore data
      for (const [key, items] of Object.entries(backup.data)) {
        await this.setItem(key as StorageKey, items);
      }

      // Update schema version
      await this.setSchemaVersion(backup.metadata.version);

      return true;
    } catch (error) {
      ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.ERROR,
        { method: 'restoreFromBackup', backupId }
      );
      throw error;
    }
  }

  static async getBackupInfo(backupId: string): Promise<BackupMetadata | null> {
    try {
      const backupList = await this.getBackupList();
      return backupList.find(backup => backup.id === backupId) || null;
    } catch (error) {
      ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.WARNING,
        { method: 'getBackupInfo', backupId }
      );
      return null;
    }
  }

  static async listBackups(): Promise<BackupMetadata[]> {
    try {
      return await this.getBackupList();
    } catch (error) {
      ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.WARNING,
        { method: 'listBackups' }
      );
      return [];
    }
  }

  static async deleteBackup(backupId: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(`backup_${backupId}`);
      
      const backupList = await this.getBackupList();
      const updatedList = backupList.filter(backup => backup.id !== backupId);
      await AsyncStorage.setItem('backup_list', JSON.stringify(updatedList));
      
      return true;
    } catch (error) {
      ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.WARNING,
        { method: 'deleteBackup', backupId }
      );
      return false;
    }
  }
}