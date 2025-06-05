// __tests__/services/offlineFirstService.test.ts
import { offlineFirstService } from '../../src/services/offlineFirstService';
import { StorageService } from '../../src/services/storageService';
import { syncService } from '../../src/services/syncService';

// Mock dependencies
jest.mock('../../src/services/storageService');
jest.mock('../../src/services/syncService');

describe('OfflineFirstService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an item locally and add it to the sync queue', async () => {
      // Arrange
      const mockItem = { id: '123', name: 'Test Item' };
      const mockStorageKey = 'PATIENTS';
      
      // Mock StorageService.addItem to return true
      (StorageService.addItem as jest.Mock).mockResolvedValue(true);
      
      // Mock syncService.addToSyncQueue to return true
      (syncService.addToSyncQueue as jest.Mock).mockResolvedValue(true);
      
      // Act
      const result = await offlineFirstService.create(mockStorageKey, mockItem);
      
      // Assert
      expect(StorageService.addItem).toHaveBeenCalledWith(mockStorageKey, expect.objectContaining({
        id: '123',
        name: 'Test Item',
        _synced: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }));
      
      expect(syncService.addToSyncQueue).toHaveBeenCalledWith({
        storageKey: mockStorageKey,
        operation: 'create',
        data: expect.objectContaining({
          id: '123',
          name: 'Test Item',
          _synced: false,
        }),
      });
      
      expect(result).toEqual(expect.objectContaining({
        id: '123',
        name: 'Test Item',
        _synced: false,
      }));
    });
  });

  describe('update', () => {
    it('should update an item locally and add it to the sync queue', async () => {
      // Arrange
      const mockItem = { id: '123', name: 'Test Item', updatedAt: '2023-01-01T00:00:00.000Z' };
      const mockUpdates = { name: 'Updated Item' };
      const mockStorageKey = 'PATIENTS';
      
      // Mock StorageService.getItems to return the mock item
      (StorageService.getItems as jest.Mock).mockResolvedValue([mockItem]);
      
      // Mock StorageService.updateItem to return true
      (StorageService.updateItem as jest.Mock).mockResolvedValue(true);
      
      // Mock syncService.addToSyncQueue to return true
      (syncService.addToSyncQueue as jest.Mock).mockResolvedValue(true);
      
      // Act
      const result = await offlineFirstService.update(mockStorageKey, '123', mockUpdates);
      
      // Assert
      expect(StorageService.updateItem).toHaveBeenCalledWith(
        mockStorageKey,
        '123',
        expect.objectContaining({
          id: '123',
          name: 'Updated Item',
          _synced: false,
          updatedAt: expect.any(String),
        })
      );
      
      expect(syncService.addToSyncQueue).toHaveBeenCalledWith({
        storageKey: mockStorageKey,
        operation: 'update',
        data: expect.objectContaining({
          id: '123',
          name: 'Updated Item',
          _synced: false,
        }),
      });
      
      expect(result).toEqual(expect.objectContaining({
        id: '123',
        name: 'Updated Item',
        _synced: false,
      }));
    });

    it('should return null if the item does not exist', async () => {
      // Arrange
      const mockUpdates = { name: 'Updated Item' };
      const mockStorageKey = 'PATIENTS';
      
      // Mock StorageService.getItems to return an empty array
      (StorageService.getItems as jest.Mock).mockResolvedValue([]);
      
      // Act
      const result = await offlineFirstService.update(mockStorageKey, '123', mockUpdates);
      
      // Assert
      expect(result).toBeNull();
      expect(StorageService.updateItem).not.toHaveBeenCalled();
      expect(syncService.addToSyncQueue).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should soft delete an item and add it to the sync queue', async () => {
      // Arrange
      const mockItem = { id: '123', name: 'Test Item' };
      const mockStorageKey = 'PATIENTS';
      
      // Mock StorageService.getItems to return the mock item
      (StorageService.getItems as jest.Mock).mockResolvedValue([mockItem]);
      
      // Mock StorageService.updateItem to return true
      (StorageService.updateItem as jest.Mock).mockResolvedValue(true);
      
      // Mock syncService.addToSyncQueue to return true
      (syncService.addToSyncQueue as jest.Mock).mockResolvedValue(true);
      
      // Act
      const result = await offlineFirstService.delete(mockStorageKey, '123');
      
      // Assert
      expect(StorageService.updateItem).toHaveBeenCalledWith(
        mockStorageKey,
        '123',
        expect.objectContaining({
          _deleted: true,
          deletedAt: expect.any(String),
          _synced: false,
        })
      );
      
      expect(syncService.addToSyncQueue).toHaveBeenCalledWith({
        storageKey: mockStorageKey,
        operation: 'delete',
        data: expect.objectContaining({
          id: '123',
          name: 'Test Item',
          _deleted: true,
          deletedAt: expect.any(String),
        }),
      });
      
      expect(result).toBe(true);
    });

    it('should hard delete an item when hardDelete is true', async () => {
      // Arrange
      const mockStorageKey = 'PATIENTS';
      
      // Mock StorageService.deleteItem to return true
      (StorageService.deleteItem as jest.Mock).mockResolvedValue(true);
      
      // Act
      const result = await offlineFirstService.delete(mockStorageKey, '123', true);
      
      // Assert
      expect(StorageService.deleteItem).toHaveBeenCalledWith(mockStorageKey, '123');
      expect(syncService.addToSyncQueue).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('resolveConflict', () => {
    it('should resolve a conflict by merging items and updating storage', async () => {
      // Arrange
      const mockLocalItem = { 
        id: '123', 
        name: 'Local Name', 
        age: 30,
        updatedAt: '2023-01-01T00:00:00.000Z' 
      };
      
      const mockServerItem = { 
        id: '123', 
        name: 'Server Name', 
        age: 30,
        address: '123 Main St',
        updatedAt: '2023-01-02T00:00:00.000Z',
        serverId: 'server_123' 
      };
      
      const mockStorageKey = 'PATIENTS';
      
      // Mock StorageService.updateItem to return true
      (StorageService.updateItem as jest.Mock).mockResolvedValue(true);
      
      // Act
      const result = await offlineFirstService.resolveConflict(mockStorageKey, mockLocalItem, mockServerItem);
      
      // Assert
      expect(StorageService.updateItem).toHaveBeenCalledWith(
        mockStorageKey,
        '123',
        expect.objectContaining({
          id: '123',
          name: 'Server Name',
          age: 30,
          address: '123 Main St',
          _synced: true,
          _conflictResolved: true,
          _conflictResolvedAt: expect.any(String),
          serverId: 'server_123',
        })
      );
      
      expect(result).toEqual(expect.objectContaining({
        id: '123',
        name: 'Server Name',
        age: 30,
        address: '123 Main St',
        _synced: true,
        _conflictResolved: true,
        _conflictResolvedAt: expect.any(String),
        serverId: 'server_123',
      }));
    });
  });

  describe('getOfflineChanges', () => {
    it('should return the number of pending changes in the sync queue', async () => {
      // Arrange
      const mockQueue = [
        { id: '1', storageKey: 'PATIENTS', operation: 'create', data: { id: '123' } },
        { id: '2', storageKey: 'APPOINTMENTS', operation: 'update', data: { id: '456' } },
      ];
      
      // Mock StorageService.getItem to return the mock queue
      (StorageService.getItem as jest.Mock).mockResolvedValue(mockQueue);
      
      // Act
      const result = await offlineFirstService.getOfflineChanges();
      
      // Assert
      expect(StorageService.getItem).toHaveBeenCalledWith('@phmos/sync_queue');
      expect(result).toBe(2);
    });

    it('should return 0 when there are no pending changes', async () => {
      // Arrange
      // Mock StorageService.getItem to return null
      (StorageService.getItem as jest.Mock).mockResolvedValue(null);
      
      // Act
      const result = await offlineFirstService.getOfflineChanges();
      
      // Assert
      expect(result).toBe(0);
    });
  });

  describe('syncAll', () => {
    it('should trigger sync when connected', async () => {
      // Arrange
      const mockNetworkService = require('../../src/services/networkService').networkService;
      mockNetworkService.isConnected = jest.fn().mockResolvedValue(true);
      
      // Mock syncService.syncData to return true
      (syncService.syncData as jest.Mock).mockResolvedValue(true);
      
      // Act
      const result = await offlineFirstService.syncAll();
      
      // Assert
      expect(mockNetworkService.isConnected).toHaveBeenCalled();
      expect(syncService.syncData).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should not trigger sync when offline', async () => {
      // Arrange
      const mockNetworkService = require('../../src/services/networkService').networkService;
      mockNetworkService.isConnected = jest.fn().mockResolvedValue(false);
      
      // Act
      const result = await offlineFirstService.syncAll();
      
      // Assert
      expect(mockNetworkService.isConnected).toHaveBeenCalled();
      expect(syncService.syncData).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
});