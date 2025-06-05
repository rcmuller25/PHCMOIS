// services/networkService.ts
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

// Singleton service for network status management
class NetworkService {
  private static instance: NetworkService;
  private listeners: Array<(state: NetInfoState) => void> = [];
  private currentState: NetInfoState | null = null;
  private unsubscribe: (() => void) | null = null;

  private constructor() {
    this.initNetInfo();
  }

  static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  private initNetInfo() {
    this.unsubscribe = NetInfo.addEventListener(state => {
      this.currentState = state;
      this.notifyListeners(state);
    });
  }

  private notifyListeners(state: NetInfoState) {
    this.listeners.forEach(listener => listener(state));
  }

  addListener(listener: (state: NetInfoState) => void) {
    this.listeners.push(listener);
    // Immediately notify with current state if available
    if (this.currentState) {
      listener(this.currentState);
    }
    return () => this.removeListener(listener);
  }

  removeListener(listener: (state: NetInfoState) => void) {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  async getCurrentState(): Promise<NetInfoState> {
    if (this.currentState) {
      return this.currentState;
    }
    return await NetInfo.fetch();
  }

  async isConnected(): Promise<boolean> {
    const state = await this.getCurrentState();
    return Boolean(state.isConnected);
  }

  async isInternetReachable(): Promise<boolean> {
    const state = await this.getCurrentState();
    return Boolean(state.isInternetReachable);
  }

  dispose() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners = [];
  }
}

export const networkService = NetworkService.getInstance();

// React hook for components
export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);

  useEffect(() => {
    const unsubscribe = networkService.addListener(state => {
      setIsConnected(state.isConnected);
      setIsInternetReachable(state.isInternetReachable);
    });

    return unsubscribe;
  }, []);

  return { isConnected, isInternetReachable };
};