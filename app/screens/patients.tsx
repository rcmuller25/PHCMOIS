import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { CirclePlus as PlusCircle, Search, Users } from 'lucide-react-native';
import { usePatientsStore } from '../../stores/patientsStore';
// Import Patient interface directly from the store file
import type { Patient } from '../../stores/patientsStore';
import { PatientCard } from '../../components/PatientCard';
import { Text, TouchableRipple, useTheme, Surface, TextInput, Button, MD3Theme } from 'react-native-paper';

function PatientManagement() {
  const router = useRouter();
  // Use selector function to prevent unnecessary re-renders
  const patients = usePatientsStore((state) => state.patients);
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme<MD3Theme>();
  
  // Memoize filtered patients to prevent recalculation on every render
  const filteredPatients = useMemo(() => {
    return searchQuery
      ? patients.filter(patient => 
          `${patient.firstName} ${patient.surname}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patient.idNumber.includes(searchQuery)
        )
      : patients;
  }, [patients, searchQuery]);

  // Memoize styles that depend on theme to prevent recreation on every render
  const containerStyle = useMemo(() => [
    styles.container, 
    { backgroundColor: theme.colors.background }
  ], [theme.colors.background]);
  
  const searchContainerStyle = useMemo(() => [
    styles.searchContainer, 
    { 
      backgroundColor: theme.colors.surface, 
      borderBottomColor: theme.colors.outlineVariant 
    }
  ], [theme.colors.surface, theme.colors.outlineVariant]);
  
  const searchInputContainerStyle = useMemo(() => [
    styles.searchInputContainer, 
    { backgroundColor: theme.colors.surfaceVariant }
  ], [theme.colors.surfaceVariant]);
  
  const addButtonStyle = useMemo(() => [
    styles.addButton, 
    { backgroundColor: theme.colors.primary }
  ], [theme.colors.primary]);
  
  // Memoize handlers to prevent recreation on every render
  const handleAddPatient = useCallback(() => {
    router.push('/patients/add');
  }, [router]);
  
  const handlePatientPress = useCallback((id: string) => {
    router.push(`/patients/${id}`);
  }, [router]);

  // Use the imported Patient type
  
  // Memoize render item function to prevent recreation on every render
  const renderPatientItem = useCallback(({ item }: { item: Patient }) => (
    <PatientCard
      patient={item}
      onPress={() => handlePatientPress(item.id)}
    />
  ), [handlePatientPress]);

  return (
    <Surface style={containerStyle}>
      <Surface style={searchContainerStyle} elevation={1}>
        <Surface style={searchInputContainerStyle} elevation={0}>
          <Search color={theme.colors.onSurfaceVariant} size={20} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { backgroundColor: 'transparent' }]}
            placeholder="Search patients by name or ID"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
            mode="flat"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
          />
        </Surface>
        <TouchableRipple
          style={addButtonStyle}
          onPress={handleAddPatient}
          borderless
        >
          <PlusCircle color={theme.colors.onPrimary} size={20} />
        </TouchableRipple>
      </Surface>
      
      {patients.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Users color={theme.colors.primary} size={60} />
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>No Patients Yet</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginBottom: 24 }}>
            Add your first patient to start scheduling appointments
          </Text>
          <Button
            mode="contained"
            icon={({ size, color }) => <PlusCircle size={size} color={color} />}
            onPress={handleAddPatient}
            style={{ borderRadius: 8 }}
            contentStyle={{ paddingVertical: 6 }}
          >
            Add Patient
          </Button>
        </View>
      ) : (
        <FlatList
          data={filteredPatients}
          keyExtractor={(item) => item.id}
          renderItem={renderPatientItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            searchQuery ? (
              <View style={styles.noResultsContainer}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                  No patients found matching "{searchQuery}"
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </Surface>
  );
}

// Import withAuth HOC
import withAuth from '../../components/withAuth';

// Export protected component
export default withAuth(PatientManagement);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  addButton: {
    marginLeft: 12,
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  noResultsContainer: {
    padding: 24,
    alignItems: 'center',
  },
});