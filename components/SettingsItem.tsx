import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, useTheme, MD3Theme } from 'react-native-paper';

interface SettingsItemProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export const SettingsItem = ({ title, description, children }: SettingsItemProps) => {
  const theme = useTheme<MD3Theme>();
  
  return (
    <Surface style={styles.item} elevation={0}>
      <View style={styles.itemContent}>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
          {title}
        </Text>
        {description && (
          <Text 
            variant="bodySmall" 
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {description}
          </Text>
        )}
      </View>
      <View style={styles.controlContainer}>{children}</View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  itemContent: {
    flex: 1,
  },
  controlContainer: {
    marginLeft: 16,
  },
});