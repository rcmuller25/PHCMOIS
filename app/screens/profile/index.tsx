import { Stack, useNavigation } from 'expo-router';
import ProfileScreen from '../../profile';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function ProfileIndex() {
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      // Hide the header when this screen is focused
      navigation.setOptions({
        headerShown: false,
      });
    }, [navigation])
  );

  return <ProfileScreen />;
}
