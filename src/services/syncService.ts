// services/syncService.ts
import { StorageService, type StorageKey, type OfflineItem, STORAGE_KEYS } from './storageService';
import { networkService } from './networkService';
import { useSettingsStore } from '../../stores/settingsStore';
import { ErrorHandlingService, ErrorType, ErrorSeverity } from './errorHandlingService';

// Define the sync queue item interface
export interface SyncQueueItem {
  id: string;
  storageKey: StorageKey;
  operation: 'create' | 'update' | 'delete';
  data: OfflineItem;
  retryCount: number;
  createdAt: string;
  lastAttempt?: string;
  conflictResolution?: 'client' | 'server' | 'manual';
}

// Constants
const SYNC_QUEUE_KEY = '@phmos/sync_queue';
const LAST_SYNC_TIME_KEY = '@phmos/last_sync_time';
const MAX_RETRY_COUNT = 5;
const RETRY_DELAY_MS = 1000; // Base delay for retries
const MAX_RETRY_DELAY_MS = 30000; // Maximum delay between retries

// Add new interfaces for sync state tracking
interface SyncState {
  isSyncing: boolean;
  lastSyncTime: string | null;
  lastError: string | null;
  pendingItems: number;
  failedItems: number;
  currentOperation: string | null;
}

interface SyncResult {
  success: boolean;
  partialSuccess: boolean;
  syncedItems: number;
  failedItems: number;
  conflicts: number;
  errors: Array<{
    itemId: string;
    error: string;
    retryable: boolean;
  }>;
}

// Add new constants for sync configuration
const SYNC_CONFIG = {
  MAX_CONCURRENT_OPERATIONS: 3,
  BATCH_SIZE: 10,
  CONFLICT_RESOLUTION_TIMEOUT: 30000, // 30 seconds
  PARTIAL_SYNC_THRESHOLD: 0.7, // 70% success rate required for partial success
} as const;

class SyncService {
  private static instance: SyncService;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private isSyncing: boolean = false;
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private syncState: SyncState = {
    isSyncing: false,
    lastSyncTime: null,
    lastError: null,
    pendingItems: 0,
    failedItems: 0,
    currentOperation: null,
  };

