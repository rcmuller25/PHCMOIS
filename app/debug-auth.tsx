import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { Button, Card, Title, Paragraph } from 'react-native-paper';
import { resetAuthState, initializeDefaultAdmin } from '../utils/resetAuth';

export default function DebugAuthScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>(['Debug console initialized']);

  const addLog = (message: string) => {
    setLogs(prev => [`[${new Date().toISOString()}] ${message}`, ...prev].slice(0, 50));
  };

  const handleResetAuth = async () => {
    try {
      setIsLoading(true);
      addLog('Resetting authentication state...');
      await resetAuthState();
      addLog('Authentication state reset successfully');
      Alert.alert('Success', 'Authentication state has been reset');
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      addLog(`Error resetting auth: ${errorMessage}`);
      Alert.alert('Error', 'Failed to reset authentication state');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitAdmin = async () => {
    try {
      setIsLoading(true);
      addLog('Initializing default admin user...');
      const result = await initializeDefaultAdmin();
      if (result.success) {
        addLog('Default admin initialized successfully');
        Alert.alert(
          'Success', 
          result.message || 'Default admin user has been created.\nEmail: admin@phmos.org\nPassword: password123'
        );
      } else {
        addLog(`Error: ${result.message || 'Unknown error'}`);
        Alert.alert('Error', result.message || 'Failed to initialize admin');
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      addLog(`Error initializing admin: ${errorMessage}`);
      Alert.alert('Error', 'Failed to initialize admin user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Authentication Debug</Title>
          <Paragraph>
            Use these tools to reset the authentication state and initialize the default admin user.
          </Paragraph>
          
          <View style={styles.buttonContainer}>
            <Button 
              mode="contained" 
              onPress={handleResetAuth}
              disabled={isLoading}
              style={styles.button}
            >
              Reset Authentication State
            </Button>
            
            <Button 
              mode="outlined" 
              onPress={handleInitAdmin}
              disabled={isLoading}
              style={styles.button}
            >
              Initialize Default Admin
            </Button>
          </View>
          
          <Title style={styles.logsTitle}>Logs</Title>
          <View style={styles.logsContainer}>
            {logs.map((log, index) => (
              <Text key={index} style={styles.logText}>
                {log}
              </Text>
            ))}
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    marginBottom: 16,
  },
  buttonContainer: {
    marginVertical: 16,
    gap: 8,
  },
  button: {
    marginVertical: 4,
  },
  logsTitle: {
    marginTop: 24,
    marginBottom: 8,
  },
  logsContainer: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 4,
    maxHeight: 300,
  },
  logText: {
    color: '#00ff00',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 2,
  },
});
