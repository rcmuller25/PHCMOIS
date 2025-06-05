import { Stack, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme, Surface } from 'react-native-paper';

export default function NotFoundScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen 
        options={{ 
          title: 'Page Not Found',
          headerTitleStyle: {
            ...theme.fonts.titleLarge,
          },
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.onSurface,
        }} 
      />
      <View style={styles.content}>
        <Text 
          variant="displaySmall" 
          style={[styles.title, { color: theme.colors.onSurface }]}
        >
          404
        </Text>
        <Text 
          variant="headlineMedium" 
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Oops! Page not found
        </Text>
        <Text 
          variant="bodyLarge" 
          style={[styles.message, { color: theme.colors.onSurfaceVariant }]}
        >
          The page you're looking for doesn't exist or has been moved.
        </Text>
        <Button
          mode="contained"
          onPress={() => router.push('/')}
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          Return to Home
        </Button>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  subtitle: {
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  message: {
    marginBottom: 32,
    textAlign: 'center',
    maxWidth: 400,
    lineHeight: 24,
  },
  button: {
    borderRadius: 20,
    paddingHorizontal: 24,
  },
  buttonContent: {
    height: 48,
  },
  buttonLabel: {
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
