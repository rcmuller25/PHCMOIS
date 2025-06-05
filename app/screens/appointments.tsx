import React, { useState, useMemo, useCallback, memo } from 'react';
import { View, StyleSheet, ScrollView, LayoutAnimation, Platform, UIManager, Dimensions } from 'react-native';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useAppointmentsStore } from '../../stores/appointmentsStore';
import { formatDate, getDayOfWeek } from '../../utils/dateUtils';
import { AppointmentSlot } from '../../components/AppointmentSlot';
import { Text, TouchableRipple, useTheme, IconButton, Surface, MD3Theme, Button } from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';

// Define types for our components
interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  timeSlot: string;
  category: string;
  notes?: string;
}

interface ServiceCategoryType {
  id: string;
  name: string;
  timeSlot: string;
}

interface DateNavigatorProps {
  selectedDate: Date;
  onPreviousDay: () => void;
  onNextDay: () => void;
  showCalendar: boolean;
  toggleCalendar: () => void;
}

interface TimeSlotHeaderProps {
  category: ServiceCategoryType;
}

interface AppointmentRowProps {
  category: ServiceCategoryType;
  date: string;
  appointments: Appointment[];
}

interface CalendarViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

interface CalendarDayItem {
  day: string;
  date: Date | null;
  isCurrentMonth: boolean;
  isToday?: boolean;
  isSelected?: boolean;
}

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Define service categories with their time slots
const SERVICE_CATEGORIES: ServiceCategoryType[] = [
  { id: 'immunisation', name: 'Immunisation', timeSlot: '08:00' },
  { id: 'family_planning', name: 'Family Planning', timeSlot: '09:00' },
  { id: 'chronic', name: 'Chronic', timeSlot: '10:00' },
  { id: 'uncontrolled', name: 'Uncontrolled', timeSlot: '11:00' },
  { id: 'tb', name: 'TB', timeSlot: '12:00' },
  { id: 'art', name: 'Art', timeSlot: '13:00' },
  { id: 'imci', name: 'IMCI', timeSlot: '14:00' },
  { id: 'acute', name: 'Acute', timeSlot: '15:00' },
  { id: 'anc', name: 'ANC', timeSlot: '16:00' },
];

// Define time slots (hourly from 8 AM to 4 PM)
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', 
  '12:00', '13:00', '14:00', '15:00', '16:00'
];

// Memoized DateNavigator component
const DateNavigator = memo<DateNavigatorProps>(({ 
  selectedDate, 
  onPreviousDay, 
  onNextDay, 
  showCalendar, 
  toggleCalendar 
}) => {
  const theme = useTheme<MD3Theme>();
  
  return (
    <Surface style={[styles.dateNavigator, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant }]} elevation={1}>
      <View style={styles.dateNavRow}>
        <TouchableRipple onPress={onPreviousDay} style={styles.navButton} borderless>
          <ChevronLeft color={theme.colors.primary} size={24} />
        </TouchableRipple>
        <View style={styles.dateContainer}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>{getDayOfWeek(selectedDate)}</Text>
          <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>{formatDate(selectedDate)}</Text>
        </View>
        <TouchableRipple onPress={onNextDay} style={styles.navButton} borderless>
          <ChevronRight color={theme.colors.primary} size={24} />
        </TouchableRipple>
      </View>
      <IconButton
        icon={({ size, color }) => showCalendar ? <ChevronUp size={size} color={color} /> : <ChevronDown size={size} color={color} />}
        size={24}
        onPress={toggleCalendar}
        style={styles.calendarToggle}
        iconColor={theme.colors.primary}
      />
    </Surface>
  );
});

// Memoized TimeSlotHeader component
const TimeSlotHeader = memo<TimeSlotHeaderProps>(({ category }) => {
  const theme = useTheme<MD3Theme>();
  
  return (
    <View style={[styles.categoryHeader, { borderBottomColor: theme.colors.outlineVariant }]}>
      <Text variant="labelLarge" style={{ color: theme.colors.onSurface }}>{category.name}</Text>
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{category.timeSlot}</Text>
    </View>
  );
});

// Memoized AppointmentRow component
const AppointmentRow = memo<AppointmentRowProps>(({ category, date, appointments }) => {
  const theme = useTheme<MD3Theme>();
  
  // Filter appointments for this category
  const categoryAppointments = useMemo(() => {
    return appointments.filter((app: Appointment) => 
      app.category === category.name && 
      app.timeSlot === category.timeSlot
    );
  }, [appointments, category]);
  
  return (
    <Surface 
      style={[styles.appointmentRow, { borderBottomColor: theme.colors.outlineVariant }]} 
      elevation={1}
    >
      <TimeSlotHeader category={category} />
      <View style={styles.appointmentSlotContainer}>
        <AppointmentSlot
          appointments={categoryAppointments}
          maxPatients={4}
          category={category.name}
          timeSlot={category.timeSlot}
          date={date}
        />
      </View>
    </Surface>
  );
});

