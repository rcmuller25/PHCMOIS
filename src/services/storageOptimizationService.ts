// services/storageOptimizationService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService, type StorageKey, type OfflineItem } from './storageService';
import { CompressionService } from './compressionService';
import { ErrorHandlingService, ErrorType, ErrorSeverity } from './errorHandlingService';

// Archive settings interface
export interface ArchiveSettings {
  enabled: boolean;
  olderThanDays: number;
  includeTypes: StorageKey[];
  maxArchivedItems: number;
}

// Default archive settings
const DEFAULT_ARCHIVE_SETTINGS: ArchiveSettings = {
  enabled: false,
  olderThanDays: 90, // Archive items older than 90 days
  includeTypes: ['APPOINTMENTS', 'MEDICAL_RECORDS'],
  maxArchivedItems: 1000,
};

export class StorageOptimizationService {
  private static readonly ARCHIVE_SETTINGS_KEY = '@phmos/archive_settings';
  private static readonly ARCHIVED_DATA_KEY = '@phmos/archived_data';
  private static readonly STORAGE_STATS_KEY = '@phmos/storage_stats';
  
  /**
   * Get archive settings
   */
  static async getArchiveSettings(): Promise<ArchiveSettings> {
    try {
      const settingsJson = await AsyncStorage.getItem(this.ARCHIVE_SETTINGS_KEY);
      return settingsJson ? JSON.parse(settingsJson) : DEFAULT_ARCHIVE_SETTINGS;
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.WARNING,
        { method: 'getArchiveSettings' }
      );
      return DEFAULT_ARCHIVE_SETTINGS;
    }
  }
  
  /**
   * Update archive settings
   */
  static async updateArchiveSettings(settings: Partial<ArchiveSettings>): Promise<boolean> {
    try {
      const currentSettings = await this.getArchiveSettings();
      const newSettings = { ...currentSettings, ...settings };
      await AsyncStorage.setItem(this.ARCHIVE_SETTINGS_KEY, JSON.stringify(newSettings));
      return true;
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.WARNING,
        { method: 'updateArchiveSettings', settings }
      );
      return false;
    }
  }
  
  /**
   * Run the archiving process
   */
  static async runArchiving(): Promise<{ success: boolean; archived: number }> {
    const result = { success: true, archived: 0 };
    
    try {
      const settings = await this.getArchiveSettings();
      
      if (!settings.enabled) {
        return result;
      }
      
      // Calculate the cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - settings.olderThanDays);
      const cutoffTimestamp = cutoffDate.toISOString();
      
      // Process each included storage type
      for (const key of settings.includeTypes) {
        const items = await StorageService.getItems<OfflineItem>(key);
        
        // Find items to archive (older than cutoff date and already synced)
        const itemsToArchive = items.filter(item => {
          // Only archive items that are synced and not already deleted
          if (!item._synced || item._deleted) {
            return false;
          }
          
          // Check if the item is older than the cutoff date
          // Use updatedAt if available, otherwise createdAt
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
          
          await StorageService.setItem(key, remainingItems);
          
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
        { method: 'runArchiving' }
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
      const archivedDataJson = await AsyncStorage.getItem(this.ARCHIVED_DATA_KEY);
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
      
      // Get archive settings
      const settings = await this.getArchiveSettings();
      
      // Limit the number of archived items if needed
      if (archivedData[key].length > settings.maxArchivedItems) {
        archivedData[key] = archivedData[key].slice(-settings.maxArchivedItems);
      }
      
      // Compress and save archived data
      const compressedData = await CompressionService.compressData(archivedData);
      await AsyncStorage.setItem(this.ARCHIVED_DATA_KEY, compressedData);
      
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
      const archivedDataJson = await AsyncStorage.getItem(this.ARCHIVED_DATA_KEY);
      
      if (!archivedDataJson) {
        return [];
      }
      
      const archivedData = await CompressionService.decompressData<Record<string, T[]>>(archivedDataJson);
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
      await StorageService.addItem(key, restoredItem);
      
      // Remove from archived items
      const updatedArchivedItems = archivedItems.filter(item => item.id !== id);
      
      // Get all archived data
      const archivedDataJson = await AsyncStorage.getItem(this.ARCHIVED_DATA_KEY);
      const archivedData = await CompressionService.decompressData<Record<string, T[]>>(archivedDataJson || '{}');
      
      // Update archived data
      archivedData[key] = updatedArchivedItems as any;
      
      // Save updated archived data
      const compressedData = await CompressionService.compressData(archivedData);
      await AsyncStorage.setItem(this.ARCHIVED_DATA_KEY, compressedData);
      
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
      for (const key of Object.keys(StorageService.STORAGE_KEYS)) {
        const items = await StorageService.getItems(key as StorageKey);
        stats.storageUsage[key] = {
          count: items.length,
          activeCount: items.filter(item => !item._deleted).length,
          deletedCount: items.filter(item => item._deleted).length,
          syncedCount: items.filter(item => item._synced).length,
          unsyncedCount: items.filter(item => !item._synced).length,
        };
      }
      
      // Get archived items count
      const archivedDataJson = await AsyncStorage.getItem(this.ARCHIVED_DATA_KEY);
      if (archivedDataJson) {
        const archivedData = await CompressionService.decompressData<Record<string, OfflineItem[]>>(archivedDataJson);
        
        for (const [key, items] of Object.entries(archivedData)) {
          stats.archivedItems[key] = items.length;
        }
      }
      
      // Save stats
      await AsyncStorage.setItem(this.STORAGE_STATS_KEY, JSON.stringify(stats));
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
      const statsJson = await AsyncStorage.getItem(this.STORAGE_STATS_KEY);
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
}