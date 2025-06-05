import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme, MD3Theme } from 'react-native-paper';

interface DashboardButtonProps {
  title: string;
  icon: ReactNode;
  backgroundColor?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'default';
}

export function DashboardButton({ 
  title, 
  icon, 
  backgroundColor, 
  onPress,
  variant = 'default'
}: DashboardButtonProps) {
  const theme = useTheme();
  
  // Determine button mode and colors based on variant
  const getButtonProps = () => {
    switch(variant) {
      case 'primary':
        return { 
          mode: 'contained' as const,
          buttonColor: backgroundColor || theme.colors.primary
        };
      case 'secondary':
        return { 
          mode: 'contained' as const,
          buttonColor: backgroundColor || theme.colors.secondary
        };
      case 'tertiary':
        return { 
          mode: 'contained' as const,
          buttonColor: backgroundColor || theme.colors.tertiary
        };
      default:
        return { 
          mode: 'outlined' as const,
          buttonColor: backgroundColor || undefined
        };
    }
  };
  
  const { mode, buttonColor } = getButtonProps();
  
  return (
    <View style={styles.container}>
      <Button 
        mode={mode}
        style={styles.button}
        contentStyle={styles.buttonContent}
        buttonColor={buttonColor}
        onPress={onPress}
        icon={({size, color}) => (
          <View style={styles.iconContainer}>
            {React.isValidElement(icon) ? 
              React.cloneElement(icon as React.ReactElement<any>, {size, color}) : 
              icon
            }
          </View>
        )}
      >
        {title}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 4,
  },
  button: {
    borderRadius: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});