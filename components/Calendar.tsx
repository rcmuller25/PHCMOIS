import React, { memo, useCallback, useMemo, useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  ViewStyle, 
  TextStyle, 
  AccessibilityProps,
  ScrollView,
  Modal,
  FlatList,
  Dimensions
} from 'react-native';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react-native';
import { useTheme, Text, TouchableRipple, Surface, MD3Theme, Button, Menu, Divider } from 'react-native-paper';

type DayInfo = {
  day: number;
  isCurrentMonth: boolean;
  isSelected: boolean;
  date: Date;
};

interface Appointment {
  id: string;
  date: string;
  timeSlot: string;
  category: string;
  patientName: string;
  notes?: string;
}

interface CalendarProps {
  date: Date;
  onSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  appointments?: Appointment[];
  showFullCalendar?: boolean;
  onToggleView?: () => void;
}

const DAYS_IN_WEEK = 7;
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;

// Define service categories with their fixed time slots
const SERVICE_CATEGORIES = [
  { id: 'immunisation', label: 'Immunisation', icon: 'needle', timeSlot: '09:00' },
  { id: 'family_planning', label: 'Family Planning', icon: 'account-group', timeSlot: '10:00' },
  { id: 'chronic', label: 'Chronic', icon: 'heart-pulse', timeSlot: '11:00' },
  { id: 'uncontrolled', label: 'Uncontrolled', icon: 'alert-circle', timeSlot: '12:00' },
  { id: 'tb', label: 'TB', icon: 'lungs', timeSlot: '13:00' },
  { id: 'art', label: 'Art', icon: 'medical-bag', timeSlot: '14:00' },
  { id: 'imci', label: 'IMCI', icon: 'baby-face', timeSlot: '15:00' },
  { id: 'acute', label: 'Acute', icon: 'alert', timeSlot: '16:00' },
  { id: 'anc', label: 'ANC', icon: 'human-pregnant', timeSlot: '17:00' },
  { id: 'nutrition', label: 'Nutrition', icon: 'food-apple', timeSlot: '09:30' },
  { id: 'vaccination', label: 'Vaccination', icon: 'needle', timeSlot: '10:30' },
  { id: 'screening', label: 'Screening', icon: 'magnify', timeSlot: '11:30' },
  { id: 'wound_care', label: 'Wound Care', icon: 'bandage', timeSlot: '13:30' },
  { id: 'emergency', label: 'Emergency', icon: 'ambulance', timeSlot: '14:30' },
];

