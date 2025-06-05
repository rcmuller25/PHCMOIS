import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNetworkStatus } from '../src/services/networkService';
import { offlineFirstService } from '../src/services/offlineFirstService';
import { useSettingsStore } from '../stores/settingsStore';

export const NetworkStatusBar = () => {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const [pendingChanges, setPendingChanges] = useState(0);
  const { offlineMode } = useSettingsStore();

  useEffect(() => {
    // Check for pending changes
    const checkPendingChanges = async () => {
      const count = await offlineFirstService.getOfflineChanges();
      setPendingChanges(count);
    };

    checkPendingChanges();
    const interval = setInterval(checkPendingChanges, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    if (isConnected && pendingChanges > 0 && !offlineMode) {
      await offlineFirstService.syncAll();
      // Update pending changes count
      const count = await offlineFirstService.getOfflineChanges();
      setPendingChanges(count);
    }
  };

  if (offlineMode) {
    return (
      <View style={[styles.container, styles.offlineMode]}>
        <Text style={styles.text}>Offline Mode</Text>
      </View>
    );
  }

  if (!isConnected) {
    return (
      <View style={[styles.container, styles.offline]}>
        <Text style={styles.text}>You are offline</Text>
        {pendingChanges > 0 && (
          <Text style={styles.text}>{pendingChanges} changes pending</Text>
        )}
      </View>
    );
  }

  if (pendingChanges > 0) {
    return (
      <Pressable onPress={handleSync} style={[styles.container, styles.pending]}>
        <Text style={styles.text}>{pendingChanges} changes pending - Tap to sync</Text>
      </Pressable>
    );
  }

  return null; // Don't show anything when online and synced
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offline: {
    backgroundColor: '#f44336',
  },
  offlineMode: {
    backgroundColor: '#ff9800',
  },
  pending: {
    backgroundColor: '#2196f3',
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
});