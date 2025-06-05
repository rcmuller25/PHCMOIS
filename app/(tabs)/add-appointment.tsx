import React, { useState, useCallback, useMemo, memo } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView,
  Platform,
  Alert,
  ViewStyle,
  TextStyle,
  ImageStyle,
  StyleProp
} from 'react-native'; 
import { Calendar as CalendarIcon, ChevronDown, User, Clock, List, MessageSquare } from 'lucide-react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useAppointmentsStore } from '../../stores/appointmentsStore';
import { usePatientsStore } from '../../stores/patientsStore';
import { AppointmentPicker } from '../../components/AppointmentPicker';
import { formatDate } from '../../utils/dateUtils';
import { validateAppointment } from '../../utils/appointmentValidation';
import {
  Text,
  TextInput,
  TouchableRipple,
  Button,
  Surface,
  useTheme,
  IconButton,
  MD3Theme,
  Modal
} from 'react-native-paper';
import { Select } from '../../components/Select';
import { FormField } from '../../components/FormField';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

interface ServiceCategory {
  id: string;
  label: string;
  icon: string;
}

interface Patient {
  id: string;
  firstName: string;
  surname: string;
}

interface Appointment {
  id: string;
  date: string;
  timeSlot: string;
  category: string;
  patientId: string;
  patientName: string;
  notes: string;
  createdAt: string;
}

// Define service categories
const SERVICE_CATEGORIES = [
  { id: 'immunisation', label: 'Immunisation', icon: 'needle' },
  { id: 'family_planning', label: 'Family Planning', icon: 'account-group' },
  { id: 'chronic', label: 'Chronic', icon: 'heart-pulse' },
  { id: 'uncontrolled', label: 'Uncontrolled', icon: 'alert-circle' },
  { id: 'tb', label: 'TB', icon: 'lungs' },
  { id: 'art', label: 'ART', icon: 'medical-bag' },
  { id: 'imci', label: 'IMCI', icon: 'baby-face' },
  { id: 'acute', label: 'Acute', icon: 'alert' },
  { id: 'anc', label: 'ANC', icon: 'human-pregnant' },
  { id: 'dental', label: 'Dental', icon: 'tooth' },
  { id: 'mental_health', label: 'Mental Health', icon: 'brain' },
  { id: 'physiotherapy', label: 'Physiotherapy', icon: 'human-handsup' },
  { id: 'optometry', label: 'Optometry', icon: 'eye' },
  { id: 'nutrition', label: 'Nutrition', icon: 'food-apple' },
  { id: 'vaccination', label: 'Vaccination', icon: 'shield-plus' },
  { id: 'screening', label: 'Screening', icon: 'magnify-scan' },
  { id: 'wound_care', label: 'Wound Care', icon: 'bandage' },
  { id: 'emergency', label: 'Emergency', icon: 'ambulance' },
];

// Define time slots (hourly from 8 AM to 4 PM)
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', 
  '12:00', '13:00', '14:00', '15:00'
];