const CalendarComponent = memo(({ 
  date, 
  onSelect, 
  minDate, 
  maxDate,
  appointments = [],
  showFullCalendar = true,
  onToggleView
}: CalendarProps) => {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(date));
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date(date));
  
  // State for year and month selectors
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  
  // Generate years for selector (100 years back from current year)
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const result = [];
    for (let year = currentYear; year >= currentYear - 100; year--) {
      result.push(year);
    }
    return result;
  }, [currentYear]);

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get appointments for selected date
  const getAppointmentsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return appointments.filter(appointment => appointment.date === dateString);
  };

  // Render appointments list
  const renderAppointmentsList = () => {
    const appointmentsForDate = getAppointmentsForDate(selectedDate);
    
    return (
      <Surface style={styles.appointmentsList} elevation={1}>
        {SERVICE_CATEGORIES.map(category => {
          const appointment = appointmentsForDate.find(
            a => a.timeSlot === category.timeSlot
          );
          
          return (
            <View key={category.id} style={styles.appointmentItem}>
              <View style={styles.timeSlotHeader}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                  {category.timeSlot}
                </Text>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                  {category.label}
                </Text>
              </View>
              
              {appointment ? (
                <View style={styles.appointmentDetails}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                    {appointment.patientName}
                  </Text>
                  {appointment.notes && (
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {appointment.notes}
                    </Text>
                  )}
                </View>
              ) : (
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  No appointment scheduled
                </Text>
              )}
            </View>
          );
        })}
      </Surface>
    );
  };

  // Memoize date calculations
  const { daysInMonth, firstDayOfMonth, monthName, year } = useMemo(() => {
    const daysInMonth = new Date(
      currentDate.getFullYear(), 
      currentDate.getMonth() + 1, 
      0
    ).getDate();
    
    const firstDayOfMonth = new Date(
      currentDate.getFullYear(), 
      currentDate.getMonth(), 
      1
    ).getDay();
    
    const monthName = MONTH_NAMES[currentDate.getMonth()];
    const year = currentDate.getFullYear();
    
    return { daysInMonth, firstDayOfMonth, monthName, year };
  }, [currentDate]);

  // Handle month navigation
  const handlePrevMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);
  
  // Handle year selection
  const handleYearSelect = useCallback((selectedYear: number) => {
    setCurrentDate(prev => new Date(selectedYear, prev.getMonth(), 1));
    setShowYearSelector(false);
  }, []);
  
  // Handle month selection
  const handleMonthSelect = useCallback((monthIndex: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), monthIndex, 1));
    setShowMonthSelector(false);
  }, []);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    onSelect(date);
  }, [onSelect]);

  // Memoize the days to render
  const days = useMemo<DayInfo[]>(() => {
    const result: DayInfo[] = [];
    const today = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    // Add days from previous month
    const prevMonthDays = firstDayOfMonth;
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    
    for (let i = 0; i < prevMonthDays; i++) {
      const day = prevMonthLastDay - prevMonthDays + i + 1;
      const date = new Date(currentYear, currentMonth - 1, day);
      result.push({
        day,
        isCurrentMonth: false,
        isSelected: false,
        date
      });
    }
    
    // Add current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      result.push({
        day,
        isCurrentMonth: true,
        isSelected: 
          selectedDate.getDate() === day &&
          selectedDate.getMonth() === currentMonth &&
          selectedDate.getFullYear() === currentYear,
        date
      });
    }
    
    // Add days from next month to complete the grid
    const remainingDays = DAYS_IN_WEEK - (result.length % DAYS_IN_WEEK);
    if (remainingDays < DAYS_IN_WEEK) {
      for (let day = 1; day <= remainingDays; day++) {
        const date = new Date(currentYear, currentMonth + 1, day);
        result.push({
          day,
          isCurrentMonth: false,
          isSelected: false,
          date
        });
      }
    }
    
    return result;
  }, [currentDate, daysInMonth, firstDayOfMonth, selectedDate]);

  // Memoize day component to prevent unnecessary re-renders
  const DayButton = memo(({ 
    dayInfo, 
    onPress 
  }: { 
    dayInfo: DayInfo; 
    onPress: (date: Date) => void;
  }) => {
    const { day, isCurrentMonth, isSelected, date } = dayInfo;
    const theme = useTheme();
    
    // Memoize styles for better performance
    const buttonStyle = useMemo<ViewStyle>(() => ({
      ...styles.dayButton,
      backgroundColor: isSelected ? theme.colors.primaryContainer : undefined,
      opacity: isCurrentMonth ? 1 : 0.3,
    }), [isSelected, isCurrentMonth, theme.colors.primaryContainer]);
    
    const textVariant = useMemo(() => isSelected ? 'labelLarge' : 'labelMedium', [isSelected]);
    const textColor = useMemo(() => isSelected ? theme.colors.onPrimaryContainer : theme.colors.onSurface, 
      [isSelected, theme.colors.onPrimaryContainer, theme.colors.onSurface]);
    
    // Memoize accessibility props
    const accessibilityProps = useMemo<AccessibilityProps>(() => ({
      accessibilityRole: 'button',
      accessibilityLabel: `${day}, ${date.toLocaleDateString()}`,
      accessibilityState: { selected: isSelected }
    }), [day, date, isSelected]);
    
    // Memoize onPress handler
    const handlePress = useCallback(() => onPress(date), [onPress, date]);
    
    return (
      <TouchableRipple 
        onPress={handlePress}
        style={buttonStyle}
        {...accessibilityProps}
      >
        <Text 
          variant={textVariant} 
          style={{ color: textColor }}
        >
          {day}
        </Text>
      </TouchableRipple>
    );
  });
  
  DayButton.displayName = 'DayButton';

  return (
    <Surface style={styles.container} elevation={0}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
            {formatDate(selectedDate)}
          </Text>
          {!showFullCalendar && (
            <Button
              mode="text"
              onPress={onToggleView}
              icon="calendar"
              style={styles.toggleButton}
            >
              Show Calendar
            </Button>
          )}
        </View>
        {showFullCalendar && (
          <Button
            mode="text"
            onPress={onToggleView}
            icon="calendar-off"
            style={styles.toggleButton}
          >
            Hide Calendar
          </Button>
        )}
      </View>

      {/* Year Selector Modal */}
      <Modal
        visible={showYearSelector}
        transparent
        animationType="fade"
        onRequestClose={() => setShowYearSelector(false)}
      >
        <View style={styles.modalContainer}>
          <Surface style={styles.modalContent} elevation={4}>
            <View style={styles.modalHeader}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                Select Year
              </Text>
              <Button onPress={() => setShowYearSelector(false)}>Close</Button>
            </View>
            <FlatList
              data={years}
              keyExtractor={(item) => item.toString()}
              style={styles.modalList}
              showsVerticalScrollIndicator={true}
              initialScrollIndex={years.findIndex(y => y === year)}
              getItemLayout={(data, index) => ({
                length: 48,
                offset: 48 * index,
                index,
              })}
              renderItem={({ item }) => (
                <TouchableRipple
                  onPress={() => handleYearSelect(item)}
                  style={[styles.modalItem, item === year && { backgroundColor: theme.colors.primaryContainer }]}
                >
                  <Text 
                    variant="bodyLarge" 
                    style={{ 
                      color: item === year ? theme.colors.primary : theme.colors.onSurface,
                      textAlign: 'center'
                    }}
                  >
                    {item}
                  </Text>
                </TouchableRipple>
              )}
            />
          </Surface>
        </View>
      </Modal>

      {/* Month Selector Modal */}
      <Modal
        visible={showMonthSelector}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthSelector(false)}
      >
        <View style={styles.modalContainer}>
          <Surface style={styles.modalContent} elevation={4}>
            <View style={styles.modalHeader}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                Select Month
              </Text>
              <Button onPress={() => setShowMonthSelector(false)}>Close</Button>
            </View>
            <FlatList
              data={MONTH_NAMES.map((name, index) => ({ name, index }))}
              keyExtractor={(item) => item.name}
              style={styles.modalList}
              initialScrollIndex={currentDate.getMonth()}
              getItemLayout={(data, index) => ({
                length: 48,
                offset: 48 * index,
                index,
              })}
              renderItem={({ item }) => (
                <TouchableRipple
                  onPress={() => handleMonthSelect(item.index)}
                  style={[
                    styles.modalItem, 
                    item.index === currentDate.getMonth() && { backgroundColor: theme.colors.primaryContainer }
                  ]}
                >
                  <Text 
                    variant="bodyLarge" 
                    style={{ 
                      color: item.index === currentDate.getMonth() ? theme.colors.primary : theme.colors.onSurface,
                      textAlign: 'center'
                    }}
                  >
                    {item.name}
                  </Text>
                </TouchableRipple>
              )}
            />
          </Surface>
        </View>
      </Modal>

      {showFullCalendar ? (
        <>
          <View style={styles.calendarHeader}>
            <TouchableRipple 
              onPress={handlePrevMonth} 
              style={styles.navButton}
              accessibilityLabel="Previous month"
              accessibilityRole="button"
            >
              <ChevronLeft size={24} color={theme.colors.primary} />
            </TouchableRipple>
            <View style={styles.dateSelectors}>
              {/* Month selector button */}
              <TouchableRipple
                onPress={() => setShowMonthSelector(true)}
                style={styles.selectorButton}
                accessibilityLabel="Select month"
                accessibilityRole="button"
              >
                <View style={styles.selectorButtonContent}>
                  <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
                    {monthName}
                  </Text>
                </View>
              </TouchableRipple>
              
              {/* Year selector button */}
              <TouchableRipple
                onPress={() => setShowYearSelector(true)}
                style={styles.selectorButton}
                accessibilityLabel="Select year"
                accessibilityRole="button"
              >
                <View style={styles.selectorButtonContent}>
                  <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
                    {year}
                  </Text>
                </View>
              </TouchableRipple>
            </View>
            <TouchableRipple 
              onPress={handleNextMonth} 
              style={styles.navButton}
              accessibilityLabel="Next month"
              accessibilityRole="button"
            >
              <ChevronRight size={24} color={theme.colors.primary} />
            </TouchableRipple>
          </View>
          
          <View style={styles.weekDays}>
            {DAYS.map(day => (
              <Text 
                key={day} 
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
                accessibilityRole="text"
              >
                {day}
              </Text>
            ))}
          </View>
          
          <View style={styles.calendar}>
            {days.map((dayInfo, index) => (
              <DayButton 
                key={`${dayInfo.day}-${dayInfo.isCurrentMonth ? 'current' : 'other'}-${index}`} 
                dayInfo={dayInfo}
                onPress={handleDateSelect}
              />
            ))}
          </View>
        </>
      ) : (
        <ScrollView style={styles.appointmentsContainer}>
          {renderAppointmentsList()}
        </ScrollView>
      )}
    </Surface>
  );
});

CalendarComponent.displayName = 'Calendar';

export const Calendar = memo(CalendarComponent);

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  toggleButton: {
    marginLeft: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
  },
  dateSelectors: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  selectorButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  selectorButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    maxHeight: '70%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalList: {
    width: '100%',
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 8,
    justifyContent: 'space-around',
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayButton: {
    width: '13.5%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    margin: 2,
  },
  appointmentsContainer: {
    maxHeight: 500,
  },
  appointmentsList: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  appointmentItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  timeSlotHeader: {
    marginBottom: 8,
  },
  appointmentDetails: {
    marginTop: 4,
  },
});


