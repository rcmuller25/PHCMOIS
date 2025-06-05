import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Calendar as RNCalendar, LocaleConfig } from 'react-native-calendars';
import { format, isSameDay, addDays, parseISO } from 'date-fns';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Text, Button, Card, IconButton, Menu, FAB, Surface, useTheme, Chip } from 'react-native-paper';
import { MD3Theme } from 'react-native-paper/lib/typescript/types';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Download, Plus, MapPin } from 'lucide-react-native';

type DocumentResult = {
  type: 'success' | 'cancel';
  name: string;
  uri: string;
  mimeType: string | null;
  size: number | null;
  lastModified?: number;
  file?: File;
  output?: FileList | null;
};

type DocumentPickerSuccessResult = {
  type: 'success';
  name: string;
  uri: string;
  mimeType: string | null;
  size: number | null;
  lastModified?: number;
  file?: File;
  output?: FileList | null;
};

type ExtendedTheme = MD3Theme & {
  borderLight: string;
};

type Farm = {
  id: string;
  name: string;
  patients?: number;
};

type RouteType = 'mobile1' | 'mobile2' | 'satellite';

type Route = {
  id: string;
  name: string;
  color: string;
  type: RouteType;
  practitioner: string;
  farms: Farm[];
};

type ScheduleDay = {
  id: string;
  date: Date;
  routes: Route[];
  isSatelliteDay: boolean;
  doctorVisit?: boolean;
};

// Configure calendar locale
LocaleConfig.locales['en'] = {
  monthNames: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
  monthNamesShort: [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ],
  dayNames: [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday'
  ],
  dayNamesShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  today: 'Today'
};

LocaleConfig.defaultLocale = 'en';

