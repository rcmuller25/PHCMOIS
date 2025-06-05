// Validation utilities for appointment data

export interface ValidationResult {
  isValid: boolean;
  errors: {
    date?: string;
    timeSlot?: string;
    category?: string;
    patientId?: string;
    notes?: string;
  };
}

/**
 * Validates appointment data
 * @param appointmentData The appointment data to validate
 * @returns ValidationResult object with validation status and errors
 */
export const validateAppointment = (appointmentData: {
  date?: string;
  timeSlot?: string;
  category?: string;
  patientId?: string;
  notes?: string;
}): ValidationResult => {
  const errors: ValidationResult['errors'] = {};
  let isValid = true;

  // Validate date
  if (!appointmentData.date) {
    errors.date = 'Date is required';
    isValid = false;
  } else if (!isValidDate(appointmentData.date)) {
    errors.date = 'Invalid date format';
    isValid = false;
  }

  // Validate time slot
  if (!appointmentData.timeSlot) {
    errors.timeSlot = 'Time slot is required';
    isValid = false;
  }

  // Validate category
  if (!appointmentData.category) {
    errors.category = 'Category is required';
    isValid = false;
  }

  // Validate patient
  if (!appointmentData.patientId) {
    errors.patientId = 'Patient is required';
    isValid = false;
  }

  // Notes are optional, so no validation needed

  return {
    isValid,
    errors
  };
};

/**
 * Helper function to validate date string format (YYYY-MM-DD)
 */
const isValidDate = (dateString: string): boolean => {
  const regEx = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateString.match(regEx)) return false; // Invalid format
  
  const date = new Date(dateString);
  const dateNum = date.getTime();
  
  if (!dateNum && dateNum !== 0) return false; // NaN value, invalid date
  
  return date.toISOString().slice(0, 10) === dateString;
};

/**
 * Validates time slot format (HH:MM)
 */
export const isValidTimeSlot = (timeSlot: string): boolean => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeSlot);
};
