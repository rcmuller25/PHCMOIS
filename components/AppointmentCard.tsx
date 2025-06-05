import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { Calendar as CalendarIcon, Clock, Timer } from 'lucide-react-native';
import { formatDate } from '../utils/dateUtils';
import { ExtendedMD3Theme, elevationLevels } from '../providers/ThemeProvider';

interface Appointment {
  id: string;
  patientName: string;
  category: string;
  timeSlot: string;
  date: string;
  notes?: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
}

interface AppointmentCardProps {
  appointment: Appointment;
  onPress?: () => void;
  elevation?: keyof typeof elevationLevels;
}

export function AppointmentCard({ 
  appointment, 
  onPress,
  elevation = 'level1'
}: AppointmentCardProps) {
  const theme = useTheme<ExtendedMD3Theme>();
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getElevation = () => {
    const level = elevationLevels[elevation];
    return {
      elevation: level.elevation,
      shadowColor: theme.colors.shadow,
      shadowOffset: level.shadowOffset,
      shadowOpacity: level.shadowOpacity,
      shadowRadius: level.shadowRadius,
    };
  };

  const getStateLayerOpacity = () => {
    if (isPressed) return 0.12;
    if (isHovered) return 0.08;
    return 0;
  };

  const getStatusColor = () => {
    switch (appointment.status) {
      case 'completed':
        return theme.colors.primary;
      case 'cancelled':
        return theme.colors.error;
      case 'no-show':
        return theme.colors.tertiary;
      default:
        return theme.colors.primary;
    }
  };

  const getCategoryColor = () => {
    switch (appointment.category.toLowerCase()) {
      case 'consultation':
        return theme.colors.primary;
      case 'follow-up':
        return theme.colors.secondary;
      case 'emergency':
        return theme.colors.error;
      case 'routine':
        return theme.colors.tertiary;
      default:
        return theme.colors.primary;
    }
  };

  const categoryColor = useMemo(() => getCategoryColor(), [appointment.category, theme.colors]);
  const statusColor = useMemo(() => getStatusColor(), [appointment.status, theme.colors]);
  
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      style={({ pressed }) => [
        styles.card,
        { borderLeftColor: categoryColor },
        getElevation(),
      ]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Appointment for ${appointment.patientName}, ${appointment.category}, ${formatDate(new Date(appointment.date))} at ${appointment.timeSlot}`}
      accessibilityHint="Opens appointment details"
    >
      <View style={[
        styles.stateLayer,
        {
          backgroundColor: theme.colors.surface,
          opacity: getStateLayerOpacity(),
        }
      ]} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
            {appointment.patientName}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={[styles.statusText, { color: theme.colors.surface }]}>
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <CalendarIcon size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}>
              {formatDate(new Date(appointment.date))}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Clock size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}>
              {appointment.timeSlot}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Timer size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}>
              {appointment.duration} minutes
            </Text>
          </View>

          {appointment.notes && (
            <Text 
              variant="bodySmall" 
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
              numberOfLines={2}
            >
              {appointment.notes}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderLeftWidth: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  stateLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});