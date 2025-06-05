import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import { CirclePlus as PlusCircle, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ExtendedMD3Theme, elevationLevels } from '../providers/ThemeProvider';

interface Appointment {
  id: string;
  patientName: string;
  category: string;
  timeSlot: string;
  date: string;
}

interface AppointmentSlotProps {
  appointments: Appointment[];
  maxPatients: number;
  category: string;
  timeSlot: string;
  date: string;
  elevation?: keyof typeof elevationLevels;
}

export function AppointmentSlot({ 
  appointments, 
  maxPatients, 
  category, 
  timeSlot, 
  date,
  elevation = 'level1'
}: AppointmentSlotProps) {
  const router = useRouter();
  const theme = useTheme<ExtendedMD3Theme>();
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const availableSlots = useMemo(() => 
    maxPatients - appointments.length,
    [maxPatients, appointments.length]
  );

  // Get state layer opacity based on current state
  const getStateLayerOpacity = () => {
    if (isPressed) return theme.stateLayer.pressed;
    if (isHovered) return theme.stateLayer.hover;
    return 0;
  };

  // Get elevation based on state
  const getElevation = () => {
    if (isPressed) return theme.elevation.level1;
    return theme.elevation[elevation];
  };
  
  // Function to render patient slots
  const renderPatientSlots = () => {
    const slots = [];
    
    // Add filled slots
    for (const appointment of appointments) {
      slots.push(
        <Pressable
          key={appointment.id}
          style={({ pressed }) => [
            styles.patientSlot,
            { backgroundColor: theme.colors.primaryContainer },
            pressed && { opacity: 0.8 }
          ]}
          onPress={() => router.push(`/appointments/${appointment.id}`)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`View appointment for ${appointment.patientName}`}
          accessibilityHint="Opens appointment details"
        >
          <View style={styles.slotContent}>
            <User size={14} color={theme.colors.primary} />
            <Text 
              variant="labelSmall" 
              style={{ color: theme.colors.onPrimaryContainer, marginLeft: 4, flex: 1 }} 
              numberOfLines={1} 
              ellipsizeMode="tail"
              accessible={true}
              accessibilityRole="text"
            >
              {appointment.patientName}
            </Text>
          </View>
        </Pressable>
      );
    }
    
    // Add empty slots
    for (let i = 0; i < availableSlots; i++) {
      slots.push(
        <Pressable
          key={`empty-${i}`}
          style={({ pressed }) => [
            styles.emptySlot,
            { backgroundColor: theme.colors.surfaceVariant },
            pressed && { opacity: 0.8 }
          ]}
          onPress={() => router.push(`/add-appointment?date=${date}&timeSlot=${timeSlot}&category=${category}`)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Add new appointment"
          accessibilityHint="Opens appointment booking form"
        >
          <View style={styles.slotContent}>
            <PlusCircle size={14} color={theme.colors.onSurfaceVariant} />
            <Text 
              variant="labelSmall" 
              style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4 }}
              accessible={true}
              accessibilityRole="text"
            >
              Available
            </Text>
          </View>
        </Pressable>
      );
    }
    
    return slots;
  };
  
  return (
    <Pressable
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      style={({ pressed }) => [
        styles.container,
        { 
          backgroundColor: appointments.length === 0 
            ? theme.colors.surfaceVariant 
            : theme.colors.surface 
        },
        getElevation(),
      ]}
      accessible={true}
      accessibilityRole="list"
      accessibilityLabel={`Appointment slot with ${appointments.length} appointments and ${availableSlots} available slots`}
    >
      <View style={[
        styles.stateLayer,
        {
          backgroundColor: theme.colors.surface,
          opacity: getStateLayerOpacity(),
        }
      ]} />
      {renderPatientSlots()}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  stateLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  patientSlot: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  emptySlot: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  slotContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});