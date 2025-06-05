import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Chip, IconButton, useTheme, Portal, Modal } from 'react-native-paper';
import { ErrorHandlingService, AppError, ErrorSeverity, ErrorType } from '../src/services/errorHandlingService';

interface ErrorDisplayProps {
  maxErrors?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onRetry?: (error: AppError) => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  maxErrors = 5,
  autoRefresh = true,
  refreshInterval = 10000,
  onRetry,
}) => {
  const theme = useTheme();
  const [errors, setErrors] = useState<AppError[]>([]);
  const [selectedError, setSelectedError] = useState<AppError | null>(null);
  const [visible, setVisible] = useState(false);

  const loadErrors = async () => {
    const allErrors = await ErrorHandlingService.getErrors();
    // Filter to show only unhandled errors, sorted by severity and timestamp
    const filteredErrors = allErrors
      .filter(error => !error.handled)
      .sort((a, b) => {
        // Sort by severity first (CRITICAL > ERROR > WARNING > INFO)
        const severityOrder = {
          [ErrorSeverity.CRITICAL]: 0,
          [ErrorSeverity.ERROR]: 1,
          [ErrorSeverity.WARNING]: 2,
          [ErrorSeverity.INFO]: 3,
        };
        
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        
        // Then sort by timestamp (newest first)
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      })
      .slice(0, maxErrors);
    
    setErrors(filteredErrors);
  };

  useEffect(() => {
    loadErrors();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadErrors, refreshInterval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, maxErrors]);

  const handleRetry = async (error: AppError) => {
    if (onRetry) {
      onRetry(error);
    } else if (error.retryable) {
      // Default retry behavior
      await ErrorHandlingService.markErrorAsHandled(error.id);
      await loadErrors();
    }
  };

  const handleDismiss = async (error: AppError) => {
    await ErrorHandlingService.markErrorAsHandled(error.id);
    await loadErrors();
  };

  const handleClearAll = async () => {
    // Mark all displayed errors as handled
    for (const error of errors) {
      await ErrorHandlingService.markErrorAsHandled(error.id);
    }
    await loadErrors();
  };

  const showErrorDetails = (error: AppError) => {
    setSelectedError(error);
    setVisible(true);
  };

  const hideErrorDetails = () => {
    setVisible(false);
    setSelectedError(null);
  };

  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return theme.colors.error;
      case ErrorSeverity.ERROR:
        return theme.colors.errorContainer;
      case ErrorSeverity.WARNING:
        return theme.colors.warning;
      case ErrorSeverity.INFO:
        return theme.colors.info;
      default:
        return theme.colors.surfaceVariant;
    }
  };

  const getTypeIcon = (type: ErrorType) => {
    switch (type) {
      case ErrorType.NETWORK:
        return 'wifi-off';
      case ErrorType.STORAGE:
        return 'database-off';
      case ErrorType.VALIDATION:
        return 'alert-circle';
      case ErrorType.SYNC:
        return 'sync-off';
      case ErrorType.AUTH:
        return 'lock';
      default:
        return 'alert';
    }
  };

  if (errors.length === 0) {
    return null; // Don't render anything if there are no errors
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleMedium">System Notifications</Text>
        {errors.length > 0 && (
          <Button mode="text" onPress={handleClearAll}>
            Clear All
          </Button>
        )}
      </View>
      
      <ScrollView style={styles.scrollView}>
        {errors.map(error => (
          <Card 
            key={error.id} 
            style={[styles.errorCard, { borderLeftColor: getSeverityColor(error.severity) }]}
            mode="outlined"
          >
            <Card.Content style={styles.cardContent}>
              <View style={styles.errorHeader}>
                <Chip 
                  icon={getTypeIcon(error.type)}
                  style={{ backgroundColor: theme.colors.surfaceVariant }}
                >
                  {error.type}
                </Chip>
                <Text variant="captionMedium" style={styles.timestamp}>
                  {new Date(error.timestamp).toLocaleTimeString()}
                </Text>
              </View>
              
              <Text variant="bodyMedium" style={styles.message}>
                {error.message}
              </Text>
              
              <View style={styles.actions}>
                <Button 
                  mode="text" 
                  onPress={() => showErrorDetails(error)}
                  compact
                >
                  Details
                </Button>
                
                {error.retryable && (
                  <Button 
                    mode="text" 
                    onPress={() => handleRetry(error)}
                    compact
                  >
                    Retry
                  </Button>
                )}
                
                <Button 
                  mode="text" 
                  onPress={() => handleDismiss(error)}
                  compact
                >
                  Dismiss
                </Button>
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
      
      <Portal>
        <Modal visible={visible} onDismiss={hideErrorDetails} contentContainerStyle={styles.modal}>
          {selectedError && (
            <>
              <View style={styles.modalHeader}>
                <Text variant="titleLarge">Error Details</Text>
                <IconButton icon="close" onPress={hideErrorDetails} />
              </View>
              
              <ScrollView style={styles.modalContent}>
                <Text variant="titleMedium" style={styles.detailLabel}>Type:</Text>
                <Text variant="bodyMedium" style={styles.detailValue}>{selectedError.type}</Text>
                
                <Text variant="titleMedium" style={styles.detailLabel}>Severity:</Text>
                <Text variant="bodyMedium" style={styles.detailValue}>{selectedError.severity}</Text>
                
                <Text variant="titleMedium" style={styles.detailLabel}>Time:</Text>
                <Text variant="bodyMedium" style={styles.detailValue}>
                  {new Date(selectedError.timestamp).toLocaleString()}
                </Text>
                
                <Text variant="titleMedium" style={styles.detailLabel}>Message:</Text>
                <Text variant="bodyMedium" style={styles.detailValue}>{selectedError.message}</Text>
                
                <Text variant="titleMedium" style={styles.detailLabel}>Details:</Text>
                <Card style={styles.detailsCard}>
                  <Card.Content>
                    <Text variant="bodySmall" style={styles.stackTrace}>
                      {JSON.stringify(selectedError.details, null, 2)}
                    </Text>
                  </Card.Content>
                </Card>
              </ScrollView>
              
              <View style={styles.modalActions}>
                {selectedError.retryable && (
                  <Button 
                    mode="contained" 
                    onPress={() => {
                      handleRetry(selectedError);
                      hideErrorDetails();
                    }}
                    style={styles.actionButton}
                  >
                    Retry
                  </Button>
                )}
                
                <Button 
                  mode="outlined" 
                  onPress={() => {
                    handleDismiss(selectedError);
                    hideErrorDetails();
                  }}
                  style={styles.actionButton}
                >
                  Dismiss
                </Button>
              </View>
            </>
          )}
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  scrollView: {
    maxHeight: 300,
  },
  errorCard: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderLeftWidth: 4,
  },
  cardContent: {
    paddingVertical: 8,
  },
  errorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timestamp: {
    opacity: 0.7,
  },
  message: {
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalContent: {
    padding: 16,
  },
  detailLabel: {
    marginTop: 12,
    marginBottom: 4,
  },
  detailValue: {
    marginBottom: 8,
  },
  detailsCard: {
    marginTop: 8,
    backgroundColor: '#f5f5f5',
  },
  stackTrace: {
    fontFamily: 'monospace',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    marginLeft: 8,
  },
});