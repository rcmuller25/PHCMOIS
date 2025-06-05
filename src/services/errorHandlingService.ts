// services/errorHandlingService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { networkService } from './networkService';

// Error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  STORAGE = 'STORAGE',
  VALIDATION = 'VALIDATION',
  SYNC = 'SYNC',
  AUTH = 'AUTH',
  MIGRATION = 'MIGRATION',
  UNKNOWN = 'UNKNOWN',
}

// Error severity levels
export enum ErrorSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

// Error interface
export interface AppError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  details?: any;
  timestamp: string;
  handled: boolean;
  retryable: boolean;
}

export class ErrorHandlingService {
  private static readonly ERROR_LOG_KEY = '@phmos/error_log';
  private static readonly MAX_ERROR_LOG_SIZE = 100;
  
  /**
   * Log an error to storage and handle it appropriately
   */
  static async handleError(
    error: Error | string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    details?: any,
    retryable: boolean = false
  ): Promise<AppError> {
    // Create error object
    const appError: AppError = {
      id: Date.now().toString(),
      type,
      severity,
      message: typeof error === 'string' ? error : error.message,
      details: details || (error instanceof Error ? error.stack : undefined),
      timestamp: new Date().toISOString(),
      handled: false,
      retryable,
    };
    
    // Log error to console
    console.error(`[${appError.type}][${appError.severity}] ${appError.message}`, appError.details);
    
    // Store error in log
    await this.logError(appError);
    
    // Handle based on error type
    switch (type) {
      case ErrorType.NETWORK:
        // For network errors, we might want to retry later when online
        if (retryable) {
          this.scheduleRetry(appError);
        }
        break;
        
      case ErrorType.STORAGE:
        // For storage errors, we might want to try alternative storage
        if (severity === ErrorSeverity.CRITICAL) {
          // Attempt to use alternative storage or clear corrupted data
          await this.attemptStorageRecovery();
        }
        break;
        
      case ErrorType.SYNC:
        // For sync errors, we might want to retry with exponential backoff
        if (retryable) {
          this.scheduleRetry(appError, true);
        }
        break;
    }
    
    return appError;
  }
  
  /**
   * Log an error to storage
   */
  private static async logError(error: AppError): Promise<void> {
    try {
      // Get existing errors
      const existingErrorsJson = await AsyncStorage.getItem(this.ERROR_LOG_KEY);
      const existingErrors: AppError[] = existingErrorsJson ? JSON.parse(existingErrorsJson) : [];
      
      // Add new error
      existingErrors.unshift(error);
      
      // Limit log size
      const trimmedErrors = existingErrors.slice(0, this.MAX_ERROR_LOG_SIZE);
      
      // Save back to storage
      await AsyncStorage.setItem(this.ERROR_LOG_KEY, JSON.stringify(trimmedErrors));
    } catch (e) {
      // If we can't log the error, at least print it to console
      console.error('Failed to log error:', e);
    }
  }
  
  /**
   * Get all logged errors
   */
  static async getErrors(): Promise<AppError[]> {
    try {
      const errorsJson = await AsyncStorage.getItem(this.ERROR_LOG_KEY);
      return errorsJson ? JSON.parse(errorsJson) : [];
    } catch (e) {
      console.error('Failed to get errors:', e);
      return [];
    }
  }
  
  /**
   * Mark an error as handled
   */
  static async markErrorAsHandled(errorId: string): Promise<boolean> {
    try {
      const errors = await this.getErrors();
      const updatedErrors = errors.map(error => 
        error.id === errorId ? { ...error, handled: true } : error
      );
      
      await AsyncStorage.setItem(this.ERROR_LOG_KEY, JSON.stringify(updatedErrors));
      return true;
    } catch (e) {
      console.error('Failed to mark error as handled:', e);
      return false;
    }
  }
  
  /**
   * Clear all errors
   */
  static async clearErrors(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(this.ERROR_LOG_KEY);
      return true;
    } catch (e) {
      console.error('Failed to clear errors:', e);
      return false;
    }
  }
  
  /**
   * Schedule a retry for a retryable error
   */
  private static async scheduleRetry(error: AppError, useExponentialBackoff: boolean = false): Promise<void> {
    // Implementation would depend on your background task capabilities
    // For now, we'll just check if we're online and retry immediately if so
    const isConnected = await networkService.isConnected();
    if (isConnected) {
      // Retry immediately if online
      this.retryOperation(error);
    } else {
      // Otherwise, we'd schedule a retry when back online
      console.log(`Will retry operation for error ${error.id} when back online`);
      // This would typically use a background task or listener
    }
  }
  
  /**
   * Retry an operation that previously failed
   */
  private static async retryOperation(error: AppError): Promise<void> {
    // Implementation would depend on the specific operation that failed
    console.log(`Retrying operation for error ${error.id}`);
    
    // Mark as handled since we're retrying
    await this.markErrorAsHandled(error.id);
    
    // The actual retry logic would depend on the error details
    // For example, if it was a sync error, we might call syncService.syncData()
  }
  
  /**
   * Attempt to recover from storage errors
   */
  private static async attemptStorageRecovery(): Promise<void> {
    // Implementation would depend on your storage recovery strategy
    console.log('Attempting storage recovery');
    
    // For example, you might try to clear corrupted data
    // or switch to an alternative storage mechanism
  }
}