// Calendar component for date selection
function Calendar({ date, onSelect }: { date: Date; onSelect: (date: Date) => void }) {
  const theme = useTheme<MD3Theme>();
  const [currentMonth, setCurrentMonth] = useState(new Date(date));
  const [selectedDate, setSelectedDate] = useState(date);
  
  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  // Get first day of month
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };
  
  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Add days of the month
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isSelected = date.toDateString() === selectedDate.toDateString();
      const isPast = date < today;
      const isToday = date.toDateString() === today.toDateString();
      
      days.push({
        date,
        isSelected,
        isPast,
        isToday
      });
    }
    
    return days;
  };
  
  // Navigate to previous month
  const goToPreviousMonth = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  };
  
  const calendarDays = generateCalendarDays();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return (
    <Surface style={calendarStyles.container} elevation={1}>
      <View style={calendarStyles.header}>
        <IconButton
          icon="chevron-left"
          size={24}
          onPress={goToPreviousMonth}
          iconColor={theme.colors.onSurface}
        />
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>
        <IconButton
          icon="chevron-right"
          size={24}
          onPress={goToNextMonth}
          iconColor={theme.colors.onSurface}
        />
      </View>
      
      <View style={calendarStyles.daysHeader}>
        {dayNames.map((day) => (
          <Text key={day} variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {day}
          </Text>
        ))}
      </View>
      
      <View style={calendarStyles.daysGrid}>
        {calendarDays.map((day, index) => (
          <TouchableRipple
            key={index}
            style={[
              calendarStyles.dayCell,
              day?.isSelected && { backgroundColor: theme.colors.primaryContainer },
              day?.isToday && !day?.isSelected && { borderWidth: 1, borderColor: theme.colors.primary },
              !day && { opacity: 0 }
            ]}
            onPress={() => {
              if (day && !day.isPast) {
                setSelectedDate(day.date);
                onSelect(day.date);
              }
            }}
            disabled={!day || day.isPast}
            rippleColor={theme.colors.primary}
          >
            {day ? (
              <Text
                variant="bodyMedium"
                style={[
                  { textAlign: 'center' },
                  day.isPast && { color: theme.colors.outline },
                  day.isSelected && { color: theme.colors.onPrimaryContainer, fontWeight: '700' },
                  day.isToday && !day.isSelected && { color: theme.colors.primary }
                ]}
              >
                {day.date.getDate()}
              </Text>
            ) : <Text> </Text>}
          </TouchableRipple>
        ))}
      </View>
    </Surface>
  );
}

const calendarStyles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  daysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    borderRadius: 20,
  },
});

