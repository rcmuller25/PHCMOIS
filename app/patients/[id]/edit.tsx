import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  TouchableOpacity
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronDown } from 'lucide-react-native';
import { usePatientsStore } from '../../../stores/patientsStore';
import { FormField } from '../../../components/FormField';
import { AppointmentPicker } from '../../../components/AppointmentPicker';
import { Calendar } from '../../../components/Calendar';
import { 
  Text, 
  TextInput, 
  TouchableRipple, 
  Button, 
  Surface, 
  useTheme, 
  IconButton,
  MD3Theme
} from 'react-native-paper';
import { BackButton } from '../../../components/BackButton';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { validatePatient } from '../../../utils/patientValidation';

// ID Type options
const ID_TYPES = ['ID Number', 'Passport'] as const;
type IdType = typeof ID_TYPES[number];

// Gender options
const GENDERS = ['male', 'female', 'other'] as const;
type Gender = typeof GENDERS[number];

// Format date for display
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export default function EditPatient() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const theme = useTheme<MD3Theme>();
  const { patients, updatePatient } = usePatientsStore();
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContainer: {
      flex: 1,
    },
    contentContainer: {
      padding: 16,
      gap: 16,
    },
    formContainer: {
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
    },
    backButton: {
      marginRight: 8,
    },
    pickerButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 4,
      paddingHorizontal: 12,
      paddingVertical: 14,
      height: 56,
    },
    pickerContent: {
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      width: '100%'
    },
    buttonContainer: {
      marginTop: 24,
      marginBottom: 40,
    },
    calendarContainer: {
      padding: 16,
    },
    confirmButton: {
      marginTop: 16,
    },
    picker: {
      width: '100%',
      height: 50,
      backgroundColor: theme.colors.surface,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      padding: 20,
      borderRadius: 12,
      width: '80%',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
      color: theme.colors.onSurface,
    },
    modalItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
      width: '100%',
    },
    modalItemText: {
      fontSize: 16,
      color: theme.colors.onSurface,
    },
  });
  
  // Find the patient to edit
  const patient = usePatientsStore((state) => 
    state.patients.find(p => p.id === id)
  );

  // Form state
  const [firstName, setFirstName] = useState(patient?.firstName || '');
  const [surname, setSurname] = useState(patient?.surname || '');
  const [gender, setGender] = useState<Gender>(patient?.gender as Gender || 'male');
  const [dateOfBirth, setDateOfBirth] = useState(patient?.dateOfBirth || '');
  const [idType, setIdType] = useState<IdType>(patient?.idType as IdType || 'ID Number');
  const [idNumber, setIdNumber] = useState(patient?.idNumber || '');
  const [address, setAddress] = useState(patient?.address || '');
  const [primaryContact, setPrimaryContact] = useState(patient?.primaryContact || '');
  const [secondaryContact, setSecondaryContact] = useState(patient?.secondaryContact || '');

  // Picker visibility state
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showIdTypePicker, setShowIdTypePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Memoized arrays for pickers
  const genderOptions = useMemo(() => [...GENDERS], []);
  const idTypeOptions = useMemo(() => [...ID_TYPES], []);

  // Load patient data when component mounts
  useEffect(() => {
    if (patient) {
      setFirstName(patient.firstName);
      setSurname(patient.surname);
      setGender(patient.gender as Gender);
      setDateOfBirth(patient.dateOfBirth);
      setIdType(patient.idType as IdType);
      setIdNumber(patient.idNumber);
      setAddress(patient.address);
      setPrimaryContact(patient.primaryContact);
      setSecondaryContact(patient.secondaryContact || '');
    } else {
      // If patient not found, go back
      Alert.alert('Error', 'Patient not found');
      router.back();
    }
  }, [patient, router]);

  // Validate ID Number format
  const validateIdNumber = (id: string): boolean => {
    if (idType === 'ID Number') {
      // South African ID number is 13 digits
      return /^\d{13}$/.test(id);
    }
    // Passport can be more flexible but at least 6 characters
    return id.length >= 6;
  };

  // Validate form
  const validateForm = (): boolean => {
    const validation = validatePatient(
      firstName,
      surname,
      gender,
      dateOfBirth,
      idType,
      idNumber,
      address,
      primaryContact,
      secondaryContact
    );

    if (!validation.isValid) {
      Alert.alert(
        'Validation Error',
        validation.errors.map(error => error.message).join('\n')
      );
      return false;
    }

    return true;
  };

  // Handle form submission - Optimized with error handling
  const handleSubmit = useCallback(() => {
    if (!validateForm()) return;

    try {
      // Update patient with sanitized data
      const updatedPatient = {
        ...patient,
        firstName: firstName.trim(),
        surname: surname.trim(),
        gender,
        dateOfBirth,
        idType,
        idNumber: idNumber.trim(),
        address: address.trim(),
        primaryContact: primaryContact.trim(),
        secondaryContact: secondaryContact?.trim(),
        updatedAt: new Date().toISOString(),
      };

      // Update patient in store
      updatePatient(id as string, updatedPatient);

      // Show success message
      Alert.alert(
        'Patient Updated', 
        'The patient information has been successfully updated.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error updating patient:', error);
      Alert.alert(
        'Error', 
        'There was an error updating the patient. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [
    firstName, surname, gender, dateOfBirth, idType, idNumber, 
    address, primaryContact, secondaryContact, id, patient, 
    updatePatient, router
  ]);

  // If patient not loaded yet, show loading
  if (!patient) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Edit Patient',
          headerLeft: () => <BackButton />,
          headerShadowVisible: false,
        }} 
      />
      
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Surface style={[styles.formContainer, { backgroundColor: theme.colors.surface, elevation: 1 }]}>
            <Text 
              variant="titleMedium" 
              style={{ marginBottom: 16, color: theme.colors.onSurface }}
            >
              Personal Information
            </Text>

            {/* First Name - Optimized */}
            <FormField label="First Name *">
              <TextInput
                mode="outlined"
                placeholder="Enter first name"
                value={firstName}
                onChangeText={useCallback((text: string) => setFirstName(text), [])}
                style={useMemo(() => ({ backgroundColor: theme.colors.surface }), [theme.colors.surface])}
                autoCapitalize="words"
                maxLength={50}
                returnKeyType="next"
              />
            </FormField>

            {/* Surname - Optimized */}
            <FormField label="Surname *">
              <TextInput
                mode="outlined"
                placeholder="Enter surname"
                value={surname}
                onChangeText={useCallback((text: string) => setSurname(text), [])}
                style={useMemo(() => ({ backgroundColor: theme.colors.surface }), [theme.colors.surface])}
                autoCapitalize="words"
                maxLength={50}
                returnKeyType="next"
              />
            </FormField>

            {/* Gender Selector - Optimized */}
            <FormField label="Gender *">
              <TouchableRipple
                onPress={useCallback(() => setShowGenderPicker(true), [])}
                style={useMemo(() => [
                  styles.pickerButton, 
                  { 
                    borderColor: theme.colors.outline,
                    backgroundColor: theme.colors.surface 
                  }
                ], [theme.colors.outline, theme.colors.surface])}
              >
                <View style={styles.pickerContent}>
                  <Text style={{ color: gender ? theme.colors.onSurface : theme.colors.onSurfaceVariant }}>
                    {gender || 'Select gender'}
                  </Text>
                  <ChevronDown size={20} color={theme.colors.onSurfaceVariant} />
                </View>
              </TouchableRipple>
            </FormField>

            {/* Date of Birth - Optimized */}
            <FormField label="Date of Birth *">
              <TouchableRipple
                onPress={useCallback(() => setShowDatePicker(true), [])}
                style={useMemo(() => [
                  styles.pickerButton, 
                  { 
                    borderColor: theme.colors.outline,
                    backgroundColor: theme.colors.surface 
                  }
                ], [theme.colors.outline, theme.colors.surface])}
              >
                <View style={styles.pickerContent}>
                  <Text style={{ color: dateOfBirth ? theme.colors.onSurface : theme.colors.onSurfaceVariant }}>
                    {dateOfBirth ? formatDate(dateOfBirth) : 'Select date of birth'}
                  </Text>
                  <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.onSurfaceVariant} />
                </View>
              </TouchableRipple>
            </FormField>

            {/* ID Type Selector - Optimized */}
            <FormField label="ID Type *">
              <TouchableRipple
                onPress={useCallback(() => setShowIdTypePicker(true), [])}
                style={useMemo(() => [
                  styles.pickerButton, 
                  { 
                    borderColor: theme.colors.outline,
                    backgroundColor: theme.colors.surface 
                  }
                ], [theme.colors.outline, theme.colors.surface])}
              >
                <View style={styles.pickerContent}>
                  <Text style={{ color: theme.colors.onSurface }}>
                    {idType}
                  </Text>
                  <ChevronDown size={20} color={theme.colors.onSurfaceVariant} />
                </View>
              </TouchableRipple>
            </FormField>

            {/* ID Number - Optimized */}
            <FormField label="ID Number *">
              <TextInput
                mode="outlined"
                placeholder={`Enter ${idType.toLowerCase()}`}
                value={idNumber}
                onChangeText={useCallback((text: string) => setIdNumber(text), [])}
                style={useMemo(() => ({ backgroundColor: theme.colors.surface }), [theme.colors.surface])}
                keyboardType={idType === 'ID Number' ? 'numeric' : 'default'}
                maxLength={idType === 'ID Number' ? 13 : 20}
                returnKeyType="next"
              />
            </FormField>

            {/* Address - Optimized */}
            <FormField label="Address *">
              <TextInput
                mode="outlined"
                placeholder="Enter address"
                value={address}
                onChangeText={useCallback((text: string) => setAddress(text), [])}
                style={useMemo(() => ({ backgroundColor: theme.colors.surface }), [theme.colors.surface])}
                multiline
                numberOfLines={3}
                maxLength={200}
                returnKeyType="next"
              />
            </FormField>

            {/* Primary Contact - Optimized */}
            <FormField label="Primary Contact">
              <TextInput
                mode="outlined"
                placeholder="Enter primary contact number"
                value={primaryContact}
                onChangeText={useCallback((text: string) => setPrimaryContact(text), [])}
                keyboardType="phone-pad"
                style={useMemo(() => ({ backgroundColor: theme.colors.surface }), [theme.colors.surface])}
                maxLength={15}
                returnKeyType="next"
              />
            </FormField>

            {/* Secondary Contact - Optimized */}
            <FormField label="Secondary Contact (Optional)">
              <TextInput
                mode="outlined"
                placeholder="Enter secondary contact number"
                value={secondaryContact}
                onChangeText={useCallback((text: string) => setSecondaryContact(text), [])}
                keyboardType="phone-pad"
                style={useMemo(() => ({ backgroundColor: theme.colors.surface }), [theme.colors.surface])}
                maxLength={15}
                returnKeyType="done"
              />
            </FormField>
          </Surface>

          <View style={styles.buttonContainer}>
            <Button 
              mode="contained"
              onPress={handleSubmit}
              style={{ borderRadius: 8 }}
              contentStyle={{ paddingVertical: 6 }}
            >
              Update Patient
            </Button>
          </View>
        </ScrollView>

        <Modal
          visible={showGenderPicker}
          transparent
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Gender</Text>
              {genderOptions.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.modalItem}
                  onPress={() => {
                    setGender(item as Gender);
                    setShowGenderPicker(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        <Modal
          visible={showIdTypePicker}
          transparent
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select ID Type</Text>
              {idTypeOptions.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.modalItem}
                  onPress={() => {
                    setIdType(item as IdType);
                    setShowIdTypePicker(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        {/* Date Picker Modal - Optimized */}
        <AppointmentPicker
          visible={showDatePicker}
          title="Select Date of Birth"
          data={[]}
          onSelect={() => {}} // Required by type but handled in customContent
          customContent={
            <View style={styles.calendarContainer}>
              <Calendar 
                date={dateOfBirth ? new Date(dateOfBirth) : new Date()}
                onSelect={useCallback((selectedDate) => {
                  setDateOfBirth(selectedDate.toISOString().split('T')[0]);
                  setShowDatePicker(false);
                }, [])}
              />
              <Button 
                mode="contained" 
                onPress={useCallback(() => setShowDatePicker(false), [])}
                style={styles.confirmButton}
              >
                Confirm
              </Button>
            </View>
          }
          onClose={useCallback(() => setShowDatePicker(false), [])}
        />
      </KeyboardAvoidingView>
    </>
  );
}
