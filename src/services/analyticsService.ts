// services/analyticsService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorHandlingService, ErrorType, ErrorSeverity } from './errorHandlingService';

// Analytics event types
export enum AnalyticsEventType {
  APP_OPEN = 'APP_OPEN',
  APP_CLOSE = 'APP_CLOSE',
  SYNC_START = 'SYNC_START',
  SYNC_COMPLETE = 'SYNC_COMPLETE',
  SYNC_FAIL = 'SYNC_FAIL',
  NETWORK_CHANGE = 'NETWORK_CHANGE',
  DATA_CREATE = 'DATA_CREATE',
  DATA_UPDATE = 'DATA_UPDATE',
  DATA_DELETE = 'DATA_DELETE',
  SEARCH = 'SEARCH',
  NAVIGATION = 'NAVIGATION',
  ERROR = 'ERROR',
  PERFORMANCE = 'PERFORMANCE',
  USER_ACTION = 'USER_ACTION',
}

// Analytics event interface
export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  timestamp: string;
  data: Record<string, any>;
  sessionId: string;
}

// Performance metrics interface
export interface PerformanceMetrics {
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  metadata?: Record<string, any>;
}

export class AnalyticsService {
  private static readonly ANALYTICS_EVENTS_KEY = '@phmos/analytics_events';
  private static readonly ANALYTICS_SESSION_KEY = '@phmos/analytics_session';
  private static readonly MAX_EVENTS_STORED = 1000;
  private static instance: AnalyticsService;
  private sessionId: string;
  private performanceMarks: Record<string, number> = {};
  
  private constructor() {
    this.sessionId = this.generateSessionId();
  }
  
  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }
  
  /**
   * Initialize analytics and start a new session
   */
  async initialize(): Promise<void> {
    try {
      // Generate a new session ID
      this.sessionId = this.generateSessionId();
      
      // Store the session ID
      await AsyncStorage.setItem(AnalyticsService.ANALYTICS_SESSION_KEY, this.sessionId);
      
      // Track app open event
      await this.trackEvent(AnalyticsEventType.APP_OPEN, {});
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.UNKNOWN,
        ErrorSeverity.WARNING,
        { method: 'initialize' }
      );
    }
  }
  
  /**
   * Track an analytics event
   */
  async trackEvent(type: AnalyticsEventType, data: Record<string, any> = {}): Promise<void> {
    try {
      const event: AnalyticsEvent = {
        id: Date.now().toString(),
        type,
        timestamp: new Date().toISOString(),
        data,
        sessionId: this.sessionId,
      };
      
      // Get existing events
      const eventsJson = await AsyncStorage.getItem(AnalyticsService.ANALYTICS_EVENTS_KEY);
      const events: AnalyticsEvent[] = eventsJson ? JSON.parse(eventsJson) : [];
      
      // Add new event
      events.push(event);
      
      // Limit the number of stored events
      const trimmedEvents = events.slice(-AnalyticsService.MAX_EVENTS_STORED);
      
      // Save back to storage
      await AsyncStorage.setItem(AnalyticsService.ANALYTICS_EVENTS_KEY, JSON.stringify(trimmedEvents));
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.WARNING,
        { method: 'trackEvent', type, data }
      );
    }
  }
  
  /**
   * Start measuring performance for an operation
   */
  startPerformanceMeasurement(operation: string): void {
    this.performanceMarks[operation] = performance.now();
  }
  
  /**
   * End measuring performance for an operation and track the metrics
   */
  async endPerformanceMeasurement(
    operation: string, 
    success: boolean = true, 
    metadata?: Record<string, any>
  ): Promise<PerformanceMetrics | null> {
    const startTime = this.performanceMarks[operation];
    if (!startTime) {
      console.warn(`No performance measurement started for operation: ${operation}`);
      return null;
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Clear the mark
    delete this.performanceMarks[operation];
    
    // Create metrics object
    const metrics: PerformanceMetrics = {
      operation,
      startTime,
      endTime,
      duration,
      success,
      metadata,
    };
    
    // Track as an analytics event
    await this.trackEvent(AnalyticsEventType.PERFORMANCE, metrics);
    
    return metrics;
  }
  
  /**
   * Track a navigation event
   */
  async trackNavigation(screen: string, params?: Record<string, any>): Promise<void> {
    await this.trackEvent(AnalyticsEventType.NAVIGATION, { screen, params });
  }
  
  /**
   * Track a search event
   */
  async trackSearch(query: string, filters?: Record<string, any>, results?: number): Promise<void> {
    await this.trackEvent(AnalyticsEventType.SEARCH, { query, filters, results });
  }
  
  /**
   * Track a data operation event
   */
  async trackDataOperation(
    operation: 'create' | 'update' | 'delete',
    entityType: string,
    entityId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const eventType = {
      'create': AnalyticsEventType.DATA_CREATE,
      'update': AnalyticsEventType.DATA_UPDATE,
      'delete': AnalyticsEventType.DATA_DELETE,
    }[operation];
    
    await this.trackEvent(eventType, { entityType, entityId, metadata });
  }
  
  /**
   * Track a sync event
   */
  async trackSyncEvent(
    status: 'start' | 'complete' | 'fail',
    details?: Record<string, any>
  ): Promise<void> {
    const eventType = {
      'start': AnalyticsEventType.SYNC_START,
      'complete': AnalyticsEventType.SYNC_COMPLETE,
      'fail': AnalyticsEventType.SYNC_FAIL,
    }[status];
    
    await this.trackEvent(eventType, details);
  }
  
  /**
   * Track a user action
   */
  async trackUserAction(action: string, context?: string, metadata?: Record<string, any>): Promise<void> {
    await this.trackEvent(AnalyticsEventType.USER_ACTION, { action, context, metadata });
  }
  
  /**
   * Get all analytics events
   */
  async getEvents(): Promise<AnalyticsEvent[]> {
    try {
      const eventsJson = await AsyncStorage.getItem(AnalyticsService.ANALYTICS_EVENTS_KEY);
      return eventsJson ? JSON.parse(eventsJson) : [];
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.WARNING,
        { method: 'getEvents' }
      );
      return [];
    }
  }
  
  /**
   * Clear all analytics events
   */
  async clearEvents(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(AnalyticsService.ANALYTICS_EVENTS_KEY);
      return true;
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.STORAGE,
        ErrorSeverity.WARNING,
        { method: 'clearEvents' }
      );
      return false;
    }
  }
  
  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2, 9);
  }
}

export const analyticsService = AnalyticsService.getInstance();