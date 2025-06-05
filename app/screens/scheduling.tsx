import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Calendar as RNCalendar, LocaleConfig } from 'react-native-calendars';
import { format, isSameDay, addDays, parseISO } from 'date-fns';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Text, Button, Card, IconButton, Menu, FAB, Surface, useTheme, Divider, Chip } from 'react-native-paper';
import { MD3Theme } from 'react-native-paper/lib/typescript/types';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Download, Plus, MapPin, Calendar, User } from 'lucide-react-native';

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

type RouteType = 'mobile' | 'satellite';

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
  const generateSampleData = useCallback((): ScheduleDay[] => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    return Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(today.getFullYear(), today.getMonth(), i + 1);
      const dayOfWeek = date.getDay();
      const isTuesday = dayOfWeek === 2; // 2 is Tuesday

      const routes: Route[] = [];

      // Add mobile clinic routes (Mon, Wed, Fri)
      if ([1, 3, 5].includes(dayOfWeek)) {
        routes.push({
          id: `mobile-${i}-1`,
          name: 'Mobile Clinic 1',
          color: '#4CAF50',
          type: 'mobile',
          practitioner: 'Dr. Smith',
          farms: Array.from({ length: 3 }, (_, j) => ({
            id: `farm-${i}-${j}`,
            name: `Farm ${i + 1}-${j + 1}`,
            patients: Math.floor(Math.random() * 10) + 1,
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
  }, []);

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

  const generateCSV = useCallback((scheduleData: ScheduleDay[]): string => {
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
  }, []);

  const exportSchedule = async () => {
    try {
      const csvContent = generateCSV(schedule);
      const fileUri = `${FileSystem.documentDirectory}schedule_export_${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      // Share file using FileSystem.getContentUriAsync for Android
      const contentUri = await FileSystem.getContentUriAsync(fileUri);
      Alert.alert('Success', 'Schedule exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export schedule');
    }
  };

  const importSchedule = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/csv'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return [];
      }

      const file = result.assets[0];
      const fileContent = await FileSystem.readAsStringAsync(file.uri);
      
      // Try to parse as JSON first, then fall back to CSV if needed
      try {
        const importedSchedule = JSON.parse(fileContent);
        setSchedule(importedSchedule);
        return importedSchedule;
      } catch (jsonError) {
        // Handle CSV import if needed
        console.error('JSON parse error, trying CSV:', jsonError);
        throw new Error('Only JSON files are supported for import');
      }
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', 'Failed to import schedule. ' + (error as Error).message);
      return [];
    }
  };

  const getTotalPatients = (route: Route) => {
    return route.farms.reduce((sum, farm) => sum + (farm.patients || 0), 0);
  };

  const getRouteTypeIcon = (type: RouteType) => {
    switch (type) {
      case 'mobile':
        return 'truck';
      case 'satellite':
        return 'building';
      default:
        return 'calendar';
    }
  };

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Enhanced Header */}
      <Surface style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant }]} elevation={2}>
        <View style={styles.headerContent}>
          <View style={styles.navigationContainer}>
            <IconButton
              icon={({ size, color }) => <ChevronLeft size={size} color={color} />}
              onPress={() => navigateDays(-1)}
              style={styles.navButton}
              mode="contained-tonal"
            />
            <Button 
              mode="elevated" 
              onPress={() => setShowCalendar(!showCalendar)}
              icon={({ size, color }) => <Calendar size={size} color={color} />}
              style={styles.dateButton}
            >
              {format(currentDate, 'MMM d, yyyy')}
            </Button>
            <IconButton
              icon={({ size, color }) => <ChevronRight size={size} color={color} />}
              onPress={() => navigateDays(1)}
              style={styles.navButton}
              mode="contained-tonal"
            />
          </View>
          
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon={({ size, color }) => <Download size={size} color={color} />}
                onPress={() => setMenuVisible(true)}
                mode="contained-tonal"
                style={styles.menuButton}
              />
            }
            contentStyle={styles.menuContent}
          >
            <Menu.Item 
              onPress={() => {
                exportSchedule();
                setMenuVisible(false);
              }} 
              title="Export Schedule" 
              leadingIcon="download"
            />
            <Menu.Item 
              onPress={() => {
                importSchedule();
                setMenuVisible(false);
              }} 
              title="Import Schedule" 
              leadingIcon="upload"
            />
          </Menu>
        </View>
      </Surface>

      {/* Enhanced Calendar */}
      {showCalendar && (
        <Surface style={styles.calendarContainer} elevation={1}>
          <RNCalendar
            current={format(currentDate, 'yyyy-MM-dd')}
            onDayPress={(day) => {
              setCurrentDate(new Date(day.dateString));
              setShowCalendar(false);
            }}
            markedDates={{
              [format(currentDate, 'yyyy-MM-dd')]: { 
                selected: true, 
                selectedColor: theme.colors.primary,
                selectedTextColor: theme.colors.onPrimary
              },
            }}
            theme={{
              backgroundColor: theme.colors.surface,
              calendarBackground: theme.colors.surface,
              textSectionTitleColor: theme.colors.onSurfaceVariant,
              selectedDayBackgroundColor: theme.colors.primary,
              selectedDayTextColor: theme.colors.onPrimary,
              todayTextColor: theme.colors.primary,
              dayTextColor: theme.colors.onSurface,
              textDisabledColor: theme.colors.onSurfaceVariant,
              dotColor: theme.colors.primary,
              selectedDotColor: theme.colors.onPrimary,
              arrowColor: theme.colors.primary,
              disabledArrowColor: theme.colors.onSurfaceVariant,
              monthTextColor: theme.colors.onSurface,
              indicatorColor: theme.colors.primary,
              textDayFontWeight: '400',
              textMonthFontWeight: '600',
              textDayHeaderFontWeight: '500',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
          />
        </Surface>
      )}

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Enhanced Day Header */}
        <View style={styles.daySection}>
          <View style={styles.dayHeaderContainer}>
            <View style={styles.dayTitleRow}>
              <Text style={[styles.dayTitle, isSameDay(currentDate, new Date()) && styles.todayTitle]}>
                {format(currentDate, 'EEEE')}
              </Text>
              {isSameDay(currentDate, new Date()) && (
                <Chip mode="flat" style={styles.todayChip} textStyle={styles.todayChipText}>
                  Today
                </Chip>
              )}
            </View>
            
            <Text style={[styles.daySubtitle, { color: theme.colors.onSurfaceVariant }]}>
              {format(currentDate, 'MMMM d, yyyy')}
            </Text>

            {/* Special Day Indicators */}
            <View style={styles.specialDayContainer}>
              {currentDaySchedule.isSatelliteDay && (
                <Chip 
                  mode="outlined" 
                  style={[styles.specialDayChip, { backgroundColor: theme.colors.secondaryContainer }]}
                  textStyle={{ color: theme.colors.onSecondaryContainer }}
                  icon="building"
                >
                  Satellite Clinic Day
                </Chip>
              )}

              {[1, 5].includes(currentDate.getDay()) && (
                <Button
                  mode="contained"
                  onPress={() => Alert.alert('Add Doctor Visit', 'This will open a form to add a doctor visit.')}
                  style={styles.addDoctorButton}
                  icon="plus"
                  compact
                >
                  Add Doctor Visit
                </Button>
              )}
            </View>
          </View>

          <Divider style={styles.sectionDivider} />

          {/* Enhanced Routes Section */}
          <View style={styles.routesSection}>
            {currentDaySchedule.routes.length > 0 ? (
              <>
                <View style={styles.routesSectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                    Scheduled Routes ({currentDaySchedule.routes.length})
                  </Text>
                  <Text style={[styles.sectionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                    Total Patients: {currentDaySchedule.routes.reduce((total, route) => total + getTotalPatients(route), 0)}
                  </Text>
                </View>

                {currentDaySchedule.routes.map((route: Route, index: number) => (
                  <Card 
                    key={route.id} 
                    style={[
                      styles.routeCard, 
                      { borderLeftColor: route.color },
                      index === currentDaySchedule.routes.length - 1 && styles.lastRouteCard
                    ]} 
                    mode="elevated" 
                    elevation={2}
                  >
                    <Card.Content style={styles.routeCardContent}>
                      {/* Route Header */}
                      <View style={styles.routeHeader}>
                        <View style={styles.routeMainInfo}>
                          <View style={styles.routeTitleRow}>
                            <Text style={[styles.routeName, { color: theme.colors.onSurface }]}>
                              {route.name}
                            </Text>
                            <Chip 
                              mode="outlined" 
                              style={[styles.routeTypeChip, { borderColor: route.color }]}
                              textStyle={[styles.routeTypeText, { color: route.color }]}
                              compact
                            >
                              {route.type.toUpperCase()}
                            </Chip>
                          </View>
                          
                          <View style={styles.routeMetaInfo}>
                            <View style={styles.practitionerInfo}>
                              <User size={14} color={theme.colors.onSurfaceVariant} />
                              <Text style={[styles.practitioner, { color: theme.colors.onSurfaceVariant }]}>
                                {route.practitioner}
                              </Text>
                            </View>
                            
                            {route.farms.length > 0 && (
                              <Text style={[styles.farmCount, { color: theme.colors.onSurfaceVariant }]}>
                                {route.farms.length} farms • {getTotalPatients(route)} patients
                              </Text>
                            )}
                          </View>
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
                          mode="contained-tonal"
                        />
                      </View>

                      {/* Expanded Farm Details */}
                      {expandedRoutes[route.id] && route.farms.length > 0 && (
                        <>
                          <Divider style={styles.routeDivider} />
                          <View style={styles.farmsList}>
                            <Text style={[styles.farmsListTitle, { color: theme.colors.onSurface }]}>
                              Farm Visits
                            </Text>
                            {route.farms.map((farm: Farm, farmIndex: number) => (
                              <View 
                                key={farm.id} 
                                style={[
                                  styles.farmItem,
                                  farmIndex === route.farms.length - 1 && styles.lastFarmItem
                                ]}
                              >
                                <View style={styles.farmIcon}>
                                  <MapPin size={16} color={theme.colors.primary} />
                                </View>
                                <View style={styles.farmInfo}>
                                  <Text style={[styles.farmName, { color: theme.colors.onSurface }]}>
                                    {farm.name}
                                  </Text>
                                  <Text style={[styles.patientCount, { color: theme.colors.onSurfaceVariant }]}>
                                    {farm.patients ?? 0} patients scheduled
                                  </Text>
                                </View>
                              </View>
                            ))}
                          </View>
                        </>
                      )}
                    </Card.Content>
                  </Card>
                ))}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Surface style={[styles.emptyStateCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
                  <Calendar size={48} color={theme.colors.onSurfaceVariant} />
                  <Text style={[styles.emptyStateTitle, { color: theme.colors.onSurfaceVariant }]}>
                    No Routes Scheduled
                  </Text>
                  <Text style={[styles.emptyStateText, { color: theme.colors.onSurfaceVariant }]}>
                    No routes are scheduled for this day. Tap the + button to add a new route.
                  </Text>
                </Surface>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Enhanced FAB */}
      <FAB
        icon={({ size, color }) => <Plus size={size} color={color} />}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => Alert.alert('Add Route', 'This will open a form to add a new route.')}
        label="Add Route"
        mode="elevated"
      />
    </Surface>
  );
}

// Import withAuth HOC
import withAuth from '../../components/withAuth';

// Export protected component
export default withAuth(ScheduleScreen);

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  // Enhanced Header
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    elevation: 2,
    zIndex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    margin: 0,
  },
  dateButton: {
    marginHorizontal: 8,
    minWidth: 120,
  },
  menuButton: {
    margin: 0,
  },
  menuContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    elevation: 4,
  },

  // Enhanced Calendar
  calendarContainer: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },

  // Scroll Container
  scrollContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // Enhanced Day Section
  daySection: {
    padding: 20,
  },
  dayHeaderContainer: {
    marginBottom: 24,
  },
  dayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  dayTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginRight: 12,
  },
  todayTitle: {
    color: theme.colors.primary,
  },
  todayChip: {
    backgroundColor: theme.colors.primaryContainer,
    marginTop: 4,
  },
  todayChipText: {
    color: theme.colors.onPrimaryContainer,
    fontSize: 12,
    fontWeight: '600',
  },
  daySubtitle: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 16,
  },
  specialDayContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  specialDayChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  addDoctorButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  sectionDivider: {
    marginBottom: 24,
    backgroundColor: theme.colors.outlineVariant,
  },

  // Enhanced Routes Section
  routesSection: {
    flex: 1,
  },
  routesSectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '400',
  },

  // Enhanced Route Cards
  routeCard: {
    marginBottom: 16,
    borderLeftWidth: 4,
    borderRadius: 12,
    elevation: 2,
  },
  lastRouteCard: {
    marginBottom: 24,
  },
  routeCardContent: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  routeMainInfo: {
    flex: 1,
    marginRight: 8,
  },
  routeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  routeName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  routeTypeChip: {
    borderWidth: 1,
    marginLeft: 'auto',
  },
  routeTypeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  routeMetaInfo: {
    gap: 6,
  },
  practitionerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  practitioner: {
    fontSize: 14,
    fontWeight: '500',
  },
  farmCount: {
    fontSize: 13,
    fontWeight: '400',
  },
  expandButton: {
    margin: 0,
  },
  routeDivider: {
    marginVertical: 16,
    backgroundColor: theme.colors.outlineVariant,
  },

  // Enhanced Farm List
  farmsList: {
    paddingTop: 8,
  },
  farmsListTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  farmItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingLeft: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  lastFarmItem: {
    borderBottomWidth: 0,
  },
  farmIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  farmInfo: {
    flex: 1,
  },
  farmName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  patientCount: {
    fontSize: 13,
    fontWeight: '400',
  },

  // Enhanced Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    maxWidth: 300,
    elevation: 2,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Enhanced FAB
  fab: {
    position: 'absolute',
    margin: 24,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    elevation: 4,
  },
});