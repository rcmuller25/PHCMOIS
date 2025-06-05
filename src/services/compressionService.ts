// services/compressionService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import { gzip, ungzip } from 'pako';
import { StorageService, type StorageKey } from './storageService';
import { ErrorHandlingService, ErrorType, ErrorSeverity } from './errorHandlingService';

// Compression options
export interface CompressionOptions {
  threshold: number; // Size in bytes above which to compress
  level: number; // Compression level (1-9, where 9 is maximum compression)
}

// Default options
const DEFAULT_OPTIONS: CompressionOptions = {
  threshold: 1024, // 1KB
  level: 6, // Medium compression
};

// Compressed data format
interface CompressedData {
  compressed: boolean;
  data: string; // Base64 encoded compressed data or JSON string
}

export class CompressionService {
  private static readonly COMPRESSION_ENABLED_KEY = '@phmos/compression_enabled';
  private static readonly COMPRESSION_OPTIONS_KEY = '@phmos/compression_options';
  
  /**
   * Check if compression is enabled
   */
  static async isCompressionEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(this.COMPRESSION_ENABLED_KEY);
      return value === 'true';
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.WARNING,
        { method: 'isCompressionEnabled' }
      );
      return false;
    }
  }
  
  /**
   * Enable or disable compression
   */
  static async setCompressionEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(this.COMPRESSION_ENABLED_KEY, enabled.toString());
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.WARNING,
        { method: 'setCompressionEnabled', enabled }
      );
    }
  }
  
  /**
   * Get compression options
   */
  static async getCompressionOptions(): Promise<CompressionOptions> {
    try {
      const value = await AsyncStorage.getItem(this.COMPRESSION_OPTIONS_KEY);
      return value ? JSON.parse(value) : DEFAULT_OPTIONS;
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.WARNING,
        { method: 'getCompressionOptions' }
      );
      return DEFAULT_OPTIONS;
    }
  }
  
  /**
   * Set compression options
   */
  static async setCompressionOptions(options: Partial<CompressionOptions>): Promise<void> {
    try {
      const currentOptions = await this.getCompressionOptions();
      const newOptions = { ...currentOptions, ...options };
      await AsyncStorage.setItem(this.COMPRESSION_OPTIONS_KEY, JSON.stringify(newOptions));
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.WARNING,
        { method: 'setCompressionOptions', options }
      );
    }
  }
  
  /**
   * Compress data if it exceeds the threshold
   */
  static async compressData<T>(data: T): Promise<string> {
    const isEnabled = await this.isCompressionEnabled();
    if (!isEnabled) {
      // If compression is disabled, just stringify the data
      return JSON.stringify(data);
    }
    
    try {
      const jsonString = JSON.stringify(data);
      const options = await this.getCompressionOptions();
      
      // Only compress if the data exceeds the threshold
      if (jsonString.length < options.threshold) {
        const result: CompressedData = {
          compressed: false,
          data: jsonString,
        };
        return JSON.stringify(result);
      }
      
      // Compress the data
      const compressed = gzip(jsonString, { level: options.level });
      const base64 = Buffer.from(compressed).toString('base64');
      
      const result: CompressedData = {
        compressed: true,
        data: base64,
      };
      
      return JSON.stringify(result);
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.UNKNOWN,
        ErrorSeverity.WARNING,
        { method: 'compressData' }
      );
      // Fall back to uncompressed data
      return JSON.stringify({ compressed: false, data: JSON.stringify(data) });
    }
  }
  
  /**
   * Decompress data if it was compressed
   */
  static async decompressData<T>(compressedString: string): Promise<T> {
    try {
      const compressedData: CompressedData = JSON.parse(compressedString);
      
      if (!compressedData.compressed) {
        // Data wasn't compressed, just parse it
        return JSON.parse(compressedData.data);
      }
      
      // Decompress the data
      const compressed = Buffer.from(compressedData.data, 'base64');
      const decompressed = ungzip(compressed);
      const jsonString = Buffer.from(decompressed).toString();
      
      return JSON.parse(jsonString);
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.UNKNOWN,
        ErrorSeverity.ERROR,
        { method: 'decompressData' }
      );
      // If decompression fails, try to parse the original string
      // This is a fallback that might work if the data wasn't actually compressed
      try {
        return JSON.parse(compressedString);
      } catch {
        throw new Error('Failed to decompress or parse data');
      }
    }
  }
  
  /**
   * Compress all data in storage
   */
  static async compressAllData(): Promise<{ success: boolean; compressed: number; skipped: number; failed: number }> {
    const result = {
      success: true,
      compressed: 0,
      skipped: 0,
      failed: 0,
    };
    
    // Get all storage keys
    const storageKeys = Object.keys(StorageService.STORAGE_KEYS) as StorageKey[];
    
    for (const key of storageKeys) {
      try {
        // Get the data
        const data = await StorageService.getItem(key);
        
        if (!data) {
          result.skipped++;
          continue;
        }
        
        // Compress the data
        const compressed = await this.compressData(data);
        
        // Store the compressed data
        const success = await AsyncStorage.setItem(StorageService.getKey(key), compressed);
        
        if (success) {
          result.compressed++;
        } else {
          result.failed++;
          result.success = false;
        }
      } catch (error) {
        result.failed++;
        result.success = false;
        await ErrorHandlingService.handleError(
          error as Error,
          ErrorType.STORAGE,
          ErrorSeverity.ERROR,
          { method: 'compressAllData', key }
        );
      }
    }
    
    return result;
  }
}

// Extend StorageService with compression capabilities
export class CompressedStorageService extends StorageService {
  static async getItem<T>(key: StorageKey): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(this.getKey(key));
      
      if (!jsonValue) {
        return null;
      }
      
      // Try to decompress the data
      return await CompressionService.decompressData<T>(jsonValue);
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.ERROR,
        { method: 'getItem', key }
      );
      
      // Fall back to regular storage service
      return super.getItem<T>(key);
    }
  }
  
  static async setItem<T>(key: StorageKey, value: T): Promise<boolean> {
    try {
      // Compress the data
      const compressed = await CompressionService.compressData(value);
      
      // Store the compressed data
      await AsyncStorage.setItem(this.getKey(key), compressed);
      return true;
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.ERROR,
        { method: 'setItem', key }
      );
      
      // Fall back to regular storage service
      return super.setItem(key, value);
    }
  }
}