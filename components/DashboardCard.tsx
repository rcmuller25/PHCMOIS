import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text, useTheme, MD3Theme } from 'react-native-paper';

interface DashboardCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  backgroundColor?: string;
  textColor?: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'default';
}

export function DashboardCard({ 
  title, 
  value, 
  icon, 
  backgroundColor, 
  textColor,
  variant = 'default' 
}: DashboardCardProps) {
  const theme = useTheme();
  
  // Determine colors based on variant or use provided colors
  const getBackgroundColor = () => {
    if (backgroundColor) return backgroundColor;
    
    switch(variant) {
      case 'primary':
        return theme.colors.primaryContainer;
      case 'secondary':
        return theme.colors.secondaryContainer;
      case 'tertiary':
        return theme.colors.tertiaryContainer;
      default:
        return theme.colors.surfaceVariant;
    }
  };
  
  const getTextColor = () => {
    if (textColor) return textColor;
    
    switch(variant) {
      case 'primary':
        return theme.colors.onPrimaryContainer;
      case 'secondary':
        return theme.colors.onSecondaryContainer;
      case 'tertiary':
        return theme.colors.onTertiaryContainer;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };
  
  const bgColor = getBackgroundColor();
  const txtColor = getTextColor();
  
  return (
    <Surface style={[styles.card, { backgroundColor: bgColor }]} elevation={1}>
      <View style={styles.content}>
        <Text variant="headlineSmall" style={{ color: txtColor, marginBottom: 4 }}>{value}</Text>
        <Text variant="labelMedium" style={{ color: txtColor, opacity: 0.8 }}>{title}</Text>
      </View>
      <View style={styles.iconContainer}>
        {icon}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
  },
  content: {
    flex: 1,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});