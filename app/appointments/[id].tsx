import React from 'react';
import { View, StyleSheet, ScrollView, ViewStyle, TextStyle } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Button, Card, Text, useTheme, Surface, Portal, Dialog, MD3Theme } from 'react-native-paper';
import { useAppointmentsStore } from '../../stores/appointmentsStore';
import { usePatientsStore } from '../../stores/patientsStore';
import { Clock, User, Trash2, CalendarDays, FileText } from 'lucide-react-native';
import { formatDate } from '../../utils/dateUtils';
import { BackButton } from '../../components/BackButton';

interface Styles {
  container: ViewStyle;
  content: ViewStyle;
  header: ViewStyle;
  headerCategory: TextStyle;
  timeContainer: ViewStyle;
  timeItem: ViewStyle;
  timeText: TextStyle;
  notFoundContainer: ViewStyle;
  section: ViewStyle;
  patientInfo: ViewStyle;
}

export default function AppointmentDetails() {
  const theme = useTheme<MD3Theme>();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [visible, setVisible] = React.useState(false);

  const appointment = useAppointmentsStore(
    (state) => state.appointments.find((a) => a.id === id)
  );
  const { removeAppointment } = useAppointmentsStore();

  const patient = usePatientsStore(
    (state) => state.patients.find((p) => p.id === appointment?.patientId)
  );

  const showDialog = () => setVisible(true);
  const hideDialog = () => setVisible(false);

  const handleDelete = () => {
    removeAppointment(id as string);
    hideDialog();
    router.back();
  };

  // If appointment not found
  if (!appointment) {
    return (
      <Surface style={[styles.notFoundContainer, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen options={{ headerShown: true, title: 'Appointment Not Found' }} />
        <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, marginBottom: 24 }}>
          Appointment not found
        </Text>
        <Button mode="contained" onPress={() => router.back()} style={{ width: '100%' }}>
          Go Back
        </Button>
      </Surface>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Appointment Details',
          headerLeft: () => <BackButton />,
          headerTitleStyle: {
            color: theme.colors.onSurface,
            fontFamily: theme.fonts.titleMedium.fontFamily,
            fontSize: theme.fonts.titleMedium.fontSize,
            fontWeight: theme.fonts.titleMedium.fontWeight,
          },
          headerShadowVisible: false,
        }}
      />
      <ScrollView style={styles.content}>
        <Surface
          style={[
            styles.header,
            { backgroundColor: getCategoryColor(appointment.category, theme), elevation: 3 },
          ]}
        >
          <Text variant="headlineSmall" style={[styles.headerCategory, { color: theme.colors.onPrimary }]}>
            {appointment.category}
          </Text>
          <View style={styles.timeContainer}>
            <View style={styles.timeItem}>
              <CalendarDays color={theme.colors.onPrimary} size={20} />
              <Text style={[styles.timeText, { color: theme.colors.onPrimary }]} variant="bodyMedium">
                {formatDate(new Date(appointment.date))}
              </Text>
            </View>
            <View style={styles.timeItem}>
              <Clock color={theme.colors.onPrimary} size={20} />
              <Text style={[styles.timeText, { color: theme.colors.onPrimary }]} variant="bodyMedium">
                {appointment.timeSlot}
              </Text>
            </View>
          </View>
        </Surface>

        <Card style={{ marginBottom: 16, backgroundColor: theme.colors.surface }} elevation={1}>
          <Card.Title
            title="Patient Information"
            titleVariant="titleMedium"
            left={({size}) => <User size={24} color={theme.colors.primary} />}
          />
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 4, color: theme.colors.onSurface }}>
              {appointment.patientName}
            </Text>
            {patient && (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {patient.gender} • {patient.idType}: {patient.idNumber}
              </Text>
            )}
          </Card.Content>
          <Card.Actions>
            <Button 
              mode="text" 
              onPress={showDialog}
              textColor={theme.colors.error}
              icon={({size, color}) => <Trash2 size={size} color={color} />}
            >
              Delete
            </Button>
            <Button 
              mode="contained" 
              onPress={() => router.push(`/add-appointment?patientId=${appointment.patientId}`)}
              style={{ marginLeft: 'auto' }}
            >
              Reschedule
            </Button>
          </Card.Actions>
        </Card>

        {appointment.notes && (
          <Card style={{ marginBottom: 16, backgroundColor: theme.colors.surface }} elevation={1}>
            <Card.Title 
              title="Notes" 
              titleVariant="titleMedium"
              left={({size}) => <FileText size={24} color={theme.colors.primary} />}
            />
            <Card.Content>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>{appointment.notes}</Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={visible} onDismiss={hideDialog}>
          <Dialog.Title>Delete Appointment</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to delete this appointment? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialog}>Cancel</Button>
            <Button onPress={handleDelete} textColor={theme.colors.error}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

// Helper function to get color based on appointment category using Material 3 theme tokens
function getCategoryColor(category: string, theme: MD3Theme): string {
  const categories: Record<string, string> = {
    'General Checkup': theme.colors.primary,
    'Vaccination': theme.colors.tertiary,
    'Prenatal': theme.colors.secondary,
    'HIV Treatment': theme.colors.error,
    'TB Screening': theme.colors.primaryContainer,
    'Child Health': theme.colors.secondaryContainer,
  };

  return categories[category] || theme.colors.primary;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  headerCategory: {
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  timeText: {
    marginLeft: 8,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  patientInfo: {
    flex: 1,
  }
});
