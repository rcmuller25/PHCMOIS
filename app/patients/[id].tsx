import React, { useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { usePatientsStore } from '../../stores/patientsStore';
import { useAppointmentsStore } from '../../stores/appointmentsStore';
import { Calendar, CreditCard as Edit, Trash } from 'lucide-react-native';
import { BackButton } from '../../components/BackButton';
import { formatDate, calculateAge } from '../../utils/dateUtils';
import { Text, TouchableRipple, useTheme, Surface, Avatar, Button, Card, Divider, IconButton, MD3Theme } from 'react-native-paper';

export default function PatientDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme<MD3Theme>();
  const patient = usePatientsStore((state) => state.patients.find(p => p.id === id));
  const { removePatient } = usePatientsStore();
  
  const appointments = useAppointmentsStore(
    (state) => state.appointments.filter(a => a.patientId === id)
  );
  
  // Handle patient deletion
  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Patient',
      'Are you sure you want to delete this patient? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removePatient(id as string);
            // Navigate back to the patients list
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          },
        },
      ]
    );
  }, [id, removePatient, router]);

  const handleEdit = useCallback(() => {
    // Use string interpolation for the route to avoid type issues
    router.push(`/patients/${id}/edit`);
  }, [id, router]);
  
  // If patient not found
  if (!patient) {
    return (
      <Surface style={[styles.notFoundContainer, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen options={{ headerShown: true, title: 'Patient Not Found' }} />
        <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, marginBottom: 24 }}>Patient not found</Text>
        <Button 
          mode="contained" 
          onPress={() => router.back()}
        >
          Go Back
        </Button>
      </Surface>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen 
        options={{ 
          title: 'Patient Details',
          headerLeft: () => <BackButton />,
          headerShadowVisible: false,
          headerRight: () => (
            <Button 
              mode="text" 
              onPress={() => router.push(`/patients/${id}/edit`)}
              style={{ marginRight: 8 }}
            >
              Edit
            </Button>
          ),
        }} 
      />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Surface style={[styles.header, { elevation: 1, backgroundColor: theme.colors.surface }]}>
          <Avatar.Text 
            size={48} 
            label={`${patient.firstName.charAt(0)}${patient.surname.charAt(0)}`}
            color={theme.colors.onPrimary}
            style={{ marginRight: 12 }}
          />
          <View style={styles.patientHeaderInfo}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 4 }}>
              {patient.firstName} {patient.surname}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {patient.gender} • {calculateAge(patient.dateOfBirth)} years old
            </Text>
          </View>
          <View style={styles.actionsContainer}>
            <TouchableRipple 
              style={[styles.actionButton, { backgroundColor: theme.colors.surfaceVariant }]}
              onPress={handleEdit}
              rippleColor={theme.colors.primary}
            >
              <Edit color={theme.colors.primary} size={20} />
            </TouchableRipple>
            <TouchableRipple 
              style={[styles.actionButton, { backgroundColor: theme.colors.errorContainer }]}
              onPress={handleDelete}
              rippleColor={theme.colors.error}
            >
              <Trash color={theme.colors.error} size={20} />
            </TouchableRipple>
          </View>
        </Surface>
        
        <View style={styles.infoSection}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>Personal Information</Text>
          <Surface style={[styles.infoCard, { backgroundColor: theme.colors.surface, elevation: 1 }]}>
            <View style={[styles.infoRow, { borderBottomColor: theme.colors.outlineVariant }]}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Full Name:</Text>
              <Text variant="bodyMedium" style={{ flex: 1, color: theme.colors.onSurface }}>{patient.firstName} {patient.surname}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: theme.colors.outlineVariant }]}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Date of Birth:</Text>
              <Text variant="bodyMedium" style={{ flex: 1, color: theme.colors.onSurface }}>{formatDate(new Date(patient.dateOfBirth))}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: theme.colors.outlineVariant }]}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Age:</Text>
              <Text variant="bodyMedium" style={{ flex: 1, color: theme.colors.onSurface }}>{calculateAge(patient.dateOfBirth)} years</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: theme.colors.outlineVariant }]}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Gender:</Text>
              <Text variant="bodyMedium" style={{ flex: 1, color: theme.colors.onSurface }}>{patient.gender}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: theme.colors.outlineVariant }]}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>ID Type:</Text>
              <Text variant="bodyMedium" style={{ flex: 1, color: theme.colors.onSurface }}>{patient.idType}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: theme.colors.outlineVariant }]}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>ID Number:</Text>
              <Text variant="bodyMedium" style={{ flex: 1, color: theme.colors.onSurface }}>{patient.idNumber}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: theme.colors.outlineVariant }]}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Primary Contact:</Text>
              <Text variant="bodyMedium" style={{ flex: 1, color: theme.colors.onSurface }}>{patient.primaryContact}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: 'transparent' }]}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Address:</Text>
              <Text variant="bodyMedium" style={{ flex: 1, color: theme.colors.onSurface }}>{patient.address}</Text>
            </View>
          </Surface>
        </View>
        
        <View style={styles.infoSection}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>Appointments</Text>
          {appointments.length > 0 ? (
            <Surface style={[styles.infoCard, { backgroundColor: theme.colors.surface, elevation: 1 }]}>
              {appointments.map(appointment => (
                <TouchableRipple 
                  key={appointment.id}
                  onPress={() => router.push(`/appointments/${appointment.id}`)}
                  style={[styles.appointmentItem, { borderBottomColor: theme.colors.outlineVariant }]}
                  rippleColor={theme.colors.primary}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Calendar color={theme.colors.primary} size={20} style={{ marginRight: 12 }} />
                    <View style={styles.appointmentInfo}>
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginBottom: 4 }}>
                        {formatDate(new Date(appointment.date))} - {appointment.timeSlot}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {appointment.category}
                      </Text>
                    </View>
                  </View>
                </TouchableRipple>
              ))}
            </Surface>
          ) : (
            <Surface style={[styles.emptyAppointments, { backgroundColor: theme.colors.surface, elevation: 1 }]}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
                No appointments scheduled
              </Text>
              <Button 
                mode="contained"
                onPress={() => router.push(`/add-appointment?patientId=${id}`)}
                style={{ alignSelf: 'center' }}
              >
                Schedule Appointment
              </Button>
            </Surface>
          )}
        </View>
        
        <Button 
          mode="contained"
          onPress={() => router.push(`/add-appointment?patientId=${id}`)}
          style={{ marginTop: 16, marginBottom: 24 }}
        >
          Schedule New Appointment
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  patientHeaderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 36,
    height: 36,
  },
  infoSection: {
    marginBottom: 24,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  appointmentInfo: {
    flex: 1,
  },
  emptyAppointments: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
});