import React, { memo, useMemo } from 'react';
import { 
  Modal, 
  View, 
  StyleSheet, 
  SafeAreaView,
  FlatList
} from 'react-native';
import { 
  Surface, 
  Text, 
  TouchableRipple, 
  IconButton, 
  useTheme, 
  MD3Theme 
} from 'react-native-paper';
import { X } from 'lucide-react-native';
import { ActivityIndicator } from 'react-native-paper';

interface AppointmentPickerProps {
  visible: boolean;
  title: string;
  data: any[];
  onSelect: (item: any) => void;
  onClose: () => void;
  customContent?: React.ReactNode;
}

// Memoize the entire component to prevent unnecessary re-renders
export const AppointmentPicker = memo(({ 
  visible, 
  title, 
  data, 
  onSelect, 
  onClose,
  customContent
}: AppointmentPickerProps) => {
  const theme = useTheme<MD3Theme>();
  
  // Memoize styles that depend on theme to prevent recalculation on each render
  const titleStyle = useMemo(() => ({ color: theme.colors.onSurface }), [theme.colors.onSurface]);
  const iconColor = useMemo(() => theme.colors.onSurfaceVariant, [theme.colors.onSurfaceVariant]);
  const rippleColor = useMemo(() => theme.colors.primary, [theme.colors.primary]);
  const textStyle = useMemo(() => ({ color: theme.colors.onSurface }), [theme.colors.onSurface]);
  
  // Memoize the item renderer to prevent recreation on each render
  const renderItem = useMemo(() => (
    ({ item }: { item: any }) => (
      <TouchableRipple
        style={styles.itemButton}
        onPress={() => onSelect(item)}
        rippleColor={rippleColor}
      >
        <Text 
          variant="bodyLarge" 
          style={textStyle}
        >
          {typeof item === 'object' && item !== null && item.label ? item.label : String(item)}
        </Text>
      </TouchableRipple>
    )
  ), [onSelect, rippleColor, textStyle]);
  
  // Memoize the key extractor to prevent recreation on each render
  const keyExtractor = useMemo(() => (
    (item: any, index: number) => 
      typeof item === 'object' && item !== null && item.id 
        ? item.id.toString() 
        : index.toString()
  ), []);
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      hardwareAccelerated={true} // Use hardware acceleration for smoother animations
    >
      <SafeAreaView style={styles.centeredView}>
        <Surface style={styles.modalView} elevation={2}>
          <View style={styles.header}>
            <Text variant="titleMedium" style={titleStyle}>
              {title}
            </Text>
            <IconButton 
              icon={({size, color}) => <X size={size} color={color} />}
              onPress={onClose}
              size={24}
              iconColor={iconColor}
            />
          </View>
          
          {customContent ? (
            customContent
          ) : (
            <FlatList
              data={data}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              style={styles.list}
              showsVerticalScrollIndicator={false}
              initialNumToRender={10} // Limit initial render for better performance
              maxToRenderPerBatch={10} // Limit batch rendering for smoother scrolling
              windowSize={5} // Reduce window size for better memory usage
              removeClippedSubviews={true} // Remove items that are off screen
            />
          )}
        </Surface>
      </SafeAreaView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalView: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 16,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.12)',
    marginBottom: 8,
  },
  list: {
    maxHeight: '70%',
  },
  itemButton: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
});