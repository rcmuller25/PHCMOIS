import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, useTheme, MD3Theme } from 'react-native-paper';

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
}

export const SettingsSection = ({ title, children }: SettingsSectionProps) => {
  const theme = useTheme<MD3Theme>();
  
  return (
    <View style={styles.section}>
      <Text 
        variant="titleSmall" 
        style={{ 
          color: theme.colors.onSurfaceVariant,
          marginLeft: 16,
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      <Surface 
        style={styles.sectionContent} 
        elevation={1}
      >
        {children}
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionContent: {
    borderRadius: 16,
    overflow: 'hidden',
  },
});