const AddAppointment = () => {
  const router = useRouter();
  const theme = useTheme<MD3Theme>();
  const { addAppointment } = useAppointmentsStore();
  const patients = usePatientsStore((state) => state.patients);
  const appointments = useAppointmentsStore((state) => state.appointments);
  
  // Form state
  const [date, setDate] = useState<Date | string>('');
  const [timeSlot, setTimeSlot] = useState('');
  const [category, setCategory] = useState('');
  const [patientId, setPatientId] = useState('');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState(30); // Default duration in minutes
  
  // Picker visibility state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPatientPicker, setShowPatientPicker] = useState(false);

  // Get patient name from patient ID
  const getPatientName = (id: string) => {
    const patient = patients.find(p => p.id === id);
    return patient ? `${patient.firstName} ${patient.surname}` : '';
  };
  
  // Format patient for display in picker
  const formatPatientForDisplay = (patient: any) => {
    return `${patient.firstName} ${patient.surname} (${patient.idNumber})`;
  };

  // Check if the selected time slot is available
  const checkSlotAvailability = () => {
    if (!date || !timeSlot || !category) return true;
    
    const slotAppointments = appointments.filter(
      (appointment: any) => appointment.date === date && 
                     appointment.timeSlot === timeSlot && 
                     appointment.category === category
    );
    
    // Each slot can accommodate up to 4 patients
    return slotAppointments.length < 4;
  };
  
  // Handle form submission
  const handleSubmit = () => {
    // Validate appointment data
    const validation = validateAppointment(
      patientId,
      typeof date === 'string' ? date : date.toISOString().split('T')[0],
      timeSlot,
      category,
      'scheduled', // Default status for new appointments
      duration,
      notes
    );

    if (!validation.isValid) {
      Alert.alert(
        'Validation Error',
        validation.errors.map(error => error.message).join('\n')
      );
      return;
    }
    
    // Check slot availability
    if (!checkSlotAvailability()) {
      Alert.alert(
        'Slot Unavailable', 
        'This time slot is already full. Please select another time or category.'
      );
      return;
    }
    
    // Create new appointment
    const newAppointment = {
      id: Date.now().toString(),
      date: typeof date === 'string' ? date : date.toISOString().split('T')[0],
      timeSlot,
      category,
      patientId,
      patientName: getPatientName(patientId),
      notes,
      duration,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    };
    
    // Add appointment to store
    addAppointment(newAppointment);
    
    // Show success message and navigate back to home tab
    Alert.alert(
      'Appointment Created', 
      'The appointment has been successfully created.',
      [{ text: 'OK', onPress: () => router.replace('/') }]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
      >
        <Text variant="headlineMedium" style={{ marginBottom: 24, color: theme.colors.onBackground }}>Add New Appointment</Text>
        
        <Surface style={{ padding: 16, borderRadius: 12, marginBottom: 16 }} elevation={1}>
          <View style={{ gap: 16 }}>
            {/* Date Picker */}
            <TouchableRipple
              onPress={() => setShowDatePicker(true)}
              style={{ borderRadius: 8 }}
              rippleColor={theme.colors.primary}
            >
              <View style={[styles.inputContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                <CalendarIcon size={20} color={theme.colors.onSurfaceVariant} style={{ marginRight: 12 }} />
                <Text 
                  variant="bodyLarge" 
                  style={{ color: date ? theme.colors.onSurfaceVariant : theme.colors.outline }}
                >
                  {date ? formatDate(new Date(date as string)) : 'Select date'}
                </Text>
                <ChevronDown size={20} color={theme.colors.onSurfaceVariant} style={{ marginLeft: 'auto' }} />
              </View>
            </TouchableRipple>

            {showDatePicker && (
              <Calendar 
                date={date ? new Date(date as string) : new Date()} 
                onSelect={(selectedDate) => {
                  setDate(selectedDate.toISOString());
                  setShowDatePicker(false);
                }} 
              />
            )}

            {/* Time Slot Picker */}
            <TouchableRipple
              onPress={() => setShowTimePicker(true)}
              style={{ borderRadius: 8 }}
              rippleColor={theme.colors.primary}
            >
              <View style={[styles.inputContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Clock size={20} color={theme.colors.onSurfaceVariant} style={{ marginRight: 12 }} />
                <Text 
                  variant="bodyLarge" 
                  style={{ color: timeSlot ? theme.colors.onSurfaceVariant : theme.colors.outline }}
                >
                  {timeSlot || 'Select time slot'}
                </Text>
                <ChevronDown size={20} color={theme.colors.onSurfaceVariant} style={{ marginLeft: 'auto' }} />
              </View>
            </TouchableRipple>

            {/* Category Picker */}
            <FormField label="Category" required>
              <TouchableRipple
                onPress={() => setShowCategoryPicker(true)}
                style={{ borderRadius: 8 }}
                rippleColor={theme.colors.primary}
              >
                <View style={[styles.inputContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <List size={20} color={theme.colors.onSurfaceVariant} style={{ marginRight: 12 }} />
                  <Text 
                    variant="bodyLarge" 
                    style={{ color: category ? theme.colors.onSurfaceVariant : theme.colors.outline }}
                  >
                    {category ? SERVICE_CATEGORIES.find(c => c.id === category)?.label : 'Select category'}
                  </Text>
                  <ChevronDown size={20} color={theme.colors.onSurfaceVariant} style={{ marginLeft: 'auto' }} />
                </View>
              </TouchableRipple>
            </FormField>

            {/* Patient Picker */}
            <TouchableRipple
              onPress={() => setShowPatientPicker(true)}
              style={{ borderRadius: 8 }}
              rippleColor={theme.colors.primary}
            >
              <View style={styles.inputContainer}>
                <User size={24} color={theme.colors.onSurfaceVariant} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputText}
                  placeholder="Select Patient"
                  value={getPatientName(patientId)}
                  editable={false}
                />
                <TouchableRipple 
                  onPress={() => {
                    if (patients.length === 0) {
                      Alert.alert(
                        'No Patients', 
                        'You need to add patients first before creating an appointment.',
                        [{ text: 'OK' }]
                      );
                      return;
                    }
                    setShowPatientPicker(true);
                  }}
                >
                  <ChevronDown size={20} color={theme.colors.onSurfaceVariant} />
                </TouchableRipple>
              </View>
            </TouchableRipple>

            {/* Notes Input */}
            <View style={[styles.inputContainer, { minHeight: 120, backgroundColor: theme.colors.surfaceVariant }]}>
              <MessageSquare size={20} color={theme.colors.onSurfaceVariant} style={{ marginRight: 12, marginTop: 2 }} />
              <TextInput
                placeholder="Notes (optional)"
                value={notes}
                onChangeText={setNotes}
                multiline
                style={[styles.notesInput, { color: theme.colors.onSurfaceVariant }]}
                placeholderTextColor={theme.colors.outline}
              />
            </View>
          </View>
        </Surface>

        {/* Submit Button */}
        <Button 
          mode="contained" 
          onPress={handleSubmit}
          style={{ marginTop: 16 }}
          disabled={!date || !timeSlot || !category || !patientId}
        >
          Create Appointment
        </Button>

        {/* Pickers */}
        <AppointmentPicker
          visible={showTimePicker}
          onClose={() => setShowTimePicker(false)}
          title="Select Time Slot"
          onSelect={(value) => {
            setTimeSlot(value.id);
            setShowTimePicker(false);
          }}
          data={TIME_SLOTS.map(slot => ({ id: slot, label: slot }))}
        />

        <AppointmentPicker
          visible={showPatientPicker}
          title="Select Patient"
          data={patients.map(patient => ({
            ...patient,
            label: formatPatientForDisplay(patient)
          }))}
          onSelect={(patient) => {
            setPatientId(patient.id);
            setShowPatientPicker(false);
          }}
          onClose={() => setShowPatientPicker(false)}
        />

        {/* Category Picker Modal - Optimized with memoization */}
        <Modal
          visible={showCategoryPicker}
          dismissable
          onDismiss={() => setShowCategoryPicker(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.modalHeader}>
            <Text variant="titleLarge">Select Category</Text>
            <IconButton
              icon="close"
              size={24}
              onPress={() => setShowCategoryPicker(false)}
            />
          </View>
          <ScrollView 
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true} // Optimize memory usage
          >
            <View style={styles.categoryGrid}>
              {SERVICE_CATEGORIES.map((cat) => {
                // Memoize category item styles to prevent recalculation on each render
                const categoryStyle = useMemo(() => ([
                  styles.categoryItem,
                  {
                    backgroundColor: category === cat.id 
                      ? theme.colors.primaryContainer 
                      : theme.colors.surfaceVariant
                  }
                ]), [category === cat.id, theme.colors.primaryContainer, theme.colors.surfaceVariant]);
                
                const textStyle = useMemo(() => ({
                  color: category === cat.id 
                    ? theme.colors.onPrimaryContainer 
                    : theme.colors.onSurface,
                  flexShrink: 1
                }), [category === cat.id, theme.colors.onPrimaryContainer, theme.colors.onSurface]);
                
                const iconColor = useMemo(() => (
                  category === cat.id 
                    ? theme.colors.onPrimaryContainer 
                    : theme.colors.onSurface
                ), [category === cat.id, theme.colors.onPrimaryContainer, theme.colors.onSurface]);
                
                return (
                  <TouchableRipple
                    key={cat.id}
                    onPress={() => {
                      setCategory(cat.id);
                      setShowCategoryPicker(false);
                    }}
                    style={categoryStyle}
                  >
                    <View style={styles.categoryItemContent}>
                      <IconButton
                        icon={cat.icon}
                        size={24}
                        iconColor={iconColor}
                      />
                      <Text
                        variant="bodyMedium"
                        style={textStyle}
                        numberOfLines={1}
                      >
                        {cat.label}
                      </Text>
                    </View>
                  </TouchableRipple>
                );
              })}
            </View>
          </ScrollView>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddAppointment;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  formContainer: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
  },
  notesContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    minHeight: 120,
  },
  notesInput: {
    flex: 1,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  submitButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'opacity 0.2s',
      },
    }),
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarNavButton: {
    padding: 8,
  },
  calendarWeekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calendarWeekDay: {
    width: 40,
    textAlign: 'center',
    fontSize: 14,
  },
  calendarDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayText: {
    fontSize: 16,
  },
  calendarDaySelected: {
    borderRadius: 20,
  },
  calendarDaySelectedText: {
    fontWeight: '600',
  },
  calendarDayDisabled: {
    opacity: 0.3,
  },
  calendarDayToday: {
    borderWidth: 2,
    borderRadius: 20,
  },
  modalContainer: {
    margin: 16,
    borderRadius: 28,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalContent: {
    padding: 16,
  },
  categoryOption: {
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    borderRadius: 12,
    marginBottom: 12,
    width: '48%',
    overflow: 'hidden',
  },
  categoryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
});