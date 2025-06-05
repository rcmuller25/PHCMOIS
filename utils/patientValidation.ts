// Validation utilities for patient data

export interface ValidationResult {
  isValid: boolean;
  errors: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

/**
 * Validates patient data
 * @param patientData The patient data to validate
 * @returns ValidationResult object with validation status and errors
 */
export const validatePatient = (patientData: {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}): ValidationResult => {
  const errors: ValidationResult['errors'] = {};
  let isValid = true;

  // Validate first name
  if (!patientData.firstName?.trim()) {
    errors.firstName = 'First name is required';
    isValid = false;
  } else if (patientData.firstName.length < 2) {
    errors.firstName = 'First name must be at least 2 characters';
    isValid = false;
  }

  // Validate last name
  if (!patientData.lastName?.trim()) {
    errors.lastName = 'Last name is required';
    isValid = false;
  } else if (patientData.lastName.length < 2) {
    errors.lastName = 'Last name must be at least 2 characters';
    isValid = false;
  }

  // Validate date of birth
  if (!patientData.dateOfBirth) {
    errors.dateOfBirth = 'Date of birth is required';
    isValid = false;
  } else if (!isValidDate(patientData.dateOfBirth)) {
    errors.dateOfBirth = 'Invalid date format (YYYY-MM-DD)';
    isValid = false;
  } else if (isFutureDate(patientData.dateOfBirth)) {
    errors.dateOfBirth = 'Date of birth cannot be in the future';
    isValid = false;
  }

  // Validate gender
  if (!patientData.gender) {
    errors.gender = 'Gender is required';
    isValid = false;
  } else if (!['male', 'female', 'other'].includes(patientData.gender)) {
    errors.gender = 'Invalid gender selection';
    isValid = false;
  }

  // Validate phone number if provided
  if (patientData.phoneNumber && !isValidPhoneNumber(patientData.phoneNumber)) {
    errors.phoneNumber = 'Invalid phone number format';
    isValid = false;
  }

  // Address validation (required fields)
  if (patientData.address && !patientData.address.trim()) {
    errors.address = 'Address cannot be empty';
    isValid = false;
  }

  // City validation if address is provided
  if (patientData.address && !patientData.city?.trim()) {
    errors.city = 'City is required when address is provided';
    isValid = false;
  }

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
 * Check if a date is in the future
 */
const isFutureDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time part for accurate date comparison
  return date > today;
};

/**
 * Basic phone number validation
 * Supports formats like: 123-456-7890, (123) 456-7890, 123 456 7890, 123.456.7890, +91 (123) 456-7890
 */
const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,3}[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,4}$/;
  return phoneRegex.test(phone);
};
