// services/performanceOptimizationService.ts
import { analyticsService } from './analyticsService';
import { ErrorHandlingService, ErrorType, ErrorSeverity } from './errorHandlingService';

export interface PerformanceThresholds {
  storageOperations: number; // milliseconds
  syncOperations: number; // milliseconds
  renderTime: number; // milliseconds
  apiCalls: number; // milliseconds
}

export interface PerformanceReport {
  timestamp: string;
  slowOperations: Array<{
    operation: string;
    duration: number;
    threshold: number;
    timestamp: string;
  }>;
  averages: Record<string, number>;
  recommendations: string[];
}

export class PerformanceOptimizationService {
  private static readonly DEFAULT_THRESHOLDS: PerformanceThresholds = {
    storageOperations: 100, // 100ms
    syncOperations: 5000, // 5 seconds
    renderTime: 16, // ~60fps
    apiCalls: 2000, // 2 seconds
  };
  
  private static thresholds: PerformanceThresholds = { ...PerformanceOptimizationService.DEFAULT_THRESHOLDS };
  private static operationTimes: Record<string, number[]> = {};
  
  /**
   * Set performance thresholds
   */
  static setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    PerformanceOptimizationService.thresholds = {
      ...PerformanceOptimizationService.thresholds,
      ...thresholds,
    };
  }
  
  /**
   * Get current performance thresholds
   */
  static getThresholds(): PerformanceThresholds {
    return { ...PerformanceOptimizationService.thresholds };
  }
  
  /**
   * Record an operation's performance
   */
  static recordOperation(category: string, operation: string, duration: number): void {
    const key = `${category}:${operation}`;
    
    if (!PerformanceOptimizationService.operationTimes[key]) {
      PerformanceOptimizationService.operationTimes[key] = [];
    }
    
    // Keep only the last 100 measurements
    if (PerformanceOptimizationService.operationTimes[key].length >= 100) {
      PerformanceOptimizationService.operationTimes[key].shift();
    }
    
    PerformanceOptimizationService.operationTimes[key].push(duration);
    
    // Check if operation exceeds threshold
    const threshold = PerformanceOptimizationService.getThresholdForCategory(category);
    if (duration > threshold) {
      // Log slow operation
      analyticsService.trackEvent(analyticsService.AnalyticsEventType.PERFORMANCE, {
        category,
        operation,
        duration,
        threshold,
        exceededBy: `${Math.round((duration - threshold) / threshold * 100)}%`,
      });
    }
  }
  
  /**
   * Get threshold for a specific category
   */
  private static getThresholdForCategory(category: string): number {
    switch (category.toLowerCase()) {
      case 'storage':
        return PerformanceOptimizationService.thresholds.storageOperations;
      case 'sync':
        return PerformanceOptimizationService.thresholds.syncOperations;
      case 'render':
        return PerformanceOptimizationService.thresholds.renderTime;
      case 'api':
        return PerformanceOptimizationService.thresholds.apiCalls;
      default:
        return 1000; // Default threshold: 1 second
    }
  }
  
  /**
   * Generate performance report
   */
  static generateReport(): PerformanceReport {
    const slowOperations: Array<{
      operation: string;
      duration: number;
      threshold: number;
      timestamp: string;
    }> = [];
    
    const averages: Record<string, number> = {};
    const recommendations: string[] = [];
    
    // Calculate averages and find slow operations
    Object.entries(PerformanceOptimizationService.operationTimes).forEach(([key, times]) => {
      if (times.length === 0) return;
      
      const [category, operation] = key.split(':');
      const threshold = PerformanceOptimizationService.getThresholdForCategory(category);
      
      // Calculate average
      const sum = times.reduce((acc, time) => acc + time, 0);
      const average = sum / times.length;
      averages[key] = average;
      
      // Find slow operations
      const slowTimes = times.filter(time => time > threshold);
      if (slowTimes.length > 0) {
        const slowestTime = Math.max(...slowTimes);
        slowOperations.push({
          operation: key,
          duration: slowestTime,
          threshold,
          timestamp: new Date().toISOString(),
        });
        
        // Generate recommendations
        if (average > threshold) {
          switch (category.toLowerCase()) {
            case 'storage':
              recommendations.push(`Consider optimizing storage operations for ${operation}. Average time: ${average.toFixed(2)}ms`);
              break;
            case 'sync':
              recommendations.push(`Sync operation ${operation} is slow. Consider batching or optimizing. Average time: ${average.toFixed(2)}ms`);
              break;
            case 'render':
              recommendations.push(`UI rendering is slow for ${operation}. Consider memoization or optimizing renders. Average time: ${average.toFixed(2)}ms`);
              break;
            case 'api':
              recommendations.push(`API call to ${operation} is slow. Consider caching or optimizing. Average time: ${average.toFixed(2)}ms`);
              break;
          }
        }
      }
    });
    
    return {
      timestamp: new Date().toISOString(),
      slowOperations,
      averages,
      recommendations,
    };
  }
  
  /**
   * Clear recorded performance data
   */
  static clearData(): void {
    PerformanceOptimizationService.operationTimes = {};
  }
}

export const performanceOptimizationService = PerformanceOptimizationService;