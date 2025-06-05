import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { IconButton, useTheme, MD3Theme } from 'react-native-paper';
import { ChevronLeft } from 'lucide-react-native';

interface BackButtonProps {
  onPress?: () => void;
  color?: string;
  size?: number;
  style?: any;
}

export function BackButton({ 
  onPress, 
  color,
  size = 24,
  style 
}: BackButtonProps) {
  const router = useRouter();
  const theme = useTheme();
  
  // Use theme color if no color is provided
  const iconColor = color || theme.colors.primary;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        // Fallback to home if no history
        router.replace('/');
      }
    }
  };

  return (
    <IconButton
      icon={({size: iconSize}) => <ChevronLeft color={iconColor} size={iconSize} />}
      size={size}
      onPress={handlePress}
      style={[styles.button, style]}
      accessibilityLabel="Go back"
    />
  );
}

const styles = StyleSheet.create({
  button: {
    margin: 0,
  },
});
