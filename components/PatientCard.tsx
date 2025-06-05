import React, { useMemo, useState } from 'react';
import { View, StyleSheet, AccessibilityInfo, Platform, Pressable } from 'react-native';
import { Card, Text, Avatar, useTheme } from 'react-native-paper';
import { calculateAge } from '../utils/dateUtils';
import { ExtendedMD3Theme, elevationLevels } from '../providers/ThemeProvider';

interface Patient {
  id: string;
  firstName: string;
  surname: string;
  gender: string;
  dateOfBirth: string;
  idType: string;
  idNumber: string;
  address: string;
  primaryContact: string;
  secondaryContact?: string;
}

interface PatientCardProps {
  patient: Patient;
  onPress: () => void;
  elevation?: keyof typeof elevationLevels;
}

export function PatientCard({ patient, onPress, elevation = 'level1' }: PatientCardProps) {
  const theme = useTheme<ExtendedMD3Theme>();
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Memoize values to prevent recalculation on every render
  const initials = useMemo(() => {
    return `${patient.firstName.charAt(0)}${patient.surname.charAt(0)}`;
  }, [patient.firstName, patient.surname]);
  
  const patientAge = useMemo(() => {
    return calculateAge(patient.dateOfBirth);
  }, [patient.dateOfBirth]);
  
  // Prepare accessibility label for screen readers
  const accessibilityLabel = useMemo(() => {
    return `Patient ${patient.firstName} ${patient.surname}, ${patient.gender}, ${patientAge} years old, ${patient.idType} ${patient.idNumber}`;
  }, [patient.firstName, patient.surname, patient.gender, patientAge, patient.idType, patient.idNumber]);
  
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
  
  // Memoize styles based on theme to prevent recreation on every render
  const avatarStyle = useMemo(() => ({
    backgroundColor: theme.colors.primary
  }), [theme.colors.primary]);
  
  const avatarLabelStyle = useMemo(() => ({
    color: theme.colors.onPrimary
  }), [theme.colors.onPrimary]);
  
  const nameTextStyle = useMemo(() => ({
    color: theme.colors.onSurface
  }), [theme.colors.onSurface]);
  
  const detailsTextStyle = useMemo(() => ({
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2
  }), [theme.colors.onSurfaceVariant]);
  
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      style={({ pressed }) => [
        styles.card,
        getElevation(),
      ]}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityHint="Opens detailed patient information"
      accessibilityState={{ selected: false }}
    >
      <View style={[
        styles.stateLayer,
        {
          backgroundColor: theme.colors.surface,
          opacity: getStateLayerOpacity(),
        }
      ]} />
      <Card.Content style={styles.cardContent}>
        <Avatar.Text 
          size={48} 
          label={initials} 
          style={avatarStyle}
          labelStyle={avatarLabelStyle}
          accessible={true}
          accessibilityLabel={`${patient.firstName} ${patient.surname} initials`}
          accessibilityRole="image"
        />
        <View style={styles.infoContainer}>
          <Text 
            variant="titleMedium" 
            style={nameTextStyle}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel={`${patient.firstName} ${patient.surname}`}
          >
            {patient.firstName} {patient.surname}
          </Text>
          <Text 
            variant="bodyMedium" 
            style={detailsTextStyle}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel={`${patient.gender}, ${patientAge} years old`}
          >
            {patient.gender} • {patientAge} years
          </Text>
          <Text 
            variant="bodyMedium" 
            style={{ color: theme.colors.onSurfaceVariant }}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel={`${patient.idType} ${patient.idNumber}`}
          >
            {patient.idType}: {patient.idNumber}
          </Text>
        </View>
      </Card.Content>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  stateLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
});