// Calendar component for date selection
const CalendarView = memo<CalendarViewProps>(({ selectedDate, onSelectDate }) => {
  const theme = useTheme<MD3Theme>();
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Generate days for the current month
  const daysInMonth = useMemo<CalendarDayItem[]>(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days: CalendarDayItem[] = [];
    // Add empty days for the start of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: '', date: null, isCurrentMonth: false });
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        day: i.toString(),
        date,
        isCurrentMonth: true,
        isToday: new Date().toDateString() === date.toDateString(),
        isSelected: selectedDate.toDateString() === date.toDateString()
      });
    }
    
    return days;
  }, [selectedDate]);
  
  const handleDayPress = useCallback((date: Date) => {
    if (date) {
      onSelectDate(date);
    }
  }, [onSelectDate]);
  
  return (
    <Surface style={[styles.calendarView, { backgroundColor: theme.colors.surfaceVariant }]} elevation={2}>
      <View style={styles.calendarHeader}>
        {daysOfWeek.map(day => (
          <Text key={day} style={[styles.dayOfWeek, { color: theme.colors.onSurfaceVariant }]} variant="labelSmall">
            {day}
          </Text>
        ))}
      </View>
      <View style={styles.calendarDays}>
        {daysInMonth.map((item, index) => (
          <TouchableRipple
            key={`day-${index}`}
            onPress={() => item.date && handleDayPress(item.date)}
            style={[styles.dayCell, item.isSelected && { backgroundColor: theme.colors.primaryContainer }]}
            disabled={!item.date}
            borderless
          >
            <Text 
              style={[
                styles.dayText,
                { color: item.isSelected ? theme.colors.onPrimaryContainer : theme.colors.onSurface },
                item.isToday && styles.todayText
              ]} 
              variant="bodyMedium"
            >
              {item.day}
            </Text>
          </TouchableRipple>
        ))}
      </View>
    </Surface>
  );
});

function AppointmentsCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const appointments = useAppointmentsStore((state) => state.appointments);
  const theme = useTheme<MD3Theme>();
  
  // Format date as YYYY-MM-DD for filtering
  const formattedDate = useMemo(() => 
    selectedDate.toISOString().split('T')[0],
    [selectedDate]
  );
  
  // Filter appointments for the selected date with useMemo
  const dateAppointments = useMemo(() => 
    appointments.filter(appointment => appointment.date === formattedDate),
    [appointments, formattedDate]
  );

  // Memoize callback functions with useCallback
  const goToPreviousDay = useCallback(() => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  }, [selectedDate]);

  const goToNextDay = useCallback(() => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  }, [selectedDate]);
  
  const toggleCalendar = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowCalendar(prev => !prev);
  }, []);
  
  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowCalendar(false);
  }, []);

  // Render appointment row for FlashList
  const renderAppointmentRow = useCallback(({ item }: { item: ServiceCategoryType }) => {
    return (
      <AppointmentRow 
        category={item} 
        date={formattedDate} 
        appointments={dateAppointments} 
      />
    );
  }, [formattedDate, dateAppointments]);
  
  // Extract a key for FlashList
  const keyExtractor = useCallback((item: ServiceCategoryType) => item.id, []);

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <DateNavigator 
        selectedDate={selectedDate} 
        onPreviousDay={goToPreviousDay} 
        onNextDay={goToNextDay} 
        showCalendar={showCalendar}
        toggleCalendar={toggleCalendar}
      />
      
      {showCalendar && (
        <CalendarView 
          selectedDate={selectedDate} 
          onSelectDate={handleSelectDate} 
        />
      )}
      
      <View style={styles.appointmentsContainer}>
        <FlashList
          data={SERVICE_CATEGORIES}
          renderItem={renderAppointmentRow}
          keyExtractor={keyExtractor}
          estimatedItemSize={100}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </Surface>
  );
}

// Import withAuth HOC
import withAuth from '../../components/withAuth';

// Export protected component
export default withAuth(AppointmentsCalendar);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dateNavigator: {
    padding: 8,
    borderBottomWidth: 1,
  },
  dateNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
  },
  dateContainer: {
    alignItems: 'center',
  },
  calendarToggle: {
    alignSelf: 'center',
    marginTop: 4,
  },
  appointmentsContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  appointmentRow: {
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
    borderBottomWidth: 1,
  },
  categoryHeader: {
    padding: 12,
    borderBottomWidth: 1,
  },
  appointmentSlotContainer: {
    padding: 8,
  },
  calendarView: {
    margin: 12,
    borderRadius: 8,
    padding: 8,
    overflow: 'hidden',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  dayOfWeek: {
    width: 40,
    textAlign: 'center',
  },
  calendarDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: Dimensions.get('window').width / 7 - 8,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 20,
  },
  dayText: {
    textAlign: 'center',
  },
  todayText: {
    fontWeight: 'bold',
  },
}); 