import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSettingsStore } from '../../stores/settingsStore';
import { usePatientsStore } from '../../stores/patientsStore';
import { useAppointmentsStore } from '../../stores/appointmentsStore';
import { SettingsSection } from '../../components/SettingsSection';
import { SettingsItem } from '../../components/SettingsItem';
import { Button, Switch, useTheme, Text, TouchableRipple, MD3Theme } from 'react-native-paper';
import { useRouter } from 'expo-router';

type SyncFrequency = '15min' | '30min' | '1hr' | 'manual';

const Settings = () => {
  const router = useRouter();
  const theme = useTheme<MD3Theme>();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { colors } = theme;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 16,
    },
    section: {
      marginBottom: 24,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 16,
      overflow: 'hidden',
    },
    sectionHeader: {
      padding: 16,
      backgroundColor: colors.surfaceVariant,
    },
    sectionTitle: {
      color: colors.onSurfaceVariant,
    },
    settingItem: {
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    settingLabel: {
      flex: 1,
    },
    settingTitle: {
      color: colors.onSurface,
      marginBottom: 4,
    },
    settingDescription: {
      color: colors.onSurfaceVariant,
    },
    button: {
      marginTop: 16,
      marginHorizontal: 16,
      marginBottom: 24,
    },
    warningText: {
      fontSize: 12,
      lineHeight: 16,
      marginTop: 8,
      fontStyle: 'italic',
      textAlign: 'center',
    },
    versionContainer: {
      marginTop: 24,
      marginBottom: 16,
      alignItems: 'center',
    },
    versionText: {
      color: colors.onSurfaceVariant,
    },
    versionNumber: {
      fontWeight: '500',
      color: colors.onSurface,
    },
  });

  const {
    offlineMode,
    toggleOfflineMode,
    syncFrequency,
    setSyncFrequency,
    showNotifications,
    toggleNotifications,
  } = useSettingsStore();

  const { resetPatients } = usePatientsStore();
  const { resetAppointments } = useAppointmentsStore();

  // Handle data reset
  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all patients and appointments. This action cannot be undone. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetPatients();
            resetAppointments();
            Alert.alert('Data Reset', 'All patient and appointment data has been cleared.');
          },
        },
      ]
    );
  };

  // Handle sync frequency change
  const handleSyncFrequencyChange = (value: SyncFrequency) => {
    setSyncFrequency(value);
  };

  // Simulate sync
  const handleSyncNow = () => {
    Alert.alert(
      'Sync Data',
      'Synchronizing data with the server...',
      [
        {
          text: 'OK',
          onPress: () => {
            setTimeout(() => {
              Alert.alert('Sync Complete', 'Your data has been successfully synchronized with the server.');
            }, 1500);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SettingsSection title="Appearance">
          <SettingsItem
            title="Dark Mode"
            description="Switch between light and dark themes"
          >
            <Switch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
              color={colors.primary}
            />
          </SettingsItem>
        </SettingsSection>

        <SettingsSection title="Data Synchronization">
          <SettingsItem
            title="Offline Mode"
            description="Work without internet connection"
          >
            <Switch
              value={offlineMode}
              onValueChange={toggleOfflineMode}
              color={colors.primary}
            />
          </SettingsItem>

          <SettingsItem
            title="Sync Frequency"
            description="How often to sync with the server"
          >
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(['15min', '30min', '1hr', 'manual'] as SyncFrequency[]).map((freq) => (
                <TouchableRipple
                  key={freq}
                  onPress={() => handleSyncFrequencyChange(freq as SyncFrequency)}
                  style={{
                    borderRadius: 4,
                    borderWidth: 1,
                    borderColor: syncFrequency === freq ? colors.primary : colors.outline,
                    backgroundColor: syncFrequency === freq ? colors.primaryContainer : 'transparent',
                    overflow: 'hidden',
                  }}
                >
                  <Text
                    variant="bodyMedium"
                    style={{
                      color: syncFrequency === freq ? colors.primary : colors.onSurfaceVariant,
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                      textAlign: 'center',
                    }}
                  >
                    {freq}
                  </Text>
                </TouchableRipple>
              ))}
            </View>
          </SettingsItem>

          <Button
            mode="contained"
            onPress={handleSyncNow}
            style={{ backgroundColor: colors.primary }}
            labelStyle={{ color: colors.onPrimary }}
          >
            Sync Now
          </Button>
        </SettingsSection>

        <SettingsSection title="App Preferences">
          <SettingsItem
            title="Notifications"
            description="Appointment reminders and alerts"
          >
            <Switch
              value={showNotifications}
              onValueChange={toggleNotifications}
              color={colors.primary}
            />
          </SettingsItem>
        </SettingsSection>

        <SettingsSection title="Information">
          <TouchableRipple
            style={{
              padding: 16,
              backgroundColor: colors.surface,
              borderBottomWidth: 1,
              borderBottomColor: colors.outlineVariant,
            }}
            onPress={() => router.push('/about')}
            rippleColor={theme.colors.primaryContainer}
          >
            <Text variant="bodyLarge" style={{ color: colors.onSurface }}>About</Text>
          </TouchableRipple>

          <TouchableRipple
            style={{
              padding: 16,
              backgroundColor: colors.surface,
              borderBottomWidth: 1,
              borderBottomColor: colors.outlineVariant,
            }}
            onPress={() => router.push('/changelog')}
            rippleColor={theme.colors.primaryContainer}
          >
            <Text variant="bodyLarge" style={{ color: colors.onSurface }}>Changelog</Text>
          </TouchableRipple>

          <TouchableRipple
            style={{
              padding: 16,
              backgroundColor: colors.surface,
            }}
            onPress={() => router.push('/terms')}
            rippleColor={theme.colors.primaryContainer}
          >
            <Text variant="bodyLarge" style={{ color: colors.onSurface }}>
              Terms and Conditions
            </Text>
          </TouchableRipple>
        </SettingsSection>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>App Version</Text>
          <Text style={styles.versionNumber}>v0.1.6</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default Settings;