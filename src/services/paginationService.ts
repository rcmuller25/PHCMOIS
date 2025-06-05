// services/paginationService.ts
import { StorageService, type StorageKey, type OfflineItem } from './storageService';

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  filter?: Record<string, any>;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class PaginationService {
  /**
   * Get paginated data from storage
   */
  static async getPaginatedData<T extends OfflineItem>(
    key: StorageKey,
    options: PaginationOptions
  ): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 20, sortBy, sortDirection = 'asc', filter } = options;
    
    // Get all items from storage
    let items = await StorageService.getItems<T>(key);
    
    // Apply filters if provided
    if (filter) {
      items = this.applyFilters(items, filter);
    }
    
    // Apply sorting if provided
    if (sortBy) {
      items = this.sortItems(items, sortBy, sortDirection);
    }
    
    // Calculate pagination values
    const total = items.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    // Get the current page data
    const data = items.slice(startIndex, endIndex);
    
    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
  
  /**
   * Apply filters to the data
   */
  private static applyFilters<T extends OfflineItem>(
    items: T[],
    filter: Record<string, any>
  ): T[] {
    return items.filter(item => {
      // Skip deleted items by default unless explicitly requested
      if (item._deleted && !filter.includeDeleted) {
        return false;
      }
      
      // Check each filter condition
      return Object.entries(filter).every(([key, value]) => {
        // Special case for includeDeleted
        if (key === 'includeDeleted') return true;
        
        // Handle search across multiple fields
        if (key === 'search' && typeof value === 'string') {
          const searchValue = value.toLowerCase();
          // Search in all string fields
          return Object.entries(item).some(([fieldKey, fieldValue]) => {
            if (typeof fieldValue === 'string') {
              return fieldValue.toLowerCase().includes(searchValue);
            }
            return false;
          });
        }
        
        // Handle date range filters
        if (key.endsWith('_from') && value) {
          const fieldKey = key.replace('_from', '');
          const itemDate = new Date(item[fieldKey]);
          const fromDate = new Date(value);
          return itemDate >= fromDate;
        }
        
        if (key.endsWith('_to') && value) {
          const fieldKey = key.replace('_to', '');
          const itemDate = new Date(item[fieldKey]);
          const toDate = new Date(value);
          return itemDate <= toDate;
        }
        
        // Handle exact match
        if (item[key] !== undefined) {
          if (typeof value === 'string' && typeof item[key] === 'string') {
            return item[key].toLowerCase().includes(value.toLowerCase());
          }
          return item[key] === value;
        }
        
        return false;
      });
    });
  }
  
  /**
   * Sort items by the specified field and direction
   */
  private static sortItems<T extends OfflineItem>(
    items: T[],
    sortBy: string,
    sortDirection: 'asc' | 'desc'
  ): T[] {
    return [...items].sort((a, b) => {
      let valueA = a[sortBy];
      let valueB = b[sortBy];
      
      // Handle date sorting
      if (sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'date' || sortBy === 'dateOfBirth') {
        valueA = valueA ? new Date(valueA).getTime() : 0;
        valueB = valueB ? new Date(valueB).getTime() : 0;
      }
      
      // Handle string sorting
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc' 
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      
      // Handle number sorting
      if (sortDirection === 'asc') {
        return (valueA || 0) - (valueB || 0);
      } else {
        return (valueB || 0) - (valueA || 0);
      }
    });
  }
}