function ScheduleScreen() {
  const router = useRouter();
  const theme = useTheme<MD3Theme>();
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [expandedRoutes, setExpandedRoutes] = useState<Record<string, boolean>>({});
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [routeTypeFilter, setRouteTypeFilter] = useState<string>('all');

  const styles = useMemo(() => createStyles(theme), [theme]);

  // Get the current day's schedule
  const currentDaySchedule = useMemo(() => {
    return schedule.find(day => isSameDay(day.date, currentDate)) || {
      id: currentDate.toISOString().split('T')[0],
      date: currentDate,
      routes: [],
      isSatelliteDay: currentDate.getDay() === 2 // Tuesday
    };
  }, [schedule, currentDate]);

  // Sample data - replace with your actual data
  const generateSampleData = (): ScheduleDay[] => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    return Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(today.getFullYear(), today.getMonth(), i + 1);
      const dayOfWeek = date.getDay();
      const isTuesday = dayOfWeek === 2; // 2 is Tuesday

      const routes: Route[] = [];

      // Add mobile clinic 1 routes (Mon, Wed)
      if ([1, 3].includes(dayOfWeek)) {
        routes.push({
          id: `mobile1-${i}-1`,
          name: 'Mobile Clinic 1',
          color: '#4CAF50',
          type: 'mobile1',
          practitioner: 'Dr. Smith',
          farms: Array.from({ length: 3 }, (_, j) => ({
            id: `farm-${i}-${j}`,
            name: `Farm ${i + 1}-${j + 1}`,
            patients: Math.floor(Math.random() * 10) + 1,
          })),
        });
      }
      
      // Add mobile clinic 2 routes (Fri)
      if ([5].includes(dayOfWeek)) {
        routes.push({
          id: `mobile2-${i}-1`,
          name: 'Mobile Clinic 2',
          color: '#2196F3',
          type: 'mobile2',
          practitioner: 'Dr. Johnson',
          farms: Array.from({ length: 2 }, (_, j) => ({
            id: `farm-${i}-${j}`,
            name: `Farm ${i + 1}-${j + 1}`,
            patients: Math.floor(Math.random() * 8) + 1,
          })),
        });
      }

      // Add satellite clinic on Tuesdays
      if (isTuesday) {
        routes.push({
          id: `satellite-${i}`,
          name: 'Satellite Clinic',
          color: '#9C27B0',
          type: 'satellite',
          practitioner: 'Dr. Johnson',
          farms: [],
        });
      }

      return {
        id: date.toISOString().split('T')[0],
        date,
        routes,
        isSatelliteDay: isTuesday,
      };
    });
  };

  // Initialize with sample data if empty
  useEffect(() => {
    if (schedule.length === 0) {
      setSchedule(generateSampleData());
    }
  }, []);

  const toggleRoute = (routeId: string) => {
    setExpandedRoutes(prev => ({
      ...prev,
      [routeId]: !prev[routeId],
    }));
  };

  const navigateToDay = (day: Date) => {
    setCurrentDate(day);
    setShowCalendar(false);
  };

  const navigateDays = (days: number) => {
    const newDate = addDays(currentDate, days);
    setCurrentDate(newDate);
    setShowCalendar(false);
  };

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
    setShowCalendar(false);
  };

  const generateCSV = () => {
    const headers = ['Date', 'Route', 'Type', 'Practitioner', 'Farms', 'Total Patients'];
    const rows = schedule.flatMap(day =>
      day.routes.flatMap(route => [
        [
          `"${format(day.date, 'yyyy-MM-dd')}"`,
          `"${route.name}"`,
          `"${route.type}"`,
          `"${route.practitioner}"`,
          `"${route.farms.map(f => f.name).join('; ')}"`,
          route.farms.reduce((sum, farm) => sum + (farm.patients || 0), 0),
        ].join(',')
      ])
    );
    return [headers.join(','), ...rows].join('\n');
  };

  const exportSchedule = async () => {
    try {
      const csvContent = generateCSV();
      const fileUri = `${FileSystem.documentDirectory}schedule_export.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent);
      
      // Share file using FileSystem.getContentUriAsync for Android
      const contentUri = await FileSystem.getContentUriAsync(fileUri);
      Alert.alert('Success', 'Schedule exported successfully to: ' + fileUri);
    } catch (error) {
      Alert.alert('Error', 'Failed to export schedule');
      console.error(error);
    }
  };

  const importSchedule = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
      });

      if (result.canceled) {
        return [];
      }

      const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const importedSchedule = JSON.parse(fileContent);

      setSchedule(importedSchedule);
      return importedSchedule;
    } catch (error) {
      console.error('Error parsing import file:', error);
      return [];
    }
  };

  const scheduleToCsv = (scheduleData: ScheduleDay[]): string => {
    const headers = ['Date', 'Route', 'Type', 'Practitioner', 'Farms', 'Total Patients'];
    const rows = scheduleData.flatMap(day =>
      day.routes.flatMap(route => [
        [
          `"${format(day.date, 'yyyy-MM-dd')}"`,
          `"${route.name}"`,
          `"${route.type}"`,
          `"${route.practitioner}"`,
          `"${route.farms.map(f => f.name).join('; ')}"`,
          route.farms.reduce((sum, farm) => sum + (farm.patients || 0), 0),
        ].join(',')
      ])
    );
    return [headers.join(','), ...rows].join('\n');
  };

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant }]} elevation={1}>
        <View style={styles.headerContent}>
          <View style={styles.navigationContainer}>
            <IconButton
              icon={({ size, color }) => <ChevronLeft size={size} color={color} />}
              size={24}
              onPress={() => navigateDays(-1)}
              style={styles.navButton}
            />
            <Text style={[{ fontSize: 18, fontWeight: '600', color: theme.colors.onSurface }]}>
              {format(currentDate, 'MMMM yyyy')}
            </Text>
            <IconButton
              icon={({ size, color }) => <ChevronRight size={size} color={color} />}
              size={24}
              onPress={() => navigateDays(1)}
              style={styles.navButton}
            />
          </View>
          <View style={styles.headerControls}>
            <Button
              mode="text"
              onPress={() => setShowCalendar(!showCalendar)}
              icon={({ size, color }) => 
                showCalendar ? 
                  <ChevronUp size={size} color={color} /> : 
                  <ChevronDown size={size} color={color} />
              }
            >
              {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
            </Button>
          </View>
        </View>
        
        <View style={styles.filterContainer}>
          <Text style={[styles.filterLabel, { color: theme.colors.onSurface }]}>Filter by:</Text>
          <View style={styles.chipContainer}>
            <Chip 
              selected={routeTypeFilter === 'all'} 
              onPress={() => setRouteTypeFilter('all')} 
              style={[styles.filterChip, routeTypeFilter === 'all' && { backgroundColor: theme.colors.primaryContainer }]}
            >
              All
            </Chip>
            <Chip 
              selected={routeTypeFilter === 'mobile1'} 
              onPress={() => setRouteTypeFilter('mobile1')} 
              style={[styles.filterChip, routeTypeFilter === 'mobile1' && { backgroundColor: theme.colors.primaryContainer }]}
            >
              Mobile 1
            </Chip>
            <Chip 
              selected={routeTypeFilter === 'mobile2'} 
              onPress={() => setRouteTypeFilter('mobile2')} 
              style={[styles.filterChip, routeTypeFilter === 'mobile2' && { backgroundColor: theme.colors.primaryContainer }]}
            >
              Mobile 2
            </Chip>
            <Chip 
              selected={routeTypeFilter === 'satellite'} 
              onPress={() => setRouteTypeFilter('satellite')} 
              style={[styles.filterChip, routeTypeFilter === 'satellite' && { backgroundColor: theme.colors.primaryContainer }]}
            >
              Satellite
            </Chip>
          </View>
        </View>
      </Surface>

      {showCalendar && (
        <View style={styles.calendarContainer}>
          <RNCalendar
            current={format(currentDate, 'yyyy-MM-dd')}
            onDayPress={(day) => {
              setCurrentDate(new Date(day.dateString));
              setShowCalendar(false);
            }}
            markedDates={{
              [format(currentDate, 'yyyy-MM-dd')]: { selected: true, selectedColor: theme.colors.primary },
            }}
            theme={{
              selectedDayBackgroundColor: theme.colors.primary,
              todayTextColor: theme.colors.primary,
              arrowColor: theme.colors.primary,
            }}
          />
        </View>
      )}

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.dayContainer}>
          <View style={styles.dayHeader}>
            <Text style={[styles.dayText, isSameDay(currentDate, new Date()) && styles.todayText]}>
              {format(currentDate, 'EEEE, MMMM d')}
              {isSameDay(currentDate, new Date()) && ' (Today)'}
            </Text>

            {currentDaySchedule.isSatelliteDay && (
              <Surface style={[styles.satelliteTag, { backgroundColor: theme.colors.primaryContainer }]} elevation={0}>
                <Text style={[styles.satelliteText, { color: theme.colors.onPrimaryContainer }]}>Satellite Clinic Day</Text>
              </Surface>
            )}

            {[1, 5].includes(currentDate.getDay()) && (
              <Button
                mode="contained"
                onPress={() => Alert.alert('Add Doctor Visit', 'This will open a form to add a doctor visit.')}
                style={styles.addButton}
              >
                Add Doctor Visit
              </Button>
            )}
          </View>

          {currentDaySchedule.routes.length > 0 ? (
            currentDaySchedule.routes
              .filter(route => routeTypeFilter === 'all' || route.type === routeTypeFilter)
              .map((route: Route) => (
              <Card key={route.id} style={[styles.routeCard, { borderLeftColor: route.color }]} mode="elevated" elevation={1}>
                <Card.Content>
                  <View style={styles.routeHeader}>
                    <View style={styles.routeInfo}>
                      <Text style={[styles.routeName, { color: theme.colors.onSurface }]}>{route.name}</Text>
                      <Text style={[styles.practitioner, { color: theme.colors.onSurfaceVariant }]}>{route.practitioner}</Text>
                    </View>
                    <IconButton
                      icon={({ size, color }) =>
                        expandedRoutes[route.id] ? (
                          <ChevronUp size={size} color={color} />
                        ) : (
                          <ChevronDown size={size} color={color} />
                        )
                      }
                      onPress={() => toggleRoute(route.id)}
                      style={styles.expandButton}
                    />
                  </View>

                  {expandedRoutes[route.id] && route.farms.length > 0 && (
                    <View style={styles.farmsList}>
                      {route.farms.map((farm: Farm) => (
                        <View key={farm.id} style={styles.farmItem}>
                          <MapPin size={16} color={theme.colors.onSurfaceVariant} />
                          <View style={styles.farmInfo}>
                            <Text style={[styles.farmName, { color: theme.colors.onSurface }]}>{farm.name}</Text>
                            <Text style={[styles.patientCount, { color: theme.colors.onSurfaceVariant }]}>
                              {farm.patients ?? 0} patients
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: theme.colors.onSurfaceVariant }]}>No routes scheduled for this day</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <FAB
        icon={({ size, color }) => <Plus size={size} color={color} />}
        style={[styles.newButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => Alert.alert('Add Route', 'This will open a form to add a new route.')}
      />
    </Surface>
  );
}

// Import withAuth HOC
import withAuth from '../../../components/withAuth';

// Export protected component
export default withAuth(ScheduleScreen);

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  // Layout
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },

  // Navigation
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterContainer: {
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: theme.colors.onSurface,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  navButton: {
    margin: 0,
  },

  // Calendar
  calendarContainer: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },

  // Day Section
  dayContainer: {
    marginBottom: 16,
  },
  dayHeader: {
    marginBottom: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  dayText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    flex: 1,
  },
  todayText: {
    color: theme.colors.primary,
  },
  addButton: {
    marginTop: 8,
  },

  // Satellite Banner
  satelliteTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  satelliteText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Route Card
  routeCard: {
    marginBottom: 12,
    borderLeftWidth: 6,
    elevation: 1,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  routeInfo: {
    flex: 1,
    marginRight: 8,
  },
  routeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  practitioner: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  expandButton: {
    margin: 0,
  },

  // Farm List
  farmsList: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
    paddingTop: 12,
  },
  farmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  farmInfo: {
    marginLeft: 8,
    flex: 1,
  },
  farmName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  patientCount: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },

  // Empty State
  emptyState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },

  // FAB
  newButton: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    elevation: 4,
  },
});
