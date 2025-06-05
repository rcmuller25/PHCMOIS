// services/backgroundSyncService.ts
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { syncService } from './syncService';
import { networkService } from './networkService';
import { ErrorHandlingService, ErrorType, ErrorSeverity } from './errorHandlingService';
import { analyticsService } from './analyticsService';

export interface BackgroundSyncSettings {
  enabled: boolean;
  syncOnAppResume: boolean;
  syncOnNetworkChange: boolean;
  minimumSyncInterval: number; // in minutes
}

export class BackgroundSyncService {
  private static instance: BackgroundSyncService;
  private settings: BackgroundSyncSettings = {
    enabled: true,
    syncOnAppResume: true,
    syncOnNetworkChange: true,
    minimumSyncInterval: 15, // 15 minutes
  };
  private lastSyncTime: number = 0;
  private appStateSubscription: any = null;
  private netInfoSubscription: any = null;
  
  private constructor() {}
  
  static getInstance(): BackgroundSyncService {
    if (!BackgroundSyncService.instance) {
      BackgroundSyncService.instance = new BackgroundSyncService();
    }
    return BackgroundSyncService.instance;
  }
  
  /**
   * Initialize background sync
   */
  initialize(settings?: Partial<BackgroundSyncSettings>): void {
    // Apply settings
    if (settings) {
      this.settings = { ...this.settings, ...settings };
    }
    
    // Start listeners if enabled
    if (this.settings.enabled) {
      this.startListeners();
    }
  }
  
  /**
   * Start app state and network listeners
   */
  private startListeners(): void {
    // Listen for app state changes
    if (this.settings.syncOnAppResume && !this.appStateSubscription) {
      this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    }
    
    // Listen for network changes
    if (this.settings.syncOnNetworkChange && !this.netInfoSubscription) {
      this.netInfoSubscription = NetInfo.addEventListener(this.handleNetworkChange);
    }
  }
  
  /**
   * Stop all listeners
   */
  stopListeners(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    
    if (this.netInfoSubscription) {
      this.netInfoSubscription();
      this.netInfoSubscription = null;
    }
  }
  
  /**
   * Handle app state changes
   */
  private handleAppStateChange = async (nextAppState: AppStateStatus): Promise<void> => {
    try {
      // Sync when app comes to foreground
      if (nextAppState === 'active') {
        await this.attemptSync('app_resume');
      }
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.SYNC,
        ErrorSeverity.WARNING,
        { method: 'handleAppStateChange' }
      );
    }
  };
  
  /**
   * Handle network changes
   */
  private handleNetworkChange = async (state: any): Promise<void> => {
    try {
      // Sync when network becomes available
      if (state.isConnected && state.isInternetReachable) {
        await this.attemptSync('network_change');
      }
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.SYNC,
        ErrorSeverity.WARNING,
        { method: 'handleNetworkChange' }
      );
    }
  };
  
  /**
   * Attempt to sync if conditions are met
   */
  private attemptSync = async (trigger: string): Promise<boolean> => {
    // Check if sync is enabled
    if (!this.settings.enabled) {
      return false;
    }
    
    // Check if minimum interval has passed
    const now = Date.now();
    const minutesSinceLastSync = (now - this.lastSyncTime) / (1000 * 60);
    
    if (minutesSinceLastSync < this.settings.minimumSyncInterval) {
      return false;
    }
    
    // Check network connectivity
    const isConnected = await networkService.isConnected();
    if (!isConnected) {
      return false;
    }
    
    // Attempt sync
    try {
      analyticsService.trackEvent(analyticsService.AnalyticsEventType.SYNC_START, {
        trigger,
        minutesSinceLastSync,
      });
      
      const success = await syncService.syncData();
      
      if (success) {
        this.lastSyncTime = now;
        analyticsService.trackEvent(analyticsService.AnalyticsEventType.SYNC_COMPLETE, {
          trigger,
          minutesSinceLastSync,
        });
      } else {
        analyticsService.trackEvent(analyticsService.AnalyticsEventType.SYNC_FAIL, {
          trigger,
          minutesSinceLastSync,
          reason: 'sync_failed',
        });
      }
      
      return success;
    } catch (error) {
      await ErrorHandlingService.handleError(
        error as Error,
        ErrorType.SYNC,
        ErrorSeverity.ERROR,
        { method: 'attemptSync', trigger }
      );
      
      analyticsService.trackEvent(analyticsService.AnalyticsEventType.SYNC_FAIL, {
        trigger,
        minutesSinceLastSync,
        reason: 'error',
        error: (error as Error).message,
      });
      
      return false;
    }
  };
  
  /**
   * Update background sync settings
   */
  updateSettings(settings: Partial<BackgroundSyncSettings>): void {
    const wasEnabled = this.settings.enabled;
    this.settings = { ...this.settings, ...settings };
    
    // Handle enabling/disabling
    if (!wasEnabled && this.settings.enabled) {
      this.startListeners();
    } else if (wasEnabled && !this.settings.enabled) {
      this.stopListeners();
    }
  }
  
  /**
   * Get current background sync settings
   */
  getSettings(): BackgroundSyncSettings {
    return { ...this.settings };
  }
}

export const backgroundSyncService = BackgroundSyncService.getInstance();