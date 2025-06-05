import React, { useState, useMemo, useCallback, memo } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ChevronLeft, ChevronDown } from 'lucide-react-native';
import { usePatientsStore } from '../../stores/patientsStore';
import { FormField } from '../../components/FormField';
import { AppointmentPicker } from '../../components/AppointmentPicker';
import { Calendar } from '../../components/Calendar';
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
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// ID Type options
const ID_TYPES = ['ID Number', 'Passport Number'];

// Gender options
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

// Format date for display
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export default function AddPatient() {
  const router = useRouter();
  const { addPatient } = usePatientsStore();

  // Form state
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [idType, setIdType] = useState('ID Number');
  const [idNumber, setIdNumber] = useState('');
  const [address, setAddress] = useState('');
  const [primaryContact, setPrimaryContact] = useState('');
  const [secondaryContact, setSecondaryContact] = useState('');

  // Picker visibility state
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showIdTypePicker, setShowIdTypePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

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
    if (!firstName || !surname || !gender || !dateOfBirth || !idNumber || !address) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return false;
    }

    if (!validateIdNumber(idNumber)) {
      Alert.alert(
        'Invalid ID Format', 
        idType === 'ID Number' ? 'South African ID number must be 13 digits.' : 'Please enter a valid passport number.'
      );
      return false;
    }

    return true;
  };

  // Handle form submission - Optimized with error handling
  const handleSubmit = useCallback(() => {
    if (!validateForm()) return;

    try {
      // Create new patient with sanitized data
      const newPatient = {
        id: Date.now().toString(),
        firstName: firstName.trim(),
        surname: surname.trim(),
        gender,
        dateOfBirth,
        idType,
        idNumber: idNumber.trim(),
        address: address.trim(),
        primaryContact: primaryContact.trim(),
        secondaryContact: secondaryContact.trim(),
        createdAt: new Date().toISOString(),
        email: `${firstName.toLowerCase().trim()}.${surname.toLowerCase().trim()}@example.com`,
        phone: primaryContact.trim()
      };

      // Add patient to store
      addPatient(newPatient);

      // Show success message
      Alert.alert(
        'Patient Added', 
        'The patient has been successfully added.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error adding patient:', error);
      Alert.alert(
        'Error', 
        'There was an error adding the patient. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [firstName, surname, gender, dateOfBirth, idType, idNumber, address, primaryContact, secondaryContact, validateForm, addPatient, router]);

  const theme = useTheme<MD3Theme>();

  return (
    <>
      <Stack.Screen 
        options={{
          headerTitle: 'Add New Patient',
          headerLeft: () => (
            <IconButton
              icon={() => <ChevronLeft color={theme.colors.onSurface} size={24} />}
              onPress={() => router.back()}
              style={styles.backButton}
            />
          ),
          headerTitleStyle: {
            color: theme.colors.onSurface,
            fontFamily: theme.fonts.titleMedium.fontFamily,
            fontSize: theme.fonts.titleMedium.fontSize,
            fontWeight: theme.fonts.titleMedium.fontWeight,
          },
          headerShadowVisible: false,
        }} 
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.contentContainer}
        >  
          <Surface style={[styles.formContainer, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
              Personal Information
            </Text>

            {/* First Name - Optimized */}
            <FormField label="First Name" required>
              <Input
                mode="outlined"
                placeholder="Enter first name"
                value={firstName}
                onChangeText={useCallback((text: string) => setFirstName(text), [])}
                style={useMemo(() => ({ backgroundColor: theme.colors.surface }), [theme.colors.surface])}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </FormField>

            {/* Surname - Optimized */}
            <FormField label="Surname" required>
              <Input
                mode="outlined"
                placeholder="Enter surname"
                value={surname}
                onChangeText={useCallback((text: string) => setSurname(text), [])}
                style={useMemo(() => ({ backgroundColor: theme.colors.surface }), [theme.colors.surface])}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </FormField>

            {/* Gender - Optimized */}
            <FormField label="Gender" required>
              <TouchableRipple
                onPress={() => setShowGenderPicker(true)}
                style={useMemo(() => [
                  styles.pickerButton, 
                  { borderColor: theme.colors.outline }
                ], [theme.colors.outline])}
              >
                <View style={styles.pickerContent}>
                  <Text style={useMemo(() => ({ 
                    color: gender ? theme.colors.onSurface : theme.colors.outline 
                  }), [gender, theme.colors.onSurface, theme.colors.outline])}>
                    {gender || 'Select Gender'}
                  </Text>
                  <ChevronDown size={20} color={theme.colors.outline} />
                </View>
              </TouchableRipple>
            </FormField>

            {/* Date of Birth - Optimized */}
            <FormField label="Date of Birth" required>
              <TouchableRipple
                onPress={() => setShowDatePicker(true)}
                style={useMemo(() => [
                  styles.pickerButton, 
                  { borderColor: theme.colors.outline }
                ], [theme.colors.outline])}
              >
                <View style={styles.pickerContent}>
                  <Text style={useMemo(() => ({ 
                    color: dateOfBirth ? theme.colors.onSurface : theme.colors.outline 
                  }), [dateOfBirth, theme.colors.onSurface, theme.colors.outline])}>
                    {dateOfBirth ? formatDate(dateOfBirth) : 'Select Date of Birth'}
                  </Text>
                  <ChevronDown size={20} color={theme.colors.outline} />
                </View>
              </TouchableRipple>
            </FormField>

            {/* ID Type and Number - Optimized */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {/* ID Type */}
              <View style={{ flex: 1 }}>
                <FormField label="ID Type" required>
                  <TouchableRipple
                    onPress={() => setShowIdTypePicker(true)}
                    style={useMemo(() => [
                      styles.pickerButton, 
                      { borderColor: theme.colors.outline }
                    ], [theme.colors.outline])}
                  >
                    <View style={styles.pickerContent}>
                      <Text style={useMemo(() => ({ 
                        color: theme.colors.onSurface 
                      }), [theme.colors.onSurface])}>
                        {idType}
                      </Text>
                      <ChevronDown size={20} color={theme.colors.outline} />
                    </View>
                  </TouchableRipple>
                </FormField>
              </View>

              {/* ID Number */}
              <View style={{ flex: 2 }}>
                <FormField label={idType} required>
                  <TextInput
                    mode="outlined"
                    placeholder={`Enter ${idType}`}
                    value={idNumber}
                    onChangeText={setIdNumber}
                    keyboardType={idType === 'ID Number' ? 'numeric' : 'default'}
                    style={useMemo(() => ({ backgroundColor: theme.colors.surface }), [theme.colors.surface])}
                    maxLength={idType === 'ID Number' ? 13 : undefined}
                  />
                </FormField>
              </View>
            </View>


          </Surface>

          <Surface style={[styles.formContainer, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
              Contact Information
            </Text>

            {/* Address - Optimized */}
            <FormField label="Address" required>
              <TextInput
                mode="outlined"
                placeholder="Enter address"
                value={address}
                onChangeText={useCallback((text: string) => setAddress(text), [])}
                multiline
                numberOfLines={3}
                style={useMemo(() => ({ backgroundColor: theme.colors.surface }), [theme.colors.surface])}
                returnKeyType="next"
              />
            </FormField>

            {/* Primary Contact - Optimized */}
            <FormField label="Primary Contact (Optional)">
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
              Add Patient
            </Button>
          </View>
        </ScrollView>

        {/* Gender Picker Modal - Optimized */}
        <AppointmentPicker
          visible={showGenderPicker}
          title="Select Gender"
          data={useMemo(() => GENDERS, [])}
          onSelect={useCallback((item) => {
            setGender(item);
            setShowGenderPicker(false);
          }, [])}
          onClose={useCallback(() => setShowGenderPicker(false), [])}
        />

        {/* ID Type Picker Modal - Optimized */}
        <AppointmentPicker
          visible={showIdTypePicker}
          title="Select ID Type"
          data={useMemo(() => ID_TYPES, [])}
          onSelect={useCallback((item) => {
            setIdType(item);
            // Clear ID number when switching type
            setIdNumber('');
            setShowIdTypePicker(false);
          }, [])}
          onClose={useCallback(() => setShowIdTypePicker(false), [])}
        />

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
  }
});