  private constructor() {}

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  async startAutoSync() {
    const { syncFrequency } = useSettingsStore.getState();
    const interval = this.getSyncInterval(syncFrequency);
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      await this.syncData();
    }, interval);
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async syncData(): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        partialSuccess: false,
        syncedItems: 0,
        failedItems: 0,
        conflicts: 0,
        errors: [{
          itemId: 'sync_in_progress',
          error: 'Sync already in progress',
          retryable: true,
        }],
      };
    }

    this.isSyncing = true;
    this.updateSyncState({ isSyncing: true, currentOperation: 'sync_start' });

    try {
      const isConnected = await networkService.isConnected();
      if (!isConnected) {
        const error = new Error('No network connection available');
        await ErrorHandlingService.handleError(
          error,
          ErrorType.NETWORK,
          ErrorSeverity.WARNING,
          { method: 'syncData' },
          true
        );
        this.updateSyncState({
          isSyncing: false,
          lastError: error.message,
          currentOperation: null,
        });
        return {
          success: false,
          partialSuccess: false,
          syncedItems: 0,
          failedItems: 0,
          conflicts: 0,
          errors: [{
            itemId: 'network_error',
            error: error.message,
            retryable: true,
          }],
        };
      }

      const pendingChanges = await this.getPendingChanges();
      if (pendingChanges.length === 0) {
        await this.updateLastSyncTime();
        this.updateSyncState({
          isSyncing: false,
          lastSyncTime: new Date().toISOString(),
          currentOperation: null,
        });
        return {
          success: true,
          partialSuccess: true,
          syncedItems: 0,
          failedItems: 0,
          conflicts: 0,
          errors: [],
        };
      }

      this.updateSyncState({ pendingItems: pendingChanges.length });
      const result = await this.processPendingChanges(pendingChanges);
      
      if (result.success || result.partialSuccess) {
        await this.updateLastSyncTime();
      }

      this.updateSyncState({
        isSyncing: false,
        lastSyncTime: new Date().toISOString(),
        lastError: result.errors.length > 0 ? result.errors[0].error : null,
        pendingItems: 0,
        failedItems: result.failedItems,
        currentOperation: null,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.SYNC,
        ErrorSeverity.ERROR,
        { method: 'syncData' },
        true
      );
      this.updateSyncState({
        isSyncing: false,
        lastError: errorMessage,
        currentOperation: null,
      });
      return {
        success: false,
        partialSuccess: false,
        syncedItems: 0,
        failedItems: 0,
        conflicts: 0,
        errors: [{
          itemId: 'sync_error',
          error: errorMessage,
          retryable: true,
        }],
      };
    }
  }

  async addToSyncQueue<T extends OfflineItem>(item: {
    storageKey: StorageKey;
    operation: 'create' | 'update' | 'delete';
    data: T;
  }): Promise<boolean> {
    try {
      const queue = await this.getPendingChanges();
      
      // Check if there's already an item for this ID
      const existingIndex = queue.findIndex(
        queueItem => queueItem.data.id === item.data.id && queueItem.storageKey === item.storageKey
      );
      
      const queueItem: SyncQueueItem = {
        id: Date.now().toString(),
        storageKey: item.storageKey,
        operation: item.operation,
        data: item.data,
        retryCount: 0,
        createdAt: new Date().toISOString(),
      };
      
      if (existingIndex >= 0) {
        // Replace the existing item
        queue[existingIndex] = queueItem;
      } else {
        // Add new item
        queue.push(queueItem);
      }
      
      // Save the updated queue
      await StorageService.setItem('SYNC_QUEUE', queue);
      return true;
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.SYNC,
        ErrorSeverity.ERROR,
        { method: 'addToSyncQueue', item },
        false
      );
      return false;
    }
  }

  private async getPendingChanges(): Promise<SyncQueueItem[]> {
    try {
      const queue = await StorageService.getItem<SyncQueueItem[]>('SYNC_QUEUE');
      return queue || [];
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.SYNC,
        ErrorSeverity.ERROR,
        { method: 'getPendingChanges' },
        false
      );
      return [];
    }
  }

  private async processPendingChanges(changes: SyncQueueItem[]): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      partialSuccess: false,
      syncedItems: 0,
      failedItems: 0,
      conflicts: 0,
      errors: [],
    };

    // Process changes in batches
    for (let i = 0; i < changes.length; i += SYNC_CONFIG.BATCH_SIZE) {
      const batch = changes.slice(i, i + SYNC_CONFIG.BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(item => this.processItem(item))
      );

      // Aggregate batch results
      batchResults.forEach(itemResult => {
        if (itemResult.success) {
          result.syncedItems++;
        } else {
          result.failedItems++;
          if (itemResult.error) {
            result.errors.push(itemResult.error);
          }
        }
        if (itemResult.conflict) {
          result.conflicts++;
        }
      });
    }

    // Determine overall success
    const successRate = result.syncedItems / changes.length;
    result.success = successRate === 1;
    result.partialSuccess = successRate >= SYNC_CONFIG.PARTIAL_SYNC_THRESHOLD;

    return result;
  }

  private async processItem(item: SyncQueueItem): Promise<{
    success: boolean;
    conflict?: boolean;
    error?: { itemId: string; error: string; retryable: boolean };
  }> {
    try {
      if (item.retryCount >= MAX_RETRY_COUNT) {
        return {
          success: false,
          error: {
            itemId: item.id,
            error: `Sync item ${item.id} exceeded max retry count`,
            retryable: false,
          },
        };
      }

      const updatedItem = {
        ...item,
        lastAttempt: new Date().toISOString(),
        retryCount: item.retryCount + 1,
      };

      const apiResult = await this.makeApiCall(updatedItem);

      if (!apiResult.success) {
        if (apiResult.retryable && updatedItem.retryCount < MAX_RETRY_COUNT) {
          const delay = Math.min(
            RETRY_DELAY_MS * Math.pow(2, updatedItem.retryCount),
            MAX_RETRY_DELAY_MS
          );

          const timeout = setTimeout(() => {
            this.retryTimeouts.delete(updatedItem.id);
            this.processItem(updatedItem);
          }, delay) as unknown as NodeJS.Timeout;

          this.retryTimeouts.set(updatedItem.id, timeout);
        }

        return {
          success: false,
          error: {
            itemId: item.id,
            error: 'API call failed',
            retryable: apiResult.retryable,
          },
        };
      }

      if (apiResult.conflict && apiResult.serverData) {
        const resolved = await this.handleConflict(updatedItem, apiResult.serverData);
        if (!resolved) {
          return {
            success: false,
            conflict: true,
            error: {
              itemId: item.id,
              error: 'Conflict resolution failed',
              retryable: true,
            },
          };
        }
      }

      if (apiResult.serverData) {
        await this.updateLocalData(updatedItem.storageKey, apiResult.serverData);
      }

      return { success: true, conflict: apiResult.conflict };
    } catch (error) {
      return {
        success: false,
        error: {
          itemId: item.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
        },
      };
    }
  }

  private async handleConflict(
    localItem: SyncQueueItem,
    serverData: OfflineItem
  ): Promise<boolean> {
    try {
      const resolution = localItem.conflictResolution || 'server';
      
      switch (resolution) {
        case 'client':
          // Keep local changes
          return true;
        
        case 'server':
          // Accept server changes
          await this.updateLocalData(localItem.storageKey, serverData);
          return true;
        
        case 'manual':
          // This would typically trigger a UI prompt for user resolution
          // For now, we'll default to server resolution
          await this.updateLocalData(localItem.storageKey, serverData);
          return true;
        
        default:
          return false;
      }
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.SYNC,
        ErrorSeverity.ERROR,
        { method: 'handleConflict', localItem, serverData },
        false
      );
      return false;
    }
  }

  private async makeApiCall(item: SyncQueueItem): Promise<{ 
    success: boolean; 
    retryable: boolean;
    conflict?: boolean;
    serverData?: OfflineItem;
  }> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate random success/failure
      const success = Math.random() > 0.2; // 80% success rate
      
      if (success) {
        // Simulate server response
        const serverData: OfflineItem = {
          ...item.data,
          _synced: true,
          serverId: `server_${item.data.id}`,
          serverUpdatedAt: new Date().toISOString(),
        };
        
        // Simulate conflict (20% chance)
        const conflict = Math.random() < 0.2;
        
        return { 
          success: true, 
          retryable: false, 
          conflict,
          serverData 
        };
      } else {
        // Simulate error
        const retryable = Math.random() > 0.5; // 50% retryable errors
        return { success: false, retryable };
      }
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.SYNC,
        ErrorSeverity.ERROR,
        { method: 'makeApiCall', item },
        true
      );
      return { success: false, retryable: true };
    }
  }

  private async updateLocalData(key: StorageKey, serverData: OfflineItem): Promise<boolean> {
    try {
      const items = await StorageService.getItems<OfflineItem>(key);
      const index = items.findIndex(item => item.id === serverData.id);
      
      if (index >= 0) {
        // Update existing item
        items[index] = {
          ...items[index],
          ...serverData,
          _synced: true,
        };
      } else {
        // Add new item
        items.push({
          ...serverData,
          _synced: true,
        });
      }
      
      return await StorageService.setItem(key, items);
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.ERROR,
        { method: 'updateLocalData', key, serverData },
        false
      );
      return false;
    }
  }

  private async updateLastSyncTime(): Promise<void> {
    try {
      const now = new Date().toISOString();
      await StorageService.setItem('LAST_SYNC_TIME', now);
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.WARNING,
        { method: 'updateLastSyncTime' },
        false
      );
    }
  }

  async getLastSyncTime(): Promise<string | null> {
    try {
      return await StorageService.getItem('LAST_SYNC_TIME');
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.WARNING,
        { method: 'getLastSyncTime' },
        false
      );
      return null;
    }
  }

  private getSyncInterval(frequency: string): number {
    switch (frequency) {
      case '15min': return 15 * 60 * 1000;
      case '30min': return 30 * 60 * 1000;
      case '1hour': return 60 * 60 * 1000;
      case '6hours': return 6 * 60 * 60 * 1000;
      case '12hours': return 12 * 60 * 60 * 1000;
      case '24hours': return 24 * 60 * 60 * 1000;
      default: return 30 * 60 * 1000; // Default to 30 minutes
    }
  }

  private updateSyncState(updates: Partial<SyncState>): void {
    this.syncState = { ...this.syncState, ...updates };
    // You could emit an event here to notify subscribers of sync state changes
  }

  getSyncState(): SyncState {
    return { ...this.syncState };
  }
}

export const syncService = SyncService.getInstance();