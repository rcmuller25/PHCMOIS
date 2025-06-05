import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Modal, Portal, Text, Button, RadioButton, Divider, useTheme } from 'react-native-paper';
import { OfflineItem } from '../src/services/storageService';
import { offlineFirstService } from '../src/services/offlineFirstService';

interface ConflictResolutionModalProps {
  visible: boolean;
  onDismiss: () => void;
  localItem: OfflineItem;
  serverItem: OfflineItem;
  storageKey: string;
  onResolved: (resolvedItem: OfflineItem) => void;
}

type ResolutionStrategy = 'server' | 'local' | 'manual';

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  visible,
  onDismiss,
  localItem,
  serverItem,
  storageKey,
  onResolved,
}) => {
  const theme = useTheme();
  const [strategy, setStrategy] = useState<ResolutionStrategy>('server');
  const [manualResolution, setManualResolution] = useState<Record<string, any>>({});
  const [isResolving, setIsResolving] = useState(false);

  // Get all fields that have conflicts
  const getConflictingFields = () => {
    const fields: string[] = [];
    
    // Compare all fields except metadata fields
    Object.keys(localItem).forEach(key => {
      // Skip metadata fields
      if (key.startsWith('_') || key === 'id' || key === 'serverId') {
        return;
      }
      
      // Check if the field values are different
      if (JSON.stringify(localItem[key]) !== JSON.stringify(serverItem[key])) {
        fields.push(key);
      }
    });
    
    return fields;
  };

  const conflictingFields = getConflictingFields();

  // Initialize manual resolution with server values
  React.useEffect(() => {
    if (visible) {
      const initialResolution: Record<string, any> = {};
      conflictingFields.forEach(field => {
        initialResolution[field] = serverItem[field];
      });
      setManualResolution(initialResolution);
    }
  }, [visible, serverItem, conflictingFields]);

  const handleFieldResolution = (field: string, useServerValue: boolean) => {
    setManualResolution(prev => ({
      ...prev,
      [field]: useServerValue ? serverItem[field] : localItem[field],
    }));
  };

  const handleResolve = async () => {
    setIsResolving(true);
    
    try {
      let resolvedItem: OfflineItem;
      
      switch (strategy) {
        case 'server':
          // Use server version
          resolvedItem = await offlineFirstService.resolveConflict(storageKey, localItem, serverItem);
          break;
          
        case 'local':
          // Use local version but mark as synced
          resolvedItem = await offlineFirstService.resolveConflict(storageKey, localItem, {
            ...localItem,
            _synced: true,
            serverId: serverItem.serverId,
            serverUpdatedAt: serverItem.serverUpdatedAt,
          });
          break;
          
        case 'manual':
          // Merge with manual resolution
          const manuallyResolvedItem = {
            ...localItem,
            ...manualResolution,
            _synced: true,
            serverId: serverItem.serverId,
            serverUpdatedAt: serverItem.serverUpdatedAt,
          };
          resolvedItem = await offlineFirstService.resolveConflict(storageKey, localItem, manuallyResolvedItem);
          break;
          
        default:
          resolvedItem = await offlineFirstService.resolveConflict(storageKey, localItem, serverItem);
      }
      
      onResolved(resolvedItem);
      onDismiss();
    } catch (error) {
      console.error('Error resolving conflict:', error);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.container}>
        <Text variant="headlineSmall" style={styles.title}>Resolve Data Conflict</Text>
        
        <Text variant="bodyMedium" style={styles.description}>
          This item has been modified both locally and on the server. Please choose how to resolve this conflict.
        </Text>
        
        <RadioButton.Group onValueChange={value => setStrategy(value as ResolutionStrategy)} value={strategy}>
          <View style={styles.radioItem}>
            <RadioButton value="server" />
            <Text variant="bodyMedium">Use server version (recommended)</Text>
          </View>
          
          <View style={styles.radioItem}>
            <RadioButton value="local" />
            <Text variant="bodyMedium">Keep my local changes</Text>
          </View>
          
          <View style={styles.radioItem}>
            <RadioButton value="manual" />
            <Text variant="bodyMedium">Manually resolve conflicts</Text>
          </View>
        </RadioButton.Group>
        
        {strategy === 'manual' && conflictingFields.length > 0 && (
          <ScrollView style={styles.conflictsContainer}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Conflicting Fields</Text>
            
            {conflictingFields.map(field => (
              <View key={field} style={styles.conflictItem}>
                <Text variant="titleSmall" style={styles.fieldName}>{field}</Text>
                
                <View style={styles.valueContainer}>
                  <View style={[styles.valueCard, { borderColor: theme.colors.primary }]}>
                    <Text variant="bodySmall" style={styles.valueLabel}>Local Value:</Text>
                    <Text variant="bodyMedium">
                      {typeof localItem[field] === 'object'
                        ? JSON.stringify(localItem[field])
                        : String(localItem[field])}
                    </Text>
                    <Button 
                      mode="outlined" 
                      onPress={() => handleFieldResolution(field, false)}
                      style={styles.valueButton}
                      compact
                    >
                      Use This
                    </Button>
                  </View>
                  
                  <View style={[styles.valueCard, { borderColor: theme.colors.secondary }]}>
                    <Text variant="bodySmall" style={styles.valueLabel}>Server Value:</Text>
                    <Text variant="bodyMedium">
                      {typeof serverItem[field] === 'object'
                        ? JSON.stringify(serverItem[field])
                        : String(serverItem[field])}
                    </Text>
                    <Button 
                      mode="outlined" 
                      onPress={() => handleFieldResolution(field, true)}
                      style={styles.valueButton}
                      compact
                    >
                      Use This
                    </Button>
                  </View>
                </View>
                
                <Divider style={styles.divider} />
              </View>
            ))}
          </ScrollView>
        )}
        
        <View style={styles.actions}>
          <Button mode="outlined" onPress={onDismiss} style={styles.button}>
            Cancel
          </Button>
          <Button 
            mode="contained" 
            onPress={handleResolve} 
            style={styles.button}
            loading={isResolving}
            disabled={isResolving}
          >
            Resolve
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  title: {
    marginBottom: 16,
  },
  description: {
    marginBottom: 24,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  conflictsContainer: {
    maxHeight: 300,
    marginTop: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  conflictItem: {
    marginBottom: 16,
  },
  fieldName: {
    marginBottom: 8,
  },
  valueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  valueCard: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  valueLabel: {
    marginBottom: 4,
    opacity: 0.7,
  },
  valueButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  divider: {
    marginTop: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  button: {
    marginLeft: 8,
  },
});