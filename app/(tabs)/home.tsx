import React, { useMemo, memo, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Plus, Calendar, Users, Clock, Search, List, ChevronRight, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { usePatientsStore } from '../../stores/patientsStore';
import { useAppointmentsStore } from '../../stores/appointmentsStore';
import { Card, Text, Button, useTheme, Surface, IconButton, TouchableRipple, MD3Theme } from 'react-native-paper';

function Dashboard() {
  const router = useRouter();
  const patients = usePatientsStore((state) => state.patients);
  const appointments = useAppointmentsStore((state) => state.appointments);
  const theme = useTheme();

  // Memoize date calculations to prevent recalculation on each render
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  // Memoize filtered appointments to prevent recalculation on each render
  const todayAppointments = useMemo(() => {
    return appointments.filter(appointment => appointment.date === today);
  }, [appointments, today]);

  const upcomingAppointments = useMemo(() => {
    return appointments.filter(appointment => appointment.date > today);
  }, [appointments, today]);

  // Memoize styles that depend on theme to prevent recalculation on each render
  const containerStyle = useMemo(() => [
    styles.container, 
    { backgroundColor: theme.colors.background }
  ], [theme.colors.background]);

  const headerCardStyle = useMemo(() => [
    styles.headerCard, 
    { backgroundColor: theme.colors.primary }
  ], [theme.colors.primary]);

  const headerTitleStyle = useMemo(() => [
    styles.headerTitle, 
    { color: theme.colors.onPrimary }
  ], [theme.colors.onPrimary]);

  const bodyTextStyle = useMemo(() => (
    { color: theme.colors.onPrimary }
  ), [theme.colors.onPrimary]);

  const sectionTitleStyle = useMemo(() => [
    styles.sectionTitle, 
    { color: theme.colors.onSurface }
  ], [theme.colors.onSurface]);

  // Memoize navigation callbacks to prevent recreation on each render
  const navigateToAppointment = useCallback(() => {
    router.push('/add-appointment');
  }, [router]);

  const navigateToPatients = useCallback(() => {
    router.push('/screens/patients');
  }, [router]);

  const navigateToCalendar = useCallback(() => {
    router.push('/screens/appointments');
  }, [router]);

  const navigateToSearch = useCallback(() => {
    router.push('/screens/search');
  }, [router]);

  return (
    <ScrollView 
      style={containerStyle}
      contentContainerStyle={styles.content}
      removeClippedSubviews={true} // Optimize memory usage
      showsVerticalScrollIndicator={false} // Hide scrollbar for cleaner UI
    >
      {/* Header Card */}
      <Card 
        style={headerCardStyle}
        mode="elevated"
        elevation={1}
      >
        <Card.Content>
          <Text variant="headlineMedium" style={headerTitleStyle}>
            Primary Healthcare
          </Text>
          <Text variant="bodyMedium" style={bodyTextStyle}>
            Mobile Outreach Information System
          </Text>
        </Card.Content>
      </Card>

      {/* Stats Container */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsContainer}
        removeClippedSubviews={true} // Optimize memory usage
      >
        <StatCard 
          title="Today"
          value={todayAppointments.length}
          icon="calendar-today"
          color={theme.colors.primary}
          theme={theme}
        />
        <StatCard 
          title="Total Appts"
          value={appointments.length}
          icon="calendar-month"
          color={theme.colors.secondary}
          theme={theme}
        />
        <StatCard 
          title="Patients"
          value={patients.length}
          icon="account-group"
          color={theme.colors.tertiary}
          theme={theme}
        />
      </ScrollView>

      <Text variant="titleLarge" style={sectionTitleStyle}>
        Quick Actions
      </Text>

      <View style={styles.quickActionsGrid}>
        <ActionButton 
          icon="plus"
          label="New Appointment"
          onPress={navigateToAppointment}
          color={theme.colors.primary}
        />
        <ActionButton 
          icon="account-group"
          label="Patients"
          onPress={navigateToPatients}
          color={theme.colors.secondary}
        />
        <ActionButton 
          icon="calendar-month"
          label="Calendar"
          onPress={navigateToCalendar}
          color={theme.colors.tertiary}
        />
        <ActionButton 
          icon="magnify"
          label="Search"
          onPress={navigateToSearch}
          color={theme.colors.primaryContainer}
        />
      </View>
    </ScrollView>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
  theme: MD3Theme;
}

// Memoize StatCard component to prevent unnecessary re-renders
const StatCard = memo(({ title, value, icon, color, theme }: StatCardProps) => {
  // Memoize card style to prevent recalculation on each render
  const cardStyle = useMemo(() => [
    styles.statCard, 
    { backgroundColor: color }
  ], [color]);
  
  return (
    <Card style={cardStyle}>
      <Card.Content style={styles.statCardContent}>
        <IconButton
          icon={icon}
          size={24}
          iconColor="white"
          style={styles.statIcon}
        />
        <View style={styles.statTextContainer}>
          <Text variant="titleLarge" style={styles.statValue}>
            {value}
          </Text>
          <Text variant="bodyMedium" style={styles.statLabel}>
            {title}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
});

// Action Button Component
interface ActionButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
  color: string;
}

// Memoize ActionButton component to prevent unnecessary re-renders
const ActionButton = memo(({ icon, label, onPress, color }: ActionButtonProps) => {
  // Memoize styles that depend on props to prevent recalculation on each render
  const contentStyle = useMemo(() => [
    styles.actionButtonContent, 
    { backgroundColor: color }
  ], [color]);
  
  return (
    <TouchableRipple 
      onPress={onPress}
      style={styles.actionButton}
      rippleColor="rgba(0, 0, 0, 0.04)"
    >
      <View style={contentStyle}>
        <IconButton
          icon={icon}
          size={24}
          iconColor="white"
          style={styles.actionIcon}
        />
        <Text variant="labelLarge" style={styles.actionButtonText}>
          {label}
        </Text>
      </View>
    </TouchableRipple>
  );
});

// Import withAuth HOC
import withAuth from '../../components/withAuth';

// Export protected component
export default withAuth(Dashboard);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  headerTitle: {
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statCard: {
    width: 140,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statCardContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    margin: 0,
    marginRight: 12,
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: {
    color: 'white',
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  sectionTitle: {
    marginBottom: 16,
  },
  content: {
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonContent: {
    padding: 16,
    borderRadius: 12,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  actionIcon: {
    margin: 0,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    color: 'white',
    marginTop: 8,
  },
  appointmentsCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  appointmentsContent: {
    padding: 0,
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  appointmentTime: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 16,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentDetails: {
    flex: 1,
  },
  chevron: {
    margin: -12,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContent: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  addButton: {
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  profileButton: {
    margin: 0,
  },
});