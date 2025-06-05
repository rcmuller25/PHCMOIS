import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Search as SearchIcon, Filter, Calendar, Users, X } from 'lucide-react-native';
import { usePatientsStore } from '../../stores/patientsStore';
import { useAppointmentsStore } from '../../stores/appointmentsStore';
import { PatientCard } from '../../components/PatientCard';
import { AppointmentCard } from '../../components/AppointmentCard';
import { Text, TextInput, TouchableRipple, useTheme, Surface, MD3Theme, Chip, Button, IconButton, Divider } from 'react-native-paper';

type SearchType = 'all' | 'patients' | 'appointments';
type FilterType = {
  dateRange: { start: string | null; end: string | null };
  categories: string[];
};

// Define service categories
const SERVICE_CATEGORIES = [
  'Immunisation',
  'Family Planning',
  'Chronic',
  'Uncontrolled',
  'TB',
  'Art',
  'IMCI',
  'Acute',
  'ANC'
];

export default function SearchScreen() {
  const router = useRouter();
  const patients = usePatientsStore((state) => state.patients);
  const appointments = useAppointmentsStore((state) => state.appointments);
  const theme = useTheme<MD3Theme>();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterType>({
    dateRange: { start: null, end: null },
    categories: [],
  });
  
  // Filter results based on search query and type
  const getFilteredResults = () => {
    if (!searchQuery.trim()) return { patients: [], appointments: [] };
    
    // Filter patients
    const filteredPatients = searchType !== 'appointments' 
      ? patients.filter(patient => 
          `${patient.firstName} ${patient.surname}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patient.idNumber.includes(searchQuery)
        )
      : [];
    
    // Filter appointments
    const filteredAppointments = searchType !== 'patients'
      ? appointments.filter(appointment => {
          // Filter by patient name
          const patientNameMatch = appointment.patientName.toLowerCase().includes(searchQuery.toLowerCase());
          
          // Filter by date range if set
          const dateMatch = !filters.dateRange.start || !filters.dateRange.end 
            ? true 
            : appointment.date >= filters.dateRange.start && appointment.date <= filters.dateRange.end;
          
          // Filter by categories if any selected
          const categoryMatch = filters.categories.length === 0 
            ? true 
            : filters.categories.includes(appointment.category);
          
          return patientNameMatch && dateMatch && categoryMatch;
        })
      : [];
    
    return { patients: filteredPatients, appointments: filteredAppointments };
  };
  
  const { patients: filteredPatients, appointments: filteredAppointments } = getFilteredResults();
  
  // Toggle category filter
  const toggleCategory = (category: string) => {
    if (filters.categories.includes(category)) {
      setFilters({
        ...filters,
        categories: filters.categories.filter(c => c !== category),
      });
    } else {
      setFilters({
        ...filters,
        categories: [...filters.categories, category],
      });
    }
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      dateRange: { start: null, end: null },
      categories: [],
    });
  };

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.background }]} elevation={0}>
      <Surface style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant }]} elevation={1}>
        <Surface style={[styles.searchInputContainer, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
          <SearchIcon color={theme.colors.onSurfaceVariant} size={20} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.onSurface }]}
            placeholder="Search patients or appointments"
            value={searchQuery}
            onChangeText={setSearchQuery}
            mode="flat"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
          />
          {searchQuery ? (
            <IconButton
              icon={() => <X color={theme.colors.onSurfaceVariant} size={18} />}
              onPress={() => setSearchQuery('')}
              size={20}
            />
          ) : null}
        </Surface>
        <TouchableRipple
          style={[styles.filterButton, { backgroundColor: theme.colors.surfaceVariant }]}
          onPress={() => setShowFilters(!showFilters)}
          borderless
        >
          <Filter color={theme.colors.onSurfaceVariant} size={20} />
        </TouchableRipple>
      </Surface>
      
      {showFilters && (
        <Surface style={[styles.filtersContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant }]} elevation={1}>
          <View style={styles.filterHeader}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>Filters</Text>
            <Button mode="text" onPress={resetFilters} compact>
              Reset
            </Button>
          </View>
          
          <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>Search in</Text>
          <View style={styles.searchTypeContainer}>
            <Chip
              mode="flat"
              selected={searchType === 'all'}
              onPress={() => setSearchType('all')}
              style={{ marginRight: 8 }}
              icon={() => <SearchIcon color={searchType === 'all' ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant} size={16} />}
            >
              All
            </Chip>
            <Chip
              mode="flat"
              selected={searchType === 'patients'}
              onPress={() => setSearchType('patients')}
              style={{ marginRight: 8 }}
              icon={() => <Users color={searchType === 'patients' ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant} size={16} />}
            >
              Patients
            </Chip>
            <Chip
              mode="flat"
              selected={searchType === 'appointments'}
              onPress={() => setSearchType('appointments')}
              style={{ marginRight: 8 }}
              icon={() => <Calendar color={searchType === 'appointments' ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant} size={16} />}
            >
              Appointments
            </Chip>
          </View>
          
          {searchType !== 'patients' && (
            <>
              <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16, marginBottom: 8 }}>Categories</Text>
              <View style={styles.categoriesContainer}>
                {SERVICE_CATEGORIES.map((category) => (
                  <Chip
                    key={category}
                    mode="flat"
                    selected={filters.categories.includes(category)}
                    onPress={() => toggleCategory(category)}
                    style={{ marginRight: 8, marginBottom: 8 }}
                  >
                    {category}
                  </Chip>
                ))}
              </View>
            </>
          )}
        </Surface>
      )}
      
      <ScrollView style={styles.resultsContainer} contentContainerStyle={styles.resultsContent}>
        {!searchQuery ? (
          <View style={styles.emptyStateContainer}>
            <SearchIcon color={theme.colors.outline} size={48} />
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginTop: 16, marginBottom: 8 }}>Search for patients or appointments</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              Enter a patient name, ID number, or appointment details to find what you're looking for
            </Text>
          </View>
        ) : (
          <>
            {(searchType === 'all' || searchType === 'patients') && filteredPatients.length > 0 && (
              <View style={styles.resultSection}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 12 }}>Patients ({filteredPatients.length})</Text>
                {filteredPatients.map((patient) => (
                  <PatientCard
                    key={`patient-${patient.id}`}
                    patient={patient}
                    onPress={() => router.push(`/patients/${patient.id}`)}
                  />
                ))}
              </View>
            )}
            
            {filteredPatients.length > 0 && filteredAppointments.length > 0 && (
              <Divider style={{ marginVertical: 16 }} />
            )}
            
            {(searchType === 'all' || searchType === 'appointments') && filteredAppointments.length > 0 && (
              <View style={styles.resultSection}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 12 }}>Appointments ({filteredAppointments.length})</Text>
                {filteredAppointments.map((appointment) => (
                  <AppointmentCard
                    key={`appointment-${appointment.id}`}
                    appointment={appointment}
                    onPress={() => router.push(`/appointments/${appointment.id}`)}
                  />
                ))}
              </View>
            )}
            
            {(filteredPatients.length === 0 && filteredAppointments.length === 0) && (
              <View style={styles.noResultsContainer}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>No results found</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                  Try adjusting your search or filters
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Surface>
  );
}

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
    fontSize: 16,
  },
  filterButton: {
    marginLeft: 12,
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    borderBottomWidth: 1,
    padding: 16,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchTypeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsContent: {
    padding: 16,
  },
  resultSection: {
    marginBottom: 16,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    marginTop: 40,
  },
  noResultsContainer: {
    padding: 24,
    alignItems: 'center',
  },
});