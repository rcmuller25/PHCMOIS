import { Stack } from 'expo-router';
import { useTheme, MD3Theme } from 'react-native-paper';

export default function ScreensLayout() {
  const theme = useTheme<MD3Theme>();
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
      }}
    >
      <Stack.Screen
        name="patients"
        options={{
          title: 'Patients',
        }}
      />
      <Stack.Screen
        name="appointments"
        options={{
          title: 'Appointments',
        }}
      />
      <Stack.Screen
        name="search"
        options={{
          title: 'Search',
        }}
      />
      {/* Profile screen is handled by its own layout */}
      <Stack.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="form-demo"
        options={{
          title: 'Form Demo',
        }}
      />
    </Stack>
  );
} 