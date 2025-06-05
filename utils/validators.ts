import { ValidationRules } from '../components/FormField';

/**
 * Common validation rules for form fields
 */

export const requiredField = (fieldName: string): ValidationRules => ({
  required: {
    value: true,
    message: `${fieldName} is required`,
  },
});

export const emailField = (fieldName: string = 'Email'): ValidationRules => ({
  ...requiredField(fieldName),
  pattern: {
    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    message: 'Please enter a valid email address',
  },
});

export const passwordField = (fieldName: string = 'Password'): ValidationRules => ({
  ...requiredField(fieldName),
  minLength: {
    value: 8,
    message: 'Password must be at least 8 characters long',
  },
  custom: [
    {
      test: (value) => /[A-Z]/.test(value),
      message: 'Must contain at least one uppercase letter',
    },
    {
      test: (value) => /[a-z]/.test(value),
      message: 'Must contain at least one lowercase letter',
    },
    {
      test: (value) => /[0-9]/.test(value),
      message: 'Must contain at least one number',
    },
    {
      test: (value) => /[^A-Za-z0-9]/.test(value),
      message: 'Must contain at least one special character',
    },
  ],
});

export const phoneNumberField = (fieldName: string = 'Phone number'): ValidationRules => ({
  ...requiredField(fieldName),
  pattern: {
    value: /^[\+\s\d\-()]{10,20}$/,
    message: 'Please enter a valid phone number',
  },
});

export const dateOfBirthField = (fieldName: string = 'Date of birth'): ValidationRules => ({
  ...requiredField(fieldName),
  custom: [
    {
      test: (value) => {
        const date = new Date(value);
        const today = new Date();
        const minAgeDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
        const maxAgeDate = new Date(today.getFullYear() - 12, today.getMonth(), today.getDate());
        return date >= minAgeDate && date <= maxAgeDate;
      },
      message: 'Please enter a valid date of birth (ages 12-120)',
    },
  ],
});

/**
 * Validates that two fields match (e.g., password confirmation)
 */
export const matchField = (
  fieldName: string,
  getOtherValue: () => string,
  otherFieldName: string = 'field'
): ValidationRules => ({
  custom: [
    {
      test: (value) => value === getOtherValue(),
      message: `${fieldName} must match ${otherFieldName}`,
    },
  ],
});

/**
 * Validates a field based on a custom condition
 */
export const customValidation = (
  test: (value: string) => boolean,
  message: string
): ValidationRules => ({
  custom: [
    {
      test,
      message,
    },
  ],
});

/**
 * Composes multiple validation rules into a single rule set
 */
export const composeValidations = (...rules: ValidationRules[]): ValidationRules => {
  return rules.reduce((acc, rule) => ({
    ...acc,
    ...rule,
    custom: [...(acc.custom || []), ...(rule.custom || [])],
  }));
};
