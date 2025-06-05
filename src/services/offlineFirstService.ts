// services/offlineFirstService.ts
import { StorageService, type StorageKey, STORAGE_KEYS, type OfflineItem } from './storageService';
import { syncService } from './syncService';
import { networkService } from './networkService';



export class OfflineFirstService {
  private static instance: OfflineFirstService;
  private pendingChanges: Array<() => Promise<void>> = [];

  private constructor() {}

  static getInstance(): OfflineFirstService {
    if (!OfflineFirstService.instance) {
      OfflineFirstService.instance = new OfflineFirstService();
    }
    return OfflineFirstService.instance;
  }

  async create<T extends OfflineItem>(key: StorageKey, item: T): Promise<T> {
    // Save locally first
    const newItem = {
      ...item,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _synced: false
    };

    await StorageService.addItem(key, newItem);
    
    // Queue for sync
    await syncService.addToSyncQueue({
      storageKey: key,
      operation: 'create',
      data: newItem
    });

    return newItem;
  }

  async update<T extends OfflineItem>(key: StorageKey, id: string, updates: Partial<T>): Promise<T | null> {
    // Get current item
    const items = await StorageService.getItems<T>(key);
    const item = items.find(item => item.id === id);
    
    if (!item) return null;

    // Apply updates
    const updatedItem = { 
      ...item,
      ...updates,
      updatedAt: new Date().toISOString(),
      _synced: false
    };

    // Save locally
    await StorageService.updateItem(key, id, updatedItem);

    // Queue for sync
    await syncService.addToSyncQueue({
      storageKey: key,
      operation: 'update',
      data: updatedItem
    });

    return updatedItem as T;
  }

  async delete(key: StorageKey, id: string, hardDelete = false): Promise<boolean> {
    if (hardDelete) {
      // Remove immediately without syncing
      return StorageService.deleteItem(key, id);
    }

    // Get the item first to include in sync queue
    const items = await StorageService.getItems(key);
    const item = items.find(item => item.id === id);
    
    if (!item) return false;

    // Mark as deleted locally (soft delete)
    const success = await StorageService.updateItem(key, id, {
      _deleted: true,
      deletedAt: new Date().toISOString(),
      _synced: false
    } as Partial<OfflineItem>);

    if (!success) return false;

    // Queue for sync
    await syncService.addToSyncQueue({
      storageKey: key,
      operation: 'delete',
      data: { ...item, _deleted: true, deletedAt: new Date().toISOString() }
    });

    return true;
  }

  async resolveConflict<T extends OfflineItem>(key: StorageKey, localItem: T, serverItem: T): Promise<T> {
    // Simple conflict resolution strategy: server wins by default
    // In a real app, you might want more sophisticated conflict resolution
    // or even involve the user in some cases
    
    const mergedItem = {
      ...localItem,
      ...serverItem,
      _synced: true,
      _conflictResolved: true,
      _conflictResolvedAt: new Date().toISOString()
    };
    
    await StorageService.updateItem(key, localItem.id, mergedItem);
    return mergedItem as T;
  }

  async getOfflineChanges(): Promise<number> {
    const queue = await StorageService.getItem('@phmos/sync_queue') || [];
    return queue.length;
  }

  async syncAll(): Promise<boolean> {
    const isConnected = await networkService.isConnected();
    if (!isConnected) return false;
    
    return syncService.syncData();
  }
}

export const offlineFirstService = OfflineFirstService.getInstance();